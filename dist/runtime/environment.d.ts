import { RuntimeVal } from "./values";
export type SupportedType = "General" | "Global" | "int" | "float" | "string" | "bool" | "Json" | "Hexa";
export interface VariableInfo {
    val: RuntimeVal;
    explicitType: SupportedType;
    isList?: boolean;
    isFixedArray?: boolean;
    maxElements?: number;
}
export declare class Environment {
    private parent?;
    private variables;
    constructor(parentENV?: Environment);
    declareVar(name: string, value: RuntimeVal, explicitType?: SupportedType, isList?: boolean, isFixedArray?: boolean, maxElements?: number): RuntimeVal;
    assignVar(name: string, value: RuntimeVal): RuntimeVal;
    lookupVar(name: string): RuntimeVal;
    lookupVarInfo(name: string): VariableInfo;
    getAllVariables(): Map<string, VariableInfo>;
    hasVar(name: string): boolean;
    resolve(name: string): Environment;
    private validateType;
}
