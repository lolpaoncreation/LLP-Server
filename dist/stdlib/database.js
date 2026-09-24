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
exports.registerDatabase = registerDatabase;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const instance_1 = require("../runtime/instance");
const values_1 = require("../runtime/values");
// Simple lightweight JSON / SQL-like store engine
class LightweightDatabase {
    filePath;
    data = new Map();
    tables = new Map();
    constructor(filePath) {
        this.filePath = filePath;
        this.load();
    }
    load() {
        if (fs.existsSync(this.filePath)) {
            try {
                const raw = fs.readFileSync(this.filePath, "utf-8");
                const json = JSON.parse(raw);
                if (json.kv) {
                    this.data = new Map(Object.entries(json.kv));
                }
                if (json.tables) {
                    this.tables = new Map(Object.entries(json.tables));
                }
            }
            catch (e) {
                // file unreadable or empty
            }
        }
    }
    save() {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        const json = {
            kv: Object.fromEntries(this.data.entries()),
            tables: Object.fromEntries(this.tables.entries())
        };
        fs.writeFileSync(this.filePath, JSON.stringify(json, null, 2), "utf-8");
    }
    set(key, value) {
        this.data.set(key, value);
        this.save();
    }
    get(key) {
        return this.data.get(key) ?? null;
    }
    delete(key) {
        const res = this.data.delete(key);
        this.save();
        return res;
    }
    getAll() {
        return Object.fromEntries(this.data.entries());
    }
    execute(sql, params = []) {
        const cleanSql = sql.trim();
        const upper = cleanSql.toUpperCase();
        // Support CREATE TABLE table_name
        if (upper.startsWith("CREATE TABLE")) {
            const match = cleanSql.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)/i);
            if (match) {
                const tableName = match[1];
                if (!this.tables.has(tableName)) {
                    this.tables.set(tableName, []);
                    this.save();
                }
                return { success: true, table: tableName };
            }
        }
        // Support INSERT INTO table_name VALUES (...) or INSERT INTO table_name (cols) VALUES (...)
        if (upper.startsWith("INSERT INTO")) {
            const match = cleanSql.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)/i);
            if (match) {
                const tableName = match[1];
                if (!this.tables.has(tableName)) {
                    this.tables.set(tableName, []);
                }
                const record = params.length > 0 ? params : { _insertedAt: Date.now() };
                this.tables.get(tableName).push(record);
                this.save();
                return { success: true, inserted: 1 };
            }
        }
        // Support DELETE FROM table_name
        if (upper.startsWith("DELETE FROM")) {
            const match = cleanSql.match(/DELETE\s+FROM\s+([a-zA-Z0-9_]+)/i);
            if (match) {
                const tableName = match[1];
                this.tables.set(tableName, []);
                this.save();
                return { success: true, deletedAll: true };
            }
        }
        return { success: true };
    }
    query(sql, params = []) {
        const cleanSql = sql.trim();
        const upper = cleanSql.toUpperCase();
        if (upper.startsWith("SELECT")) {
            const match = cleanSql.match(/SELECT\s+.*\s+FROM\s+([a-zA-Z0-9_]+)/i);
            if (match) {
                const tableName = match[1];
                return this.tables.get(tableName) || [];
            }
        }
        return [];
    }
}
function registerDatabase(env) {
    const dbModule = new instance_1.Instance("DatabaseModule");
    dbModule.Name = "Database";
    dbModule.SetProperty("Open", {
        type: "native_fn",
        call: (args) => {
            const dbPath = args.length > 0 && args[0].type === "string" ? args[0].value : "app.db";
            const dbInstance = new instance_1.Instance("DatabaseConnection");
            dbInstance.Name = path.basename(dbPath);
            const dbEngine = new LightweightDatabase(dbPath);
            dbInstance.SetProperty("Set", {
                type: "native_fn",
                call: (callArgs) => {
                    if (callArgs.length < 2 || callArgs[0].type !== "string") {
                        throw new Error("[Database.Set] Arguments (key: string, value: General) attendus.");
                    }
                    const key = callArgs[0].value;
                    const val = runtimeValToJs(callArgs[1]);
                    dbEngine.set(key, val);
                    return (0, values_1.MK_BOOL)(true);
                }
            });
            dbInstance.SetProperty("Get", {
                type: "native_fn",
                call: (callArgs) => {
                    if (callArgs.length < 1 || callArgs[0].type !== "string")
                        return (0, values_1.MK_NULL)();
                    const val = dbEngine.get(callArgs[0].value);
                    return jsToRuntimeVal(val);
                }
            });
            dbInstance.SetProperty("GetAll", {
                type: "native_fn",
                call: () => {
                    return jsToRuntimeVal(dbEngine.getAll());
                }
            });
            dbInstance.SetProperty("Execute", {
                type: "native_fn",
                call: (callArgs) => {
                    if (callArgs.length < 1 || callArgs[0].type !== "string") {
                        throw new Error("[Database.Execute] SQL string attendu.");
                    }
                    const sql = callArgs[0].value;
                    const params = callArgs.length > 1 ? runtimeValToJs(callArgs[1]) : [];
                    const res = dbEngine.execute(sql, Array.isArray(params) ? params : [params]);
                    return jsToRuntimeVal(res);
                }
            });
            dbInstance.SetProperty("Query", {
                type: "native_fn",
                call: (callArgs) => {
                    if (callArgs.length < 1 || callArgs[0].type !== "string") {
                        return { type: "list", elementType: "General", elements: [] };
                    }
                    const sql = callArgs[0].value;
                    const params = callArgs.length > 1 ? runtimeValToJs(callArgs[1]) : [];
                    const rows = dbEngine.query(sql, Array.isArray(params) ? params : [params]);
                    return jsToRuntimeVal(rows);
                }
            });
            return { type: "instance", instance: dbInstance };
        }
    });
    env.declareVar("Database", { type: "instance", instance: dbModule }, "General");
}
function runtimeValToJs(val) {
    if (!val || val.type === "null")
        return null;
    if (val.type === "number" || val.type === "string" || val.type === "boolean")
        return val.value;
    if (val.type === "list" && val.elements)
        return val.elements.map(e => e ? runtimeValToJs(e) : null);
    if (val.type === "fixed_array" && val.elements)
        return val.elements.map(e => (e ? runtimeValToJs(e) : null));
    if (val.type === "instance" && val.instance)
        return { ClassName: val.instance.ClassName, Name: val.instance.Name };
    return null;
}
function jsToRuntimeVal(js) {
    if (js === null || js === undefined)
        return (0, values_1.MK_NULL)();
    if (typeof js === "number")
        return (0, values_1.MK_NUMBER)(js);
    if (typeof js === "string")
        return (0, values_1.MK_STRING)(js);
    if (typeof js === "boolean")
        return (0, values_1.MK_BOOL)(js);
    if (Array.isArray(js)) {
        return {
            type: "list",
            elementType: "General",
            elements: js.map(jsToRuntimeVal)
        };
    }
    if (typeof js === "object") {
        const keys = Object.keys(js);
        const inst = new instance_1.Instance("DataObject");
        for (const k of keys) {
            inst.SetProperty(k, jsToRuntimeVal(js[k]));
        }
        return { type: "instance", instance: inst };
    }
    return (0, values_1.MK_NULL)();
}
