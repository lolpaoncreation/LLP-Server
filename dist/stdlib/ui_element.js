"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UIElementManager = void 0;
exports.registerUI = registerUI;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const instance_1 = require("../runtime/instance");
const values_1 = require("../runtime/values");
const interpreter_1 = require("../runtime/interpreter");
const instance_std_1 = require("./instance_std");
const app_runner_1 = require("../gui/app_runner");
class UIElementManager {
    static instance;
    rootUI;
    elementsMap = new Map();
    pendingUpdates = [];
    hasAutoLoaded = false;
    constructor() {
        this.rootUI = new instance_1.Instance("UIService");
        this.rootUI.Name = "UI";
        (0, instance_std_1.attachInstanceMethods)(this.rootUI);
        // Setup global instance update listener
        instance_1.Instance.onPropertyUpdated = (inst, propName, val) => {
            if (inst && inst.Name && this.elementsMap.has(inst.Name)) {
                this.addPendingUpdate(inst.Name, propName, (0, interpreter_1.unwrapRuntimeVal)(val));
            }
        };
    }
    static getInstance() {
        if (!UIElementManager.instance) {
            UIElementManager.instance = new UIElementManager();
        }
        return UIElementManager.instance;
    }
    addPendingUpdate(id, prop, value) {
        this.pendingUpdates.push({ id, prop, value });
    }
    getAndClearPendingUpdates() {
        const updates = [...this.pendingUpdates];
        this.pendingUpdates = [];
        return updates;
    }
    autoLoad(baseDir) {
        if (this.hasAutoLoaded && this.elementsMap.size > 0)
            return true;
        const projectDir = baseDir || process.cwd();
        const illpInfo = (0, app_runner_1.findProjectIllpFile)(projectDir);
        if (illpInfo && fs.existsSync(illpInfo.illpPath)) {
            this.loadIllpFile(illpInfo.illpPath);
            this.hasAutoLoaded = true;
            return true;
        }
        return false;
    }
    loadIllpFile(filePath) {
        const absPath = path.resolve(filePath);
        if (!fs.existsSync(absPath)) {
            throw new Error(`[LLP UI Error] Impossible de trouver le fichier d'interface : ${filePath}`);
        }
        const code = fs.readFileSync(absPath, "utf-8");
        const tree = (0, app_runner_1.parseIllpTree)(code);
        // Clear old elements under rootUI
        for (const child of this.rootUI.GetChildren()) {
            this.rootUI.RemoveChild(child);
        }
        this.elementsMap.clear();
        const buildInstanceTree = (nodes, parentInst) => {
            for (const node of nodes) {
                const elemInst = new instance_1.Instance(node.type, parentInst, absPath);
                elemInst.Name = node.name;
                (0, instance_std_1.attachInstanceMethods)(elemInst);
                // Populate properties from .illp
                for (const [key, val] of Object.entries(node.props || {})) {
                    const rawVal = val;
                    elemInst.SetProperty(key, (0, interpreter_1.wrapRawValue)(rawVal));
                    // Normalize text & values
                    const kLower = key.toLowerCase();
                    if (kLower === "text" || kLower === "content" || kLower === "label" || kLower === "title") {
                        elemInst.SetProperty("txt", (0, interpreter_1.wrapRawValue)(rawVal));
                        elemInst.SetProperty("text", (0, interpreter_1.wrapRawValue)(rawVal));
                    }
                    if (kLower === "value" || kLower === "default") {
                        elemInst.SetProperty("val", (0, interpreter_1.wrapRawValue)(rawVal));
                        elemInst.SetProperty("value", (0, interpreter_1.wrapRawValue)(rawVal));
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
    getElement(nameOrId) {
        if (!nameOrId)
            return null;
        if (this.elementsMap.size === 0 && !this.hasAutoLoaded) {
            this.autoLoad();
        }
        if (this.elementsMap.has(nameOrId)) {
            return this.elementsMap.get(nameOrId);
        }
        // Case-insensitive search
        const lower = nameOrId.toLowerCase();
        for (const [key, inst] of this.elementsMap.entries()) {
            if (key.toLowerCase() === lower) {
                return inst;
            }
        }
        // Search among rootUI descendants
        const descendant = this.rootUI.GetDescendants().find(d => d.Name === nameOrId || d.Name.toLowerCase() === lower);
        if (descendant) {
            this.elementsMap.set(descendant.Name, descendant);
            return descendant;
        }
        return null;
    }
    setText(nameOrId, text) {
        const elem = this.getElement(nameOrId);
        if (!elem)
            return false;
        elem.SetProperty("txt", (0, values_1.MK_STRING)(text));
        return true;
    }
    getText(nameOrId) {
        const elem = this.getElement(nameOrId);
        if (!elem)
            return "";
        const p = elem.GetProperty("txt");
        return p && p.type === "string" ? p.value : String(p?.value ?? "");
    }
    setValue(nameOrId, val) {
        const elem = this.getElement(nameOrId);
        if (!elem)
            return false;
        elem.SetProperty("value", (0, interpreter_1.wrapRawValue)(val));
        return true;
    }
    getValue(nameOrId) {
        const elem = this.getElement(nameOrId);
        if (!elem)
            return null;
        return (0, interpreter_1.unwrapRuntimeVal)(elem.GetProperty("value"));
    }
    setVisible(nameOrId, visible) {
        const elem = this.getElement(nameOrId);
        if (!elem)
            return false;
        elem.SetProperty("visible", (0, values_1.MK_BOOL)(visible));
        return true;
    }
    applyBrowserEvent(id, event, value) {
        const elem = this.getElement(id);
        if (!elem)
            return;
        if (event === "input" || event === "change") {
            elem.SetProperty("value", (0, interpreter_1.wrapRawValue)(value));
            const callback = elem.GetProperty("_onChangeCallback");
            if (callback && callback.type === "fn") {
                try {
                    (0, interpreter_1.callLLPFunction)(callback, [(0, interpreter_1.wrapRawValue)(value)], callback.declarationEnv);
                }
                catch (err) {
                    console.error(`[LLP UI Event Error in ${id} onChange]:`, err.message || err);
                }
            }
        }
        else if (event === "click") {
            const callback = elem.GetProperty("_onClickCallback");
            if (callback && callback.type === "fn") {
                try {
                    (0, interpreter_1.callLLPFunction)(callback, [], callback.declarationEnv);
                }
                catch (err) {
                    console.error(`[LLP UI Event Error in ${id} onClick]:`, err.message || err);
                }
            }
        }
    }
}
exports.UIElementManager = UIElementManager;
function registerUI(env) {
    const manager = UIElementManager.getInstance();
    const uiInst = manager.rootUI;
    // 1. UI.GetElement(nameOrId) / UI.Get(nameOrId) / UI.Find(nameOrId)
    const getElemFn = {
        type: "native_fn",
        call: (args) => {
            if (args.length < 1 || args[0].type !== "string")
                return (0, values_1.MK_NULL)();
            const elem = manager.getElement(args[0].value);
            if (!elem)
                return (0, values_1.MK_NULL)();
            return { type: "instance", instance: elem };
        }
    };
    // 2. UI.SetText(nameOrId, text)
    const setTextFn = {
        type: "native_fn",
        call: (args) => {
            if (args.length < 2 || args[0].type !== "string")
                return (0, values_1.MK_BOOL)(false);
            const textVal = args[1].type === "string" ? args[1].value : String(args[1]?.value ?? "");
            const ok = manager.setText(args[0].value, textVal);
            return (0, values_1.MK_BOOL)(ok);
        }
    };
    // 3. UI.GetText(nameOrId)
    const getTextFn = {
        type: "native_fn",
        call: (args) => {
            if (args.length < 1 || args[0].type !== "string")
                return (0, values_1.MK_STRING)("");
            return (0, values_1.MK_STRING)(manager.getText(args[0].value));
        }
    };
    // 4. UI.SetValue(nameOrId, val)
    const setValueFn = {
        type: "native_fn",
        call: (args) => {
            if (args.length < 2 || args[0].type !== "string")
                return (0, values_1.MK_BOOL)(false);
            const ok = manager.setValue(args[0].value, (0, interpreter_1.unwrapRuntimeVal)(args[1]));
            return (0, values_1.MK_BOOL)(ok);
        }
    };
    // 5. UI.GetValue(nameOrId)
    const getValueFn = {
        type: "native_fn",
        call: (args) => {
            if (args.length < 1 || args[0].type !== "string")
                return (0, values_1.MK_NULL)();
            return (0, interpreter_1.wrapRawValue)(manager.getValue(args[0].value));
        }
    };
    // 6. UI.SetVisible(nameOrId, visible)
    const setVisibleFn = {
        type: "native_fn",
        call: (args) => {
            if (args.length < 2 || args[0].type !== "string")
                return (0, values_1.MK_BOOL)(false);
            const vis = args[1].type === "boolean" ? args[1].value : Boolean(args[1]?.value);
            const ok = manager.setVisible(args[0].value, vis);
            return (0, values_1.MK_BOOL)(ok);
        }
    };
    // 7. UI.GetAllElements()
    const getAllFn = {
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
    const createElemFn = {
        type: "native_fn",
        call: (args) => {
            const tag = args.length > 0 && args[0].type === "string" ? args[0].value : "Element";
            const name = args.length > 1 && args[1].type === "string" ? args[1].value : tag;
            const elem = new instance_1.Instance(tag, manager.rootUI);
            elem.Name = name;
            (0, instance_std_1.attachInstanceMethods)(elem);
            manager.elementsMap.set(name, elem);
            return { type: "instance", instance: elem };
        }
    };
    // 9. UI.Load(filePath)
    const loadFn = {
        type: "native_fn",
        call: (args) => {
            if (args.length > 0 && args[0].type === "string") {
                manager.loadIllpFile(args[0].value);
                return (0, values_1.MK_BOOL)(true);
            }
            return (0, values_1.MK_BOOL)(false);
        }
    };
    // 10. UI.AutoLoad()
    const autoLoadFn = {
        type: "native_fn",
        call: () => (0, values_1.MK_BOOL)(manager.autoLoad())
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
    }
    catch (_) { }
}
