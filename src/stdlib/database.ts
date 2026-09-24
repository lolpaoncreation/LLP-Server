import * as fs from "fs";
import * as path from "path";
import { Environment } from "../runtime/environment";
import { Instance } from "../runtime/instance";
import { MK_BOOL, MK_NULL, MK_NUMBER, MK_STRING, RuntimeVal } from "../runtime/values";

// Simple lightweight JSON / SQL-like store engine
class LightweightDatabase {
  private filePath: string;
  private data: Map<string, any> = new Map();
  private tables: Map<string, any[]> = new Map();

  constructor(filePath: string) {
    this.filePath = filePath;
    this.load();
  }

  private load() {
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
      } catch (e) {
        // file unreadable or empty
      }
    }
  }

  public save() {
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

  public set(key: string, value: any) {
    this.data.set(key, value);
    this.save();
  }

  public get(key: string): any {
    return this.data.get(key) ?? null;
  }

  public delete(key: string): boolean {
    const res = this.data.delete(key);
    this.save();
    return res;
  }

  public getAll(): any {
    return Object.fromEntries(this.data.entries());
  }

  public execute(sql: string, params: any[] = []): any {
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
        this.tables.get(tableName)!.push(record);
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

  public query(sql: string, params: any[] = []): any[] {
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

export function registerDatabase(env: Environment) {
  const dbModule = new Instance("DatabaseModule");
  dbModule.Name = "Database";

  dbModule.SetProperty("Open", {
    type: "native_fn",
    call: (args: RuntimeVal[]) => {
      const dbPath = args.length > 0 && args[0].type === "string" ? args[0].value : "app.db";
      const dbInstance = new Instance("DatabaseConnection");
      dbInstance.Name = path.basename(dbPath);

      const dbEngine = new LightweightDatabase(dbPath);

      dbInstance.SetProperty("Set", {
        type: "native_fn",
        call: (callArgs: RuntimeVal[]) => {
          if (callArgs.length < 2 || callArgs[0].type !== "string") {
            throw new Error("[Database.Set] Arguments (key: string, value: General) attendus.");
          }
          const key = callArgs[0].value;
          const val = runtimeValToJs(callArgs[1]);
          dbEngine.set(key, val);
          return MK_BOOL(true);
        }
      });

      dbInstance.SetProperty("Get", {
        type: "native_fn",
        call: (callArgs: RuntimeVal[]) => {
          if (callArgs.length < 1 || callArgs[0].type !== "string") return MK_NULL();
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
        call: (callArgs: RuntimeVal[]) => {
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
        call: (callArgs: RuntimeVal[]) => {
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

function runtimeValToJs(val: RuntimeVal): any {
  if (!val || val.type === "null") return null;
  if (val.type === "number" || val.type === "string" || val.type === "boolean") return val.value;
  if (val.type === "list" && val.elements) return val.elements.map(e => e ? runtimeValToJs(e) : null);
  if (val.type === "fixed_array" && val.elements) return val.elements.map(e => (e ? runtimeValToJs(e) : null));
  if (val.type === "instance" && val.instance) return { ClassName: val.instance.ClassName, Name: val.instance.Name };
  return null;
}

function jsToRuntimeVal(js: any): RuntimeVal {
  if (js === null || js === undefined) return MK_NULL();
  if (typeof js === "number") return MK_NUMBER(js);
  if (typeof js === "string") return MK_STRING(js);
  if (typeof js === "boolean") return MK_BOOL(js);
  if (Array.isArray(js)) {
    return {
      type: "list",
      elementType: "General",
      elements: js.map(jsToRuntimeVal)
    };
  }
  if (typeof js === "object") {
    const keys = Object.keys(js);
    const inst = new Instance("DataObject");
    for (const k of keys) {
      inst.SetProperty(k, jsToRuntimeVal(js[k]));
    }
    return { type: "instance", instance: inst };
  }
  return MK_NULL();
}
