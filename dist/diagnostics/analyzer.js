"use strict";
// ===================================================
// LLP Static Code Analyzer & Pre-Flight Linter
// Analyzes source code BEFORE execution, catching syntax errors,
// missing keywords, unclosed blocks, type discrepancies, and typos.
// ===================================================
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeSource = analyzeSource;
const fs = __importStar(require("fs"));
const diagnostic_1 = require("./diagnostic");
const KNOWN_MODULES = {
    App: ["Launch", "Run", "Open", "Lock", "Silence", "Close", "ToString"],
    Interface: ["Launch", "Run", "Open", "Lock", "Silence", "Close", "GetElement", "Get", "Find", "GetElementById", "SetText", "GetText", "SetValue", "GetValue", "SetVisible", "GetAllElements", "CreateElement", "Load", "AutoLoad", "ToString"],
    UI: ["GetElement", "Get", "Find", "GetElementById", "SetText", "GetText", "SetValue", "GetValue", "SetVisible", "GetAllElements", "CreateElement", "Load", "AutoLoad", "ToString"],
    CLLPDB: ["Open"],
    Database: ["Open", "Execute", "Query"],
    Session: ["Start", "Set", "Get", "Has", "Remove", "Clear", "Save", "Destroy", "Id", "GetAll"],
    Device: ["GetId", "GetToken", "Sign", "Verify", "GetPlatform", "GetInfo", "IsTrusted", "GetPublicKey", "GetFingerprint", "IsKeySealed", "SignPayload", "VerifySignature"],
    Client: ["Connect", "SetServer", "GetServerUrl", "Login", "Get", "Post", "Request", "RPC", "IsConnected", "Disconnect"],
    Server: ["Listen", "Route", "Get", "Post", "RegisterRPC", "PushTo", "Broadcast", "RequireDevice", "SetAuthSecret", "GetConnectedClients", "KickClient", "BanDevice", "Stop", "IsRunning", "GetPort", "RevokeDevice", "UnrevokeDevice", "GetRegisteredDevices", "IsDeviceRevoked"],
    RPC: ["Call", "Register", "On", "PushTo", "Broadcast", "PollEvents", "GetDeviceId"],
    Math: ["Pow", "Sqrt", "Round", "Floor", "Ceil", "Abs", "Min", "Max", "Sin", "Cos", "Tan", "DegToRad", "RadToDeg", "Clamp", "Lerp"],
    SciLlp: ["Mean", "StdDev", "Variance", "Median", "MovingAverage", "Integrate", "Derivative", "LinearRegression", "SignalFilter", "Normalize"],
    SymLlp: ["Solve", "Derivative", "Integral", "Simplify", "Expand", "MatrixDet"],
    ProbLlp: ["Factorial", "Permutations", "Combinations", "NormalPDF", "NormalCDF", "Binomial", "Poisson", "Uniform", "Choice", "Sample"],
    Crypto: ["GetProjectKey", "GenerateKey", "Encrypt", "Decrypt", "ComputeHash", "Hash"],
    File: ["Read", "Write", "Append", "Exists", "Delete"],
    Directory: ["Create", "Exists", "ListFiles", "List", "Delete"],
    System: ["Sleep", "Exit", "GetEnv", "Env", "GetPlatform", "GetOS", "GetTimestamp", "Time"],
    UIValidator: ["ValidateRequired", "ValidateNumber", "ValidateEmail", "ShowSuccess", "ShowError"],
    Instance: ["new", "FindFirstChild", "GetChildren", "SetProperty", "GetProperty"],
    Console: ["Log", "Error", "Warn", "Clear"],
    Bitwise: ["And", "Or", "Xor", "Not", "ShiftLeft", "ShiftRight"],
    ByteBuffer: ["Alloc", "FromString", "FromHex", "Size", "GetCapacity", "WriteUInt8", "ReadUInt8", "WriteUInt16BE", "ReadUInt16BE", "WriteUInt32BE", "ReadUInt32BE", "WriteFloatBE", "ReadFloatBE", "WriteString", "ReadString", "ToHex", "ToBuffer"],
    Ethernet: ["CRC32", "BuildFrame"],
    IP: ["Checksum", "BuildIPv4Header"],
    Socket: ["Create", "Connect", "Bind", "Send", "SendTo", "Recv", "RecvFrom", "SetSockOpt", "GetSockOpt", "GetStats", "Close"],
    NetOptimizer: ["PackBinary", "Compress", "Decompress", "AnalyzePayload"],
    NetworkProfiler: ["GetBytesReceived", "GetBytesSent", "GetPacketsReceived", "GetPacketsSent", "GetStats", "Reset"],
    Phone: ["On", "Off", "Emit", "OnIncomingCall", "OnCallAnswered", "OnCallEnded", "OnCallStateChanged", "Dial", "Answer", "Hangup", "GetCallState", "SimulateIncomingCall", "GetAudioInputs", "GetAudioOutputs", "SetAudioRoute", "GetAudioRoute", "StartRecording", "StopRecording", "IsRecording", "SetVolume", "GetVolume", "PlayAudio", "GetCameras", "CapturePhoto", "SetFlashlight", "Vibrate", "GetBattery", "GetGPS", "GetNetworkInfo"],
    ProcessIO: ["Spawn", "OnStdout", "OnStderr", "OnExit", "WriteStdin", "Kill", "GetActiveProcesses"],
    Task: ["wait", "delay", "spawn", "defer", "cancel"],
    task: ["wait", "delay", "spawn", "defer", "cancel"],
    Json: ["parse", "stringify", "new"],
    JSON: ["parse", "stringify", "new"],
    Hexa: ["toInt", "toHex", "new"],
    hexa: ["toInt", "toHex", "new"]
};
const GLOBAL_KEYWORDS = [
    "General", "Global", "int", "float", "string", "bool", "Json", "Hexa",
    "if", "then", "else", "end", "do", "while", "for", "in",
    "func", "return", "true", "True", "false", "False",
    "null", "Null", "new", "visibility", "print", "input", "PY", "PI", "RPC",
    "Bitwise", "ByteBuffer", "Ethernet", "IP", "Socket", "NetOptimizer", "NetworkProfiler",
    "Phone", "ProcessIO", "Task", "task", "wait", "delay", "spawn", "breakpoint", "over",
    "UI", "GetElement"
];
function analyzeSource(source, filePath = "source.llp") {
    const diagnostics = [];
    const lines = source.split(/\r?\n/);
    const declaredVariables = new Set();
    const declaredFunctions = new Set();
    const declaredClasses = new Set();
    if (filePath && fs.existsSync(filePath)) {
        try {
            const { findProjectRoot, findProjectScriptFiles, isScriptVisible } = require("../project/visibility");
            const root = findProjectRoot(filePath);
            const scripts = findProjectScriptFiles(root);
            for (const s of scripts) {
                if (isScriptVisible(s, filePath)) {
                    const content = fs.readFileSync(s, "utf-8");
                    const sLines = content.split(/\r?\n/);
                    for (const line of sLines) {
                        const trimmed = line.trim();
                        const fMatch = trimmed.match(/^(?:func|function)\s+(?:over\s+)?([a-zA-Z_][a-zA-Z0-9_]*)/);
                        if (fMatch)
                            declaredFunctions.add(fMatch[1]);
                        const cMatch = trimmed.match(/^class\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
                        if (cMatch)
                            declaredClasses.add(cMatch[1]);
                        const vMatch = trimmed.match(/^(?:General|Global|int|float|string|bool|Json|Hexa)\s*(?:\[.*?\])?\s*([a-zA-Z_][a-zA-Z0-9_]*)/);
                        if (vMatch && vMatch[1])
                            declaredVariables.add(vMatch[1]);
                    }
                }
            }
        }
        catch { }
    }
    // Delimiter tracking stacks
    const parenStack = [];
    const bracketStack = [];
    const braceStack = [];
    const blockStack = []; // for if, while, for, function, class, module, namespace ... then ... end
    let inBlockComment = false;
    let blockCommentStartLine = 1;
    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const rawLine = lines[i];
        const trimmed = rawLine.trim();
        // 1. Comment handling
        if (inBlockComment) {
            if (rawLine.includes("*\\") || rawLine.includes("*/")) {
                inBlockComment = false;
            }
            continue;
        }
        if (rawLine.includes("/*")) {
            if (!rawLine.includes("*\\") && !rawLine.includes("*/")) {
                inBlockComment = true;
                blockCommentStartLine = lineNum;
            }
            continue;
        }
        // Single-line comment ignoring
        if (trimmed.startsWith("//") || (trimmed.startsWith("/-") && !trimmed.includes("{"))) {
            continue;
        }
        // 2. Lexical & String Checks
        let inString = false;
        let stringQuote = "";
        let stringStartCol = 0;
        for (let c = 0; c < rawLine.length; c++) {
            const char = rawLine[c];
            const prevChar = c > 0 ? rawLine[c - 1] : "";
            if ((char === '"' || char === "'") && prevChar !== "\\") {
                if (!inString) {
                    inString = true;
                    stringQuote = char;
                    stringStartCol = c + 1;
                }
                else if (char === stringQuote) {
                    inString = false;
                }
            }
        }
        if (inString) {
            diagnostics.push({
                file: filePath,
                line: lineNum,
                column: stringStartCol,
                severity: "error",
                code: "LLP_UNCLOSED_STRING",
                title: "Chaîne de caractères non fermée",
                message: `La chaîne de caractères commence par un guillemet '${stringQuote}' mais ne se termine jamais sur cette ligne.`,
                missing: `Guillemet fermant '${stringQuote}' attendu avant la fin de la ligne.`,
                fix: `Fermez la chaîne avec un guillemet : "${trimmed}${stringQuote}"`
            });
        }
        // 3. Arrow function check (common developer pitfall)
        const arrowMatch = rawLine.match(/(=>)/);
        if (arrowMatch && !inString) {
            const col = (arrowMatch.index || 0) + 1;
            diagnostics.push({
                file: filePath,
                line: lineNum,
                column: col,
                severity: "error",
                code: "LLP_ARROW_NOT_SUPPORTED",
                title: "Fonction fléchée '=>' non supportée",
                message: "Le langage LLP n'utilise pas de syntaxe fléchée '=>'. Les fonctions doivent être déclarées avec le mot-clé 'func' ou être passées par leur nom.",
                missing: "Déclaration de fonction standard avec 'func nom(arguments) { ... }'.",
                fix: "Remplacez la fonction fléchée par une fonction nommée :\n    func monHandler(req) {\n        return ...\n    }\n    Server.Get(\"/route\", monHandler)"
            });
        }
        // 4. Accidental assignment in condition: if x = 10 then
        const ifAssignMatch = rawLine.match(/\bif\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([^=][^]*?)\b(then|\{)/);
        if (ifAssignMatch && !rawLine.includes("==") && !rawLine.includes("!=")) {
            const col = rawLine.indexOf("=") + 1;
            diagnostics.push({
                file: filePath,
                line: lineNum,
                column: col,
                severity: "warning",
                code: "LLP_ASSIGNMENT_IN_CONDITION",
                title: "Assignation '=' suspecte dans une condition 'if'",
                message: "Vous avez utilisé un opérateur d'assignation simple '=' dans la condition au lieu d'un test d'égalité.",
                missing: "Opérateur de comparaison d'égalité '=='",
                fix: `Remplacez '=' par '==' pour comparer les valeurs :\n    if ${ifAssignMatch[1]} == ${ifAssignMatch[2].trim()} then`
            });
        }
        // 5. Structure Check: if statement
        if (trimmed.startsWith("if ") || trimmed === "if") {
            if (trimmed === "if") {
                diagnostics.push({
                    file: filePath,
                    line: lineNum,
                    column: 1,
                    severity: "error",
                    code: "LLP_MISSING_CONDITION",
                    title: "Condition 'if' manquante",
                    message: "L'instruction conditionnelle 'if' ne comporte aucune expression de condition.",
                    missing: "Expression conditionnelle suivie de 'then' ou '{'.",
                    fix: "Ajoutez une condition à vérifier, par exemple :\n    if variable == true then"
                });
            }
            else {
                const hasThen = /\bthen\b/.test(rawLine);
                const hasOpenBrace = rawLine.includes("{");
                if (!hasThen && !hasOpenBrace) {
                    diagnostics.push({
                        file: filePath,
                        line: lineNum,
                        column: rawLine.length,
                        severity: "error",
                        code: "LLP_MISSING_THEN",
                        title: "Mot-clé 'then' manquant dans l'instruction 'if'",
                        message: "La condition 'if' doit être immédiatement suivie du mot-clé 'then' ou d'une accolade ouvrante '{'.",
                        missing: "Mot-clé 'then' ou accolade '{' à la fin de la ligne.",
                        fix: `Ajoutez 'then' à la fin de la ligne :\n    ${trimmed} then`
                    });
                }
                else if (hasThen && !hasOpenBrace) {
                    blockStack.push({ char: "if", line: lineNum, col: 1, blockType: "if" });
                }
            }
        }
        // 6. Structure Check: while statement
        if (trimmed.startsWith("while ") || trimmed === "while") {
            const hasThen = /\bthen\b/.test(rawLine);
            const hasDo = /\bdo\b/.test(rawLine);
            const hasOpenBrace = rawLine.includes("{");
            if (!hasThen && !hasDo && !hasOpenBrace) {
                diagnostics.push({
                    file: filePath,
                    line: lineNum,
                    column: rawLine.length,
                    severity: "error",
                    code: "LLP_MISSING_WHILE_THEN",
                    title: "Mot-clé 'then' ou 'do' manquant dans la boucle 'while'",
                    message: "La condition de boucle 'while' doit se terminer par 'then', 'do' ou '{'.",
                    missing: "Mot-clé 'then' ou accolade '{'.",
                    fix: `Ajoutez 'then' à la fin de la ligne :\n    ${trimmed} then`
                });
            }
            else if ((hasThen || hasDo) && !hasOpenBrace) {
                blockStack.push({ char: "while", line: lineNum, col: 1, blockType: "while" });
            }
        }
        // 7. Structure Check: for in statement
        if (trimmed.startsWith("for ") || trimmed === "for") {
            const hasIn = /\bin\b/.test(rawLine);
            const hasThen = /\bthen\b/.test(rawLine);
            const hasOpenBrace = rawLine.includes("{");
            if (!hasIn) {
                diagnostics.push({
                    file: filePath,
                    line: lineNum,
                    column: 4,
                    severity: "error",
                    code: "LLP_MISSING_FOR_IN",
                    title: "Mot-clé 'in' manquant dans la boucle 'for'",
                    message: "Une boucle 'for' en LLP nécessite la clause 'in' pour désigner la collection à parcourir.",
                    missing: "Mot-clé 'in' suivi de la liste (ex: 'for item in liste then').",
                    fix: "Utilisez la syntaxe complète :\n    for element in maListe then"
                });
            }
            if (!hasThen && !hasOpenBrace) {
                diagnostics.push({
                    file: filePath,
                    line: lineNum,
                    column: rawLine.length,
                    severity: "error",
                    code: "LLP_MISSING_FOR_THEN",
                    title: "Mot-clé 'then' manquant dans la boucle 'for'",
                    message: "La boucle 'for' doit se terminer par 'then' ou '{'.",
                    missing: "Mot-clé 'then' en fin de ligne.",
                    fix: `Ajoutez 'then' à la fin de la ligne :\n    ${trimmed} then`
                });
            }
            else if (hasThen && !hasOpenBrace) {
                blockStack.push({ char: "for", line: lineNum, col: 1, blockType: "for" });
            }
        }
        // 8. Structure Check: end statement
        if (trimmed === "end" || trimmed.startsWith("end ") || trimmed.startsWith("end;")) {
            if (blockStack.length > 0) {
                blockStack.pop();
            }
            else {
                diagnostics.push({
                    file: filePath,
                    line: lineNum,
                    column: 1,
                    severity: "error",
                    code: "LLP_UNEXPECTED_END",
                    title: "Mot-clé 'end' orphelin",
                    message: "Le mot-clé 'end' ne correspond à aucun bloc conditionnel ou boucle ouvert ('if', 'while', 'for').",
                    missing: "Bloc 'if', 'while' ou 'for' correspondant.",
                    fix: "Supprimez ce 'end' superflu ou vérifiez que vous n'avez pas déjà fermé le bloc avec une accolade '}'."
                });
            }
        }
        // 9. Function Declaration: func / function [over] name(params) { or then
        if (trimmed.startsWith("func ") || trimmed === "func" || trimmed.startsWith("function ") || trimmed === "function") {
            const funcMatch = trimmed.match(/^(?:func|function)\s+(?:over\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)/);
            if (!funcMatch) {
                diagnostics.push({
                    file: filePath,
                    line: lineNum,
                    column: 1,
                    severity: "error",
                    code: "LLP_MALFORMED_FUNCTION",
                    title: "Déclaration de fonction invalide",
                    message: "La déclaration de fonction doit comporter un nom d'identifiant suivi de paramètres entre parenthèses.",
                    missing: "Nom de fonction et parenthèses '(params)'.",
                    fix: "Déclarez la fonction avec le format :\n    func monNom(param1, param2) then\n        return resultat\n    end"
                });
            }
            else {
                const fnName = funcMatch[1];
                declaredFunctions.add(fnName);
                const codeClean = trimmed.replace(/\/\/.*$/, "").replace(/\/-.*\\/, "").trim();
                if (!codeClean.includes("{") && !codeClean.endsWith("then")) {
                    diagnostics.push({
                        file: filePath,
                        line: lineNum,
                        column: rawLine.length,
                        severity: "error",
                        code: "LLP_MISSING_FUNCTION_BODY",
                        title: "Corps de fonction manquant",
                        message: `La fonction '${fnName}' doit ouvrir son corps avec une accolade '{' ou 'then'.`,
                        missing: "Mot-clé 'then' ou accolade ouvrante '{' après les paramètres.",
                        fix: `Ajoutez 'then' à la fin de la déclaration :\n    function ${fnName}(${funcMatch[2]}) then`
                    });
                }
                else if (codeClean.endsWith("then") && !codeClean.includes("{")) {
                    blockStack.push({ char: `function ${fnName}`, line: lineNum, col: 1, blockType: "function" });
                }
            }
        }
        // 9b. Class Declaration: class Name : Parent then
        if (trimmed.startsWith("class ") || trimmed === "class") {
            const classMatch = trimmed.match(/^class\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (classMatch) {
                const className = classMatch[1];
                declaredClasses.add(className);
                const codeClean = trimmed.replace(/\/\/.*$/, "").replace(/\/-.*\\/, "").trim();
                if (codeClean.endsWith("then") && !codeClean.includes("{")) {
                    blockStack.push({ char: `class ${className}`, line: lineNum, col: 1, blockType: "class" });
                }
            }
        }
        // 9c. Module Statement: module Name then
        if (trimmed.startsWith("module ") || trimmed === "module") {
            const modMatch = trimmed.match(/^module\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (modMatch) {
                const modName = modMatch[1];
                const codeClean = trimmed.replace(/\/\/.*$/, "").replace(/\/-.*\\/, "").trim();
                if (codeClean.endsWith("then") && !codeClean.includes("{")) {
                    blockStack.push({ char: `module ${modName}`, line: lineNum, col: 1, blockType: "module" });
                }
            }
        }
        // 9d. Namespace Declaration: namespace Name then
        if (trimmed.startsWith("namespace ") || trimmed === "namespace") {
            const nsMatch = trimmed.match(/^(?:package|namespace)\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
            if (nsMatch) {
                const nsName = nsMatch[1];
                const codeClean = trimmed.replace(/\/\/.*$/, "").replace(/\/-.*\\/, "").trim();
                if (codeClean.endsWith("then") && !codeClean.includes("{")) {
                    blockStack.push({ char: `namespace ${nsName}`, line: lineNum, col: 1, blockType: "namespace" });
                }
            }
        }
        // 10. Variable Declaration
        const varMatch = trimmed.match(/^(General|Global|int|float|string|bool|Json|Hexa)\s*(\[.*?\])?\s*([a-zA-Z_][a-zA-Z0-9_]*)?(\s*=\s*(.*))?$/);
        if (varMatch) {
            const typeKw = varMatch[1];
            const arrayBracket = varMatch[2];
            const varName = varMatch[3];
            const hasAssignment = varMatch[4] !== undefined;
            if (!varName) {
                diagnostics.push({
                    file: filePath,
                    line: lineNum,
                    column: typeKw.length + 1,
                    severity: "error",
                    code: "LLP_MISSING_VAR_NAME",
                    title: "Nom de variable manquant",
                    message: `Le mot-clé de type '${typeKw}' n'est suivi d'aucun nom de variable.`,
                    missing: "Identifiant valide (ex: monNom, compteur, total).",
                    fix: `Spécifiez un nom pour la variable :\n    ${typeKw} maVariable = valeur`
                });
            }
            else {
                declaredVariables.add(varName);
                // Fixed array overflow check
                if (arrayBracket) {
                    const capMatch = arrayBracket.match(/\[\s*(\d+)\s*\]/);
                    if (capMatch) {
                        const maxCap = parseInt(capMatch[1], 10);
                        const rhs = varMatch[5] ? varMatch[5].trim() : "";
                        const itemsMatch = rhs.match(/\{([^}]*)\}/);
                        if (itemsMatch) {
                            const items = itemsMatch[1].split(",").filter(s => s.trim().length > 0);
                            if (items.length > maxCap) {
                                diagnostics.push({
                                    file: filePath,
                                    line: lineNum,
                                    column: rawLine.indexOf("{") + 1,
                                    severity: "error",
                                    code: "LLP_ARRAY_CAPACITY_EXCEEDED",
                                    title: "Dépassement de capacité du tableau fixe",
                                    message: `Le tableau fixe '${varName}' est déclaré avec une capacité maximale de ${maxCap} éléments, mais ${items.length} éléments lui sont assignés.`,
                                    missing: `Capacité suffisante (${items.length}) ou réduction du nombre d'éléments.`,
                                    fix: `Ajustez la taille du tableau fixe :\n    ${typeKw}[${items.length}] ${varName} = ...\nOu utilisez une liste dynamique redimensionnable sans crochet :\n    General ${varName} = General{...}`
                                });
                            }
                        }
                    }
                }
            }
        }
        // 11. Delimiter balance tracking per character
        let inStrChar = false;
        let quoteChar = "";
        for (let col = 0; col < rawLine.length; col++) {
            const ch = rawLine[col];
            const prev = col > 0 ? rawLine[col - 1] : "";
            if ((ch === '"' || ch === "'") && prev !== "\\") {
                if (!inStrChar) {
                    inStrChar = true;
                    quoteChar = ch;
                }
                else if (ch === quoteChar) {
                    inStrChar = false;
                }
            }
            if (inStrChar)
                continue;
            if (ch === "(")
                parenStack.push({ char: "(", line: lineNum, col: col + 1 });
            else if (ch === ")") {
                if (parenStack.length > 0)
                    parenStack.pop();
                else {
                    diagnostics.push({
                        file: filePath,
                        line: lineNum,
                        column: col + 1,
                        severity: "error",
                        code: "LLP_UNEXPECTED_CLOSE_PAREN",
                        title: "Parenthèse fermante ')' inattendue",
                        message: "Cette parenthèse ')' n'a pas de parenthèse ouvrante '(' correspondante.",
                        missing: "Parenthèse ouvrante '(' préalable.",
                        fix: "Supprimez la parenthèse fermante en trop ou ouvrez une parenthèse au préalable."
                    });
                }
            }
            else if (ch === "[")
                bracketStack.push({ char: "[", line: lineNum, col: col + 1 });
            else if (ch === "]") {
                if (bracketStack.length > 0)
                    bracketStack.pop();
                else {
                    diagnostics.push({
                        file: filePath,
                        line: lineNum,
                        column: col + 1,
                        severity: "error",
                        code: "LLP_UNEXPECTED_CLOSE_BRACKET",
                        title: "Crochet fermant ']' inattendu",
                        message: "Ce crochet ']' n'a pas de crochet ouvrant '[' correspondant.",
                        missing: "Crochet ouvrant '[' préalable.",
                        fix: "Supprimez le crochet fermant en trop."
                    });
                }
            }
            else if (ch === "{")
                braceStack.push({ char: "{", line: lineNum, col: col + 1 });
            else if (ch === "}") {
                if (braceStack.length > 0)
                    braceStack.pop();
                else {
                    diagnostics.push({
                        file: filePath,
                        line: lineNum,
                        column: col + 1,
                        severity: "error",
                        code: "LLP_UNEXPECTED_CLOSE_BRACE",
                        title: "Accolade fermante '}' inattendue",
                        message: "Cette accolade '}' ne correspond à aucune accolade ouvrante '{'.",
                        missing: "Accolade ouvrante '{' préalable.",
                        fix: "Supprimez l'accolade fermante en trop."
                    });
                }
            }
        }
        // 12. Method & Identifier typo checks: Module.Method(...)
        const memberCalls = rawLine.matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g);
        for (const m of memberCalls) {
            const caller = m[1];
            const method = m[2];
            const col = (m.index || 0) + caller.length + 2;
            // Check if caller is a known module
            if (KNOWN_MODULES[caller]) {
                const validMethods = KNOWN_MODULES[caller];
                if (method !== "ToString" && !validMethods.includes(method)) {
                    const closest = (0, diagnostic_1.findClosestMatch)(method, validMethods, 3);
                    const suggestion = closest ? `Vouliez-vous dire '${caller}.${closest}()' ?` : `Méthodes disponibles : ${validMethods.join(", ")}`;
                    diagnostics.push({
                        file: filePath,
                        line: lineNum,
                        column: col,
                        severity: "error",
                        code: "LLP_UNKNOWN_MODULE_METHOD",
                        title: `Méthode inconnue '${caller}.${method}()'`,
                        message: `Le service '${caller}' ne possède pas de méthode nommée '${method}'.`,
                        missing: closest ? `Correction : '${closest}'` : `L'une des méthodes valides : ${validMethods.join(", ")}`,
                        fix: closest
                            ? `Remplacez '${method}' par '${closest}' :\n    ${caller}.${closest}(...)`
                            : `Consultez les méthodes disponibles pour ${caller} : ${validMethods.join(", ")}`,
                        hint: suggestion
                    });
                }
            }
            else {
                // Unknown module? Check if it's a typo of a known module (e.g. Clinet, Seession)
                const closestModule = (0, diagnostic_1.findClosestMatch)(caller, Object.keys(KNOWN_MODULES), 2);
                if (closestModule && !declaredVariables.has(caller)) {
                    diagnostics.push({
                        file: filePath,
                        line: lineNum,
                        column: (m.index || 0) + 1,
                        severity: "error",
                        code: "LLP_UNKNOWN_MODULE_TYPO",
                        title: `Service ou variable inconnu '${caller}'`,
                        message: `L'objet '${caller}' n'est pas déclaré.`,
                        missing: `Correction du nom du service standard '${closestModule}'.`,
                        fix: `Corrigez la faute de frappe en remplaçant '${caller}' par '${closestModule}' :\n    ${closestModule}.${method}(...)`,
                        hint: `Vouliez-vous utiliser la bibliothèque standard '${closestModule}' ?`
                    });
                }
            }
        }
    }
    // 13. Check unclosed block comment
    if (inBlockComment) {
        diagnostics.push({
            file: filePath,
            line: blockCommentStartLine,
            column: 1,
            severity: "error",
            code: "LLP_UNCLOSED_BLOCK_COMMENT",
            title: "Commentaire multiligne non fermé",
            message: "Le bloc de commentaire '/*' ouvert n'a jamais été fermé avant la fin du fichier.",
            missing: "Délimiteur fermant '*\\' ou '*/'.",
            fix: "Ajoutez '*\\' ou '*/' pour refermer le commentaire."
        });
    }
    // 14. Check unclosed braces
    while (braceStack.length > 0) {
        const item = braceStack.pop();
        diagnostics.push({
            file: filePath,
            line: item.line,
            column: item.col,
            severity: "error",
            code: "LLP_UNCLOSED_BRACE",
            title: "Accolade ouvrante '{' non fermée",
            message: `Une accolade ouvrante '{' a été ouverte à la ligne ${item.line} mais n'a jamais été refermée.`,
            missing: "Accolade fermante '}' correspondante.",
            fix: `Ajoutez une accolade fermante '}' à la fin du bloc ouvert à la ligne ${item.line}.`
        });
    }
    // 15. Check unclosed parentheses
    while (parenStack.length > 0) {
        const item = parenStack.pop();
        diagnostics.push({
            file: filePath,
            line: item.line,
            column: item.col,
            severity: "error",
            code: "LLP_UNCLOSED_PAREN",
            title: "Parenthèse ouvrante '(' non fermée",
            message: `Une parenthèse ouvrante '(' a été ouverte à la ligne ${item.line} mais n'a jamais été refermée.`,
            missing: "Parenthèse fermante ')' correspondante.",
            fix: `Ajoutez une parenthèse fermante ')' pour clore l'expression ouverte à la ligne ${item.line}.`
        });
    }
    // 16. Check unclosed brackets
    while (bracketStack.length > 0) {
        const item = bracketStack.pop();
        diagnostics.push({
            file: filePath,
            line: item.line,
            column: item.col,
            severity: "error",
            code: "LLP_UNCLOSED_BRACKET",
            title: "Crochet ouvrant '[' non fermé",
            message: `Un crochet ouvrant '[' a été ouvert à la ligne ${item.line} mais n'a jamais été refermé.`,
            missing: "Crochet fermant ']' correspondant.",
            fix: `Fermez le crochet avec ']' pour terminer l'indexation ou la déclaration du tableau.`
        });
    }
    // 17. Check unclosed keyword blocks (if, while, for without end)
    while (blockStack.length > 0) {
        const item = blockStack.pop();
        diagnostics.push({
            file: filePath,
            line: item.line,
            column: item.col,
            severity: "error",
            code: "LLP_UNCLOSED_BLOCK",
            title: `Bloc '${item.char}' non fermé`,
            message: `Le bloc '${item.char}' ouvert à la ligne ${item.line} n'est jamais clôturé par le mot-clé 'end'.`,
            missing: "Mot-clé 'end' à la fin du bloc.",
            fix: `Ajoutez 'end' pour clore le bloc '${item.char}' de la ligne ${item.line}.`
        });
    }
    // 18. Check .cllp Class file consistency (Class Lolpaon must match file name)
    if (filePath.toLowerCase().endsWith(".cllp")) {
        const fileName = filePath.replace(/^.*[\\\/]/, "");
        const expectedClassName = fileName.replace(/\.cllp$/i, "");
        if (!declaredClasses.has(expectedClassName)) {
            diagnostics.push({
                file: filePath,
                line: 1,
                column: 1,
                severity: "error",
                code: "LLP_CLLP_CLASS_NAME_MISMATCH",
                title: `Classe '${expectedClassName}' manquante dans le fichier '${fileName}'`,
                message: `Un fichier .cllp (Class Lolpaon) doit obligatoirement déclarer une classe portant le même nom que le fichier : 'class ${expectedClassName}'.`,
                missing: `class ${expectedClassName} then ... end`,
                fix: `Déclarez la classe '${expectedClassName}' :\n    class ${expectedClassName} then\n        /- Propriétés et méthodes \\\n    end`
            });
        }
    }
    return diagnostics;
}
