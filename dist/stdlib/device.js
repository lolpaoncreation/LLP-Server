"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeviceIdentityManager = void 0;
exports.registerDevice = registerDevice;
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const instance_1 = require("../runtime/instance");
const values_1 = require("../runtime/values");
// ===================================================
// LLP Device Security & Immutable Hardware Anchor
// 1. Hardware Fingerprint (HWID) targeting fixed motherboard, CPU, and OS disk UUIDs.
// 2. Machine-Bound Asymmetric Cryptography (Ed25519 Key Sealing with AES-256-GCM).
// 3. Dynamic RPC Frame Signing with Anti-Replay Nonce & Timestamp.
// ===================================================
class DeviceIdentityManager {
    static instance;
    cachedDeviceId = null;
    cachedFingerprint = null;
    hardwareSecret = null;
    privateKey = null;
    publicKeyPem = "";
    isClonedOrTampered = false;
    anchorFilePath;
    keySealFilePath;
    pubKeyFilePath;
    constructor() {
        const homeDir = os.homedir() || process.cwd();
        const llpDir = path.join(homeDir, ".llp");
        this.anchorFilePath = path.join(llpDir, "device.anchor");
        this.keySealFilePath = path.join(llpDir, "device_key.seal");
        this.pubKeyFilePath = path.join(llpDir, "device.pub");
        this.initializeIdentity();
    }
    static getInstance() {
        if (!DeviceIdentityManager.instance) {
            DeviceIdentityManager.instance = new DeviceIdentityManager();
        }
        return DeviceIdentityManager.instance;
    }
    /**
     * Helper to execute a command synchronously without throwing.
     */
    runCommand(cmd, timeoutMs = 2000) {
        try {
            return (0, child_process_1.execSync)(cmd, {
                encoding: "utf8",
                timeout: timeoutMs,
                windowsHide: true,
                stdio: ["ignore", "pipe", "ignore"]
            }).trim();
        }
        catch (_) {
            return "";
        }
    }
    /**
     * Collects motherboard BIOS/UEFI UUID and Serial Number.
     */
    getMotherboardIdentity() {
        let uuid = "";
        let serial = "";
        const p = os.platform();
        if (p === "win32") {
            // 1. Motherboard UUID
            const uuidWmic = this.runCommand("wmic csproduct get uuid");
            const uuidLines = uuidWmic.split(/\r?\n/).filter(Boolean);
            if (uuidLines.length > 1 && uuidLines[1].trim() && uuidLines[1].trim() !== "00000000-0000-0000-0000-000000000000") {
                uuid = uuidLines[1].trim();
            }
            else {
                const psUuid = this.runCommand('powershell -NoProfile -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"');
                if (psUuid && psUuid !== "00000000-0000-0000-0000-000000000000")
                    uuid = psUuid;
            }
            // 2. BIOS / Board Serial Number
            const biosWmic = this.runCommand("wmic bios get serialnumber");
            const biosLines = biosWmic.split(/\r?\n/).filter(Boolean);
            if (biosLines.length > 1 && biosLines[1].trim() && biosLines[1].trim().toLowerCase() !== "to be filled by o.e.m.") {
                serial = biosLines[1].trim();
            }
            else {
                const psSerial = this.runCommand('powershell -NoProfile -Command "(Get-CimInstance Win32_BIOS).SerialNumber"');
                if (psSerial && psSerial.toLowerCase() !== "to be filled by o.e.m.")
                    serial = psSerial;
            }
        }
        else if (p === "linux") {
            // Linux DMI paths
            const uuidPaths = ["/sys/class/dmi/id/product_uuid", "/sys/devices/virtual/dmi/id/product_uuid"];
            for (const up of uuidPaths) {
                if (fs.existsSync(up)) {
                    try {
                        const content = fs.readFileSync(up, "utf8").trim();
                        if (content) {
                            uuid = content;
                            break;
                        }
                    }
                    catch (_) { }
                }
            }
            const serialPaths = ["/sys/class/dmi/id/board_serial", "/sys/class/dmi/id/product_serial"];
            for (const sp of serialPaths) {
                if (fs.existsSync(sp)) {
                    try {
                        const content = fs.readFileSync(sp, "utf8").trim();
                        if (content) {
                            serial = content;
                            break;
                        }
                    }
                    catch (_) { }
                }
            }
        }
        else if (p === "darwin") {
            // macOS IOPlatformExpertDevice
            const ioregOut = this.runCommand("ioreg -rd1 -c IOPlatformExpertDevice");
            const uuidMatch = ioregOut.match(/"IOPlatformUUID"\s*=\s*"([^"]+)"/i);
            if (uuidMatch)
                uuid = uuidMatch[1].trim();
            const serialMatch = ioregOut.match(/"IOPlatformSerialNumber"\s*=\s*"([^"]+)"/i);
            if (serialMatch)
                serial = serialMatch[1].trim();
        }
        return {
            uuid: uuid || "FIXED_MOBO_DEFAULT_UUID",
            serial: serial || "FIXED_MOBO_DEFAULT_SERIAL"
        };
    }
    /**
     * Collects CPU Model, Family, and Processor ID.
     */
    getCpuIdentity() {
        const p = os.platform();
        let cpuId = "";
        if (p === "win32") {
            const procWmic = this.runCommand("wmic cpu get processorid");
            const procLines = procWmic.split(/\r?\n/).filter(Boolean);
            if (procLines.length > 1) {
                cpuId = procLines[1].trim();
            }
            else {
                cpuId = this.runCommand('powershell -NoProfile -Command "(Get-CimInstance Win32_Processor).ProcessorId"');
            }
        }
        else if (p === "linux") {
            if (fs.existsSync("/proc/cpuinfo")) {
                try {
                    const cpuinfo = fs.readFileSync("/proc/cpuinfo", "utf8");
                    const modelMatch = cpuinfo.match(/model name\s*:\s*([^\r\n]+)/i);
                    const flagsMatch = cpuinfo.match(/flags\s*:\s*([^\r\n]+)/i);
                    cpuId = `${modelMatch ? modelMatch[1].trim() : ""}|${flagsMatch ? flagsMatch[1].trim().slice(0, 64) : ""}`;
                }
                catch (_) { }
            }
        }
        else if (p === "darwin") {
            cpuId = this.runCommand("sysctl -n machdep.cpu.brand_string");
        }
        const fallbackCpu = os.cpus()[0]?.model || "GENERIC_CPU";
        return cpuId || fallbackCpu;
    }
    /**
     * Collects System Root Disk Volume Serial Number or OS installation MachineGuid.
     */
    getSystemDiskIdentity() {
        const p = os.platform();
        let diskId = "";
        if (p === "win32") {
            // MachineGuid in Registry
            const regOut = this.runCommand('reg query "HKLM\\SOFTWARE\\Microsoft\\Cryptography" /v MachineGuid', 1500);
            const match = regOut.match(/MachineGuid\s+REG_SZ\s+([a-fA-F0-9\-]+)/i);
            if (match) {
                diskId = match[1].trim();
            }
            else {
                const psVol = this.runCommand('powershell -NoProfile -Command "(Get-CimInstance Win32_LogicalDisk -Filter \\"DeviceID=\'C:\'\\").VolumeSerialNumber"');
                if (psVol)
                    diskId = psVol;
            }
        }
        else if (p === "linux") {
            const candidates = ["/etc/machine-id", "/var/lib/dbus/machine-id"];
            for (const cp of candidates) {
                if (fs.existsSync(cp)) {
                    try {
                        const content = fs.readFileSync(cp, "utf8").trim();
                        if (content) {
                            diskId = content;
                            break;
                        }
                    }
                    catch (_) { }
                }
            }
        }
        else if (p === "darwin") {
            const diskutilOut = this.runCommand("diskutil info /");
            const match = diskutilOut.match(/Volume UUID:\s*([a-fA-F0-9\-]+)/i);
            if (match)
                diskId = match[1].trim();
        }
        return diskId || "FIXED_DISK_DEFAULT_ID";
    }
    /**
     * Collects and derives the Hardware Fingerprint (DeviceFingerprint) using HMAC-SHA256.
     * RawData = MotherboardUUID + CPU_ID + SystemDiskUUID
     * DeviceFingerprint = HMAC-SHA256(Key: "LLP_CORE_SALT_v1", Message: RawData)
     */
    collectHardwareFingerprint() {
        const mobo = this.getMotherboardIdentity();
        const cpu = this.getCpuIdentity();
        const disk = this.getSystemDiskIdentity();
        const rawData = `${mobo.uuid}|${mobo.serial}|${cpu}|${disk}`;
        const fingerprint = crypto
            .createHmac("sha256", "LLP_CORE_SALT_v1")
            .update(rawData)
            .digest("hex");
        return { rawData, fingerprint };
    }
    /**
     * Initializes or verifies the cryptographic hardware anchor and seals/unseals the Ed25519 keypair.
     */
    initializeIdentity() {
        const { fingerprint } = this.collectHardwareFingerprint();
        this.cachedFingerprint = fingerprint;
        this.cachedDeviceId = "DEV_" + fingerprint.substring(0, 32);
        // Derive a local master key using PBKDF2 with 25,000 rounds
        this.hardwareSecret = crypto.pbkdf2Sync(fingerprint, "LLP_KEY_SEAL_SALT_v1", 25000, 32, "sha256").toString("hex");
        const anchorDir = path.dirname(this.anchorFilePath);
        if (!fs.existsSync(anchorDir)) {
            try {
                fs.mkdirSync(anchorDir, { recursive: true });
            }
            catch (_) { }
        }
        // Verify or persist hardware anchor file
        try {
            if (fs.existsSync(this.anchorFilePath)) {
                const stored = fs.readFileSync(this.anchorFilePath, "utf8").trim();
                const expectedSig = crypto.createHmac("sha256", this.hardwareSecret).update(this.cachedDeviceId).digest("hex");
                if (stored !== expectedSig) {
                    this.isClonedOrTampered = true;
                    fs.writeFileSync(this.anchorFilePath, expectedSig, "utf8");
                }
            }
            else {
                const sig = crypto.createHmac("sha256", this.hardwareSecret).update(this.cachedDeviceId).digest("hex");
                fs.writeFileSync(this.anchorFilePath, sig, "utf8");
            }
        }
        catch (_) { }
        // Load or generate sealed Ed25519 Keypair
        this.initializeSealedKeypair(fingerprint);
    }
    /**
     * Seals the Ed25519 private key on disk using AES-256-GCM keyed by DeviceFingerprint.
     * If copied to a different machine, unsealing fails cryptographically.
     */
    initializeSealedKeypair(deviceFingerprint) {
        const sealingKey = crypto.pbkdf2Sync(deviceFingerprint, "LLP_KEY_SEAL_SALT_v1", 25000, 32, "sha256");
        // Case 1: Sealed key already exists on disk -> Attempt unsealing
        if (fs.existsSync(this.keySealFilePath) && fs.existsSync(this.pubKeyFilePath)) {
            try {
                const sealJson = JSON.parse(fs.readFileSync(this.keySealFilePath, "utf8"));
                const iv = Buffer.from(sealJson.iv, "hex");
                const authTag = Buffer.from(sealJson.tag, "hex");
                const cipherText = Buffer.from(sealJson.cipher, "hex");
                const decipher = crypto.createDecipheriv("aes-256-gcm", sealingKey, iv);
                decipher.setAuthTag(authTag);
                const privKeyDer = Buffer.concat([decipher.update(cipherText), decipher.final()]);
                this.privateKey = crypto.createPrivateKey({ key: privKeyDer, format: "der", type: "pkcs8" });
                this.publicKeyPem = fs.readFileSync(this.pubKeyFilePath, "utf8").trim();
                this.isClonedOrTampered = false;
                return;
            }
            catch (err) {
                // Auth tag verification failed! The file was copied to a different machine with a different HWID!
                this.isClonedOrTampered = true;
                this.privateKey = null;
                console.warn("[LLP Device Security] ⚠️ AVERTISSEMENT : Échec du déchiffrement de la clé scellée. Empreinte matérielle altérée ou clonage détecté.");
            }
        }
        // Case 2: Key does not exist or was corrupted -> Generate new Ed25519 keypair and seal it
        try {
            const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
            const pubKeyPem = publicKey.export({ type: "spki", format: "pem" });
            const privKeyDer = privateKey.export({ type: "pkcs8", format: "der" });
            // Encrypt with AES-256-GCM
            const iv = crypto.randomBytes(12);
            const cipher = crypto.createCipheriv("aes-256-gcm", sealingKey, iv);
            const encrypted = Buffer.concat([cipher.update(privKeyDer), cipher.final()]);
            const tag = cipher.getAuthTag();
            fs.writeFileSync(this.keySealFilePath, JSON.stringify({
                iv: iv.toString("hex"),
                tag: tag.toString("hex"),
                cipher: encrypted.toString("hex")
            }, null, 2), "utf8");
            fs.writeFileSync(this.pubKeyFilePath, pubKeyPem, "utf8");
            this.privateKey = privateKey;
            this.publicKeyPem = pubKeyPem;
            this.isClonedOrTampered = false;
        }
        catch (e) {
            console.error("[LLP Device Security] Échec de la génération de la clé Ed25519 :", e.message);
        }
    }
    /**
     * Returns the immutable Device ID.
     */
    getDeviceId() {
        return this.cachedDeviceId || "DEV_UNKNOWN";
    }
    /**
     * Returns the derived DeviceFingerprint (HMAC-SHA256).
     */
    getDeviceFingerprint() {
        return this.cachedFingerprint || "";
    }
    /**
     * Returns the public key in PEM format.
     */
    getPublicKeyPem() {
        return this.publicKeyPem;
    }
    /**
     * Checks if the private key was successfully unsealed with this host's authentic HWID.
     */
    isKeySealed() {
        return this.privateKey !== null && !this.isClonedOrTampered;
    }
    /**
     * Signs an RPC or HTTP frame using the machine-sealed Ed25519 private key.
     * StringToSign = Nonce + "\n" + Timestamp + "\n" + HTTP_Method + "\n" + CanonicalPayload
     */
    signPayload(method, path, payload) {
        const deviceId = this.getDeviceId();
        const nonce = crypto.randomUUID();
        const timestamp = Date.now().toString();
        const httpMethod = (method || "POST").toUpperCase();
        if (!this.privateKey) {
            throw new Error("[LLP Device Security] Clé privée Ed25519 indisponible : l'empreinte matérielle de cette machine ne correspond pas au scellement local (Tentative de clonage ou fichier corrompu).");
        }
        const stringToSign = `${nonce}\n${timestamp}\n${httpMethod}\n${payload}`;
        const signature = crypto.sign(null, Buffer.from(stringToSign, "utf8"), this.privateKey).toString("hex");
        return {
            deviceId,
            nonce,
            timestamp,
            signature,
            publicKeyPem: this.publicKeyPem
        };
    }
    /**
     * Verifies an RPC payload signature using the device's Ed25519 public key.
     * Enforces a 30-second timestamp freshness window to block delayed replays.
     */
    static verifyPayloadSignature(publicKeyPem, method, path, payload, nonce, timestampStr, signatureHex, maxAgeMs = 30000) {
        if (!publicKeyPem || !nonce || !timestampStr || !signatureHex) {
            return { valid: false, error: "En-têtes de signature cryptographique manquants (X-Device-Id, X-Nonce, X-Timestamp, X-Signature)" };
        }
        const timestamp = parseInt(timestampStr, 10);
        if (isNaN(timestamp)) {
            return { valid: false, error: "Horodatage X-Timestamp invalide" };
        }
        // Check 30s freshness window
        const now = Date.now();
        if (Math.abs(now - timestamp) > maxAgeMs) {
            return { valid: false, error: `Horodatage expiré (décalage de ${Math.round(Math.abs(now - timestamp) / 1000)}s > limite de 30s)` };
        }
        try {
            let normalizedPubKey = publicKeyPem;
            if (!normalizedPubKey.includes("-----BEGIN") && normalizedPubKey.length > 20) {
                try {
                    const decoded = Buffer.from(normalizedPubKey, "base64").toString("utf8");
                    if (decoded.includes("-----BEGIN")) {
                        normalizedPubKey = decoded;
                    }
                }
                catch (_) { }
            }
            const httpMethod = (method || "POST").toUpperCase();
            const stringToSign = `${nonce}\n${timestampStr}\n${httpMethod}\n${payload}`;
            const pubKey = crypto.createPublicKey(normalizedPubKey);
            const isVerified = crypto.verify(null, Buffer.from(stringToSign, "utf8"), pubKey, Buffer.from(signatureHex, "hex"));
            return {
                valid: isVerified,
                error: isVerified ? undefined : "Signature cryptographique Ed25519 non concordante"
            };
        }
        catch (e) {
            return { valid: false, error: `Erreur lors de la vérification de la signature Ed25519 : ${e.message}` };
        }
    }
    /**
     * Legacy backward-compatible device token generation (deviceId:timestamp:nonce:signature)
     */
    generateDeviceToken(payload = "") {
        const deviceId = this.getDeviceId();
        const timestamp = Date.now().toString();
        const nonce = crypto.randomBytes(8).toString("hex");
        const dataToSign = `${deviceId}:${timestamp}:${nonce}:${payload}`;
        const signature = crypto
            .createHmac("sha256", this.hardwareSecret || "FALLBACK_KEY")
            .update(dataToSign)
            .digest("hex");
        return `${deviceId}.${timestamp}.${nonce}.${signature}`;
    }
    /**
     * Legacy backward-compatible signature.
     */
    signData(data) {
        if (this.privateKey) {
            try {
                return crypto.sign(null, Buffer.from(data, "utf8"), this.privateKey).toString("hex");
            }
            catch (_) { }
        }
        return crypto
            .createHmac("sha256", this.hardwareSecret || "FALLBACK_KEY")
            .update(data)
            .digest("hex");
    }
    /**
     * Legacy backward-compatible token verification.
     */
    verifyDeviceToken(token, payload = "", maxAgeMs = 300000) {
        if (!token || typeof token !== "string")
            return false;
        const parts = token.split(".");
        if (parts.length !== 4)
            return false;
        const [deviceId, timestampStr, nonce, signature] = parts;
        const timestamp = parseInt(timestampStr, 10);
        if (isNaN(timestamp))
            return false;
        if (Math.abs(Date.now() - timestamp) > maxAgeMs)
            return false;
        const dataToSign = `${deviceId}:${timestampStr}:${nonce}:${payload}`;
        const expectedSig = crypto
            .createHmac("sha256", this.hardwareSecret || "FALLBACK_KEY")
            .update(dataToSign)
            .digest("hex");
        return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSig, "hex"));
    }
    /**
     * Static remote token verification for servers receiving legacy tokens.
     */
    static verifyRemoteToken(token, secret, payload = "", maxAgeMs = 300000) {
        if (!token || typeof token !== "string")
            return { valid: false, error: "Jeton manquant" };
        const parts = token.split(".");
        if (parts.length !== 4)
            return { valid: false, error: "Format de jeton invalide" };
        const [deviceId, timestampStr, nonce, signature] = parts;
        const timestamp = parseInt(timestampStr, 10);
        if (isNaN(timestamp))
            return { valid: false, error: "Horodatage invalide" };
        if (Math.abs(Date.now() - timestamp) > maxAgeMs)
            return { valid: false, error: "Jeton expiré" };
        if (!secret)
            return { valid: true };
        const dataToSign = `${deviceId}:${timestampStr}:${nonce}:${payload}`;
        const expectedSig = crypto
            .createHmac("sha256", secret)
            .update(dataToSign)
            .digest("hex");
        try {
            const match = crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expectedSig, "hex"));
            return { valid: match, error: match ? undefined : "Signature du jeton non concordante" };
        }
        catch (_) {
            return { valid: false, error: "Erreur de format de signature" };
        }
    }
    /**
     * Returns OS platform name
     */
    getPlatform() {
        const p = os.platform();
        if (p === "win32")
            return "Windows";
        if (p === "darwin")
            return "macOS";
        if (p === "linux") {
            if (fs.existsSync("/system/build.prop") || process.env.ANDROID_ROOT) {
                return "Android";
            }
            return "Linux";
        }
        return p;
    }
    /**
     * Returns structured hardware info (non-sensitive)
     */
    getInfo() {
        return {
            deviceId: this.getDeviceId(),
            fingerprint: this.getDeviceFingerprint(),
            platform: this.getPlatform(),
            arch: os.arch(),
            cpuCount: os.cpus().length,
            cpuModel: os.cpus()[0]?.model || "Generic",
            totalMemoryMB: Math.round(os.totalmem() / (1024 * 1024)),
            freeMemoryMB: Math.round(os.freemem() / (1024 * 1024)),
            keySealed: this.isKeySealed(),
            hasEd25519Key: this.privateKey !== null
        };
    }
    /**
     * Checks if device integrity anchor is verified and not modified
     */
    isTrusted() {
        return this.isKeySealed();
    }
}
exports.DeviceIdentityManager = DeviceIdentityManager;
/**
 * Register the `Device` standard library module into the LLP runtime environment.
 */
function registerDevice(env) {
    const deviceMgr = DeviceIdentityManager.getInstance();
    const deviceObj = new instance_1.Instance("DeviceSecurityService");
    deviceObj.Name = "Device";
    // Device.GetId() -> String
    deviceObj.SetProperty("GetId", {
        type: "native_fn",
        call: () => (0, values_1.MK_STRING)(deviceMgr.getDeviceId())
    });
    // Device.GetFingerprint() -> String
    deviceObj.SetProperty("GetFingerprint", {
        type: "native_fn",
        call: () => (0, values_1.MK_STRING)(deviceMgr.getDeviceFingerprint())
    });
    // Device.GetPublicKey() -> String (PEM)
    deviceObj.SetProperty("GetPublicKey", {
        type: "native_fn",
        call: () => (0, values_1.MK_STRING)(deviceMgr.getPublicKeyPem())
    });
    // Device.IsKeySealed() -> Boolean
    deviceObj.SetProperty("IsKeySealed", {
        type: "native_fn",
        call: () => (0, values_1.MK_BOOL)(deviceMgr.isKeySealed())
    });
    // Device.GetToken(payload?: string) -> String
    deviceObj.SetProperty("GetToken", {
        type: "native_fn",
        call: (args) => {
            const payload = args[0]?.type === "string" ? args[0].value : "";
            return (0, values_1.MK_STRING)(deviceMgr.generateDeviceToken(payload));
        }
    });
    // Device.Sign(data: string) -> String
    deviceObj.SetProperty("Sign", {
        type: "native_fn",
        call: (args) => {
            const data = args[0]?.type === "string" ? args[0].value : "";
            return (0, values_1.MK_STRING)(deviceMgr.signData(data));
        }
    });
    // Device.SignPayload(method?: string, path?: string, payload?: string) -> Instance("PayloadSignature")
    deviceObj.SetProperty("SignPayload", {
        type: "native_fn",
        call: (args) => {
            let method = "POST";
            let path = "";
            let payload = "";
            if (args.length >= 3) {
                method = args[0]?.type === "string" ? args[0].value : "POST";
                path = args[1]?.type === "string" ? args[1].value : "";
                payload = args[2]?.type === "string" ? args[2].value : "";
            }
            else if (args.length === 2) {
                const a0 = args[0]?.type === "string" ? args[0].value : "";
                const a1 = args[1]?.type === "string" ? args[1].value : "";
                if (["GET", "POST", "PUT", "DELETE", "PATCH"].includes(a0.toUpperCase())) {
                    method = a0;
                    payload = a1;
                }
                else {
                    payload = a0;
                    method = a1 || "POST";
                }
            }
            else if (args.length === 1) {
                payload = args[0]?.type === "string" ? args[0].value : "";
            }
            const sigData = deviceMgr.signPayload(method, path, payload);
            const sigInst = new instance_1.Instance("PayloadSignature");
            sigInst.SetProperty("nonce", (0, values_1.MK_STRING)(sigData.nonce));
            sigInst.SetProperty("timestamp", (0, values_1.MK_STRING)(sigData.timestamp));
            sigInst.SetProperty("signature", (0, values_1.MK_STRING)(sigData.signature));
            sigInst.SetProperty("deviceId", (0, values_1.MK_STRING)(sigData.deviceId));
            sigInst.SetProperty("publicKey", (0, values_1.MK_STRING)(sigData.publicKeyPem));
            sigInst.SetProperty("json", (0, values_1.MK_STRING)(JSON.stringify(sigData)));
            return { type: "instance", instance: sigInst };
        }
    });
    // Device.VerifySignature(...) -> Boolean
    deviceObj.SetProperty("VerifySignature", {
        type: "native_fn",
        call: (args) => {
            const pubKey = args[0]?.type === "string" ? args[0].value : "";
            let payload = "";
            let nonce = "";
            let timestamp = "";
            let sig = "";
            let method = "POST";
            // Case 1: Device.VerifySignature(pubKey, sigInst, method, payload)
            if (args[1]?.type === "instance" && args[1].instance) {
                const inst = args[1].instance;
                nonce = inst.GetProperty("nonce")?.value || "";
                timestamp = inst.GetProperty("timestamp")?.value || "";
                sig = inst.GetProperty("signature")?.value || "";
                method = args[2]?.type === "string" ? args[2].value : "POST";
                payload = args[3]?.type === "string" ? args[3].value : "";
            }
            else {
                const strArgs = args.slice(1).map(a => a?.type === "string" ? a.value : "");
                // Detect whether signature is at index 0 (sig, nonce, ts, method, payload)
                // or index 3 (payload, nonce, ts, sig, method)
                if (strArgs[0] && strArgs[0].length >= 64 && !strArgs[0].includes("{")) {
                    sig = strArgs[0];
                    nonce = strArgs[1];
                    timestamp = strArgs[2];
                    method = strArgs[3] || "POST";
                    payload = strArgs[4] || "";
                }
                else {
                    payload = strArgs[0];
                    nonce = strArgs[1];
                    timestamp = strArgs[2];
                    sig = strArgs[3];
                    method = strArgs[4] || "POST";
                }
            }
            const res = DeviceIdentityManager.verifyPayloadSignature(pubKey, method, "", payload, nonce, timestamp, sig);
            return (0, values_1.MK_BOOL)(res.valid);
        }
    });
    // Device.Verify(token: string, payload?: string) -> Boolean
    deviceObj.SetProperty("Verify", {
        type: "native_fn",
        call: (args) => {
            const token = args[0]?.type === "string" ? args[0].value : "";
            const payload = args[1]?.type === "string" ? args[1].value : "";
            return (0, values_1.MK_BOOL)(deviceMgr.verifyDeviceToken(token, payload));
        }
    });
    // Device.GetPlatform() -> String ("Windows" | "Android" | "Linux" | "macOS"...)
    deviceObj.SetProperty("GetPlatform", {
        type: "native_fn",
        call: () => (0, values_1.MK_STRING)(deviceMgr.getPlatform())
    });
    // Device.GetInfo() -> String (JSON)
    deviceObj.SetProperty("GetInfo", {
        type: "native_fn",
        call: () => (0, values_1.MK_STRING)(JSON.stringify(deviceMgr.getInfo()))
    });
    // Device.IsTrusted() -> Boolean
    deviceObj.SetProperty("IsTrusted", {
        type: "native_fn",
        call: () => (0, values_1.MK_BOOL)(deviceMgr.isTrusted())
    });
    env.declareVar("Device", { type: "instance", instance: deviceObj }, "General");
}
