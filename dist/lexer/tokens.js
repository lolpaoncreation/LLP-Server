"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TokenType = void 0;
var TokenType;
(function (TokenType) {
    // Types & Literals
    TokenType[TokenType["Number"] = 0] = "Number";
    TokenType[TokenType["String"] = 1] = "String";
    TokenType[TokenType["Boolean"] = 2] = "Boolean";
    TokenType[TokenType["Identifier"] = 3] = "Identifier";
    TokenType[TokenType["Null"] = 4] = "Null";
    // Type Keywords
    TokenType[TokenType["KwGeneral"] = 5] = "KwGeneral";
    TokenType[TokenType["KwGlobal"] = 6] = "KwGlobal";
    TokenType[TokenType["KwInt"] = 7] = "KwInt";
    TokenType[TokenType["KwFloat"] = 8] = "KwFloat";
    TokenType[TokenType["KwString"] = 9] = "KwString";
    TokenType[TokenType["KwBool"] = 10] = "KwBool";
    TokenType[TokenType["KwJson"] = 11] = "KwJson";
    TokenType[TokenType["KwHexa"] = 12] = "KwHexa";
    TokenType[TokenType["KwBreakpoint"] = 13] = "KwBreakpoint";
    TokenType[TokenType["KwTask"] = 14] = "KwTask";
    // Keywords
    TokenType[TokenType["KwIf"] = 15] = "KwIf";
    TokenType[TokenType["KwThen"] = 16] = "KwThen";
    TokenType[TokenType["KwElse"] = 17] = "KwElse";
    TokenType[TokenType["KwEnd"] = 18] = "KwEnd";
    TokenType[TokenType["KwDo"] = 19] = "KwDo";
    TokenType[TokenType["KwWhile"] = 20] = "KwWhile";
    TokenType[TokenType["KwFor"] = 21] = "KwFor";
    TokenType[TokenType["KwIn"] = 22] = "KwIn";
    TokenType[TokenType["KwFunc"] = 23] = "KwFunc";
    TokenType[TokenType["KwReturn"] = 24] = "KwReturn";
    TokenType[TokenType["KwTrue"] = 25] = "KwTrue";
    TokenType[TokenType["KwFalse"] = 26] = "KwFalse";
    TokenType[TokenType["KwNull"] = 27] = "KwNull";
    TokenType[TokenType["KwNew"] = 28] = "KwNew";
    TokenType[TokenType["KwVisibility"] = 29] = "KwVisibility";
    TokenType[TokenType["KwClass"] = 30] = "KwClass";
    TokenType[TokenType["KwModule"] = 31] = "KwModule";
    TokenType[TokenType["KwNamespace"] = 32] = "KwNamespace";
    TokenType[TokenType["KwOver"] = 33] = "KwOver";
    // Grouping & Operators
    TokenType[TokenType["Equals"] = 34] = "Equals";
    TokenType[TokenType["DoubleEquals"] = 35] = "DoubleEquals";
    TokenType[TokenType["NotEquals"] = 36] = "NotEquals";
    TokenType[TokenType["Greater"] = 37] = "Greater";
    TokenType[TokenType["GreaterOrEqual"] = 38] = "GreaterOrEqual";
    TokenType[TokenType["Less"] = 39] = "Less";
    TokenType[TokenType["LessOrEqual"] = 40] = "LessOrEqual";
    TokenType[TokenType["Plus"] = 41] = "Plus";
    TokenType[TokenType["Minus"] = 42] = "Minus";
    TokenType[TokenType["Star"] = 43] = "Star";
    TokenType[TokenType["Slash"] = 44] = "Slash";
    TokenType[TokenType["Percent"] = 45] = "Percent";
    TokenType[TokenType["Bang"] = 46] = "Bang";
    TokenType[TokenType["And"] = 47] = "And";
    TokenType[TokenType["Or"] = 48] = "Or";
    TokenType[TokenType["Xor"] = 49] = "Xor";
    // Punctuation & Brackets
    TokenType[TokenType["OpenParen"] = 50] = "OpenParen";
    TokenType[TokenType["CloseParen"] = 51] = "CloseParen";
    TokenType[TokenType["OpenBrace"] = 52] = "OpenBrace";
    TokenType[TokenType["CloseBrace"] = 53] = "CloseBrace";
    TokenType[TokenType["OpenBracket"] = 54] = "OpenBracket";
    TokenType[TokenType["CloseBracket"] = 55] = "CloseBracket";
    TokenType[TokenType["Comma"] = 56] = "Comma";
    TokenType[TokenType["Dot"] = 57] = "Dot";
    TokenType[TokenType["Colon"] = 58] = "Colon";
    TokenType[TokenType["Semicolon"] = 59] = "Semicolon";
    // Special
    TokenType[TokenType["EOF"] = 60] = "EOF";
})(TokenType || (exports.TokenType = TokenType = {}));
