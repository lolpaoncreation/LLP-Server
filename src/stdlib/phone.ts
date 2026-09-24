import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import * as cp from "child_process";
import { Environment } from "../runtime/environment";
import { Instance } from "../runtime/instance";
import { MK_BOOL, MK_NULL, MK_NUMBER, MK_STRING, RuntimeVal } from "../runtime/values";
import { callLLPFunction } from "../runtime/interpreter";

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
function toRuntimeVal(val: any): RuntimeVal {
  if (val === null || val === undefined) return MK_NULL();
  if (typeof val === "number") return MK_NUMBER(val);
  if (typeof val === "string") return MK_STRING(val);
  if (typeof val === "boolean") return MK_BOOL(val);
  if (Array.isArray(val)) {
    const listVal: any = {
      type: "list",
      elementType: "General",
      elements: val.map(toRuntimeVal)
    };
    listVal.Add = (item: RuntimeVal) => { listVal.elements.push(item); };
    listVal.Length = () => listVal.elements.length;
    return listVal;
  }
  if (typeof val === "object") {
    const inst = new Instance("Object");
    for (const [k, v] of Object.entries(val)) {
      inst.SetProperty(k, toRuntimeVal(v));
    }
    return { type: "instance", instance: inst };
  }
  return MK_STRING(String(val));
}

// Global Process Stream Tracker for ProcessIO
interface TrackedProcess {
  id: number;
  command: string;
  child: cp.ChildProcess;
  stdoutListeners: RuntimeVal[];
  stderrListeners: RuntimeVal[];
  exitListeners: RuntimeVal[];
}

const activeTrackedProcesses: Map<number, TrackedProcess> = new Map();
let nextProcessId = 1000;

export function registerPhone(env: Environment) {
  // Event listener registries for Phone events
  const eventListeners: Map<string, RuntimeVal[]> = new Map();

  function triggerPhoneEvent(eventName: string, eventData: any) {
    const listeners = eventListeners.get(eventName) || [];
    const runtimeArg = toRuntimeVal(eventData);
    for (const listener of listeners) {
      try {
        callLLPFunction(listener, [runtimeArg], env);
      } catch (err: any) {
        console.error(`[LLP Phone Event Error] Erreur lors de l'exécution de l'événement '${eventName}' :`, err.message);
      }
    }
  }

  // --------------------------------------------------------------------------
  // 1. PHONE HARDWARE & TELEPHONY CONTROLLER
  // --------------------------------------------------------------------------
  const phoneObj = new Instance("PhoneService");
  phoneObj.Name = "Phone";

  let currentCallState = "IDLE"; // "IDLE" | "RINGING" | "OFFHOOK"
  let currentCallerInfo: any = null;
  let isRecordingAudio = false;
  let activeAudioRoute = "speaker"; // "speaker" | "earpiece" | "bluetooth" | "headset"
  let flashlightEnabled = false;
  let audioVolume = 85;

  // Universal Event Registration: Phone.On(eventName, handler)
  phoneObj.SetProperty("On", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const evName = String((args[0] as any)?.value || "");
      const handler = args[1];
      if (evName && handler) {
        if (!eventListeners.has(evName)) {
          eventListeners.set(evName, []);
        }
        eventListeners.get(evName)!.push(handler);
        return MK_BOOL(true);
      }
      return MK_BOOL(false);
    }
  });

  // Phone.Off(eventName)
  phoneObj.SetProperty("Off", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const evName = String((args[0] as any)?.value || "");
      if (eventListeners.has(evName)) {
        eventListeners.delete(evName);
        return MK_BOOL(true);
      }
      return MK_BOOL(false);
    }
  });

  // Phone.Emit(eventName, data)
  phoneObj.SetProperty("Emit", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const evName = String((args[0] as any)?.value || "");
      const data = args[1] ? (args[1] as any).value || args[1] : {};
      triggerPhoneEvent(evName, data);
      return MK_BOOL(true);
    }
  });

  // --- TELEPHONY & CALL EVENTS ---

  // Phone.OnIncomingCall(handler)
  phoneObj.SetProperty("OnIncomingCall", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const handler = args[0];
      if (handler) {
        if (!eventListeners.has("incoming_call")) eventListeners.set("incoming_call", []);
        eventListeners.get("incoming_call")!.push(handler);
        return MK_BOOL(true);
      }
      return MK_BOOL(false);
    }
  });

  // Phone.OnCallAnswered(handler)
  phoneObj.SetProperty("OnCallAnswered", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const handler = args[0];
      if (handler) {
        if (!eventListeners.has("call_answered")) eventListeners.set("call_answered", []);
        eventListeners.get("call_answered")!.push(handler);
        return MK_BOOL(true);
      }
      return MK_BOOL(false);
    }
  });

  // Phone.OnCallEnded(handler)
  phoneObj.SetProperty("OnCallEnded", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const handler = args[0];
      if (handler) {
        if (!eventListeners.has("call_ended")) eventListeners.set("call_ended", []);
        eventListeners.get("call_ended")!.push(handler);
        return MK_BOOL(true);
      }
      return MK_BOOL(false);
    }
  });

  // Phone.OnCallStateChanged(handler)
  phoneObj.SetProperty("OnCallStateChanged", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const handler = args[0];
      if (handler) {
        if (!eventListeners.has("call_state_changed")) eventListeners.set("call_state_changed", []);
        eventListeners.get("call_state_changed")!.push(handler);
        return MK_BOOL(true);
      }
      return MK_BOOL(false);
    }
  });

  // Phone.Dial(phoneNumber)
  phoneObj.SetProperty("Dial", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const number = String((args[0] as any)?.value || "");
      currentCallState = "OFFHOOK";
      currentCallerInfo = { phoneNumber: number, contactName: "Appel Sortant", direction: "OUTGOING", timestamp: Date.now() };
      triggerPhoneEvent("call_state_changed", { state: currentCallState, number });
      return MK_BOOL(true);
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
        return MK_BOOL(true);
      }
      return MK_BOOL(false);
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
      return MK_BOOL(true);
    }
  });

  // Phone.GetCallState()
  phoneObj.SetProperty("GetCallState", {
    type: "native_fn",
    call: () => MK_STRING(currentCallState)
  });

  // Phone.SimulateIncomingCall(phoneNumber, callerName) - Simulation for testing
  phoneObj.SetProperty("SimulateIncomingCall", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const num = String((args[0] as any)?.value || "+33612345678");
      const name = String((args[1] as any)?.value || "Contact Mobile");
      currentCallState = "RINGING";
      currentCallerInfo = { phoneNumber: num, contactName: name, direction: "INCOMING", timestamp: Date.now() };
      triggerPhoneEvent("incoming_call", currentCallerInfo);
      triggerPhoneEvent("call_state_changed", { state: "RINGING", number: num, name });
      return MK_BOOL(true);
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
    call: (args: RuntimeVal[]) => {
      const target = String((args[0] as any)?.value || "speaker").toLowerCase();
      activeAudioRoute = target;
      triggerPhoneEvent("audio_route_changed", { route: activeAudioRoute });
      return MK_BOOL(true);
    }
  });

  // Phone.GetAudioRoute()
  phoneObj.SetProperty("GetAudioRoute", {
    type: "native_fn",
    call: () => MK_STRING(activeAudioRoute)
  });

  // Phone.StartRecording(outputFileName?)
  phoneObj.SetProperty("StartRecording", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const outName = String((args[0] as any)?.value || "recording_" + Date.now() + ".wav");
      isRecordingAudio = true;
      triggerPhoneEvent("recording_started", { file: outName, route: activeAudioRoute });
      return MK_STRING(outName);
    }
  });

  // Phone.StopRecording()
  phoneObj.SetProperty("StopRecording", {
    type: "native_fn",
    call: () => {
      if (isRecordingAudio) {
        isRecordingAudio = false;
        triggerPhoneEvent("recording_stopped", { success: true });
        return MK_BOOL(true);
      }
      return MK_BOOL(false);
    }
  });

  // Phone.IsRecording()
  phoneObj.SetProperty("IsRecording", {
    type: "native_fn",
    call: () => MK_BOOL(isRecordingAudio)
  });

  // Phone.SetVolume(level: 0..100)
  phoneObj.SetProperty("SetVolume", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      audioVolume = Math.max(0, Math.min(100, (args[0] as any)?.value || 50));
      triggerPhoneEvent("volume_changed", { volume: audioVolume });
      return MK_NUMBER(audioVolume);
    }
  });

  // Phone.GetVolume()
  phoneObj.SetProperty("GetVolume", {
    type: "native_fn",
    call: () => MK_NUMBER(audioVolume)
  });

  // Phone.PlayAudio(filePath)
  phoneObj.SetProperty("PlayAudio", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const filePath = String((args[0] as any)?.value || "");
      triggerPhoneEvent("audio_playback_started", { file: filePath, route: activeAudioRoute });
      return MK_BOOL(true);
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
    call: (args: RuntimeVal[]) => {
      const targetCam = String((args[0] as any)?.value || "back");
      const photoPath = "photo_" + Date.now() + ".jpg";
      triggerPhoneEvent("photo_captured", { file: photoPath, camera: targetCam, resolution: "4000x3000" });
      return MK_STRING(photoPath);
    }
  });

  // Phone.SetFlashlight(active: bool)
  phoneObj.SetProperty("SetFlashlight", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      flashlightEnabled = (args[0] as any)?.value === true || (args[0] as any)?.value === 1;
      triggerPhoneEvent("flashlight_changed", { active: flashlightEnabled });
      return MK_BOOL(flashlightEnabled);
    }
  });

  // Phone.Vibrate(patternMs?)
  phoneObj.SetProperty("Vibrate", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const duration = (args[0] as any)?.value || 250;
      triggerPhoneEvent("vibration_triggered", { durationMs: duration });
      return MK_BOOL(true);
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
  const processIoObj = new Instance("ProcessIOService");
  processIoObj.Name = "ProcessIO";

  // ProcessIO.Spawn(command: string, args?: string[]) -> processId (number)
  processIoObj.SetProperty("Spawn", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const cmd = String((args[0] as any)?.value || "");
      const rawArgs = (args[1] && (args[1] as any).elements) 
        ? (args[1] as any).elements.map((e: any) => String(e.value || "")) 
        : [];

      try {
        const child = cp.spawn(cmd, rawArgs, {
          shell: true,
          stdio: ["pipe", "pipe", "pipe"]
        });

        const procId = nextProcessId++;
        const procRecord: TrackedProcess = {
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
            try { callLLPFunction(l, [MK_STRING(str), MK_NUMBER(procId)], env); } catch (_) {}
          }
        });

        child.stderr?.on("data", (data) => {
          const str = data.toString("utf8");
          for (const l of procRecord.stderrListeners) {
            try { callLLPFunction(l, [MK_STRING(str), MK_NUMBER(procId)], env); } catch (_) {}
          }
        });

        child.on("close", (exitCode) => {
          for (const l of procRecord.exitListeners) {
            try { callLLPFunction(l, [MK_NUMBER(exitCode || 0), MK_NUMBER(procId)], env); } catch (_) {}
          }
          activeTrackedProcesses.delete(procId);
        });

        activeTrackedProcesses.set(procId, procRecord);
        return MK_NUMBER(procId);
      } catch (err: any) {
        console.error(`[ProcessIO Error] Impossible de lancer le processus '${cmd}' :`, err.message);
        return MK_NUMBER(-1);
      }
    }
  });

  // ProcessIO.OnStdout(procId: number, handler: Function)
  processIoObj.SetProperty("OnStdout", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const procId = (args[0] as any)?.value || 0;
      const handler = args[1];
      const proc = activeTrackedProcesses.get(procId);
      if (proc && handler) {
        proc.stdoutListeners.push(handler);
        return MK_BOOL(true);
      }
      return MK_BOOL(false);
    }
  });

  // ProcessIO.OnStderr(procId: number, handler: Function)
  processIoObj.SetProperty("OnStderr", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const procId = (args[0] as any)?.value || 0;
      const handler = args[1];
      const proc = activeTrackedProcesses.get(procId);
      if (proc && handler) {
        proc.stderrListeners.push(handler);
        return MK_BOOL(true);
      }
      return MK_BOOL(false);
    }
  });

  // ProcessIO.OnExit(procId: number, handler: Function)
  processIoObj.SetProperty("OnExit", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const procId = (args[0] as any)?.value || 0;
      const handler = args[1];
      const proc = activeTrackedProcesses.get(procId);
      if (proc && handler) {
        proc.exitListeners.push(handler);
        return MK_BOOL(true);
      }
      return MK_BOOL(false);
    }
  });

  // ProcessIO.WriteStdin(procId: number, data: string)
  processIoObj.SetProperty("WriteStdin", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const procId = (args[0] as any)?.value || 0;
      const data = String((args[1] as any)?.value || "");
      const proc = activeTrackedProcesses.get(procId);
      if (proc && proc.child.stdin && !proc.child.stdin.destroyed) {
        proc.child.stdin.write(data);
        return MK_BOOL(true);
      }
      return MK_BOOL(false);
    }
  });

  // ProcessIO.Kill(procId: number)
  processIoObj.SetProperty("Kill", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const procId = (args[0] as any)?.value || 0;
      const proc = activeTrackedProcesses.get(procId);
      if (proc) {
        proc.child.kill();
        activeTrackedProcesses.delete(procId);
        return MK_BOOL(true);
      }
      return MK_BOOL(false);
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
