import * as http from "http";
import * as https from "https";
import * as fs from "fs";
import * as path from "path";
import * as cp from "child_process";
import { Environment } from "../runtime/environment";
import { Instance } from "../runtime/instance";
import { MK_BOOL, MK_NULL, MK_NUMBER, MK_STRING, RuntimeVal } from "../runtime/values";
import { DeviceIdentityManager } from "./device";
import { SessionManager } from "./session";
import { getProjectEncryptionKey } from "./crypto";
import { callLLPFunction } from "../runtime/interpreter";

// ===================================================
// LLP Network Client & Server Subsystem
// Enables full client-server separation in pure LLP.
// Features remote IP/domain connection, device hardware anti-tamper security,
// encrypted session sync, and standalone server routing.
// ===================================================

interface ConnectedClientInfo {
  deviceId: string;
  ip: string;
  lastSeen: number;
  userAgent?: string;
  sessionId?: string;
}

// Helper to convert JS values to RuntimeVal
export function jsToRuntimeVal(val: any): RuntimeVal {
  if (val === null || val === undefined) return MK_NULL();
  if (typeof val === "number") return MK_NUMBER(val);
  if (typeof val === "string") return MK_STRING(val);
  if (typeof val === "boolean") return MK_BOOL(val);
  if (Array.isArray(val)) {
    const listVal: any = {
      type: "list",
      elementType: "General",
      elements: val.map(jsToRuntimeVal)
    };
    listVal.Add = (item: RuntimeVal) => { listVal.elements.push(item); };
    listVal.Remove = (idx: number) => { if (idx >= 0 && idx < listVal.elements.length) listVal.elements.splice(idx, 1); };
    listVal.Length = () => listVal.elements.length;
    return listVal;
  }
  if (typeof val === "object") {
    const inst = new Instance("Object");
    for (const [k, v] of Object.entries(val)) {
      inst.SetProperty(k, jsToRuntimeVal(v));
    }
    return { type: "instance", instance: inst };
  }
  return MK_STRING(String(val));
}

// Helper to convert RuntimeVal to JS values
export function runtimeValToJs(val: RuntimeVal): any {
  if (!val) return null;
  if (val.type === "null") return null;
  if (val.type === "number" || val.type === "string" || val.type === "boolean") return val.value;
  if (val.type === "list" || val.type === "fixed_array") {
    return (val.elements || []).map(e => e ? runtimeValToJs(e) : null);
  }
  if (val.type === "instance" && val.instance) {
    const obj: any = {};
    for (const [k, v] of val.instance.properties.entries()) {
      if (v && v.type !== "native_fn" && v.type !== "fn") {
        obj[k] = runtimeValToJs(v);
      }
    }
    return obj;
  }
  return val.value ?? null;
}

export function registerNetwork(env: Environment) {
  const deviceMgr = DeviceIdentityManager.getInstance();
  const sessionMgr = SessionManager.getInstance();

  // Global RPC, Push event, and Asymmetric Device Security stores
  const rpcHandlers: Map<string, RuntimeVal> = new Map();
  const devicePushQueues: Map<string, any[]> = new Map();
  const clientEventListeners: Map<string, RuntimeVal[]> = new Map();

  interface DeviceRecord {
    deviceId: string;
    publicKey: string;
    status: "active" | "revoked";
    enrolledAt: number;
    lastSeen: number;
    fingerprintHash?: string;
    metadata?: any;
  }

  const registeredDevices: Map<string, DeviceRecord> = new Map();
  const consumedNonces: Map<string, number> = new Map();

  // Auto-clean consumed nonces older than 35s every 15s
  setInterval(() => {
    const now = Date.now();
    for (const [nonce, ts] of consumedNonces.entries()) {
      if (now - ts > 35000) {
        consumedNonces.delete(nonce);
      }
    }
  }, 15000).unref();

  // Pre-enroll local machine's device identity and Ed25519 public key
  if (deviceMgr.isKeySealed()) {
    registeredDevices.set(deviceMgr.getDeviceId(), {
      deviceId: deviceMgr.getDeviceId(),
      publicKey: deviceMgr.getPublicKeyPem(),
      status: "active",
      enrolledAt: Date.now(),
      lastSeen: Date.now()
    });
  }

  const queueEventForDevice = (devId: string, eventData: any) => {
    if (!devicePushQueues.has(devId)) {
      devicePushQueues.set(devId, []);
    }
    devicePushQueues.get(devId)!.push(eventData);
  };

  const broadcastEvent = (eventData: any) => {
    for (const devId of connectedClients.keys()) {
      queueEventForDevice(devId, eventData);
    }
    // Also deliver to local in-process queue if present
    const localId = deviceMgr.getDeviceId();
    queueEventForDevice(localId, eventData);
  };

  // --------------------------------------------------------------------------
  // 1. CLIENT HTTP / REMOTE SERVICE (Client)
  // --------------------------------------------------------------------------
  const clientObj = new Instance("HttpClientService");
  clientObj.Name = "Client";

  let serverBaseUrl: string = "";
  let remoteSessionId: string = "";

  // Helper to locate http_sync_worker.js
  const getSyncWorkerPath = (): string => {
    const candidates = [
      path.resolve(__dirname, "http_sync_worker.js"),
      path.resolve(__dirname, "../stdlib/http_sync_worker.js"),
      path.resolve(process.cwd(), "src/stdlib/http_sync_worker.js"),
      path.resolve(process.cwd(), "dist/stdlib/http_sync_worker.js")
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }
    return candidates[0];
  };

  const executeSyncRequest = (method: string, targetUrl: string, body?: string, customHeaders?: any): any => {
    const workerScript = getSyncWorkerPath();
    const activeSession = remoteSessionId || sessionMgr.getId() || "";
    const deviceId = deviceMgr.getDeviceId();
    const deviceToken = deviceMgr.generateDeviceToken();

    const headers: { [key: string]: string } = {
      "Content-Type": "application/json",
      "X-Device-Id": deviceId,
      "X-Device-Token": deviceToken,
      "X-Session-Id": activeSession,
      ...(customHeaders || {})
    };

    // Auto-sign with machine-sealed Ed25519 private key if not already explicitly signed
    if (!headers["X-Signature"] && deviceMgr.isKeySealed()) {
      try {
        const sigData = deviceMgr.signPayload(method, targetUrl, body || "");
        headers["X-Nonce"] = sigData.nonce;
        headers["X-Timestamp"] = sigData.timestamp;
        headers["X-Signature"] = sigData.signature;
        headers["X-Device-PubKey"] = Buffer.from(sigData.publicKeyPem, "utf8").toString("base64");
      } catch (_) {}
    }

    const payload = JSON.stringify({
      method: method.toUpperCase(),
      url: targetUrl,
      body: body || "",
      headers,
      timeout: 10000
    });

    try {
      const result = cp.execFileSync(process.execPath, [workerScript, payload], {
        encoding: "utf8",
        timeout: 12000,
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"]
      });
      return JSON.parse(result.trim());
    } catch (err: any) {
      return {
        status: 500,
        ok: false,
        error: err.message || "Network execution error",
        body: ""
      };
    }
  };

  // Client.Connect(domainOrIp: string, port: number) -> Boolean
  clientObj.SetProperty("Connect", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      let host = args[0]?.type === "string" ? args[0].value.trim() : "localhost";
      const port = args[1]?.type === "number" ? args[1].value : (host.startsWith("https") ? 443 : 80);

      if (!host.startsWith("http://") && !host.startsWith("https://")) {
        const protocol = port === 443 ? "https://" : "http://";
        host = `${protocol}${host}`;
      }

      // Append port if not already in URL
      if (!host.match(/:\d+$/)) {
        serverBaseUrl = `${host}:${port}`;
      } else {
        serverBaseUrl = host;
      }

      console.log(`[LLP Client] Configuration du serveur distant : ${serverBaseUrl}`);
      return MK_BOOL(true);
    }
  });

  // Client.SetServer(url: string) -> Boolean
  clientObj.SetProperty("SetServer", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      let target = args[0]?.type === "string" ? args[0].value.trim() : "";
      if (target) {
        if (!target.startsWith("http://") && !target.startsWith("https://")) {
          target = "http://" + target;
        }
        serverBaseUrl = target.replace(/\/+$/, "");
      }
      return MK_BOOL(true);
    }
  });

  // Client.GetServerUrl() -> String
  clientObj.SetProperty("GetServerUrl", {
    type: "native_fn",
    call: () => MK_STRING(serverBaseUrl)
  });

  // Client.IsConnected() -> Boolean
  clientObj.SetProperty("IsConnected", {
    type: "native_fn",
    call: () => {
      if (!serverBaseUrl) return MK_BOOL(false);
      const res = executeSyncRequest("GET", `${serverBaseUrl}/api/ping`);
      return MK_BOOL(res.ok || res.status === 200 || res.status === 404);
    }
  });

  // Client.Disconnect() -> Boolean
  clientObj.SetProperty("Disconnect", {
    type: "native_fn",
    call: () => {
      serverBaseUrl = "";
      remoteSessionId = "";
      return MK_BOOL(true);
    }
  });

  // Client.Request(method: string, path: string, bodyJson?: string) -> String (JSON response)
  clientObj.SetProperty("Request", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const method = args[0]?.type === "string" ? args[0].value : "GET";
      let reqPath = args[1]?.type === "string" ? args[1].value : "/";
      const body = args[2]?.type === "string" ? args[2].value : "";

      let targetUrl = reqPath;
      if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
        if (!serverBaseUrl) {
          throw new Error("[LLP Client Error] Aucun serveur configuré. Utilisez Client.Connect(host, port) ou une URL absolue.");
        }
        if (!reqPath.startsWith("/")) reqPath = "/" + reqPath;
        targetUrl = `${serverBaseUrl}${reqPath}`;
      }

      const res = executeSyncRequest(method, targetUrl, body);
      return MK_STRING(JSON.stringify(res));
    }
  });

  // Client.Get(pathOrUrl: string) -> String (JSON response)
  clientObj.SetProperty("Get", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      let target = args[0]?.type === "string" ? args[0].value : "/";
      if (!target.startsWith("http://") && !target.startsWith("https://")) {
        if (!serverBaseUrl) {
          throw new Error("[LLP Client Error] Aucun serveur distant défini. Utilisez Client.Connect(ip, port).");
        }
        if (!target.startsWith("/")) target = "/" + target;
        target = `${serverBaseUrl}${target}`;
      }
      const res = executeSyncRequest("GET", target);
      return MK_STRING(JSON.stringify(res));
    }
  });

  // Client.Post(pathOrUrl: string, body: string) -> String (JSON response)
  clientObj.SetProperty("Post", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      let target = args[0]?.type === "string" ? args[0].value : "/";
      const body = args[1]?.type === "string" ? args[1].value : "";
      if (!target.startsWith("http://") && !target.startsWith("https://")) {
        if (!serverBaseUrl) {
          throw new Error("[LLP Client Error] Aucun serveur distant défini. Utilisez Client.Connect(ip, port).");
        }
        if (!target.startsWith("/")) target = "/" + target;
        target = `${serverBaseUrl}${target}`;
      }
      const res = executeSyncRequest("POST", target, body);
      return MK_STRING(JSON.stringify(res));
    }
  });

  // Client.Login(username: string, password: string) -> String (JSON response)
  clientObj.SetProperty("Login", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const username = args[0]?.type === "string" ? args[0].value : "";
      const password = args[1]?.type === "string" ? args[1].value : "";
      if (!serverBaseUrl) {
        throw new Error("[LLP Client Error] Impossible de se connecter : aucun serveur distant configuré.");
      }

      const payload = JSON.stringify({
        username,
        password,
        deviceId: deviceMgr.getDeviceId(),
        deviceToken: deviceMgr.generateDeviceToken()
      });

      const res = executeSyncRequest("POST", `${serverBaseUrl}/api/login`, payload);
      if (res.ok && res.body) {
        try {
          const parsed = JSON.parse(res.body);
          if (parsed.sessionId) {
            remoteSessionId = parsed.sessionId;
            sessionMgr.start(parsed.sessionId);
          }
        } catch (_) {}
      }
      return MK_STRING(JSON.stringify(res));
    }
  });

  // Client.RPC(methodPath: string, ...args) -> RuntimeVal
  clientObj.SetProperty("RPC", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const fullMethod = args[0]?.type === "string" ? args[0].value : "";
      const parts = fullMethod.split(".");
      const service = parts.length > 1 ? parts[0] : "Default";
      const method = parts.length > 1 ? parts.slice(1).join(".") : parts[0];
      const callArgs = args.slice(1).map(runtimeValToJs);

      const targetUrl = serverBaseUrl ? `${serverBaseUrl}/api/rpc` : "http://127.0.0.1:8080/api/rpc";
      const res = executeSyncRequest("POST", targetUrl, JSON.stringify({ service, method, args: callArgs }));

      if (res.ok && res.body) {
        try {
          const parsed = JSON.parse(res.body);
          if (parsed.ok) {
            return jsToRuntimeVal(parsed.result);
          } else {
            console.error(`[LLP RPC Error] Échec de l'appel '${fullMethod}' : ${parsed.error}`);
            return MK_NULL();
          }
        } catch (err: any) {
          console.error(`[LLP RPC Error] Réponse invalide pour '${fullMethod}' : ${err.message}`);
          return MK_NULL();
        }
      }
      console.error(`[LLP RPC Error] Serveur RPC injoignable : ${res.error || res.status}`);
      return MK_NULL();
    }
  });

  env.declareVar("Client", { type: "instance", instance: clientObj }, "General");

  // --------------------------------------------------------------------------
  // 2. SERVEUR HTTP DISTANT & ROUTEUR BACKEND (Server)
  // --------------------------------------------------------------------------
  const serverObj = new Instance("HttpServerService");
  serverObj.Name = "Server";

  let httpServer: http.Server | null = null;
  let activePort: number = 0;
  let requireDeviceSecurity: boolean = true;
  let authSecret: string = getProjectEncryptionKey();
  const routes: Map<string, { method: string; path: string; handler: RuntimeVal }> = new Map();
  const connectedClients: Map<string, ConnectedClientInfo> = new Map();
  const bannedDevices: Set<string> = new Set();

  // Server.RegisterRPC(serviceName: string, methodName: string, handlerFn: Function) -> Boolean
  serverObj.SetProperty("RegisterRPC", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      let service = "Default";
      let method = "";
      let handler: RuntimeVal = MK_NULL();

      if (args.length >= 3) {
        service = args[0]?.type === "string" ? args[0].value : "Default";
        method = args[1]?.type === "string" ? args[1].value : "";
        handler = args[2];
      } else if (args.length === 2) {
        const full = args[0]?.type === "string" ? args[0].value : "";
        const parts = full.split(".");
        service = parts.length > 1 ? parts[0] : "Default";
        method = parts.length > 1 ? parts.slice(1).join(".") : parts[0];
        handler = args[1];
      }

      if (!method) {
        throw new Error("[LLP Server RPC] Nom de méthode RPC invalide.");
      }

      const rpcKey = `${service}.${method}`;
      rpcHandlers.set(rpcKey, handler);
      console.log(`[LLP Server RPC] ✓ Méthode RPC enregistrée : @server ${rpcKey}()`);
      return MK_BOOL(true);
    }
  });

  // Server.PushTo(deviceId: string, eventName: string, payload: any) -> Boolean
  serverObj.SetProperty("PushTo", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const devId = args[0]?.type === "string" ? args[0].value : "";
      const evName = args[1]?.type === "string" ? args[1].value : "notification";
      const payloadData = runtimeValToJs(args[2]);

      if (devId) {
        queueEventForDevice(devId, { event: evName, data: payloadData, payload: payloadData, timestamp: Date.now() });
        return MK_BOOL(true);
      }
      return MK_BOOL(false);
    }
  });

  // Server.Broadcast(eventName: string, payload: any) -> Boolean
  serverObj.SetProperty("Broadcast", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const evName = args[0]?.type === "string" ? args[0].value : "broadcast";
      const payloadData = runtimeValToJs(args[1]);
      broadcastEvent({ event: evName, data: payloadData, payload: payloadData, timestamp: Date.now() });
      return MK_BOOL(true);
    }
  });

  const createRequestInstance = (req: http.IncomingMessage, bodyData: string): Instance => {
    const reqInst = new Instance("HttpRequest");
    reqInst.Name = "Request";
    const method = req.method || "GET";
    const url = req.url || "/";
    const deviceId = (req.headers["x-device-id"] as string) || "";
    const deviceToken = (req.headers["x-device-token"] as string) || "";
    const sessionId = (req.headers["x-session-id"] as string) || "";
    const clientIp = req.socket.remoteAddress || "";

    reqInst.SetProperty("Method", MK_STRING(method));
    reqInst.SetProperty("Path", MK_STRING(url));
    reqInst.SetProperty("Body", MK_STRING(bodyData));
    reqInst.SetProperty("DeviceId", MK_STRING(deviceId));
    reqInst.SetProperty("DeviceToken", MK_STRING(deviceToken));
    reqInst.SetProperty("SessionId", MK_STRING(sessionId));
    reqInst.SetProperty("ClientIp", MK_STRING(clientIp));
    reqInst.SetProperty("Headers", MK_STRING(JSON.stringify(req.headers)));

    return reqInst;
  };

  // Server.RequireDevice(enable: boolean) -> Boolean
  serverObj.SetProperty("RequireDevice", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      requireDeviceSecurity = args[0]?.type === "boolean" ? args[0].value : true;
      console.log(`[LLP Server Security] Authentification matérielle des appareils : ${requireDeviceSecurity ? "ACTIVÉE (Strict)" : "DÉSACTIVÉE"}`);
      return MK_BOOL(requireDeviceSecurity);
    }
  });

  // Server.SetAuthSecret(secret: string) -> Boolean
  serverObj.SetProperty("SetAuthSecret", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const s = args[0]?.type === "string" ? args[0].value : "";
      if (s) authSecret = s;
      return MK_BOOL(true);
    }
  });

  // Server.Route(method: string, path: string, handlerFn: Function) -> Boolean
  serverObj.SetProperty("Route", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const method = args[0]?.type === "string" ? args[0].value.toUpperCase() : "GET";
      const routePath = args[1]?.type === "string" ? args[1].value : "/";
      const handler = args[2];

      const key = `${method}:${routePath}`;
      routes.set(key, { method, path: routePath, handler });
      return MK_BOOL(true);
    }
  });

  // Server.Get(path: string, handlerFn: Function) -> Boolean
  serverObj.SetProperty("Get", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const routePath = args[0]?.type === "string" ? args[0].value : "/";
      const handler = args[1];
      routes.set(`GET:${routePath}`, { method: "GET", path: routePath, handler });
      return MK_BOOL(true);
    }
  });

  // Server.Post(path: string, handlerFn: Function) -> Boolean
  serverObj.SetProperty("Post", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const routePath = args[0]?.type === "string" ? args[0].value : "/";
      const handler = args[1];
      routes.set(`POST:${routePath}`, { method: "POST", path: routePath, handler });
      return MK_BOOL(true);
    }
  });

  // Server.GetConnectedClients() -> String (JSON array)
  serverObj.SetProperty("GetConnectedClients", {
    type: "native_fn",
    call: () => {
      const list = Array.from(connectedClients.values());
      return MK_STRING(JSON.stringify(list));
    }
  });

  // Server.KickClient(deviceId: string) -> Boolean
  serverObj.SetProperty("KickClient", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const devId = args[0]?.type === "string" ? args[0].value : "";
      const removed = connectedClients.delete(devId);
      return MK_BOOL(removed);
    }
  });

  // Server.BanDevice(deviceId: string) -> Boolean
  serverObj.SetProperty("BanDevice", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const devId = args[0]?.type === "string" ? args[0].value : "";
      if (devId) {
        bannedDevices.add(devId);
        connectedClients.delete(devId);
        return MK_BOOL(true);
      }
      return MK_BOOL(false);
    }
  });

  // Server.RevokeDevice(deviceId: string) -> Boolean (Emergency Revocation)
  serverObj.SetProperty("RevokeDevice", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const devId = args[0]?.type === "string" ? args[0].value : "";
      if (devId) {
        bannedDevices.add(devId);
        const existing = registeredDevices.get(devId);
        if (existing) {
          existing.status = "revoked";
        } else {
          registeredDevices.set(devId, {
            deviceId: devId,
            publicKey: "",
            status: "revoked",
            enrolledAt: Date.now(),
            lastSeen: Date.now()
          });
        }
        connectedClients.delete(devId);
        console.warn(`[LLP Device Security] 🛑 Appareil révoqué d'urgence : ${devId}`);
        return MK_BOOL(true);
      }
      return MK_BOOL(false);
    }
  });

  // Server.UnrevokeDevice(deviceId: string) -> Boolean
  serverObj.SetProperty("UnrevokeDevice", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const devId = args[0]?.type === "string" ? args[0].value : "";
      if (devId) {
        bannedDevices.delete(devId);
        const existing = registeredDevices.get(devId);
        if (existing) {
          existing.status = "active";
        }
        console.log(`[LLP Device Security] ✓ Révocation levée pour l'appareil : ${devId}`);
        return MK_BOOL(true);
      }
      return MK_BOOL(false);
    }
  });

  // Server.GetRegisteredDevices() -> String (JSON array)
  serverObj.SetProperty("GetRegisteredDevices", {
    type: "native_fn",
    call: () => {
      const list = Array.from(registeredDevices.values()).map(d => ({
        deviceId: d.deviceId,
        status: d.status,
        enrolledAt: d.enrolledAt,
        lastSeen: d.lastSeen,
        metadata: d.metadata
      }));
      return MK_STRING(JSON.stringify(list));
    }
  });

  // Server.IsDeviceRevoked(deviceId: string) -> Boolean
  serverObj.SetProperty("IsDeviceRevoked", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const devId = args[0]?.type === "string" ? args[0].value : "";
      if (bannedDevices.has(devId)) return MK_BOOL(true);
      const existing = registeredDevices.get(devId);
      return MK_BOOL(existing ? existing.status === "revoked" : false);
    }
  });

  // Server.Listen(port: number, host?: string) -> Boolean
  serverObj.SetProperty("Listen", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const port = args[0]?.type === "number" ? args[0].value : 8080;
      const host = args[1]?.type === "string" ? args[1].value : "0.0.0.0";

      if (httpServer) {
        try {
          httpServer.close();
        } catch (_) {}
      }

      httpServer = http.createServer((req, res) => {
        // Set standard CORS headers
        res.setHeader("Access-Control-Allow-Origin", "*");
        res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Device-Id, X-Device-Token, X-Session-Id, X-Nonce, X-Timestamp, X-Signature, X-Device-PubKey");

        if (req.method === "OPTIONS") {
          res.writeHead(204);
          res.end();
          return;
        }

        let bodyData = "";
        req.on("data", chunk => {
          bodyData += chunk;
        });

        req.on("end", () => {
          const reqUrl = (req.url || "/").split("?")[0];
          const method = (req.method || "GET").toUpperCase();
          const deviceId = (req.headers["x-device-id"] as string) || "";
          const deviceToken = (req.headers["x-device-token"] as string) || "";
          const sessionId = (req.headers["x-session-id"] as string) || "";
          const nonce = (req.headers["x-nonce"] as string) || "";
          const timestamp = (req.headers["x-timestamp"] as string) || "";
          const signature = (req.headers["x-signature"] as string) || "";
          let devicePubKey = (req.headers["x-device-pubkey"] as string) || "";
          if (devicePubKey && !devicePubKey.includes("-----BEGIN")) {
            try {
              const decoded = Buffer.from(devicePubKey, "base64").toString("utf8");
              if (decoded.includes("-----BEGIN")) {
                devicePubKey = decoded;
              }
            } catch (_) {}
          }

          // Built-in health/ping route
          if (reqUrl === "/api/ping") {
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: 200, statusText: "OK", server: "LLP Server Engine 1.4", time: Date.now() }));
            return;
          }

          // ------------------------------------------------------------------
          // BUILT-IN DEVICE ENROLLMENT ROUTE (/api/device/enroll)
          // ------------------------------------------------------------------
          if (reqUrl === "/api/device/enroll" && method === "POST") {
            try {
              const enrollData = bodyData ? JSON.parse(bodyData) : {};
              const targetDevId = enrollData.deviceId || deviceId;
              let pubKey = enrollData.publicKey || devicePubKey;
              if (pubKey && !pubKey.includes("-----BEGIN")) {
                try {
                  const decoded = Buffer.from(pubKey, "base64").toString("utf8");
                  if (decoded.includes("-----BEGIN")) {
                    pubKey = decoded;
                  }
                } catch (_) {}
              }
              const fingerprintHash = enrollData.fingerprintHash || "";
              const metadata = enrollData.metadata || {};

              if (!targetDevId || !pubKey) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                  ok: false,
                  status: 400,
                  error: "deviceId et publicKey sont obligatoires pour l'enrôlement."
                }));
                return;
              }

              if (bannedDevices.has(targetDevId)) {
                res.writeHead(403, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                  ok: false,
                  status: 403,
                  error: "Cet appareil est révoqué ou banni du serveur et ne peut pas être ré-enrôlé.",
                  code: "DEVICE_REVOKED"
                }));
                return;
              }

              registeredDevices.set(targetDevId, {
                deviceId: targetDevId,
                publicKey: pubKey,
                fingerprintHash,
                status: "active",
                enrolledAt: Date.now(),
                lastSeen: Date.now(),
                metadata
              });

              res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
              res.end(JSON.stringify({
                ok: true,
                status: 200,
                message: "Appareil enrôlé avec succès",
                deviceId: targetDevId
              }));
              return;
            } catch (err: any) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({
                ok: false,
                status: 400,
                error: err.message || "Erreur lors de l'enrôlement de l'appareil."
              }));
              return;
            }
          }

          // Revocation enforcement for any identified device
          if (deviceId) {
            if (bannedDevices.has(deviceId)) {
              res.writeHead(403, { "Content-Type": "application/json" });
              res.end(JSON.stringify({
                status: 403,
                error: "Cet appareil est révoqué ou banni du serveur.",
                code: "DEVICE_BANNED"
              }));
              return;
            }

            const regRecord = registeredDevices.get(deviceId);
            if (regRecord && regRecord.status === "revoked") {
              res.writeHead(403, { "Content-Type": "application/json" });
              res.end(JSON.stringify({
                status: 403,
                error: "Cet appareil a été révoqué par un administrateur.",
                code: "DEVICE_REVOKED"
              }));
              return;
            }
          }

          // Anti-spoofing and Cryptographic Ed25519 verification
          const hasEd25519Headers = Boolean(signature && nonce && timestamp && deviceId);

          if (hasEd25519Headers) {
            // Anti-replay: verify nonce hasn't already been consumed
            if (consumedNonces.has(nonce)) {
              res.writeHead(401, { "Content-Type": "application/json" });
              res.end(JSON.stringify({
                status: 401,
                error: "Attaque par rejeu détectée : Nonce déjà consommé dans la fenêtre temporelle.",
                code: "NONCE_REPLAY_DETECTED"
              }));
              return;
            }

            // Public key resolution (from registry or initial registration)
            let devRecord = registeredDevices.get(deviceId);
            if (!devRecord && devicePubKey) {
              devRecord = {
                deviceId,
                publicKey: devicePubKey,
                status: "active",
                enrolledAt: Date.now(),
                lastSeen: Date.now()
              };
              registeredDevices.set(deviceId, devRecord);
            }

            const pubKeyToUse = devRecord?.publicKey || devicePubKey;
            if (!pubKeyToUse) {
              res.writeHead(401, { "Content-Type": "application/json" });
              res.end(JSON.stringify({
                status: 401,
                error: "Appareil non enrôlé et aucune clé publique fournie.",
                code: "DEVICE_NOT_ENROLLED"
              }));
              return;
            }

            // Cryptographic Ed25519 signature & 30s freshness window verification
            const verifyRes = DeviceIdentityManager.verifyPayloadSignature(
              pubKeyToUse,
              method,
              reqUrl,
              bodyData,
              nonce,
              timestamp,
              signature,
              30000
            );

            if (!verifyRes.valid) {
              res.writeHead(401, { "Content-Type": "application/json" });
              res.end(JSON.stringify({
                status: 401,
                error: `Échec de vérification cryptographique Ed25519 : ${verifyRes.error}`,
                code: "INVALID_CRYPTOGRAPHIC_SIGNATURE"
              }));
              return;
            }

            // Valid signature! Record consumed nonce and update last seen
            consumedNonces.set(nonce, Date.now());
            if (devRecord) {
              devRecord.lastSeen = Date.now();
            }

            connectedClients.set(deviceId, {
              deviceId,
              ip: req.socket.remoteAddress || "",
              lastSeen: Date.now(),
              userAgent: req.headers["user-agent"],
              sessionId
            });
          } else if (requireDeviceSecurity && reqUrl !== "/health") {
            // Fallback for legacy tokens if Ed25519 headers were not provided
            if (!deviceId || !deviceToken) {
              res.writeHead(403, { "Content-Type": "application/json" });
              res.end(JSON.stringify({
                status: 403,
                error: "Authentification de l'appareil requise. En-têtes cryptographiques (X-Signature) ou d'identification (X-Device-Id, X-Device-Token) manquants.",
                code: "DEVICE_AUTH_REQUIRED"
              }));
              return;
            }

            // Verify device token integrity
            const verification = DeviceIdentityManager.verifyRemoteToken(deviceToken, authSecret);
            const localVerification = deviceMgr.verifyDeviceToken(deviceToken);
            if (!verification.valid && !localVerification) {
              res.writeHead(403, { "Content-Type": "application/json" });
              res.end(JSON.stringify({
                status: 403,
                error: "Signature de l'appareil invalide ou usurpée. Empreinte matérielle falsifiée.",
                code: "DEVICE_SPOOF_DETECTED",
                details: verification.error
              }));
              return;
            }

            connectedClients.set(deviceId, {
              deviceId,
              ip: req.socket.remoteAddress || "",
              lastSeen: Date.now(),
              userAgent: req.headers["user-agent"],
              sessionId
            });
          }

          // ------------------------------------------------------------------
          // BUILT-IN RPC DISPATCHER (/api/rpc)
          // ------------------------------------------------------------------
          if (reqUrl === "/api/rpc" && method === "POST") {
            try {
              const rpcPayload = bodyData ? JSON.parse(bodyData) : {};
              const service = rpcPayload.service || "Default";
              const rpcMethod = rpcPayload.method || "";
              const rpcArgs = Array.isArray(rpcPayload.args) ? rpcPayload.args : [];

              const rpcKey = `${service}.${rpcMethod}`;
              let handler = rpcHandlers.get(rpcKey);
              if (!handler) {
                handler = rpcHandlers.get(rpcMethod);
              }

              if (!handler) {
                res.writeHead(404, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                  ok: false,
                  status: 404,
                  error: `Méthode RPC '${rpcKey}' non trouvée sur le serveur.`
                }));
                return;
              }

              const reqInstance = createRequestInstance(req, bodyData);
              let fnToCall = handler;
              if (fnToCall && fnToCall.type === "string") {
                try { fnToCall = env.lookupVar(fnToCall.value); } catch (_) {}
              }

              const expectedParams = (fnToCall && fnToCall.type === "fn" && Array.isArray((fnToCall as any).parameters))
                ? (fnToCall as any).parameters.length
                : -1;
              const runtimeArgs = (expectedParams === rpcArgs.length)
                ? rpcArgs.map(jsToRuntimeVal)
                : [{ type: "instance", instance: reqInstance } as RuntimeVal, ...rpcArgs.map(jsToRuntimeVal)];

              const execResult = callLLPFunction(fnToCall, runtimeArgs, env);
              const jsonResult = runtimeValToJs(execResult);

              res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
              res.end(JSON.stringify({ ok: true, status: 200, result: jsonResult }));
              return;
            } catch (rpcErr: any) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({
                ok: false,
                status: 500,
                error: rpcErr.message || "Erreur interne lors de l'exécution RPC."
              }));
              return;
            }
          }

          // ------------------------------------------------------------------
          // BUILT-IN RPC PUSH EVENTS PULL (/api/rpc/events)
          // ------------------------------------------------------------------
          if (reqUrl === "/api/rpc/events") {
            const devId = (req.headers["x-device-id"] as string) || "";
            const events = devicePushQueues.get(devId) || [];
            devicePushQueues.set(devId, []); // Flush queue after read

            res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
            res.end(JSON.stringify({ ok: true, events }));
            return;
          }

          // Route lookup
          let routeConfig = routes.get(`${method}:${reqUrl}`) || routes.get(`ALL:${reqUrl}`);

          // Wildcard route fallback if not exact match
          if (!routeConfig) {
            for (const [key, value] of routes.entries()) {
              const [rMethod, rPath] = key.split(":");
              if ((rMethod === method || rMethod === "ALL") && rPath.endsWith("*")) {
                const prefix = rPath.slice(0, -1);
                if (reqUrl.startsWith(prefix)) {
                  routeConfig = value;
                  break;
                }
              }
            }
          }

          if (routeConfig && routeConfig.handler) {
            try {
              const reqInstance = createRequestInstance(req, bodyData);
              let fnToCall = routeConfig.handler;
              if (fnToCall && fnToCall.type === "string") {
                try {
                  fnToCall = env.lookupVar(fnToCall.value);
                } catch (_) {}
              }
              const handlerResult = callLLPFunction(fnToCall, [{ type: "instance", instance: reqInstance }], env);

              let outputStr = "";
              if (handlerResult.type === "string") {
                outputStr = handlerResult.value;
              } else if (handlerResult.type === "number" || handlerResult.type === "boolean") {
                outputStr = String(handlerResult.value);
              } else if (handlerResult.type === "instance") {
                outputStr = JSON.stringify({ type: "instance", name: handlerResult.instance?.Name });
              } else if (handlerResult.value !== undefined) {
                outputStr = JSON.stringify(handlerResult.value);
              }

              const isJson = outputStr.trim().startsWith("{") || outputStr.trim().startsWith("[");
              res.writeHead(200, {
                "Content-Type": isJson ? "application/json; charset=utf-8" : "text/plain; charset=utf-8"
              });
              res.end(outputStr);
            } catch (err: any) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ status: 500, error: err.message || "Internal LLP Server Error" }));
            }
          } else {
            res.writeHead(404, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ status: 404, error: `Route ${method} ${reqUrl} non trouvée sur le serveur LLP.` }));
          }
        });
      });

      httpServer.listen(port, host, () => {
        activePort = port;
        console.log(`[LLP Server Engine] Serveur LLP distant démarré avec succès sur http://${host}:${port}`);
        console.log(`[LLP Server Engine] Système d'identification matériel des appareils actif.`);
        console.log(`[LLP Server Engine] Passerelle RPC transparente active sur /api/rpc`);
      });

      return MK_BOOL(true);
    }
  });

  // Server.Stop() -> Boolean
  serverObj.SetProperty("Stop", {
    type: "native_fn",
    call: () => {
      if (httpServer) {
        httpServer.close();
        httpServer = null;
        activePort = 0;
        console.log("[LLP Server Engine] Serveur arrêté.");
        return MK_BOOL(true);
      }
      return MK_BOOL(false);
    }
  });

  // Server.IsRunning() -> Boolean
  serverObj.SetProperty("IsRunning", {
    type: "native_fn",
    call: () => MK_BOOL(httpServer !== null)
  });

  // Server.GetPort() -> Number
  serverObj.SetProperty("GetPort", {
    type: "native_fn",
    call: () => MK_NUMBER(activePort)
  });

  env.declareVar("Server", { type: "instance", instance: serverObj }, "General");

  // --------------------------------------------------------------------------
  // 3. TRANSPARENT RPC CLIENT & PUSH SERVICE (RPC)
  // --------------------------------------------------------------------------
  const rpcObj = new Instance("RpcService");
  rpcObj.Name = "RPC";

  // RPC.Call(fullMethod: string, ...args) -> RuntimeVal
  rpcObj.SetProperty("Call", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const fullMethod = args[0]?.type === "string" ? args[0].value : "";
      const parts = fullMethod.split(".");
      const service = parts.length > 1 ? parts[0] : "Default";
      const method = parts.length > 1 ? parts.slice(1).join(".") : parts[0];
      const callArgs = args.slice(1).map(runtimeValToJs);

      // Local in-memory dispatch optimization if server runs in the same process
      const localKey = `${service}.${method}`;
      if (rpcHandlers.has(localKey) || rpcHandlers.has(method)) {
        if (!deviceMgr.isKeySealed()) {
          console.error(`[LLP RPC Local Error] Impossible d'exécuter l'appel RPC : la clé cryptographique n'a pas pu être descellée sur cette machine (Empreinte matérielle altérée ou tentative de clonage détectée).`);
          return MK_NULL();
        }
        try {
          let handler = rpcHandlers.get(localKey) || rpcHandlers.get(method)!;
          if (handler && handler.type === "string") {
            try { handler = env.lookupVar(handler.value); } catch (_) {}
          }
          const dummyReq = new Instance("HttpRequest");
          dummyReq.SetProperty("DeviceId", MK_STRING(deviceMgr.getDeviceId()));
          dummyReq.SetProperty("ClientIp", MK_STRING("127.0.0.1"));

          const expectedParams = (handler && handler.type === "fn" && Array.isArray((handler as any).parameters))
            ? (handler as any).parameters.length
            : -1;
          const runtimeArgs = (expectedParams === callArgs.length)
            ? callArgs.map(jsToRuntimeVal)
            : [{ type: "instance", instance: dummyReq } as RuntimeVal, ...callArgs.map(jsToRuntimeVal)];

          const res = callLLPFunction(handler, runtimeArgs, env);
          return res;
        } catch (e: any) {
          console.error(`[LLP RPC Local Error] ${e.message}`);
          return MK_NULL();
        }
      }

      // Remote HTTP dispatch
      const targetUrl = serverBaseUrl ? `${serverBaseUrl}/api/rpc` : "http://127.0.0.1:8080/api/rpc";
      const res = executeSyncRequest("POST", targetUrl, JSON.stringify({ service, method, args: callArgs }));

      if (res.ok && res.body) {
        try {
          const parsed = JSON.parse(res.body);
          if (parsed.ok) {
            return jsToRuntimeVal(parsed.result);
          } else {
            console.error(`[LLP RPC Error] Échec de l'appel '${fullMethod}' : ${parsed.error}`);
            return MK_NULL();
          }
        } catch (err: any) {
          console.error(`[LLP RPC Error] Réponse invalide pour '${fullMethod}' : ${err.message}`);
          return MK_NULL();
        }
      }
      console.error(`[LLP RPC Error] Serveur RPC injoignable : ${res.error || res.status}`);
      return MK_NULL();
    }
  });

  // RPC.Register(service: string, method: string, handler: Function) -> Boolean
  rpcObj.SetProperty("Register", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const reg = serverObj.GetProperty("RegisterRPC");
      if (reg && reg.type === "native_fn" && reg.call) {
        return reg.call(args, env);
      }
      return MK_BOOL(false);
    }
  });

  // RPC.On(eventName: string, handlerFn: Function) -> Boolean
  rpcObj.SetProperty("On", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const evName = args[0]?.type === "string" ? args[0].value : "";
      const handler = args[1];
      if (evName && handler) {
        if (!clientEventListeners.has(evName)) {
          clientEventListeners.set(evName, []);
        }
        clientEventListeners.get(evName)!.push(handler);
        return MK_BOOL(true);
      }
      return MK_BOOL(false);
    }
  });

  // RPC.PollEvents() -> RuntimeVal (list of dispatched events)
  rpcObj.SetProperty("PollEvents", {
    type: "native_fn",
    call: () => {
      const devId = deviceMgr.getDeviceId();
      // In-process event queue check
      if (devicePushQueues.has(devId) && (devicePushQueues.get(devId) || []).length > 0) {
        const localEvents = devicePushQueues.get(devId) || [];
        devicePushQueues.set(devId, []);
        for (const ev of localEvents) {
          const listeners = clientEventListeners.get(ev.event) || [];
          for (const l of listeners) {
            try {
              callLLPFunction(l, [jsToRuntimeVal(ev.data)], env);
            } catch (_) {}
          }
        }
        return jsToRuntimeVal(localEvents);
      }

      if (serverBaseUrl || activePort > 0) {
        const targetUrl = serverBaseUrl ? `${serverBaseUrl}/api/rpc/events` : `http://127.0.0.1:${activePort}/api/rpc/events`;
        const res = executeSyncRequest("GET", targetUrl);
        if (res.ok && res.body) {
          try {
            const parsed = JSON.parse(res.body);
            if (parsed.ok && Array.isArray(parsed.events)) {
              for (const ev of parsed.events) {
                const listeners = clientEventListeners.get(ev.event) || [];
                for (const l of listeners) {
                  try {
                    callLLPFunction(l, [jsToRuntimeVal(ev.data)], env);
                  } catch (_) {}
                }
              }
              return jsToRuntimeVal(parsed.events);
            }
          } catch (_) {}
        }
      }
      return jsToRuntimeVal([]);
    }
  });

  // RPC.GetDeviceId() -> String
  rpcObj.SetProperty("GetDeviceId", {
    type: "native_fn",
    call: () => MK_STRING(deviceMgr.getDeviceId())
  });

  // RPC.PushTo / RPC.Broadcast aliases
  rpcObj.SetProperty("PushTo", serverObj.GetProperty("PushTo"));
  rpcObj.SetProperty("Broadcast", serverObj.GetProperty("Broadcast"));

  env.declareVar("RPC", { type: "instance", instance: rpcObj }, "General");
}
