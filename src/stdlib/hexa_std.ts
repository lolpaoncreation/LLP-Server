import { Environment } from "../runtime/environment";
import { Instance } from "../runtime/instance";
import {
  RuntimeVal,
  MK_NUMBER,
  MK_STRING,
  MK_HEXA,
  HexaVal
} from "../runtime/values";

export function registerHexa(env: Environment) {
  const hexaObj = new Instance("HexaModule");
  hexaObj.Name = "Hexa";

  // Hexa.toInt(hexStr)
  hexaObj.SetProperty("toInt", {
    type: "native_fn",
    call: (args: RuntimeVal[]): RuntimeVal => {
      if (args.length < 1) return MK_NUMBER(0);
      const arg = args[0];
      if (arg.type === "number") return MK_NUMBER(Math.floor(arg.value));
      if (arg.type === "hexa") return MK_NUMBER((arg as HexaVal).value);
      if (arg.type === "string") {
        const str = arg.value.trim().replace(/^#/, "");
        const parsed = parseInt(str, 16);
        return MK_NUMBER(isNaN(parsed) ? 0 : parsed);
      }
      return MK_NUMBER(0);
    }
  });

  // Hexa.toHex(num, prefix?)
  hexaObj.SetProperty("toHex", {
    type: "native_fn",
    call: (args: RuntimeVal[]): RuntimeVal => {
      if (args.length < 1) return MK_STRING("0x0");
      const arg = args[0];
      const prefix = args.length > 1 && args[1].type === "string" ? args[1].value : "0x";
      let n = 0;
      if (arg.type === "number") n = Math.floor(arg.value);
      else if (arg.type === "hexa") n = (arg as HexaVal).value;
      else if (arg.type === "string") n = parseInt(arg.value.trim().replace(/^#/, ""), 16);

      const hex = Math.abs(n).toString(16).toUpperCase();
      return MK_STRING(`${n < 0 ? "-" : ""}${prefix}${hex}`);
    }
  });

  // Hexa.new(val)
  hexaObj.SetProperty("new", {
    type: "native_fn",
    call: (args: RuntimeVal[]): RuntimeVal => {
      if (args.length < 1) return MK_HEXA(0);
      return MK_HEXA(args[0].value);
    }
  });

  env.declareVar("Hexa", { type: "instance", instance: hexaObj }, "General");
  env.declareVar("hexa", { type: "instance", instance: hexaObj }, "General");
}
