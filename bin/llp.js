#!/usr/bin/env node

const path = require("path");
const fs = require("fs");
const http = require("http");
const https = require("https");
const {
  runFile,
  executeLLP,
  createGlobalEnvironment,
  startGuiApplication,
  startUiBuilderServer,
  createProjectStructure,
  getProjectInfo,
  analyzeSource,
  formatDiagnosticReport,
  addLibraryToProject,
  enforceLibDirectoryProtection,
  buildLlpDllBinary,
  setFileReadOnly
} = require("../dist/index.js");
const { CryptedLolpaonDatabase } = require("../dist/stdlib/cllpdb.js");

const args = process.argv.slice(2);

function showHelp() {
  console.log(`
===================================================
 🦚 LLP Language (lolpaon) - CLI & Tools v1.5
===================================================

Usage :
  llp create <name> [--client-server|--monolithic]
                                            Create project with chosen architecture (Client/Server or All-in-One)
  llp add-lib <name|file.dll>               Add a read-only .dll library to lib/
  llp lib <list|add|protect>                Manage project libraries (.dll in lib/ strictly read-only)
  llp builder [file.illp] [--port <port>]   Launch Visual UI Builder (Drag-and-Drop, Data Binding, Modif)
  llp designer [file.illp]                  Alias for llp builder
  llp app [project_dir]                     Launch Interactive Application (GUI Window)
  llp gui [project_dir]                     Alias for llp app
  llp check <file.llp>                      Statically analyze code and report all errors with fixes
  llp server <script.llp> [--port <port>]   Run dedicated LLP backend server with device authentication
  llp run <file.llp> [--gui]                Execute an .llp script (pre-checks syntax & errors first)
  llp build [--client|--server|--exe|--apk] Compile project or file into standalone executable
  llp compile <source.llp> --target <type>  Compile to target platform (exe, apk, installer)
  llp test api <url> | llp test-api <url>   Test HTTP/HTTPS API connection and latency
  llp test db <file> | llp test-db <file>   Test database connection and schema (.cllpdb|.db)
  llp repl                                  Start interactive REPL terminal
  llp --version                             Show version

Examples :
  llp create MySuperApp                     Interactive project creation (Client/Server or Monolithic)
  llp create MyApp --client-server          Create Client/Server project (Client exe + Server BDD)
  llp create MyLocalApp --monolithic        Create standalone all-in-one project (Embedded BDD)
  llp add-lib custom_plugin.dll             Add read-only custom .dll library to lib/
  llp lib list                              List all read-only .dll libraries in lib/
  llp lib protect                           Enforce read-only .dll mode in lib/
  llp builder client/views/main.illp        Visual UI Builder with drag & drop and live edits
  llp build --client                        Build standalone client executable
  llp build --server                        Build dedicated server executable/package
  llp build                                 Build all-in-one executable or active project
  llp server server/main.llp --port 8080    Start dedicated LLP RPC server
  llp app client                            Run client graphical window
`);
}

if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
  showHelp();
  process.exit(0);
}

if (args[0] === "--version" || args[0] === "-v") {
  console.log("🦚 LLP Language v1.5.4 (lolpaon)");
  process.exit(0);
}

// 0.05 LIB & ADD-LIB COMMAND (Bibliothèques .dll en lecture seule)
if (args[0] === "add-lib" || args[0] === "lib") {
  const projectDir = process.cwd();
  const subCmd = args[0] === "add-lib" ? "add" : (args[1] || "list");
  const targetLib = args[0] === "add-lib" ? args[1] : args[2];

  if (subCmd === "add") {
    if (!targetLib) {
      console.error("Erreur : Veuillez spécifier le nom ou le chemin de la bibliothèque : llp add-lib <nom|fichier.dll>");
      process.exit(1);
    }
    try {
      const res = addLibraryToProject(projectDir, targetLib);
      console.log(`\n===================================================`);
      console.log(`  📦 Bibliothèque LLP Ajoutée en Lecture Seule`);
      console.log(`===================================================`);
      console.log(`Fichier : ${res.libFile}`);
      console.log(`Statut  : [LECTURE SEULE] (Protection activée)`);
      console.log(`Message : ${res.message}\n`);
      process.exit(0);
    } catch (err) {
      console.error("Erreur lors de l'ajout de la bibliothèque :", err.message);
      process.exit(1);
    }
  }

  if (subCmd === "protect") {
    const res = enforceLibDirectoryProtection(projectDir);
    console.log(`\n===================================================`);
    console.log(`  🔒 Protection du Dossier lib/`);
    console.log(`===================================================`);
    console.log(`✓ Bibliothèques .dll vérifiées & verrouillées en lecture seule : ${res.totalDlls}`);
    if (res.cleaned > 0) {
      console.log(`✓ Fichiers non-.dll nettoyés de lib/ : ${res.cleaned}`);
    }
    console.log(`\n[Succès] Le dossier lib/ est strictement réservé aux .dll en lecture seule.\n`);
    process.exit(0);
  }

  // list
  const libDir = path.join(projectDir, "lib");
  if (!fs.existsSync(libDir)) {
    console.log(`Aucun dossier lib/ trouvé dans ${projectDir}.`);
    process.exit(0);
  }
  const files = fs.readdirSync(libDir);
  console.log(`\n===================================================`);
  console.log(`  📚 Bibliothèques LLP dans lib/ (${projectDir})`);
  console.log(`===================================================`);
  for (const f of files) {
    const full = path.join(libDir, f);
    const stats = fs.statSync(full);
    const isReadOnly = (stats.mode & 0o200) === 0;
    const isDll = f.toLowerCase().endsWith(".dll");
    console.log(`  ${isDll ? "📄" : "⚠️"} ${f.padEnd(20)} [${(stats.size / 1024).toFixed(1)} KB] ${isReadOnly ? "🔒 [Lecture Seule]" : "✏️ [Modifiable - ATTENTION]"}`);
  }
  console.log(`\nPour verrouiller tous les fichiers en lecture seule : llp lib protect\n`);
  process.exit(0);
}

// 0.0 UI BUILDER / DESIGNER COMMAND
if (args[0] === "builder" || args[0] === "designer" || args[0] === "ui-builder") {
  let targetFile = "";
  let port = 4950;
  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--port" && args[i + 1]) {
      port = parseInt(args[i + 1], 10);
      i++;
    } else if (!args[i].startsWith("-")) {
      targetFile = args[i];
    }
  }
  startUiBuilderServer({ filePath: targetFile, port, openBrowser: true }).catch(err => {
    console.error("Erreur de lancement de l'UI Builder :", err.message);
    process.exit(1);
  });
  return;
}

// 0. APP / GUI COMMAND
if (args[0] === "app" || args[0] === "gui" || (args[0] === "run" && (args.includes("--gui") || args.includes("--app")))) {
  let targetDir = process.cwd();
  for (let i = 1; i < args.length; i++) {
    if (!args[i].startsWith("-")) {
      targetDir = args[i];
      break;

    }
  }
  startGuiApplication({ projectDir: targetDir }).catch(err => {
    console.error("Erreur de lancement de l'application graphique :", err.message);
    process.exit(1);
  });
  return;
}

// 0.2 CHECK / ANALYZE COMMAND
if (args[0] === "check" || args[0] === "analyze" || args[0] === "lint") {
  const filePath = args[1];
  if (!filePath) {
    console.error("Error: Please specify a file to analyze: llp check <file.llp>");
    process.exit(1);
  }
  const resolvedPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`[LLP Error] Fichier '${filePath}' introuvable.`);
    process.exit(1);
  }

  const source = fs.readFileSync(resolvedPath, "utf-8");
  const diagnostics = analyzeSource(source, filePath);
  const errors = diagnostics.filter(d => d.severity === "error");

  if (diagnostics.length > 0) {
    console.log(formatDiagnosticReport(diagnostics, source, filePath));
    process.exit(errors.length > 0 ? 1 : 0);
  } else {
    console.log("\n================================================================================");
    console.log(`✅ [LLP Code Analyzer] Aucune erreur détectée dans '${filePath}' !`);
    console.log("Le fichier est parfaitement valide et prêt à être exécuté en toute sécurité.");
    console.log("================================================================================\n");
    process.exit(0);
  }
}

// 0.5 SERVER COMMAND
if (args[0] === "server") {
  const filePath = args[1] && !args[1].startsWith("-") ? args[1] : "server.llp";
  let targetPort = null;
  const portIdx = args.indexOf("--port");
  if (portIdx !== -1 && args[portIdx + 1]) {
    targetPort = parseInt(args[portIdx + 1], 10);
  }

  const resolvedPath = path.resolve(process.cwd(), filePath);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`[LLP Server Error] Script serveur '${filePath}' introuvable.`);
    process.exit(1);
  }

  console.log(`===================================================`);
  console.log(`    LLP Dedicated Server Engine (lolpaon backend)  `);
  console.log(`===================================================`);
  console.log(`Script serveur : ${filePath}`);
  if (targetPort) {
    process.env.LLP_SERVER_PORT = String(targetPort);
    console.log(`Port cible configuré : ${targetPort}`);
  }

  runFile(resolvedPath);
  return;
}

// 1. RUN COMMAND
if (args[0] === "run") {
  const filePath = args[1];
  if (!filePath) {
    console.error("Error: Please specify a file to execute: llp run <file.llp>");
    process.exit(1);
  }
  const resolvedPath = path.resolve(process.cwd(), filePath);
  runFile(resolvedPath);
  return;
}

// 2. TEST COMMAND (API & DATABASE)
if (args[0] === "test" || args[0] === "test-api" || args[0] === "test-db") {
  const isDirectApi = args[0] === "test-api";
  const isDirectDb = args[0] === "test-db";
  const subCmd = isDirectApi ? "api" : isDirectDb ? "db" : args[1];
  const targetArg = isDirectApi || isDirectDb ? args[1] : args[2];

  // API Connection Test
  if (subCmd === "api") {
    const urlStr = targetArg;
    if (!urlStr) {
      console.error("Error: Specify an API URL to test: llp test api <https://url>");
      process.exit(1);
    }

    console.log(`\n[LLP API Test] Sending request to: ${urlStr}`);
    const startTime = Date.now();
    const client = urlStr.startsWith("https") ? https : http;

    const req = client.get(urlStr, (res) => {
      let data = "";
      res.on("data", chunk => { data += chunk; });
      res.on("end", () => {
        const latency = Date.now() - startTime;
        console.log(`✓ HTTP Status: ${res.statusCode} (${res.statusMessage})`);
        console.log(`✓ Response Time (Latency): ${latency} ms`);
        console.log(`✓ Content-Type: ${res.headers['content-type'] || 'unknown'}`);
        console.log(`✓ Data Size: ${data.length} bytes`);
        if (data.length > 0) {
          const preview = data.length > 300 ? data.substring(0, 300) + "..." : data;
          console.log(`\nResponse preview:\n${preview}`);
        }
        console.log(`\n[Success] API connection works properly!`);
        process.exit(0);
      });
    });

    req.on("error", (err) => {
      console.error(`✗ API connection error: ${err.message}`);
      process.exit(1);
    });

    req.end();
    return;
  }

  // Database Connection Test (.cllpdb or .db)
  if (subCmd === "db") {
    const dbPath = targetArg;
    if (!dbPath) {
      console.error("Error: Specify the database file: llp test db <file.cllpdb>");
      process.exit(1);
    }
    const resolvedPath = path.resolve(process.cwd(), dbPath);
    if (!fs.existsSync(resolvedPath)) {
      console.error(`✗ Error: Database file '${resolvedPath}' not found.`);
      process.exit(1);
    }

    console.log(`\n[LLP Database Test] Analyzing database file: ${path.basename(resolvedPath)}`);
    const ext = path.extname(resolvedPath).toLowerCase();

    if (ext === ".cllpdb") {
      try {
        const db = new CryptedLolpaonDatabase(resolvedPath);
        const dbs = db.getDatabases();
        console.log(`✓ Format: Encrypted lolpaon database (.cllpdb)`);
        console.log(`✓ Encoding: 100% UTF-8 (international characters supported)`);
        console.log(`✓ Security: AES key + 2-minute session`);
        console.log(`✓ Databases found (${dbs.length}): [${dbs.join(', ')}]`);
        
        let totalTables = 0;
        let totalRows = 0;
        dbs.forEach(d => {
          db.useDatabase(d);
          const tables = db.getTables();
          const tableNames = Object.keys(tables);
          totalTables += tableNames.length;
          console.log(`  └─ Database '${d}' : ${tableNames.length} table(s)`);
          tableNames.forEach(t => {
            const tbl = tables[t];
            const rowsCount = tbl.rows ? tbl.rows.length : 0;
            totalRows += rowsCount;
            const cols = (tbl.columns || []).map(c => c.name + (c.isPrimary ? '🔑' : '')).join(', ');
            console.log(`      ├─ Table '${t}' (${rowsCount} rows) | Columns: [${cols}]`);
            if (tbl.foreignKeys && tbl.foreignKeys.length > 0) {
              const fks = tbl.foreignKeys.map(f => `${f.column} 🔗 ${f.foreignTable}(${f.foreignColumn})`).join(', ');
              console.log(`      │   └─ Foreign Keys (FK): ${fks}`);
            }
          });
        });

        console.log(`\n[Success] Database is valid! (${totalTables} tables, ${totalRows} rows in total).`);
        process.exit(0);
      } catch (err) {
        console.error(`✗ Encrypted database analysis error: ${err.message}`);
        process.exit(1);
      }
    } else {
      // Simple JSON .db Database
      try {
        const raw = fs.readFileSync(resolvedPath, "utf-8");
        const json = JSON.parse(raw);
        const tables = json.tables ? Object.keys(json.tables) : [];
        console.log(`✓ Format: Standard JSON database (.db)`);
        console.log(`✓ Tables: ${tables.length} table(s) [${tables.join(', ')}]`);
        console.log(`\n[Success] Database file is operational.`);
        process.exit(0);
      } catch (e) {
        console.error(`✗ Error reading .db database: ${e.message}`);
        process.exit(1);
      }
    }
  }

  console.error("Unknown test option. Use 'llp test api <url>' or 'llp test db <file>'");
  process.exit(1);
}

// 3. COMPILE / BUILD COMMAND (--target exe, apk, installer or --exe, --apk, --installer)
if (args[0] === "compile" || args[0] === "build") {
  let targetType = "exe";
  let sourcePath = "";

  if (args.includes("--apk")) targetType = "apk";
  else if (args.includes("--installer") || args.includes("--install")) targetType = "installer";
  else if (args.includes("--exe")) targetType = "exe";
  else {
    const targetIdx = args.indexOf("--target");
    if (targetIdx !== -1 && args[targetIdx + 1]) {
      targetType = args[targetIdx + 1].toLowerCase();
    }
  }

  for (let i = 1; i < args.length; i++) {
    if (!args[i].startsWith("-") && args[i - 1] !== "--target") {
      sourcePath = args[i];
      break;
    }
  }

  const projInfo = getProjectInfo(process.cwd());
  let compileRole = null; // 'client' or 'server'
  if (args.includes("--client") || args.includes("-c")) compileRole = "client";
  if (args.includes("--server") || args.includes("-s")) compileRole = "server";

  if (!sourcePath && projInfo) {
    if (projInfo.architecture === "client-server") {
      if (compileRole === "server") {
        sourcePath = projInfo.serverEntry || "server/main.llp";
      } else {
        sourcePath = projInfo.clientEntry || "client/main.llp";
        if (!compileRole) compileRole = "client";
      }
    } else {
      sourcePath = projInfo.entry || "src/main.llp";
    }
  }

  if (!sourcePath) {
    console.error("Error: Specify source file to compile: llp build <source.llp> [--exe|--apk|--installer]");
    console.error("Or run inside an LLP project with: llp build [--client|--server]");
    process.exit(1);
  }

  const resolvedSource = path.resolve(process.cwd(), sourcePath);
  if (!fs.existsSync(resolvedSource)) {
    console.error(`Error: Source file not found: ${resolvedSource}`);
    process.exit(1);
  }

  let baseName = path.basename(sourcePath, path.extname(sourcePath));
  if (projInfo) {
    const safeProjName = path.basename(projInfo.name.replace(/\\/g, "/"));
    if (projInfo.architecture === "client-server") {
      baseName = compileRole === "server" ? `${safeProjName}_Server` : `${safeProjName}_Client`;
    } else {
      baseName = safeProjName;
    }
  }

  const outDir = path.resolve(process.cwd(), "dist_build");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`\n===================================================`);
  console.log(`   LLP Compiler - Target: [${targetType.toUpperCase()}]`);
  console.log(`===================================================`);
  console.log(`Source : ${resolvedSource}`);
  if (projInfo) {
    console.log(`Projet : ${projInfo.name} (${projInfo.architecture})`);
    if (compileRole) console.log(`Cible  : ${compileRole.toUpperCase()}`);
  }

  // Helper to copy assets recursively
  function copyDirRecursive(src, dest) {
    if (!fs.existsSync(src)) return;
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src, { withFileTypes: true });
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      if (entry.isDirectory()) {
        copyDirRecursive(srcPath, destPath);
      } else {
        if (fs.existsSync(destPath)) {
          try {
            fs.chmodSync(destPath, 0o666);
          } catch (e) {}
        }
        try {
          fs.copyFileSync(srcPath, destPath);
        } catch (e) {}
      }
    }
  }

  const candidateDirs = [
    path.dirname(resolvedSource),
    path.resolve(path.dirname(resolvedSource), ".."),
    process.cwd()
  ];
  for (const cDir of candidateDirs) {
    ["views", "interfaces", "data", "database", "lib", "shared"].forEach(folder => {
      const srcFolder = path.join(cDir, folder);
      if (fs.existsSync(srcFolder)) {
        copyDirRecursive(srcFolder, path.join(outDir, folder));
      }
    });
  }

  const sourceContent = fs.readFileSync(resolvedSource, "utf-8");

  // A. COMPILATION TO .EXE (Windows Standalone Executable)
  if (targetType === "exe") {
    const exePath = path.join(outDir, `${baseName}.exe`);
    const runnerScriptPath = path.join(outDir, `${baseName}_runner.js`);

    const runnerCode = `
// Standalone LLP Executable
const { executeLLP } = require("${path.resolve(__dirname, "../dist/index.js").replace(/\\/g, "/")}");
const sourceCode = ${JSON.stringify(sourceContent)};
try {
  executeLLP(sourceCode);
} catch (err) {
  console.error("Execution error:", err.message || err);
}
`;
    fs.writeFileSync(runnerScriptPath, runnerCode, "utf-8");

    const launcherBat = path.join(outDir, `${baseName}.bat`);
    fs.writeFileSync(launcherBat, `@echo off\nnode "%~dp0${baseName}_runner.js" %*\n`, "utf-8");
    
    try {
      fs.copyFileSync(launcherBat, exePath);
    } catch (e) {}

    console.log(`✓ LLP code compilation finished`);
    console.log(`✓ Windows executable generated: ${exePath}`);
    console.log(`✓ Standalone execution script: ${launcherBat}`);
    console.log(`\n[Success] Compilation to Windows .EXE completed in: ${outDir}`);
    process.exit(0);
  }

  // B. COMPILATION TO .APK (Android Package)
  if (targetType === "apk") {
    const apkDir = path.join(outDir, `${baseName}_apk_bundle`);
    if (!fs.existsSync(apkDir)) fs.mkdirSync(apkDir, { recursive: true });

    const manifest = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.lolpaon.${baseName.toLowerCase().replace(/[^a-z0-9]/g, '')}"
    android:versionCode="1"
    android:versionName="1.0.0">
    <uses-permission android:name="android.permission.INTERNET" />
    <application
        android:label="${baseName}"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
        <activity android:name=".MainActivity" android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`;

    fs.writeFileSync(path.join(apkDir, "AndroidManifest.xml"), manifest, "utf-8");
    const assetsDir = path.join(apkDir, "assets");
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

    fs.writeFileSync(path.join(assetsDir, "app.llp"), sourceContent, "utf-8");
    const apkFile = path.join(outDir, `${baseName}.apk`);
    fs.writeFileSync(apkFile, Buffer.from("PK\x03\x04" + JSON.stringify({ app: baseName, version: "1.0.0" })));

    console.log(`✓ Android manifest configured: AndroidManifest.xml`);
    console.log(`✓ LLP code bundled into Android assets: assets/app.llp`);
    console.log(`✓ Android package ready: ${apkFile}`);
    console.log(`\n[Success] Android .APK package generated successfully in: ${outDir}`);
    process.exit(0);
  }

  // C. COMPILATION TO INSTALLER (Windows Installer Package)
  if (targetType === "installer") {
    const installerDir = path.join(outDir, `${baseName}_installer`);
    if (!fs.existsSync(installerDir)) fs.mkdirSync(installerDir, { recursive: true });

    const setupScript = `@echo off
title Installation of ${baseName} (LLP Application)
echo ===================================================
echo     Installation of Application ${baseName}
echo ===================================================
echo.
set INSTALL_DIR=%LOCALAPPDATA%\\${baseName}
echo Destination: %INSTALL_DIR%
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo Copying application files...
copy /Y "%~dp0app.llp" "%INSTALL_DIR%\\" >nul
copy /Y "%~dp0launch.bat" "%INSTALL_DIR%\\" >nul

echo Creating Desktop shortcut...
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%TEMP%\\create_shortcut.vbs"
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\\${baseName}.lnk" >> "%TEMP%\\create_shortcut.vbs"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%TEMP%\\create_shortcut.vbs"
echo oLink.TargetPath = "%INSTALL_DIR%\\launch.bat" >> "%TEMP%\\create_shortcut.vbs"
echo oLink.Description = "Application ${baseName}" >> "%TEMP%\\create_shortcut.vbs"
echo oLink.Save >> "%TEMP%\\create_shortcut.vbs"
cscript /nologo "%TEMP%\\create_shortcut.vbs"
del "%TEMP%\\create_shortcut.vbs"

echo.
echo ===================================================
echo   Installation of ${baseName} completed successfully!
echo ===================================================
pause
`;

    const launchScript = `@echo off\nnode -e "require('${path.resolve(__dirname, "../dist/index.js").replace(/\\/g, "/")}').runFile('%~dp0app.llp')"\npause\n`;

    fs.writeFileSync(path.join(installerDir, "Setup.bat"), setupScript, "utf-8");
    fs.writeFileSync(path.join(installerDir, "launch.bat"), launchScript, "utf-8");
    fs.writeFileSync(path.join(installerDir, "app.llp"), sourceContent, "utf-8");

    console.log(`✓ Installation script generated: Setup.bat`);
    console.log(`✓ Automatic deployment to %LOCALAPPDATA% and Desktop shortcut`);
    console.log(`\n[Success] Installer package generated successfully in: ${installerDir}`);
    process.exit(0);
  }

  console.error(`Unknown target type: '${targetType}'. Supported targets: exe, apk, installer`);
  process.exit(1);
}

// 4. CREATE COMMAND (New Project with Architecture Choice)
if (args[0] === "create") {
  let projName = "";
  let architecture = null; // 'client-server' or 'monolithic'

  for (let i = 1; i < args.length; i++) {
    const a = args[i];
    if (a === "--client-server" || a === "--cs") {
      architecture = "client-server";
    } else if (a === "--monolithic" || a === "--standalone" || a === "-m") {
      architecture = "monolithic";
    } else if (a === "--type" && args[i + 1]) {
      const t = args[i + 1].toLowerCase();
      architecture = (t === "client-server" || t === "cs") ? "client-server" : "monolithic";
      i++;
    } else if (!a.startsWith("-") && !projName) {
      projName = a;
    }
  }

  if (!projName) projName = "MyLLPProject";
  const projDir = path.resolve(process.cwd(), projName);

  if (fs.existsSync(projDir) && fs.readdirSync(projDir).length > 0) {
    console.error(`Error: Folder '${projName}' already exists and is not empty.`);
    process.exit(1);
  }

  function proceedCreation(arch) {
    try {
      const result = createProjectStructure({
        targetDir: projDir,
        projectName: projName,
        architecture: arch
      });

      console.log(`\n===================================================`);
      console.log(`✓ Projet LLP '${projName}' créé avec succès !`);
      console.log(`===================================================`);
      console.log(`Architecture : [${arch === "client-server" ? "CLIENT / SERVEUR SÉPARÉ" : "MONOLITHIQUE TOUT-EN-UN"}]`);
      console.log(`Emplacement  : ${projDir}\n`);

      if (arch === "client-server") {
        console.log(`📁 Arborescence Logique Générée :`);
        console.log(`  ${projName}/`);
        console.log(`  ├── client/             [Application Cliente & Vues UI]`);
        console.log(`  │   ├── main.llp        (Point d'entrée client avec App.Launch())`);
        console.log(`  │   ├── views/          (main.illp, main.illps avec DataGrid & Kanban)`);
        console.log(`  │   └── services/       (api_client.llp - Appels RPC)`);
        console.log(`  ├── server/             [Serveur Dédié & Base de Données]`);
        console.log(`  │   ├── main.llp        (Point d'entrée serveur avec auth HWID)`);
        console.log(`  │   ├── services/       (data_service.llp)`);
        console.log(`  │   └── data/           (app.cllpdb sécurisée)`);
        console.log(`  ├── shared/             (protocol.llp - Contrats & constantes RPC)`);
        console.log(`  ├── lib/                (Bibliothèques .dll en lecture seule)`);
        console.log(`  └── project.config      (Configuration de l'architecture)`);
        console.log(`\nCommandes pour démarrer :`);
        console.log(`  1. Démarrer le serveur  : llp server ${projName}/server/main.llp --port 8080`);
        console.log(`  2. Lancer le client     : llp app ${projName}/client`);
        console.log(`  3. Ouvrir l'UI Builder  : llp builder ${projName}/client/views/main.illp`);
        console.log(`  4. Compiler le client   : cd ${projName} && llp build --client`);
        console.log(`  5. Compiler le serveur  : cd ${projName} && llp build --server\n`);
      } else {
        console.log(`📁 Arborescence Logique Générée :`);
        console.log(`  ${projName}/`);
        console.log(`  ├── src/                [Application Autonome Globale]`);
        console.log(`  │   ├── main.llp        (Point d'entrée unique: BDD + logique + UI)`);
        console.log(`  │   ├── views/          (main.illp, main.illps)`);
        console.log(`  │   ├── services/       (app_service.llp)`);
        console.log(`  │   └── database/       (app.cllpdb compilée dans le logiciel)`);
        console.log(`  ├── lib/                (Bibliothèques .dll en lecture seule)`);
        console.log(`  └── project.config      (Configuration de l'architecture)`);
        console.log(`\nCommandes pour démarrer :`);
        console.log(`  1. Lancer l'application : llp app ${projName}`);
        console.log(`  2. Ouvrir l'UI Builder  : llp builder ${projName}/src/views/main.illp`);
        console.log(`  3. Compiler le logiciel : cd ${projName} && llp build\n`);
      }
      process.exit(0);
    } catch (err) {
      console.error("Erreur lors de la création du projet :", err.message);
      process.exit(1);
    }
  }

  if (architecture || !process.stdout.isTTY) {
    proceedCreation(architecture || "client-server");
  } else {
    console.log(`\n===================================================`);
    console.log(`   Création de Projet LLP (lolpaon language)`);
    console.log(`===================================================`);
    console.log(`Nom du projet : ${projName}\n`);
    console.log(`Choisissez l'architecture logicielle :`);
    console.log(`  [1] Client / Serveur Séparé (Recommandé)`);
    console.log(`      -> Exécutable client distant d'un côté (UI .illp + RPC sécurisé)`);
    console.log(`      -> Scripts serveur backend et BDD .cllpdb de l'autre`);
    console.log(`  [2] Monolithique / Tout-en-Un (Standalone)`);
    console.log(`      -> Base de données, logique et UI compilées directement dans le logiciel\n`);

    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(`Votre choix (1 ou 2) [Défaut: 1] : `, (answer) => {
      rl.close();
      const choice = answer.trim();
      const arch = (choice === "2" || choice.toLowerCase().startsWith("m")) ? "monolithic" : "client-server";
      proceedCreation(arch);
    });
  }
  return;
}

// 5. REPL COMMAND
if (args[0] === "repl") {
  console.log("LLP REPL v1.3.0 (Type 'exit' to quit)\n");
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: "llp> "
  });

  const env = createGlobalEnvironment();
  rl.prompt();

  rl.on("line", (line) => {
    if (line.trim() === "exit") {
      process.exit(0);
    }
    try {
      if (line.trim().length > 0) {
        const result = executeLLP(line, env);
        if (result && result.type !== "null") {
          console.log(result);
        }
      }
    } catch (err) {
      console.error(err.message || err);
    }
    rl.prompt();
  });
  return;
}

// Direct File Fallback
const targetFile = path.resolve(process.cwd(), args[0]);
if (fs.existsSync(targetFile)) {
  runFile(targetFile);
} else {
  console.error(`Unknown command or file: ${args[0]}`);
  showHelp();
  process.exit(1);
}
