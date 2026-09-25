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
exports.registerConsole = registerConsole;
const fs = __importStar(require("fs"));
const values_1 = require("../runtime/values");
function registerConsole(env) {
    env.declareVar("print", (0, values_1.MK_NATIVE_FN)((args) => {
        const output = args.map(formatVal).join(" ");
        console.log(output);
        return (0, values_1.MK_NULL)();
    }), "General");
    env.declareVar("input", (0, values_1.MK_NATIVE_FN)((args) => {
        const prompt = args.length > 0 ? formatVal(args[0]) : "";
        if (prompt)
            process.stdout.write(prompt);
        try {
            const buffer = Buffer.alloc(1024);
            const bytesRead = fs.readSync(0, buffer, 0, 1024, null);
            const text = buffer.toString("utf-8", 0, bytesRead).replace(/[\r\n]+$/, "");
            return (0, values_1.MK_STRING)(text);
        }
        catch {
            return (0, values_1.MK_STRING)("");
        }
    }), "General");
}
function formatVal(val) {
    if (val === undefined || val === null || val.type === "null")
        return "null";
    if (val.type === "number" || val.type === "string" || val.type === "boolean") {
        return String(val.value);
    }
    if (val.type === "list" && val.elements) {
        return "[" + val.elements.map(e => formatVal(e)).join(", ") + "]";
    }
    if (val.type === "fixed_array" && val.elements) {
        return ("Array[" +
            (val.maxElements ?? val.elements.length) +
            "]{" +
            val.elements.map(e => formatVal(e)).join(", ") +
            "}");
    }
    if ((val.type === "instance" || val.type === "native_fn") && val.instance) {
        const customToString = val.instance.properties.get("ToString");
        if (customToString) {
            if (customToString.type === "fn") {
                try {
                    const { callLLPFunction } = require("../runtime/interpreter");
                    const res = callLLPFunction(customToString, [], customToString.declarationEnv);
                    if (res && res.type === "string")
                        return res.value;
                    if (res)
                        return formatVal(res);
                }
                catch { }
            }
            else if (customToString.type === "native_fn") {
                try {
                    const res = customToString.call([], undefined);
                    if (res && res.type === "string")
                        return res.value;
                    if (res)
                        return formatVal(res);
                }
                catch { }
            }
        }
        return val.instance.ToString();
    }
    if (val.type === "json") {
        return JSON.stringify(val.value, null, 2);
    }
    if (val.type === "hexa") {
        return val.hexString || `0x${val.value?.toString(16).toUpperCase()}`;
    }
    if (val.type === "thread") {
        return `<Thread [${val.id}] Status: ${val.status}>`;
    }
    if (val.type === "native_fn") {
        if (val.instance)
            return val.instance.ToString();
        return "<native_fn>";
    }
    if (val.type === "fn")
        return `<func ${val.name || "anonymous"}>`;
    return JSON.stringify(val);
}
