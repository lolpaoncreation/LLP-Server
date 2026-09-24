import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { Environment } from "../runtime/environment";
import { Instance } from "../runtime/instance";
import { MK_BOOL, MK_NULL, MK_NUMBER, MK_STRING, RuntimeVal } from "../runtime/values";
import { getProjectEncryptionKey } from "./crypto";

// ===================================================
// LLP PHP-Style Encrypted Session System
// Stores, retrieves, and persists session variables securely
// with transparent AES-256-CBC encryption per project
// ===================================================

export class SessionManager {
  private static instance: SessionManager;
  private sessionId: string | null = null;
  private sessionData: { [key: string]: any } = {};
  private storageDir: string;
  private encryptionKey: string;
  private isActive: boolean = false;

  private constructor() {
    this.storageDir = path.resolve(process.cwd(), "data", ".sessions");
    this.encryptionKey = getProjectEncryptionKey();
  }

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private getSessionFilePath(id: string): string {
    const hashed = crypto.createHash("sha256").update(id).digest("hex");
    return path.join(this.storageDir, `sess_${hashed}.cllpsess`);
  }

  public start(customId?: string): string {
    if (this.isActive && this.sessionId) {
      return this.sessionId;
    }

    if (!fs.existsSync(this.storageDir)) {
      try {
        fs.mkdirSync(this.storageDir, { recursive: true });
      } catch (_) {}
    }

    this.sessionId = customId && customId.trim().length > 0
      ? customId.trim()
      : "sess_" + crypto.randomBytes(24).toString("hex");

    this.sessionData = {};
    this.isActive = true;

    // Load existing session file if exists
    const filePath = this.getSessionFilePath(this.sessionId);
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath);
        if (raw.length > 32 && raw.subarray(0, 8).toString("utf8") === "CLLPSES1") {
          const iv = raw.subarray(8, 24);
          const encrypted = raw.subarray(24);
          const keyBuffer = crypto.createHash("sha256").update(this.encryptionKey).digest();
          const decipher = crypto.createDecipheriv("aes-256-cbc", keyBuffer, iv);
          let decrypted = decipher.update(encrypted);
          decrypted = Buffer.concat([decrypted, decipher.final()]);
          this.sessionData = JSON.parse(decrypted.toString("utf8"));
        }
      } catch (e) {
        this.sessionData = {};
      }
    }

    return this.sessionId;
  }

  public save(): boolean {
    if (!this.isActive || !this.sessionId) return false;
    try {
      if (!fs.existsSync(this.storageDir)) {
        fs.mkdirSync(this.storageDir, { recursive: true });
      }

      const filePath = this.getSessionFilePath(this.sessionId);
      const jsonStr = JSON.stringify(this.sessionData);
      const jsonBuf = Buffer.from(jsonStr, "utf8");

      const iv = crypto.randomBytes(16);
      const keyBuffer = crypto.createHash("sha256").update(this.encryptionKey).digest();
      const cipher = crypto.createCipheriv("aes-256-cbc", keyBuffer, iv);
      let encrypted = cipher.update(jsonBuf);
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      const header = Buffer.from("CLLPSES1", "utf8");
      const finalBuf = Buffer.concat([header, iv, encrypted]);

      fs.writeFileSync(filePath, finalBuf);
      return true;
    } catch (_) {
      return false;
    }
  }

  public set(key: string, value: any): void {
    if (!this.isActive) this.start();
    this.sessionData[key] = value;
    this.save();
  }

  public get(key: string, defaultValue: any = null): any {
    if (!this.isActive) this.start();
    return this.sessionData[key] !== undefined ? this.sessionData[key] : defaultValue;
  }

  public has(key: string): boolean {
    if (!this.isActive) this.start();
    return Object.prototype.hasOwnProperty.call(this.sessionData, key);
  }

  public remove(key: string): boolean {
    if (!this.isActive) return false;
    if (Object.prototype.hasOwnProperty.call(this.sessionData, key)) {
      delete this.sessionData[key];
      this.save();
      return true;
    }
    return false;
  }

  public clear(): void {
    this.sessionData = {};
    this.save();
  }

  public destroy(): boolean {
    if (this.sessionId) {
      const filePath = this.getSessionFilePath(this.sessionId);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (_) {}
      }
    }
    this.sessionId = null;
    this.sessionData = {};
    this.isActive = false;
    return true;
  }

  public getId(): string {
    if (!this.isActive) this.start();
    return this.sessionId || "";
  }

  public getAll(): { [key: string]: any } {
    if (!this.isActive) this.start();
    return { ...this.sessionData };
  }

  public isStarted(): boolean {
    return this.isActive;
  }
}

// Convert a JS value to RuntimeVal
function jsToRuntimeVal(val: any): RuntimeVal {
  if (val === null || val === undefined) return MK_NULL();
  if (typeof val === "boolean") return MK_BOOL(val);
  if (typeof val === "number") return MK_NUMBER(val);
  if (typeof val === "string") return MK_STRING(val);
  return MK_STRING(JSON.stringify(val));
}

// Convert RuntimeVal to JS value
function runtimeValToJs(val: RuntimeVal): any {
  if (!val) return null;
  switch (val.type) {
    case "null": return null;
    case "boolean": return val.value;
    case "number": return val.value;
    case "string": return val.value;
    case "list":
    case "fixed_array":
      return (val as any).elements ? (val as any).elements.map(runtimeValToJs) : [];
    case "instance":
      return `[Instance ${(val as any).instance?.Name || "Object"}]`;
    default:
      return (val as any).value !== undefined ? (val as any).value : null;
  }
}

export function registerSession(env: Environment) {
  const sessionObj = new Instance("SessionService");
  sessionObj.Name = "Session";
  const mgr = SessionManager.getInstance();

  // Session.Start([customId])
  sessionObj.SetProperty("Start", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const customId = args[0]?.type === "string" ? args[0].value : undefined;
      const id = mgr.start(customId);
      return MK_STRING(id);
    }
  });

  // Session.Set(key, value)
  sessionObj.SetProperty("Set", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const key = args[0]?.type === "string" ? args[0].value : "";
      if (!key) return MK_BOOL(false);
      const val = runtimeValToJs(args[1]);
      mgr.set(key, val);
      return MK_BOOL(true);
    }
  });

  // Session.Get(key, [defaultVal])
  sessionObj.SetProperty("Get", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const key = args[0]?.type === "string" ? args[0].value : "";
      const defVal = args[1] !== undefined ? runtimeValToJs(args[1]) : null;
      const res = mgr.get(key, defVal);
      return jsToRuntimeVal(res);
    }
  });

  // Session.Has(key)
  sessionObj.SetProperty("Has", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const key = args[0]?.type === "string" ? args[0].value : "";
      return MK_BOOL(mgr.has(key));
    }
  });

  // Session.Remove(key)
  sessionObj.SetProperty("Remove", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const key = args[0]?.type === "string" ? args[0].value : "";
      return MK_BOOL(mgr.remove(key));
    }
  });

  // Session.Delete(key) - alias for Remove
  sessionObj.SetProperty("Delete", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const key = args[0]?.type === "string" ? args[0].value : "";
      return MK_BOOL(mgr.remove(key));
    }
  });

  // Session.Clear()
  sessionObj.SetProperty("Clear", {
    type: "native_fn",
    call: () => {
      mgr.clear();
      return MK_BOOL(true);
    }
  });

  // Session.Destroy()
  sessionObj.SetProperty("Destroy", {
    type: "native_fn",
    call: () => {
      return MK_BOOL(mgr.destroy());
    }
  });

  // Session.Id()
  sessionObj.SetProperty("Id", {
    type: "native_fn",
    call: () => {
      return MK_STRING(mgr.getId());
    }
  });

  // Session.GetAll()
  sessionObj.SetProperty("GetAll", {
    type: "native_fn",
    call: () => {
      return MK_STRING(JSON.stringify(mgr.getAll()));
    }
  });

  // Session.Save()
  sessionObj.SetProperty("Save", {
    type: "native_fn",
    call: () => {
      return MK_BOOL(mgr.save());
    }
  });

  // Session.IsActive()
  sessionObj.SetProperty("IsActive", {
    type: "native_fn",
    call: () => {
      return MK_BOOL(mgr.isStarted());
    }
  });

  env.declareVar("Session", { type: "instance", instance: sessionObj }, "General");
}
