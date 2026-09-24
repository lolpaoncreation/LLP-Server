import * as os from "os";
import { Environment } from "../runtime/environment";
import { Instance } from "../runtime/instance";
import { MK_NULL, MK_NUMBER, MK_STRING, RuntimeVal } from "../runtime/values";

export function registerSystem(env: Environment) {
  const sysObj = new Instance("SystemService");
  sysObj.Name = "System";

  sysObj.SetProperty("GetOS", {
    type: "native_fn",
    call: () => MK_STRING(os.platform())
  });

  sysObj.SetProperty("Env", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      if (args.length < 1 || args[0].type !== "string") return MK_NULL();
      const val = process.env[args[0].value];
      return val ? MK_STRING(val) : MK_NULL();
    }
  });

  sysObj.SetProperty("Time", {
    type: "native_fn",
    call: () => MK_NUMBER(Date.now())
  });

  env.declareVar("System", { type: "instance", instance: sysObj }, "General");
}
