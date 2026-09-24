import { Environment } from "../runtime/environment";
export declare class DeviceIdentityManager {
    private static instance;
    private cachedDeviceId;
    private cachedFingerprint;
    private hardwareSecret;
    private privateKey;
    private publicKeyPem;
    private isClonedOrTampered;
    private anchorFilePath;
    private keySealFilePath;
    private pubKeyFilePath;
    private constructor();
    static getInstance(): DeviceIdentityManager;
    /**
     * Helper to execute a command synchronously without throwing.
     */
    private runCommand;
    /**
     * Collects motherboard BIOS/UEFI UUID and Serial Number.
     */
    private getMotherboardIdentity;
    /**
     * Collects CPU Model, Family, and Processor ID.
     */
    private getCpuIdentity;
    /**
     * Collects System Root Disk Volume Serial Number or OS installation MachineGuid.
     */
    private getSystemDiskIdentity;
    /**
     * Collects and derives the Hardware Fingerprint (DeviceFingerprint) using HMAC-SHA256.
     * RawData = MotherboardUUID + CPU_ID + SystemDiskUUID
     * DeviceFingerprint = HMAC-SHA256(Key: "LLP_CORE_SALT_v1", Message: RawData)
     */
    collectHardwareFingerprint(): {
        rawData: string;
        fingerprint: string;
    };
    /**
     * Initializes or verifies the cryptographic hardware anchor and seals/unseals the Ed25519 keypair.
     */
    private initializeIdentity;
    /**
     * Seals the Ed25519 private key on disk using AES-256-GCM keyed by DeviceFingerprint.
     * If copied to a different machine, unsealing fails cryptographically.
     */
    private initializeSealedKeypair;
    /**
     * Returns the immutable Device ID.
     */
    getDeviceId(): string;
    /**
     * Returns the derived DeviceFingerprint (HMAC-SHA256).
     */
    getDeviceFingerprint(): string;
    /**
     * Returns the public key in PEM format.
     */
    getPublicKeyPem(): string;
    /**
     * Checks if the private key was successfully unsealed with this host's authentic HWID.
     */
    isKeySealed(): boolean;
    /**
     * Signs an RPC or HTTP frame using the machine-sealed Ed25519 private key.
     * StringToSign = Nonce + "\n" + Timestamp + "\n" + HTTP_Method + "\n" + CanonicalPayload
     */
    signPayload(method: string, path: string, payload: string): {
        deviceId: string;
        nonce: string;
        timestamp: string;
        signature: string;
        publicKeyPem: string;
    };
    /**
     * Verifies an RPC payload signature using the device's Ed25519 public key.
     * Enforces a 30-second timestamp freshness window to block delayed replays.
     */
    static verifyPayloadSignature(publicKeyPem: string, method: string, path: string, payload: string, nonce: string, timestampStr: string, signatureHex: string, maxAgeMs?: number): {
        valid: boolean;
        error?: string;
    };
    /**
     * Legacy backward-compatible device token generation (deviceId:timestamp:nonce:signature)
     */
    generateDeviceToken(payload?: string): string;
    /**
     * Legacy backward-compatible signature.
     */
    signData(data: string): string;
    /**
     * Legacy backward-compatible token verification.
     */
    verifyDeviceToken(token: string, payload?: string, maxAgeMs?: number): boolean;
    /**
     * Static remote token verification for servers receiving legacy tokens.
     */
    static verifyRemoteToken(token: string, secret?: string, payload?: string, maxAgeMs?: number): {
        valid: boolean;
        error?: string;
    };
    /**
     * Returns OS platform name
     */
    getPlatform(): string;
    /**
     * Returns structured hardware info (non-sensitive)
     */
    getInfo(): {
        [key: string]: any;
    };
    /**
     * Checks if device integrity anchor is verified and not modified
     */
    isTrusted(): boolean;
}
/**
 * Register the `Device` standard library module into the LLP runtime environment.
 */
export declare function registerDevice(env: Environment): void;
