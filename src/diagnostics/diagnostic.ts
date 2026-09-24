// ===================================================
// LLP Diagnostic System & Visual Error Formatter
// Formats compiler, syntax, static analysis and runtime errors
// with precise code line previews, visual pointers (^), 
// exact "WHAT IS MISSING" descriptions, and actionable fixes.
// ===================================================

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
export function levenshteinDistance(a: string, b: string): number {
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

/**
 * Finds the closest matching candidate for an unknown symbol.
 */
export function findClosestMatch(target: string, candidates: string[], maxDistance: number = 3): string | null {
  let closest: string | null = null;
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

/**
 * Generates an ASCII boxed diagnostic report for terminal display.
 */
export function formatDiagnosticReport(diagnostics: DiagnosticItem[], sourceCode: string, filePath: string): string {
  if (diagnostics.length === 0) return "";

  const lines = sourceCode.split(/\r?\n/);
  const out: string[] = [];

  const errorCount = diagnostics.filter(d => d.severity === "error").length;
  const warningCount = diagnostics.filter(d => d.severity === "warning").length;

  out.push("");
  out.push("================================================================================");
  out.push(`  LLP CODE ANALYZER & ERROR DIAGNOSTICS (${errorCount} erreur(s), ${warningCount} avertissement(s))`);
  out.push("================================================================================");

  for (let idx = 0; idx < diagnostics.length; idx++) {
    const diag = diagnostics[idx];
    const isError = diag.severity === "error";
    const badge = isError ? "[ERREUR SYNTAXE / STRUCTURE]" : "[AVERTISSEMENT LOGIQUE]";

    out.push("");
    out.push(`--------------------------------------------------------------------------------`);
    out.push(`${badge} #${idx + 1} : ${diag.title} [${diag.code}]`);
    out.push(`Emplacement : ${diag.file || filePath}:${diag.line}:${diag.column}`);
    out.push(`--------------------------------------------------------------------------------`);

    // Code preview (1 line before, target line with pointer, 1 line after)
    const lineIdx = diag.line - 1;
    const startLine = Math.max(0, lineIdx - 1);
    const endLine = Math.min(lines.length - 1, lineIdx + 1);

    for (let l = startLine; l <= endLine; l++) {
      const lineNumStr = String(l + 1).padStart(5, " ");
      const isTarget = l === lineIdx;
      const prefix = isTarget ? " > " : "   ";
      out.push(`${prefix}${lineNumStr} | ${lines[l]}`);

      if (isTarget) {
        // Draw visual pointer
        const pointerCol = Math.max(0, diag.column - 1);
        const indent = " ".repeat(pointerCol);
        const pointerLine = `         | ${indent}^--- Erreur ici`;
        out.push(pointerLine);
      }
    }

    out.push("");
    out.push(`EXPLICATION :`);
    out.push(`  ${diag.message}`);

    if (diag.missing) {
      out.push("");
      out.push(`CE QUI MANQUE :`);
      out.push(`  ${diag.missing}`);
    }

    out.push("");
    out.push(`COMMENT CORRIGER :`);
    const fixLines = diag.fix.split("\n");
    for (const f of fixLines) {
      out.push(`  ${f}`);
    }

    if (diag.hint) {
      out.push("");
      out.push(`ASTUCE :`);
      out.push(`  ${diag.hint}`);
    }
  }

  out.push("");
  out.push("================================================================================");
  out.push("Veuillez corriger les points indiqués ci-dessus pour que votre script s'exécute.");
  out.push("================================================================================");
  out.push("");

  return out.join("\n");
}
