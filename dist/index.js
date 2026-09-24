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
exports.cleanNonDllFilesFromLib = exports.enforceLibDirectoryProtection = exports.addLibraryToProject = exports.setFileReadOnly = exports.buildLlpDllBinary = exports.getProjectInfo = exports.createProjectStructure = exports.getUiBuilderHtml = exports.startUiBuilderServer = exports.startGuiApplication = exports.formatDiagnosticReport = exports.analyzeSource = void 0;
exports.createGlobalEnvironment = createGlobalEnvironment;
exports.executeLLP = executeLLP;
exports.runFile = runFile;
/// <reference types="node" />
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const process = __importStar(require("process"));
const lexer_1 = require("./lexer/lexer");
const parser_1 = require("./parser/parser");
const interpreter_1 = require("./runtime/interpreter");
const environment_1 = require("./runtime/environment");
const console_1 = require("./stdlib/console");
const file_1 = require("./stdlib/file");
const database_1 = require("./stdlib/database");
const system_1 = require("./stdlib/system");
const instance_std_1 = require("./stdlib/instance_std");
const math_1 = require("./stdlib/math");
const crypto_1 = require("./stdlib/crypto");
const cllpdb_1 = require("./stdlib/cllpdb");
const sync_1 = require("./stdlib/sync");
const network_1 = require("./stdlib/network");
const validator_1 = require("./stdlib/validator");
const scillp_1 = require("./stdlib/scillp");
const symllp_1 = require("./stdlib/symllp");
const probllp_1 = require("./stdlib/probllp");
const gui_app_1 = require("./stdlib/gui_app");
const session_1 = require("./stdlib/session");
const device_1 = require("./stdlib/device");
const osi_1 = require("./stdlib/osi");
const phone_1 = require("./stdlib/phone");
function createGlobalEnvironment() {
    const env = new environment_1.Environment();
    // Register Standard Library
    (0, console_1.registerConsole)(env);
    (0, file_1.registerFileSystem)(env);
    (0, database_1.registerDatabase)(env);
    (0, system_1.registerSystem)(env);
    (0, instance_std_1.registerInstanceSystem)(env);
    (0, math_1.registerMath)(env);
    (0, crypto_1.registerCrypto)(env);
    (0, cllpdb_1.registerCllpdb)(env);
    (0, sync_1.registerDatabaseSync)(env);
    (0, network_1.registerNetwork)(env);
    (0, validator_1.registerUIValidator)(env);
    (0, scillp_1.registerSciLlp)(env);
    (0, symllp_1.registerSymLlp)(env);
    (0, probllp_1.registerProbLlp)(env);
    (0, gui_app_1.registerGuiApp)(env);
    (0, session_1.registerSession)(env);
    (0, device_1.registerDevice)(env);
    (0, osi_1.registerOSI)(env);
    (0, phone_1.registerPhone)(env);
    return env;
}
const analyzer_1 = require("./diagnostics/analyzer");
const diagnostic_1 = require("./diagnostics/diagnostic");
var analyzer_2 = require("./diagnostics/analyzer");
Object.defineProperty(exports, "analyzeSource", { enumerable: true, get: function () { return analyzer_2.analyzeSource; } });
var diagnostic_2 = require("./diagnostics/diagnostic");
Object.defineProperty(exports, "formatDiagnosticReport", { enumerable: true, get: function () { return diagnostic_2.formatDiagnosticReport; } });
function executeLLP(code, globalEnv, filePath) {
    const env = globalEnv || createGlobalEnvironment();
    const lexer = new lexer_1.Lexer(code);
    const tokens = lexer.tokenize();
    const parser = new parser_1.Parser(tokens, filePath);
    const ast = parser.produceAST();
    return (0, interpreter_1.evaluate)(ast, env);
}
function runFile(filePath, options) {
    if (!fs.existsSync(filePath)) {
        console.error(`[LLP Error] Fichier '${filePath}' introuvable.`);
        process.exit(1);
    }
    const absPath = path.resolve(filePath);
    const scriptDir = path.dirname(absPath);
    const projectRoot = path.resolve(scriptDir, "..");
    if (fs.existsSync(path.join(projectRoot, "project.config")) || fs.existsSync(path.join(projectRoot, "data"))) {
        try {
            process.chdir(projectRoot);
        }
        catch (e) { }
    }
    else if (fs.existsSync(path.join(scriptDir, "data"))) {
        try {
            process.chdir(scriptDir);
        }
        catch (e) { }
    }
    const source = fs.readFileSync(absPath, "utf-8");
    // Pre-flight Static Code Analysis (checks all code before execution)
    if (!options?.skipCheck) {
        const diagnostics = (0, analyzer_1.analyzeSource)(source, filePath);
        const errors = diagnostics.filter(d => d.severity === "error");
        const warnings = diagnostics.filter(d => d.severity === "warning");
        if (errors.length > 0) {
            const report = (0, diagnostic_1.formatDiagnosticReport)(diagnostics, source, filePath);
            console.error(report);
            process.exit(1);
        }
        else if (warnings.length > 0) {
            const report = (0, diagnostic_1.formatDiagnosticReport)(warnings, source, filePath);
            console.warn(report);
        }
    }
    try {
        executeLLP(source, undefined, absPath);
    }
    catch (err) {
        console.error("\n================================================================================");
        console.error("🔴 [LLP RUNTIME / PARSER EXCEPTION]");
        console.error("================================================================================");
        console.error(`Fichier : ${filePath}`);
        console.error(`Détail  : ${err.message || err}`);
        console.error("================================================================================\n");
        process.exit(1);
    }
}
var app_runner_1 = require("./gui/app_runner");
Object.defineProperty(exports, "startGuiApplication", { enumerable: true, get: function () { return app_runner_1.startGuiApplication; } });
var ui_builder_1 = require("./gui/ui_builder");
Object.defineProperty(exports, "startUiBuilderServer", { enumerable: true, get: function () { return ui_builder_1.startUiBuilderServer; } });
Object.defineProperty(exports, "getUiBuilderHtml", { enumerable: true, get: function () { return ui_builder_1.getUiBuilderHtml; } });
var scaffold_1 = require("./project/scaffold");
Object.defineProperty(exports, "createProjectStructure", { enumerable: true, get: function () { return scaffold_1.createProjectStructure; } });
Object.defineProperty(exports, "getProjectInfo", { enumerable: true, get: function () { return scaffold_1.getProjectInfo; } });
Object.defineProperty(exports, "buildLlpDllBinary", { enumerable: true, get: function () { return scaffold_1.buildLlpDllBinary; } });
Object.defineProperty(exports, "setFileReadOnly", { enumerable: true, get: function () { return scaffold_1.setFileReadOnly; } });
Object.defineProperty(exports, "addLibraryToProject", { enumerable: true, get: function () { return scaffold_1.addLibraryToProject; } });
Object.defineProperty(exports, "enforceLibDirectoryProtection", { enumerable: true, get: function () { return scaffold_1.enforceLibDirectoryProtection; } });
Object.defineProperty(exports, "cleanNonDllFilesFromLib", { enumerable: true, get: function () { return scaffold_1.cleanNonDllFilesFromLib; } });
