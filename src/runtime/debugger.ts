import * as fs from "fs";
import { Environment } from "./environment";
import { RuntimeVal, MK_NULL } from "./values";
import { Statement } from "../parser/ast";

export interface BreakpointInfo {
  file: string;
  line: number;
}

export class DebuggerManager {
  private static instance: DebuggerManager;

  public isPaused: boolean = false;
  public stepMode: boolean = false;
  public activeThreadId: string | null = null;
  public currentFile?: string;
  public breakpoints: Set<string> = new Set(); // "file:line"

  private sleepBuffer = new Int32Array(new SharedArrayBuffer(4));

  public static getInstance(): DebuggerManager {
    if (!DebuggerManager.instance) {
      DebuggerManager.instance = new DebuggerManager();
    }
    return DebuggerManager.instance;
  }

  public addBreakpoint(file: string, line: number) {
    this.breakpoints.add(`${file}:${line}`);
  }

  public removeBreakpoint(file: string, line: number) {
    this.breakpoints.delete(`${file}:${line}`);
  }

  public hasBreakpoint(file: string, line: number): boolean {
    return this.breakpoints.has(`${file}:${line}`);
  }

  /**
   * Called before every statement execution in interpreter.
   * If another thread/script has paused at a breakpoint, this thread freezes and waits.
   */
  public checkBeforeStatement(stmt: Statement, env: Environment, threadId: string = "main", filePath?: string): void {
    // If another thread has paused execution, wait until it resumes
    while (this.isPaused && this.activeThreadId !== threadId) {
      this.syncWait(50);
    }

    // Check if this statement hits a registered line breakpoint or step mode
    const line = stmt.line;
    const file = filePath || this.currentFile || "script.llp";

    if (line !== undefined) {
      const isRegisteredBp = this.hasBreakpoint(file, line);
      if (isRegisteredBp || (this.stepMode && this.activeThreadId === threadId)) {
        this.stepMode = false;
        this.hitBreakpoint(env, line, undefined, file, threadId);
      }
    }
  }

  /**
   * Triggers a breakpoint hit, pauses all other scripts/threads, and opens interactive prompt.
   */
  public hitBreakpoint(
    env: Environment,
    line?: number,
    label?: string,
    file?: string,
    threadId: string = "main"
  ): void {
    this.isPaused = true;
    this.activeThreadId = threadId;

    const sourceFile = file || this.currentFile || "script.llp";

    console.log("\n================================================================================");
    console.log("🛑 [LLP POINT D'ARRÊT - DÉBOGUEUR TEMPS RÉEL]");
    console.log("================================================================================");
    console.log(`Script  : ${sourceFile}`);
    if (line !== undefined) {
      console.log(`Ligne   : ${line}`);
    }
    if (label) {
      console.log(`Message : ${label}`);
    }
    console.log("Thread  : " + threadId);
    console.log("--------------------------------------------------------------------------------");
    this.printVariables(env);
    console.log("--------------------------------------------------------------------------------");
    console.log("Commandes :");
    console.log("  [c] Continuer (Resume all scripts)");
    console.log("  [s] Pas à pas (Step next statement)");
    console.log("  [p <nom>] Inspecter variable ou dot-path (ex: p variable.data.nom)");
    console.log("  [v] Réafficher toutes les variables en temps réel");
    console.log("  [q] Quitter le programme");
    console.log("================================================================================\n");

    // Interactive CLI loop
    let waiting = true;
    while (waiting) {
      process.stdout.write("LLP-Debug> ");
      const cmd = this.readLine().trim();

      if (!cmd || cmd === "c" || cmd === "continue") {
        this.isPaused = false;
        this.stepMode = false;
        this.activeThreadId = null;
        console.log("▶ Reprise de l'exécution...\n");
        waiting = false;
      } else if (cmd === "s" || cmd === "step") {
        this.stepMode = true;
        this.isPaused = false;
        console.log("⏭ Étape suivante...\n");
        waiting = false;
      } else if (cmd === "v" || cmd === "vars") {
        console.log("--------------------------------------------------------------------------------");
        this.printVariables(env);
        console.log("--------------------------------------------------------------------------------");
      } else if (cmd.startsWith("p ") || cmd.startsWith("print ")) {
        const query = cmd.replace(/^(p|print)\s+/, "").trim();
        this.inspectProperty(query, env);
      } else if (cmd === "q" || cmd === "quit" || cmd === "exit") {
        console.log("Arrêt du débogueur.");
        process.exit(0);
      } else {
        console.log(`Commande inconnue: '${cmd}'. Utilisez [c], [s], [p <nom>], [v], [q]`);
      }
    }
  }

  private printVariables(env: Environment) {
    const vars = env.getAllVariables();
    if (vars.size === 0) {
      console.log("  (Aucune variable déclarée)");
      return;
    }

    console.log("Variables en mémoire (temps réel) :");
    for (const [name, info] of vars.entries()) {
      const formatted = this.formatRuntimeVal(info.val);
      console.log(`  • ${name} (${info.explicitType}) = ${formatted}`);
    }
  }

  private inspectProperty(path: string, env: Environment) {
    try {
      const parts = path.split(".");
      const rootVar = parts[0];
      let currentVal = env.lookupVar(rootVar);

      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        if (currentVal.type === "json" && typeof currentVal.value === "object" && currentVal.value !== null) {
          const sub = currentVal.value[part];
          if (sub === undefined) {
            currentVal = MK_NULL();
            break;
          }
          if (typeof sub === "object" && sub !== null) {
            currentVal = { type: "json", value: sub };
          } else if (typeof sub === "number") {
            currentVal = { type: "number", value: sub };
          } else if (typeof sub === "string") {
            currentVal = { type: "string", value: sub };
          } else if (typeof sub === "boolean") {
            currentVal = { type: "boolean", value: sub };
          } else {
            currentVal = { type: "null", value: null };
          }
        } else if (currentVal.type === "instance" && currentVal.instance) {
          currentVal = currentVal.instance.GetProperty(part);
        } else {
          currentVal = MK_NULL();
          break;
        }
      }

      console.log(`  ${path} = ${this.formatRuntimeVal(currentVal)}`);
    } catch (e: any) {
      console.log(`  Erreur d'inspection: ${e.message}`);
    }
  }

  public formatRuntimeVal(val: RuntimeVal | null | undefined): string {
    if (!val || val.type === "null") return "null";
    if (val.type === "number" || val.type === "string" || val.type === "boolean") {
      return JSON.stringify(val.value);
    }
    if (val.type === "json") {
      return JSON.stringify(val.value, null, 2);
    }
    if (val.type === "hexa") {
      return (val as any).hexString || `0x${(val as any).value?.toString(16).toUpperCase()}`;
    }
    if (val.type === "thread") {
      return `<Thread [${(val as any).id}] Status: ${(val as any).status}>`;
    }
    if (val.type === "list" && val.elements) {
      return "[" + val.elements.map(e => this.formatRuntimeVal(e)).join(", ") + "]";
    }
    if (val.type === "fixed_array" && val.elements) {
      return "Array[" + val.elements.length + "]{" + val.elements.map(e => this.formatRuntimeVal(e)).join(", ") + "}";
    }
    if (val.type === "instance" && val.instance) {
      return val.instance.ToString();
    }
    if (val.type === "native_fn") return "<native_fn>";
    if (val.type === "fn") return `<func ${(val as any).name || "anonymous"}>`;
    return JSON.stringify(val);
  }

  private readLine(): string {
    try {
      const buffer = Buffer.alloc(1024);
      const bytesRead = fs.readSync(0, buffer, 0, 1024, null);
      return buffer.toString("utf-8", 0, bytesRead).replace(/[\r\n]+$/, "");
    } catch {
      return "c";
    }
  }

  public syncWait(ms: number): void {
    try {
      Atomics.wait(this.sleepBuffer, 0, 0, Math.max(1, ms));
    } catch {
      // Fallback
      const end = Date.now() + ms;
      while (Date.now() < end) {}
    }
  }
}

export const Debugger = DebuggerManager.getInstance();
