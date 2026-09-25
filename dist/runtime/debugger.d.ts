import { Environment } from "./environment";
import { RuntimeVal } from "./values";
import { Statement } from "../parser/ast";
export interface BreakpointInfo {
    file: string;
    line: number;
}
export declare class DebuggerManager {
    private static instance;
    isPaused: boolean;
    stepMode: boolean;
    activeThreadId: string | null;
    currentFile?: string;
    breakpoints: Set<string>;
    private sleepBuffer;
    static getInstance(): DebuggerManager;
    addBreakpoint(file: string, line: number): void;
    removeBreakpoint(file: string, line: number): void;
    hasBreakpoint(file: string, line: number): boolean;
    /**
     * Called before every statement execution in interpreter.
     * If another thread/script has paused at a breakpoint, this thread freezes and waits.
     */
    checkBeforeStatement(stmt: Statement, env: Environment, threadId?: string, filePath?: string): void;
    /**
     * Triggers a breakpoint hit, pauses all other scripts/threads, and opens interactive prompt.
     */
    hitBreakpoint(env: Environment, line?: number, label?: string, file?: string, threadId?: string): void;
    private printVariables;
    private inspectProperty;
    formatRuntimeVal(val: RuntimeVal | null | undefined): string;
    private readLine;
    syncWait(ms: number): void;
}
export declare const Debugger: DebuggerManager;
