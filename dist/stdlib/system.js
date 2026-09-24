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
exports.registerSystem = registerSystem;
const os = __importStar(require("os"));
const instance_1 = require("../runtime/instance");
const values_1 = require("../runtime/values");
function registerSystem(env) {
    const sysObj = new instance_1.Instance("SystemService");
    sysObj.Name = "System";
    sysObj.SetProperty("GetOS", {
        type: "native_fn",
        call: () => (0, values_1.MK_STRING)(os.platform())
    });
    sysObj.SetProperty("Env", {
        type: "native_fn",
        call: (args) => {
            if (args.length < 1 || args[0].type !== "string")
                return (0, values_1.MK_NULL)();
            const val = process.env[args[0].value];
            return val ? (0, values_1.MK_STRING)(val) : (0, values_1.MK_NULL)();
        }
    });
    sysObj.SetProperty("Time", {
        type: "native_fn",
        call: () => (0, values_1.MK_NUMBER)(Date.now())
    });
    env.declareVar("System", { type: "instance", instance: sysObj }, "General");
}
