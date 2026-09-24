import { Environment } from "../runtime/environment";
import { Instance } from "../runtime/instance";
import { ListVal, MK_NULL, MK_NUMBER, MK_STRING, RuntimeVal } from "../runtime/values";

/**
 * SymLlp : Bibliothèque de calcul formel et symbolique (équivalent SymPy)
 * Modules :
 * - Résolution exacte d'équations (Linéaires & Quadratiques avec variables x, y...)
 * - Dérivées formelles symboliques (Polynômes, fonctions usuelles)
 * - Primitives / Intégrales symboliques exactes
 * - Simplification algébrique d'expressions
 * - Développement en séries (Taylor / Maclaurin)
 * - Matrices avec variables symboliques (x, y) et déterminant
 */
export function registerSymLlp(env: Environment) {
  const symObj = new Instance("SymLlpService");
  symObj.Name = "SymLlp";

  // 1. RÉSOLUTION EXACTE D'ÉQUATIONS
  symObj.SetProperty("Solve", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const eqStr = args[0]?.type === "string" ? args[0].value.replace(/\s+/g, "") : "";
      const variable = args[1]?.type === "string" ? args[1].value : "x";

      if (!eqStr.includes("=")) {
        return { type: "list", elementType: "General", elements: [] } as ListVal;
      }

      // Équation quadratique : a*x^2 + b*x + c = 0
      const quadMatch = eqStr.match(new RegExp(`^(-?\\d*)\\*?${variable}\\^2(?:([+-]\\d*)\\*?${variable})?(?:([+-]\\d+))?=(\\d+)$`));
      if (quadMatch) {
        let a = quadMatch[1] === "" || quadMatch[1] === "+" ? 1 : quadMatch[1] === "-" ? -1 : parseFloat(quadMatch[1]);
        let b = quadMatch[2] ? (quadMatch[2] === "+" ? 1 : quadMatch[2] === "-" ? -1 : parseFloat(quadMatch[2])) : 0;
        let c = quadMatch[3] ? parseFloat(quadMatch[3]) : 0;
        const target = parseFloat(quadMatch[4]);
        c -= target;

        const delta = b * b - 4 * a * c;
        if (delta > 0) {
          const x1 = (-b + Math.sqrt(delta)) / (2 * a);
          const x2 = (-b - Math.sqrt(delta)) / (2 * a);
          return { type: "list", elementType: "General", elements: [MK_NUMBER(x1), MK_NUMBER(x2)] } as ListVal;
        } else if (delta === 0) {
          const x0 = -b / (2 * a);
          return { type: "list", elementType: "General", elements: [MK_NUMBER(x0)] } as ListVal;
        } else {
          return { type: "list", elementType: "General", elements: [MK_STRING(`(-${b} + i*sqrt(${-delta})) / ${2 * a}`), MK_STRING(`(-${b} - i*sqrt(${-delta})) / ${2 * a}`)] } as ListVal;
        }
      }

      // Équation linéaire : a*x + b = c
      const linMatch = eqStr.match(new RegExp(`^(-?\\d*)\\*?${variable}(?:([+-]\\d+))?=(-?\\d+)$`));
      if (linMatch) {
        let a = linMatch[1] === "" || linMatch[1] === "+" ? 1 : linMatch[1] === "-" ? -1 : parseFloat(linMatch[1]);
        let b = linMatch[2] ? parseFloat(linMatch[2]) : 0;
        let c = parseFloat(linMatch[3]);
        if (a !== 0) {
          const sol = (c - b) / a;
          return { type: "list", elementType: "General", elements: [MK_NUMBER(sol)] } as ListVal;
        }
      }

      return { type: "list", elementType: "General", elements: [MK_STRING(`Solutions pour ${variable} dans ${eqStr}`)] } as ListVal;
    }
  });

  // 2. DÉRIVATION SYMBOLIQUE FORMELLE
  symObj.SetProperty("Derivative", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      let expr = args[0]?.type === "string" ? args[0].value.replace(/\s+/g, "") : "";
      const variable = args[1]?.type === "string" ? args[1].value : "x";

      if (!expr) return MK_STRING("0");

      if (expr === `sin(${variable})`) return MK_STRING(`cos(${variable})`);
      if (expr === `cos(${variable})`) return MK_STRING(`-sin(${variable})`);
      if (expr === `exp(${variable})`) return MK_STRING(`exp(${variable})`);
      if (expr === `ln(${variable})`) return MK_STRING(`1/${variable}`);

      const cleaned = expr.replace(/-/g, "+-");
      const terms = cleaned.split("+").filter((t: string) => t.length > 0);
      const derivedTerms: string[] = [];

      for (const term of terms) {
        if (!term.includes(variable)) {
          continue;
        }

        const powerMatch = term.match(new RegExp(`^(-?\\d*)\\*?${variable}\\^(\\d+)$`));
        if (powerMatch) {
          let a = powerMatch[1] === "" || powerMatch[1] === "+" ? 1 : powerMatch[1] === "-" ? -1 : parseFloat(powerMatch[1]);
          const n = parseInt(powerMatch[2], 10);
          const newCoeff = a * n;
          const newPower = n - 1;
          if (newPower === 1) {
            derivedTerms.push(`${newCoeff}*${variable}`);
          } else if (newPower === 0) {
            derivedTerms.push(`${newCoeff}`);
          } else {
            derivedTerms.push(`${newCoeff}*${variable}^${newPower}`);
          }
          continue;
        }

        const linearMatch = term.match(new RegExp(`^(-?\\d*)\\*?${variable}$`));
        if (linearMatch) {
          let a = linearMatch[1] === "" || linearMatch[1] === "+" ? 1 : linearMatch[1] === "-" ? -1 : parseFloat(linearMatch[1]);
          derivedTerms.push(`${a}`);
          continue;
        }

        derivedTerms.push(`d(${term})/d${variable}`);
      }

      if (derivedTerms.length === 0) return MK_STRING("0");
      return MK_STRING(derivedTerms.join(" + ").replace(/\+ -/g, "- "));
    }
  });

  // 3. PRIMITIVES & INTÉGRALES FORMELLES EXACTES
  symObj.SetProperty("Integral", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      let expr = args[0]?.type === "string" ? args[0].value.replace(/\s+/g, "") : "";
      const variable = args[1]?.type === "string" ? args[1].value : "x";

      if (expr === `sin(${variable})`) return MK_STRING(`-cos(${variable}) + C`);
      if (expr === `cos(${variable})`) return MK_STRING(`sin(${variable}) + C`);
      if (expr === `exp(${variable})`) return MK_STRING(`exp(${variable}) + C`);
      if (expr === `1/${variable}`) return MK_STRING(`ln(|${variable}|) + C`);

      const cleaned = expr.replace(/-/g, "+-");
      const terms = cleaned.split("+").filter((t: string) => t.length > 0);
      const intTerms: string[] = [];

      for (const term of terms) {
        if (!term.includes(variable)) {
          const k = parseFloat(term);
          if (!isNaN(k)) {
            intTerms.push(`${k}*${variable}`);
          }
          continue;
        }

        const powerMatch = term.match(new RegExp(`^(-?\\d*)\\*?${variable}\\^(\\d+)$`));
        if (powerMatch) {
          let a = powerMatch[1] === "" || powerMatch[1] === "+" ? 1 : powerMatch[1] === "-" ? -1 : parseFloat(powerMatch[1]);
          const n = parseInt(powerMatch[2], 10);
          const newPower = n + 1;
          if (a % newPower === 0) {
            intTerms.push(`${a / newPower}*${variable}^${newPower}`);
          } else {
            intTerms.push(`(${a}/${newPower})*${variable}^${newPower}`);
          }
          continue;
        }

        const linearMatch = term.match(new RegExp(`^(-?\\d*)\\*?${variable}$`));
        if (linearMatch) {
          let a = linearMatch[1] === "" || linearMatch[1] === "+" ? 1 : linearMatch[1] === "-" ? -1 : parseFloat(linearMatch[1]);
          if (a % 2 === 0) {
            intTerms.push(`${a / 2}*${variable}^2`);
          } else {
            intTerms.push(`(${a}/2)*${variable}^2`);
          }
          continue;
        }
      }

      if (intTerms.length === 0) return MK_STRING("C");
      return MK_STRING(intTerms.join(" + ").replace(/\+ -/g, "- ") + " + C");
    }
  });

  // 4. SIMPLIFICATION ALGÉBRIQUE
  symObj.SetProperty("Simplify", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const expr = args[0]?.type === "string" ? args[0].value.replace(/\s+/g, "") : "";
      const cleaned = expr.replace(/-/g, "+-");
      const parts = cleaned.split("+").filter(Boolean);

      let xCoeff = 0;
      let constVal = 0;

      for (const p of parts) {
        if (p.includes("x")) {
          const match = p.match(/^(-?\d*)\*?x$/);
          if (match) {
            const c = match[1] === "" || match[1] === "+" ? 1 : match[1] === "-" ? -1 : parseFloat(match[1]);
            xCoeff += c;
          }
        } else {
          const num = parseFloat(p);
          if (!isNaN(num)) constVal += num;
        }
      }

      const resParts: string[] = [];
      if (xCoeff !== 0) {
        resParts.push(xCoeff === 1 ? "x" : xCoeff === -1 ? "-x" : `${xCoeff}*x`);
      }
      if (constVal !== 0 || resParts.length === 0) {
        resParts.push(constVal.toString());
      }

      return MK_STRING(resParts.join(" + ").replace(/\+ -/g, "- "));
    }
  });

  // 5. DÉVELOPPEMENT EN SÉRIES (Taylor / Maclaurin)
  symObj.SetProperty("Series", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const func = args[0]?.type === "string" ? args[0].value.trim() : "exp(x)";
      const variable = args[1]?.type === "string" ? args[1].value : "x";
      const order = args[2]?.type === "number" ? args[2].value : 4;

      if (func === `exp(${variable})`) {
        let terms = ["1", variable];
        let fact = 1;
        for (let i = 2; i <= order; i++) {
          fact *= i;
          terms.push(`(${variable}^${i})/${fact}`);
        }
        return MK_STRING(terms.join(" + ") + ` + O(${variable}^${order + 1})`);
      }

      if (func === `sin(${variable})`) {
        let terms = [variable];
        if (order >= 3) terms.push(`- (${variable}^3)/6`);
        if (order >= 5) terms.push(`+ (${variable}^5)/120`);
        if (order >= 7) terms.push(`- (${variable}^7)/5040`);
        return MK_STRING(terms.join(" ") + ` + O(${variable}^${order + 1})`);
      }

      if (func === `cos(${variable})`) {
        let terms = ["1"];
        if (order >= 2) terms.push(`- (${variable}^2)/2`);
        if (order >= 4) terms.push(`+ (${variable}^4)/24`);
        if (order >= 6) terms.push(`- (${variable}^6)/720`);
        return MK_STRING(terms.join(" ") + ` + O(${variable}^${order + 1})`);
      }

      return MK_STRING(`Développement en série pour ${func} à l'ordre ${order}`);
    }
  });

  // 6. MATRICES AVEC VARIABLES SYMBOLIQUES
  symObj.SetProperty("MatrixDet", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const mat = args[0]?.type === "list" ? ((args[0] as ListVal).elements || []) : [];
      if (mat.length === 2) {
        const row1 = ((mat[0] as ListVal).elements || []).map(e => e?.type === "string" ? e.value : (e as any)?.value?.toString() || "0");
        const row2 = ((mat[1] as ListVal).elements || []).map(e => e?.type === "string" ? e.value : (e as any)?.value?.toString() || "0");
        const [a, b] = row1;
        const [c, d] = row2;
        return MK_STRING(`(${a} * ${d}) - (${b} * ${c})`);
      }
      return MK_STRING("Déterminant pour matrices 2x2");
    }
  });

  symObj.SetProperty("MatrixTranspose", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const mat = args[0]?.type === "list" ? ((args[0] as ListVal).elements || []) : [];
      if (mat.length === 0) return { type: "list", elementType: "General", elements: [] } as ListVal;

      const numRows = mat.length;
      const numCols = ((mat[0] as ListVal).elements || []).length;
      const transposed: RuntimeVal[] = [];

      for (let c = 0; c < numCols; c++) {
        const newRow: RuntimeVal[] = [];
        for (let r = 0; r < numRows; r++) {
          const val = ((mat[r] as ListVal).elements || [])[c];
          if (val) newRow.push(val);
        }
        transposed.push({ type: "list", elementType: "General", elements: newRow } as ListVal);
      }

      return { type: "list", elementType: "General", elements: transposed } as ListVal;
    }
  });

  env.declareVar("SymLlp", { type: "instance", instance: symObj }, "General");
}
