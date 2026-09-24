const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');
const { findDoc } = require('./docsRegistry');
const { getDocumentationHtml } = require('./docsWebview');
const { scanDocumentSymbols, getMemberCompletions, getContextCompletions } = require('./autocompleteEngine');
const { getUiBuilderHtml } = require('./uiBuilderWebview');
let createProjectStructure;
try {
    createProjectStructure = require('../dist/index.js').createProjectStructure;
} catch (e) {}

function activate(context) {
    console.log('LLP (lolpaon) extension activated successfully.');

    let currentPanel = undefined;

    let disposable = vscode.commands.registerCommand('llp.openVisualDesigner', (uri) => {
        const activeEditor = vscode.window.activeTextEditor;
        const fileUri = uri || (activeEditor ? activeEditor.document.uri : undefined);

        if (!fileUri || (!fileUri.fsPath.endsWith('.illp') && !fileUri.fsPath.endsWith('.illps'))) {
            vscode.window.showWarningMessage("Please open an interface file (.illp or .illps) to show the visual designer.");
            return;
        }

        let illpPath = fileUri.fsPath;
        if (illpPath.endsWith('.illps')) {
            const correspondingIllp = illpPath.replace(/\.illps$/, '.illp');
            if (fs.existsSync(correspondingIllp)) {
                illpPath = correspondingIllp;
            }
        }

        const column = vscode.ViewColumn.Beside;

        if (currentPanel) {
            currentPanel.reveal(column);
        } else {
            currentPanel = vscode.window.createWebviewPanel(
                'llpVisualDesigner',
                '🎨 LLP Visual Designer: ' + path.basename(illpPath),
                column,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            currentPanel.onDidDispose(() => {
                currentPanel = undefined;
            }, null, context.subscriptions);
        }

        setupWebviewContent(currentPanel, illpPath);
    });

    context.subscriptions.push(disposable);

    // 1. COMMAND: Create Encrypted Database (.cllpdb) - Ctrl+Shift+P
    let createCllpdbCmd = vscode.commands.registerCommand('llp.createCllpdb', async () => {
        const rootPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || process.cwd();
        const fileName = await vscode.window.showInputBox({
            prompt: "File path or name for the .cllpdb database (e.g. data/products.cllpdb)",
            value: "data/products.cllpdb",
            validateInput: (text) => text.endsWith('.cllpdb') ? null : "The file must have the .cllpdb extension"
        });
        if (!fileName) return;

        const username = await vscode.window.showInputBox({
            prompt: "Administrator username for the database",
            value: "admin"
        });
        if (!username) return;

        const password = await vscode.window.showInputBox({
            prompt: "Administrator password (AES encryption & 2-min session)",
            password: true,
            value: "admin123"
        });
        if (!password) return;

        const targetPath = path.isAbsolute(fileName) ? fileName : path.join(rootPath, fileName);
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        const db = new CllpdbEngine(targetPath);
        db.initializeNew(username, password);
        vscode.window.showInformationMessage(`Encrypted database created: ${path.basename(targetPath)}`);
        vscode.commands.executeCommand('llp.openCllpdbManager', vscode.Uri.file(targetPath));
    });
    context.subscriptions.push(createCllpdbCmd);

    // 2. COMMAND: Open Encrypted Database Manager (.cllpdb)
    let openCllpdbCmd = vscode.commands.registerCommand('llp.openCllpdbManager', (uri) => {
        const activeEditor = vscode.window.activeTextEditor;
        const fileUri = uri || (activeEditor ? activeEditor.document.uri : undefined);

        if (!fileUri || !fileUri.fsPath.endsWith('.cllpdb')) {
            vscode.window.showWarningMessage("Please select a .cllpdb database file.");
            return;
        }

        const cllpdbPath = fileUri.fsPath;
        const panel = vscode.window.createWebviewPanel(
            'llpCllpdbManager',
            '🗄️ LLP Encrypted DB: ' + path.basename(cllpdbPath),
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        setupCllpdbWebview(panel, cllpdbPath);
    });
    context.subscriptions.push(openCllpdbCmd);

    // Custom Editor Provider: Automatically triggers when clicking on any *.cllpdb in VS Code file explorer
    const cllpdbCustomEditorProvider = {
        async openCustomDocument(uri) {
            return { uri, dispose: () => {} };
        },
        async resolveCustomEditor(document, webviewPanel) {
            webviewPanel.webview.options = {
                enableScripts: true,
                retainContextWhenHidden: true
            };
            setupCllpdbWebview(webviewPanel, document.uri.fsPath);
        }
    };

    context.subscriptions.push(
        vscode.window.registerCustomEditorProvider('llp.cllpdbCustomEditor', cllpdbCustomEditorProvider, {
            supportsMultipleEditorsPerDocument: false,
            webviewOptions: {
                retainContextWhenHidden: true
            }
        })
    );

    // Auto-detect when user clicks/opens a .cllpdb file and immediately show the Database Manager
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && editor.document && editor.document.fileName.endsWith('.cllpdb')) {
            const uri = editor.document.uri;
            vscode.commands.executeCommand('workbench.action.closeActiveEditor').then(() => {
                vscode.commands.executeCommand('llp.openCllpdbManager', uri);
            });
        }
    });

    // 3. COMMAND: Create New Project (Architecture Choice: Client/Server or Monolithic)
    let createEmptyProjectCmd = vscode.commands.registerCommand('llp.createEmptyProject', async () => {
        const projName = await vscode.window.showInputBox({
            prompt: "Name of the new LLP project",
            value: "MyLLPProject"
        });
        if (!projName) return;

        const folders = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: "Select parent folder for the project"
        });
        const parentDir = folders?.[0]?.fsPath || (vscode.workspace.workspaceFolders?.[0]?.uri.fsPath);
        if (!parentDir) return;

        const targetDir = path.join(parentDir, projName);
        if (fs.existsSync(targetDir)) {
            vscode.window.showErrorMessage(`Folder '${projName}' already exists.`);
            return;
        }

        const selectedArch = await vscode.window.showQuickPick([
            {
                label: "$(globe) Client / Serveur Séparé (Recommandé)",
                description: "client/ (exécutable UI) et server/ (scripts BDD & RPC dédiés)",
                detail: "Idéal pour les applications réseau : client distant + serveur avec base .cllpdb",
                arch: "client-server"
            },
            {
                label: "$(package) Monolithique / Tout-en-Un (Standalone)",
                description: "src/ (base de données, logique et UI compilées ensemble)",
                detail: "Idéal pour les logiciels de bureau autonomes : BDD embarquée directement dans le logiciel",
                arch: "monolithic"
            }
        ], {
            placeHolder: "Choisissez l'architecture logicielle pour votre nouveau projet LLP"
        });
        if (!selectedArch) return;

        createProjectSkeleton(targetDir, projName, selectedArch.arch);
        vscode.window.showInformationMessage(`LLP Project '${projName}' (${selectedArch.arch}) created successfully!`);

        const primaryFile = selectedArch.arch === 'client-server'
            ? path.join(targetDir, "client", "main.llp")
            : path.join(targetDir, "src", "main.llp");

        if (fs.existsSync(primaryFile)) {
            vscode.workspace.openTextDocument(primaryFile).then(doc => vscode.window.showTextDocument(doc));
        }

        const viewFile = selectedArch.arch === 'client-server'
            ? path.join(targetDir, "client", "views", "main.illp")
            : path.join(targetDir, "src", "views", "main.illp");

        if (fs.existsSync(viewFile)) {
            vscode.commands.executeCommand('llp.openVisualDesigner', vscode.Uri.file(viewFile));
        }
    });
    context.subscriptions.push(createEmptyProjectCmd);

    // 4. COMMAND: Create Example Project (Product Management)
    let createExampleProjectCmd = vscode.commands.registerCommand('llp.createExampleProject', async () => {
        const folders = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: "Select folder to deploy the example project"
        });
        const parentDir = folders?.[0]?.fsPath || (vscode.workspace.workspaceFolders?.[0]?.uri.fsPath);
        if (!parentDir) return;

        const targetDir = path.join(parentDir, "ProductManagementProject");
        createProjectSkeleton(targetDir, "ProductManagementProject", true);
        vscode.window.showInformationMessage("Example project 'Product Management' created successfully!");
        const mainFile = path.join(targetDir, "src", "main.llp");
        if (fs.existsSync(mainFile)) {
            vscode.workspace.openTextDocument(mainFile).then(doc => vscode.window.showTextDocument(doc));
        }
        const dashFile = path.join(targetDir, "interfaces", "dashboard.illp");
        if (fs.existsSync(dashFile)) {
            vscode.commands.executeCommand('llp.openVisualDesigner', vscode.Uri.file(dashFile));
        }
    });
    context.subscriptions.push(createExampleProjectCmd);

    // 5. COMMAND: Run LLP Script (.llp)
    let runScriptCmd = vscode.commands.registerCommand('llp.runScript', (uri) => {
        const activeEditor = vscode.window.activeTextEditor;
        const fileUri = uri || (activeEditor ? activeEditor.document.uri : undefined);
        if (!fileUri || (!fileUri.fsPath.endsWith('.llp') && !fileUri.fsPath.endsWith('.lolpaon'))) {
            vscode.window.showWarningMessage("Please select an .llp script file to run.");
            return;
        }

        // Auto-save file if modified
        if (activeEditor && activeEditor.document.uri.toString() === fileUri.toString() && activeEditor.document.isDirty) {
            activeEditor.document.save();
        }

        // Resolve CLI path
        let cliPath = path.join(context.extensionPath, "..", "bin", "llp.js");
        if (!fs.existsSync(cliPath)) {
            const wsFolders = vscode.workspace.workspaceFolders;
            if (wsFolders) {
                for (const f of wsFolders) {
                    const candidate = path.join(f.uri.fsPath, "bin", "llp.js");
                    if (fs.existsSync(candidate)) {
                        cliPath = candidate;
                        break;
                    }
                }
            }
        }

        let terminal = vscode.window.terminals.find(t => t.name === "LLP Runner");
        if (!terminal) {
            terminal = vscode.window.createTerminal("LLP Runner");
        }
        terminal.show();

        const escapedFile = `"${fileUri.fsPath}"`;
        if (fs.existsSync(cliPath)) {
            terminal.sendText(`node "${cliPath}" run ${escapedFile}`);
        } else {
            terminal.sendText(`llp run ${escapedFile}`);
        }
    });
    context.subscriptions.push(runScriptCmd);

    // 6. COMMAND: Launch Interactive Application (GUI Window)
    let launchInteractiveAppCmd = vscode.commands.registerCommand('llp.launchInteractiveApp', (uri) => {
        let cliPath = path.join(context.extensionPath, "..", "bin", "llp.js");
        if (!fs.existsSync(cliPath)) {
            const wsFolders = vscode.workspace.workspaceFolders;
            if (wsFolders) {
                for (const f of wsFolders) {
                    const candidate = path.join(f.uri.fsPath, "bin", "llp.js");
                    if (fs.existsSync(candidate)) {
                        cliPath = candidate;
                        break;
                    }
                }
            }
        }

        let terminal = vscode.window.terminals.find(t => t.name === "LLP App Runner");
        if (!terminal) {
            terminal = vscode.window.createTerminal("LLP App Runner");
        }
        terminal.show();

        const activeEditor = vscode.window.activeTextEditor;
        const fileUri = uri || (activeEditor ? activeEditor.document.uri : undefined);
        let projectFolder = "";
        if (fileUri) {
            let pDir = path.dirname(fileUri.fsPath);
            if (pDir.endsWith("interfaces") || pDir.endsWith("src") || pDir.endsWith("lib") || pDir.endsWith("data")) {
                pDir = path.dirname(pDir);
            }
            projectFolder = `"${pDir}"`;
        }

        if (fs.existsSync(cliPath)) {
            terminal.sendText(`node "${cliPath}" app ${projectFolder}`);
        } else {
            terminal.sendText(`llp app ${projectFolder}`);
        }
    });
    context.subscriptions.push(launchInteractiveAppCmd);

    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'llp.openVisualDesigner';
    statusBarItem.text = '$(layout) LLP Visual Designer';
    statusBarItem.tooltip = 'Click to open visual designer or execute';

    function updateStatusBar() {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const fn = editor.document.fileName;
            if (fn.endsWith('.llp') || fn.endsWith('.lolpaon')) {
                statusBarItem.text = '$(play) Run LLP';
                statusBarItem.command = 'llp.runScript';
                statusBarItem.tooltip = 'Run this LLP script in the terminal';
                statusBarItem.show();
                return;
            }
            if (fn.endsWith('.illp') || fn.endsWith('.illps')) {
                statusBarItem.text = '$(layout) LLP Visual Designer';
                statusBarItem.command = 'llp.openVisualDesigner';
                statusBarItem.tooltip = 'Open in WYSIWYG visual designer';
                statusBarItem.show();
                return;
            }
            if (fn.endsWith('.cllpdb')) {
                statusBarItem.text = '$(database) Encrypted DB .cllpdb';
                statusBarItem.command = 'llp.openCllpdbManager';
                statusBarItem.tooltip = 'Manage encrypted database';
                statusBarItem.show();
                return;
            }
        }
        statusBarItem.hide();
    }

    vscode.window.onDidChangeActiveTextEditor(updateStatusBar, null, context.subscriptions);
    updateStatusBar();
    context.subscriptions.push(statusBarItem);

    // ---------------------------------------------------
    // 6. LLP READ-ONLY DOCUMENTATION WEBVIEW PANEL
    // ---------------------------------------------------
    let docPanel = undefined;

    function openDocumentationPanel(targetWord = "") {
        const currentLang = context.globalState.get('llpDocLanguage') || vscode.workspace.getConfiguration('llp').get('documentation.language') || 'en';
        const column = vscode.ViewColumn.Beside;
        if (docPanel) {
            docPanel.reveal(column);
            if (targetWord) {
                docPanel.webview.postMessage({ command: 'scrollTo', target: targetWord });
            }
        } else {
            docPanel = vscode.window.createWebviewPanel(
                'llpDocumentation',
                '📖 LLP Language Documentation',
                column,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            docPanel.onDidDispose(() => {
                docPanel = undefined;
            }, null, context.subscriptions);

            docPanel.webview.onDidReceiveMessage(message => {
                if (message.command === 'setLanguage') {
                    const newLang = message.language || 'en';
                    context.globalState.update('llpDocLanguage', newLang);
                    try {
                        vscode.workspace.getConfiguration('llp').update('documentation.language', newLang, vscode.ConfigurationTarget.Global);
                    } catch (_) {}
                    const labels = {
                        en: '🇬🇧 English (Universal)',
                        fr: '🇫🇷 Français (French)',
                        es: '🇪🇸 Español (Spanish)',
                        de: '🇩🇪 Deutsch (German)'
                    };
                    vscode.window.setStatusBarMessage(`$(globe) LLP Documentation: ${labels[newLang] || newLang}`, 3500);
                }
            }, null, context.subscriptions);

            docPanel.webview.html = getDocumentationHtml(targetWord, currentLang);
        }
    }

    // Command: Open Full Documentation
    let openDocCmd = vscode.commands.registerCommand('llp.openDocumentation', () => {
        openDocumentationPanel("");
    });
    context.subscriptions.push(openDocCmd);

    // Command: Change Documentation Language (QuickPick)
    let changeDocLanguageCmd = vscode.commands.registerCommand('llp.changeDocLanguage', async () => {
        const currentLang = context.globalState.get('llpDocLanguage') || vscode.workspace.getConfiguration('llp').get('documentation.language') || 'en';
        const items = [
            { label: '$(globe) 🇬🇧 English', description: 'Universal / Default', lang: 'en', picked: currentLang === 'en' },
            { label: '$(globe) 🇫🇷 Français', description: 'French', lang: 'fr', picked: currentLang === 'fr' },
            { label: '$(globe) 🇪🇸 Español', description: 'Spanish', lang: 'es', picked: currentLang === 'es' },
            { label: '$(globe) 🇩🇪 Deutsch', description: 'German', lang: 'de', picked: currentLang === 'de' }
        ];

        const selected = await vscode.window.showQuickPick(items, {
            placeHolder: 'Select LLP Documentation Language / Choisir la langue de la documentation'
        });

        if (selected) {
            const lang = selected.lang;
            await context.globalState.update('llpDocLanguage', lang);
            try {
                await vscode.workspace.getConfiguration('llp').update('documentation.language', lang, vscode.ConfigurationTarget.Global);
            } catch (_) {}

            if (docPanel) {
                docPanel.webview.postMessage({ command: 'changeLanguage', language: lang });
            }
            vscode.window.showInformationMessage(`LLP Documentation Language set to ${selected.label.replace('$(globe) ', '')} (${selected.description}).`);
        }
    });
    context.subscriptions.push(changeDocLanguageCmd);

    // Command: Go to Documentation for this Instruction (Context Menu & Hover link)
    let openDocForWordCmd = vscode.commands.registerCommand('llp.openDocForWord', (arg) => {
        let target = "";
        if (typeof arg === 'string' && arg.trim().length > 0) {
            target = arg.trim();
        } else {
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                const sel = editor.selection;
                if (!sel.isEmpty) {
                    target = editor.document.getText(sel).trim();
                } else {
                    const wordRange = editor.document.getWordRangeAtPosition(sel.active, /[a-zA-Z0-9_\.]+/);
                    if (wordRange) {
                        target = editor.document.getText(wordRange).trim();
                    }
                }
            }
        }
        const currentLang = context.globalState.get('llpDocLanguage') || vscode.workspace.getConfiguration('llp').get('documentation.language') || 'en';
        const docEntry = findDoc(target, currentLang);
        const targetId = docEntry ? docEntry.id : target;
        openDocumentationPanel(targetId);
    });
    context.subscriptions.push(openDocForWordCmd);

    // ---------------------------------------------------
    // 7. HOVER PROVIDER (.llp, .illp, .illps, .lolpaon)
    // ---------------------------------------------------
    let hoverProvider = vscode.languages.registerHoverProvider(['llp', 'illp', 'illps', 'lolpaon'], {
        provideHover(document, position, token) {
            const wordRange = document.getWordRangeAtPosition(position, /[a-zA-Z0-9_\.]+/);
            if (!wordRange) return null;
            const word = document.getText(wordRange);
            const currentLang = context.globalState.get('llpDocLanguage') || vscode.workspace.getConfiguration('llp').get('documentation.language') || 'en';
            const doc = findDoc(word, currentLang);
            if (!doc) return null;

            const md = new vscode.MarkdownString();
            md.isTrusted = true;
            md.supportHtml = true;

            const uiStrings = {
                en: { syntax: "Syntax:", example: "Example:", params: "Parameters:" },
                fr: { syntax: "Syntaxe :", example: "Exemple :", params: "Paramètres :" },
                es: { syntax: "Sintaxis:", example: "Ejemplo:", params: "Parámetros:" },
                de: { syntax: "Syntax:", example: "Beispiel:", params: "Parameter:" }
            };
            const labels = uiStrings[currentLang] || uiStrings.en;

            md.appendMarkdown(`### \`${doc.name}\`  *(${doc.category})*\n\n`);
            md.appendMarkdown(`${doc.summary}\n\n`);
            if (doc.parameters && doc.parameters.length > 0) {
                md.appendMarkdown(`**${labels.params}**\n`);
                for (const p of doc.parameters) {
                    md.appendMarkdown(`- \`${p.name}\` *(${p.type})* : ${p.desc}\n`);
                }
                md.appendMarkdown(`\n`);
            }
            if (doc.syntax) {
                md.appendMarkdown(`**${labels.syntax}**\n\`\`\`llp\n${doc.syntax}\n\`\`\`\n\n`);
            }
            if (doc.codeSample) {
                md.appendMarkdown(`**${labels.example}**\n\`\`\`llp\n${doc.codeSample}\n\`\`\`\n\n`);
            }
            md.appendMarkdown(`---\n`);
            const argJson = encodeURIComponent(JSON.stringify(doc.id));
            const linkTexts = {
                en: `📖 **Go to Documentation for '${doc.name}'**`,
                fr: `📖 **Ouvrir la documentation pour '${doc.name}'**`,
                es: `📖 **Abrir la documentación para '${doc.name}'**`,
                de: `📖 **Dokumentation für '${doc.name}' öffnen**`
            };
            const linkText = linkTexts[currentLang] || linkTexts.en;
            md.appendMarkdown(`[${linkText}](command:llp.openDocForWord?${argJson})`);

            return new vscode.Hover(md, wordRange);
        }
    });
    context.subscriptions.push(hoverProvider);

    // ---------------------------------------------------
    // 8. INTELLIGENT CONTEXT-AWARE AUTOCOMPLETE PROVIDER
    // (Variables, Functions, Member Methods, Snippets, Types)
    // ---------------------------------------------------
    let completionProvider = vscode.languages.registerCompletionItemProvider(
        ['llp', 'illp', 'illps', 'lolpaon'],
        {
            provideCompletionItems(document, position, token, context) {
                const line = document.lineAt(position).text;
                const linePrefix = line.substr(0, position.character);

                // Case 1: Triggered right after a dot (e.g. "App.", "db.", "myList.", "Math.")
                const dotMatch = linePrefix.match(/([a-zA-Z_][a-zA-Z0-9_]*)\.$/);
                if (dotMatch) {
                    const callerName = dotMatch[1];
                    const { variables } = scanDocumentSymbols(document, position.line);
                    const varInfo = variables.get(callerName);
                    const inferredType = varInfo ? varInfo.type : "";

                    return getMemberCompletions(callerName, inferredType);
                }

                // Case 2: Partial member typing after a dot (e.g. "App.La" or "db.Qu")
                const partialDotMatch = linePrefix.match(/([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z0-9_]*)$/);
                if (partialDotMatch) {
                    const callerName = partialDotMatch[1];
                    const { variables } = scanDocumentSymbols(document, position.line);
                    const varInfo = variables.get(callerName);
                    const inferredType = varInfo ? varInfo.type : "";

                    return getMemberCompletions(callerName, inferredType);
                }

                // Case 3: Context-aware general completions (previous variables, functions, keywords, snippets, logic)
                return getContextCompletions(document, position);
            }
        },
        '.', ':', ' ', '('
    );
    context.subscriptions.push(completionProvider);

    // ---------------------------------------------------
    // 9. REAL-TIME STATIC CODE ANALYZER & ERROR DIAGNOSTICS
    // ---------------------------------------------------
    const { analyzeSource } = require('./diagnostics');
    const diagnosticCollection = vscode.languages.createDiagnosticCollection('llp');
    context.subscriptions.push(diagnosticCollection);

    function updateDiagnostics(document) {
        if (!document) return;
        const fn = document.fileName;
        if (!fn.endsWith('.llp') && !fn.endsWith('.lolpaon')) return;

        const text = document.getText();
        const items = analyzeSource(text, fn);
        const diags = [];

        for (const item of items) {
            const line = Math.max(0, item.line - 1);
            const col = Math.max(0, item.column - 1);
            let lineLength = 1;
            try {
                lineLength = document.lineAt(line).text.length;
            } catch (_) {}
            const endCol = item.endColumn ? Math.min(lineLength, item.endColumn) : Math.max(col + 1, lineLength);
            const range = new vscode.Range(line, col, line, endCol);

            const severity = item.severity === 'error'
                ? vscode.DiagnosticSeverity.Error
                : vscode.DiagnosticSeverity.Warning;

            let fullMsg = `[${item.code}] ${item.title}\n\n${item.message}`;
            if (item.missing) {
                fullMsg += `\n\n📌 CE QUI MANQUE :\n${item.missing}`;
            }
            fullMsg += `\n\n💡 COMMENT CORRIGER :\n${item.fix}`;
            if (item.hint) {
                fullMsg += `\n\nℹ️ ${item.hint}`;
            }

            const diag = new vscode.Diagnostic(range, fullMsg, severity);
            diag.code = item.code;
            diag.source = 'LLP Code Analyzer';
            diags.push(diag);
        }

        diagnosticCollection.set(document.uri, diags);
    }

    if (vscode.window.activeTextEditor) {
        updateDiagnostics(vscode.window.activeTextEditor.document);
    }

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor) updateDiagnostics(editor.document);
        }),
        vscode.workspace.onDidChangeTextDocument(event => {
            updateDiagnostics(event.document);
        }),
        vscode.workspace.onDidOpenTextDocument(document => {
            updateDiagnostics(document);
        }),
        vscode.workspace.onDidCloseTextDocument(document => {
            diagnosticCollection.delete(document.uri);
        })
    );

    // Command: Check Current File
    let checkFileCmd = vscode.commands.registerCommand('llp.checkFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage("Veuillez ouvrir un fichier .llp à analyser.");
            return;
        }
        updateDiagnostics(editor.document);
        const text = editor.document.getText();
        const items = analyzeSource(text, editor.document.fileName);
        const errCount = items.filter(i => i.severity === 'error').length;
        const warnCount = items.filter(i => i.severity === 'warning').length;

        if (errCount === 0 && warnCount === 0) {
            vscode.window.showInformationMessage(`✅ [LLP Analyzer] Aucune erreur détectée dans ${path.basename(editor.document.fileName)} ! Le code est parfaitement valide.`);
        } else {
            vscode.window.showErrorMessage(`🔴 [LLP Analyzer] ${errCount} erreur(s) et ${warnCount} avertissement(s) détectés. Consultez l'onglet Problèmes (Problems) pour voir les explications et corrections.`);
            vscode.commands.executeCommand('workbench.actions.view.problems');
        }
    });
    context.subscriptions.push(checkFileCmd);
}

function setupWebviewContent(panel, illpPath) {
    const illpsPath = illpPath.replace(/\.illp$/, '.illps');
    const hasStyle = () => fs.existsSync(illpsPath);

    function isSamePath(p1, p2) {
        if (!p1 || !p2) return false;
        return path.resolve(p1).toLowerCase() === path.resolve(p2).toLowerCase();
    }

    function getDocumentContent(filePath) {
        const openDoc = vscode.workspace.textDocuments.find(d => isSamePath(d.fileName, filePath));
        if (openDoc) {
            return openDoc.getText();
        }
        if (fs.existsSync(filePath)) {
            try {
                return fs.readFileSync(filePath, 'utf8');
            } catch (e) {}
        }
        return "";
    }

    function reload() {
        const illpContent = getDocumentContent(illpPath);
        const illpsContent = getDocumentContent(illpsPath);

        panel.webview.html = getVisualDesignerHtml(
            path.basename(illpPath),
            path.basename(illpsPath),
            illpContent,
            illpsContent,
            hasStyle()
        );
    }

    panel.webview.onDidReceiveMessage(message => {
        if (message.command === 'saveIllp') {
            const openDoc = vscode.workspace.textDocuments.find(d => isSamePath(d.fileName, illpPath));
            if (openDoc) {
                const edit = new vscode.WorkspaceEdit();
                const fullRange = new vscode.Range(
                    openDoc.positionAt(0),
                    openDoc.positionAt(openDoc.getText().length)
                );
                edit.replace(openDoc.uri, fullRange, message.content);
                vscode.workspace.applyEdit(edit).then(() => {
                    openDoc.save();
                });
            } else {
                fs.writeFileSync(illpPath, message.content, 'utf8');
            }
            vscode.window.showInformationMessage(`Interface ${path.basename(illpPath)} saved successfully!`);
        } else if (message.command === 'openStyleFile') {
            if (fs.existsSync(illpsPath)) {
                vscode.workspace.openTextDocument(illpsPath).then(doc => {
                    vscode.window.showTextDocument(doc, vscode.ViewColumn.One);
                });
            } else {
                vscode.window.showInformationMessage(`No style file ${path.basename(illpsPath)} found.`);
            }
        }
    });

    const docWatcher = vscode.workspace.onDidSaveTextDocument(doc => {
        if (isSamePath(doc.fileName, illpPath) || isSamePath(doc.fileName, illpsPath)) {
            reload();
        }
    });

    let debounceTimer = null;
    const changeWatcher = vscode.workspace.onDidChangeTextDocument(e => {
        if (isSamePath(e.document.fileName, illpPath) || isSamePath(e.document.fileName, illpsPath)) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                reload();
            }, 400);
        }
    });

    panel.onDidDispose(() => {
        docWatcher.dispose();
        changeWatcher.dispose();
        clearTimeout(debounceTimer);
    });

    reload();
}

function convertIllpsToCss(illps) {
    if (!illps) return '';

    let css = illps.replace(/\/\*([\s\S]*?)\*\\/g, '/*$1*/');
    css = css.replace(/\/-.*$/gm, '');
    css = css.replace(/visibility:\s*\w+;?/gi, '');

    css = css.replace(/([^{]+)\{([^}]+)\}/g, (match, rawSelector, body) => {
        let comment = '';
        let selector = rawSelector.replace(/\/\*[\s\S]*?\*\//g, (c) => {
            comment += c + '\n';
            return '';
        }).trim();

        let sel = selector;
        if (/^Background/i.test(sel)) {
            sel = '#app-body, #app-frame';
        } else {
            sel = sel.replace(/(?:\w+)?#(\w+)/g, '#$1, #$1 > *, #$1 input, #$1 button, #$1 .ui-element');
        }

        let lines = body.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        let propLines = lines.map(line => {
            let l = line;
            if (/responsive:\s*(true|false);?/i.test(l)) return '';
            
            l = l.replace(/fontSize:/gi, 'font-size:')
                 .replace(/marginBottom:/gi, 'margin-bottom:')
                 .replace(/marginTop:/gi, 'margin-top:')
                 .replace(/marginLeft:/gi, 'margin-left:')
                 .replace(/marginRight:/gi, 'margin-right:')
                 .replace(/minWidth:/gi, 'min-width:')
                 .replace(/maxWidth:/gi, 'max-width:')
                 .replace(/minHeight:/gi, 'min-height:')
                 .replace(/maxHeight:/gi, 'max-height:')
                 .replace(/borderRadius:/gi, 'border-radius:')
                 .replace(/backgroundColor:/gi, 'background-color:')
                 .replace(/align:\s*center/gi, 'text-align: center; margin-left: auto; margin-right: auto;')
                 .replace(/align:\s*right/gi, 'text-align: right; margin-left: auto;')
                 .replace(/align:\s*left/gi, 'text-align: left; margin-right: auto;')
                 .replace(/font:\s*bold/gi, 'font-weight: bold;');

            if (!l.endsWith(';') && l.includes(':')) {
                l += ';';
            }
            return '    ' + l;
        }).filter(Boolean);

        return comment + sel + ' {\n' + propLines.join('\n') + '\n}\n';
    });

    return css;
}

function getVisualDesignerHtml(fileName, styleFileName, illpContent, illpsContent, hasStyle) {
    if (typeof getUiBuilderHtml === 'function') {
        const os = require('os');
        const crypto = require('crypto');
        const devId = 'SECURED_DEV_' + crypto.createHash('sha256').update(os.hostname() + '_' + os.platform()).digest('hex').substring(0, 16).toUpperCase();
        return getUiBuilderHtml({
            fileName,
            illpContent,
            illpsContent,
            deviceId: devId,
            isStandalone: false
        });
    }
    return "<!DOCTYPE html><html><body>UI Builder unavailable</body></html>";
}

// ===================================================
// MOTEUR CLLPDB & GESTIONNAIRE DE BASE CRYPTÉE
// ===================================================

class CllpdbEngine {
    constructor(filePath, customKey) {
        this.filePath = filePath;
        this.projectKey = customKey || this.findProjectKey(filePath);
        this.content = {
            magic: "CLLPDBv1",
            adminUser: "admin",
            adminPassHash: crypto.createHash("sha256").update("admin123").digest("hex"),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            databases: {
                default: {
                    name: "default",
                    tables: {}
                }
            }
        };
        this.sessionExpiresAt = 0;
        this.currentDbName = "default";
        this.load();
    }

    findProjectKey(filePath) {
        let dir = path.dirname(filePath);
        while (dir && dir !== path.dirname(dir)) {
            const cfg = path.join(dir, "project.config");
            if (fs.existsSync(cfg)) {
                try {
                    const text = fs.readFileSync(cfg, "utf-8");
                    const m = text.match(/project_key\s*=\s*["']([a-fA-F0-9]+)["']/);
                    if (m && m[1]) return m[1];
                } catch (e) {}
            }
            dir = path.dirname(dir);
        }
        return crypto.createHash("sha256").update("LOLPAON_DEFAULT_KEY_LLP").digest("hex");
    }

    static isSystemAdmin() {
        try {
            if (process.platform === "win32") {
                execSync("net session", { stdio: "ignore" });
                return true;
            } else {
                return process.getuid ? process.getuid() === 0 : false;
            }
        } catch (e) {
            return false;
        }
    }

    hashPassword(pass) {
        return crypto.createHash("sha256").update(pass).digest("hex");
    }

    load() {
        if (!fs.existsSync(this.filePath)) return false;
        try {
            const raw = fs.readFileSync(this.filePath);
            if (raw.length < 40 || raw.subarray(0, 8).toString("utf8") !== "CLLPDB01") {
                return false;
            }
            const salt = raw.subarray(8, 24);
            const iv = raw.subarray(24, 40);
            const encrypted = raw.subarray(40);

            const derivedKey = crypto.pbkdf2Sync(this.projectKey, salt, 10000, 32, "sha256");
            const decipher = crypto.createDecipheriv("aes-256-cbc", derivedKey, iv);
            let decrypted = decipher.update(encrypted);
            decrypted = Buffer.concat([decrypted, decipher.final()]);

            this.content = JSON.parse(decrypted.toString("utf8"));
            return true;
        } catch (e) {
            return false;
        }
    }

    save() {
        try {
            const dir = path.dirname(this.filePath);
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

            this.content.updatedAt = Date.now();
            const jsonBuf = Buffer.from(JSON.stringify(this.content), "utf8");

            const salt = crypto.randomBytes(16);
            const iv = crypto.randomBytes(16);
            const derivedKey = crypto.pbkdf2Sync(this.projectKey, salt, 10000, 32, "sha256");

            const cipher = crypto.createCipheriv("aes-256-cbc", derivedKey, iv);
            let encrypted = cipher.update(jsonBuf);
            encrypted = Buffer.concat([encrypted, cipher.final()]);

            const header = Buffer.from("CLLPDB01", "utf8");
            const finalBuf = Buffer.concat([header, salt, iv, encrypted]);

            fs.writeFileSync(this.filePath, finalBuf);
            return true;
        } catch (e) {
            return false;
        }
    }

    initializeNew(adminUser, adminPass) {
        this.content = {
            magic: "CLLPDBv1",
            adminUser: adminUser || "admin",
            adminPassHash: this.hashPassword(adminPass || "admin123"),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            databases: {
                default: {
                    name: "default",
                    tables: {}
                }
            }
        };
        this.save();
        this.startSession(adminUser, adminPass);
        return true;
    }

    startSession(username, password) {
        const passHash = this.hashPassword(password);
        if (this.content.adminUser === username && this.content.adminPassHash === passHash) {
            this.sessionExpiresAt = Date.now() + 120 * 1000; // 2 minutes
            return { success: true, message: "Session opened successfully (duration: 2 minutes)", remainingSeconds: 120 };
        }
        return { success: false, message: "Incorrect username or password", remainingSeconds: 0 };
    }

    isSessionActive() {
        return Date.now() < this.sessionExpiresAt;
    }

    getRemainingSeconds() {
        return Math.max(0, Math.round((this.sessionExpiresAt - Date.now()) / 1000));
    }

    endSession() {
        this.sessionExpiresAt = 0;
    }

    changeCredentials(newUsername, newPassword) {
        if (!CllpdbEngine.isSystemAdmin()) {
            return {
                success: false,
                message: "Denied: Modifying access credentials requires running the command with administrator privileges on your computer."
            };
        }
        this.content.adminUser = newUsername;
        this.content.adminPassHash = this.hashPassword(newPassword);
        this.save();
        return { success: true, message: "Administrator credentials updated successfully!" };
    }

    getDatabases() {
        return Object.keys(this.content.databases);
    }

    useDatabase(dbName) {
        if (this.content.databases[dbName]) {
            this.currentDbName = dbName;
            return true;
        }
        return false;
    }

    getCurrentDb() {
        if (!this.content.databases[this.currentDbName]) {
            this.content.databases[this.currentDbName] = { name: this.currentDbName, tables: {} };
        }
        return this.content.databases[this.currentDbName];
    }

    getTables() {
        return this.getCurrentDb().tables;
    }

    executeSql(sql) {
        const clean = sql.trim();
        if (!clean) return { success: true, message: "Empty query.", data: [] };

        // 1. DROP ALL DATABASE;
        if (/^DROP\s+ALL\s+DATABASE;?/i.test(clean)) {
            this.content.databases = {
                default: { name: "default", tables: {} }
            };
            this.currentDbName = "default";
            this.save();
            return { success: true, message: "All databases have been deleted successfully." };
        }

        // 2. DROP ALL TABLES;
        if (/^DROP\s+ALL\s+TABLES;?/i.test(clean)) {
            const db = this.getCurrentDb();
            db.tables = {};
            this.save();
            return { success: true, message: "All tables in the current database have been deleted successfully." };
        }

        // 3. DROP ALL DATA FROM table_name;
        const dropDataMatch = clean.match(/^DROP\s+ALL\s+DATA\s+FROM\s+([a-zA-Z0-9_\-]+);?/i);
        if (dropDataMatch) {
            const tblName = dropDataMatch[1];
            const db = this.getCurrentDb();
            if (!db.tables[tblName]) {
                return { success: false, message: `Table '${tblName}' not found.` };
            }
            const count = db.tables[tblName].rows.length;
            db.tables[tblName].rows = [];
            this.save();
            return { success: true, message: `All data from table '${tblName}' deleted (${count} rows).` };
        }

        // 4. DROP TABLE table_name
        const dropTblMatch = clean.match(/^DROP\s+TABLE\s+([a-zA-Z0-9_\-]+);?/i);
        if (dropTblMatch) {
            const tblName = dropTblMatch[1];
            const db = this.getCurrentDb();
            if (!db.tables[tblName]) {
                return { success: false, message: `Table '${tblName}' does not exist.` };
            }

            const referencingTables = [];
            for (const otherName of Object.keys(db.tables)) {
                if (otherName === tblName) continue;
                const otherTbl = db.tables[otherName];
                for (const fk of otherTbl.foreignKeys || []) {
                    if (fk.foreignTable.toLowerCase() === tblName.toLowerCase()) {
                        referencingTables.push(otherName);
                    }
                }
            }

            if (referencingTables.length > 0) {
                return {
                    success: false,
                    message: `Cannot delete '${tblName}': referenced as foreign key by [${referencingTables.join(', ')}]. Delete related tables first or run 'DROP ALL TABLES;'.`
                };
            }

            delete db.tables[tblName];
            this.save();
            return { success: true, message: `Table '${tblName}' deleted successfully.` };
        }

        // 5. CREATE DATABASE db_name;
        const createDbMatch = clean.match(/^CREATE\s+DATABASE\s+([a-zA-Z0-9_\-]+);?/i);
        if (createDbMatch) {
            const newDb = createDbMatch[1];
            if (!this.content.databases[newDb]) {
                this.content.databases[newDb] = { name: newDb, tables: {} };
                this.save();
            }
            return { success: true, message: `Database '${newDb}' created.` };
        }

        // 6. USE db_name;
        const useDbMatch = clean.match(/^USE\s+([a-zA-Z0-9_\-]+);?/i);
        if (useDbMatch) {
            const targetDb = useDbMatch[1];
            if (this.useDatabase(targetDb)) {
                return { success: true, message: `Active database: '${targetDb}'.` };
            }
            return { success: false, message: `Database '${targetDb}' does not exist.` };
        }

        // 7. CREATE TABLE table_name (...)
        const createTblMatch = clean.match(/^CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_\-]+)\s*\(([\s\S]*)\);?/i);
        if (createTblMatch) {
            const tblName = createTblMatch[1];
            const body = createTblMatch[2];
            const db = this.getCurrentDb();

            if (db.tables[tblName]) {
                return { success: false, message: `Table '${tblName}' already exists.` };
            }

            const colDefs = [];
            const fks = [];
            const parts = body.split(',').map(s => s.trim()).filter(Boolean);

            for (const part of parts) {
                const fkMatch = part.match(/FOREIGN\s+KEY\s*\(([a-zA-Z0-9_\-]+)\)\s*REFERENCES\s+([a-zA-Z0-9_\-]+)\s*\(([a-zA-Z0-9_\-]+)\)/i);
                if (fkMatch) {
                    fks.push({ column: fkMatch[1], foreignTable: fkMatch[2], foreignColumn: fkMatch[3] });
                    continue;
                }
                const tokens = part.split(/\s+/);
                if (tokens.length >= 2) {
                    const cName = tokens[0];
                    const cType = tokens[1];
                    const isPrimary = /PRIMARY\s+KEY/i.test(part);
                    colDefs.push({ name: cName, type: cType, isPrimary });
                }
            }

            db.tables[tblName] = { name: tblName, columns: colDefs, foreignKeys: fks, rows: [] };
            this.save();
            return { success: true, message: `Table '${tblName}' created successfully.` };
        }

        // 8. INSERT INTO table_name VALUES (...)
        const insertMatch = clean.match(/^INSERT\s+INTO\s+([a-zA-Z0-9_\-]+)(?:\s*\((.*?)\))?\s*VALUES\s*\(([\s\S]*)\);?/i);
        if (insertMatch) {
            const tblName = insertMatch[1];
            const db = this.getCurrentDb();
            if (!db.tables[tblName]) return { success: false, message: `Table '${tblName}' not found.` };

            const rawValues = insertMatch[3].split(',').map(s => {
                let v = s.trim();
                if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                    return v.slice(1, -1);
                }
                if (!isNaN(Number(v))) return Number(v);
                if (v.toLowerCase() === 'true') return true;
                if (v.toLowerCase() === 'false') return false;
                return v;
            });

            const row = {};
            db.tables[tblName].columns.forEach((col, idx) => {
                row[col.name] = rawValues[idx] !== undefined ? rawValues[idx] : null;
            });

            db.tables[tblName].rows.push(row);
            this.save();
            return { success: true, message: `1 row inserted into '${tblName}'.` };
        }

        // 9. SELECT * FROM table_name
        const selectMatch = clean.match(/^SELECT\s+([\s\S]*?)\s+FROM\s+([a-zA-Z0-9_\-]+)(?:\s+WHERE\s+(.*?))?(?:;|$)/i);
        if (selectMatch) {
            const tblName = selectMatch[2];
            const db = this.getCurrentDb();
            if (!db.tables[tblName]) return { success: false, message: `Table '${tblName}' not found.` };

            let rows = [...db.tables[tblName].rows];
            const whereClause = selectMatch[3];
            if (whereClause) {
                const condMatch = whereClause.match(/([a-zA-Z0-9_\-]+)\s*(=|>|<|>=|<=|!=)\s*(.*)/);
                if (condMatch) {
                    const col = condMatch[1].trim();
                    const op = condMatch[2].trim();
                    let targetVal = condMatch[3].trim().replace(/^['"]|['"]$/g, "");
                    if (!isNaN(Number(targetVal))) targetVal = Number(targetVal);

                    rows = rows.filter(r => {
                        const val = r[col];
                        if (op === "=") return val == targetVal;
                        if (op === "!=") return val != targetVal;
                        if (op === ">") return val > targetVal;
                        if (op === "<") return val < targetVal;
                        return true;
                    });
                }
            }

            return { success: true, data: rows, columns: db.tables[tblName].columns };
        }

        return { success: false, message: `Unrecognized SQL command: ${clean}` };
    }
}

function setupCllpdbWebview(panel, cllpdbPath) {
    const db = new CllpdbEngine(cllpdbPath);

    function refreshWebview(selectedTable) {
        panel.webview.html = getCllpdbManagerHtml(
            cllpdbPath,
            db,
            selectedTable
        );
    }

    refreshWebview();

    panel.webview.onDidReceiveMessage(message => {
        if (message.command === 'login') {
            const res = db.startSession(message.username, message.password);
            if (res.success) {
                vscode.window.showInformationMessage("CLLPDB session open for 2 minutes.");
                refreshWebview();
            } else {
                panel.webview.postMessage({ type: 'loginError', message: res.message });
            }
        } else if (message.command === 'logout') {
            db.endSession();
            refreshWebview();
        } else if (message.command === 'executeSql') {
            if (!db.isSessionActive()) {
                panel.webview.postMessage({ type: 'sessionExpired' });
                return;
            }
            const res = db.executeSql(message.sql);
            panel.webview.postMessage({ type: 'sqlResult', result: res });
            refreshWebview(message.currentTable);
        } else if (message.command === 'changeCredentials') {
            const res = db.changeCredentials(message.newUsername, message.newPassword);
            panel.webview.postMessage({ type: 'credResult', result: res });
            if (res.success) {
                vscode.window.showInformationMessage(res.message);
                refreshWebview();
            } else {
                vscode.window.showErrorMessage(res.message);
            }
        } else if (message.command === 'selectTable') {
            refreshWebview(message.tableName);
        } else if (message.command === 'switchDb') {
            db.useDatabase(message.dbName);
            refreshWebview();
        }
    });
}

function getCllpdbManagerHtml(cllpdbPath, db, activeTableName) {
    const isUnlocked = db.isSessionActive();
    const remainingSec = db.getRemainingSeconds();
    const isAdmin = CllpdbEngine.isSystemAdmin();
    const databases = db.getDatabases();
    const currentDb = db.currentDbName;
    const tables = db.getTables();
    const tableNames = Object.keys(tables);
    const selectedTable = activeTableName && tables[activeTableName] ? activeTableName : (tableNames[0] || null);
    const tableData = selectedTable ? tables[selectedTable] : null;

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>LLP Encrypted Database Manager</title>
    <style>
        :root {
            --bg-color: #1e1e2e;
            --panel-bg: #252538;
            --card-bg: #2a2a3e;
            --border-color: #3b3b54;
            --primary: #6366f1;
            --primary-hover: #4f46e5;
            --accent: #10b981;
            --danger: #ef4444;
            --danger-hover: #dc2626;
            --warning: #f59e0b;
            --text-main: #f3f4f6;
            --text-muted: #9ca3af;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        body { background: var(--bg-color); color: var(--text-main); display: flex; flex-direction: column; height: 100vh; overflow: hidden; }

        /* HEADER */
        .header { background: var(--panel-bg); border-bottom: 1px solid var(--border-color); padding: 12px 20px; display: flex; justify-content: space-between; align-items: center; }
        .header-title { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 600; }
        .badge { background: #3730a3; color: #c7d2fe; font-size: 11px; padding: 4px 8px; border-radius: 6px; font-weight: 500; }
        .badge-timer { background: #064e3b; color: #a7f3d0; border: 1px solid #059669; }
        .badge-locked { background: #7f1d1d; color: #fecaca; }
        .badge-admin { background: #451a03; color: #fed7aa; }

        /* LOGIN OVERLAY */
        .login-overlay { position: fixed; inset: 0; background: rgba(15, 15, 25, 0.92); z-index: 100; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(4px); }
        .login-card { background: var(--panel-bg); border: 1px solid var(--border-color); padding: 32px; border-radius: 12px; width: 380px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }
        .login-card h2 { margin-bottom: 8px; font-size: 18px; color: var(--text-main); }
        .login-card p { font-size: 12px; color: var(--text-muted); margin-bottom: 20px; line-height: 1.4; }
        .input-group { margin-bottom: 14px; }
        .input-group label { display: block; font-size: 12px; margin-bottom: 6px; color: var(--text-muted); }
        .input-group input { width: 100%; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-main); outline: none; }
        .btn { padding: 9px 16px; border-radius: 6px; font-weight: 500; cursor: pointer; border: none; font-size: 13px; transition: all 0.2s; }
        .btn-primary { background: var(--primary); color: white; width: 100%; margin-top: 10px; }
        .btn-primary:hover { background: var(--primary-hover); }
        .btn-danger { background: var(--danger); color: white; }
        .btn-danger:hover { background: var(--danger-hover); }
        .btn-sm { padding: 5px 10px; font-size: 12px; }

        /* MAIN LAYOUT */
        .main-container { display: flex; flex: 1; overflow: hidden; }
        
        /* SIDEBAR */
        .sidebar { width: 280px; background: var(--panel-bg); border-right: 1px solid var(--border-color); display: flex; flex-direction: column; overflow-y: auto; }
        .sidebar-section { padding: 14px; border-bottom: 1px solid var(--border-color); }
        .sidebar-title { font-size: 12px; text-transform: uppercase; color: var(--text-muted); font-weight: 700; margin-bottom: 10px; }
        .table-item { padding: 10px 12px; border-radius: 6px; margin-bottom: 4px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-size: 13px; transition: 0.15s; }
        .table-item:hover { background: var(--card-bg); }
        .table-item.active { background: var(--primary); color: white; font-weight: 600; }
        
        /* CONTENT PANE */
        .content { flex: 1; display: flex; flex-direction: column; overflow-y: auto; padding: 20px; gap: 20px; }

        /* DATA GRID TABLE */
        .card { background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; }
        .card-header { padding: 12px 16px; background: var(--card-bg); border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; }
        .card-title { font-size: 14px; font-weight: 600; }
        
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid var(--border-color); }
        th { background: #1f1f30; color: var(--text-muted); font-weight: 600; font-size: 12px; }
        tr:hover td { background: rgba(255,255,255,0.02); }

        /* SQL CONSOLE */
        .sql-box { display: flex; flex-direction: column; gap: 10px; }
        .sql-textarea { width: 100%; height: 80px; padding: 10px; border-radius: 6px; border: 1px solid var(--border-color); background: #1a1a28; color: #a5b4fc; font-family: 'Consolas', monospace; font-size: 13px; outline: none; }
        .sql-actions { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; }
        .quick-btn { background: var(--card-bg); border: 1px solid var(--border-color); color: var(--text-muted); padding: 5px 10px; border-radius: 4px; font-size: 11px; cursor: pointer; }
        .quick-btn:hover { color: var(--text-main); border-color: var(--primary); }

        /* CREDENTIALS SECTION */
        .cred-box { display: flex; gap: 10px; align-items: center; }
    </style>
</head>
<body>

    <!-- TOP HEADER -->
    <div class="header">
        <div class="header-title">
            <span>🗄️ ${path.basename(cllpdbPath)}</span>
            <span class="badge">AES-256 Encrypted (UTF-8)</span>
            ${isUnlocked 
                ? `<span class="badge badge-timer" id="timerBadge">⏱️ Active Session : <span id="countdown">${remainingSec}</span>s</span>`
                : `<span class="badge badge-locked">🔒 Session Locked (2 min)</span>`
            }
            <span class="badge badge-admin">PC Admin Rights : ${isAdmin ? 'YES ✓' : 'NO ✗'}</span>
        </div>
        <div>
            ${isUnlocked 
                ? `<button class="btn btn-danger btn-sm" id="btnLock">🔒 Lock Session</button>`
                : ``
            }
        </div>
    </div>

    <!-- LOCK / LOGIN SCREEN (IF SESSION EXPIRED OR CLOSED) -->
    ${!isUnlocked ? `
    <div class="login-overlay">
        <div class="login-card">
            <h2>🔑 Decrypt Database (.cllpdb)</h2>
            <p>This database file is secured by AES-256 encryption with a unique project key. The session lasts 2 minutes.</p>
            <div id="loginErrorMsg" style="color: var(--danger); font-size: 12px; margin-bottom: 12px; display: none;"></div>
            <div class="input-group">
                <label>Administrator Username :</label>
                <input type="text" id="loginUser" value="admin" />
            </div>
            <div class="input-group">
                <label>Password :</label>
                <input type="password" id="loginPass" placeholder="Password" />
            </div>
            <button class="btn btn-primary" id="btnLoginSubmit">Unlock Session (2 min)</button>
        </div>
    </div>
    ` : ''}

    <div class="main-container">
        <!-- SIDEBAR : DATABASES & TABLES -->
        <div class="sidebar">
            <div class="sidebar-section">
                <div class="sidebar-title">Active Database</div>
                <select id="dbSelect" style="width: 100%; padding: 8px; background: var(--card-bg); color: var(--text-main); border: 1px solid var(--border-color); border-radius: 6px;">
                    ${databases.map(d => `<option value="${d}" ${d === currentDb ? 'selected' : ''}>${d}</option>`).join('')}
                </select>
            </div>

            <div class="sidebar-section" style="flex: 1;">
                <div class="sidebar-title">Tables (${tableNames.length})</div>
                ${tableNames.length === 0 ? `<div style="font-size: 12px; color: var(--text-muted);">No tables created.</div>` : ''}
                ${tableNames.map(name => `
                    <div class="table-item ${name === selectedTable ? 'active' : ''}" onclick="selectTable('${name}')">
                        <span>📊 ${name}</span>
                        <span style="font-size: 11px; opacity: 0.8;">${tables[name].rows ? tables[name].rows.length : 0} rows</span>
                    </div>
                `).join('')}
            </div>

            <div class="sidebar-section">
                <div class="sidebar-title">Quick Drop Actions</div>
                <button class="btn btn-danger btn-sm" style="width: 100%; margin-bottom: 6px;" onclick="runDropAllTables()">💥 DROP ALL TABLES;</button>
                <button class="btn btn-danger btn-sm" style="width: 100%;" onclick="runDropAllDatabase()">💥 DROP ALL DATABASE;</button>
            </div>
        </div>

        <!-- MAIN CONTENT AREA -->
        <div class="content">

            <!-- SQL CONSOLE -->
            <div class="card">
                <div class="card-header">
                    <span class="card-title">💻 SQL Console (Simplified MySQL UTF-8)</span>
                    <button class="btn btn-primary btn-sm" id="btnRunSql" style="width: auto;">▶ Run Query</button>
                </div>
                <div style="padding: 16px;">
                    <div class="sql-box">
                        <textarea class="sql-textarea" id="sqlQuery">${selectedTable ? `SELECT * FROM ${selectedTable};` : `SELECT * FROM users;`}</textarea>
                        <div class="sql-actions">
                            <span style="font-size: 11px; color: var(--text-muted);">Quick templates :</span>
                            <button class="quick-btn" onclick="setSql('SELECT * FROM ${selectedTable || 'products'};')">SELECT *</button>
                            <button class="quick-btn" onclick="setSql('DROP ALL DATA FROM ${selectedTable || 'products'};')">DROP ALL DATA FROM ${selectedTable || 'products'};</button>
                            <button class="quick-btn" onclick="setSql('DROP TABLE ${selectedTable || 'products'};')">DROP TABLE</button>
                            <button class="quick-btn" onclick="setSql('DROP ALL TABLES;')">DROP ALL TABLES;</button>
                        </div>
                    </div>
                    <div id="sqlOutput" style="margin-top: 10px; font-size: 12px; color: var(--accent);"></div>
                </div>
            </div>

            <!-- TABLE DATA GRID -->
            ${tableData ? `
            <div class="card">
                <div class="card-header">
                    <span class="card-title">📋 Table Data : <strong>${selectedTable}</strong> (${tableData.rows ? tableData.rows.length : 0} rows)</span>
                    <button class="btn btn-danger btn-sm" onclick="runDropData('${selectedTable}')">🧹 Empty Table (DROP ALL DATA)</button>
                </div>
                <div style="overflow-x: auto;">
                    <table>
                        <thead>
                            <tr>
                                ${(tableData.columns || []).map(col => `
                                    <th>
                                        ${col.name} ${col.isPrimary ? '🔑 (PK)' : ''}
                                        ${(tableData.foreignKeys || []).some(f => f.column === col.name) ? '🔗 (FK)' : ''}
                                        <span style="font-size: 10px; opacity: 0.6; display: block;">${col.type}</span>
                                    </th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${(tableData.rows || []).length === 0 ? `<tr><td colspan="${(tableData.columns || []).length}" style="text-align: center; color: var(--text-muted); padding: 24px;">No data in this table.</td></tr>` : ''}
                            ${(tableData.rows || []).map(row => `
                                <tr>
                                    ${(tableData.columns || []).map(col => `<td>${row[col.name] !== undefined ? row[col.name] : ''}</td>`).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            ` : `
            <div class="card" style="padding: 30px; text-align: center; color: var(--text-muted);">
                Select a table on the left to view columns and UTF-8 data.
            </div>
            `}

            <!-- CREDENTIALS MODIFICATION (ADMIN RIGHTS REQUIRED) -->
            <div class="card">
                <div class="card-header">
                    <span class="card-title">🛡️ File Security & Credentials (.cllpdb)</span>
                    <span class="badge ${isAdmin ? 'badge-timer' : 'badge-locked'}">
                        ${isAdmin ? 'Admin Privileges Detected ✓' : 'Admin Privileges Required 🔒'}
                    </span>
                </div>
                <div style="padding: 16px;">
                    <p style="font-size: 12px; color: var(--text-muted); margin-bottom: 12px;">
                        To prevent unauthorized tampering, modifying access credentials (.cllpdb) strictly requires running VS Code with Administrator privileges on your computer.
                    </p>
                    <div class="cred-box">
                        <input type="text" id="newAdminUser" placeholder="New username" style="padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-main); font-size: 12px;" />
                        <input type="password" id="newAdminPass" placeholder="New password" style="padding: 8px; border-radius: 6px; border: 1px solid var(--border-color); background: var(--card-bg); color: var(--text-main); font-size: 12px;" />
                        <button class="btn btn-primary btn-sm" id="btnUpdateCreds">Change Credentials</button>
                    </div>
                </div>
            </div>

        </div>
    </div>

    <script>
        const vscode = acquireVsCodeApi();

        // 2-MINUTE SESSION COUNTDOWN
        let remaining = ${remainingSec};
        const countdownEl = document.getElementById('countdown');
        if (countdownEl && remaining > 0) {
            const timer = setInterval(() => {
                remaining--;
                if (remaining <= 0) {
                    clearInterval(timer);
                    location.reload();
                } else {
                    countdownEl.textContent = remaining;
                }
            }, 1000);
        }

        // LOGIN
        const btnLoginSubmit = document.getElementById('btnLoginSubmit');
        if (btnLoginSubmit) {
            btnLoginSubmit.addEventListener('click', () => {
                const u = document.getElementById('loginUser').value;
                const p = document.getElementById('loginPass').value;
                vscode.postMessage({ command: 'login', username: u, password: p });
            });
        }

        // LOCK
        const btnLock = document.getElementById('btnLock');
        if (btnLock) {
            btnLock.addEventListener('click', () => {
                vscode.postMessage({ command: 'logout' });
            });
        }

        // EXECUTE SQL
        const btnRunSql = document.getElementById('btnRunSql');
        if (btnRunSql) {
            btnRunSql.addEventListener('click', () => {
                const sql = document.getElementById('sqlQuery').value;
                vscode.postMessage({ command: 'executeSql', sql: sql, currentTable: '${selectedTable || ''}' });
            });
        }

        function setSql(q) {
            document.getElementById('sqlQuery').value = q;
        }

        function selectTable(name) {
            vscode.postMessage({ command: 'selectTable', tableName: name });
        }

        const dbSelect = document.getElementById('dbSelect');
        if (dbSelect) {
            dbSelect.addEventListener('change', (e) => {
                vscode.postMessage({ command: 'switchDb', dbName: e.target.value });
            });
        }

        function runDropAllTables() {
            if (confirm("Are you sure you want to drop ALL tables in this database (DROP ALL TABLES;)?")) {
                vscode.postMessage({ command: 'executeSql', sql: "DROP ALL TABLES;", currentTable: "" });
            }
        }

        function runDropAllDatabase() {
            if (confirm("WARNING: Are you sure you want to drop ALL databases from the .cllpdb file (DROP ALL DATABASE;)?")) {
                vscode.postMessage({ command: 'executeSql', sql: "DROP ALL DATABASE;", currentTable: "" });
            }
        }

        function runDropData(tbl) {
            if (confirm("Do you want to delete all data from table " + tbl + " (DROP ALL DATA FROM " + tbl + ";)?")) {
                vscode.postMessage({ command: 'executeSql', sql: "DROP ALL DATA FROM " + tbl + ";", currentTable: tbl });
            }
        }

        // MODIFY CREDENTIALS
        const btnUpdateCreds = document.getElementById('btnUpdateCreds');
        if (btnUpdateCreds) {
            btnUpdateCreds.addEventListener('click', () => {
                const u = document.getElementById('newAdminUser').value;
                const p = document.getElementById('newAdminPass').value;
                if (!u || !p) {
                    alert("Please enter a username and password.");
                    return;
                }
                vscode.postMessage({ command: 'changeCredentials', newUsername: u, newPassword: p });
            });
        }

        window.addEventListener('message', event => {
            const msg = event.data;
            if (msg.type === 'loginError') {
                const errBox = document.getElementById('loginErrorMsg');
                if (errBox) {
                    errBox.textContent = msg.message;
                    errBox.style.display = 'block';
                }
            } else if (msg.type === 'sqlResult') {
                const outBox = document.getElementById('sqlOutput');
                if (outBox) {
                    if (msg.result.success) {
                        outBox.style.color = 'var(--accent)';
                        outBox.textContent = "✓ " + (msg.result.message || (msg.result.data ? msg.result.data.length + " row(s) returned" : "Query executed successfully."));
                    } else {
                        outBox.style.color = 'var(--danger)';
                        outBox.textContent = "✗ " + msg.result.message;
                    }
                }
            }
        });
    </script>
</body>
</html>`;
}

// ===================================================
// GENERATEUR DE SQUELETTE DE PROJET LLP
// ===================================================

function createProjectSkeleton(targetDir, projName, archOrExample) {
    if (typeof createProjectStructure === 'function') {
        const architecture = (archOrExample === 'monolithic' || archOrExample === 'client-server')
            ? archOrExample
            : 'client-server';
        return createProjectStructure({
            targetDir,
            projectName: projName,
            architecture,
            author: process.env.USERNAME || 'Developer'
        });
    }

    const isExample = archOrExample === true;
    fs.mkdirSync(path.join(targetDir, "src"), { recursive: true });
    fs.mkdirSync(path.join(targetDir, "interfaces"), { recursive: true });
    fs.mkdirSync(path.join(targetDir, "data"), { recursive: true });
    fs.mkdirSync(path.join(targetDir, "lib"), { recursive: true });
    fs.mkdirSync(path.join(targetDir, "assets"), { recursive: true });

    try {
        const logoSrc = path.join(__dirname, "assets", "logo.png");
        if (fs.existsSync(logoSrc)) {
            fs.copyFileSync(logoSrc, path.join(targetDir, "assets", "logo.png"));
        }
    } catch (_) {}

    const uniqueKey = crypto.randomBytes(32).toString("hex");

    const configContent = `[project]
name = "${projName}"
version = "1.0.0"
architecture = "${archOrExample === 'monolithic' ? 'monolithic' : 'client-server'}"
project_key = "${uniqueKey}"
author = "${process.env.USERNAME || 'Developer'}"
`;
    fs.writeFileSync(path.join(targetDir, "project.config"), configContent, "utf-8");

    // 9 Standard Read-Only Libraries
    const baseLibs = {
        "math.llp": `// ===================================================
// LLP Standard Library : Mathematics & Constants (Read-Only)
// ===================================================
// Universal PY constant accessible in all scripts:
// print("Value of PY :", PY)
// Math service functions:
// Math.Abs, Math.Floor, Math.Ceil, Math.Round, Math.Sqrt, Math.Pow, Math.Sin, Math.Cos...
`,
        "scillp.llp": `// ===================================================
// LLP Standard Library : SciLlp (SciPy Equivalent) (Read-Only)
// ===================================================
// Advanced scientific computing modules:
// - Integration: SciLlp.Integrate(func, a, b) or SciLlp.Integrate(yList, dx)
// - Optimization: SciLlp.Optimize(func, guessX, lr)
// - Roots: SciLlp.FindRoot(func, a, b)
// - Interpolation: SciLlp.Interpolate(xList, yList, targetX)
// - Signal Processing: SciLlp.MovingAverage(signal, windowSize), SciLlp.SignalFilter(signal, threshold), SciLlp.PeakDetect(signal)
// - Statistics: SciLlp.Mean(list), SciLlp.Variance(list), SciLlp.StdDev(list), SciLlp.Skewness(list), SciLlp.Kurtosis(list), SciLlp.LinearRegression(xList, yList)
`,
        "symllp.llp": `// ===================================================
// LLP Standard Library : SymLlp (SymPy Equivalent) (Read-Only)
// ===================================================
// Exact formal and symbolic calculus:
// - Equation Solving: SymLlp.Solve("2*x + 4 = 10", "x") / SymLlp.Solve("x^2 - 16 = 0", "x")
// - Symbolic Derivatives: SymLlp.Derivative("3*x^2 + 5*x - 2", "x")
// - Symbolic Integrals: SymLlp.Integral("3*x^2 + 2*x", "x")
// - Simplification: SymLlp.Simplify("2*x + 3*x - 4 + 10")
// - Taylor Series: SymLlp.Series("exp(x)", "x", 4)
// - Symbolic Matrices (x, y): SymLlp.MatrixDet([["x", "y"], ["2", "x"]]), SymLlp.MatrixTranspose(matrix)
`,
        "probllp.llp": `// ===================================================
// LLP Standard Library : ProbLlp (Probability & Combinatorics) (Read-Only)
// ===================================================
// - Counting: ProbLlp.Factorial(n), ProbLlp.Permutations(n, k), ProbLlp.Combinations(n, k)
// - Distributions: ProbLlp.NormalPDF(x, mu, sigma), ProbLlp.NormalCDF(x, mu, sigma), ProbLlp.Binomial(k, n, p), ProbLlp.Poisson(k, lambda)
// - Random Sampling: ProbLlp.Uniform(min, max), ProbLlp.Choice(list), ProbLlp.Sample(list, k)
`,
        "cllpdb.llp": `// ===================================================
// LLP Standard Library : CLLPDB (AES-256 Encrypted Database) (Read-Only)
// ===================================================
// - Open: General db = CLLPDB.Open("data/products.cllpdb")
// - 2-Minute Session: db.StartSession("user", "pass")
// - Queries: db.Query("SELECT * FROM table"), db.Execute("INSERT INTO...")
// - Special Commands: DROP ALL TABLES;, DROP ALL DATA FROM tablename;, DROP ALL DATABASE;
`,
        "sync.llp": `// ===================================================
// LLP Standard Library : DatabaseSync (Synchronization) (Read-Only)
// ===================================================
// - DatabaseSync.ExportJson(db, "export.json")
// - DatabaseSync.ImportJson(db, "import.json")
// - DatabaseSync.SyncTables(srcDb, targetDb)
`,
        "crypto.llp": `// ===================================================
// LLP Standard Library : Crypto (Unique Cryptography) (Read-Only)
// ===================================================
// - Crypto.GetProjectKey() : Retrieves unique 256-bit project key
// - Crypto.Encrypt(text, key) : AES-256 encryption
// - Crypto.Decrypt(cipher, key) : AES-256 decryption
// - Crypto.Sha256(text) : Secure hashing
`,
        "network.llp": `// ===================================================
// LLP Standard Library : Network (Client & Server) (Read-Only)
// ===================================================
// - Network.Get("https://api.example.com/data")
// - Network.Post("https://api.example.com/auth", payload)
// - Network.CreateServer(port, callback)
// - Network.ConnectSocket(host, port)
`,
        "validator.llp": `// ===================================================
// LLP Standard Library : UIValidator (Client Validation) (Read-Only)
// ===================================================
// - UIValidator.ValidateRequired(field)
// - UIValidator.ValidateEmail(email)
// - UIValidator.ValidateNumber(val)
// - UIValidator.ShowError(title, message)
// - UIValidator.ShowSuccess(message)
`
    };

    for (const [fn, content] of Object.entries(baseLibs)) {
        fs.writeFileSync(path.join(targetDir, "lib", fn), content, "utf-8");
    }

    if (isExample) {
        // FULL EXAMPLE PROJECT : AUTHENTICATION & PRODUCT MANAGEMENT
        const dbPath = path.join(targetDir, "data", "products.cllpdb");
        const db = new CllpdbEngine(dbPath, uniqueKey);
        db.initializeNew("admin", "admin123");
        db.startSession("admin", "admin123");

        // Schema & Seed Data
        db.executeSql("CREATE TABLE users (id INT PRIMARY KEY, username VARCHAR, password VARCHAR, role VARCHAR);");
        db.executeSql('INSERT INTO users VALUES (1, "admin", "admin123", "Administrator");');
        db.executeSql('INSERT INTO users VALUES (2, "manager", "secret456", "Manager");');

        db.executeSql("CREATE TABLE categories (id INT PRIMARY KEY, name VARCHAR, description VARCHAR);");
        db.executeSql('INSERT INTO categories VALUES (1, "Computers & PCs", "Hardware and components");');
        db.executeSql('INSERT INTO categories VALUES (2, "Peripherals", "Keyboards, mice and monitors");');
        db.executeSql('INSERT INTO categories VALUES (3, "Audio & Sound", "Headphones and hi-fi speakers");');

        db.executeSql("CREATE TABLE products (id INT PRIMARY KEY, name VARCHAR, price FLOAT, stock INT, category_id INT, FOREIGN KEY (category_id) REFERENCES categories(id));");
        db.executeSql('INSERT INTO products VALUES (101, "Pro Laptop 16", 1299.99, 15, 1);');
        db.executeSql('INSERT INTO products VALUES (102, "Mechanical RGB Keyboard", 129.50, 42, 2);');
        db.executeSql('INSERT INTO products VALUES (103, "Ergonomic Wireless Mouse", 59.90, 80, 2);');
        db.executeSql('INSERT INTO products VALUES (104, "Noise Cancelling Headphones", 249.00, 28, 3);');
        db.executeSql('INSERT INTO products VALUES (105, "Ultra-Sharp 4K Monitor 27", 449.00, 19, 2);');

        // Interfaces : Login (Page 1) and Dashboard with Page-on-Page Modal (Page 2)
        const loginIllp = `visibility: All

/* Login Interface (.illp) - Page 1 */
Background "LoginWindow" responsive: true minWidth: "350px" maxWidth: "480px" minHeight: "420px" {
    Card "LoginCard" title: "Login - Product Management" {
        Row "TitleRow" {
            Text "AppTitle" content: "🔐 Authentication Required"
        }
        Row "UserRow" {
            TextInput "InputUser" placeholder: "Username (admin)"
        }
        Row "PassRow" {
            TextInput "InputPass" placeholder: "Password (admin123)"
        }
        Row "ActionRow" {
            Button "BtnLogin" text: "Sign In" targetPage: "dashboard.illp"
        }
    }
}
`;
        fs.writeFileSync(path.join(targetDir, "interfaces", "login.illp"), loginIllp, "utf-8");

        const dashboardIllp = `visibility: All

/* Dashboard Interface (.illp) - Page 2 with Page-on-Page Modal */
Background "DashboardWindow" responsive: true minWidth: "500px" maxWidth: "1050px" minHeight: "680px" {
    Card "TopBarCard" title: "Lolpaon Store Pro - Dashboard" {
        Row "TopBarRow" {
            Text "DashboardTitle" content: "📦 Product & Inventory Manager"
            Button "BtnLogout" text: "⮌ Sign Out" targetPage: "login.illp"
        }
        Row "SessionRow" {
            Text "SessionInfo" content: "Active session (.cllpdb connected in UTF-8)"
            ProgressBar "SessionBar" value: 95 max: 100
        }
    }

    Card "CatalogCard" title: "Available Products Catalog" {
        Row "ActionsRow" {
            Text "CatalogSubtitle" content: "Data synchronized with products.cllpdb"
            Button "BtnNewProduct" text: "➕ Add Product (Open Page on Page)" action: "openModal:ModalAddProduct"
        }

        Grid "ProductsGrid" columns: 2 {
            TextInput "P1" placeholder: "💻 Pro Laptop 16 - $1299.99 (Stock: 15)"
            TextInput "P2" placeholder: "⌨️ Mechanical RGB Keyboard - $129.50 (Stock: 42)"
            TextInput "P3" placeholder: "🖱️ Ergonomic Wireless Mouse - $59.90 (Stock: 80)"
            TextInput "P4" placeholder: "🎧 Noise Cancelling Headphones - $249.00 (Stock: 28)"
            TextInput "P5" placeholder: "🖥️ Ultra-Sharp 4K Monitor 27'' - $449.00 (Stock: 19)"
        }
    }

    Modal "ModalAddProduct" title: "New Product (Page on Page)" {
        Row "ModalInfoRow" {
            Text "ModalDesc" content: "Fill in the details below to insert into .cllpdb database:"
        }
        Grid "ModalFormGrid" columns: 2 {
            TextInput "ModalName" placeholder: "Product name (e.g. 4K Webcam)..."
            TextInput "ModalPrice" placeholder: "Unit price ($)..."
            TextInput "ModalStock" placeholder: "Stock quantity..."
            ItemBox "ModalCat" default: "Computers & PCs" items: ["Computers & PCs", "Peripherals", "Audio & Sound"]
        }
        Row "ModalActionsRow" {
            Button "BtnSubmitAdd" text: "✓ Save to .cllpdb"
            Button "BtnCloseModal" text: "✕ Close Page" action: "closeModal"
        }
    }
}
`;
        fs.writeFileSync(path.join(targetDir, "interfaces", "dashboard.illp"), dashboardIllp, "utf-8");

        // Main LLP Source Code
        const mainLlp = `// ===================================================
// Complete Application: Product Management (LLP)
// Demonstration: .cllpdb Authentication, Navigation, Math/PY, Validation,
// and advanced scientific computing (SciLlp, SymLlp, ProbLlp)
// ===================================================

print("===================================================")
print("   Product Management Application - Lolpaon Pro")
print("===================================================")

// 1. Universal PY constant and Unique Encryption Key
print("\\n[1. Global Configuration & Libraries]")
print("Universal constant PY :", PY)
print("Unique project encryption key :", Crypto.GetProjectKey())

// 2. Encrypted Database Connection (.cllpdb)
print("\\n[2. Encrypted Database Connection (.cllpdb)]")
General db = CLLPDB.Open("data/products.cllpdb")

// 2-Minute Active Session Authentication
bool isConnected = db.StartSession("admin", "admin123")
print("Authentication successful?", isConnected)
print("Session remaining time (seconds):", db.GetRemainingSession())

if (isConnected) {
    // 3. Querying Product Catalog
    print("\\n[3. Table & Product Queries (Simplified UTF-8 MySQL)]")
    General usersList = db.Query("SELECT * FROM users")
    print("Registered users :", usersList)

    General categoriesList = db.Query("SELECT * FROM categories")
    print("Available categories :", categoriesList)

    General productsList = db.Query("SELECT * FROM products")
    print("Product catalog :", productsList)

    // 4. Mathematical Calculations with PY (Circular Price Badge Design)
    print("\\n[4. Display Calculations with Math & PY]")
    float badgeRadius = 25.0
    float badgeArea = PY * Math.Pow(badgeRadius, 2)
    print("Promo badge radius (px):", badgeRadius)
    print("Calculated badge area (Math.Pow + PY):", Math.Round(badgeArea), "px²")

    // 5. Validation and Adding a New Product
    print("\\n[5. Form Validation & Product Insertion]")
    string newProductName = "Studio USB Podcast Microphone"
    float newProductPrice = 89.90
    int newProductStock = 35

    bool isNameValid = UIValidator.ValidateRequired(newProductName)
    bool isPriceValid = UIValidator.ValidateNumber(newProductPrice)

    if (isNameValid && isPriceValid) {
        db.Execute("INSERT INTO products VALUES (106, \\"Studio USB Podcast Microphone\\", 89.90, 35, 3);")
        UIValidator.ShowSuccess("New product added to catalog successfully!")
    } else {
        UIValidator.ShowError("Form", "The provided inputs are invalid.")
    }

    // 6. Scientific & Statistical Computations (SciLlp - SciPy Equivalent)
    print("\\n[6. Sales Statistics & Analysis (SciLlp)]")
    General salesPrices = General{1299.99, 129.50, 59.90, 249.00, 449.00, 89.90}
    print("Average cart price (SciLlp.Mean):", Math.Round(SciLlp.Mean(salesPrices)), "$")
    print("Standard deviation of prices (SciLlp.StdDev):", Math.Round(SciLlp.StdDev(salesPrices)), "$")
    
    General salesSignal = General{10.0, 15.0, 14.0, 25.0, 30.0, 28.0, 40.0}
    print("Sales trend smoothing (SciLlp.MovingAverage):", SciLlp.MovingAverage(salesSignal, 3))

    // 7. Formal & Symbolic Calculus (SymLlp - SymPy Equivalent)
    print("\\n[7. Economic Modeling & Symbolic Calculus (SymLlp)]")
    print("Formal derivative of cost C(x) = 3*x^2 + 5*x - 2:", SymLlp.Derivative("3*x^2 + 5*x - 2", "x"))
    print("Formal antiderivative of revenue R(x) = 3*x^2 + 2*x:", SymLlp.Integral("3*x^2 + 2*x", "x"))
    print("Break-even equation solution for 2*x + 4 = 100:", SymLlp.Solve("2*x + 4 = 100", "x"))
    
    General row1 = General{"x", "y"}
    General row2 = General{"2", "x"}
    General matrix = General{row1, row2}
    print("Symbolic matrix determinant (x, y):", SymLlp.MatrixDet(matrix))

    // 8. Demand Forecasting & Stockout Probabilities (ProbLlp)
    print("\\n[8. Demand & Inventory Probabilities (ProbLlp)]")
    print("Possible combinations of 3-product packs out of 6:", ProbLlp.Combinations(6, 3))
    print("Probability of selling exactly 4 items (Poisson lambda=3.5):", Math.Round(ProbLlp.Poisson(4, 3.5) * 100), "%")
}

print("\\n===================================================")
print("Product Management Application - Launching GUI!")
print("===================================================")
print("Ouverture automatique de la fenêtre d'interface interactive...")
App.Launch()
`;
        fs.writeFileSync(path.join(targetDir, "src", "main.llp"), mainLlp, "utf-8");
    } else {
        // EMPTY PROJECT
        const starterMain = `// Entry point for ${projName}
print("Welcome to your project ${projName}!")
print("Universal PY constant:", PY)
print("Unique project key:", Crypto.GetProjectKey())

// Lancement automatique de l'interface graphique de l'application
print("Lancement de l'interface graphique...")
App.Launch()
`;
        fs.writeFileSync(path.join(targetDir, "src", "main.llp"), starterMain, "utf-8");

        const starterIllp = `visibility: All

/* Main Interface (.illp) */
Background "MainWindow" responsive: true minWidth: "400px" minHeight: "300px" {
    Card "WelcomeCard" title: "Welcome to ${projName}" {
        Text "WelcomeTitle" content: "Your LLP application is ready."
        Button "BtnAction" text: "Click Here"
    }
}
`;
        fs.writeFileSync(path.join(targetDir, "interfaces", "main.illp"), starterIllp, "utf-8");
    }
}

function deactivate() {}

module.exports = {
    activate,
    deactivate
};
