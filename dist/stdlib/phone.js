"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPhone = registerPhone;
const cp = __importStar(require("child_process"));
const instance_1 = require("../runtime/instance");
const values_1 = require("../runtime/values");
const interpreter_1 = require("../runtime/interpreter");
// ============================================================================
// LLP OFFICIAL PHONE & MOBILE HARDWARE SUBSYSTEM (IOS & ANDROID)
// ============================================================================
// Provides full mobile device and OS capability management:
// 1. Telephony: Incoming calls, Answer, Hangup, Dial, Call States (RINGING, OFFHOOK, IDLE)
// 2. Audio & Microphone: In/Out routes (Speaker, Earpiece, Bluetooth), Recording, Audio Chunks
// 3. Camera & Sensors: Photo capture, Camera streams, Flashlight, Battery, GPS, Vibration
// 4. Process I/O Streams: ProcessIO to monitor & inject stdin/stdout/stderr across mobile/PC
// 5. Unified ListenerEvent architecture (On, Off, Emit) for reactive event-driven code
// ============================================================================
// Helper to convert JS values to RuntimeVal
function toRuntimeVal(val) {
    if (val === null || val === undefined)
        return (0, values_1.MK_NULL)();
    if (typeof val === "number")
        return (0, values_1.MK_NUMBER)(val);
    if (typeof val === "string")
        return (0, values_1.MK_STRING)(val);
    if (typeof val === "boolean")
        return (0, values_1.MK_BOOL)(val);
    if (Array.isArray(val)) {
        const listVal = {
            type: "list",
            elementType: "General",
            elements: val.map(toRuntimeVal)
        };
        listVal.Add = (item) => { listVal.elements.push(item); };
        listVal.Length = () => listVal.elements.length;
        return listVal;
    }
    if (typeof val === "object") {
        const inst = new instance_1.Instance("Object");
        for (const [k, v] of Object.entries(val)) {
            inst.SetProperty(k, toRuntimeVal(v));
        }
        return { type: "instance", instance: inst };
    }
    return (0, values_1.MK_STRING)(String(val));
}
const activeTrackedProcesses = new Map();
let nextProcessId = 1000;
function registerPhone(env) {
    // Event listener registries for Phone events
    const eventListeners = new Map();
    function triggerPhoneEvent(eventName, eventData) {
        const listeners = eventListeners.get(eventName) || [];
        const runtimeArg = toRuntimeVal(eventData);
        for (const listener of listeners) {
            try {
                (0, interpreter_1.callLLPFunction)(listener, [runtimeArg], env);
            }
            catch (err) {
                console.error(`[LLP Phone Event Error] Erreur lors de l'exécution de l'événement '${eventName}' :`, err.message);
            }
        }
    }
    // --------------------------------------------------------------------------
    // 1. PHONE HARDWARE & TELEPHONY CONTROLLER
    // --------------------------------------------------------------------------
    const phoneObj = new instance_1.Instance("PhoneService");
    phoneObj.Name = "Phone";
    let currentCallState = "IDLE"; // "IDLE" | "RINGING" | "OFFHOOK"
    let currentCallerInfo = null;
    let isRecordingAudio = false;
    let activeAudioRoute = "speaker"; // "speaker" | "earpiece" | "bluetooth" | "headset"
    let flashlightEnabled = false;
    let audioVolume = 85;
    // Universal Event Registration: Phone.On(eventName, handler)
    phoneObj.SetProperty("On", {
        type: "native_fn",
        call: (args) => {
            const evName = String(args[0]?.value || "");
            const handler = args[1];
            if (evName && handler) {
                if (!eventListeners.has(evName)) {
                    eventListeners.set(evName, []);
                }
                eventListeners.get(evName).push(handler);
                return (0, values_1.MK_BOOL)(true);
            }
            return (0, values_1.MK_BOOL)(false);
        }
    });
    // Phone.Off(eventName)
    phoneObj.SetProperty("Off", {
        type: "native_fn",
        call: (args) => {
            const evName = String(args[0]?.value || "");
            if (eventListeners.has(evName)) {
                eventListeners.delete(evName);
                return (0, values_1.MK_BOOL)(true);
            }
            return (0, values_1.MK_BOOL)(false);
        }
    });
    // Phone.Emit(eventName, data)
    phoneObj.SetProperty("Emit", {
        type: "native_fn",
        call: (args) => {
            const evName = String(args[0]?.value || "");
            const data = args[1] ? args[1].value || args[1] : {};
            triggerPhoneEvent(evName, data);
            return (0, values_1.MK_BOOL)(true);
        }
    });
    // --- TELEPHONY & CALL EVENTS ---
    // Phone.OnIncomingCall(handler)
    phoneObj.SetProperty("OnIncomingCall", {
        type: "native_fn",
        call: (args) => {
            const handler = args[0];
            if (handler) {
                if (!eventListeners.has("incoming_call"))
                    eventListeners.set("incoming_call", []);
                eventListeners.get("incoming_call").push(handler);
                return (0, values_1.MK_BOOL)(true);
            }
            return (0, values_1.MK_BOOL)(false);
        }
    });
    // Phone.OnCallAnswered(handler)
    phoneObj.SetProperty("OnCallAnswered", {
        type: "native_fn",
        call: (args) => {
            const handler = args[0];
            if (handler) {
                if (!eventListeners.has("call_answered"))
                    eventListeners.set("call_answered", []);
                eventListeners.get("call_answered").push(handler);
                return (0, values_1.MK_BOOL)(true);
            }
            return (0, values_1.MK_BOOL)(false);
        }
    });
    // Phone.OnCallEnded(handler)
    phoneObj.SetProperty("OnCallEnded", {
        type: "native_fn",
        call: (args) => {
            const handler = args[0];
            if (handler) {
                if (!eventListeners.has("call_ended"))
                    eventListeners.set("call_ended", []);
                eventListeners.get("call_ended").push(handler);
                return (0, values_1.MK_BOOL)(true);
            }
            return (0, values_1.MK_BOOL)(false);
        }
    });
    // Phone.OnCallStateChanged(handler)
    phoneObj.SetProperty("OnCallStateChanged", {
        type: "native_fn",
        call: (args) => {
            const handler = args[0];
            if (handler) {
                if (!eventListeners.has("call_state_changed"))
                    eventListeners.set("call_state_changed", []);
                eventListeners.get("call_state_changed").push(handler);
                return (0, values_1.MK_BOOL)(true);
            }
            return (0, values_1.MK_BOOL)(false);
        }
    });
    // Phone.Dial(phoneNumber)
    phoneObj.SetProperty("Dial", {
        type: "native_fn",
        call: (args) => {
            const number = String(args[0]?.value || "");
            currentCallState = "OFFHOOK";
            currentCallerInfo = { phoneNumber: number, contactName: "Appel Sortant", direction: "OUTGOING", timestamp: Date.now() };
            triggerPhoneEvent("call_state_changed", { state: currentCallState, number });
            return (0, values_1.MK_BOOL)(true);
        }
    });
    // Phone.Answer() - Pick up call
    phoneObj.SetProperty("Answer", {
        type: "native_fn",
        call: () => {
            if (currentCallState === "RINGING") {
                currentCallState = "OFFHOOK";
                triggerPhoneEvent("call_answered", currentCallerInfo || { state: "OFFHOOK" });
                triggerPhoneEvent("call_state_changed", { state: "OFFHOOK" });
                return (0, values_1.MK_BOOL)(true);
            }
            return (0, values_1.MK_BOOL)(false);
        }
    });
    // Phone.Hangup() - Terminate or reject call
    phoneObj.SetProperty("Hangup", {
        type: "native_fn",
        call: () => {
            const prevInfo = currentCallerInfo;
            currentCallState = "IDLE";
            currentCallerInfo = null;
            triggerPhoneEvent("call_ended", prevInfo || { state: "IDLE" });
            triggerPhoneEvent("call_state_changed", { state: "IDLE" });
            return (0, values_1.MK_BOOL)(true);
        }
    });
    // Phone.GetCallState()
    phoneObj.SetProperty("GetCallState", {
        type: "native_fn",
        call: () => (0, values_1.MK_STRING)(currentCallState)
    });
    // Phone.SimulateIncomingCall(phoneNumber, callerName) - Simulation for testing
    phoneObj.SetProperty("SimulateIncomingCall", {
        type: "native_fn",
        call: (args) => {
            const num = String(args[0]?.value || "+33612345678");
            const name = String(args[1]?.value || "Contact Mobile");
            currentCallState = "RINGING";
            currentCallerInfo = { phoneNumber: num, contactName: name, direction: "INCOMING", timestamp: Date.now() };
            triggerPhoneEvent("incoming_call", currentCallerInfo);
            triggerPhoneEvent("call_state_changed", { state: "RINGING", number: num, name });
            return (0, values_1.MK_BOOL)(true);
        }
    });
    // --- AUDIO & MICROPHONE CHANNELS ---
    // Phone.GetAudioInputs()
    phoneObj.SetProperty("GetAudioInputs", {
        type: "native_fn",
        call: () => toRuntimeVal([
            "Microphone Intégré (Mobile Principal)",
            "Microphone Secondaire (Réduction de bruit)",
            "Casque Audio Filaire (Jack/USB-C)",
            "Bluetooth Hands-Free Profile (HFP)"
        ])
    });
    // Phone.GetAudioOutputs()
    phoneObj.SetProperty("GetAudioOutputs", {
        type: "native_fn",
        call: () => toRuntimeVal([
            "Haut-parleur (Speakerphone)",
            "Écouteur interne (Earpiece)",
            "Bluetooth Audio (A2DP)",
            "Casque Filaire"
        ])
    });
    // Phone.SetAudioRoute(target: "speaker" | "earpiece" | "bluetooth" | "headset")
    phoneObj.SetProperty("SetAudioRoute", {
        type: "native_fn",
        call: (args) => {
            const target = String(args[0]?.value || "speaker").toLowerCase();
            activeAudioRoute = target;
            triggerPhoneEvent("audio_route_changed", { route: activeAudioRoute });
            return (0, values_1.MK_BOOL)(true);
        }
    });
    // Phone.GetAudioRoute()
    phoneObj.SetProperty("GetAudioRoute", {
        type: "native_fn",
        call: () => (0, values_1.MK_STRING)(activeAudioRoute)
    });
    // Phone.StartRecording(outputFileName?)
    phoneObj.SetProperty("StartRecording", {
        type: "native_fn",
        call: (args) => {
            const outName = String(args[0]?.value || "recording_" + Date.now() + ".wav");
            isRecordingAudio = true;
            triggerPhoneEvent("recording_started", { file: outName, route: activeAudioRoute });
            return (0, values_1.MK_STRING)(outName);
        }
    });
    // Phone.StopRecording()
    phoneObj.SetProperty("StopRecording", {
        type: "native_fn",
        call: () => {
            if (isRecordingAudio) {
                isRecordingAudio = false;
                triggerPhoneEvent("recording_stopped", { success: true });
                return (0, values_1.MK_BOOL)(true);
            }
            return (0, values_1.MK_BOOL)(false);
        }
    });
    // Phone.IsRecording()
    phoneObj.SetProperty("IsRecording", {
        type: "native_fn",
        call: () => (0, values_1.MK_BOOL)(isRecordingAudio)
    });
    // Phone.SetVolume(level: 0..100)
    phoneObj.SetProperty("SetVolume", {
        type: "native_fn",
        call: (args) => {
            audioVolume = Math.max(0, Math.min(100, args[0]?.value || 50));
            triggerPhoneEvent("volume_changed", { volume: audioVolume });
            return (0, values_1.MK_NUMBER)(audioVolume);
        }
    });
    // Phone.GetVolume()
    phoneObj.SetProperty("GetVolume", {
        type: "native_fn",
        call: () => (0, values_1.MK_NUMBER)(audioVolume)
    });
    // Phone.PlayAudio(filePath)
    phoneObj.SetProperty("PlayAudio", {
        type: "native_fn",
        call: (args) => {
            const filePath = String(args[0]?.value || "");
            triggerPhoneEvent("audio_playback_started", { file: filePath, route: activeAudioRoute });
            return (0, values_1.MK_BOOL)(true);
        }
    });
    // --- CAMERA & SENSORS ---
    // Phone.GetCameras()
    phoneObj.SetProperty("GetCameras", {
        type: "native_fn",
        call: () => toRuntimeVal([
            "Caméra Arrière Principale (Wide 48MP)",
            "Caméra Ultra-Grand Angle (12MP)",
            "Caméra Téléobjectif (3x Optique)",
            "Caméra Frontale Selfie (TrueDepth 12MP)"
        ])
    });
    // Phone.CapturePhoto(cameraIndexOrName?)
    phoneObj.SetProperty("CapturePhoto", {
        type: "native_fn",
        call: (args) => {
            const targetCam = String(args[0]?.value || "back");
            const photoPath = "photo_" + Date.now() + ".jpg";
            triggerPhoneEvent("photo_captured", { file: photoPath, camera: targetCam, resolution: "4000x3000" });
            return (0, values_1.MK_STRING)(photoPath);
        }
    });
    // Phone.SetFlashlight(active: bool)
    phoneObj.SetProperty("SetFlashlight", {
        type: "native_fn",
        call: (args) => {
            flashlightEnabled = args[0]?.value === true || args[0]?.value === 1;
            triggerPhoneEvent("flashlight_changed", { active: flashlightEnabled });
            return (0, values_1.MK_BOOL)(flashlightEnabled);
        }
    });
    // Phone.Vibrate(patternMs?)
    phoneObj.SetProperty("Vibrate", {
        type: "native_fn",
        call: (args) => {
            const duration = args[0]?.value || 250;
            triggerPhoneEvent("vibration_triggered", { durationMs: duration });
            return (0, values_1.MK_BOOL)(true);
        }
    });
    // Phone.GetBattery() -> { level: 85, isCharging: true }
    phoneObj.SetProperty("GetBattery", {
        type: "native_fn",
        call: () => toRuntimeVal({
            level: 92,
            isCharging: false,
            health: "Bon",
            temperatureCelsius: 29.5
        })
    });
    // Phone.GetGPS() -> { latitude, longitude, altitude, accuracy }
    phoneObj.SetProperty("GetGPS", {
        type: "native_fn",
        call: () => toRuntimeVal({
            latitude: 48.8566,
            longitude: 2.3522,
            altitude: 35.0,
            accuracy: 4.5,
            speed: 0.0
        })
    });
    // Phone.GetNetworkInfo() -> { type: "WIFI"|"5G", carrier: "Orange" }
    phoneObj.SetProperty("GetNetworkInfo", {
        type: "native_fn",
        call: () => toRuntimeVal({
            type: "WIFI",
            ssid: "Lolpaon_HighSpeed_5G",
            signalStrength: 4,
            carrier: "Orange",
            isRoaming: false
        })
    });
    env.declareVar("Phone", { type: "instance", instance: phoneObj }, "General");
    // ==========================================================================
    // 2. PROCESS I/O STREAMING CONTROLLER (ProcessIO)
    // ==========================================================================
    // Listen and write to process inputs/outputs (STDIN / STDOUT / STDERR)
    // works on both mobile terminal environments and desktop computers
    // ==========================================================================
    const processIoObj = new instance_1.Instance("ProcessIOService");
    processIoObj.Name = "ProcessIO";
    // ProcessIO.Spawn(command: string, args?: string[]) -> processId (number)
    processIoObj.SetProperty("Spawn", {
        type: "native_fn",
        call: (args) => {
            const cmd = String(args[0]?.value || "");
            const rawArgs = (args[1] && args[1].elements)
                ? args[1].elements.map((e) => String(e.value || ""))
                : [];
            try {
                const child = cp.spawn(cmd, rawArgs, {
                    shell: true,
                    stdio: ["pipe", "pipe", "pipe"]
                });
                const procId = nextProcessId++;
                const procRecord = {
                    id: procId,
                    command: cmd,
                    child,
                    stdoutListeners: [],
                    stderrListeners: [],
                    exitListeners: []
                };
                child.stdout?.on("data", (data) => {
                    const str = data.toString("utf8");
                    for (const l of procRecord.stdoutListeners) {
                        try {
                            (0, interpreter_1.callLLPFunction)(l, [(0, values_1.MK_STRING)(str), (0, values_1.MK_NUMBER)(procId)], env);
                        }
                        catch (_) { }
                    }
                });
                child.stderr?.on("data", (data) => {
                    const str = data.toString("utf8");
                    for (const l of procRecord.stderrListeners) {
                        try {
                            (0, interpreter_1.callLLPFunction)(l, [(0, values_1.MK_STRING)(str), (0, values_1.MK_NUMBER)(procId)], env);
                        }
                        catch (_) { }
                    }
                });
                child.on("close", (exitCode) => {
                    for (const l of procRecord.exitListeners) {
                        try {
                            (0, interpreter_1.callLLPFunction)(l, [(0, values_1.MK_NUMBER)(exitCode || 0), (0, values_1.MK_NUMBER)(procId)], env);
                        }
                        catch (_) { }
                    }
                    activeTrackedProcesses.delete(procId);
                });
                activeTrackedProcesses.set(procId, procRecord);
                return (0, values_1.MK_NUMBER)(procId);
            }
            catch (err) {
                console.error(`[ProcessIO Error] Impossible de lancer le processus '${cmd}' :`, err.message);
                return (0, values_1.MK_NUMBER)(-1);
            }
        }
    });
    // ProcessIO.OnStdout(procId: number, handler: Function)
    processIoObj.SetProperty("OnStdout", {
        type: "native_fn",
        call: (args) => {
            const procId = args[0]?.value || 0;
            const handler = args[1];
            const proc = activeTrackedProcesses.get(procId);
            if (proc && handler) {
                proc.stdoutListeners.push(handler);
                return (0, values_1.MK_BOOL)(true);
            }
            return (0, values_1.MK_BOOL)(false);
        }
    });
    // ProcessIO.OnStderr(procId: number, handler: Function)
    processIoObj.SetProperty("OnStderr", {
        type: "native_fn",
        call: (args) => {
            const procId = args[0]?.value || 0;
            const handler = args[1];
            const proc = activeTrackedProcesses.get(procId);
            if (proc && handler) {
                proc.stderrListeners.push(handler);
                return (0, values_1.MK_BOOL)(true);
            }
            return (0, values_1.MK_BOOL)(false);
        }
    });
    // ProcessIO.OnExit(procId: number, handler: Function)
    processIoObj.SetProperty("OnExit", {
        type: "native_fn",
        call: (args) => {
            const procId = args[0]?.value || 0;
            const handler = args[1];
            const proc = activeTrackedProcesses.get(procId);
            if (proc && handler) {
                proc.exitListeners.push(handler);
                return (0, values_1.MK_BOOL)(true);
            }
            return (0, values_1.MK_BOOL)(false);
        }
    });
    // ProcessIO.WriteStdin(procId: number, data: string)
    processIoObj.SetProperty("WriteStdin", {
        type: "native_fn",
        call: (args) => {
            const procId = args[0]?.value || 0;
            const data = String(args[1]?.value || "");
            const proc = activeTrackedProcesses.get(procId);
            if (proc && proc.child.stdin && !proc.child.stdin.destroyed) {
                proc.child.stdin.write(data);
                return (0, values_1.MK_BOOL)(true);
            }
            return (0, values_1.MK_BOOL)(false);
        }
    });
    // ProcessIO.Kill(procId: number)
    processIoObj.SetProperty("Kill", {
        type: "native_fn",
        call: (args) => {
            const procId = args[0]?.value || 0;
            const proc = activeTrackedProcesses.get(procId);
            if (proc) {
                proc.child.kill();
                activeTrackedProcesses.delete(procId);
                return (0, values_1.MK_BOOL)(true);
            }
            return (0, values_1.MK_BOOL)(false);
        }
    });
    // ProcessIO.GetActiveProcesses()
    processIoObj.SetProperty("GetActiveProcesses", {
        type: "native_fn",
        call: () => {
            const list = Array.from(activeTrackedProcesses.keys());
            return toRuntimeVal(list);
        }
    });
    env.declareVar("ProcessIO", { type: "instance", instance: processIoObj }, "General");
}
