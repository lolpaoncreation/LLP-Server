export declare enum TokenType {
    Number = 0,
    String = 1,
    Boolean = 2,
    Identifier = 3,
    Null = 4,
    KwGeneral = 5,// General
    KwInt = 6,// int
    KwFloat = 7,// float
    KwString = 8,// string
    KwBool = 9,// bool
    KwIf = 10,
    KwThen = 11,
    KwElse = 12,
    KwEnd = 13,
    KwDo = 14,
    KwWhile = 15,
    KwFor = 16,
    KwIn = 17,
    KwFunc = 18,
    KwReturn = 19,
    KwTrue = 20,
    KwFalse = 21,
    KwNull = 22,
    KwNew = 23,
    KwVisibility = 24,
    KwClass = 25,
    KwModule = 26,
    KwNamespace = 27,
    Equals = 28,// =
    DoubleEquals = 29,// ==
    NotEquals = 30,// !=
    Greater = 31,// >
    GreaterOrEqual = 32,// >=
    Less = 33,// <
    LessOrEqual = 34,// <=
    Plus = 35,// +
    Minus = 36,// -
    Star = 37,// *
    Slash = 38,// /
    Percent = 39,// %
    Bang = 40,// !
    And = 41,// && or and or &
    Or = 42,// || or or or |
    Xor = 43,// &| or xor
    OpenParen = 44,// (
    CloseParen = 45,// )
    OpenBrace = 46,// {
    CloseBrace = 47,// }
    OpenBracket = 48,// [
    CloseBracket = 49,// ]
    Comma = 50,// ,
    Dot = 51,// .
    Colon = 52,// :
    Semicolon = 53,// ;
    EOF = 54
}
export interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
}
