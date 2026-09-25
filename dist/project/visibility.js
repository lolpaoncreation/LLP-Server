"use strict";
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
exports.findProjectRoot = findProjectRoot;
exports.findProjectScriptFiles = findProjectScriptFiles;
exports.parseFileVisibility = parseFileVisibility;
exports.isScriptVisible = isScriptVisible;
exports.loadProjectEnvironment = loadProjectEnvironment;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const index_1 = require("../index");
const lexer_1 = require("../lexer/lexer");
const parser_1 = require("../parser/parser");
const interpreter_1 = require("../runtime/interpreter");
/**
 * Finds the project root directory by walking up from the given entry file.
 */
function findProjectRoot(entryPath) {
    const normEntry = path.resolve(entryPath);
    let currentDir = "";
    try {
        currentDir = fs.statSync(normEntry).isDirectory() ? normEntry : path.dirname(normEntry);
    }
    catch {
        currentDir = path.dirname(normEntry);
    }
    const root = path.parse(currentDir).root;
    // 1. Walk up looking for explicit project configuration or root markers (.git, package.json, project.config)
    let tempDir = currentDir;
    while (tempDir && tempDir !== root) {
        if (fs.existsSync(path.join(tempDir, "project.config"))) {
            return tempDir;
        }
        if ((fs.existsSync(path.join(tempDir, "client")) && fs.existsSync(path.join(tempDir, "server"))) ||
            (fs.existsSync(path.join(tempDir, "src")) && fs.existsSync(path.join(tempDir, "package.json"))) ||
            fs.existsSync(path.join(tempDir, ".git"))) {
            return tempDir;
        }
        const parent = path.dirname(tempDir);
        if (parent === tempDir)
            break;
        tempDir = parent;
    }
    // 2. Parent.Parent scope resolution
    const parent1 = path.dirname(currentDir);
    const parent2 = parent1 && parent1 !== root ? path.dirname(parent1) : parent1;
    if (parent1 && parent1 !== root) {
        const baseName = path.basename(currentDir).toLowerCase();
        if (["src", "client", "server", "services", "utils", "controllers", "lib", "views", "models", "classes"].includes(baseName)) {
            if (parent2 && parent2 !== root) {
                const parent2Base = path.basename(parent1).toLowerCase();
                if (["client", "server", "src"].includes(parent2Base)) {
                    return parent2;
                }
            }
            return parent1;
        }
    }
    return currentDir;
}
/**
 * Scans a directory recursively for all .llp and .cllp files.
 */
function findProjectScriptFiles(dir, ignoreDirs = ["node_modules", ".git", "dist", "dist_build", ".vscode", "tmp", "vscode-extension", "scratch", "docs", "install", "examples"]) {
    const results = [];
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                if (!entry.name.startsWith(".") && !ignoreDirs.includes(entry.name)) {
                    results.push(...findProjectScriptFiles(fullPath, ignoreDirs));
                }
            }
            else if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (ext === ".llp" || ext === ".cllp") {
                    results.push(fullPath);
                }
            }
        }
    }
    catch { }
    return results;
}
/**
 * Parses the declared visibility level of a script file.
 */
function parseFileVisibility(filePath) {
    try {
        const content = fs.readFileSync(filePath, "utf-8");
        const match = content.match(/\bvisibility\s*:\s*(All|Package|Parent|Private)\b/i);
        if (match) {
            const level = match[1].toLowerCase();
            if (level === "all")
                return "All";
            if (level === "package")
                return "Package";
            if (level === "parent")
                return "Parent";
            if (level === "private")
                return "Private";
        }
    }
    catch { }
    return "All";
}
/**
 * Determines whether a candidate script is visible and accessible from the target file.
 */
function isScriptVisible(candidatePath, targetFilePath, visLevel) {
    const normCandidate = path.resolve(candidatePath);
    const normTarget = path.resolve(targetFilePath);
    if (normCandidate === normTarget)
        return false;
    const level = visLevel || parseFileVisibility(normCandidate);
    if (level === "All")
        return true;
    if (level === "Private")
        return false;
    const candidateDir = path.dirname(normCandidate);
    const targetDir = path.dirname(normTarget);
    if (level === "Package") {
        return candidateDir === targetDir;
    }
    if (level === "Parent") {
        const relFromTargetToCandidate = path.relative(targetDir, candidateDir);
        const relFromCandidateToTarget = path.relative(candidateDir, targetDir);
        return !relFromTargetToCandidate.startsWith("..") || !relFromCandidateToTarget.startsWith("..");
    }
    return true;
}
/**
 * Discovers and loads all visible scripts in the project into the given environment
 * BEFORE the target entry file is executed.
 */
function loadProjectEnvironment(targetFilePath, existingEnv) {
    const env = existingEnv || (0, index_1.createGlobalEnvironment)();
    const normTarget = path.resolve(targetFilePath);
    const projectRoot = findProjectRoot(normTarget);
    const allScriptFiles = findProjectScriptFiles(projectRoot);
    const visibleFiles = allScriptFiles.filter(f => isScriptVisible(f, normTarget));
    const parsedPrograms = [];
    // Pass 1: Parse all visible scripts
    for (const file of visibleFiles) {
        try {
            const source = fs.readFileSync(file, "utf-8");
            const lexer = new lexer_1.Lexer(source);
            const tokens = lexer.tokenize();
            const parser = new parser_1.Parser(tokens, file);
            const ast = parser.produceAST();
            parsedPrograms.push({ file, ast });
        }
        catch (e) {
            // Ignore parse errors from template / unfinished scratch files
        }
    }
    // Pass 2: Hoist functions and classes across all visible scripts
    for (const { ast } of parsedPrograms) {
        for (const stmt of ast.body) {
            if (stmt.kind === "FunctionDeclaration" || stmt.kind === "ClassDeclaration" || stmt.kind === "NamespaceDeclaration") {
                try {
                    (0, interpreter_1.evaluate)(stmt, env);
                }
                catch { }
            }
        }
    }
    // Pass 3: Evaluate top-level variable and constant declarations
    for (const { ast } of parsedPrograms) {
        for (const stmt of ast.body) {
            if (stmt.kind === "VarDeclaration" || stmt.kind === "ModuleStatement") {
                try {
                    (0, interpreter_1.evaluate)(stmt, env);
                }
                catch { }
            }
        }
    }
    return { env, loadedFiles: visibleFiles };
}
