"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const tokens_1 = require("../lexer/tokens");
class Parser {
    tokens;
    current = 0;
    sourceFile;
    constructor(tokens, sourceFile) {
        this.tokens = tokens;
        this.sourceFile = sourceFile;
    }
    produceAST() {
        const program = {
            kind: "Program",
            body: []
        };
        if (this.peek().type === tokens_1.TokenType.KwVisibility) {
            this.advance(); // visibility
            this.expect(tokens_1.TokenType.Colon, "':' attendu après 'visibility'.");
            const visLevel = this.expect(tokens_1.TokenType.Identifier, "Niveau de visibilité attendu (All, Package, Parent, Private).");
            program.visibility = visLevel.value;
            this.skipOptionalSemicolon();
        }
        while (this.current < this.tokens.length && this.peek().type !== tokens_1.TokenType.EOF) {
            program.body.push(this.parseStatement());
        }
        return program;
    }
    parseStatement() {
        const token = this.peek();
        // Variable declaration: General, int, float, string, bool
        if (this.isTypeKeyword(token.type)) {
            return this.parseVarDeclaration();
        }
        if (token.type === tokens_1.TokenType.KwFunc) {
            return this.parseFunctionDeclaration();
        }
        if (token.type === tokens_1.TokenType.KwIf) {
            return this.parseIfStatement();
        }
        if (token.type === tokens_1.TokenType.KwWhile) {
            return this.parseWhileStatement();
        }
        if (token.type === tokens_1.TokenType.KwFor) {
            return this.parseForInStatement();
        }
        if (token.type === tokens_1.TokenType.KwReturn) {
            return this.parseReturnStatement();
        }
        if (token.type === tokens_1.TokenType.KwClass) {
            return this.parseClassDeclaration();
        }
        if (token.type === tokens_1.TokenType.KwModule) {
            return this.parseModuleStatement();
        }
        if (token.type === tokens_1.TokenType.KwNamespace) {
            return this.parseNamespaceDeclaration();
        }
        if (token.type === tokens_1.TokenType.OpenBrace) {
            return this.parseBlockStatement();
        }
        return this.parseExpressionStatement();
    }
    isTypeKeyword(type) {
        return (type === tokens_1.TokenType.KwGeneral ||
            type === tokens_1.TokenType.KwInt ||
            type === tokens_1.TokenType.KwFloat ||
            type === tokens_1.TokenType.KwString ||
            type === tokens_1.TokenType.KwBool);
    }
    parseVarDeclaration() {
        const typeToken = this.advance();
        const explicitType = typeToken.value;
        let isList = false;
        let isFixedArray = false;
        let maxElements;
        // Check for fixed array declaration type: type[size] name
        if (this.peek().type === tokens_1.TokenType.OpenBracket) {
            this.advance(); // [
            const sizeToken = this.expect(tokens_1.TokenType.Number, "Taille du tableau fixe attendue entre [].");
            maxElements = parseInt(sizeToken.value, 10);
            this.expect(tokens_1.TokenType.CloseBracket, "']' attendu après la taille du tableau fixe.");
            isFixedArray = true;
        }
        else if (this.peek().type === tokens_1.TokenType.OpenBrace) {
            isList = true;
        }
        const varNameToken = this.expect(tokens_1.TokenType.Identifier, "Nom de variable attendu.");
        const varName = varNameToken.value;
        let value;
        if (this.peek().type === tokens_1.TokenType.Equals) {
            this.advance(); // =
            value = this.parseExpression();
        }
        this.skipOptionalSemicolon();
        return {
            kind: "VarDeclaration",
            name: varName,
            explicitType,
            value,
            isList,
            isFixedArray,
            maxElements
        };
    }
    parseFunctionDeclaration() {
        this.advance(); // func
        const nameToken = this.expect(tokens_1.TokenType.Identifier, "Nom de fonction attendu.");
        this.expect(tokens_1.TokenType.OpenParen, "'(' attendu après le nom de fonction.");
        const parameters = [];
        if (this.peek().type !== tokens_1.TokenType.CloseParen) {
            do {
                // Optional type preceding param name
                if (this.isTypeKeyword(this.peek().type)) {
                    this.advance();
                }
                const paramToken = this.expect(tokens_1.TokenType.Identifier, "Nom de paramètre attendu.");
                parameters.push(paramToken.value);
                if (this.peek().type === tokens_1.TokenType.Comma) {
                    this.advance();
                }
                else {
                    break;
                }
            } while (this.peek().type !== tokens_1.TokenType.CloseParen);
        }
        this.expect(tokens_1.TokenType.CloseParen, "')' attendu après la liste de paramètres.");
        let body = [];
        if (this.peek().type === tokens_1.TokenType.OpenBrace) {
            const block = this.parseBlockStatement();
            body = block.body;
        }
        else if (this.peek().type === tokens_1.TokenType.KwThen) {
            this.advance(); // then
            while (this.current < this.tokens.length && this.peek().type !== tokens_1.TokenType.KwEnd) {
                body.push(this.parseStatement());
            }
            this.expect(tokens_1.TokenType.KwEnd, "'end' attendu à la fin de la fonction.");
        }
        else {
            throw new Error(`[LLP Parser Error] Corps de fonction '{ ... }' ou 'then ... end' attendu.`);
        }
        return {
            kind: "FunctionDeclaration",
            name: nameToken.value,
            parameters,
            body
        };
    }
    parseClassDeclaration() {
        this.advance(); // class
        const nameToken = this.expect(tokens_1.TokenType.Identifier, "Nom de classe attendu après 'class'.");
        const className = nameToken.value;
        let parentClassName;
        if (this.peek().type === tokens_1.TokenType.Colon) {
            this.advance(); // :
            const parentToken = this.expect(tokens_1.TokenType.Identifier, "Nom de la classe parente attendu après ':'.");
            parentClassName = parentToken.value;
        }
        let body = [];
        if (this.peek().type === tokens_1.TokenType.KwThen) {
            this.advance(); // then
            while (this.current < this.tokens.length && this.peek().type !== tokens_1.TokenType.KwEnd) {
                body.push(this.parseStatement());
            }
            this.expect(tokens_1.TokenType.KwEnd, "'end' attendu à la fin de la classe.");
        }
        else if (this.peek().type === tokens_1.TokenType.OpenBrace) {
            const block = this.parseBlockStatement();
            body = block.body;
        }
        else {
            throw new Error(`[LLP Parser Error] 'then ... end' ou '{ ... }' attendu pour le corps de la classe '${className}'.`);
        }
        return {
            kind: "ClassDeclaration",
            name: className,
            parentClassName,
            body,
            sourceFile: this.sourceFile
        };
    }
    parseModuleStatement() {
        this.advance(); // module
        const nameToken = this.expect(tokens_1.TokenType.Identifier, "Nom de module attendu après 'module'.");
        const moduleName = nameToken.value;
        let body = [];
        if (this.peek().type === tokens_1.TokenType.KwThen) {
            this.advance(); // then
            while (this.current < this.tokens.length && this.peek().type !== tokens_1.TokenType.KwEnd) {
                body.push(this.parseStatement());
            }
            this.expect(tokens_1.TokenType.KwEnd, "'end' attendu à la fin du module.");
        }
        else if (this.peek().type === tokens_1.TokenType.OpenBrace) {
            const block = this.parseBlockStatement();
            body = block.body;
        }
        else {
            throw new Error(`[LLP Parser Error] 'then ... end' ou '{ ... }' attendu pour le corps du module '${moduleName}'.`);
        }
        return {
            kind: "ModuleStatement",
            name: moduleName,
            body
        };
    }
    parseNamespaceDeclaration() {
        this.advance(); // namespace
        const nameToken = this.expect(tokens_1.TokenType.Identifier, "Nom de namespace attendu après 'namespace'.");
        const nsName = nameToken.value;
        let body = [];
        if (this.peek().type === tokens_1.TokenType.KwThen) {
            this.advance(); // then
            while (this.current < this.tokens.length && this.peek().type !== tokens_1.TokenType.KwEnd) {
                body.push(this.parseStatement());
            }
            this.expect(tokens_1.TokenType.KwEnd, "'end' attendu à la fin du namespace.");
        }
        else if (this.peek().type === tokens_1.TokenType.OpenBrace) {
            const block = this.parseBlockStatement();
            body = block.body;
        }
        else {
            throw new Error(`[LLP Parser Error] 'then ... end' ou '{ ... }' attendu pour le corps du namespace '${nsName}'.`);
        }
        return {
            kind: "NamespaceDeclaration",
            name: nsName,
            body
        };
    }
    parseIfStatement() {
        this.advance(); // if
        const hasParen = this.peek().type === tokens_1.TokenType.OpenParen;
        if (hasParen)
            this.advance();
        const condition = this.parseExpression();
        if (hasParen)
            this.expect(tokens_1.TokenType.CloseParen, "')' attendu après la condition du if.");
        let thenBranch = [];
        let elseBranch;
        if (this.peek().type === tokens_1.TokenType.KwThen) {
            this.advance(); // then
            while (this.peek().type !== tokens_1.TokenType.KwElse &&
                this.peek().type !== tokens_1.TokenType.KwEnd &&
                this.peek().type !== tokens_1.TokenType.EOF) {
                thenBranch.push(this.parseStatement());
            }
            if (this.peek().type === tokens_1.TokenType.KwElse) {
                this.advance(); // else
                if (this.peek().type === tokens_1.TokenType.KwIf) {
                    elseBranch = [this.parseIfStatement()];
                    return { kind: "IfStatement", condition, thenBranch, elseBranch };
                }
                else {
                    elseBranch = [];
                    while (this.peek().type !== tokens_1.TokenType.KwEnd && this.peek().type !== tokens_1.TokenType.EOF) {
                        elseBranch.push(this.parseStatement());
                    }
                    this.expect(tokens_1.TokenType.KwEnd, "'end' attendu à la fin du bloc if/else.");
                }
            }
            else {
                this.expect(tokens_1.TokenType.KwEnd, "'end' attendu à la fin du bloc if.");
            }
        }
        else if (this.peek().type === tokens_1.TokenType.OpenBrace) {
            const thenBlock = this.parseBlockStatement();
            thenBranch = thenBlock.body;
            if (this.peek().type === tokens_1.TokenType.KwElse) {
                this.advance(); // else
                if (this.peek().type === tokens_1.TokenType.KwIf) {
                    elseBranch = [this.parseIfStatement()];
                }
                else {
                    elseBranch = this.parseBlockStatement().body;
                }
            }
        }
        else {
            throw new Error(`[LLP Parser Error] 'then' ou '{' attendu après la condition du if.`);
        }
        return {
            kind: "IfStatement",
            condition,
            thenBranch,
            elseBranch
        };
    }
    parseWhileStatement() {
        this.advance(); // while
        const hasParen = this.peek().type === tokens_1.TokenType.OpenParen;
        if (hasParen)
            this.advance();
        const condition = this.parseExpression();
        if (hasParen)
            this.expect(tokens_1.TokenType.CloseParen, "')' attendu après la condition du while.");
        let body = [];
        if (this.peek().type === tokens_1.TokenType.KwThen || this.peek().type === tokens_1.TokenType.KwDo) {
            this.advance(); // then / do
            while (this.peek().type !== tokens_1.TokenType.KwEnd && this.peek().type !== tokens_1.TokenType.EOF) {
                body.push(this.parseStatement());
            }
            this.expect(tokens_1.TokenType.KwEnd, "'end' attendu à la fin de la boucle while.");
        }
        else if (this.peek().type === tokens_1.TokenType.OpenBrace) {
            body = this.parseBlockStatement().body;
        }
        else {
            throw new Error(`[LLP Parser Error] 'then', 'do' ou '{' attendu après la condition du while.`);
        }
        return {
            kind: "WhileStatement",
            condition,
            body
        };
    }
    parseForInStatement() {
        this.advance(); // for
        const itemVar = this.expect(tokens_1.TokenType.Identifier, "Nom de variable de boucle attendu.").value;
        this.expect(tokens_1.TokenType.KwIn, "'in' attendu dans la boucle for.");
        const listExpr = this.parseExpression();
        let body = [];
        if (this.peek().type === tokens_1.TokenType.KwThen || this.peek().type === tokens_1.TokenType.KwDo) {
            this.advance(); // then / do
            while (this.peek().type !== tokens_1.TokenType.KwEnd && this.peek().type !== tokens_1.TokenType.EOF) {
                body.push(this.parseStatement());
            }
            this.expect(tokens_1.TokenType.KwEnd, "'end' attendu à la fin de la boucle for.");
        }
        else if (this.peek().type === tokens_1.TokenType.OpenBrace) {
            body = this.parseBlockStatement().body;
        }
        else {
            // If neither, also allow direct statements up to 'end'
            if (this.peek().type !== tokens_1.TokenType.OpenBrace && this.peek().type !== tokens_1.TokenType.KwEnd) {
                while (this.peek().type !== tokens_1.TokenType.KwEnd && this.peek().type !== tokens_1.TokenType.EOF) {
                    body.push(this.parseStatement());
                }
                this.expect(tokens_1.TokenType.KwEnd, "'end' attendu à la fin de la boucle for.");
            }
            else {
                throw new Error(`[LLP Parser Error] 'then', 'do', bloc '{' ou corps terminé par 'end' attendu dans la boucle for.`);
            }
        }
        return {
            kind: "ForInStatement",
            itemVar,
            listExpr,
            body
        };
    }
    parseReturnStatement() {
        this.advance(); // return
        let value;
        if (this.peek().type !== tokens_1.TokenType.Semicolon && this.peek().type !== tokens_1.TokenType.CloseBrace && this.peek().type !== tokens_1.TokenType.EOF) {
            value = this.parseExpression();
        }
        this.skipOptionalSemicolon();
        return {
            kind: "ReturnStatement",
            value
        };
    }
    parseBlockStatement() {
        this.expect(tokens_1.TokenType.OpenBrace, "'{' attendu au début d'un bloc.");
        const body = [];
        while (this.peek().type !== tokens_1.TokenType.CloseBrace && this.peek().type !== tokens_1.TokenType.EOF) {
            body.push(this.parseStatement());
        }
        this.expect(tokens_1.TokenType.CloseBrace, "'}' attendu à la fin d'un bloc.");
        return {
            kind: "BlockStatement",
            body
        };
    }
    parseExpressionStatement() {
        const expr = this.parseExpression();
        this.skipOptionalSemicolon();
        return {
            kind: "ExpressionStatement",
            expression: expr
        };
    }
    parseExpression() {
        return this.parseAssignment();
    }
    parseAssignment() {
        const left = this.parseLogicalOr();
        if (this.peek().type === tokens_1.TokenType.Equals) {
            this.advance(); // =
            const value = this.parseAssignment();
            return {
                kind: "AssignmentExpr",
                target: left,
                value
            };
        }
        return left;
    }
    parseLogicalOr() {
        let left = this.parseLogicalXor();
        while (this.peek().type === tokens_1.TokenType.Or) {
            const op = this.advance().value;
            const right = this.parseLogicalXor();
            left = {
                kind: "BinaryExpr",
                left,
                operator: op,
                right
            };
        }
        return left;
    }
    parseLogicalXor() {
        let left = this.parseLogicalAnd();
        while (this.peek().type === tokens_1.TokenType.Xor) {
            const op = this.advance().value;
            const right = this.parseLogicalAnd();
            left = {
                kind: "BinaryExpr",
                left,
                operator: op,
                right
            };
        }
        return left;
    }
    parseLogicalAnd() {
        let left = this.parseEquality();
        while (this.peek().type === tokens_1.TokenType.And) {
            const op = this.advance().value;
            const right = this.parseEquality();
            left = {
                kind: "BinaryExpr",
                left,
                operator: op,
                right
            };
        }
        return left;
    }
    parseEquality() {
        let left = this.parseRelational();
        while (this.peek().type === tokens_1.TokenType.DoubleEquals || this.peek().type === tokens_1.TokenType.NotEquals) {
            const op = this.advance().value;
            const right = this.parseRelational();
            left = {
                kind: "BinaryExpr",
                left,
                operator: op,
                right
            };
        }
        return left;
    }
    parseRelational() {
        let left = this.parseAdditive();
        while (this.peek().type === tokens_1.TokenType.Less ||
            this.peek().type === tokens_1.TokenType.LessOrEqual ||
            this.peek().type === tokens_1.TokenType.Greater ||
            this.peek().type === tokens_1.TokenType.GreaterOrEqual) {
            const op = this.advance().value;
            const right = this.parseAdditive();
            left = {
                kind: "BinaryExpr",
                left,
                operator: op,
                right
            };
        }
        return left;
    }
    parseAdditive() {
        let left = this.parseMultiplicative();
        while (this.peek().type === tokens_1.TokenType.Plus || this.peek().type === tokens_1.TokenType.Minus) {
            const op = this.advance().value;
            const right = this.parseMultiplicative();
            left = {
                kind: "BinaryExpr",
                left,
                operator: op,
                right
            };
        }
        return left;
    }
    parseMultiplicative() {
        let left = this.parseUnary();
        while (this.peek().type === tokens_1.TokenType.Star ||
            this.peek().type === tokens_1.TokenType.Slash ||
            this.peek().type === tokens_1.TokenType.Percent) {
            const op = this.advance().value;
            const right = this.parseUnary();
            left = {
                kind: "BinaryExpr",
                left,
                operator: op,
                right
            };
        }
        return left;
    }
    parseUnary() {
        if (this.peek().type === tokens_1.TokenType.Bang || this.peek().type === tokens_1.TokenType.Minus) {
            const op = this.advance().value;
            const operand = this.parseUnary();
            return {
                kind: "UnaryExpr",
                operator: op,
                operand
            };
        }
        return this.parseCallMember();
    }
    parseCallMember() {
        let expr = this.parsePrimary();
        while (true) {
            if (this.peek().type === tokens_1.TokenType.Dot) {
                this.advance(); // .
                const propToken = this.peek();
                if (propToken.type === tokens_1.TokenType.Identifier ||
                    propToken.type === tokens_1.TokenType.KwNew ||
                    this.isTypeKeyword(propToken.type)) {
                    this.advance();
                    expr = {
                        kind: "MemberExpr",
                        object: expr,
                        property: propToken.value
                    };
                }
                else {
                    throw new Error(`[LLP Parser Error] Nom de propriété ou méthode attendu après '.'. Reçu '${propToken.value}'`);
                }
            }
            else if (this.peek().type === tokens_1.TokenType.OpenParen) {
                this.advance(); // (
                const args = [];
                if (this.peek().type !== tokens_1.TokenType.CloseParen) {
                    do {
                        args.push(this.parseArgumentExpression());
                        if (this.peek().type === tokens_1.TokenType.Comma) {
                            this.advance();
                        }
                        else {
                            break;
                        }
                    } while (this.peek().type !== tokens_1.TokenType.CloseParen);
                }
                this.expect(tokens_1.TokenType.CloseParen, "')' attendu après les arguments d'appel.");
                expr = {
                    kind: "CallExpr",
                    callee: expr,
                    args
                };
            }
            else if (this.peek().type === tokens_1.TokenType.OpenBracket) {
                this.advance(); // [
                const index = this.parseExpression();
                this.expect(tokens_1.TokenType.CloseBracket, "']' attendu après l'index de tableau.");
                expr = {
                    kind: "IndexExpr",
                    array: expr,
                    index
                };
            }
            else {
                break;
            }
        }
        return expr;
    }
    parsePrimary() {
        const token = this.peek();
        // Type literal expressions for lists and arrays: General{}, General[5]{...}, int{...}, int[3]{...}
        if (this.isTypeKeyword(token.type)) {
            const typeToken = this.advance();
            const typeName = typeToken.value;
            // Check if General[N]{...}
            if (this.peek().type === tokens_1.TokenType.OpenBracket) {
                this.advance(); // [
                const sizeTok = this.expect(tokens_1.TokenType.Number, "Taille de tableau fixe attendue.");
                const maxElements = parseInt(sizeTok.value, 10);
                this.expect(tokens_1.TokenType.CloseBracket, "']' attendu.");
                this.expect(tokens_1.TokenType.OpenBrace, "'{' attendu pour la liste d'éléments du tableau fixe.");
                const items = this.parseExpressionList(tokens_1.TokenType.CloseBrace);
                this.expect(tokens_1.TokenType.CloseBrace, "'}' attendu.");
                return {
                    kind: "FixedArrayLiteral",
                    elementType: typeName,
                    maxElements,
                    items
                };
            }
            // Check if General{...}
            if (this.peek().type === tokens_1.TokenType.OpenBrace) {
                this.advance(); // {
                const items = this.parseExpressionList(tokens_1.TokenType.CloseBrace);
                this.expect(tokens_1.TokenType.CloseBrace, "'}' attendu.");
                return {
                    kind: "ListLiteral",
                    elementType: typeName,
                    items
                };
            }
            // If it was just a type keyword without { or [, treat as identifier
            return {
                kind: "Identifier",
                name: typeName
            };
        }
        if (token.type === tokens_1.TokenType.Number) {
            this.advance();
            return {
                kind: "NumericLiteral",
                value: parseFloat(token.value)
            };
        }
        if (token.type === tokens_1.TokenType.String) {
            this.advance();
            return {
                kind: "StringLiteral",
                value: token.value
            };
        }
        if (token.type === tokens_1.TokenType.KwTrue) {
            this.advance();
            return { kind: "BooleanLiteral", value: true };
        }
        if (token.type === tokens_1.TokenType.KwFalse) {
            this.advance();
            return { kind: "BooleanLiteral", value: false };
        }
        if (token.type === tokens_1.TokenType.KwNull) {
            this.advance();
            return { kind: "NullLiteral" };
        }
        if (token.type === tokens_1.TokenType.Identifier) {
            this.advance();
            return { kind: "Identifier", name: token.value };
        }
        // Direct List literal: { item1, item2 }
        if (token.type === tokens_1.TokenType.OpenBrace) {
            this.advance(); // {
            const items = this.parseExpressionList(tokens_1.TokenType.CloseBrace);
            this.expect(tokens_1.TokenType.CloseBrace, "'}' attendu.");
            return {
                kind: "ListLiteral",
                elementType: "General",
                items
            };
        }
        if (token.type === tokens_1.TokenType.OpenParen) {
            this.advance(); // (
            const expr = this.parseExpression();
            this.expect(tokens_1.TokenType.CloseParen, "')' attendu.");
            return expr;
        }
        throw new Error(`[LLP Parser Error] Jeton inattendu '${token.value}' (${tokens_1.TokenType[token.type]}) à la ligne ${token.line}:${token.column}`);
    }
    parseExpressionList(endToken) {
        const items = [];
        if (this.peek().type !== endToken) {
            do {
                items.push(this.parseExpression());
                if (this.peek().type === tokens_1.TokenType.Comma) {
                    this.advance();
                }
                else {
                    break;
                }
            } while (this.peek().type !== endToken);
        }
        return items;
    }
    parseArgumentExpression() {
        if (this.peek().type === tokens_1.TokenType.Identifier && this.peekNext()?.type === tokens_1.TokenType.Colon) {
            const nameTok = this.advance();
            this.advance(); // consume ':'
            const value = this.parseArgumentValue();
            return {
                kind: "NamedArgumentExpr",
                name: nameTok.value,
                value
            };
        }
        return this.parseArgumentValue();
    }
    parseArgumentValue() {
        let expr = this.parseExpression();
        if (this.peek().type === tokens_1.TokenType.Colon) {
            this.advance(); // consume ':'
            const right = this.parseExpression();
            expr = {
                kind: "PairExpr",
                left: expr,
                right
            };
        }
        return expr;
    }
    peek() {
        return this.tokens[this.current];
    }
    peekNext() {
        if (this.current + 1 < this.tokens.length) {
            return this.tokens[this.current + 1];
        }
        return undefined;
    }
    advance() {
        const tok = this.tokens[this.current];
        if (this.current < this.tokens.length - 1) {
            this.current++;
        }
        return tok;
    }
    expect(type, errMessage) {
        const tok = this.peek();
        if (tok.type !== type) {
            throw new Error(`[LLP Parser Error] ${errMessage} Reçu '${tok.value}' à la ligne ${tok.line}:${tok.column}`);
        }
        return this.advance();
    }
    skipOptionalSemicolon() {
        if (this.peek().type === tokens_1.TokenType.Semicolon) {
            this.advance();
        }
    }
}
exports.Parser = Parser;
