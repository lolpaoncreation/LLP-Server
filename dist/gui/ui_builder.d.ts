import * as http from "http";
export interface UiBuilderOptions {
    filePath?: string;
    port?: number;
    openBrowser?: boolean;
}
export declare function convertIllpsToCss(illps: string): string;
export declare function getUiBuilderHtml(options: {
    fileName: string;
    illpContent: string;
    illpsContent?: string;
    deviceId?: string;
    isStandalone?: boolean;
}): string;
/**
 * Starts a standalone HTTP server delivering the full LLP UI Builder in the browser.
 */
export declare function startUiBuilderServer(options?: UiBuilderOptions): Promise<{
    server: http.Server;
    url: string;
    port: number;
}>;
