import { Environment } from "../runtime/environment";
export declare class GlobalNetworkProfiler {
    private static instance;
    rxBytes: number;
    txBytes: number;
    rxPackets: number;
    txPackets: number;
    startTime: number;
    history: Array<{
        timestamp: number;
        rxSpeed: number;
        txSpeed: number;
        cpu: number;
        ram: number;
    }>;
    private lastSampleTime;
    private lastRx;
    private lastTx;
    private constructor();
    static getInstance(): GlobalNetworkProfiler;
    recordTx(bytes: number): void;
    recordRx(bytes: number): void;
    reset(): void;
    private sampleMetrics;
    getStats(): {
        rxBytes: number;
        txBytes: number;
        rxPackets: number;
        txPackets: number;
        uptimeSeconds: number;
        memoryRssMB: number;
        memoryHeapMB: number;
        history: {
            timestamp: number;
            rxSpeed: number;
            txSpeed: number;
            cpu: number;
            ram: number;
        }[];
    };
}
export declare const profiler: GlobalNetworkProfiler;
export declare function calculateChecksum(buf: Buffer): number;
export declare function calculateCRC32(buf: Buffer): number;
export declare function registerOSI(env: Environment): void;
