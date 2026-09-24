import { Token, TokenType } from "../lexer/tokens";
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
  NamedArgumentExpr,
  PairExpr,
  ModuleStatement,
  ClassDeclaration,
  NamespaceDeclaration
} from "./ast";

export class Parser {
  private tokens: Token[];
  private current: number = 0;
  private sourceFile?: string;

  constructor(tokens: Token[], sourceFile?: string) {
    this.tokens = tokens;
    this.sourceFile = sourceFile;
  }

  public produceAST(): Program {
    const program: Program = {
      kind: "Program",
      body: []
    };

    if (this.peek().type === TokenType.KwVisibility) {
      this.advance(); // visibility
      this.expect(TokenType.Colon, "':' attendu après 'visibility'.");
      const visLevel = this.expect(TokenType.Identifier, "Niveau de visibilité attendu (All, Package, Parent, Private).");
      program.visibility = visLevel.value;
      this.skipOptionalSemicolon();
    }

    while (this.current < this.tokens.length && this.peek().type !== TokenType.EOF) {
      program.body.push(this.parseStatement());
    }

    return program;
  }

  private parseStatement(): Statement {
    const token = this.peek();

    // Variable declaration: General, int, float, string, bool
    if (this.isTypeKeyword(token.type)) {
      return this.parseVarDeclaration();
    }

    if (token.type === TokenType.KwFunc) {
      return this.parseFunctionDeclaration();
    }

    if (token.type === TokenType.KwIf) {
      return this.parseIfStatement();
    }

    if (token.type === TokenType.KwWhile) {
      return this.parseWhileStatement();
    }

    if (token.type === TokenType.KwFor) {
      return this.parseForInStatement();
    }

    if (token.type === TokenType.KwReturn) {
      return this.parseReturnStatement();
    }

    if (token.type === TokenType.KwClass) {
      return this.parseClassDeclaration();
    }

    if (token.type === TokenType.KwModule) {
      return this.parseModuleStatement();
    }

    if (token.type === TokenType.KwNamespace) {
      return this.parseNamespaceDeclaration();
    }

    if (token.type === TokenType.OpenBrace) {
      return this.parseBlockStatement();
    }

    return this.parseExpressionStatement();
  }

  private isTypeKeyword(type: TokenType): boolean {
    return (
      type === TokenType.KwGeneral ||
      type === TokenType.KwInt ||
      type === TokenType.KwFloat ||
      type === TokenType.KwString ||
      type === TokenType.KwBool
    );
  }

  private parseVarDeclaration(): Statement {
    const typeToken = this.advance();
    const explicitType = typeToken.value as "General" | "int" | "float" | "string" | "bool";

    let isList = false;
    let isFixedArray = false;
    let maxElements: number | undefined;

    // Check for fixed array declaration type: type[size] name
    if (this.peek().type === TokenType.OpenBracket) {
      this.advance(); // [
      const sizeToken = this.expect(TokenType.Number, "Taille du tableau fixe attendue entre [].");
      maxElements = parseInt(sizeToken.value, 10);
      this.expect(TokenType.CloseBracket, "']' attendu après la taille du tableau fixe.");
      isFixedArray = true;
    } else if (this.peek().type === TokenType.OpenBrace) {
      isList = true;
    }

    const varNameToken = this.expect(TokenType.Identifier, "Nom de variable attendu.");
    const varName = varNameToken.value;

    let value: Expression | undefined;
    if (this.peek().type === TokenType.Equals) {
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
    } as VarDeclaration;
  }

  private parseFunctionDeclaration(): Statement {
    this.advance(); // func
    const nameToken = this.expect(TokenType.Identifier, "Nom de fonction attendu.");
    this.expect(TokenType.OpenParen, "'(' attendu après le nom de fonction.");

    const parameters: string[] = [];
    if (this.peek().type !== TokenType.CloseParen) {
      do {
        // Optional type preceding param name
        if (this.isTypeKeyword(this.peek().type)) {
          this.advance();
        }
        const paramToken = this.expect(TokenType.Identifier, "Nom de paramètre attendu.");
        parameters.push(paramToken.value);
        if (this.peek().type === TokenType.Comma) {
          this.advance();
        } else {
          break;
        }
      } while (this.peek().type !== TokenType.CloseParen);
    }

    this.expect(TokenType.CloseParen, "')' attendu après la liste de paramètres.");
    
    let body: Statement[] = [];
    if (this.peek().type === TokenType.OpenBrace) {
      const block = this.parseBlockStatement();
      body = block.body;
    } else if (this.peek().type === TokenType.KwThen) {
      this.advance(); // then
      while (this.current < this.tokens.length && this.peek().type !== TokenType.KwEnd) {
        body.push(this.parseStatement());
      }
      this.expect(TokenType.KwEnd, "'end' attendu à la fin de la fonction.");
    } else {
      throw new Error(`[LLP Parser Error] Corps de fonction '{ ... }' ou 'then ... end' attendu.`);
    }

    return {
      kind: "FunctionDeclaration",
      name: nameToken.value,
      parameters,
      body
    } as FunctionDeclaration;
  }

  private parseClassDeclaration(): Statement {
    this.advance(); // class
    const nameToken = this.expect(TokenType.Identifier, "Nom de classe attendu après 'class'.");
    const className = nameToken.value;

    let parentClassName: string | undefined;
    if (this.peek().type === TokenType.Colon) {
      this.advance(); // :
      const parentToken = this.expect(TokenType.Identifier, "Nom de la classe parente attendu après ':'.");
      parentClassName = parentToken.value;
    }

    let body: Statement[] = [];
    if (this.peek().type === TokenType.KwThen) {
      this.advance(); // then
      while (this.current < this.tokens.length && this.peek().type !== TokenType.KwEnd) {
        body.push(this.parseStatement());
      }
      this.expect(TokenType.KwEnd, "'end' attendu à la fin de la classe.");
    } else if (this.peek().type === TokenType.OpenBrace) {
      const block = this.parseBlockStatement();
      body = block.body;
    } else {
      throw new Error(`[LLP Parser Error] 'then ... end' ou '{ ... }' attendu pour le corps de la classe '${className}'.`);
    }

    return {
      kind: "ClassDeclaration",
      name: className,
      parentClassName,
      body,
      sourceFile: this.sourceFile
    } as ClassDeclaration;
  }

  private parseModuleStatement(): Statement {
    this.advance(); // module
    const nameToken = this.expect(TokenType.Identifier, "Nom de module attendu après 'module'.");
    const moduleName = nameToken.value;

    let body: Statement[] = [];
    if (this.peek().type === TokenType.KwThen) {
      this.advance(); // then
      while (this.current < this.tokens.length && this.peek().type !== TokenType.KwEnd) {
        body.push(this.parseStatement());
      }
      this.expect(TokenType.KwEnd, "'end' attendu à la fin du module.");
    } else if (this.peek().type === TokenType.OpenBrace) {
      const block = this.parseBlockStatement();
      body = block.body;
    } else {
      throw new Error(`[LLP Parser Error] 'then ... end' ou '{ ... }' attendu pour le corps du module '${moduleName}'.`);
    }

    return {
      kind: "ModuleStatement",
      name: moduleName,
      body
    } as ModuleStatement;
  }

  private parseNamespaceDeclaration(): Statement {
    this.advance(); // namespace
    const nameToken = this.expect(TokenType.Identifier, "Nom de namespace attendu après 'namespace'.");
    const nsName = nameToken.value;

    let body: Statement[] = [];
    if (this.peek().type === TokenType.KwThen) {
      this.advance(); // then
      while (this.current < this.tokens.length && this.peek().type !== TokenType.KwEnd) {
        body.push(this.parseStatement());
      }
      this.expect(TokenType.KwEnd, "'end' attendu à la fin du namespace.");
    } else if (this.peek().type === TokenType.OpenBrace) {
      const block = this.parseBlockStatement();
      body = block.body;
    } else {
      throw new Error(`[LLP Parser Error] 'then ... end' ou '{ ... }' attendu pour le corps du namespace '${nsName}'.`);
    }

    return {
      kind: "NamespaceDeclaration",
      name: nsName,
      body
    } as NamespaceDeclaration;
  }

  private parseIfStatement(): Statement {
    this.advance(); // if
    const hasParen = this.peek().type === TokenType.OpenParen;
    if (hasParen) this.advance();
    
    const condition = this.parseExpression();
    if (hasParen) this.expect(TokenType.CloseParen, "')' attendu après la condition du if.");

    let thenBranch: Statement[] = [];
    let elseBranch: Statement[] | undefined;

    if (this.peek().type === TokenType.KwThen) {
      this.advance(); // then
      while (this.peek().type !== TokenType.KwElse && 
             this.peek().type !== TokenType.KwEnd && 
             this.peek().type !== TokenType.EOF) {
        thenBranch.push(this.parseStatement());
      }
      if (this.peek().type === TokenType.KwElse) {
        this.advance(); // else
        if (this.peek().type === TokenType.KwIf) {
          elseBranch = [this.parseIfStatement()];
          return { kind: "IfStatement", condition, thenBranch, elseBranch } as IfStatement;
        } else {
          elseBranch = [];
          while (this.peek().type !== TokenType.KwEnd && this.peek().type !== TokenType.EOF) {
            elseBranch.push(this.parseStatement());
          }
          this.expect(TokenType.KwEnd, "'end' attendu à la fin du bloc if/else.");
        }
      } else {
        this.expect(TokenType.KwEnd, "'end' attendu à la fin du bloc if.");
      }
    } else if (this.peek().type === TokenType.OpenBrace) {
      const thenBlock = this.parseBlockStatement();
      thenBranch = thenBlock.body;
      if (this.peek().type === TokenType.KwElse) {
        this.advance(); // else
        if (this.peek().type === TokenType.KwIf) {
          elseBranch = [this.parseIfStatement()];
        } else {
          elseBranch = this.parseBlockStatement().body;
        }
      }
    } else {
      throw new Error(`[LLP Parser Error] 'then' ou '{' attendu après la condition du if.`);
    }

    return {
      kind: "IfStatement",
      condition,
      thenBranch,
      elseBranch
    } as IfStatement;
  }

  private parseWhileStatement(): Statement {
    this.advance(); // while
    const hasParen = this.peek().type === TokenType.OpenParen;
    if (hasParen) this.advance();

    const condition = this.parseExpression();
    if (hasParen) this.expect(TokenType.CloseParen, "')' attendu après la condition du while.");

    let body: Statement[] = [];
    if (this.peek().type === TokenType.KwThen || this.peek().type === TokenType.KwDo) {
      this.advance(); // then / do
      while (this.peek().type !== TokenType.KwEnd && this.peek().type !== TokenType.EOF) {
        body.push(this.parseStatement());
      }
      this.expect(TokenType.KwEnd, "'end' attendu à la fin de la boucle while.");
    } else if (this.peek().type === TokenType.OpenBrace) {
      body = this.parseBlockStatement().body;
    } else {
      throw new Error(`[LLP Parser Error] 'then', 'do' ou '{' attendu après la condition du while.`);
    }

    return {
      kind: "WhileStatement",
      condition,
      body
    } as WhileStatement;
  }

  private parseForInStatement(): Statement {
    this.advance(); // for
    const itemVar = this.expect(TokenType.Identifier, "Nom de variable de boucle attendu.").value;
    this.expect(TokenType.KwIn, "'in' attendu dans la boucle for.");
    const listExpr = this.parseExpression();

    let body: Statement[] = [];
    if (this.peek().type === TokenType.KwThen || this.peek().type === TokenType.KwDo) {
      this.advance(); // then / do
      while (this.peek().type !== TokenType.KwEnd && this.peek().type !== TokenType.EOF) {
        body.push(this.parseStatement());
      }
      this.expect(TokenType.KwEnd, "'end' attendu à la fin de la boucle for.");
    } else if (this.peek().type === TokenType.OpenBrace) {
      body = this.parseBlockStatement().body;
    } else {
      // If neither, also allow direct statements up to 'end'
      if (this.peek().type !== TokenType.OpenBrace && this.peek().type !== TokenType.KwEnd) {
        while (this.peek().type !== TokenType.KwEnd && this.peek().type !== TokenType.EOF) {
          body.push(this.parseStatement());
        }
        this.expect(TokenType.KwEnd, "'end' attendu à la fin de la boucle for.");
      } else {
        throw new Error(`[LLP Parser Error] 'then', 'do', bloc '{' ou corps terminé par 'end' attendu dans la boucle for.`);
      }
    }

    return {
      kind: "ForInStatement",
      itemVar,
      listExpr,
      body
    } as ForInStatement;
  }

  private parseReturnStatement(): Statement {
    this.advance(); // return
    let value: Expression | undefined;
    if (this.peek().type !== TokenType.Semicolon && this.peek().type !== TokenType.CloseBrace && this.peek().type !== TokenType.EOF) {
      value = this.parseExpression();
    }
    this.skipOptionalSemicolon();

    return {
      kind: "ReturnStatement",
      value
    } as ReturnStatement;
  }

  private parseBlockStatement(): BlockStatement {
    this.expect(TokenType.OpenBrace, "'{' attendu au début d'un bloc.");
    const body: Statement[] = [];

    while (this.peek().type !== TokenType.CloseBrace && this.peek().type !== TokenType.EOF) {
      body.push(this.parseStatement());
    }

    this.expect(TokenType.CloseBrace, "'}' attendu à la fin d'un bloc.");
    return {
      kind: "BlockStatement",
      body
    };
  }

  private parseExpressionStatement(): Statement {
    const expr = this.parseExpression();
    this.skipOptionalSemicolon();
    return {
      kind: "ExpressionStatement",
      expression: expr
    } as ExpressionStatement;
  }

  private parseExpression(): Expression {
    return this.parseAssignment();
  }

  private parseAssignment(): Expression {
    const left = this.parseLogicalOr();

    if (this.peek().type === TokenType.Equals) {
      this.advance(); // =
      const value = this.parseAssignment();
      return {
        kind: "AssignmentExpr",
        target: left,
        value
      } as AssignmentExpr;
    }

    return left;
  }

  private parseLogicalOr(): Expression {
    let left = this.parseLogicalXor();

    while (this.peek().type === TokenType.Or) {
      const op = this.advance().value;
      const right = this.parseLogicalXor();
      left = {
        kind: "BinaryExpr",
        left,
        operator: op,
        right
      } as BinaryExpr;
    }

    return left;
  }

  private parseLogicalXor(): Expression {
    let left = this.parseLogicalAnd();

    while (this.peek().type === TokenType.Xor) {
      const op = this.advance().value;
      const right = this.parseLogicalAnd();
      left = {
        kind: "BinaryExpr",
        left,
        operator: op,
        right
      } as BinaryExpr;
    }

    return left;
  }

  private parseLogicalAnd(): Expression {
    let left = this.parseEquality();

    while (this.peek().type === TokenType.And) {
      const op = this.advance().value;
      const right = this.parseEquality();
      left = {
        kind: "BinaryExpr",
        left,
        operator: op,
        right
      } as BinaryExpr;
    }

    return left;
  }

  private parseEquality(): Expression {
    let left = this.parseRelational();

    while (this.peek().type === TokenType.DoubleEquals || this.peek().type === TokenType.NotEquals) {
      const op = this.advance().value;
      const right = this.parseRelational();
      left = {
        kind: "BinaryExpr",
        left,
        operator: op,
        right
      } as BinaryExpr;
    }

    return left;
  }

  private parseRelational(): Expression {
    let left = this.parseAdditive();

    while (
      this.peek().type === TokenType.Less ||
      this.peek().type === TokenType.LessOrEqual ||
      this.peek().type === TokenType.Greater ||
      this.peek().type === TokenType.GreaterOrEqual
    ) {
      const op = this.advance().value;
      const right = this.parseAdditive();
      left = {
        kind: "BinaryExpr",
        left,
        operator: op,
        right
      } as BinaryExpr;
    }

    return left;
  }

  private parseAdditive(): Expression {
    let left = this.parseMultiplicative();

    while (this.peek().type === TokenType.Plus || this.peek().type === TokenType.Minus) {
      const op = this.advance().value;
      const right = this.parseMultiplicative();
      left = {
        kind: "BinaryExpr",
        left,
        operator: op,
        right
      } as BinaryExpr;
    }

    return left;
  }

  private parseMultiplicative(): Expression {
    let left = this.parseUnary();

    while (
      this.peek().type === TokenType.Star ||
      this.peek().type === TokenType.Slash ||
      this.peek().type === TokenType.Percent
    ) {
      const op = this.advance().value;
      const right = this.parseUnary();
      left = {
        kind: "BinaryExpr",
        left,
        operator: op,
        right
      } as BinaryExpr;
    }

    return left;
  }

  private parseUnary(): Expression {
    if (this.peek().type === TokenType.Bang || this.peek().type === TokenType.Minus) {
      const op = this.advance().value;
      const operand = this.parseUnary();
      return {
        kind: "UnaryExpr",
        operator: op,
        operand
      } as UnaryExpr;
    }

    return this.parseCallMember();
  }

  private parseCallMember(): Expression {
    let expr = this.parsePrimary();

    while (true) {
      if (this.peek().type === TokenType.Dot) {
        this.advance(); // .
        const propToken = this.peek();
        if (
          propToken.type === TokenType.Identifier ||
          propToken.type === TokenType.KwNew ||
          this.isTypeKeyword(propToken.type)
        ) {
          this.advance();
          expr = {
            kind: "MemberExpr",
            object: expr,
            property: propToken.value
          } as MemberExpr;
        } else {
          throw new Error(
            `[LLP Parser Error] Nom de propriété ou méthode attendu après '.'. Reçu '${propToken.value}'`
          );
        }
      } else if (this.peek().type === TokenType.OpenParen) {
        this.advance(); // (
        const args: Expression[] = [];
        if (this.peek().type !== TokenType.CloseParen) {
          do {
            args.push(this.parseArgumentExpression());
            if (this.peek().type === TokenType.Comma) {
              this.advance();
            } else {
              break;
            }
          } while (this.peek().type !== TokenType.CloseParen);
        }
        this.expect(TokenType.CloseParen, "')' attendu après les arguments d'appel.");
        expr = {
          kind: "CallExpr",
          callee: expr,
          args
        } as CallExpr;
      } else if (this.peek().type === TokenType.OpenBracket) {
        this.advance(); // [
        const index = this.parseExpression();
        this.expect(TokenType.CloseBracket, "']' attendu après l'index de tableau.");
        expr = {
          kind: "IndexExpr",
          array: expr,
          index
        } as IndexExpr;
      } else {
        break;
      }
    }

    return expr;
  }

  private parsePrimary(): Expression {
    const token = this.peek();

    // Type literal expressions for lists and arrays: General{}, General[5]{...}, int{...}, int[3]{...}
    if (this.isTypeKeyword(token.type)) {
      const typeToken = this.advance();
      const typeName = typeToken.value;

      // Check if General[N]{...}
      if (this.peek().type === TokenType.OpenBracket) {
        this.advance(); // [
        const sizeTok = this.expect(TokenType.Number, "Taille de tableau fixe attendue.");
        const maxElements = parseInt(sizeTok.value, 10);
        this.expect(TokenType.CloseBracket, "']' attendu.");
        this.expect(TokenType.OpenBrace, "'{' attendu pour la liste d'éléments du tableau fixe.");
        
        const items = this.parseExpressionList(TokenType.CloseBrace);
        this.expect(TokenType.CloseBrace, "'}' attendu.");

        return {
          kind: "FixedArrayLiteral",
          elementType: typeName,
          maxElements,
          items
        } as FixedArrayLiteral;
      }

      // Check if General{...}
      if (this.peek().type === TokenType.OpenBrace) {
        this.advance(); // {
        const items = this.parseExpressionList(TokenType.CloseBrace);
        this.expect(TokenType.CloseBrace, "'}' attendu.");

        return {
          kind: "ListLiteral",
          elementType: typeName,
          items
        } as ListLiteral;
      }

      // If it was just a type keyword without { or [, treat as identifier
      return {
        kind: "Identifier",
        name: typeName
      } as Identifier;
    }

    if (token.type === TokenType.Number) {
      this.advance();
      return {
        kind: "NumericLiteral",
        value: parseFloat(token.value)
      } as NumericLiteral;
    }

    if (token.type === TokenType.String) {
      this.advance();
      return {
        kind: "StringLiteral",
        value: token.value
      } as StringLiteral;
    }

    if (token.type === TokenType.KwTrue) {
      this.advance();
      return { kind: "BooleanLiteral", value: true } as BooleanLiteral;
    }

    if (token.type === TokenType.KwFalse) {
      this.advance();
      return { kind: "BooleanLiteral", value: false } as BooleanLiteral;
    }

    if (token.type === TokenType.KwNull) {
      this.advance();
      return { kind: "NullLiteral" } as NullLiteral;
    }

    if (token.type === TokenType.Identifier) {
      this.advance();
      return { kind: "Identifier", name: token.value } as Identifier;
    }

    // Direct List literal: { item1, item2 }
    if (token.type === TokenType.OpenBrace) {
      this.advance(); // {
      const items = this.parseExpressionList(TokenType.CloseBrace);
      this.expect(TokenType.CloseBrace, "'}' attendu.");
      return {
        kind: "ListLiteral",
        elementType: "General",
        items
      } as ListLiteral;
    }

    if (token.type === TokenType.OpenParen) {
      this.advance(); // (
      const expr = this.parseExpression();
      this.expect(TokenType.CloseParen, "')' attendu.");
      return expr;
    }

    throw new Error(
      `[LLP Parser Error] Jeton inattendu '${token.value}' (${TokenType[token.type]}) à la ligne ${token.line}:${token.column}`
    );
  }

  private parseExpressionList(endToken: TokenType): Expression[] {
    const items: Expression[] = [];
    if (this.peek().type !== endToken) {
      do {
        items.push(this.parseExpression());
        if (this.peek().type === TokenType.Comma) {
          this.advance();
        } else {
          break;
        }
      } while (this.peek().type !== endToken);
    }
    return items;
  }

  private parseArgumentExpression(): Expression {
    if (this.peek().type === TokenType.Identifier && this.peekNext()?.type === TokenType.Colon) {
      const nameTok = this.advance();
      this.advance(); // consume ':'
      const value = this.parseArgumentValue();
      return {
        kind: "NamedArgumentExpr",
        name: nameTok.value,
        value
      } as NamedArgumentExpr;
    }
    return this.parseArgumentValue();
  }

  private parseArgumentValue(): Expression {
    let expr = this.parseExpression();
    if (this.peek().type === TokenType.Colon) {
      this.advance(); // consume ':'
      const right = this.parseExpression();
      expr = {
        kind: "PairExpr",
        left: expr,
        right
      } as PairExpr;
    }
    return expr;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private peekNext(): Token | undefined {
    if (this.current + 1 < this.tokens.length) {
      return this.tokens[this.current + 1];
    }
    return undefined;
  }

  private advance(): Token {
    const tok = this.tokens[this.current];
    if (this.current < this.tokens.length - 1) {
      this.current++;
    }
    return tok;
  }

  private expect(type: TokenType, errMessage: string): Token {
    const tok = this.peek();
    if (tok.type !== type) {
      throw new Error(
        `[LLP Parser Error] ${errMessage} Reçu '${tok.value}' à la ligne ${tok.line}:${tok.column}`
      );
    }
    return this.advance();
  }

  private skipOptionalSemicolon(): void {
    if (this.peek().type === TokenType.Semicolon) {
      this.advance();
    }
  }
}
