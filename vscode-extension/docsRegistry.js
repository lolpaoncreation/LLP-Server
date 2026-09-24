// ===================================================
// LLP Interactive Documentation Registry
// Comprehensive reference manual for all LLP keywords, classes,
// standard libraries, methods, GUI components, and properties.
// Default language: Universal English.
// Multilingual support: French (fr), Spanish (es), German (de).
// Total items: 51
// ===================================================

const LLP_CATEGORIES = {
    "TYPES": "Types & Variables",
    "CONTROL": "Control Flow & Logic",
    "CORE": "Core Built-ins & Arrays",
    "INSTANCE": "Object Tree (Instance)",
    "FILESYSTEM": "Filesystem & I/O",
    "DATABASE": "Databases (.cllpdb & .db)",
    "MATH_SCI": "Math & Scientific Libraries",
    "SECURITY": "Security & Validation",
    "GUI": "GUI Components (.illp)"
};

const LLP_CATEGORIES_I18N = {
    "fr": {
        "Types & Variables": "Types & Variables",
        "Control Flow & Logic": "Flux de Contrôle & Logique",
        "Core Built-ins & Arrays": "Fonctions Intégrées & Tableaux",
        "Object Tree (Instance)": "Arbre d'Objets (Instance)",
        "Filesystem & I/O": "Système de Fichiers & E/S",
        "Databases (.cllpdb & .db)": "Bases de Données (.cllpdb & .db)",
        "Math & Scientific Libraries": "Bibliothèques Mathématiques & Scientifiques",
        "Security & Validation": "Sécurité & Validation",
        "GUI Components (.illp)": "Composants Graphiques (.illp)"
    },
    "es": {
        "Types & Variables": "Tipos y Variables",
        "Control Flow & Logic": "Control de Flujo y Lógica",
        "Core Built-ins & Arrays": "Funciones Integradas y Arreglos",
        "Object Tree (Instance)": "Árbol de Objetos (Instance)",
        "Filesystem & I/O": "Sistema de Archivos y E/S",
        "Databases (.cllpdb & .db)": "Bases de Datos (.cllpdb & .db)",
        "Math & Scientific Libraries": "Bibliotecas Matemáticas y Científicas",
        "Security & Validation": "Seguridad y Validación",
        "GUI Components (.illp)": "Componentes GUI (.illp)"
    },
    "de": {
        "Types & Variables": "Typen & Variablen",
        "Control Flow & Logic": "Kontrollfluss & Logik",
        "Core Built-ins & Arrays": "Kernfunktionen & Arrays",
        "Object Tree (Instance)": "Objektbaum (Instance)",
        "Filesystem & I/O": "Dateisystem & E/A",
        "Databases (.cllpdb & .db)": "Datenbanken (.cllpdb & .db)",
        "Math & Scientific Libraries": "Mathematik & Wissenschaftliche Bibliotheken",
        "Security & Validation": "Sicherheit & Validierung",
        "GUI Components (.illp)": "GUI-Komponenten (.illp)"
    }
};

const LLP_UI_I18N = {
    "en": {
        "title": "LLP Interactive Documentation • Read-Only Reference Manual",
        "badgeCount": "55 Official Items",
        "searchPlaceholder": "🔍 Filter documentation by keyword, type, or component...",
        "allCategories": "All Categories",
        "expandAll": "Expand All",
        "collapseAll": "Collapse All",
        "paramsTitle": "Parameters & Configuration",
        "syntaxTitle": "Syntax Signature",
        "descTitle": "Description & Behavior",
        "codeTitle": "Read-Only Code Example",
        "readonlyBadge": "Read-Only (Reference Only)",
        "copyExample": "Copy Example",
        "copy": "Copy",
        "copied": "Copied!",
        "thParam": "Parameter",
        "thType": "Type",
        "thDesc": "Description",
        "sidebarHeader": "Documentation Index",
        "langLabel": "Language:"
    },
    "fr": {
        "title": "Documentation Interactive LLP • Manuel de Référence (Lecture Seule)",
        "badgeCount": "55 Éléments Officiels",
        "searchPlaceholder": "🔍 Filtrer la documentation par mot-clé, type ou composant...",
        "allCategories": "Toutes les catégories",
        "expandAll": "Tout déplier",
        "collapseAll": "Tout replier",
        "paramsTitle": "Paramètres & Configuration",
        "syntaxTitle": "Signature Syntaxique",
        "descTitle": "Description & Comportement",
        "codeTitle": "Exemple de Code (Lecture Seule)",
        "readonlyBadge": "Lecture Seule (Référence)",
        "copyExample": "Copier l'exemple",
        "copy": "Copier",
        "copied": "Copié !",
        "thParam": "Paramètre",
        "thType": "Type",
        "thDesc": "Description",
        "sidebarHeader": "Index de la documentation",
        "langLabel": "Langue :"
    },
    "es": {
        "title": "Documentación Interactiva LLP • Manual de Referencia (Solo Lectura)",
        "badgeCount": "55 Elementos Oficiales",
        "searchPlaceholder": "🔍 Filtrar la documentación por palabra clave, tipo o componente...",
        "allCategories": "Todas las categorías",
        "expandAll": "Expandir todo",
        "collapseAll": "Contraer todo",
        "paramsTitle": "Parámetros y Configuración",
        "syntaxTitle": "Firma Sintáctica",
        "descTitle": "Descripción y Comportamiento",
        "codeTitle": "Ejemplo de Código (Solo Lectura)",
        "readonlyBadge": "Solo Lectura (Referencia)",
        "copyExample": "Copiar ejemplo",
        "copy": "Copiar",
        "copied": "¡Copiado!",
        "thParam": "Parámetro",
        "thType": "Tipo",
        "thDesc": "Descripción",
        "sidebarHeader": "Índice de documentación",
        "langLabel": "Idioma:"
    },
    "de": {
        "title": "Interaktive LLP-Dokumentation • Schreibgeschütztes Referenzhandbuch",
        "badgeCount": "55 Offizielle Elemente",
        "searchPlaceholder": "🔍 Dokumentation nach Stichwort, Typ oder Komponente filtern...",
        "allCategories": "Alle Kategorien",
        "expandAll": "Alle aufklappen",
        "collapseAll": "Alle zuklappen",
        "paramsTitle": "Parameter & Konfiguration",
        "syntaxTitle": "Syntax-Signatur",
        "descTitle": "Beschreibung & Verhalten",
        "codeTitle": "Codebeispiel (Schreibgeschützt)",
        "readonlyBadge": "Schreibgeschützt (Nur Referenz)",
        "copyExample": "Beispiel kopieren",
        "copy": "Kopieren",
        "copied": "Kopiert!",
        "thParam": "Parameter",
        "thType": "Typ",
        "thDesc": "Beschreibung",
        "sidebarHeader": "Dokumentationsindex",
        "langLabel": "Sprache:"
    }
};

const LLP_ITEMS_I18N = {
    "fr": {
        "general": {
            "summary": "Type dynamique universel, liste redimensionnable ou tableau à taille fixe.",
            "description": "Le mot-clé 'General' est le type universel fondamental en LLP. Il peut contenir tout type scalaire (string, int, float, bool, instance). Lorsqu'il est initialisé avec des accolades '{...}', il crée une liste dynamique redimensionnable. Lorsqu'il est initialisé avec des crochets '[N]{...}', il crée un tableau à taille fixe strictement plafonné à la capacité N.",
            "parameters": {
                "varName": "Nom de la variable ou du conteneur",
                "[N]": "Capacité maximale du tableau fixe (ex: General[3])",
                "{...}": "Éléments séparés par des virgules pour la liste ou le tableau"
            }
        },
        "app": {
            "summary": "Contrôleur principal du cycle de vie et de la fenêtre de l'application graphique.",
            "description": "L'objet système 'App' est le point d'entrée natif pour piloter le cycle de vie de l'application graphique LLP. Il permet de lancer l'interface utilisateur avec une taille de fenêtre personnalisée, d'activer le mode développeur (DevMode), de verrouiller le redimensionnement et le plein écran (Lock), d'exécuter l'application en arrière-plan (Silence) et de forcer l'arrêt propre du programme (Close).",
            "parameters": {}
        },
        "app_launch": {
            "summary": "Démarre et affiche l'interface graphique de l'application avec dimensions et options de débogage.",
            "description": "Lance le serveur d'application et ouvre la fenêtre cliente. Accepte 'WindowSize: Largeur : Hauteur' pour imposer une résolution en pixels (ex: 250 : 250 pour 250x250 px), ainsi que 'DevMode: True/False' pour activer les droits et outils développeur (console d'inspection, modification de variables et tests en direct).",
            "parameters": {
                "WindowSize": "Taille de la fenêtre en pixels (ex: 250 : 250, 1200 : 860)",
                "DevMode": "Active le mode développeur pour tester sur un appareil avec droits de modification et console de débogage"
            }
        },
        "app_lock": {
            "summary": "Empêche le redimensionnement de la fenêtre à la souris et désactive le plein écran (taille fixe).",
            "description": "Verrouille les dimensions de la fenêtre de l'application. Empêche l'utilisateur d'étirer les bords avec la souris ou de basculer en mode plein écran (F11 ou bouton agrandir). La fenêtre conserve une taille fixe.",
            "parameters": {}
        },
        "app_silence": {
            "summary": "Fait tourner l'application en arrière-plan sans interface graphique (en veille ou active).",
            "description": "Fait tourner l'application en arrière-plan sans interface graphique visible, tout en restant disponible en mémoire. Sans paramètre ('App.Silence()'), l'application reste inactive en veille (comme lorsqu'on clique sur le bouton réduire '-' ou qu'on revient à l'écran d'accueil d'un téléphone). Avec 'RunBack: True', l'application reste active et continue de s'exécuter et traiter ses tâches de fond.",
            "parameters": {
                "RunBack": "Si True, l'application tourne encore activement en tâche de fond"
            }
        },
        "app_close": {
            "summary": "Force l'arrêt et la fermeture immédiate de l'application.",
            "description": "Permet au développeur d'arrêter et de forcer la fermeture immédiate de l'application et de ses processus associés si le PC ou le téléphone ne veut pas s'arrêter, ou pour déclencher une sortie propre programmée.",
            "parameters": {}
        },
        "string": {
            "summary": "Type chaîne de caractères statique pour les données textuelles UTF-8.",
            "description": "Déclaration de type statique explicite garantissant que la variable contient une chaîne de caractères UTF-8. Empêche l'affectation à l'exécution de valeurs non textuelles.",
            "parameters": {
                "value": "Texte entouré de guillemets doubles"
            }
        },
        "int": {
            "summary": "Type entier statique pour les nombres entiers signés 64 bits.",
            "description": "Représente des nombres entiers signés. Tronque toute décimale pour garantir une arithmétique entière exacte.",
            "parameters": {
                "value": "Valeur numérique entière"
            }
        },
        "float": {
            "summary": "Type virgule flottante statique pour les décimales de haute précision.",
            "description": "Représente des nombres à virgule flottante double précision 64 bits IEEE 754. Idéal pour les prix, les coordonnées physiques et les calculs scientifiques.",
            "parameters": {
                "value": "Valeur numérique décimale"
            }
        },
        "bool": {
            "summary": "Type booléen statique représentant des valeurs de vérité (true ou false).",
            "description": "Type booléen strict n'acceptant que 'true' ou 'false'. Utilisé directement dans la logique conditionnelle et les boucles.",
            "parameters": {
                "value": "Soit true, soit false"
            }
        },
        "global": {
            "summary": "Déclaration de portée globale accessible partout entre fichiers et commentaires.",
            "description": "Déclare une variable à portée globale accessible dans tous les blocs et fonctions. Permet aussi l'exécution de code incorporé dans les commentaires au format '{ Global var = value }'.",
            "parameters": {
                "varName": "Nom de la variable dans la portée globale"
            }
        },
        "visibility": {
            "summary": "Directive d'en-tête d'interface définissant la portée de visibilité d'exportation.",
            "description": "Directive placée sur la première ligne d'un fichier d'interface (.illp). 'visibility: All' permet à l'interface d'être importée ou ciblée par tous les modules de l'application.",
            "parameters": {
                "scope": "All | Internal | Private"
            }
        },
        "if": {
            "summary": "Branchement d'exécution conditionnelle basé sur une évaluation booléenne.",
            "description": "Évalue une condition. Si elle est vraie, exécute le premier bloc ; sinon, exécute le bloc optionnel else.",
            "parameters": {
                "condition": "Expression retournant un booléen"
            }
        },
        "for": {
            "summary": "Itère sur les éléments d'une liste, d'un tableau fixe ou des enfants d'une instance.",
            "description": "Structure de boucle qui parcourt séquentiellement chaque élément d'une collection sans nécessiter de gestion d'index.",
            "parameters": {
                "item": "Variable d'itération",
                "collection": "Collection à parcourir"
            }
        },
        "while": {
            "summary": "Exécute des instructions en boucle tant qu'une condition reste vraie.",
            "description": "Réévalue la condition avant chaque passage. Continue tant que la condition est vraie ou jusqu'à un break.",
            "parameters": {
                "condition": "Condition évaluée à chaque passage"
            }
        },
        "print": {
            "summary": "Affiche une ou plusieurs valeurs dans la sortie standard / terminal.",
            "description": "Fonction de sortie principale en LLP. Accepte un nombre variable d'arguments, les affiche séparés par des espaces et ajoute un saut de ligne.",
            "parameters": {
                "...args": "Une ou plusieurs valeurs ou expressions séparées par des virgules"
            }
        },
        "length": {
            "summary": "Retourne le nombre actuel d'éléments dans une liste, un tableau ou une chaîne.",
            "description": "Méthode disponible sur les listes dynamiques, les tableaux et les chaînes renvoyant le décompte d'éléments ou de caractères.",
            "parameters": {}
        },
        "maxlength": {
            "summary": "Retourne la capacité maximale d'allocation d'un tableau fixe General[N].",
            "description": "Méthode exclusive aux tableaux à taille fixe General[N] renvoyant la capacité maximale autorisée.",
            "parameters": {}
        },
        "add": {
            "summary": "Ajoute un élément à la fin d'une liste dynamique General{...}.",
            "description": "Étend dynamiquement la liste General en ajoutant la valeur passée à la fin.",
            "parameters": {
                "element": "La valeur à ajouter"
            }
        },
        "instance": {
            "summary": "Crée un nouveau nœud d'instance hiérarchique dans l'arbre d'objets parent-enfant.",
            "description": "Instancie un nœud inspiré de la hiérarchie d'objets Roblox. Les nœuds possèdent des noms, des parents, des enfants et des propriétés, permettant des architectures arborescentes pour l'UI et les services.",
            "parameters": {
                "className": "Nom de la classe : 'Folder', 'Window', 'Page', 'ModalPage', 'Button', 'TextInput', etc.",
                "parentInstance": "Nœud parent auquel attacher cette instance"
            }
        },
        "getchildren": {
            "summary": "Retourne une liste dynamique des enfants directs de l'instance.",
            "description": "Inspecte les enfants directs d'un nœud d'instance et les renvoie sous forme de liste General itérable.",
            "parameters": {}
        },
        "findfirstchild": {
            "summary": "Recherche et retourne le premier enfant correspondant au nom spécifié.",
            "description": "Parcourt les enfants directs de l'instance. Renvoie l'instance correspondante ou null si non trouvée.",
            "parameters": {
                "name": "Nom recherché"
            }
        },
        "name": {
            "summary": "Propriété chaîne en lecture/écriture représentant l'identifiant du nom d'une instance.",
            "description": "Utilisé pour l'identification et la découverte d'enfants via FindFirstChild.",
            "parameters": {}
        },
        "parent": {
            "summary": "Référence en lecture/écriture vers l'instance parente dans l'arbre.",
            "description": "Permet de rattacher des nœuds dynamiquement à l'exécution ou de les détacher en assignant null.",
            "parameters": {}
        },
        "file": {
            "summary": "Opérations sur le système de fichiers pour lire, écrire et vérifier des fichiers.",
            "description": "Bibliothèque utilitaire statique de système de fichiers pour la persistance de texte, de configuration et de données.",
            "parameters": {
                "path": "Chemin de fichier relatif ou absolu",
                "content": "Contenu textuel à écrire"
            }
        },
        "directory": {
            "summary": "Utilitaire de gestion de répertoires pour créer et lister des dossiers.",
            "description": "Gestion statique des répertoires pour organiser les fichiers, scanner les dossiers et initialiser les structures.",
            "parameters": {
                "path": "Chemin du dossier"
            }
        },
        "cllpdb": {
            "summary": "Service de base de données chiffrée AES avec session configurable par le développeur et moteur UTF-8 MySQL.",
            "description": "Moteur de base de données chiffrée spécifique à LLP (.cllpdb). Comporte un chiffrement AES-256, une clé unique par projet, une durée de session définie par le développeur (permanente par défaut dans les scripts ou avec délai personnalisé ; session de 2 minutes pour la sécurité uniquement lors de l'ouverture du visualiseur VS Code), connexion/déconnexion à la demande (.CloseSession() / .Disconnect()), et tables relationnelles avec clés primaires (🔑) et clés étrangères (🔗). Supporte les caractères internationaux UTF-8 et le SQL standard.",
            "parameters": {
                "filePath": "Chemin vers le fichier .cllpdb (ex: data/products.cllpdb)",
                "key": "Surcharge de clé de chiffrement (optionnelle)",
                "durationSeconds": "Durée de session en secondes (optionnelle ; si omise ou 0, la session reste active indéfiniment)"
            }
        },
        "database": {
            "summary": "Service de base de données standard Clé-Valeur et tables simples (.db).",
            "description": "Stockage léger Clé-Valeur et tables simples sans chiffrement, idéal pour le cache et les états temporaires.",
            "parameters": {
                "filePath": "Chemin vers le fichier .db"
            }
        },
        "py": {
            "summary": "Constante mathématique universelle π (3.141592653589793) accessible partout.",
            "description": "Constante universelle représentant Pi (π). Reconnue globalement par tous les fichiers LLP et scripts utilisateur sans nécessiter d'import.",
            "parameters": {}
        },
        "math": {
            "summary": "Bibliothèque de fonctions mathématiques standard.",
            "description": "Fournit les fonctions mathématiques usuelles : arrondis, puissances, racines carrées, fonctions trigonométriques et encadrement min/max.",
            "parameters": {
                "val": "Entrée numérique"
            }
        },
        "scillp": {
            "summary": "Bibliothèque de calcul scientifique avancé (équivalent SciPy pour LLP).",
            "description": "Module de calcul scientifique offrant des métriques statistiques descriptives (Mean, StdDev), traitement du signal (MovingAverage, SignalFilter), intégration numérique et optimisation.",
            "parameters": {
                "list": "Jeu de données d'entrée"
            }
        },
        "symllp": {
            "summary": "Bibliothèque de mathématiques symboliques et calcul formel (équivalent SymPy pour LLP).",
            "description": "Permet les manipulations algébriques formelles : résolution d'équations, dérivées formelles, intégrales indéfinies, simplification algébrique et déterminants.",
            "parameters": {
                "equation": "Expression algébrique",
                "variable": "Variable cible (ex: 'x')"
            }
        },
        "probllp": {
            "summary": "Bibliothèque de probabilités, combinatoire et lois de distribution.",
            "description": "Moteur de combinatoire et probabilités calculant les factorielles, permutations, combinaisons et lois de Poisson, binomiale et normale.",
            "parameters": {
                "n": "Taille totale de la population",
                "k": "Taille de l'échantillon"
            }
        },
        "crypto": {
            "summary": "Bibliothèque de cryptographie fournissant clé unique de projet et chiffrement AES-256.",
            "description": "Fournit les outils de sécurité cryptographique pour les projets LLP. Chaque projet possède une clé de chiffrement déterministe unique générée à partir de son chemin.",
            "parameters": {}
        },
        "uivalidator": {
            "summary": "Règles de validation des formulaires et notifications toast pour l'utilisateur.",
            "description": "Service de validation intégré pour vérifier les champs de saisie, les emails, les limites numériques et afficher des notifications de validation standard.",
            "parameters": {
                "val": "Entrée à valider"
            }
        },
        "background": {
            "summary": "Conteneur racine pour une fenêtre d'application dans une interface .illp.",
            "description": "Le conteneur principal de toute interface visuelle LLP. Supporte le mode réactif responsive, ainsi que les contraintes min/max de largeur et hauteur.",
            "parameters": {
                "name": "Identifiant du composant",
                "responsive": "Active la disposition flexible responsive",
                "minWidth / maxWidth": "Contrainte de largeur (ex: '480px')",
                "minHeight / maxHeight": "Contrainte de hauteur (ex: '600px')"
            }
        },
        "card": {
            "summary": "Composant conteneur Carte regroupant des widgets avec un titre d'en-tête optionnel.",
            "description": "Carte conteneur visuelle avec bord arrondi, ombre et titre d'en-tête pour organiser les contrôles en sections fonctionnelles distinctes.",
            "parameters": {
                "title": "Titre d'en-tête affiché en haut de la carte"
            }
        },
        "row": {
            "summary": "Conteneur flexbox horizontal disposant les éléments enfants côte à côte.",
            "description": "Affiche les éléments enfants horizontalement avec espacement uniforme et alignement vertical.",
            "parameters": {}
        },
        "grid": {
            "summary": "Conteneur de grille responsive multi-colonnes.",
            "description": "Organise les éléments enfants dans une grille structurée avec un nombre de colonnes spécifié.",
            "parameters": {
                "columns": "Nombre de colonnes (ex: 1, 2, 3, 4)"
            }
        },
        "modal": {
            "summary": "Fenêtre superposée (Page sur Page / Modale) affichée au-dessus de l'interface parente.",
            "description": "Fenêtre superposée imbriquée ('Page on Page') qui apparaît au-dessus de la page hôte. Supporte les champs de saisie, les boutons de confirmation et les actions de fermeture.",
            "parameters": {
                "title": "Titre de la modale dans la barre d'en-tête"
            }
        },
        "button": {
            "summary": "Bouton cliquable interactif avec navigation (targetPage) ou actions modales.",
            "description": "Déclenche la navigation vers un autre fichier .illp via 'targetPage', ouvre une fenêtre modale via 'action: openModal:Nom', ou déclenche des événements personnalisés.",
            "parameters": {
                "text": "Texte du libellé du bouton",
                "targetPage": "Chemin du fichier .illp cible vers lequel naviguer",
                "action": "Action : 'openModal:Nom' ou 'closeModal'"
            }
        },
        "textinput": {
            "summary": "Champ de saisie de texte mono-ligne avec support de texte indicatif (placeholder).",
            "description": "Champ de saisie pour l'entrée de texte utilisateur, saisie de mot de passe ou valeurs numériques.",
            "parameters": {
                "placeholder": "Texte indicatif affiché lorsque le champ est vide"
            }
        },
        "text": {
            "summary": "Élément d'étiquette textuelle affichant du contenu formaté.",
            "description": "Affiche du texte statique, des titres, des sous-titres et des indicateurs d'état dans l'interface.",
            "parameters": {
                "content": "Contenu textuel à afficher"
            }
        },
        "checkbox": {
            "summary": "Case à cocher interactive de bascule booléenne.",
            "description": "Bascule permettant d'activer ou désactiver des options et fonctionnalités de l'application.",
            "parameters": {
                "label": "Description textuelle à côté de la case",
                "checked": "État initial (true ou false)"
            }
        },
        "itembox": {
            "summary": "Contrôle de sélection déroulant pour choisir un élément parmi une liste.",
            "description": "Sélecteur déroulant alimenté par une liste d'options sous forme de chaînes.",
            "parameters": {
                "default": "Élément sélectionné par défaut",
                "items": "Liste des options sélectionnables"
            }
        },
        "image": {
            "summary": "Affiche une ressource image depuis un chemin de fichier.",
            "description": "Intègre une image ou un graphique vectoriel dans l'interface utilisateur.",
            "parameters": {
                "src": "Chemin de fichier vers l'image"
            }
        },
        "progressbar": {
            "summary": "Barre de progression visuelle indiquant le pourcentage d'avancement.",
            "description": "Affiche visuellement la progression, un quota ou le temps restant d'une session.",
            "parameters": {
                "value": "Valeur actuelle",
                "max": "Valeur d'échelle maximale (ex: 100)"
            }
        },
        "session": {
            "summary": "Gestionnaire de sessions chiffrées façon PHP avec persistance AES-256.",
            "description": "Système complet de gestion de session inspiré de PHP. Conserve les variables en mémoire et les sauvegarde sur disque avec chiffrement transparent AES-256 (.cllpsess). Permet de démarrer, stocker (Set), lire (Get), vérifier (Has), supprimer (Remove) et persister (Save) les sessions applicatives.",
            "parameters": {
                "key": "Nom de la variable de session",
                "value": "Valeur à stocker",
                "customId": "Identifiant de session personnalisé"
            }
        },
        "device": {
            "summary": "Identification matérielle unique et moteur anti-usurpation d'appareil inviolable.",
            "description": "Lie l'application aux caractéristiques physiques immuables de l'appareil (Machine GUID, processeur, carte mère, adresses MAC). Génère un identifiant unique 64 caractères (Device.GetId) et des jetons cryptographiques horodatés (Device.GetToken). Empêche le clonage et l'usurpation d'appareils par des tiers.",
            "parameters": {
                "payload": "Portée ou nonce d'authentification",
                "token": "Jeton signé à vérifier",
                "data": "Texte à signer"
            }
        },
        "client": {
            "summary": "Connecteur client HTTP/HTTPS distant avec authentification matérielle et sessions automatiques.",
            "description": "Permet aux logiciels et applications de déléguer la gestion des comptes et données à un serveur distant. Envoie automatiquement les en-têtes d'identification matérielle (X-Device-Id, X-Device-Token) et de session (X-Session-Id). Connexion par nom de domaine ou IP:Port pour des applications clientes ultra-légères.",
            "parameters": {
                "domainOrIp": "Adresse IP ou nom de domaine du serveur",
                "port": "Port TCP distant",
                "path": "Point d'accès API cible",
                "body": "Données JSON pour requête"
            }
        },
        "server": {
            "summary": "Moteur de serveur backend dédié en LLP avec routage et contrôle anti-usurpation matériel.",
            "description": "Permet de concevoir des serveurs backend complets en pur langage LLP. Comprend un serveur HTTP natif, un système de routage, la validation stricte des appareils (Server.RequireDevice), le suivi des clients connectés, le bannissement d'appareils et la gestion des sessions. Exécution autonome via 'llp server <script.llp>'.",
            "parameters": {
                "port": "Port d'écoute TCP (ex: 8080)",
                "host": "Adresse d'écoute hôte (défaut '0.0.0.0')",
                "path": "Route URL cible",
                "handler": "Fonction de traitement recevant la requête"
            }
        },
        "module": {
            "summary": "Module de fonction interne pré-embarqué (ex: DevMode). Si aucune modification n'est prévue, son état est scellé/chiffré aléatoirement.",
            "description": "Les modules de fonction ('module NomModule then ... end') sont des blocs de fonctionnalités complets pré-embarqués directement dans le corps d'une fonction. Contrairement aux paramètres classiques qui ne sont que des données d'entrée, la fonction possède déjà toute la logique du module (ex: console de débogage, inspecteur réseau client-serveur, gestion des comptes de test). L'appelant active le module (ex: DevMode: True) ou configure ses permissions de test. Règle de sécurité : si le développeur de la fonction n'a pas prévu de méthode pour modifier la valeur ou l'état du module, celle-ci reste inviolable car elle est scellée et chiffrée de façon aléatoire en mémoire pour empêcher toute altération.",
            "parameters": {
                "ModuleName": "Nom du module de fonction (ex: DevMode)",
                "options": "Configuration ou activation booléenne (ex: DevMode: True ou DevMode: config)"
            }
        },
        "namespace": {
            "summary": "Déclaration de package regroupant des classes et variables globales partagées.",
            "description": "Le mot-clé 'namespace then ... end' permet d'organiser le code en packages logiques. Il regroupe plusieurs classes et définit des variables globales de namespace partagées entre ces classes sans polluer la portée globale.",
            "parameters": {
                "NamespaceName": "Nom du package d'espace de noms"
            }
        },
        "cllp": {
            "summary": "Fichier de classe dédiée Class Lolpaon (.cllp) avec ToString() hiérarchique automatique.",
            "description": "Tout fichier .cllp ne contient strictement qu'une seule classe, dont le nom doit être identique au nom du fichier (ex: Player.cllp contient 'class Player'). Toutes les classes héritent automatiquement d'un ToString() arborescent affichant la chaîne parentale complète jusqu'au fichier source (ex: [Player.cllp > Root > Parent > Enfant]).",
            "parameters": {}
        },
        "orchestrator": {
            "summary": "Chef d'orchestre multi-tâches intelligent gérant la concurrence et priorisant les flux sous forte charge.",
            "description": "Le Chef d'orchestre est le moteur de concurrence et de répartition asynchrone de LLP. Il sépare, découpe et priorise les flux de requêtes (I/O, réseau client-serveur, requêtes base de données et calculs) pour garantir une exécution optimale sans aucun blocage, même lorsque l'application croule sous un volume massif de demandes.",
            "parameters": {
                "task": "Tâche, fonction ou routine asynchrone à planifier",
                "priority": "Niveau de priorité ('High', 'Normal', 'Background')"
            }
        }
    },
    "es": {
        "general": {
            "summary": "Tipo dinámico universal, lista redimensionable o arreglo de tamaño fijo.",
            "description": "La palabra clave 'General' es el tipo versátil fundamental en LLP. Puede contener cualquier tipo escalar (string, int, float, bool, instance). Al inicializarse con llaves '{...}', instancia una lista dinámica redimensionable. Con corchetes '[N]{...}', crea un arreglo de tamaño fijo limitado estrictamente a la capacidad N.",
            "parameters": {
                "varName": "Nombre de la variable o contenedor",
                "[N]": "Capacidad máxima del arreglo fijo (ej: General[3])",
                "{...}": "Elementos separados por comas para la lista o arreglo"
            }
        },
        "app": {
            "summary": "Controlador principal del ciclo de vida y la ventana de la aplicación gráfica.",
            "description": "El objeto del sistema 'App' es el punto de entrada nativo para controlar el ciclo de vida de la aplicación gráfica LLP. Permite iniciar la interfaz con dimensiones personalizadas, activar el modo desarrollador (DevMode), bloquear el redimensionamiento y pantalla completa (Lock), ejecutar en segundo plano (Silence) y forzar el cierre seguro (Close).",
            "parameters": {}
        },
        "app_launch": {
            "summary": "Inicia y muestra la ventana de la aplicación gráfica con resolución personalizada y modo de depuración.",
            "description": "Inicia el servidor de la aplicación y abre la ventana de interfaz del cliente. Acepta 'WindowSize: Ancho : Alto' para imponer una resolución en píxeles (ej: 250 : 250), y 'DevMode: True/False' para activar privilegios de desarrollador, consola de inspección y herramientas de prueba.",
            "parameters": {
                "WindowSize": "Tamaño de la ventana en píxeles (ej: 250 : 250, 1200 : 860)",
                "DevMode": "Activa el modo desarrollador para probar en dispositivo con derechos de edición y consola de depuración"
            }
        },
        "app_lock": {
            "summary": "Impide el redimensionamiento de la ventana con el ratón y desactiva la pantalla completa (tamaño fijo).",
            "description": "Bloquea las dimensiones de la ventana de la aplicación. Evita que el usuario arrastre los bordes con el ratón o active pantalla completa (F11 o botón maximizar). La ventana conserva un tamaño fijo.",
            "parameters": {}
        },
        "app_silence": {
            "summary": "Ejecuta la aplicación en segundo plano sin interfaz gráfica visible (suspendida o activa).",
            "description": "Ejecuta la aplicación en segundo plano sin mostrar una ventana mientras permanece en memoria. Sin argumentos ('App.Silence()'), la aplicación queda suspendida en espera. Con 'RunBack: True', la aplicación permanece activa ejecutando tareas de fondo.",
            "parameters": {
                "RunBack": "Si es True, la aplicación continúa ejecutando tareas en segundo plano"
            }
        },
        "app_close": {
            "summary": "Fuerza el cierre inmediato y la terminación de la aplicación y sus procesos.",
            "description": "Permite al desarrollador finalizar y forzar el cierre inmediato de la aplicación y sus procesos asociados cuando el dispositivo no responde, o para programar una salida limpia.",
            "parameters": {}
        },
        "string": {
            "summary": "Tipo cadena estático para datos de texto en UTF-8.",
            "description": "Declaración de tipo estático explícito que garantiza que la variable contenga una cadena de caracteres UTF-8. Evita la asignación en tiempo de ejecución de valores no textuales.",
            "parameters": {
                "value": "Texto encerrado entre comillas dobles"
            }
        },
        "int": {
            "summary": "Tipo entero estático para números enteros de 64 bits.",
            "description": "Representa números enteros con signo. Trunca los valores decimales para garantizar aritmética entera exacta.",
            "parameters": {
                "value": "Valor numérico entero"
            }
        },
        "float": {
            "summary": "Tipo de punto flotante estático para decimales de alta precisión.",
            "description": "Representa números de coma flotante de doble precisión IEEE 754 de 64 bits. Ideal para precios, coordenadas físicas y cálculos científicos.",
            "parameters": {
                "value": "Valor numérico decimal"
            }
        },
        "bool": {
            "summary": "Tipo booleano estático que representa valores de verdad (true o false).",
            "description": "Tipo booleano estricto que solo acepta 'true' o 'false'. Se usa directamente en la lógica condicional y bucles.",
            "parameters": {
                "value": "Ya sea true o false"
            }
        },
        "global": {
            "summary": "Declaración de alcance global accesible en todos los archivos y comentarios.",
            "description": "Declara una variable con alcance global accesible en todos los ámbitos y funciones. También permite la ejecución de código incrustado en comentarios como '{ Global var = valor }'.",
            "parameters": {
                "varName": "Nombre de la variable en el ámbito global"
            }
        },
        "visibility": {
            "summary": "Directiva de encabezado de interfaz que define el alcance de exportación.",
            "description": "Directiva colocada en la primera línea de un archivo de interfaz (.illp). 'visibility: All' permite que todos los módulos del proyecto importen o naveguen a la interfaz.",
            "parameters": {
                "scope": "All | Internal | Private"
            }
        },
        "if": {
            "summary": "Bifurcación de ejecución condicional basada en una evaluación booleana.",
            "description": "Evalúa una expresión. Si es verdadera, ejecuta el bloque principal; de lo contrario, ejecuta el bloque else opcional.",
            "parameters": {
                "condition": "Expresión que devuelve un booleano"
            }
        },
        "for": {
            "summary": "Itera sobre los elementos de una lista, arreglo fijo o hijos de una instancia.",
            "description": "Estructura de bucle que recorre secuencialmente cada elemento de una colección sin necesidad de administrar índices.",
            "parameters": {
                "item": "Variable de iteración",
                "collection": "Colección a recorrer"
            }
        },
        "while": {
            "summary": "Ejecuta instrucciones repetidamente mientras una condición sea verdadera.",
            "description": "Reevalúa la condición antes de cada iteración. Continúa ejecutándose hasta que la condición sea falsa o se invoque break.",
            "parameters": {
                "condition": "Condición evaluada en cada iteración"
            }
        },
        "print": {
            "summary": "Imprime uno o más valores en la salida estándar / terminal.",
            "description": "Función de salida principal en LLP. Toma un número variable de argumentos, los formatea separados por espacios e imprime un salto de línea al final.",
            "parameters": {
                "...args": "Uno o más valores o expresiones separados por comas"
            }
        },
        "length": {
            "summary": "Devuelve el número actual de elementos en una lista, arreglo o cadena.",
            "description": "Método disponible en listas dinámicas, arreglos y cadenas que devuelve la cantidad de elementos o caracteres.",
            "parameters": {}
        },
        "maxlength": {
            "summary": "Devuelve la capacidad máxima de asignación fija de un arreglo General[N].",
            "description": "Método exclusivo en arreglos de tamaño fijo General[N] que devuelve el límite máximo de capacidad permitido.",
            "parameters": {}
        },
        "add": {
            "summary": "Agrega un elemento al final de una lista dinámica General{...}.",
            "description": "Expande dinámicamente la lista General agregando el valor proporcionado al final.",
            "parameters": {
                "element": "El valor a agregar"
            }
        },
        "instance": {
            "summary": "Crea un nuevo nodo de instancia jerárquica en el árbol de objetos padre-hijo.",
            "description": "Instancia un nodo inspirado en la jerarquía de Roblox. Los nodos tienen nombres, padres, hijos y propiedades, permitiendo arquitecturas en árbol para UI y servicios.",
            "parameters": {
                "className": "Nombre de clase: 'Folder', 'Window', 'Page', 'ModalPage', 'Button', 'TextInput', etc.",
                "parentInstance": "Nodo padre al que adjuntar esta instancia"
            }
        },
        "getchildren": {
            "summary": "Devuelve una lista dinámica de las instancias hijas directas.",
            "description": "Inspecciona los hijos directos de un nodo de instancia y los devuelve como una lista General iterable.",
            "parameters": {}
        },
        "findfirstchild": {
            "summary": "Busca y devuelve el primer hijo que coincide con el nombre especificado.",
            "description": "Recorre los hijos directos de la instancia. Devuelve la instancia coincidente o null si no se encuentra.",
            "parameters": {
                "name": "Nombre objetivo"
            }
        },
        "name": {
            "summary": "Propiedad de cadena de lectura/escritura que representa el identificador de una instancia.",
            "description": "Utilizado para identificación y descubrimiento mediante FindFirstChild.",
            "parameters": {}
        },
        "parent": {
            "summary": "Referencia de lectura/escritura a la instancia padre en el árbol.",
            "description": "Permite reasignar nodos dinámicamente en tiempo de ejecución o desconectarlos asignando null.",
            "parameters": {}
        },
        "file": {
            "summary": "Operaciones de sistema de archivos para leer, escribir y consultar archivos.",
            "description": "Biblioteca de utilidades estática para la gestión persistente de texto, configuraciones y datos.",
            "parameters": {
                "path": "Ruta de archivo relativa o absoluta",
                "content": "Contenido de texto a escribir"
            }
        },
        "directory": {
            "summary": "Utilidad de gestión de directorios para crear y listar carpetas.",
            "description": "Gestión estática de directorios para organizar archivos, explorar carpetas y preparar estructuras.",
            "parameters": {
                "path": "Ruta de la carpeta"
            }
        },
        "cllpdb": {
            "summary": "Servicio de base de datos cifrada AES con sesión configurable por el desarrollador y motor UTF-8 MySQL.",
            "description": "Motor de base de datos cifrada específico de LLP (.cllpdb). Ofrece cifrado AES-256, clave única por proyecto, duración de sesión definida por el desarrollador (permanente por defecto en scripts o tiempo personalizado; 2 minutos de seguridad exclusivamente en el editor VS Code), conexión/desconexión bajo demanda (.CloseSession() / .Disconnect()) y tablas relacionales con Claves Primarias (🔑) y Foráneas (🔗). Admite caracteres UTF-8 y SQL estándar.",
            "parameters": {
                "filePath": "Ruta al archivo .cllpdb (ej: data/products.cllpdb)",
                "key": "Clave de cifrado personalizada (opcional)",
                "durationSeconds": "Duración de la sesión en segundos (opcional; si se omite o 0, permanece activa indefinidamente)"
            }
        },
        "database": {
            "summary": "Servicio de base de datos estándar Clave-Valor y tablas básicas (.db).",
            "description": "Almacenamiento ligero Clave-Valor y tablas básicas sin cifrado, ideal para caché y estados temporales.",
            "parameters": {
                "filePath": "Ruta al archivo .db"
            }
        },
        "py": {
            "summary": "Constante matemática universal π (3.141592653589793) accesible en todo el código.",
            "description": "Constante universal que representa Pi (π). Reconocida globalmente por todos los archivos LLP y scripts sin necesidad de importaciones.",
            "parameters": {}
        },
        "math": {
            "summary": "Biblioteca estándar de funciones de cálculo matemático.",
            "description": "Proporciona funciones matemáticas habituales como redondeo, potencias, raíces cuadradas, funciones trigonométricas y límites mín/máx.",
            "parameters": {
                "val": "Valor numérico de entrada"
            }
        },
        "scillp": {
            "summary": "Biblioteca de computación científica avanzada (equivalente a SciPy en LLP).",
            "description": "Módulo de cálculo científico que ofrece métricas estadísticas (Mean, StdDev), procesamiento de señales (MovingAverage, SignalFilter), integración numérica y optimización.",
            "parameters": {
                "list": "Conjunto de datos de entrada"
            }
        },
        "symllp": {
            "summary": "Biblioteca de matemáticas simbólicas y álgebra computacional (equivalente a SymPy en LLP).",
            "description": "Permite manipulación algebraica formal: resolución exacta de ecuaciones, derivadas formales, integrales indefinidas, simplificación algebraica y determinantes de matrices.",
            "parameters": {
                "equation": "Expresión algebraica",
                "variable": "Variable objetivo (ej: 'x')"
            }
        },
        "probllp": {
            "summary": "Biblioteca de probabilidades, combinatoria y distribuciones.",
            "description": "Motor de combinatoria y probabilidades que calcula factoriales, permutaciones, combinaciones y distribuciones de Poisson, binomial y normal.",
            "parameters": {
                "n": "Tamaño total de la población",
                "k": "Tamaño de la muestra"
            }
        },
        "crypto": {
            "summary": "Biblioteca de criptografía que proporciona clave única de proyecto y cifrado AES-256.",
            "description": "Herramientas de seguridad criptográfica para proyectos LLP. Cada proyecto tiene una clave de cifrado AES-256 única y determinista generada a partir de su ruta.",
            "parameters": {}
        },
        "uivalidator": {
            "summary": "Reglas de validación de entradas de formulario y notificaciones toast para el usuario.",
            "description": "Servicio integrado para validar campos de texto, correos electrónicos, límites numéricos y mostrar notificaciones estándar.",
            "parameters": {
                "val": "Entrada a validar"
            }
        },
        "background": {
            "summary": "Contenedor raíz para una ventana de aplicación en una interfaz .illp.",
            "description": "El contenedor principal de cualquier interfaz visual de LLP. Admite modo responsivo y restricciones mín/máx de ancho y alto.",
            "parameters": {
                "name": "Identificador del componente",
                "responsive": "Habilita el diseño responsivo flexible",
                "minWidth / maxWidth": "Límites de ancho (ej: '480px')",
                "minHeight / maxHeight": "Límites de alto (ej: '600px')"
            }
        },
        "card": {
            "summary": "Componente contenedor Tarjeta que agrupa widgets con un título de encabezado opcional.",
            "description": "Tarjeta visual con bordes redondeados, sombra y encabezado para organizar controles en secciones funcionales claras.",
            "parameters": {
                "title": "Título mostrado en la parte superior de la tarjeta"
            }
        },
        "row": {
            "summary": "Contenedor flexbox horizontal que dispone los elementos hijos uno al lado del otro.",
            "description": "Muestra elementos hijos horizontalmente con espaciado uniforme y alineación vertical.",
            "parameters": {}
        },
        "grid": {
            "summary": "Contenedor de cuadrícula responsiva multicolumna.",
            "description": "Organiza elementos en una cuadrícula estructurada con un número específico de columnas.",
            "parameters": {
                "columns": "Número de columnas (ej: 1, 2, 3, 4)"
            }
        },
        "modal": {
            "summary": "Ventana superpuesta (Página sobre Página / Modal) que se muestra sobre la interfaz.",
            "description": "Ventana superpuesta anidada ('Page on Page') que aparece sobre la página host. Admite campos de entrada, botones de confirmación y acciones de cierre.",
            "parameters": {
                "title": "Título del modal en la barra de encabezado"
            }
        },
        "button": {
            "summary": "Botón interactivo con navegación (targetPage) o acciones modales.",
            "description": "Inicia la navegación a otro archivo .illp mediante 'targetPage', abre un modal mediante 'action: openModal:Nombre' o emite eventos.",
            "parameters": {
                "text": "Texto de etiqueta del botón",
                "targetPage": "Ruta del archivo .illp de destino",
                "action": "Acción: 'openModal:Nombre' o 'closeModal'"
            }
        },
        "textinput": {
            "summary": "Campo de entrada de texto de una línea con soporte para marcador de posición (placeholder).",
            "description": "Campo de entrada para texto del usuario, contraseñas o valores numéricos.",
            "parameters": {
                "placeholder": "Texto indicativo mostrado cuando el campo está vacío"
            }
        },
        "text": {
            "summary": "Elemento de etiqueta de texto que muestra contenido formateado.",
            "description": "Muestra texto estático, títulos, subtítulos e indicadores de estado en la interfaz.",
            "parameters": {
                "content": "Contenido de texto para mostrar"
            }
        },
        "checkbox": {
            "summary": "Casilla de verificación interactiva para alternar valores booleanos.",
            "description": "Casilla de verificación para activar o desactivar configuraciones y funciones de la aplicación.",
            "parameters": {
                "label": "Descripción textual junto a la casilla",
                "checked": "Estado inicial (true o false)"
            }
        },
        "itembox": {
            "summary": "Control de selección desplegable para elegir un elemento de una lista.",
            "description": "Selector desplegable poblado con una lista de opciones en formato de texto.",
            "parameters": {
                "default": "Elemento seleccionado por defecto",
                "items": "Lista de opciones seleccionables"
            }
        },
        "image": {
            "summary": "Muestra un recurso de imagen a partir de una ruta de archivo.",
            "description": "Incrusta una imagen o gráfico en la interfaz de usuario.",
            "parameters": {
                "src": "Ruta de archivo hacia la imagen"
            }
        },
        "progressbar": {
            "summary": "Barra de progreso visual que muestra el porcentaje de finalización.",
            "description": "Muestra visualmente el progreso, cuotas o tiempo restante de sesión.",
            "parameters": {
                "value": "Valor actual",
                "max": "Valor de escala máxima (ej: 100)"
            }
        },
        "session": {
            "summary": "Gestor de sesiones cifradas estilo PHP con persistencia transparente AES-256.",
            "description": "Sistema completo de gestión de sesiones inspirado en PHP. Guarda variables de sesión en memoria y las persiste en disco con cifrado AES-256 (.cllpsess). Permite iniciar, asignar (Set), consultar (Get), verificar (Has), eliminar (Remove) y guardar (Save) sesiones.",
            "parameters": {
                "key": "Nombre de variable de sesión",
                "value": "Valor para almacenar",
                "customId": "ID de sesión personalizada"
            }
        },
        "device": {
            "summary": "Identificación de hardware única y motor criptográfico anti-suplantación.",
            "description": "Vincula las aplicaciones clientes a características físicas inmutables del dispositivo (Machine GUID, procesador, tarjeta madre, direcciones MAC). Genera un ID de dispositivo único de 64 caracteres (Device.GetId) y tokens firmados anti-repetición (Device.GetToken).",
            "parameters": {
                "payload": "Ámbito de autenticación",
                "token": "Token firmado para verificar",
                "data": "Texto a firmar con secreto de hardware"
            }
        },
        "client": {
            "summary": "Conector de cliente remoto HTTP/HTTPS con autenticación de dispositivo y sesión.",
            "description": "Permite a las aplicaciones delegar la gestión de cuentas y datos a un servidor remoto. Envía automáticamente cabeceras de hardware (X-Device-Id, X-Device-Token) y sesión activa (X-Session-Id). Conexión por dominio o IP:Puerto.",
            "parameters": {
                "domainOrIp": "Dirección IP o dominio del servidor",
                "port": "Puerto TCP remoto",
                "path": "Ruta de la API",
                "body": "Cuerpo JSON opcional"
            }
        },
        "server": {
            "summary": "Motor de servidor backend dedicado en LLP con enrutamiento y verificación de hardware.",
            "description": "Permite programar servidores backend independientes en lenguaje LLP puro. Incluye servidor HTTP natif, enrutamiento, validación anti-suplantación de dispositivos (Server.RequireDevice), lista de clientes conectados y gestión de sesiones. Ejecución mediante 'llp server <script.llp>'.",
            "parameters": {
                "port": "Puerto TCP de escucha",
                "host": "Host de escucha",
                "path": "Ruta URL",
                "handler": "Función controladora que recibe la petición"
            }
        },
        "module": {
            "summary": "Módulo de función interno pre-integrado (ej: DevMode). Si no está configurado, su estado se sella y se cifra aleatoriamente.",
            "description": "Los módulos de función ('module NombreModulo then ... end') son bloques completos de funcionalidad integrados directamente en el cuerpo de una función. La función ya conoce toda la lógica (herramientas de prueba, inspector de red cliente-servidor). El llamador activa o calibra los permisos de prueba. Seguridad: si no se provee forma de modificar el estado interno, este se sella y se cifra aleatoriamente en memoria para evitar cualquier alteración.",
            "parameters": {
                "ModuleName": "Nombre del módulo (ej: DevMode)",
                "options": "Activación o configuración de prueba"
            }
        },
        "namespace": {
            "summary": "Contenedor de paquete que agrupa clases y variables globales compartidas.",
            "description": "La instrucción 'namespace then ... end' organiza el código en paquetes lógicos que agrupan clases y declaran variables globales a nivel de namespace.",
            "parameters": {
                "NamespaceName": "Identificador del paquete"
            }
        },
        "cllp": {
            "summary": "Archivo de clase dedicada Class Lolpaon (.cllp) con ToString() jerárquico automático.",
            "description": "Cada archivo .cllp contiene estrictamente una sola clase con el mismo nombre que el archivo. Proporciona un método ToString() jerárquico que muestra la cadena de ancestros hasta el archivo fuente.",
            "parameters": {}
        },
        "orchestrator": {
            "summary": "Orquestador multitarea inteligente que gestiona concurrencia y equilibra cargas masivas.",
            "description": "El Orquestador ('Chef d'orchestre') divide, clasifica y prioriza solicitudes (I/O, red cliente-servidor, bases de datos) garantizando fluidez sin bloqueos incluso bajo ráfagas intensas de peticiones.",
            "parameters": {
                "task": "Tarea o función a ejecutar",
                "priority": "Nivel de prioridad ('High', 'Normal', 'Background')"
            }
        }
    },
    "de": {
        "general": {
            "summary": "Universeller dynamischer Typ, dynamische Liste oder Array fester Größe.",
            "description": "Das Schlüsselwort 'General' ist der universelle Grundtyp in LLP. Es kann jeden Skalartyp aufnehmen (string, int, float, bool, instance). Bei Initialisierung mit geschweiften Klammern '{...}' entsteht eine dynamische Liste. Mit eckigen Klammern '[N]{...}' entsteht ein Array fester Größe mit Kapazität N.",
            "parameters": {
                "varName": "Name der Variable oder des Containers",
                "[N]": "Maximale Kapazität des festen Arrays (z.B. General[3])",
                "{...}": "Kommagetrennte Elemente für Liste oder Array"
            }
        },
        "app": {
            "summary": "Hauptsteuerung für Lebenszyklus und Fenster der grafischen Anwendung.",
            "description": "Das Systemobjekt 'App' ist der native Einstiegspunkt zur Steuerung des Lebenszyklus der LLP-GUI-Anwendung. Es startet die Oberfläche mit benutzerdefinierten Fenstermaßen, aktiviert den Entwicklermodus (DevMode), sperrt Größenänderungen und Vollbild (Lock), führt die App im Hintergrund aus (Silence) und erzwingt das saubere Beenden (Close).",
            "parameters": {}
        },
        "app_launch": {
            "summary": "Startet und öffnet das Fenster der grafischen Anwendung mit benutzerdefinierter Auflösung und Debug-Modus.",
            "description": "Startet den Anwendungsserver und öffnet das Client-Oberflächenfenster. Akzeptiert 'WindowSize: Breite : Höhe' für Pixelmaße (z.B. 250 : 250) sowie 'DevMode: True/False' zur Aktivierung von Entwicklerrechten, Inspektionskonsole und Live-Tests.",
            "parameters": {
                "WindowSize": "Fenstergröße in Pixeln (z.B. 250 : 250, 1200 : 860)",
                "DevMode": "Aktiviert den Entwicklermodus für Gerätetests mit Bearbeitungsrechten und Debug-Konsole"
            }
        },
        "app_lock": {
            "summary": "Verhindert die Fenstergrößenänderung mit der Maus und deaktiviert den Vollbildmodus (feste Größe).",
            "description": "Sperrt die Abmessungen des Anwendungsfensters. Verhindert das Ziehen der Ränder mit der Maus oder das Umschalten in den Vollbildmodus. Das Fenster behält eine strikt feste Größe.",
            "parameters": {}
        },
        "app_silence": {
            "summary": "Führt die Anwendung im Hintergrund ohne sichtbare Benutzeroberfläche aus (im Ruhezustand oder aktiv).",
            "description": "Führt die Anwendung im Hintergrund ohne sichtbares Fenster aus, bleibt jedoch im Speicher geladen. Ohne Argumente ('App.Silence()') pausiert die App im Ruhezustand. Mit 'RunBack: True' läuft sie aktiv weiter und verarbeitet Hintergrundaufgaben.",
            "parameters": {
                "RunBack": "Wenn True, läuft die Anwendung aktiv im Hintergrund weiter"
            }
        },
        "app_close": {
            "summary": "Erzwingt das sofortige Beenden der Anwendung und aller Prozesse.",
            "description": "Ermöglicht dem Entwickler, die Anwendung und zugehörige Prozesse sofort zu beenden, wenn das System nicht reagiert, oder ein geordnetes Beenden auszulösen.",
            "parameters": {}
        },
        "string": {
            "summary": "Statischer String-Typ für UTF-8-Textdaten.",
            "description": "Explizite statische Typdeklaration, die garantiert, dass die Variable eine UTF-8-Zeichenkette enthält. Verhindert Zuweisungen von Nicht-Textwerten zur Laufzeit.",
            "parameters": {
                "value": "In doppelte Anführungszeichen gesetzter Text"
            }
        },
        "int": {
            "summary": "Statischer Ganzzahltyp für vorzeichenbehaftete 64-Bit-Ganzzahlen.",
            "description": "Repräsentiert ganze Zahlen. Schneidet Dezimalstellen ab, um exakte Ganzzahlarithmetik zu gewährleisten.",
            "parameters": {
                "value": "Numerischer Ganzzahlwert"
            }
        },
        "float": {
            "summary": "Statischer Gleitkommatyp für hochpräzise Dezimalzahlen.",
            "description": "Repräsentiert 64-Bit-IEEE-754-Gleitkommazahlen mit doppelter Genauigkeit. Ideal für Preise, physikalische Koordinaten und wissenschaftliche Berechnungen.",
            "parameters": {
                "value": "Numerischer Dezimalwert"
            }
        },
        "bool": {
            "summary": "Statischer boolescher Typ für Wahrheitswerte (true oder false).",
            "description": "Strenger boolescher Typ, der ausschließlich 'true' oder 'false' annimmt. Wird direkt in Bedingungen und Schleifen verwendet.",
            "parameters": {
                "value": "Entweder true oder false"
            }
        },
        "global": {
            "summary": "Globale Deklaration, datei- und kommentarübergreifend verfügbar.",
            "description": "Deklariert eine Variable im globalen Gültigkeitsbereich. Ermöglicht auch das Ausführen von Code in Kommentaren im Format '{ Global var = wert }'.",
            "parameters": {
                "varName": "Variablenname im globalen Gültigkeitsbereich"
            }
        },
        "visibility": {
            "summary": "Header-Direktive zur Festlegung der Export-Sichtbarkeit einer Oberfläche.",
            "description": "Direktive in der ersten Zeile einer Schnittstellendatei (.illp). 'visibility: All' erlaubt es allen Modulen, die Oberfläche einzubinden oder anzusteuern.",
            "parameters": {
                "scope": "All | Internal | Private"
            }
        },
        "if": {
            "summary": "Bedingte Verzweigung basierend auf einer booleschen Auswertung.",
            "description": "Wertet einen Ausdruck aus. Bei Wahr wird der Hauptblock ausgeführt, andernfalls der optionale else-Block.",
            "parameters": {
                "condition": "Ausdruck, der einen booleschen Wert liefert"
            }
        },
        "for": {
            "summary": "Iteriert über Elemente einer Liste, eines festen Arrays oder Kindinstanzen.",
            "description": "Schleifenkonstrukt, das jedes Element einer Sammlung sequentiell durchläuft, ohne manuelle Indexverwaltung.",
            "parameters": {
                "item": "Iterationsvariable",
                "collection": "Zu durchlaufende Sammlung"
            }
        },
        "while": {
            "summary": "Führt Anweisungen wiederholt aus, solange eine Bedingung wahr bleibt.",
            "description": "Wertet die Bedingung vor jedem Durchlauf neu aus. Läuft weiter, bis die Bedingung falsch ist oder break aufgerufen wird.",
            "parameters": {
                "condition": "Bedingung für jeden Durchlauf"
            }
        },
        "print": {
            "summary": "Gibt Werte auf der Standardausgabe / im Terminal aus.",
            "description": "Zentrale Ausgabefunktion in LLP. Akzeptiert eine variable Anzahl an Argumenten, trennt sie mit Leerzeichen und schließt mit einem Zeilenumbruch ab.",
            "parameters": {
                "...args": "Ein oder mehrere durch Kommas getrennte Werte oder Ausdrücke"
            }
        },
        "length": {
            "summary": "Gibt die aktuelle Elementanzahl einer Liste, eines Arrays oder Strings zurück.",
            "description": "Methode auf dynamischen Listen, Arrays und Strings zur Rückgabe der Element- bzw. Zeichenanzahl.",
            "parameters": {}
        },
        "maxlength": {
            "summary": "Gibt die maximale Kapazität eines General[N]-Arrays zurück.",
            "description": "Spezifische Methode für feste Arrays General[N], die das feste Kapazitätslimit zurückgibt.",
            "parameters": {}
        },
        "add": {
            "summary": "Hängt ein Element an das Ende einer dynamischen General{...}-Liste an.",
            "description": "Erweitert die General-Liste dynamisch, indem der übergebene Wert am Ende hinzugefügt wird.",
            "parameters": {
                "element": "Der anzuhängende Wert"
            }
        },
        "instance": {
            "summary": "Erzeugt einen neuen hierarchischen Instanzknoten im Objektbaum.",
            "description": "Erstellt einen Knoten nach dem Vorbild der Roblox-Objekthierarchie. Knoten besitzen Namen, Eltern, Kinder und Eigenschaften.",
            "parameters": {
                "className": "Klassenname: 'Folder', 'Window', 'Page', 'ModalPage', 'Button', 'TextInput', etc.",
                "parentInstance": "Übergeordneter Elternknoten"
            }
        },
        "getchildren": {
            "summary": "Gibt eine dynamische Liste aller direkten Kindinstanzen zurück.",
            "description": "Liest die direkten Kinder eines Knotens aus und liefert sie als iterierbare General-Liste zurück.",
            "parameters": {}
        },
        "findfirstchild": {
            "summary": "Findet und liefert das erste Kind mit dem angegebenen Namen.",
            "description": "Durchsucht die direkten Kinder der Instanz und gibt den Treffer oder null zurück.",
            "parameters": {
                "name": "Gesuchter Name"
            }
        },
        "name": {
            "summary": "Lese-/Schreib-String-Eigenschaft für den Bezeichner einer Instanz.",
            "description": "Dient zur Identifikation und zum Auffinden über FindFirstChild.",
            "parameters": {}
        },
        "parent": {
            "summary": "Lese-/Schreib-Referenz auf die übergeordnete Elterninstanz im Baum.",
            "description": "Ermöglicht das dynamische Umhängen von Knoten zur Laufzeit oder das Aushängen durch Zuweisung von null.",
            "parameters": {}
        },
        "file": {
            "summary": "Dateisystem-Operationen zum Lesen, Schreiben und Prüfen von Dateien.",
            "description": "Statische Dateisystem-Bibliothek zur persistenten Speicherung von Text, Konfigurationen und Daten.",
            "parameters": {
                "path": "Relativer oder absoluter Dateipfad",
                "content": "Zu schreibender Textinhalt"
            }
        },
        "directory": {
            "summary": "Verzeichnis-Werkzeug zum Erstellen und Auflisten von Ordnern.",
            "description": "Statisches Verzeichnis-Management zum Organisieren von Dateien, Durchsuchen von Ordnern und Vorbereiten von Strukturen.",
            "parameters": {
                "path": "Ordnerpfad"
            }
        },
        "cllpdb": {
            "summary": "Verschlüsselter AES-Datenbankdienst mit entwicklerdefinierter Sitzungsdauer und UTF-8-MySQL-Engine.",
            "description": "Verschlüsselte LLP-spezifische Datenbank-Engine (.cllpdb). Bietet AES-256-Verschlüsselung, eindeutigen Projektschlüssel, vom Entwickler definierte Sitzungsdauer (standardmäßig permanent in Skripten oder benutzerdefiniertes Timeout; 2-Minuten-Sicherheitssitzung nur im VS-Code-Editor), Bedarfsverbindung/Trennung (.CloseSession() / .Disconnect()) und relationale Tabellen mit Primärschlüsseln (🔑) und Fremdschlüsseln (🔗). Unterstützt volles UTF-8 und Standard-SQL.",
            "parameters": {
                "filePath": "Pfad zur .cllpdb-Datei (z.B. data/products.cllpdb)",
                "key": "Optionaler benutzerdefinierter Schlüssel",
                "durationSeconds": "Sitzungsdauer in Sekunden (optional; wenn weggelassen oder 0, bleibt die Sitzung unbegrenzt aktiv)"
            }
        },
        "database": {
            "summary": "Standard-Schlüssel-Wert- und Basistabellen-Datenbankdienst (.db).",
            "description": "Leichtgewichtiger Key-Value-Speicher und einfache Tabellenablage ohne Verschlüsselung, ideal für Caching und temporäre Zustände.",
            "parameters": {
                "filePath": "Pfad zur .db-Datei"
            }
        },
        "py": {
            "summary": "Universelle mathematische Konstante π (3.141592653589793), überall verfügbar.",
            "description": "Globale Konstante für Pi (π). In allen LLP-Dateien und Benutzer-Skripten ohne Import sofort nutzbar.",
            "parameters": {}
        },
        "math": {
            "summary": "Standardbibliothek für mathematische Berechnungen.",
            "description": "Bietet gängige mathematische Funktionen wie Runden, Potenzen, Quadratwurzeln, Trigonometrie und Min/Max-Begrenzungen.",
            "parameters": {
                "val": "Numerische Eingabe"
            }
        },
        "scillp": {
            "summary": "Erweiterte wissenschaftliche Berechnungsbibliothek (SciPy-Äquivalent für LLP).",
            "description": "Modul für wissenschaftliche Analysen mit statistischen Kennzahlen (Mean, StdDev), Signalverarbeitung (MovingAverage, SignalFilter), numerischer Integration und Optimierung.",
            "parameters": {
                "list": "Eingabedatensatz"
            }
        },
        "symllp": {
            "summary": "Symbolische Mathematik und Computeralgebra (SymPy-Äquivalent für LLP).",
            "description": "Ermöglicht formale algebraische Berechnungen: exaktes Lösen von Gleichungen, symbolische Ableitungen, unbestimmte Integrale, Termvereinfachung und Matrizendeterminanten.",
            "parameters": {
                "equation": "Algebraischer Ausdruck",
                "variable": "Zielvariable (z.B. 'x')"
            }
        },
        "probllp": {
            "summary": "Bibliothek für Wahrscheinlichkeitsrechnung, Kombinatorik und Verteilungen.",
            "description": "Kombinatorik- und Wahrscheinlichkeits-Engine für Fakultäten, Permutationen, Kombinationen sowie Poisson-, Binomial- und Normalverteilungen.",
            "parameters": {
                "n": "Gesamte Populationsgröße",
                "k": "Stichprobengröße"
            }
        },
        "crypto": {
            "summary": "Kryptografie-Bibliothek mit eindeutigen Projektschlüsseln und AES-256-Verschlüsselung.",
            "description": "Kryptografische Werkzeuge für LLP-Projekte. Jedes Projekt besitzt einen deterministischen AES-256-Schlüssel, der aus Pfad und Metadaten abgeleitet wird.",
            "parameters": {}
        },
        "uivalidator": {
            "summary": "Validierungsregeln für Formulareingaben und Benutzer-Toast-Benachrichtigungen.",
            "description": "Integrierter Dienst zur Validierung von Texteingaben, E-Mails, Zahlenbereichen und zur Anzeige standardisierter Toast-Meldungen.",
            "parameters": {
                "val": "Zu validierende Eingabe"
            }
        },
        "background": {
            "summary": "Wurzel-Container für ein Anwendungsfenster in einer .illp-Oberfläche.",
            "description": "Der primäre Haupt-Container jeder visuellen LLP-Oberfläche. Unterstützt responsives Layout sowie Mindest- und Höchstmaße für Breite und Höhe.",
            "parameters": {
                "name": "Komponentenbezeichner",
                "responsive": "Aktiviert flexibles responsives Layout",
                "minWidth / maxWidth": "Breitenbegrenzung (z.B. '480px')",
                "minHeight / maxHeight": "Höhenbegrenzung (z.B. '600px')"
            }
        },
        "card": {
            "summary": "Karten-Containerkomponente zur Gruppierung von Widgets mit optionalem Titel.",
            "description": "Visuelle Karte mit abgerundeten Ecken, Schatten und Kopfzeilentitel zur Gliederung von Steuerelementen in funktionale Bereiche.",
            "parameters": {
                "title": "In der Kopfzeile angezeigter Titel"
            }
        },
        "row": {
            "summary": "Horizontaler Flexbox-Zeilen-Container für nebeneinanderliegende Elemente.",
            "description": "Platziert Kindelemente horizontal nebeneinander mit einheitlichem Abstand und vertikaler Ausrichtung.",
            "parameters": {}
        },
        "grid": {
            "summary": "Mehrspaltiger responsiver Raster-Container.",
            "description": "Ordnet Elemente in einem strukturierten Raster mit festgelegter Spaltenanzahl an.",
            "parameters": {
                "columns": "Spaltenanzahl (z.B. 1, 2, 3, 4)"
            }
        },
        "modal": {
            "summary": "Überlagerndes Fenster (Seite-über-Seite / Modal) über der Host-Oberfläche.",
            "description": "Verschachteltes Dialogfenster ('Page on Page'), das sich über die Hostseite legt. Unterstützt Formulareingaben, Bestätigungsknöpfe und Schließaktionen.",
            "parameters": {
                "title": "Modaltitel in der Kopfzeile"
            }
        },
        "button": {
            "summary": "Interaktiver Knopf mit Seitennavigation (targetPage) oder Modal-Aktionen.",
            "description": "Löst Seitennavigation zu einer anderen .illp-Datei aus ('targetPage'), öffnet ein Modal ('action: openModal:Name') oder sendet Ereignisse.",
            "parameters": {
                "text": "Beschriftungstext des Knopfes",
                "targetPage": "Zielpfad der .illp-Datei für Navigation",
                "action": "Aktion: 'openModal:Name' oder 'closeModal'"
            }
        },
        "textinput": {
            "summary": "Einzeiliges Texteingabefeld mit Platzhalter-Unterstützung (placeholder).",
            "description": "Eingabefeld für Benutzereingaben, Passwörter oder Zahlenwerte.",
            "parameters": {
                "placeholder": "Hinweistext bei leerem Eingabefeld"
            }
        },
        "text": {
            "summary": "Textanzeigeelement für formatierten Inhalt.",
            "description": "Stellt statischen Text, Titel, Untertitel und Statusmeldungen in der Benutzeroberfläche dar.",
            "parameters": {
                "content": "Anzuzeigender Textinhalt"
            }
        },
        "checkbox": {
            "summary": "Interaktives Kontrollkästchen zum Umschalten boolescher Werte.",
            "description": "Umschaltbares Kontrollkästchen zur Aktivierung oder Deaktivierung von Einstellungen und Funktionen.",
            "parameters": {
                "label": "Textbeschreibung neben dem Kontrollkästchen",
                "checked": "Ausgangszustand (true oder false)"
            }
        },
        "itembox": {
            "summary": "Ausklappbares Dropdown-Menü zur Auswahl eines Elements aus einer Liste.",
            "description": "Auswahlmenü, das mit einer Liste von Textoptionen gefüllt wird.",
            "parameters": {
                "default": "Standardmäßig ausgewähltes Element",
                "items": "Liste wählbarer Optionen"
            }
        },
        "image": {
            "summary": "Zeigt eine Bildressource über einen Dateipfad an.",
            "description": "Bettet ein Bild oder Vektorgrafik in die Benutzeroberfläche ein.",
            "parameters": {
                "src": "Dateipfad zum Bild"
            }
        },
        "progressbar": {
            "summary": "Visueller Fortschrittsbalken zur Anzeige des prozentualen Status.",
            "description": "Zeigt Fortschritte, Quoten oder verbleibende Sitzungszeit optisch an.",
            "parameters": {
                "value": "Aktueller Wert",
                "max": "Maximaler Skalenwert (z.B. 100)"
            }
        },
        "session": {
            "summary": "PHP-ähnlicher verschlüsselter Sitzungsmanager mit transparenter AES-256-Persistenz.",
            "description": "Vollständiges Sitzungsverwaltungssystem nach PHP-Vorbild. Speichert Sitzungsvariablen im Arbeitsspeicher und persistent auf Festplatte mit AES-256-Verschlüsselung (.cllpsess). Bietet Start, Set, Get, Has, Remove, Clear, Save und Destroy.",
            "parameters": {
                "key": "Name der Sitzungsvariable",
                "value": "Zu speichernder Datenwert",
                "customId": "Benutzerdefinierte Sitzungs-ID"
            }
        },
        "device": {
            "summary": "Hardware-gebundene eindeutige Identifikation und kryptografischer Manipulationsschutz.",
            "description": "Bindet Client-Anwendungen an unveränderliche Hardware-Merkmale (Machine-GUID, CPU, Mainboard, MAC-Adressen). Generiert eine eindeutige 64-Zeichen Geräte-ID (Device.GetId) und signierte Anti-Replay-Tokens (Device.GetToken) gegen Spoofing und Klonen.",
            "parameters": {
                "payload": "Authentifizierungs-Bereich",
                "token": "Zu verifizierendes signiertes Token",
                "data": "Mit Hardware-Schlüssel zu signierende Daten"
            }
        },
        "client": {
            "summary": "Remote-HTTP/HTTPS-Client-Connector mit automatischer Geräte- und Sitzungsauthentifizierung.",
            "description": "Ermöglicht Client-Apps die Auslagerung von Benutzerkonten und Daten an einen Remote-Server. Fügt jedem Request automatisch Hardware-Header (X-Device-Id, X-Device-Token) und aktive Sitzungs-Tokens (X-Session-Id) hinzu. Verbindung per Domain oder IP:Port.",
            "parameters": {
                "domainOrIp": "Server-IP-Adresse oder Domain",
                "port": "Remote-TCP-Port",
                "path": "Ziel-API-Endpunktpfad",
                "body": "JSON-Nutzlast für Anfragen"
            }
        },
        "server": {
            "summary": "Dedizierte LLP-Backend-Server-Engine mit Routing und Hardware-Identitätsprüfung.",
            "description": "Ermöglicht Entwicklern eigenständige Backend-Server in reinem LLP zu schreiben. Bietet integrierten HTTP-Server, flexible Routen, strikte Hardware-Geräte-Prüfung (Server.RequireDevice), Client-Verwaltung und Sitzungen. Ausführung mit 'llp server <script.llp>'.",
            "parameters": {
                "port": "TCP-Server-Port",
                "host": "Lausch-Adresse",
                "path": "URL-Routenpfad",
                "handler": "Handler-Funktion für eingehende Anfragen"
            }
        },
        "module": {
            "summary": "Eingebettetes Funktionsmodul (z. B. DevMode). Ohne vorgesehene Änderung wird der Status zufällig verschlüsselt und versiegelt.",
            "description": "Funktionsmodule ('module ModulName then ... end') sind vollständige Funktionsblöcke direkt in einer Funktion. Die Funktion kennt die gesamte Logik (Debug-Tools, Netzwerk-Inspector). Der Aufrufer schaltet das Modul frei oder konfiguriert Testrechte. Sicherheit: Ohne vorgesehene Änderung bleibt der Speicherzustand zufällig verschlüsselt und geschützt.",
            "parameters": {
                "ModuleName": "Name des Funktionsmoduls (z. B. DevMode)",
                "options": "Aktivierung oder Testkonfiguration"
            }
        },
        "namespace": {
            "summary": "Paket-Container zur Gruppierung von Klassen und geteilten Namespace-Variablen.",
            "description": "Deklariert einen Namensraum mit Klassen und paketweiten globalen Variablen ohne Verschmutzung des globalen Bereichs.",
            "parameters": {
                "NamespaceName": "Paketbezeichner"
            }
        },
        "cllp": {
            "summary": "Dedizierte Class Lolpaon-Datei (.cllp) mit automatischem hierarchischem ToString().",
            "description": "Jede .cllp-Datei enthält genau eine Klasse mit dem gleichen Namen wie die Datei. ToString() zeigt standardmäßig den vollständigen Ahnenpfad von den Eltern bis zur Klassendatei an.",
            "parameters": {}
        },
        "orchestrator": {
            "summary": "Intelligenter Multitasking-Orchestrator für optimierte Lastverteilung und Parallelität.",
            "description": "Der Orchestrator steuert asynchrone Aufgaben, teilt Anfragen auf und priorisiert I/O, Client-Server-Netzwerk und Datenbankoperationen, um Latenzen auch bei hoher Last zu vermeiden.",
            "parameters": {
                "task": "Geplante asynchrone Aufgabe",
                "priority": "Prioritätsstufe ('High', 'Normal', 'Background')"
            }
        }
    }
};

// Base documentation catalog in Universal English (Default)
const LLP_DOCS_LIST = [
    {
        "id": "general",
        "name": "General",
        "category": "Types & Variables",
        "summary": "Universal dynamic type, resizable list, or fixed-size array.",
        "syntax": "General varName = \"Value\"\nGeneral myList = General{\"Item1\", \"Item2\"}\nGeneral myFixedArray = General[3]{\"A\", \"B\", \"C\"}",
        "description": "The 'General' keyword is the fundamental versatile type in LLP. It can hold any scalar type (string, int, float, bool, instance). When initialized with curly braces '{...}', it instantiates a dynamic resizable list. When initialized with bracket notation '[N]{...}', it creates a fixed-size array strictly capped at capacity N.",
        "parameters": [
            {
                "name": "varName",
                "type": "identifier",
                "desc": "Variable or container name"
            },
            {
                "name": "[N]",
                "type": "integer (optional)",
                "desc": "Fixed array maximum length (e.g. General[3])"
            },
            {
                "name": "{...}",
                "type": "elements",
                "desc": "Comma-separated list or array items"
            }
        ],
        "codeSample": "// Dynamic variable\nGeneral appTitle = \"LLP Studio Pro\"\n\n// Resizable dynamic list\nGeneral services = General{\"Database\", \"Files\", \"Network\"}\nservices.Add(\"Authentication\")\nprint(\"Services count:\", services.Length())\n\n// Fixed-size memory array (max 3 items)\nGeneral buffer = General[3]{\"Chunk1\", \"Chunk2\", \"Chunk3\"}\nprint(\"Max capacity:\", buffer.MaxLength())"
    },
    {
        "id": "app",
        "name": "App",
        "category": "Types & Variables",
        "summary": "Main lifecycle and window manager for the LLP graphical application.",
        "syntax": "App.Launch()\nApp.Launch(WindowSize: 250 : 250)\nApp.Launch(DevMode: True)\nApp.Lock()\nApp.Silence()\nApp.Silence(RunBack: True)\nApp.Close()",
        "description": "The system object 'App' is the native entry point controlling the graphical application lifecycle. It launches the UI with custom window dimensions, enables developer mode (DevMode), locks resizing and fullscreen (Lock), executes the application in the background (Silence), and safely forces application termination (Close).",
        "parameters": [],
        "codeSample": "// Launch application with fixed 250x250 window and developer mode enabled\nApp.Launch(WindowSize: 250 : 250, DevMode: True)\n\n// Lock window size (disables mouse resizing and fullscreen toggle)\nApp.Lock()"
    },
    {
        "id": "app_launch",
        "name": "App.Launch",
        "category": "Types & Variables",
        "summary": "Starts and displays the graphical application window with custom resolution and debug modes.",
        "syntax": "App.Launch()\nApp.Launch(WindowSize: 250 : 250)\nApp.Launch(DevMode: True)\nApp.Launch(WindowSize: 800 : 600, DevMode: True)",
        "description": "Launches the application server and opens the client interface window. Accepts 'WindowSize: Width : Height' to enforce pixel dimensions (e.g., 250 : 250 for 250x250 px), and 'DevMode: True/False' to enable developer privileges, inspection console, live variable modification, and testing tools.",
        "parameters": [
            {
                "name": "WindowSize",
                "type": "Width : Height",
                "desc": "Window size in pixels (e.g. 250 : 250, 1200 : 860)"
            },
            {
                "name": "DevMode",
                "type": "bool (True / False)",
                "desc": "Enables developer mode for testing on device with editing privileges and debug console"
            }
        ],
        "codeSample": "// Compact 250x250 px window with developer mode enabled\nApp.Launch(WindowSize: 250 : 250, DevMode: True)"
    },
    {
        "id": "app_lock",
        "name": "App.Lock",
        "category": "Types & Variables",
        "summary": "Prevents mouse window resizing and disables fullscreen mode (enforces fixed window size).",
        "syntax": "App.Lock()",
        "description": "Locks the application window dimensions. Prevents the user from dragging borders with the mouse or toggling fullscreen (F11 or maximize button). The window retains a strict fixed resolution.",
        "parameters": [],
        "codeSample": "App.Launch(WindowSize: 250 : 250)\n// Lock window: fixed size, resizing disabled\nApp.Lock()"
    },
    {
        "id": "app_silence",
        "name": "App.Silence",
        "category": "Types & Variables",
        "summary": "Runs the application in the background without a visible graphical interface (suspended or active).",
        "syntax": "App.Silence()\nApp.Silence(RunBack: True)",
        "description": "Runs the application in the background without displaying a window while keeping it loaded in memory. Without arguments ('App.Silence()'), the application is suspended in idle mode (similar to clicking minimize '-' or switching away on mobile). With 'RunBack: True', the application remains actively executing background tasks and listening to events.",
        "parameters": [
            {
                "name": "RunBack",
                "type": "bool (True / False, optional)",
                "desc": "If True, application continues running active background tasks"
            }
        ],
        "codeSample": "// Suspended background mode (idle like minimized mobile app)\nApp.Silence()\n\n// Active background mode continuing background processing\nApp.Silence(RunBack: True)"
    },
    {
        "id": "app_close",
        "name": "App.Close",
        "category": "Types & Variables",
        "summary": "Forces immediate application shutdown and process termination.",
        "syntax": "App.Close()",
        "description": "Enables the developer to terminate the application and its associated processes immediately when the host PC or device will not exit, or to trigger a clean programmatic exit.",
        "parameters": [],
        "codeSample": "if sessionExpired then\n    print(\"Session expired. Forcing application shutdown...\")\n    App.Close()\nend"
    },
    {
        "id": "string",
        "name": "string",
        "category": "Types & Variables",
        "summary": "Static string type for UTF-8 textual data.",
        "syntax": "string message = \"Hello world\"",
        "description": "Explicit static type declaration that guarantees the variable holds a UTF-8 character string. Prevents runtime assignment of non-string values.",
        "parameters": [
            {
                "name": "value",
                "type": "string",
                "desc": "Text enclosed in double quotes"
            }
        ],
        "codeSample": "string username = \"admin\"\nstring welcomeMessage = \"Welcome, \" + username + \"!\"\nprint(welcomeMessage)"
    },
    {
        "id": "int",
        "name": "int",
        "category": "Types & Variables",
        "summary": "Static integer type for 64-bit whole numbers.",
        "syntax": "int counter = 42",
        "description": "Represents signed whole numbers. Truncates any decimal values to ensure exact integer arithmetic.",
        "parameters": [
            {
                "name": "value",
                "type": "integer",
                "desc": "Numeric whole value"
            }
        ],
        "codeSample": "int totalUsers = 150\nint activeSessions = 12\nint idleUsers = totalUsers - activeSessions\nprint(\"Idle users:\", idleUsers)"
    },
    {
        "id": "float",
        "name": "float",
        "category": "Types & Variables",
        "summary": "Static floating-point type for high-precision decimals.",
        "syntax": "float price = 89.90",
        "description": "Represents double-precision 64-bit IEEE 754 floating-point numbers. Ideal for prices, physical coordinates, and scientific statistics.",
        "parameters": [
            {
                "name": "value",
                "type": "float",
                "desc": "Decimal numeric value"
            }
        ],
        "codeSample": "float unitPrice = 19.99\nfloat taxRate = 1.20\nfloat finalPrice = unitPrice * taxRate\nprint(\"Total price with tax:\", finalPrice)"
    },
    {
        "id": "bool",
        "name": "bool",
        "category": "Types & Variables",
        "summary": "Static boolean type representing truth values (true or false).",
        "syntax": "bool isConnected = true",
        "description": "Strict boolean type that only accepts 'true' or 'false'. Used directly in conditional logic, loop statements, and state flags.",
        "parameters": [
            {
                "name": "value",
                "type": "bool",
                "desc": "Either true or false"
            }
        ],
        "codeSample": "bool sessionActive = true\nif (sessionActive) {\n    print(\"Access granted!\")\n} else {\n    print(\"Session expired.\")\n}"
    },
    {
        "id": "global",
        "name": "Global",
        "category": "Types & Variables",
        "summary": "Global scope declaration accessible everywhere across files and comments.",
        "syntax": "Global tokenName = 12345\n// Inside comments: { Global secret = 999 }",
        "description": "Declares a globally scoped variable accessible across all scopes and functions. Also enables executable code execution embedded inside comments when formatted as '{ Global var = value }'.",
        "parameters": [
            {
                "name": "varName",
                "type": "identifier",
                "desc": "Variable name in global scope"
            }
        ],
        "codeSample": "// Standard global declaration\nGlobal API_BASE_URL = \"https://api.example.com/v1\"\n\n// Embedded in comments:\n// Important note: { Global configToken = 999 } end of note\nprint(\"Token from comment:\", configToken) // Outputs: 999"
    },
    {
        "id": "visibility",
        "name": "visibility",
        "category": "Types & Variables",
        "summary": "Interface header directive setting export scope visibility.",
        "syntax": "visibility: All\nvisibility: Internal\nvisibility: Private",
        "description": "Directive placed at the first line of an interface (.illp) file. 'visibility: All' allows the UI to be embedded or navigated to by all application modules.",
        "parameters": [
            {
                "name": "scope",
                "type": "keyword",
                "desc": "All | Internal | Private"
            }
        ],
        "codeSample": "visibility: All\n\nBackground \"MainWindow\" responsive: true minWidth: \"400px\" {\n    Card \"MainCard\" title: \"Public Interface\" {\n        Text \"Lbl\" content: \"Visible to all project modules\"\n    }\n}"
    },
    {
        "id": "if",
        "name": "if / else",
        "category": "Control Flow & Logic",
        "summary": "Conditional execution branching based on boolean evaluation.",
        "syntax": "if (condition) {\n    // true branch\n} else {\n    // false branch\n}",
        "description": "Evaluates an expression. If true, executes the primary block; otherwise, executes the optional else block.",
        "parameters": [
            {
                "name": "condition",
                "type": "expression",
                "desc": "Expression returning a boolean"
            }
        ],
        "codeSample": "int stock = 5\nif (stock > 0) {\n    print(\"Product in stock (\", stock, \"units remaining )\")\n} else {\n    print(\"Out of stock!\")\n}"
    },
    {
        "id": "for",
        "name": "for ... in",
        "category": "Control Flow & Logic",
        "summary": "Iterates over elements in a list, fixed array, or instance children.",
        "syntax": "for item in collection {\n    print(item)\n}",
        "description": "Loop structure that iterates sequentially over each item in a collection without requiring index management.",
        "parameters": [
            {
                "name": "item",
                "type": "identifier",
                "desc": "Iteration variable"
            },
            {
                "name": "collection",
                "type": "list | array",
                "desc": "Collection to traverse"
            }
        ],
        "codeSample": "General fruits = General{\"Apple\", \"Banana\", \"Orange\"}\nfor fruit in fruits {\n    print(\"Fruit:\", fruit)\n}"
    },
    {
        "id": "while",
        "name": "while",
        "category": "Control Flow & Logic",
        "summary": "Executes statements repeatedly while a condition remains true.",
        "syntax": "while (condition) {\n    // statements\n}",
        "description": "Re-evaluates the condition before each loop pass. Continues executing until condition evaluates to false or break is called.",
        "parameters": [
            {
                "name": "condition",
                "type": "expression",
                "desc": "Condition evaluated each pass"
            }
        ],
        "codeSample": "int count = 1\nwhile (count <= 3) {\n    print(\"Pass:\", count)\n    count = count + 1\n}"
    },
    {
        "id": "print",
        "name": "print(...args)",
        "category": "Core Built-ins & Arrays",
        "summary": "Prints one or more values or expressions to standard output / terminal.",
        "syntax": "print(\"Message:\", val1, val2)",
        "description": "Core output function in LLP. Takes a variable number of arguments, formats them separated by spaces, and prints the result followed by a newline.",
        "parameters": [
            {
                "name": "...args",
                "type": "any",
                "desc": "One or more comma-separated values or expressions"
            }
        ],
        "codeSample": "print(\"Hello World!\")\nprint(\"Calculation result:\", 10 * 5 + 2)\nprint(\"Application status:\", true)"
    },
    {
        "id": "length",
        "name": ".Length()",
        "category": "Core Built-ins & Arrays",
        "summary": "Returns the current number of elements in a list, array, or string.",
        "syntax": "int size = collection.Length()",
        "description": "Method available on dynamic lists, arrays, and strings returning the element or character count.",
        "parameters": [],
        "codeSample": "General items = General{\"A\", \"B\", \"C\", \"D\"}\nprint(\"Total items:\", items.Length()) // Outputs 4"
    },
    {
        "id": "maxlength",
        "name": ".MaxLength()",
        "category": "Core Built-ins & Arrays",
        "summary": "Returns the fixed maximum allocation capacity of a General[N] array.",
        "syntax": "int max = fixedArray.MaxLength()",
        "description": "Method exclusively on fixed-size arrays General[N] returning the maximum allowed capacity.",
        "parameters": [],
        "codeSample": "General slots = General[5]{\"Core1\", \"Core2\"}\nprint(\"Max capacity limit:\", slots.MaxLength()) // Outputs 5"
    },
    {
        "id": "add",
        "name": ".Add(element)",
        "category": "Core Built-ins & Arrays",
        "summary": "Appends an element to the end of a dynamic General{...} list.",
        "syntax": "list.Add(newItem)",
        "description": "Dynamically expands the General list by appending the given value to the end.",
        "parameters": [
            {
                "name": "element",
                "type": "any",
                "desc": "The value to append"
            }
        ],
        "codeSample": "General logs = General{\"Init\"}\nlogs.Add(\"Service started\")\nlogs.Add(\"Ready\")\nprint(\"Logs:\", logs)"
    },
    {
        "id": "instance",
        "name": "Instance.new(className, [parent])",
        "category": "Object Tree (Instance)",
        "summary": "Creates a new hierarchical instance node in the parent-child object tree.",
        "syntax": "General obj = Instance.new(\"ClassName\", [parentInstance])",
        "description": "Instantiates a node inspired by the Roblox object hierarchy. Nodes can have names, parents, children, and properties, allowing structured tree-based architectures for UI, services, and game entities.",
        "parameters": [
            {
                "name": "className",
                "type": "string",
                "desc": "Class name: 'Folder', 'Window', 'Page', 'ModalPage', 'Button', 'TextInput', etc."
            },
            {
                "name": "parentInstance",
                "type": "Instance (optional)",
                "desc": "Parent node to attach this instance to"
            }
        ],
        "codeSample": "General app = Instance.new(\"AppSystem\")\napp.Name = \"LolpaonSystem\"\n\nGeneral servicesFolder = Instance.new(\"Folder\", app)\nservicesFolder.Name = \"Services\"\n\nGeneral auth = Instance.new(\"AuthService\", servicesFolder)\nauth.Name = \"Auth\""
    },
    {
        "id": "getchildren",
        "name": "instance.GetChildren()",
        "category": "Object Tree (Instance)",
        "summary": "Returns a dynamic list of direct child instances.",
        "syntax": "General children = instance.GetChildren()",
        "description": "Inspects the direct children of an instance node and returns them as an iterable General list.",
        "parameters": [],
        "codeSample": "for child in servicesFolder.GetChildren() {\n    print(\"Child name:\", child.Name, \"| Class:\", child.ClassName)\n}"
    },
    {
        "id": "findfirstchild",
        "name": "instance.FindFirstChild(name)",
        "category": "Object Tree (Instance)",
        "summary": "Finds and returns the first child matching the specified name.",
        "syntax": "General child = instance.FindFirstChild(\"ChildName\")",
        "description": "Scans direct children of the instance. Returns the matched instance or null if not found.",
        "parameters": [
            {
                "name": "name",
                "type": "string",
                "desc": "Target name string"
            }
        ],
        "codeSample": "General service = app.FindFirstChild(\"Services\")\nif (service) {\n    print(\"Found service folder:\", service.Name)\n}"
    },
    {
        "id": "name",
        "name": "instance.Name",
        "category": "Object Tree (Instance)",
        "summary": "Read/write string property representing the name identifier of an instance.",
        "syntax": "instance.Name = \"UniqueName\"",
        "description": "Used for identification and discovery via FindFirstChild.",
        "parameters": [],
        "codeSample": "General node = Instance.new(\"Folder\")\nnode.Name = \"Configuration\"\nprint(\"Node name is:\", node.Name)"
    },
    {
        "id": "parent",
        "name": "instance.Parent",
        "category": "Object Tree (Instance)",
        "summary": "Read/write reference to the parent instance in the tree.",
        "syntax": "instance.Parent = newParentNode",
        "description": "Allows re-parenting nodes dynamically at runtime or detaching them by assigning null.",
        "parameters": [],
        "codeSample": "General button = Instance.new(\"Button\")\nbutton.Parent = windowPage // Attached to windowPage"
    },
    {
        "id": "file",
        "name": "File",
        "category": "Filesystem & I/O",
        "summary": "Filesystem operations for reading, writing, and querying files.",
        "syntax": "File.Read(path)\nFile.Write(path, content)\nFile.Exists(path)\nFile.Delete(path)",
        "description": "Static filesystem utility library for persistent text, configuration, and data file management.",
        "parameters": [
            {
                "name": "path",
                "type": "string",
                "desc": "Relative or absolute file path"
            },
            {
                "name": "content",
                "type": "string",
                "desc": "Text content to write"
            }
        ],
        "codeSample": "// Write config file\nFile.Write(\"config.txt\", \"theme=dark\\nauto_save=true\")\n\n// Check existence and read\nif (File.Exists(\"config.txt\")) {\n    General data = File.Read(\"config.txt\")\n    print(\"Configuration content:\\n\" + data)\n}"
    },
    {
        "id": "directory",
        "name": "Directory",
        "category": "Filesystem & I/O",
        "summary": "Directory management utility for creating and listing folders.",
        "syntax": "Directory.List(path)\nDirectory.Create(path)\nDirectory.Exists(path)",
        "description": "Static directory management for organizing files, scanning directories, and scaffolding folders.",
        "parameters": [
            {
                "name": "path",
                "type": "string",
                "desc": "Folder path"
            }
        ],
        "codeSample": "if (!Directory.Exists(\"data/backups\")) {\n    Directory.Create(\"data/backups\")\n}\nGeneral files = Directory.List(\"data\")\nprint(\"Files in data:\", files)"
    },
    {
        "id": "cllpdb",
        "name": "CLLPDB",
        "category": "Databases (.cllpdb & .db)",
        "summary": "Encrypted AES database service with developer-configurable session and UTF-8 MySQL engine.",
        "syntax": "General db = CLLPDB.Open(filePath, [key])\nbool ok = db.StartSession(\"user\", \"pass\", [durationSeconds])\ndb.CloseSession()\ndb.Disconnect()",
        "description": "Encrypted database engine specific to LLP (.cllpdb). Features AES-256 encryption, unique per-project encryption key, developer-defined session duration (permanent by default in user scripts, or custom timeout in seconds; 2-minute safety session exclusively when opened in VS Code editor), on-demand connection/disconnection (.CloseSession(), .Disconnect()), and relational tables with Primary Keys (🔑) and Foreign Keys (🔗). Supports full UTF-8 international characters and standard SQL: CREATE TABLE, INSERT INTO, SELECT, DELETE, DROP TABLE, DROP ALL TABLES;, DROP ALL DATA FROM <table>;, and DROP ALL DATABASE;.",
        "parameters": [
            {
                "name": "filePath",
                "type": "string",
                "desc": "Path to .cllpdb file (e.g. data/products.cllpdb)"
            },
            {
                "name": "key",
                "type": "string (optional)",
                "desc": "Encryption key override"
            },
            {
                "name": "durationSeconds",
                "type": "number (optional)",
                "desc": "Session duration in seconds (optional; if omitted or 0, session remains active indefinitely)"
            }
        ],
        "codeSample": "// 1. Open encrypted database\nGeneral db = CLLPDB.Open(\"data/products.cllpdb\")\n\n// 2. Start permanent session (or pass custom duration in seconds, e.g. 120)\nbool auth = db.StartSession(\"admin\", \"admin123\")\nprint(\"Session active indefinitely?\", db.IsSessionActive())\n\n// 3. Query records with UTF-8 support\nGeneral products = db.Query(\"SELECT * FROM products\")\nprint(\"Products catalog:\", products)\n\n// 4. Optionally disconnect on demand\ndb.CloseSession()"
    },
    {
        "id": "database",
        "name": "Database",
        "category": "Databases (.cllpdb & .db)",
        "summary": "Standard Key-Value and basic table database service (.db).",
        "syntax": "General db = Database.Open(\"app.db\")\ndb.Set(\"key\", val)\ndb.Get(\"key\")",
        "description": "Lightweight Key-Value store and basic table storage without encryption, suitable for caches and local temporary states.",
        "parameters": [
            {
                "name": "filePath",
                "type": "string",
                "desc": "Path to .db file"
            }
        ],
        "codeSample": "General db = Database.Open(\"cache.db\")\ndb.Set(\"last_login\", \"2026-09-23\")\nprint(\"Last login:\", db.Get(\"last_login\"))"
    },
    {
        "id": "py",
        "name": "PY",
        "category": "Math & Scientific Libraries",
        "summary": "Universal mathematical constant π (3.141592653589793) accessible everywhere.",
        "syntax": "float area = PY * Math.Pow(radius, 2)",
        "description": "Universal constant representing Pi (π). Known by all LLP files and user scripts globally without requiring imports.",
        "parameters": [],
        "codeSample": "float radius = 25.0\nfloat circularArea = PY * Math.Pow(radius, 2)\nfloat perimeter = 2 * PY * radius\nprint(\"Area:\", Math.Round(circularArea), \"px²\")\nprint(\"Perimeter:\", Math.Round(perimeter), \"px\")"
    },
    {
        "id": "math",
        "name": "Math",
        "category": "Math & Scientific Libraries",
        "summary": "Standard mathematical calculation functions library.",
        "syntax": "Math.Round(val)\nMath.Pow(base, exp)\nMath.Sqrt(val)\nMath.Abs(val)",
        "description": "Provides common mathematical functions including rounding, powers, square roots, trigonometric functions (Sin, Cos, Tan), and min/max clamps.",
        "parameters": [
            {
                "name": "val",
                "type": "float | int",
                "desc": "Numeric input"
            }
        ],
        "codeSample": "float power = Math.Pow(2, 8) // 256\nfloat root = Math.Sqrt(144)    // 12\nfloat rounded = Math.Round(3.14159) // 3\nprint(\"Math calculations:\", power, root, rounded)"
    },
    {
        "id": "scillp",
        "name": "SciLlp",
        "category": "Math & Scientific Libraries",
        "summary": "Advanced scientific computing library (SciPy equivalent for LLP).",
        "syntax": "SciLlp.Mean(list)\nSciLlp.StdDev(list)\nSciLlp.MovingAverage(signal, window)\nSciLlp.Integrate(fn, a, b)\nSciLlp.LinearRegression(xList, yList)",
        "description": "Scientific calculations module offering statistical descriptive metrics (Mean, Variance, StdDev, Skewness, Kurtosis), signal processing (MovingAverage, SignalFilter, PeakDetect), numerical integration (Simpson 1/3 and Trapezoidal), and numerical gradient descent optimization.",
        "parameters": [
            {
                "name": "list",
                "type": "General list",
                "desc": "Input dataset"
            }
        ],
        "codeSample": "General sales = General{100.0, 150.0, 140.0, 250.0, 300.0}\nprint(\"Mean sales:\", SciLlp.Mean(sales))\nprint(\"Standard deviation:\", Math.Round(SciLlp.StdDev(sales)))\nprint(\"Smoothed signal:\", SciLlp.MovingAverage(sales, 3))"
    },
    {
        "id": "symllp",
        "name": "SymLlp",
        "category": "Math & Scientific Libraries",
        "summary": "Symbolic mathematics and computer algebra library (SymPy equivalent for LLP).",
        "syntax": "SymLlp.Solve(\"2*x + 4 = 10\", \"x\")\nSymLlp.Derivative(\"3*x^2 + 5*x\", \"x\")\nSymLlp.Integral(\"3*x^2\", \"x\")\nSymLlp.MatrixDet(matrix)",
        "description": "Enables formal algebraic manipulation: exact linear and quadratic equation solving, formal derivatives, indefinite integrals with constant C, algebraic simplification, Taylor series expansions, and symbolic matrix determinants.",
        "parameters": [
            {
                "name": "equation",
                "type": "string",
                "desc": "Algebraic expression string"
            },
            {
                "name": "variable",
                "type": "string",
                "desc": "Target variable (e.g. 'x')"
            }
        ],
        "codeSample": "// Exact equation solver\nprint(\"Solution for 2*x + 4 = 100:\", SymLlp.Solve(\"2*x + 4 = 100\", \"x\"))\n\n// Symbolic derivative\nprint(\"d/dx (3*x^2 + 5*x - 2):\", SymLlp.Derivative(\"3*x^2 + 5*x - 2\", \"x\"))\n\n// Symbolic integral\nprint(\"∫ (3*x^2 + 2*x) dx:\", SymLlp.Integral(\"3*x^2 + 2*x\", \"x\"))"
    },
    {
        "id": "probllp",
        "name": "ProbLlp",
        "category": "Math & Scientific Libraries",
        "summary": "Probabilities, combinatorics, and probability distributions library.",
        "syntax": "ProbLlp.Combinations(n, k)\nProbLlp.Poisson(k, lambda)\nProbLlp.Binomial(k, n, p)\nProbLlp.NormalPDF(x, mean, std)",
        "description": "Combinatorics and probability engine computing Factorials, Permutations, Combinations, and probability mass/density functions for Poisson, Binomial, and Gaussian Normal distributions.",
        "parameters": [
            {
                "name": "n",
                "type": "int",
                "desc": "Total population size"
            },
            {
                "name": "k",
                "type": "int",
                "desc": "Sample size"
            }
        ],
        "codeSample": "// 3-product bundle combinations out of 6\nprint(\"Combinations (6 choose 3):\", ProbLlp.Combinations(6, 3)) // 20\n\n// Poisson probability of selling 4 units when lambda = 3.5\nfloat p = ProbLlp.Poisson(4, 3.5)\nprint(\"Poisson probability:\", Math.Round(p * 100), \"%\")"
    },
    {
        "id": "crypto",
        "name": "Crypto",
        "category": "Security & Validation",
        "summary": "Cryptography library providing unique project keys and AES-256 encryption.",
        "syntax": "Crypto.GetProjectKey()\nCrypto.HashSha256(text)\nCrypto.EncryptAES(text, key)\nCrypto.DecryptAES(cipher, key)",
        "description": "Provides cryptographic security tools for LLP projects. Every project has a unique deterministic AES-256 project encryption key generated from the project path and metadata.",
        "parameters": [],
        "codeSample": "string projectKey = Crypto.GetProjectKey()\nprint(\"Unique project key:\", projectKey)\n\nstring cipher = Crypto.EncryptAES(\"SecretData123\", projectKey)\nstring plain = Crypto.DecryptAES(cipher, projectKey)\nprint(\"Decrypted verification:\", plain)"
    },
    {
        "id": "uivalidator",
        "name": "UIValidator",
        "category": "Security & Validation",
        "summary": "Form input validation rules and user feedback toast notifications.",
        "syntax": "UIValidator.ValidateRequired(val)\nUIValidator.ValidateEmail(val)\nUIValidator.ValidateNumber(val)\nUIValidator.ShowSuccess(msg)\nUIValidator.ShowError(field, msg)",
        "description": "Built-in validation service for checking text input fields, emails, numeric bounds, and displaying standard validation toasts.",
        "parameters": [
            {
                "name": "val",
                "type": "string | number",
                "desc": "Input to validate"
            }
        ],
        "codeSample": "bool ok = UIValidator.ValidateRequired(\"admin\")\nbool numOk = UIValidator.ValidateNumber(45.5)\n\nif (ok && numOk) {\n    UIValidator.ShowSuccess(\"All inputs are valid!\")\n} else {\n    UIValidator.ShowError(\"Form\", \"Invalid input data.\")\n}"
    },
    {
        "id": "background",
        "name": "Background",
        "category": "GUI Components (.illp)",
        "summary": "Root container for an application window in an .illp interface.",
        "syntax": "Background \"WindowName\" responsive: true minWidth: \"400px\" minHeight: \"300px\" { ... }",
        "description": "The primary viewport root container of any LLP visual interface. Supports responsive layout mode, minimum and maximum width/height constraints.",
        "parameters": [
            {
                "name": "name",
                "type": "string",
                "desc": "Component identifier"
            },
            {
                "name": "responsive",
                "type": "bool",
                "desc": "Enables flexible responsive layout"
            },
            {
                "name": "minWidth / maxWidth",
                "type": "css length",
                "desc": "Width boundary (e.g. '480px')"
            },
            {
                "name": "minHeight / maxHeight",
                "type": "css length",
                "desc": "Height boundary (e.g. '600px')"
            }
        ],
        "codeSample": "Background \"MainWindow\" responsive: true minWidth: \"480px\" maxWidth: \"1024px\" minHeight: \"600px\" {\n    Card \"ContentCard\" title: \"App Window\" {\n        Text \"Lbl\" content: \"Interface active.\"\n    }\n}"
    },
    {
        "id": "card",
        "name": "Card",
        "category": "GUI Components (.illp)",
        "summary": "Card container component grouping widgets with an optional header title.",
        "syntax": "Card \"CardName\" title: \"Title\" { ... }",
        "description": "Visual container card styled with a rounded border, shadow, and header title to organize controls into distinct functional sections.",
        "parameters": [
            {
                "name": "title",
                "type": "string",
                "desc": "Header title displayed at the top of the card"
            }
        ],
        "codeSample": "Card \"LoginCard\" title: \"User Authentication\" {\n    TextInput \"UsernameInput\" placeholder: \"Username...\"\n    Button \"SubmitBtn\" text: \"Sign In\"\n}"
    },
    {
        "id": "row",
        "name": "Row",
        "category": "GUI Components (.illp)",
        "summary": "Horizontal flexbox row container arranging child items horizontally.",
        "syntax": "Row \"RowName\" { ... }",
        "description": "Displays child elements side-by-side with uniform spacing and vertical alignment.",
        "parameters": [],
        "codeSample": "Row \"ActionsRow\" {\n    Button \"BtnCancel\" text: \"Cancel\"\n    Button \"BtnConfirm\" text: \"Confirm\"\n}"
    },
    {
        "id": "grid",
        "name": "Grid",
        "category": "GUI Components (.illp)",
        "summary": "Multi-column responsive grid container.",
        "syntax": "Grid \"GridName\" columns: 2 { ... }",
        "description": "Arranges elements in a structured grid with a specified number of columns.",
        "parameters": [
            {
                "name": "columns",
                "type": "int",
                "desc": "Number of columns (e.g. 1, 2, 3, 4)"
            }
        ],
        "codeSample": "Grid \"FormGrid\" columns: 2 {\n    TextInput \"FirstName\" placeholder: \"First name\"\n    TextInput \"LastName\" placeholder: \"Last name\"\n}"
    },
    {
        "id": "modal",
        "name": "Modal",
        "category": "GUI Components (.illp)",
        "summary": "Page on Page (Modal) overlay window displayed above the parent interface.",
        "syntax": "Modal \"ModalName\" title: \"Modal Title\" { ... }",
        "description": "A nested overlay window ('Page on Page') that appears on top of the host page when triggered. Supports form inputs, confirmation buttons, and close actions.",
        "parameters": [
            {
                "name": "title",
                "type": "string",
                "desc": "Modal title in the header bar"
            }
        ],
        "codeSample": "Modal \"AddProductModal\" title: \"Add New Product (Page on Page)\" {\n    TextInput \"ProductName\" placeholder: \"Product name...\"\n    Button \"BtnSave\" text: \"Save Product\"\n    Button \"BtnClose\" text: \"Close\" action: \"closeModal\"\n}"
    },
    {
        "id": "button",
        "name": "Button",
        "category": "GUI Components (.illp)",
        "summary": "Interactive clickable button with navigation (targetPage) or modal actions.",
        "syntax": "Button \"BtnName\" text: \"Click Me\" targetPage: \"page.illp\" action: \"openModal:ModalName\"",
        "description": "Triggers page navigation to another .illp file via 'targetPage', opens a modal overlay via 'action: openModal:Name', or dispatches custom events.",
        "parameters": [
            {
                "name": "text",
                "type": "string",
                "desc": "Button label text"
            },
            {
                "name": "targetPage",
                "type": "string (optional)",
                "desc": "Target .illp file path to navigate to"
            },
            {
                "name": "action",
                "type": "string (optional)",
                "desc": "Action: 'openModal:Name' or 'closeModal'"
            }
        ],
        "codeSample": "// Button navigating to another page\nButton \"BtnCatalog\" text: \"View Catalog ➔\" targetPage: \"dashboard.illp\"\n\n// Button opening a page on page (modal)\nButton \"BtnAdd\" text: \"➕ Add Item\" action: \"openModal:AddProductModal\""
    },
    {
        "id": "textinput",
        "name": "TextInput",
        "category": "GUI Components (.illp)",
        "summary": "Single-line text entry field with placeholder support.",
        "syntax": "TextInput \"InputName\" placeholder: \"Enter text...\"",
        "description": "Input field for user text entry, password typing, or numeric input.",
        "parameters": [
            {
                "name": "placeholder",
                "type": "string",
                "desc": "Hint text displayed when empty"
            }
        ],
        "codeSample": "TextInput \"EmailField\" placeholder: \"user@example.com\""
    },
    {
        "id": "text",
        "name": "Text",
        "category": "GUI Components (.illp)",
        "summary": "Text label element displaying formatted content.",
        "syntax": "Text \"TextName\" content: \"Display message\"",
        "description": "Displays static text, titles, subtitles, and status indicators in the user interface.",
        "parameters": [
            {
                "name": "content",
                "type": "string",
                "desc": "Text content to display"
            }
        ],
        "codeSample": "Text \"HeaderTitle\" content: \"📦 Inventory Management Dashboard\""
    },
    {
        "id": "checkbox",
        "name": "Checkbox",
        "category": "GUI Components (.illp)",
        "summary": "Interactive boolean toggle checkbox.",
        "syntax": "Checkbox \"CheckName\" label: \"Label text\" checked: true",
        "description": "Checkbox toggle for enabling or disabling application settings and features.",
        "parameters": [
            {
                "name": "label",
                "type": "string",
                "desc": "Text description next to the checkbox"
            },
            {
                "name": "checked",
                "type": "bool",
                "desc": "Initial state (true or false)"
            }
        ],
        "codeSample": "Checkbox \"AutoSaveCheck\" label: \"Enable automatic 2-minute sync\" checked: true"
    },
    {
        "id": "itembox",
        "name": "ItemBox",
        "category": "GUI Components (.illp)",
        "summary": "Dropdown select control for choosing an item from a list.",
        "syntax": "ItemBox \"SelectName\" default: \"Item1\" items: [\"Item1\", \"Item2\", \"Item3\"]",
        "description": "Dropdown selector populated with a list of string options.",
        "parameters": [
            {
                "name": "default",
                "type": "string",
                "desc": "Initially selected item"
            },
            {
                "name": "items",
                "type": "array",
                "desc": "List of selectable options"
            }
        ],
        "codeSample": "ItemBox \"CategorySelect\" default: \"Computers\" items: [\"Computers\", \"Audio\", \"Peripherals\"]"
    },
    {
        "id": "image",
        "name": "Image",
        "category": "GUI Components (.illp)",
        "summary": "Displays an image asset from a file path.",
        "syntax": "Image \"LogoImage\" src: \"assets/logo.png\"",
        "description": "Embeds an image or icon graphic into the user interface.",
        "parameters": [
            {
                "name": "src",
                "type": "string",
                "desc": "File path to the image"
            }
        ],
        "codeSample": "Image \"BrandLogo\" src: \"assets/logo.png\""
    },
    {
        "id": "progressbar",
        "name": "ProgressBar",
        "category": "GUI Components (.illp)",
        "summary": "Visual progress bar showing completion percentage.",
        "syntax": "ProgressBar \"BarName\" value: 75 max: 100",
        "description": "Displays progress, quotas, or remaining session time visually.",
        "parameters": [
            {
                "name": "value",
                "type": "number",
                "desc": "Current value"
            },
            {
                "name": "max",
                "type": "number",
                "desc": "Maximum scale value (e.g. 100)"
            }
        ],
        "codeSample": "ProgressBar \"SessionProgress\" value: 90 max: 100"
    },
    {
        "id": "session",
        "name": "Session",
        "category": "Security & Validation",
        "summary": "PHP-style session manager with transparent AES-256 encrypted persistence.",
        "syntax": "Session.Start([customId])\nSession.Set(key, value)\nSession.Get(key)\nSession.Has(key)\nSession.Remove(key)\nSession.Save()\nSession.Destroy()\nSession.Id()",
        "description": "Provides a complete session management system inspired by PHP. Stores session variables in memory during execution and persists them on disk with transparent AES-256 encryption. Features automatic session ID generation, per-project encryption keys, tamper-proof session files (.cllpsess), and functions to check, retrieve, delete, and persist session states.",
        "parameters": [
            {
                "name": "key",
                "type": "string",
                "desc": "Session variable identifier name"
            },
            {
                "name": "value",
                "type": "General / any",
                "desc": "Data value to store in the active session"
            },
            {
                "name": "customId",
                "type": "string (optional)",
                "desc": "Custom session ID to resume or assign"
            }
        ],
        "codeSample": "// Start encrypted session\nSession.Start()\nSession.Set(\"user_id\", 1001)\nSession.Set(\"role\", \"Administrator\")\nSession.Set(\"is_authenticated\", true)\nSession.Save()\n\n// Check and read session variable\nif (Session.Has(\"role\")) {\n    print(\"Current role:\", Session.Get(\"role\"))\n}\nprint(\"Active session ID:\", Session.Id())"
    },
    {
        "id": "device",
        "name": "Device",
        "category": "Security & Validation",
        "summary": "Hardware-bound unique identification and cryptographic anti-spoofing engine.",
        "syntax": "Device.GetId()\nDevice.GetToken([payload])\nDevice.Sign(data)\nDevice.Verify(token, [payload])\nDevice.GetPlatform()\nDevice.GetInfo()\nDevice.IsTrusted()",
        "description": "Binds client applications to immutable hardware characteristics (Machine GUID, motherboard serial, CPU signature, and network interface MAC addresses). Generates a deterministic 64-character Device ID (Device.GetId) and time-bound anti-replay cryptographic tokens (Device.GetToken). Guarantees that mobile devices and PCs cannot be cloned, forged, or spoofed by unauthorized clients.",
        "parameters": [
            {
                "name": "payload",
                "type": "string (optional)",
                "desc": "Optional nonce or authentication scope to bind into token signature"
            },
            {
                "name": "token",
                "type": "string",
                "desc": "Signed hardware token in deviceId.timestamp.nonce.signature format"
            },
            {
                "name": "data",
                "type": "string",
                "desc": "Arbitrary text to sign with hardware-bound private secret"
            }
        ],
        "codeSample": "// Inspect immutable hardware identity\nGeneral devId = Device.GetId()\nprint(\"Hardware Device ID:\", devId)\nprint(\"Platform:\", Device.GetPlatform())\nprint(\"Hardware Anchor Trusted:\", Device.IsTrusted())\n\n// Generate signed time-bound token for server authentication\nGeneral signedToken = Device.GetToken(\"login_attempt\")\nbool valid = Device.Verify(signedToken, \"login_attempt\")\nprint(\"Token valid?\", valid)"
    },
    {
        "id": "client",
        "name": "Client",
        "category": "Security & Validation",
        "summary": "Remote HTTP/HTTPS client connector with automatic device authentication and session sync.",
        "syntax": "Client.Connect(domainOrIp, port)\nClient.SetServer(url)\nClient.GetServerUrl()\nClient.Login(username, password)\nClient.Get(path)\nClient.Post(path, body)\nClient.Request(method, path, [body])\nClient.IsConnected()\nClient.Disconnect()",
        "description": "Enables client applications to delegate account and data management to a remote server. Automatically attaches hardware identity headers (X-Device-Id, X-Device-Token) and active session tokens (X-Session-Id) to every request. Allows connecting to any domain name or IP:Port to keep client applications ultra-lightweight.",
        "parameters": [
            {
                "name": "domainOrIp",
                "type": "string",
                "desc": "Remote server IP address (e.g. '192.168.1.50') or domain name"
            },
            {
                "name": "port",
                "type": "integer",
                "desc": "Remote server TCP port (e.g. 8080, 443, 9000)"
            },
            {
                "name": "path",
                "type": "string",
                "desc": "Target API endpoint path (e.g. '/api/products')"
            },
            {
                "name": "body",
                "type": "string (optional)",
                "desc": "JSON body payload for POST/PUT requests"
            }
        ],
        "codeSample": "// Connect to remote LLP backend server\nClient.Connect(\"127.0.0.1\", 8990)\n\n// Authenticate unique client device on server\nGeneral authRes = Client.Login(\"my_username\", \"secret_pass\")\nprint(\"Authentication result:\", authRes)\n\n// Query remote protected backend data\nGeneral products = Client.Get(\"/api/products\")\nprint(\"Products from remote server:\", products)"
    },
    {
        "id": "server",
        "name": "Server",
        "category": "Security & Validation",
        "summary": "Dedicated LLP backend server engine with routing and hardware anti-spoofing enforcement.",
        "syntax": "Server.Listen(port, [host])\nServer.Route(method, path, handler)\nServer.Get(path, handler)\nServer.Post(path, handler)\nServer.RequireDevice(boolean)\nServer.SetAuthSecret(secret)\nServer.GetConnectedClients()\nServer.KickClient(deviceId)\nServer.BanDevice(deviceId)\nServer.Stop()",
        "description": "Allows developers to write standalone backend servers entirely in pure LLP. Features a built-in HTTP server, flexible route handlers, hardware anti-spoofing validation (Server.RequireDevice), connected client tracking, device banning, and encrypted session management. Can be executed on dedicated servers using 'llp server <script.llp>'.",
        "parameters": [
            {
                "name": "port",
                "type": "integer",
                "desc": "TCP port to bind the server on (e.g. 8080)"
            },
            {
                "name": "host",
                "type": "string (optional)",
                "desc": "Host address to listen on (defaults to '0.0.0.0')"
            },
            {
                "name": "path",
                "type": "string",
                "desc": "URL route path pattern (e.g. '/api/login', '/api/users/*')"
            },
            {
                "name": "handler",
                "type": "func(req)",
                "desc": "LLP function receiving HttpRequest instance"
            }
        ],
        "codeSample": "// Enable strict hardware anti-spoofing device security\nServer.RequireDevice(true)\n\n// Define route handlers\nfunc handleGetProducts(req) {\n    print(\"Request from verified device:\", req.DeviceId)\n    return \"{\\\"products\\\": [{\\\"id\\\": 1, \\\"name\\\": \\\"Cloud Server\\\"}]}\"\n}\n\nServer.Get(\"/api/products\", handleGetProducts)\nServer.Listen(8080, \"0.0.0.0\")\nprint(\"LLP Backend Server listening on port 8080\")"
    },
    {
        "id": "module",
        "name": "module",
        "category": "Control Flow & Logic",
        "summary": "Embedded function module block (e.g. module DevMode). If unconfigured, its state is sealed and randomly encrypted.",
        "syntax": "function Launch(appName, port) then\n    module DevMode then\n        // Pre-embedded test tools & live inspector\n    end\nend\n\nLaunch(\"MyApp\", 8080, DevMode: True)",
        "description": "Function Modules ('module ModuleName then ... end') are self-contained feature suites embedded directly inside functions. Unlike standard parameters which only pass raw input data, the function already knows and implements the entire module logic (e.g. account management, security bypass toggles, server payload inspection). The caller simply enables it (DevMode: True) or provides fine-grained permission flags. Security Rule: if the developer has not provided an explicit mechanism to modify a module's internal state, its memory is randomly encrypted and sealed at runtime, preventing unauthorized alteration or injection attacks.",
        "parameters": [
            {
                "name": "ModuleName",
                "type": "identifier",
                "desc": "Name of the embedded function module (e.g. DevMode)"
            },
            {
                "name": "DevMode",
                "type": "bool | Instance",
                "desc": "Activation toggle or configuration instance defining permitted rights during test"
            }
        ],
        "codeSample": "function Launch(name, port) then\n    module DevMode then\n        print(\"🔧 DevMode active: Server inspector and test accounts online\")\n        if DevMode.canBypassSecurity == True then\n            print(\"  [!] Security bypass enabled\")\n        end\n    end\nend\n\nLaunch(\"App\", 8080, DevMode: True)"
    },
    {
        "id": "namespace",
        "name": "namespace",
        "category": "Control Flow & Logic",
        "summary": "Package container grouping classes and shared namespace-level variables.",
        "syntax": "namespace PackageName then\n    int GlobalVar = 100\n    class Entity then ... end\nend",
        "description": "Declares an organizational namespace grouping multiple classes and shared package variables. Prevents global scope pollution while making classes and shared constants easily accessible as 'PackageName.ClassName'.",
        "parameters": [
            {
                "name": "PackageName",
                "type": "identifier",
                "desc": "Unique package identifier"
            }
        ],
        "codeSample": "namespace GameEngine then\n    int MaxEntities = 5000\n    class Physics then\n        int Gravity = -10\n    end\nend\n\nGeneral p = GameEngine.Physics.new()"
    },
    {
        "id": "cllp",
        "name": "Class (.cllp)",
        "category": "Object Tree (Instance)",
        "summary": "Dedicated Class Lolpaon file (.cllp) with automatic ancestral ToString() path.",
        "syntax": "class ClassName then\n    // Properties and methods\nend",
        "description": "Dedicated .cllp files strictly declare one single class sharing the exact same name as the file (e.g., Player.cllp contains 'class Player'). All classes and instances automatically inherit a hierarchical ToString() method that prints the complete ancestral chain from parents up to the class source file (e.g., '[Player.cllp > Root > Parent > Instance]').",
        "parameters": [],
        "codeSample": "// File: Player.cllp\nclass Player then\n    string Name = \"Arthur\"\nend\n\nGeneral hero = Player.new(zone)\nprint(hero) // Prints: [Player.cllp > World > Zone > Arthur]"
    },
    {
        "id": "orchestrator",
        "name": "Orchestrator",
        "category": "Core Built-ins & Arrays",
        "summary": "Smart multi-task orchestrator managing concurrency and load balancing under massive traffic.",
        "syntax": "Orchestrator.Dispatch(task)\nOrchestrator.Schedule(task, priority)\nOrchestrator.GetQueueStats()",
        "description": "LLP's high-efficiency task orchestrator ('Chef d'orchestre') automatically balances, queues, and separates incoming requests and asynchronous operations (I/O, client-server RPCs, database operations, computation loops). It prevents UI freezes and server bottlenecks even under extreme request bursts.",
        "parameters": [
            {
                "name": "task",
                "type": "function",
                "desc": "Asynchronous routine or callback to schedule"
            },
            {
                "name": "priority",
                "type": "string (optional)",
                "desc": "Priority level ('High', 'Normal', 'Background')"
            }
        ],
        "codeSample": "// Dispatch background operation through the orchestrator\nOrchestrator.Dispatch(func() {\n    print(\"Optimized non-blocking background task completed\")\n})"
    }
];

// Lookup map for fast retrieval by lowercase keyword or ID
const LLP_DOCS_MAP = {};
for (const item of LLP_DOCS_LIST) {
    LLP_DOCS_MAP[item.id.toLowerCase()] = item;
    LLP_DOCS_MAP[item.name.toLowerCase()] = item;
}

// Convenient aliases for keywords and common queries
const ALIASES = {
    "devmode": "module",
    "class": "cllp",
    ".cllp": "cllp",
    "tostring": "cllp",
    "orchestre": "orchestrator",
    "chefdorchestre": "orchestrator"
};
for (const [alias, targetId] of Object.entries(ALIASES)) {
    if (LLP_DOCS_MAP[targetId]) {
        LLP_DOCS_MAP[alias] = LLP_DOCS_MAP[targetId];
    }
}

/**
 * Returns a documentation item localized in the specified language.
 * Falls back to Universal English for any missing field.
 */
function getLocalizedDoc(item, lang = "en") {
    if (!item) return null;
    const l = (lang || "en").toLowerCase();
    if (l === "en") return item;

    const langData = LLP_ITEMS_I18N[l];
    if (!langData || !langData[item.id]) return item;

    const trans = langData[item.id];
    const catMap = LLP_CATEGORIES_I18N[l] || {};
    const localizedCategory = catMap[item.category] || item.category;

    const copy = JSON.parse(JSON.stringify(item));
    copy.category = localizedCategory;
    if (trans.summary) copy.summary = trans.summary;
    if (trans.description) copy.description = trans.description;

    if (trans.parameters && copy.parameters) {
        copy.parameters = copy.parameters.map(p => {
            const translatedDesc = trans.parameters[p.name];
            return {
                ...p,
                desc: translatedDesc || p.desc
            };
        });
    }

    return copy;
}

/**
 * Returns the entire documentation catalog localized in the specified language
 */
function getDocsList(lang = "en") {
    return LLP_DOCS_LIST.map(item => getLocalizedDoc(item, lang));
}

/**
 * Searches for a documentation entry by keyword or identifier and returns it localized
 */
function findDoc(word, lang = "en") {
    if (!word) return null;
    const clean = word.trim().toLowerCase();
    let found = LLP_DOCS_MAP[clean];

    // Try stripping method call or dot prefixes
    if (!found && clean.includes('.')) {
        const parts = clean.split('.');
        if (LLP_DOCS_MAP[clean]) found = LLP_DOCS_MAP[clean];
        else if (LLP_DOCS_MAP[parts[1]]) found = LLP_DOCS_MAP[parts[1]];
        else if (LLP_DOCS_MAP[parts[0]]) found = LLP_DOCS_MAP[parts[0]];
    }

    // Try partial match
    if (!found) {
        for (const item of LLP_DOCS_LIST) {
            if (item.id.toLowerCase() === clean || item.name.toLowerCase().startsWith(clean)) {
                found = item;
                break;
            }
        }
    }

    if (found) {
        return getLocalizedDoc(found, lang);
    }
    return null;
}

/**
 * Returns the available documentation languages
 */
function getAvailableLanguages() {
    return [
        { code: "en", name: "English (Universal)", flag: "🇬🇧", default: true },
        { code: "fr", name: "Français (French)", flag: "🇫🇷" },
        { code: "es", name: "Español (Spanish)", flag: "🇪🇸" },
        { code: "de", name: "Deutsch (German)", flag: "🇩🇪" }
    ];
}

/**
 * Returns UI strings for a given language
 */
function getUiStrings(lang = "en") {
    const l = (lang || "en").toLowerCase();
    return LLP_UI_I18N[l] || LLP_UI_I18N["en"];
}

module.exports = {
    LLP_CATEGORIES,
    LLP_CATEGORIES_I18N,
    LLP_UI_I18N,
    LLP_ITEMS_I18N,
    LLP_DOCS_LIST,
    LLP_DOCS_MAP,
    getLocalizedDoc,
    getDocsList,
    findDoc,
    getAvailableLanguages,
    getUiStrings
};
