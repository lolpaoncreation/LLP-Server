import * as fs from "fs";
import * as path from "path";
import { Environment } from "../runtime/environment";
import { Instance } from "../runtime/instance";
import { MK_BOOL, MK_NULL, MK_STRING, MK_NUMBER, RuntimeVal } from "../runtime/values";
import { callLLPFunction, wrapRawValue, unwrapRuntimeVal } from "../runtime/interpreter";
import { attachInstanceMethods } from "./instance_std";
import { findProjectIllpFile, parseIllpTree } from "../gui/app_runner";

export interface PendingUiUpdate {
  id: string;
  prop: string;
  value: any;
}

export class UIElementManager {
  private static instance: UIElementManager;
  public rootUI: Instance;
  public elementsMap: Map<string, Instance> = new Map();
  public pendingUpdates: PendingUiUpdate[] = [];
  private hasAutoLoaded: boolean = false;

  private constructor() {
    this.rootUI = new Instance("UIService");
    this.rootUI.Name = "UI";
    attachInstanceMethods(this.rootUI);

    // Setup global instance update listener
    Instance.onPropertyUpdated = (inst: Instance, propName: string, val: RuntimeVal) => {
      if (inst && inst.Name && this.elementsMap.has(inst.Name)) {
        this.addPendingUpdate(inst.Name, propName, unwrapRuntimeVal(val));
      }
    };
  }

  public static getInstance(): UIElementManager {
    if (!UIElementManager.instance) {
      UIElementManager.instance = new UIElementManager();
    }
    return UIElementManager.instance;
  }

  public addPendingUpdate(id: string, prop: string, value: any): void {
    this.pendingUpdates.push({ id, prop, value });
  }

  public getAndClearPendingUpdates(): PendingUiUpdate[] {
    const updates = [...this.pendingUpdates];
    this.pendingUpdates = [];
    return updates;
  }

  public autoLoad(baseDir?: string): boolean {
    if (this.hasAutoLoaded && this.elementsMap.size > 0) return true;
    const projectDir = baseDir || process.cwd();
    const illpInfo = findProjectIllpFile(projectDir);
    if (illpInfo && fs.existsSync(illpInfo.illpPath)) {
      this.loadIllpFile(illpInfo.illpPath);
      this.hasAutoLoaded = true;
      return true;
    }
    return false;
  }

  public loadIllpFile(filePath: string): Instance {
    const absPath = path.resolve(filePath);
    if (!fs.existsSync(absPath)) {
      throw new Error(`[LLP UI Error] Impossible de trouver le fichier d'interface : ${filePath}`);
    }

    const code = fs.readFileSync(absPath, "utf-8");
    const tree = parseIllpTree(code);

    // Clear old elements under rootUI
    for (const child of this.rootUI.GetChildren()) {
      this.rootUI.RemoveChild(child);
    }
    this.elementsMap.clear();

    const buildInstanceTree = (nodes: any[], parentInst: Instance) => {
      for (const node of nodes) {
        const elemInst = new Instance(node.type, parentInst, absPath);
        elemInst.Name = node.name;
        attachInstanceMethods(elemInst);

        // Populate properties from .illp
        for (const [key, val] of Object.entries(node.props || {})) {
          const rawVal = val as any;
          elemInst.SetProperty(key, wrapRawValue(rawVal));
          // Normalize text & values
          const kLower = key.toLowerCase();
          if (kLower === "text" || kLower === "content" || kLower === "label" || kLower === "title") {
            elemInst.SetProperty("txt", wrapRawValue(rawVal));
            elemInst.SetProperty("text", wrapRawValue(rawVal));
          }
          if (kLower === "value" || kLower === "default") {
            elemInst.SetProperty("val", wrapRawValue(rawVal));
            elemInst.SetProperty("value", wrapRawValue(rawVal));
          }
        }

        // Register in elementsMap
        this.elementsMap.set(node.name, elemInst);

        // Recurse children
        if (node.children && node.children.length > 0) {
          buildInstanceTree(node.children, elemInst);
        }
      }
    };

    buildInstanceTree(tree, this.rootUI);
    this.hasAutoLoaded = true;
    return this.rootUI;
  }

  public getElement(nameOrId: string): Instance | null {
    if (!nameOrId) return null;
    if (this.elementsMap.size === 0 && !this.hasAutoLoaded) {
      this.autoLoad();
    }

    if (this.elementsMap.has(nameOrId)) {
      return this.elementsMap.get(nameOrId)!;
    }

    // Case-insensitive search
    const lower = nameOrId.toLowerCase();
    for (const [key, inst] of this.elementsMap.entries()) {
      if (key.toLowerCase() === lower) {
        return inst;
      }
    }

    // Search among rootUI descendants
    const descendant = this.rootUI.GetDescendants().find(
      d => d.Name === nameOrId || d.Name.toLowerCase() === lower
    );
    if (descendant) {
      this.elementsMap.set(descendant.Name, descendant);
      return descendant;
    }

    return null;
  }

  public setText(nameOrId: string, text: string): boolean {
    const elem = this.getElement(nameOrId);
    if (!elem) return false;
    elem.SetProperty("txt", MK_STRING(text));
    return true;
  }

  public getText(nameOrId: string): string {
    const elem = this.getElement(nameOrId);
    if (!elem) return "";
    const p = elem.GetProperty("txt");
    return p && p.type === "string" ? p.value : String((p as any)?.value ?? "");
  }

  public setValue(nameOrId: string, val: any): boolean {
    const elem = this.getElement(nameOrId);
    if (!elem) return false;
    elem.SetProperty("value", wrapRawValue(val));
    return true;
  }

  public getValue(nameOrId: string): any {
    const elem = this.getElement(nameOrId);
    if (!elem) return null;
    return unwrapRuntimeVal(elem.GetProperty("value"));
  }

  public setVisible(nameOrId: string, visible: boolean): boolean {
    const elem = this.getElement(nameOrId);
    if (!elem) return false;
    elem.SetProperty("visible", MK_BOOL(visible));
    return true;
  }

  public applyBrowserEvent(id: string, event: string, value: any): void {
    const elem = this.getElement(id);
    if (!elem) return;

    if (event === "input" || event === "change") {
      elem.SetProperty("value", wrapRawValue(value));
      const callback = elem.GetProperty("_onChangeCallback");
      if (callback && callback.type === "fn") {
        try {
          callLLPFunction(callback, [wrapRawValue(value)], (callback as any).declarationEnv);
        } catch (err: any) {
          console.error(`[LLP UI Event Error in ${id} onChange]:`, err.message || err);
        }
      }
    } else if (event === "click") {
      const callback = elem.GetProperty("_onClickCallback");
      if (callback && callback.type === "fn") {
        try {
          callLLPFunction(callback, [], (callback as any).declarationEnv);
        } catch (err: any) {
          console.error(`[LLP UI Event Error in ${id} onClick]:`, err.message || err);
        }
      }
    }
  }
}

export function registerUI(env: Environment): void {
  const manager = UIElementManager.getInstance();
  const uiInst = manager.rootUI;

  // 1. UI.GetElement(nameOrId) / UI.Get(nameOrId) / UI.Find(nameOrId)
  const getElemFn: any = {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      if (args.length < 1 || args[0].type !== "string") return MK_NULL();
      const elem = manager.getElement(args[0].value);
      if (!elem) return MK_NULL();
      return { type: "instance", instance: elem };
    }
  };

  // 2. UI.SetText(nameOrId, text)
  const setTextFn: any = {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      if (args.length < 2 || args[0].type !== "string") return MK_BOOL(false);
      const textVal = args[1].type === "string" ? args[1].value : String((args[1] as any)?.value ?? "");
      const ok = manager.setText(args[0].value, textVal);
      return MK_BOOL(ok);
    }
  };

  // 3. UI.GetText(nameOrId)
  const getTextFn: any = {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      if (args.length < 1 || args[0].type !== "string") return MK_STRING("");
      return MK_STRING(manager.getText(args[0].value));
    }
  };

  // 4. UI.SetValue(nameOrId, val)
  const setValueFn: any = {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      if (args.length < 2 || args[0].type !== "string") return MK_BOOL(false);
      const ok = manager.setValue(args[0].value, unwrapRuntimeVal(args[1]));
      return MK_BOOL(ok);
    }
  };

  // 5. UI.GetValue(nameOrId)
  const getValueFn: any = {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      if (args.length < 1 || args[0].type !== "string") return MK_NULL();
      return wrapRawValue(manager.getValue(args[0].value));
    }
  };

  // 6. UI.SetVisible(nameOrId, visible)
  const setVisibleFn: any = {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      if (args.length < 2 || args[0].type !== "string") return MK_BOOL(false);
      const vis = args[1].type === "boolean" ? args[1].value : Boolean((args[1] as any)?.value);
      const ok = manager.setVisible(args[0].value, vis);
      return MK_BOOL(ok);
    }
  };

  // 7. UI.GetAllElements()
  const getAllFn: any = {
    type: "native_fn",
    call: () => {
      manager.autoLoad();
      const list = Array.from(manager.elementsMap.values()).map(inst => ({
        type: "instance",
        instance: inst
      }));
      return {
        type: "list",
        elementType: "General",
        elements: list
      };
    }
  };

  // 8. UI.CreateElement(tag, name, props)
  const createElemFn: any = {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const tag = args.length > 0 && args[0].type === "string" ? args[0].value : "Element";
      const name = args.length > 1 && args[1].type === "string" ? args[1].value : tag;
      const elem = new Instance(tag, manager.rootUI);
      elem.Name = name;
      attachInstanceMethods(elem);
      manager.elementsMap.set(name, elem);
      return { type: "instance", instance: elem };
    }
  };

  // 9. UI.Load(filePath)
  const loadFn: any = {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      if (args.length > 0 && args[0].type === "string") {
        manager.loadIllpFile(args[0].value);
        return MK_BOOL(true);
      }
      return MK_BOOL(false);
    }
  };

  // 10. UI.AutoLoad()
  const autoLoadFn: any = {
    type: "native_fn",
    call: () => MK_BOOL(manager.autoLoad())
  };

  uiInst.SetProperty("GetElement", getElemFn);
  uiInst.SetProperty("Get", getElemFn);
  uiInst.SetProperty("Find", getElemFn);
  uiInst.SetProperty("GetElementById", getElemFn);
  uiInst.SetProperty("SetText", setTextFn);
  uiInst.SetProperty("GetText", getTextFn);
  uiInst.SetProperty("SetValue", setValueFn);
  uiInst.SetProperty("GetValue", getValueFn);
  uiInst.SetProperty("SetVisible", setVisibleFn);
  uiInst.SetProperty("GetAllElements", getAllFn);
  uiInst.SetProperty("CreateElement", createElemFn);
  uiInst.SetProperty("Load", loadFn);
  uiInst.SetProperty("AutoLoad", autoLoadFn);

  // Expose global UI
  env.declareVar("UI", { type: "instance", instance: uiInst }, "General");

  // Expose global GetElement shortcut function
  env.declareVar("GetElement", getElemFn, "General");

  // Augment Interface object with UI methods if already registered
  try {
    const ifaceVal = env.lookupVar("Interface");
    if (ifaceVal && ifaceVal.type === "instance" && ifaceVal.instance) {
      const iface = ifaceVal.instance;
      iface.SetProperty("GetElement", getElemFn);
      iface.SetProperty("Get", getElemFn);
      iface.SetProperty("Find", getElemFn);
      iface.SetProperty("GetElementById", getElemFn);
      iface.SetProperty("SetText", setTextFn);
      iface.SetProperty("GetText", getTextFn);
      iface.SetProperty("SetValue", setValueFn);
      iface.SetProperty("GetValue", getValueFn);
      iface.SetProperty("SetVisible", setVisibleFn);
      iface.SetProperty("GetAllElements", getAllFn);
      iface.SetProperty("CreateElement", createElemFn);
      iface.SetProperty("Load", loadFn);
      iface.SetProperty("AutoLoad", autoLoadFn);
    }
  } catch (_) {}
}
