<p align="center">
  <img src="assets/logo.png" alt="LLP Logo - lolpaon" width="180" />
</p>

# 🚀 LLP Programming Language (lolpaon)

Welcome to the official documentation for the **LLP** programming language (*lolpaon language*), an ecosystem engineered to combine simplicity, power, hierarchical object architecture (Parent-Child Instance Tree), visual drag-and-drop UI design, and built-in database/mathematics libraries.

> 📘 **Guides & Références Officielles :**
> - 🌐 **[Dépôt Serveur Officiel (LLP-Server)](https://github.com/lolpaoncreation/LLP-Server.git)** : Sources et déploiement serveur Linux / VPS.
> - 🚀 **[Guide Déploiement Serveur Web (VPS) & Extension VS Code](install/GUIDE_INSTALLATION_SERVEUR_ET_EXTENSION.md)** : Commande 1-ligne pour VPS et guide d'installation `.vsix`.
> - 🏗️ **[Manuel d'Architecture Technique Complète](install/MANUEL_ARCHITECTURE_TECHNIQUE_LLP.md)** : Spécifications complètes pour réimplémenter le langage de A à Z.

---

## 📑 Table of Contents
1. [🌟 The Two Flagship Superpowers of LLP](#-the-two-flagship-superpowers-of-llp)
2. [Architecture & File Extensions (.llp, .cllp, .illp, .illps, .cllpdb)](#-architecture--file-extensions)
3. [Visibility System & File Hierarchy](#-visibility-system--file-hierarchy)
4. [Comment Syntax & Embedded Executable Code](#-comment-syntax--embedded-executable-code)
5. [Types & Variables](#-types--variables)
6. [Logical & Mathematical Operators](#-logical--mathematical-operators)
7. [Control Structures (then ... end)](#-control-structures-then--end)
8. [Functions: Parameters vs Function Modules (module DevMode & Random Encryption)](#-functions-parameters-vs-function-modules)
9. [Classes (.cllp), Namespaces & Hierarchical ToString()](#-classes-cllp-namespaces--hierarchical-tostring)
10. [Parent-Child Architecture: Client / Server Tree (Superpower 1)](#-parent-child-architecture-client--server-tree)
11. [The Concurrency Orchestrator: Le Chef d'Orchestre (Superpower 2)](#-the-concurrency-orchestrator-le-chef-dorchestre)
12. [GUI Interface Creation (.illp & .illps)](#-gui-interface-creation-illp--illps)
13. [Standard Libraries (StdLib)](#-standard-libraries-stdlib)
   - *SciLlp, SymLlp, ProbLlp, File, Database*
   - *Session (PHP-style), Device (Anti-Spoofing), Client & Server*
14. [Encrypted Database System (.cllpdb)](#-encrypted-database-system-cllpdb)
15. [Static Code Analyzer & Pre-Flight Error Explainer](#-static-code-analyzer--pre-flight-error-explainer)
16. [CLI Commands & Tooling (llp check, server, run, build)](#-cli-commands--tooling)
17. [VS Code Extension](#-vs-code-extension)

---

## 🌟 The Two Flagship Superpowers of LLP

The LLP architecture was designed from the ground up to solve the two biggest headaches in modern software engineering: fragmented client/server communication and asynchronous multi-task congestion.

### 1. 🌲 Dev Client / Serveur Parent-Enfant (Unified Hierarchy)
Instead of forcing developers to juggle disparate mental models (HTML DOM for UI, raw sockets/HTTP for networking, relational tables for storage), **LLP unifies everything under a single hierarchical Parent-Child Tree (`Instance.new`)**:
* **Universal Tree Representation**: UI containers, backend microservices, connected client sessions, and database collections are all nodes in the same tree.
* **Automatic Event Propagation**: Actions, notifications, and security policies cascade effortlessly down the ancestral chain from root to child nodes.
* **Clean Code & High Maintainability**: Resolving dependencies or dispatching signals is as straightforward as `parent.FindFirstChild("Storage")`.

### 2. 🎼 Le Chef d'Orchestre (Smart Concurrency & Multi-Task Load Balancer)
Managing multi-threading, asynchronous I/O, and high-frequency real-time events is notoriously complex in traditional languages. In LLP, the runtime incorporates a built-in **Chef d'Orchestre** (Intelligent Concurrency Orchestrator):
* **Adaptive Load Balancing**: When a server or local application is overwhelmed with thousands of concurrent requests, the Chef d'Orchestre automatically splits, batches, and prioritizes operations.
* **Zero UI Freezes**: Fast networking packets and UI interaction events receive immediate top-priority dispatching, while heavy numeric computing and database transactions are distributed smoothly across background runtime ticks.
* **Anti-Saturation Shield**: The application remains smooth, responsive, and ultra-optimized even under peak stress.

---

## 📂 Architecture & File Extensions

The LLP ecosystem relies on distinct, specialized file formats:

| Extension | Full Name | Purpose & Behavior |
| :--- | :--- | :--- |
| **`.llp`** *(or `.lolpaon`)* | **LLP Script** | Business logic, algorithms, data processing, backend routines, and system operations. |
| **`.cllp`** | **Class lolpaon** | Dedicated class file. **Contains only one class**, which must strictly share the exact same name as the file (e.g. `Player.cllp` contains `class Player`). |
| **`.illp`** | **Interface lolpaon** | Visual declaration of software user interfaces. **No layout positioning code needed**: built for drag-and-drop (WYSIWYG) with toggleable responsive design. |
| **`.illps`** | **Interface lolpaon Style** | Dedicated styling sheet for UI elements (margins, fonts, colors, border radiuses). **Integrated directly in real-time within the `.illp` designer** without running scripts. |
| **`.cllpdb`** | **Crypted lolpaon Database** | Encrypted SQLite/MySQL-like database file with 2-minute secure session timeouts, AES encryption, and administrative protection. |

---

## 🔒 Visibility System & File Hierarchy

All files (`.llp`, `.illp`, `.illps`) define their visibility level on the very first line:

```llp
visibility: All
```

### Available Visibility Levels:

* **`visibility: All`** : Completely public and accessible by all scripts across the entire project, regardless of folder depth.
* **`visibility: Package`** : Visible only to other files residing in the same directory/package.
* **`visibility: Parent`** : Visible to the parent folder and all of its descendant subfolders.
* **`visibility: Private`** : Strictly isolated; inaccessible to external files.

Each file dynamically resolves accessible components by computing directory paths against declared visibility directives.

---

## 💬 Comment Syntax & Embedded Executable Code

LLP provides three distinct forms of comments:

### 1. Single-line Comment: `/-`
```llp
/- This is a single-line comment
int score = 100
```

### 2. Multi-line Block Comment: `/* ... *\`
```llp
/*
   This comment block can span
   across multiple lines freely.
*\
```
*(Standard `/* ... */` and `//` syntaxes are also supported).*

### 3. Inline Comment with Embedded Executable Code: `/- ... { code } \`
Allows embedding notes and annotations while keeping an active executable statement inline.
Code placed between `{ ... }` displays with **full syntax highlighting** (keywords, types, variables, values) and is directly executed by the compiler runtime:
```llp
/- Important initialization inside comment { Global secretToken = 999 } end of note \
print("Active token:", secretToken) /- Prints 999
```
> 💡 **Dynamic Highlighting:** In VS Code, comment text remains subtly dimmed in comment grey/green, whereas statements inside `{ ... }` are instantly highlighted in vibrant code colors!

---

## 🧱 Types & Variables

LLP supports dynamic typing via `General` (or its alias `Global`), as well as strict static typing.

### Simple Variables
```llp
General projectName = "Lolpaon Studio" /- Dynamic type
Global counter = 0                     /- Alias of General
string author = "lolpaon"              /- String
int year = 2026                        /- Integer
float version = 1.5                    /- Floating-point number
bool isActive = true                   /- Boolean (true / false / null)
```

### Universal Constants
Constants declared with `visibility: All` (such as `PY` or `PI`) are universally accessible across all user scripts and modules:
```llp
print("Value of PI:", PI)
print("SciPy/Python constant PY:", PY)
```

### Dynamic Sized Lists: `General{}`
```llp
General modules = General{"Network", "Database"}
modules.Add("Graphics")              /- Appends an item
modules.Remove(0)                    /- Removes item at index 0
print("Length:", modules.Length())   /- 2
```

### Fixed-Capacity Arrays: `General[N]{}`
Prevents buffer overflows and unintended memory expansion at runtime:
```llp
General slots = General[3]{"Slot1", "Slot2", "Slot3"}
print("Max capacity:", slots.MaxLength()) /- 3
/- slots.Add() or exceeding 3 items triggers a memory guard error
```

---

## ⚡ Logical & Mathematical Operators

For complex boolean logic and conditionals, LLP offers clean and expressive operators:

| Operator | Meaning | Example |
| :---: | :---: | :--- |
| **`&`** | **AND** | `if (age >= 18) & (hasAccess == true) then` |
| **`\|`** | **OR** | `if (role == "Admin") \| (role == "Dev") then` |
| **`&\|`** | **EXCLUSIVE OR** (XOR) | `if (optionA == true) &\| (optionB == true) then` |
| **`==`** / **`!=`** | Equality / Inequality | `if username != null then` |
| **`<`**, **`<=`**, **`>`**, **`>=`** | Comparisons | `if amount <= limit then` |
| **`+`**, **`-`**, **`*`**, **`/`**, **`%`** | Arithmetic | `int total = a * b + 10` |

---

## 🔁 Control Structures (then ... end)

Say goodbye to cluttered braces! Conditional blocks and loops use intuitive `then ... end` syntax:

### 1. Condition: `if ... then ... else ... end`
```llp
General storage = system.FindFirstChild("Storage")

if storage != null then
    print("Success: 'Storage' service is available!")
else
    print("Warning: Service not found.")
end
```

### 2. Nested Conditions: `else if`
```llp
if level == 1 then
    print("Beginner")
else if level == 2 then
    print("Intermediate")
else
    print("Expert")
end
```

### 3. Loop: `for ... in ... end`
```llp
for item in serviceList.GetChildren() then
    print("Detected service:", item.Name)
end
```

### 4. Loop: `while ... then ... end`
```llp
int countdown = 5
while countdown > 0 then
    print("T-", countdown)
    countdown = countdown - 1
end
```

---

## ⚙️ Functions: Parameters vs Function Modules

In LLP, **Function Parameters** and **Function Modules** (`module ... then ... end`) are two distinct concepts designed for different purposes:

| Concept | Purpose & Scope | Example Usage |
| :--- | :--- | :--- |
| **Parameters** | Raw data inputs passed into the function for mathematical calculations, processing, or routine execution. | `Launch(appName, port)` |
| **Function Modules** | Self-contained, conditional feature blocks embedded directly inside the function (e.g. `DevMode`). **The function already contains the module logic.** The caller merely decides whether to activate it or restrict what it can modify. | `Launch("MyApp", 8080, DevMode: True)` |

### 1. Declaring Function Modules (`module NomModule then ... end`)
A function declares its standard parameters and embeds specialized modules (like a full-featured developer mode):

```llp
visibility: All

function Launch(appName, port) then
    /- 1. Parameters are processed by standard function logic
    print("Standard startup of:", appName, "on port:", port)

    /- 2. Function Module: The function already knows all its DevMode logic!
    /- It only runs if the caller explicitly enables it upon invocation.
    module DevMode then
        print("🔧 [DevMode ACTIVATED]")
        print("  -> Full developer rights granted for testing and security checks")
        print("  -> Account management interface & live server payload inspector online")

        /- Fine-grained rights inspection: developers configure what DevMode may touch
        if DevMode.canBypassSecurity == True then
            print("  [!] Security bypass enabled for test session")
        else
            print("  [*] Security safeguards kept active during testing")
        end

        if DevMode.inspectServerData == True then
            print("  [*] Live server/client network inspector ACTIVE")
        end
    end

    print("Application successfully initialized.")
end
```

### 2. Calling Functions with Modules

```llp
/- A. Standard Call (DevMode remains completely inactive and bypassed)
Launch("LolpaonStudio", 8080)

/- B. Fast Activation with Full Access
Launch("LolpaonStudio", 8080, DevMode: True)

/- C. Fine-Grained Permissions (Configuring what the Dev Mode can modify or inspect)
General devConfig = Instance.new("DevConfig")
devConfig.canBypassSecurity = False
devConfig.canInspectServerData = True

Launch("LolpaonStudio", 8080, DevMode: devConfig)
```

### 3. Random Memory Encryption & Anti-Tamper Sealing for Modules
To ensure total security and prevent unauthorized memory tampering:
* **Hermetic Sealing**: If the author of a function did not explicitly expose a configuration field or method allowing the caller to alter the internal module's state, **that module's memory is sealed and encrypted with a randomized ephemeral cryptographic key at runtime**.
* **Anti-Injection Protection**: An external caller or rogue script cannot force modification or exploit unexposed module variables: without authorized interfaces designed by the developer, the module remains completely unalterable, encrypted, and safely isolated in memory.

---

## 🏛️ Classes (.cllp), Namespaces & Hierarchical ToString()

LLP provides first-class object-oriented programming via dedicated `.cllp` files, namespace packages, and automatic hierarchical string representation.

### 1. Dedicated Class Files: `.cllp` (*Class Lolpaon*)
* Every `.cllp` file is dedicated to a **single class**.
* The class **must strictly share the exact same name as the file** (e.g. `Player.cllp` must declare `class Player`).
* The LLP static code analyzer enforces this rule prior to execution:

```llp
/- File: Player.cllp
visibility: All

class Player then
    string Name = "PlayerOne"
    int Health = 100
    int Level = 1

    function TakeDamage(amount) then
        Health = Health - amount
        print(Name, "took", amount, "damage. Health left:", Health)
    end
end
```

### 2. Automatic Hierarchical `ToString()`
All classes and instances in LLP inherit a hierarchical `ToString()` method by default:
* It computes and displays the full ancestral parent chain, tracing backwards from the root parent down to the instance, while including the source file (`.cllp` or `.llp`).
* Calling `print(myObject)` automatically invokes this hierarchical path:

```llp
General gameRoot = Instance.new("Game")
gameRoot.Name = "MonJeu"

General zone = Instance.new("World", gameRoot)
zone.Name = "RoyaumeDuNord"

General hero = Player.new(zone)
hero.Name = "RoiArthur"

/- Prints: [Player.cllp > MonJeu > RoyaumeDuNord > RoiArthur]
print(hero)
print(hero.ToString())
```

### 3. Class Packages: `namespace then ... end`
Use `namespace then ... end` to group related classes together and declare shared package-level global variables:

```llp
namespace GameEngine then
    /- Shared package variables accessible to all classes in the namespace
    int MaxEntities = 5000
    string Version = "2.4.0"

    class PhysicsEngine then
        int Gravity = -10
        string Name = "MoteurPhysique"
    end

    class AudioEngine then
        int MasterVolume = 100
        string Name = "MoteurAudio"
    end
end

/- Access package variables:
print("Engine Version:", GameEngine.Version)

/- Instantiate classes packaged inside the namespace:
General physics = GameEngine.PhysicsEngine.new(rootNode)
print(physics) /- [mon_fichier.llp > rootNode > MoteurPhysique]
```

---

## 🌳 Parent-Child Architecture: Client / Server Tree (Superpower 1)

Inspired by hierarchical object models (like Roblox instance trees or the DOM), any entity in LLP—whether a client UI card, a server database service, or a connected network socket—can be organized as a parent or child of another instance via `Instance.new`. This creates an unbroken, unified mental model across both client and server development.

```llp
/- Create root node
General root = Instance.new("AppSystem")
root.Name = "LolpaonApplication"

/- Create child container attached directly to root
General servicesFolder = Instance.new("Folder", root)
servicesFolder.Name = "Services"

/- Create child services attached to folder
General authService = Instance.new("AuthService", servicesFolder)
authService.Name = "Auth"

General dataService = Instance.new("DatabaseService", servicesFolder)
dataService.Name = "Storage"
```

### Instance Methods:
* **`node.GetChildren()`** : Returns a `General{}` list of all direct child instances.
* **`node.FindFirstChild(name)`** : Searches and returns the first child with this name (or `null`).
* **`node.Name`** : Node name property.
* **`node.ClassName`** : Class type of the instance.
* **`node.Parent`** : Reference to the parent instance.

---

## 🎼 The Concurrency Orchestrator: Le Chef d'Orchestre

Under extreme loads or intense multi-task workflows, standard event loops or thread pools in other environments often degrade, resulting in UI stutter, dropped connections, or thread exhaustion.

In LLP, the **Chef d'Orchestre** acts as the runtime's intelligent conductor for all asynchronous and concurrent execution:
* **Separation of Concerns & Prioritization**: Operations are segregated into dedicated runtime priority buckets:
  1. **Interactive & UI Layer**: User clicks, keyboard input, and UI redraw events maintain absolute top priority (zero lag).
  2. **Network & RPC I/O**: Client-Server packet transmissions, signed frame exchanges, and push events are dispatched through non-blocking asynchronous pipes.
  3. **Heavy Computation & Database Writes**: Large mathematical optimizations (`SciLlp`, `SymLlp`), file I/O, and database commits are batched and processed smoothly across background scheduler ticks.
* **Automatic Throttling & Flood Control**: Even when an application or backend is inundated with thousands of incoming requests, the Chef d'Orchestre dynamically balances the load to prevent system starvation and bottlenecks.
* **Direct Script API**:
  ```llp
  /- Dispatch a background task to the orchestrator with priority
  Orchestrator.Dispatch(func() {
      /- Heavy background work
      print("Task processed by Chef d'Orchestre without freezing the main application")
  }, "Background")

  /- Query live orchestrator queue metrics
  General stats = Orchestrator.GetQueueStats()
  print("Active tasks:", stats.ActiveCount, "Pending:", stats.PendingCount)
  ```

---

## 🎨 GUI Interface Creation (.illp & .illps)

### 1. `.illp` Files & The Visual UI Builder
In `.illp` files, **you don't write manual coordinate layout code**: the interface is designed visually via **drag-and-drop** with **responsive layout options**.

> **LLP UI Builder**: Run `llp builder <file.illp>` or open any `.illp` in VS Code.
> - **Move & Reorganize Existing Elements**: Drag any existing component to reorder it or nest it inside another container (Card, Stack, Grid).
> - **In-Place Live Editing**: Double-click text to edit labels and titles inline; select any component to modify dimensions, alignments, paddings, and colors.
> - **RPC Data Binding**: Bind DataGrid, Kanban, and Forms directly to server methods (`server.Users.list`) with auto-pagination and virtual scrolling.
> - **Device Identity Bar**: Live hardware fingerprint verification (`Secured Device ID`) and encrypted client-server RPC status check.

#### Available Components:
* **`Background`** : Canvas and root window container. Supports `responsive: true | false`, `minWidth`, `maxWidth`, `minHeight`, `maxHeight`.
* **`Card`** : Structured card container with a custom title bar and nested slot.
* **`Grid`** : Multi-column grid container (`columns: 1 | 2 | 3 | 4`).
* **`Row`** : Horizontal side-by-side flex layout container.
* **`TextInput`** : Text input box for credentials and forms.
* **`Text`** : Labels, headers, and descriptions.
* **`Button`** : Clickable trigger button.
* **`Checkbox`** : Toggleable checkbox with customizable label.
* **`ProgressBar`** : Visual progress indicator with value and maximum range.
* **`ListButton`** : Multiple-choice options group (QCM / survey selector).
* **`ItemBox`** : Dropdown selector displaying active option and choices list.
* **`Image`** : Local image or vector icon view.
* **`Divider`** : Horizontal separator line.

#### Example `.illp` Structure:
```illp
visibility: All

Background "MainWindow" responsive: true minWidth: "380px" maxWidth: "900px" {
    Card "LoginCard" title: "User Authentication" {
        Row "BrandingRow" {
            Image "Logo" src: "assets/logo.png"
            Text "AppTitle" content: "Lolpaon Studio Enterprise"
        }
        Grid "CredentialsGrid" columns: 2 {
            TextInput "InputUsername" placeholder: "Enter username..."
            TextInput "InputPassword" placeholder: "Enter password..."
        }
        Row "OptionsRow" {
            Checkbox "CheckSSL" label: "Secure TLS connection" checked: true
            Button "BtnSubmit" text: "Sign In"
        }
    }
}
```

### 2. Advanced Declarative Components & Layout Containers

LLP offers a suite of modern, rich components designed so developers never hit an architectural limitation:

#### 📐 Layout & Structuring Containers (Zero Ad-Hoc CSS)
* **`Stack`** : Auto-flex layout container.
  - `direction: "vertical" | "horizontal"`
  - `gap: "12px"` (or any px/rem value)
  - `align: "start" | "center" | "end" | "stretch"`
* **`ResponsiveGrid`** : 12-column responsive layout system.
  - `columns: 12`
  - `gap: "16px"`
  - Individual children specify: `colSpanDesktop: 8 colSpanMobile: 12`
* **`Drawer`** : Side-sheet slide-out navigation and parameter panel.
  - `position: "right" | "left" | "top" | "bottom"`
  - `width: "400px"`
* **`Modal`** : Dialog window with backdrop overlay and close action.
  - `title: "Confirmer l'opération"`
  - `width: "520px"`

#### 📊 Data & Collections
* **`DataGrid`** : Dynamic high-performance table with virtual scrolling (tested smooth with 10,000+ rows).
  - Auto server pagination via RPC: `rpcSource: "Catalog.GetProducts"`
  - Inline editing and sortable columns: `pageSize: 25 virtualScroll: true`
* **`Kanban`** : Interactive Kanban board with drag-and-drop card movements.
  - `rpcSource: "Tasks.GetBoard" onCardDrop: "Tasks.MoveCard"`
* **`TreeView`** : Hierarchical file / category tree explorer.
  - `rpcSource: "Categories.GetTree" onSelect: "Categories.Filter"`

#### 🎛️ Inputs & Forms
* **`TagPicker`** : Tag selector with debounced autocomplete.
  - `rpcSearch: "Tags.Search" debounce: 300 placeholder: "Ajouter un tag..."`
* **`DatePicker`** : Single date or range calendar selector.
  - `mode: "range" defaultRange: "Last30Days" onChange: "Analytics.SetDate"`
* **`RichEditor`** : Markdown / WYSIWYG rich text editor with toolbar.
  - `mode: "markdown" minHeight: "180px"`
* **`FileUpload`** : Drag-and-drop file upload with size & type restrictions.
  - `rpcUpload: "Storage.Upload" maxSize: "50MB" accept: [".png", ".pdf"]`
* **`ColorPicker`** : Interactive palette picker (`defaultColor: "#89b4fa"`).

#### 📈 Visuals & Feedback
* **`Chart`** : Interactive charts directly bound to server metrics.
  - `type: "bar" | "line" | "pie" title: "Ventes" rpcSource: "Analytics.GetSales"`
* **`Skeleton`** : Pulse loading placeholders (`type: "card" lines: 3`).
* **`Toast`** : Real-time notification banners (`type: "success" | "error" | "info" | "warning"`).
* **`MediaPlayer`** : Media viewer with zoom, pan, and playback controls (`type: "image" | "video" | "audio"`).

#### 🌐 Escape Hatch ("La Porte de Sortie")
* **`Webview`** (or **`CustomHtml`**) : Sandboxed HTML/JS/CSS container allowing developers to inject custom canvas, Three.js, Leaflet maps, or third-party web apps without restriction.

---

### 3. `.illps` Files (Interface lolpaon Style)
The `.illps` stylesheet applies design properties (colors, margins, typography, rounded corners) using tag names and `#id` selectors.

> **Real-time Live Sync**: Whenever you switch back to your `.illp` file, changes made to `.illps` are **instantly integrated and rendered live** in the designer view!

#### Example `.illps` Stylesheet:
```illps
visibility: All

Background.MainWindow {
    background: #181825
    padding: 30px
    responsive: true
}

Text#AppTitle {
    color: #cdd6f4
    fontSize: 22px
    font: bold
    align: center
    marginBottom: 20px
}

TextInput#InputUsername {
    background: #313244
    color: #ffffff
    borderRadius: 8px
    padding: 12px
    marginBottom: 15px
}

Button#BtnSubmit {
    background: #89b4fa
    color: #11111b
    fontSize: 16px
    borderRadius: 8px
    padding: 12px 24px
}
```

---

## 📚 Standard Libraries (StdLib)

### 1. `SciLlp` (Scientific & Numerical Computing - SciPy equivalent)
Provides numerical integration, non-linear optimization, root finding, signal smoothing, and advanced statistics:
```llp
General integral = SciLlp.Integrate("x^2", 0, 3)          /- 9
General minimum = SciLlp.Optimize("x^2 - 4*x + 4", 0)     /- x = 2
General root = SciLlp.FindRoot("x^3 - 8", 1)              /- x = 2
General filtered = SciLlp.MovingAverage(General{10, 20, 30, 40}, 2)
General reg = SciLlp.LinearRegression(General{1, 2, 3}, General{2, 4, 6})
```

### 2. `SymLlp` (Symbolic Algebra & Calculus - SymPy equivalent)
Provides exact symbolic derivative, primitives, equation solving, and matrix algebra:
```llp
General solution = SymLlp.Solve("2*x + 6 = 0", "x")        /- x = -3
General derivative = SymLlp.Derivative("x^3 + 4*x", "x")    /- 3*x^2 + 4
General primitive = SymLlp.Integral("3*x^2", "x")          /- x^3 + C
General simplified = SymLlp.Simplify("2*x + 3*x + 4")      /- 5*x + 4
General det = SymLlp.MatrixDet("2, 1; 1, 3")               /- 5
```

### 3. `ProbLlp` (Probability, Statistics & Combinatorics)
```llp
General combos = ProbLlp.Combinations(10, 3)               /- 120
General pdf = ProbLlp.NormalPDF(0, 0, 1)                   /- 0.3989
General binom = ProbLlp.Binomial(10, 3, 0.5)               /- Binomial probability
General item = ProbLlp.Choice(General{"Apple", "Banana", "Cherry"})
```

### 4. `File` (File System I/O)
```llp
File.Write("config.txt", "env=production\ntheme=dark")
if File.Exists("config.txt") then
    General content = File.Read("config.txt")
    print(content)
end
File.Delete("temp.txt")
```

### 5. `Database` & `Cllpdb` (Encrypted Database)
```llp
General db = Database.Open("app.db")
db.Execute("CREATE TABLE users")
db.Execute("INSERT INTO users", General{1, "Alice", "Admin"})
General users = db.Query("SELECT * FROM users")
```

### 6. `Session` (PHP-Style Encrypted Session System)
Provides complete session variable management with transparent AES-256 persistence:
```llp
// Initialize or resume session
Session.Start()

// Store session variables
Session.Set("user_id", 1001)
Session.Set("username", "admin")
Session.Set("authenticated", true)
Session.Save()

// Read and verify session state
if Session.Has("authenticated") then
    print("Logged in user:", Session.Get("username"))
end
print("Active Session ID:", Session.Id())
```

### 7. `Device` (Immutable Hardware Identity & Anti-Spoofing)
Binds client software to the physical host machine to guarantee zero impersonation and non-forgeable authentication:
```llp
// Get deterministic hardware-bound device ID (64-char)
General myDeviceId = Device.GetId()
print("Device ID:", myDeviceId)
print("Platform:", Device.GetPlatform())

// Generate time-bound, cryptographically signed token (anti-replay)
General signedToken = Device.GetToken("auth_nonce")
bool isLegit = Device.Verify(signedToken, "auth_nonce")
print("Hardware token valid?", isLegit)
```

### 8. `Client` (Remote Domain / IP Connector)
Separates client applications from the backend so that desktop and mobile apps remain ultra-lightweight:
```llp
// Connect to remote server via domain or IP:Port
Client.Connect("api.example.com", 8080)

// Authenticate device with remote server
General loginRes = Client.Login("client_user", "password123")

// Make authenticated calls (X-Device-Id and X-Session-Id attached automatically)
General remoteData = Client.Get("/api/secure-data")
print("Data from remote server:", remoteData)
```

### 9. `Server` (Dedicated LLP Backend Server Engine)
Write and deploy standalone server backends in pure LLP code with strict device authentication enforcement:
```llp
// Enforce hardware anti-spoofing for all incoming connections
Server.RequireDevice(true)

// Register route handlers
func handleCatalog(req) {
    print("Request from verified hardware device:", req.DeviceId)
    return "{\"status\": \"ok\", \"products\": [\"Pro Laptop\", \"Peripherals\"]}"
}

Server.Get("/api/products", handleCatalog)

// Start HTTP server on port 8080
Server.Listen(8080, "0.0.0.0")
```

### 10. `RPC` (Transparent Hardware-Bound Real-Time RPC Engine)

The RPC engine allows client applications and UI components to invoke server-side methods with **zero boilerplate**:
* **Hardware Anti-Spoofing**: The client automatically attaches non-spoofable hardware signatures (`X-Device-Id`, `X-Device-Token`) bound to motherboard UUID and CPU hardware IDs.
* **Transparent Argument Passing**: Functions receive natural parameters with automatic bidirectional JSON/RuntimeVal deserialization.
* **Server Push & Real-Time Events**: Servers can target a specific device (`Server.PushTo(deviceId, event, payload)`) or broadcast to all connected devices (`Server.Broadcast(event, payload)`).

#### Server Code (`server.llp`):
```llp
func handleGetProducts(category, limit) {
    General items = { "Item A", "Item B" }
    return items
}

func handlePlaceOrder(productId, qty) {
    General devId = RPC.GetDeviceId()
    Server.PushTo(devId, "OrderConfirmed", "{\"status\": \"Processed\"}")
    return "{\"success\": true}"
}

Server.RegisterRPC("Catalog", "getProducts", handleGetProducts)
Server.RegisterRPC("Orders", "placeOrder", handlePlaceOrder)
Server.Listen(8080, "0.0.0.0")
```

#### Client Code (`client.llp`):
```llp
// 1. Transparent RPC Call
General products = RPC.Call("Catalog.getProducts", "Hardware", 10)
print("Products count:", products.Length())

// 2. Poll Real-Time Push Events
General events = RPC.PollEvents()
for ev in events then
    print("Received event:", ev.event, "Payload:", ev.payload)
end
```

---

### 11. `Device` & `Server` Machine-Bound Security (HWID & Ed25519 Signing)

To ensure that an LLP client is authentic, unique, and impossible to clone or spoof through file copying or request replay attacks, LLP incorporates an unforgeable dual-pillar security architecture: **a stable hardware fingerprint (HWID)** and **a machine-sealed asymmetric Ed25519 dynamic signature**.

#### 1. Invariable Hardware Fingerprint (HWID)
Only non-removable internal hardware components are queried (excluding ephemeral components like MAC addresses, hostnames, or IP addresses):
* **Motherboard**: BIOS/UEFI UUID and Motherboard Serial Number.
* **CPU**: Processor ID and CPU family identifier.
* **System Root Disk / OS**: Root volume serial number or permanent OS partition GUID (`MachineGuid` on Windows, `/etc/machine-id` on Linux, `IOPlatformUUID` on macOS).
* **Derivation**:
  $$\text{RawData} = \text{MotherboardUUID} + \text{CPU\_ID} + \text{SystemDiskUUID}$$
  $$\text{DeviceFingerprint} = \text{HMAC-SHA256}(\text{Key: "LLP\_CORE\_SALT\_v1"}, \text{Message: RawData})$$

#### 2. Machine-Sealed Asymmetric Cryptography (Ed25519 Key Sealing)
* On first run, an **Ed25519** keypair (`PrivateKey`, `PublicKey`) is generated.
* The `PrivateKey` is sealed in `~/.llp/device_key.seal` using **AES-256-GCM** with an authentication tag, keyed by a secret derived from `DeviceFingerprint` (PBKDF2-SHA256, 25,000 iterations).
* **Anti-Cloning Guarantee**: If the sealed key file is copied to another machine, the hardware fingerprint differs, AES-256-GCM authentication fails immediately (`ERR_CRYPTO_OPERATION_FAILED`), rendering the clone completely inoperative.

#### 3. Signed RPC Frames & Anti-Replay Protection
Every RPC frame carries:
* `X-Device-Id`: Immutable device identifier.
* `X-Nonce`: Single-use random UUID v4.
* `X-Timestamp`: Unix millisecond timestamp.
* `X-Signature`: Ed25519 signature over:
  $$\text{StringToSign} = \text{Nonce} + \text{"\textbackslash n"} + \text{Timestamp} + \text{"\textbackslash n"} + \text{HTTP\_Method} + \text{"\textbackslash n"} + \text{CanonicalPayload}$$
* `X-Device-PubKey`: Base64-encoded Ed25519 public key.

#### 4. Server Validation Rules
1. **Freshness Window**: Rejects any request where $|Timestamp_{server} - Timestamp_{client}| > 30\text{s}$ (`TIMESTAMP_OUT_OF_WINDOW`).
2. **Anti-Replay Cache**: The server verifies that `X-Nonce` has not been seen in the last 35 seconds. Replayed requests are rejected with `401 NONCE_REPLAY_DETECTED`.
3. **Cryptographic Integrity**: The signature is verified with the registered device's Ed25519 public key. Altered payloads are rejected with `401 INVALID_CRYPTOGRAPHIC_SIGNATURE`.
4. **Emergency Revocation**: Administrators can instantly revoke a compromised machine:
   - `Server.RevokeDevice(deviceId)`: Immediately severs all RPC access (`403 DEVICE_REVOKED`).
   - `Server.UnrevokeDevice(deviceId)`: Restores access.
   - `Server.GetRegisteredDevices()`: Lists all enrolled fleet devices and active statuses.

```llp
// Client: Inspect hardware identity and sealed status
General devId = Device.GetId()
General fingerprint = Device.GetFingerprint()
General isSealed = Device.IsKeySealed()
General pubKey = Device.GetPublicKey()

// Sign arbitrary RPC payloads
General sig = Device.SignPayload("POST", "/api/rpc", "{\"service\":\"Orders\",\"method\":\"get\"}")
General valid = Device.VerifySignature(pubKey, sig, "POST", "{\"service\":\"Orders\",\"method\":\"get\"}")
```

---

## 🗄️ Encrypted Database System (.cllpdb)

LLP includes a high-security encrypted database engine designed for enterprise applications:
* **Exclusively Created via VS Code Command**: `Ctrl + Shift + P` ➔ **`LLP: Créer une base de données cryptée (.cllpdb)`**.
* **AES-256 Encryption & PBKDF2**: Encrypted using a project-specific key found in `project.config`.
* **Developer-Defined Session Duration**: In scripts and applications, the database session duration is controlled entirely by the developer (`db.StartSession("user", "pass", [durationSeconds])`). If no duration is specified (or 0), the session remains active indefinitely (permanent). Developers can also connect on-demand, fetch or modify records, and disconnect using `db.CloseSession()` or `db.Disconnect()`.
* **2-Minute Security Session in VS Code Editor**: Exclusively when managing `.cllpdb` files directly inside the VS Code visual editor, a strict 2-minute session timeout is enforced for administrative safety.
* **Privileged Administration Protection**: Changing credentials requires PC Administrator (or root) privileges.
* **Management Commands**:
  - `DROP ALL TABLES;` : Drops all tables cleanly.
  - `DROP ALL DATA FROM <tablename>;` : Truncates data while preserving relational schema.
  - `DROP ALL DATABASE;` : Wipes the active database namespace.

---

## 🔍 Static Code Analyzer & Pre-Flight Error Explainer

LLP incorporates a static analysis and diagnostic engine that verifies code **before running it**:
* **Pre-Flight Inspection**: Whenever you run `llp run script.llp`, the analyzer parses the entire file first to ensure full structural, syntactic, and semantic integrity.
* **Pinpointed Visual Pointers (`^`)**: Displays a clean ASCII terminal box pointing directly to the offending column with 3 lines of contextual preview.
* **Exact "What Is Missing" (`CE QUI MANQUE`)**: Tells you the exact missing keyword (`then`, `end`, `in`, `{`, `}`), unclosed string, or missing parameter.
* **Step-by-Step Fixes (`COMMENT CORRIGER`)**: Provides ready-to-copy code snippets demonstrating how to resolve the issue.
* **Intelligent Typo Suggestions**: Flags misspellings in standard library modules and methods (e.g., `Clinet.Connect` ➔ suggests `Client.Connect`).
* **Real-Time VS Code Squiggles & Problems Panel**: As you type in VS Code, diagnostics immediately highlight errors with explanations and solutions.

---

## 💻 CLI Commands & Tooling

Run the LLP CLI via `node bin/llp.js` or `llp`:

```bash
# Launch the Visual UI Builder (Drag-and-Drop, in-place edit, RPC data binding)
llp builder examples/product_management/advanced_ui.illp
llp designer views/dashboard.illp --port 4950

# Statically analyze code and report all errors with fixes
llp check src/main.llp

# Run a dedicated LLP backend server with device authentication
llp server examples/server_backend/server.llp --port 8080

# Run an LLP script (automatically checks syntax and structure before executing)
llp run examples/parent_child_app.llp

# Create a new project with architecture selection (Interactive prompt or flags)
llp create MyNetworkApp --client-server    # Client executable + dedicated server BDD
llp create MyDesktopApp --monolithic       # All-in-one standalone software

# Build executables and distribution packages
llp build --client                         # Compiles client executable (dist_build/<App>_Client.exe)
llp build --server                         # Compiles server package (dist_build/<App>_Server.exe)
llp build                                  # Compiles all-in-one software or active project
llp build src/main.llp --exe
llp build src/main.llp --apk
llp build src/main.llp --installer

# Test network API connectivity
llp test-api https://jsonplaceholder.typicode.com/posts/1

# Test database connection
llp test-db data/products.cllpdb
```

---

## 🛠️ VS Code Extension

The official extension in `vscode-extension/` provides full IDE tooling:
- **Visual Designer WYSIWYG** for `.illp` and `.illps` files with responsive preview.
- **Multilingual Interactive Documentation**:
  - Universal English by default with on-demand instant switching between English, French (`Français`), Spanish (`Español`), and German (`Deutsch`).
  - Switch via Command Palette: `Ctrl + Shift + P` ➔ **`LLP: Change Documentation Language (Language Settings)`** or directly from the documentation webview header dropdown.
  - Hover tooltips and contextual definitions automatically reflect your chosen documentation language.
- **App Lifecycle Controller**:
  - `App.Launch(WindowSize: 250 : 250, DevMode: True)` : Launches GUI window with custom pixel dimensions and developer inspection mode.
  - `App.Lock()` : Locks window resolution, disabling mouse border resizing and fullscreen toggles.
  - `App.Silence(RunBack: True)` : Suspends or executes application in background without displaying a window.
  - `App.Close()` : Programmatically and safely shuts down the application and background processes.
- **Syntax Highlighting** with active color highlighting for code embedded inside comments `{ ... }`.
- **Encrypted Database Manager** for viewing and querying `.cllpdb` files.
- **Project Generators**:
  - `LLP: Create New Empty Project` : Propose le choix interactif entre **Client / Serveur Séparé** (`client/` avec UI et token matériel + `server/` avec BDD `.cllpdb`) et **Monolithique Tout-en-Un** (`src/` avec BDD locale et UI compilées ensemble).
  - `LLP: Create Example Project (Product Management)` : Déploie l'application complète d'authentification et gestion d'inventaire avec `App.Launch()`.
- **Snippets**: `vis-all`, `ifthen`, `forend`, `ui-illp`, `ui-illps`.
