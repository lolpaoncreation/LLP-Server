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
exports.getProjectEncryptionKey = getProjectEncryptionKey;
exports.registerCrypto = registerCrypto;
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const instance_1 = require("../runtime/instance");
const values_1 = require("../runtime/values");
// Trouver la clef unique du projet
function getProjectEncryptionKey(startDir) {
    let currentDir = startDir ? path.resolve(startDir) : process.cwd();
    if (fs.existsSync(currentDir) && fs.statSync(currentDir).isFile()) {
        currentDir = path.dirname(currentDir);
    }
    for (let i = 0; i < 6; i++) {
        const configPath = path.join(currentDir, "project.config");
        if (fs.existsSync(configPath)) {
            try {
                const content = fs.readFileSync(configPath, "utf-8");
                const match = content.match(/project_key\s*=\s*["']?([a-zA-Z0-9_\-]+)["']?/i) || content.match(/key\s*:\s*["']?([^"']+)["']?/i);
                if (match)
                    return match[1];
            }
            catch (e) { }
        }
        const parent = path.dirname(currentDir);
        if (parent === currentDir)
            break;
        currentDir = parent;
    }
    // Clef dérivée déterministe par défaut liée au projet
    return crypto.createHash("sha256").update(startDir || process.cwd()).digest("hex");
}
function registerCrypto(env) {
    const cryptoObj = new instance_1.Instance("CryptoService");
    cryptoObj.Name = "Crypto";
    // Récupérer la clef unique du projet
    cryptoObj.SetProperty("GetProjectKey", {
        type: "native_fn",
        call: () => (0, values_1.MK_STRING)(getProjectEncryptionKey())
    });
    // Générer une nouvelle clef sécurisée
    cryptoObj.SetProperty("GenerateKey", {
        type: "native_fn",
        call: () => (0, values_1.MK_STRING)(crypto.randomBytes(32).toString("hex"))
    });
    // Chiffrement symétrique AES-256-CBC
    cryptoObj.SetProperty("Encrypt", {
        type: "native_fn",
        call: (args) => {
            const text = args[0]?.type === "string" ? args[0].value : "";
            const customKey = args[1]?.type === "string" ? args[1].value : getProjectEncryptionKey();
            const keyBuffer = crypto.createHash("sha256").update(customKey).digest();
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv("aes-256-cbc", keyBuffer, iv);
            let encrypted = cipher.update(text, "utf8", "hex");
            encrypted += cipher.final("hex");
            return (0, values_1.MK_STRING)(iv.toString("hex") + ":" + encrypted);
        }
    });
    // Déchiffrement
    cryptoObj.SetProperty("Decrypt", {
        type: "native_fn",
        call: (args) => {
            const payload = args[0]?.type === "string" ? args[0].value : "";
            const customKey = args[1]?.type === "string" ? args[1].value : getProjectEncryptionKey();
            try {
                const parts = payload.split(":");
                if (parts.length !== 2)
                    return (0, values_1.MK_STRING)("");
                const iv = Buffer.from(parts[0], "hex");
                const keyBuffer = crypto.createHash("sha256").update(customKey).digest();
                const decipher = crypto.createDecipheriv("aes-256-cbc", keyBuffer, iv);
                let decrypted = decipher.update(parts[1], "hex", "utf8");
                decrypted += decipher.final("utf8");
                return (0, values_1.MK_STRING)(decrypted);
            }
            catch (e) {
                return (0, values_1.MK_STRING)("");
            }
        }
    });
    // Hachage SHA-256
    cryptoObj.SetProperty("Hash", {
        type: "native_fn",
        call: (args) => {
            const text = args[0]?.type === "string" ? args[0].value : "";
            const hash = crypto.createHash("sha256").update(text).digest("hex");
            return (0, values_1.MK_STRING)(hash);
        }
    });
    env.declareVar("Crypto", { type: "instance", instance: cryptoObj }, "General");
}
