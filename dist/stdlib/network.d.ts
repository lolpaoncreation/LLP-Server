import { Environment } from "../runtime/environment";
import { RuntimeVal } from "../runtime/values";
export declare function jsToRuntimeVal(val: any): RuntimeVal;
export declare function runtimeValToJs(val: RuntimeVal): any;
export declare function registerNetwork(env: Environment): void;
