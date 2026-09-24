export enum TokenType {
  // Types & Literals
  Number,
  String,
  Boolean,
  Identifier,
  Null,

  // Type Keywords
  KwGeneral,   // General
  KwInt,       // int
  KwFloat,     // float
  KwString,    // string
  KwBool,      // bool

  // Keywords
  KwIf,
  KwThen,
  KwElse,
  KwEnd,
  KwDo,
  KwWhile,
  KwFor,
  KwIn,
  KwFunc,
  KwReturn,
  KwTrue,
  KwFalse,
  KwNull,
  KwNew,
  KwVisibility,
  KwClass,
  KwModule,
  KwNamespace,

  // Grouping & Operators
  Equals,          // =
  DoubleEquals,    // ==
  NotEquals,       // !=
  Greater,         // >
  GreaterOrEqual,  // >=
  Less,            // <
  LessOrEqual,     // <=
  Plus,            // +
  Minus,           // -
  Star,            // *
  Slash,           // /
  Percent,         // %
  Bang,            // !
  And,             // && or and or &
  Or,              // || or or or |
  Xor,             // &| or xor

  // Punctuation & Brackets
  OpenParen,       // (
  CloseParen,      // )
  OpenBrace,       // {
  CloseBrace,      // }
  OpenBracket,     // [
  CloseBracket,    // ]
  Comma,           // ,
  Dot,             // .
  Colon,           // :
  Semicolon,       // ;

  // Special
  EOF
}

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  column: number;
}
