"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MK_NUMBER = MK_NUMBER;
exports.MK_STRING = MK_STRING;
exports.MK_BOOL = MK_BOOL;
exports.MK_NULL = MK_NULL;
exports.MK_JSON = MK_JSON;
exports.MK_HEXA = MK_HEXA;
exports.MK_THREAD = MK_THREAD;
exports.MK_NATIVE_FN = MK_NATIVE_FN;
function MK_NUMBER(n = 0) {
    return { type: "number", value: n };
}
function MK_STRING(s = "") {
    return { type: "string", value: s };
}
function MK_BOOL(b = true) {
    return { type: "boolean", value: b };
}
function MK_NULL() {
    return { type: "null", value: null };
}
function MK_JSON(val = {}) {
    return { type: "json", value: val };
}
function MK_HEXA(val) {
    if (typeof val === "number") {
        const intVal = Math.floor(val);
        const hex = (intVal >= 0 ? "0x" : "-0x") + Math.abs(intVal).toString(16).toUpperCase();
        return { type: "hexa", value: intVal, hexString: hex };
    }
    else {
        const str = String(val).trim();
        const cleanStr = str.startsWith("#") ? str.substring(1) : str;
        const intVal = parseInt(cleanStr, 16);
        return {
            type: "hexa",
            value: isNaN(intVal) ? 0 : intVal,
            hexString: str.startsWith("0x") || str.startsWith("0X") ? str : `0x${cleanStr.toUpperCase()}`
        };
    }
}
function MK_THREAD(id, cancel) {
    return {
        type: "thread",
        id,
        status: "running",
        cancel
    };
}
function MK_NATIVE_FN(call) {
    return { type: "native_fn", call };
}
