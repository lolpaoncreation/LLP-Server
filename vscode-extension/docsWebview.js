// ===================================================
// LLP Interactive Read-Only Documentation Webview Generator
// Multilingual Edition: English (Default), Français, Español, Deutsch
// Natural smooth scrolling, instant language switching,
// live search, category filtering, and highlighted code blocks
// ===================================================

const {
    LLP_CATEGORIES,
    LLP_CATEGORIES_I18N,
    LLP_UI_I18N,
    LLP_ITEMS_I18N,
    LLP_DOCS_LIST,
    getDocsList,
    getUiStrings
} = require('./docsRegistry');
const logoData = require('./assets/logo_b64.json');

function getDocumentationHtml(initialTarget = "", currentLang = "en") {
    const lang = (currentLang || "en").toLowerCase();
    const ui = getUiStrings(lang);
    const docs = getDocsList(lang);

    const categories = Object.values(LLP_CATEGORIES);

    // Group items by category
    const grouped = {};
    for (const cat of categories) {
        grouped[cat] = [];
    }
    for (const item of docs) {
        // find base category
        const baseItem = LLP_DOCS_LIST.find(d => d.id === item.id);
        const baseCat = baseItem ? baseItem.category : item.category;
        if (!grouped[baseCat]) grouped[baseCat] = [];
        grouped[baseCat].push(item);
    }

    const cardsHtml = docs.map(item => {
        const baseItem = LLP_DOCS_LIST.find(d => d.id === item.id) || item;
        const paramsHtml = (item.parameters && item.parameters.length > 0) ? `
            <div class="doc-section doc-section-params">
                <div class="doc-section-title" data-i18n-section="params">${escapeHtml(ui.paramsTitle)}</div>
                <table class="params-table">
                    <thead>
                        <tr>
                            <th data-i18n-th="param">${escapeHtml(ui.thParam)}</th>
                            <th data-i18n-th="type">${escapeHtml(ui.thType)}</th>
                            <th data-i18n-th="desc">${escapeHtml(ui.thDesc)}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${item.parameters.map(p => `
                            <tr>
                                <td><code>${escapeHtml(p.name)}</code></td>
                                <td><span class="type-badge">${escapeHtml(p.type)}</span></td>
                                <td class="param-desc" data-param-name="${escapeHtml(p.name)}">${escapeHtml(p.desc)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        ` : '';

        const highlightedSyntax = highlightSyntax(item.syntax || "");
        const highlightedSample = highlightSyntax(item.codeSample || "");

        return `
            <article class="doc-card" id="doc-${item.id.toLowerCase()}" data-id="${item.id.toLowerCase()}" data-base-cat="${escapeHtml(baseItem.category)}" data-category="${escapeHtml(item.category)}" data-keywords="${escapeHtml(item.name.toLowerCase() + ' ' + item.id.toLowerCase() + ' ' + item.summary.toLowerCase() + ' ' + item.description.toLowerCase())}">
                <div class="doc-card-header">
                    <div class="doc-title-row">
                        <div class="doc-title-left">
                            <span class="doc-title-code">${escapeHtml(item.name)}</span>
                            <span class="category-badge">${escapeHtml(item.category)}</span>
                        </div>
                        <button class="copy-btn header-copy-btn" onclick="copyRawText(this, ${JSON.stringify(item.name)})" title="Copy name">📋 <span class="copy-text">${escapeHtml(ui.copy)}</span></button>
                    </div>
                    <div class="doc-summary">${escapeHtml(item.summary)}</div>
                </div>

                <div class="doc-card-body">
                    <div class="doc-section">
                        <div class="doc-section-title" data-i18n-section="syntax">${escapeHtml(ui.syntaxTitle)}</div>
                        <div class="code-container readonly-container">
                            <pre class="syntax-block"><code>${highlightedSyntax}</code></pre>
                        </div>
                    </div>

                    <div class="doc-section">
                        <div class="doc-section-title" data-i18n-section="desc">${escapeHtml(ui.descTitle)}</div>
                        <div class="doc-desc-text">${escapeHtml(item.description)}</div>
                    </div>

                    ${paramsHtml}

                    <div class="doc-section">
                        <div class="doc-section-header-flex">
                            <span class="doc-section-title" data-i18n-section="code">${escapeHtml(ui.codeTitle)}</span>
                            <div class="readonly-badge">
                                <span class="lock-icon">🔒</span> <span class="readonly-label">${escapeHtml(ui.readonlyBadge)}</span>
                                <button class="copy-btn" onclick="copyCode(this, '${item.id}')">${escapeHtml(ui.copyExample)}</button>
                            </div>
                        </div>
                        <div class="code-container readonly-container">
                            <pre class="code-block" id="code-${item.id}"><code>${highlightedSample}</code></pre>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }).join('');

    const sidebarNavHtml = categories.map(cat => {
        const items = grouped[cat] || [];
        if (items.length === 0) return '';
        const catName = (LLP_CATEGORIES_I18N[lang] && LLP_CATEGORIES_I18N[lang][cat]) ? LLP_CATEGORIES_I18N[lang][cat] : cat;
        return `
            <div class="sidebar-category-group" data-base-group="${escapeHtml(cat)}">
                <div class="sidebar-category-title">${escapeHtml(catName)}</div>
                <div class="sidebar-links">
                    ${items.map(item => `
                        <a href="#doc-${item.id.toLowerCase()}" class="sidebar-link" data-id="${item.id.toLowerCase()}" onclick="selectDoc('${item.id.toLowerCase()}', event)">
                            ${escapeHtml(item.name)}
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
    }).join('');

    return `<!DOCTYPE html>
<html lang="${escapeHtml(lang)}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(ui.title)}</title>
    <style>
        :root {
            --bg-primary: var(--vscode-editor-background, #1e1e1e);
            --bg-secondary: var(--vscode-sideBar-background, #252526);
            --bg-tertiary: var(--vscode-dropdown-background, #2d2d30);
            --bg-card: rgba(32, 33, 43, 0.95);
            --border-color: var(--vscode-widget-border, #3a3b45);
            --text-primary: var(--vscode-editor-foreground, #d4d4d4);
            --text-secondary: #9cdcfe;
            --text-muted: #858585;
            --accent-blue: #007acc;
            --accent-cyan: #4ec9b0;
            --accent-purple: #c586c0;
            --accent-amber: #ce9178;
            --accent-green: #6a9955;
            --code-bg: #141419;
            --badge-bg: rgba(0, 122, 204, 0.22);
            --badge-border: rgba(0, 122, 204, 0.5);
            --highlight-glow: rgba(0, 122, 204, 0.4);
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        html, body {
            height: 100%;
            width: 100%;
            overflow: hidden;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: var(--bg-primary);
            color: var(--text-primary);
            font-size: 14px;
            line-height: 1.5;
        }

        body {
            display: flex;
            flex-direction: column;
        }

        /* Top Navbar */
        .top-navbar {
            background-color: var(--bg-secondary);
            border-bottom: 1px solid var(--border-color);
            padding: 12px 24px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            flex-shrink: 0;
            z-index: 100;
        }

        .header-top-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 16px;
        }

        .logo-group {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .logo-img {
            width: 38px;
            height: 38px;
            object-fit: contain;
            filter: drop-shadow(0 2px 8px rgba(0, 122, 204, 0.4));
            transition: transform 0.2s ease;
        }

        .logo-img:hover {
            transform: scale(1.1);
        }

        .header-title-box h1 {
            font-size: 17px;
            font-weight: 600;
            color: var(--text-primary);
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .header-subtitle {
            font-size: 12px;
            color: var(--text-muted);
        }

        .header-controls-right {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        /* Language Selector Group */
        .lang-selector-group {
            display: flex;
            align-items: center;
            gap: 8px;
            background: var(--bg-tertiary);
            border: 1px solid var(--border-color);
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 13px;
            transition: border-color 0.2s;
        }

        .lang-selector-group:hover {
            border-color: var(--accent-blue);
        }

        .lang-icon {
            font-size: 14px;
        }

        .lang-label {
            font-size: 12px;
            color: var(--text-muted);
            font-weight: 600;
        }

        .lang-select {
            background: transparent;
            border: none;
            color: var(--text-primary);
            font-size: 13px;
            font-weight: 500;
            cursor: pointer;
            outline: none;
        }

        .lang-select option {
            background: #252526;
            color: #d4d4d4;
        }

        .readonly-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
            background-color: rgba(206, 145, 120, 0.15);
            border: 1px solid rgba(206, 145, 120, 0.4);
            color: var(--accent-amber);
            font-size: 12px;
            font-weight: 600;
            padding: 4px 10px;
            border-radius: 14px;
        }

        .search-filter-row {
            display: flex;
            align-items: center;
            gap: 16px;
            flex-wrap: wrap;
        }

        .search-box-wrapper {
            position: relative;
            flex: 1;
            min-width: 280px;
        }

        .search-icon {
            position: absolute;
            left: 12px;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-muted);
            font-size: 14px;
            pointer-events: none;
        }

        .search-input {
            width: 100%;
            background-color: var(--bg-primary);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            padding: 8px 12px 8px 36px;
            border-radius: 6px;
            font-size: 13px;
            outline: none;
            transition: border-color 0.2s, box-shadow 0.2s;
        }

        .search-input:focus {
            border-color: var(--accent-blue);
            box-shadow: 0 0 0 2px rgba(0, 122, 204, 0.25);
        }

        .category-pills {
            display: flex;
            gap: 6px;
            overflow-x: auto;
            padding-bottom: 2px;
        }

        .category-pills::-webkit-scrollbar {
            height: 4px;
        }
        .category-pills::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 2px;
        }

        .pill-btn {
            background-color: var(--bg-tertiary);
            border: 1px solid var(--border-color);
            color: var(--text-muted);
            padding: 5px 12px;
            border-radius: 14px;
            font-size: 12px;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.15s ease-in-out;
        }

        .pill-btn:hover {
            color: var(--text-primary);
            border-color: var(--accent-blue);
        }

        .pill-btn.active {
            background-color: var(--accent-blue);
            color: #ffffff;
            border-color: var(--accent-blue);
            font-weight: 600;
        }

        /* Workspace Grid: Sidebar + Scrollable Content Area */
        .workspace {
            display: flex;
            flex: 1;
            min-height: 0;
            overflow: hidden;
            width: 100%;
        }

        /* Sidebar */
        .sidebar {
            width: 280px;
            min-width: 250px;
            background-color: var(--bg-secondary);
            border-right: 1px solid var(--border-color);
            overflow-y: auto;
            min-height: 0;
            height: 100%;
            padding: 16px 12px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            flex-shrink: 0;
        }

        .sidebar::-webkit-scrollbar {
            width: 6px;
        }
        .sidebar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.15);
            border-radius: 3px;
        }

        .sidebar-category-group {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .sidebar-category-title {
            font-size: 11px;
            font-weight: 700;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.6px;
            padding: 4px 8px;
        }

        .sidebar-links {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .sidebar-link {
            display: block;
            padding: 6px 10px;
            border-radius: 4px;
            color: var(--text-primary);
            text-decoration: none;
            font-size: 13px;
            font-family: Consolas, monospace;
            transition: background-color 0.15s, color 0.15s;
        }

        .sidebar-link:hover {
            background-color: var(--bg-tertiary);
            color: var(--text-secondary);
        }

        .sidebar-link.active {
            background-color: var(--accent-blue);
            color: #ffffff;
            font-weight: 600;
        }

        /* Content Area - Dedicated Mouse Wheel Scrollable Container */
        .content-area {
            flex: 1;
            min-width: 0;
            min-height: 0;
            height: 100%;
            overflow-y: auto !important;
            overflow-x: hidden !important;
            padding: 24px 32px 100px 32px;
            display: flex;
            flex-direction: column;
            gap: 24px;
            scroll-behavior: smooth;
        }

        .content-area::-webkit-scrollbar {
            width: 8px;
        }
        .content-area::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
        }
        .content-area::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.2);
            border-radius: 4px;
        }
        .content-area::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.4);
        }

        /* Documentation Cards - Full Natural Height and No Squishing */
        .doc-card {
            display: flex !important;
            flex-direction: column !important;
            flex-shrink: 0 !important;
            width: 100% !important;
            height: auto !important;
            min-height: auto !important;
            background: var(--bg-card);
            border: 1px solid var(--border-color);
            border-radius: 10px;
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
            transition: border-color 0.25s, box-shadow 0.25s;
        }

        .doc-card.hidden {
            display: none !important;
        }

        .doc-card.highlight-pulse {
            border-color: var(--accent-blue) !important;
            box-shadow: 0 0 24px rgba(0, 122, 204, 0.8) !important;
            animation: pulseGlow 2.5s ease-out;
        }

        @keyframes pulseGlow {
            0% { box-shadow: 0 0 28px rgba(0, 122, 204, 0.9); }
            50% { box-shadow: 0 0 16px rgba(0, 122, 204, 0.5); }
            100% { box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25); }
        }

        .doc-card-header {
            padding: 18px 24px;
            background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(0,0,0,0) 100%);
            border-bottom: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            gap: 8px;
            flex-shrink: 0;
        }

        .doc-title-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .doc-title-left {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
        }

        .doc-title-code {
            font-size: 18px;
            font-weight: 700;
            color: #ffffff;
            font-family: Consolas, monospace;
        }

        .category-badge {
            font-size: 11px;
            font-weight: 600;
            background-color: var(--badge-bg);
            border: 1px solid var(--badge-border);
            color: var(--text-secondary);
            padding: 3px 8px;
            border-radius: 4px;
            letter-spacing: 0.3px;
        }

        .header-copy-btn {
            font-size: 11px;
            padding: 4px 8px;
        }

        .doc-summary {
            font-size: 13.5px;
            color: #cccccc;
            line-height: 1.5;
        }

        .doc-card-body {
            padding: 20px 24px;
            display: flex;
            flex-direction: column;
            gap: 20px;
        }

        .doc-section {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .doc-section-header-flex {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }

        .doc-section-title {
            font-size: 12px;
            font-weight: 700;
            color: var(--text-muted);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .doc-desc-text {
            font-size: 13.5px;
            color: var(--text-primary);
            line-height: 1.6;
        }

        /* Syntax & Code Blocks */
        .code-container {
            position: relative;
            background-color: var(--code-bg);
            border: 1px solid var(--border-color);
            border-radius: 6px;
            overflow: hidden;
        }

        .readonly-container {
            border-left: 3px solid var(--accent-amber);
        }

        .syntax-block,
        .code-block {
            margin: 0;
            padding: 12px 16px;
            font-family: Consolas, "Courier New", Courier, monospace;
            font-size: 13px;
            line-height: 1.55;
            color: #d4d4d4;
            overflow-x: auto;
            white-space: pre;
            background: transparent;
        }

        .readonly-badge {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 11px;
            color: var(--accent-amber);
            font-weight: 600;
        }

        /* Parameters Table */
        .params-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
            margin-top: 4px;
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 6px;
            overflow: hidden;
            border: 1px solid var(--border-color);
        }

        .params-table th {
            text-align: left;
            padding: 8px 12px;
            background-color: var(--bg-tertiary);
            color: var(--text-muted);
            font-weight: 600;
            font-size: 11.5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid var(--border-color);
        }

        .params-table td {
            padding: 8px 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            vertical-align: top;
        }

        .params-table tr:last-child td {
            border-bottom: none;
        }

        .params-table code {
            font-family: Consolas, monospace;
            color: var(--accent-cyan);
            font-size: 12px;
        }

        .type-badge {
            display: inline-block;
            background-color: rgba(78, 201, 176, 0.15);
            border: 1px solid rgba(78, 201, 176, 0.4);
            color: var(--accent-cyan);
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: Consolas, monospace;
        }

        /* Copy Buttons */
        .copy-btn {
            background-color: var(--bg-tertiary);
            border: 1px solid var(--border-color);
            color: var(--text-primary);
            padding: 4px 10px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.15s;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }

        .copy-btn:hover {
            background-color: var(--accent-blue);
            color: #ffffff;
            border-color: var(--accent-blue);
        }

        .copy-btn.copied {
            background-color: #2e7d32;
            color: #ffffff;
            border-color: #2e7d32;
        }

        .sidebar-link.hidden,
        .sidebar-category-group.hidden {
            display: none !important;
        }

        .no-results {
            text-align: center;
            padding: 80px 20px;
            color: var(--text-muted);
            font-size: 16px;
            display: none;
        }
    </style>
</head>
<body>

    <!-- Top Navigation & Search -->
    <header class="top-navbar">
        <div class="header-top-row">
            <div class="logo-group">
                <img src="${logoData.logo64}" alt="LLP Logo" class="logo-img" />
                <div class="header-title-box">
                    <h1 id="pageMainTitle">${escapeHtml(ui.title)}</h1>
                    <div class="header-subtitle" id="pageSubTitle">${escapeHtml(ui.badgeCount)} • Official Read-Only Reference Manual</div>
                </div>
            </div>
            <div class="header-controls-right">
                <div class="lang-selector-group">
                    <span class="lang-icon">🌐</span>
                    <label for="langSelect" class="lang-label" id="langLabel">${escapeHtml(ui.langLabel)}</label>
                    <select id="langSelect" class="lang-select" onchange="switchLanguage(this.value)">
                        <option value="en" ${lang === 'en' ? 'selected' : ''}>🇬🇧 English (Universal)</option>
                        <option value="fr" ${lang === 'fr' ? 'selected' : ''}>🇫🇷 Français</option>
                        <option value="es" ${lang === 'es' ? 'selected' : ''}>🇪🇸 Español</option>
                        <option value="de" ${lang === 'de' ? 'selected' : ''}>🇩🇪 Deutsch</option>
                    </select>
                </div>
                <div class="readonly-indicator">
                    <span>🔒</span> <span id="readonlyPillText">${escapeHtml(ui.readonlyBadge)}</span>
                </div>
            </div>
        </div>

        <div class="search-filter-row">
            <div class="search-box-wrapper">
                <span class="search-icon">🔍</span>
                <input type="text" id="searchInput" class="search-input" placeholder="${escapeHtml(ui.searchPlaceholder)}" autofocus>
            </div>
            <div class="category-pills" id="categoryPills">
                <button class="pill-btn active" data-cat="all" id="pillAll">${escapeHtml(ui.allCategories)}</button>
                ${categories.map(c => {
                    const catName = (LLP_CATEGORIES_I18N[lang] && LLP_CATEGORIES_I18N[lang][c]) ? LLP_CATEGORIES_I18N[lang][c] : c;
                    return `<button class="pill-btn" data-cat="${escapeHtml(c)}">${escapeHtml(catName)}</button>`;
                }).join('')}
            </div>
        </div>
    </header>

    <!-- Main Content Workspace -->
    <div class="workspace">
        <!-- Left Sidebar Navigation -->
        <aside class="sidebar" id="sidebarNav">
            ${sidebarNavHtml}
        </aside>

        <!-- Right Content Cards - Mouse Wheel Scrollable -->
        <main class="content-area" id="contentArea">
            ${cardsHtml}
            <div class="no-results" id="noResultsMessage">
                No instructions matching your query were found.
            </div>
        </main>
    </div>

    <script>
        let vscode = null;
        try {
            if (typeof acquireVsCodeApi === 'function') {
                vscode = acquireVsCodeApi();
            }
        } catch (e) {
            // Standalone preview mode
        }
        const searchInput = document.getElementById('searchInput');
        const categoryPills = document.getElementById('categoryPills');
        const contentArea = document.getElementById('contentArea');
        const cards = document.querySelectorAll('.doc-card');
        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        const sidebarGroups = document.querySelectorAll('.sidebar-category-group');
        const noResults = document.getElementById('noResultsMessage');

        const I18N_ITEMS = ${JSON.stringify(LLP_ITEMS_I18N)};
        const I18N_CATS = ${JSON.stringify(LLP_CATEGORIES_I18N)};
        const I18N_UI = ${JSON.stringify(LLP_UI_I18N)};
        const BASE_ITEMS = ${JSON.stringify(LLP_DOCS_LIST)};

        let currentCategory = 'all';
        let currentLanguage = "${escapeHtml(lang)}";

        // Filter function using CSS class toggle (Never overwriting display to flex row)
        function applyFilters() {
            const query = searchInput.value.trim().toLowerCase();
            let visibleCount = 0;

            cards.forEach(card => {
                const cardBaseCat = card.getAttribute('data-base-cat');
                const cardKeywords = card.getAttribute('data-keywords') || '';

                const matchesCat = (currentCategory === 'all' || cardBaseCat === currentCategory);
                const matchesSearch = (!query || cardKeywords.includes(query));

                if (matchesCat && matchesSearch) {
                    card.classList.remove('hidden');
                    visibleCount++;
                } else {
                    card.classList.add('hidden');
                }
            });

            // Update sidebar visibility
            sidebarLinks.forEach(link => {
                const targetId = link.getAttribute('data-id');
                const card = document.getElementById('doc-' + targetId);
                if (card && !card.classList.contains('hidden')) {
                    link.classList.remove('hidden');
                } else {
                    link.classList.add('hidden');
                }
            });

            // Update sidebar groups
            sidebarGroups.forEach(group => {
                const linksInGroup = group.querySelectorAll('.sidebar-link:not(.hidden)');
                group.classList.toggle('hidden', linksInGroup.length === 0);
            });

            noResults.style.display = visibleCount === 0 ? 'block' : 'none';
        }

        searchInput.addEventListener('input', applyFilters);

        // Category pills click
        categoryPills.addEventListener('click', (e) => {
            const btn = e.target.closest('.pill-btn');
            if (!btn) return;
            document.querySelectorAll('.pill-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategory = btn.getAttribute('data-cat');
            applyFilters();
            contentArea.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Instant Multi-Language Switcher
        window.switchLanguage = function(newLang, notifyHost = true) {
            currentLanguage = newLang || 'en';
            const ui = I18N_UI[currentLanguage] || I18N_UI['en'];
            const langSelect = document.getElementById('langSelect');
            if (langSelect && langSelect.value !== currentLanguage) {
                langSelect.value = currentLanguage;
            }

            // 1. Update UI Elements
            document.getElementById('pageMainTitle').innerText = ui.title;
            document.getElementById('pageSubTitle').innerText = ui.badgeCount + ' • Official Read-Only Reference Manual';
            document.getElementById('langLabel').innerText = ui.langLabel;
            document.getElementById('readonlyPillText').innerText = ui.readonlyBadge;
            searchInput.placeholder = ui.searchPlaceholder;
            document.getElementById('pillAll').innerText = ui.allCategories;

            // 2. Update Section Headers
            document.querySelectorAll('[data-i18n-section="params"]').forEach(el => el.innerText = ui.paramsTitle);
            document.querySelectorAll('[data-i18n-section="syntax"]').forEach(el => el.innerText = ui.syntaxTitle);
            document.querySelectorAll('[data-i18n-section="desc"]').forEach(el => el.innerText = ui.descTitle);
            document.querySelectorAll('[data-i18n-section="code"]').forEach(el => el.innerText = ui.codeTitle);
            document.querySelectorAll('.readonly-label').forEach(el => el.innerText = ui.readonlyBadge);

            // Table headers
            document.querySelectorAll('[data-i18n-th="param"]').forEach(el => el.innerText = ui.thParam);
            document.querySelectorAll('[data-i18n-th="type"]').forEach(el => el.innerText = ui.thType);
            document.querySelectorAll('[data-i18n-th="desc"]').forEach(el => el.innerText = ui.thDesc);

            // 3. Update Category Pills and Sidebar Titles
            document.querySelectorAll('.category-pills .pill-btn').forEach(btn => {
                const catKey = btn.getAttribute('data-cat');
                if (catKey !== 'all') {
                    const trans = (I18N_CATS[currentLanguage] && I18N_CATS[currentLanguage][catKey]) ? I18N_CATS[currentLanguage][catKey] : catKey;
                    btn.innerText = trans;
                }
            });

            document.querySelectorAll('.sidebar-category-group').forEach(grp => {
                const baseGrp = grp.getAttribute('data-base-group');
                const titleEl = grp.querySelector('.sidebar-category-title');
                if (titleEl && baseGrp) {
                    const trans = (I18N_CATS[currentLanguage] && I18N_CATS[currentLanguage][baseGrp]) ? I18N_CATS[currentLanguage][baseGrp] : baseGrp;
                    titleEl.innerText = trans;
                }
            });

            // 4. Update Cards Content
            cards.forEach(card => {
                const id = card.getAttribute('data-id');
                const baseItem = BASE_ITEMS.find(d => d.id === id);
                if (!baseItem) return;

                let summary = baseItem.summary;
                let description = baseItem.description;
                let catName = baseItem.category;
                let paramTrans = {};

                if (currentLanguage !== 'en' && I18N_ITEMS[currentLanguage] && I18N_ITEMS[currentLanguage][id]) {
                    const itemI18n = I18N_ITEMS[currentLanguage][id];
                    if (itemI18n.summary) summary = itemI18n.summary;
                    if (itemI18n.description) description = itemI18n.description;
                    if (itemI18n.parameters) paramTrans = itemI18n.parameters;
                }

                if (I18N_CATS[currentLanguage] && I18N_CATS[currentLanguage][baseItem.category]) {
                    catName = I18N_CATS[currentLanguage][baseItem.category];
                }

                const summaryEl = card.querySelector('.doc-summary');
                if (summaryEl) summaryEl.innerText = summary;

                const descEl = card.querySelector('.doc-desc-text');
                if (descEl) descEl.innerText = description;

                const badgeEl = card.querySelector('.category-badge');
                if (badgeEl) badgeEl.innerText = catName;

                card.querySelectorAll('.param-desc').forEach(td => {
                    const pName = td.getAttribute('data-param-name');
                    if (paramTrans[pName]) {
                        td.innerText = paramTrans[pName];
                    } else {
                        const originalP = (baseItem.parameters || []).find(p => p.name === pName);
                        if (originalP) td.innerText = originalP.desc;
                    }
                });

                card.setAttribute('data-category', catName);
                card.setAttribute('data-keywords', (baseItem.name.toLowerCase() + ' ' + id.toLowerCase() + ' ' + summary.toLowerCase() + ' ' + description.toLowerCase()));
            });

            // Re-apply filters with updated keywords
            applyFilters();

            // Notify VS Code to persist preferred language
            if (notifyHost && vscode) {
                vscode.postMessage({
                    command: 'setLanguage',
                    language: currentLanguage
                });
            }
        };

        // Copy code sample
        window.copyCode = function(button, id) {
            const pre = document.getElementById('code-' + id);
            if (!pre) return;
            const text = pre.innerText || pre.textContent;
            const ui = I18N_UI[currentLanguage] || I18N_UI['en'];
            navigator.clipboard.writeText(text).then(() => {
                const orig = button.innerText;
                button.innerText = '✓ ' + ui.copied;
                button.classList.add('copied');
                setTimeout(() => {
                    button.innerText = orig;
                    button.classList.remove('copied');
                }, 2000);
            });
        };

        window.copyRawText = function(button, text) {
            const ui = I18N_UI[currentLanguage] || I18N_UI['en'];
            navigator.clipboard.writeText(text).then(() => {
                const orig = button.innerText;
                button.innerText = '✓ ' + ui.copied;
                button.classList.add('copied');
                setTimeout(() => {
                    button.innerText = orig;
                    button.classList.remove('copied');
                }, 2000);
            });
        };

        // Scroll to card and pulse highlight smoothly
        window.scrollToDoc = function(targetId) {
            if (!targetId) return;
            const clean = targetId.toLowerCase().replace(/[^a-z0-9_]/g, '');
            const card = document.getElementById('doc-' + clean);
            if (card) {
                if (card.classList.contains('hidden')) {
                    currentCategory = 'all';
                    document.querySelectorAll('.pill-btn').forEach(b => {
                        b.classList.toggle('active', b.getAttribute('data-cat') === 'all');
                    });
                    searchInput.value = '';
                    applyFilters();
                }

                card.scrollIntoView({ behavior: 'smooth', block: 'start' });
                card.classList.remove('highlight-pulse');
                void card.offsetWidth; // Force DOM reflow
                card.classList.add('highlight-pulse');

                sidebarLinks.forEach(l => l.classList.remove('active'));
                const link = document.querySelector('.sidebar-link[data-id="' + clean + '"]');
                if (link) link.classList.add('active');
            }
        };

        window.selectDoc = function(id, evt) {
            evt.preventDefault();
            scrollToDoc(id);
        };

        // Listen for messages from extension host (e.g. scrollTo or language change from VS Code command)
        window.addEventListener('message', event => {
            const msg = event.data;
            if (!msg) return;
            if (msg.command === 'scrollTo') {
                scrollToDoc(msg.target);
            } else if (msg.command === 'changeLanguage') {
                switchLanguage(msg.language, false);
            }
        });

        // Initial target scroll if provided
        const initialTarget = "${escapeHtml(initialTarget)}";
        if (initialTarget) {
            setTimeout(() => {
                scrollToDoc(initialTarget);
            }, 300);
        }
    </script>
</body>
</html>`;
}

function highlightSyntax(code) {
    if (!code) return "";
    let escaped = escapeHtml(code);
    escaped = escaped.replace(/(\/\/.*|\/\-.*)/g, '<span style="color:#6a9955;">$1</span>');
    escaped = escaped.replace(/(&quot;.*?&quot;|&#039;.*?&#039;)/g, '<span style="color:#ce9178;">$1</span>');
    escaped = escaped.replace(/\b(\d+(\.\d+)?)\b/g, '<span style="color:#b5cea8;">$1</span>');
    escaped = escaped.replace(/\b(visibility|General|Global|App|string|int|float|bool|func|return|if|then|else|end|for|in|while|true|false|True|False|null|new)\b/g, '<span style="color:#c586c0;font-weight:600;">$1</span>');
    escaped = escaped.replace(/\b(print|input|PY|Math|CLLPDB|Database|Crypto|UIValidator|SciLlp|SymLlp|ProbLlp|Instance|File|Directory|Background|Card|Row|Grid|Modal|Button|TextInput|Text|ItemBox|Checkbox|Image|ProgressBar)\b/g, '<span style="color:#4ec9b0;font-weight:600;">$1</span>');
    escaped = escaped.replace(/\.([a-zA-Z_][a-zA-Z0-9_]*)/g, '.<span style="color:#dcdcaa;">$1</span>');
    return escaped;
}

function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

module.exports = {
    getDocumentationHtml
};
