import { Environment } from "../runtime/environment";
import { Instance } from "../runtime/instance";
import { ListVal, MK_NUMBER, RuntimeVal } from "../runtime/values";

/**
 * ProbLlp : Bibliothèque de probabilités, statistiques et combinatoire
 * Modules :
 * - Dénombrement et combinatoire (Factorielle, Permutations, Combinaisons)
 * - Distributions de probabilité (Normale, Binomiale, Poisson)
 * - Échantillonnage et variables aléatoires (Uniforme, Choix aléatoire, Tirage d'échantillons)
 */
export function registerProbLlp(env: Environment) {
  const probObj = new Instance("ProbLlpService");
  probObj.Name = "ProbLlp";

  // 1. COMBINATOIRE
  // Factorielle n!
  function factorial(n: number): number {
    if (n <= 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }

  probObj.SetProperty("Factorial", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const n = Math.max(0, Math.floor(args[0]?.type === "number" ? args[0].value : 0));
      return MK_NUMBER(factorial(n));
    }
  });

  // Permutations A(n, k) = n! / (n - k)!
  probObj.SetProperty("Permutations", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const n = Math.max(0, Math.floor(args[0]?.type === "number" ? args[0].value : 0));
      const k = Math.max(0, Math.floor(args[1]?.type === "number" ? args[1].value : 0));
      if (k > n) return MK_NUMBER(0);
      let res = 1;
      for (let i = n; i > n - k; i--) res *= i;
      return MK_NUMBER(res);
    }
  });

  // Combinaisons C(n, k) = n! / (k! * (n - k)!)
  probObj.SetProperty("Combinations", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const n = Math.max(0, Math.floor(args[0]?.type === "number" ? args[0].value : 0));
      const k = Math.max(0, Math.floor(args[1]?.type === "number" ? args[1].value : 0));
      if (k > n) return MK_NUMBER(0);
      const effK = Math.min(k, n - k);
      let num = 1;
      let den = 1;
      for (let i = 1; i <= effK; i++) {
        num *= (n - i + 1);
        den *= i;
      }
      return MK_NUMBER(num / den);
    }
  });

  // 2. DISTRIBUTIONS DE PROBABILITÉ
  // Densité normale (PDF) : f(x) = (1 / (sigma * sqrt(2*pi))) * exp(-0.5 * ((x - mu)/sigma)^2)
  probObj.SetProperty("NormalPDF", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const x = args[0]?.type === "number" ? args[0].value : 0;
      const mu = args[1]?.type === "number" ? args[1].value : 0;
      const sigma = Math.max(1e-9, args[2]?.type === "number" ? args[2].value : 1);
      const coeff = 1 / (sigma * Math.sqrt(2 * Math.PI));
      const exponent = -0.5 * Math.pow((x - mu) / sigma, 2);
      return MK_NUMBER(coeff * Math.exp(exponent));
    }
  });

  // Fonction de répartition normale (CDF) via approximation par fonction d'erreur
  probObj.SetProperty("NormalCDF", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const x = args[0]?.type === "number" ? args[0].value : 0;
      const mu = args[1]?.type === "number" ? args[1].value : 0;
      const sigma = Math.max(1e-9, args[2]?.type === "number" ? args[2].value : 1);
      const z = (x - mu) / (sigma * Math.SQRT2);

      // Approximation erf(z)
      const t = 1 / (1 + 0.3275911 * Math.abs(z));
      const poly = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
      const sign = z >= 0 ? 1 : -1;
      const erf = sign * poly;

      return MK_NUMBER(0.5 * (1 + erf));
    }
  });

  // Loi binomiale P(X = k) = C(n, k) * p^k * (1 - p)^(n - k)
  probObj.SetProperty("Binomial", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const k = Math.max(0, Math.floor(args[0]?.type === "number" ? args[0].value : 0));
      const n = Math.max(0, Math.floor(args[1]?.type === "number" ? args[1].value : 0));
      const p = args[2]?.type === "number" ? Math.max(0, Math.min(1, args[2].value)) : 0.5;

      if (k > n) return MK_NUMBER(0);
      let comb = 1;
      const effK = Math.min(k, n - k);
      for (let i = 1; i <= effK; i++) {
        comb = (comb * (n - i + 1)) / i;
      }

      const prob = comb * Math.pow(p, k) * Math.pow(1 - p, n - k);
      return MK_NUMBER(prob);
    }
  });

  // Loi de Poisson P(X = k) = (lambda^k * exp(-lambda)) / k!
  probObj.SetProperty("Poisson", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const k = Math.max(0, Math.floor(args[0]?.type === "number" ? args[0].value : 0));
      const lambda = Math.max(0, args[1]?.type === "number" ? args[1].value : 1);
      const prob = (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
      return MK_NUMBER(prob);
    }
  });

  // 3. ÉCHANTILLONNAGE ALÉATOIRE
  probObj.SetProperty("Uniform", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const min = args[0]?.type === "number" ? args[0].value : 0;
      const max = args[1]?.type === "number" ? args[1].value : 1;
      return MK_NUMBER(min + Math.random() * (max - min));
    }
  });

  probObj.SetProperty("Choice", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const list = args[0]?.type === "list" ? (args[0] as ListVal).elements : [];
      if (list.length === 0) return MK_NUMBER(0);
      const idx = Math.floor(Math.random() * list.length);
      return list[idx];
    }
  });

  probObj.SetProperty("Sample", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const list = args[0]?.type === "list" ? [...(args[0] as ListVal).elements] : [];
      const k = Math.min(list.length, Math.max(0, Math.floor(args[1]?.type === "number" ? args[1].value : 1)));
      const result: RuntimeVal[] = [];

      for (let i = 0; i < k; i++) {
        const randIdx = Math.floor(Math.random() * list.length);
        result.push(list.splice(randIdx, 1)[0]);
      }

      return {
        type: "list",
        elementType: "General",
        elements: result
      } as ListVal;
    }
  });

  env.declareVar("ProbLlp", { type: "instance", instance: probObj }, "General");
}
