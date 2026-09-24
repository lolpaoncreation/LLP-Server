<p align="center">
  <img src="../assets/logo.png" alt="LLP Logo - lolpaon" width="160" />
</p>

# 📘 MANUEL D'ARCHITECTURE TECHNIQUE COMPLÈTE : LANGAGE LLP (lolpaon)
> **Guide de référence industrielle pour comprendre, concevoir, compiler et réimplémenter l'intégralité du runtime LLP à la main.**  
> 🌐 **Dépôt Serveur Officiel Linux :** [https://github.com/lolpaoncreation/LLP-Server.git](https://github.com/lolpaoncreation/LLP-Server.git)

---

## 📑 Sommaire
1. [Vue d'Ensemble & Spécifications Fondamentales](#1-vue-densemble--spécifications-fondamentales)
2. [Les Deux Piliers Technologiques de LLP](#2-les-deux-piliers-technologiques-de-llp)
3. [Architecture du Pipeline d'Exécution](#3-architecture-du-pipeline-dexécution)
4. [L'Analyseur Lexical (Lexer & Tokens)](#4-lanalyseur-lexical-lexer--tokens)
5. [L'Arbre Syntaxique Abstrait (AST) & La Grammaire](#5-larbre-syntaxique-abstrait-ast--la-grammaire)
6. [L'Analyseur Syntaxique (Parser à Descente Récursive)](#6-lanalyseur-syntaxique-parser-à-descente-récursive)
7. [L'Interpréteur & Le Modèle de Mémoire (Runtime & Scopes)](#7-linterpréteur--le-modèle-de-mémoire-runtime--scopes)
8. [Paramètres vs Modules de Fonction & Sécurité Aléatoire](#8-paramètres-vs-modules-de-fonction--sécurité-aléatoire)
9. [Classes (.cllp), Namespaces & ToString() Arborescent](#9-classes-cllp-namespaces--tostring-arborescent)
10. [L'Arbre d'Objets (Instance Tree) & Architecture Client / Serveur](#10-larbre-dobjets-instance-tree--architecture-client--serveur)
11. [Le Chef d'Orchestre (Smart Concurrency & Load Balancer)](#11-le-chef-dorchestre-smart-concurrency--load-balancer)
12. [Moteur Graphique GUI (.illp, .illps & Webview)](#12-moteur-graphique-gui-illp-illps--webview)
13. [Sécurité Cryptographique Matérielle (HWID, Ed25519 & AES)](#13-sécurité-cryptographique-matérielle-hwid-ed25519--aes)
14. [Base de Données Chiffrée (.cllpdb)](#14-base-de-données-chiffrée-cllpdb)
15. [L'Analyseur Statique & Diagnostiqueur Pré-Flight](#15-lanalyseur-statique--diagnostiqueur-pré-flight)
16. [Plan d'Ingénierie pour Refaire le Langage de Zéro](#16-plan-dingénierie-pour-refaire-le-langage-de-zéro)

---

## 1. Vue d'Ensemble & Spécifications Fondamentales

Le langage **LLP** (*lolpaon language*) est un langage interprété de haut niveau à typage hybride (dynamique via `General`/`Global` ou statiquement strict avec `string`, `int`, `float`, `bool`), doté d'une syntaxe propre articulée autour de blocs `then ... end`.

### Spécificités structurelles majeures :
* **Zéro accolades obligatoires pour les blocs de logique** : Les structures de contrôle utilisent `then ... end` (`if condition then ... end`, `while condition then ... end`, `for item in list then ... end`).
* **Typage Hybride Garanti** :
  - `General x = "texte"` : variable dynamique réassignable à tout type.
  - `string x = "texte"` : variable verrouillée au runtime, déclenchant une erreur de type immédiate en cas de tentative d'affectation non conforme.
* **Système de Fichiers Dédiés** :
  - `.llp` / `.lolpaon` : Logique applicative, scripts système, algorithmes.
  - `.cllp` : Fichier de classe pure (*Class Lolpaon*). Strictement **une seule classe par fichier**, portant exactement le même nom.
  - `.illp` : Déclaration déclarative d'interface graphique sans coordonnées manuelles.
  - `.illps` : Feuille de styles synchronisée en temps réel dans l'éditeur.
  - `.cllpdb` : Fichier de base de données crypté AES-256 avec gestion de session.

---

## 2. Les Deux Piliers Technologiques de LLP

Toute l'architecture de LLP repose sur deux innovations de fond :

### Pilier 1 : Architecture Dev Client / Serveur Parent-Enfant
Dans la majorité des langages, le développeur manipule un DOM pour l'UI, des sockets brutes ou des routes REST pour le réseau, et des curseurs SQL pour les données. 
LLP élimine cette friction en unifiant **tous les composants sous un arbre d'instances universel (`Instance.new`)** :
* Une fenêtre graphique est un parent, ses cartes et boutons sont ses enfants.
* Un serveur est un nœud parent, les sessions clientes et services BDD sont ses enfants.
* Tout appel réseau ou propagation d'événement remonte ou descend naturellement l'arbre parent-enfant.

### Pilier 2 : Le Chef d'Orchestre (Orchestrateur Multi-Tâches Adaptatif)
Pour éviter les gels de l'interface graphique (UI freezes) et l'effondrement des serveurs sous de violents pics de trafic, LLP intègre un planificateur natif non-bloquant appelé **Chef d'Orchestre** :
* Il sépare les requêtes entrantes en 3 couloirs de priorité : **UI / Événements**, **Réseau / RPC I/O**, et **Calculs lourds / Base de données**.
* Les gros calculs et requêtes volumineuses sont découpés en tranches de temps (time-slicing), garantissant que le thread principal reste fluide même sous une charge massive.

---

## 3. Architecture du Pipeline d'Exécution

Voici le flux complet que subit un script LLP, du fichier texte brut jusqu'à sa terminaison :

```text
       [ Fichier Source (.llp, .cllp, .illp) ]
                         │
                         ▼
       [ 1. Pré-Flight Analyzer (Statique) ] ──▶ (Erreurs ? ──▶ Rapport ASCII ^ avec solutions & Stop)
                         │ (Valide)
                         ▼
       [ 2. Lexer (Analyseur Lexical) ]
                         │ Génère un flux linéaire de Tokens
                         ▼
       [ 3. Parser (Descente Récursive) ]
                         │ Construit l'Arbre Syntaxique Abstrait (AST Program)
                         ▼
       [ 4. Global Environment (Scopes) ] ──▶ Initialisation de la StdLib
                         │
                         ▼
       [ 5. Interpréteur (Tree-Walking) ]
            ├── Évaluation des Expressions & Déclarations
            ├── Gestion de la Pile d'Instances (Parent / Enfant)
            ├── Modules de fonction (Scellement & Déverrouillage)
            └── Le Chef d'Orchestre (File asynchrone non-bloquante)
```

---

## 4. L'Analyseur Lexical (Lexer & Tokens)

Le Lexer prend en entrée une chaîne UTF-8 brute et la convertit en une séquence d'objets `Token`.

### 4.1. Structure d'un Token
```typescript
interface Token {
  value: string;
  type: TokenType;
  line: number;
  column: number;
}
```

### 4.2. Liste des Catégories de Tokens (`TokenType`)
1. **Littéraux** : `Number`, `String`, `Boolean` (`true`, `false`, `null`), `Identifier`.
2. **Mots-clés de Déclaration** : `General`, `Global`, `String_Type`, `Int_Type`, `Float_Type`, `Bool_Type`, `Function`, `Module`, `Namespace`, `Class`.
3. **Mots-clés de Contrôle** : `If`, `Then`, `Else`, `While`, `For`, `In`, `End`, `Return`, `Break`.
4. **Opérateurs Logiques** :
   - `&` : ET logique
   - `|` : OU logique
   - `&|` : OU Exclusif (XOR)
5. **Opérateurs Arithmétiques & Comparaison** : `+`, `-`, `*`, `/`, `%`, `==`, `!=`, `<`, `<=`, `>`, `>=`, `=`.
6. **Symboles de Ponctuation** : `(`, `)`, `{`, `}`, `[`, `]`, `,`, `:`, `.`.

### 4.3. Algorithme des Commentaires & Code Exécutable Inline
LLP supporte 3 types de commentaires, dont une innovation unique : **le code exécutable intégré dans un commentaire**.

1. **Commentaire simple** : Commence par `/-` jusqu'à la fin de la ligne.
2. **Commentaire multiligne** : Commence par `/*` et se termine par `*\` (ou `*/`).
3. **Commentaire inline avec code exécutable** :
   Syntaxe : `/- Note explicative { Global secret = 42 } fin de la note \`
   - Le Lexer ignore le texte du commentaire jusqu'à rencontrer l'accolade ouvrante `{`.
   - Tout ce qui est entre `{ ... }` est **émis sous forme de tokens exécutables standards**.
   - Le compilateur et l'IDE appliquent la coloration syntaxique complète sur ce bloc, et l'interpréteur l'exécute naturellement.

### 4.4. Boucle Principale du Lexer
```typescript
class Lexer {
  private source: string;
  private cursor: number = 0;
  private line: number = 1;
  private col: number = 1;

  public tokenize(): Token[] {
    const tokens: Token[] = [];
    while (this.cursor < this.source.length) {
      const char = this.source[this.cursor];

      // 1. Espaces blancs
      if (char === '\n') { this.line++; this.col = 1; this.cursor++; continue; }
      if (/\s/.test(char)) { this.col++; this.cursor++; continue; }

      // 2. Commentaires
      if (char === '/' && this.peek() === '-') {
        this.skipSingleLineComment(tokens);
        continue;
      }
      if (char === '/' && this.peek() === '*') {
        this.skipBlockComment();
        continue;
      }

      // 3. Nombres (décimaux et entiers)
      if (/[0-9]/.test(char)) {
        tokens.push(this.scanNumber());
        continue;
      }

      // 4. Chaînes de caractères ("...")
      if (char === '"') {
        tokens.push(this.scanString());
        continue;
      }

      // 5. Identifiants & Mots-clés
      if (/[a-zA-Z_]/.test(char)) {
        tokens.push(this.scanIdentifier());
        continue;
      }

      // 6. Opérateurs composés (&|, ==, !=, <=, >=)
      // 7. Symboles simples
      tokens.push(this.scanSymbol());
    }
    tokens.push({ type: TokenType.EOF, value: "EndOfFile", line: this.line, column: this.col });
    return tokens;
  }
}
```

---

## 5. L'Arbre Syntaxique Abstrait (AST) & La Grammaire

L'AST représente la structure logique du programme sous forme d'arbre hiérarchique d'objets fortement typés.

### 5.1. Définitions Principales de l'AST
```typescript
export type NodeType =
  | "Program"
  | "VariableDeclaration"
  | "FunctionDeclaration"
  | "ModuleDeclaration"
  | "ClassDeclaration"
  | "NamespaceDeclaration"
  | "IfStatement"
  | "WhileStatement"
  | "ForStatement"
  | "ReturnStatement"
  | "BinaryExpr"
  | "UnaryExpr"
  | "CallExpr"
  | "MemberExpr"
  | "AssignmentExpr"
  | "NumericLiteral"
  | "StringLiteral"
  | "BooleanLiteral"
  | "NullLiteral"
  | "ListLiteral"
  | "FixedArrayLiteral"
  | "Identifier";

export interface Statement {
  kind: NodeType;
  line: number;
}

export interface Program extends Statement {
  kind: "Program";
  body: Statement[];
}
```

### 5.2. Nœuds Spécialisés de LLP

#### Module de Fonction (`ModuleDeclaration`)
```typescript
export interface ModuleDeclaration extends Statement {
  kind: "ModuleDeclaration";
  moduleName: string;
  body: Statement[];
}
```

#### Déclaration de Classe (`ClassDeclaration`)
```typescript
export interface ClassDeclaration extends Statement {
  kind: "ClassDeclaration";
  className: string;
  body: Statement[];
}
```

#### Déclaration d'Espace de Noms (`NamespaceDeclaration`)
```typescript
export interface NamespaceDeclaration extends Statement {
  kind: "NamespaceDeclaration";
  namespaceName: string;
  body: Statement[];
}
```

---

## 6. L'Analyseur Syntaxique (Parser à Descente Récursive)

Le Parser transforme la liste plate de tokens en un AST en appliquant les règles grammaticales de LLP.

### 6.1. Ordre de Priorité des Opérateurs (Precedence Climbing)
Du niveau le plus bas au plus élevé :
1. **Assignation** : `=`
2. **OU Logique** : `|`
3. **OU Exclusif (XOR)** : `&|`
4. **ET Logique** : `&`
5. **Égalité & Différence** : `==`, `!=`
6. **Comparaisons Relatives** : `<`, `<=`, `>`, `>=`
7. **Addition & Soustraction** : `+`, `-`
8. **Multiplication, Division, Modulo** : `*`, `/`, `%`
9. **Opérateur Unaire** : `!`, `-`
10. **Appel de méthode / Accès membre** : `.`, `()`

### 6.2. Traitement des Blocs `then ... end`
Lorsqu'une structure de contrôle ou une fonction commence, elle attend le token `then` et consomme tous les énoncés internes jusqu'au token `end` :

```typescript
private parseBlockStatements(): Statement[] {
  const statements: Statement[] = [];
  while (this.at().type !== TokenType.End && this.at().type !== TokenType.EOF) {
    statements.push(this.parseStatement());
  }
  this.expect(TokenType.End, "Attendu 'end' pour fermer le bloc.");
  return statements;
}
```

### 6.3. Analyse des Arguments Nommés (`NomParam: Valeur`)
LLP supporte nativement les arguments nommés dans les appels :
```llp
App.Launch(DevMode: True, WindowSize: 250 : 250)
```
Le Parser détecte le motif `Identifiant : Expression` et le transmet sous forme de propriété dans l'objet d'arguments.

---

## 7. L'Interpréteur & Le Modèle de Mémoire (Runtime & Scopes)

LLP utilise un interpréteur de type **Tree-Walking** opérant sur des environnements scopés.

### 7.1. Structure d'une Valeur Runtime (`RuntimeVal`)
```typescript
export type ValueType =
  | "null"
  | "number"
  | "boolean"
  | "string"
  | "list"
  | "fixed_array"
  | "object"
  | "instance"
  | "function"
  | "module"
  | "native_fn";

export interface RuntimeVal {
  type: ValueType;
  value?: any;
}
```

### 7.2. L'Environnement de Portée (`Environment`)
L'environnement stocke les variables et résout les liaisons lexicales :
```typescript
export class Environment {
  private parent?: Environment;
  private variables: Map<string, RuntimeVal> = new Map();
  private constants: Set<string> = new Set();
  private strictTypes: Map<string, string> = new Map();

  constructor(parentEnv?: Environment) {
    this.parent = parentEnv;
  }

  public declareVar(name: string, value: RuntimeVal, isConstant = false, strictType?: string): RuntimeVal {
    if (this.variables.has(name)) {
      throw new Error(`[LLP Runtime] Variable '${name}' déjà déclarée dans ce scope.`);
    }
    if (strictType && strictType !== "General" && strictType !== "Global") {
      this.enforceType(name, value, strictType);
      this.strictTypes.set(name, strictType);
    }
    this.variables.set(name, value);
    if (isConstant) this.constants.add(name);
    return value;
  }

  public assignVar(name: string, value: RuntimeVal): RuntimeVal {
    const env = this.resolve(name);
    if (env.constants.has(name)) {
      throw new Error(`[LLP Runtime] Impossible de réassigner la constante '${name}'.`);
    }
    const strictType = env.strictTypes.get(name);
    if (strictType) {
      env.enforceType(name, value, strictType);
    }
    env.variables.set(name, value);
    return value;
  }

  public lookupVar(name: string): RuntimeVal {
    return this.resolve(name).variables.get(name)!;
  }

  public resolve(name: string): Environment {
    if (this.variables.has(name)) return this;
    if (this.parent) return this.parent.resolve(name);
    throw new Error(`[LLP Runtime] Variable non définie '${name}'.`);
  }
}
```

---

## 8. Paramètres vs Modules de Fonction & Sécurité Aléatoire

C'est l'un des piliers novateurs de LLP : **les paramètres et les modules de fonction n'ont pas du tout le même rôle**.

```text
┌────────────────────────────────────────────────────────────────────────┐
│  FONCTION LLP                                                          │
│                                                                        │
│  Entrée ➔ [ Paramètres Bruts ] ──▶ Traités par la logique principale  │
│                                                                        │
│  Blocs Internes Pré-Embarqués :                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ module DevMode then                                              │  │
│  │    // Outils de test & débogage déjà compilés dans la fonction   │  │
│  │    // Activé si DevMode: True ou DevMode: Configuration          │  │
│  │    // SI AUCUN ACCÈS DE MODIFICATION PRÉVU :                     │  │
│  │    // État scellé & chiffré aléatoirement en mémoire (inviolable)│  │
│  │ end                                                              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────┘
```

### 8.1. Définition Technique
* **Paramètres (`appName`, `port`)** : Données transmises depuis l'extérieur vers la fonction.
* **Modules de Fonction (`module DevMode then ... end`)** : Capacités complètes, déjà codées et présentes dans la fonction. L'appelant ne les réécrit pas : il décide uniquement de les activer ou de fixer les bornes d'autorisation.

### 8.2. Algorithme de Scellement & Chiffrement Aléatoire en Mémoire
Lorsqu'un module est évalué par l'interpréteur :
1. Si l'appelant fournit un objet de configuration autorisée (ex: `DevMode: devConfig`), le module s'exécute dans une sandbox restreinte aux droits concédés.
2. **Si l'appelant n'a pas reçu ou prévu d'interface de modification** :
   - L'interpréteur génère une clé éphémère cryptographique aléatoire de 256 bits (`crypto.randomBytes(32)`).
   - L'état mémoire interne et les pointeurs de fonction du module sont scellés sous cette clé.
   - Toute tentative d'injection, de mutation ou d'introspection depuis un script externe échoue automatiquement avec une exception d'accès mémoire chiffré non autorisé.

---

## 9. Classes (.cllp), Namespaces & ToString() Arborescent

### 9.1. La Règle Stricte du Fichier `.cllp`
* Chaque fichier `.cllp` (*Class Lolpaon*) est strictement réservé à **une unique classe**.
* **Le nom du fichier doit correspondre au nom de la classe au caractère près** (ex: `Player.cllp` contient obligatoirement `class Player then ... end`).
* L'analyseur statique pré-flight rejette le fichier avant toute exécution si cette concordance n'est pas respectée.

### 9.2. Packages `namespace then ... end`
Permet de regrouper plusieurs classes logiques et de déclarer des **variables globales à l'espace de noms** :
```llp
namespace GameEngine then
    int MaxEntities = 5000
    string Version = "2.4.0"

    class PhysicsEngine then ... end
    class AudioEngine then ... end
end

print("Version:", GameEngine.Version)
General p = GameEngine.PhysicsEngine.new()
```

### 9.3. Algorithme du `ToString()` Arborescent Automatique
Toute classe et toute instance hérite d'un `ToString()` par défaut qui remonte les pointeurs de parents :
```typescript
public toStringHierarchical(): string {
  const chain: string[] = [this.Name];
  let current = this.Parent;
  while (current) {
    chain.unshift(current.Name);
    current = current.Parent;
  }
  const sourceFile = this.SourceFile || `${this.ClassName}.cllp`;
  return `[${sourceFile} > ${chain.join(" > ")}]`;
}
```
*Exemple de sortie console :* `[Player.cllp > MonApplication > ServeurJeu > ZoneNord > Guerrier]`

---

## 10. L'Arbre d'Objets (Instance Tree) & Architecture Client / Serveur

Inspiré du modèle d'arborescence d'instances, tout élément dans LLP est un nœud rattaché ou racine :

### 10.1. Structure Interne de l'Objet `Instance`
```typescript
export class InstanceVal implements RuntimeVal {
  public type: ValueType = "instance";
  public ClassName: string;
  public Name: string;
  public Parent: InstanceVal | null = null;
  public Children: InstanceVal[] = [];
  public Properties: Map<string, RuntimeVal> = new Map();

  constructor(className: string, parent?: InstanceVal) {
    this.ClassName = className;
    this.Name = className;
    if (parent) {
      this.SetParent(parent);
    }
  }

  public SetParent(newParent: InstanceVal | null) {
    if (this.Parent) {
      this.Parent.Children = this.Parent.Children.filter(c => c !== this);
    }
    this.Parent = newParent;
    if (newParent) {
      newParent.Children.push(this);
    }
  }

  public GetChildren(): InstanceVal[] {
    return [...this.Children];
  }

  public FindFirstChild(name: string): InstanceVal | null {
    return this.Children.find(c => c.Name === name) || null;
  }
}
```

### 10.2. Rapprochement Client / Serveur
Sur le client comme sur le serveur, l'arborescence est identique. Les requêtes réseau `Client.Get()` et les réceptions serveur `Server.Post()` mettent à jour des nœuds d'instance qui notifient automatiquement l'interface utilisateur.

---

## 11. Le Chef d'Orchestre (Smart Concurrency & Load Balancer)

Le Chef d'Orchestre est le gestionnaire de concurrence intégré au cœur de la machine virtuelle LLP.

```text
                            [ CHEF D'ORCHESTRE ]
                                      │
            ┌─────────────────────────┼─────────────────────────┐
            ▼                         ▼                         ▼
   [ COULOIR 1 : HAUTE ]    [ COULOIR 2 : NORMALE ]   [ COULOIR 3 : FOND ]
   - Interactions UI        - Requêtes Réseau RPC     - Calculs SciLlp / SymLlp
   - Clics, Frappes, Rendu  - Packets Client/Serveur  - Écritures BDD .cllpdb
            │                         │                         │
            └─────────────────────────┼─────────────────────────┘
                                      ▼
                        [ BOUCLE DE RÉPARTITION ]
                      (Time-Slicing : Max 16ms/tick)
                                      │
                                      ▼
                    (Garantie : Zéro Freeze d'Interface)
```

### 11.1. Algorithme de Time-Slicing
* Chaque tick de l'interpréteur s'exécute avec une fenêtre maximale de temps (ex: 16ms pour garantir 60 FPS constants).
* Si une tâche de fond (ex: optimisation mathématique ou requête de 50 000 lignes BDD) dépasse 8ms, le Chef d'Orchestre suspend son exécution, passe la main aux événements de l'UI et au réseau, puis reprend la tâche au tick suivant.
* Cela empêche toute saturation du processeur ou famine des flux interactifs.

---

## 12. Moteur Graphique GUI (.illp, .illps & Webview)

LLP permet de concevoir des interfaces graphiques professionnelles sans écrire de code de positionnement mathématique manuel :

### 12.1. Le Fichier `.illp` (Déclaratif)
Contient l'arbre des composants (`Background`, `Card`, `Grid`, `Row`, `Button`, `TextInput`, `DataGrid`, `Kanban`).
- **Responsive natif** : S'adapte automatiquement à la taille d'écran choisie (`App.Launch(WindowSize: 250 : 250)`).
- **Liaison RPC directe** : Un composant `DataGrid` peut être lié directement à une méthode serveur distante `server.Products.list`.

### 12.2. Le Fichier `.illps` (Styles Découplés)
Feuille de style compilée en temps réel. Lorsque le développeur modifie une couleur ou un espacement dans le fichier `.illps`, l'affichage de l'interface se met à jour instantanément sans redémarrage du script.

### 12.3. Rendu Hybride Haute Performance
Au runtime, le moteur graphique convertit l'AST `.illp` en un flux HTML5/CSS3 sandboxté ultra-léger affiché dans une fenêtre native Chromium/Webview sans dépendances externes lourdes.

---

## 13. Sécurité Cryptographique Matérielle (HWID, Ed25519 & AES)

Pour éliminer l'usurpation de compte, le clonage de logiciels ou le rejeu de requêtes réseau, LLP intègre une double sécurité cryptographique scellée au matériel.

### 13.1. Empreinte Matérielle Invariable (HWID)
Calculée à partir de composants internes inamovibles (hors adresses MAC et noms d'hôtes modifiables) :
$$\text{HWID} = \text{HMAC-SHA256}(\text{Motherboard UUID} + \text{CPU Processor ID} + \text{System Disk GUID})$$

### 13.2. Clés Ed25519 Scellées
* À l'initialisation, le client génère une paire de clés asymétriques **Ed25519**.
* La clé privée est scellée sur le disque (`~/.llp/device_key.seal`) via **AES-256-GCM**, dont la clé de déchiffrement est issue du HWID par PBKDF2 (25 000 itérations).
* **Anti-Clonage Garanti** : Si le fichier de clé est copié sur une autre machine, le HWID change, le déchiffrement AES échoue immédiatement (`ERR_CRYPTO_OPERATION_FAILED`), et le client est neutralisé.

### 13.3. Trames RPC Signées & Anti-Rejeu
Chaque trame envoyée au serveur contient :
* `X-Device-Id` : Identifiant matériel public.
* `X-Nonce` : UUID v4 unique à usage unique.
* `X-Timestamp` : Horodatage milliseconde (fenêtre de validité stricte de 30 secondes).
* `X-Signature` : Signature Ed25519 sur le corps de la requête.

---

## 14. Base de Données Chiffrée (.cllpdb)

Le format `.cllpdb` (*Crypted lolpaon Database*) est un moteur relationnel chiffré intégré :
* **Chiffrement AES-256 complet** de toutes les tables, colonnes et données.
* **Sécurité de Session** :
  - Dans l'éditeur visuel VS Code : verrouillage de sécurité automatique après 2 minutes d'inactivité.
  - Dans le code applicatif : durée contrôlable par le développeur (`db.StartSession("user", "pass", [duree])`).
* **Protection Administrateur** : Toute modification de mot de passe racine requiert les droits d'administration de la machine hôte.

---

## 15. L'Analyseur Statique & Diagnostiqueur Pré-Flight

Avant d'exécuter la moindre ligne de code, la commande `llp run` ou `llp check` fait passer le code dans l'analyseur pré-flight.

### Ce que vérifie l'Analyseur :
1. **Concordance des `.cllp`** : La classe déclarée correspond-elle exactement au nom du fichier ?
2. **Fermeture des Blocs** : Chaque `if`, `while`, `for`, `function`, `module`, `namespace` possède-t-il son `then` et son `end` ?
3. **Validité des Types Statiques** : Y a-t-il une tentative d'affecter un entier à une variable `string` ?
4. **Correction Orthographique des Appels** : Détection des fautes de frappe (ex: `Clinet.Connect` ➔ suggère `Client.Connect`).

### Format de Rapport Visuel dans la Console :
```text
┌── ERREUR SYNTAXIQUE DANS 'src/main.llp' (Ligne 12, Colonne 5)
│
│  10 | function Launch(appName, port) then
│  11 |     module DevMode
│  12 |         print("Dev active")
│     |         ^^^^^
│
├── CE QUI MANQUE : Le mot-clé 'then' après la déclaration du module 'DevMode'.
└── COMMENT CORRIGER :
      module DevMode then
          print("Dev active")
      end
```

---

## 16. Plan d'Ingénierie pour Refaire le Langage de Zéro

Si vous devez réimplémenter l'intégralité du langage LLP à la main (en TypeScript, Rust, C++ ou Go), voici l'ordre exact et méthodique des étapes à suivre :

### Étape 1 : Le Lexer (`src/lexer/`)
1. Définir l'énumération des `TokenType`.
2. Implémenter la boucle de scan de caractères avec gestion des colonnes et des lignes.
3. Coder l'extraction des chaînes entre guillemets, des nombres flottants/entiers et des identifiants.
4. Ajouter la gestion des commentaires `/-`, `/* *\` et l'interception des blocs `{ code }` inline.

### Étape 2 : L'AST (`src/parser/ast.ts`)
1. Modéliser les interfaces de nœuds (`Program`, `VarDecl`, `FuncDecl`, `ModuleDecl`, `ClassDecl`, `BinaryExpr`, etc.).
2. S'assurer que chaque nœud transporte sa ligne et sa colonne pour le débogage.

### Étape 3 : Le Parser (`src/parser/parser.ts`)
1. Implémenter les méthodes d'aide : `at()`, `peek()`, `advance()`, `expect()`.
2. Écrire le parseur d'expressions selon la table de priorité (Precedence Climbing).
3. Écrire le parseur d'énoncés pour `if`, `while`, `for`, `function`, `class`, `module`.

### Étape 4 : L'Environnement & Les Scopes (`src/runtime/environment.ts`)
1. Créer la classe `Environment` avec la liaison vers `parent`.
2. Gérer `declareVar`, `assignVar`, `lookupVar` avec vérification stricte des types statiques.

### Étape 5 : L'Interpréteur Principal (`src/runtime/interpreter.ts`)
1. Écrire la fonction `evaluate(astNode, env)`.
2. Ajouter le pattern-matching sur `astNode.kind`.
3. Gérer l'évaluation des opérations arithmétiques et des comparaisons logiques (`&`, `|`, `&|`).

### Étape 6 : Les Modules de Fonction & Scellement Aléatoire
1. Dans `FunctionDeclaration`, stocker les déclarations de `ModuleDeclaration`.
2. Lors de l'appel de fonction (`CallExpr`), inspecter si l'appelant passe `DevMode: True` ou une configuration.
3. Si le module n'est pas autorisé à la modification, générer une clé aléatoire et verrouiller l'objet de module en mémoire.

### Étape 7 : Les Fichiers `.cllp` et l'Arbre d'Instances (`src/runtime/instance.ts`)
1. Créer la classe `InstanceVal` avec `Name`, `ClassName`, `Parent`, `Children[]`.
2. Implémenter `GetChildren()`, `FindFirstChild(name)` et le `ToString()` arborescent.
3. Ajouter la validation pré-flight sur l'extension `.cllp`.

### Étape 8 : Le Chef d'Orchestre (`src/runtime/orchestrator.ts`)
1. Créer les 3 files de priorité (High, Normal, Background).
2. Écrire la boucle d'ordonnancement asynchrone non-bloquante avec plafonnement à 16ms par tick.

### Étape 9 : La Sécurité Matérielle HWID & Ed25519 (`src/stdlib/device.ts`)
1. Collecter les UUID de la carte mère, l'ID du processeur et le GUID du disque système.
2. Dériver la clé AES-256 avec PBKDF2 pour sceller la clé privée Ed25519 locale.
3. Implémenter le middleware de signature des requêtes client-serveur.

### Étape 10 : Le Moteur Graphique (.illp) & Base Cryptée (.cllpdb)
1. Parser les fichiers `.illp` et `.illps`.
2. Générer le conteneur Webview Chromium avec communication IPC bi-directionnelle.
3. Implémenter le moteur SQLite/AES-256 pour les fichiers `.cllpdb`.

---

## 🏆 Résumé de l'Architecture
En suivant scrupuleusement ces spécifications, vous disposez d'un écosystème logiciel complet, étanche, impossible à pirater par injection mémoire grâce au scellement aléatoire des modules, doté d'une concurrence fluide garantie par le Chef d'Orchestre, et unifié du composant graphique jusqu'au cœur de la base de données par l'Arbre d'Instances Parent-Enfant.
