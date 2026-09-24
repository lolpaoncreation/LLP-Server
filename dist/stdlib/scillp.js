"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSciLlp = registerSciLlp;
const environment_1 = require("../runtime/environment");
const instance_1 = require("../runtime/instance");
const values_1 = require("../runtime/values");
/**
 * SciLlp : Extension avancée pour le calcul scientifique et mathématique (équivalent SciPy)
 * Modules :
 * - Intégration numérique (Simpson / Trapèzes)
 * - Optimisation et recherche de zéros (Descente de gradient / Bissection)
 * - Interpolation (Linéaire / Lagrange)
 * - Traitement du signal (Moyenne mobile, Filtrage, Détection de pics)
 * - Statistiques poussées (Moyenne, Variance, Écart-type, Skewness, Kurtosis, Régression linéaire)
 */
function registerSciLlp(env) {
    const sciObj = new instance_1.Instance("SciLlpService");
    sciObj.Name = "SciLlp";
    // 1. INTÉGRATION NUMÉRIQUE (Méthode de Simpson 1/3 sur un intervalle [a, b])
    sciObj.SetProperty("Integrate", {
        type: "native_fn",
        call: (args) => {
            if (args[0]?.type === "list") {
                const yVals = (args[0].elements || []).map(e => e?.type === "number" ? e.value : 0);
                const dx = args[1]?.type === "number" ? args[1].value : 1.0;
                if (yVals.length < 2)
                    return (0, values_1.MK_NUMBER)(0);
                // Méthode des trapèzes sur tableau
                let sum = 0.5 * (yVals[0] + yVals[yVals.length - 1]);
                for (let i = 1; i < yVals.length - 1; i++) {
                    sum += yVals[i];
                }
                return (0, values_1.MK_NUMBER)(sum * dx);
            }
            if (args[0]?.type === "fn") {
                const fn = args[0];
                const a = args[1]?.type === "number" ? args[1].value : 0;
                const b = args[2]?.type === "number" ? args[2].value : 1;
                const n = Math.max(10, args[3]?.type === "number" ? Math.floor(args[3].value / 2) * 2 : 100);
                const h = (b - a) / n;
                const evalFn = (x) => {
                    const scope = new environment_1.Environment(fn.declarationEnv);
                    scope.declareVar(fn.parameters?.[0] || "x", (0, values_1.MK_NUMBER)(x));
                    let res = (0, values_1.MK_NUMBER)(0);
                    for (const stmt of fn.body || []) {
                        try {
                            res = (require("../runtime/interpreter").evaluate)(stmt, scope);
                        }
                        catch (e) {
                            if (e && e.value)
                                res = e.value;
                        }
                    }
                    return res.type === "number" ? res.value : 0;
                };
                let sum = evalFn(a) + evalFn(b);
                for (let i = 1; i < n; i++) {
                    const x = a + i * h;
                    sum += (i % 2 === 0 ? 2 : 4) * evalFn(x);
                }
                return (0, values_1.MK_NUMBER)((h / 3) * sum);
            }
            return (0, values_1.MK_NUMBER)(0);
        }
    });
    // 2. OPTIMISATION (Recherche du minimum local par descente de gradient)
    sciObj.SetProperty("Optimize", {
        type: "native_fn",
        call: (args) => {
            const fn = args[0];
            let x = args[1]?.type === "number" ? args[1].value : 0.0;
            const lr = args[2]?.type === "number" ? args[2].value : 0.01;
            const iters = args[3]?.type === "number" ? args[3].value : 200;
            const h = 1e-5;
            const evalFn = (val) => {
                if (!fn || fn.type !== "fn")
                    return 0;
                const scope = new environment_1.Environment(fn.declarationEnv);
                scope.declareVar(fn.parameters?.[0] || "x", (0, values_1.MK_NUMBER)(val));
                let res = (0, values_1.MK_NUMBER)(0);
                for (const stmt of fn.body || []) {
                    try {
                        res = (require("../runtime/interpreter").evaluate)(stmt, scope);
                    }
                    catch (e) {
                        if (e && e.value)
                            res = e.value;
                    }
                }
                return res.type === "number" ? res.value : 0;
            };
            for (let i = 0; i < iters; i++) {
                const grad = (evalFn(x + h) - evalFn(x - h)) / (2 * h);
                x = x - lr * grad;
            }
            return (0, values_1.MK_NUMBER)(x);
        }
    });
    // Recherche de racines (Bissection)
    sciObj.SetProperty("FindRoot", {
        type: "native_fn",
        call: (args) => {
            const fn = args[0];
            let a = args[1]?.type === "number" ? args[1].value : -10;
            let b = args[2]?.type === "number" ? args[2].value : 10;
            const tol = 1e-6;
            const evalFn = (val) => {
                if (!fn || fn.type !== "fn")
                    return 0;
                const scope = new environment_1.Environment(fn.declarationEnv);
                scope.declareVar(fn.parameters?.[0] || "x", (0, values_1.MK_NUMBER)(val));
                let res = (0, values_1.MK_NUMBER)(0);
                for (const stmt of fn.body || []) {
                    try {
                        res = (require("../runtime/interpreter").evaluate)(stmt, scope);
                    }
                    catch (e) {
                        if (e && e.value)
                            res = e.value;
                    }
                }
                return res.type === "number" ? res.value : 0;
            };
            let fa = evalFn(a);
            let fb = evalFn(b);
            if (fa * fb > 0) {
                return (0, values_1.MK_NULL)();
            }
            for (let i = 0; i < 100; i++) {
                const mid = (a + b) / 2;
                const fmid = evalFn(mid);
                if (Math.abs(fmid) < tol || (b - a) / 2 < tol) {
                    return (0, values_1.MK_NUMBER)(mid);
                }
                if (fa * fmid < 0) {
                    b = mid;
                    fb = fmid;
                }
                else {
                    a = mid;
                    fa = fmid;
                }
            }
            return (0, values_1.MK_NUMBER)((a + b) / 2);
        }
    });
    // 3. INTERPOLATION (Linéaire ou polynomiale de Lagrange)
    sciObj.SetProperty("Interpolate", {
        type: "native_fn",
        call: (args) => {
            const xList = args[0]?.type === "list" ? (args[0].elements || []).map(e => e?.type === "number" ? e.value : 0) : [];
            const yList = args[1]?.type === "list" ? (args[1].elements || []).map(e => e?.type === "number" ? e.value : 0) : [];
            const xVal = args[2]?.type === "number" ? args[2].value : 0;
            if (xList.length === 0 || xList.length !== yList.length)
                return (0, values_1.MK_NUMBER)(0);
            let result = 0;
            const n = xList.length;
            for (let i = 0; i < n; i++) {
                let term = yList[i];
                for (let j = 0; j < n; j++) {
                    if (j !== i) {
                        const denom = xList[i] - xList[j];
                        if (denom !== 0) {
                            term *= (xVal - xList[j]) / denom;
                        }
                    }
                }
                result += term;
            }
            return (0, values_1.MK_NUMBER)(result);
        }
    });
    // 4. TRAITEMENT DU SIGNAL
    sciObj.SetProperty("MovingAverage", {
        type: "native_fn",
        call: (args) => {
            const signal = args[0]?.type === "list" ? (args[0].elements || []).map(e => e?.type === "number" ? e.value : 0) : [];
            const windowSize = Math.max(1, args[1]?.type === "number" ? args[1].value : 3);
            const smoothed = [];
            for (let i = 0; i < signal.length; i++) {
                const start = Math.max(0, i - Math.floor(windowSize / 2));
                const end = Math.min(signal.length, i + Math.floor(windowSize / 2) + 1);
                let sum = 0;
                for (let j = start; j < end; j++)
                    sum += signal[j];
                smoothed.push((0, values_1.MK_NUMBER)(sum / (end - start)));
            }
            return {
                type: "list",
                elementType: "General",
                elements: smoothed
            };
        }
    });
    sciObj.SetProperty("SignalFilter", {
        type: "native_fn",
        call: (args) => {
            const signal = args[0]?.type === "list" ? (args[0].elements || []).map(e => e?.type === "number" ? e.value : 0) : [];
            const threshold = args[1]?.type === "number" ? args[1].value : 0;
            const filtered = [];
            for (const val of signal) {
                filtered.push((0, values_1.MK_NUMBER)(val >= threshold ? val : 0));
            }
            return {
                type: "list",
                elementType: "General",
                elements: filtered
            };
        }
    });
    sciObj.SetProperty("PeakDetect", {
        type: "native_fn",
        call: (args) => {
            const signal = args[0]?.type === "list" ? (args[0].elements || []).map(e => e?.type === "number" ? e.value : 0) : [];
            const peaks = [];
            for (let i = 1; i < signal.length - 1; i++) {
                if (signal[i] > signal[i - 1] && signal[i] > signal[i + 1]) {
                    peaks.push((0, values_1.MK_NUMBER)(i));
                }
            }
            return {
                type: "list",
                elementType: "General",
                elements: peaks
            };
        }
    });
    // 5. STATISTIQUES POUSSÉES
    sciObj.SetProperty("Mean", {
        type: "native_fn",
        call: (args) => {
            const list = args[0]?.type === "list" ? (args[0].elements || []).map(e => e?.type === "number" ? e.value : 0) : [];
            if (list.length === 0)
                return (0, values_1.MK_NUMBER)(0);
            const sum = list.reduce((a, b) => a + b, 0);
            return (0, values_1.MK_NUMBER)(sum / list.length);
        }
    });
    sciObj.SetProperty("Variance", {
        type: "native_fn",
        call: (args) => {
            const list = args[0]?.type === "list" ? (args[0].elements || []).map(e => e?.type === "number" ? e.value : 0) : [];
            if (list.length === 0)
                return (0, values_1.MK_NUMBER)(0);
            const mean = list.reduce((a, b) => a + b, 0) / list.length;
            const sumSq = list.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
            return (0, values_1.MK_NUMBER)(sumSq / list.length);
        }
    });
    sciObj.SetProperty("StdDev", {
        type: "native_fn",
        call: (args) => {
            const list = args[0]?.type === "list" ? (args[0].elements || []).map(e => e?.type === "number" ? e.value : 0) : [];
            if (list.length === 0)
                return (0, values_1.MK_NUMBER)(0);
            const mean = list.reduce((a, b) => a + b, 0) / list.length;
            const sumSq = list.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0);
            return (0, values_1.MK_NUMBER)(Math.sqrt(sumSq / list.length));
        }
    });
    sciObj.SetProperty("Skewness", {
        type: "native_fn",
        call: (args) => {
            const list = args[0]?.type === "list" ? (args[0].elements || []).map(e => e?.type === "number" ? e.value : 0) : [];
            if (list.length < 3)
                return (0, values_1.MK_NUMBER)(0);
            const n = list.length;
            const mean = list.reduce((a, b) => a + b, 0) / n;
            const std = Math.sqrt(list.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n);
            if (std === 0)
                return (0, values_1.MK_NUMBER)(0);
            const m3 = list.reduce((acc, v) => acc + Math.pow(v - mean, 3), 0) / n;
            return (0, values_1.MK_NUMBER)(m3 / Math.pow(std, 3));
        }
    });
    sciObj.SetProperty("Kurtosis", {
        type: "native_fn",
        call: (args) => {
            const list = args[0]?.type === "list" ? (args[0].elements || []).map(e => e?.type === "number" ? e.value : 0) : [];
            if (list.length < 4)
                return (0, values_1.MK_NUMBER)(0);
            const n = list.length;
            const mean = list.reduce((a, b) => a + b, 0) / n;
            const std = Math.sqrt(list.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / n);
            if (std === 0)
                return (0, values_1.MK_NUMBER)(0);
            const m4 = list.reduce((acc, v) => acc + Math.pow(v - mean, 4), 0) / n;
            return (0, values_1.MK_NUMBER)((m4 / Math.pow(std, 4)) - 3);
        }
    });
    sciObj.SetProperty("LinearRegression", {
        type: "native_fn",
        call: (args) => {
            const xList = args[0]?.type === "list" ? (args[0].elements || []).map(e => e?.type === "number" ? e.value : 0) : [];
            const yList = args[1]?.type === "list" ? (args[1].elements || []).map(e => e?.type === "number" ? e.value : 0) : [];
            const n = Math.min(xList.length, yList.length);
            if (n < 2)
                return { type: "list", elementType: "General", elements: [(0, values_1.MK_NUMBER)(0), (0, values_1.MK_NUMBER)(0), (0, values_1.MK_NUMBER)(0)] };
            let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
            for (let i = 0; i < n; i++) {
                sumX += xList[i];
                sumY += yList[i];
                sumXY += xList[i] * yList[i];
                sumXX += xList[i] * xList[i];
                sumYY += yList[i] * yList[i];
            }
            const denom = (n * sumXX - sumX * sumX);
            const slope = denom !== 0 ? (n * sumXY - sumX * sumY) / denom : 0;
            const intercept = (sumY - slope * sumX) / n;
            const numR = (n * sumXY - sumX * sumY);
            const denR = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
            const r2 = denR !== 0 ? Math.pow(numR / denR, 2) : 0;
            return {
                type: "list",
                elementType: "General",
                elements: [(0, values_1.MK_NUMBER)(slope), (0, values_1.MK_NUMBER)(intercept), (0, values_1.MK_NUMBER)(r2)]
            };
        }
    });
    env.declareVar("SciLlp", { type: "instance", instance: sciObj }, "General");
}
