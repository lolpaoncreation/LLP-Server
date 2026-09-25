import * as http from "http";
export interface GuiServerOptions {
    projectDir?: string;
    port?: number;
    openBrowser?: boolean;
    windowWidth?: number;
    windowHeight?: number;
    locked?: boolean;
    devMode?: boolean;
    silence?: boolean;
    runBack?: boolean;
}
export declare let currentServerInstance: http.Server | null;
export declare let currentAppConfig: {
    windowWidth: number;
    windowHeight: number;
    locked: boolean;
    devMode: boolean;
    silence: boolean;
    runBack: boolean;
};
export declare function stopGuiApplication(): void;
export declare function setAppLock(locked?: boolean): void;
export declare function getAppConfig(): {
    windowWidth: number;
    windowHeight: number;
    locked: boolean;
    devMode: boolean;
    silence: boolean;
    runBack: boolean;
};
export declare function startGuiApplication(options?: GuiServerOptions): Promise<{
    server: http.Server;
    url: string;
    port: number;
}>;
export declare function findProjectIllpFile(projectDir: string): {
    illpPath: string;
    illpsPath: string;
} | null;
export declare function parseIllpTree(code: string): any[];
