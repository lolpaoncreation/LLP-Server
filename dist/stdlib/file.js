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
exports.registerFileSystem = registerFileSystem;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const instance_1 = require("../runtime/instance");
const values_1 = require("../runtime/values");
function registerFileSystem(env) {
    // Create File Instance
    const fileObj = new instance_1.Instance("FileService");
    fileObj.Name = "File";
    fileObj.SetProperty("Read", {
        type: "native_fn",
        call: (args) => {
            if (args.length < 1 || args[0].type !== "string") {
                throw new Error("[File.Read] Chemin de fichier string attendu.");
            }
            const filePath = args[0].value;
            if (!fs.existsSync(filePath)) {
                throw new Error(`[File.Read] Le fichier '${filePath}' n'existe pas.`);
            }
            const content = fs.readFileSync(filePath, "utf-8");
            return (0, values_1.MK_STRING)(content);
        }
    });
    fileObj.SetProperty("Write", {
        type: "native_fn",
        call: (args) => {
            if (args.length < 2 || args[0].type !== "string") {
                throw new Error("[File.Write] Arguments attendus: (path: string, content: string).");
            }
            const filePath = args[0].value;
            const content = String(args[1].value ?? "");
            const dir = path.dirname(filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(filePath, content, "utf-8");
            return (0, values_1.MK_BOOL)(true);
        }
    });
    fileObj.SetProperty("Append", {
        type: "native_fn",
        call: (args) => {
            if (args.length < 2 || args[0].type !== "string") {
                throw new Error("[File.Append] Arguments attendus: (path: string, content: string).");
            }
            const filePath = args[0].value;
            const content = String(args[1].value ?? "");
            fs.appendFileSync(filePath, content, "utf-8");
            return (0, values_1.MK_BOOL)(true);
        }
    });
    fileObj.SetProperty("Exists", {
        type: "native_fn",
        call: (args) => {
            if (args.length < 1 || args[0].type !== "string")
                return (0, values_1.MK_BOOL)(false);
            return (0, values_1.MK_BOOL)(fs.existsSync(args[0].value));
        }
    });
    fileObj.SetProperty("Delete", {
        type: "native_fn",
        call: (args) => {
            if (args.length < 1 || args[0].type !== "string")
                return (0, values_1.MK_BOOL)(false);
            if (fs.existsSync(args[0].value)) {
                fs.unlinkSync(args[0].value);
                return (0, values_1.MK_BOOL)(true);
            }
            return (0, values_1.MK_BOOL)(false);
        }
    });
    env.declareVar("File", { type: "instance", instance: fileObj }, "General");
    // Create Directory Instance
    const dirObj = new instance_1.Instance("DirectoryService");
    dirObj.Name = "Directory";
    dirObj.SetProperty("List", {
        type: "native_fn",
        call: (args) => {
            const dirPath = args.length > 0 && args[0].type === "string" ? args[0].value : ".";
            if (!fs.existsSync(dirPath)) {
                return { type: "list", elementType: "string", elements: [] };
            }
            const files = fs.readdirSync(dirPath);
            return {
                type: "list",
                elementType: "string",
                elements: files.map(f => (0, values_1.MK_STRING)(f))
            };
        }
    });
    dirObj.SetProperty("Create", {
        type: "native_fn",
        call: (args) => {
            if (args.length < 1 || args[0].type !== "string")
                return (0, values_1.MK_BOOL)(false);
            fs.mkdirSync(args[0].value, { recursive: true });
            return (0, values_1.MK_BOOL)(true);
        }
    });
    env.declareVar("Directory", { type: "instance", instance: dirObj }, "General");
}
