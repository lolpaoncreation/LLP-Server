"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerHexa = registerHexa;
const instance_1 = require("../runtime/instance");
const values_1 = require("../runtime/values");
function registerHexa(env) {
    const hexaObj = new instance_1.Instance("HexaModule");
    hexaObj.Name = "Hexa";
    // Hexa.toInt(hexStr)
    hexaObj.SetProperty("toInt", {
        type: "native_fn",
        call: (args) => {
            if (args.length < 1)
                return (0, values_1.MK_NUMBER)(0);
            const arg = args[0];
            if (arg.type === "number")
                return (0, values_1.MK_NUMBER)(Math.floor(arg.value));
            if (arg.type === "hexa")
                return (0, values_1.MK_NUMBER)(arg.value);
            if (arg.type === "string") {
                const str = arg.value.trim().replace(/^#/, "");
                const parsed = parseInt(str, 16);
                return (0, values_1.MK_NUMBER)(isNaN(parsed) ? 0 : parsed);
            }
            return (0, values_1.MK_NUMBER)(0);
        }
    });
    // Hexa.toHex(num, prefix?)
    hexaObj.SetProperty("toHex", {
        type: "native_fn",
        call: (args) => {
            if (args.length < 1)
                return (0, values_1.MK_STRING)("0x0");
            const arg = args[0];
            const prefix = args.length > 1 && args[1].type === "string" ? args[1].value : "0x";
            let n = 0;
            if (arg.type === "number")
                n = Math.floor(arg.value);
            else if (arg.type === "hexa")
                n = arg.value;
            else if (arg.type === "string")
                n = parseInt(arg.value.trim().replace(/^#/, ""), 16);
            const hex = Math.abs(n).toString(16).toUpperCase();
            return (0, values_1.MK_STRING)(`${n < 0 ? "-" : ""}${prefix}${hex}`);
        }
    });
    // Hexa.new(val)
    hexaObj.SetProperty("new", {
        type: "native_fn",
        call: (args) => {
            if (args.length < 1)
                return (0, values_1.MK_HEXA)(0);
            return (0, values_1.MK_HEXA)(args[0].value);
        }
    });
    env.declareVar("Hexa", { type: "instance", instance: hexaObj }, "General");
    env.declareVar("hexa", { type: "instance", instance: hexaObj }, "General");
}
