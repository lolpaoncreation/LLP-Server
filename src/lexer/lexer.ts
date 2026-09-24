import { Token, TokenType } from "./tokens";

const KEYWORDS: Record<string, TokenType> = {
  General: TokenType.KwGeneral,
  Global: TokenType.KwGeneral,
  var: TokenType.KwGeneral,
  int: TokenType.KwInt,
  float: TokenType.KwFloat,
  string: TokenType.KwString,
  bool: TokenType.KwBool,
  if: TokenType.KwIf,
  then: TokenType.KwThen,
  else: TokenType.KwElse,
  end: TokenType.KwEnd,
  do: TokenType.KwDo,
  while: TokenType.KwWhile,
  for: TokenType.KwFor,
  in: TokenType.KwIn,
  func: TokenType.KwFunc,
  function: TokenType.KwFunc,
  return: TokenType.KwReturn,
  true: TokenType.KwTrue,
  True: TokenType.KwTrue,
  false: TokenType.KwFalse,
  False: TokenType.KwFalse,
  null: TokenType.KwNull,
  Null: TokenType.KwNull,
  new: TokenType.KwNew,
  and: TokenType.And,
  or: TokenType.Or,
  xor: TokenType.Xor,
  visibility: TokenType.KwVisibility,
  class: TokenType.KwClass,
  module: TokenType.KwModule,
  namespace: TokenType.KwNamespace
};

export class Lexer {
  private source: string;
  private pos: number = 0;
  private line: number = 1;
  private col: number = 1;
  private inlineCommentResume: boolean = false;

  constructor(source: string) {
    this.source = source;
  }

  public tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.pos < this.source.length) {
      const char = this.source[this.pos];

      // Whitespace
      if (char === ' ' || char === '\t' || char === '\r') {
        this.advance();
        continue;
      }

      // Newline
      if (char === '\n') {
        this.line++;
        this.col = 1;
        this.pos++;
        continue;
      }

      // Custom LLP comments with /- (single-line or inline with { code } \)
      if (char === '/' && this.peek() === '-') {
        this.advance(); // consume '/'
        this.advance(); // consume '-'
        
        let hasBrace = false;
        let lookAhead = this.pos;
        while (lookAhead < this.source.length && this.source[lookAhead] !== '\n' && this.source[lookAhead] !== '\\') {
          if (this.source[lookAhead] === '{') {
            hasBrace = true;
            break;
          }
          lookAhead++;
        }

        if (hasBrace) {
          while (this.pos < lookAhead) {
            this.advance();
          }
          this.inlineCommentResume = true;
          continue;
        } else {
          while (this.pos < this.source.length && this.source[this.pos] !== '\n' && this.source[this.pos] !== '\\') {
            this.advance();
          }
          if (this.pos < this.source.length && this.source[this.pos] === '\\') {
            this.advance(); // consume '\'
          }
          continue;
        }
      }

      // Single line comment // (with optional embedded { code } \)
      if (char === '/' && this.peek() === '/') {
        this.advance(); // consume '/'
        this.advance(); // consume '/'

        let hasBrace = false;
        let lookAhead = this.pos;
        while (lookAhead < this.source.length && this.source[lookAhead] !== '\n' && this.source[lookAhead] !== '\\') {
          if (this.source[lookAhead] === '{') {
            hasBrace = true;
            break;
          }
          lookAhead++;
        }

        if (hasBrace) {
          while (this.pos < lookAhead) {
            this.advance();
          }
          this.inlineCommentResume = true;
          continue;
        } else {
          while (this.pos < this.source.length && this.source[this.pos] !== '\n' && this.source[this.pos] !== '\\') {
            this.advance();
          }
          if (this.pos < this.source.length && this.source[this.pos] === '\\') {
            this.advance(); // consume '\'
          }
          continue;
        }
      }

      // Multi line comment /* ... *\ or /* ... */
      if (char === '/' && this.peek() === '*') {
        this.advance(); // consume '/'
        this.advance(); // consume '*'
        while (this.pos < this.source.length && 
               !(this.source[this.pos] === '*' && (this.peek() === '\\' || this.peek() === '/'))) {
          if (this.source[this.pos] === '\n') {
            this.line++;
            this.col = 1;
          }
          this.advance();
        }
        if (this.pos < this.source.length) {
          this.advance(); // consume '*'
          this.advance(); // consume '\' or '/'
        }
        continue;
      }

      // Strings
      if (char === '"' || char === "'") {
        tokens.push(this.readString(char));
        continue;
      }

      // Numbers
      if (this.isDigit(char)) {
        tokens.push(this.readNumber());
        continue;
      }

      // Identifiers / Keywords
      if (this.isAlpha(char)) {
        tokens.push(this.readIdentifier());
        continue;
      }

      // Operators and Symbols
      switch (char) {
        case '=':
          if (this.peek() === '=') {
            tokens.push(this.makeToken(TokenType.DoubleEquals, "=="));
            this.advance();
          } else {
            tokens.push(this.makeToken(TokenType.Equals, "="));
          }
          break;
        case '!':
          if (this.peek() === '=') {
            tokens.push(this.makeToken(TokenType.NotEquals, "!="));
            this.advance();
          } else {
            tokens.push(this.makeToken(TokenType.Bang, "!"));
          }
          break;
        case '>':
          if (this.peek() === '=') {
            tokens.push(this.makeToken(TokenType.GreaterOrEqual, ">="));
            this.advance();
          } else {
            tokens.push(this.makeToken(TokenType.Greater, ">"));
          }
          break;
        case '<':
          if (this.peek() === '=') {
            tokens.push(this.makeToken(TokenType.LessOrEqual, "<="));
            this.advance();
          } else {
            tokens.push(this.makeToken(TokenType.Less, "<"));
          }
          break;
        case '&':
          if (this.peek() === '|') {
            tokens.push(this.makeToken(TokenType.Xor, "&|"));
            this.advance();
          } else if (this.peek() === '&') {
            tokens.push(this.makeToken(TokenType.And, "&&"));
            this.advance();
          } else {
            tokens.push(this.makeToken(TokenType.And, "&"));
          }
          break;
        case '|':
          if (this.peek() === '|') {
            tokens.push(this.makeToken(TokenType.Or, "||"));
            this.advance();
          } else {
            tokens.push(this.makeToken(TokenType.Or, "|"));
          }
          break;
        case '+':
          tokens.push(this.makeToken(TokenType.Plus, "+"));
          break;
        case '-':
          tokens.push(this.makeToken(TokenType.Minus, "-"));
          break;
        case '*':
          tokens.push(this.makeToken(TokenType.Star, "*"));
          break;
        case '/':
          tokens.push(this.makeToken(TokenType.Slash, "/"));
          break;
        case '%':
          tokens.push(this.makeToken(TokenType.Percent, "%"));
          break;
        case '(':
          tokens.push(this.makeToken(TokenType.OpenParen, "("));
          break;
        case ')':
          tokens.push(this.makeToken(TokenType.CloseParen, ")"));
          break;
        case '{':
          tokens.push(this.makeToken(TokenType.OpenBrace, "{"));
          break;
        case '}':
          tokens.push(this.makeToken(TokenType.CloseBrace, "}"));
          if (this.inlineCommentResume) {
            this.inlineCommentResume = false;
            this.advance(); // advance past '}'
            while (this.pos < this.source.length && this.source[this.pos] !== '\n' && this.source[this.pos] !== '\\') {
              this.advance();
            }
            if (this.pos < this.source.length && this.source[this.pos] === '\\') {
              this.advance(); // consume '\'
            }
            continue;
          }
          break;
        case '[':
          tokens.push(this.makeToken(TokenType.OpenBracket, "["));
          break;
        case ']':
          tokens.push(this.makeToken(TokenType.CloseBracket, "]"));
          break;
        case ',':
          tokens.push(this.makeToken(TokenType.Comma, ","));
          break;
        case '.':
          tokens.push(this.makeToken(TokenType.Dot, "."));
          break;
        case ':':
          tokens.push(this.makeToken(TokenType.Colon, ":"));
          break;
        case ';':
          tokens.push(this.makeToken(TokenType.Semicolon, ";"));
          break;
        default:
          throw new Error(`[LLP Lexer Error] Caractère inconnu '${char}' à la ligne ${this.line}:${this.col}`);
      }

      this.advance();
    }

    tokens.push({
      type: TokenType.EOF,
      value: "",
      line: this.line,
      column: this.col
    });

    return tokens;
  }

  private advance(): string {
    const char = this.source[this.pos];
    this.pos++;
    this.col++;
    return char;
  }

  private peek(): string {
    return this.pos + 1 < this.source.length ? this.source[this.pos + 1] : "";
  }

  private isDigit(char: string): boolean {
    return char >= '0' && char <= '9';
  }

  private isAlpha(char: string): boolean {
    return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';
  }

  private isAlphaNumeric(char: string): boolean {
    return this.isAlpha(char) || this.isDigit(char);
  }

  private makeToken(type: TokenType, value: string): Token {
    return {
      type,
      value,
      line: this.line,
      column: this.col
    };
  }

  private readString(quote: string): Token {
    const startLine = this.line;
    const startCol = this.col;
    this.advance(); // skip quote
    let str = "";

    while (this.pos < this.source.length && this.source[this.pos] !== quote) {
      if (this.source[this.pos] === '\\') {
        this.advance();
        const next = this.source[this.pos];
        if (next === 'n') str += '\n';
        else if (next === 't') str += '\t';
        else if (next === 'r') str += '\r';
        else str += next;
      } else {
        str += this.source[this.pos];
      }
      this.advance();
    }

    if (this.pos >= this.source.length) {
      throw new Error(`[LLP Lexer Error] Chaîne non fermée commencée à la ligne ${startLine}:${startCol}`);
    }

    this.advance(); // skip closing quote

    return {
      type: TokenType.String,
      value: str,
      line: startLine,
      column: startCol
    };
  }

  private readNumber(): Token {
    const startLine = this.line;
    const startCol = this.col;
    let numStr = "";

    while (this.pos < this.source.length && this.isDigit(this.source[this.pos])) {
      numStr += this.source[this.pos];
      this.advance();
    }

    if (this.pos < this.source.length && this.source[this.pos] === '.' && this.isDigit(this.peek())) {
      numStr += '.';
      this.advance();
      while (this.pos < this.source.length && this.isDigit(this.source[this.pos])) {
        numStr += this.source[this.pos];
        this.advance();
      }
    }

    return {
      type: TokenType.Number,
      value: numStr,
      line: startLine,
      column: startCol
    };
  }

  private readIdentifier(): Token {
    const startLine = this.line;
    const startCol = this.col;
    let id = "";

    while (this.pos < this.source.length && this.isAlphaNumeric(this.source[this.pos])) {
      id += this.source[this.pos];
      this.advance();
    }

    const tokenType = KEYWORDS[id] ?? TokenType.Identifier;

    return {
      type: tokenType,
      value: id,
      line: startLine,
      column: startCol
    };
  }
}
