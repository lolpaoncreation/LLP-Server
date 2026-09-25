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
        const custom = this.properties.get("ToString");
        if (custom && custom.type === "fn") {
            try {
                const { callLLPFunction } = require("./interpreter");
                const res = callLLPFunction(custom, [], custom.declarationEnv);
                if (res && res.type === "string")
                    return res.value;
                if (res && res.value !== undefined)
                    return String(res.value);
            }
            catch (err) {
                console.error(`[LLP ToString Execution Error in ${this.Name || this.ClassName}]:`, err.message || err);
            }
        }
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
    // Global listener for property updates (e.g. GUI live sync)
    static onPropertyUpdated;
    SetProperty(propName, val) {
        if (propName === "Name" && val.type === "string") {
            this.Name = val.value;
        }
        else if (propName === "SourceFile" && val.type === "string") {
            this.SourceFile = val.value;
        }
        else if (propName === "Parent") {
            if (val.type === "instance") {
                this.SetParent(val.instance || val.value?.instance || null);
            }
            else if (val.type === "null") {
                this.SetParent(null);
            }
        }
        else {
            const lower = propName.toLowerCase();
            // Synchronize text aliases
            if (lower === "txt" || lower === "text" || lower === "content" || lower === "label" || lower === "title") {
                this.properties.set("txt", val);
                this.properties.set("text", val);
                this.properties.set(propName, val);
            }
            else if (lower === "value" || lower === "val" || lower === "checked") {
                this.properties.set("value", val);
                this.properties.set("val", val);
                this.properties.set(propName, val);
            }
            else if (lower === "placeholder" || lower === "ph") {
                this.properties.set("placeholder", val);
                this.properties.set(propName, val);
            }
            else if (lower === "visible" || lower === "isvisible" || lower === "hidden") {
                this.properties.set("visible", val);
                this.properties.set(propName, val);
            }
            else {
                this.properties.set(propName, val);
            }
        }
        if (Instance.onPropertyUpdated) {
            Instance.onPropertyUpdated(this, propName, val);
        }
    }
    GetProperty(propName) {
        if (this.properties.has(propName)) {
            return this.properties.get(propName);
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
                    if (k.toLowerCase() === synonym)
                        return v;
                }
            }
        }
        // Synonyms for value attributes (val, value, checked)
        if (lower === "value" || lower === "val" || lower === "checked") {
            for (const synonym of ["value", "val", "checked"]) {
                for (const [k, v] of this.properties.entries()) {
                    if (k.toLowerCase() === synonym)
                        return v;
                }
            }
        }
        // Synonyms for placeholder
        if (lower === "placeholder" || lower === "ph") {
            for (const synonym of ["placeholder", "ph"]) {
                for (const [k, v] of this.properties.entries()) {
                    if (k.toLowerCase() === synonym)
                        return v;
                }
            }
        }
        // Synonyms for visibility
        if (lower === "visible" || lower === "isvisible" || lower === "hidden") {
            for (const synonym of ["visible", "isvisible", "hidden"]) {
                for (const [k, v] of this.properties.entries()) {
                    if (k.toLowerCase() === synonym)
                        return v;
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
            if (!this._parent)
                return (0, values_1.MK_NULL)();
            return { type: "instance", value: { type: "instance", instance: this._parent } };
        }
        // Built-in Helper Methods for Graphical Elements
        if (lower === "settext") {
            return {
                type: "native_fn",
                call: (args) => {
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
                call: (args) => {
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
                call: (args) => {
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
                call: (args) => {
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
                call: (args) => {
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
        return (0, values_1.MK_NULL)();
    }
}
exports.Instance = Instance;
