<p align="center">
  <img src="assets/logo.png" alt="LLP Logo - lolpaon" width="180" />
</p>

# 🚀 LLP Programming Language (lolpaon) • Extension v1.4.3

[![Version](https://img.shields.io/badge/VSIX-v1.4.3-blue.svg)](https://github.com/lolpaoncreation/LLP-Server)
[![Language](https://img.shields.io/badge/Language-LLP%20%28lolpaon%29-cyan.svg)](https://github.com/lolpaoncreation/LLP-Server)
[![Platform](https://img.shields.io/badge/Platform-VS%20Code%20%7C%20Linux%20%7C%20Windows-green.svg)](https://github.com/lolpaoncreation/LLP-Server)

Welcome to the official VS Code extension for the **LLP** programming language (*lolpaon language*), an ecosystem engineered to combine simplicity, power, hierarchical object architecture (Parent-Child Instance Tree), drag-and-drop declarative visual UI design (`.illp`), encrypted database storage (`.cllpdb`), and lightning-fast Linux server deployment.

---

## 🌟 What's New in Version 1.4.3

* 🦚 **Official Peacock Emblem & Branding Everywhere (*lolpaon*)**:
  * New official peacock icon registered in `package.json` and visible in the VS Code Extensions marketplace and sidebar.
  * High-definition logo rendered in the header of the **Interactive Multilingual Documentation** (`docsWebview.js`).
  * Official peacock emblem and window favicon integrated into the **Visual UI Builder** (`uiBuilderWebview.js`).
  * Embedded Base64 Data URI ensuring 100% reliable rendering without local broken file paths or CSP issues.
* 🌐 **Dedicated Linux Server Integration (`LLP-Server`)**:
  * Native compatibility with the official server repository: **[https://github.com/lolpaoncreation/LLP-Server.git](https://github.com/lolpaoncreation/LLP-Server.git)**.
  * 1-liner automated deployment script for Linux VPS:
    ```bash
    curl -fsSL https://raw.githubusercontent.com/lolpaoncreation/LLP-Server/main/install-vps.sh | sudo bash
    ```
  * Automated **Systemd** background service (`llp-server.service`) for 24/7 uptime with auto-restart on reboot.
  * Production-grade **Nginx reverse proxy** template (`nginx-llp.conf`) with WebSockets & SSL.
  * Containerized deployment with **Docker** & **Docker Compose** (`Dockerfile` & `docker-compose.yml`).
* 📦 **Project Generators with Pre-configured Assets**:
  * `LLP: Create New Empty Project` and `LLP: Create Example Project` now automatically provision `assets/logo.png`.
  * UI view templates (`client/views/main.illp` and `src/views/main.illp`) feature the declarative `Image "AppLogo" src: "assets/logo.png"` component out-of-the-box.

---

## 📑 Table of Contents
1. [Architecture & File Extensions](#-architecture--file-extensions)
2. [Visibility System & File Hierarchy](#-visibility-system--file-hierarchy)
3. [Comment Syntax & Embedded Executable Code](#-comment-syntax--embedded-executable-code)
4. [Types & Variables](#-types--variables)
5. [Logical & Mathematical Operators](#-logical--mathematical-operators)
6. [Control Structures (then ... end)](#-control-structures-then--end)
7. [Parent-Child Architecture (Instance Tree)](#-parent-child-architecture-instance-tree)
8. [GUI Interface Creation (.illp & .illps)](#-gui-interface-creation-illp--illps)
9. [Standard Libraries (StdLib)](#-standard-libraries-stdlib)
10. [Encrypted Database System (.cllpdb)](#-encrypted-database-system-cllpdb)
11. [CLI Commands & Tooling](#-cli-commands--tooling)
12. [Linux VPS / Dedicated Server Deployment (LLP-Server)](#-linux-vps--dedicated-server-deployment-llp-server)
13. [VS Code Extension Features](#-vs-code-extension-features)
14. [Release History (Changelog)](#-release-history-changelog)

---

## 📂 Architecture & File Extensions

The LLP ecosystem relies on specialized file formats:

| Extension | Full Name | Purpose & Behavior |
| :--- | :--- | :--- |
| **`.llp`** *(or `.lolpaon`)* | **LLP Script** | Business logic, backend routines, CLI tools, system algorithms, and event handling. |
| **`.cllp`** | **Class lolpaon** | Pure class file. **Contains strictly one class**, which must share the exact same name as the file. |
| **`.illp`** | **Interface lolpaon** | Declarative user interface markup in nested component blocks (WYSIWYG layout without manual coordinates). |
| **`.illps`** | **Interface lolpaon Style** | Dedicated styling sheet for UI elements (margins, fonts, colors, border-radius) synchronized live. |
| **`.cllpdb`** | **Crypted lolpaon Database** | Local database file encrypted with AES-256 and secure session management. |

---

## 🔒 Visibility System & File Hierarchy

All files (`.llp`, `.illp`, `.illps`) specify their access scope on the very first line:

```llp
visibility: All
```

### Available Visibility Levels:
* **`visibility: All`** : Completely public and accessible across the entire project.
* **`visibility: Package`** : Visible only to other files residing within the same directory/package.
* **`visibility: Parent`** : Accessible by the parent folder and all of its subdirectories.
* **`visibility: Private`** : Strictly isolated; completely inaccessible to external files.

---

## 💬 Comment Syntax & Embedded Executable Code

### 1. Single-line Comment: `/-`
```llp
/- This is a single-line comment
int score = 100
```

### 2. Multi-line Block Comment: `/* ... *\`
```llp
/*
   This comment block can span
   freely across multiple lines.
*\
```

### 3. Inline Comment with Embedded Executable Code: `/- ... { code } \`
Annotate your code while maintaining an active inline statement:
```llp
/- Initialize secret token { Global secretToken = 999 } end of note \
print("Active token:", secretToken) /- Prints 999
```
> 💡 **Dynamic Highlighting:** In VS Code, comment text remains subtly dimmed, whereas statements inside `{ ... }` are instantly highlighted in full syntax colors!

---

## 🧱 Types & Variables

LLP seamlessly blends dynamic typing via `General` (or its alias `Global`) with strict static typing:

```llp
General projectName = "Lolpaon Studio" /- Dynamic (can be reassigned to any type)
Global counter = 0                     /- Alias of General
string author = "lolpaon"              /- Strict string
int year = 2026                        /- Strict integer
float version = 1.4                    /- Strict float
bool isActive = true                   /- Strict boolean
```

### Resizable Lists and Fixed-Size Arrays:
```llp
/- Dynamic resizable list \
General modules = General{"Database", "Network", "UI"}
modules.Add("Security")

/- Fixed-size array \
General memory = General[3]{"BlockA", "BlockB", "BlockC"}
```

---

## ⚙️ Logical & Mathematical Operators

* **Arithmetic** : `+`, `-`, `*`, `/`, `%`
* **Comparison** : `==`, `!=`, `<`, `<=`, `>`, `>=`
* **Logical** : `and`, `or`, `not`

```llp
if userAge >= 18 and isActive then
    print("Access granted.")
end
```

---

## 🔁 Control Structures (then ... end)

No mandatory curly braces for control structures:

```llp
/- If-Else condition \
if score > 90 then
    print("Excellent work")
else
    print("Passed")
end

/- While loop \
int i = 0
while i < 5 then
    print("Iteration:", i)
    i = i + 1
end

/- For ... In loop \
for item in modules then
    print("Loaded module:", item)
end
```

---

## 🌲 Parent-Child Architecture (Instance Tree)

Inspired by modern game engines and hierarchical object systems, LLP unifies all software components under a single Parent-Child tree:

```llp
var appRoot = Instance.new("Folder")
appRoot.Name = "MainApplication"

var dataService = Instance.new("Folder")
dataService.Name = "DataService"
dataService.Parent = appRoot

var tableUsers = Instance.new("Configuration")
tableUsers.Name = "UsersTable"
tableUsers.Parent = dataService

var target = appRoot.FindFirstChild("DataService")
print("Found service:", target.Name)
```

---

## 🎨 GUI Interface Creation (.illp & .illps)

### Interface Declaration (`main.illp`):
```illp
visibility: All

Background "MainWindow" responsive: true minWidth: "800px" maxWidth: "1200px" minHeight: "650px" {
    Card "HeaderCard" title: "LLP Dashboard" {
        Row "HeaderRow" {
            Image "OfficialLogo" src: "assets/logo.png"
            Text "AppTitle" content: "⚡ Lolpaon Pro Application"
        }
    }

    Row "ContentRow" {
        Card "UsersCard" title: "Active Sessions" {
            DataGrid "UsersGrid" {
                columns: ["ID", "Username", "Role"]
                rpc: "Users.List"
            }
        }
    }
}
```

### Styling Sheet (`main.illps`):
```illps
visibility: All

Background.MainWindow {
    background: #0b0f19
    padding: 24px
    responsive: true
}

Card#HeaderCard {
    background: #111827
    borderRadius: 12px
    padding: 16px
    marginBottom: 16px
}

Text#AppTitle {
    color: #38bdf8
    fontSize: 20px
    font: bold
}
```

---

## 📚 Standard Libraries (StdLib)

LLP bundles 9 built-in standard libraries:

1. **`Math`** : Mathematical functions, universal constants (`PY`, `E`), trigonometry, and rounding.
2. **`SciLlp`** : Scientific computing (means, standard deviations, moving averages, convolution, FFT).
3. **`SymLlp`** : Symbolic mathematics (formal differentiation, polynomial simplification, factorization).
4. **`ProbLlp`** : Probability and statistics (Gaussian, Poisson, binomial distributions, cryptographic random sampling).
5. **`Device`** : Hardware anti-spoofing fingerprinting (HWID) and Ed25519 signing.
6. **`Session`** : PHP-style secure session management for backend servers and client apps.
7. **`CLLPDB`** : High-performance encrypted database engine with table relational storage.
8. **`File`** : Complete filesystem I/O operations (file reading, writing, directories, metadata).
9. **`Network` & `Server`** : High-performance HTTP/RPC server with Concurrency Orchestrator load balancing.

---

## 🗄️ Encrypted Database System (.cllpdb)

* **Creation via VS Code**: `Ctrl + Shift + P` ➔ **`LLP: Create Encrypted Database (.cllpdb)`**.
* **AES-256 Encryption & PBKDF2**: Bound to the project key stored in `project.config`.
* **Configurable Session Lifetime**: Indefinite / permanent by default in code (`db.StartSession("admin", "password")`), or with custom expiration timeouts.
* **Integrated Visual Editor**: Double-click any `.cllpdb` file in the VS Code explorer to open the interactive database manager with an SQL query console, table browser, and record insertion tools!

---

## 💻 CLI Commands & Tooling

```bash
# Run an LLP script
llp run script.llp

# Launch dedicated backend server
llp server server.llp --port 8080

# Launch interactive GUI application
llp app

# Open the Visual UI Builder
llp builder client/views/main.illp

# Statically analyze and lint code
llp check script.llp

# Build standalone executables
llp build --client
llp build --server
llp build
```

---

## 🌐 Linux VPS / Dedicated Server Deployment (LLP-Server)

Official Server Repository: **[https://github.com/lolpaoncreation/LLP-Server.git](https://github.com/lolpaoncreation/LLP-Server.git)**

### 1-Liner Automated SSH Command:
```bash
curl -fsSL https://raw.githubusercontent.com/lolpaoncreation/LLP-Server/main/install-vps.sh | sudo bash
```

The script automatically detects your Linux distribution (Ubuntu, Debian, CentOS, RHEL, Arch), installs Node.js 20 LTS, builds LLP, configures `/var/www/llp-server/server.llp`, opens firewall ports, and sets up a 24/7 **Systemd service** (`llp-server.service`).

---

## 🛠️ VS Code Extension Features

* **🎨 WYSIWYG Visual Designer**: Live drag-and-drop preview and instant visual editing for `.illp` interfaces and `.illps` stylesheets.
* **🌍 Multilingual Interactive Documentation**:
  * Universal **English** by default, with instant on-the-fly switching between **English**, **French** (*Français*), **Spanish** (*Español*), and **German** (*Deutsch*).
  * Accessible via `Ctrl + Shift + P` ➔ **`LLP: Open Interactive Documentation`** or by right-clicking any keyword ➔ **`LLP: Open Documentation for Keyword`**.
* **🗄️ Custom Editor for `.cllpdb`**: Click any encrypted database file in the file explorer to open the visual manager with SQL execution and table viewing.
* **⚡ Autocomplete & Real-Time Diagnostics**:
  * Real-time semantic syntax error detection and hierarchy validation.
  * Comprehensive code snippets (`vis-all`, `ifthen`, `forend`, `ui-illp`, `ui-illps`, `cllpdb-open`).
* **📦 Project Generators**:
  * `LLP: Create New Empty Project` (choose between Client/Server or Monolithic architecture).
  * `LLP: Create Example Project (Product Management)`.

---

## 📜 Release History (Changelog)

| Version | Date | Highlights & Changes |
| :--- | :--- | :--- |
| **`v1.4.3`** | **Latest** | **Official Release v1.4.3** with refined documentation, official Peacock emblem branding, and streamlined VSIX distribution. |
| **`v1.4.2`** | Previous | Official Peacock Emblem (*lolpaon*) everywhere, native integration with dedicated server repository `LLP-Server` with 1-liner Linux VPS installer, Systemd daemon, Nginx proxy, and Docker containerization. |
| **`v1.4.1`** | Previous | Header logo integration in documentation and UI Builder webviews. |
| **`v1.4.0`** | Previous | Multilingual documentation in 4 languages (EN, FR, ES, DE) with live switching. Client/Server vs Monolithic architectural separation. |
| **`v1.3.0`** | Previous | App Lifecycle Controller (`App.Launch`, `App.Lock`, `App.Silence`, `App.Close`). |
| **`v1.2.0`** | Previous | 9 read-only standard libraries and encrypted `.cllpdb` database manager. |
| **`v1.1.0`** | Previous | Static AST syntax analyzer and context-aware autocomplete engine. |
| **`v1.0.0`** | Initial | Initial release featuring TextMate syntax highlighting, language configuration, and snippets. |

---

<p align="center">
  <b>LLP Ecosystem (lolpaon) • Engineered for modern, clean, and powerful software development.</b>
</p>
