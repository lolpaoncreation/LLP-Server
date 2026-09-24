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
    TokenType[TokenType["KwInt"] = 6] = "KwInt";
    TokenType[TokenType["KwFloat"] = 7] = "KwFloat";
    TokenType[TokenType["KwString"] = 8] = "KwString";
    TokenType[TokenType["KwBool"] = 9] = "KwBool";
    // Keywords
    TokenType[TokenType["KwIf"] = 10] = "KwIf";
    TokenType[TokenType["KwThen"] = 11] = "KwThen";
    TokenType[TokenType["KwElse"] = 12] = "KwElse";
    TokenType[TokenType["KwEnd"] = 13] = "KwEnd";
    TokenType[TokenType["KwDo"] = 14] = "KwDo";
    TokenType[TokenType["KwWhile"] = 15] = "KwWhile";
    TokenType[TokenType["KwFor"] = 16] = "KwFor";
    TokenType[TokenType["KwIn"] = 17] = "KwIn";
    TokenType[TokenType["KwFunc"] = 18] = "KwFunc";
    TokenType[TokenType["KwReturn"] = 19] = "KwReturn";
    TokenType[TokenType["KwTrue"] = 20] = "KwTrue";
    TokenType[TokenType["KwFalse"] = 21] = "KwFalse";
    TokenType[TokenType["KwNull"] = 22] = "KwNull";
    TokenType[TokenType["KwNew"] = 23] = "KwNew";
    TokenType[TokenType["KwVisibility"] = 24] = "KwVisibility";
    TokenType[TokenType["KwClass"] = 25] = "KwClass";
    TokenType[TokenType["KwModule"] = 26] = "KwModule";
    TokenType[TokenType["KwNamespace"] = 27] = "KwNamespace";
    // Grouping & Operators
    TokenType[TokenType["Equals"] = 28] = "Equals";
    TokenType[TokenType["DoubleEquals"] = 29] = "DoubleEquals";
    TokenType[TokenType["NotEquals"] = 30] = "NotEquals";
    TokenType[TokenType["Greater"] = 31] = "Greater";
    TokenType[TokenType["GreaterOrEqual"] = 32] = "GreaterOrEqual";
    TokenType[TokenType["Less"] = 33] = "Less";
    TokenType[TokenType["LessOrEqual"] = 34] = "LessOrEqual";
    TokenType[TokenType["Plus"] = 35] = "Plus";
    TokenType[TokenType["Minus"] = 36] = "Minus";
    TokenType[TokenType["Star"] = 37] = "Star";
    TokenType[TokenType["Slash"] = 38] = "Slash";
    TokenType[TokenType["Percent"] = 39] = "Percent";
    TokenType[TokenType["Bang"] = 40] = "Bang";
    TokenType[TokenType["And"] = 41] = "And";
    TokenType[TokenType["Or"] = 42] = "Or";
    TokenType[TokenType["Xor"] = 43] = "Xor";
    // Punctuation & Brackets
    TokenType[TokenType["OpenParen"] = 44] = "OpenParen";
    TokenType[TokenType["CloseParen"] = 45] = "CloseParen";
    TokenType[TokenType["OpenBrace"] = 46] = "OpenBrace";
    TokenType[TokenType["CloseBrace"] = 47] = "CloseBrace";
    TokenType[TokenType["OpenBracket"] = 48] = "OpenBracket";
    TokenType[TokenType["CloseBracket"] = 49] = "CloseBracket";
    TokenType[TokenType["Comma"] = 50] = "Comma";
    TokenType[TokenType["Dot"] = 51] = "Dot";
    TokenType[TokenType["Colon"] = 52] = "Colon";
    TokenType[TokenType["Semicolon"] = 53] = "Semicolon";
    // Special
    TokenType[TokenType["EOF"] = 54] = "EOF";
})(TokenType || (exports.TokenType = TokenType = {}));
