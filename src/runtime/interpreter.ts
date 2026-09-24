import {
  Program,
  Statement,
  Expression,
  VarDeclaration,
  FunctionDeclaration,
  IfStatement,
  WhileStatement,
  ForInStatement,
  ReturnStatement,
  BlockStatement,
  ExpressionStatement,
  AssignmentExpr,
  BinaryExpr,
  UnaryExpr,
  CallExpr,
  MemberExpr,
  IndexExpr,
  NumericLiteral,
  StringLiteral,
  BooleanLiteral,
  NullLiteral,
  Identifier,
  ListLiteral,
  FixedArrayLiteral,
  ModuleStatement,
  ClassDeclaration,
  NamespaceDeclaration
} from "../parser/ast";
import { Environment } from "./environment";
import { Instance } from "./instance";
import { attachInstanceMethods } from "../stdlib/instance_std";
import {
  RuntimeVal,
  MK_NUMBER,
  MK_STRING,
  MK_BOOL,
  MK_NULL,
  FunctionVal,
  ListVal,
  FixedArrayVal
} from "./values";

export class ReturnValue {
  public value: RuntimeVal;
  constructor(value: RuntimeVal) {
    this.value = value;
  }
}

export function evaluate(astNode: Statement, env: Environment): RuntimeVal {
  switch (astNode.kind) {
    case "Program":
      return evalProgram(astNode as Program, env);
    case "VarDeclaration":
      return evalVarDeclaration(astNode as VarDeclaration, env);
    case "FunctionDeclaration":
      return evalFunctionDeclaration(astNode as FunctionDeclaration, env);
    case "IfStatement":
      return evalIfStatement(astNode as IfStatement, env);
    case "WhileStatement":
      return evalWhileStatement(astNode as WhileStatement, env);
    case "ForInStatement":
      return evalForInStatement(astNode as ForInStatement, env);
    case "ReturnStatement":
      return evalReturnStatement(astNode as ReturnStatement, env);
    case "BlockStatement":
      return evalBlockStatement(astNode as BlockStatement, env);
    case "ExpressionStatement":
      return evaluate((astNode as ExpressionStatement).expression, env);
    case "NumericLiteral":
      return MK_NUMBER((astNode as NumericLiteral).value);
    case "StringLiteral":
      return MK_STRING((astNode as StringLiteral).value);
    case "BooleanLiteral":
      return MK_BOOL((astNode as BooleanLiteral).value);
    case "NullLiteral":
      return MK_NULL();
    case "Identifier":
      return evalIdentifier(astNode as Identifier, env);
    case "ListLiteral":
      return evalListLiteral(astNode as ListLiteral, env);
    case "FixedArrayLiteral":
      return evalFixedArrayLiteral(astNode as FixedArrayLiteral, env);
    case "AssignmentExpr":
      return evalAssignment(astNode as AssignmentExpr, env);
    case "BinaryExpr":
      return evalBinaryExpr(astNode as BinaryExpr, env);
    case "UnaryExpr":
      return evalUnaryExpr(astNode as UnaryExpr, env);
    case "CallExpr":
      return evalCallExpr(astNode as CallExpr, env);
    case "MemberExpr":
      return evalMemberExpr(astNode as MemberExpr, env);
    case "IndexExpr":
      return evalIndexExpr(astNode as IndexExpr, env);
    case "NamedArgumentExpr": {
      const named = astNode as any;
      const val = evaluate(named.value, env);
      return {
        type: "named_arg",
        name: named.name,
        value: val
      } as any;
    }
    case "PairExpr": {
      const pair = astNode as any;
      const left = evaluate(pair.left, env);
      const right = evaluate(pair.right, env);
      return {
        type: "pair",
        left,
        right,
        value: `${(left as any)?.value}:${(right as any)?.value}`
      } as any;
    }
    case "ModuleStatement":
      return evalModuleStatement(astNode as ModuleStatement, env);
    case "ClassDeclaration":
      return evalClassDeclaration(astNode as ClassDeclaration, env);
    case "NamespaceDeclaration":
      return evalNamespaceDeclaration(astNode as NamespaceDeclaration, env);
    default:
      throw new Error(`[LLP Interpreter Error] Nœud AST inconnu: ${astNode.kind}`);
  }
}

function evalProgram(program: Program, env: Environment): RuntimeVal {
  let lastEvaluated: RuntimeVal = MK_NULL();
  for (const statement of program.body) {
    try {
      lastEvaluated = evaluate(statement, env);
    } catch (e) {
      if (e instanceof ReturnValue) {
        return e.value;
      }
      throw e;
    }
  }
  return lastEvaluated;
}

function evalVarDeclaration(declaration: VarDeclaration, env: Environment): RuntimeVal {
  let val: RuntimeVal = declaration.value
    ? evaluate(declaration.value, env)
    : MK_NULL();

  return env.declareVar(
    declaration.name,
    val,
    declaration.explicitType,
    declaration.isList,
    declaration.isFixedArray,
    declaration.maxElements
  );
}

function evalFunctionDeclaration(declaration: FunctionDeclaration, env: Environment): RuntimeVal {
  const fnVal: FunctionVal = {
    type: "fn",
    name: declaration.name,
    parameters: declaration.parameters,
    declarationEnv: env,
    body: declaration.body
  };
  return env.declareVar(declaration.name, fnVal, "General");
}

function evalIfStatement(stmt: IfStatement, env: Environment): RuntimeVal {
  const cond = evaluate(stmt.condition, env);
  if (isTruthy(cond)) {
    return evalBlockStatements(stmt.thenBranch, new Environment(env));
  } else if (stmt.elseBranch) {
    return evalBlockStatements(stmt.elseBranch, new Environment(env));
  }
  return MK_NULL();
}

function evalWhileStatement(stmt: WhileStatement, env: Environment): RuntimeVal {
  let last: RuntimeVal = MK_NULL();
  while (isTruthy(evaluate(stmt.condition, env))) {
    last = evalBlockStatements(stmt.body, new Environment(env));
  }
  return last;
}

function evalForInStatement(stmt: ForInStatement, env: Environment): RuntimeVal {
  const listVal = evaluate(stmt.listExpr, env);
  let elements: RuntimeVal[] = [];

  if (listVal.type === "list" && listVal.elements) {
    elements = listVal.elements.filter((e): e is RuntimeVal => e !== null);
  } else if (listVal.type === "fixed_array" && listVal.elements) {
    elements = listVal.elements.filter((e): e is RuntimeVal => e !== null);
  } else if (listVal.type === "string" && typeof listVal.value === "string") {
    elements = listVal.value.split("").map(c => MK_STRING(c));
  } else {
    throw new Error(`[LLP Runtime Error] La boucle 'for' attend une liste ou un tableau (reçu ${listVal.type}).`);
  }

  let last: RuntimeVal = MK_NULL();
  for (const item of elements) {
    const loopEnv = new Environment(env);
    loopEnv.declareVar(stmt.itemVar, item, "General");
    last = evalBlockStatements(stmt.body, loopEnv);
  }
  return last;
}

function evalReturnStatement(stmt: ReturnStatement, env: Environment): RuntimeVal {
  const val = stmt.value ? evaluate(stmt.value, env) : MK_NULL();
  throw new ReturnValue(val);
}

function evalBlockStatement(block: BlockStatement, env: Environment): RuntimeVal {
  return evalBlockStatements(block.body, env);
}

export function evalBlockStatements(statements: Statement[], env: Environment): RuntimeVal {
  let last: RuntimeVal = MK_NULL();
  for (const stmt of statements) {
    last = evaluate(stmt, env);
  }
  return last;
}

export function callLLPFunction(fn: RuntimeVal, args: RuntimeVal[], callerEnv?: Environment): RuntimeVal {
  if (fn.type === "native_fn" && fn.call) {
    return fn.call(args, callerEnv || fn.declarationEnv || new Environment());
  }
  if (fn.type === "fn" && fn.declarationEnv && fn.body && fn.parameters) {
    const scope = new Environment(fn.declarationEnv);

    const positionalArgs: RuntimeVal[] = [];
    const namedArgs = new Map<string, RuntimeVal>();

    for (const arg of args) {
      if ((arg as any).type === "named_arg") {
        namedArgs.set((arg as any).name, (arg as any).value);
      } else {
        positionalArgs.push(arg);
      }
    }

    for (let i = 0; i < fn.parameters.length; i++) {
      const pName = fn.parameters[i];
      let argVal: RuntimeVal = MK_NULL();
      if (namedArgs.has(pName)) {
        argVal = namedArgs.get(pName)!;
      } else if (i < positionalArgs.length) {
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
    } catch (e) {
      if (e instanceof ReturnValue) {
        return e.value;
      }
      throw e;
    }
  }
  return MK_NULL();
}

function evalIdentifier(ident: Identifier, env: Environment): RuntimeVal {
  return env.lookupVar(ident.name);
}

function evalListLiteral(node: ListLiteral, env: Environment): ListVal {
  const elements = node.items.map(item => evaluate(item, env));
  return createListVal(node.elementType || "General", elements);
}

function createListVal(elementType: string, elements: RuntimeVal[]): ListVal {
  const listVal: ListVal = {
    type: "list",
    elementType,
    elements
  };

  listVal.Add = (val: RuntimeVal) => {
    listVal.elements.push(val);
  };

  listVal.Remove = (index: number) => {
    if (index >= 0 && index < listVal.elements.length) {
      listVal.elements.splice(index, 1);
    }
  };

  listVal.Length = () => listVal.elements.length;

  return listVal;
}

function evalFixedArrayLiteral(node: FixedArrayLiteral, env: Environment): FixedArrayVal {
  const elements = node.items.map(item => evaluate(item, env));
  if (elements.length > node.maxElements) {
    throw new Error(
      `[LLP Array Limit Error] Le tableau fixe dépasserait la capacité maximale de ${node.maxElements} (reçu ${elements.length} éléments).`
    );
  }
  return {
    type: "fixed_array",
    elementType: node.elementType || "General",
    maxElements: node.maxElements,
    elements
  };
}

function evalAssignment(node: AssignmentExpr, env: Environment): RuntimeVal {
  const value = evaluate(node.value, env);

  if (node.target.kind === "Identifier") {
    const varName = (node.target as Identifier).name;
    return env.assignVar(varName, value);
  }

  if (node.target.kind === "MemberExpr") {
    const member = node.target as MemberExpr;
    const obj = evaluate(member.object, env);
    if (obj.type === "instance" && obj.instance) {
      obj.instance.SetProperty(member.property, value);
      return value;
    }
    throw new Error(`[LLP Assignment Error] Impossible d'assigner la propriété '${member.property}' sur le type ${obj.type}.`);
  }

  if (node.target.kind === "IndexExpr") {
    const indexExpr = node.target as IndexExpr;
    const arrVal = evaluate(indexExpr.array, env);
    const idxVal = evaluate(indexExpr.index, env);

    if (idxVal.type !== "number") {
      throw new Error("[LLP Index Error] L'index doit être un nombre.");
    }
    const idx = Math.floor(idxVal.value);

    if (arrVal.type === "list" && arrVal.elements) {
      if (idx < 0) throw new Error(`[LLP Index Error] Index négatif non valide: ${idx}`);
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

function evalBinaryExpr(node: BinaryExpr, env: Environment): RuntimeVal {
  const left = evaluate(node.left, env);
  const right = evaluate(node.right, env);

  // Logical operators
  if (node.operator === "&&" || node.operator === "and" || node.operator === "&") {
    return MK_BOOL(isTruthy(left) && isTruthy(right));
  }
  if (node.operator === "||" || node.operator === "or" || node.operator === "|") {
    return MK_BOOL(isTruthy(left) || isTruthy(right));
  }
  if (node.operator === "&|" || node.operator === "xor") {
    const l = isTruthy(left);
    const r = isTruthy(right);
    return MK_BOOL((l && !r) || (!l && r));
  }

  // Equality
  if (node.operator === "==") {
    return MK_BOOL(isEqual(left, right));
  }
  if (node.operator === "!=") {
    return MK_BOOL(!isEqual(left, right));
  }

  // Number / String operations
  if (left.type === "string" || right.type === "string") {
    if (node.operator === "+") {
      return MK_STRING(formatValForString(left) + formatValForString(right));
    }
  }

  if (left.type === "number" && right.type === "number") {
    const l = left.value;
    const r = right.value;
    switch (node.operator) {
      case "+":
        return MK_NUMBER(l + r);
      case "-":
        return MK_NUMBER(l - r);
      case "*":
        return MK_NUMBER(l * r);
      case "/":
        if (r === 0) throw new Error("[LLP Math Error] Division par zéro.");
        return MK_NUMBER(l / r);
      case "%":
        return MK_NUMBER(l % r);
      case "<":
        return MK_BOOL(l < r);
      case "<=":
        return MK_BOOL(l <= r);
      case ">":
        return MK_BOOL(l > r);
      case ">=":
        return MK_BOOL(l >= r);
    }
  }

  throw new Error(
    `[LLP Binary Error] Opérateur '${node.operator}' non pris en charge entre ${left.type} et ${right.type}.`
  );
}

function evalUnaryExpr(node: UnaryExpr, env: Environment): RuntimeVal {
  const operand = evaluate(node.operand, env);
  if (node.operator === "!") {
    return MK_BOOL(!isTruthy(operand));
  }
  if (node.operator === "-") {
    if (operand.type === "number") {
      return MK_NUMBER(-operand.value);
    }
    throw new Error(`[LLP Unary Error] Opérateur '-' non pris en charge sur ${operand.type}.`);
  }
  return operand;
}

function evalCallExpr(node: CallExpr, env: Environment): RuntimeVal {
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

function evalMemberExpr(node: MemberExpr, env: Environment): RuntimeVal {
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
        call: (args: RuntimeVal[]) => {
          if (args.length > 0 && obj.Add) obj.Add(args[0]);
          return MK_NULL();
        }
      };
    }
    if (node.property === "Remove") {
      return {
        type: "native_fn",
        call: (args: RuntimeVal[]) => {
          if (args.length > 0 && args[0].type === "number" && obj.Remove) {
            obj.Remove(args[0].value);
          }
          return MK_NULL();
        }
      };
    }
    if (node.property === "Length") {
      return {
        type: "native_fn",
        call: () => MK_NUMBER(obj.elements ? obj.elements.length : 0)
      };
    }
  }

  if (obj.type === "fixed_array") {
    if (node.property === "Length") {
      return {
        type: "native_fn",
        call: () => MK_NUMBER(obj.elements ? obj.elements.length : 0)
      };
    }
    if (node.property === "MaxLength") {
      return {
        type: "native_fn",
        call: () => MK_NUMBER(obj.maxElements ?? 0)
      };
    }
  }

  return MK_NULL();
}

function evalIndexExpr(node: IndexExpr, env: Environment): RuntimeVal {
  const arrayVal = evaluate(node.array, env);
  const indexVal = evaluate(node.index, env);

  if (indexVal.type !== "number") {
    throw new Error("[LLP Index Error] L'index doit être un nombre.");
  }
  const idx = Math.floor(indexVal.value);

  if (arrayVal.type === "list" && arrayVal.elements) {
    if (idx < 0 || idx >= arrayVal.elements.length) return MK_NULL();
    return arrayVal.elements[idx] ?? MK_NULL();
  }

  if (arrayVal.type === "fixed_array" && arrayVal.elements && arrayVal.maxElements !== undefined) {
    if (idx < 0 || idx >= arrayVal.maxElements) {
      throw new Error(`[LLP Index Error] Index ${idx} hors des limites du tableau fixe (0..${arrayVal.maxElements - 1}).`);
    }
    return arrayVal.elements[idx] ?? MK_NULL();
  }

  if (arrayVal.type === "string" && typeof arrayVal.value === "string") {
    if (idx < 0 || idx >= arrayVal.value.length) return MK_NULL();
    return MK_STRING(arrayVal.value[idx]);
  }

  throw new Error(`[LLP Index Error] Indexation non prise en charge sur le type ${arrayVal.type}.`);
}

function isTruthy(val: RuntimeVal): boolean {
  if (val.type === "boolean") return val.value;
  if (val.type === "null") return false;
  if (val.type === "number") return val.value !== 0;
  if (val.type === "string") return val.value.length > 0;
  return true;
}

function isEqual(a: RuntimeVal, b: RuntimeVal): boolean {
  if (a.type !== b.type) return false;
  if (a.type === "null") return true;
  if (a.type === "number" || a.type === "string" || a.type === "boolean") {
    return a.value === b.value;
  }
  return a === b;
}

function formatValForString(val: RuntimeVal): string {
  if (val.type === "null") return "null";
  if (val.type === "number" || val.type === "string" || val.type === "boolean") {
    return String(val.value);
  }
  if (val.type === "instance" && val.instance) {
    return val.instance.ToString();
  }
  return JSON.stringify(val);
}

function evalModuleStatement(stmt: ModuleStatement, env: Environment): RuntimeVal {
  let moduleConfig: RuntimeVal | null = null;
  try {
    moduleConfig = env.lookupVar(stmt.name);
  } catch {
    moduleConfig = null;
  }

  // Le module ne s'exécute que s'il a été activé lors de l'appel (ex: DevMode: True ou DevMode: {...})
  if (!moduleConfig || !isTruthy(moduleConfig)) {
    return MK_NULL();
  }

  const modEnv = new Environment(env);
  modEnv.declareVar(stmt.name, moduleConfig, "General");
  return evalBlockStatements(stmt.body, modEnv);
}

function evalClassDeclaration(stmt: ClassDeclaration, env: Environment): RuntimeVal {
  const className = stmt.name;
  const classObj = new Instance("Class");
  classObj.Name = className;
  classObj.SourceFile = stmt.sourceFile || "";

  const construct = (args: RuntimeVal[], callerEnv?: Environment): RuntimeVal => {
    let parentInst: Instance | null = null;
    if (args.length > 0 && args[0].type === "instance" && args[0].instance) {
      parentInst = args[0].instance;
    }

    const inst = new Instance(className, parentInst, stmt.sourceFile || "");
    attachInstanceMethods(inst);

    const instanceEnv = new Environment(env);
    instanceEnv.declareVar("self", { type: "instance", instance: inst }, "General");

    for (const memberStmt of stmt.body) {
      if (memberStmt.kind === "VarDeclaration") {
        const varDecl = memberStmt as VarDeclaration;
        const val = varDecl.value ? evaluate(varDecl.value, instanceEnv) : MK_NULL();
        inst.SetProperty(varDecl.name, val);
        instanceEnv.declareVar(varDecl.name, val, "General");
      } else if (memberStmt.kind === "FunctionDeclaration") {
        const fnDecl = memberStmt as FunctionDeclaration;
        const fnVal: FunctionVal = {
          type: "fn",
          name: fnDecl.name,
          parameters: fnDecl.parameters,
          declarationEnv: instanceEnv,
          body: fnDecl.body
        };
        inst.SetProperty(fnDecl.name, fnVal);
        instanceEnv.declareVar(fnDecl.name, fnVal, "General");
      } else {
        evaluate(memberStmt, instanceEnv);
      }
    }

    return { type: "instance", instance: inst };
  };

  classObj.SetProperty("new", {
    type: "native_fn",
    call: (args: RuntimeVal[], cEnv: Environment) => construct(args, cEnv)
  });

  attachInstanceMethods(classObj);

  const classVal: RuntimeVal = {
    type: "native_fn",
    name: className,
    call: (args: RuntimeVal[], cEnv: Environment) => construct(args, cEnv),
    instance: classObj
  };

  return env.declareVar(className, classVal, "General");
}

function evalNamespaceDeclaration(stmt: NamespaceDeclaration, env: Environment): RuntimeVal {
  const nsName = stmt.name;
  const nsInstance = new Instance("Namespace");
  nsInstance.Name = nsName;
  attachInstanceMethods(nsInstance);

  const nsEnv = new Environment(env);

  for (const innerStmt of stmt.body) {
    evaluate(innerStmt, nsEnv);
    if (innerStmt.kind === "VarDeclaration") {
      const v = innerStmt as VarDeclaration;
      try {
        nsInstance.SetProperty(v.name, nsEnv.lookupVar(v.name));
      } catch {}
    } else if (innerStmt.kind === "FunctionDeclaration") {
      const f = innerStmt as FunctionDeclaration;
      try {
        nsInstance.SetProperty(f.name, nsEnv.lookupVar(f.name));
      } catch {}
    } else if (innerStmt.kind === "ClassDeclaration") {
      const c = innerStmt as ClassDeclaration;
      try {
        nsInstance.SetProperty(c.name, nsEnv.lookupVar(c.name));
      } catch {}
    }
  }

  const nsVal: RuntimeVal = {
    type: "instance",
    instance: nsInstance
  };

  return env.declareVar(nsName, nsVal, "General");
}
