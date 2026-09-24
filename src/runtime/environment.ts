import { RuntimeVal, MK_NULL } from "./values";

export interface VariableInfo {
  val: RuntimeVal;
  explicitType: "General" | "int" | "float" | "string" | "bool";
  isList?: boolean;
  isFixedArray?: boolean;
  maxElements?: number;
}

export class Environment {
  private parent?: Environment;
  private variables: Map<string, VariableInfo> = new Map();

  constructor(parentENV?: Environment) {
    this.parent = parentENV;
  }

  public declareVar(
    name: string,
    value: RuntimeVal,
    explicitType: "General" | "int" | "float" | "string" | "bool" = "General",
    isList = false,
    isFixedArray = false,
    maxElements?: number
  ): RuntimeVal {
    if (this.variables.has(name)) {
      throw new Error(`[LLP Runtime Error] La variable '${name}' est déjà déclarée dans cette portée.`);
    }

    this.validateType(name, value, explicitType, isList, isFixedArray, maxElements);

    this.variables.set(name, {
      val: value,
      explicitType,
      isList,
      isFixedArray,
      maxElements
    });

    return value;
  }

  public assignVar(name: string, value: RuntimeVal): RuntimeVal {
    const env = this.resolve(name);
    const varInfo = env.variables.get(name)!;

    this.validateType(name, value, varInfo.explicitType, varInfo.isList, varInfo.isFixedArray, varInfo.maxElements);

    varInfo.val = value;
    return value;
  }

  public lookupVar(name: string): RuntimeVal {
    const env = this.resolve(name);
    return env.variables.get(name)!.val;
  }

  public lookupVarInfo(name: string): VariableInfo {
    const env = this.resolve(name);
    return env.variables.get(name)!;
  }

  public resolve(name: string): Environment {
    if (this.variables.has(name)) {
      return this;
    }

    if (this.parent) {
      return this.parent.resolve(name);
    }

    throw new Error(`[LLP Runtime Error] Impossible de trouver la variable ou fonction '${name}'.`);
  }

  private validateType(
    name: string,
    val: RuntimeVal,
    explicitType: "General" | "int" | "float" | "string" | "bool",
    isList?: boolean,
    isFixedArray?: boolean,
    maxElements?: number
  ) {
    if (val.type === "null") return; // Null values allowed

    // 1. General type -> accepts any value type
    if (explicitType === "General") {
      // Check fixed array capacity if specified
      if (isFixedArray && maxElements !== undefined && val.type === "fixed_array") {
        if (val.value.length > maxElements) {
          throw new Error(
            `[LLP Type Error] Le tableau fixe '${name}' dépasse la taille maximale autorisée de ${maxElements} éléments (reçu ${val.value.length}).`
          );
        }
      }
      return;
    }

    // 2. Explicit Type Checks
    if (explicitType === "int") {
      if (val.type !== "number" || !Number.isInteger(val.value)) {
        throw new Error(`[LLP Type Error] La variable '${name}' de type 'int' attend un nombre entier (reçu ${val.type}: ${val.value}).`);
      }
    } else if (explicitType === "float") {
      if (val.type !== "number") {
        throw new Error(`[LLP Type Error] La variable '${name}' de type 'float' attend un nombre (reçu ${val.type}).`);
      }
    } else if (explicitType === "string") {
      if (val.type !== "string") {
        throw new Error(`[LLP Type Error] La variable '${name}' de type 'string' attend une chaîne (reçu ${val.type}).`);
      }
    } else if (explicitType === "bool") {
      if (val.type !== "boolean") {
        throw new Error(`[LLP Type Error] La variable '${name}' de type 'bool' attend un booléen (reçu ${val.type}).`);
      }
    }
  }
}
