import { Token } from "./tokens";
export declare class Lexer {
    private source;
    private pos;
    private line;
    private col;
    private inlineCommentResume;
    constructor(source: string);
    tokenize(): Token[];
    private advance;
    private peek;
    private isDigit;
    private isHexDigit;
    private isAlpha;
    private isAlphaNumeric;
    private makeToken;
    private readString;
    private readNumber;
    private readIdentifier;
}
