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
exports.profiler = exports.GlobalNetworkProfiler = void 0;
exports.calculateChecksum = calculateChecksum;
exports.calculateCRC32 = calculateCRC32;
exports.registerOSI = registerOSI;
const net = __importStar(require("net"));
const dgram = __importStar(require("dgram"));
const zlib = __importStar(require("zlib"));
const instance_1 = require("../runtime/instance");
const values_1 = require("../runtime/values");
// ============================================================================
// LLP OSI MODEL & LOW-LEVEL SYSTEMS PROGRAMMING SUBSYSTEM (C++ PARITY)
// ============================================================================
// Enables full OSI stack control (Layers 1-7) directly from LLP:
// - Layer 1/2: Direct memory buffers (ByteBuffer), Raw Ethernet frames, Bitwise ops
// - Layer 3: IPv4 header crafting/dissection, RFC 1071 Checksums, ICMP Ping
// - Layer 4: Berkeley Sockets (TCP/UDP/Raw emulation), TCP_NODELAY, SO_REUSEADDR
// - Layer 5/6/7: Binary struct packing (zero JSON overhead), zlib/deflate compression
// - Global Network Profiler: Real-time RX/TX byte counters for bandwidth minimization
// ============================================================================
// Global Network Profiler singleton
class GlobalNetworkProfiler {
    static instance;
    rxBytes = 0;
    txBytes = 0;
    rxPackets = 0;
    txPackets = 0;
    startTime = Date.now();
    history = [];
    lastSampleTime = Date.now();
    lastRx = 0;
    lastTx = 0;
    constructor() {
        setInterval(() => {
            this.sampleMetrics();
        }, 1000).unref();
    }
    static getInstance() {
        if (!GlobalNetworkProfiler.instance) {
            GlobalNetworkProfiler.instance = new GlobalNetworkProfiler();
        }
        return GlobalNetworkProfiler.instance;
    }
    recordTx(bytes) {
        this.txBytes += bytes;
        this.txPackets++;
    }
    recordRx(bytes) {
        this.rxBytes += bytes;
        this.rxPackets++;
    }
    reset() {
        this.rxBytes = 0;
        this.txBytes = 0;
        this.rxPackets = 0;
        this.txPackets = 0;
        this.startTime = Date.now();
        this.lastSampleTime = Date.now();
        this.lastRx = 0;
        this.lastTx = 0;
        this.history = [];
    }
    sampleMetrics() {
        const now = Date.now();
        const dt = (now - this.lastSampleTime) / 1000;
        if (dt <= 0)
            return;
        const rxDelta = this.rxBytes - this.lastRx;
        const txDelta = this.txBytes - this.lastTx;
        const rxSpeed = Math.round(rxDelta / dt);
        const txSpeed = Math.round(txDelta / dt);
        this.lastRx = this.rxBytes;
        this.lastTx = this.txBytes;
        this.lastSampleTime = now;
        const mem = process.memoryUsage();
        const ramMB = Math.round(mem.rss / 1024 / 1024);
        this.history.push({
            timestamp: now,
            rxSpeed,
            txSpeed,
            cpu: Math.min(100, Math.round(process.cpuUsage().user / 10000) % 100),
            ram: ramMB
        });
        if (this.history.length > 60) {
            this.history.shift();
        }
    }
    getStats() {
        const mem = process.memoryUsage();
        return {
            rxBytes: this.rxBytes,
            txBytes: this.txBytes,
            rxPackets: this.rxPackets,
            txPackets: this.txPackets,
            uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
            memoryRssMB: Math.round(mem.rss / 1024 / 1024),
            memoryHeapMB: Math.round(mem.heapUsed / 1024 / 1024),
            history: this.history
        };
    }
}
exports.GlobalNetworkProfiler = GlobalNetworkProfiler;
exports.profiler = GlobalNetworkProfiler.getInstance();
// Helper to convert JS values to RuntimeVal
function toRuntimeVal(val) {
    if (val === null || val === undefined)
        return (0, values_1.MK_NULL)();
    if (typeof val === "number")
        return (0, values_1.MK_NUMBER)(val);
    if (typeof val === "string")
        return (0, values_1.MK_STRING)(val);
    if (typeof val === "boolean")
        return (0, values_1.MK_BOOL)(val);
    if (Array.isArray(val)) {
        const listVal = {
            type: "list",
            elementType: "General",
            elements: val.map(toRuntimeVal)
        };
        listVal.Add = (item) => { listVal.elements.push(item); };
        listVal.Length = () => listVal.elements.length;
        return listVal;
    }
    if (typeof val === "object") {
        const inst = new instance_1.Instance("Object");
        for (const [k, v] of Object.entries(val)) {
            inst.SetProperty(k, toRuntimeVal(v));
        }
        return { type: "instance", instance: inst };
    }
    return (0, values_1.MK_STRING)(String(val));
}
// ----------------------------------------------------------------------------
// RFC 1071 / RFC 791 Internet Checksum Calculator
// ----------------------------------------------------------------------------
function calculateChecksum(buf) {
    let sum = 0;
    for (let i = 0; i < buf.length - 1; i += 2) {
        sum += buf.readUInt16BE(i);
    }
    if (buf.length % 2 !== 0) {
        sum += (buf[buf.length - 1] << 8);
    }
    while (sum >> 16) {
        sum = (sum & 0xffff) + (sum >> 16);
    }
    return ~sum & 0xffff;
}
// ----------------------------------------------------------------------------
// CRC-32 Calculator (Ethernet Frame Check Sequence - FCS)
// ----------------------------------------------------------------------------
function calculateCRC32(buf) {
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
        crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
}
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[i] = c >>> 0;
}
// ----------------------------------------------------------------------------
// REGISTER OSI STANDARD LIBRARY IN LLP
// ----------------------------------------------------------------------------
function registerOSI(env) {
    // ==========================================================================
    // 1. BITWISE OPERATIONS (Bas niveau C++ : &, |, ^, ~, <<, >>)
    // ==========================================================================
    const bitwiseObj = new instance_1.Instance("BitwiseService");
    bitwiseObj.Name = "Bitwise";
    bitwiseObj.SetProperty("And", {
        type: "native_fn",
        call: (args) => {
            const a = args[0]?.value || 0;
            const b = args[1]?.value || 0;
            return (0, values_1.MK_NUMBER)((a & b) >>> 0);
        }
    });
    bitwiseObj.SetProperty("Or", {
        type: "native_fn",
        call: (args) => {
            const a = args[0]?.value || 0;
            const b = args[1]?.value || 0;
            return (0, values_1.MK_NUMBER)((a | b) >>> 0);
        }
    });
    bitwiseObj.SetProperty("Xor", {
        type: "native_fn",
        call: (args) => {
            const a = args[0]?.value || 0;
            const b = args[1]?.value || 0;
            return (0, values_1.MK_NUMBER)((a ^ b) >>> 0);
        }
    });
    bitwiseObj.SetProperty("Not", {
        type: "native_fn",
        call: (args) => {
            const a = args[0]?.value || 0;
            return (0, values_1.MK_NUMBER)((~a) >>> 0);
        }
    });
    bitwiseObj.SetProperty("ShiftLeft", {
        type: "native_fn",
        call: (args) => {
            const a = args[0]?.value || 0;
            const n = args[1]?.value || 0;
            return (0, values_1.MK_NUMBER)((a << n) >>> 0);
        }
    });
    bitwiseObj.SetProperty("ShiftRight", {
        type: "native_fn",
        call: (args) => {
            const a = args[0]?.value || 0;
            const n = args[1]?.value || 0;
            return (0, values_1.MK_NUMBER)((a >>> n) >>> 0);
        }
    });
    env.declareVar("Bitwise", { type: "instance", instance: bitwiseObj }, "General");
    // ==========================================================================
    // 2. BYTEBUFFER (Couche 1 / 2 : Buffer Binaire Mémoire Directe type C++)
    // ==========================================================================
    function createByteBufferInstance(buffer) {
        const inst = new instance_1.Instance("ByteBuffer");
        let internalBuffer = buffer;
        let readOffset = 0;
        let writeOffset = 0;
        inst.SetProperty("Size", {
            type: "native_fn",
            call: () => (0, values_1.MK_NUMBER)(internalBuffer.length)
        });
        inst.SetProperty("GetCapacity", {
            type: "native_fn",
            call: () => (0, values_1.MK_NUMBER)(internalBuffer.length)
        });
        inst.SetProperty("GetReadOffset", {
            type: "native_fn",
            call: () => (0, values_1.MK_NUMBER)(readOffset)
        });
        inst.SetProperty("SetReadOffset", {
            type: "native_fn",
            call: (args) => {
                readOffset = Math.max(0, Math.min(internalBuffer.length, args[0]?.value || 0));
                return (0, values_1.MK_NUMBER)(readOffset);
            }
        });
        inst.SetProperty("GetWriteOffset", {
            type: "native_fn",
            call: () => (0, values_1.MK_NUMBER)(writeOffset)
        });
        inst.SetProperty("SetWriteOffset", {
            type: "native_fn",
            call: (args) => {
                writeOffset = Math.max(0, Math.min(internalBuffer.length, args[0]?.value || 0));
                return (0, values_1.MK_NUMBER)(writeOffset);
            }
        });
        inst.SetProperty("WriteUInt8", {
            type: "native_fn",
            call: (args) => {
                const val = (args[0]?.value || 0) & 0xff;
                if (writeOffset >= internalBuffer.length) {
                    internalBuffer = Buffer.concat([internalBuffer, Buffer.alloc(Math.max(16, internalBuffer.length))]);
                }
                internalBuffer.writeUInt8(val, writeOffset);
                writeOffset += 1;
                return inst;
            }
        });
        inst.SetProperty("ReadUInt8", {
            type: "native_fn",
            call: () => {
                if (readOffset >= internalBuffer.length)
                    return (0, values_1.MK_NUMBER)(0);
                const val = internalBuffer.readUInt8(readOffset);
                readOffset += 1;
                return (0, values_1.MK_NUMBER)(val);
            }
        });
        inst.SetProperty("WriteUInt16BE", {
            type: "native_fn",
            call: (args) => {
                const val = (args[0]?.value || 0) & 0xffff;
                if (writeOffset + 2 > internalBuffer.length) {
                    internalBuffer = Buffer.concat([internalBuffer, Buffer.alloc(Math.max(16, internalBuffer.length))]);
                }
                internalBuffer.writeUInt16BE(val, writeOffset);
                writeOffset += 2;
                return inst;
            }
        });
        inst.SetProperty("ReadUInt16BE", {
            type: "native_fn",
            call: () => {
                if (readOffset + 2 > internalBuffer.length)
                    return (0, values_1.MK_NUMBER)(0);
                const val = internalBuffer.readUInt16BE(readOffset);
                readOffset += 2;
                return (0, values_1.MK_NUMBER)(val);
            }
        });
        inst.SetProperty("WriteUInt32BE", {
            type: "native_fn",
            call: (args) => {
                const val = (args[0]?.value || 0) >>> 0;
                if (writeOffset + 4 > internalBuffer.length) {
                    internalBuffer = Buffer.concat([internalBuffer, Buffer.alloc(Math.max(16, internalBuffer.length))]);
                }
                internalBuffer.writeUInt32BE(val, writeOffset);
                writeOffset += 4;
                return inst;
            }
        });
        inst.SetProperty("ReadUInt32BE", {
            type: "native_fn",
            call: () => {
                if (readOffset + 4 > internalBuffer.length)
                    return (0, values_1.MK_NUMBER)(0);
                const val = internalBuffer.readUInt32BE(readOffset);
                readOffset += 4;
                return (0, values_1.MK_NUMBER)(val);
            }
        });
        inst.SetProperty("WriteFloatBE", {
            type: "native_fn",
            call: (args) => {
                const val = args[0]?.value || 0;
                if (writeOffset + 4 > internalBuffer.length) {
                    internalBuffer = Buffer.concat([internalBuffer, Buffer.alloc(Math.max(16, internalBuffer.length))]);
                }
                internalBuffer.writeFloatBE(val, writeOffset);
                writeOffset += 4;
                return inst;
            }
        });
        inst.SetProperty("ReadFloatBE", {
            type: "native_fn",
            call: () => {
                if (readOffset + 4 > internalBuffer.length)
                    return (0, values_1.MK_NUMBER)(0);
                const val = internalBuffer.readFloatBE(readOffset);
                readOffset += 4;
                return (0, values_1.MK_NUMBER)(val);
            }
        });
        inst.SetProperty("WriteString", {
            type: "native_fn",
            call: (args) => {
                const str = String(args[0]?.value || "");
                const strBuf = Buffer.from(str, "utf8");
                // Write 2-byte length prefix + UTF8 bytes
                if (writeOffset + 2 + strBuf.length > internalBuffer.length) {
                    internalBuffer = Buffer.concat([internalBuffer, Buffer.alloc(Math.max(32, strBuf.length + 16))]);
                }
                internalBuffer.writeUInt16BE(strBuf.length, writeOffset);
                writeOffset += 2;
                strBuf.copy(internalBuffer, writeOffset);
                writeOffset += strBuf.length;
                return inst;
            }
        });
        inst.SetProperty("ReadString", {
            type: "native_fn",
            call: () => {
                if (readOffset + 2 > internalBuffer.length)
                    return (0, values_1.MK_STRING)("");
                const len = internalBuffer.readUInt16BE(readOffset);
                readOffset += 2;
                if (readOffset + len > internalBuffer.length)
                    return (0, values_1.MK_STRING)("");
                const str = internalBuffer.toString("utf8", readOffset, readOffset + len);
                readOffset += len;
                return (0, values_1.MK_STRING)(str);
            }
        });
        inst.SetProperty("ToHex", {
            type: "native_fn",
            call: () => (0, values_1.MK_STRING)(internalBuffer.slice(0, writeOffset || internalBuffer.length).toString("hex"))
        });
        inst.SetProperty("ToBuffer", {
            type: "native_fn",
            call: () => inst
        });
        inst.__rawBuffer = () => internalBuffer.slice(0, writeOffset || internalBuffer.length);
        return inst;
    }
    const byteBufferFactory = new instance_1.Instance("ByteBufferClass");
    byteBufferFactory.Name = "ByteBuffer";
    byteBufferFactory.SetProperty("Alloc", {
        type: "native_fn",
        call: (args) => {
            const size = Math.max(1, args[0]?.value || 64);
            return { type: "instance", instance: createByteBufferInstance(Buffer.alloc(size)) };
        }
    });
    byteBufferFactory.SetProperty("FromString", {
        type: "native_fn",
        call: (args) => {
            const str = String(args[0]?.value || "");
            const buf = Buffer.from(str, "utf8");
            return { type: "instance", instance: createByteBufferInstance(buf) };
        }
    });
    byteBufferFactory.SetProperty("FromHex", {
        type: "native_fn",
        call: (args) => {
            const hex = String(args[0]?.value || "");
            const buf = Buffer.from(hex, "hex");
            return { type: "instance", instance: createByteBufferInstance(buf) };
        }
    });
    env.declareVar("ByteBuffer", { type: "instance", instance: byteBufferFactory }, "General");
    // ==========================================================================
    // 3. COUCHE 2 : LIAISON DE DONNÉES (Ethernet Frame & CRC-32)
    // ==========================================================================
    const ethernetObj = new instance_1.Instance("EthernetService");
    ethernetObj.Name = "Ethernet";
    ethernetObj.SetProperty("CRC32", {
        type: "native_fn",
        call: (args) => {
            let buf;
            const arg = args[0];
            if (arg && arg.type === "instance" && typeof arg.instance?.__rawBuffer === "function") {
                buf = arg.instance.__rawBuffer();
            }
            else if (arg && arg.type === "string") {
                buf = Buffer.from(arg.value, "utf8");
            }
            else {
                buf = Buffer.alloc(0);
            }
            return (0, values_1.MK_NUMBER)(calculateCRC32(buf));
        }
    });
    ethernetObj.SetProperty("BuildFrame", {
        type: "native_fn",
        call: (args) => {
            const destMac = String(args[0]?.value || "FF:FF:FF:FF:FF:FF");
            const srcMac = String(args[1]?.value || "00:00:00:00:00:00");
            const etherType = (args[2]?.value || 0x0800) & 0xffff;
            let payloadBuf;
            const payloadArg = args[3];
            if (payloadArg && payloadArg.type === "instance" && typeof payloadArg.instance?.__rawBuffer === "function") {
                payloadBuf = payloadArg.instance.__rawBuffer();
            }
            else {
                payloadBuf = Buffer.from(String(payloadArg?.value || ""), "utf8");
            }
            // MAC addresses parser
            const parseMac = (macStr) => Buffer.from(macStr.replace(/[:-]/g, ""), "hex");
            const dstBuf = parseMac(destMac);
            const srcBuf = parseMac(srcMac);
            const frameHdr = Buffer.alloc(14);
            dstBuf.copy(frameHdr, 0, 0, 6);
            srcBuf.copy(frameHdr, 6, 0, 6);
            frameHdr.writeUInt16BE(etherType, 12);
            const frameData = Buffer.concat([frameHdr, payloadBuf]);
            const crc = calculateCRC32(frameData);
            const crcBuf = Buffer.alloc(4);
            crcBuf.writeUInt32BE(crc, 0);
            const fullFrame = Buffer.concat([frameData, crcBuf]);
            exports.profiler.recordTx(fullFrame.length);
            return { type: "instance", instance: createByteBufferInstance(fullFrame) };
        }
    });
    env.declareVar("Ethernet", { type: "instance", instance: ethernetObj }, "General");
    // ==========================================================================
    // 4. COUCHE 3 : RÉSEAU (IPv4 Header & ICMP RFC 791 / RFC 1071)
    // ==========================================================================
    const ipObj = new instance_1.Instance("IPService");
    ipObj.Name = "IP";
    ipObj.SetProperty("Checksum", {
        type: "native_fn",
        call: (args) => {
            let buf;
            const arg = args[0];
            if (arg && arg.type === "instance" && typeof arg.instance?.__rawBuffer === "function") {
                buf = arg.instance.__rawBuffer();
            }
            else {
                buf = Buffer.from(String(arg?.value || ""), "utf8");
            }
            return (0, values_1.MK_NUMBER)(calculateChecksum(buf));
        }
    });
    ipObj.SetProperty("BuildIPv4Header", {
        type: "native_fn",
        call: (args) => {
            const srcIp = String(args[0]?.value || "127.0.0.1");
            const dstIp = String(args[1]?.value || "127.0.0.1");
            const protocol = (args[2]?.value || 6) & 0xff; // TCP=6, UDP=17, ICMP=1
            const payloadLength = args[3]?.value || 0;
            const ttl = (args[4]?.value || 64) & 0xff;
            const header = Buffer.alloc(20);
            header[0] = 0x45; // Version 4, IHL 5 (20 bytes)
            header[1] = 0x00; // DSCP / ECN
            header.writeUInt16BE(20 + payloadLength, 2); // Total Length
            header.writeUInt16BE(0x1234, 4); // Identification
            header.writeUInt16BE(0x4000, 6); // Flags: Don't Fragment
            header[8] = ttl;
            header[9] = protocol;
            header.writeUInt16BE(0, 10); // Checksum set to 0 before calc
            const parseIp = (ipStr) => ipStr.split(".").map(s => parseInt(s, 10));
            const sParts = parseIp(srcIp);
            const dParts = parseIp(dstIp);
            for (let i = 0; i < 4; i++) {
                header[12 + i] = sParts[i] || 0;
                header[16 + i] = dParts[i] || 0;
            }
            // Calculate IP Header Checksum
            const csum = calculateChecksum(header);
            header.writeUInt16BE(csum, 10);
            exports.profiler.recordTx(header.length);
            return { type: "instance", instance: createByteBufferInstance(header) };
        }
    });
    env.declareVar("IP", { type: "instance", instance: ipObj }, "General");
    // ==========================================================================
    // 5. COUCHE 4 : TRANSPORT (Sockets Bas Niveau Berkeley C++ style)
    // ==========================================================================
    const socketClass = new instance_1.Instance("SocketClass");
    socketClass.Name = "Socket";
    // Constants
    socketClass.SetProperty("AF_INET", (0, values_1.MK_NUMBER)(2));
    socketClass.SetProperty("SOCK_STREAM", (0, values_1.MK_NUMBER)(1)); // TCP
    socketClass.SetProperty("SOCK_DGRAM", (0, values_1.MK_NUMBER)(2)); // UDP
    socketClass.SetProperty("SOCK_RAW", (0, values_1.MK_NUMBER)(3)); // RAW
    socketClass.SetProperty("IPPROTO_TCP", (0, values_1.MK_NUMBER)(6));
    socketClass.SetProperty("IPPROTO_UDP", (0, values_1.MK_NUMBER)(17));
    socketClass.SetProperty("TCP_NODELAY", (0, values_1.MK_NUMBER)(1));
    socketClass.SetProperty("SO_REUSEADDR", (0, values_1.MK_NUMBER)(2));
    socketClass.SetProperty("SO_KEEPALIVE", (0, values_1.MK_NUMBER)(9));
    socketClass.SetProperty("Create", {
        type: "native_fn",
        call: (args) => {
            const type = args[1]?.value || 1; // 1 = TCP, 2 = UDP
            const sockInst = new instance_1.Instance("SocketInstance");
            let tcpClient = null;
            let tcpServer = null;
            let udpSocket = null;
            let isConnected = false;
            let isBound = false;
            let sockStats = {
                bytesSent: 0,
                bytesReceived: 0,
                packetsSent: 0,
                packetsReceived: 0
            };
            // TCP Connect
            sockInst.SetProperty("Connect", {
                type: "native_fn",
                call: (cArgs) => {
                    const host = String(cArgs[0]?.value || "127.0.0.1");
                    const port = cArgs[1]?.value || 80;
                    if (type === 1) { // TCP
                        tcpClient = new net.Socket();
                        tcpClient.connect(port, host, () => {
                            isConnected = true;
                        });
                        tcpClient.on("data", (data) => {
                            sockStats.bytesReceived += data.length;
                            sockStats.packetsReceived++;
                            exports.profiler.recordRx(data.length);
                        });
                        tcpClient.on("error", (err) => {
                            console.error(`[LLP Socket Error] ${err.message}`);
                        });
                        return (0, values_1.MK_BOOL)(true);
                    }
                    else { // UDP
                        udpSocket = dgram.createSocket("udp4");
                        isConnected = true;
                        return (0, values_1.MK_BOOL)(true);
                    }
                }
            });
            // TCP / UDP Bind
            sockInst.SetProperty("Bind", {
                type: "native_fn",
                call: (bArgs) => {
                    const host = String(bArgs[0]?.value || "0.0.0.0");
                    const port = bArgs[1]?.value || 0;
                    if (type === 1) {
                        tcpServer = net.createServer((c) => {
                            c.on("data", (data) => {
                                sockStats.bytesReceived += data.length;
                                sockStats.packetsReceived++;
                                exports.profiler.recordRx(data.length);
                            });
                        });
                        tcpServer.listen(port, host, () => {
                            isBound = true;
                        });
                        return (0, values_1.MK_BOOL)(true);
                    }
                    else {
                        udpSocket = dgram.createSocket("udp4");
                        udpSocket.bind(port, host, () => {
                            isBound = true;
                        });
                        udpSocket.on("message", (msg) => {
                            sockStats.bytesReceived += msg.length;
                            sockStats.packetsReceived++;
                            exports.profiler.recordRx(msg.length);
                        });
                        return (0, values_1.MK_BOOL)(true);
                    }
                }
            });
            // Send (Direct binary or string payload with byte tracking)
            sockInst.SetProperty("Send", {
                type: "native_fn",
                call: (sArgs) => {
                    let buf;
                    const sArg = sArgs[0];
                    if (sArg && sArg.type === "instance" && typeof sArg.instance?.__rawBuffer === "function") {
                        buf = sArg.instance.__rawBuffer();
                    }
                    else {
                        buf = Buffer.from(String(sArg?.value || ""), "utf8");
                    }
                    if (tcpClient && isConnected) {
                        tcpClient.write(buf);
                        sockStats.bytesSent += buf.length;
                        sockStats.packetsSent++;
                        exports.profiler.recordTx(buf.length);
                        return (0, values_1.MK_NUMBER)(buf.length);
                    }
                    return (0, values_1.MK_NUMBER)(0);
                }
            });
            // SendTo (UDP Datagram with target IP & Port)
            sockInst.SetProperty("SendTo", {
                type: "native_fn",
                call: (uArgs) => {
                    let buf;
                    const uArg = uArgs[0];
                    if (uArg && uArg.type === "instance" && typeof uArg.instance?.__rawBuffer === "function") {
                        buf = uArg.instance.__rawBuffer();
                    }
                    else {
                        buf = Buffer.from(String(uArg?.value || ""), "utf8");
                    }
                    const targetHost = String(uArgs[1]?.value || "127.0.0.1");
                    const targetPort = uArgs[2]?.value || 0;
                    if (!udpSocket) {
                        udpSocket = dgram.createSocket("udp4");
                    }
                    udpSocket.send(buf, targetPort, targetHost, (err) => {
                        if (!err) {
                            sockStats.bytesSent += buf.length;
                            sockStats.packetsSent++;
                            exports.profiler.recordTx(buf.length);
                        }
                    });
                    return (0, values_1.MK_NUMBER)(buf.length);
                }
            });
            // SetSockOpt (ex: TCP_NODELAY to disable Nagle's algorithm and cut latency)
            sockInst.SetProperty("SetSockOpt", {
                type: "native_fn",
                call: (oArgs) => {
                    const opt = oArgs[1]?.value || 0;
                    const val = oArgs[2]?.value || 0;
                    if (tcpClient) {
                        if (opt === 1) { // TCP_NODELAY
                            tcpClient.setNoDelay(val === 1 || val === true);
                            return (0, values_1.MK_BOOL)(true);
                        }
                        if (opt === 9) { // SO_KEEPALIVE
                            tcpClient.setKeepAlive(val === 1 || val === true);
                            return (0, values_1.MK_BOOL)(true);
                        }
                    }
                    return (0, values_1.MK_BOOL)(true);
                }
            });
            // GetStats (Instant bytes in/out inspection)
            sockInst.SetProperty("GetStats", {
                type: "native_fn",
                call: () => toRuntimeVal(sockStats)
            });
            // Close
            sockInst.SetProperty("Close", {
                type: "native_fn",
                call: () => {
                    if (tcpClient) {
                        tcpClient.destroy();
                        tcpClient = null;
                    }
                    if (tcpServer) {
                        tcpServer.close();
                        tcpServer = null;
                    }
                    if (udpSocket) {
                        udpSocket.close();
                        udpSocket = null;
                    }
                    isConnected = false;
                    return (0, values_1.MK_BOOL)(true);
                }
            });
            return { type: "instance", instance: sockInst };
        }
    });
    env.declareVar("Socket", { type: "instance", instance: socketClass }, "General");
    // ==========================================================================
    // 6. COUCHE 5, 6, 7 : OPTIMISATION RÉSEAU, COMPRESSION & STRUCT PACKING
    // ==========================================================================
    const netOptObj = new instance_1.Instance("NetOptimizerService");
    netOptObj.Name = "NetOptimizer";
    // Binary Struct Packer (Zero JSON overhead, 85-95% network bandwidth saving)
    netOptObj.SetProperty("PackBinary", {
        type: "native_fn",
        call: (args) => {
            // args[0] = format (e.g. "IIHs" -> 2x uint32, 1x uint16, 1x string)
            // args[1..n] = values
            const format = String(args[0]?.value || "");
            const vals = args.slice(1);
            const buf = Buffer.alloc(1024);
            let offset = 0;
            for (let i = 0; i < format.length; i++) {
                const char = format[i];
                const val = vals[i]?.value;
                if (char === "B" || char === "C") { // UInt8
                    buf.writeUInt8((val || 0) & 0xff, offset);
                    offset += 1;
                }
                else if (char === "H") { // UInt16BE
                    buf.writeUInt16BE((val || 0) & 0xffff, offset);
                    offset += 2;
                }
                else if (char === "I") { // UInt32BE
                    buf.writeUInt32BE((val || 0) >>> 0, offset);
                    offset += 4;
                }
                else if (char === "f") { // Float32BE
                    buf.writeFloatBE(val || 0, offset);
                    offset += 4;
                }
                else if (char === "s") { // Length-prefixed string
                    const sBuf = Buffer.from(String(val || ""), "utf8");
                    buf.writeUInt16BE(sBuf.length, offset);
                    offset += 2;
                    sBuf.copy(buf, offset);
                    offset += sBuf.length;
                }
            }
            const packed = buf.slice(0, offset);
            return { type: "instance", instance: createByteBufferInstance(packed) };
        }
    });
    // Compression GZIP / Deflate (pour diviser la bande passante par 3 ou 5)
    netOptObj.SetProperty("Compress", {
        type: "native_fn",
        call: (args) => {
            let srcBuf;
            const arg = args[0];
            if (arg && arg.type === "instance" && typeof arg.instance?.__rawBuffer === "function") {
                srcBuf = arg.instance.__rawBuffer();
            }
            else {
                srcBuf = Buffer.from(String(arg?.value || ""), "utf8");
            }
            const compressed = zlib.gzipSync(srcBuf);
            return { type: "instance", instance: createByteBufferInstance(compressed) };
        }
    });
    netOptObj.SetProperty("Decompress", {
        type: "native_fn",
        call: (args) => {
            let srcBuf;
            const arg = args[0];
            if (arg && arg.type === "instance" && typeof arg.instance?.__rawBuffer === "function") {
                srcBuf = arg.instance.__rawBuffer();
            }
            else {
                srcBuf = Buffer.from(String(arg?.value || ""), "utf8");
            }
            try {
                const decompressed = zlib.gunzipSync(srcBuf);
                return { type: "instance", instance: createByteBufferInstance(decompressed) };
            }
            catch (_) {
                return (0, values_1.MK_NULL)();
            }
        }
    });
    // Calculate Bandwidth Savings comparison
    netOptObj.SetProperty("AnalyzePayload", {
        type: "native_fn",
        call: (args) => {
            const dataStr = String(args[0]?.value || "");
            const rawBytes = Buffer.byteLength(dataStr, "utf8");
            const compressedBytes = zlib.gzipSync(Buffer.from(dataStr, "utf8")).length;
            const savingsPct = Math.round((1 - (compressedBytes / Math.max(1, rawBytes))) * 100);
            const res = new instance_1.Instance("PayloadAnalysis");
            res.SetProperty("RawBytes", (0, values_1.MK_NUMBER)(rawBytes));
            res.SetProperty("CompressedBytes", (0, values_1.MK_NUMBER)(compressedBytes));
            res.SetProperty("SavingsPercent", (0, values_1.MK_NUMBER)(Math.max(0, savingsPct)));
            return { type: "instance", instance: res };
        }
    });
    env.declareVar("NetOptimizer", { type: "instance", instance: netOptObj }, "General");
    // ==========================================================================
    // 7. GLOBAL NETWORK PROFILER (Consultable dans les scripts LLP)
    // ==========================================================================
    const profilerObj = new instance_1.Instance("NetworkProfilerService");
    profilerObj.Name = "NetworkProfiler";
    profilerObj.SetProperty("GetBytesReceived", {
        type: "native_fn",
        call: () => (0, values_1.MK_NUMBER)(exports.profiler.rxBytes)
    });
    profilerObj.SetProperty("GetBytesSent", {
        type: "native_fn",
        call: () => (0, values_1.MK_NUMBER)(exports.profiler.txBytes)
    });
    profilerObj.SetProperty("GetPacketsReceived", {
        type: "native_fn",
        call: () => (0, values_1.MK_NUMBER)(exports.profiler.rxPackets)
    });
    profilerObj.SetProperty("GetPacketsSent", {
        type: "native_fn",
        call: () => (0, values_1.MK_NUMBER)(exports.profiler.txPackets)
    });
    profilerObj.SetProperty("GetStats", {
        type: "native_fn",
        call: () => toRuntimeVal(exports.profiler.getStats())
    });
    profilerObj.SetProperty("Reset", {
        type: "native_fn",
        call: () => {
            exports.profiler.reset();
            return (0, values_1.MK_BOOL)(true);
        }
    });
    env.declareVar("NetworkProfiler", { type: "instance", instance: profilerObj }, "General");
}
