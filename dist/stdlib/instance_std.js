"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerInstanceSystem = registerInstanceSystem;
exports.attachInstanceMethods = attachInstanceMethods;
const instance_1 = require("../runtime/instance");
const values_1 = require("../runtime/values");
function registerInstanceSystem(env) {
    const instanceConstructor = new instance_1.Instance("InstanceModule");
    instanceConstructor.Name = "Instance";
    instanceConstructor.SetProperty("new", {
        type: "native_fn",
        call: (args) => {
            const className = args.length > 0 && args[0].type === "string" ? args[0].value : "Folder";
            let parentInst = null;
            if (args.length > 1 && args[1].type === "instance" && args[1].instance) {
                parentInst = args[1].instance;
            }
            const newInst = new instance_1.Instance(className, parentInst);
            attachInstanceMethods(newInst);
            return { type: "instance", instance: newInst };
        }
    });
    env.declareVar("Instance", { type: "instance", instance: instanceConstructor }, "General");
}
function attachInstanceMethods(inst) {
    inst.SetProperty("FindFirstChild", {
        type: "native_fn",
        call: (args) => {
            if (args.length < 1 || args[0].type !== "string")
                return (0, values_1.MK_NULL)();
            const child = inst.FindFirstChild(args[0].value);
            if (!child)
                return (0, values_1.MK_NULL)();
            attachInstanceMethods(child);
            return { type: "instance", instance: child };
        }
    });
    inst.SetProperty("GetChildren", {
        type: "native_fn",
        call: () => {
            const children = inst.GetChildren();
            return {
                type: "list",
                elementType: "General",
                elements: children.map(c => {
                    attachInstanceMethods(c);
                    return { type: "instance", instance: c };
                })
            };
        }
    });
    inst.SetProperty("GetDescendants", {
        type: "native_fn",
        call: () => {
            const descendants = inst.GetDescendants();
            return {
                type: "list",
                elementType: "General",
                elements: descendants.map(c => {
                    attachInstanceMethods(c);
                    return { type: "instance", instance: c };
                })
            };
        }
    });
    inst.SetProperty("Destroy", {
        type: "native_fn",
        call: () => {
            inst.Destroy();
            return (0, values_1.MK_NULL)();
        }
    });
    inst.SetProperty("Clone", {
        type: "native_fn",
        call: () => {
            const clone = inst.Clone();
            attachInstanceMethods(clone);
            return { type: "instance", instance: clone };
        }
    });
    inst.SetProperty("AddChild", {
        type: "native_fn",
        call: (args) => {
            if (args.length > 0 && args[0].type === "instance" && args[0].instance) {
                inst.AddChild(args[0].instance);
                return (0, values_1.MK_BOOL)(true);
            }
            return (0, values_1.MK_BOOL)(false);
        }
    });
    inst.SetProperty("ToString", {
        type: "native_fn",
        call: () => (0, values_1.MK_STRING)(inst.ToString())
    });
}
