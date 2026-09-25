# 🦚 Manuel Complet de Référence du Langage LLP (lolpaon)

Ce document présente l'explication détaillée, la syntaxe officielle et des exemples de code concrets pour **chaque instruction, type, mot-clé, fonction et bibliothèque standard** du langage LLP.

---

## Sommaire

1. [Système de Visibilité & Résolution Multi-Dossiers (`visibility`)](#1-système-de-visibilité--résolution-multi-dossiers-visibility)
2. [Types & Déclaration de Variables](#2-types--déclaration-de-variables)
   - `General` vs `Global`
   - Types primitifs : `int`, `float`, `string`, `bool`, `null`
   - Type `Json` (accès direct par point `.clé` & parseur)
   - Type `Hexa` (hexadécimal & codes couleur)
   - Listes dynamiques : `General{}`
   - Tableaux fixes : `General[N]{}`
3. [Structures de Contrôle de Flux](#3-structures-de-contrôle-de-flux)
   - Condition `if ... then ... else ... end`
   - Boucle `while ... then ... end`
   - Boucle d'itération `for item in liste then ... end`
   - Instruction `return`
4. [Fonctions, Classes & Redéfinition (`func`, `over`, `ToString`)](#4-fonctions-classes--redéfinition-func-over-tostring)
   - Déclaration de fonction `func`
   - Fonctions anonymes (expressions)
   - Déclaration de classes & instanciation (`class`, `new`)
   - Mot-clé `over` & Redéfinition de `ToString()`
5. [Ordonnanceur de Tâches & Concurrence (`Task`)](#5-ordonnanceur-de-tâches--concurrence-task)
   - `task.wait` / `wait`
   - `task.delay` / `delay`
   - `task.spawn` / `spawn`
   - `task.cancel`
6. [Points d'Arrêt & Débogage en Temps Réel (`breakpoint`)](#6-points-darrêt--débogage-en-temps-réel-breakpoint)
7. [Bibliothèques Standard & Modules Système](#7-bibliothèques-standard--modules-système)
   - `Instance` (Hiérarchie d'objets parent/enfant)
   - `App` (Applications graphiques & fenêtres `.illp`)
   - `CLLPDB` (Base de données chiffrée sécurisée)
   - `File` & `Directory` (Système de fichiers)
   - `System` & `Console` (`print`, `input`)
   - `Math`, `SciLlp`, `SymLlp`, `ProbLlp`
   - `Crypto` (Chiffrement AES-256)
   - `ByteBuffer`, `Socket`, `NetworkProfiler` (Couches OSI)
   - `Phone` (Capteurs & fonctionnalités mobiles)

---

## 1. Système de Visibilité & Résolution Multi-Dossiers (`visibility`)

Tout fichier script (`.llp`, `.cllp`, `.illp`, `.illps`) peut définir sa portée sur sa toute première ligne :

```llp
visibility: All
```

### Niveaux de visibilité disponibles :

| Directive | Description | Portée d'accès |
|---|---|---|
| `visibility: All` | **Public absolu** | Accessible automatiquement par tous les scripts du projet, peu importe les sous-dossiers dans lesquels ils se trouvent. |
| `visibility: Package` | **Portée répertoire** | Visible uniquement pour les fichiers situés dans le même dossier / package. |
| `visibility: Parent` | **Descendance** | Visible pour le dossier parent et tous ses sous-dossiers enfants. |
| `visibility: Private` | **Privé** | Strictement isolé ; inaccessible depuis d'autres fichiers. |

### Exemple de résolution automatique multi-dossiers :
Si vous avez un fichier `services/math_service.llp` :
```llp
visibility: All

func Multiplier(valeur, facteur) then
    return valeur * facteur
end
```
Et un fichier dans un autre sous-dossier `utils/deep/display.llp` :
```llp
visibility: All

func FormaterResultat(nb) then
    return "Résultat = " + nb
end
```
Dans votre script d'entrée `main.llp` (ou n'importe quel autre script du projet) :
```llp
visibility: All

// Aucune importation complexe nécessaire : résolution et liaison automatiques !
int total = Multiplier(10, 5)
string affichage = FormaterResultat(total)
print(affichage) // Affiche : Résultat = 50
```

---

## 2. Types & Déclaration de Variables

LLP prend en charge à la fois le typage dynamique et le typage statique rigoureux.

### `General` vs `Global`
* **`General`** : Type dynamique universel à **grand intervalle de valeurs**. Il n'impose aucune limite restrictive sur les nombres, la taille des listes ou des chaînes.
* **`Global`** : Type sécurisé à **petit intervalle de valeurs**. Conçu pour les identifiants courts, les variables d'état et la mémoire minimale :
  - Nombres limités à l'intervalle `[-32768, 32767]`.
  - Chaînes et listes limitées à 256 caractères/éléments maximum.

```llp
General grandeValeur = 1000000000   /- Grand intervalle valide
Global petitCompteur = 42           /- Petit intervalle restreint [-32768; 32767]
```

### Types primitifs
```llp
int age = 25
float pi = 3.14159
string pseudo = "Alexandre"
bool actif = true
General rien = null
```

### Type `Json`
Le type `Json` permet de manipuler des données sous forme d'objet structuré avec accès direct par point (`variable.propriete`), imbrication infinie, et modification dynamique :

```llp
// 1. Déclaration avec objet littéral { clé: valeur }
Json utilisateur = {
    nom: "Alexandre",
    age: 24,
    profil: {
        role: "Administrateur",
        grade: "Expert"
    }
}

// 2. Accès direct par point
print("Nom :", utilisateur.nom)
print("Rôle :", utilisateur.profil.role)

// 3. Modification imbriquée
utilisateur.age = 25
utilisateur.profil.role = "SuperAdmin"

// 4. Fonctions du module Json
string serialise = Json.stringify(utilisateur)
Json copie = Json.parse(serialise)
print("Copie analysée :", copie.profil.role)
```

### Type `Hexa`
Le type `Hexa` gère les entiers hexadécimaux et les chaînes de couleur hexadécimales :

```llp
Hexa masque = 0xFF          /- Valeur décimale 255
Hexa port = 0x1A2B          /- Valeur décimale 6699
Hexa couleur = "#00FF88"    /- Chaîne hexadécimale de style CSS

print("Valeur entière :", masque.ToInt())   /- 255
print("Format hexadécimal :", port.ToHex()) /- 0x1A2B
```

### Listes dynamiques : `General{}`
Une liste redimensionnable sans limite d'éléments :
```llp
General fruits = General{"Pomme", "Banane"}
fruits.Add("Orange")
print("Nombre d'éléments :", fruits.Length()) /- 3
fruits.Remove(0)                             /- Supprime "Pomme"
print("Premier élément :", fruits[0])         /- "Banane"
```

### Tableaux fixes : `General[N]{}`
Un tableau strictement borné à `N` éléments :
```llp
General buffer = General[3]{10, 20, 30}
print("Taille fixe :", buffer.MaxLength()) /- 3
buffer[0] = 99
```

---

## 3. Structures de Contrôle de Flux

LLP supporte à la fois la syntaxe Luau/Ruby (`then ... end`) et la syntaxe avec accolades `{ ... }`.

### Conditionnelle `if ... then ... else ... end`
```llp
int note = 15

if note >= 10 then
    print("Admis !")
else
    print("Ajourné.")
end
```

### Boucle `while ... then ... end`
```llp
int compteur = 0

while compteur < 5 then
    print("Tour :", compteur)
    compteur = compteur + 1
end
```

### Boucle d'itération `for item in liste then ... end`
```llp
General langages = General{"LLP", "TypeScript", "Luau"}

for lang in langages then
    print("Langage :", lang)
end
```

### Instruction `return`
Permet de renvoyer une valeur et d'interrompre l'exécution de la fonction en cours :
```llp
func Somme(a, b) then
    return a + b
end
```

---

## 4. Fonctions, Classes & Redéfinition (`func`, `over`, `ToString`)

### Déclaration de fonctions
```llp
func Saluer(string nom) then
    print("Bonjour", nom)
end

Saluer("Alexandre")
```

### Fonctions anonymes (Expressions)
Les fonctions peuvent être anonymes et passées directement en arguments :
```llp
General action = func(msg) then
    print("Message reçu :", msg)
end

action("Test")
```

### Classes & Programmation Orientée Objet
Une classe se déclare avec `class NomClasse then ... end` ou avec héritage `class Enfant : Parent then ... end`.
L'instance courante est accessible via le mot-clé `self`.

```llp
class CompteBancaire then
    string titulaire = "Inconnu"
    float solde = 0.0

    func Deposer(montant) then
        self.solde = self.solde + montant
        print("Nouveau solde :", self.solde)
    end
end

General monCompte = CompteBancaire.new()
monCompte.titulaire = "Alexandre"
monCompte.Deposer(250.50)
```

### Mot-clé `over` & Redéfinition de `ToString()`
Par défaut, chaque objet LLP possède une méthode `.ToString()` héritée qui affiche son chemin hiérarchique.
En utilisant **`func over ToString()`**, vous pouvez **re-définir la représentation textuelle** de votre classe !

Lorsqu'un objet surcharge `ToString()` :
1. L'appel direct `objet.ToString()` exécute votre fonction personnalisée.
2. L'affichage direct `print(objet)` utilise automatiquement votre chaîne personnalisée.
3. Les concaténations de chaînes `"Texte : " + objet` utilisent immédiatement cette valeur !

```llp
class Personnage then
    string nom = "Guerrier"
    int niveau = 50
    int pointsDeVie = 1000

    // Redéfinition officielle de la méthode ToString()
    func over ToString() then
        return "Personnage[Nom: " + self.nom + " | Niv: " + self.niveau + " | PV: " + self.pointsDeVie + "]"
    end
end

General hero = Personnage.new()
hero.nom = "Arthur"
hero.niveau = 99

// 1. Appel explicite
print("Appel explicite :", hero.ToString())

// 2. Affichage direct dans print()
print("Affichage direct :", hero)

// 3. Concaténation avec des chaînes de caractères
string info = "Statut actuel -> " + hero
print(info)
```

---

## 5. Ordonnanceur de Tâches & Concurrence (`Task`)

Inspiré du système de tâches de Roblox Luau, le module `Task` (accessible via `task` ou les alias globaux directs) permet d'ordonnancer des exécutions sans bloquer l'interface ni les sockets réseau.

### `task.wait(secondes)` / `wait(secondes)`
Met en pause l'exécution du script ou du thread courant pendant la durée spécifiée en secondes :
```llp
print("Début...")
task.wait(1.5) /- Attend 1.5 seconde
print("1.5 seconde s'est écoulée !")
```

### `task.delay(secondes, fonction, ...arguments)` / `delay(...)`
Planifie l'exécution d'une fonction après un délai, sans bloquer le fil d'exécution principal :
```llp
General thread = delay(3, func() then
    print("⏰ Exécuté après 3 secondes !")
end)

print("ID du thread :", thread.Id)
print("Statut actuel :", thread.Status) /- "suspended"
```

### `task.cancel(thread)`
Annule immédiatement une tâche différée avant qu'elle ne s'exécute :
```llp
General threadAAnnuler = delay(10, func() then
    print("Ce message ne s'affichera JAMAIS !")
end)

// Annulation
task.cancel(threadAAnnuler)
print("Statut après annulation :", threadAAnnuler.Status) /- "cancelled"
```

### `task.spawn(fonction, ...arguments)` / `spawn(...)`
Lance immédiatement une fonction dans un thread d'exécution asynchrone distinct :
```llp
task.spawn(func(message) then
    print("Thread asynchrone actif :", message)
end, "Traitement en arrière-plan")
```

---

## 6. Points d'Arrêt & Débogage en Temps Réel (`breakpoint`)

L'instruction `breakpoint` ou la fonction `breakpoint("label")` fige instantanément l'exécution de **tous les scripts et threads du projet de manière synchronisée**.

```llp
int compteur = 10
Json config = { mode: "debug", port: 8080 }

// Déclenche le point d'arrêt
breakpoint("VerificationConfig")

compteur = compteur + 1
```

### Commandes disponibles dans la console de débogage interactif :
* `c` : Continuer l'exécution normale du programme.
* `s` : Exécuter l'instruction suivante (pas-à-pas).
* `p <expression>` : Évaluer et afficher n'importe quelle variable ou propriété en direct (ex: `p config.port`, `p compteur`).
* `v` : Afficher toutes les variables actuellement en mémoire et leurs valeurs.
* `q` : Arrêter immédiatement le programme.

---

## 7. Bibliothèques Standard & Modules Système

### `Instance` (Arbre d'Objets Parent / Enfant)
Un modèle d'arborescence universel identique à Roblox :
```llp
General workspace = Instance.new("Folder")
workspace.Name = "Workspace"

General joueur = Instance.new("Player", workspace)
joueur.Name = "Joueur1"

General enfantTrouve = workspace.FindFirstChild("Joueur1")
print("Nom trouvé :", enfantTrouve.Name)
```

### `App` (Interface Graphique `.illp`)
Lance une fenêtre interactive optimisée avec moteur GUI natif :
```llp
App.Launch(WindowSize: 800 : 600, DevMode: False)
```

### `CLLPDB` (Base de Données Chiffrée Sécurisée)
```llp
General db = CLLPDB.Open("data/app.cllpdb")
db.StartSession("admin", "motdepasse123")
db.Execute("INSERT INTO Users (name, role) VALUES ('Alexandre', 'Admin');")
General resultats = db.Query("SELECT * FROM Users;")
```

### `File` & `Directory`
```llp
File.Write("logs.txt", "Démarrage du système à " + System.GetTimestamp())
string contenu = File.Read("logs.txt")
print("Fichier lu :", contenu)

if !Directory.Exists("sauvegardes") then
    Directory.Create("sauvegardes")
end
```

### `System`
```llp
print("Plateforme OS :", System.GetPlatform())
System.Sleep(500) /- Pause 500 ms
```

### `Math`
```llp
float racine = Math.Sqrt(144) /- 12
float puissance = Math.Pow(2, 8) /- 256
float borne = Math.Clamp(150, 0, 100) /- 100
float interpolation = Math.Lerp(0, 100, 0.5) /- 50
```

### `Crypto`
Chiffrement matériel AES-256 avec clé scellée :
```llp
string secret = Crypto.Encrypt("Donnée ultra confidentielle", "CleChiffrement123")
string clair = Crypto.Decrypt(secret, "CleChiffrement123")
print("Texte déchiffré :", clair)
```

### `Phone` (Fonctionnalités & Capteurs Téléphone)
```llp
print("Batterie :", Phone.GetBattery().level, "%")
print("Connexion :", Phone.GetNetworkInfo().type)
Phone.Vibrate(200)
```
