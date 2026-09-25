import * as fs from "fs";
import * as path from "path";
import { Environment } from "../runtime/environment";
import { Instance } from "../runtime/instance";
import { MK_BOOL, MK_NULL, MK_STRING, RuntimeVal } from "../runtime/values";

export function registerFileSystem(env: Environment) {
  // Create File Instance
  const fileObj = new Instance("FileService");
  fileObj.Name = "File";

  fileObj.SetProperty("Read", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      if (args.length < 1 || args[0].type !== "string") {
        throw new Error("[File.Read] Chemin de fichier string attendu.");
      }
      const filePath = args[0].value;
      if (!fs.existsSync(filePath)) {
        throw new Error(`[File.Read] Le fichier '${filePath}' n'existe pas.`);
      }
      const content = fs.readFileSync(filePath, "utf-8");
      return MK_STRING(content);
    }
  });

  fileObj.SetProperty("Write", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      if (args.length < 2 || args[0].type !== "string") {
        throw new Error("[File.Write] Arguments attendus: (path: string, content: string).");
      }
      const filePath = args[0].value;
      const content = String(args[1].value ?? "");
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, content, "utf-8");
      return MK_BOOL(true);
    }
  });

  fileObj.SetProperty("Append", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      if (args.length < 2 || args[0].type !== "string") {
        throw new Error("[File.Append] Arguments attendus: (path: string, content: string).");
      }
      const filePath = args[0].value;
      const content = String(args[1].value ?? "");
      fs.appendFileSync(filePath, content, "utf-8");
      return MK_BOOL(true);
    }
  });

  fileObj.SetProperty("Exists", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      if (args.length < 1 || args[0].type !== "string") return MK_BOOL(false);
      return MK_BOOL(fs.existsSync(args[0].value));
    }
  });

  fileObj.SetProperty("Delete", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      if (args.length < 1 || args[0].type !== "string") return MK_BOOL(false);
      if (fs.existsSync(args[0].value)) {
        fs.unlinkSync(args[0].value);
        return MK_BOOL(true);
      }
      return MK_BOOL(false);
    }
  });

  env.declareVar("File", { type: "instance", instance: fileObj }, "General");

  // Create Directory Instance
  const dirObj = new Instance("DirectoryService");
  dirObj.Name = "Directory";

  const listFn: RuntimeVal = {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const dirPath = args.length > 0 && args[0].type === "string" ? args[0].value : ".";
      if (!fs.existsSync(dirPath)) {
        return { type: "list", elementType: "string", elements: [] };
      }
      const files = fs.readdirSync(dirPath);
      return {
        type: "list",
        elementType: "string",
        elements: files.map(f => MK_STRING(f))
      };
    }
  };
  dirObj.SetProperty("List", listFn);
  dirObj.SetProperty("ListFiles", listFn);

  dirObj.SetProperty("Create", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      if (args.length < 1 || args[0].type !== "string") return MK_BOOL(false);
      fs.mkdirSync(args[0].value, { recursive: true });
      return MK_BOOL(true);
    }
  });

  dirObj.SetProperty("Exists", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      if (args.length < 1 || args[0].type !== "string") return MK_BOOL(false);
      try {
        return MK_BOOL(fs.existsSync(args[0].value) && fs.statSync(args[0].value).isDirectory());
      } catch {
        return MK_BOOL(false);
      }
    }
  });

  dirObj.SetProperty("Delete", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      if (args.length < 1 || args[0].type !== "string") return MK_BOOL(false);
      try {
        if (fs.existsSync(args[0].value)) {
          fs.rmSync(args[0].value, { recursive: true, force: true });
          return MK_BOOL(true);
        }
      } catch {}
      return MK_BOOL(false);
    }
  });

  env.declareVar("Directory", { type: "instance", instance: dirObj }, "General");
}
