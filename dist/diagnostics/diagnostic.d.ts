export type DiagnosticSeverity = "error" | "warning" | "info";
export interface DiagnosticItem {
    file: string;
    line: number;
    column: number;
    endLine?: number;
    endColumn?: number;
    severity: DiagnosticSeverity;
    code: string;
    title: string;
    message: string;
    missing?: string;
    fix: string;
    snippet?: string;
    hint?: string;
}
/**
 * Calculates Levenshtein distance between two strings to provide typo suggestions.
 */
export declare function levenshteinDistance(a: string, b: string): number;
/**
 * Finds the closest matching candidate for an unknown symbol.
 */
export declare function findClosestMatch(target: string, candidates: string[], maxDistance?: number): string | null;
/**
 * Generates an ASCII boxed diagnostic report for terminal display.
 */
export declare function formatDiagnosticReport(diagnostics: DiagnosticItem[], sourceCode: string, filePath: string): string;
