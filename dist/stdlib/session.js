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
exports.SessionManager = void 0;
exports.registerSession = registerSession;
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const instance_1 = require("../runtime/instance");
const values_1 = require("../runtime/values");
const crypto_1 = require("./crypto");
// ===================================================
// LLP PHP-Style Encrypted Session System
// Stores, retrieves, and persists session variables securely
// with transparent AES-256-CBC encryption per project
// ===================================================
class SessionManager {
    static instance;
    sessionId = null;
    sessionData = {};
    storageDir;
    encryptionKey;
    isActive = false;
    constructor() {
        this.storageDir = path.resolve(process.cwd(), "data", ".sessions");
        this.encryptionKey = (0, crypto_1.getProjectEncryptionKey)();
    }
    static getInstance() {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager();
        }
        return SessionManager.instance;
    }
    getSessionFilePath(id) {
        const hashed = crypto.createHash("sha256").update(id).digest("hex");
        return path.join(this.storageDir, `sess_${hashed}.cllpsess`);
    }
    start(customId) {
        if (this.isActive && this.sessionId) {
            return this.sessionId;
        }
        if (!fs.existsSync(this.storageDir)) {
            try {
                fs.mkdirSync(this.storageDir, { recursive: true });
            }
            catch (_) { }
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
            }
            catch (e) {
                this.sessionData = {};
            }
        }
        return this.sessionId;
    }
    save() {
        if (!this.isActive || !this.sessionId)
            return false;
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
        }
        catch (_) {
            return false;
        }
    }
    set(key, value) {
        if (!this.isActive)
            this.start();
        this.sessionData[key] = value;
        this.save();
    }
    get(key, defaultValue = null) {
        if (!this.isActive)
            this.start();
        return this.sessionData[key] !== undefined ? this.sessionData[key] : defaultValue;
    }
    has(key) {
        if (!this.isActive)
            this.start();
        return Object.prototype.hasOwnProperty.call(this.sessionData, key);
    }
    remove(key) {
        if (!this.isActive)
            return false;
        if (Object.prototype.hasOwnProperty.call(this.sessionData, key)) {
            delete this.sessionData[key];
            this.save();
            return true;
        }
        return false;
    }
    clear() {
        this.sessionData = {};
        this.save();
    }
    destroy() {
        if (this.sessionId) {
            const filePath = this.getSessionFilePath(this.sessionId);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                }
                catch (_) { }
            }
        }
        this.sessionId = null;
        this.sessionData = {};
        this.isActive = false;
        return true;
    }
    getId() {
        if (!this.isActive)
            this.start();
        return this.sessionId || "";
    }
    getAll() {
        if (!this.isActive)
            this.start();
        return { ...this.sessionData };
    }
    isStarted() {
        return this.isActive;
    }
}
exports.SessionManager = SessionManager;
// Convert a JS value to RuntimeVal
function jsToRuntimeVal(val) {
    if (val === null || val === undefined)
        return (0, values_1.MK_NULL)();
    if (typeof val === "boolean")
        return (0, values_1.MK_BOOL)(val);
    if (typeof val === "number")
        return (0, values_1.MK_NUMBER)(val);
    if (typeof val === "string")
        return (0, values_1.MK_STRING)(val);
    return (0, values_1.MK_STRING)(JSON.stringify(val));
}
// Convert RuntimeVal to JS value
function runtimeValToJs(val) {
    if (!val)
        return null;
    switch (val.type) {
        case "null": return null;
        case "boolean": return val.value;
        case "number": return val.value;
        case "string": return val.value;
        case "list":
        case "fixed_array":
            return val.elements ? val.elements.map(runtimeValToJs) : [];
        case "instance":
            return `[Instance ${val.instance?.Name || "Object"}]`;
        default:
            return val.value !== undefined ? val.value : null;
    }
}
function registerSession(env) {
    const sessionObj = new instance_1.Instance("SessionService");
    sessionObj.Name = "Session";
    const mgr = SessionManager.getInstance();
    // Session.Start([customId])
    sessionObj.SetProperty("Start", {
        type: "native_fn",
        call: (args) => {
            const customId = args[0]?.type === "string" ? args[0].value : undefined;
            const id = mgr.start(customId);
            return (0, values_1.MK_STRING)(id);
        }
    });
    // Session.Set(key, value)
    sessionObj.SetProperty("Set", {
        type: "native_fn",
        call: (args) => {
            const key = args[0]?.type === "string" ? args[0].value : "";
            if (!key)
                return (0, values_1.MK_BOOL)(false);
            const val = runtimeValToJs(args[1]);
            mgr.set(key, val);
            return (0, values_1.MK_BOOL)(true);
        }
    });
    // Session.Get(key, [defaultVal])
    sessionObj.SetProperty("Get", {
        type: "native_fn",
        call: (args) => {
            const key = args[0]?.type === "string" ? args[0].value : "";
            const defVal = args[1] !== undefined ? runtimeValToJs(args[1]) : null;
            const res = mgr.get(key, defVal);
            return jsToRuntimeVal(res);
        }
    });
    // Session.Has(key)
    sessionObj.SetProperty("Has", {
        type: "native_fn",
        call: (args) => {
            const key = args[0]?.type === "string" ? args[0].value : "";
            return (0, values_1.MK_BOOL)(mgr.has(key));
        }
    });
    // Session.Remove(key)
    sessionObj.SetProperty("Remove", {
        type: "native_fn",
        call: (args) => {
            const key = args[0]?.type === "string" ? args[0].value : "";
            return (0, values_1.MK_BOOL)(mgr.remove(key));
        }
    });
    // Session.Delete(key) - alias for Remove
    sessionObj.SetProperty("Delete", {
        type: "native_fn",
        call: (args) => {
            const key = args[0]?.type === "string" ? args[0].value : "";
            return (0, values_1.MK_BOOL)(mgr.remove(key));
        }
    });
    // Session.Clear()
    sessionObj.SetProperty("Clear", {
        type: "native_fn",
        call: () => {
            mgr.clear();
            return (0, values_1.MK_BOOL)(true);
        }
    });
    // Session.Destroy()
    sessionObj.SetProperty("Destroy", {
        type: "native_fn",
        call: () => {
            return (0, values_1.MK_BOOL)(mgr.destroy());
        }
    });
    // Session.Id()
    sessionObj.SetProperty("Id", {
        type: "native_fn",
        call: () => {
            return (0, values_1.MK_STRING)(mgr.getId());
        }
    });
    // Session.GetAll()
    sessionObj.SetProperty("GetAll", {
        type: "native_fn",
        call: () => {
            return (0, values_1.MK_STRING)(JSON.stringify(mgr.getAll()));
        }
    });
    // Session.Save()
    sessionObj.SetProperty("Save", {
        type: "native_fn",
        call: () => {
            return (0, values_1.MK_BOOL)(mgr.save());
        }
    });
    // Session.IsActive()
    sessionObj.SetProperty("IsActive", {
        type: "native_fn",
        call: () => {
            return (0, values_1.MK_BOOL)(mgr.isStarted());
        }
    });
    env.declareVar("Session", { type: "instance", instance: sessionObj }, "General");
}
