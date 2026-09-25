import * as fs from "fs";
import * as path from "path";
import { Environment } from "../runtime/environment";
import { createGlobalEnvironment } from "../index";
import { Lexer } from "../lexer/lexer";
import { Parser } from "../parser/parser";
import { evaluate } from "../runtime/interpreter";
import { Program } from "../parser/ast";

export type VisibilityLevel = "All" | "Package" | "Parent" | "Private";

/**
 * Finds the project root directory by walking up from the given entry file.
 */
export function findProjectRoot(entryPath: string): string {
  const normEntry = path.resolve(entryPath);
  let currentDir = "";
  try {
    currentDir = fs.statSync(normEntry).isDirectory() ? normEntry : path.dirname(normEntry);
  } catch {
    currentDir = path.dirname(normEntry);
  }
  const root = path.parse(currentDir).root;

  // 1. Walk up looking for explicit project configuration or root markers (.git, package.json, project.config)
  let tempDir = currentDir;
  while (tempDir && tempDir !== root) {
    if (fs.existsSync(path.join(tempDir, "project.config"))) {
      return tempDir;
    }
    if (
      (fs.existsSync(path.join(tempDir, "client")) && fs.existsSync(path.join(tempDir, "server"))) ||
      (fs.existsSync(path.join(tempDir, "src")) && fs.existsSync(path.join(tempDir, "package.json"))) ||
      fs.existsSync(path.join(tempDir, ".git"))
    ) {
      return tempDir;
    }
    const parent = path.dirname(tempDir);
    if (parent === tempDir) break;
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
export function findProjectScriptFiles(
  dir: string,
  ignoreDirs: string[] = ["node_modules", ".git", "dist", "dist_build", ".vscode", "tmp", "vscode-extension", "scratch", "docs", "install", "examples"]
): string[] {
  const results: string[] = [];

  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith(".") && !ignoreDirs.includes(entry.name)) {
          results.push(...findProjectScriptFiles(fullPath, ignoreDirs));
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ext === ".llp" || ext === ".cllp") {
          results.push(fullPath);
        }
      }
    }
  } catch {}

  return results;
}

/**
 * Parses the declared visibility level of a script file.
 */
export function parseFileVisibility(filePath: string): VisibilityLevel {
  try {
    const content = fs.readFileSync(filePath, "utf-8");
    const match = content.match(/\bvisibility\s*:\s*(All|Package|Parent|Private)\b/i);
    if (match) {
      const level = match[1].toLowerCase();
      if (level === "all") return "All";
      if (level === "package") return "Package";
      if (level === "parent") return "Parent";
      if (level === "private") return "Private";
    }
  } catch {}
  return "All";
}

/**
 * Determines whether a candidate script is visible and accessible from the target file.
 */
export function isScriptVisible(
  candidatePath: string,
  targetFilePath: string,
  visLevel?: VisibilityLevel
): boolean {
  const normCandidate = path.resolve(candidatePath);
  const normTarget = path.resolve(targetFilePath);

  if (normCandidate === normTarget) return false;

  const level = visLevel || parseFileVisibility(normCandidate);
  if (level === "All") return true;
  if (level === "Private") return false;

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
export function loadProjectEnvironment(
  targetFilePath: string,
  existingEnv?: Environment
): { env: Environment; loadedFiles: string[] } {
  const env = existingEnv || createGlobalEnvironment();
  const normTarget = path.resolve(targetFilePath);
  const projectRoot = findProjectRoot(normTarget);
  const allScriptFiles = findProjectScriptFiles(projectRoot);

  const visibleFiles = allScriptFiles.filter(f => isScriptVisible(f, normTarget));
  const parsedPrograms: { file: string; ast: Program }[] = [];

  // Pass 1: Parse all visible scripts
  for (const file of visibleFiles) {
    try {
      const source = fs.readFileSync(file, "utf-8");
      const lexer = new Lexer(source);
      const tokens = lexer.tokenize();
      const parser = new Parser(tokens, file);
      const ast = parser.produceAST();
      parsedPrograms.push({ file, ast });
    } catch (e: any) {
      // Ignore parse errors from template / unfinished scratch files
    }
  }

  // Pass 2: Hoist functions and classes across all visible scripts
  for (const { ast } of parsedPrograms) {
    for (const stmt of ast.body) {
      if (stmt.kind === "FunctionDeclaration" || stmt.kind === "ClassDeclaration" || stmt.kind === "NamespaceDeclaration") {
        try {
          evaluate(stmt, env);
        } catch {}
      }
    }
  }

  // Pass 3: Evaluate top-level variable and constant declarations
  for (const { ast } of parsedPrograms) {
    for (const stmt of ast.body) {
      if (stmt.kind === "VarDeclaration" || stmt.kind === "ModuleStatement") {
        try {
          evaluate(stmt, env);
        } catch {}
      }
    }
  }

  return { env, loadedFiles: visibleFiles };
}
