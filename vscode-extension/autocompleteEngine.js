// ===================================================
// LLP Intelligent Autocomplete Engine
// Context-aware completions, symbol scanning, standard libraries,
// member methods, and intelligent code snippets
// ===================================================

let vscode;
try {
    vscode = require('vscode');
} catch (_) {
    vscode = {
        CompletionItem: function(label, kind) { this.label = label; this.kind = kind; },
        CompletionItemKind: { Method: 0, Function: 1, Variable: 2, Class: 3, Property: 4, Snippet: 5, Keyword: 6 },
        SnippetString: function(str) { this.value = str; },
        MarkdownString: function(str) { this.value = str; }
    };
}

/**
 * Scans the current document for declared variables, functions, and symbols
 * up to the current line position.
 */
function scanDocumentSymbols(document, currentLineNumber) {
    const text = document.getText();
    const lines = text.split(/\r?\n/);
    const variables = new Map();
    const functions = new Map();

    const maxLine = Math.min(lines.length, currentLineNumber);
    for (let i = 0; i < maxLine; i++) {
        const line = lines[i].trim();
        if (line.startsWith('//') || line.startsWith('/-') || line.startsWith('/*')) continue;

        // 1. Function declarations: func name(param1, param2)
        const funcMatch = line.match(/^func\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)/);
        if (funcMatch) {
            const fnName = funcMatch[1];
            const rawParams = funcMatch[2].trim();
            const params = rawParams ? rawParams.split(',').map(p => p.trim()) : [];
            functions.set(fnName, {
                name: fnName,
                params,
                line: i + 1,
                rawLine: line
            });
            continue;
        }

        // 2. Typed Variable declarations: (General|Global|string|int|float|bool|Instance)\s+name\s*=\s*(.*)
        const varTypedMatch = line.match(/^(General|Global|string|int|float|bool|Instance)\s+([a-zA-Z_][a-zA-Z0-9_]*)(\s*=\s*(.*))?/);
        if (varTypedMatch) {
            const rawType = varTypedMatch[1];
            const varName = varTypedMatch[2];
            const rhs = varTypedMatch[4] ? varTypedMatch[4].trim() : "";
            
            let inferredType = rawType;
            if (rawType === "General" || rawType === "Global") {
                if (rhs.startsWith("General{") || rhs.startsWith("{")) {
                    inferredType = "General (Liste dynamique)";
                } else if (rhs.match(/^General\[\d+\]/)) {
                    inferredType = "General (Tableau fixe)";
                } else if (rhs.includes("CLLPDB.Open") || rhs.includes("Database.Open")) {
                    inferredType = "Database (.cllpdb)";
                } else if (rhs.includes("Instance.new")) {
                    inferredType = "Instance";
                } else if (rhs.startsWith('"') || rhs.startsWith("'")) {
                    inferredType = "string";
                } else if (rhs === "true" || rhs === "false" || rhs === "True" || rhs === "False") {
                    inferredType = "bool";
                } else if (/^\d+$/.test(rhs)) {
                    inferredType = "int";
                } else if (/^\d+\.\d+$/.test(rhs)) {
                    inferredType = "float";
                }
            }
            variables.set(varName, {
                name: varName,
                type: inferredType,
                line: i + 1,
                rhs: rhs.slice(0, 40)
            });
            continue;
        }

        // 3. Simple assignments: name = ...
        const varAssignMatch = line.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)/);
        if (varAssignMatch) {
            const varName = varAssignMatch[1];
            const rhs = varAssignMatch[2].trim();
            const reserved = ['if', 'for', 'while', 'return', 'visibility', 'func', 'do', 'then', 'else', 'end'];
            if (!reserved.includes(varName) && !variables.has(varName)) {
                let inferredType = "General";
                if (rhs.includes("CLLPDB.Open") || rhs.includes("Database.Open")) {
                    inferredType = "Database (.cllpdb)";
                } else if (rhs.includes("Instance.new")) {
                    inferredType = "Instance";
                } else if (rhs.startsWith('"') || rhs.startsWith("'")) {
                    inferredType = "string";
                } else if (rhs === "true" || rhs === "false" || rhs === "True" || rhs === "False") {
                    inferredType = "bool";
                } else if (rhs.startsWith("General{") || rhs.startsWith("{")) {
                    inferredType = "General (Liste dynamique)";
                }
                variables.set(varName, {
                    name: varName,
                    type: inferredType,
                    line: i + 1,
                    rhs: rhs.slice(0, 40)
                });
            }
        }
    }

    return { variables, functions };
}

/**
 * Returns completion items for standard library objects and member functions.
 */
function getMemberCompletions(callerName, inferredType) {
    const items = [];
    const lowerCaller = (callerName || "").toLowerCase();
    const typeStr = (inferredType || "").toLowerCase();

    // 1. App Service (Lifecycle & Window Management)
    if (lowerCaller === "app") {
        items.push(
            createSnippetItem(
                "Launch(WindowSize: 250 : 250)",
                "Launch(WindowSize: ${1:250} : ${2:250})",
                "App.Launch(WindowSize: Largeur : Hauteur)",
                "Ouvre l'interface graphique avec des dimensions de fenêtre personnalisées en pixels.",
                vscode.CompletionItemKind.Method,
                "01"
            ),
            createSnippetItem(
                "Launch(DevMode: True)",
                "Launch(DevMode: ${1|True,False|})",
                "App.Launch(DevMode: True/False)",
                "Démarre en mode développeur avec console d'inspection, outils de test et droits de modification.",
                vscode.CompletionItemKind.Method,
                "02"
            ),
            createSnippetItem(
                "Launch(WindowSize: 250 : 250, DevMode: True)",
                "Launch(WindowSize: ${1:250} : ${2:250}, DevMode: ${3|True,False|})",
                "App.Launch(WindowSize, DevMode)",
                "Combine résolution fixe et activation des outils de débogage développeur.",
                vscode.CompletionItemKind.Method,
                "03"
            ),
            createSnippetItem(
                "Lock()",
                "Lock()",
                "App.Lock()",
                "Empêche le redimensionnement de la fenêtre à la souris et désactive le plein écran (taille fixe).",
                vscode.CompletionItemKind.Method,
                "04"
            ),
            createSnippetItem(
                "Silence()",
                "Silence()",
                "App.Silence()",
                "Fait tourner l'application en arrière-plan sans interface (en veille/inactif, comme réduire l'app).",
                vscode.CompletionItemKind.Method,
                "05"
            ),
            createSnippetItem(
                "Silence(RunBack: True)",
                "Silence(RunBack: ${1|True,False|})",
                "App.Silence(RunBack: True/False)",
                "L'application reste présente et continue de tourner activement en tâche de fond.",
                vscode.CompletionItemKind.Method,
                "06"
            ),
            createSnippetItem(
                "Close()",
                "Close()",
                "App.Close()",
                "Force l'arrêt et la fermeture immédiate de l'application et de tous ses processus.",
                vscode.CompletionItemKind.Method,
                "07"
            )
        );
        return items;
    }

    
    // 2.5 Session Service (PHP-style Encrypted Sessions)
    if (lowerCaller === "session") {
        items.push(
            createSnippetItem("Start([customId])", "Start(${1:customId})", "Session.Start()", "Initialise ou reprend une session chiffrée AES-256.", vscode.CompletionItemKind.Method, "01"),
            createSnippetItem("Set(key, value)", "Set(\"${1:cle}\", ${2:valeur})", "Session.Set(cle, valeur)", "Définit une variable dans la session active.", vscode.CompletionItemKind.Method, "02"),
            createSnippetItem("Get(key)", "Get(\"${1:cle}\")", "Session.Get(cle)", "Récupère la valeur d'une variable de session.", vscode.CompletionItemKind.Method, "03"),
            createSnippetItem("Has(key)", "Has(\"${1:cle}\")", "Session.Has(cle)", "Vérifie si une variable existe dans la session.", vscode.CompletionItemKind.Method, "04"),
            createSnippetItem("Remove(key)", "Remove(\"${1:cle}\")", "Session.Remove(cle)", "Supprime une variable spécifique de la session.", vscode.CompletionItemKind.Method, "05"),
            createSnippetItem("Clear()", "Clear()", "Session.Clear()", "Vide toutes les variables de la session en mémoire.", vscode.CompletionItemKind.Method, "06"),
            createSnippetItem("Save()", "Save()", "Session.Save()", "Persiste immédiatement les données de session chiffrées sur disque.", vscode.CompletionItemKind.Method, "07"),
            createSnippetItem("Destroy()", "Destroy()", "Session.Destroy()", "Détruit complètement la session et supprime son fichier sur disque.", vscode.CompletionItemKind.Method, "08"),
            createSnippetItem("Id()", "Id()", "Session.Id()", "Renvoie l'identifiant unique de la session active.", vscode.CompletionItemKind.Method, "09"),
            createSnippetItem("GetAll()", "GetAll()", "Session.GetAll()", "Renvoie l'ensemble des données de session sous forme de chaîne JSON.", vscode.CompletionItemKind.Method, "10")
        );
        return items;
    }

    // 2.6 Device Service (Hardware-Bound Anti-Spoofing Identification)
    if (lowerCaller === "device") {
        items.push(
            createSnippetItem("GetId()", "GetId()", "Device.GetId()", "Renvoie l'identifiant matériel unique et infalsifiable de l'appareil.", vscode.CompletionItemKind.Method, "01"),
            createSnippetItem("GetToken([payload])", "GetToken(\"${1:payload}\")", "Device.GetToken([payload])", "Génère un jeton cryptographique horodaté signé avec la clé matérielle.", vscode.CompletionItemKind.Method, "02"),
            createSnippetItem("Sign(data)", "Sign(\"${1:data}\")", "Device.Sign(data)", "Signe une chaîne de données avec le secret matériel de l'appareil.", vscode.CompletionItemKind.Method, "03"),
            createSnippetItem("Verify(token, [payload])", "Verify(${1:token}, \"${2:payload}\")", "Device.Verify(token, [payload])", "Vérifie l'authenticité et la fraîcheur d'un jeton d'appareil (anti-rejeu).", vscode.CompletionItemKind.Method, "04"),
            createSnippetItem("GetPlatform()", "GetPlatform()", "Device.GetPlatform()", "Renvoie le nom de la plateforme OS (Windows, Android, Linux, macOS).", vscode.CompletionItemKind.Method, "05"),
            createSnippetItem("GetInfo()", "GetInfo()", "Device.GetInfo()", "Renvoie un rapport JSON des caractéristiques matérielles.", vscode.CompletionItemKind.Method, "06"),
            createSnippetItem("IsTrusted()", "IsTrusted()", "Device.IsTrusted()", "Vérifie l'intégrité de l'ancre de sécurité matérielle locale.", vscode.CompletionItemKind.Method, "07")
        );
        return items;
    }

    // 2.7 Client Service (Remote Server Connection & Client Application)
    if (lowerCaller === "client") {
        items.push(
            createSnippetItem("Connect(domainOrIp, port)", "Connect(\"${1:127.0.0.1}\", ${2:8080})", "Client.Connect(ip, port)", "Configure la connexion au serveur LLP distant via IP/domaine et port.", vscode.CompletionItemKind.Method, "01"),
            createSnippetItem("SetServer(url)", "SetServer(\"${1:http://127.0.0.1:8080}\")", "Client.SetServer(url)", "Définit l'URL complète du point d'accès serveur.", vscode.CompletionItemKind.Method, "02"),
            createSnippetItem("GetServerUrl()", "GetServerUrl()", "Client.GetServerUrl()", "Renvoie l'URL du serveur distant actuellement configurée.", vscode.CompletionItemKind.Method, "03"),
            createSnippetItem("Login(username, password)", "Login(\"${1:utilisateur}\", \"${2:motdepasse}\")", "Client.Login(user, pass)", "Authentifie l'appareil auprès du serveur distant avec signature matérielle.", vscode.CompletionItemKind.Method, "04"),
            createSnippetItem("Get(path)", "Get(\"${1:/api/endpoint}\")", "Client.Get(route)", "Envoie une requête GET avec en-têtes d'appareil et de session automatiques.", vscode.CompletionItemKind.Method, "05"),
            createSnippetItem("Post(path, body)", "Post(\"${1:/api/endpoint}\", \"${2:bodyJson}\")", "Client.Post(route, body)", "Envoie une requête POST avec en-têtes d'appareil et de session automatiques.", vscode.CompletionItemKind.Method, "06"),
            createSnippetItem("Request(method, path, [body])", "Request(\"${1:GET}\", \"${2:/api/route}\", \"${3:body}\")", "Client.Request(method, path, body)", "Envoie une requête HTTP personnalisée vers le serveur distant.", vscode.CompletionItemKind.Method, "07"),
            createSnippetItem("IsConnected()", "IsConnected()", "Client.IsConnected()", "Vérifie la disponibilité et la connexion au serveur distant.", vscode.CompletionItemKind.Method, "08"),
            createSnippetItem("Disconnect()", "Disconnect()", "Client.Disconnect()", "Ferme la session distante et réinitialise la connexion.", vscode.CompletionItemKind.Method, "09")
        );
        return items;
    }

    // 2.8 Server Service (LLP Standalone Backend Engine)
    if (lowerCaller === "server") {
        items.push(
            createSnippetItem("Listen(port, [host])", "Listen(${1:8080}, \"${2:0.0.0.0}\")", "Server.Listen(port, [host])", "Démarre le serveur backend LLP sur le port TCP spécifié.", vscode.CompletionItemKind.Method, "01"),
            createSnippetItem("Route(method, path, handler)", "Route(\"${1:GET}\", \"${2:/api/route}\", ${3:handlerFunc})", "Server.Route(method, path, handler)", "Enregistre un gestionnaire de route HTTP personnalisé.", vscode.CompletionItemKind.Method, "02"),
            createSnippetItem("Get(path, handler)", "Get(\"${1:/api/route}\", ${2:handlerFunc})", "Server.Get(path, handler)", "Enregistre une route HTTP GET.", vscode.CompletionItemKind.Method, "03"),
            createSnippetItem("Post(path, handler)", "Post(\"${1:/api/route}\", ${2:handlerFunc})", "Server.Post(path, handler)", "Enregistre une route HTTP POST.", vscode.CompletionItemKind.Method, "04"),
            createSnippetItem("RequireDevice(boolean)", "RequireDevice(${1|true,false|})", "Server.RequireDevice(actif)", "Active la validation matérielle obligatoire et anti-usurpation des appareils.", vscode.CompletionItemKind.Method, "05"),
            createSnippetItem("SetAuthSecret(secret)", "SetAuthSecret(\"${1:secret_key}\")", "Server.SetAuthSecret(secret)", "Définit le secret de vérification partagé pour les appareils distants.", vscode.CompletionItemKind.Method, "06"),
            createSnippetItem("GetConnectedClients()", "GetConnectedClients()", "Server.GetConnectedClients()", "Renvoie la liste JSON des appareils clients actuellement authentifiés.", vscode.CompletionItemKind.Method, "07"),
            createSnippetItem("KickClient(deviceId)", "KickClient(\"${1:DEV_xxxx}\")", "Server.KickClient(deviceId)", "Déconnecte un client spécifique et révoque sa session.", vscode.CompletionItemKind.Method, "08"),
            createSnippetItem("BanDevice(deviceId)", "BanDevice(\"${1:DEV_xxxx}\")", "Server.BanDevice(deviceId)", "Bannit définitivement un appareil matériel du serveur.", vscode.CompletionItemKind.Method, "09"),
            createSnippetItem("Stop()", "Stop()", "Server.Stop()", "Arrête le serveur backend LLP.", vscode.CompletionItemKind.Method, "10"),
            createSnippetItem("IsRunning()", "IsRunning()", "Server.IsRunning()", "Vérifie si le serveur est actuellement en cours d'exécution.", vscode.CompletionItemKind.Method, "11")
        );
        return items;
    }

    // 2. Database Service / .cllpdb Connection (db., CLLPDB., Database.)
    if (lowerCaller === "cllpdb" || lowerCaller === "database" || lowerCaller === "db" || typeStr.includes("database")) {
        items.push(
            createSnippetItem(
                "Open(path)",
                "Open(\"${1:data/products.cllpdb}\")",
                "CLLPDB.Open(chemin)",
                "Ouvre et connecte une base de données chiffrée (.cllpdb).",
                vscode.CompletionItemKind.Method,
                "01"
            ),
            createSnippetItem(
                "StartSession(user, password)",
                "StartSession(\"${1:admin}\", \"${2:admin123}\")",
                "db.StartSession(username, password)",
                "Authentifie l'utilisateur et active la session chiffrée temporaire de 2 minutes.",
                vscode.CompletionItemKind.Method,
                "02"
            ),
            createSnippetItem(
                "GetRemainingSession()",
                "GetRemainingSession()",
                "db.GetRemainingSession() : int",
                "Renvoie le nombre de secondes restantes pour la session de travail active.",
                vscode.CompletionItemKind.Method,
                "03"
            ),
            createSnippetItem(
                "Query(sql)",
                "Query(\"SELECT * FROM ${1:products}\")",
                "db.Query(sql) : General",
                "Exécute une requête SQL de lecture et renvoie la liste des résultats.",
                vscode.CompletionItemKind.Method,
                "04"
            ),
            createSnippetItem(
                "Execute(sql)",
                "Execute(\"INSERT INTO ${1:products} VALUES (${2:params});\")",
                "db.Execute(sql) : bool",
                "Exécute une commande d'écriture SQL (INSERT, UPDATE, DELETE).",
                vscode.CompletionItemKind.Method,
                "05"
            ),
            createSnippetItem(
                "Close()",
                "Close()",
                "db.Close()",
                "Ferme la connexion à la base et réinitialise la clé de chiffrement en mémoire.",
                vscode.CompletionItemKind.Method,
                "06"
            )
        );
        return items;
    }

    // 3. Math Library (Math.)
    if (lowerCaller === "math") {
        items.push(
            createSnippetItem("Pow(base, exp)", "Pow(${1:base}, ${2:exp})", "Math.Pow(base, exposant)", "Calcule la puissance d'un nombre (base^exp).", vscode.CompletionItemKind.Method, "01"),
            createSnippetItem("Sqrt(value)", "Sqrt(${1:value})", "Math.Sqrt(valeur)", "Calcule la racine carrée d'un nombre positif.", vscode.CompletionItemKind.Method, "02"),
            createSnippetItem("Round(value)", "Round(${1:value})", "Math.Round(valeur)", "Arrondit à l'entier le plus proche.", vscode.CompletionItemKind.Method, "03"),
            createSnippetItem("Floor(value)", "Floor(${1:value})", "Math.Floor(valeur)", "Arrondit à l'entier inférieur.", vscode.CompletionItemKind.Method, "04"),
            createSnippetItem("Ceil(value)", "Ceil(${1:value})", "Math.Ceil(valeur)", "Arrondit à l'entier supérieur.", vscode.CompletionItemKind.Method, "05"),
            createSnippetItem("Abs(value)", "Abs(${1:value})", "Math.Abs(valeur)", "Renvoie la valeur absolue d'un nombre.", vscode.CompletionItemKind.Method, "06"),
            createSnippetItem("Min(a, b)", "Min(${1:a}, ${2:b})", "Math.Min(a, b)", "Renvoie la valeur minimale entre deux nombres.", vscode.CompletionItemKind.Method, "07"),
            createSnippetItem("Max(a, b)", "Max(${1:a}, ${2:b})", "Math.Max(a, b)", "Renvoie la valeur maximale entre deux nombres.", vscode.CompletionItemKind.Method, "08"),
            createSnippetItem("Clamp(val, min, max)", "Clamp(${1:val}, ${2:min}, ${3:max})", "Math.Clamp(val, min, max)", "Restreint une valeur dans un intervalle fermé [min, max].", vscode.CompletionItemKind.Method, "09"),
            createSnippetItem("Lerp(start, end, alpha)", "Lerp(${1:start}, ${2:end}, ${3:alpha})", "Math.Lerp(début, fin, t)", "Interpolation linéaire entre deux valeurs.", vscode.CompletionItemKind.Method, "10"),
            createSnippetItem("DegreeToRad(deg)", "DegreeToRad(${1:deg})", "Math.DegreeToRad(degrés)", "Convertit un angle de degrés vers radians.", vscode.CompletionItemKind.Method, "11"),
            createSnippetItem("RadToDeg(rad)", "RadToDeg(${1:rad})", "Math.RadToDeg(radians)", "Convertit un angle de radians vers degrés.", vscode.CompletionItemKind.Method, "12"),
            createSnippetItem("CircleArea(radius)", "CircleArea(${1:radius})", "Math.CircleArea(rayon) : float", "Calcule l'aire d'un disque (PY * r²).", vscode.CompletionItemKind.Method, "13")
        );
        return items;
    }

    // 4. Instance Service (Object Tree: Instance.)
    if (lowerCaller === "instance" || typeStr.includes("instance")) {
        items.push(
            createSnippetItem("new(className)", "new(\"${1|Part,Folder,Frame,Button,TextLabel,Sound|}\")", "Instance.new(classe)", "Instancie un nouvel objet dans l'arbre d'instances.", vscode.CompletionItemKind.Method, "01"),
            createSnippetItem("FindFirstChild(name)", "FindFirstChild(\"${1:NomEnfant}\")", "instance.FindFirstChild(nom)", "Recherche et renvoie le premier enfant portant ce nom.", vscode.CompletionItemKind.Method, "02"),
            createSnippetItem("GetChildren()", "GetChildren()", "instance.GetChildren() : General", "Renvoie la liste dynamique de tous les enfants directs.", vscode.CompletionItemKind.Method, "03"),
            createSnippetItem("SetProperty(prop, value)", "SetProperty(\"${1:Propriete}\", ${2:valeur})", "instance.SetProperty(nom, valeur)", "Définit dynamiquement la valeur d'une propriété.", vscode.CompletionItemKind.Method, "04"),
            createSnippetItem("Clone()", "Clone()", "instance.Clone() : Instance", "Duplique récursivement l'instance et ses enfants.", vscode.CompletionItemKind.Method, "05"),
            createSnippetItem("Destroy()", "Destroy()", "instance.Destroy()", "Détruit l'instance et libère ses ressources.", vscode.CompletionItemKind.Method, "06"),
            createPropertyItem("Name", "instance.Name : string", "Nom d'identification de l'instance dans l'arbre."),
            createPropertyItem("Parent", "instance.Parent : Instance", "Référence vers l'instance parente.")
        );
        return items;
    }

    // 5. SciLlp (Scientific & Statistical Computing)
    if (lowerCaller === "scillp") {
        items.push(
            createSnippetItem("Mean(list)", "Mean(${1:liste})", "SciLlp.Mean(liste) : float", "Calcule la moyenne arithmétique d'une série de valeurs.", vscode.CompletionItemKind.Method, "01"),
            createSnippetItem("StdDev(list)", "StdDev(${1:liste})", "SciLlp.StdDev(liste) : float", "Calcule l'écart-type d'un échantillon statistique.", vscode.CompletionItemKind.Method, "02"),
            createSnippetItem("Variance(list)", "Variance(${1:liste})", "SciLlp.Variance(liste) : float", "Calcule la variance d'une série de données.", vscode.CompletionItemKind.Method, "03"),
            createSnippetItem("MovingAverage(list, window)", "MovingAverage(${1:liste}, ${2:3})", "SciLlp.MovingAverage(liste, fenêtre)", "Lisse une série temporelle par moyenne mobile.", vscode.CompletionItemKind.Method, "04"),
            createSnippetItem("Normalize(list)", "Normalize(${1:liste})", "SciLlp.Normalize(liste) : General", "Normalise les données entre 0.0 et 1.0 (Min-Max scaling).", vscode.CompletionItemKind.Method, "05"),
            createSnippetItem("DetectPeaks(list, threshold)", "DetectPeaks(${1:liste}, ${2:seuil})", "SciLlp.DetectPeaks(liste, seuil)", "Détecte les pics et anomalies dans un signal.", vscode.CompletionItemKind.Method, "06")
        );
        return items;
    }

    // 6. SymLlp (Symbolic Mathematics & Calculus)
    if (lowerCaller === "symllp") {
        items.push(
            createSnippetItem("Derivative(expr, var)", "Derivative(\"${1:3*x^2 + 5*x - 2}\", \"${2:x}\")", "SymLlp.Derivative(formule, variable)", "Calcule la dérivée symbolique formelle de l'expression.", vscode.CompletionItemKind.Method, "01"),
            createSnippetItem("Integral(expr, var)", "Integral(\"${1:3*x^2 + 2*x}\", \"${2:x}\")", "SymLlp.Integral(formule, variable)", "Calcule la primitive / intégrale formelle de l'expression.", vscode.CompletionItemKind.Method, "02"),
            createSnippetItem("Solve(equation, var)", "Solve(\"${1:2*x + 4 = 100}\", \"${2:x}\")", "SymLlp.Solve(équation, inconnue)", "Résout symboliquement une équation mathématique.", vscode.CompletionItemKind.Method, "03"),
            createSnippetItem("MatrixDet(matrix)", "MatrixDet(${1:matrice})", "SymLlp.MatrixDet(matrice) : float", "Calcule le déterminant d'une matrice carrée 2x2 ou 3x3.", vscode.CompletionItemKind.Method, "04"),
            createSnippetItem("Simplify(expr)", "Simplify(\"${1:2*x + 3*x}\")", "SymLlp.Simplify(formule)", "Simplifie algébriquement une formule littérale.", vscode.CompletionItemKind.Method, "05")
        );
        return items;
    }

    // 7. ProbLlp (Probability & Combinatorics)
    if (lowerCaller === "probllp") {
        items.push(
            createSnippetItem("Combinations(n, k)", "Combinations(${1:n}, ${2:k})", "ProbLlp.Combinations(n, k) : int", "Calcule le coefficient binomial C(n, k) sans répétition.", vscode.CompletionItemKind.Method, "01"),
            createSnippetItem("Permutations(n, k)", "Permutations(${1:n}, ${2:k})", "ProbLlp.Permutations(n, k) : int", "Calcule le nombre d'arrangements et permutations P(n, k).", vscode.CompletionItemKind.Method, "02"),
            createSnippetItem("Factorial(n)", "Factorial(${1:n})", "ProbLlp.Factorial(n) : int", "Calcule la factorielle d'un entier n!.", vscode.CompletionItemKind.Method, "03"),
            createSnippetItem("Poisson(k, lambda)", "Poisson(${1:k}, ${2:lambda})", "ProbLlp.Poisson(k, lambda) : float", "Calcule la probabilité de Poisson P(X = k) avec paramètre lambda.", vscode.CompletionItemKind.Method, "04"),
            createSnippetItem("Binomial(k, n, p)", "Binomial(${1:k}, ${2:n}, ${3:p})", "ProbLlp.Binomial(k, n, p) : float", "Calcule la probabilité de la loi binomiale B(n, p).", vscode.CompletionItemKind.Method, "05")
        );
        return items;
    }

    // 8. Crypto & Security (Crypto.)
    if (lowerCaller === "crypto") {
        items.push(
            createSnippetItem("GetProjectKey()", "GetProjectKey()", "Crypto.GetProjectKey() : string", "Renvoie la clé de chiffrement SHA-256 unique générée pour ce projet.", vscode.CompletionItemKind.Method, "01"),
            createSnippetItem("Encrypt(text, key)", "Encrypt(\"${1:message}\", ${2:cle})", "Crypto.Encrypt(texte, clé)", "Chiffre un texte en AES-256 avec vecteur d'initialisation aléatoire.", vscode.CompletionItemKind.Method, "02"),
            createSnippetItem("Decrypt(cipher, key)", "Decrypt(${1:donnees}, ${2:cle})", "Crypto.Decrypt(chiffré, clé)", "Déchiffre un message crypté en clair.", vscode.CompletionItemKind.Method, "03"),
            createSnippetItem("ComputeHash(text)", "ComputeHash(\"${1:texte}\")", "Crypto.ComputeHash(texte) : string", "Génère l'empreinte cryptographique SHA-256 du texte.", vscode.CompletionItemKind.Method, "04")
        );
        return items;
    }

    // 9. UI Validation (UIValidator., validator.)
    if (lowerCaller === "uivalidator" || lowerCaller === "validator") {
        items.push(
            createSnippetItem("ValidateRequired(value)", "ValidateRequired(${1:champ})", "UIValidator.ValidateRequired(valeur) : bool", "Vérifie qu'un champ texte ou numérique n'est pas vide.", vscode.CompletionItemKind.Method, "01"),
            createSnippetItem("ValidateNumber(value)", "ValidateNumber(${1:nombre})", "UIValidator.ValidateNumber(valeur) : bool", "Vérifie qu'une valeur est un nombre valide et supérieur à 0.", vscode.CompletionItemKind.Method, "02"),
            createSnippetItem("ValidateEmail(email)", "ValidateEmail(\"${1:adresse@domaine.com}\")", "UIValidator.ValidateEmail(email) : bool", "Vérifie la conformité syntaxique d'une adresse email.", vscode.CompletionItemKind.Method, "03"),
            createSnippetItem("ShowSuccess(message)", "ShowSuccess(\"${1:Opération réussie !}\")", "UIValidator.ShowSuccess(message)", "Affiche un toast ou bandeau de validation vert dans l'interface.", vscode.CompletionItemKind.Method, "04"),
            createSnippetItem("ShowError(field, message)", "ShowError(\"${1:Champ}\", \"${2:Message d'erreur}\")", "UIValidator.ShowError(champ, erreur)", "Affiche une alerte rouge d'erreur de saisie.", vscode.CompletionItemKind.Method, "05")
        );
        return items;
    }

    // 10. File & Directory I/O (File., Directory.)
    if (lowerCaller === "file") {
        items.push(
            createSnippetItem("Read(path)", "Read(\"${1:chemin/fichier.txt}\")", "File.Read(chemin) : string", "Lit et retourne l'intégralité du contenu d'un fichier UTF-8.", vscode.CompletionItemKind.Method, "01"),
            createSnippetItem("Write(path, content)", "Write(\"${1:chemin/fichier.txt}\", ${2:contenu})", "File.Write(chemin, contenu)", "Écrit du texte dans un fichier (écrase le fichier existant).", vscode.CompletionItemKind.Method, "02"),
            createSnippetItem("Append(path, content)", "Append(\"${1:chemin/fichier.txt}\", ${2:contenu})", "File.Append(chemin, contenu)", "Ajoute du texte à la fin d'un fichier existant.", vscode.CompletionItemKind.Method, "03"),
            createSnippetItem("Exists(path)", "Exists(\"${1:chemin/fichier.txt}\") : bool", "File.Exists(chemin) : bool", "Vérifie si le fichier spécifié existe sur le disque.", vscode.CompletionItemKind.Method, "04"),
            createSnippetItem("Delete(path)", "Delete(\"${1:chemin/fichier.txt}\")", "File.Delete(chemin)", "Supprime définitivement le fichier indiqué.", vscode.CompletionItemKind.Method, "05")
        );
        return items;
    }

    if (lowerCaller === "directory") {
        items.push(
            createSnippetItem("Create(path)", "Create(\"${1:dossier/nouveau}\")", "Directory.Create(chemin)", "Crée un dossier et ses dossiers parents si nécessaire.", vscode.CompletionItemKind.Method, "01"),
            createSnippetItem("List(path)", "List(\"${1:dossier}\") : General", "Directory.List(chemin) : General", "Renvoie la liste des noms de fichiers et sous-dossiers.", vscode.CompletionItemKind.Method, "02"),
            createSnippetItem("Exists(path)", "Exists(\"${1:dossier}\") : bool", "Directory.Exists(chemin) : bool", "Vérifie l'existence d'un répertoire sur le disque.", vscode.CompletionItemKind.Method, "03"),
            createSnippetItem("Delete(path)", "Delete(\"${1:dossier}\")", "Directory.Delete(chemin)", "Supprime le répertoire spécifié.", vscode.CompletionItemKind.Method, "04")
        );
        return items;
    }

    // 11. General Lists & Fixed Arrays (Array/List methods: myVar.Add, myVar.Length, etc.)
    // If it's a declared General list, or fixed array, or generic container
    items.push(
        createSnippetItem("Add(item)", "Add(${1:element})", "liste.Add(element)", "Ajoute un élément à la fin de la liste dynamique General.", vscode.CompletionItemKind.Method, "10"),
        createSnippetItem("Remove(index)", "Remove(${1:index})", "liste.Remove(index)", "Supprime l'élément à l'index spécifié dans la liste.", vscode.CompletionItemKind.Method, "11"),
        createSnippetItem("Length()", "Length()", "liste.Length() : int", "Renvoie le nombre d'éléments actuellement présents.", vscode.CompletionItemKind.Method, "12"),
        createSnippetItem("MaxLength()", "MaxLength()", "tableau.MaxLength() : int", "Renvoie la capacité maximale N définie sur un tableau fixe General[N].", vscode.CompletionItemKind.Method, "13"),
        createSnippetItem("Clear()", "Clear()", "liste.Clear()", "Vide tous les éléments de la collection.", vscode.CompletionItemKind.Method, "14"),
        createSnippetItem("Contains(item)", "Contains(${1:element}) : bool", "liste.Contains(element) : bool", "Vérifie si l'élément existe dans la liste.", vscode.CompletionItemKind.Method, "15"),
        createSnippetItem("Join(separator)", "Join(\"${1:, }\") : string", "liste.Join(separateur) : string", "Concatène les éléments sous forme de chaîne de caractères.", vscode.CompletionItemKind.Method, "16")
    );

    return items;
}

/**
 * Returns intelligent suggestions based on context when the user is writing code.
 */
function getContextCompletions(document, position) {
    const items = [];
    const currentLine = document.lineAt(position).text;
    const linePrefix = currentLine.substr(0, position.character);

    // 1. Scan previous symbols in the file
    const { variables, functions } = scanDocumentSymbols(document, position.line);

    // Add declared variables from the document
    for (const [varName, varInfo] of variables) {
        const varItem = new vscode.CompletionItem(varName, vscode.CompletionItemKind.Variable);
        varItem.detail = `${varName} : ${varInfo.type}`;
        varItem.documentation = new vscode.MarkdownString(
            `**Variable déclarée ligne ${varInfo.line}**\n\nType: \`${varInfo.type}\`\n\nValeur initiale : \`${varInfo.rhs || "non définie"}\``
        );
        varItem.sortText = "00_" + varName;
        items.push(varItem);
    }

    // Add declared functions from the document
    for (const [fnName, fnInfo] of functions) {
        const fnItem = new vscode.CompletionItem(fnName, vscode.CompletionItemKind.Function);
        const snippetArgs = fnInfo.params.map((p, idx) => `\${${idx + 1}:${p}}`).join(", ");
        fnItem.insertText = new vscode.SnippetString(`${fnName}(${snippetArgs})`);
        fnItem.detail = `func ${fnName}(${fnInfo.params.join(", ")})`;
        fnItem.documentation = new vscode.MarkdownString(
            `**Fonction utilisateur (ligne ${fnInfo.line})**\n\nParamètres : \`${fnInfo.params.join(", ") || "aucun"}\``
        );
        fnItem.sortText = "01_" + fnName;
        items.push(fnItem);
    }

    // 2. Control Flow & Structure Snippets
    items.push(
        createSnippetItem(
            "if then else end",
            "if ${1:condition} then\n\t${2:// code si vrai}\nelse\n\t${3:// code si faux}\nend",
            "Structure conditionnelle if / else / end",
            "Exécute le premier bloc si la condition est vraie, sinon exécute le second.",
            vscode.CompletionItemKind.Snippet,
            "10_if_else"
        ),
        createSnippetItem(
            "if then end",
            "if ${1:condition} then\n\t${2:// code}\nend",
            "Structure conditionnelle simple if / end",
            "Exécute le bloc intérieur si la condition est vérifiée.",
            vscode.CompletionItemKind.Snippet,
            "11_if"
        ),
        createSnippetItem(
            "for in end",
            "for ${1:item} in ${2:liste} then\n\t${3:// traitement de chaque element}\nend",
            "Boucle for ... in ... then ... end",
            "Itère sur chaque élément d'une liste ou tableau General.",
            vscode.CompletionItemKind.Snippet,
            "12_for"
        ),
        createSnippetItem(
            "while end",
            "while ${1:condition} then\n\t${2:// boucle}\nend",
            "Boucle tant que while ... then ... end",
            "Répète le bloc tant que la condition reste vraie.",
            vscode.CompletionItemKind.Snippet,
            "13_while"
        ),
        createSnippetItem(
            "func declaration",
            "func ${1:nomFonction}(${2:param1, param2})\n\t${3:// instructions}\n\treturn ${4:resultat}\nend",
            "Déclaration de fonction LLP",
            "Définit une fonction personnalisée réutilisable.",
            vscode.CompletionItemKind.Snippet,
            "14_func"
        )
    );

    // 3. Type Declarations & Value Instantiations
    items.push(
        createSnippetItem("General variable", "General ${1:nomVar} = \"${2:valeur}\"", "General variable scalaire", "Déclare une variable universelle dynamique.", vscode.CompletionItemKind.Snippet, "20_gen_scalar"),
        createSnippetItem("General list", "General ${1:maListe} = General{${2:element1}, ${3:element2}}", "General{} (Liste dynamique redimensionnable)", "Initialise une liste dynamique sans limite de taille.", vscode.CompletionItemKind.Snippet, "21_gen_list"),
        createSnippetItem("General fixed array", "General ${1:monTableau} = General[${2:3}]{${3:elem1}, ${4:elem2}, ${5:elem3}}", "General[N]{} (Tableau fixe limité à N)", "Initialise un tableau à mémoire fixe plafonné à N éléments.", vscode.CompletionItemKind.Snippet, "22_gen_arr"),
        createSnippetItem("string variable", "string ${1:nomTexte} = \"${2:valeur}\"", "string (Chaîne de caractères UTF-8)", "Déclare une variable typée texte.", vscode.CompletionItemKind.Snippet, "23_string"),
        createSnippetItem("int variable", "int ${1:compteur} = ${2:0}", "int (Entier 64-bit)", "Déclare une variable entière sans décimale.", vscode.CompletionItemKind.Snippet, "24_int"),
        createSnippetItem("float variable", "float ${1:prix} = ${2:0.0}", "float (Nombre à virgule flottante)", "Déclare une variable décimale haute précision.", vscode.CompletionItemKind.Snippet, "25_float"),
        createSnippetItem("bool variable", "bool ${1:estActif} = ${2|true,false|}", "bool (Booléen true / false)", "Déclare un drapeau de vérité booléen.", vscode.CompletionItemKind.Snippet, "26_bool")
    );

    // 4. Standard Services & Global Constructors
    items.push(
        createSnippetItem("App.Launch()", "App.Launch(WindowSize: ${1:250} : ${2:250})", "App.Launch (Fenêtre d'application)", "Démarre l'application interactive avec dimensions personnalisées.", vscode.CompletionItemKind.Function, "30_app_launch"),
        createSnippetItem("App.Lock()", "App.Lock()", "App.Lock (Verrouillage fenêtre)", "Verrouille la fenêtre en taille fixe (bloque le redimensionnement souris et le plein écran).", vscode.CompletionItemKind.Function, "31_app_lock"),
        createSnippetItem("print(msg)", "print(${1:message})", "print (Affichage console)", "Affiche du texte ou des variables dans la sortie standard.", vscode.CompletionItemKind.Function, "32_print"),
        createSnippetItem("input(prompt)", "input(\"${1:Entrez une valeur : }\")", "input (Saisie utilisateur)", "Demande une saisie textuelle à l'utilisateur.", vscode.CompletionItemKind.Function, "33_input"),
        createKeywordItem("PY", "Constante universelle PY (3.141592653589793)", "Constante mathématique fondamentale du langage LLP (exacte à 15 décimales)."),
        createKeywordItem("App", "Contrôleur de cycle de vie et d'application graphique", "Service système natif pour lancer (Launch), verrouiller (Lock), minimiser (Silence) et fermer (Close) l'application."),
                createKeywordItem("Session", "Gestionnaire de session chiffrée (style PHP)", "Fournit Session.Start, Session.Set, Session.Get, Session.Has, Session.Save, Session.Destroy."),
        createKeywordItem("Device", "Sécurité matérielle et identification unique infalsifiable", "Fournit Device.GetId, Device.GetToken, Device.Verify, Device.GetPlatform, Device.IsTrusted."),
        createKeywordItem("Client", "Client distant HTTP/HTTPS avec authentification matérielle", "Fournit Client.Connect, Client.Login, Client.Get, Client.Post, Client.Request."),
        createKeywordItem("Server", "Moteur de serveur backend dédié LLP", "Fournit Server.Listen, Server.Route, Server.RequireDevice, Server.GetConnectedClients."),
        createKeywordItem("CLLPDB", "Connecteur de base de données chiffrée .cllpdb", "Fournit CLLPDB.Open() pour ouvrir une base chiffrée AES-256 avec authentification par session de 2 minutes."),
        createKeywordItem("Math", "Bibliothèque mathématique LLP", "Fournit Pow, Sqrt, Round, Min, Max, Sin, Cos, Deg/Rad, Clamp, Lerp."),
        createKeywordItem("SciLlp", "Bibliothèque statistique & scientifique (équivalent SciPy)", "Fournit Mean, StdDev, Variance, MovingAverage, Normalize."),
        createKeywordItem("SymLlp", "Bibliothèque formelle & symbolique (équivalent SymPy)", "Fournit Derivative, Integral, Solve, MatrixDet."),
        createKeywordItem("ProbLlp", "Bibliothèque probabiliste & combinatoire", "Fournit Combinations, Permutations, Factorial, Poisson, Binomial."),
        createKeywordItem("UIValidator", "Validateur de formulaires et alertes d'interface", "Fournit ValidateRequired, ValidateNumber, ValidateEmail, ShowSuccess, ShowError."),
        createKeywordItem("Crypto", "Chiffrement et gestion de clé projet", "Fournit GetProjectKey, Encrypt, Decrypt, ComputeHash."),
        createKeywordItem("Instance", "Gestionnaire d'arborescence d'objets", "Fournit Instance.new(), FindFirstChild(), GetChildren().")
    );

    // 5. Visibility Header Directives (if at the top of document)
    if (position.line < 5) {
        items.push(
            createSnippetItem("visibility: All", "visibility: All\n", "Visibilité globale", "Rend tous les symboles accessibles sans restriction.", vscode.CompletionItemKind.Keyword, "00_vis_all"),
            createSnippetItem("visibility: Package", "visibility: Package\n", "Visibilité par package", "Limite l'accès aux fichiers du même sous-dossier.", vscode.CompletionItemKind.Keyword, "00_vis_pkg"),
            createSnippetItem("visibility: Parent", "visibility: Parent\n", "Visibilité parent", "Accessible uniquement par le dossier parent direct.", vscode.CompletionItemKind.Keyword, "00_vis_parent"),
            createSnippetItem("visibility: Private", "visibility: Private\n", "Visibilité privée", "Restreint l'accès aux symboles à ce seul fichier.", vscode.CompletionItemKind.Keyword, "00_vis_priv")
        );
    }

    // 6. UI Components (.illp and .illps files)
    const isUIFile = document.fileName.endsWith('.illp') || document.fileName.endsWith('.illps');
    if (isUIFile) {
        items.push(
            createSnippetItem("Background container", "Background \"${1:MainContainer}\" responsive: true {\n\t${0}\n}", "Conteneur principal", "Conteneur racine pour la page d'interface graphique.", vscode.CompletionItemKind.Class, "50_ui_bg"),
            createSnippetItem("Card panel", "Card \"${1:CardPanel}\" {\n\t${0}\n}", "Panneau carte", "Bloc visuel avec fond surélevé et bordure soignée.", vscode.CompletionItemKind.Class, "51_ui_card"),
            createSnippetItem("Row layout", "Row \"${1:ActionsRow}\" gap: 12 {\n\t${0}\n}", "Disposition horizontale", "Aligne ses composants enfants horizontalement.", vscode.CompletionItemKind.Class, "52_ui_row"),
            createSnippetItem("Grid layout", "Grid \"${1:ProductsGrid}\" columns: 3 gap: 16 {\n\t${0}\n}", "Grille dynamique", "Organise ses enfants en grille multi-colonnes responsive.", vscode.CompletionItemKind.Class, "53_ui_grid"),
            createSnippetItem("Text label", "Text \"${1:TitleText}\" content: \"${2:Mon Titre}\"", "Libellé texte", "Affiche un titre ou un paragraphe dans l'interface.", vscode.CompletionItemKind.Class, "54_ui_text"),
            createSnippetItem("TextInput field", "TextInput \"${1:UsernameInput}\" placeholder: \"${2:Entrez votre texte...}\"", "Champ de saisie", "Champ de saisie textuel interactif pour l'utilisateur.", vscode.CompletionItemKind.Class, "55_ui_input"),
            createSnippetItem("Button action", "Button \"${1:BtnSubmit}\" text: \"${2:Valider}\"", "Bouton cliquable", "Bouton déclenchant une action ou validant un formulaire.", vscode.CompletionItemKind.Class, "56_ui_btn"),
            createSnippetItem("ListButton choices", "ListButton \"${1:OptionsList}\" choices: [\"${2:Option 1}\", \"${3:Option 2}\"]", "Bouton à choix multiples", "Menu d'options sous forme de liste déroulante ou boutons groupés.", vscode.CompletionItemKind.Class, "57_ui_listbtn"),
            createSnippetItem("ItemBox dropdown", "ItemBox \"${1:CategorySelect}\" default: \"${2:Choix}\" items: [\"${3:Item 1}\", \"${4:Item 2}\"]", "Menu déroulant sélecteur", "Menu déroulant de sélection d'articles ou catégories.", vscode.CompletionItemKind.Class, "58_ui_itembox"),
            createSnippetItem("Checkbox toggle", "Checkbox \"${1:AgreeCheck}\" label: \"${2:Accepter}\" checked: ${3|true,false|}", "Case à cocher", "Case à cocher pour réglages et confirmations.", vscode.CompletionItemKind.Class, "59_ui_check"),
            createSnippetItem("ProgressBar indicator", "ProgressBar \"${1:SessionBar}\" value: ${2:50} max: 100", "Barre de progression", "Affiche l'avancement d'un chargement ou le temps restant.", vscode.CompletionItemKind.Class, "60_ui_progress"),
            createSnippetItem("Image asset", "Image \"${1:LogoImg}\" src: \"${2:assets/logo.png}\"", "Image / Illustration", "Affiche une image ou icône depuis un chemin local.", vscode.CompletionItemKind.Class, "61_ui_img")
        );
    }

    return items;
}

// Helper builders
function createSnippetItem(label, snippetText, detail, docText, kind = vscode.CompletionItemKind.Snippet, sortKey = "") {
    const item = new vscode.CompletionItem(label, kind);
    item.insertText = new vscode.SnippetString(snippetText);
    item.detail = detail;
    item.documentation = new vscode.MarkdownString(docText);
    if (sortKey) item.sortText = sortKey;
    return item;
}

function createKeywordItem(name, detail, docText) {
    const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Class);
    item.detail = detail;
    item.documentation = new vscode.MarkdownString(docText);
    item.sortText = "05_" + name;
    return item;
}

function createPropertyItem(name, detail, docText) {
    const item = new vscode.CompletionItem(name, vscode.CompletionItemKind.Property);
    item.detail = detail;
    item.documentation = new vscode.MarkdownString(docText);
    return item;
}

module.exports = {
    scanDocumentSymbols,
    getMemberCompletions,
    getContextCompletions
};
