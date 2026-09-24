import { Environment } from "../runtime/environment";
export declare class SessionManager {
    private static instance;
    private sessionId;
    private sessionData;
    private storageDir;
    private encryptionKey;
    private isActive;
    private constructor();
    static getInstance(): SessionManager;
    private getSessionFilePath;
    start(customId?: string): string;
    save(): boolean;
    set(key: string, value: any): void;
    get(key: string, defaultValue?: any): any;
    has(key: string): boolean;
    remove(key: string): boolean;
    clear(): void;
    destroy(): boolean;
    getId(): string;
    getAll(): {
        [key: string]: any;
    };
    isStarted(): boolean;
}
export declare function registerSession(env: Environment): void;
