import { Environment } from "../runtime/environment";
import { Instance } from "../runtime/instance";
import {
  RuntimeVal,
  MK_STRING,
  MK_NULL,
  MK_JSON,
  JsonVal
} from "../runtime/values";

export function registerJson(env: Environment) {
  const jsonObj = new Instance("JsonModule");
  jsonObj.Name = "Json";

  // Json.parse(str)
  jsonObj.SetProperty("parse", {
    type: "native_fn",
    call: (args: RuntimeVal[]): RuntimeVal => {
      if (args.length < 1 || args[0].type !== "string") {
        throw new Error("[LLP Json Error] Json.parse attend une chaîne de caractères.");
      }
      try {
        const parsed = JSON.parse(args[0].value);
        return MK_JSON(parsed);
      } catch (e: any) {
        throw new Error(`[LLP Json Error] Erreur de parsing JSON: ${e.message}`);
      }
    }
  });

  // Json.stringify(val)
  jsonObj.SetProperty("stringify", {
    type: "native_fn",
    call: (args: RuntimeVal[]): RuntimeVal => {
      if (args.length < 1) return MK_STRING("null");
      const target = args[0];
      if (target.type === "json") {
        return MK_STRING(JSON.stringify(target.value));
      }
      if (target.type === "string" || target.type === "number" || target.type === "boolean") {
        return MK_STRING(JSON.stringify(target.value));
      }
      if (target.type === "list" && target.elements) {
        return MK_STRING(JSON.stringify(target.elements.map(e => e?.value ?? null)));
      }
      return MK_STRING(JSON.stringify(target));
    }
  });

  // Json.new(data?)
  jsonObj.SetProperty("new", {
    type: "native_fn",
    call: (args: RuntimeVal[]): RuntimeVal => {
      if (args.length === 0) return MK_JSON({});
      if (args[0].type === "json") return args[0];
      if (args[0].type === "string") {
        try {
          return MK_JSON(JSON.parse(args[0].value));
        } catch {
          return MK_JSON(args[0].value);
        }
      }
      return MK_JSON(args[0].value ?? {});
    }
  });

  env.declareVar("Json", { type: "instance", instance: jsonObj }, "General");
  env.declareVar("JSON", { type: "instance", instance: jsonObj }, "General");
}
