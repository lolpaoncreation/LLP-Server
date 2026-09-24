import * as fs from "fs";
import { Environment } from "../runtime/environment";
import { MK_NATIVE_FN, MK_NULL, MK_STRING, RuntimeVal } from "../runtime/values";

export function registerConsole(env: Environment) {
  env.declareVar(
    "print",
    MK_NATIVE_FN((args: RuntimeVal[]) => {
      const output = args.map(formatVal).join(" ");
      console.log(output);
      return MK_NULL();
    }),
    "General"
  );

  env.declareVar(
    "input",
    MK_NATIVE_FN((args: RuntimeVal[]) => {
      const prompt = args.length > 0 ? formatVal(args[0]) : "";
      if (prompt) process.stdout.write(prompt);
      try {
        const buffer = Buffer.alloc(1024);
        const bytesRead = fs.readSync(0, buffer, 0, 1024, null);
        const text = buffer.toString("utf-8", 0, bytesRead).replace(/[\r\n]+$/, "");
        return MK_STRING(text);
      } catch {
        return MK_STRING("");
      }
    }),
    "General"
  );
}

function formatVal(val: RuntimeVal | null): string {
  if (val === undefined || val === null || val.type === "null") return "null";
  if (val.type === "number" || val.type === "string" || val.type === "boolean") {
    return String(val.value);
  }
  if (val.type === "list" && val.elements) {
    return "[" + val.elements.map(e => formatVal(e)).join(", ") + "]";
  }
  if (val.type === "fixed_array" && val.elements) {
    return (
      "Array[" +
      (val.maxElements ?? val.elements.length) +
      "]{" +
      val.elements.map(e => formatVal(e)).join(", ") +
      "}"
    );
  }
  if (val.type === "instance" && val.instance) {
    return val.instance.ToString();
  }
  if (val.type === "native_fn") return "<native_fn>";
  if (val.type === "fn") return `<func ${val.name || "anonymous"}>`;
  return JSON.stringify(val);
}
