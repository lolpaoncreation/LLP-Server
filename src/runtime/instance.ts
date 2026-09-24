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

  public SetProperty(propName: string, val: RuntimeVal) {
    if (propName === "Name" && val.type === "string") {
      this.Name = val.value;
    } else if (propName === "SourceFile" && val.type === "string") {
      this.SourceFile = val.value;
    } else if (propName === "Parent") {
      if (val.type === "instance") {
        this.SetParent(val.value.instance);
      } else if (val.type === "null") {
        this.SetParent(null);
      }
    } else {
      this.properties.set(propName, val);
    }
  }

  public GetProperty(propName: string): RuntimeVal {
    if (propName === "Name") {
      return { type: "string", value: this.Name };
    }
    if (propName === "ClassName") {
      return { type: "string", value: this.ClassName };
    }
    if (propName === "SourceFile") {
      return { type: "string", value: this.SourceFile };
    }
    if (propName === "ToString") {
      return {
        type: "native_fn",
        call: () => ({ type: "string", value: this.ToString() })
      };
    }
    if (propName === "Parent") {
      if (!this._parent) return MK_NULL();
      return { type: "instance", value: { type: "instance", instance: this._parent } as any };
    }
    return this.properties.get(propName) ?? MK_NULL();
  }
}
