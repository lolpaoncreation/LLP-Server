import { Environment } from "../runtime/environment";
import { Instance } from "../runtime/instance";
import { MK_BOOL, MK_NULL, MK_STRING, RuntimeVal } from "../runtime/values";

export function registerInstanceSystem(env: Environment) {
  const instanceConstructor = new Instance("InstanceModule");
  instanceConstructor.Name = "Instance";

  instanceConstructor.SetProperty("new", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const className = args.length > 0 && args[0].type === "string" ? args[0].value : "Folder";
      let parentInst: Instance | null = null;
      if (args.length > 1 && args[1].type === "instance" && args[1].instance) {
        parentInst = args[1].instance;
      }

      const newInst = new Instance(className, parentInst);
      attachInstanceMethods(newInst);

      return { type: "instance", instance: newInst };
    }
  });

  env.declareVar("Instance", { type: "instance", instance: instanceConstructor }, "General");
}

export function attachInstanceMethods(inst: Instance) {
  inst.SetProperty("FindFirstChild", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      if (args.length < 1 || args[0].type !== "string") return MK_NULL();
      const child = inst.FindFirstChild(args[0].value);
      if (!child) return MK_NULL();
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
      return MK_NULL();
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
    call: (args: RuntimeVal[]) => {
      if (args.length > 0 && args[0].type === "instance" && args[0].instance) {
        inst.AddChild(args[0].instance);
        return MK_BOOL(true);
      }
      return MK_BOOL(false);
    }
  });

  inst.SetProperty("ToString", {
    type: "native_fn",
    call: () => MK_STRING(inst.ToString())
  });
}
