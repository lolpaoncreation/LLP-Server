"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Environment = void 0;
class Environment {
    parent;
    variables = new Map();
    constructor(parentENV) {
        this.parent = parentENV;
    }
    declareVar(name, value, explicitType = "General", isList = false, isFixedArray = false, maxElements) {
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
    assignVar(name, value) {
        const env = this.resolve(name);
        const varInfo = env.variables.get(name);
        this.validateType(name, value, varInfo.explicitType, varInfo.isList, varInfo.isFixedArray, varInfo.maxElements);
        varInfo.val = value;
        return value;
    }
    lookupVar(name) {
        const env = this.resolve(name);
        return env.variables.get(name).val;
    }
    lookupVarInfo(name) {
        const env = this.resolve(name);
        return env.variables.get(name);
    }
    resolve(name) {
        if (this.variables.has(name)) {
            return this;
        }
        if (this.parent) {
            return this.parent.resolve(name);
        }
        throw new Error(`[LLP Runtime Error] Impossible de trouver la variable ou fonction '${name}'.`);
    }
    validateType(name, val, explicitType, isList, isFixedArray, maxElements) {
        if (val.type === "null")
            return; // Null values allowed
        // 1. General type -> accepts any value type
        if (explicitType === "General") {
            // Check fixed array capacity if specified
            if (isFixedArray && maxElements !== undefined && val.type === "fixed_array") {
                if (val.value.length > maxElements) {
                    throw new Error(`[LLP Type Error] Le tableau fixe '${name}' dépasse la taille maximale autorisée de ${maxElements} éléments (reçu ${val.value.length}).`);
                }
            }
            return;
        }
        // 2. Explicit Type Checks
        if (explicitType === "int") {
            if (val.type !== "number" || !Number.isInteger(val.value)) {
                throw new Error(`[LLP Type Error] La variable '${name}' de type 'int' attend un nombre entier (reçu ${val.type}: ${val.value}).`);
            }
        }
        else if (explicitType === "float") {
            if (val.type !== "number") {
                throw new Error(`[LLP Type Error] La variable '${name}' de type 'float' attend un nombre (reçu ${val.type}).`);
            }
        }
        else if (explicitType === "string") {
            if (val.type !== "string") {
                throw new Error(`[LLP Type Error] La variable '${name}' de type 'string' attend une chaîne (reçu ${val.type}).`);
            }
        }
        else if (explicitType === "bool") {
            if (val.type !== "boolean") {
                throw new Error(`[LLP Type Error] La variable '${name}' de type 'bool' attend un booléen (reçu ${val.type}).`);
            }
        }
    }
}
exports.Environment = Environment;
