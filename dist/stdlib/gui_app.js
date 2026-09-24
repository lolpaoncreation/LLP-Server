"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGuiApp = registerGuiApp;
const instance_1 = require("../runtime/instance");
const values_1 = require("../runtime/values");
const app_runner_1 = require("../gui/app_runner");
let isAppLocked = false;
function parseWindowSize(val) {
    if (!val)
        return null;
    if (val.type === "pair") {
        const w = (val.left?.type === "number") ? val.left.value : parseInt(val.left?.value, 10);
        const h = (val.right?.type === "number") ? val.right.value : parseInt(val.right?.value, 10);
        if (!isNaN(w) && !isNaN(h))
            return { width: w, height: h };
    }
    if (val.type === "string" && typeof val.value === "string") {
        const parts = val.value.split(/[:xX,]/);
        if (parts.length >= 2) {
            const w = parseInt(parts[0].trim(), 10);
            const h = parseInt(parts[1].trim(), 10);
            if (!isNaN(w) && !isNaN(h))
                return { width: w, height: h };
        }
    }
    return null;
}
function registerGuiApp(env) {
    const appObj = new instance_1.Instance("AppService");
    appObj.Name = "App";
    // 1. App.Launch(WindowSize: 250 : 250, DevMode: True)
    const launchFn = {
        type: "native_fn",
        call: (args) => {
            let targetDir = process.cwd();
            let windowWidth = 1200;
            let windowHeight = 860;
            let devMode = false;
            for (let i = 0; i < args.length; i++) {
                const arg = args[i];
                if (arg?.type === "named_arg") {
                    const argName = (arg.name || "").toLowerCase();
                    if (argName === "windowsize" || argName === "size") {
                        const sz = parseWindowSize(arg.value);
                        if (sz) {
                            windowWidth = sz.width;
                            windowHeight = sz.height;
                        }
                    }
                    else if (argName === "devmode" || argName === "dev") {
                        devMode = arg.value?.type === "bool" ? arg.value.value : Boolean(arg.value?.value);
                    }
                }
                else if (arg?.type === "pair") {
                    const sz = parseWindowSize(arg);
                    if (sz) {
                        windowWidth = sz.width;
                        windowHeight = sz.height;
                    }
                }
                else if (arg?.type === "number" && args[i + 1]?.type === "number") {
                    windowWidth = arg.value;
                    windowHeight = args[i + 1].value;
                    i++;
                }
                else if (arg?.type === "string") {
                    targetDir = arg.value;
                }
                else if (arg?.type === "bool") {
                    devMode = arg.value;
                }
            }
            (0, app_runner_1.startGuiApplication)({
                projectDir: targetDir,
                openBrowser: true,
                windowWidth,
                windowHeight,
                locked: isAppLocked,
                devMode
            }).catch(err => {
                console.error("[LLP GUI Error] Impossible de démarrer l'application graphique :", err.message);
            });
            return (0, values_1.MK_BOOL)(true);
        }
    };
    // 2. App.Lock() : Empêche le resize et le plein écran
    const lockFn = {
        type: "native_fn",
        call: () => {
            isAppLocked = true;
            (0, app_runner_1.setAppLock)(true);
            console.log("[LLP App.Lock] ✓ Fenêtre verrouillée : taille fixe, redimensionnement à la souris et plein écran désactivés.");
            return (0, values_1.MK_BOOL)(true);
        }
    };
    // 3. App.Silence(RunBack: True) : Tourne en arrière-plan sans interface
    const silenceFn = {
        type: "native_fn",
        call: (args) => {
            let runBack = false;
            for (const arg of args) {
                if (arg?.type === "named_arg" && (arg.name || "").toLowerCase() === "runback") {
                    runBack = arg.value?.type === "bool" ? arg.value.value : Boolean(arg.value?.value);
                }
                else if (arg?.type === "bool") {
                    runBack = arg.value;
                }
            }
            console.log(`[LLP App.Silence] ✓ Application passée en arrière-plan sans interface (RunBack: ${runBack ? "True - Active" : "False - Inactive/Veille"}).`);
            (0, app_runner_1.startGuiApplication)({
                projectDir: process.cwd(),
                silence: true,
                runBack,
                openBrowser: false,
                locked: isAppLocked
            }).catch(err => {
                console.error("[LLP App.Silence Error] :", err.message);
            });
            return (0, values_1.MK_BOOL)(true);
        }
    };
    // 4. App.Close() : Force l'arrêt et la fermeture immédiate
    const closeFn = {
        type: "native_fn",
        call: () => {
            console.log("[LLP App.Close] ⚡ Arrêt forcé de l'application et libération des ressources.");
            (0, app_runner_1.stopGuiApplication)();
            setTimeout(() => {
                process.exit(0);
            }, 100);
            return (0, values_1.MK_BOOL)(true);
        }
    };
    appObj.SetProperty("Launch", launchFn);
    appObj.SetProperty("Run", launchFn);
    appObj.SetProperty("Open", launchFn);
    appObj.SetProperty("Lock", lockFn);
    appObj.SetProperty("Silence", silenceFn);
    appObj.SetProperty("Close", closeFn);
    env.declareVar("App", { type: "instance", instance: appObj }, "General");
    // Alias to Interface
    const ifaceObj = new instance_1.Instance("InterfaceService");
    ifaceObj.Name = "Interface";
    ifaceObj.SetProperty("Open", launchFn);
    ifaceObj.SetProperty("Launch", launchFn);
    ifaceObj.SetProperty("Lock", lockFn);
    ifaceObj.SetProperty("Silence", silenceFn);
    ifaceObj.SetProperty("Close", closeFn);
    env.declareVar("Interface", { type: "instance", instance: ifaceObj }, "General");
}
