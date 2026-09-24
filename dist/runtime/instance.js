"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Instance = void 0;
const values_1 = require("./values");
class Instance {
    ClassName;
    Name;
    SourceFile = "";
    _parent = null;
    _children = [];
    properties = new Map();
    // Event Listeners (Signals)
    childAddedListeners = [];
    childRemovedListeners = [];
    constructor(className = "Instance", parent = null, sourceFile = "") {
        this.ClassName = className;
        this.Name = className;
        this.SourceFile = sourceFile;
        if (parent) {
            this.SetParent(parent);
        }
    }
    get Parent() {
        return this._parent;
    }
    SetParent(newParent) {
        if (this._parent === newParent)
            return;
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
    AddChild(child) {
        if (!this._children.includes(child)) {
            this._children.push(child);
            child._parent = this;
            this.fireChildAdded(child);
        }
    }
    RemoveChild(child) {
        const index = this._children.indexOf(child);
        if (index !== -1) {
            this._children.splice(index, 1);
            child._parent = null;
            this.fireChildRemoved(child);
        }
    }
    GetChildren() {
        return [...this._children];
    }
    FindFirstChild(name) {
        return this._children.find(child => child.Name === name) ?? null;
    }
    GetDescendants() {
        const descendants = [];
        for (const child of this._children) {
            descendants.push(child);
            descendants.push(...child.GetDescendants());
        }
        return descendants;
    }
    Destroy() {
        if (this._parent) {
            this._parent.RemoveChild(this);
        }
        for (const child of [...this._children]) {
            child.Destroy();
        }
        this._children = [];
        this.properties.clear();
    }
    Clone() {
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
    OnChildAdded(listener) {
        this.childAddedListeners.push(listener);
    }
    OnChildRemoved(listener) {
        this.childRemovedListeners.push(listener);
    }
    fireChildAdded(child) {
        for (const listener of this.childAddedListeners) {
            listener(child);
        }
    }
    fireChildRemoved(child) {
        for (const listener of this.childRemovedListeners) {
            listener(child);
        }
    }
    ToString() {
        const chain = [];
        if (this.SourceFile) {
            const baseFile = this.SourceFile.replace(/^.*[\\\/]/, "");
            chain.push(baseFile);
        }
        let curr = this._parent;
        const parentChain = [];
        while (curr) {
            parentChain.unshift(curr.Name || curr.ClassName);
            curr = curr.Parent;
        }
        chain.push(...parentChain);
        chain.push(this.Name || this.ClassName);
        return `[${chain.join(" > ")}]`;
    }
    SetProperty(propName, val) {
        if (propName === "Name" && val.type === "string") {
            this.Name = val.value;
        }
        else if (propName === "SourceFile" && val.type === "string") {
            this.SourceFile = val.value;
        }
        else if (propName === "Parent") {
            if (val.type === "instance") {
                this.SetParent(val.value.instance);
            }
            else if (val.type === "null") {
                this.SetParent(null);
            }
        }
        else {
            this.properties.set(propName, val);
        }
    }
    GetProperty(propName) {
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
            if (!this._parent)
                return (0, values_1.MK_NULL)();
            return { type: "instance", value: { type: "instance", instance: this._parent } };
        }
        return this.properties.get(propName) ?? (0, values_1.MK_NULL)();
    }
}
exports.Instance = Instance;
