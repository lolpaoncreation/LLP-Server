import { Statement } from "../parser/ast";
import { Environment } from "./environment";
import { Instance } from "./instance";

export type ValueType =
  | "null"
  | "number"
  | "string"
  | "boolean"
  | "list"
  | "fixed_array"
  | "instance"
  | "native_fn"
  | "fn"
  | "json"
  | "hexa"
  | "thread";

export interface RuntimeVal {
  type: ValueType;
  value?: any;

  // Optional discriminated union properties
  elementType?: string;
  elements?: (RuntimeVal | null)[];
  maxElements?: number;
  instance?: Instance;
  call?: FunctionCall;
  name?: string;
  parameters?: string[];
  declarationEnv?: Environment;
  body?: Statement[];

  // List helpers
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

export interface JsonVal extends RuntimeVal {
  type: "json";
  value: any;
}

export interface HexaVal extends RuntimeVal {
  type: "hexa";
  value: number;
  hexString: string;
}

export interface ThreadVal extends RuntimeVal {
  type: "thread";
  id: string;
  status: "running" | "suspended" | "completed" | "cancelled" | "dead";
  cancel: () => void;
}

export function MK_NUMBER(n = 0): NumberVal {
  return { type: "number", value: n };
}

export function MK_STRING(s = ""): StringVal {
  return { type: "string", value: s };
}

export function MK_BOOL(b = true): BooleanVal {
  return { type: "boolean", value: b };
}

export function MK_NULL(): NullVal {
  return { type: "null", value: null };
}

export function MK_JSON(val: any = {}): JsonVal {
  return { type: "json", value: val };
}

export function MK_HEXA(val: number | string): HexaVal {
  if (typeof val === "number") {
    const intVal = Math.floor(val);
    const hex = (intVal >= 0 ? "0x" : "-0x") + Math.abs(intVal).toString(16).toUpperCase();
    return { type: "hexa", value: intVal, hexString: hex };
  } else {
    const str = String(val).trim();
    const cleanStr = str.startsWith("#") ? str.substring(1) : str;
    const intVal = parseInt(cleanStr, 16);
    return {
      type: "hexa",
      value: isNaN(intVal) ? 0 : intVal,
      hexString: str.startsWith("0x") || str.startsWith("0X") ? str : `0x${cleanStr.toUpperCase()}`
    };
  }
}

export function MK_THREAD(id: string, cancel: () => void): ThreadVal {
  return {
    type: "thread",
    id,
    status: "running",
    cancel
  };
}

export function MK_NATIVE_FN(call: FunctionCall): NativeFunctionVal {
  return { type: "native_fn", call };
}
