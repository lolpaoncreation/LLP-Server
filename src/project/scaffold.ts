import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import { CryptedLolpaonDatabase } from "../stdlib/cllpdb";

export type ProjectArchitecture = "client-server" | "monolithic";

export interface CreateProjectOptions {
  targetDir: string;
  projectName: string;
  architecture?: ProjectArchitecture;
  isExample?: boolean;
  author?: string;
  dbUser?: string;
  dbPassword?: string;
}

export interface ProjectInfo {
  name: string;
  architecture: ProjectArchitecture;
  clientEntry?: string;
  serverEntry?: string;
  entry?: string;
  projectKey?: string;
}

/**
 * Lit et analyse le fichier project.config pour déterminer l'architecture du projet.
 */
export function getProjectInfo(projectDir: string): ProjectInfo | null {
  const configFile = path.join(projectDir, "project.config");
  if (!fs.existsSync(configFile)) {
    return null;
  }

  const content = fs.readFileSync(configFile, "utf-8");
  const info: Partial<ProjectInfo> = {
    architecture: "monolithic"
  };

  const lines = content.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("name")) {
      const m = trimmed.match(/=\s*["']?([^"']+)["']?/);
      if (m) info.name = m[1].trim();
    } else if (trimmed.startsWith("architecture")) {
      const m = trimmed.match(/=\s*["']?([^"']+)["']?/);
      if (m) {
        const val = m[1].trim().toLowerCase();
        info.architecture = val === "client-server" || val === "cs" ? "client-server" : "monolithic";
      }
    } else if (trimmed.startsWith("client_entry")) {
      const m = trimmed.match(/=\s*["']?([^"']+)["']?/);
      if (m) info.clientEntry = m[1].trim();
    } else if (trimmed.startsWith("server_entry")) {
      const m = trimmed.match(/=\s*["']?([^"']+)["']?/);
      if (m) info.serverEntry = m[1].trim();
    } else if (trimmed.startsWith("entry")) {
      const m = trimmed.match(/=\s*["']?([^"']+)["']?/);
      if (m) info.entry = m[1].trim();
    } else if (trimmed.startsWith("project_key")) {
      const m = trimmed.match(/=\s*["']?([^"']+)["']?/);
      if (m) info.projectKey = m[1].trim();
    }
  }

  return {
    name: info.name || path.basename(projectDir),
    architecture: info.architecture || "monolithic",
    clientEntry: info.clientEntry,
    serverEntry: info.serverEntry,
    entry: info.entry,
    projectKey: info.projectKey
  };
}

/**
 * Génère l'arborescence complète d'un projet LLP en fonction de l'architecture choisie.
 */
export function createProjectStructure(options: CreateProjectOptions): {
  success: boolean;
  architecture: ProjectArchitecture;
  filesCreated: string[];
  message: string;
} {
  const {
    targetDir,
    projectName,
    architecture = "client-server",
    isExample = false,
    author = process.env.USERNAME || "Developer",
    dbUser = "root",
    dbPassword = "root"
  } = options;

  if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
    throw new Error(`Target directory '${targetDir}' already exists and is not empty.`);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  const filesCreated: string[] = [];

  const uniqueKey = crypto.randomBytes(32).toString("hex");

  // Helper to write files
  function writeFile(relPath: string, content: string) {
    const fullPath = path.join(targetDir, relPath);
    const parent = path.dirname(fullPath);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, "utf-8");
    filesCreated.push(relPath);
  }

  // Initialize encrypted database with root credentials
  function createSeedDatabase(dbRelPath: string) {
    const fullDbPath = path.join(targetDir, dbRelPath);
    const dbDir = path.dirname(fullDbPath);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

    const db = new CryptedLolpaonDatabase(fullDbPath, uniqueKey);
    db.initializeNew(dbUser, dbPassword);
    db.startSession(dbUser, dbPassword);

    // Minimal system config table
    db.executeSql("CREATE TABLE config (key VARCHAR PRIMARY KEY, value VARCHAR);");
    db.executeSql(`INSERT INTO config VALUES ("created_at", "${new Date().toISOString()}");`);
    db.executeSql(`INSERT INTO config VALUES ("project_name", "${projectName}");`);
    db.executeSql(`INSERT INTO config VALUES ("db_admin", "${dbUser}");`);

    db.save();
    filesCreated.push(dbRelPath);
  }

  // 1. CLIENT / DEDICATED SERVER ARCHITECTURE
  if (architecture === "client-server") {
    // A. project.config
    const configContent = `[project]
name = "${projectName}"
version = "1.5.5"
architecture = "client-server"
client_entry = "client/main.llp"
server_entry = "server/main.llp"
project_key = "${uniqueKey}"
author = "${author}"
db_admin = "${dbUser}"
description = "LLP Project - Client / Dedicated Server Architecture"
`;
    writeFile("project.config", configContent);

    // B. client/ folder
    const clientMain = `// ===================================================
// Client Application - Executable Client Entry Point
// ===================================================
visibility: All

print("===================================================")
print("🚀 [LLP Client] Démarrage de l'application cliente...")
print("===================================================")

// 1. Empreinte matérielle non falsifiable du client
string clientHwid = Device.GetId()
print("🔒 Client Hardware Fingerprint (HWID):", clientHwid)

// 2. Configuration du Serveur Dédié
string serverHost = "127.0.0.1"
int serverPort = 8080
print("🌐 Serveur cible configuré :", serverHost, ":", serverPort)

// 3. Logique Client : Récupération des données, validation et envoi au Serveur
func handleLoginAction() {
    // Étape A : Récupérer les informations saisies par l'utilisateur
    General username = UI.InputUsername.value
    General password = UI.InputPassword.value

    // Étape B : Validation locale côté client
    if (username == "") {
        UI.StatusLabel.txt = "⚠️ Veuillez saisir un nom d'utilisateur."
        return false
    }
    if (password == "") {
        UI.StatusLabel.txt = "⚠️ Veuillez saisir votre mot de passe."
        return false
    }

    // Étape C : Feedback visuel immédiat
    UI.StatusLabel.txt = "⏳ Vérification auprès du serveur LLP..."
    UI.BtnLogin.txt = "Connexion..."

    // Étape D : Envoi sécurisé au serveur via RPC
    General res = RPC.Call("Auth.login", username, password)

    // Étape E : Traitement de la réponse du serveur et mise à jour de l'interface
    if (res.success == true) {
        UI.StatusLabel.txt = "✅ " + res.message
        UI.BtnLogin.txt = "Connecté"
    } else {
        UI.StatusLabel.txt = "❌ " + res.message
        UI.BtnLogin.txt = "Se connecter"
    }
}

// Liaison de l'événement clic du bouton
UI.BtnLogin.OnClick(handleLoginAction)

// 4. Lancement de la fenêtre graphique
print("🎨 Chargement de la vue client client/views/main.illp...")
App.Launch(WindowSize: 800 : 600, DevMode: False)
`;
    writeFile("client/main.llp", clientMain);

    const clientService = `// ===================================================
// Client Services - Network Client Services
// ===================================================
visibility: All

function ConnectClient(string host, int port) {
    print("[Client] Connecting to", host, ":", port)
    General res = Client.Connect(host, port)
    return res
}
`;
    writeFile("client/services/api_client.llp", clientService);

    // Client Views (.illp and .illps)
    const clientIllp = `visibility: All

/* Main Interface (.illp) - Application Interactive Client-Serveur */
Background "MainWindow" responsive: true minWidth: "400px" maxWidth: "750px" minHeight: "420px" {
    Card "AuthCard" title: "🔐 Connexion Client LLP" {
        Text "SubTitle" content: "Entrez vos identifiants pour communiquer avec le serveur :"
        TextInput "InputUsername" placeholder: "Nom d'utilisateur..." value: ""
        TextInput "InputPassword" placeholder: "Mot de passe..." value: "" type: "password"
        Button "BtnLogin" text: "Se connecter"
        Text "StatusLabel" content: ""
    }
}
`;
    writeFile("client/views/main.illp", clientIllp);

    const clientIllps = `/* ===================================================
   Client Interface Stylesheet (.illps)
   =================================================== */
visibility: All

Background.MainWindow {
    background: #0f111a
}

Card.AuthCard {
    background: #181825
    border: 1px solid #313244
}
`;
    writeFile("client/views/main.illps", clientIllps);

    // C. server/ folder
    const serverMain = `// ===================================================
// Dedicated Server - Backend Services Entry Point
// ===================================================
visibility: All

print("===================================================")
print("🛡️ [LLP Server] Starting Dedicated Server...")
print("===================================================")

int port = 8080
print("Listening on port:", port)

// 1. Connect to Secure Encrypted Database (.cllpdb)
General db = CLLPDB.Open("server/data/app.cllpdb")
db.StartSession("${dbUser}", "${dbPassword}")
print("✅ Local database .cllpdb connected successfully (User: ${dbUser}).")

// 2. Gestionnaire Métier Serveur (Authentification)
func handleAuthLogin(username, password) {
    print("🔐 [Serveur] Demande d'authentification reçue pour :", username)

    // Validation métier côté serveur
    if (username == "admin" && password == "admin123") {
        print("✅ [Serveur] Authentification réussie pour", username)
        return {
            "success": true,
            "message": "Bienvenue " + username + " ! Session active.",
            "token": "LLP_TOKEN_SECURE_AUTH"
        }
    }

    print("⚠️ [Serveur] Identifiants incorrects pour", username)
    return {
        "success": false,
        "message": "Nom d'utilisateur ou mot de passe incorrect."
    }
}

// 3. Enregistrement du service RPC
Server.RegisterRPC("Auth", "login", handleAuthLogin)

// 4. Start Network Listening
Server.Listen(port)
print("🚀 Server ready and listening for incoming client connections on port", port)
`;
    writeFile("server/main.llp", serverMain);

    const serverService = `// ===================================================
// Server Services - Business Logic & Validation
// ===================================================
visibility: All

function VerifyClient(string deviceId) {
    if (deviceId == "") {
        return false
    }
    print("[Security] Validating client device:", deviceId)
    return true
}
`;
    writeFile("server/services/data_service.llp", serverService);

    // Database server/data/app.cllpdb
    createSeedDatabase("server/data/app.cllpdb");

    // D. shared/ protocol
    const sharedProtocol = `// ===================================================
// Protocol - Shared Constants and Contracts
// ===================================================
visibility: All

int RPC_PORT_DEFAULT = 8080
int RPC_STATUS_OK = 200
int RPC_STATUS_ERROR = 500

string ROLE_ADMIN = "Administrator"
string ROLE_OPERATOR = "Field Operator"
`;
    writeFile("shared/protocol.llp", sharedProtocol);

    // E. Project README
    const projectReadme = `# 🚀 LLP Project : ${projectName} (Client / Dedicated Server Architecture)

This project is structured according to the **Client / Dedicated Server** architecture:
* **\`client/\`** : Client application logic, user interface layouts (\`.illp\`, \`.illps\`), and network services.
* **\`server/\`** : Dedicated backend server scripts and encrypted database (\`.cllpdb\`) configured with root user **${dbUser}**.
* **\`shared/\`** : Shared communication contracts, RPC protocols, and constants.
* **\`lib/\`** : Read-only language standard libraries (\`.dll\`).

---

## 🛠️ Available Commands

### 1. Start the Dedicated Server:
\`\`\`bash
llp run server/main.llp
\`\`\`

### 2. Launch the Client Application (GUI Mode):
\`\`\`bash
llp app client
# or
llp run client/main.llp --gui
\`\`\`

### 3. Open the Visual UI Builder:
\`\`\`bash
llp builder client/views/main.illp
\`\`\`
`;
    writeFile("README.md", projectReadme);
  }

  // 2. MONOLITHIC ARCHITECTURE (STANDALONE ALL-IN-ONE)
  else {
    // A. project.config
    const configContent = `[project]
name = "${projectName}"
version = "1.5.5"
architecture = "monolithic"
entry = "src/main.llp"
project_key = "${uniqueKey}"
author = "${author}"
db_admin = "${dbUser}"
description = "LLP Project - Standalone All-in-One Monolithic Architecture"
`;
    writeFile("project.config", configContent);

    // B. src/ folder
    const srcMain = `// ===================================================
// Monolithic Application - Standalone Entry Point
// ===================================================
visibility: All

print("===================================================")
print("📦 [LLP App] Launching All-in-One Application...")
print("===================================================")

// 1. Initialize Embedded Local Database
General db = CLLPDB.Open("src/database/app.cllpdb")
db.StartSession("${dbUser}", "${dbPassword}")
print("✅ Local database .cllpdb connected successfully (User: ${dbUser}).")

// 2. Launch Graphical User Interface Window
print("🎨 Loading interface src/views/main.illp...")
App.Launch(WindowSize: 800 : 600, DevMode: False)
`;
    writeFile("src/main.llp", srcMain);

    const appService = `// ===================================================
// App Services - Internal Business Logic
// ===================================================
visibility: All

function LoadApplicationState() {
    print("[App Service] Loading local application state...")
    return true
}
`;
    writeFile("src/services/app_service.llp", appService);

    // Views src/views/
    const mainIllp = `visibility: All

/* Main Interface (.illp) - Application Légère Optimisée (< 1 Mo) */
Background "MainWindow" responsive: true minWidth: "360px" maxWidth: "720px" minHeight: "280px" {
    Card "WelcomeCard" title: "⚡ Application LLP" {
        Text "AppStatus" content: "✓ Application autonome optimisée (Empreinte mémoire < 1 Mo)"
        Button "ActionBtn" text: "Démarrer"
    }
}
`;
    writeFile("src/views/main.illp", mainIllp);

    const mainIllps = `/* ===================================================
   Standalone Interface Stylesheet (.illps)
   =================================================== */
visibility: All

Background.MainWindow {
    background: #0f111a
}

Card.WelcomeCard {
    background: #181825
    border: 1px solid #313244
}
`;
    writeFile("src/views/main.illps", mainIllps);

    // Embedded database
    createSeedDatabase("src/database/app.cllpdb");

    // README
    const projectReadme = `# 🚀 LLP Project : ${projectName} (Standalone Monolithic Architecture)

This project is structured according to the **Standalone Monolithic** architecture:
* The encrypted database (\`src/database/app.cllpdb\`), application logic, and user interface are packaged together in a single standalone app.
* Root database credentials: user **${dbUser}**.
* **\`lib/\`** : Read-only language standard libraries (\`.dll\`).

---

## 🛠️ Available Commands

### 1. Launch the Application:
\`\`\`bash
llp app
# or
llp run src/main.llp --gui
\`\`\`

### 2. Open the Visual UI Builder:
\`\`\`bash
llp builder src/views/main.illp
\`\`\`
`;
    writeFile("README.md", projectReadme);
  }

  // C. build/ folder
  const buildDir = path.join(targetDir, "build");
  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });

  // D. Copy 9 standard read-only libraries into lib/
  copyBaseLibraries(targetDir, filesCreated);

  return {
    success: true,
    architecture,
    filesCreated,
    message: `Project '${projectName}' (${architecture === "client-server" ? "Client / Dedicated Server" : "Standalone Monolithic"}) created successfully!`
  };
}

/**
 * Construit un binaire .dll LLP avec signature magique, en-tête de métadonnées et flags en lecture seule.
 */
export function buildLlpDllBinary(libName: string, description: string, exportedSymbols: string[] = []): Buffer {
  const magic = Buffer.from("LLPDLL\x01\x00", "ascii"); // 8 octets signature
  const metaObj = {
    format: "LLP-DYNAMIC-LINK-LIBRARY",
    version: "1.5.4",
    name: libName,
    description: description,
    exports: exportedSymbols,
    readOnly: true,
    compiledAt: new Date().toISOString(),
    hash: crypto.createHash("sha256").update(libName + description + exportedSymbols.join(",")).digest("hex")
  };
  const metaJson = Buffer.from(JSON.stringify(metaObj, null, 2), "utf-8");
  const metaLen = Buffer.alloc(4);
  metaLen.writeUInt32LE(metaJson.length, 0);

  return Buffer.concat([magic, metaLen, metaJson]);
}

/**
 * Applique strictement l'attribut lecture seule sur un fichier .dll
 */
export function setFileReadOnly(filePath: string) {
  try {
    fs.chmodSync(filePath, 0o444);
  } catch (e) {}
}

/**
 * Supprime les fichiers qui ne sont pas des .dll dans lib/
 */
export function cleanNonDllFilesFromLib(libDir: string): number {
  if (!fs.existsSync(libDir)) return 0;
  let cleaned = 0;
  const entries = fs.readdirSync(libDir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(libDir, entry.name);
    if (entry.isFile() && !entry.name.toLowerCase().endsWith(".dll")) {
      try {
        fs.chmodSync(full, 0o666);
        fs.unlinkSync(full);
        cleaned++;
      } catch (_) {}
    }
  }
  return cleaned;
}

/**
 * Ajoute ou copie une librairie .dll dans le dossier lib/ d'un projet et applique le mode lecture seule.
 * Enforce la règle stricte que lib/ ne contient que des fichiers .dll en lecture seule.
 */
export function addLibraryToProject(
  projectDir: string,
  libSourceOrName: string,
  customContent?: Buffer | string
): { success: boolean; libFile: string; message: string } {
  const libDir = path.join(projectDir, "lib");
  if (!fs.existsSync(libDir)) fs.mkdirSync(libDir, { recursive: true });

  let baseName = path.basename(libSourceOrName);
  if (!baseName.toLowerCase().endsWith(".dll")) {
    baseName = baseName.replace(/\.[^.]+$/, "") + ".dll";
  }

  const destPath = path.join(libDir, baseName);

  // Déverrouiller si déjà existant pour mise à jour
  if (fs.existsSync(destPath)) {
    try {
      fs.chmodSync(destPath, 0o666);
    } catch (_) {}
  }

  if (customContent) {
    if (Buffer.isBuffer(customContent)) {
      fs.writeFileSync(destPath, customContent);
    } else {
      fs.writeFileSync(destPath, customContent, "utf-8");
    }
  } else if (fs.existsSync(libSourceOrName) && path.resolve(libSourceOrName) !== path.resolve(destPath)) {
    fs.copyFileSync(libSourceOrName, destPath);
  } else {
    // Generate binary LLP .dll library
    const dllBuf = buildLlpDllBinary(
      baseName.replace(/\.dll$/i, ""),
      `LLP Developer Library : ${baseName}`,
      ["Init", "Execute", "Export"]
    );
    fs.writeFileSync(destPath, dllBuf);
  }

  // Enforce read-only lock
  setFileReadOnly(destPath);

  // Clean non-dll files
  cleanNonDllFilesFromLib(libDir);

  return {
    success: true,
    libFile: destPath,
    message: `Library '${baseName}' added to lib/ successfully in read-only mode.`
  };
}

/**
 * Assure que le dossier lib/ ne contient que des fichiers .dll et qu'ils sont tous en lecture seule.
 */
export function enforceLibDirectoryProtection(projectDir: string): { totalDlls: number; cleaned: number } {
  const libDir = path.join(projectDir, "lib");
  if (!fs.existsSync(libDir)) return { totalDlls: 0, cleaned: 0 };

  const cleaned = cleanNonDllFilesFromLib(libDir);
  let totalDlls = 0;
  const entries = fs.readdirSync(libDir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(libDir, entry.name);
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".dll")) {
      setFileReadOnly(full);
      totalDlls++;
    }
  }

  return { totalDlls, cleaned };
}

/**
 * Copie les 9 bibliothèques standard du langage LLP UNIQUEMENT sous forme de fichiers .dll en lecture seule dans lib/
 */
function copyBaseLibraries(targetDir: string, filesCreated: string[]) {
  const libDir = path.join(targetDir, "lib");
  if (!fs.existsSync(libDir)) fs.mkdirSync(libDir, { recursive: true });

  // Nettoyer tous fichiers non-.dll éventuellement existants
  cleanNonDllFilesFromLib(libDir);

  const baseLibMetadata: { [key: string]: { desc: string; exports: string[] } } = {
    "math.dll": {
      desc: "LLP Standard Library : Mathematics, Universal PY Constant & Arithmetic",
      exports: ["Abs", "Floor", "Ceil", "Round", "Sqrt", "Pow", "Sin", "Cos", "DegreeToRad", "RadToDeg", "Clamp", "Lerp", "CircleArea", "Hypot"]
    },
    "scillp.dll": {
      desc: "LLP Standard Library : SciLlp Scientific Computing & Statistics",
      exports: ["Integrate", "Optimize", "FindRoot", "Interpolate", "MovingAverage", "SignalFilter", "PeakDetect", "Mean", "Variance", "StdDev", "LinearRegression"]
    },
    "symllp.dll": {
      desc: "LLP Standard Library : SymLlp Symbolic Mathematics & Formal Calculus",
      exports: ["Solve", "Derivative", "Integral", "Simplify", "Series", "MatrixDet", "MatrixTranspose"]
    },
    "probllp.dll": {
      desc: "LLP Standard Library : ProbLlp Probability, Distributions & Combinatorics",
      exports: ["Factorial", "Permutations", "Combinations", "NormalPDF", "NormalCDF", "Binomial", "Poisson", "Uniform", "Choice", "Sample"]
    },
    "cllpdb.dll": {
      desc: "LLP Standard Library : CLLPDB AES-256 Encrypted Database Engine",
      exports: ["Open", "StartSession", "GetRemainingSession", "Query", "Execute", "Save", "Close"]
    },
    "sync.dll": {
      desc: "LLP Standard Library : DatabaseSync Cloud & Client Synchronization",
      exports: ["ExportJson", "ImportJson", "SyncTables", "PushUpdate"]
    },
    "crypto.dll": {
      desc: "LLP Standard Library : Unique Project Cryptography & Hashing",
      exports: ["GetProjectKey", "Encrypt", "Decrypt", "Sha256", "GenerateHwidToken"]
    },
    "network.dll": {
      desc: "LLP Standard Library : Network Client & Server RPC Protocols",
      exports: ["Get", "Post", "CreateServer", "ConnectSocket", "CallRPC", "RegisterRPC"]
    },
    "validator.dll": {
      desc: "LLP Standard Library : UIValidator Input Sanitization & UI Feedback",
      exports: ["ValidateRequired", "ValidateEmail", "ValidateNumber", "ShowError", "ShowSuccess"]
    }
  };

  for (const [dllName, info] of Object.entries(baseLibMetadata)) {
    const destFile = path.join(libDir, dllName);

    // Déverrouiller si déjà présent
    if (fs.existsSync(destFile)) {
      try {
        fs.chmodSync(destFile, 0o666);
      } catch (_) {}
    }

    const dllBuffer = buildLlpDllBinary(dllName.replace(/\.dll$/i, ""), info.desc, info.exports);
    fs.writeFileSync(destFile, dllBuffer);

    // Appliquer le verrouillage lecture seule (chmod 0444 + attrib +r)
    setFileReadOnly(destFile);

    filesCreated.push(`lib/${dllName}`);
  }
}
