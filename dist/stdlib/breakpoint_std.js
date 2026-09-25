"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBreakpoint = registerBreakpoint;
const values_1 = require("../runtime/values");
const debugger_1 = require("../runtime/debugger");
function registerBreakpoint(env) {
    env.declareVar("breakpoint", {
        type: "native_fn",
        call: (args) => {
            const label = args.length > 0 && args[0].type === "string" ? args[0].value : undefined;
            debugger_1.Debugger.hitBreakpoint(env, undefined, label);
            return (0, values_1.MK_NULL)();
        }
    }, "General");
}
