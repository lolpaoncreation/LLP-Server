import { Environment } from "../runtime/environment";
import { ThreadVal } from "../runtime/values";
export declare const activeThreads: Map<string, ThreadVal>;
export declare function registerTask(env: Environment): void;
