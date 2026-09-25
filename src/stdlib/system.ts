import * as os from "os";
import { Environment } from "../runtime/environment";
import { Instance } from "../runtime/instance";
import { MK_NULL, MK_NUMBER, MK_STRING, RuntimeVal } from "../runtime/values";

export function registerSystem(env: Environment) {
  const sysObj = new Instance("SystemService");
  sysObj.Name = "System";

  const getOsFn: RuntimeVal = {
    type: "native_fn",
    call: () => MK_STRING(os.platform())
  };
  sysObj.SetProperty("GetOS", getOsFn);
  sysObj.SetProperty("GetPlatform", getOsFn);

  const envFn: RuntimeVal = {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      if (args.length < 1 || args[0].type !== "string") return MK_NULL();
      const val = process.env[args[0].value];
      return val ? MK_STRING(val) : MK_NULL();
    }
  };
  sysObj.SetProperty("Env", envFn);
  sysObj.SetProperty("GetEnv", envFn);

  const timeFn: RuntimeVal = {
    type: "native_fn",
    call: () => MK_NUMBER(Date.now())
  };
  sysObj.SetProperty("Time", timeFn);
  sysObj.SetProperty("GetTimestamp", timeFn);

  sysObj.SetProperty("Sleep", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const ms = args.length > 0 && args[0].type === "number" ? args[0].value : 0;
      if (ms > 0) {
        Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
      }
      return MK_NULL();
    }
  });

  sysObj.SetProperty("Exit", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const code = args.length > 0 && args[0].type === "number" ? args[0].value : 0;
      process.exit(code);
    }
  });

  env.declareVar("System", { type: "instance", instance: sysObj }, "General");
}
