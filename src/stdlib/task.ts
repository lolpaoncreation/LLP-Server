import { Environment } from "../runtime/environment";
import { Instance } from "../runtime/instance";
import {
  RuntimeVal,
  MK_NUMBER,
  MK_NULL,
  MK_STRING,
  ThreadVal,
  FunctionVal,
  NativeFunctionVal
} from "../runtime/values";
import { Debugger } from "../runtime/debugger";
import { evaluate } from "../runtime/interpreter";

let threadSeq = 0;
export const activeThreads: Map<string, ThreadVal> = new Map();

export function registerTask(env: Environment) {
  const taskObj = new Instance("TaskService");
  taskObj.Name = "Task";

  // helper to execute a callback function in a new thread context
  const runCallback = (fnVal: RuntimeVal, args: RuntimeVal[], threadVal: ThreadVal) => {
    if ((threadVal.status as string) === "cancelled") return;

    // Check if debugger paused execution
    while (Debugger.isPaused) {
      Debugger.syncWait(50);
      if ((threadVal.status as string) === "cancelled") return;
    }

    threadVal.status = "running";

    try {
      if (fnVal.type === "native_fn" && fnVal.call) {
        fnVal.call(args, env);
      } else if (fnVal.type === "fn") {
        const fn = fnVal as FunctionVal;
        const threadEnv = new Environment(fn.declarationEnv);
        for (let i = 0; i < fn.parameters.length; i++) {
          const pName = fn.parameters[i];
          const aVal = i < args.length ? args[i] : MK_NULL();
          threadEnv.declareVar(pName, aVal, "General");
        }
        for (const stmt of fn.body) {
          Debugger.checkBeforeStatement(stmt, threadEnv, threadVal.id);
          evaluate(stmt, threadEnv);
        }
      }
      if ((threadVal.status as string) !== "cancelled") {
        threadVal.status = "completed";
      }
    } catch (e: any) {
      threadVal.status = "dead";
      console.error(`[LLP Task Error] Erreur dans le thread ${threadVal.id}: ${e.message}`);
    } finally {
      activeThreads.delete(threadVal.id);
    }
  };

  // 1. task.wait(seconds)
  const waitFn = (args: RuntimeVal[]): RuntimeVal => {
    const sec = args.length > 0 && args[0].type === "number" ? args[0].value : 0.03;
    const start = Date.now();
    Debugger.syncWait(Math.max(1, Math.round(sec * 1000)));
    const elapsed = (Date.now() - start) / 1000;
    return MK_NUMBER(elapsed);
  };

  // 2. task.delay(seconds, fn, ...args)
  const delayFn = (args: RuntimeVal[]): RuntimeVal => {
    if (args.length < 2) {
      throw new Error("[LLP Task Error] task.delay attend (seconds: number, callback: func, ...args).");
    }
    const sec = args[0].type === "number" ? args[0].value : 0;
    const fnVal = args[1];
    const restArgs = args.slice(2);

    const threadId = `thread_${++threadSeq}`;
    let cancelled = false;
    let timer: NodeJS.Timeout | null = null;

    const threadVal: ThreadVal = {
      type: "thread",
      id: threadId,
      status: "suspended",
      cancel: () => {
        cancelled = true;
        threadVal.status = "cancelled";
        if (timer) clearTimeout(timer);
        activeThreads.delete(threadId);
      }
    };

    activeThreads.set(threadId, threadVal);

    timer = setTimeout(() => {
      if (!cancelled) {
        runCallback(fnVal, restArgs, threadVal);
      }
    }, Math.max(0, Math.round(sec * 1000)));

    return threadVal;
  };

  // 3. task.spawn(fn, ...args)
  const spawnFn = (args: RuntimeVal[]): RuntimeVal => {
    if (args.length < 1) {
      throw new Error("[LLP Task Error] task.spawn attend (callback: func, ...args).");
    }
    const fnVal = args[0];
    const restArgs = args.slice(1);

    const threadId = `thread_${++threadSeq}`;
    let cancelled = false;

    const threadVal: ThreadVal = {
      type: "thread",
      id: threadId,
      status: "running",
      cancel: () => {
        cancelled = true;
        threadVal.status = "cancelled";
        activeThreads.delete(threadId);
      }
    };

    activeThreads.set(threadId, threadVal);

    setImmediate(() => {
      if (!cancelled) {
        runCallback(fnVal, restArgs, threadVal);
      }
    });

    return threadVal;
  };

  // 4. task.cancel(thread)
  const cancelFn = (args: RuntimeVal[]): RuntimeVal => {
    if (args.length < 1) {
      throw new Error("[LLP Task Error] task.cancel attend (thread).");
    }
    const target = args[0];
    if (target.type === "thread" && (target as ThreadVal).cancel) {
      (target as ThreadVal).cancel();
      return MK_NULL();
    }
    if (target.type === "instance" && target.instance) {
      const c = target.instance.GetProperty("cancel");
      if (c && c.type === "native_fn" && c.call) {
        c.call([], env);
        return MK_NULL();
      }
    }
    return MK_NULL();
  };

  // Register on Task Instance
  taskObj.SetProperty("wait", { type: "native_fn", call: waitFn });
  taskObj.SetProperty("delay", { type: "native_fn", call: delayFn });
  taskObj.SetProperty("spawn", { type: "native_fn", call: spawnFn });
  taskObj.SetProperty("defer", { type: "native_fn", call: spawnFn });
  taskObj.SetProperty("cancel", { type: "native_fn", call: cancelFn });

  // Register Task & task in environment
  env.declareVar("Task", { type: "instance", instance: taskObj }, "General");
  env.declareVar("task", { type: "instance", instance: taskObj }, "General");

  // Also expose global functions wait, delay, spawn, cancel
  env.declareVar("wait", { type: "native_fn", call: waitFn }, "General");
  env.declareVar("delay", { type: "native_fn", call: delayFn }, "General");
  env.declareVar("spawn", { type: "native_fn", call: spawnFn }, "General");
}
