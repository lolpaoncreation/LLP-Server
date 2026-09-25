export type NodeType = "Program" | "VarDeclaration" | "FunctionDeclaration" | "IfStatement" | "WhileStatement" | "ForInStatement" | "ReturnStatement" | "BlockStatement" | "ExpressionStatement" | "BreakpointStatement" | "AssignmentExpr" | "BinaryExpr" | "UnaryExpr" | "CallExpr" | "MemberExpr" | "IndexExpr" | "NumericLiteral" | "StringLiteral" | "BooleanLiteral" | "NullLiteral" | "Identifier" | "ListLiteral" | "FixedArrayLiteral" | "JsonObjectLiteral" | "FunctionExpr" | "NamedArgumentExpr" | "PairExpr" | "ModuleStatement" | "ClassDeclaration" | "NamespaceDeclaration";
export interface Statement {
    kind: NodeType;
    line?: number;
}
export interface Program extends Statement {
    kind: "Program";
    visibility?: string;
    body: Statement[];
}
export interface VarDeclaration extends Statement {
    kind: "VarDeclaration";
    name: string;
    explicitType: "General" | "Global" | "int" | "float" | "string" | "bool" | "Json" | "Hexa";
    value?: Expression;
    isList?: boolean;
    isFixedArray?: boolean;
    maxElements?: number;
}
export interface FunctionDeclaration extends Statement {
    kind: "FunctionDeclaration";
    name: string;
    parameters: string[];
    body: Statement[];
    isOverride?: boolean;
}
export interface ModuleStatement extends Statement {
    kind: "ModuleStatement";
    name: string;
    body: Statement[];
}
export interface ClassDeclaration extends Statement {
    kind: "ClassDeclaration";
    name: string;
    parentClassName?: string;
    body: Statement[];
    sourceFile?: string;
}
export interface NamespaceDeclaration extends Statement {
    kind: "NamespaceDeclaration";
    name: string;
    body: Statement[];
}
export interface IfStatement extends Statement {
    kind: "IfStatement";
    condition: Expression;
    thenBranch: Statement[];
    elseBranch?: Statement[];
}
export interface WhileStatement extends Statement {
    kind: "WhileStatement";
    condition: Expression;
    body: Statement[];
}
export interface ForInStatement extends Statement {
    kind: "ForInStatement";
    itemVar: string;
    listExpr: Expression;
    body: Statement[];
}
export interface ReturnStatement extends Statement {
    kind: "ReturnStatement";
    value?: Expression;
}
export interface BlockStatement extends Statement {
    kind: "BlockStatement";
    body: Statement[];
}
export interface ExpressionStatement extends Statement {
    kind: "ExpressionStatement";
    expression: Expression;
}
export interface Expression extends Statement {
}
export interface AssignmentExpr extends Expression {
    kind: "AssignmentExpr";
    target: Expression;
    value: Expression;
}
export interface BinaryExpr extends Expression {
    kind: "BinaryExpr";
    left: Expression;
    operator: string;
    right: Expression;
}
export interface UnaryExpr extends Expression {
    kind: "UnaryExpr";
    operator: string;
    operand: Expression;
}
export interface CallExpr extends Expression {
    kind: "CallExpr";
    callee: Expression;
    args: Expression[];
}
export interface MemberExpr extends Expression {
    kind: "MemberExpr";
    object: Expression;
    property: string;
}
export interface IndexExpr extends Expression {
    kind: "IndexExpr";
    array: Expression;
    index: Expression;
}
export interface NumericLiteral extends Expression {
    kind: "NumericLiteral";
    value: number;
}
export interface StringLiteral extends Expression {
    kind: "StringLiteral";
    value: string;
}
export interface BooleanLiteral extends Expression {
    kind: "BooleanLiteral";
    value: boolean;
}
export interface NullLiteral extends Expression {
    kind: "NullLiteral";
}
export interface Identifier extends Expression {
    kind: "Identifier";
    name: string;
}
export interface ListLiteral extends Expression {
    kind: "ListLiteral";
    elementType: string;
    items: Expression[];
}
export interface FixedArrayLiteral extends Expression {
    kind: "FixedArrayLiteral";
    elementType: string;
    maxElements: number;
    items: Expression[];
}
export interface NamedArgumentExpr extends Expression {
    kind: "NamedArgumentExpr";
    name: string;
    value: Expression;
}
export interface PairExpr extends Expression {
    kind: "PairExpr";
    left: Expression;
    right: Expression;
}
export interface BreakpointStatement extends Statement {
    kind: "BreakpointStatement";
    label?: string;
    line?: number;
}
export interface FunctionExpr extends Expression {
    kind: "FunctionExpr";
    name?: string;
    parameters: string[];
    body: Statement[];
    line?: number;
}
export interface JsonObjectLiteral extends Expression {
    kind: "JsonObjectLiteral";
    pairs: {
        key: string;
        value: Expression;
    }[];
    line?: number;
}
