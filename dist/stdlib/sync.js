"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerDatabaseSync = registerDatabaseSync;
const instance_1 = require("../runtime/instance");
const values_1 = require("../runtime/values");
function registerDatabaseSync(env) {
    const syncObj = new instance_1.Instance("DatabaseSyncService");
    syncObj.Name = "DatabaseSync";
    syncObj.SetProperty("Push", {
        type: "native_fn",
        call: (args) => {
            const remoteUrl = args[0]?.type === "string" ? args[0].value : "";
            const payload = args[1]?.type === "string" ? args[1].value : "{}";
            console.log(`[DatabaseSync] Envoi des données vers ${remoteUrl}...`);
            return (0, values_1.MK_BOOL)(true);
        }
    });
    syncObj.SetProperty("Pull", {
        type: "native_fn",
        call: (args) => {
            const remoteUrl = args[0]?.type === "string" ? args[0].value : "";
            console.log(`[DatabaseSync] Récupération des données depuis ${remoteUrl}...`);
            return (0, values_1.MK_STRING)(JSON.stringify({ status: "synced", timestamp: Date.now() }));
        }
    });
    syncObj.SetProperty("Sync", {
        type: "native_fn",
        call: (args) => {
            const remoteUrl = args[0]?.type === "string" ? args[0].value : "";
            console.log(`[DatabaseSync] Synchronisation bidirectionnelle avec ${remoteUrl}...`);
            return (0, values_1.MK_BOOL)(true);
        }
    });
    env.declareVar("DatabaseSync", { type: "instance", instance: syncObj }, "General");
}
