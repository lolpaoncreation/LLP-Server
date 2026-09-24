import * as http from "http";
import * as https from "https";
import { Environment } from "../runtime/environment";
import { Instance } from "../runtime/instance";
import { MK_BOOL, MK_STRING, RuntimeVal } from "../runtime/values";

export function registerDatabaseSync(env: Environment) {
  const syncObj = new Instance("DatabaseSyncService");
  syncObj.Name = "DatabaseSync";

  syncObj.SetProperty("Push", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const remoteUrl = args[0]?.type === "string" ? args[0].value : "";
      const payload = args[1]?.type === "string" ? args[1].value : "{}";
      console.log(`[DatabaseSync] Envoi des données vers ${remoteUrl}...`);
      return MK_BOOL(true);
    }
  });

  syncObj.SetProperty("Pull", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const remoteUrl = args[0]?.type === "string" ? args[0].value : "";
      console.log(`[DatabaseSync] Récupération des données depuis ${remoteUrl}...`);
      return MK_STRING(JSON.stringify({ status: "synced", timestamp: Date.now() }));
    }
  });

  syncObj.SetProperty("Sync", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const remoteUrl = args[0]?.type === "string" ? args[0].value : "";
      console.log(`[DatabaseSync] Synchronisation bidirectionnelle avec ${remoteUrl}...`);
      return MK_BOOL(true);
    }
  });

  env.declareVar("DatabaseSync", { type: "instance", instance: syncObj }, "General");
}
