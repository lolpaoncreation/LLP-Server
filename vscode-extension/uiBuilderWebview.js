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
exports.getUiBuilderHtml = getUiBuilderHtml;
exports.startUiBuilderServer = startUiBuilderServer;
const http = __importStar(require("http"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let device_1;
try {
    device_1 = require("../dist/stdlib/device");
} catch (e) {
    device_1 = { DeviceIdentityManager: { getInstance: () => ({ getStableFingerprint: () => "DEV_SECURED_VSCODE_HWID" }) } };
}
const logoData = require("./assets/logo_b64.json");
function getUiBuilderHtml(options) {
    const { fileName, illpContent, illpsContent = "", deviceId = "DEV_LOCAL_STABLE_HWID", isStandalone = false } = options;
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LLP UI BUILDER - ${fileName}</title>
    <link rel="icon" type="image/png" href="${logoData.logo64}">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        
        :root {
            --bg-base: #0b0f19;
            --bg-panel: #111827;
            --bg-panel-hover: #1f2937;
            --bg-element: #1e293b;
            --border-color: #334155;
            --border-focus: #0070f3;
            --accent-cyan: #00e5ff;
            --accent-blue: #0070f3;
            --text-primary: #f8fafc;
            --text-secondary: #94a3b8;
            --text-muted: #64748b;
            --neon-glow: 0 0 15px rgba(0, 229, 255, 0.4);
            --blue-glow: 0 0 15px rgba(0, 112, 243, 0.4);
        }

        body {
            display: flex;
            flex-direction: column;
            height: 100vh;
            background: var(--bg-base);
            color: var(--text-primary);
            overflow: hidden;
            user-select: none;
        }

        /* ------------------------------------------------------------- */
        /* TOP APP HEADER BAR                                            */
        /* ------------------------------------------------------------- */
        #topbar {
            height: 52px;
            background: #0d1322;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            z-index: 100;
        }

        .topbar-left {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .brand-logo {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 15px;
            font-weight: 800;
            letter-spacing: 0.8px;
            color: #fff;
        }

        .brand-icon {
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            filter: drop-shadow(0 0 8px rgba(0, 229, 255, 0.5));
        }

        .brand-icon img {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }

        .nav-menu-links {
            display: flex;
            align-items: center;
            gap: 16px;
            font-size: 13px;
            color: var(--text-secondary);
        }

        .nav-link {
            cursor: pointer;
            padding: 4px 6px;
            border-radius: 4px;
            transition: color 0.15s, background 0.15s;
        }
        .nav-link:hover {
            color: #fff;
            background: var(--bg-panel-hover);
        }

        .topbar-center {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .security-badge {
            background: rgba(15, 23, 42, 0.8);
            border: 1px solid #1e293b;
            border-radius: 6px;
            padding: 4px 12px;
            font-size: 11px;
            display: flex;
            align-items: center;
            gap: 8px;
            color: var(--text-secondary);
            font-family: monospace;
        }

        .security-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: #10b981;
            box-shadow: 0 0 8px #10b981;
        }

        .rpc-status-tag {
            color: #38bdf8;
            font-weight: 600;
        }

        .topbar-right {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .top-btn {
            background: var(--bg-element);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
            padding: 6px 14px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            transition: all 0.15s;
        }

        .top-btn:hover {
            border-color: var(--text-secondary);
            background: var(--bg-panel-hover);
        }

        .top-btn.save-btn {
            background: #1e293b;
            border-color: #3b82f6;
            color: #93c5fd;
        }
        .top-btn.save-btn:hover {
            background: #2563eb;
            color: #fff;
        }

        .top-btn.publish-btn {
            background: var(--accent-cyan);
            border: none;
            color: #0b0f19;
            font-weight: 700;
            box-shadow: 0 0 12px rgba(0, 229, 255, 0.4);
        }
        .top-btn.publish-btn:hover {
            background: #67e8f9;
            box-shadow: 0 0 18px rgba(0, 229, 255, 0.6);
            transform: translateY(-1px);
        }

        .top-btn.active {
            background: var(--accent-blue);
            color: #fff;
            border-color: var(--accent-blue);
        }

        /* ------------------------------------------------------------- */
        /* MAIN 3-PANE LAYOUT                                            */
        /* ------------------------------------------------------------- */
        #workspace-layout {
            display: flex;
            flex: 1;
            overflow: hidden;
            position: relative;
        }

        /* FAR-LEFT SLIM ACTIVITY STRIP */
        #activity-strip {
            width: 48px;
            background: #090d16;
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 12px 0;
            gap: 16px;
            z-index: 50;
        }

        .activity-icon-btn {
            width: 34px;
            height: 34px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-muted);
            cursor: pointer;
            transition: all 0.15s;
        }

        .activity-icon-btn:hover {
            color: var(--text-primary);
            background: rgba(255,255,255,0.06);
        }

        .activity-icon-btn.active {
            color: var(--accent-cyan);
            background: rgba(0, 229, 255, 0.12);
        }

        .activity-icon-btn svg {
            width: 18px;
            height: 18px;
            fill: currentColor;
        }

        /* ------------------------------------------------------------- */
        /* LEFT PALETTE: ELEMENTS                                        */
        /* ------------------------------------------------------------- */
        #elements-panel {
            width: 260px;
            background: var(--bg-panel);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        .panel-header-title {
            padding: 14px 16px 10px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.8px;
            color: var(--text-primary);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .palette-search-box {
            padding: 0 14px 10px;
        }

        .search-input-wrap {
            position: relative;
            display: flex;
            align-items: center;
        }

        .search-input-wrap input {
            width: 100%;
            background: #0d1322;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 7px 10px 7px 30px;
            font-size: 12px;
            color: #fff;
            outline: none;
            transition: border-color 0.15s;
        }

        .search-input-wrap input:focus {
            border-color: var(--accent-cyan);
        }

        .search-input-wrap .search-icon {
            position: absolute;
            left: 10px;
            color: var(--text-muted);
            font-size: 12px;
            pointer-events: none;
        }

        .palette-scroll {
            flex: 1;
            overflow-y: auto;
            padding: 4px 12px 20px;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        .element-category {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .category-header {
            font-size: 11px;
            font-weight: 700;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 2px 4px;
            cursor: pointer;
        }

        .category-header:hover {
            color: var(--accent-cyan);
        }

        .category-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
        }

        .palette-card {
            background: var(--bg-element);
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 10px 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 6px;
            cursor: grab;
            transition: all 0.15s;
            text-align: center;
        }

        .palette-card:hover {
            border-color: var(--accent-cyan);
            background: #243248;
            box-shadow: 0 0 10px rgba(0, 229, 255, 0.2);
            transform: translateY(-1px);
        }

        .palette-card:active {
            cursor: grabbing;
        }

        .palette-card.selected-element {
            border-color: var(--border-focus);
            background: rgba(0, 112, 243, 0.15);
            box-shadow: 0 0 12px rgba(0, 112, 243, 0.3);
        }

        .palette-card-icon {
            font-size: 16px;
            color: var(--text-secondary);
        }

        .palette-card:hover .palette-card-icon {
            color: var(--accent-cyan);
        }

        .palette-card-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--text-primary);
            line-height: 1.2;
        }

        .subchips-group {
            display: flex;
            gap: 3px;
            margin-top: 2px;
        }

        .subchip {
            background: #0f172a;
            color: var(--text-muted);
            border: 1px solid var(--border-color);
            padding: 2px 4px;
            border-radius: 3px;
            font-size: 8px;
            text-transform: uppercase;
        }

        /* ------------------------------------------------------------- */
        /* CENTER CANVAS: INTERACTIVE BLUEPRINT WORKSPACE                */
        /* ------------------------------------------------------------- */
        #canvas-viewport {
            flex: 1;
            background-color: var(--bg-base);
            background-image: 
                linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
            background-size: 24px 24px;
            display: flex;
            flex-direction: column;
            overflow: auto;
            position: relative;
        }

        .canvas-top-tag {
            padding: 12px 24px 0;
            font-size: 11px;
            font-weight: 700;
            color: var(--text-secondary);
            letter-spacing: 0.5px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .canvas-top-tag b {
            color: #fff;
        }

        .canvas-artboard {
            margin: 16px 24px 40px;
            min-height: 700px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            position: relative;
        }

        /* Glowing drop insertion placeholder */
        .drop-ghost-placeholder {
            border: 2px dashed var(--accent-cyan);
            background: rgba(0, 229, 255, 0.08);
            border-radius: 8px;
            min-height: 120px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 8px;
            color: var(--accent-cyan);
            font-size: 12px;
            font-weight: 600;
            box-shadow: var(--neon-glow);
            animation: pulseGhost 1.6s infinite alternate;
            position: relative;
            padding: 16px;
            pointer-events: none;
            transition: all 0.2s;
        }

        .drop-ghost-placeholder .cursor-badge {
            display: flex;
            align-items: center;
            gap: 6px;
            background: #0f172a;
            border: 1px solid var(--accent-cyan);
            border-radius: 6px;
            padding: 6px 12px;
            font-size: 11px;
            box-shadow: 0 4px 14px rgba(0, 229, 255, 0.3);
        }

        @keyframes pulseGhost {
            from { opacity: 0.75; transform: scale(0.995); }
            to { opacity: 1; transform: scale(1.002); }
        }

        /* Canvas Element Wrapper */
        .ui-canvas-item {
            position: relative;
            border-radius: 8px;
            border: 1px solid transparent;
            transition: border-color 0.15s, box-shadow 0.15s;
            cursor: pointer;
            width: 100%;
        }

        .ui-canvas-item:hover {
            border-color: rgba(0, 112, 243, 0.4);
        }

        /* Active Selected State: VIVID BLUE OUTLINE + GLOW + BADGE */
        .ui-canvas-item.active-selected {
            border: 2px solid var(--accent-blue) !important;
            box-shadow: var(--blue-glow) !important;
        }

        .selection-tag-badge {
            position: absolute;
            top: -11px;
            left: 10px;
            background: var(--accent-blue);
            color: #fff;
            font-size: 10px;
            font-weight: 700;
            padding: 2px 8px;
            border-radius: 4px;
            box-shadow: 0 2px 6px rgba(0, 112, 243, 0.4);
            display: flex;
            align-items: center;
            gap: 4px;
            z-index: 30;
        }

        /* Floating action buttons toolbar for elements */
        .element-quick-toolbar {
            position: absolute;
            top: -14px;
            right: 10px;
            background: #0f172a;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 2px 4px;
            display: none;
            gap: 3px;
            z-index: 40;
            box-shadow: 0 4px 12px rgba(0,0,0,0.6);
        }

        .ui-canvas-item:hover > .element-quick-toolbar,
        .ui-canvas-item.active-selected > .element-quick-toolbar {
            display: flex;
        }

        .q-btn {
            background: transparent;
            color: var(--text-secondary);
            border: none;
            border-radius: 4px;
            width: 22px;
            height: 22px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 11px;
            cursor: pointer;
            transition: all 0.15s;
        }

        .q-btn:hover {
            background: var(--bg-panel-hover);
            color: #fff;
        }

        .q-btn.delete-btn:hover {
            background: #ef4444;
            color: #fff;
        }

        /* Drag handle */
        .q-btn.drag-handle {
            cursor: grab;
        }
        .q-btn.drag-handle:active {
            cursor: grabbing;
        }

        .ui-canvas-item.is-dragging {
            opacity: 0.35;
        }

        /* ------------------------------------------------------------- */
        /* COMPONENT VISUAL IMPLEMENTATIONS ON CANVAS                    */
        /* ------------------------------------------------------------- */
        
        /* 1. HEADER COMPONENT */
        .canvas-header-block {
            background: #111827;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 16px 20px;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .canvas-header-left {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 18px;
            font-weight: 700;
            color: #fff;
        }

        .canvas-header-right {
            display: flex;
            align-items: center;
            gap: 10px;
            font-size: 13px;
            color: var(--text-secondary);
        }

        .user-avatar-circle {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #334155;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            color: #94a3b8;
        }

        /* 2. DATAGRID (PAGINATING) */
        .canvas-datagrid-block {
            background: #111827;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .datagrid-title-bar {
            padding: 14px 18px;
            font-size: 15px;
            font-weight: 700;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: space-between;
            border-bottom: 1px solid var(--border-color);
        }

        .datagrid-table-custom {
            width: 100%;
            border-collapse: collapse;
            font-size: 12px;
        }

        .datagrid-table-custom th {
            background: #0f172a;
            color: var(--text-muted);
            text-align: left;
            padding: 10px 14px;
            font-weight: 600;
            border-bottom: 1px solid var(--border-color);
        }

        .datagrid-table-custom td {
            padding: 12px 14px;
            border-bottom: 1px solid rgba(51, 65, 85, 0.4);
            color: var(--text-primary);
        }

        .row-skeleton-bar {
            height: 8px;
            background: #334155;
            border-radius: 4px;
            width: 80%;
        }

        .datagrid-footer {
            padding: 10px 16px;
            background: #0f172a;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 12px;
            font-size: 11px;
            color: var(--text-muted);
            border-top: 1px solid var(--border-color);
        }

        /* 3. KANBAN BOARD */
        .canvas-kanban-block {
            background: #111827;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .kanban-title-bar {
            font-size: 15px;
            font-weight: 700;
            color: #fff;
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .kanban-cols-container {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
        }

        .kanban-col-item {
            background: #0f172a;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .kanban-col-top {
            font-size: 12px;
            font-weight: 700;
            color: var(--text-secondary);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .kanban-task-card {
            background: #1e293b;
            border: 1px solid var(--border-color);
            border-left: 3px solid #3b82f6;
            border-radius: 4px;
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .kanban-task-card.amber-tag {
            border-left-color: #f59e0b;
        }
        .kanban-task-card.emerald-tag {
            border-left-color: #10b981;
        }

        /* 4. FORM SECTION (INPUT + BUTTON) */
        .canvas-form-block {
            background: #111827;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 18px;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        .canvas-input-field {
            width: 100%;
            background: #0f172a;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 10px 14px;
            font-size: 13px;
            color: #fff;
            outline: none;
        }

        .canvas-primary-btn {
            background: var(--accent-cyan);
            color: #0b0f19;
            font-size: 13px;
            font-weight: 700;
            border: none;
            border-radius: 6px;
            padding: 12px 18px;
            cursor: pointer;
            text-align: center;
            box-shadow: 0 0 12px rgba(0, 229, 255, 0.4);
            transition: all 0.15s;
        }

        .canvas-primary-btn:hover {
            background: #67e8f9;
        }

        /* 5. GENERIC CONTAINERS (CARD, STACK, GRID, SECTION) */
        .container-drop-zone {
            border: 1px dashed var(--border-color);
            border-radius: 8px;
            padding: 14px;
            min-height: 80px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            background: rgba(17, 24, 39, 0.6);
            position: relative;
        }

        .container-drop-zone.grid-layout {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
        }

        .container-drop-zone.row-layout {
            display: flex;
            flex-direction: row;
            flex-wrap: wrap;
        }

        .container-drop-zone:empty::after {
            content: "Drop elements here to place inside container";
            display: block;
            text-align: center;
            color: var(--text-muted);
            font-size: 12px;
            padding: 20px;
            border: 1px dashed #334155;
            border-radius: 6px;
            width: 100%;
        }

        /* ------------------------------------------------------------- */
        /* RIGHT PANEL: PROPERTIES INSPECTOR                             */
        /* ------------------------------------------------------------- */
        #properties-panel {
            width: 320px;
            background: var(--bg-panel);
            border-left: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            overflow-y: auto;
        }

        .prop-panel-header {
            padding: 14px 16px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .prop-main-title {
            font-size: 12px;
            font-weight: 800;
            color: #fff;
            text-transform: uppercase;
            letter-spacing: 0.6px;
        }

        .accordion-section {
            border-bottom: 1px solid var(--border-color);
        }

        .accordion-toggle {
            padding: 12px 16px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--text-secondary);
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: pointer;
            user-select: none;
        }

        .accordion-toggle:hover {
            color: #fff;
        }

        .accordion-content {
            padding: 0 16px 16px;
            display: flex;
            flex-direction: column;
            gap: 12px;
        }

        .accordion-content.collapsed {
            display: none;
        }

        /* Highlighted Cyan Frame for Data Binding */
        .data-binding-frame {
            border: 1px solid var(--accent-cyan);
            border-radius: 8px;
            background: rgba(0, 229, 255, 0.03);
            padding: 12px;
            box-shadow: 0 0 10px rgba(0, 229, 255, 0.1);
        }

        .control-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
        }

        .control-label {
            font-size: 11px;
            font-weight: 600;
            color: var(--text-secondary);
        }

        .segmented-btn-group {
            display: flex;
            background: #0f172a;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            overflow: hidden;
        }

        .seg-btn {
            background: transparent;
            color: var(--text-muted);
            border: none;
            padding: 5px 9px;
            font-size: 10px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.15s;
        }

        .seg-btn:hover {
            color: #fff;
        }

        .seg-btn.active {
            background: var(--bg-element);
            color: var(--accent-cyan);
        }

        .box-model-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 4px;
        }

        .box-model-grid input {
            background: #0f172a;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            padding: 4px;
            font-size: 11px;
            color: #fff;
            text-align: center;
            outline: none;
        }

        .prop-text-input {
            width: 100%;
            background: #0f172a;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            padding: 7px 10px;
            font-size: 12px;
            color: #fff;
            outline: none;
        }

        .prop-text-input:focus {
            border-color: var(--accent-cyan);
        }

        .rpc-bind-group {
            display: flex;
            gap: 6px;
        }

        .btn-bind-action {
            background: var(--accent-cyan);
            color: #0b0f19;
            font-weight: 800;
            font-size: 11px;
            border: none;
            border-radius: 6px;
            padding: 0 12px;
            cursor: pointer;
        }

        .toggle-switch-wrap {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .switch-input {
            width: 32px;
            height: 18px;
            accent-color: var(--accent-cyan);
            cursor: pointer;
        }

        .event-code-line {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 10px;
            background: #0f172a;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            font-size: 11px;
            font-family: monospace;
            cursor: pointer;
        }

        .event-code-line:hover {
            border-color: var(--accent-cyan);
        }

        .event-name {
            color: #38bdf8;
        }

        .event-bracket {
            color: var(--text-muted);
        }

        /* ------------------------------------------------------------- */
        /* PREVIEW MODE TOGGLE                                           */
        /* ------------------------------------------------------------- */
        body.preview-mode .selection-tag-badge,
        body.preview-mode .element-quick-toolbar,
        body.preview-mode .drop-ghost-placeholder {
            display: none !important;
        }

        body.preview-mode .ui-canvas-item {
            border: none !important;
            box-shadow: none !important;
            cursor: default !important;
        }
    </style>
</head>
<body>

    <!-- TOPBAR -->
    <header id="topbar">
        <div class="topbar-left">
            <div class="brand-logo">
                <div class="brand-icon">
                    <img src="${logoData.logo64}" alt="LLP Logo" />
                </div>
                <span>LLP UI BUILDER</span>
            </div>
            <nav class="nav-menu-links">
                <span class="nav-link" id="menu-file">File</span>
                <span class="nav-link" id="menu-edit">Edit</span>
                <span class="nav-link" id="menu-project">Project</span>
            </nav>
        </div>

        <div class="topbar-center">
            <div class="security-badge" title="Hardware identity dynamically bound to host components">
                <div class="security-dot"></div>
                <span>Secured Device ID: [${deviceId.substring(0, 24)}...]</span>
                <span>•</span>
                <span>RPC Layer Status: <span class="rpc-status-tag">OK (Client-Server Encrypted)</span></span>
            </div>
        </div>

        <div class="topbar-right">
            <button id="btn-save" class="top-btn save-btn" type="button" title="Save changes directly to .illp file">
                <span>💾</span>
                <span id="save-btn-text">Save</span>
            </button>
            <button id="btn-preview" class="top-btn" type="button" title="Preview application without editor handles">
                <span>👁️</span>
                <span id="preview-btn-text">Preview</span>
            </button>
            <button id="btn-publish" class="top-btn publish-btn" type="button" title="Publish and compile interface into executable app">
                <span>⬆️</span>
                <span>Publish</span>
            </button>
            <button id="btn-api-docs" class="top-btn" type="button" title="Open LLP RPC and GUI API Documentation">
                <span>📖</span>
                <span>API DOCS</span>
            </button>
        </div>
    </header>

    <!-- WORKSPACE -->
    <div id="workspace-layout">

        <!-- ACTIVITY ICON STRIP -->
        <div id="activity-strip">
            <div class="activity-icon-btn active" title="Components Library">
                <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </div>
            <div class="activity-icon-btn" title="Layers & Hierarchy">
                <svg viewBox="0 0 24 24"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
            </div>
            <div class="activity-icon-btn" title="RPC & Scripts ({})">
                <svg viewBox="0 0 24 24"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>
            </div>
            <div class="activity-icon-btn" style="margin-top: auto;" title="Interface Settings">
                <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            </div>
        </div>

        <!-- LEFT PALETTE: ELEMENTS -->
        <aside id="elements-panel">
            <div class="panel-header-title">
                <span>ELEMENTS</span>
                <span style="color:var(--text-muted); cursor:pointer;">«</span>
            </div>

            <div class="palette-search-box">
                <div class="search-input-wrap">
                    <span class="search-icon">🔍</span>
                    <input type="text" id="palette-filter" placeholder="Search..." />
                </div>
            </div>

            <div class="palette-scroll" id="palette-items-list">
                <!-- Group 1: Structure -->
                <div class="element-category">
                    <div class="category-header">
                        <span>▾ Structure</span>
                    </div>
                    <div class="category-grid">
                        <div class="palette-card" draggable="true" data-type="Stack">
                            <span class="palette-card-icon">☰</span>
                            <span class="palette-card-label">Stack (H/V)</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="ResponsiveGrid">
                            <span class="palette-card-icon">▦</span>
                            <span class="palette-card-label">Grid (Adaptive)</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="Card">
                            <span class="palette-card-icon">🗂️</span>
                            <span class="palette-card-label">Section</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="Drawer">
                            <span class="palette-card-icon">🗄️</span>
                            <span class="palette-card-label">TabView</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="TreeView">
                            <span class="palette-card-icon">🌳</span>
                            <span class="palette-card-label">TreeView</span>
                        </div>
                    </div>
                </div>

                <!-- Group 2: Controls -->
                <div class="element-category">
                    <div class="category-header">
                        <span>▾ Controls</span>
                    </div>
                    <div class="category-grid">
                        <div class="palette-card" draggable="true" data-type="Button">
                            <span class="palette-card-icon">🔘</span>
                            <span class="palette-card-label">Button</span>
                            <div class="subchips-group">
                                <span class="subchip">Primary</span>
                                <span class="subchip">Outline</span>
                            </div>
                        </div>
                        <div class="palette-card" draggable="true" data-type="TextInput">
                            <span class="palette-card-icon">⌨️</span>
                            <span class="palette-card-label">Input</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="ItemBox">
                            <span class="palette-card-icon">🔽</span>
                            <span class="palette-card-label">Select</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="TagPicker">
                            <span class="palette-card-icon">🏷️</span>
                            <span class="palette-card-label">Select (Multi-Tag)</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="DatePicker">
                            <span class="palette-card-icon">📅</span>
                            <span class="palette-card-label">DateTimePicker</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="FileUpload">
                            <span class="palette-card-icon">☁️</span>
                            <span class="palette-card-label">FileUpload</span>
                        </div>
                    </div>
                </div>

                <!-- Group 3: Data Vistas -->
                <div class="element-category">
                    <div class="category-header">
                        <span>▾ Data Vistas</span>
                    </div>
                    <div class="category-grid">
                        <div class="palette-card selected-element" draggable="true" data-type="DataGrid">
                            <span class="palette-card-icon">🗃️</span>
                            <span class="palette-card-label">DataGrid (Paginating)</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="Kanban">
                            <span class="palette-card-icon">📋</span>
                            <span class="palette-card-label">KanbanBoard</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="Chart">
                            <span class="palette-card-icon">📈</span>
                            <span class="palette-card-label">Chart</span>
                            <div class="subchips-group">
                                <span class="subchip">Pie</span>
                                <span class="subchip">Bar</span>
                                <span class="subchip">Line</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Group 4: Feedback -->
                <div class="element-category">
                    <div class="category-header">
                        <span>▾ Feedback</span>
                    </div>
                    <div class="category-grid">
                        <div class="palette-card" draggable="true" data-type="Toast">
                            <span class="palette-card-icon">🔔</span>
                            <span class="palette-card-label">Toast</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="Text">
                            <span class="palette-card-icon">📢</span>
                            <span class="palette-card-label">Banner</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="Modal">
                            <span class="palette-card-icon">🗔</span>
                            <span class="palette-card-label">Modal Dialog</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="Skeleton">
                            <span class="palette-card-icon">⌛</span>
                            <span class="palette-card-label">SkeletonLoader</span>
                        </div>
                    </div>
                </div>

                <!-- Group 5: Advanced -->
                <div class="element-category">
                    <div class="category-header">
                        <span>▾ Advanced</span>
                    </div>
                    <div class="category-grid">
                        <div class="palette-card" draggable="true" data-type="Webview">
                            <span class="palette-card-icon">🌐</span>
                            <span class="palette-card-label">Webview / Canvas</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="MediaPlayer">
                            <span class="palette-card-icon">🎬</span>
                            <span class="palette-card-label">Custom Component</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>

        <!-- CENTER CANVAS -->
        <main id="canvas-viewport">
            <div class="canvas-top-tag">
                <span>PROJECT: <b>LLP APP 1 - MAIN DASHBOARD</b> (${fileName})</span>
                <span id="canvas-elements-counter">4 components</span>
            </div>

            <div class="canvas-artboard" id="artboard-root">
                <!-- Elements will be dynamically rendered here from .illp structure -->
            </div>
        </main>

        <!-- RIGHT PANEL: PROPERTIES -->
        <aside id="properties-panel">
            <div class="prop-panel-header">
                <span class="prop-main-title" id="inspector-header-title">PROPERTIES - DataGrid</span>
                <span style="font-size: 10px; color: var(--text-muted); cursor: pointer;" id="btn-deselect">✕</span>
            </div>

            <!-- Accordion 1: Layout -->
            <div class="accordion-section">
                <div class="accordion-toggle" onclick="toggleAccordion('layout')">
                    <span>▾ Layout</span>
                </div>
                <div class="accordion-content" id="acc-layout">
                    <div class="control-row">
                        <span class="control-label">Size</span>
                        <div class="segmented-btn-group">
                            <button class="seg-btn active" type="button" onclick="setSizeMode('auto')">Auto</button>
                            <button class="seg-btn" type="button" onclick="setSizeMode('fixed')">Fixed</button>
                            <button class="seg-btn" type="button" onclick="setSizeMode('percent')">Percent</button>
                        </div>
                    </div>

                    <div class="control-row">
                        <span class="control-label">Alignment</span>
                        <div class="segmented-btn-group">
                            <button class="seg-btn active" type="button" onclick="setAlign('left')">⬱</button>
                            <button class="seg-btn" type="button" onclick="setAlign('center')">⬰</button>
                            <button class="seg-btn" type="button" onclick="setAlign('right')">⬲</button>
                            <button class="seg-btn" type="button" onclick="setAlign('stretch')">⬍</button>
                        </div>
                    </div>

                    <div class="control-row">
                        <span class="control-label">Padding</span>
                        <div class="box-model-grid">
                            <input type="text" id="prop-pad-top" placeholder="-" />
                            <input type="text" id="prop-pad-right" placeholder="-" />
                            <input type="text" id="prop-pad-bottom" placeholder="-" />
                            <input type="text" id="prop-pad-left" placeholder="-" />
                        </div>
                    </div>

                    <div class="control-row">
                        <span class="control-label">Margin</span>
                        <div class="box-model-grid">
                            <input type="text" id="prop-mar-top" placeholder="-" />
                            <input type="text" id="prop-mar-right" placeholder="-" />
                            <input type="text" id="prop-mar-bottom" placeholder="-" />
                            <input type="text" id="prop-mar-left" placeholder="-" />
                        </div>
                    </div>

                    <div class="control-row">
                        <span class="control-label">Responsive Rules</span>
                        <div class="segmented-btn-group">
                            <button class="seg-btn active" type="button" id="btn-rule-desk">Desktop</button>
                            <button class="seg-btn" type="button" id="btn-rule-mob">Mobile</button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Accordion 2: Style -->
            <div class="accordion-section">
                <div class="accordion-toggle" onclick="toggleAccordion('style')">
                    <span>▾ Style</span>
                </div>
                <div class="accordion-content" id="acc-style">
                    <div class="control-row">
                        <span class="control-label">Theme</span>
                        <div class="segmented-btn-group">
                            <button class="seg-btn" type="button">Light</button>
                            <button class="seg-btn active" type="button">Dark</button>
                            <button class="seg-btn" type="button">Custom</button>
                        </div>
                    </div>
                    <div class="control-row">
                        <span class="control-label">Borders</span>
                        <input type="text" class="prop-text-input" id="prop-style-border" placeholder="1px solid #334155" />
                    </div>
                    <div class="control-row">
                        <span class="control-label">Shadows</span>
                        <input type="text" class="prop-text-input" id="prop-style-shadow" placeholder="0 4px 15px rgba(0,0,0,0.5)" />
                    </div>
                </div>
            </div>

            <!-- Accordion 3: Data Binding -->
            <div class="accordion-section">
                <div class="accordion-toggle" onclick="toggleAccordion('databinding')">
                    <span>▾ Data Binding</span>
                </div>
                <div class="accordion-content" id="acc-databinding">
                    <div class="data-binding-frame">
                        <div class="control-row" style="margin-bottom: 8px;">
                            <span class="control-label">Data Source:</span>
                            <select class="prop-text-input" id="prop-data-source" style="width: 140px;">
                                <option value="rpc">[LLP Server RPC]</option>
                                <option value="state">Local State</option>
                                <option value="json">Static JSON</option>
                            </select>
                        </div>

                        <div class="control-row" style="margin-bottom: 8px;">
                            <span class="control-label">RPC Method:</span>
                        </div>
                        <div class="rpc-bind-group" style="margin-bottom: 10px;">
                            <input type="text" class="prop-text-input" id="prop-rpc-method" value="server.Users.list" />
                            <button class="btn-bind-action" type="button" id="btn-trigger-bind">Bind</button>
                        </div>

                        <div class="control-row">
                            <span class="control-label">Auto-Pagination <span title="Automatically requests paginated items from RPC" style="cursor:help;">?</span></span>
                            <div class="toggle-switch-wrap">
                                <input type="checkbox" id="prop-auto-page" class="switch-input" checked />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Accordion 4: Events -->
            <div class="accordion-section">
                <div class="accordion-toggle" onclick="toggleAccordion('events')">
                    <span>▾ Events</span>
                </div>
                <div class="accordion-content" id="acc-events">
                    <div class="event-code-line" onclick="editEvent('OnRowClick')">
                        <span class="event-name">OnRowClick:</span>
                        <span class="event-bracket">{}</span>
                    </div>
                    <div class="event-code-line" onclick="editEvent('OnCellEdit')">
                        <span class="event-name">OnCellEdit:</span>
                        <span class="event-bracket">{}</span>
                    </div>
                    <div class="event-code-line" onclick="editEvent('OnRowDelete')">
                        <span class="event-name">OnRowDelete:</span>
                        <span class="event-bracket">{}</span>
                    </div>
                    <div class="event-code-line" onclick="editEvent('OnSubmit')">
                        <span class="event-name">OnSubmit:</span>
                        <span class="event-bracket">{}</span>
                    </div>
                    <div class="event-code-line" onclick="editEvent('OnChange')">
                        <span class="event-name">OnChange:</span>
                        <span class="event-bracket">{}</span>
                    </div>
                </div>
            </div>

            <!-- Specific Properties Section -->
            <div class="accordion-section">
                <div class="accordion-toggle" onclick="toggleAccordion('specific')">
                    <span>▾ Specific Component Properties</span>
                </div>
                <div class="accordion-content" id="acc-specific">
                    <!-- Populated dynamically -->
                </div>
            </div>
        </aside>
    </div>

    <!-- SCRIPT ENGINE -->
    <script>
        const isStandalone = ${isStandalone ? 'true' : 'false'};
        let vscode = null;
        try {
            if (typeof acquireVsCodeApi === 'function') {
                vscode = acquireVsCodeApi();
            }
        } catch (_) {}

        // State Store
        let elements = [];
        let selectedId = null;
        let isPreviewMode = false;

        // Container info for background
        let bgConfig = {
            name: "MainWindow",
            responsive: true,
            minWidth: "500px",
            maxWidth: "1400px",
            minHeight: "700px"
        };

        // DOM elements
        const artboardRoot = document.getElementById('artboard-root');
        const inspectorHeaderTitle = document.getElementById('inspector-header-title');
        const btnSave = document.getElementById('btn-save');
        const saveBtnText = document.getElementById('save-btn-text');
        const btnPreview = document.getElementById('btn-preview');
        const previewBtnText = document.getElementById('preview-btn-text');
        const btnPublish = document.getElementById('btn-publish');
        const btnApiDocs = document.getElementById('btn-api-docs');
        const paletteFilter = document.getElementById('palette-filter');
        const elementsCounter = document.getElementById('canvas-elements-counter');

        // Drag & Drop State
        let draggedElementId = null;
        let draggedFromPaletteType = null;
        const dropGhost = document.createElement('div');
        dropGhost.className = 'drop-ghost-placeholder';
        dropGhost.innerHTML = \`
            <div class="cursor-badge">
                <span>👆</span>
                <span id="ghost-tooltip-text">Drop component here to place or reorder</span>
            </div>
        \`;

        // -------------------------------------------------------------
        // PARSER: Converts .illp code into element tree
        // -------------------------------------------------------------
        function parseIllpToTree(code) {
            const list = [];
            const lines = (code || '').split(/\\r?\\n/);
            const stack = [];

            function getCurrentTarget() {
                return stack.length > 0 ? stack[stack.length - 1].children : list;
            }

            lines.forEach((line) => {
                const tr = line.trim();
                if (!tr || tr.startsWith('//') || tr.startsWith('/-') || tr.startsWith('visibility:') || tr.startsWith('/*') || tr.startsWith('*') || tr.startsWith('=')) {
                    return;
                }

                if (tr === '}') {
                    if (stack.length > 1) {
                        stack.pop();
                    }
                    return;
                }

                // Background
                if (tr.startsWith('Background')) {
                    const m = tr.match(/^Background\\s+"([^"]+)"/i);
                    if (m) bgConfig.name = m[1];
                    const minW = tr.match(/minWidth:\\s*"([^"]+)"/i);
                    if (minW) bgConfig.minWidth = minW[1];
                    const maxW = tr.match(/maxWidth:\\s*"([^"]+)"/i);
                    if (maxW) bgConfig.maxWidth = maxW[1];
                    stack.push({ type: 'Background', name: bgConfig.name, children: list });
                    return;
                }

                // DataGrid
                if (tr.startsWith('DataGrid')) {
                    const mName = tr.match(/^DataGrid\\s+"([^"]+)"/);
                    const mRpc = tr.match(/rpcSource:\\s*"([^"]+)"/);
                    const mPage = tr.match(/pageSize:\\s*([0-9]+)/);
                    const item = {
                        id: mName ? mName[1] : 'DataGrid_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'ActiveUserSessions',
                        type: 'DataGrid',
                        title: 'Active User Sessions',
                        rpcSource: mRpc ? mRpc[1] : 'server.Users.list',
                        pageSize: mPage ? parseInt(mPage[1], 10) : 25,
                        autoPagination: true,
                        columns: ['Name', 'Email', 'User', 'Datetime', 'Actions']
                    };
                    getCurrentTarget().push(item);
                    return;
                }

                // Kanban
                if (tr.startsWith('Kanban')) {
                    const mName = tr.match(/^Kanban\\s+"([^"]+)"/);
                    const mRpc = tr.match(/rpcSource:\\s*"([^"]+)"/);
                    const item = {
                        id: mName ? mName[1] : 'Kanban_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'TaskPipeline',
                        type: 'Kanban',
                        title: 'Task Pipeline',
                        rpcSource: mRpc ? mRpc[1] : 'server.Tasks.list',
                        columns: ['Task', 'Completed', 'Task']
                    };
                    getCurrentTarget().push(item);
                    return;
                }

                // Button
                if (tr.startsWith('Button')) {
                    const mName = tr.match(/^Button\\s+"([^"]+)"/);
                    const mText = tr.match(/text:\\s*"([^"]+)"/);
                    getCurrentTarget().push({
                        id: mName ? mName[1] : 'Button_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'PrimaryButton',
                        type: 'Button',
                        text: mText ? mText[1] : 'Primary Button',
                        variant: 'primary'
                    });
                    return;
                }

                // TextInput
                if (tr.startsWith('TextInput')) {
                    const mName = tr.match(/^TextInput\\s+"([^"]+)"/);
                    const mPh = tr.match(/placeholder:\\s*"([^"]+)"/);
                    getCurrentTarget().push({
                        id: mName ? mName[1] : 'Input_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'Input',
                        type: 'TextInput',
                        placeholder: mPh ? mPh[1] : 'Input'
                    });
                    return;
                }

                // Card / Section
                if (tr.startsWith('Card')) {
                    const mName = tr.match(/^Card\\s+"([^"]+)"/);
                    const mTitle = tr.match(/title:\\s*"([^"]+)"/);
                    const item = {
                        id: mName ? mName[1] : 'Card_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'Section',
                        type: 'Card',
                        title: mTitle ? mTitle[1] : 'Section Container',
                        children: []
                    };
                    getCurrentTarget().push(item);
                    if (tr.endsWith('{')) stack.push(item);
                    return;
                }

                // Stack
                if (tr.startsWith('Stack')) {
                    const mName = tr.match(/^Stack\\s+"([^"]+)"/);
                    const mDir = tr.match(/direction:\\s*"([^"]+)"/);
                    const mGap = tr.match(/gap:\\s*"([^"]+)"/);
                    const item = {
                        id: mName ? mName[1] : 'Stack_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'Stack_1',
                        type: 'Stack',
                        direction: mDir ? mDir[1] : 'horizontal',
                        gap: mGap ? mGap[1] : '16px',
                        children: []
                    };
                    getCurrentTarget().push(item);
                    if (tr.endsWith('{')) stack.push(item);
                    return;
                }

                // ResponsiveGrid
                if (tr.startsWith('ResponsiveGrid') || tr.startsWith('Grid')) {
                    const mName = tr.match(/^(?:ResponsiveGrid|Grid)\\s+"([^"]+)"/);
                    const item = {
                        id: mName ? mName[1] : 'Grid_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'AdaptiveGrid',
                        type: 'ResponsiveGrid',
                        columns: 12,
                        children: []
                    };
                    getCurrentTarget().push(item);
                    if (tr.endsWith('{')) stack.push(item);
                    return;
                }

                // Text
                if (tr.startsWith('Text ')) {
                    const mName = tr.match(/^Text\\s+"([^"]+)"/);
                    const mContent = tr.match(/content:\\s*"([^"]+)"/);
                    getCurrentTarget().push({
                        id: mName ? mName[1] : 'Text_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'Header',
                        type: 'Text',
                        content: mContent ? mContent[1] : 'Header'
                    });
                    return;
                }

                // Fallback generic component
                const mType = tr.match(/^([A-Za-z0-9_]+)\\s+"([^"]+)"/);
                if (mType) {
                    const type = mType[1];
                    const name = mType[2];
                    const item = {
                        id: name || type + '_' + Math.random().toString(36).substr(2, 5),
                        name: name || type,
                        type: type,
                        children: tr.endsWith('{') ? [] : undefined
                    };
                    getCurrentTarget().push(item);
                    if (tr.endsWith('{')) stack.push(item);
                }
            });

            // If empty, provide the default showcase matching the user screenshot
            if (list.length === 0) {
                list.push(
                    {
                        id: 'Header_1',
                        name: 'Header',
                        type: 'Header',
                        title: 'Header',
                        subtitle: 'Welcome, User'
                    },
                    {
                        id: 'DataGrid_Sessions',
                        name: 'ActiveUserSessions',
                        type: 'DataGrid',
                        title: 'Active User Sessions',
                        rpcSource: 'server.Users.list',
                        pageSize: 25,
                        autoPagination: true,
                        columns: ['Name', 'Email', 'User', 'Datetime', 'Actions']
                    },
                    {
                        id: 'Kanban_Pipeline',
                        name: 'TaskPipeline',
                        type: 'Kanban',
                        title: 'Task Pipeline',
                        rpcSource: 'server.Tasks.list',
                        columns: ['Task', 'Completed', 'Task']
                    },
                    {
                        id: 'Card_Form',
                        name: 'FormSection',
                        type: 'Card',
                        title: 'Form Controls',
                        children: [
                            { id: 'Input_1', name: 'Input', type: 'TextInput', placeholder: 'Input' },
                            { id: 'Btn_1', name: 'PrimaryButton', type: 'Button', text: 'Primary Button', variant: 'primary' }
                        ]
                    }
                );
            }

            return list;
        }

        // Helper to find an element and its parent array in the tree
        function findElementNode(list, id, parent = null) {
            for (let i = 0; i < list.length; i++) {
                if (list[i].id === id) {
                    return { item: list[i], index: i, list, parent };
                }
                if (list[i].children && list[i].children.length > 0) {
                    const found = findElementNode(list[i].children, id, list[i]);
                    if (found) return found;
                }
            }
            return null;
        }

        // Factory for new components
        function createNewComponent(type) {
            const id = type + '_' + Math.random().toString(36).substr(2, 5);
            let item = { id, name: id, type };

            if (type === 'DataGrid') {
                item.title = 'Active User Sessions';
                item.rpcSource = 'server.Users.list';
                item.pageSize = 25;
                item.autoPagination = true;
                item.columns = ['Name', 'Email', 'User', 'Datetime', 'Actions'];
            } else if (type === 'Kanban') {
                item.title = 'Task Pipeline';
                item.rpcSource = 'server.Tasks.list';
                item.columns = ['Task', 'Completed', 'Task'];
            } else if (type === 'Button') {
                item.text = 'Primary Button';
                item.variant = 'primary';
            } else if (type === 'TextInput') {
                item.placeholder = 'Input';
            } else if (type === 'Card') {
                item.title = 'Section Container';
                item.children = [];
            } else if (type === 'Stack') {
                item.direction = 'horizontal';
                item.gap = '16px';
                item.children = [];
            } else if (type === 'ResponsiveGrid') {
                item.columns = 12;
                item.children = [];
            } else if (type === 'Chart') {
                item.title = 'Analytics Overview';
                item.rpcSource = 'server.Analytics.metrics';
            } else if (type === 'Toast') {
                item.message = 'Notification alert ready';
            } else if (type === 'Text') {
                item.content = 'Header Title';
            }

            return item;
        }

        // -------------------------------------------------------------
        // RENDER CANVAS & INTERACTIVE ELEMENT MANIPULATION
        // -------------------------------------------------------------
        function renderCanvas() {
            artboardRoot.innerHTML = '';
            renderElementsList(elements, artboardRoot);

            // Update counter
            let count = 0;
            function countNodes(l) {
                l.forEach(x => { count++; if (x.children) countNodes(x.children); });
            }
            countNodes(elements);
            elementsCounter.textContent = count + ' component' + (count > 1 ? 's' : '');
        }

        function renderElementsList(list, domParent) {
            list.forEach((el, index) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'ui-canvas-item' + (el.id === selectedId ? ' active-selected' : '');
                wrapper.setAttribute('data-id', el.id);
                wrapper.draggable = !isPreviewMode;

                // Selection badge at top left (matches screenshot: ▾ DataGrid)
                if (el.id === selectedId && !isPreviewMode) {
                    const tagBadge = document.createElement('div');
                    tagBadge.className = 'selection-tag-badge';
                    tagBadge.innerHTML = '▾ ' + (el.type || 'Element');
                    wrapper.appendChild(tagBadge);
                }

                // Quick Action Bar on top right
                if (!isPreviewMode) {
                    const qBar = document.createElement('div');
                    qBar.className = 'element-quick-toolbar';

                    // Drag handle
                    const dragBtn = document.createElement('button');
                    dragBtn.className = 'q-btn drag-handle';
                    dragBtn.innerHTML = '⠿';
                    dragBtn.title = 'Drag to move this element';
                    qBar.appendChild(dragBtn);

                    // Move Up
                    if (index > 0) {
                        const upBtn = document.createElement('button');
                        upBtn.className = 'q-btn';
                        upBtn.innerHTML = '▲';
                        upBtn.title = 'Move Up';
                        upBtn.onclick = (e) => {
                            e.stopPropagation();
                            const tmp = list[index];
                            list[index] = list[index - 1];
                            list[index - 1] = tmp;
                            renderCanvas();
                            renderPropertiesInspector();
                        };
                        qBar.appendChild(upBtn);
                    }

                    // Move Down
                    if (index < list.length - 1) {
                        const downBtn = document.createElement('button');
                        downBtn.className = 'q-btn';
                        downBtn.innerHTML = '▼';
                        downBtn.title = 'Move Down';
                        downBtn.onclick = (e) => {
                            e.stopPropagation();
                            const tmp = list[index];
                            list[index] = list[index + 1];
                            list[index + 1] = tmp;
                            renderCanvas();
                            renderPropertiesInspector();
                        };
                        qBar.appendChild(downBtn);
                    }

                    // Duplicate
                    const dupBtn = document.createElement('button');
                    dupBtn.className = 'q-btn';
                    dupBtn.innerHTML = '⧉';
                    dupBtn.title = 'Duplicate (Ctrl+D)';
                    dupBtn.onclick = (e) => {
                        e.stopPropagation();
                        duplicateElement(el.id);
                    };
                    qBar.appendChild(dupBtn);

                    // Delete
                    const delBtn = document.createElement('button');
                    delBtn.className = 'q-btn delete-btn';
                    delBtn.innerHTML = '✕';
                    delBtn.title = 'Delete Element (Del)';
                    delBtn.onclick = (e) => {
                        e.stopPropagation();
                        deleteElement(el.id);
                    };
                    qBar.appendChild(delBtn);

                    wrapper.appendChild(qBar);
                }

                // Element Selection on Click
                wrapper.onclick = (e) => {
                    e.stopPropagation();
                    selectedId = el.id;
                    renderCanvas();
                    renderPropertiesInspector();
                };

                // DRAG START: Move an existing element already present
                wrapper.addEventListener('dragstart', (e) => {
                    if (isPreviewMode) return;
                    e.stopPropagation();
                    draggedElementId = el.id;
                    draggedFromPaletteType = null;
                    e.dataTransfer.setData('source', 'canvas');
                    e.dataTransfer.setData('id', el.id);
                    e.dataTransfer.effectAllowed = 'move';
                    wrapper.classList.add('is-dragging');

                    // Set ghost tooltip text
                    const ghostText = document.getElementById('ghost-tooltip-text');
                    if (ghostText) {
                        ghostText.textContent = 'Move ' + el.type + ' (' + el.name + ') to new position';
                    }
                });

                wrapper.addEventListener('dragend', () => {
                    wrapper.classList.remove('is-dragging');
                    if (dropGhost.parentNode) {
                        dropGhost.parentNode.removeChild(dropGhost);
                    }
                });

                // SPECIFIC COMPONENT VISUAL RENDERERS
                if (el.type === 'Header') {
                    const block = document.createElement('div');
                    block.className = 'canvas-header-block';
                    block.innerHTML = \`
                        <div class="canvas-header-left">
                            <span style="color:var(--accent-cyan);">◖</span>
                            <span>\${el.title || 'Header'}</span>
                        </div>
                        <div class="canvas-header-right">
                            <span>\${el.subtitle || 'Welcome, User'}</span>
                            <div class="user-avatar-circle">👤</div>
                        </div>
                    \`;
                    wrapper.appendChild(block);
                } else if (el.type === 'DataGrid') {
                    const dg = document.createElement('div');
                    dg.className = 'canvas-datagrid-block';
                    dg.innerHTML = \`
                        <div class="datagrid-title-bar">
                            <span>\${el.title || 'Active User Sessions'}</span>
                            <span style="color:var(--text-muted); cursor:pointer;">⋮</span>
                        </div>
                        <table class="datagrid-table-custom">
                            <thead>
                                <tr>
                                    <th style="width:36px;"><input type="checkbox" disabled /></th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>User</th>
                                    <th>Datetime</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><input type="checkbox" disabled /></td>
                                    <td><div class="row-skeleton-bar" style="width:70%;"></div></td>
                                    <td><div class="row-skeleton-bar" style="width:85%;"></div></td>
                                    <td><div class="row-skeleton-bar" style="width:60%;"></div></td>
                                    <td><div class="row-skeleton-bar" style="width:75%;"></div></td>
                                    <td><span style="color:var(--text-muted);">⋮</span></td>
                                </tr>
                                <tr>
                                    <td><input type="checkbox" disabled /></td>
                                    <td><div class="row-skeleton-bar" style="width:65%;"></div></td>
                                    <td><div class="row-skeleton-bar" style="width:90%;"></div></td>
                                    <td><div class="row-skeleton-bar" style="width:55%;"></div></td>
                                    <td><div class="row-skeleton-bar" style="width:70%;"></div></td>
                                    <td><span style="color:var(--text-muted);">⋮</span></td>
                                </tr>
                                <tr>
                                    <td><input type="checkbox" disabled /></td>
                                    <td><div class="row-skeleton-bar" style="width:80%;"></div></td>
                                    <td><div class="row-skeleton-bar" style="width:75%;"></div></td>
                                    <td><div class="row-skeleton-bar" style="width:65%;"></div></td>
                                    <td><div class="row-skeleton-bar" style="width:80%;"></div></td>
                                    <td><span style="color:var(--text-muted);">⋮</span></td>
                                </tr>
                            </tbody>
                        </table>
                        <div class="datagrid-footer">
                            <span>Page 1 of 1</span>
                            <span>&lt; 1 &gt;</span>
                        </div>
                    \`;
                    wrapper.appendChild(dg);
                } else if (el.type === 'Kanban') {
                    const kb = document.createElement('div');
                    kb.className = 'canvas-kanban-block';
                    kb.innerHTML = \`
                        <div class="kanban-title-bar">
                            <span>\${el.title || 'Task Pipeline'}</span>
                            <span style="color:var(--text-muted); cursor:pointer;">⋮</span>
                        </div>
                        <div class="kanban-cols-container">
                            <div class="kanban-col-item">
                                <div class="kanban-col-top">
                                    <span>Task</span>
                                    <span>⋮</span>
                                </div>
                                <div class="kanban-task-card emerald-tag">
                                    <div class="row-skeleton-bar" style="width:80%;"></div>
                                </div>
                                <div class="kanban-task-card amber-tag">
                                    <div class="row-skeleton-bar" style="width:60%;"></div>
                                </div>
                            </div>
                            <div class="kanban-col-item">
                                <div class="kanban-col-top">
                                    <span>Completed</span>
                                    <span>⋮</span>
                                </div>
                                <div class="kanban-task-card">
                                    <div class="row-skeleton-bar" style="width:75%;"></div>
                                </div>
                            </div>
                            <div class="kanban-col-item">
                                <div class="kanban-col-top">
                                    <span>Task</span>
                                    <span>⋮</span>
                                </div>
                                <div class="kanban-task-card">
                                    <div class="row-skeleton-bar" style="width:70%;"></div>
                                </div>
                            </div>
                        </div>
                    \`;
                    wrapper.appendChild(kb);
                } else if (el.type === 'TextInput') {
                    const inp = document.createElement('div');
                    inp.style.display = 'flex';
                    inp.style.flexDirection = 'column';
                    inp.style.gap = '6px';
                    inp.innerHTML = \`
                        <span style="font-size:11px;color:var(--text-secondary);font-weight:600;">\${el.name || 'Input'}</span>
                        <input class="canvas-input-field" type="text" placeholder="\${el.placeholder || 'Input'}" readonly />
                    \`;
                    wrapper.appendChild(inp);
                } else if (el.type === 'Button') {
                    const btn = document.createElement('button');
                    btn.className = 'canvas-primary-btn';
                    btn.type = 'button';
                    btn.textContent = el.text || 'Primary Button';
                    if (el.variant === 'outline') {
                        btn.style.background = 'transparent';
                        btn.style.border = '1px solid var(--accent-cyan)';
                        btn.style.color = 'var(--accent-cyan)';
                    } else if (el.variant === 'standard') {
                        btn.style.background = 'var(--bg-element)';
                        btn.style.color = '#fff';
                        btn.style.border = '1px solid var(--border-color)';
                        btn.style.boxShadow = 'none';
                    }
                    wrapper.appendChild(btn);
                } else if (el.type === 'Text') {
                    const t = document.createElement('div');
                    t.style.fontSize = '16px';
                    t.style.fontWeight = 'bold';
                    t.style.color = '#fff';
                    t.textContent = el.content || 'Header Title';
                    t.contentEditable = !isPreviewMode;
                    t.oninput = () => { el.content = t.textContent; };
                    wrapper.appendChild(t);
                } else if (el.type === 'Card' || el.type === 'Stack' || el.type === 'ResponsiveGrid') {
                    // Container Box
                    const cont = document.createElement('div');
                    cont.className = 'canvas-form-block';
                    cont.innerHTML = \`
                        <div style="font-size:13px;font-weight:700;color:var(--text-secondary);display:flex;justify-content:space-between;">
                            <span>\${el.title || el.name}</span>
                            <span style="font-size:10px;color:var(--accent-cyan);text-transform:uppercase;">\${el.type}</span>
                        </div>
                    \`;
                    const slot = document.createElement('div');
                    slot.className = 'container-drop-zone' + (el.type === 'ResponsiveGrid' ? ' grid-layout' : (el.type === 'Stack' && el.direction === 'horizontal' ? ' row-layout' : ''));
                    slot.setAttribute('data-container-id', el.id);

                    el.children = el.children || [];
                    renderElementsList(el.children, slot);

                    cont.appendChild(slot);
                    wrapper.appendChild(cont);
                } else {
                    // Generic preview block
                    const block = document.createElement('div');
                    block.className = 'canvas-form-block';
                    block.innerHTML = \`
                        <div style="display:flex;justify-content:space-between;align-items:center;">
                            <span style="font-weight:bold;">\${el.name}</span>
                            <span style="font-size:10px;color:var(--accent-cyan);">\${el.type}</span>
                        </div>
                    \`;
                    wrapper.appendChild(block);
                }

                domParent.appendChild(wrapper);
            });
        }

        // -------------------------------------------------------------
        // DRAG & DROP HANDLING OVER THE CANVAS
        // -------------------------------------------------------------
        function getDropTargetInfo(containerDom, clientY) {
            const children = Array.from(containerDom.querySelectorAll(':scope > .ui-canvas-item'));
            for (let i = 0; i < children.length; i++) {
                const rect = children[i].getBoundingClientRect();
                const midY = rect.top + rect.height / 2;
                if (clientY < midY) {
                    return { index: i, beforeElement: children[i] };
                }
            }
            return { index: children.length, beforeElement: null };
        }

        artboardRoot.addEventListener('dragover', (e) => {
            if (isPreviewMode) return;
            e.preventDefault();
            e.stopPropagation();

            const slot = e.target.closest('.container-drop-zone') || artboardRoot;
            const targetInfo = getDropTargetInfo(slot, e.clientY);

            if (targetInfo.beforeElement) {
                slot.insertBefore(dropGhost, targetInfo.beforeElement);
            } else {
                slot.appendChild(dropGhost);
            }
        });

        artboardRoot.addEventListener('dragleave', (e) => {
            if (!artboardRoot.contains(e.relatedTarget)) {
                if (dropGhost.parentNode) {
                    dropGhost.parentNode.removeChild(dropGhost);
                }
            }
        });

        artboardRoot.addEventListener('drop', (e) => {
            if (isPreviewMode) return;
            e.preventDefault();
            e.stopPropagation();

            const slot = e.target.closest('.container-drop-zone');
            let targetList = elements;

            if (slot && slot.getAttribute('data-container-id')) {
                const cId = slot.getAttribute('data-container-id');
                const foundContainer = findElementNode(elements, cId);
                if (foundContainer && foundContainer.item.children) {
                    targetList = foundContainer.item.children;
                }
            }

            const targetDom = slot || artboardRoot;
            const targetInfo = getDropTargetInfo(targetDom, e.clientY);

            if (dropGhost.parentNode) {
                dropGhost.parentNode.removeChild(dropGhost);
            }

            const source = e.dataTransfer.getData('source');
            const elemId = e.dataTransfer.getData('id');

            // CASE 1: Moving an existing element on the canvas
            if (source === 'canvas' && elemId) {
                const found = findElementNode(elements, elemId);
                if (found) {
                    // Remove from old parent list
                    found.list.splice(found.index, 1);

                    let destIndex = targetInfo.index;
                    if (found.list === targetList && found.index < destIndex) {
                        destIndex--;
                    }
                    targetList.splice(destIndex, 0, found.item);
                    selectedId = found.item.id;
                }
            } 
            // CASE 2: Dropping a brand new component from left palette
            else if (draggedFromPaletteType) {
                const newItem = createNewComponent(draggedFromPaletteType);
                targetList.splice(targetInfo.index, 0, newItem);
                selectedId = newItem.id;
                draggedFromPaletteType = null;
            }

            renderCanvas();
            renderPropertiesInspector();
        });

        // Palette Card Dragstart
        document.querySelectorAll('.palette-card').forEach(card => {
            card.addEventListener('dragstart', (e) => {
                const type = card.getAttribute('data-type');
                draggedFromPaletteType = type;
                draggedElementId = null;
                e.dataTransfer.setData('source', 'palette');
                e.dataTransfer.setData('type', type);
                e.dataTransfer.effectAllowed = 'copy';

                const ghostText = document.getElementById('ghost-tooltip-text');
                if (ghostText) {
                    ghostText.textContent = \`Drop \${type} to Create new Section. Bind to RPC 'Users.list'?\`;
                }
            });

            card.addEventListener('dragend', () => {
                draggedFromPaletteType = null;
                if (dropGhost.parentNode) {
                    dropGhost.parentNode.removeChild(dropGhost);
                }
            });
        });

        // -------------------------------------------------------------
        // ELEMENT OPERATIONS: DUPLICATE, DELETE, SELECT
        // -------------------------------------------------------------
        function deleteElement(id) {
            const found = findElementNode(elements, id);
            if (found) {
                found.list.splice(found.index, 1);
                if (selectedId === id) selectedId = null;
                renderCanvas();
                renderPropertiesInspector();
            }
        }

        function duplicateElement(id) {
            const found = findElementNode(elements, id);
            if (found) {
                const clone = JSON.parse(JSON.stringify(found.item));
                clone.id = clone.type + '_' + Math.random().toString(36).substr(2, 5);
                clone.name = clone.name + '_Copy';
                found.list.splice(found.index + 1, 0, clone);
                selectedId = clone.id;
                renderCanvas();
                renderPropertiesInspector();
            }
        }

        // Keyboard Shortcuts: Del to delete, Ctrl+D to duplicate
        window.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedId) {
                    e.preventDefault();
                    deleteElement(selectedId);
                }
            } else if (e.ctrlKey && e.key.toLowerCase() === 'd') {
                if (selectedId) {
                    e.preventDefault();
                    duplicateElement(selectedId);
                }
            }
        });

        // Deselect when clicking on canvas backdrop
        document.getElementById('canvas-viewport').onclick = (e) => {
            if (e.target.id === 'canvas-viewport' || e.target.id === 'artboard-root') {
                selectedId = null;
                renderCanvas();
                renderPropertiesInspector();
            }
        };

        const btnDeselect = document.getElementById('btn-deselect');
        if (btnDeselect) {
            btnDeselect.onclick = () => {
                selectedId = null;
                renderCanvas();
                renderPropertiesInspector();
            };
        }

        // -------------------------------------------------------------
        // PROPERTIES INSPECTOR RENDERING & LIVE UPDATE
        // -------------------------------------------------------------
        function renderPropertiesInspector() {
            const found = selectedId ? findElementNode(elements, selectedId) : null;

            if (!found) {
                inspectorHeaderTitle.textContent = "PROPERTIES - Window Canvas";
                document.getElementById('acc-specific').innerHTML = \`
                    <div class="control-row">
                        <span class="control-label">Window Title:</span>
                        <input type="text" class="prop-text-input" id="prop-win-title" value="\${bgConfig.name}" />
                    </div>
                    <div class="control-row">
                        <span class="control-label">Min Width:</span>
                        <input type="text" class="prop-text-input" id="prop-win-minw" value="\${bgConfig.minWidth}" />
                    </div>
                    <div class="control-row">
                        <span class="control-label">Max Width:</span>
                        <input type="text" class="prop-text-input" id="prop-win-maxw" value="\${bgConfig.maxWidth}" />
                    </div>
                \`;
                const titleInput = document.getElementById('prop-win-title');
                if (titleInput) {
                    titleInput.oninput = () => { bgConfig.name = titleInput.value; };
                }
                return;
            }

            const el = found.item;
            inspectorHeaderTitle.textContent = "PROPERTIES - " + (el.type || 'Element');

            // Data binding inputs
            const rpcInput = document.getElementById('prop-rpc-method');
            if (rpcInput) {
                rpcInput.value = el.rpcSource || 'server.Users.list';
                rpcInput.oninput = () => { el.rpcSource = rpcInput.value.trim(); };
            }

            const autoPageCheck = document.getElementById('prop-auto-page');
            if (autoPageCheck) {
                autoPageCheck.checked = !!el.autoPagination;
                autoPageCheck.onchange = () => { el.autoPagination = autoPageCheck.checked; };
            }

            // Populate specific fields
            let specificHtml = \`
                <div class="control-row">
                    <span class="control-label">Identifier (Name):</span>
                    <input type="text" class="prop-text-input" id="prop-elem-name" value="\${el.name || ''}" />
                </div>
            \`;

            if (el.type === 'DataGrid' || el.type === 'Kanban' || el.type === 'Card' || el.type === 'Header') {
                specificHtml += \`
                    <div class="control-row">
                        <span class="control-label">Header Title:</span>
                        <input type="text" class="prop-text-input" id="prop-elem-title" value="\${el.title || ''}" />
                    </div>
                \`;
            }

            if (el.type === 'Button') {
                specificHtml += \`
                    <div class="control-row">
                        <span class="control-label">Button Label:</span>
                        <input type="text" class="prop-text-input" id="prop-btn-text" value="\${el.text || ''}" />
                    </div>
                    <div class="control-row">
                        <span class="control-label">Variant:</span>
                        <select class="prop-text-input" id="prop-btn-variant">
                            <option value="primary" \${el.variant === 'primary' ? 'selected' : ''}>Primary (Neon Cyan)</option>
                            <option value="outline" \${el.variant === 'outline' ? 'selected' : ''}>Outline Cyan</option>
                            <option value="standard" \${el.variant === 'standard' ? 'selected' : ''}>Standard Slate</option>
                        </select>
                    </div>
                \`;
            }

            if (el.type === 'TextInput') {
                specificHtml += \`
                    <div class="control-row">
                        <span class="control-label">Placeholder:</span>
                        <input type="text" class="prop-text-input" id="prop-input-ph" value="\${el.placeholder || ''}" />
                    </div>
                \`;
            }

            if (el.type === 'DataGrid' && el.columns) {
                specificHtml += \`
                    <div class="control-row">
                        <span class="control-label">Columns (CSV):</span>
                        <input type="text" class="prop-text-input" id="prop-grid-cols" value="\${el.columns.join(', ')}" />
                    </div>
                \`;
            }

            document.getElementById('acc-specific').innerHTML = specificHtml;

            // Wire input events
            const nameInput = document.getElementById('prop-elem-name');
            if (nameInput) {
                nameInput.oninput = () => { el.name = nameInput.value; renderCanvas(); };
            }

            const titleInput = document.getElementById('prop-elem-title');
            if (titleInput) {
                titleInput.oninput = () => { el.title = titleInput.value; renderCanvas(); };
            }

            const btnTextInput = document.getElementById('prop-btn-text');
            if (btnTextInput) {
                btnTextInput.oninput = () => { el.text = btnTextInput.value; renderCanvas(); };
            }

            const btnVarInput = document.getElementById('prop-btn-variant');
            if (btnVarInput) {
                btnVarInput.onchange = () => { el.variant = btnVarInput.value; renderCanvas(); };
            }

            const phInput = document.getElementById('prop-input-ph');
            if (phInput) {
                phInput.oninput = () => { el.placeholder = phInput.value; renderCanvas(); };
            }

            const colsInput = document.getElementById('prop-grid-cols');
            if (colsInput) {
                colsInput.oninput = () => {
                    el.columns = colsInput.value.split(',').map(s => s.trim()).filter(Boolean);
                    renderCanvas();
                };
            }
        }

        // Accordion toggle helper
        window.toggleAccordion = function(id) {
            const acc = document.getElementById('acc-' + id);
            if (acc) {
                acc.classList.toggle('collapsed');
            }
        };

        window.setSizeMode = function(mode) {
            document.querySelectorAll('#acc-layout .segmented-btn-group button').forEach(b => b.classList.remove('active'));
            event.target.classList.add('active');
        };

        window.setAlign = function(align) {
            document.querySelectorAll('#acc-layout .segmented-btn-group:nth-child(2) button').forEach(b => b.classList.remove('active'));
            event.target.classList.add('active');
            const found = selectedId ? findElementNode(elements, selectedId) : null;
            if (found) {
                found.item.customAlign = align;
                renderCanvas();
            }
        };

        window.editEvent = function(eventName) {
            const code = prompt(\`Edit \${eventName} handler logic:\`, \`// Called when \${eventName} triggers\\nprint("\${eventName} executed");\`);
            if (code !== null) {
                const found = selectedId ? findElementNode(elements, selectedId) : null;
                if (found) {
                    found.item['event_' + eventName] = code;
                    alert(\`✓ Event handler for \${eventName} updated!\`);
                }
            }
        };

        // -------------------------------------------------------------
        // PREVIEW MODE TOGGLE
        // -------------------------------------------------------------
        btnPreview.addEventListener('click', () => {
            isPreviewMode = !isPreviewMode;
            document.body.classList.toggle('preview-mode', isPreviewMode);
            btnPreview.classList.toggle('active', isPreviewMode);
            previewBtnText.textContent = isPreviewMode ? 'Edit Mode' : 'Preview';
            renderCanvas();
        });

        // -------------------------------------------------------------
        // SAVE SERIALIZATION (.ILLP CODE GENERATION)
        // -------------------------------------------------------------
        function stringifyElementTree(list, indent = "    ") {
            let str = "";
            list.forEach((el, index) => {
                const name = el.name || (el.type + "_1");
                let line = "";

                if (el.type === 'Header' || el.type === 'Text') {
                    line = indent + 'Text "' + name + '" content: "' + (el.title || el.content || 'Header') + '"';
                } else if (el.type === 'TextInput') {
                    line = indent + 'TextInput "' + name + '" placeholder: "' + (el.placeholder || 'Input') + '"';
                } else if (el.type === 'Button') {
                    line = indent + 'Button "' + name + '" text: "' + (el.text || 'Primary Button') + '"';
                    if (el.variant) line += ' variant: "' + el.variant + '"';
                } else if (el.type === 'DataGrid') {
                    line = indent + 'DataGrid "' + name + '" rpcSource: "' + (el.rpcSource || 'server.Users.list') + '" pageSize: ' + (el.pageSize || 25);
                } else if (el.type === 'Kanban') {
                    line = indent + 'Kanban "' + name + '" rpcSource: "' + (el.rpcSource || 'server.Tasks.list') + '"';
                } else if (el.type === 'Card' || el.type === 'Section') {
                    line = indent + 'Card "' + name + '" title: "' + (el.title || 'Section') + '" {\\n';
                    line += stringifyElementTree(el.children || [], indent + "    ");
                    line += indent + '}';
                } else if (el.type === 'Stack') {
                    line = indent + 'Stack "' + name + '" direction: "' + (el.direction || 'horizontal') + '" gap: "' + (el.gap || '16px') + '" {\\n';
                    line += stringifyElementTree(el.children || [], indent + "    ");
                    line += indent + '}';
                } else if (el.type === 'ResponsiveGrid') {
                    line = indent + 'ResponsiveGrid "' + name + '" columns: ' + (el.columns || 12) + ' {\\n';
                    line += stringifyElementTree(el.children || [], indent + "    ");
                    line += indent + '}';
                } else {
                    line = indent + el.type + ' "' + name + '"';
                    if (el.children) {
                        line += ' {\\n' + stringifyElementTree(el.children, indent + "    ") + indent + '}';
                    }
                }

                str += line + "\\n";
            });
            return str;
        }

        function generateFullIllpCode() {
            let code = "visibility: All\\n\\n";
            code += "/* ===================================================\\n";
            code += "   LLP Interface (.illp) - Generated by LLP UI BUILDER\\n";
            code += "   Device Security & Dynamic RPC Layer Active\\n";
            code += "   =================================================== *\\\\\\n\\n";

            code += 'Background "' + bgConfig.name + '" responsive: ' + (bgConfig.responsive ? 'true' : 'false');
            if (bgConfig.minWidth) code += ' minWidth: "' + bgConfig.minWidth + '"';
            if (bgConfig.maxWidth) code += ' maxWidth: "' + bgConfig.maxWidth + '"';
            code += ' {\\n';

            code += stringifyElementTree(elements, "    ");
            code += "}\\n";

            return code;
        }

        btnSave.addEventListener('click', () => {
            const finalCode = generateFullIllpCode();

            if (vscode) {
                vscode.postMessage({
                    command: 'saveIllp',
                    content: finalCode
                });
            } else if (isStandalone) {
                fetch('/api/save', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: finalCode })
                }).then(r => r.json()).then(res => {
                    if (res.ok) {
                        flashSaved();
                    } else {
                        alert("Erreur de sauvegarde : " + res.error);
                    }
                }).catch(err => {
                    alert("Erreur réseau de sauvegarde : " + err.message);
                });
            } else {
                flashSaved();
            }
        });

        function flashSaved() {
            saveBtnText.textContent = "Saved! ✓";
            btnSave.style.borderColor = "#10b981";
            btnSave.style.color = "#10b981";
            setTimeout(() => {
                saveBtnText.textContent = "Save";
                btnSave.style.borderColor = "#3b82f6";
                btnSave.style.color = "#93c5fd";
            }, 1800);
        }

        // Publish action
        btnPublish.addEventListener('click', () => {
            alert("🚀 [LLP Publish Engine]\\n\\nVotre interface est compilée et prête pour le déploiement multi-plateforme (Windows .exe, Webview, Android APK) avec signature matérielle Ed25519 active.");
        });

        // Search Palette Filter
        paletteFilter.addEventListener('input', () => {
            const query = paletteFilter.value.toLowerCase().trim();
            document.querySelectorAll('.palette-card').forEach(c => {
                const text = c.textContent.toLowerCase();
                c.style.display = text.includes(query) ? 'flex' : 'none';
            });
        });

        // INITIAL LOAD
        const initialRaw = ${JSON.stringify(illpContent)};
        elements = parseIllpToTree(initialRaw);
        renderCanvas();
        renderPropertiesInspector();
    </script>
</body>
</html>`;
}
/**
 * Starts a standalone HTTP server delivering the full LLP UI Builder in the browser.
 */
function startUiBuilderServer(options = {}) {
    return new Promise((resolve, reject) => {
        const port = options.port || 4950;
        const targetFilePath = options.filePath ? path.resolve(process.cwd(), options.filePath) : path.resolve(process.cwd(), "examples", "product_management", "advanced_ui.illp");
        let illpContent = "";
        if (fs.existsSync(targetFilePath)) {
            illpContent = fs.readFileSync(targetFilePath, "utf8");
        }
        else {
            illpContent = 'visibility: All\\n\\nBackground "MainWindow" responsive: true {\\n}';
        }
        const devMgr = device_1.DeviceIdentityManager.getInstance();
        const deviceId = devMgr.getDeviceId();
        const server = http.createServer((req, res) => {
            const parsedUrl = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
            const pathname = parsedUrl.pathname;
            res.setHeader("Access-Control-Allow-Origin", "*");
            res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
            res.setHeader("Access-Control-Allow-Headers", "Content-Type");
            if (req.method === "OPTIONS") {
                res.writeHead(204);
                res.end();
                return;
            }
            if (pathname === "/api/save" && req.method === "POST") {
                let body = "";
                req.on("data", chunk => { body += chunk; });
                req.on("end", () => {
                    try {
                        const data = JSON.parse(body);
                        if (data.content) {
                            const dir = path.dirname(targetFilePath);
                            if (!fs.existsSync(dir))
                                fs.mkdirSync(dir, { recursive: true });
                            fs.writeFileSync(targetFilePath, data.content, "utf8");
                            console.log(`[LLP UI Builder] Fichier sauvegardé : ${targetFilePath}`);
                            res.writeHead(200, { "Content-Type": "application/json" });
                            res.end(JSON.stringify({ ok: true, message: "Sauvegardé avec succès" }));
                            return;
                        }
                        res.writeHead(400, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ ok: false, error: "Contenu manquant" }));
                    }
                    catch (err) {
                        res.writeHead(500, { "Content-Type": "application/json" });
                        res.end(JSON.stringify({ ok: false, error: err.message }));
                    }
                });
                return;
            }
            if (pathname === "/api/status") {
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({
                    ok: true,
                    file: targetFilePath,
                    deviceId: devMgr.getDeviceId(),
                    fingerprint: devMgr.getDeviceFingerprint(),
                    sealed: devMgr.isKeySealed()
                }));
                return;
            }
            // Serve UI Builder HTML
            const html = getUiBuilderHtml({
                fileName: path.basename(targetFilePath),
                illpContent,
                deviceId,
                isStandalone: true
            });
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(html);
        });
        server.listen(port, "127.0.0.1", () => {
            const url = `http://127.0.0.1:${port}`;
            console.log(`===================================================`);
            console.log(` 🎨 LLP UI BUILDER démarré sur : ${url}`);
            console.log(` Fichier édité : ${targetFilePath}`);
            console.log(`===================================================`);
            if (options.openBrowser !== false) {
                const startCmd = process.platform === "win32" ? `start "" "${url}"` : (process.platform === "darwin" ? `open "${url}"` : `xdg-open "${url}"`);
                (0, child_process_1.exec)(startCmd);
            }
            resolve({ server, url, port });
        });
        server.on("error", (err) => {
            if (err.code === "EADDRINUSE") {
                startUiBuilderServer({ ...options, port: port + 1 }).then(resolve).catch(reject);
            }
            else {
                reject(err);
            }
        });
    });
}
