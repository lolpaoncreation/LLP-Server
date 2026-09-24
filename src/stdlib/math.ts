import { Environment } from "../runtime/environment";
import { Instance } from "../runtime/instance";
import { MK_NUMBER, RuntimeVal } from "../runtime/values";

export function registerMath(env: Environment) {
  // Constante universelle PY et PI accessible partout
  const PY_VALUE = 3.141592653589793;
  env.declareVar("PY", MK_NUMBER(PY_VALUE), "float");
  env.declareVar("PI", MK_NUMBER(PY_VALUE), "float");

  const mathObj = new Instance("MathService");
  mathObj.Name = "Math";

  mathObj.SetProperty("PY", MK_NUMBER(PY_VALUE));
  mathObj.SetProperty("PI", MK_NUMBER(PY_VALUE));

  mathObj.SetProperty("Abs", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const val = args[0]?.type === "number" ? args[0].value : 0;
      return MK_NUMBER(Math.abs(val));
    }
  });

  mathObj.SetProperty("Floor", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const val = args[0]?.type === "number" ? args[0].value : 0;
      return MK_NUMBER(Math.floor(val));
    }
  });

  mathObj.SetProperty("Ceil", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const val = args[0]?.type === "number" ? args[0].value : 0;
      return MK_NUMBER(Math.ceil(val));
    }
  });

  mathObj.SetProperty("Round", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const val = args[0]?.type === "number" ? args[0].value : 0;
      return MK_NUMBER(Math.round(val));
    }
  });

  mathObj.SetProperty("Sqrt", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const val = args[0]?.type === "number" ? args[0].value : 0;
      return MK_NUMBER(Math.sqrt(val));
    }
  });

  mathObj.SetProperty("Pow", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const base = args[0]?.type === "number" ? args[0].value : 0;
      const exp = args[1]?.type === "number" ? args[1].value : 1;
      return MK_NUMBER(Math.pow(base, exp));
    }
  });

  mathObj.SetProperty("Min", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const a = args[0]?.type === "number" ? args[0].value : 0;
      const b = args[1]?.type === "number" ? args[1].value : 0;
      return MK_NUMBER(Math.min(a, b));
    }
  });

  mathObj.SetProperty("Max", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const a = args[0]?.type === "number" ? args[0].value : 0;
      const b = args[1]?.type === "number" ? args[1].value : 0;
      return MK_NUMBER(Math.max(a, b));
    }
  });

  mathObj.SetProperty("Random", {
    type: "native_fn",
    call: () => MK_NUMBER(Math.random())
  });

  mathObj.SetProperty("Sin", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const val = args[0]?.type === "number" ? args[0].value : 0;
      return MK_NUMBER(Math.sin(val));
    }
  });

  mathObj.SetProperty("Cos", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const val = args[0]?.type === "number" ? args[0].value : 0;
      return MK_NUMBER(Math.cos(val));
    }
  });

  env.declareVar("Math", { type: "instance", instance: mathObj }, "General");
}
