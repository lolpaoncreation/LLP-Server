import { RuntimeVal, MK_NULL } from "./values";

export class Instance {
  public ClassName: string;
  public Name: string;
  public SourceFile: string = "";
  private _parent: Instance | null = null;
  private _children: Instance[] = [];
  public properties: Map<string, RuntimeVal> = new Map();

  // Event Listeners (Signals)
  private childAddedListeners: ((child: Instance) => void)[] = [];
  private childRemovedListeners: ((child: Instance) => void)[] = [];

  constructor(className: string = "Instance", parent: Instance | null = null, sourceFile: string = "") {
    this.ClassName = className;
    this.Name = className;
    this.SourceFile = sourceFile;
    if (parent) {
      this.SetParent(parent);
    }
  }

  public get Parent(): Instance | null {
    return this._parent;
  }

  public SetParent(newParent: Instance | null) {
    if (this._parent === newParent) return;

    // Remove from old parent
    if (this._parent) {
      this._parent.RemoveChild(this);
    }

    this._parent = newParent;

    // Add to new parent
    if (newParent) {
      newParent.AddChild(this);
    }
  }

  public AddChild(child: Instance) {
    if (!this._children.includes(child)) {
      this._children.push(child);
      child._parent = this;
      this.fireChildAdded(child);
    }
  }

  public RemoveChild(child: Instance) {
    const index = this._children.indexOf(child);
    if (index !== -1) {
      this._children.splice(index, 1);
      child._parent = null;
      this.fireChildRemoved(child);
    }
  }

  public GetChildren(): Instance[] {
    return [...this._children];
  }

  public FindFirstChild(name: string): Instance | null {
    return this._children.find(child => child.Name === name) ?? null;
  }

  public GetDescendants(): Instance[] {
    const descendants: Instance[] = [];
    for (const child of this._children) {
      descendants.push(child);
      descendants.push(...child.GetDescendants());
    }
    return descendants;
  }

  public Destroy(): void {
    if (this._parent) {
      this._parent.RemoveChild(this);
    }
    for (const child of [...this._children]) {
      child.Destroy();
    }
    this._children = [];
    this.properties.clear();
  }

  public Clone(): Instance {
    const clone = new Instance(this.ClassName);
    clone.Name = this.Name;
    for (const [key, val] of this.properties.entries()) {
      clone.properties.set(key, { ...val });
    }
    for (const child of this._children) {
      const childClone = child.Clone();
      childClone.SetParent(clone);
    }
    return clone;
  }

  public OnChildAdded(listener: (child: Instance) => void) {
    this.childAddedListeners.push(listener);
  }

  public OnChildRemoved(listener: (child: Instance) => void) {
    this.childRemovedListeners.push(listener);
  }

  private fireChildAdded(child: Instance) {
    for (const listener of this.childAddedListeners) {
      listener(child);
    }
  }

  private fireChildRemoved(child: Instance) {
    for (const listener of this.childRemovedListeners) {
      listener(child);
    }
  }

  public ToString(): string {
    const custom = this.properties.get("ToString");
    if (custom && custom.type === "fn") {
      try {
        const { callLLPFunction } = require("./interpreter");
        const res = callLLPFunction(custom as any, [], (custom as any).declarationEnv);
        if (res && res.type === "string") return res.value;
        if (res && res.value !== undefined) return String(res.value);
      } catch (err: any) {
        console.error(`[LLP ToString Execution Error in ${this.Name || this.ClassName}]:`, err.message || err);
      }
    }
    const chain: string[] = [];
    if (this.SourceFile) {
      const baseFile = this.SourceFile.replace(/^.*[\\\/]/, "");
      chain.push(baseFile);
    }
    let curr: Instance | null = this._parent;
    const parentChain: string[] = [];
    while (curr) {
      parentChain.unshift(curr.Name || curr.ClassName);
      curr = curr.Parent;
    }
    chain.push(...parentChain);
    chain.push(this.Name || this.ClassName);

    return `[${chain.join(" > ")}]`;
  }

  // Global listener for property updates (e.g. GUI live sync)
  public static onPropertyUpdated?: (instance: Instance, propName: string, value: RuntimeVal) => void;

  public SetProperty(propName: string, val: RuntimeVal) {
    if (propName === "Name" && val.type === "string") {
      this.Name = val.value;
    } else if (propName === "SourceFile" && val.type === "string") {
      this.SourceFile = val.value;
    } else if (propName === "Parent") {
      if (val.type === "instance") {
        this.SetParent(val.instance || (val as any).value?.instance || null);
      } else if (val.type === "null") {
        this.SetParent(null);
      }
    } else {
      const lower = propName.toLowerCase();
      // Synchronize text aliases
      if (lower === "txt" || lower === "text" || lower === "content" || lower === "label" || lower === "title") {
        this.properties.set("txt", val);
        this.properties.set("text", val);
        this.properties.set(propName, val);
      } else if (lower === "value" || lower === "val" || lower === "checked") {
        this.properties.set("value", val);
        this.properties.set("val", val);
        this.properties.set(propName, val);
      } else if (lower === "placeholder" || lower === "ph") {
        this.properties.set("placeholder", val);
        this.properties.set(propName, val);
      } else if (lower === "visible" || lower === "isvisible" || lower === "hidden") {
        this.properties.set("visible", val);
        this.properties.set(propName, val);
      } else {
        this.properties.set(propName, val);
      }
    }

    if (Instance.onPropertyUpdated) {
      Instance.onPropertyUpdated(this, propName, val);
    }
  }

  public GetProperty(propName: string): RuntimeVal {
    if (this.properties.has(propName)) {
      return this.properties.get(propName)!;
    }

    const lower = propName.toLowerCase();

    // Check case-insensitive match in properties
    for (const [key, val] of this.properties.entries()) {
      if (key.toLowerCase() === lower) {
        return val;
      }
    }

    // Synonyms for text attributes (txt, text, content, label, title)
    if (lower === "txt" || lower === "text" || lower === "content" || lower === "label" || lower === "title") {
      for (const synonym of ["text", "txt", "content", "label", "title"]) {
        for (const [k, v] of this.properties.entries()) {
          if (k.toLowerCase() === synonym) return v;
        }
      }
    }

    // Synonyms for value attributes (val, value, checked)
    if (lower === "value" || lower === "val" || lower === "checked") {
      for (const synonym of ["value", "val", "checked"]) {
        for (const [k, v] of this.properties.entries()) {
          if (k.toLowerCase() === synonym) return v;
        }
      }
    }

    // Synonyms for placeholder
    if (lower === "placeholder" || lower === "ph") {
      for (const synonym of ["placeholder", "ph"]) {
        for (const [k, v] of this.properties.entries()) {
          if (k.toLowerCase() === synonym) return v;
        }
      }
    }

    // Synonyms for visibility
    if (lower === "visible" || lower === "isvisible" || lower === "hidden") {
      for (const synonym of ["visible", "isvisible", "hidden"]) {
        for (const [k, v] of this.properties.entries()) {
          if (k.toLowerCase() === synonym) return v;
        }
      }
    }

    // Standard instance properties
    if (propName === "Name" || lower === "name") {
      return { type: "string", value: this.Name };
    }
    if (propName === "ClassName" || lower === "classname") {
      return { type: "string", value: this.ClassName };
    }
    if (propName === "SourceFile" || lower === "sourcefile") {
      return { type: "string", value: this.SourceFile };
    }
    if (propName === "ToString" || lower === "tostring") {
      return {
        type: "native_fn",
        call: () => ({ type: "string", value: this.ToString() })
      };
    }
    if (propName === "Parent" || lower === "parent") {
      if (!this._parent) return MK_NULL();
      return { type: "instance", value: { type: "instance", instance: this._parent } as any };
    }

    // Built-in Helper Methods for Graphical Elements
    if (lower === "settext") {
      return {
        type: "native_fn",
        call: (args: RuntimeVal[]) => {
          if (args.length > 0) {
            this.SetProperty("txt", args[0]);
          }
          return { type: "instance", instance: this };
        }
      };
    }

    if (lower === "gettext") {
      return {
        type: "native_fn",
        call: () => {
          const t = this.GetProperty("txt");
          return t.type !== "null" ? t : { type: "string", value: "" };
        }
      };
    }

    if (lower === "setvalue") {
      return {
        type: "native_fn",
        call: (args: RuntimeVal[]) => {
          if (args.length > 0) {
            this.SetProperty("value", args[0]);
          }
          return { type: "instance", instance: this };
        }
      };
    }

    if (lower === "getvalue") {
      return {
        type: "native_fn",
        call: () => this.GetProperty("value")
      };
    }

    if (lower === "setvisible") {
      return {
        type: "native_fn",
        call: (args: RuntimeVal[]) => {
          if (args.length > 0) {
            this.SetProperty("visible", args[0]);
          }
          return { type: "instance", instance: this };
        }
      };
    }

    if (lower === "isvisible") {
      return {
        type: "native_fn",
        call: () => {
          const v = this.GetProperty("visible");
          return v.type === "boolean" ? v : { type: "boolean", value: true };
        }
      };
    }

    if (lower === "onclick" || lower === "clicked") {
      return {
        type: "native_fn",
        call: (args: RuntimeVal[]) => {
          if (args.length > 0) {
            this.properties.set("_onClickCallback", args[0]);
          }
          return { type: "instance", instance: this };
        }
      };
    }

    if (lower === "onchange" || lower === "changed") {
      return {
        type: "native_fn",
        call: (args: RuntimeVal[]) => {
          if (args.length > 0) {
            this.properties.set("_onChangeCallback", args[0]);
          }
          return { type: "instance", instance: this };
        }
      };
    }

    // Direct child lookup by name (Roblox style: UI.MyCard or MyCard.BtnSubmit)
    const child = this.FindFirstChild(propName);
    if (child) {
      return { type: "instance", instance: child };
    }

    // Fallback: search among descendants if container/root
    const descendant = this.GetDescendants().find(d => d.Name === propName || d.Name.toLowerCase() === lower);
    if (descendant) {
      return { type: "instance", instance: descendant };
    }

    return MK_NULL();
  }
}

