"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerJson = registerJson;
const instance_1 = require("../runtime/instance");
const values_1 = require("../runtime/values");
function registerJson(env) {
    const jsonObj = new instance_1.Instance("JsonModule");
    jsonObj.Name = "Json";
    // Json.parse(str)
    jsonObj.SetProperty("parse", {
        type: "native_fn",
        call: (args) => {
            if (args.length < 1 || args[0].type !== "string") {
                throw new Error("[LLP Json Error] Json.parse attend une chaîne de caractères.");
            }
            try {
                const parsed = JSON.parse(args[0].value);
                return (0, values_1.MK_JSON)(parsed);
            }
            catch (e) {
                throw new Error(`[LLP Json Error] Erreur de parsing JSON: ${e.message}`);
            }
        }
    });
    // Json.stringify(val)
    jsonObj.SetProperty("stringify", {
        type: "native_fn",
        call: (args) => {
            if (args.length < 1)
                return (0, values_1.MK_STRING)("null");
            const target = args[0];
            if (target.type === "json") {
                return (0, values_1.MK_STRING)(JSON.stringify(target.value));
            }
            if (target.type === "string" || target.type === "number" || target.type === "boolean") {
                return (0, values_1.MK_STRING)(JSON.stringify(target.value));
            }
            if (target.type === "list" && target.elements) {
                return (0, values_1.MK_STRING)(JSON.stringify(target.elements.map(e => e?.value ?? null)));
            }
            return (0, values_1.MK_STRING)(JSON.stringify(target));
        }
    });
    // Json.new(data?)
    jsonObj.SetProperty("new", {
        type: "native_fn",
        call: (args) => {
            if (args.length === 0)
                return (0, values_1.MK_JSON)({});
            if (args[0].type === "json")
                return args[0];
            if (args[0].type === "string") {
                try {
                    return (0, values_1.MK_JSON)(JSON.parse(args[0].value));
                }
                catch {
                    return (0, values_1.MK_JSON)(args[0].value);
                }
            }
            return (0, values_1.MK_JSON)(args[0].value ?? {});
        }
    });
    env.declareVar("Json", { type: "instance", instance: jsonObj }, "General");
    env.declareVar("JSON", { type: "instance", instance: jsonObj }, "General");
}
