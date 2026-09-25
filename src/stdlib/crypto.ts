import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";
import { Environment } from "../runtime/environment";
import { Instance } from "../runtime/instance";
import { MK_STRING, RuntimeVal } from "../runtime/values";

// Trouver la clef unique du projet
export function getProjectEncryptionKey(startDir?: string): string {
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
        if (match) return match[1];
      } catch (e) {}
    }
    const parent = path.dirname(currentDir);
    if (parent === currentDir) break;
    currentDir = parent;
  }
  // Clef dérivée déterministe par défaut liée au projet
  return crypto.createHash("sha256").update(startDir || process.cwd()).digest("hex");
}

export function registerCrypto(env: Environment) {
  const cryptoObj = new Instance("CryptoService");
  cryptoObj.Name = "Crypto";

  // Récupérer la clef unique du projet
  cryptoObj.SetProperty("GetProjectKey", {
    type: "native_fn",
    call: () => MK_STRING(getProjectEncryptionKey())
  });

  // Générer une nouvelle clef sécurisée
  cryptoObj.SetProperty("GenerateKey", {
    type: "native_fn",
    call: () => MK_STRING(crypto.randomBytes(32).toString("hex"))
  });

  // Chiffrement symétrique AES-256-CBC
  cryptoObj.SetProperty("Encrypt", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const text = args[0]?.type === "string" ? args[0].value : "";
      const customKey = args[1]?.type === "string" ? args[1].value : getProjectEncryptionKey();
      const keyBuffer = crypto.createHash("sha256").update(customKey).digest();
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv("aes-256-cbc", keyBuffer, iv);
      let encrypted = cipher.update(text, "utf8", "hex");
      encrypted += cipher.final("hex");
      return MK_STRING(iv.toString("hex") + ":" + encrypted);
    }
  });

  // Déchiffrement
  cryptoObj.SetProperty("Decrypt", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const payload = args[0]?.type === "string" ? args[0].value : "";
      const customKey = args[1]?.type === "string" ? args[1].value : getProjectEncryptionKey();
      try {
        const parts = payload.split(":");
        if (parts.length !== 2) return MK_STRING("");
        const iv = Buffer.from(parts[0], "hex");
        const keyBuffer = crypto.createHash("sha256").update(customKey).digest();
        const decipher = crypto.createDecipheriv("aes-256-cbc", keyBuffer, iv);
        let decrypted = decipher.update(parts[1], "hex", "utf8");
        decrypted += decipher.final("utf8");
        return MK_STRING(decrypted);
      } catch (e) {
        return MK_STRING("");
      }
    }
  });

  // Hachage SHA-256
  const hashFn: RuntimeVal = {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const text = args[0]?.type === "string" ? args[0].value : "";
      const hash = crypto.createHash("sha256").update(text).digest("hex");
      return MK_STRING(hash);
    }
  };
  cryptoObj.SetProperty("Hash", hashFn);
  cryptoObj.SetProperty("ComputeHash", hashFn);

  env.declareVar("Crypto", { type: "instance", instance: cryptoObj }, "General");
}
