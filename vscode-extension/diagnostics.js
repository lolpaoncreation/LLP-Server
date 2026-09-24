// ===================================================
// LLP VS Code Real-Time Static Code Analyzer & Linter
// ===================================================

const KNOWN_MODULES = {
    App: ["Launch", "Lock", "Silence", "Close"],
    CLLPDB: ["Open"],
    Database: ["Open", "Execute", "Query"],
    Session: ["Start", "Set", "Get", "Has", "Remove", "Clear", "Save", "Destroy", "Id", "GetAll"],
    Device: ["GetId", "GetToken", "Sign", "Verify", "GetPlatform", "GetInfo", "IsTrusted"],
    Client: ["Connect", "SetServer", "GetServerUrl", "Login", "Get", "Post", "Request", "IsConnected", "Disconnect"],
    Server: ["Listen", "Route", "Get", "Post", "RequireDevice", "SetAuthSecret", "GetConnectedClients", "KickClient", "BanDevice", "Stop", "IsRunning", "GetPort"],
    Math: ["Pow", "Sqrt", "Round", "Floor", "Ceil", "Abs", "Min", "Max", "Sin", "Cos", "Tan", "DegToRad", "RadToDeg", "Clamp", "Lerp"],
    SciLlp: ["Mean", "StdDev", "Variance", "Median", "MovingAverage", "Integrate", "Derivative", "LinearRegression", "SignalFilter", "Normalize"],
    SymLlp: ["Solve", "Derivative", "Integral", "Simplify", "Expand", "MatrixDet"],
    ProbLlp: ["Factorial", "Permutations", "Combinations", "NormalPDF", "NormalCDF", "Binomial", "Poisson", "Uniform", "Choice", "Sample"],
    Crypto: ["GetProjectKey", "GenerateKey", "Encrypt", "Decrypt", "ComputeHash"],
    File: ["Read", "Write", "Append", "Exists", "Delete"],
    Directory: ["Create", "Exists", "ListFiles", "Delete"],
    System: ["Sleep", "Exit", "GetEnv", "GetPlatform", "GetTimestamp"],
    UIValidator: ["ValidateRequired", "ValidateNumber", "ValidateEmail", "ShowSuccess", "ShowError"],
    Instance: ["new", "FindFirstChild", "GetChildren", "SetProperty", "GetProperty"],
    Console: ["Log", "Error", "Warn", "Clear"]
};

function levenshteinDistance(a, b) {
    const an = a ? a.length : 0;
    const bn = b ? b.length : 0;
    if (an === 0) return bn;
    if (bn === 0) return an;

    const matrix = Array.from({ length: bn + 1 }, () => new Array(an + 1).fill(0));
    for (let i = 0; i <= an; ++i) matrix[0][i] = i;
    for (let j = 0; j <= bn; ++j) matrix[j][0] = j;

    for (let j = 1; j <= bn; ++j) {
        for (let i = 1; i <= an; ++i) {
            const cost = a[i - 1].toLowerCase() === b[j - 1].toLowerCase() ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j - 1][i] + 1,
                matrix[j][i - 1] + 1,
                matrix[j - 1][i - 1] + cost
            );
        }
    }
    return matrix[bn][an];
}

function findClosestMatch(target, candidates, maxDistance = 3) {
    let closest = null;
    let minDistance = maxDistance + 1;
    for (const candidate of candidates) {
        const dist = levenshteinDistance(target, candidate);
        if (dist < minDistance) {
            minDistance = dist;
            closest = candidate;
        }
    }
    return minDistance <= maxDistance ? closest : null;
}

function analyzeSource(source, filePath = "source.llp") {
    const diagnostics = [];
    const lines = source.split(/\r?\n/);

    const declaredVariables = new Set();
    const declaredFunctions = new Set();

    const parenStack = [];
    const bracketStack = [];
    const braceStack = [];
    const blockStack = [];

    let inBlockComment = false;
    let blockCommentStartLine = 1;

    for (let i = 0; i < lines.length; i++) {
        const lineNum = i + 1;
        const rawLine = lines[i];
        const trimmed = rawLine.trim();

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

        if (trimmed.startsWith("//") || (trimmed.startsWith("/-") && !trimmed.includes("{"))) {
            continue;
        }

        // 1. Unclosed string detection
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
                } else if (char === stringQuote) {
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
                message: `La chaîne commence par '${stringQuote}' mais ne se termine jamais sur cette ligne.`,
                missing: `Guillemet fermant '${stringQuote}' attendu avant la fin de la ligne.`,
                fix: `Fermez la chaîne avec '${stringQuote}'.`
            });
        }

        // 2. Arrow function check
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
                message: "Le langage LLP utilise 'func nom(params) { ... }' pour déclarer des fonctions.",
                missing: "Déclaration de fonction standard avec 'func'.",
                fix: "Remplacez la flèche par une fonction nommée :\nfunc monHandler(req) {\n    return ...\n}"
            });
        }

        // 3. Condition check: if
        if (trimmed.startsWith("if ") || trimmed === "if") {
            if (trimmed === "if") {
                diagnostics.push({
                    file: filePath,
                    line: lineNum,
                    column: 1,
                    severity: "error",
                    code: "LLP_MISSING_CONDITION",
                    title: "Condition 'if' manquante",
                    message: "L'instruction 'if' ne comporte aucune expression de condition.",
                    missing: "Expression conditionnelle suivie de 'then' ou '{'.",
                    fix: "Ajoutez une condition : if condition == true then"
                });
            } else {
                const hasThen = /\bthen\b/.test(rawLine);
                const hasOpenBrace = rawLine.includes("{");
                if (!hasThen && !hasOpenBrace) {
                    diagnostics.push({
                        file: filePath,
                        line: lineNum,
                        column: rawLine.length,
                        severity: "error",
                        code: "LLP_MISSING_THEN",
                        title: "Mot-clé 'then' manquant dans 'if'",
                        message: "La condition 'if' doit être immédiatement suivie du mot-clé 'then' ou d'une accolade ouvrante '{'.",
                        missing: "Mot-clé 'then' ou accolade '{' à la fin de la ligne.",
                        fix: `Ajoutez 'then' à la fin : ${trimmed} then`
                    });
                } else if (hasThen && !hasOpenBrace) {
                    blockStack.push({ char: "if", line: lineNum, col: 1, blockType: "if" });
                }
            }
        }

        // 4. While check
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
                    title: "Mot-clé 'then' manquant dans 'while'",
                    message: "La boucle 'while' doit se terminer par 'then', 'do' ou '{'.",
                    missing: "Mot-clé 'then' ou accolade '{'.",
                    fix: `Ajoutez 'then' : ${trimmed} then`
                });
            } else if ((hasThen || hasDo) && !hasOpenBrace) {
                blockStack.push({ char: "while", line: lineNum, col: 1, blockType: "while" });
            }
        }

        // 5. For in check
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
                    title: "Mot-clé 'in' manquant dans 'for'",
                    message: "La boucle 'for' nécessite 'in' pour désigner la liste à parcourir.",
                    missing: "Mot-clé 'in' (ex: for item in liste then).",
                    fix: "Syntaxe : for element in maListe then"
                });
            }
            if (!hasThen && !hasOpenBrace) {
                diagnostics.push({
                    file: filePath,
                    line: lineNum,
                    column: rawLine.length,
                    severity: "error",
                    code: "LLP_MISSING_FOR_THEN",
                    title: "Mot-clé 'then' manquant dans 'for'",
                    message: "La boucle 'for' doit se terminer par 'then' ou '{'.",
                    missing: "Mot-clé 'then' en fin de ligne.",
                    fix: `Ajoutez 'then' : ${trimmed} then`
                });
            } else if (hasThen && !hasOpenBrace) {
                blockStack.push({ char: "for", line: lineNum, col: 1, blockType: "for" });
            }
        }

        // 6. End check
        if (trimmed === "end" || trimmed.startsWith("end ") || trimmed.startsWith("end;")) {
            if (blockStack.length > 0) {
                blockStack.pop();
            } else {
                diagnostics.push({
                    file: filePath,
                    line: lineNum,
                    column: 1,
                    severity: "error",
                    code: "LLP_UNEXPECTED_END",
                    title: "Mot-clé 'end' orphelin",
                    message: "Le mot-clé 'end' ne correspond à aucun bloc ouvert.",
                    missing: "Bloc 'if', 'while' ou 'for' correspondant.",
                    fix: "Supprimez ce 'end' superflu."
                });
            }
        }

        // 7. Function check
        if (trimmed.startsWith("func ") || trimmed === "func") {
            const funcMatch = trimmed.match(/^func\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)/);
            if (!funcMatch) {
                diagnostics.push({
                    file: filePath,
                    line: lineNum,
                    column: 1,
                    severity: "error",
                    code: "LLP_MALFORMED_FUNCTION",
                    title: "Déclaration de fonction invalide",
                    message: "La fonction doit comporter un nom et des paramètres entre parenthèses.",
                    missing: "Nom de fonction et parenthèses '(params)'.",
                    fix: "Exemple : func monNom(param1, param2) { ... }"
                });
            } else {
                declaredFunctions.add(funcMatch[1]);
                if (!trimmed.includes("{") && !trimmed.endsWith("then")) {
                    diagnostics.push({
                        file: filePath,
                        line: lineNum,
                        column: rawLine.length,
                        severity: "error",
                        code: "LLP_MISSING_FUNCTION_BODY",
                        title: "Corps de fonction manquant",
                        message: `La fonction '${funcMatch[1]}' doit ouvrir son corps avec '{' ou 'then'.`,
                        missing: "Accolade ouvrante '{' après les paramètres.",
                        fix: `Ajoutez '{' à la fin : func ${funcMatch[1]}(${funcMatch[2]}) {`
                    });
                }
            }
        }

        // 8. Variable declaration check & Array Capacity
        const varMatch = trimmed.match(/^(General|Global|int|float|string|bool)\s*(\[.*?\])?\s*([a-zA-Z_][a-zA-Z0-9_]*)?(\s*=\s*(.*))?$/);
        if (varMatch) {
            const typeKw = varMatch[1];
            const arrayBracket = varMatch[2];
            const varName = varMatch[3];

            if (!varName) {
                diagnostics.push({
                    file: filePath,
                    line: lineNum,
                    column: typeKw.length + 1,
                    severity: "error",
                    code: "LLP_MISSING_VAR_NAME",
                    title: "Nom de variable manquant",
                    message: `Le type '${typeKw}' n'est suivi d'aucun nom de variable.`,
                    missing: "Nom d'identifiant valide.",
                    fix: `${typeKw} maVariable = valeur`
                });
            } else {
                declaredVariables.add(varName);

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
                                    message: `Le tableau fixe '${varName}' a une capacité de ${maxCap}, mais ${items.length} éléments sont fournis.`,
                                    missing: `Capacité suffisante (${items.length}).`,
                                    fix: `Déclarez avec [${items.length}] ou utilisez General ${varName} = General{...}`
                                });
                            }
                        }
                    }
                }
            }
        }

        // 9. Delimiters per-character
        let inStr = false;
        let qCh = "";
        for (let col = 0; col < rawLine.length; col++) {
            const ch = rawLine[col];
            const prev = col > 0 ? rawLine[col - 1] : "";
            if ((ch === '"' || ch === "'") && prev !== "\\") {
                if (!inStr) { inStr = true; qCh = ch; }
                else if (ch === qCh) { inStr = false; }
            }
            if (inStr) continue;

            if (ch === "(") parenStack.push({ char: "(", line: lineNum, col: col + 1 });
            else if (ch === ")") {
                if (parenStack.length > 0) parenStack.pop();
                else diagnostics.push({ file: filePath, line: lineNum, column: col + 1, severity: "error", code: "LLP_UNEXPECTED_CLOSE_PAREN", title: "Parenthèse fermante ')' inattendue", message: "Cette parenthèse n'a pas de '(' correspondante.", missing: "Parenthèse ouvrante.", fix: "Supprimez la parenthèse en trop." });
            } else if (ch === "[") bracketStack.push({ char: "[", line: lineNum, col: col + 1 });
            else if (ch === "]") {
                if (bracketStack.length > 0) bracketStack.pop();
                else diagnostics.push({ file: filePath, line: lineNum, column: col + 1, severity: "error", code: "LLP_UNEXPECTED_CLOSE_BRACKET", title: "Crochet fermant ']' inattendu", message: "Ce crochet n'a pas de '[' correspondant.", missing: "Crochet ouvrant.", fix: "Supprimez le crochet en trop." });
            } else if (ch === "{") braceStack.push({ char: "{", line: lineNum, col: col + 1 });
            else if (ch === "}") {
                if (braceStack.length > 0) braceStack.pop();
                else diagnostics.push({ file: filePath, line: lineNum, column: col + 1, severity: "error", code: "LLP_UNEXPECTED_CLOSE_BRACE", title: "Accolade fermante '}' inattendue", message: "Cette accolade ne correspond à aucun bloc '{'.", missing: "Accolade ouvrante.", fix: "Supprimez l'accolade en trop." });
            }
        }

        // 10. Member method typo checks
        const memberCalls = rawLine.matchAll(/([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g);
        for (const m of memberCalls) {
            const caller = m[1];
            const method = m[2];
            const col = (m.index || 0) + caller.length + 2;

            if (KNOWN_MODULES[caller]) {
                const validMethods = KNOWN_MODULES[caller];
                if (!validMethods.includes(method)) {
                    const closest = findClosestMatch(method, validMethods, 3);
                    diagnostics.push({
                        file: filePath,
                        line: lineNum,
                        column: col,
                        severity: "error",
                        code: "LLP_UNKNOWN_MODULE_METHOD",
                        title: `Méthode inconnue '${caller}.${method}()'`,
                        message: `Le service '${caller}' ne possède pas de méthode '${method}'.`,
                        missing: closest ? `Correction : '${closest}'` : `Méthodes valides : ${validMethods.join(", ")}`,
                        fix: closest ? `Remplacez par : ${caller}.${closest}(...)` : `Méthodes valides : ${validMethods.join(", ")}`,
                        hint: closest ? `Vouliez-vous dire '${caller}.${closest}()' ?` : undefined
                    });
                }
            } else {
                const closestModule = findClosestMatch(caller, Object.keys(KNOWN_MODULES), 2);
                if (closestModule && !declaredVariables.has(caller)) {
                    diagnostics.push({
                        file: filePath,
                        line: lineNum,
                        column: (m.index || 0) + 1,
                        severity: "error",
                        code: "LLP_UNKNOWN_MODULE_TYPO",
                        title: `Service ou variable inconnu '${caller}'`,
                        message: `L'objet '${caller}' n'est pas déclaré.`,
                        missing: `Correction : '${closestModule}'.`,
                        fix: `Corrigez par '${closestModule}' : ${closestModule}.${method}(...)`,
                        hint: `Vouliez-vous utiliser '${closestModule}' ?`
                    });
                }
            }
        }
    }

    // Trailing unclosed delimiters
    while (braceStack.length > 0) {
        const item = braceStack.pop();
        diagnostics.push({ file: filePath, line: item.line, column: item.col, severity: "error", code: "LLP_UNCLOSED_BRACE", title: "Accolade '{' non fermée", message: `Accolade ouverte ligne ${item.line} non refermée.`, missing: "Accolade fermante '}'.", fix: "Ajoutez '}' pour clore le bloc." });
    }
    while (parenStack.length > 0) {
        const item = parenStack.pop();
        diagnostics.push({ file: filePath, line: item.line, column: item.col, severity: "error", code: "LLP_UNCLOSED_PAREN", title: "Parenthèse '(' non fermée", message: `Parenthèse ouverte ligne ${item.line} non refermée.`, missing: "Parenthèse fermante ')'.", fix: "Ajoutez ')'." });
    }
    while (bracketStack.length > 0) {
        const item = bracketStack.pop();
        diagnostics.push({ file: filePath, line: item.line, column: item.col, severity: "error", code: "LLP_UNCLOSED_BRACKET", title: "Crochet '[' non fermé", message: `Crochet ouvert ligne ${item.line} non refermé.`, missing: "Crochet fermant ']'.", fix: "Ajoutez ']'." });
    }
    while (blockStack.length > 0) {
        const item = blockStack.pop();
        diagnostics.push({ file: filePath, line: item.line, column: item.col, severity: "error", code: "LLP_UNCLOSED_BLOCK", title: `Bloc '${item.char}' non fermé`, message: `Bloc '${item.char}' ouvert ligne ${item.line} non clôturé par 'end'.`, missing: "Mot-clé 'end'.", fix: `Ajoutez 'end' pour clore le bloc '${item.char}'.` });
    }

    return diagnostics;
}

module.exports = {
    analyzeSource,
    KNOWN_MODULES
};
