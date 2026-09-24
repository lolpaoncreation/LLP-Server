import { Environment } from "./runtime/environment";
import { RuntimeVal } from "./runtime/values";
export declare function createGlobalEnvironment(): Environment;
export { analyzeSource } from "./diagnostics/analyzer";
export { formatDiagnosticReport, DiagnosticItem } from "./diagnostics/diagnostic";
export declare function executeLLP(code: string, globalEnv?: Environment, filePath?: string): RuntimeVal;
export declare function runFile(filePath: string, options?: {
    skipCheck?: boolean;
}): void;
export { startGuiApplication } from "./gui/app_runner";
export { startUiBuilderServer, getUiBuilderHtml } from "./gui/ui_builder";
export { createProjectStructure, getProjectInfo, ProjectArchitecture, CreateProjectOptions } from "./project/scaffold";
