import { RuntimeVal, MK_NULL } from "./values";

export type SupportedType = "General" | "Global" | "int" | "float" | "string" | "bool" | "Json" | "Hexa";

export interface VariableInfo {
  val: RuntimeVal;
  explicitType: SupportedType;
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
    explicitType: SupportedType = "General",
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

  public getAllVariables(): Map<string, VariableInfo> {
    const all = new Map<string, VariableInfo>();
    if (this.parent) {
      const parentVars = this.parent.getAllVariables();
      for (const [k, v] of parentVars.entries()) {
        all.set(k, v);
      }
    }
    for (const [k, v] of this.variables.entries()) {
      all.set(k, v);
    }
    return all;
  }

  public hasVar(name: string): boolean {
    if (this.variables.has(name)) {
      return true;
    }
    if (this.parent) {
      return this.parent.hasVar(name);
    }
    return false;
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
    explicitType: SupportedType,
    isList?: boolean,
    isFixedArray?: boolean,
    maxElements?: number
  ) {
    if (val.type === "null") return; // Null values allowed

    // 1. General type -> accepts any value type (large interval, no limits)
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

    // 2. Global type -> accepts any value type, but with a small interval/range
    if (explicitType === "Global") {
      if (val.type === "number") {
        if (val.value < -32768 || val.value > 32767) {
          throw new Error(
            `[LLP Type Error] La variable Global '${name}' dépasse le petit intervalle autorisé [-32768, 32767] (reçu ${val.value}).`
          );
        }
      } else if (val.type === "string") {
        if (val.value.length > 256) {
          throw new Error(
            `[LLP Type Error] La variable Global '${name}' dépasse la taille maximale autorisée (max 256 caractères, reçu ${val.value.length}).`
          );
        }
      } else if (val.type === "list" || val.type === "fixed_array") {
        const len = val.elements ? val.elements.length : 0;
        if (len > 256) {
          throw new Error(
            `[LLP Type Error] La variable Global '${name}' dépasse la taille maximale autorisée (max 256 éléments, reçu ${len}).`
          );
        }
      }
      return;
    }

    // 3. Json type
    if (explicitType === "Json") {
      if (val.type === "json") return;
      if (val.type === "string") {
        try {
          const parsed = JSON.parse(val.value);
          (val as any).type = "json";
          val.value = parsed;
          return;
        } catch {
          throw new Error(
            `[LLP Type Error] La variable '${name}' de type 'Json' attend une chaîne au format JSON valide ou un objet Json.`
          );
        }
      }
      if (val.type === "list") {
        // Convert list to json array
        return;
      }
      // If primitive, wrap in json
      (val as any).type = "json";
      return;
    }

    // 4. Hexa type
    if (explicitType === "Hexa") {
      if (val.type === "hexa") return;
      if (val.type === "number") {
        if (!Number.isInteger(val.value)) {
          throw new Error(
            `[LLP Type Error] La variable '${name}' de type 'Hexa' attend un entier hexadécimal (reçu float: ${val.value}).`
          );
        }
        return;
      }
      if (val.type === "string") {
        const trimmed = val.value.trim();
        const isHex = /^(0x|0X|#)?[0-9a-fA-F]+$/.test(trimmed);
        if (!isHex) {
          throw new Error(
            `[LLP Type Error] La variable '${name}' de type 'Hexa' attend une chaîne hexadécimale valide (ex: 0xFF, '#FFA0', '1A2B', reçu '${val.value}').`
          );
        }
        return;
      }
      throw new Error(
        `[LLP Type Error] La variable '${name}' de type 'Hexa' attend un nombre ou une chaîne hexadécimale (reçu ${val.type}).`
      );
    }

    // 5. Explicit Type Checks: int, float, string, bool
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
