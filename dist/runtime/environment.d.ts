import { RuntimeVal } from "./values";
export interface VariableInfo {
    val: RuntimeVal;
    explicitType: "General" | "int" | "float" | "string" | "bool";
    isList?: boolean;
    isFixedArray?: boolean;
    maxElements?: number;
}
export declare class Environment {
    private parent?;
    private variables;
    constructor(parentENV?: Environment);
    declareVar(name: string, value: RuntimeVal, explicitType?: "General" | "int" | "float" | "string" | "bool", isList?: boolean, isFixedArray?: boolean, maxElements?: number): RuntimeVal;
    assignVar(name: string, value: RuntimeVal): RuntimeVal;
    lookupVar(name: string): RuntimeVal;
    lookupVarInfo(name: string): VariableInfo;
    resolve(name: string): Environment;
    private validateType;
}
