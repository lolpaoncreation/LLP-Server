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
exports.CryptedLolpaonDatabase = void 0;
exports.registerCllpdb = registerCllpdb;
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const instance_1 = require("../runtime/instance");
const values_1 = require("../runtime/values");
const crypto_1 = require("./crypto");
class CryptedLolpaonDatabase {
    filePath;
    projectKey;
    sessionToken = null;
    sessionExpiresAt = 0;
    content;
    currentDbName = "default";
    constructor(filePath, customKey) {
        this.filePath = filePath;
        this.projectKey = customKey || (0, crypto_1.getProjectEncryptionKey)(filePath);
        this.content = {
            magic: "CLLPDBv1",
            adminUser: "admin",
            adminPassHash: crypto.createHash("sha256").update("admin").digest("hex"),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            databases: {
                default: {
                    name: "default",
                    tables: {}
                }
            }
        };
        this.load();
    }
    // Vérifier si le système tourne en droits administrateur OS (Windows / Linux)
    static isSystemAdmin() {
        try {
            if (process.platform === "win32") {
                (0, child_process_1.execSync)("net session", { stdio: "ignore" });
                return true;
            }
            else {
                return process.getuid ? process.getuid() === 0 : false;
            }
        }
        catch (e) {
            return false;
        }
    }
    // Hachage du mot de passe
    hashPassword(password) {
        return crypto.createHash("sha256").update(password).digest("hex");
    }
    // Dérivation de clé AES à partir de la clé de projet et des identifiants
    getCipherKey() {
        return crypto.createHash("sha256").update(this.projectKey + ":" + this.content.adminPassHash).digest();
    }
    // Chargement et déchiffrement depuis le disque (100% UTF-8)
    load() {
        if (!fs.existsSync(this.filePath)) {
            return false;
        }
        try {
            const raw = fs.readFileSync(this.filePath);
            if (raw.length < 32 || raw.subarray(0, 8).toString("utf8") !== "CLLPDB01") {
                return false;
            }
            const salt = raw.subarray(8, 24);
            const iv = raw.subarray(24, 40);
            const encrypted = raw.subarray(40);
            const derivedKey = crypto.pbkdf2Sync(this.projectKey, salt, 10000, 32, "sha256");
            const decipher = crypto.createDecipheriv("aes-256-cbc", derivedKey, iv);
            let decrypted = decipher.update(encrypted);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            const jsonStr = decrypted.toString("utf8");
            this.content = JSON.parse(jsonStr);
            return true;
        }
        catch (e) {
            // Fichier corrompu ou clé invalide
            return false;
        }
    }
    // Chiffrement et sauvegarde sur disque (100% UTF-8)
    save() {
        try {
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            this.content.updatedAt = Date.now();
            const jsonStr = JSON.stringify(this.content);
            const jsonBuf = Buffer.from(jsonStr, "utf8");
            const salt = crypto.randomBytes(16);
            const iv = crypto.randomBytes(16);
            const derivedKey = crypto.pbkdf2Sync(this.projectKey, salt, 10000, 32, "sha256");
            const cipher = crypto.createCipheriv("aes-256-cbc", derivedKey, iv);
            let encrypted = cipher.update(jsonBuf);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            const header = Buffer.from("CLLPDB01", "utf8");
            const finalBuffer = Buffer.concat([header, salt, iv, encrypted]);
            fs.writeFileSync(this.filePath, finalBuffer);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    // Initialisation à la création
    initializeNew(adminUser, adminPass) {
        this.content = {
            magic: "CLLPDBv1",
            adminUser: adminUser || "admin",
            adminPassHash: this.hashPassword(adminPass || "admin"),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            databases: {
                default: {
                    name: "default",
                    tables: {}
                }
            }
        };
        return this.save();
    }
    // Authentification et démarrage d'une session (durée définie par le développeur, ou permanente si non spécifiée)
    startSession(username, password, durationSeconds) {
        const passHash = this.hashPassword(password);
        if (this.content.adminUser === username && this.content.adminPassHash === passHash) {
            this.sessionToken = crypto.randomBytes(16).toString("hex");
            if (typeof durationSeconds === "number" && durationSeconds > 0) {
                this.sessionExpiresAt = Date.now() + durationSeconds * 1000;
                return { success: true, message: `Session démarrée avec succès (durée : ${durationSeconds}s)`, remainingSeconds: durationSeconds };
            }
            else {
                // Durée indéfinie / permanente (définie par le développeur)
                this.sessionExpiresAt = -1;
                return { success: true, message: "Session démarrée avec succès (permanente / sans expiration)", remainingSeconds: -1 };
            }
        }
        return { success: false, message: "Invalid username or password", remainingSeconds: 0 };
    }
    // Check session validity (always active if permanent -1)
    isSessionActive() {
        if (!this.sessionToken)
            return false;
        if (this.sessionExpiresAt === -1)
            return true;
        return Date.now() < this.sessionExpiresAt;
    }
    getRemainingSessionSeconds() {
        if (!this.sessionToken)
            return 0;
        if (this.sessionExpiresAt === -1)
            return -1;
        return Math.max(0, Math.round((this.sessionExpiresAt - Date.now()) / 1000));
    }
    endSession() {
        this.sessionToken = null;
        this.sessionExpiresAt = 0;
    }
    // Change credentials (ONLY WITH SYSTEM ADMIN PRIVILEGES)
    changeCredentials(newUsername, newPassword) {
        if (!CryptedLolpaonDatabase.isSystemAdmin()) {
            return {
                success: false,
                message: "Denied: Changing credentials requires running with system administrator privileges."
            };
        }
        this.content.adminUser = newUsername;
        this.content.adminPassHash = this.hashPassword(newPassword);
        this.save();
        return { success: true, message: "Administrator credentials updated successfully!" };
    }
    getDatabases() {
        return Object.keys(this.content.databases);
    }
    useDatabase(dbName) {
        if (this.content.databases[dbName]) {
            this.currentDbName = dbName;
            return true;
        }
        return false;
    }
    getCurrentDb() {
        if (!this.content.databases[this.currentDbName]) {
            this.content.databases[this.currentDbName] = { name: this.currentDbName, tables: {} };
        }
        return this.content.databases[this.currentDbName];
    }
    // PARSER AND SIMPLIFIED MYSQL ENGINE
    executeSql(sql) {
        const clean = sql.trim();
        if (!clean)
            return { success: true, data: [] };
        const upper = clean.toUpperCase();
        // 1. DROP ALL DATABASE;
        if (/^DROP\s+ALL\s+DATABASE;?/i.test(clean)) {
            this.content.databases = {
                default: { name: "default", tables: {} }
            };
            this.currentDbName = "default";
            this.save();
            return { success: true, message: "All databases have been deleted successfully." };
        }
        // 2. DROP ALL TABLES;
        if (/^DROP\s+ALL\s+TABLES;?/i.test(clean)) {
            const db = this.getCurrentDb();
            db.tables = {};
            this.save();
            return { success: true, message: "All tables from current database have been deleted successfully." };
        }
        // 3. DROP ALL DATA FROM table_name;
        const dropAllDataMatch = clean.match(/^DROP\s+ALL\s+DATA\s+FROM\s+([a-zA-Z0-9_\-]+);?/i);
        if (dropAllDataMatch) {
            const tblName = dropAllDataMatch[1];
            const db = this.getCurrentDb();
            if (!db.tables[tblName]) {
                return { success: false, message: `Table '${tblName}' not found.` };
            }
            const count = db.tables[tblName].rows.length;
            db.tables[tblName].rows = [];
            this.save();
            return { success: true, message: `All data from table '${tblName}' has been deleted (${count} rows).` };
        }
        // 4. CREATE DATABASE db_name;
        const createDbMatch = clean.match(/^CREATE\s+DATABASE\s+([a-zA-Z0-9_\-]+);?/i);
        if (createDbMatch) {
            const newDb = createDbMatch[1];
            if (!this.content.databases[newDb]) {
                this.content.databases[newDb] = { name: newDb, tables: {} };
                this.save();
            }
            return { success: true, message: `Database '${newDb}' created.` };
        }
        // 5. USE db_name;
        const useDbMatch = clean.match(/^USE\s+([a-zA-Z0-9_\-]+);?/i);
        if (useDbMatch) {
            const targetDb = useDbMatch[1];
            if (this.useDatabase(targetDb)) {
                return { success: true, message: `Active database: '${targetDb}'.` };
            }
            return { success: false, message: `Database '${targetDb}' does not exist.` };
        }
        // 6. DROP TABLE table_name;
        const dropTableMatch = clean.match(/^DROP\s+TABLE\s+([a-zA-Z0-9_\-]+);?/i);
        if (dropTableMatch) {
            const tblName = dropTableMatch[1];
            const db = this.getCurrentDb();
            if (!db.tables[tblName]) {
                return { success: false, message: `Table '${tblName}' does not exist.` };
            }
            // Check foreign key references
            const referencingTables = [];
            for (const otherName of Object.keys(db.tables)) {
                if (otherName === tblName)
                    continue;
                const otherTbl = db.tables[otherName];
                for (const fk of otherTbl.foreignKeys || []) {
                    if (fk.foreignTable.toLowerCase() === tblName.toLowerCase()) {
                        referencingTables.push(otherName);
                    }
                }
            }
            if (referencingTables.length > 0) {
                return {
                    success: false,
                    message: `Cannot delete table '${tblName}': it is referenced by foreign key in table(s) [${referencingTables.join(', ')}]. Delete referencing tables first or run 'DROP ALL TABLES;'.`
                };
            }
            delete db.tables[tblName];
            this.save();
            return { success: true, message: `Table '${tblName}' deleted successfully.` };
        }
        // 7. CREATE TABLE table_name (...)
        const createTblMatch = clean.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_\-]+)\s*\(([\s\S]*)\);?/i);
        if (createTblMatch) {
            const tblName = createTblMatch[1];
            const body = createTblMatch[2];
            const db = this.getCurrentDb();
            if (db.tables[tblName]) {
                return { success: false, message: `Table '${tblName}' already exists.` };
            }
            const colDefs = [];
            const fks = [];
            const parts = body.split(',').map(s => s.trim()).filter(Boolean);
            for (const part of parts) {
                // FOREIGN KEY (col) REFERENCES refTable(refCol)
                const fkMatch = part.match(/FOREIGN\s+KEY\s*\(([a-zA-Z0-9_\-]+)\)\s*REFERENCES\s+([a-zA-Z0-9_\-]+)\s*\(([a-zA-Z0-9_\-]+)\)/i);
                if (fkMatch) {
                    fks.push({
                        column: fkMatch[1],
                        foreignTable: fkMatch[2],
                        foreignColumn: fkMatch[3]
                    });
                    continue;
                }
                // Col definition: id INT PRIMARY KEY
                const tokens = part.split(/\s+/);
                if (tokens.length >= 2) {
                    const cName = tokens[0];
                    const cType = tokens[1];
                    const isPrimary = /PRIMARY\s+KEY/i.test(part);
                    colDefs.push({ name: cName, type: cType, isPrimary });
                }
            }
            db.tables[tblName] = {
                name: tblName,
                columns: colDefs,
                foreignKeys: fks,
                rows: []
            };
            this.save();
            return { success: true, message: `Table '${tblName}' created with ${colDefs.length} column(s).` };
        }
        // 8. INSERT INTO table_name VALUES (...)
        const insertMatch = clean.match(/^INSERT\s+INTO\s+([a-zA-Z0-9_\-]+)(?:\s*\((.*?)\))?\s*VALUES\s*\(([\s\S]*)\);?/i);
        if (insertMatch) {
            const tblName = insertMatch[1];
            const explicitCols = insertMatch[2] ? insertMatch[2].split(',').map(s => s.trim()) : null;
            const rawValues = insertMatch[3].split(',').map(s => {
                let v = s.trim();
                if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                    return v.slice(1, -1);
                }
                if (!isNaN(Number(v)))
                    return Number(v);
                if (v.toLowerCase() === 'true')
                    return true;
                if (v.toLowerCase() === 'false')
                    return false;
                if (v.toLowerCase() === 'null')
                    return null;
                return v;
            });
            const db = this.getCurrentDb();
            if (!db.tables[tblName]) {
                return { success: false, message: `Table '${tblName}' not found.` };
            }
            const tbl = db.tables[tblName];
            const rowObj = {};
            if (explicitCols) {
                explicitCols.forEach((col, i) => {
                    rowObj[col] = rawValues[i] !== undefined ? rawValues[i] : null;
                });
            }
            else {
                tbl.columns.forEach((col, i) => {
                    rowObj[col.name] = rawValues[i] !== undefined ? rawValues[i] : null;
                });
            }
            // Unique primary key verification
            const pkCol = tbl.columns.find(c => c.isPrimary);
            if (pkCol && rowObj[pkCol.name] !== undefined) {
                const exists = tbl.rows.some(r => r[pkCol.name] === rowObj[pkCol.name]);
                if (exists) {
                    return { success: false, message: `Error: Unique primary key violation for '${pkCol.name}' = ${rowObj[pkCol.name]}.` };
                }
            }
            tbl.rows.push(rowObj);
            this.save();
            return { success: true, message: `1 row inserted into '${tblName}'.`, affectedRows: 1 };
        }
        // 9. SELECT * FROM table_name [WHERE col = val]
        const selectMatch = clean.match(/^SELECT\s+(.*?)\s+FROM\s+([a-zA-Z0-9_\-]+)(?:\s+WHERE\s+(.*?))?;?/i);
        if (selectMatch) {
            const fields = selectMatch[1].trim();
            const tblName = selectMatch[2];
            const whereClause = selectMatch[3] ? selectMatch[3].trim() : null;
            const db = this.getCurrentDb();
            if (!db.tables[tblName]) {
                return { success: false, message: `Table '${tblName}' not found.` };
            }
            let rows = db.tables[tblName].rows;
            if (whereClause) {
                const eqMatch = whereClause.match(/^([a-zA-Z0-9_\-]+)\s*=\s*(.*)$/);
                if (eqMatch) {
                    const col = eqMatch[1].trim();
                    let targetVal = eqMatch[2].trim().replace(/^["']|["']$/g, '');
                    if (!isNaN(Number(targetVal)))
                        targetVal = Number(targetVal);
                    rows = rows.filter(r => r[col] == targetVal);
                }
            }
            return { success: true, data: rows };
        }
        // 10. DELETE FROM table_name WHERE ...
        const deleteMatch = clean.match(/^DELETE\s+FROM\s+([a-zA-Z0-9_\-]+)(?:\s+WHERE\s+(.*?))?;?/i);
        if (deleteMatch) {
            const tblName = deleteMatch[1];
            const whereClause = deleteMatch[2] ? deleteMatch[2].trim() : null;
            const db = this.getCurrentDb();
            if (!db.tables[tblName]) {
                return { success: false, message: `Table '${tblName}' not found.` };
            }
            const tbl = db.tables[tblName];
            if (!whereClause) {
                const c = tbl.rows.length;
                tbl.rows = [];
                this.save();
                return { success: true, message: `${c} row(s) deleted.`, affectedRows: c };
            }
            const eqMatch = whereClause.match(/^([a-zA-Z0-9_\-]+)\s*=\s*(.*)$/);
            if (eqMatch) {
                const col = eqMatch[1].trim();
                let targetVal = eqMatch[2].trim().replace(/^["']|["']$/g, '');
                if (!isNaN(Number(targetVal)))
                    targetVal = Number(targetVal);
                const before = tbl.rows.length;
                tbl.rows = tbl.rows.filter(r => r[col] != targetVal);
                const affected = before - tbl.rows.length;
                this.save();
                return { success: true, message: `${affected} row(s) deleted.`, affectedRows: affected };
            }
        }
        return { success: false, message: `Unrecognized SQL command: ${clean}` };
    }
    getTables() {
        return this.getCurrentDb().tables;
    }
    getRawContent() {
        return this.content;
    }
}
exports.CryptedLolpaonDatabase = CryptedLolpaonDatabase;
// Enregistrement stdlib pour LLP
function registerCllpdb(env) {
    const cllpObj = new instance_1.Instance("CllpdbService");
    cllpObj.Name = "CLLPDB";
    cllpObj.SetProperty("Open", {
        type: "native_fn",
        call: (args) => {
            const p = args[0]?.type === "string" ? args[0].value : "app.cllpdb";
            const key = args[1]?.type === "string" ? args[1].value : undefined;
            let resolvedDbPath = path.resolve(process.cwd(), p);
            if (!fs.existsSync(resolvedDbPath)) {
                const possible = [
                    path.resolve(process.cwd(), "examples/product_management", p),
                    path.resolve(process.cwd(), "data", p)
                ];
                for (const candidate of possible) {
                    if (fs.existsSync(candidate)) {
                        resolvedDbPath = candidate;
                        break;
                    }
                }
            }
            const db = new CryptedLolpaonDatabase(resolvedDbPath, key);
            const connObj = new instance_1.Instance("CllpdbConnection");
            connObj.Name = path.basename(resolvedDbPath);
            connObj.SetProperty("StartSession", {
                type: "native_fn",
                call: (callArgs) => {
                    const user = callArgs[0]?.type === "string" ? callArgs[0].value : "";
                    const pass = callArgs[1]?.type === "string" ? callArgs[1].value : "";
                    const duration = callArgs[2]?.type === "number" ? callArgs[2].value : undefined;
                    const res = db.startSession(user, pass, duration);
                    return (0, values_1.MK_BOOL)(res.success);
                }
            });
            connObj.SetProperty("IsSessionActive", {
                type: "native_fn",
                call: () => (0, values_1.MK_BOOL)(db.isSessionActive())
            });
            connObj.SetProperty("GetRemainingSession", {
                type: "native_fn",
                call: () => (0, values_1.MK_NUMBER)(db.getRemainingSessionSeconds())
            });
            connObj.SetProperty("EndSession", {
                type: "native_fn",
                call: () => {
                    db.endSession();
                    return (0, values_1.MK_BOOL)(true);
                }
            });
            connObj.SetProperty("CloseSession", {
                type: "native_fn",
                call: () => {
                    db.endSession();
                    return (0, values_1.MK_BOOL)(true);
                }
            });
            connObj.SetProperty("Disconnect", {
                type: "native_fn",
                call: () => {
                    db.endSession();
                    return (0, values_1.MK_BOOL)(true);
                }
            });
            connObj.SetProperty("Execute", {
                type: "native_fn",
                call: (callArgs) => {
                    const sql = callArgs[0]?.type === "string" ? callArgs[0].value : "";
                    const res = db.executeSql(sql);
                    return (0, values_1.MK_STRING)(JSON.stringify(res));
                }
            });
            connObj.SetProperty("Query", {
                type: "native_fn",
                call: (callArgs) => {
                    const sql = callArgs[0]?.type === "string" ? callArgs[0].value : "";
                    const res = db.executeSql(sql);
                    return (0, values_1.MK_STRING)(JSON.stringify(res.data || []));
                }
            });
            return { type: "instance", instance: connObj };
        }
    });
    env.declareVar("CLLPDB", { type: "instance", instance: cllpObj }, "General");
}
