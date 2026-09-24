import { Environment } from "../runtime/environment";
import { Instance } from "../runtime/instance";
import { MK_BOOL, MK_NULL, MK_STRING, RuntimeVal } from "../runtime/values";

export function registerUIValidator(env: Environment) {
  const validatorObj = new Instance("UIValidatorService");
  validatorObj.Name = "UIValidator";

  validatorObj.SetProperty("ValidateEmail", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const email = args[0]?.type === "string" ? args[0].value : "";
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return MK_BOOL(emailRegex.test(email));
    }
  });

  validatorObj.SetProperty("ValidateRequired", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const str = args[0]?.type === "string" ? args[0].value.trim() : "";
      return MK_BOOL(str.length > 0);
    }
  });

  validatorObj.SetProperty("ValidateLength", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const str = args[0]?.type === "string" ? args[0].value : "";
      const min = args[1]?.type === "number" ? args[1].value : 0;
      const max = args[2]?.type === "number" ? args[2].value : 999999;
      return MK_BOOL(str.length >= min && str.length <= max);
    }
  });

  validatorObj.SetProperty("ValidateNumber", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      if (args[0]?.type === "number") return MK_BOOL(true);
      if (args[0]?.type === "string") return MK_BOOL(!isNaN(Number(args[0].value)));
      return MK_BOOL(false);
    }
  });

  validatorObj.SetProperty("ShowError", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const field = args[0]?.type === "string" ? args[0].value : "Field";
      const msg = args[1]?.type === "string" ? args[1].value : "Validation error";
      console.log(`[Validation Error] ${field} : ${msg}`);
      return MK_STRING(`[Error] ${field}: ${msg}`);
    }
  });

  validatorObj.SetProperty("ShowSuccess", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const msg = args[0]?.type === "string" ? args[0].value : "Operation successful";
      console.log(`[Validation Success] ${msg}`);
      return MK_STRING(`[Success] ${msg}`);
    }
  });

  env.declareVar("UIValidator", { type: "instance", instance: validatorObj }, "General");
}
