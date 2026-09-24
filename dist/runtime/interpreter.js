"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReturnValue = void 0;
exports.evaluate = evaluate;
exports.evalBlockStatements = evalBlockStatements;
exports.callLLPFunction = callLLPFunction;
const environment_1 = require("./environment");
const instance_1 = require("./instance");
const instance_std_1 = require("../stdlib/instance_std");
const values_1 = require("./values");
class ReturnValue {
    value;
    constructor(value) {
        this.value = value;
    }
}
exports.ReturnValue = ReturnValue;
function evaluate(astNode, env) {
    switch (astNode.kind) {
        case "Program":
            return evalProgram(astNode, env);
        case "VarDeclaration":
            return evalVarDeclaration(astNode, env);
        case "FunctionDeclaration":
            return evalFunctionDeclaration(astNode, env);
        case "IfStatement":
            return evalIfStatement(astNode, env);
        case "WhileStatement":
            return evalWhileStatement(astNode, env);
        case "ForInStatement":
            return evalForInStatement(astNode, env);
        case "ReturnStatement":
            return evalReturnStatement(astNode, env);
        case "BlockStatement":
            return evalBlockStatement(astNode, env);
        case "ExpressionStatement":
            return evaluate(astNode.expression, env);
        case "NumericLiteral":
            return (0, values_1.MK_NUMBER)(astNode.value);
        case "StringLiteral":
            return (0, values_1.MK_STRING)(astNode.value);
        case "BooleanLiteral":
            return (0, values_1.MK_BOOL)(astNode.value);
        case "NullLiteral":
            return (0, values_1.MK_NULL)();
        case "Identifier":
            return evalIdentifier(astNode, env);
        case "ListLiteral":
            return evalListLiteral(astNode, env);
        case "FixedArrayLiteral":
            return evalFixedArrayLiteral(astNode, env);
        case "AssignmentExpr":
            return evalAssignment(astNode, env);
        case "BinaryExpr":
            return evalBinaryExpr(astNode, env);
        case "UnaryExpr":
            return evalUnaryExpr(astNode, env);
        case "CallExpr":
            return evalCallExpr(astNode, env);
        case "MemberExpr":
            return evalMemberExpr(astNode, env);
        case "IndexExpr":
            return evalIndexExpr(astNode, env);
        case "NamedArgumentExpr": {
            const named = astNode;
            const val = evaluate(named.value, env);
            return {
                type: "named_arg",
                name: named.name,
                value: val
            };
        }
        case "PairExpr": {
            const pair = astNode;
            const left = evaluate(pair.left, env);
            const right = evaluate(pair.right, env);
            return {
                type: "pair",
                left,
                right,
                value: `${left?.value}:${right?.value}`
            };
        }
        case "ModuleStatement":
            return evalModuleStatement(astNode, env);
        case "ClassDeclaration":
            return evalClassDeclaration(astNode, env);
        case "NamespaceDeclaration":
            return evalNamespaceDeclaration(astNode, env);
        default:
            throw new Error(`[LLP Interpreter Error] Nœud AST inconnu: ${astNode.kind}`);
    }
}
function evalProgram(program, env) {
    let lastEvaluated = (0, values_1.MK_NULL)();
    for (const statement of program.body) {
        try {
            lastEvaluated = evaluate(statement, env);
        }
        catch (e) {
            if (e instanceof ReturnValue) {
                return e.value;
            }
            throw e;
        }
    }
    return lastEvaluated;
}
function evalVarDeclaration(declaration, env) {
    let val = declaration.value
        ? evaluate(declaration.value, env)
        : (0, values_1.MK_NULL)();
    return env.declareVar(declaration.name, val, declaration.explicitType, declaration.isList, declaration.isFixedArray, declaration.maxElements);
}
function evalFunctionDeclaration(declaration, env) {
    const fnVal = {
        type: "fn",
        name: declaration.name,
        parameters: declaration.parameters,
        declarationEnv: env,
        body: declaration.body
    };
    return env.declareVar(declaration.name, fnVal, "General");
}
function evalIfStatement(stmt, env) {
    const cond = evaluate(stmt.condition, env);
    if (isTruthy(cond)) {
        return evalBlockStatements(stmt.thenBranch, new environment_1.Environment(env));
    }
    else if (stmt.elseBranch) {
        return evalBlockStatements(stmt.elseBranch, new environment_1.Environment(env));
    }
    return (0, values_1.MK_NULL)();
}
function evalWhileStatement(stmt, env) {
    let last = (0, values_1.MK_NULL)();
    while (isTruthy(evaluate(stmt.condition, env))) {
        last = evalBlockStatements(stmt.body, new environment_1.Environment(env));
    }
    return last;
}
function evalForInStatement(stmt, env) {
    const listVal = evaluate(stmt.listExpr, env);
    let elements = [];
    if (listVal.type === "list" && listVal.elements) {
        elements = listVal.elements.filter((e) => e !== null);
    }
    else if (listVal.type === "fixed_array" && listVal.elements) {
        elements = listVal.elements.filter((e) => e !== null);
    }
    else if (listVal.type === "string" && typeof listVal.value === "string") {
        elements = listVal.value.split("").map(c => (0, values_1.MK_STRING)(c));
    }
    else {
        throw new Error(`[LLP Runtime Error] La boucle 'for' attend une liste ou un tableau (reçu ${listVal.type}).`);
    }
    let last = (0, values_1.MK_NULL)();
    for (const item of elements) {
        const loopEnv = new environment_1.Environment(env);
        loopEnv.declareVar(stmt.itemVar, item, "General");
        last = evalBlockStatements(stmt.body, loopEnv);
    }
    return last;
}
function evalReturnStatement(stmt, env) {
    const val = stmt.value ? evaluate(stmt.value, env) : (0, values_1.MK_NULL)();
    throw new ReturnValue(val);
}
function evalBlockStatement(block, env) {
    return evalBlockStatements(block.body, env);
}
function evalBlockStatements(statements, env) {
    let last = (0, values_1.MK_NULL)();
    for (const stmt of statements) {
        last = evaluate(stmt, env);
    }
    return last;
}
function callLLPFunction(fn, args, callerEnv) {
    if (fn.type === "native_fn" && fn.call) {
        return fn.call(args, callerEnv || fn.declarationEnv || new environment_1.Environment());
    }
    if (fn.type === "fn" && fn.declarationEnv && fn.body && fn.parameters) {
        const scope = new environment_1.Environment(fn.declarationEnv);
        const positionalArgs = [];
        const namedArgs = new Map();
        for (const arg of args) {
            if (arg.type === "named_arg") {
                namedArgs.set(arg.name, arg.value);
            }
            else {
                positionalArgs.push(arg);
            }
        }
        for (let i = 0; i < fn.parameters.length; i++) {
            const pName = fn.parameters[i];
            let argVal = (0, values_1.MK_NULL)();
            if (namedArgs.has(pName)) {
                argVal = namedArgs.get(pName);
            }
            else if (i < positionalArgs.length) {
                argVal = positionalArgs[i];
            }
            scope.declareVar(pName, argVal, "General");
        }
        // Déclare les arguments nommés dans le scope de la fonction (ex: DevMode: True)
        for (const [key, val] of namedArgs.entries()) {
            if (!fn.parameters.includes(key)) {
                scope.declareVar(key, val, "General");
            }
        }
        try {
            return evalBlockStatements(fn.body, scope);
        }
        catch (e) {
            if (e instanceof ReturnValue) {
                return e.value;
            }
            throw e;
        }
    }
    return (0, values_1.MK_NULL)();
}
function evalIdentifier(ident, env) {
    return env.lookupVar(ident.name);
}
function evalListLiteral(node, env) {
    const elements = node.items.map(item => evaluate(item, env));
    return createListVal(node.elementType || "General", elements);
}
function createListVal(elementType, elements) {
    const listVal = {
        type: "list",
        elementType,
        elements
    };
    listVal.Add = (val) => {
        listVal.elements.push(val);
    };
    listVal.Remove = (index) => {
        if (index >= 0 && index < listVal.elements.length) {
            listVal.elements.splice(index, 1);
        }
    };
    listVal.Length = () => listVal.elements.length;
    return listVal;
}
function evalFixedArrayLiteral(node, env) {
    const elements = node.items.map(item => evaluate(item, env));
    if (elements.length > node.maxElements) {
        throw new Error(`[LLP Array Limit Error] Le tableau fixe dépasserait la capacité maximale de ${node.maxElements} (reçu ${elements.length} éléments).`);
    }
    return {
        type: "fixed_array",
        elementType: node.elementType || "General",
        maxElements: node.maxElements,
        elements
    };
}
function evalAssignment(node, env) {
    const value = evaluate(node.value, env);
    if (node.target.kind === "Identifier") {
        const varName = node.target.name;
        return env.assignVar(varName, value);
    }
    if (node.target.kind === "MemberExpr") {
        const member = node.target;
        const obj = evaluate(member.object, env);
        if (obj.type === "instance" && obj.instance) {
            obj.instance.SetProperty(member.property, value);
            return value;
        }
        throw new Error(`[LLP Assignment Error] Impossible d'assigner la propriété '${member.property}' sur le type ${obj.type}.`);
    }
    if (node.target.kind === "IndexExpr") {
        const indexExpr = node.target;
        const arrVal = evaluate(indexExpr.array, env);
        const idxVal = evaluate(indexExpr.index, env);
        if (idxVal.type !== "number") {
            throw new Error("[LLP Index Error] L'index doit être un nombre.");
        }
        const idx = Math.floor(idxVal.value);
        if (arrVal.type === "list" && arrVal.elements) {
            if (idx < 0)
                throw new Error(`[LLP Index Error] Index négatif non valide: ${idx}`);
            arrVal.elements[idx] = value;
            return value;
        }
        if (arrVal.type === "fixed_array" && arrVal.elements && arrVal.maxElements !== undefined) {
            if (idx < 0 || idx >= arrVal.maxElements) {
                throw new Error(`[LLP Index Error] Index ${idx} hors limites pour le tableau fixe de taille ${arrVal.maxElements}.`);
            }
            arrVal.elements[idx] = value;
            return value;
        }
    }
    throw new Error(`[LLP Assignment Error] Cible d'assignation non valide (${node.target.kind}).`);
}
function evalBinaryExpr(node, env) {
    const left = evaluate(node.left, env);
    const right = evaluate(node.right, env);
    // Logical operators
    if (node.operator === "&&" || node.operator === "and" || node.operator === "&") {
        return (0, values_1.MK_BOOL)(isTruthy(left) && isTruthy(right));
    }
    if (node.operator === "||" || node.operator === "or" || node.operator === "|") {
        return (0, values_1.MK_BOOL)(isTruthy(left) || isTruthy(right));
    }
    if (node.operator === "&|" || node.operator === "xor") {
        const l = isTruthy(left);
        const r = isTruthy(right);
        return (0, values_1.MK_BOOL)((l && !r) || (!l && r));
    }
    // Equality
    if (node.operator === "==") {
        return (0, values_1.MK_BOOL)(isEqual(left, right));
    }
    if (node.operator === "!=") {
        return (0, values_1.MK_BOOL)(!isEqual(left, right));
    }
    // Number / String operations
    if (left.type === "string" || right.type === "string") {
        if (node.operator === "+") {
            return (0, values_1.MK_STRING)(formatValForString(left) + formatValForString(right));
        }
    }
    if (left.type === "number" && right.type === "number") {
        const l = left.value;
        const r = right.value;
        switch (node.operator) {
            case "+":
                return (0, values_1.MK_NUMBER)(l + r);
            case "-":
                return (0, values_1.MK_NUMBER)(l - r);
            case "*":
                return (0, values_1.MK_NUMBER)(l * r);
            case "/":
                if (r === 0)
                    throw new Error("[LLP Math Error] Division par zéro.");
                return (0, values_1.MK_NUMBER)(l / r);
            case "%":
                return (0, values_1.MK_NUMBER)(l % r);
            case "<":
                return (0, values_1.MK_BOOL)(l < r);
            case "<=":
                return (0, values_1.MK_BOOL)(l <= r);
            case ">":
                return (0, values_1.MK_BOOL)(l > r);
            case ">=":
                return (0, values_1.MK_BOOL)(l >= r);
        }
    }
    throw new Error(`[LLP Binary Error] Opérateur '${node.operator}' non pris en charge entre ${left.type} et ${right.type}.`);
}
function evalUnaryExpr(node, env) {
    const operand = evaluate(node.operand, env);
    if (node.operator === "!") {
        return (0, values_1.MK_BOOL)(!isTruthy(operand));
    }
    if (node.operator === "-") {
        if (operand.type === "number") {
            return (0, values_1.MK_NUMBER)(-operand.value);
        }
        throw new Error(`[LLP Unary Error] Opérateur '-' non pris en charge sur ${operand.type}.`);
    }
    return operand;
}
function evalCallExpr(node, env) {
    const args = node.args.map(arg => evaluate(arg, env));
    const fn = evaluate(node.callee, env);
    if (fn.type === "native_fn" && fn.call) {
        return fn.call(args, env);
    }
    if (fn.type === "fn") {
        return callLLPFunction(fn, args, env);
    }
    if (fn.type === "instance" && fn.instance) {
        const inst = fn.instance;
        const newFn = inst.GetProperty("new");
        if (newFn && newFn.type === "native_fn" && newFn.call) {
            return newFn.call(args, env);
        }
    }
    throw new Error(`[LLP Call Error] Tentative d'appel sur un objet non-fonction de type ${fn.type}.`);
}
function evalMemberExpr(node, env) {
    const obj = evaluate(node.object, env);
    if ((obj.type === "instance" || obj.type === "native_fn") && obj.instance) {
        const inst = obj.instance;
        const prop = inst.GetProperty(node.property);
        return prop;
    }
    if (obj.type === "list") {
        if (node.property === "Add") {
            return {
                type: "native_fn",
                call: (args) => {
                    if (args.length > 0 && obj.Add)
                        obj.Add(args[0]);
                    return (0, values_1.MK_NULL)();
                }
            };
        }
        if (node.property === "Remove") {
            return {
                type: "native_fn",
                call: (args) => {
                    if (args.length > 0 && args[0].type === "number" && obj.Remove) {
                        obj.Remove(args[0].value);
                    }
                    return (0, values_1.MK_NULL)();
                }
            };
        }
        if (node.property === "Length") {
            return {
                type: "native_fn",
                call: () => (0, values_1.MK_NUMBER)(obj.elements ? obj.elements.length : 0)
            };
        }
    }
    if (obj.type === "fixed_array") {
        if (node.property === "Length") {
            return {
                type: "native_fn",
                call: () => (0, values_1.MK_NUMBER)(obj.elements ? obj.elements.length : 0)
            };
        }
        if (node.property === "MaxLength") {
            return {
                type: "native_fn",
                call: () => (0, values_1.MK_NUMBER)(obj.maxElements ?? 0)
            };
        }
    }
    return (0, values_1.MK_NULL)();
}
function evalIndexExpr(node, env) {
    const arrayVal = evaluate(node.array, env);
    const indexVal = evaluate(node.index, env);
    if (indexVal.type !== "number") {
        throw new Error("[LLP Index Error] L'index doit être un nombre.");
    }
    const idx = Math.floor(indexVal.value);
    if (arrayVal.type === "list" && arrayVal.elements) {
        if (idx < 0 || idx >= arrayVal.elements.length)
            return (0, values_1.MK_NULL)();
        return arrayVal.elements[idx] ?? (0, values_1.MK_NULL)();
    }
    if (arrayVal.type === "fixed_array" && arrayVal.elements && arrayVal.maxElements !== undefined) {
        if (idx < 0 || idx >= arrayVal.maxElements) {
            throw new Error(`[LLP Index Error] Index ${idx} hors des limites du tableau fixe (0..${arrayVal.maxElements - 1}).`);
        }
        return arrayVal.elements[idx] ?? (0, values_1.MK_NULL)();
    }
    if (arrayVal.type === "string" && typeof arrayVal.value === "string") {
        if (idx < 0 || idx >= arrayVal.value.length)
            return (0, values_1.MK_NULL)();
        return (0, values_1.MK_STRING)(arrayVal.value[idx]);
    }
    throw new Error(`[LLP Index Error] Indexation non prise en charge sur le type ${arrayVal.type}.`);
}
function isTruthy(val) {
    if (val.type === "boolean")
        return val.value;
    if (val.type === "null")
        return false;
    if (val.type === "number")
        return val.value !== 0;
    if (val.type === "string")
        return val.value.length > 0;
    return true;
}
function isEqual(a, b) {
    if (a.type !== b.type)
        return false;
    if (a.type === "null")
        return true;
    if (a.type === "number" || a.type === "string" || a.type === "boolean") {
        return a.value === b.value;
    }
    return a === b;
}
function formatValForString(val) {
    if (val.type === "null")
        return "null";
    if (val.type === "number" || val.type === "string" || val.type === "boolean") {
        return String(val.value);
    }
    if (val.type === "instance" && val.instance) {
        return val.instance.ToString();
    }
    return JSON.stringify(val);
}
function evalModuleStatement(stmt, env) {
    let moduleConfig = null;
    try {
        moduleConfig = env.lookupVar(stmt.name);
    }
    catch {
        moduleConfig = null;
    }
    // Le module ne s'exécute que s'il a été activé lors de l'appel (ex: DevMode: True ou DevMode: {...})
    if (!moduleConfig || !isTruthy(moduleConfig)) {
        return (0, values_1.MK_NULL)();
    }
    const modEnv = new environment_1.Environment(env);
    modEnv.declareVar(stmt.name, moduleConfig, "General");
    return evalBlockStatements(stmt.body, modEnv);
}
function evalClassDeclaration(stmt, env) {
    const className = stmt.name;
    const classObj = new instance_1.Instance("Class");
    classObj.Name = className;
    classObj.SourceFile = stmt.sourceFile || "";
    const construct = (args, callerEnv) => {
        let parentInst = null;
        if (args.length > 0 && args[0].type === "instance" && args[0].instance) {
            parentInst = args[0].instance;
        }
        const inst = new instance_1.Instance(className, parentInst, stmt.sourceFile || "");
        (0, instance_std_1.attachInstanceMethods)(inst);
        const instanceEnv = new environment_1.Environment(env);
        instanceEnv.declareVar("self", { type: "instance", instance: inst }, "General");
        for (const memberStmt of stmt.body) {
            if (memberStmt.kind === "VarDeclaration") {
                const varDecl = memberStmt;
                const val = varDecl.value ? evaluate(varDecl.value, instanceEnv) : (0, values_1.MK_NULL)();
                inst.SetProperty(varDecl.name, val);
                instanceEnv.declareVar(varDecl.name, val, "General");
            }
            else if (memberStmt.kind === "FunctionDeclaration") {
                const fnDecl = memberStmt;
                const fnVal = {
                    type: "fn",
                    name: fnDecl.name,
                    parameters: fnDecl.parameters,
                    declarationEnv: instanceEnv,
                    body: fnDecl.body
                };
                inst.SetProperty(fnDecl.name, fnVal);
                instanceEnv.declareVar(fnDecl.name, fnVal, "General");
            }
            else {
                evaluate(memberStmt, instanceEnv);
            }
        }
        return { type: "instance", instance: inst };
    };
    classObj.SetProperty("new", {
        type: "native_fn",
        call: (args, cEnv) => construct(args, cEnv)
    });
    (0, instance_std_1.attachInstanceMethods)(classObj);
    const classVal = {
        type: "native_fn",
        name: className,
        call: (args, cEnv) => construct(args, cEnv),
        instance: classObj
    };
    return env.declareVar(className, classVal, "General");
}
function evalNamespaceDeclaration(stmt, env) {
    const nsName = stmt.name;
    const nsInstance = new instance_1.Instance("Namespace");
    nsInstance.Name = nsName;
    (0, instance_std_1.attachInstanceMethods)(nsInstance);
    const nsEnv = new environment_1.Environment(env);
    for (const innerStmt of stmt.body) {
        evaluate(innerStmt, nsEnv);
        if (innerStmt.kind === "VarDeclaration") {
            const v = innerStmt;
            try {
                nsInstance.SetProperty(v.name, nsEnv.lookupVar(v.name));
            }
            catch { }
        }
        else if (innerStmt.kind === "FunctionDeclaration") {
            const f = innerStmt;
            try {
                nsInstance.SetProperty(f.name, nsEnv.lookupVar(f.name));
            }
            catch { }
        }
        else if (innerStmt.kind === "ClassDeclaration") {
            const c = innerStmt;
            try {
                nsInstance.SetProperty(c.name, nsEnv.lookupVar(c.name));
            }
            catch { }
        }
    }
    const nsVal = {
        type: "instance",
        instance: nsInstance
    };
    return env.declareVar(nsName, nsVal, "General");
}
