/// <reference types="node" />
import * as fs from "fs";
import * as path from "path";
import * as process from "process";
import { Lexer } from "./lexer/lexer";
import { Parser } from "./parser/parser";
import { evaluate } from "./runtime/interpreter";
import { Environment } from "./runtime/environment";
import { registerConsole } from "./stdlib/console";
import { registerFileSystem } from "./stdlib/file";
import { registerDatabase } from "./stdlib/database";
import { registerSystem } from "./stdlib/system";
import { registerInstanceSystem } from "./stdlib/instance_std";
import { registerMath } from "./stdlib/math";
import { registerCrypto } from "./stdlib/crypto";
import { registerCllpdb } from "./stdlib/cllpdb";
import { registerDatabaseSync } from "./stdlib/sync";
import { registerNetwork } from "./stdlib/network";
import { registerUIValidator } from "./stdlib/validator";
import { registerSciLlp } from "./stdlib/scillp";
import { registerSymLlp } from "./stdlib/symllp";
import { registerProbLlp } from "./stdlib/probllp";
import { registerGuiApp } from "./stdlib/gui_app";
import { registerSession } from "./stdlib/session";
import { registerDevice } from "./stdlib/device";
import { registerOSI } from "./stdlib/osi";
import { registerPhone } from "./stdlib/phone";
import { registerJson } from "./stdlib/json_std";
import { registerHexa } from "./stdlib/hexa_std";
import { registerTask } from "./stdlib/task";
import { registerBreakpoint } from "./stdlib/breakpoint_std";
import { registerUI, UIElementManager } from "./stdlib/ui_element";
import { RuntimeVal } from "./runtime/values";

export function createGlobalEnvironment(): Environment {
  const env = new Environment();

  // Register Standard Library
  registerConsole(env);
  registerFileSystem(env);
  registerDatabase(env);
  registerSystem(env);
  registerInstanceSystem(env);
  registerMath(env);
  registerCrypto(env);
  registerCllpdb(env);
  registerDatabaseSync(env);
  registerNetwork(env);
  registerUIValidator(env);
  registerSciLlp(env);
  registerSymLlp(env);
  registerProbLlp(env);
  registerGuiApp(env);
  registerUI(env);
  registerSession(env);
  registerDevice(env);
  registerOSI(env);
  registerPhone(env);
  registerJson(env);
  registerHexa(env);
  registerTask(env);
  registerBreakpoint(env);

  return env;
}

import { analyzeSource } from "./diagnostics/analyzer";
import { formatDiagnosticReport, DiagnosticItem } from "./diagnostics/diagnostic";

export { analyzeSource } from "./diagnostics/analyzer";
export { formatDiagnosticReport, DiagnosticItem } from "./diagnostics/diagnostic";

export function executeLLP(code: string, globalEnv?: Environment, filePath?: string): RuntimeVal {
  let env = globalEnv;
  if (!env) {
    if (filePath && fs.existsSync(filePath)) {
      try {
        const { loadProjectEnvironment } = require("./project/visibility");
        env = loadProjectEnvironment(filePath).env;
      } catch {
        env = createGlobalEnvironment();
      }
    } else {
      env = createGlobalEnvironment();
    }
  }
  const lexer = new Lexer(code);
  const tokens = lexer.tokenize();
  const parser = new Parser(tokens, filePath);
  const ast = parser.produceAST();
  const targetEnv = env || createGlobalEnvironment();
  return evaluate(ast, targetEnv);
}

export function runFile(filePath: string, options?: { skipCheck?: boolean }) {
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
    } catch (e) {}
  } else if (fs.existsSync(path.join(scriptDir, "data"))) {
    try {
      process.chdir(scriptDir);
    } catch (e) {}
  }

  const source = fs.readFileSync(absPath, "utf-8");

  // Pre-flight Static Code Analysis (checks all code before execution)
  if (!options?.skipCheck) {
    const diagnostics = analyzeSource(source, filePath);
    const errors = diagnostics.filter(d => d.severity === "error");
    const warnings = diagnostics.filter(d => d.severity === "warning");

    if (errors.length > 0) {
      const report = formatDiagnosticReport(diagnostics, source, filePath);
      console.error(report);
      process.exit(1);
    } else if (warnings.length > 0) {
      const report = formatDiagnosticReport(warnings, source, filePath);
      console.warn(report);
    }
  }

  try {
    const { loadProjectEnvironment } = require("./project/visibility");
    const { env } = loadProjectEnvironment(absPath);
    executeLLP(source, env, absPath);
  } catch (err: any) {
    console.error("\n================================================================================");
    console.error("🔴 [LLP RUNTIME / PARSER EXCEPTION]");
    console.error("================================================================================");
    console.error(`Fichier : ${filePath}`);
    console.error(`Détail  : ${err.message || err}`);
    console.error("================================================================================\n");
    process.exit(1);
  }
}

export { startGuiApplication } from "./gui/app_runner";
export { startUiBuilderServer, getUiBuilderHtml } from "./gui/ui_builder";
export {
  createProjectStructure,
  getProjectInfo,
  ProjectArchitecture,
  CreateProjectOptions,
  buildLlpDllBinary,
  setFileReadOnly,
  addLibraryToProject,
  enforceLibDirectoryProtection,
  cleanNonDllFilesFromLib
} from "./project/scaffold";
export {
  loadProjectEnvironment,
  isScriptVisible,
  parseFileVisibility,
  findProjectRoot,
  findProjectScriptFiles
} from "./project/visibility";
export { registerUI, UIElementManager } from "./stdlib/ui_element";
