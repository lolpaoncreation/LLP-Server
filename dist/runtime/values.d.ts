import { Statement } from "../parser/ast";
import { Environment } from "./environment";
import { Instance } from "./instance";
export type ValueType = "null" | "number" | "string" | "boolean" | "list" | "fixed_array" | "instance" | "native_fn" | "fn";
export interface RuntimeVal {
    type: ValueType;
    value?: any;
    elementType?: string;
    elements?: (RuntimeVal | null)[];
    maxElements?: number;
    instance?: Instance;
    call?: FunctionCall;
    name?: string;
    parameters?: string[];
    declarationEnv?: Environment;
    body?: Statement[];
    Add?: (val: RuntimeVal) => void;
    Remove?: (index: number) => void;
    Length?: () => number;
    MaxLength?: () => number;
}
export interface NullVal extends RuntimeVal {
    type: "null";
    value: null;
}
export interface NumberVal extends RuntimeVal {
    type: "number";
    value: number;
}
export interface StringVal extends RuntimeVal {
    type: "string";
    value: string;
}
export interface BooleanVal extends RuntimeVal {
    type: "boolean";
    value: boolean;
}
export interface ListVal extends RuntimeVal {
    type: "list";
    elementType: string;
    elements: RuntimeVal[];
}
export interface FixedArrayVal extends RuntimeVal {
    type: "fixed_array";
    elementType: string;
    maxElements: number;
    elements: (RuntimeVal | null)[];
}
export interface InstanceVal extends RuntimeVal {
    type: "instance";
    instance: Instance;
}
export type FunctionCall = (args: RuntimeVal[], env: Environment) => RuntimeVal;
export interface NativeFunctionVal extends RuntimeVal {
    type: "native_fn";
    call: FunctionCall;
}
export interface FunctionVal extends RuntimeVal {
    type: "fn";
    name: string;
    parameters: string[];
    declarationEnv: Environment;
    body: Statement[];
}
export declare function MK_NUMBER(n?: number): NumberVal;
export declare function MK_STRING(s?: string): StringVal;
export declare function MK_BOOL(b?: boolean): BooleanVal;
export declare function MK_NULL(): NullVal;
export declare function MK_NATIVE_FN(call: FunctionCall): NativeFunctionVal;
