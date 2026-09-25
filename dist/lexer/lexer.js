"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = void 0;
const tokens_1 = require("./tokens");
const KEYWORDS = {
    General: tokens_1.TokenType.KwGeneral,
    Global: tokens_1.TokenType.KwGlobal,
    var: tokens_1.TokenType.KwGeneral,
    int: tokens_1.TokenType.KwInt,
    float: tokens_1.TokenType.KwFloat,
    string: tokens_1.TokenType.KwString,
    bool: tokens_1.TokenType.KwBool,
    Json: tokens_1.TokenType.KwJson,
    json: tokens_1.TokenType.KwJson,
    Hexa: tokens_1.TokenType.KwHexa,
    hexa: tokens_1.TokenType.KwHexa,
    breakpoint: tokens_1.TokenType.KwBreakpoint,
    Breakpoint: tokens_1.TokenType.KwBreakpoint,
    if: tokens_1.TokenType.KwIf,
    then: tokens_1.TokenType.KwThen,
    else: tokens_1.TokenType.KwElse,
    end: tokens_1.TokenType.KwEnd,
    do: tokens_1.TokenType.KwDo,
    while: tokens_1.TokenType.KwWhile,
    for: tokens_1.TokenType.KwFor,
    in: tokens_1.TokenType.KwIn,
    func: tokens_1.TokenType.KwFunc,
    function: tokens_1.TokenType.KwFunc,
    return: tokens_1.TokenType.KwReturn,
    true: tokens_1.TokenType.KwTrue,
    True: tokens_1.TokenType.KwTrue,
    false: tokens_1.TokenType.KwFalse,
    False: tokens_1.TokenType.KwFalse,
    null: tokens_1.TokenType.KwNull,
    Null: tokens_1.TokenType.KwNull,
    new: tokens_1.TokenType.KwNew,
    and: tokens_1.TokenType.And,
    or: tokens_1.TokenType.Or,
    xor: tokens_1.TokenType.Xor,
    visibility: tokens_1.TokenType.KwVisibility,
    class: tokens_1.TokenType.KwClass,
    module: tokens_1.TokenType.KwModule,
    namespace: tokens_1.TokenType.KwNamespace,
    over: tokens_1.TokenType.KwOver
};
class Lexer {
    source;
    pos = 0;
    line = 1;
    col = 1;
    inlineCommentResume = false;
    constructor(source) {
        this.source = source;
    }
    tokenize() {
        const tokens = [];
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
                }
                else {
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
                }
                else {
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
                        tokens.push(this.makeToken(tokens_1.TokenType.DoubleEquals, "=="));
                        this.advance();
                    }
                    else {
                        tokens.push(this.makeToken(tokens_1.TokenType.Equals, "="));
                    }
                    break;
                case '!':
                    if (this.peek() === '=') {
                        tokens.push(this.makeToken(tokens_1.TokenType.NotEquals, "!="));
                        this.advance();
                    }
                    else {
                        tokens.push(this.makeToken(tokens_1.TokenType.Bang, "!"));
                    }
                    break;
                case '>':
                    if (this.peek() === '=') {
                        tokens.push(this.makeToken(tokens_1.TokenType.GreaterOrEqual, ">="));
                        this.advance();
                    }
                    else {
                        tokens.push(this.makeToken(tokens_1.TokenType.Greater, ">"));
                    }
                    break;
                case '<':
                    if (this.peek() === '=') {
                        tokens.push(this.makeToken(tokens_1.TokenType.LessOrEqual, "<="));
                        this.advance();
                    }
                    else {
                        tokens.push(this.makeToken(tokens_1.TokenType.Less, "<"));
                    }
                    break;
                case '&':
                    if (this.peek() === '|') {
                        tokens.push(this.makeToken(tokens_1.TokenType.Xor, "&|"));
                        this.advance();
                    }
                    else if (this.peek() === '&') {
                        tokens.push(this.makeToken(tokens_1.TokenType.And, "&&"));
                        this.advance();
                    }
                    else {
                        tokens.push(this.makeToken(tokens_1.TokenType.And, "&"));
                    }
                    break;
                case '|':
                    if (this.peek() === '|') {
                        tokens.push(this.makeToken(tokens_1.TokenType.Or, "||"));
                        this.advance();
                    }
                    else {
                        tokens.push(this.makeToken(tokens_1.TokenType.Or, "|"));
                    }
                    break;
                case '+':
                    tokens.push(this.makeToken(tokens_1.TokenType.Plus, "+"));
                    break;
                case '-':
                    tokens.push(this.makeToken(tokens_1.TokenType.Minus, "-"));
                    break;
                case '*':
                    tokens.push(this.makeToken(tokens_1.TokenType.Star, "*"));
                    break;
                case '/':
                    tokens.push(this.makeToken(tokens_1.TokenType.Slash, "/"));
                    break;
                case '%':
                    tokens.push(this.makeToken(tokens_1.TokenType.Percent, "%"));
                    break;
                case '(':
                    tokens.push(this.makeToken(tokens_1.TokenType.OpenParen, "("));
                    break;
                case ')':
                    tokens.push(this.makeToken(tokens_1.TokenType.CloseParen, ")"));
                    break;
                case '{':
                    tokens.push(this.makeToken(tokens_1.TokenType.OpenBrace, "{"));
                    break;
                case '}':
                    tokens.push(this.makeToken(tokens_1.TokenType.CloseBrace, "}"));
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
                    tokens.push(this.makeToken(tokens_1.TokenType.OpenBracket, "["));
                    break;
                case ']':
                    tokens.push(this.makeToken(tokens_1.TokenType.CloseBracket, "]"));
                    break;
                case ',':
                    tokens.push(this.makeToken(tokens_1.TokenType.Comma, ","));
                    break;
                case '.':
                    tokens.push(this.makeToken(tokens_1.TokenType.Dot, "."));
                    break;
                case ':':
                    tokens.push(this.makeToken(tokens_1.TokenType.Colon, ":"));
                    break;
                case ';':
                    tokens.push(this.makeToken(tokens_1.TokenType.Semicolon, ";"));
                    break;
                default:
                    throw new Error(`[LLP Lexer Error] Caractère inconnu '${char}' à la ligne ${this.line}:${this.col}`);
            }
            this.advance();
        }
        tokens.push({
            type: tokens_1.TokenType.EOF,
            value: "",
            line: this.line,
            column: this.col
        });
        return tokens;
    }
    advance() {
        const char = this.source[this.pos];
        this.pos++;
        this.col++;
        return char;
    }
    peek() {
        return this.pos + 1 < this.source.length ? this.source[this.pos + 1] : "";
    }
    isDigit(char) {
        return char >= '0' && char <= '9';
    }
    isHexDigit(char) {
        return ((char >= '0' && char <= '9') ||
            (char >= 'a' && char <= 'f') ||
            (char >= 'A' && char <= 'F'));
    }
    isAlpha(char) {
        return (char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z') || char === '_';
    }
    isAlphaNumeric(char) {
        return this.isAlpha(char) || this.isDigit(char);
    }
    makeToken(type, value) {
        return {
            type,
            value,
            line: this.line,
            column: this.col
        };
    }
    readString(quote) {
        const startLine = this.line;
        const startCol = this.col;
        this.advance(); // skip quote
        let str = "";
        while (this.pos < this.source.length && this.source[this.pos] !== quote) {
            if (this.source[this.pos] === '\\') {
                this.advance();
                const next = this.source[this.pos];
                if (next === 'n')
                    str += '\n';
                else if (next === 't')
                    str += '\t';
                else if (next === 'r')
                    str += '\r';
                else
                    str += next;
            }
            else {
                str += this.source[this.pos];
            }
            this.advance();
        }
        if (this.pos >= this.source.length) {
            throw new Error(`[LLP Lexer Error] Chaîne non fermée commencée à la ligne ${startLine}:${startCol}`);
        }
        this.advance(); // skip closing quote
        return {
            type: tokens_1.TokenType.String,
            value: str,
            line: startLine,
            column: startCol
        };
    }
    readNumber() {
        const startLine = this.line;
        const startCol = this.col;
        let numStr = "";
        // Hexadecimal numbers: 0x... or 0X...
        if (this.source[this.pos] === '0' && (this.peek() === 'x' || this.peek() === 'X')) {
            numStr += this.source[this.pos]; // '0'
            this.advance();
            numStr += this.source[this.pos]; // 'x' or 'X'
            this.advance();
            while (this.pos < this.source.length && this.isHexDigit(this.source[this.pos])) {
                numStr += this.source[this.pos];
                this.advance();
            }
            return {
                type: tokens_1.TokenType.Number,
                value: numStr,
                line: startLine,
                column: startCol
            };
        }
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
            type: tokens_1.TokenType.Number,
            value: numStr,
            line: startLine,
            column: startCol
        };
    }
    readIdentifier() {
        const startLine = this.line;
        const startCol = this.col;
        let id = "";
        while (this.pos < this.source.length && this.isAlphaNumeric(this.source[this.pos])) {
            id += this.source[this.pos];
            this.advance();
        }
        const tokenType = KEYWORDS[id] ?? tokens_1.TokenType.Identifier;
        return {
            type: tokenType,
            value: id,
            line: startLine,
            column: startCol
        };
    }
}
exports.Lexer = Lexer;
