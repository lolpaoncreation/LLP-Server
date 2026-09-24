import { Environment } from "../runtime/environment";
export interface ColumnDef {
    name: string;
    type: string;
    isPrimary?: boolean;
}
export interface ForeignKeyDef {
    column: string;
    foreignTable: string;
    foreignColumn: string;
}
export interface TableSchema {
    name: string;
    columns: ColumnDef[];
    foreignKeys: ForeignKeyDef[];
    rows: any[];
}
export interface DatabaseSchema {
    name: string;
    tables: Map<string, TableSchema>;
}
export interface CllpdbFileContent {
    magic: string;
    adminUser: string;
    adminPassHash: string;
    createdAt: number;
    updatedAt: number;
    databases: {
        [dbName: string]: {
            name: string;
            tables: {
                [tableName: string]: {
                    name: string;
                    columns: ColumnDef[];
                    foreignKeys: ForeignKeyDef[];
                    rows: any[];
                };
            };
        };
    };
}
export declare class CryptedLolpaonDatabase {
    filePath: string;
    private projectKey;
    private sessionToken;
    private sessionExpiresAt;
    private content;
    private currentDbName;
    constructor(filePath: string, customKey?: string);
    static isSystemAdmin(): boolean;
    private hashPassword;
    private getCipherKey;
    load(): boolean;
    save(): boolean;
    initializeNew(adminUser: string, adminPass: string): boolean;
    startSession(username: string, password: string, durationSeconds?: number): {
        success: boolean;
        message: string;
        remainingSeconds: number;
    };
    isSessionActive(): boolean;
    getRemainingSessionSeconds(): number;
    endSession(): void;
    changeCredentials(newUsername: string, newPassword: string): {
        success: boolean;
        message: string;
    };
    getDatabases(): string[];
    useDatabase(dbName: string): boolean;
    private getCurrentDb;
    executeSql(sql: string): {
        success: boolean;
        message?: string;
        data?: any[];
        affectedRows?: number;
    };
    getTables(): {
        [tableName: string]: TableSchema;
    };
    getRawContent(): CllpdbFileContent;
}
export declare function registerCllpdb(env: Environment): void;
