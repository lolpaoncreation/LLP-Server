import { Environment } from "../runtime/environment";
export type VisibilityLevel = "All" | "Package" | "Parent" | "Private";
/**
 * Finds the project root directory by walking up from the given entry file.
 */
export declare function findProjectRoot(entryPath: string): string;
/**
 * Scans a directory recursively for all .llp and .cllp files.
 */
export declare function findProjectScriptFiles(dir: string, ignoreDirs?: string[]): string[];
/**
 * Parses the declared visibility level of a script file.
 */
export declare function parseFileVisibility(filePath: string): VisibilityLevel;
/**
 * Determines whether a candidate script is visible and accessible from the target file.
 */
export declare function isScriptVisible(candidatePath: string, targetFilePath: string, visLevel?: VisibilityLevel): boolean;
/**
 * Discovers and loads all visible scripts in the project into the given environment
 * BEFORE the target entry file is executed.
 */
export declare function loadProjectEnvironment(targetFilePath: string, existingEnv?: Environment): {
    env: Environment;
    loadedFiles: string[];
};
