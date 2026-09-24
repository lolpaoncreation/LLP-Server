"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUIValidator = registerUIValidator;
const instance_1 = require("../runtime/instance");
const values_1 = require("../runtime/values");
function registerUIValidator(env) {
    const validatorObj = new instance_1.Instance("UIValidatorService");
    validatorObj.Name = "UIValidator";
    validatorObj.SetProperty("ValidateEmail", {
        type: "native_fn",
        call: (args) => {
            const email = args[0]?.type === "string" ? args[0].value : "";
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            return (0, values_1.MK_BOOL)(emailRegex.test(email));
        }
    });
    validatorObj.SetProperty("ValidateRequired", {
        type: "native_fn",
        call: (args) => {
            const str = args[0]?.type === "string" ? args[0].value.trim() : "";
            return (0, values_1.MK_BOOL)(str.length > 0);
        }
    });
    validatorObj.SetProperty("ValidateLength", {
        type: "native_fn",
        call: (args) => {
            const str = args[0]?.type === "string" ? args[0].value : "";
            const min = args[1]?.type === "number" ? args[1].value : 0;
            const max = args[2]?.type === "number" ? args[2].value : 999999;
            return (0, values_1.MK_BOOL)(str.length >= min && str.length <= max);
        }
    });
    validatorObj.SetProperty("ValidateNumber", {
        type: "native_fn",
        call: (args) => {
            if (args[0]?.type === "number")
                return (0, values_1.MK_BOOL)(true);
            if (args[0]?.type === "string")
                return (0, values_1.MK_BOOL)(!isNaN(Number(args[0].value)));
            return (0, values_1.MK_BOOL)(false);
        }
    });
    validatorObj.SetProperty("ShowError", {
        type: "native_fn",
        call: (args) => {
            const field = args[0]?.type === "string" ? args[0].value : "Field";
            const msg = args[1]?.type === "string" ? args[1].value : "Validation error";
            console.log(`[Validation Error] ${field} : ${msg}`);
            return (0, values_1.MK_STRING)(`[Error] ${field}: ${msg}`);
        }
    });
    validatorObj.SetProperty("ShowSuccess", {
        type: "native_fn",
        call: (args) => {
            const msg = args[0]?.type === "string" ? args[0].value : "Operation successful";
            console.log(`[Validation Success] ${msg}`);
            return (0, values_1.MK_STRING)(`[Success] ${msg}`);
        }
    });
    env.declareVar("UIValidator", { type: "instance", instance: validatorObj }, "General");
}
