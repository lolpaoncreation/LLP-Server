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
exports.getProjectInfo = getProjectInfo;
exports.createProjectStructure = createProjectStructure;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const child_process_1 = require("child_process");
const cllpdb_1 = require("../stdlib/cllpdb");
/**
 * Lit et analyse le fichier project.config pour déterminer l'architecture du projet.
 */
function getProjectInfo(projectDir) {
    const configFile = path.join(projectDir, "project.config");
    if (!fs.existsSync(configFile)) {
        return null;
    }
    const content = fs.readFileSync(configFile, "utf-8");
    const info = {
        architecture: "monolithic"
    };
    const lines = content.split(/\r?\n/);
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("name")) {
            const m = trimmed.match(/=\s*["']?([^"']+)["']?/);
            if (m)
                info.name = m[1].trim();
        }
        else if (trimmed.startsWith("architecture")) {
            const m = trimmed.match(/=\s*["']?([^"']+)["']?/);
            if (m) {
                const val = m[1].trim().toLowerCase();
                info.architecture = val === "client-server" || val === "cs" ? "client-server" : "monolithic";
            }
        }
        else if (trimmed.startsWith("client_entry")) {
            const m = trimmed.match(/=\s*["']?([^"']+)["']?/);
            if (m)
                info.clientEntry = m[1].trim();
        }
        else if (trimmed.startsWith("server_entry")) {
            const m = trimmed.match(/=\s*["']?([^"']+)["']?/);
            if (m)
                info.serverEntry = m[1].trim();
        }
        else if (trimmed.startsWith("entry")) {
            const m = trimmed.match(/=\s*["']?([^"']+)["']?/);
            if (m)
                info.entry = m[1].trim();
        }
        else if (trimmed.startsWith("project_key")) {
            const m = trimmed.match(/=\s*["']?([^"']+)["']?/);
            if (m)
                info.projectKey = m[1].trim();
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
function createProjectStructure(options) {
    const { targetDir, projectName, architecture = "client-server", isExample = false, author = process.env.USERNAME || "Developer" } = options;
    if (fs.existsSync(targetDir) && fs.readdirSync(targetDir).length > 0) {
        throw new Error(`Le dossier cible '${targetDir}' existe déjà et n'est pas vide.`);
    }
    fs.mkdirSync(targetDir, { recursive: true });
    const filesCreated = [];
    const uniqueKey = crypto.randomBytes(32).toString("hex");
    // Helper pour écrire des fichiers
    function writeFile(relPath, content) {
        const fullPath = path.join(targetDir, relPath);
        const parent = path.dirname(fullPath);
        if (!fs.existsSync(parent)) {
            fs.mkdirSync(parent, { recursive: true });
        }
        fs.writeFileSync(fullPath, content, "utf-8");
        filesCreated.push(relPath);
    }
    // Initialisation de la BDD cryptée
    function createSeedDatabase(dbRelPath) {
        const fullDbPath = path.join(targetDir, dbRelPath);
        const dbDir = path.dirname(fullDbPath);
        if (!fs.existsSync(dbDir))
            fs.mkdirSync(dbDir, { recursive: true });
        const db = new cllpdb_1.CryptedLolpaonDatabase(fullDbPath, uniqueKey);
        db.initializeNew("admin", "admin123");
        db.startSession("admin", "admin123");
        db.executeSql("CREATE TABLE users (id INT PRIMARY KEY, username VARCHAR, role VARCHAR);");
        db.executeSql('INSERT INTO users VALUES (1, "admin", "Administrator");');
        db.executeSql('INSERT INTO users VALUES (2, "developer", "DevOps Engineer");');
        db.executeSql('INSERT INTO users VALUES (3, "operator", "Field Operator");');
        db.executeSql("CREATE TABLE inventory (id INT PRIMARY KEY, name VARCHAR, price FLOAT, stock INT, status VARCHAR);");
        db.executeSql('INSERT INTO inventory VALUES (101, "Serveur Rack 1U Xeon", 1899.00, 8, "Actif");');
        db.executeSql('INSERT INTO inventory VALUES (102, "Switch Fibre 24 Ports", 540.50, 24, "Actif");');
        db.executeSql('INSERT INTO inventory VALUES (103, "Onduleur Smart-UPS 1500VA", 399.00, 15, "En attente");');
        db.executeSql('INSERT INTO inventory VALUES (104, "Module Transceiver SFP+", 89.90, 60, "Actif");');
        db.save();
        filesCreated.push(dbRelPath);
    }
    // Copie de l'icône/logo officielle du langage LLP
    function copyLogoAsset(relPath = "assets/logo.png") {
        const fullDest = path.join(targetDir, relPath);
        const parent = path.dirname(fullDest);
        if (!fs.existsSync(parent))
            fs.mkdirSync(parent, { recursive: true });
        const possibleSources = [
            path.join(__dirname, "../../assets/logo.png"),
            path.join(__dirname, "../assets/logo.png"),
            path.join(__dirname, "assets/logo.png"),
            path.resolve("assets/logo.png")
        ];
        for (const src of possibleSources) {
            if (fs.existsSync(src)) {
                fs.copyFileSync(src, fullDest);
                filesCreated.push(relPath);
                return;
            }
        }
    }
    // 1. ARCHITECTURE CLIENT / SERVEUR SÉPARÉ
    if (architecture === "client-server") {
        // A. project.config
        const configContent = `[project]
name = "${projectName}"
version = "1.0.0"
architecture = "client-server"
client_entry = "client/main.llp"
server_entry = "server/main.llp"
project_key = "${uniqueKey}"
author = "${author}"
description = "Projet LLP Architecture Client / Serveur Distant"
`;
        writeFile("project.config", configContent);
        // B. Dossier client/
        const clientMain = `// ===================================================
// Client Application - Point d'entrée exécutable client
// ===================================================
visibility: All

print("===================================================")
print("🚀 [LLP Client] Lancement du Client Réseau")
print("===================================================")

// 1. Vérification de l'empreinte matérielle locale anti-usurpation
var clientHwid = Device.GetHardwareID()
print("🔒 Empreinte Matérielle du Client:", clientHwid)

// 2. Initialisation de la liaison RPC transparente
var serverHost = "127.0.0.1"
var serverPort = 8080
print("🌐 Connexion au Serveur RPC:", serverHost, ":", serverPort)

// 3. Lancement de l'interface visuelle déclarative
print("🎨 Chargement de la vue client/views/main.illp...")
App.Launch(WindowSize: 1000 : 700, DevMode: False)
`;
        writeFile("client/main.llp", clientMain);
        const clientService = `// ===================================================
// Client Services - Appels RPC distants transparents
// ===================================================
visibility: All

// Récupération de la liste des sessions utilisateurs
function GetActiveSessions() then
    print("[RPC Client] Requête de la liste des sessions...")
    var sessions = RPC.Call("Users.List")
    return sessions
end

// Récupération du catalogue inventaire
function GetInventoryList() then
    print("[RPC Client] Requête de l'inventaire distant...")
    var items = RPC.Call("Inventory.GetList")
    return items
end

// Déplacement d'une tâche Kanban
function MoveTask(taskId, targetColumn) then
    print("[RPC Client] Déplacement tâche", taskId, "vers", targetColumn)
    var result = RPC.Call("Tasks.Move", taskId, targetColumn)
    return result
end
`;
        writeFile("client/services/api_client.llp", clientService);
        copyLogoAsset("assets/logo.png");
        copyLogoAsset("client/assets/logo.png");
        // Vues Client (.illp et .illps)
        const clientIllp = `// ===================================================
// LLP Interface - Client Dashboard
// ===================================================
visibility: All

Background "MainDashboard" responsive: true minWidth: "800px" maxWidth: "1200px" minHeight: "650px" {
    Card "HeaderCard" title: "LLP Client Dashboard" {
        Row "HeaderRow" {
            Image "AppLogo" src: "assets/logo.png"
            Text "AppHeader" content: "⚡ LLP Enterprise Dashboard (Client/Server Mode)"
            Text "BadgeHwid" content: "🔒 Device HWID Validated"
        }
    }

    Row "MainContentRow" {
        Card "SessionsCard" title: "Active User Sessions" {
            DataGrid "SessionsGrid" {
                columns: ["ID", "Username", "Role", "Status"]
                rpc: "Users.List"
                virtualScroll: true
            }
        }

        Card "InventoryCard" title: "Network Inventory" {
            DataGrid "InventoryGrid" {
                columns: ["ID", "Name", "Price", "Stock", "Status"]
                rpc: "Inventory.GetList"
                virtualScroll: true
            }
        }
    }

    Card "PipelineCard" title: "Task Pipeline (Live Kanban)" {
        Kanban "TaskKanban" {
            columns: ["Backlog", "In Progress", "Testing", "Completed"]
            rpcAction: "Tasks.Move"
        }
    }
}
`;
        writeFile("client/views/main.illp", clientIllp);
        const clientIllps = `/* ===================================================
   Style de l'interface client (.illps)
   =================================================== */
visibility: All

Background.MainDashboard {
    background: #0b0f19
    padding: 24px
    responsive: true
}

Card#HeaderCard {
    background: #111827
    borderRadius: 8px
    marginBottom: 16px
    padding: 14px
}

Text#AppHeader {
    color: #38bdf8
    fontSize: 18px
    font: bold
}

Text#BadgeHwid {
    color: #4ade80
    fontSize: 12px
    align: right
}

Card#SessionsCard, Card#InventoryCard, Card#PipelineCard {
    background: #111827
    borderRadius: 8px
    padding: 16px
    marginBottom: 16px
}
`;
        writeFile("client/views/main.illps", clientIllps);
        // C. Dossier server/
        const serverMain = `// ===================================================
// Dedicated Server - Point d'entrée backend & RPC
// ===================================================
visibility: All

print("===================================================")
print("🛡️ [LLP Server] Serveur Dédié avec Authentification")
print("===================================================")

var port = 8080
print("Ouverture du port d'écoute RPC:", port)

// 1. Connexion à la base de données sécurisée
var db = CLLPDB.Open("server/data/app.cllpdb")
db.StartSession("admin", "admin123")
print("✅ Base de données locale .cllpdb connectée avec succès.")

// 2. Enregistrement des services RPC accessibles aux clients
Server.RegisterRPC("Users", "List", function() then
    print("[RPC Server] Requête reçue: Users.List")
    return db.Query("SELECT * FROM users;")
end)

Server.RegisterRPC("Inventory", "GetList", function() then
    print("[RPC Server] Requête reçue: Inventory.GetList")
    return db.Query("SELECT * FROM inventory;")
end)

Server.RegisterRPC("Tasks", "Move", function(taskId, col) then
    print("[RPC Server] Requête reçue: Tasks.Move (ID:", taskId, "Col:", col, ")")
    return true
end)

// 3. Démarrage de l'écoute réseau
Server.Start(port)
print("🚀 Serveur prêt et en attente des connexions clientes sur le port", port)
`;
        writeFile("server/main.llp", serverMain);
        const serverService = `// ===================================================
// Server Services - Logique Métier & Contrôles
// ===================================================
visibility: All

function VerifyClientDevice(deviceId, token) then
    if deviceId == "" then
        return false
    end
    print("[Security] Validation de l'appareil client:", deviceId)
    return true
end
`;
        writeFile("server/services/data_service.llp", serverService);
        // Base de données server/data/app.cllpdb
        createSeedDatabase("server/data/app.cllpdb");
        // D. Shared / Protocole
        const sharedProtocol = `// ===================================================
// Protocol - Constantes et contrats partagés
// ===================================================
visibility: All

var RPC_PORT_DEFAULT = 8080
var RPC_STATUS_OK = 200
var RPC_STATUS_ERROR = 500

var ROLE_ADMIN = "Administrator"
var ROLE_OPERATOR = "Field Operator"
`;
        writeFile("shared/protocol.llp", sharedProtocol);
        // E. Readme du projet
        const projectReadme = `<p align="center">
  <img src="assets/logo.png" alt="LLP Logo" width="140" />
</p>

# 🚀 Projet LLP : ${projectName} (Architecture Client / Serveur Séparé)

Ce projet est structuré selon une architecture **Client / Serveur Distant** :
* **\`client/\`** : Code de l'application cliente, interfaces utilisateur (\`.illp\`, \`.illps\`) et contrôleurs RPC. Compile directement en **exécutable client** (\`${projectName}_Client.exe\`).
* **\`server/\`** : Scripts du serveur backend, gestion de la base de données chiffrée (\`.cllpdb\`) et exposition des méthodes RPC avec authentification matérielle.
* **\`shared/\`** : Contrats de communication, protocoles et constantes partagées.
* **\`lib/\`** : Bibliothèques standard LLP en lecture seule.

---

## 🛠️ Commandes Disponibles

### 1. Démarrer le Serveur Dédié :
\`\`\`bash
llp server server/main.llp --port 8080
# ou
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

### 4. Compiler l'Application Cliente en Exécutable Autonome :
\`\`\`bash
llp build --client
# Produit l'exécutable client dans dist_build/${projectName}_Client.exe
\`\`\`

### 5. Packager / Compiler le Serveur :
\`\`\`bash
llp build --server
# Produit le package serveur dans dist_build/${projectName}_Server.exe
\`\`\`
`;
        writeFile("README.md", projectReadme);
    }
    // 2. ARCHITECTURE MONOLITHIQUE / GLOBALE (TOUT-EN-UN)
    else {
        // A. project.config
        const configContent = `[project]
name = "${projectName}"
version = "1.0.0"
architecture = "monolithic"
entry = "src/main.llp"
project_key = "${uniqueKey}"
author = "${author}"
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
var db = CLLPDB.Open("src/database/app.cllpdb")
db.StartSession("admin", "admin123")
print("✅ Base de données locale .cllpdb initialisée.")

// 2. Enregistrement des services in-memory
RPC.Register("LocalData", "GetUsers", function() then
    return db.Query("SELECT * FROM users;")
end)

RPC.Register("LocalData", "GetInventory", function() then
    return db.Query("SELECT * FROM inventory;")
end)

// 3. Lancement de l'interface graphique embarquée
print("🎨 Chargement de l'interface src/views/main.illp...")
App.Launch(WindowSize: 1000 : 700, DevMode: False)
`;
        writeFile("src/main.llp", srcMain);
        const appService = `// ===================================================
// App Services - Logique interne du logiciel
// ===================================================
visibility: All

function LoadApplicationState() then
    print("[App Service] Chargement de l'état local du logiciel...")
    return true
end
`;
        writeFile("src/services/app_service.llp", appService);
        copyLogoAsset("assets/logo.png");
        // Vues src/views/
        const mainIllp = `// ===================================================
// LLP Interface - Monolithic Dashboard
// ===================================================
visibility: All

Background "MainDashboard" responsive: true minWidth: "800px" maxWidth: "1200px" minHeight: "650px" {
    Card "HeaderCard" title: "Logiciel Tout-en-Un Autonome" {
        Row "HeaderRow" {
            Image "AppLogo" src: "assets/logo.png"
            Text "AppHeader" content: "📦 ${projectName} - Application Autonome avec BDD Embarquée"
        }
    }

    Row "TablesRow" {
        Card "UsersCard" title: "Utilisateurs Locaux" {
            DataGrid "UsersGrid" {
                columns: ["ID", "Username", "Role"]
                rpc: "LocalData.GetUsers"
                virtualScroll: true
            }
        }

        Card "InventoryCard" title: "Catalogue Matériel" {
            DataGrid "InventoryGrid" {
                columns: ["ID", "Name", "Price", "Stock", "Status"]
                rpc: "LocalData.GetInventory"
                virtualScroll: true
            }
        }
    }
}
`;
        writeFile("src/views/main.illp", mainIllp);
        const mainIllps = `/* ===================================================
   Style de l'interface autonome (.illps)
   =================================================== */
visibility: All

Background.MainDashboard {
    background: #0b0f19
    padding: 24px
    responsive: true
}

Card#HeaderCard {
    background: #111827
    borderRadius: 8px
    marginBottom: 16px
    padding: 14px
}

Text#AppHeader {
    color: #38bdf8
    fontSize: 18px
    font: bold
}

Card#UsersCard, Card#InventoryCard {
    background: #111827
    borderRadius: 8px
    padding: 16px
    marginBottom: 16px
}
`;
        writeFile("src/views/main.illps", mainIllps);
        // Base de données embarquée src/database/app.cllpdb
        createSeedDatabase("src/database/app.cllpdb");
        // Readme
        const projectReadme = `<p align="center">
  <img src="assets/logo.png" alt="LLP Logo" width="140" />
</p>

# 🚀 Projet LLP : ${projectName} (Architecture Monolithique / Tout-en-Un)

Ce projet est structuré selon une architecture **Monolithique / Standalone** :
* La base de données chiffrée (\`src/database/app.cllpdb\`), la logique applicative et l'interface graphique sont **entièrement packagées et compilées ensemble** dans un seul logiciel exécutable.
* Ne nécessite aucun serveur externe pour fonctionner.

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

### 3. Compiler l'Exécutable Complet Tout-en-Un :
\`\`\`bash
llp build
# ou
llp compile src/main.llp --target exe
# Produit l'exécutable autonome dans dist_build/${projectName}.exe
\`\`\`
`;
        writeFile("README.md", projectReadme);
    }
    // C. Dossier build/
    const buildDir = path.join(targetDir, "build");
    if (!fs.existsSync(buildDir))
        fs.mkdirSync(buildDir, { recursive: true });
    // D. Copie des 9 bibliothèques standard en lecture seule dans lib/
    copyBaseLibraries(targetDir, filesCreated);
    return {
        success: true,
        architecture,
        filesCreated,
        message: `Projet '${projectName}' (${architecture === "client-server" ? "Client / Serveur Séparé" : "Monolithique Global"}) créé avec succès !`
    };
}
/**
 * Copie les 9 bibliothèques standard en lecture seule dans lib/
 */
function copyBaseLibraries(targetDir, filesCreated) {
    const libDir = path.join(targetDir, "lib");
    if (!fs.existsSync(libDir))
        fs.mkdirSync(libDir, { recursive: true });
    const sourceLibCandidates = [
        path.resolve(__dirname, "../../examples/product_management/lib"),
        path.resolve(__dirname, "../../../examples/product_management/lib"),
        path.resolve(__dirname, "../examples/product_management/lib")
    ];
    let sourceLibDir = "";
    for (const candidate of sourceLibCandidates) {
        if (fs.existsSync(candidate)) {
            sourceLibDir = candidate;
            break;
        }
    }
    const baseLibDefinitions = {
        "math.llp": `// ===================================================
// LLP Standard Library : Mathematics & Constants (Read-Only)
// ===================================================
// Math.Abs, Math.Floor, Math.Ceil, Math.Round, Math.Sqrt, Math.Pow, Math.Sin, Math.Cos...
`,
        "scillp.llp": `// ===================================================
// LLP Standard Library : SciLlp (SciPy Equivalent) (Read-Only)
// ===================================================
// - Integration, Optimization, Roots, Interpolation, Signal, Statistics
`,
        "symllp.llp": `// ===================================================
// LLP Standard Library : SymLlp (SymPy Equivalent) (Read-Only)
// ===================================================
// - Exact formal solving, derivatives, integrals, Taylor series
`,
        "probllp.llp": `// ===================================================
// LLP Standard Library : ProbLlp (Probability & Combinatorics) (Read-Only)
// ===================================================
// - Factorial, Permutations, Combinations, NormalPDF, Binomial, Poisson
`,
        "cllpdb.llp": `// ===================================================
// LLP Standard Library : CLLPDB (AES-256 Encrypted Database) (Read-Only)
// ===================================================
// - CLLPDB.Open, StartSession, Query, Execute
`,
        "sync.llp": `// ===================================================
// LLP Standard Library : DatabaseSync (Read-Only)
// ===================================================
// - DatabaseSync.ExportJson, ImportJson, SyncTables
`,
        "crypto.llp": `// ===================================================
// LLP Standard Library : Crypto (Unique Cryptography) (Read-Only)
// ===================================================
// - Crypto.GetProjectKey(), Crypto.Encrypt, Crypto.Decrypt, Crypto.Sha256
`,
        "network.llp": `// ===================================================
// LLP Standard Library : Network (Client & Server) (Read-Only)
// ===================================================
// - Network.Get, Network.Post, Server.CreateServer, Client.Connect
`,
        "validator.llp": `// ===================================================
// LLP Standard Library : UIValidator (Client Validation) (Read-Only)
// ===================================================
// - UIValidator.ValidateRequired, ValidateEmail, ValidateNumber
`
    };
    for (const [libName, defaultContent] of Object.entries(baseLibDefinitions)) {
        const destFile = path.join(libDir, libName);
        if (sourceLibDir && fs.existsSync(path.join(sourceLibDir, libName))) {
            fs.copyFileSync(path.join(sourceLibDir, libName), destFile);
        }
        else {
            fs.writeFileSync(destFile, defaultContent, "utf-8");
        }
        try {
            fs.chmodSync(destFile, 0o444);
            if (process.platform === "win32") {
                (0, child_process_1.execSync)(`attrib +r "${destFile}"`);
            }
        }
        catch (e) { }
        filesCreated.push(`lib/${libName}`);
    }
}
