import { Environment } from "../runtime/environment";
import { RuntimeVal, MK_NULL } from "../runtime/values";
import { Debugger } from "../runtime/debugger";

export function registerBreakpoint(env: Environment) {
  env.declareVar(
    "breakpoint",
    {
      type: "native_fn",
      call: (args: RuntimeVal[]): RuntimeVal => {
        const label = args.length > 0 && args[0].type === "string" ? args[0].value : undefined;
        Debugger.hitBreakpoint(env, undefined, label);
        return MK_NULL();
      }
    },
    "General"
  );
}
