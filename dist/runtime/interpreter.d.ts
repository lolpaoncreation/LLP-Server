import { Statement } from "../parser/ast";
import { Environment } from "./environment";
import { RuntimeVal } from "./values";
export declare class ReturnValue {
    value: RuntimeVal;
    constructor(value: RuntimeVal);
}
export declare function evaluate(astNode: Statement, env: Environment): RuntimeVal;
export declare function evalBlockStatements(statements: Statement[], env: Environment): RuntimeVal;
export declare function callLLPFunction(fn: RuntimeVal, args: RuntimeVal[], callerEnv?: Environment): RuntimeVal;
