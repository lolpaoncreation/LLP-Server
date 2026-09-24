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
    throw new Error(`Le dossier cible '${targetDir}' existe déjà et n'est pas vide.`);
  }

  fs.mkdirSync(targetDir, { recursive: true });
  const filesCreated: string[] = [];

  const uniqueKey = crypto.randomBytes(32).toString("hex");

  // Helper pour écrire des fichiers
  function writeFile(relPath: string, content: string) {
    const fullPath = path.join(targetDir, relPath);
    const parent = path.dirname(fullPath);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, "utf-8");
    filesCreated.push(relPath);
  }

  // Initialisation de la BDD cryptée avec les identifiants root choisis par l'utilisateur
  function createSeedDatabase(dbRelPath: string) {
    const fullDbPath = path.join(targetDir, dbRelPath);
    const dbDir = path.dirname(fullDbPath);
    if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

    const db = new CryptedLolpaonDatabase(fullDbPath, uniqueKey);
    db.initializeNew(dbUser, dbPassword);
    db.startSession(dbUser, dbPassword);

    // Initialisation d'une table système minimale pour la base de données
    db.executeSql("CREATE TABLE config (key VARCHAR PRIMARY KEY, value VARCHAR);");
    db.executeSql(`INSERT INTO config VALUES ("created_at", "${new Date().toISOString()}");`);
    db.executeSql(`INSERT INTO config VALUES ("project_name", "${projectName}");`);
    db.executeSql(`INSERT INTO config VALUES ("db_admin", "${dbUser}");`);

    db.save();
    filesCreated.push(dbRelPath);
  }

  // 1. ARCHITECTURE CLIENT / SERVEUR SÉPARÉ
  if (architecture === "client-server") {
    // A. project.config
    const configContent = `[project]
name = "${projectName}"
version = "1.5.4"
architecture = "client-server"
client_entry = "client/main.llp"
server_entry = "server/main.llp"
project_key = "${uniqueKey}"
author = "${author}"
db_admin = "${dbUser}"
description = "Projet LLP Architecture Client / Serveur Distant"
`;
    writeFile("project.config", configContent);

    // B. Dossier client/
    const clientMain = `// ===================================================
// Client Application - Point d'entrée exécutable client
// ===================================================
visibility: All

print("===================================================")
print("🚀 [LLP Client] Lancement de l'application cliente")
print("===================================================")

// 1. Identification de l'appareil client
string clientHwid = Device.GetId()
print("🔒 Empreinte Matérielle du Client:", clientHwid)

// 2. Configuration du serveur distant
string serverHost = "127.0.0.1"
int serverPort = 8080
print("🌐 Serveur distant configuré:", serverHost, ":", serverPort)

// 3. Lancement de la fenêtre d'interface graphique (fond blanc vide)
print("🎨 Chargement de la vue client/views/main.illp...")
App.Launch(WindowSize: 800 : 600, DevMode: False)
`;
    writeFile("client/main.llp", clientMain);

    const clientService = `// ===================================================
// Client Services - Services Réseau Client
// ===================================================
visibility: All

function ConnectClient(string host, int port) {
    print("[Client] Connexion vers", host, ":", port)
    General res = Client.Connect(host, port)
    return res
}
`;
    writeFile("client/services/api_client.llp", clientService);

    // Vues Client (.illp et .illps) : Interface vide fond blanc pur
    const clientIllp = `visibility: All

/* Interface Principale (.illp) - Fenêtre vide */
Background "MainWindow" responsive: true minWidth: "400px" maxWidth: "1200px" minHeight: "300px" {
}
`;
    writeFile("client/views/main.illp", clientIllp);

    const clientIllps = `/* ===================================================
   Style de l'interface client (.illps)
   =================================================== */
visibility: All

Background.MainWindow {
    background: #ffffff
}
`;
    writeFile("client/views/main.illps", clientIllps);

    // C. Dossier server/
    const serverMain = `// ===================================================
// Dedicated Server - Point d'entrée backend & services
// ===================================================
visibility: All

print("===================================================")
print("🛡️ [LLP Server] Démarrage du Serveur Dédié")
print("===================================================")

int port = 8080
print("Ouverture du port d'écoute:", port)

// 1. Connexion à la base de données sécurisée .cllpdb
General db = CLLPDB.Open("server/data/app.cllpdb")
db.StartSession("${dbUser}", "${dbPassword}")
print("✅ Base de données locale .cllpdb connectée avec succès (Utilisateur: ${dbUser}).")

// 2. Démarrage de l'écoute réseau
Server.Listen(port)
print("🚀 Serveur prêt et en attente des connexions clientes sur le port", port)
`;
    writeFile("server/main.llp", serverMain);

    const serverService = `// ===================================================
// Server Services - Logique Métier & Contrôles
// ===================================================
visibility: All

function VerifyClient(string deviceId) {
    if (deviceId == "") {
        return false
    }
    print("[Security] Validation de l'appareil client:", deviceId)
    return true
}
`;
    writeFile("server/services/data_service.llp", serverService);

    // Base de données server/data/app.cllpdb avec utilisateur root
    createSeedDatabase("server/data/app.cllpdb");

    // D. Shared / Protocole
    const sharedProtocol = `// ===================================================
// Protocol - Constantes et contrats partagés
// ===================================================
visibility: All

int RPC_PORT_DEFAULT = 8080
int RPC_STATUS_OK = 200
int RPC_STATUS_ERROR = 500

string ROLE_ADMIN = "Administrator"
string ROLE_OPERATOR = "Field Operator"
`;
    writeFile("shared/protocol.llp", sharedProtocol);

    // E. Readme du projet
    const projectReadme = `# 🚀 Projet LLP : ${projectName} (Architecture Client / Serveur Séparé)

Ce projet est structuré selon une architecture **Client / Serveur Distant** :
* **\`client/\`** : Code de l'application cliente, interface graphique vide (\`.illp\`, \`.illps\`) et services réseau.
* **\`server/\`** : Scripts du serveur backend, gestion de la base de données chiffrée (\`.cllpdb\`) configurée avec l'utilisateur root **${dbUser}**.
* **\`shared/\`** : Contrats de communication, protocoles et constantes partagées.
* **\`lib/\`** : Bibliothèques du langage (.dll) en lecture seule.

---

## 🛠️ Commandes Disponibles

### 1. Démarrer le Serveur Dédié :
\`\`\`bash
llp run server/main.llp
\`\`\`

### 2. Lancer l'Application Cliente (Mode Graphique) :
\`\`\`bash
llp app client
# ou
llp run client/main.llp --gui
\`\`\`

### 3. Ouvrir le Visual UI Builder sur l'Interface :
\`\`\`bash
llp builder client/views/main.illp
\`\`\`
`;
    writeFile("README.md", projectReadme);
  }

  // 2. ARCHITECTURE MONOLITHIQUE / GLOBALE (TOUT-EN-UN)
  else {
    // A. project.config
    const configContent = `[project]
name = "${projectName}"
version = "1.5.4"
architecture = "monolithic"
entry = "src/main.llp"
project_key = "${uniqueKey}"
author = "${author}"
db_admin = "${dbUser}"
description = "Projet LLP Architecture Tout-en-un (Monolithique Standalone)"
`;
    writeFile("project.config", configContent);

    // B. Dossier src/
    const srcMain = `// ===================================================
// Monolithic Application - Point d'entrée global autonome
// ===================================================
visibility: All

print("===================================================")
print("📦 [LLP App] Lancement du Logiciel Tout-en-Un")
print("===================================================")

// 1. Initialisation de la base de données locale embarquée
General db = CLLPDB.Open("src/database/app.cllpdb")
db.StartSession("${dbUser}", "${dbPassword}")
print("✅ Base de données locale .cllpdb connectée avec succès (Utilisateur: ${dbUser}).")

// 2. Lancement de la fenêtre d'interface graphique (fond blanc vide)
print("🎨 Chargement de l'interface src/views/main.illp...")
App.Launch(WindowSize: 800 : 600, DevMode: False)
`;
    writeFile("src/main.llp", srcMain);

    const appService = `// ===================================================
// App Services - Logique interne du logiciel
// ===================================================
visibility: All

function LoadApplicationState() {
    print("[App Service] Chargement de l'état local du logiciel...")
    return true
}
`;
    writeFile("src/services/app_service.llp", appService);

    // Vues src/views/ : Interface vide fond blanc pur
    const mainIllp = `visibility: All

/* Interface Principale (.illp) - Fenêtre vide */
Background "MainWindow" responsive: true minWidth: "400px" maxWidth: "1200px" minHeight: "300px" {
}
`;
    writeFile("src/views/main.illp", mainIllp);

    const mainIllps = `/* ===================================================
   Style de l'interface autonome (.illps)
   =================================================== */
visibility: All

Background.MainWindow {
    background: #ffffff
}
`;
    writeFile("src/views/main.illps", mainIllps);

    // Base de données embarquée src/database/app.cllpdb
    createSeedDatabase("src/database/app.cllpdb");

    // Readme
    const projectReadme = `# 🚀 Projet LLP : ${projectName} (Architecture Monolithique / Tout-en-Un)

Ce projet est structuré selon une architecture **Monolithique / Standalone** :
* La base de données chiffrée (\`src/database/app.cllpdb\`), la logique applicative et l'interface graphique sont packagées ensemble dans un seul logiciel exécutable.
* Identifiants BDD root configurés : utilisateur **${dbUser}**.
* **\`lib/\`** : Bibliothèques du langage (.dll) en lecture seule.

---

## 🛠️ Commandes Disponibles

### 1. Lancer l'Application :
\`\`\`bash
llp app
# ou
llp run src/main.llp --gui
\`\`\`

### 2. Ouvrir le Visual UI Builder sur l'Interface :
\`\`\`bash
llp builder src/views/main.illp
\`\`\`
`;
    writeFile("README.md", projectReadme);
  }

  // C. Dossier build/
  const buildDir = path.join(targetDir, "build");
  if (!fs.existsSync(buildDir)) fs.mkdirSync(buildDir, { recursive: true });

  // D. Copie des 9 bibliothèques standard .dll en lecture seule dans lib/
  copyBaseLibraries(targetDir, filesCreated);

  return {
    success: true,
    architecture,
    filesCreated,
    message: `Projet '${projectName}' (${architecture === "client-server" ? "Client / Serveur Séparé" : "Monolithique Global"}) créé avec succès !`
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
    // Génère une bibliothèque .dll LLP binaire
    const dllBuf = buildLlpDllBinary(
      baseName.replace(/\.dll$/i, ""),
      `Bibliothèque développeur LLP : ${baseName}`,
      ["Init", "Execute", "Export"]
    );
    fs.writeFileSync(destPath, dllBuf);
  }

  // Appliquer le verrouillage lecture seule
  setFileReadOnly(destPath);

  // Nettoyer les fichiers non-.dll dans lib/
  cleanNonDllFilesFromLib(libDir);

  return {
    success: true,
    libFile: destPath,
    message: `Librairie '${baseName}' ajoutée avec succès dans lib/ en lecture seule.`
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
