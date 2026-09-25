export declare enum TokenType {
    Number = 0,
    String = 1,
    Boolean = 2,
    Identifier = 3,
    Null = 4,
    KwGeneral = 5,// General
    KwGlobal = 6,// Global
    KwInt = 7,// int
    KwFloat = 8,// float
    KwString = 9,// string
    KwBool = 10,// bool
    KwJson = 11,// Json
    KwHexa = 12,// Hexa
    KwBreakpoint = 13,// breakpoint
    KwTask = 14,// task
    KwIf = 15,
    KwThen = 16,
    KwElse = 17,
    KwEnd = 18,
    KwDo = 19,
    KwWhile = 20,
    KwFor = 21,
    KwIn = 22,
    KwFunc = 23,
    KwReturn = 24,
    KwTrue = 25,
    KwFalse = 26,
    KwNull = 27,
    KwNew = 28,
    KwVisibility = 29,
    KwClass = 30,
    KwModule = 31,
    KwNamespace = 32,
    KwOver = 33,
    Equals = 34,// =
    DoubleEquals = 35,// ==
    NotEquals = 36,// !=
    Greater = 37,// >
    GreaterOrEqual = 38,// >=
    Less = 39,// <
    LessOrEqual = 40,// <=
    Plus = 41,// +
    Minus = 42,// -
    Star = 43,// *
    Slash = 44,// /
    Percent = 45,// %
    Bang = 46,// !
    And = 47,// && or and or &
    Or = 48,// || or or or |
    Xor = 49,// &| or xor
    OpenParen = 50,// (
    CloseParen = 51,// )
    OpenBrace = 52,// {
    CloseBrace = 53,// }
    OpenBracket = 54,// [
    CloseBracket = 55,// ]
    Comma = 56,// ,
    Dot = 57,// .
    Colon = 58,// :
    Semicolon = 59,// ;
    EOF = 60
}
export interface Token {
    type: TokenType;
    value: string;
    line: number;
    column: number;
}
