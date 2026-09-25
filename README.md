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

## 🌟 What's New in Version 1.6.0

* 🖥️ **UI Builder Webview Engine 100% Validé & Thème Sombre Professionnel** :
  * **Élimination définitive de l'écran blanc** : Résolution des erreurs de syntaxe JavaScript dans le moteur interne de la Webview (sécurisation du découpage de chaîne sans collision de caractères d'échappement, correction des apostrophes et des sauts de ligne).
  * **Canevas Sombre Moderne** : Remplacement de l'ancien fond blanc aveuglant par un espace de travail sombre haute fidélité (`#11141f` avec bordures et ombres portées douces).
  * **Glisser-Déposer Réactif & Fluide** : Ajout et réorganisation instantanée des composants depuis la palette avec placeholders magnétiques lumineux (`drop-ghost-placeholder`).
  * **Analyse et Rendu Fidèle des `.illp`** : Chargement direct et hiérarchique de l'arborescence des éléments sans perte d'attributs.
* 🎯 **Ciblage & Manipulation Complète des Éléments Graphiques en LLP** :
  * Ciblage direct avec `UI.GetElement("MonElement")`, `UI.MonElement`, ou `UI["MonElement"]`.
  * Modification dynamique des attributs avec synchronisation bidirectionnelle en temps réel (`txt`, `text`, `value`, `val`, `visible`, etc.).
  * Événements réactifs natifs `OnClick()` et `OnChange()` avec exécution immédiate.
* 🔄 **Architecture Client-Serveur Standardisée & Nouveau Template de Scaffolding** :
  * Intégration du cycle complet dans les projets générés (`llp create MonProjet --client-server`) :
    1. Interface graphique interactive `.illp` avec champs et validation.
    2. Logique client `client/main.llp` avec récupération des données et validation locale.
    3. Appel distant RPC transparent `RPC.Call("Auth.login", user, pass)`.
    4. Traitement métier serveur sécurisé `server/main.llp` avec réponse structurée et mise à jour dynamique de l'UI.
* 🛡️ **Optimisations Majeures du Runtime & de l'Interpréteur Serveur** :
  * **Scope Confiné & Anti-Blocage** : Bornage strict de `findProjectRoot` pour éliminer tout scan intempestif du disque dur supérieur.
  * **Surcharge et Redéfinition Propre** : `evalFunctionDeclaration` permet désormais de surcharger ou redéfinir des fonctions globales sans lever d'exception de collision de variable.
  * **Isolation des Dossiers Internes** : Exclusion automatique des dossiers `.kilo`, `.git`, `dist_build`, `install` et `examples` du scope d'analyse du serveur.

---

## 🌟 What's New in Version 1.5.9

* 🎨 **Complete UI Text Modification Guide & Dynamic Data Binding**:
  * Added comprehensive guidelines and examples for editing text across graphical components (`Text`, `Button`, `TextInput`, `Card`, `Checkbox`, `ItemBox`, `ListButton`, `Modal`, `Drawer`, `Toast`) both declaratively in `.illp` code and visually in the UI Builder.
  * Inline canvas editing (`contentEditable`) and live inspector properties binding.
* 🧬 **Universal Class & Instance `ToString()` Override Synchronization**:
  * `func over ToString() then ... end` is now bound simultaneously to instances (`inst.ToString()`) and directly to class objects (`MyClass.ToString()`).
  * Direct terminal printing (`print(MyClass)`, `print(inst)`) and string concatenation (`"Name: " + obj`) seamlessly invoke custom string overrides without falling back to default file hierarchy paths.
  * Transparent error reporting for custom `ToString()` methods (`[LLP ToString Execution Error]`) to eliminate silent execution failures.
* 🔄 **Cross-Folder Project Visibility & `Parent.Parent` Scope**:
  * **`visibility: All`**: Any file or class declared with `visibility: All` is visible to its `Parent.Parent` (the grandparent/project directory) and to **all recursive descendants and subfolders** of `Parent.Parent`.
  * **Zero Missing-Symbol Errors**: Fixed `[LLP Runtime Error] Impossible de trouver la variable ou fonction '...'` when executing scripts across directories (e.g. `client/main.llp` accessing `MyClass` in `client/classes/` or sibling folders).
  * **Automatic Runtime Sync**: VS Code extension's bundled runner (`vscode-extension/dist`) is now automatically kept in 100% sync with the language compiler output on every build.
* 🧩 **New Data Types (`Json`, `Hexa`) & Refined Global Variable Intervals**:
  * **`Json` Type**: Native JSON data type with direct dynamic property dot-notation (`data.user.name`, `payload.items[0]`), and utilities `Json.parse()` / `Json.stringify()`.
  * **`Hexa` Type**: Hexadecimal integer and color type with conversions `Hexa.toInt()` and `Hexa.toHex()`.
  * **`General` vs `Global`**: Clear semantic differentiation between globals:
    * `General`: Large interval / dynamic multi-type variable.
    * `Global`: Small interval / constrained value range.
* ⏱️ **`Task` Module & Real-time `breakpoint`**:
  * **`Task` / `task`**: Roblox-inspired task scheduling with `Task.wait(seconds)`, `Task.delay(seconds, func)`, `Task.spawn(func)`, `Task.defer(func)`, and `Task.cancel(thread)`.
  * **`breakpoint` Statement**: Non-blocking real-time breakpoint inspection allowing developers to view variables live without interrupting parallel tasks or background scripts.
* 🔍 **Intelligent Autocomplete for Classes & Workspace Symbols**:
  * Autocomplete engine now scans recursively up to `Parent.Parent` and the full workspace, suggesting both `class ClassName` and constructor shortcuts `ClassName.new()`.

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

* **`visibility: All`** : Completely public and accessible across the project. Any script marked with `visibility: All` is visible to its **`Parent.Parent`** (grandparent directory / project root) and to **all children and subfolders** of `Parent.Parent`.
* **`visibility: Package`** : Visible only to other files residing in the same directory/package.
* **`visibility: Parent`** : Visible to the parent folder and all of its descendant subfolders.
* **`visibility: Private`** : Strictly isolated; inaccessible to external files.

Each file dynamically resolves accessible components by computing directory paths against declared visibility directives and pre-loading visible scripts before entry execution.

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

LLP supports dynamic, semi-dynamic, and static typing tailored for game engines, networked applications, and high-performance computing.

### 1. Simple Variables & Global Range Differentiation
* **`General`** : Dynamic multi-type variable with a **large value range / interval**, ideal for complex structures, dynamic lists, and large-scale objects.
* **`Global`** : Variable with a **small / constrained interval**, optimal for lightweight flags, bounded counters, and localized shared state.

```llp
General projectName = "Lolpaon Studio" /- Large interval dynamic type
Global counter = 0                     /- Small interval constrained type
string author = "lolpaon"              /- String
int year = 2026                        /- Integer
float version = 1.58                   /- Floating-point number
bool isActive = true                   /- Boolean (true / false / null)
```

### 2. JSON Type: `Json`
The `Json` type allows direct object manipulation and dynamic dot-property traversal:
```llp
Json user = Json.parse("{\"profile\": {\"name\": \"lolpaon\", \"level\": 99}}")

/- Direct dynamic property access:
print("Player name:", user.profile.name)
print("Player level:", user.profile.level)

/- Serialize back to string:
string serialized = Json.stringify(user)
```

### 3. Hexadecimal Type: `Hexa`
Dedicated type for hexadecimal numbers, RGB colors, memory masks, and bitwise operations:
```llp
Hexa color = "0xFF5500"
int intVal = Hexa.toInt(color)           /- 16733440
string hexString = Hexa.toHex(intVal)    /- "0xFF5500"
```

### 4. Asynchronous Task Scheduling: `Task` (Roblox-style)
The `Task` (or `task`) module provides micro-threaded asynchronous scheduling:
```llp
/- 1. Non-blocking delay
General thread = delay(3, func() then
    print("Executed after 3 seconds!")
end)

/- 2. Cancel a scheduled task
task.cancel(thread)

/- 3. Immediate micro-task spawning
task.spawn(func() then
    print("Spawned in background thread")
end)

/- 4. Cooperative wait
task.wait(1.5)
```

### 5. Non-Blocking Real-Time Debugging: `breakpoint`
Allows inspecting variable states live without hanging parallel tasks or terminating server threads:
```llp
int currentScore = 150
breakpoint /- Pauses execution locally to display variable state in terminal/debugger
```

### 6. Universal Constants
Constants declared with `visibility: All` (such as `PY` or `PI`) are universally accessible across all user scripts and modules:
```llp
print("Value of PI:", PI)
print("SciPy/Python constant PY:", PY)
```

### 7. Dynamic Sized Lists: `General{}`
```llp
General modules = General{"Network", "Database"}
modules.Add("Graphics")              /- Appends an item
modules.Remove(0)                    /- Removes item at index 0
print("Length:", modules.Length())   /- 2
```

### 8. Fixed-Capacity Arrays: `General[N]{}`
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

### 2. Automatic Hierarchical `ToString()` & Override with `func over ToString()`
All classes and instances in LLP inherit a hierarchical `ToString()` method by default:
* **Base Class Object**: Calling `ToString()` directly on a class (or service) returns its hierarchical identity and file location (e.g. `Player.ToString()` -> `[Player.cllp > Player]`, `App.ToString()` -> `[App]`).
* **Ancestral Tree Resolution**: An instance computes the ancestral parent chain back to the root parent, including its source file (`.cllp` or `.llp`).
* **Custom Overrides (`func over ToString()`)**: Any class can redefine its string representation using the `over` keyword:
* **Automatic Invocation**: Calling `print(myObject)` or concatenating (`"Hero: " + myObject`) automatically calls the custom or default `ToString()`.

```llp
visibility: All

class Player then
    string Name = "Arthur"
    int Score = 42

    func over ToString() then
        return "[Player: " + self.Name + " (Score: " + self.Score + ")]"
    end
end

General hero = Player.new()

/- 1. Explicit invocation:
print(hero.ToString()) /- [Player: Arthur (Score: 42)]

/- 2. Direct print:
print(hero)            /- [Player: Arthur (Score: 42)]

/- 3. String concatenation:
print("Welcome " + hero) /- Welcome [Player: Arthur (Score: 42)]

/- 4. Class type itself:
print(Player.ToString()) /- [Player.cllp > Player]
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

---

### 3. 🎯 Cibler les Éléments Graphiques et Modifier leurs Attributs en LLP

En LLP, vous pouvez **cibler n'importe quel élément graphique** de votre interface (déclaré dans un fichier `.illp` ou créé dynamiquement) et **modifier ses attributs en temps réel** (`txt`, `value`, `placeholder`, `visible`, etc.).

#### 🔍 1. Comment Cibler un Élément Graphique

LLP propose plusieurs syntaxes intuitives et ergonomiques selon vos préférences :

```llp
// 1. Via le service global UI (Recommandé)
General btn = UI.GetElement("BtnSignIn")

// 2. Via la fonction globale raccourcie GetElement()
General userField = GetElement("InputUsername")

// 3. Accès direct par propriété (Hiérarchie style Roblox)
General resetBtn = UI.BtnReset

// 4. Accès par indexation entre crochets
General passField = UI["InputPassword"]
```

> 💡 **Chargement Automatique (`UI.AutoLoad()`)** : Lorsque vous appelez `UI.GetElement()`, LLP charge automatiquement le fichier `.illp` de votre projet (`client/views/main.illp`, `main.illp`, etc.) et transforme chaque composant en `Instance` interactive !

---

#### ✏️ 2. Modifier les Attributs (`txt`, `value`, etc.)

Tous les alias courants sont supportés de manière insensible à la casse pour un confort d'écriture maximal :

##### A. Modifier le Texte (`txt`, `text`, `content`, `title`)
```llp
General btn = UI.GetElement("BtnSignIn")

// Toutes ces syntaxes sont équivalentes et synchronisées :
btn.txt = "Se Connecter Maintenant"
btn.text = "Se Connecter Maintenant"
btn.Text = "Se Connecter Maintenant"

// Via la méthode d'instance :
btn.SetText("Connexion en cours...")

// Directement via le raccourci UI :
UI.SetText("BtnSignIn", "Connexion Réussie !")

// Lire le texte :
print("Texte actuel du bouton :", btn.txt)
print("Via GetText() :", btn.GetText())
print("Via UI.GetText() :", UI.GetText("BtnSignIn"))
```

##### B. Modifier la Valeur (`value`, `val`)
Idéal pour les champs de saisie (`TextInput`), les cases à cocher (`Checkbox`), ou les barres de progression (`ProgressBar`) :
```llp
General inputEmail = UI.GetElement("InputUsername")

// Modifier la valeur saisie :
inputEmail.value = "admin@lolpaon.com"
inputEmail.val = "admin@lolpaon.com"

// Modifier le placeholder :
inputEmail.placeholder = "Tapez votre adresse email professionnelle..."

// Pour une barre de progression :
General bar = UI.GetElement("SystemProgressBar")
bar.value = 95 /- Met à jour le pourcentage à 95% -/

// Lire la valeur :
print("Email saisi :", inputEmail.value)
print("Via GetValue() :", inputEmail.GetValue())
print("Via UI.GetValue() :", UI.GetValue("InputUsername"))
```

##### C. Modifier la Visibilité (`visible`, `hidden`)
```llp
General modal = UI.GetElement("ProfileModal")

// Masquer ou afficher :
modal.visible = False
modal.SetVisible(True)
UI.SetVisible("ProfileModal", True)

if modal.IsVisible() then
    print("La fenêtre est actuellement visible.")
end
```

---

#### ⚡ 3. Événements Réactifs (`OnClick`, `OnChange`)

Vous pouvez attacher directement des fonctions d'écoute aux éléments graphiques :

```llp
General btn = UI.GetElement("BtnSignIn")

// Écouter le clic utilisateur
btn.OnClick(func()
    print(">>> L'utilisateur a cliqué sur le bouton de connexion !")
    btn.txt = "Vérification..."
    
    General email = UI.GetValue("InputUsername")
    print("Vérification des identifiants pour :", email)
end)

// Écouter la frappe en temps réel dans un champ
General searchInput = UI.GetElement("SearchField")
searchInput.OnChange(func(nouvelleValeur)
    print("Recherche en direct :", nouvelleValeur)
end)
```

---

#### 🔄 4. Synchronisation 2-Voies en Temps Réel avec le Navigateur

Lorsque vous lancez votre application avec `App.Launch()` ou `UI.Launch()` :
1. **LLP vers Navigateur** : Dès que votre script LLP modifie `btn.txt = "Nouveau Libellé"`, l'affichage dans le navigateur web se met à jour **immédiatement sans recharger la page**.
2. **Navigateur vers LLP** : Dès que l'utilisateur tape du texte dans un `TextInput` ou coche une `Checkbox`, la valeur est transmise instantanément au runtime LLP, de sorte que `UI.GetValue("monChamp")` reflète toujours la saisie réelle !

---

### 4. ✍️ Comment Modifier le Texte des Éléments Graphiques (Modes Visuel et Style)

En complément du code LLP ci-dessus, vous pouvez également modifier le texte de vos composants **dans le fichier déclaratif**, **dans le designer visuel**, ou **au niveau du style**.

#### 📋 Tableau des Composants et Attributs Déclaratifs

| Composant | Attribut Déclaratif | Rôle & Description | Exemple de Déclaration |
| :--- | :--- | :--- | :--- |
| **`Text`** | `content: "..."` | Libellé, titre, paragraphe ou description | `Text "Title" content: "Bienvenue dans l'application !"` |
| **`Button`** | `text: "..."` | Intitulé cliquable du bouton | `Button "BtnSave" text: "Enregistrer les modifications"` |
| **`TextInput`** | `placeholder: "..."` | Texte d'invite (grisé) affiché dans le champ | `TextInput "Field" placeholder: "Entrez votre identifiant..."` |
| **`Card`** | `title: "..."` | Titre de l'en-tête de la carte ou panneau | `Card "UserCard" title: "Informations Personnelles"` |
| **`Checkbox`** | `label: "..."` | Libellé affiché à côté de la case à cocher | `Checkbox "Terms" label: "J'accepte les conditions d'utilisation"` |
| **`ItemBox`** | `default: "..." items: [...]` | Option sélectionnée et liste des choix du menu | `ItemBox "Lang" default: "Français" items: ["Français", "English", "Español"]` |
| **`ListButton`** | `choices: [...]` | Liste des libellés des boutons à choix multiple | `ListButton "Quiz" choices: ["Option A", "Option B", "Option C"]` |
| **`Modal`** | `title: "..."` | Titre affiché en haut de la fenêtre modale | `Modal "ConfirmModal" title: "Confirmer la suppression"` |
| **`Drawer`** | `title: "..."` | Titre du panneau latéral coulissant | `Drawer "MenuDrawer" title: "Menu de Navigation"` |
| **`Toast`** | `message: "..."` | Texte du message de notification contextuelle | `Toast "SuccessToast" message: "Données synchronisées !"` |
| **`TagPicker`** | `placeholder: "..."` | Texte d'invite pour la saisie de tags | `TagPicker "Picker" placeholder: "Ajouter un tag..."` |
| **`Chart`** | `title: "..."` | Titre du graphique de métriques | `Chart "MetricsChart" title: "Statistiques Hebdomadaires"` |

---

#### 🛠️ Les 3 Autres Façons de Modifier le Texte

##### 1. Directement dans le fichier `.illp` (Mode Déclaratif)
Ouvrez simplement votre fichier `.illp` dans VS Code et modifiez la valeur entre guillemets de l'attribut concerné (`content`, `text`, `placeholder`, `title`, etc.) :
```illp
Card "ProfileCard" title: "Mon Compte Utilisateur" {
    Text "GreetingText" content: "Bonjour, Jean Dupont !"
    TextInput "EmailInput" placeholder: "jean.dupont@entreprise.com"
    Button "SubmitButton" text: "Mettre à jour le profil"
}
```

##### 2. Dans le UI Builder Visuel via Double-Clic (Édition Directe "In-Place")
Lorsque vous visualisez votre interface avec la commande `llp builder <mon_fichier.illp>` ou le bouton de prévisualisation de l'extension :
* **Double-cliquez** directement sur n'importe quel texte, titre de carte ou libellé de bouton dans la fenêtre de rendu.
* Le texte passe immédiatement en mode d'édition en direct (`contentEditable`).
* Tapez votre nouveau texte, puis appuyez sur **Entrée** ou cliquez en dehors pour valider.
* La modification est **automatiquement répercutée et enregistrée** dans votre fichier `.illp` !

##### 3. Dans l'Inspecteur de Propriétés (Volet Latéral Droit)
Dans le UI Builder :
* **Cliquez une fois** sur le composant (par exemple un `Button` ou un `TextInput`).
* Dans le panneau de droite **"Properties Inspector"**, repérez le champ textuel :
  - Pour un `Button` : modifiez le champ **`text`**.
  - Pour un `Text` : modifiez le champ **`content`**.
  - Pour un `TextInput` : modifiez le champ **`placeholder`**.
  - Pour une `Card`, `Modal` ou `Drawer` : modifiez le champ **`title`**.
* Le canevas se met à jour en temps réel à chaque caractère saisi.

---

### 5. Styliser le Texte avec les Fichiers `.illps`
Pour modifier l'apparence graphique du texte (taille, couleur, alignement, graisse), associez un fichier `.illps` du même nom ou lié :
```illps
Text#GreetingText {
    color: #89b4fa
    fontSize: 20px
    font: bold
    align: center
}

Button#SubmitButton {
    color: #11111b
    background: #a6e3a1
    fontSize: 14px
```

---

### 6. 🔄 Le Fonctionnement Complet du Développement en LLP : UI ➔ Validation Client ➔ Serveur ➔ UI

Le développement d'une application en LLP suit un modèle d'architecture réactive, modulaire et hautement sécurisé :

```
┌──────────────────────────┐
│  1. Interface Graphique  │  (Fichier .illp / UI Builder)
│     - Champs de saisie   │  L'utilisateur remplit l'interface
│     - Bouton d'action    │
└────────────┬─────────────┘
             │ (Événement OnClick / OnChange)
             ▼
┌──────────────────────────┐
│  2. Logique Client (LLP) │  (client/main.llp)
│     - Récupération infos │  UI.InputUser.value
│     - Validation locale  │  Vérification des champs vides, formats...
│     - Feedback visuel    │  UI.LabelStatus.txt = "Vérification..."
└────────────┬─────────────┘
             │ (Appel distant sécurisé RPC ou HTTP)
             ▼
┌──────────────────────────┐
│  3. Serveur Dédié (LLP)  │  (server/main.llp)
│     - Réception requête  │  Server.RegisterRPC("Auth", "login", ...)
│     - Validation métier  │  Vérification base .cllpdb, HWID, sessions...
│     - Réponse structurée │  Retourne { success: true, token: "..." }
└────────────┬─────────────┘
             │ (Réponse réseau)
             ▼
┌──────────────────────────┐
│  4. Mise à Jour de l'UI  │  (client/main.llp)
│     - Affichage succès   │  UI.LabelStatus.txt = "Bienvenue !"
│     - Navigation/Vues    │  UI.CardAuth.visible = false
└──────────────────────────┘
```

#### 📝 Exemple Concret de Code Complet

##### Étape 1 : L'Interface Graphique (`client/views/main.illp`)
```illp
visibility: All

Background "MainWindow" responsive: true minWidth: "400px" maxWidth: "700px" {
    Card "AuthCard" title: "🔐 Connexion Client" {
        Text "SubText" content: "Veuillez entrer vos identifiants :"
        TextInput "InputUsername" placeholder: "Nom d'utilisateur..." value: ""
        TextInput "InputPassword" placeholder: "Mot de passe..." value: "" type: "password"
        Button "BtnSubmit" text: "Se connecter"
        Text "LabelFeedback" content: ""
    }
}
```

##### Étape 2 & 4 : La Logique Client & Validation (`client/main.llp`)
```llp
visibility: All

func handleLogin() {
    // 1. Récupération des informations saisies par l'utilisateur
    General username = UI.InputUsername.value
    General password = UI.InputPassword.value

    // 2. Validation côté client (immédiate, sans latence réseau)
    if (username == "") {
        UI.LabelFeedback.txt = "⚠️ Le nom d'utilisateur ne peut pas être vide."
        return false
    }
    if (password == "") {
        UI.LabelFeedback.txt = "⚠️ Le mot de passe est obligatoire."
        return false
    }

    // 3. Feedback visuel pendant le traitement
    UI.LabelFeedback.txt = "⏳ Validation auprès du serveur..."
    UI.BtnSubmit.txt = "Connexion..."

    // 4. Envoi sécurisé au serveur via RPC
    General res = RPC.Call("Auth.login", username, password)

    // 5. Réception de la réponse serveur et mise à jour de l'UI
    if (res.success == true) {
        UI.LabelFeedback.txt = "✅ " + res.message
        UI.BtnSubmit.txt = "Connecté"
    } else {
        UI.LabelFeedback.txt = "❌ Erreur : " + res.message
        UI.BtnSubmit.txt = "Se connecter"
    }
}

// Liaison de l'événement clic
UI.BtnSubmit.OnClick(handleLogin)

// Lancement de l'application
App.Launch(WindowSize: 800 : 600, DevMode: False)
```

##### Étape 3 : Le Serveur Dédié LLP (`server/main.llp`)
```llp
visibility: All

print("🛡️ [LLP Server] Démarrage du serveur dédié...")

// 1. Gestionnaire Métier Serveur (Authentification)
func handleAuthLogin(username, password) {
    print("🔐 [Serveur] Demande reçue pour l'utilisateur :", username)

    // Validation métier et vérification en base de données sécurisée .cllpdb
    if (username == "admin" && password == "admin123") {
        print("✅ [Serveur] Authentification validée pour", username)
        return {
            "success": true,
            "message": "Bienvenue " + username + " !",
            "token": "SESSION_AUTH_TOKEN_SECURE"
        }
    }

    print("⚠️ [Serveur] Identifiants invalides pour", username)
    return {
        "success": false,
        "message": "Identifiants invalides."
    }
}

// 2. Enregistrement du service RPC
Server.RegisterRPC("Auth", "login", handleAuthLogin)

// 3. Écoute réseau
Server.Listen(8080)
print("🚀 Serveur prêt et en écoute sur le port 8080.")
```

---

### 7. `.illps` Files (Interface lolpaon Style)
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
