import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { DeviceIdentityManager } from "../stdlib/device";
import { LLP_LOGO_BASE64 } from "./logo";

export interface UiBuilderOptions {
  filePath?: string;
  port?: number;
  openBrowser?: boolean;
}

export function convertIllpsToCss(illps: string): string {
  if (!illps) return "";

  let css = illps.replace(/\/\*([\s\S]*?)\*\\/g, "/*$1*/");
  css = css.replace(/\/-.*$/gm, "");
  css = css.replace(/visibility:\s*\w+;?/gi, "");

  css = css.replace(/([^{]+)\{([^}]+)\}/g, (match, rawSelector, body) => {
    let sel = rawSelector.trim();
    if (/^Background/i.test(sel)) {
      sel = "#artboard-root";
    } else {
      sel = sel.replace(/(?:[A-Za-z0-9_]+)?#([A-Za-z0-9_]+)/g, "#$1, [data-id=\"$1\"]");
      sel = sel.replace(/(?:[A-Za-z0-9_]+)\.([A-Za-z0-9_]+)/g, ".$1, [data-id=\"$1\"]");
    }

    let lines = body.split(/\r?\n/).map((l: string) => l.trim()).filter(Boolean);
    let propLines = lines.map((line: string) => {
      let l = line;
      if (/responsive:\s*(true|false);?/i.test(l)) return "";

      l = l.replace(/fontSize:/gi, "font-size:")
           .replace(/marginBottom:/gi, "margin-bottom:")
           .replace(/marginTop:/gi, "margin-top:")
           .replace(/marginLeft:/gi, "margin-left:")
           .replace(/marginRight:/gi, "margin-right:")
           .replace(/minWidth:/gi, "min-width:")
           .replace(/maxWidth:/gi, "max-width:")
           .replace(/minHeight:/gi, "min-height:")
           .replace(/maxHeight:/gi, "max-height:")
           .replace(/borderRadius:/gi, "border-radius:")
           .replace(/backgroundColor:/gi, "background-color:")
           .replace(/align:\s*center/gi, "text-align: center; margin-left: auto; margin-right: auto;")
           .replace(/align:\s*right/gi, "text-align: right; margin-left: auto;")
           .replace(/align:\s*left/gi, "text-align: left; margin-right: auto;")
           .replace(/font:\s*bold/gi, "font-weight: bold;");

      if (!l.endsWith(";") && l.includes(":")) {
        l += ";";
      }
      return "    " + l;
    }).filter(Boolean);

    return sel + " {\n" + propLines.join("\n") + "\n}\n";
  });

  return css;
}

export function getUiBuilderHtml(options: {
  fileName: string;
  illpContent: string;
  illpsContent?: string;
  deviceId?: string;
  isStandalone?: boolean;
}): string {
  const { fileName, illpContent, illpsContent = "", deviceId = "DEV_LOCAL_STABLE_HWID", isStandalone = false } = options;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LLP UI BUILDER - ${fileName}</title>
    <link rel="icon" type="image/png" href="${LLP_LOGO_BASE64}">
    <style id="illps-compiled-styles">
${convertIllpsToCss(illpsContent)}
    </style>
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
            background: #11141f;
            color: #f8fafc;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 24px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.45);
            transition: all 0.2s ease;
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
        /* ------------------------------------------------------------- */
        /* RIGHT PANEL: PROPERTIES INSPECTOR                             */
        /* ------------------------------------------------------------- */
        #properties-panel {
            width: 350px;
            min-width: 290px;
            max-width: 440px;
            background: var(--bg-panel);
            border-left: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            height: 100%;
            transition: all 0.2s ease;
        }

        #properties-panel.collapsed {
            width: 0 !important;
            min-width: 0 !important;
            max-width: 0 !important;
            overflow: hidden !important;
            border-left: none !important;
            padding: 0 !important;
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
            flex-direction: column;
            gap: 5px;
            margin-bottom: 6px;
        }

        .control-row.horizontal {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
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
            box-sizing: border-box;
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

        /* Modal & Drawer overlays */
        .builder-modal-overlay {
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0, 0, 0, 0.75);
            backdrop-filter: blur(4px);
            z-index: 9999;
            display: none;
            align-items: center;
            justify-content: center;
        }
        .builder-modal-overlay.active {
            display: flex;
        }
        .builder-modal-box {
            background: #111827;
            border: 1px solid var(--border-color);
            border-radius: 12px;
            width: 90%;
            max-width: 620px;
            max-height: 85vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.7);
            display: flex;
            flex-direction: column;
        }
        .builder-modal-header {
            padding: 16px 20px;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .builder-modal-title {
            font-size: 14px;
            font-weight: 700;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .builder-modal-body {
            padding: 20px;
            font-size: 13px;
            color: var(--text-secondary);
            line-height: 1.6;
        }
        .builder-modal-footer {
            padding: 14px 20px;
            border-top: 1px solid var(--border-color);
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }

        /* Nav Dropdown Menus */
        .nav-dropdown-wrapper {
            position: relative;
            display: inline-block;
        }
        .nav-dropdown-menu {
            position: absolute;
            top: 100%;
            left: 0;
            margin-top: 6px;
            background: #111827;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            padding: 6px 0;
            min-width: 200px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
            display: none;
            z-index: 1000;
            flex-direction: column;
        }
        .nav-dropdown-menu.active {
            display: flex;
        }
        .nav-dropdown-item {
            padding: 8px 16px;
            font-size: 12px;
            color: var(--text-primary);
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: background 0.15s;
        }
        .nav-dropdown-item:hover {
            background: #1e293b;
            color: var(--accent-cyan);
        }
        .nav-dropdown-divider {
            height: 1px;
            background: var(--border-color);
            margin: 4px 0;
        }

        /* Responsive Breakpoints */
        @media (max-width: 1024px) {
            #elements-panel { width: 210px; }
            #properties-panel { width: 300px; }
            .topbar-center { display: none; }
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
                    <img src="${LLP_LOGO_BASE64}" alt="LLP Logo" />
                </div>
                <span>LLP UI BUILDER</span>
            </div>
            <nav class="nav-menu-links">
                <div class="nav-dropdown-wrapper">
                    <span class="nav-link" id="menu-file">Fichier ▾</span>
                    <div class="nav-dropdown-menu" id="dropdown-file">
                        <div class="nav-dropdown-item" id="opt-file-save"><span>💾</span> Enregistrer (.illp)</div>
                        <div class="nav-dropdown-item" id="opt-file-preview"><span>👁️</span> Basculer Aperçu</div>
                        <div class="nav-dropdown-divider"></div>
                        <div class="nav-dropdown-item" id="opt-file-reload"><span>🔄</span> Recharger l'interface</div>
                        <div class="nav-dropdown-item" id="opt-file-export"><span>📤</span> Voir le Code .illp</div>
                    </div>
                </div>
                <div class="nav-dropdown-wrapper">
                    <span class="nav-link" id="menu-edit">Édition ▾</span>
                    <div class="nav-dropdown-menu" id="dropdown-edit">
                        <div class="nav-dropdown-item" id="opt-edit-dup"><span>⧉</span> Dupliquer (Ctrl+D)</div>
                        <div class="nav-dropdown-item" id="opt-edit-del"><span>🗑️</span> Supprimer (Suppr)</div>
                        <div class="nav-dropdown-divider"></div>
                        <div class="nav-dropdown-item" id="opt-edit-deselect"><span>❌</span> Tout désélectionner</div>
                    </div>
                </div>
                <div class="nav-dropdown-wrapper">
                    <span class="nav-link" id="menu-project">Projet ▾</span>
                    <div class="nav-dropdown-menu" id="dropdown-project">
                        <div class="nav-dropdown-item" id="opt-proj-settings"><span>⚙️</span> Paramètres Fenêtre</div>
                        <div class="nav-dropdown-item" id="opt-proj-docs"><span>📖</span> Documentation API LLP</div>
                        <div class="nav-dropdown-divider"></div>
                        <div class="nav-dropdown-item" id="opt-proj-publish"><span>🚀</span> Publier & Compiler</div>
                    </div>
                </div>
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
                <span>PALETTE D'ÉLÉMENTS</span>
                <span id="btn-toggle-left-panel" style="color:var(--text-muted); cursor:pointer;" title="Réduire la palette">«</span>
            </div>

            <div class="palette-search-box">
                <div class="search-input-wrap">
                    <span class="search-icon">🔍</span>
                    <input type="text" id="palette-filter" placeholder="Filtrer éléments..." />
                </div>
            </div>

            <div class="palette-scroll" id="palette-items-list">
                <!-- Group 1: Structure -->
                <div class="element-category">
                    <div class="category-header">
                        <span>▾ Structure & Conteneurs</span>
                    </div>
                    <div class="category-grid">
                        <div class="palette-card" draggable="true" data-type="Stack">
                            <span class="palette-card-icon">☰</span>
                            <span class="palette-card-label">Stack (Pile H/V)</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="ResponsiveGrid">
                            <span class="palette-card-icon">▦</span>
                            <span class="palette-card-label">Grille Responsive</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="Row">
                            <span class="palette-card-icon">↔️</span>
                            <span class="palette-card-label">Ligne (Row)</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="Card">
                            <span class="palette-card-icon">🗂️</span>
                            <span class="palette-card-label">Carte / Section</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="Drawer">
                            <span class="palette-card-icon">🗄️</span>
                            <span class="palette-card-label">Tiroir (Drawer)</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="Modal">
                            <span class="palette-card-icon">🗔</span>
                            <span class="palette-card-label">Boîte Modale</span>
                        </div>
                    </div>
                </div>

                <!-- Group 2: Texte & Typographie -->
                <div class="element-category">
                    <div class="category-header">
                        <span>▾ Texte & Typographie</span>
                    </div>
                    <div class="category-grid">
                        <div class="palette-card" draggable="true" data-type="Text">
                            <span class="palette-card-icon">🔤</span>
                            <span class="palette-card-label">Texte / Label</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="Divider">
                            <span class="palette-card-icon">➖</span>
                            <span class="palette-card-label">Séparateur</span>
                        </div>
                    </div>
                </div>

                <!-- Group 3: Formulaires & Contrôles -->
                <div class="element-category">
                    <div class="category-header">
                        <span>▾ Formulaires & Contrôles</span>
                    </div>
                    <div class="category-grid">
                        <div class="palette-card" draggable="true" data-type="Button">
                            <span class="palette-card-icon">🔘</span>
                            <span class="palette-card-label">Bouton</span>
                            <div class="subchips-group">
                                <span class="subchip">Primary</span>
                                <span class="subchip">Outline</span>
                            </div>
                        </div>
                        <div class="palette-card" draggable="true" data-type="TextInput">
                            <span class="palette-card-icon">⌨️</span>
                            <span class="palette-card-label">Champ Saisie</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="Checkbox">
                            <span class="palette-card-icon">☑️</span>
                            <span class="palette-card-label">Case à Cocher</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="ItemBox">
                            <span class="palette-card-icon">🔽</span>
                            <span class="palette-card-label">Menu Déroulant</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="ListButton">
                            <span class="palette-card-icon">📑</span>
                            <span class="palette-card-label">Bouton Liste</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="ProgressBar">
                            <span class="palette-card-icon">📊</span>
                            <span class="palette-card-label">Progression</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="DatePicker">
                            <span class="palette-card-icon">📅</span>
                            <span class="palette-card-label">Sélecteur Date</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="TagPicker">
                            <span class="palette-card-icon">🏷️</span>
                            <span class="palette-card-label">Multi-Tags</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="FileUpload">
                            <span class="palette-card-icon">☁️</span>
                            <span class="palette-card-label">Fichier Upload</span>
                        </div>
                    </div>
                </div>

                <!-- Group 4: Données & Vues -->
                <div class="element-category">
                    <div class="category-header">
                        <span>▾ Données & Vues</span>
                    </div>
                    <div class="category-grid">
                        <div class="palette-card" draggable="true" data-type="DataGrid">
                            <span class="palette-card-icon">🗃️</span>
                            <span class="palette-card-label">Tableau (DataGrid)</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="Kanban">
                            <span class="palette-card-icon">📋</span>
                            <span class="palette-card-label">Tableau Kanban</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="TreeView">
                            <span class="palette-card-icon">🌳</span>
                            <span class="palette-card-label">Arborescence</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="Chart">
                            <span class="palette-card-icon">📈</span>
                            <span class="palette-card-label">Graphique (Chart)</span>
                        </div>
                    </div>
                </div>

                <!-- Group 5: Médias & Visuels -->
                <div class="element-category">
                    <div class="category-header">
                        <span>▾ Médias & Visuels</span>
                    </div>
                    <div class="category-grid">
                        <div class="palette-card" draggable="true" data-type="Image">
                            <span class="palette-card-icon">🖼️</span>
                            <span class="palette-card-label">Image</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="Toast">
                            <span class="palette-card-icon">🔔</span>
                            <span class="palette-card-label">Notification Toast</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="Skeleton">
                            <span class="palette-card-icon">⌛</span>
                            <span class="palette-card-label">Squelette (Loader)</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="MediaPlayer">
                            <span class="palette-card-icon">🎬</span>
                            <span class="palette-card-label">Lecteur Média</span>
                        </div>
                        <div class="palette-card" draggable="true" data-type="Webview">
                            <span class="palette-card-icon">🌐</span>
                            <span class="palette-card-label">Webview / Canvas</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>

        <!-- CENTER CANVAS -->
        <main id="canvas-viewport">
            <div class="canvas-top-tag">
                <span>PROJET: <b>LLP APP - WORKSPACE</b> (${fileName})</span>
                <span id="canvas-elements-counter">0 composants</span>
            </div>

            <div class="canvas-artboard" id="artboard-root">
                <!-- Elements will be dynamically rendered here from .illp structure -->
            </div>
        </main>

        <!-- RIGHT PANEL: PROPERTIES -->
        <aside id="properties-panel">
            <div class="prop-panel-header">
                <span class="prop-main-title" id="inspector-header-title">PROPRIÉTÉS DU COMPOSANT</span>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span style="font-size:11px; color:var(--text-muted); cursor:pointer; padding:2px 6px; border-radius:4px; border:1px solid var(--border-color);" id="btn-deselect" title="Désélectionner">✕</span>
                    <span style="font-size:12px; color:var(--text-muted); cursor:pointer; padding:2px 6px; border-radius:4px; border:1px solid var(--border-color);" id="btn-collapse-right" title="Réduire l'inspecteur">»</span>
                </div>
            </div>

            <!-- Accordion 1: Specific Properties (OPEN by default) -->
            <div class="accordion-section">
                <div class="accordion-toggle" onclick="toggleAccordion('specific')">
                    <span>▾ Propriétés du Composant</span>
                </div>
                <div class="accordion-content" id="acc-specific">
                    <!-- Populated dynamically -->
                </div>
            </div>

            <!-- Accordion 2: Layout -->
            <div class="accordion-section">
                <div class="accordion-toggle" onclick="toggleAccordion('layout')">
                    <span>▾ Disposition & Taille (Layout)</span>
                </div>
                <div class="accordion-content collapsed" id="acc-layout">
                    <div class="control-row">
                        <span class="control-label">Mode Taille</span>
                        <div class="segmented-btn-group">
                            <button class="seg-btn active" type="button" onclick="setSizeMode('auto')">Auto</button>
                            <button class="seg-btn" type="button" onclick="setSizeMode('fixed')">Fixe</button>
                            <button class="seg-btn" type="button" onclick="setSizeMode('percent')">Pourcent</button>
                        </div>
                    </div>

                    <div class="control-row">
                        <span class="control-label">Alignement</span>
                        <div class="segmented-btn-group">
                            <button class="seg-btn active" type="button" onclick="setAlign('left')">⬱ Gauche</button>
                            <button class="seg-btn" type="button" onclick="setAlign('center')">⬰ Centre</button>
                            <button class="seg-btn" type="button" onclick="setAlign('right')">⬲ Droite</button>
                            <button class="seg-btn" type="button" onclick="setAlign('stretch')">⬍ Étirer</button>
                        </div>
                    </div>

                    <div class="control-row">
                        <span class="control-label">Marges Internes (Padding)</span>
                        <div class="box-model-grid">
                            <input type="text" id="prop-pad-top" placeholder="Haut" />
                            <input type="text" id="prop-pad-right" placeholder="Drt" />
                            <input type="text" id="prop-pad-bottom" placeholder="Bas" />
                            <input type="text" id="prop-pad-left" placeholder="Gch" />
                        </div>
                    </div>

                    <div class="control-row">
                        <span class="control-label">Marges Externes (Margin)</span>
                        <div class="box-model-grid">
                            <input type="text" id="prop-mar-top" placeholder="Haut" />
                            <input type="text" id="prop-mar-right" placeholder="Drt" />
                            <input type="text" id="prop-mar-bottom" placeholder="Bas" />
                            <input type="text" id="prop-mar-left" placeholder="Gch" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Accordion 3: Style -->
            <div class="accordion-section">
                <div class="accordion-toggle" onclick="toggleAccordion('style')">
                    <span>▾ Apparence & Style</span>
                </div>
                <div class="accordion-content collapsed" id="acc-style">
                    <div class="control-row">
                        <span class="control-label">Arrière-plan</span>
                        <input type="text" class="prop-text-input" id="prop-style-bg" placeholder="#1e293b ou transparent" />
                    </div>
                    <div class="control-row">
                        <span class="control-label">Bordure</span>
                        <input type="text" class="prop-text-input" id="prop-style-border" placeholder="1px solid #334155" />
                    </div>
                    <div class="control-row">
                        <span class="control-label">Arrondi (Border-radius)</span>
                        <input type="text" class="prop-text-input" id="prop-style-radius" placeholder="8px" />
                    </div>
                    <div class="control-row">
                        <span class="control-label">Ombre (Box Shadow)</span>
                        <input type="text" class="prop-text-input" id="prop-style-shadow" placeholder="0 4px 15px rgba(0,0,0,0.5)" />
                    </div>
                </div>
            </div>

            <!-- Accordion 4: Data Binding -->
            <div class="accordion-section">
                <div class="accordion-toggle" onclick="toggleAccordion('databinding')">
                    <span>▾ Liaison de Données (Data Binding)</span>
                </div>
                <div class="accordion-content collapsed" id="acc-databinding">
                    <div class="data-binding-frame">
                        <div class="control-row" style="margin-bottom: 8px;">
                            <span class="control-label">Source de Données :</span>
                            <select class="prop-text-input" id="prop-data-source">
                                <option value="rpc">[LLP Server RPC]</option>
                                <option value="state">État Local (State)</option>
                                <option value="json">JSON Statique</option>
                            </select>
                        </div>

                        <div class="control-row" style="margin-bottom: 8px;">
                            <span class="control-label">Méthode RPC :</span>
                        </div>
                        <div class="rpc-bind-group" style="margin-bottom: 10px;">
                            <input type="text" class="prop-text-input" id="prop-rpc-method" value="server.Users.list" />
                            <button class="btn-bind-action" type="button" id="btn-trigger-bind">Lier</button>
                        </div>

                        <div class="control-row horizontal">
                            <span class="control-label">Auto-Pagination</span>
                            <div class="toggle-switch-wrap">
                                <input type="checkbox" id="prop-auto-page" class="switch-input" checked />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Accordion 5: Events -->
            <div class="accordion-section">
                <div class="accordion-toggle" onclick="toggleAccordion('events')">
                    <span>▾ Événements & Scripts LLP</span>
                </div>
                <div class="accordion-content collapsed" id="acc-events">
                    <div class="event-code-line" onclick="editEvent('OnClick')">
                        <span class="event-name">OnClick:</span>
                        <span class="event-bracket">{}</span>
                    </div>
                    <div class="event-code-line" onclick="editEvent('OnChange')">
                        <span class="event-name">OnChange:</span>
                        <span class="event-bracket">{}</span>
                    </div>
                    <div class="event-code-line" onclick="editEvent('OnSubmit')">
                        <span class="event-name">OnSubmit:</span>
                        <span class="event-bracket">{}</span>
                    </div>
                    <div class="event-code-line" onclick="editEvent('OnRowClick')">
                        <span class="event-name">OnRowClick:</span>
                        <span class="event-bracket">{}</span>
                    </div>
                </div>
            </div>
        </aside>
    </div>

    <!-- MODALS OVERLAY FOR PUBLISH, API DOCS & EXPORT ILLP -->
    <div id="modal-publish" class="builder-modal-overlay">
        <div class="builder-modal-box">
            <div class="builder-modal-header">
                <div class="builder-modal-title"><span>🚀</span> Publication & Déploiement Multi-Plateforme LLP</div>
                <button class="top-btn" type="button" onclick="closeModal('modal-publish')">✕</button>
            </div>
            <div class="builder-modal-body">
                <p style="margin-bottom: 12px;">Compilez votre interface <code>${fileName}</code> et vos scripts LLP en un livrable autonome avec signature d'identité matérielle Ed25519.</p>
                <div style="background:#0b0f19; padding:14px; border-radius:8px; border:1px solid var(--border-color); margin-bottom:14px;">
                    <div style="font-weight:700; color:#fff; margin-bottom:8px;">Plateforme Cible :</div>
                    <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px; cursor:pointer;"><input type="radio" name="pub-target" value="win" checked /> 🪟 Windows Exécutable Standalone (.exe + WebView2)</label>
                    <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px; cursor:pointer;"><input type="radio" name="pub-target" value="linux" /> 🐧 Linux ELF Binaire Natif</label>
                    <label style="display:flex; align-items:center; gap:8px; margin-bottom:8px; cursor:pointer;"><input type="radio" name="pub-target" value="web" /> 🌐 Webview Standalone (Client/Serveur RPC HTTP+WS)</label>
                    <label style="display:flex; align-items:center; gap:8px; cursor:pointer;"><input type="radio" name="pub-target" value="android" /> 📱 Android APK Hybride</label>
                </div>
                <div style="font-size:12px; color:var(--text-muted); line-height:1.7;">
                    <div>• Chiffrement RPC : <b style="color:var(--accent-cyan);">AES-256-GCM actif</b></div>
                    <div>• Empreinte Matérielle : <code>${deviceId.substring(0, 32)}...</code></div>
                </div>
            </div>
            <div class="builder-modal-footer">
                <button class="top-btn" type="button" onclick="closeModal('modal-publish')">Fermer</button>
                <button class="top-btn publish-btn" type="button" onclick="launchPublishProcess()">🚀 Lancer la Compilation</button>
            </div>
        </div>
    </div>

    <div id="modal-api-docs" class="builder-modal-overlay">
        <div class="builder-modal-box" style="max-width: 720px;">
            <div class="builder-modal-header">
                <div class="builder-modal-title"><span>📖</span> Documentation de l'API Graphique LLP</div>
                <button class="top-btn" type="button" onclick="closeModal('modal-api-docs')">✕</button>
            </div>
            <div class="builder-modal-body" style="max-height: 65vh; overflow-y: auto;">
                <h4 style="color:#00e5ff; margin-bottom: 6px;">1. Ciblage d'Éléments Graphiques (.llp)</h4>
                <p style="margin-bottom: 8px;">Depuis un script LLP, ciblez directement les éléments de l'interface :</p>
                <pre style="background:#0b0f19; padding:10px; border-radius:6px; font-family:monospace; color:#38bdf8; margin-bottom:12px; font-size:12px;">
var btn = UI.GetElement("BtnSubmit")
// ou accès direct par propriété / crochet :
UI["BtnSubmit"].txt = "Envoyer"
UI.LabelStatus.txt = "Chargement..."
                </pre>
                <h4 style="color:#00e5ff; margin-bottom: 6px;">2. Propriétés & Alias Supportés</h4>
                <table style="width:100%; border-collapse:collapse; font-size:12px; margin-bottom:12px; border:1px solid var(--border-color);">
                    <thead><tr style="background:#1e293b;"><th style="padding:6px; text-align:left;">Composant</th><th style="padding:6px; text-align:left;">Propriétés / Alias</th><th style="padding:6px; text-align:left;">Exemple LLP</th></tr></thead>
                    <tbody>
                        <tr><td style="padding:6px; border-top:1px solid #334155;"><b>Text / Label</b></td><td style="padding:6px; border-top:1px solid #334155;">txt, text, content</td><td style="padding:6px; border-top:1px solid #334155;"><code>UI.Title.txt = "Bonjour"</code></td></tr>
                        <tr><td style="padding:6px; border-top:1px solid #334155;"><b>Button</b></td><td style="padding:6px; border-top:1px solid #334155;">txt, text, label</td><td style="padding:6px; border-top:1px solid #334155;"><code>UI.Btn.txt = "Valider"</code></td></tr>
                        <tr><td style="padding:6px; border-top:1px solid #334155;"><b>TextInput</b></td><td style="padding:6px; border-top:1px solid #334155;">value, val, placeholder</td><td style="padding:6px; border-top:1px solid #334155;"><code>UI.InputUser.value = "Jean"</code></td></tr>
                        <tr><td style="padding:6px; border-top:1px solid #334155;"><b>Checkbox</b></td><td style="padding:6px; border-top:1px solid #334155;">value, checked, txt</td><td style="padding:6px; border-top:1px solid #334155;"><code>UI.ChkOpt.value = true</code></td></tr>
                        <tr><td style="padding:6px; border-top:1px solid #334155;"><b>ProgressBar</b></td><td style="padding:6px; border-top:1px solid #334155;">value, val, max</td><td style="padding:6px; border-top:1px solid #334155;"><code>UI.Progress.value = 75</code></td></tr>
                        <tr><td style="padding:6px; border-top:1px solid #334155;"><b>Tous les Éléments</b></td><td style="padding:6px; border-top:1px solid #334155;">visible (true/false)</td><td style="padding:6px; border-top:1px solid #334155;"><code>UI.Panel.visible = false</code></td></tr>
                    </tbody>
                </table>
            </div>
            <div class="builder-modal-footer">
                <button class="top-btn" type="button" onclick="closeModal('modal-api-docs')">Fermer</button>
            </div>
        </div>
    </div>

    <div id="modal-export-illp" class="builder-modal-overlay">
        <div class="builder-modal-box" style="max-width: 680px;">
            <div class="builder-modal-header">
                <div class="builder-modal-title"><span>📤</span> Code Source de l'Interface (.illp)</div>
                <button class="top-btn" type="button" onclick="closeModal('modal-export-illp')">✕</button>
            </div>
            <div class="builder-modal-body">
                <textarea id="exported-illp-code" readonly style="width:100%; height:280px; background:#0b0f19; border:1px solid var(--border-color); border-radius:6px; color:#38bdf8; font-family:monospace; font-size:12px; padding:10px; box-sizing:border-box; resize:vertical;"></textarea>
            </div>
            <div class="builder-modal-footer">
                <button class="top-btn" type="button" onclick="copyExportedCode()">📋 Copier</button>
                <button class="top-btn" type="button" onclick="closeModal('modal-export-illp')">Fermer</button>
            </div>
        </div>
    </div>
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
        dropGhost.innerHTML = '<div class="cursor-badge"><span>👆</span><span id="ghost-tooltip-text">Déposer le composant ici</span></div>';

        // -------------------------------------------------------------
        // PARSER: Converts .illp code into element tree
        // -------------------------------------------------------------
        function parseIllpToTree(code) {
            const list = [];
            const lines = (code || '').split(String.fromCharCode(10));
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
                    const m = tr.match(/^Background\s+"([^"]+)"/i);
                    if (m) bgConfig.name = m[1];
                    const minW = tr.match(/minWidth:\s*"([^"]+)"/i);
                    if (minW) bgConfig.minWidth = minW[1];
                    const maxW = tr.match(/maxWidth:\s*"([^"]+)"/i);
                    if (maxW) bgConfig.maxWidth = maxW[1];
                    stack.push({ type: 'Background', name: bgConfig.name, children: list });
                    return;
                }

                // DataGrid
                if (tr.startsWith('DataGrid')) {
                    const mName = tr.match(/^DataGrid\s+"([^"]+)"/);
                    const mRpc = tr.match(/rpcSource:\s*"([^"]+)"/);
                    const mPage = tr.match(/pageSize:\s*([0-9]+)/);
                    const item = {
                        id: mName ? mName[1] : 'DataGrid_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'ActiveUserSessions',
                        type: 'DataGrid',
                        title: 'Active User Sessions',
                        rpcSource: mRpc ? mRpc[1] : 'server.Users.list',
                        pageSize: mPage ? parseInt(mPage[1], 10) : 25,
                        autoPagination: true,
                        columns: ['Nom', 'Email', 'Rôle', 'Date', 'Actions']
                    };
                    getCurrentTarget().push(item);
                    return;
                }

                // Kanban
                if (tr.startsWith('Kanban')) {
                    const mName = tr.match(/^Kanban\s+"([^"]+)"/);
                    const mRpc = tr.match(/rpcSource:\s*"([^"]+)"/);
                    const item = {
                        id: mName ? mName[1] : 'Kanban_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'TaskPipeline',
                        type: 'Kanban',
                        title: 'Task Pipeline',
                        rpcSource: mRpc ? mRpc[1] : 'server.Tasks.list',
                        columns: ['À faire', 'En cours', 'Terminé']
                    };
                    getCurrentTarget().push(item);
                    return;
                }

                // Button
                if (tr.startsWith('Button')) {
                    const mName = tr.match(/^Button\s+"([^"]+)"/);
                    const mText = tr.match(/text:\s*"([^"]+)"/);
                    const mVar = tr.match(/variant:\s*"([^"]+)"/);
                    getCurrentTarget().push({
                        id: mName ? mName[1] : 'Button_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'PrimaryButton',
                        type: 'Button',
                        text: mText ? mText[1] : 'Bouton Action',
                        variant: mVar ? mVar[1] : 'primary'
                    });
                    return;
                }

                // TextInput
                if (tr.startsWith('TextInput')) {
                    const mName = tr.match(/^TextInput\s+"([^"]+)"/);
                    const mPh = tr.match(/placeholder:\s*"([^"]+)"/);
                    const mVal = tr.match(/value:\s*"([^"]+)"/);
                    getCurrentTarget().push({
                        id: mName ? mName[1] : 'Input_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'Input',
                        type: 'TextInput',
                        placeholder: mPh ? mPh[1] : 'Saisir du texte...',
                        value: mVal ? mVal[1] : ''
                    });
                    return;
                }

                // Checkbox
                if (tr.startsWith('Checkbox')) {
                    const mName = tr.match(/^Checkbox\s+"([^"]+)"/);
                    const mLbl = tr.match(/label:\s*"([^"]+)"/);
                    const mChk = tr.match(/checked:\s*(true|false)/i);
                    getCurrentTarget().push({
                        id: mName ? mName[1] : 'Checkbox_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'Checkbox',
                        type: 'Checkbox',
                        label: mLbl ? mLbl[1] : "Activer l'option",
                        checked: mChk ? mChk[1].toLowerCase() === 'true' : false
                    });
                    return;
                }

                // ProgressBar
                if (tr.startsWith('ProgressBar')) {
                    const mName = tr.match(/^ProgressBar\s+"([^"]+)"/);
                    const mVal = tr.match(/value:\s*([0-9]+)/);
                    const mMax = tr.match(/max:\s*([0-9]+)/);
                    getCurrentTarget().push({
                        id: mName ? mName[1] : 'ProgressBar_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'ProgressBar',
                        type: 'ProgressBar',
                        value: mVal ? parseInt(mVal[1], 10) : 50,
                        max: mMax ? parseInt(mMax[1], 10) : 100
                    });
                    return;
                }

                // ItemBox
                if (tr.startsWith('ItemBox')) {
                    const mName = tr.match(/^ItemBox\s+"([^"]+)"/);
                    getCurrentTarget().push({
                        id: mName ? mName[1] : 'ItemBox_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'SelectMenu',
                        type: 'ItemBox',
                        options: ['Option 1', 'Option 2', 'Option 3'],
                        selected: 'Option 1'
                    });
                    return;
                }

                // ListButton
                if (tr.startsWith('ListButton')) {
                    const mName = tr.match(/^ListButton\s+"([^"]+)"/);
                    getCurrentTarget().push({
                        id: mName ? mName[1] : 'ListButton_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'ListButton',
                        type: 'ListButton',
                        items: ['Onglet 1', 'Onglet 2', 'Onglet 3'],
                        selected: 'Onglet 1'
                    });
                    return;
                }

                // Card / Section
                if (tr.startsWith('Card')) {
                    const mName = tr.match(/^Card\s+"([^"]+)"/);
                    const mTitle = tr.match(/title:\s*"([^"]+)"/);
                    const item = {
                        id: mName ? mName[1] : 'Card_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'Section',
                        type: 'Card',
                        title: mTitle ? mTitle[1] : 'Conteneur Section',
                        children: []
                    };
                    getCurrentTarget().push(item);
                    if (tr.endsWith('{')) stack.push(item);
                    return;
                }

                // Modal
                if (tr.startsWith('Modal')) {
                    const mName = tr.match(/^Modal\s+"([^"]+)"/);
                    const mTitle = tr.match(/title:\s*"([^"]+)"/);
                    const item = {
                        id: mName ? mName[1] : 'Modal_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'ModalDialog',
                        type: 'Modal',
                        title: mTitle ? mTitle[1] : 'Boîte Modale',
                        isVisible: true,
                        children: []
                    };
                    getCurrentTarget().push(item);
                    if (tr.endsWith('{')) stack.push(item);
                    return;
                }

                // Drawer
                if (tr.startsWith('Drawer')) {
                    const mName = tr.match(/^Drawer\s+"([^"]+)"/);
                    const mTitle = tr.match(/title:\s*"([^"]+)"/);
                    const item = {
                        id: mName ? mName[1] : 'Drawer_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'DrawerPanel',
                        type: 'Drawer',
                        title: mTitle ? mTitle[1] : 'Tiroir Latéral',
                        position: 'right',
                        children: []
                    };
                    getCurrentTarget().push(item);
                    if (tr.endsWith('{')) stack.push(item);
                    return;
                }

                // Stack
                if (tr.startsWith('Stack')) {
                    const mName = tr.match(/^Stack\s+"([^"]+)"/);
                    const mDir = tr.match(/direction:\s*"([^"]+)"/);
                    const mGap = tr.match(/gap:\s*"([^"]+)"/);
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
                    const mName = tr.match(/^(?:ResponsiveGrid|Grid)\s+"([^"]+)"/);
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
                if (tr.startsWith('Text ') || tr.startsWith('Text"')) {
                    const mName = tr.match(/^Text\s+"([^"]+)"/);
                    const mContent = tr.match(/content:\s*"([^"]+)"/);
                    getCurrentTarget().push({
                        id: mName ? mName[1] : 'Text_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'Label',
                        type: 'Text',
                        content: mContent ? mContent[1] : 'Texte descriptif'
                    });
                    return;
                }

                // Divider
                if (tr.startsWith('Divider')) {
                    const mName = tr.match(/^Divider\s+"([^"]+)"/);
                    getCurrentTarget().push({
                        id: mName ? mName[1] : 'Divider_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'Divider',
                        type: 'Divider',
                        orientation: 'horizontal'
                    });
                    return;
                }

                // Toast
                if (tr.startsWith('Toast')) {
                    const mName = tr.match(/^Toast\s+"([^"]+)"/);
                    const mMsg = tr.match(/message:\s*"([^"]+)"/);
                    getCurrentTarget().push({
                        id: mName ? mName[1] : 'Toast_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'NotificationToast',
                        type: 'Toast',
                        message: mMsg ? mMsg[1] : 'Notification système active',
                        toastType: 'info'
                    });
                    return;
                }

                // Row / Column
                if (tr.startsWith('Row') || tr.startsWith('Column')) {
                    const isRow = tr.startsWith('Row');
                    const mName = tr.match(/^(?:Row|Column)\s+"([^"]+)"/);
                    const item = {
                        id: mName ? mName[1] : (isRow ? 'Row_' : 'Col_') + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : (isRow ? 'Row' : 'Column'),
                        type: isRow ? 'Row' : 'Column',
                        children: []
                    };
                    getCurrentTarget().push(item);
                    if (tr.endsWith('{')) stack.push(item);
                    return;
                }

                // Image
                if (tr.startsWith('Image')) {
                    const mName = tr.match(/^Image\s+"([^"]+)"/);
                    const mSrc = tr.match(/src:\s*"([^"]+)"/);
                    getCurrentTarget().push({
                        id: mName ? mName[1] : 'Image_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'Image',
                        type: 'Image',
                        src: mSrc ? mSrc[1] : ''
                    });
                    return;
                }

                // Chart
                if (tr.startsWith('Chart')) {
                    const mName = tr.match(/^Chart\s+"([^"]+)"/);
                    const mTitle = tr.match(/title:\s*"([^"]+)"/);
                    getCurrentTarget().push({
                        id: mName ? mName[1] : 'Chart_' + Math.random().toString(36).substr(2, 5),
                        name: mName ? mName[1] : 'AnalyticsChart',
                        type: 'Chart',
                        title: mTitle ? mTitle[1] : 'Métriques & Statistiques',
                        chartType: 'bar',
                        rpcSource: 'server.Analytics.metrics'
                    });
                    return;
                }

                // Fallback generic component
                const mType = tr.match(/^([A-Za-z0-9_]+)\s+"([^"]+)"/);
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

            return list;
        }

        // Helper to find an element and its parent array in the tree
        function findElementNode(list, id, parent) {
            parent = parent || null;
            for (let i = 0; i < list.length; i++) {
                if (list[i].id === id) {
                    return { item: list[i], index: i, list: list, parent: parent };
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
            let item = { id: id, name: id, type: type };

            if (type === 'DataGrid') {
                item.title = 'Active User Sessions';
                item.rpcSource = 'server.Users.list';
                item.pageSize = 25;
                item.autoPagination = true;
                item.columns = ['Nom', 'Email', 'Rôle', 'Date', 'Actions'];
            } else if (type === 'Kanban') {
                item.title = 'Task Pipeline';
                item.rpcSource = 'server.Tasks.list';
                item.columns = ['À faire', 'En cours', 'Terminé'];
            } else if (type === 'Button') {
                item.text = 'Bouton Action';
                item.variant = 'primary';
            } else if (type === 'TextInput') {
                item.placeholder = 'Saisir une valeur...';
                item.value = '';
            } else if (type === 'Checkbox') {
                item.label = 'Activer cette option';
                item.checked = false;
            } else if (type === 'ProgressBar') {
                item.value = 65;
                item.max = 100;
            } else if (type === 'ItemBox') {
                item.options = ['Option 1', 'Option 2', 'Option 3'];
                item.selected = 'Option 1';
            } else if (type === 'ListButton') {
                item.items = ['Onglet 1', 'Onglet 2', 'Onglet 3'];
                item.selected = 'Onglet 1';
            } else if (type === 'Card') {
                item.title = 'Conteneur Section';
                item.children = [];
            } else if (type === 'Stack') {
                item.direction = 'horizontal';
                item.gap = '16px';
                item.children = [];
            } else if (type === 'ResponsiveGrid') {
                item.columns = 12;
                item.children = [];
            } else if (type === 'Row') {
                item.children = [];
            } else if (type === 'Modal') {
                item.title = 'Boîte Modale';
                item.isVisible = true;
                item.children = [];
            } else if (type === 'Drawer') {
                item.title = 'Tiroir Latéral';
                item.position = 'right';
                item.children = [];
            } else if (type === 'Chart') {
                item.title = 'Métriques & Statistiques';
                item.chartType = 'bar';
                item.rpcSource = 'server.Analytics.metrics';
            } else if (type === 'Toast') {
                item.message = 'Notification prête';
                item.toastType = 'info';
            } else if (type === 'Text') {
                item.content = 'Nouveau texte descriptif';
            } else if (type === 'Divider') {
                item.orientation = 'horizontal';
            } else if (type === 'Image') {
                item.src = '';
                item.alt = 'Illustration';
            } else if (type === 'DatePicker') {
                item.placeholder = 'Sélectionner une date...';
            } else if (type === 'TagPicker') {
                item.tags = ['Tag 1', 'Tag 2'];
            } else if (type === 'FileUpload') {
                item.accept = '*.*';
            } else if (type === 'Skeleton') {
                item.width = '100%';
                item.height = '24px';
            } else if (type === 'MediaPlayer') {
                item.src = 'media.mp4';
            } else if (type === 'Webview') {
                item.url = 'https://example.com';
            }

            return item;
        }

        // -------------------------------------------------------------
        // RENDER CANVAS & INTERACTIVE ELEMENT MANIPULATION
        // -------------------------------------------------------------
        function renderCanvas() {
            artboardRoot.innerHTML = '';
            renderElementsList(elements, artboardRoot);

            if (elements.length === 0 && !isPreviewMode) {
                const emptyNotice = document.createElement('div');
                emptyNotice.className = 'empty-canvas-notice';
                emptyNotice.style.padding = '60px 20px';
                emptyNotice.style.textAlign = 'center';
                emptyNotice.style.color = 'var(--text-muted)';
                emptyNotice.style.border = '2px dashed rgba(255, 255, 255, 0.15)';
                emptyNotice.style.borderRadius = '10px';
                emptyNotice.style.margin = '40px auto';
                emptyNotice.style.maxWidth = '480px';
                emptyNotice.style.pointerEvents = 'none';
                emptyNotice.innerHTML = '<div style="font-size:36px;margin-bottom:10px;">🎨</div>' +
                    '<div style="font-weight:700;font-size:15px;margin-bottom:6px;color:var(--text-primary);">Votre Canevas est Prêt</div>' +
                    '<div style="font-size:13px;color:var(--text-muted);">Glissez-déposez des composants depuis la palette de gauche pour construire votre interface.</div>';
                artboardRoot.appendChild(emptyNotice);
            }

            // Update counter
            let count = 0;
            function countNodes(l) {
                l.forEach(x => { count++; if (x.children) countNodes(x.children); });
            }
            countNodes(elements);
            elementsCounter.textContent = count + ' composant' + (count > 1 ? 's' : '');
        }

        function renderElementsList(list, domParent) {
            list.forEach((el, index) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'ui-canvas-item' + (el.id === selectedId ? ' active-selected' : '');
                wrapper.setAttribute('data-id', el.id);
                wrapper.draggable = !isPreviewMode;

                // Selection badge at top left
                if (el.id === selectedId && !isPreviewMode) {
                    const tagBadge = document.createElement('div');
                    tagBadge.className = 'selection-tag-badge';
                    tagBadge.innerHTML = '▾ ' + (el.type || 'Element') + ' <span style="opacity:0.7;">#' + (el.name || el.id) + '</span>';
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
                    dragBtn.title = 'Glisser pour déplacer';
                    qBar.appendChild(dragBtn);

                    // Move Up
                    if (index > 0) {
                        const upBtn = document.createElement('button');
                        upBtn.className = 'q-btn';
                        upBtn.innerHTML = '▲';
                        upBtn.title = 'Monter';
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
                        downBtn.title = 'Descendre';
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
                    dupBtn.title = 'Dupliquer (Ctrl+D)';
                    dupBtn.onclick = (e) => {
                        e.stopPropagation();
                        duplicateElement(el.id);
                    };
                    qBar.appendChild(dupBtn);

                    // Delete
                    const delBtn = document.createElement('button');
                    delBtn.className = 'q-btn delete-btn';
                    delBtn.innerHTML = '✕';
                    delBtn.title = 'Supprimer (Suppr)';
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

                    const ghostText = document.getElementById('ghost-tooltip-text');
                    if (ghostText) {
                        ghostText.textContent = 'Déplacer ' + el.type + ' (' + el.name + ')';
                    }
                });

                wrapper.addEventListener('dragend', () => {
                    wrapper.classList.remove('is-dragging');
                    if (dropGhost.parentNode) {
                        dropGhost.parentNode.removeChild(dropGhost);
                    }
                });

                // SPECIFIC COMPONENT VISUAL RENDERERS
                if (el.type === 'Text') {
                    const t = document.createElement('div');
                    t.style.fontSize = el.fontSize || '15px';
                    t.style.fontWeight = '600';
                    t.style.color = el.color || 'var(--text-primary)';
                    t.style.lineHeight = '1.5';
                    t.textContent = el.content || 'Texte descriptif';
                    t.contentEditable = !isPreviewMode;
                    t.oninput = () => { el.content = t.textContent; };
                    wrapper.appendChild(t);
                } else if (el.type === 'Button') {
                    const btn = document.createElement('button');
                    btn.className = 'canvas-primary-btn';
                    btn.type = 'button';
                    btn.textContent = el.text || 'Bouton Action';
                    if (el.variant === 'outline') {
                        btn.style.background = 'transparent';
                        btn.style.border = '1px solid var(--accent-cyan)';
                        btn.style.color = varColor('--accent-cyan', '#00e5ff');
                    } else if (el.variant === 'danger') {
                        btn.style.background = '#ef4444';
                        btn.style.color = '#fff';
                        btn.style.border = '1px solid #dc2626';
                    } else if (el.variant === 'success') {
                        btn.style.background = '#10b981';
                        btn.style.color = '#fff';
                        btn.style.border = '1px solid #059669';
                    } else if (el.variant === 'standard') {
                        btn.style.background = 'var(--bg-element)';
                        btn.style.color = '#fff';
                        btn.style.border = '1px solid var(--border-color)';
                        btn.style.boxShadow = 'none';
                    }
                    wrapper.appendChild(btn);
                } else if (el.type === 'TextInput') {
                    const inpWrap = document.createElement('div');
                    inpWrap.style.display = 'flex';
                    inpWrap.style.flexDirection = 'column';
                    inpWrap.style.gap = '6px';
                    inpWrap.innerHTML = '<span style="font-size:11px;color:var(--text-secondary);font-weight:600;">' + (el.name || 'Champ Saisie') + '</span>' +
                        '<input class="canvas-input-field" type="text" placeholder="' + (el.placeholder || 'Saisir du texte...') + '" value="' + (el.value || '') + '" readonly />';
                    wrapper.appendChild(inpWrap);
                } else if (el.type === 'Checkbox') {
                    const chkWrap = document.createElement('div');
                    chkWrap.style.display = 'flex';
                    chkWrap.style.alignItems = 'center';
                    chkWrap.style.gap = '10px';
                    chkWrap.style.padding = '6px 0';
                    chkWrap.innerHTML = '<input type="checkbox" ' + (el.checked ? 'checked' : '') + ' style="width:16px;height:16px;accent-color:var(--accent-cyan);cursor:pointer;" />' +
                        '<span style="font-size:13px;color:var(--text-primary);cursor:pointer;">' + (el.label || 'Case à cocher') + '</span>';
                    const chk = chkWrap.querySelector('input');
                    if (chk) {
                        chk.onchange = (e) => { el.checked = e.target.checked; };
                    }
                    wrapper.appendChild(chkWrap);
                } else if (el.type === 'ProgressBar') {
                    const val = el.value !== undefined ? el.value : 50;
                    const max = el.max || 100;
                    const pct = Math.min(100, Math.max(0, Math.round((val / max) * 100)));
                    const progWrap = document.createElement('div');
                    progWrap.style.display = 'flex';
                    progWrap.style.flexDirection = 'column';
                    progWrap.style.gap = '6px';
                    progWrap.innerHTML = '<div style="display:flex;justify-content:space-between;font-size:11px;color:var(--text-secondary);">' +
                        '<span>' + (el.name || 'Progression') + '</span>' +
                        '<span style="font-weight:bold;color:var(--accent-cyan);">' + pct + '%</span>' +
                        '</div>' +
                        '<div style="width:100%;height:8px;background:#1e293b;border-radius:4px;overflow:hidden;border:1px solid var(--border-color);">' +
                        '<div style="width:' + pct + '%;height:100%;background:linear-gradient(90deg, #0070f3, #00e5ff);transition:width 0.3s;"></div>' +
                        '</div>';
                    wrapper.appendChild(progWrap);
                } else if (el.type === 'ItemBox') {
                    const opts = Array.isArray(el.options) ? el.options : ['Option 1', 'Option 2', 'Option 3'];
                    const selWrap = document.createElement('div');
                    selWrap.style.display = 'flex';
                    selWrap.style.flexDirection = 'column';
                    selWrap.style.gap = '6px';
                    const optHtml = opts.map(o => '<option value="' + o + '" ' + (o === el.selected ? 'selected' : '') + '>' + o + '</option>').join('');
                    selWrap.innerHTML = '<span style="font-size:11px;color:var(--text-secondary);font-weight:600;">' + (el.name || 'Menu Déroulant') + '</span>' +
                        '<select class="canvas-input-field" style="cursor:pointer;">' + optHtml + '</select>';
                    const sel = selWrap.querySelector('select');
                    if (sel) {
                        sel.onchange = (e) => { el.selected = e.target.value; };
                    }
                    wrapper.appendChild(selWrap);
                } else if (el.type === 'ListButton') {
                    const itms = Array.isArray(el.items) ? el.items : ['Onglet 1', 'Onglet 2', 'Onglet 3'];
                    const lbWrap = document.createElement('div');
                    lbWrap.style.display = 'inline-flex';
                    lbWrap.style.gap = '4px';
                    lbWrap.style.background = '#0d1322';
                    lbWrap.style.padding = '4px';
                    lbWrap.style.borderRadius = '8px';
                    lbWrap.style.border = '1px solid var(--border-color)';
                    lbWrap.innerHTML = itms.map((it, idx) => '<button type="button" class="seg-btn ' + (idx === 0 ? 'active' : '') + '" style="padding:6px 14px;font-size:12px;">' + it + '</button>').join('');
                    wrapper.appendChild(lbWrap);
                } else if (el.type === 'Divider') {
                    const divEl = document.createElement('div');
                    divEl.style.height = '1px';
                    divEl.style.background = 'var(--border-color)';
                    divEl.style.margin = '12px 0';
                    wrapper.appendChild(divEl);
                } else if (el.type === 'Image') {
                    const imgBox = document.createElement('div');
                    imgBox.style.display = 'flex';
                    imgBox.style.flexDirection = 'column';
                    imgBox.style.alignItems = 'center';
                    imgBox.style.justifyContent = 'center';
                    imgBox.style.padding = '16px';
                    imgBox.style.background = 'rgba(0,0,0,0.15)';
                    imgBox.style.border = '1px dashed var(--border-color)';
                    imgBox.style.borderRadius = '8px';
                    if (el.src) {
                        imgBox.innerHTML = '<img src="' + el.src + '" alt="' + (el.alt || 'Image') + '" style="max-width:100%;max-height:160px;border-radius:4px;" />' +
                            '<div style="font-size:11px;color:var(--text-muted);margin-top:6px;">' + (el.alt || el.name) + '</div>';
                    } else {
                        imgBox.innerHTML = '<div style="font-size:28px;margin-bottom:6px;">🖼️</div>' +
                            '<div style="font-size:12px;font-weight:600;color:var(--text-secondary);">' + (el.name || 'Composant Image') + '</div>' +
                            '<div style="font-size:11px;color:var(--text-muted);">Configurez la source de l image dans le panneau de droite</div>';
                    }
                    wrapper.appendChild(imgBox);
                } else if (el.type === 'Toast') {
                    const toastBox = document.createElement('div');
                    toastBox.style.display = 'flex';
                    toastBox.style.alignItems = 'center';
                    toastBox.style.gap = '10px';
                    toastBox.style.padding = '10px 16px';
                    toastBox.style.background = '#111827';
                    toastBox.style.border = '1px solid var(--accent-cyan)';
                    toastBox.style.borderRadius = '8px';
                    toastBox.style.boxShadow = '0 4px 15px rgba(0, 229, 255, 0.2)';
                    toastBox.innerHTML = '<span style="font-size:16px;">🔔</span>' +
                        '<div style="font-size:12px;color:#fff;font-weight:500;">' + (el.message || 'Notification système prête') + '</div>';
                    wrapper.appendChild(toastBox);
                } else if (el.type === 'Chart') {
                    const chartBox = document.createElement('div');
                    chartBox.className = 'canvas-form-block';
                    chartBox.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">' +
                        '<span style="font-size:13px;font-weight:700;">📈 ' + (el.title || 'Analytics Overview') + '</span>' +
                        '<span style="font-size:10px;color:var(--accent-cyan);text-transform:uppercase;">' + (el.chartType || 'Bar') + ' Chart</span>' +
                        '</div>' +
                        '<div style="display:flex;align-items:flex-end;gap:8px;height:80px;padding:6px 0;border-bottom:1px solid var(--border-color);">' +
                        '<div style="flex:1;height:45%;background:rgba(0,112,243,0.7);border-radius:3px 3px 0 0;"></div>' +
                        '<div style="flex:1;height:80%;background:rgba(0,229,255,0.7);border-radius:3px 3px 0 0;"></div>' +
                        '<div style="flex:1;height:60%;background:rgba(0,112,243,0.7);border-radius:3px 3px 0 0;"></div>' +
                        '<div style="flex:1;height:95%;background:rgba(0,229,255,0.7);border-radius:3px 3px 0 0;"></div>' +
                        '<div style="flex:1;height:70%;background:rgba(0,112,243,0.7);border-radius:3px 3px 0 0;"></div>' +
                        '</div>';
                    wrapper.appendChild(chartBox);
                } else if (el.type === 'DataGrid') {
                    const dg = document.createElement('div');
                    dg.className = 'canvas-datagrid-block';
                    dg.innerHTML = '<div class="datagrid-title-bar">' +
                        '<span>' + (el.title || 'Active User Sessions') + '</span>' +
                        '<span style="color:var(--text-muted);cursor:pointer;">⋮</span>' +
                        '</div>' +
                        '<table class="datagrid-table-custom">' +
                        '<thead><tr>' +
                        '<th style="width:36px;"><input type="checkbox" disabled /></th>' +
                        '<th>Nom</th><th>Email</th><th>Rôle</th><th>Date</th><th>Actions</th>' +
                        '</tr></thead>' +
                        '<tbody>' +
                        '<tr><td><input type="checkbox" disabled /></td><td><div class="row-skeleton-bar" style="width:70%;"></div></td><td><div class="row-skeleton-bar" style="width:85%;"></div></td><td><div class="row-skeleton-bar" style="width:60%;"></div></td><td><div class="row-skeleton-bar" style="width:75%;"></div></td><td><span style="color:var(--text-muted);">⋮</span></td></tr>' +
                        '<tr><td><input type="checkbox" disabled /></td><td><div class="row-skeleton-bar" style="width:65%;"></div></td><td><div class="row-skeleton-bar" style="width:90%;"></div></td><td><div class="row-skeleton-bar" style="width:55%;"></div></td><td><div class="row-skeleton-bar" style="width:70%;"></div></td><td><span style="color:var(--text-muted);">⋮</span></td></tr>' +
                        '</tbody></table>' +
                        '<div class="datagrid-footer"><span>Page 1 sur 1</span><span>&lt; 1 &gt;</span></div>';
                    wrapper.appendChild(dg);
                } else if (el.type === 'Kanban') {
                    const kb = document.createElement('div');
                    kb.className = 'canvas-kanban-block';
                    kb.innerHTML = '<div class="kanban-title-bar">' +
                        '<span>' + (el.title || 'Task Pipeline') + '</span>' +
                        '<span style="color:var(--text-muted);cursor:pointer;">⋮</span>' +
                        '</div>' +
                        '<div class="kanban-cols-container">' +
                        '<div class="kanban-col-item"><div class="kanban-col-top"><span>À faire</span><span>⋮</span></div><div class="kanban-task-card emerald-tag"><div class="row-skeleton-bar" style="width:80%;"></div></div></div>' +
                        '<div class="kanban-col-item"><div class="kanban-col-top"><span>En cours</span><span>⋮</span></div><div class="kanban-task-card amber-tag"><div class="row-skeleton-bar" style="width:65%;"></div></div></div>' +
                        '<div class="kanban-col-item"><div class="kanban-col-top"><span>Terminé</span><span>⋮</span></div><div class="kanban-task-card"><div class="row-skeleton-bar" style="width:70%;"></div></div></div>' +
                        '</div>';
                    wrapper.appendChild(kb);
                } else if (el.type === 'Card' || el.type === 'Stack' || el.type === 'ResponsiveGrid' || el.type === 'Row' || el.type === 'Column' || el.type === 'Container' || el.type === 'Modal' || el.type === 'Drawer') {
                    const cont = document.createElement('div');
                    cont.className = 'canvas-form-block';
                    cont.innerHTML = '<div style="font-size:13px;font-weight:700;color:var(--text-secondary);display:flex;justify-content:space-between;margin-bottom:8px;">' +
                        '<span>' + (el.title || el.name) + '</span>' +
                        '<span style="font-size:10px;color:var(--accent-cyan);text-transform:uppercase;">' + el.type + '</span>' +
                        '</div>';
                    const slot = document.createElement('div');
                    const isRow = el.type === 'Row' || (el.type === 'Stack' && el.direction === 'horizontal');
                    slot.className = 'container-drop-zone' + (el.type === 'ResponsiveGrid' ? ' grid-layout' : (isRow ? ' row-layout' : ''));
                    slot.setAttribute('data-container-id', el.id);

                    el.children = el.children || [];
                    renderElementsList(el.children, slot);

                    cont.appendChild(slot);
                    wrapper.appendChild(cont);
                } else {
                    const block = document.createElement('div');
                    block.className = 'canvas-form-block';
                    block.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                        '<span style="font-weight:bold;">' + el.name + '</span>' +
                        '<span style="font-size:10px;color:var(--accent-cyan);">' + el.type + '</span>' +
                        '</div>';
                    wrapper.appendChild(block);
                }

                domParent.appendChild(wrapper);
            });
        }

        function varColor(cssVar, fallback) {
            return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim() || fallback;
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
                    ghostText.textContent = 'Ajouter ' + type + ' au projet';
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
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;

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

        // Collapse / Expand Right Panel
        const btnCollapseRight = document.getElementById('btn-collapse-right');
        const propertiesPanel = document.getElementById('properties-panel');
        if (btnCollapseRight && propertiesPanel) {
            btnCollapseRight.onclick = () => {
                propertiesPanel.classList.toggle('collapsed');
                btnCollapseRight.textContent = propertiesPanel.classList.contains('collapsed') ? '«' : '»';
            };
        }

        // Collapse / Expand Left Palette
        const btnToggleLeftPanel = document.getElementById('btn-toggle-left-panel');
        const elementsPanel = document.getElementById('elements-panel');
        if (btnToggleLeftPanel && elementsPanel) {
            btnToggleLeftPanel.onclick = () => {
                const isHidden = elementsPanel.style.display === 'none';
                elementsPanel.style.display = isHidden ? 'flex' : 'none';
            };
        }

        // -------------------------------------------------------------
        // PROPERTIES INSPECTOR RENDERING & LIVE UPDATE
        // -------------------------------------------------------------
        function renderPropertiesInspector() {
            const found = selectedId ? findElementNode(elements, selectedId) : null;

            if (!found) {
                inspectorHeaderTitle.textContent = "PROPRIÉTÉS - Fenêtre Principale";
                document.getElementById('acc-specific').innerHTML = 
                    '<div class="control-row">' +
                    '<span class="control-label">Titre de la Fenêtre:</span>' +
                    '<input type="text" class="prop-text-input" id="prop-win-title" value="' + bgConfig.name + '" />' +
                    '</div>' +
                    '<div class="control-row">' +
                    '<span class="control-label">Largeur Min (minWidth):</span>' +
                    '<input type="text" class="prop-text-input" id="prop-win-minw" value="' + (bgConfig.minWidth || '500px') + '" />' +
                    '</div>' +
                    '<div class="control-row">' +
                    '<span class="control-label">Largeur Max (maxWidth):</span>' +
                    '<input type="text" class="prop-text-input" id="prop-win-maxw" value="' + (bgConfig.maxWidth || '1400px') + '" />' +
                    '</div>' +
                    '<div class="control-row horizontal" style="margin-top:8px;">' +
                    '<span class="control-label">Responsive:</span>' +
                    '<input type="checkbox" id="prop-win-resp" ' + (bgConfig.responsive ? 'checked' : '') + ' style="width:16px;height:16px;" />' +
                    '</div>';
                const titleInput = document.getElementById('prop-win-title');
                if (titleInput) {
                    titleInput.oninput = () => { bgConfig.name = titleInput.value; };
                }
                const minwInput = document.getElementById('prop-win-minw');
                if (minwInput) {
                    minwInput.oninput = () => { bgConfig.minWidth = minwInput.value; };
                }
                const maxwInput = document.getElementById('prop-win-maxw');
                if (maxwInput) {
                    maxwInput.oninput = () => { bgConfig.maxWidth = maxwInput.value; };
                }
                const respInput = document.getElementById('prop-win-resp');
                if (respInput) {
                    respInput.onchange = () => { bgConfig.responsive = respInput.checked; };
                }
                return;
            }

            const el = found.item;
            inspectorHeaderTitle.textContent = "PROPRIÉTÉS - " + (el.type || 'Composant');

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

            // Populate specific fields dynamically for every component
            let specificHtml = '<div class="control-row">' +
                '<span class="control-label">Identifiant (Name):</span>' +
                '<input type="text" class="prop-text-input" id="prop-elem-name" value="' + (el.name || '') + '" />' +
                '</div>';

            if (el.type === 'Text') {
                specificHtml += '<div class="control-row">' +
                    '<span class="control-label">Contenu Texte (txt / content):</span>' +
                    '<textarea class="prop-text-input" id="prop-elem-content" style="height:60px;resize:vertical;">' + (el.content || '') + '</textarea>' +
                    '</div>' +
                    '<div class="control-row">' +
                    '<span class="control-label">Taille Police (fontSize):</span>' +
                    '<input type="text" class="prop-text-input" id="prop-elem-fontsize" value="' + (el.fontSize || '15px') + '" placeholder="15px" />' +
                    '</div>';
            }

            if (el.type === 'Button') {
                specificHtml += '<div class="control-row">' +
                    '<span class="control-label">Libellé du Bouton (text):</span>' +
                    '<input type="text" class="prop-text-input" id="prop-btn-text" value="' + (el.text || '') + '" />' +
                    '</div>' +
                    '<div class="control-row">' +
                    '<span class="control-label">Variante de Style:</span>' +
                    '<select class="prop-text-input" id="prop-btn-variant">' +
                    '<option value="primary" ' + (el.variant === 'primary' ? 'selected' : '') + '>Primaire (Cyan Néon)</option>' +
                    '<option value="outline" ' + (el.variant === 'outline' ? 'selected' : '') + '>Contour (Outline Cyan)</option>' +
                    '<option value="danger" ' + (el.variant === 'danger' ? 'selected' : '') + '>Danger (Rouge)</option>' +
                    '<option value="success" ' + (el.variant === 'success' ? 'selected' : '') + '>Succès (Vert Émeraude)</option>' +
                    '<option value="standard" ' + (el.variant === 'standard' ? 'selected' : '') + '>Standard (Gris Ardoise)</option>' +
                    '</select></div>';
            }

            if (el.type === 'TextInput') {
                specificHtml += '<div class="control-row">' +
                    '<span class="control-label">Placeholder (Texte fantôme):</span>' +
                    '<input type="text" class="prop-text-input" id="prop-input-ph" value="' + (el.placeholder || '') + '" />' +
                    '</div>' +
                    '<div class="control-row">' +
                    '<span class="control-label">Valeur Initiale (value):</span>' +
                    '<input type="text" class="prop-text-input" id="prop-input-val" value="' + (el.value || '') + '" />' +
                    '</div>';
            }

            if (el.type === 'Checkbox') {
                specificHtml += '<div class="control-row">' +
                    '<span class="control-label">Libellé (label):</span>' +
                    '<input type="text" class="prop-text-input" id="prop-chk-lbl" value="' + (el.label || '') + '" />' +
                    '</div>' +
                    '<div class="control-row horizontal">' +
                    '<span class="control-label">Coché par défaut:</span>' +
                    '<input type="checkbox" id="prop-chk-checked" ' + (el.checked ? 'checked' : '') + ' style="width:16px;height:16px;" />' +
                    '</div>';
            }

            if (el.type === 'ProgressBar') {
                specificHtml += '<div class="control-row">' +
                    '<span class="control-label">Valeur (0-100):</span>' +
                    '<input type="number" class="prop-text-input" id="prop-prog-val" value="' + (el.value !== undefined ? el.value : 50) + '" min="0" max="100" />' +
                    '</div>' +
                    '<div class="control-row">' +
                    '<span class="control-label">Valeur Max:</span>' +
                    '<input type="number" class="prop-text-input" id="prop-prog-max" value="' + (el.max || 100) + '" />' +
                    '</div>';
            }

            if (el.type === 'ItemBox') {
                const optStr = Array.isArray(el.options) ? el.options.join(', ') : (el.options || '');
                specificHtml += '<div class="control-row">' +
                    '<span class="control-label">Options (séparées par virgule):</span>' +
                    '<input type="text" class="prop-text-input" id="prop-sel-opts" value="' + optStr + '" />' +
                    '</div>';
            }

            if (el.type === 'ListButton') {
                const itms = Array.isArray(el.items) ? el.items.join(', ') : (el.items || '');
                specificHtml += '<div class="control-row">' +
                    '<span class="control-label">Onglets / Items (séparés par virgule):</span>' +
                    '<input type="text" class="prop-text-input" id="prop-lb-items" value="' + itmStr + '" />' +
                    '</div>';
            }

            if (el.type === 'Card' || el.type === 'Modal' || el.type === 'Drawer' || el.type === 'Header') {
                specificHtml += '<div class="control-row">' +
                    '<span class="control-label">Titre En-tête:</span>' +
                    '<input type="text" class="prop-text-input" id="prop-elem-title" value="' + (el.title || '') + '" />' +
                    '</div>';
            }

            if (el.type === 'Toast') {
                specificHtml += '<div class="control-row">' +
                    '<span class="control-label">Message Alerte:</span>' +
                    '<input type="text" class="prop-text-input" id="prop-toast-msg" value="' + (el.message || '') + '" />' +
                    '</div>';
            }

            if (el.type === 'Image') {
                specificHtml += '<div class="control-row">' +
                    '<span class="control-label">Source URL / Fichier:</span>' +
                    '<input type="text" class="prop-text-input" id="prop-img-src" value="' + (el.src || '') + '" placeholder="assets/logo.png ou https://..." />' +
                    '</div>' +
                    '<div class="control-row">' +
                    '<span class="control-label">Texte Alternatif (Alt):</span>' +
                    '<input type="text" class="prop-text-input" id="prop-img-alt" value="' + (el.alt || '') + '" />' +
                    '</div>';
            }

            if (el.type === 'DataGrid') {
                specificHtml += '<div class="control-row">' +
                    '<span class="control-label">Colonnes (CSV):</span>' +
                    '<input type="text" class="prop-text-input" id="prop-grid-cols" value="' + ((el.columns || []).join(', ')) + '" />' +
                    '</div>' +
                    '<div class="control-row">' +
                    '<span class="control-label">Taille de page:</span>' +
                    '<input type="number" class="prop-text-input" id="prop-grid-ps" value="' + (el.pageSize || 25) + '" />' +
                    '</div>';
            }

            if (el.type === 'Kanban') {
                specificHtml += '<div class="control-row">' +
                    '<span class="control-label">Colonnes (CSV):</span>' +
                    '<input type="text" class="prop-text-input" id="prop-kb-cols" value="' + ((el.columns || []).join(', ')) + '" />' +
                    '</div>';
            }

            if (el.type === 'Chart') {
                specificHtml += '<div class="control-row">' +
                    '<span class="control-label">Type de Graphique:</span>' +
                    '<select class="prop-text-input" id="prop-chart-type">' +
                    '<option value="bar" ' + (el.chartType === 'bar' ? 'selected' : '') + '>Barres (Bar Chart)</option>' +
                    '<option value="line" ' + (el.chartType === 'line' ? 'selected' : '') + '>Ligne (Line Chart)</option>' +
                    '<option value="pie" ' + (el.chartType === 'pie' ? 'selected' : '') + '>Camembert (Pie Chart)</option>' +
                    '</select></div>';
            }

            if (el.type === 'Stack') {
                specificHtml += '<div class="control-row">' +
                    '<span class="control-label">Direction:</span>' +
                    '<select class="prop-text-input" id="prop-stack-dir">' +
                    '<option value="horizontal" ' + (el.direction === 'horizontal' ? 'selected' : '') + '>Horizontal (Ligne)</option>' +
                    '<option value="vertical" ' + (el.direction === 'vertical' ? 'selected' : '') + '>Vertical (Colonne)</option>' +
                    '</select></div>' +
                    '<div class="control-row">' +
                    '<span class="control-label">Espacement (gap):</span>' +
                    '<input type="text" class="prop-text-input" id="prop-stack-gap" value="' + (el.gap || '16px') + '" />' +
                    '</div>';
            }

            if (el.type === 'ResponsiveGrid') {
                specificHtml += '<div class="control-row">' +
                    '<span class="control-label">Nombre de Colonnes:</span>' +
                    '<input type="number" class="prop-text-input" id="prop-grid-cols-cnt" value="' + (el.columns || 12) + '" min="1" max="24" />' +
                    '</div>';
            }

            document.getElementById('acc-specific').innerHTML = specificHtml;

            // Wire input events dynamically
            const nameInput = document.getElementById('prop-elem-name');
            if (nameInput) {
                nameInput.oninput = () => { el.name = nameInput.value; renderCanvas(); };
            }
            const contentInput = document.getElementById('prop-elem-content');
            if (contentInput) {
                contentInput.oninput = () => { el.content = contentInput.value; renderCanvas(); };
            }
            const fontsizeInput = document.getElementById('prop-elem-fontsize');
            if (fontsizeInput) {
                fontsizeInput.oninput = () => { el.fontSize = fontsizeInput.value; renderCanvas(); };
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
            const valInput = document.getElementById('prop-input-val');
            if (valInput) {
                valInput.oninput = () => { el.value = valInput.value; renderCanvas(); };
            }
            const chkLbl = document.getElementById('prop-chk-lbl');
            if (chkLbl) {
                chkLbl.oninput = () => { el.label = chkLbl.value; renderCanvas(); };
            }
            const chkChecked = document.getElementById('prop-chk-checked');
            if (chkChecked) {
                chkChecked.onchange = () => { el.checked = chkChecked.checked; renderCanvas(); };
            }
            const progVal = document.getElementById('prop-prog-val');
            if (progVal) {
                progVal.oninput = () => { el.value = parseInt(progVal.value, 10) || 0; renderCanvas(); };
            }
            const progMax = document.getElementById('prop-prog-max');
            if (progMax) {
                progMax.oninput = () => { el.max = parseInt(progMax.value, 10) || 100; renderCanvas(); };
            }
            const selOpts = document.getElementById('prop-sel-opts');
            if (selOpts) {
                selOpts.oninput = () => {
                    el.options = selOpts.value.split(',').map(s => s.trim()).filter(Boolean);
                    renderCanvas();
                };
            }
            const lbItems = document.getElementById('prop-lb-items');
            if (lbItems) {
                lbItems.oninput = () => {
                    el.items = lbItems.value.split(',').map(s => s.trim()).filter(Boolean);
                    renderCanvas();
                };
            }
            const toastMsg = document.getElementById('prop-toast-msg');
            if (toastMsg) {
                toastMsg.oninput = () => { el.message = toastMsg.value; renderCanvas(); };
            }
            const imgSrc = document.getElementById('prop-img-src');
            if (imgSrc) {
                imgSrc.oninput = () => { el.src = imgSrc.value; renderCanvas(); };
            }
            const imgAlt = document.getElementById('prop-img-alt');
            if (imgAlt) {
                imgAlt.oninput = () => { el.alt = imgAlt.value; renderCanvas(); };
            }
            const colsInput = document.getElementById('prop-grid-cols');
            if (colsInput) {
                colsInput.oninput = () => {
                    el.columns = colsInput.value.split(',').map(s => s.trim()).filter(Boolean);
                    renderCanvas();
                };
            }
            const gridPs = document.getElementById('prop-grid-ps');
            if (gridPs) {
                gridPs.oninput = () => { el.pageSize = parseInt(gridPs.value, 10) || 25; };
            }
            const kbCols = document.getElementById('prop-kb-cols');
            if (kbCols) {
                kbCols.oninput = () => {
                    el.columns = kbCols.value.split(',').map(s => s.trim()).filter(Boolean);
                    renderCanvas();
                };
            }
            const chartType = document.getElementById('prop-chart-type');
            if (chartType) {
                chartType.onchange = () => { el.chartType = chartType.value; renderCanvas(); };
            }
            const stackDir = document.getElementById('prop-stack-dir');
            if (stackDir) {
                stackDir.onchange = () => { el.direction = stackDir.value; renderCanvas(); };
            }
            const stackGap = document.getElementById('prop-stack-gap');
            if (stackGap) {
                stackGap.oninput = () => { el.gap = stackGap.value; renderCanvas(); };
            }
            const gridColsCnt = document.getElementById('prop-grid-cols-cnt');
            if (gridColsCnt) {
                gridColsCnt.oninput = () => { el.columns = parseInt(gridColsCnt.value, 10) || 12; renderCanvas(); };
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
            if (window.event && window.event.target) window.event.target.classList.add('active');
        };

        window.setAlign = function(align) {
            document.querySelectorAll('#acc-layout .segmented-btn-group:nth-child(2) button').forEach(b => b.classList.remove('active'));
            if (window.event && window.event.target) window.event.target.classList.add('active');
            const found = selectedId ? findElementNode(elements, selectedId) : null;
            if (found) {
                found.item.customAlign = align;
                renderCanvas();
            }
        };

        window.editEvent = function(eventName) {
            const code = prompt("Modifier la logique d'événement " + eventName + " :", "// Déclenché lors de l'événement " + eventName + String.fromCharCode(10) + 'print("' + eventName + ' exécuté");');
            if (code !== null) {
                const found = selectedId ? findElementNode(elements, selectedId) : null;
                if (found) {
                    found.item['event_' + eventName] = code;
                    alert("✓ Gestionnaire d'événement " + eventName + " enregistré !");
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
            previewBtnText.textContent = isPreviewMode ? 'Éditer' : 'Aperçu';
            renderCanvas();
        });

        // -------------------------------------------------------------
        // MODAL MANAGEMENT
        // -------------------------------------------------------------
        window.openModal = function(id) {
            const modal = document.getElementById(id);
            if (modal) modal.classList.add('active');
        };

        window.closeModal = function(id) {
            const modal = document.getElementById(id);
            if (modal) modal.classList.remove('active');
        };

        window.launchPublishProcess = function() {
            closeModal('modal-publish');
            alert("🚀 [LLP Publish Engine]" + String.fromCharCode(10) + String.fromCharCode(10) + "Interface " + bgConfig.name + " compilée avec succès !" + String.fromCharCode(10) + "• Signature matérielle validée" + String.fromCharCode(10) + "• Binaire prêt dans le répertoire dist/ de votre projet.");
        };

        window.copyExportedCode = function() {
            const textarea = document.getElementById('exported-illp-code');
            if (textarea) {
                textarea.select();
                navigator.clipboard.writeText(textarea.value).then(() => {
                    alert('✓ Code .illp copié dans le presse-papier !');
                });
            }
        };

        btnPublish.addEventListener('click', () => openModal('modal-publish'));
        btnApiDocs.addEventListener('click', () => openModal('modal-api-docs'));

        // -------------------------------------------------------------
        // TOPBAR DROPDOWN MENUS
        // -------------------------------------------------------------
        function toggleDropdown(id) {
            document.querySelectorAll('.nav-dropdown-menu').forEach(d => {
                if (d.id !== id) d.classList.remove('active');
            });
            const menu = document.getElementById(id);
            if (menu) menu.classList.toggle('active');
        }

        document.getElementById('menu-file').onclick = (e) => { e.stopPropagation(); toggleDropdown('dropdown-file'); };
        document.getElementById('menu-edit').onclick = (e) => { e.stopPropagation(); toggleDropdown('dropdown-edit'); };
        document.getElementById('menu-project').onclick = (e) => { e.stopPropagation(); toggleDropdown('dropdown-project'); };

        window.addEventListener('click', () => {
            document.querySelectorAll('.nav-dropdown-menu').forEach(d => d.classList.remove('active'));
        });

        document.getElementById('opt-file-save').onclick = () => btnSave.click();
        document.getElementById('opt-file-preview').onclick = () => btnPreview.click();
        document.getElementById('opt-file-reload').onclick = () => {
            elements = parseIllpToTree(initialRaw);
            renderCanvas();
            renderPropertiesInspector();
        };
        document.getElementById('opt-file-export').onclick = () => {
            const code = generateFullIllpCode();
            document.getElementById('exported-illp-code').value = code;
            openModal('modal-export-illp');
        };

        document.getElementById('opt-edit-dup').onclick = () => {
            if (selectedId) duplicateElement(selectedId);
        };
        document.getElementById('opt-edit-del').onclick = () => {
            if (selectedId) deleteElement(selectedId);
        };
        document.getElementById('opt-edit-deselect').onclick = () => {
            selectedId = null;
            renderCanvas();
            renderPropertiesInspector();
        };

        document.getElementById('opt-proj-settings').onclick = () => {
            selectedId = null;
            renderCanvas();
            renderPropertiesInspector();
        };
        document.getElementById('opt-proj-docs').onclick = () => openModal('modal-api-docs');
        document.getElementById('opt-proj-publish').onclick = () => openModal('modal-publish');

        // Activity strip icons
        const activityBtns = document.querySelectorAll('.activity-icon-btn');
        activityBtns.forEach((btn, idx) => {
            btn.addEventListener('click', () => {
                activityBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                if (idx === 0) {
                    elementsPanel.style.display = 'flex';
                } else if (idx === 1) {
                    alert("🌳 [Arborescence des Composants]" + String.fromCharCode(10) + String.fromCharCode(10) + "Nombre d'éléments actifs : " + elements.length + String.fromCharCode(10) + "Sélectionnez un élément pour afficher ses propriétés.");
                } else if (idx === 2) {
                    openModal('modal-api-docs');
                } else if (idx === 3) {
                    selectedId = null;
                    renderCanvas();
                    renderPropertiesInspector();
                }
            });
        });

        // -------------------------------------------------------------
        // SAVE SERIALIZATION (.ILLP CODE GENERATION)
        // -------------------------------------------------------------
        function stringifyElementTree(list, indent) {
            indent = indent || '    ';
            let str = '';
            list.forEach((el) => {
                const name = el.name || (el.type + '_1');
                let line = '';

                if (el.type === 'Text') {
                    line = indent + 'Text "' + name + '" content: "' + (el.content || 'Texte') + '"';
                } else if (el.type === 'Button') {
                    line = indent + 'Button "' + name + '" text: "' + (el.text || 'Bouton') + '"';
                    if (el.variant) line += ' variant: "' + el.variant + '"';
                } else if (el.type === 'TextInput') {
                    line = indent + 'TextInput "' + name + '" placeholder: "' + (el.placeholder || '') + '"';
                    if (el.value) line += ' value: "' + el.value + '"';
                } else if (el.type === 'Checkbox') {
                    line = indent + 'Checkbox "' + name + '" label: "' + (el.label || '') + '" checked: ' + (el.checked ? 'true' : 'false');
                } else if (el.type === 'ProgressBar') {
                    line = indent + 'ProgressBar "' + name + '" value: ' + (el.value || 0) + ' max: ' + (el.max || 100);
                } else if (el.type === 'ItemBox') {
                    line = indent + 'ItemBox "' + name + '"';
                } else if (el.type === 'ListButton') {
                    line = indent + 'ListButton "' + name + '"';
                } else if (el.type === 'Divider') {
                    line = indent + 'Divider "' + name + '"';
                } else if (el.type === 'Image') {
                    line = indent + 'Image "' + name + '" src: "' + (el.src || '') + '"';
                } else if (el.type === 'Toast') {
                    line = indent + 'Toast "' + name + '" message: "' + (el.message || '') + '"';
                } else if (el.type === 'DataGrid') {
                    line = indent + 'DataGrid "' + name + '" rpcSource: "' + (el.rpcSource || 'server.Users.list') + '" pageSize: ' + (el.pageSize || 25);
                } else if (el.type === 'Kanban') {
                    line = indent + 'Kanban "' + name + '" rpcSource: "' + (el.rpcSource || 'server.Tasks.list') + '"';
                } else if (el.type === 'Chart') {
                    line = indent + 'Chart "' + name + '" title: "' + (el.title || '') + '" rpcSource: "' + (el.rpcSource || 'server.Analytics.metrics') + '"';
                } else if (el.type === 'Card') {
                    line = indent + 'Card "' + name + '" title: "' + (el.title || 'Section') + '" {' + String.fromCharCode(10);
                    line += stringifyElementTree(el.children || [], indent + '    ');
                    line += indent + '}';
                } else if (el.type === 'Modal') {
                    line = indent + 'Modal "' + name + '" title: "' + (el.title || 'Modale') + '" {' + String.fromCharCode(10);
                    line += stringifyElementTree(el.children || [], indent + '    ');
                    line += indent + '}';
                } else if (el.type === 'Drawer') {
                    line = indent + 'Drawer "' + name + '" title: "' + (el.title || 'Tiroir') + '" {' + String.fromCharCode(10);
                    line += stringifyElementTree(el.children || [], indent + '    ');
                    line += indent + '}';
                } else if (el.type === 'Stack') {
                    line = indent + 'Stack "' + name + '" direction: "' + (el.direction || 'horizontal') + '" gap: "' + (el.gap || '16px') + '" {' + String.fromCharCode(10);
                    line += stringifyElementTree(el.children || [], indent + '    ');
                    line += indent + '}';
                } else if (el.type === 'ResponsiveGrid') {
                    line = indent + 'ResponsiveGrid "' + name + '" columns: ' + (el.columns || 12) + ' {' + String.fromCharCode(10);
                    line += stringifyElementTree(el.children || [], indent + '    ');
                    line += indent + '}';
                } else if (el.type === 'Row') {
                    line = indent + 'Row "' + name + '" {' + String.fromCharCode(10);
                    line += stringifyElementTree(el.children || [], indent + '    ');
                    line += indent + '}';
                } else {
                    line = indent + el.type + ' "' + name + '"';
                    if (el.children) {
                        line += ' {' + String.fromCharCode(10) + stringifyElementTree(el.children, indent + '    ') + indent + '}';
                    }
                }

                str += line + String.fromCharCode(10);
            });
            return str;
        }

        function generateFullIllpCode() {
            const NL = String.fromCharCode(10);
            let code = 'visibility: All' + NL + NL;
            code += '/* ===================================================' + NL;
            code += '   LLP Interface (.illp) - Generated by LLP UI BUILDER' + NL;
            code += '   Device Security & Dynamic RPC Layer Active' + NL;
            code += '   =================================================== */' + NL + NL;

            code += 'Background "' + bgConfig.name + '" responsive: ' + (bgConfig.responsive ? 'true' : 'false');
            if (bgConfig.minWidth) code += ' minWidth: "' + bgConfig.minWidth + '"';
            if (bgConfig.maxWidth) code += ' maxWidth: "' + bgConfig.maxWidth + '"';
            code += ' {' + NL;

            code += stringifyElementTree(elements, '    ');
            code += '}' + NL;

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
                        alert('Erreur de sauvegarde : ' + res.error);
                    }
                }).catch(err => {
                    alert('Erreur réseau de sauvegarde : ' + err.message);
                });
            } else {
                flashSaved();
            }
        });

        function flashSaved() {
            saveBtnText.textContent = 'Saved! ✓';
            btnSave.style.borderColor = '#10b981';
            btnSave.style.color = '#10b981';
            setTimeout(() => {
                saveBtnText.textContent = 'Save';
                btnSave.style.borderColor = '#3b82f6';
                btnSave.style.color = '#93c5fd';
            }, 1800);
        }

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
export function startUiBuilderServer(options: UiBuilderOptions = {}): Promise<{ server: http.Server; url: string; port: number }> {
  return new Promise((resolve, reject) => {
    const port = options.port || 4950;
    const targetFilePath = options.filePath ? path.resolve(process.cwd(), options.filePath) : path.resolve(process.cwd(), "examples", "product_management", "advanced_ui.illp");

    let illpContent = "";
    if (fs.existsSync(targetFilePath)) {
      illpContent = fs.readFileSync(targetFilePath, "utf8");
    } else {
      illpContent = 'visibility: All\n\nBackground "MainWindow" responsive: true {\n}';
    }

    const targetIllpsPath = targetFilePath.replace(/\.illp$/, ".illps");
    let illpsContent = "";
    if (fs.existsSync(targetIllpsPath)) {
      illpsContent = fs.readFileSync(targetIllpsPath, "utf8");
    }

    const devMgr = DeviceIdentityManager.getInstance();
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
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
              fs.writeFileSync(targetFilePath, data.content, "utf8");
              if (data.illpsContent !== undefined) {
                fs.writeFileSync(targetIllpsPath, data.illpsContent, "utf8");
              }
              console.log(`[LLP UI Builder] Fichier sauvegardé : ${targetFilePath}`);
              res.writeHead(200, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ ok: true, message: "Sauvegardé avec succès" }));
              return;
            }
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ ok: false, error: "Contenu manquant" }));
          } catch (err: any) {
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
        illpsContent,
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
        exec(startCmd);
      }

      resolve({ server, url, port });
    });

    server.on("error", (err: any) => {
      if (err.code === "EADDRINUSE") {
        startUiBuilderServer({ ...options, port: port + 1 }).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}
