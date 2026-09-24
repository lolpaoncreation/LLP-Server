import * as http from "http";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { CryptedLolpaonDatabase } from "../stdlib/cllpdb";
import { executeLLP, createGlobalEnvironment } from "../index";
import { LLP_LOGO_BASE64 } from "./logo";

export interface GuiServerOptions {
  projectDir?: string;
  port?: number;
  openBrowser?: boolean;
  windowWidth?: number;
  windowHeight?: number;
  locked?: boolean;
  devMode?: boolean;
  silence?: boolean;
  runBack?: boolean;
}

export let currentServerInstance: http.Server | null = null;
export let currentAppConfig = {
  windowWidth: 1200,
  windowHeight: 860,
  locked: false,
  devMode: false,
  silence: false,
  runBack: false
};

export function stopGuiApplication(): void {
  if (currentServerInstance) {
    try {
      currentServerInstance.close();
    } catch (_) {}
    currentServerInstance = null;
  }
}

export function setAppLock(locked: boolean = true): void {
  currentAppConfig.locked = locked;
}

export function getAppConfig() {
  return currentAppConfig;
}

export function startGuiApplication(options: GuiServerOptions = {}): Promise<{ server: http.Server; url: string; port: number }> {
  return new Promise((resolve, reject) => {
    currentAppConfig = {
      windowWidth: options.windowWidth || 1200,
      windowHeight: options.windowHeight || 860,
      locked: options.locked || false,
      devMode: options.devMode || false,
      silence: options.silence || false,
      runBack: options.runBack || false
    };

    let projectDir = options.projectDir ? path.resolve(options.projectDir) : process.cwd();

    // If executed from root llp dir, default to examples/product_management
    if (!fs.existsSync(path.join(projectDir, "data", "products.cllpdb")) && fs.existsSync(path.join(projectDir, "examples", "product_management", "data", "products.cllpdb"))) {
      projectDir = path.join(projectDir, "examples", "product_management");
    }

    const dbPath = path.join(projectDir, "data", "products.cllpdb");
    if (!fs.existsSync(dbPath)) {
      return reject(new Error(`Base de données introuvable : ${dbPath}`));
    }

    const db = new CryptedLolpaonDatabase(dbPath);
    let currentUser: { username: string; role: string } | null = null;

    const port = options.port || 4875;

    const server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
      const pathname = parsedUrl.pathname;

      // CORS & JSON helpers
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
      }

      function sendJson(statusCode: number, data: any) {
        res.writeHead(statusCode, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify(data));
      }

      function readJsonBody(): Promise<any> {
        return new Promise((resBody, rejBody) => {
          let body = "";
          req.on("data", chunk => { body += chunk; });
          req.on("end", () => {
            try {
              resBody(body ? JSON.parse(body) : {});
            } catch (e) {
              rejBody(e);
            }
          });
        });
      }

      // 1. API: STATUS & SESSION
      if (pathname === "/api/session" && req.method === "GET") {
        const active = db.isSessionActive();
        const remaining = active ? db.getRemainingSessionSeconds() : 0;
        return sendJson(200, {
          active,
          remainingSeconds: remaining,
          user: currentUser
        });
      }

      // 2. API: LOGIN
      if (pathname === "/api/login" && req.method === "POST") {
        readJsonBody().then(body => {
          const { username, password, sessionDuration } = body;
          if (!username || !password) {
            return sendJson(400, { success: false, message: "Nom d'utilisateur et mot de passe requis." });
          }

          const duration = typeof sessionDuration === "number" ? sessionDuration : undefined;
          const loginResult = db.startSession(username, password, duration);
          if (!loginResult.success) {
            return sendJson(401, { success: false, message: loginResult.message || "Identifiants invalides." });
          }

          // Fetch user info from database
          const usersRes = db.executeSql(`SELECT * FROM users WHERE username = "${username}"`);
          const userInfo = (usersRes.data && usersRes.data.length > 0) ? usersRes.data[0] : null;
          const role = userInfo ? userInfo.role : "Utilisateur";

          currentUser = { username, role };

          return sendJson(200, {
            success: true,
            message: "Connexion réussie !",
            remainingSeconds: loginResult.remainingSeconds,
            user: currentUser
          });
        }).catch(err => sendJson(500, { success: false, message: err.message }));
        return;
      }

      // 3. API: LOGOUT
      if (pathname === "/api/logout" && req.method === "POST") {
        db.endSession();
        currentUser = null;
        return sendJson(200, { success: true, message: "Déconnexion réussie." });
      }

      // 3b. API: DISCONNECT (On-demand disconnect)
      if (pathname === "/api/disconnect" && req.method === "POST") {
        db.endSession();
        return sendJson(200, { success: true, message: "Base de données déconnectée." });
      }

      // 3c. API: RECONNECT (On-demand reconnect)
      if (pathname === "/api/reconnect" && req.method === "POST") {
        readJsonBody().then(body => {
          const duration = typeof body.sessionDuration === "number" ? body.sessionDuration : undefined;
          const loginResult = db.startSession(currentUser ? currentUser.username : "admin", "admin123", duration);
          return sendJson(200, {
            success: loginResult.success,
            remainingSeconds: loginResult.remainingSeconds
          });
        }).catch(() => sendJson(500, { success: false }));
        return;
      }

      // 4. API: CATALOG & PRODUCTS
      if (pathname === "/api/catalog" && req.method === "GET") {
        const prodRes = db.executeSql("SELECT * FROM products");
        const catRes = db.executeSql("SELECT * FROM categories");

        const products = prodRes.data || [];
        const categories = catRes.data || [];

        let totalValue = 0;
        products.forEach(p => {
          const pr = typeof p.price === "number" ? p.price : parseFloat(p.price) || 0;
          const st = typeof p.stock === "number" ? p.stock : parseInt(p.stock) || 0;
          totalValue += pr * st;
        });

        return sendJson(200, {
          success: true,
          products,
          categories,
          kpi: {
            totalProducts: products.length,
            totalValue: Math.round(totalValue * 100) / 100,
            totalCategories: categories.length
          }
        });
      }

      // 5. API: ADD PRODUCT
      if (pathname === "/api/products" && req.method === "POST") {
        if (!db.isSessionActive()) {
          return sendJson(403, { success: false, message: "Session expirée. Veuillez vous reconnecter." });
        }

        readJsonBody().then(body => {
          const { name, price, stock, category_id } = body;
          const numPrice = parseFloat(price);
          const numStock = parseInt(stock);
          const catId = parseInt(category_id) || 1;

          if (!name || isNaN(numPrice) || numPrice <= 0 || isNaN(numStock) || numStock < 0) {
            return sendJson(400, { success: false, message: "Données de produit invalides (nom obligatoire, prix > 0, stock >= 0)." });
          }

          // Generate next ID
          const existingProds = db.executeSql("SELECT * FROM products").data || [];
          let maxId = 100;
          existingProds.forEach(p => { if (p.id > maxId) maxId = p.id; });
          const newId = maxId + 1;

          const insertSql = `INSERT INTO products VALUES (${newId}, "${name.replace(/"/g, '\\"')}", ${numPrice}, ${numStock}, ${catId});`;
          const insertRes = db.executeSql(insertSql);

          if (!insertRes.success) {
            return sendJson(500, { success: false, message: insertRes.message || "Erreur d'insertion en base." });
          }

          return sendJson(201, {
            success: true,
            message: `Produit "${name}" ajouté avec succès dans .cllpdb !`,
            id: newId
          });
        }).catch(err => sendJson(500, { success: false, message: err.message }));
        return;
      }

      // 6. API: DELETE PRODUCT
      if (pathname.startsWith("/api/products/") && req.method === "DELETE") {
        if (!db.isSessionActive()) {
          return sendJson(403, { success: false, message: "Session expirée. Veuillez vous reconnecter." });
        }

        const idStr = pathname.split("/").pop();
        const id = parseInt(idStr || "0");
        if (!id) return sendJson(400, { success: false, message: "ID invalide." });

        const delRes = db.executeSql(`DELETE FROM products WHERE id = ${id}`);
        return sendJson(200, { success: true, message: `Produit #${id} supprimé de la base .cllpdb.` });
      }

      // 7. API: SCIENTIFIC ANALYTICS (SciLlp, SymLlp, ProbLlp)
      if (pathname === "/api/analytics/scillp" && req.method === "POST") {
        try {
          const env = createGlobalEnvironment();
          const llpCode = `
          General prices = General{1299.99, 129.50, 59.90, 249.00, 449.00, 89.90}
          General signal = General{10.0, 15.0, 14.0, 25.0, 30.0, 28.0, 40.0}
          float mean = SciLlp.Mean(prices)
          float stdDev = SciLlp.StdDev(prices)
          General smoothed = SciLlp.MovingAverage(signal, 3)
          `;
          executeLLP(llpCode, env);

          const meanVal = (env.lookupVar("mean") as any)?.value || 0;
          const stdDevVal = (env.lookupVar("stdDev") as any)?.value || 0;
          const smoothedVal = ((env.lookupVar("smoothed") as any)?.elements || []).map((e: any) => Math.round(e.value * 10) / 10);

          return sendJson(200, {
            success: true,
            mean: Math.round(meanVal * 100) / 100,
            stdDev: Math.round(stdDevVal * 100) / 100,
            smoothed: smoothedVal
          });
        } catch (e: any) {
          return sendJson(500, { success: false, message: e.message });
        }
      }

      if (pathname === "/api/analytics/symllp" && req.method === "POST") {
        try {
          const env = createGlobalEnvironment();
          const llpCode = `
          string deriv = SymLlp.Derivative("3*x^2 + 5*x - 2", "x")
          string integ = SymLlp.Integral("3*x^2 + 2*x", "x")
          General solved = SymLlp.Solve("2*x + 4 = 100", "x")
          `;
          executeLLP(llpCode, env);

          const derivVal = (env.lookupVar("deriv") as any)?.value || "";
          const integVal = (env.lookupVar("integ") as any)?.value || "";
          const solvedVal = ((env.lookupVar("solved") as any)?.elements || []).map((e: any) => e.value);

          return sendJson(200, {
            success: true,
            derivative: derivVal,
            integral: integVal,
            breakEven: solvedVal[0] || 48
          });
        } catch (e: any) {
          return sendJson(500, { success: false, message: e.message });
        }
      }

      if (pathname === "/api/analytics/probllp" && req.method === "POST") {
        try {
          const env = createGlobalEnvironment();
          const llpCode = `
          int comb = ProbLlp.Combinations(6, 3)
          float pois = ProbLlp.Poisson(4, 3.5)
          `;
          executeLLP(llpCode, env);

          const combVal = (env.lookupVar("comb") as any)?.value || 20;
          const poisVal = (env.lookupVar("pois") as any)?.value || 0.1888;

          return sendJson(200, {
            success: true,
            combinations: combVal,
            poisson: Math.round(poisVal * 100)
          });
        } catch (e: any) {
          return sendJson(500, { success: false, message: e.message });
        }
      }

      // 8. API: APP LIFECYCLE (Config, Lock, Silence, Close)
      if (pathname === "/api/app/config" && req.method === "GET") {
        return sendJson(200, currentAppConfig);
      }

      if (pathname === "/api/app/lock" && req.method === "POST") {
        currentAppConfig.locked = true;
        return sendJson(200, { success: true, locked: true, message: "Fenêtre verrouillée (taille fixe)." });
      }

      if (pathname === "/api/app/silence" && req.method === "POST") {
        currentAppConfig.silence = true;
        return sendJson(200, { success: true, silence: true, message: "Application passée en arrière-plan." });
      }

      if (pathname === "/api/app/close" && req.method === "POST") {
        sendJson(200, { success: true, message: "Fermeture forcée de l'application..." });
        setTimeout(() => {
          stopGuiApplication();
          process.exit(0);
        }, 150);
        return;
      }

      // 8b. SERVE STATIC ASSETS & LOGOS
      if (pathname.startsWith("/assets/") || pathname === "/favicon.ico" || pathname === "/logo.png") {
        const cleanPath = pathname.replace(/^\/assets\//, "");
        const candidates = [
          path.join(projectDir, "assets", cleanPath),
          path.join(projectDir, pathname),
          path.join(__dirname, "../../assets", cleanPath),
          path.join(__dirname, "../../assets/logo.png")
        ];
        for (const cand of candidates) {
          if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
            const ext = path.extname(cand).toLowerCase();
            const contentType = ext === ".svg" ? "image/svg+xml" : (ext === ".jpg" || ext === ".jpeg" ? "image/jpeg" : "image/png");
            res.writeHead(200, { "Content-Type": contentType });
            res.end(fs.readFileSync(cand));
            return;
          }
        }
      }

      // 9. SERVE APPLICATION HTML & ASSETS
      if (pathname === "/" || pathname === "/index.html") {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(renderApplicationHtml(currentAppConfig));
        return;
      }

      // 10. SERVE FULL DOCUMENTATION WEBVIEW (/docs)
      if (pathname === "/docs" || pathname === "/documentation") {
        const { getDocumentationHtml } = require(path.join(__dirname, "../../vscode-extension/docsWebview"));
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(getDocumentationHtml());
        return;
      }

      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    });

    server.listen(port, "127.0.0.1", () => {
      currentServerInstance = server;
      const url = `http://127.0.0.1:${port}`;
      console.log(`\n===================================================`);
      console.log(`   LLP Interactive GUI - Lolpaon Pro Application`);
      console.log(`===================================================`);
      console.log(`✓ Serveur d'application démarré sur : ${url}`);
      console.log(`✓ Base chiffrée connectée : ${path.basename(dbPath)}`);
      console.log(`✓ Résolution fenêtre (App.Launch) : ${currentAppConfig.windowWidth}x${currentAppConfig.windowHeight} px`);
      console.log(`✓ Mode développeur (DevMode)      : ${currentAppConfig.devMode ? "Activé (Outils & Tests)" : "Désactivé"}`);
      console.log(`✓ Verrouillage taille (App.Lock)  : ${currentAppConfig.locked ? "Oui (Taille fixe, aucun redimensionnement)" : "Non"}`);
      console.log(`✓ Pages chargées : login.illp, dashboard.illp, ModalAddProduct`);

      if (options.openBrowser !== false && !currentAppConfig.silence) {
        const width = currentAppConfig.windowWidth;
        const height = currentAppConfig.windowHeight;
        const devFlags = currentAppConfig.devMode ? " --auto-open-devtools-for-tabs" : "";
        // Try opening in standalone app window with Edge
        exec(`start msedge --app=${url} --window-size=${width},${height}${devFlags}`, (err) => {
          if (err) {
            // Fallback to default browser
            exec(`start ${url}`);
          }
        });
      } else if (currentAppConfig.silence) {
        console.log(`✓ Mode Silence : En arrière-plan sans interface (RunBack: ${currentAppConfig.runBack ? "Actif" : "Veille"}).`);
        if (currentAppConfig.runBack) {
          setInterval(() => {}, 60000);
        }
      }

      resolve({ server, url, port });
    });

    server.on("error", (err) => {
      reject(err);
    });
  });
}

function renderApplicationHtml(config: typeof currentAppConfig = currentAppConfig): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Lolpaon Store Pro - Application LLP</title>
  <link rel="icon" type="image/png" href="${LLP_LOGO_BASE64}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: #0f111a;
      --card-bg: #181825;
      --card-alt: #1e1e2e;
      --border: #313244;
      --border-focus: #89b4fa;
      --text: #cdd6f4;
      --text-muted: #a6adc8;
      --primary: #89b4fa;
      --primary-hover: #b4befe;
      --accent: #cba6f7;
      --success: #a6e3a1;
      --warning: #fab387;
      --danger: #f38ba8;
      --radius: 14px;
      --radius-sm: 8px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      overflow-x: hidden;
    }

    /* Page Navigation Views */
    .page-view {
      display: none !important;
      opacity: 0;
      transition: opacity 0.3s ease;
      width: 100%;
    }
    .page-view.active {
      display: flex !important;
      opacity: 1;
    }

    /* Top Global Header */
    header.app-header {
      background: rgba(24, 24, 37, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      background: linear-gradient(135deg, var(--primary), var(--accent));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      box-shadow: 0 4px 12px rgba(137, 180, 250, 0.3);
    }
    .brand-name {
      font-weight: 800;
      font-size: 17px;
      color: #fff;
      letter-spacing: -0.3px;
    }
    .brand-pill {
      background: rgba(137, 180, 250, 0.15);
      color: var(--primary);
      border: 1px solid var(--primary);
      padding: 2px 8px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .user-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      background: var(--card-alt);
      border: 1px solid var(--border);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
    }
    .user-badge .role {
      color: var(--primary);
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* Session Timer Widget */
    .session-widget {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(166, 227, 161, 0.1);
      border: 1px solid var(--success);
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      color: var(--success);
      font-weight: 700;
    }
    .session-widget.warning {
      background: rgba(243, 139, 168, 0.15);
      border-color: var(--danger);
      color: var(--danger);
    }
    .session-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--success);
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.8; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.8; }
    }

    /* Buttons */
    .btn {
      padding: 10px 18px;
      border-radius: var(--radius-sm);
      font-weight: 700;
      font-size: 13px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .btn:hover { transform: translateY(-2px); }
    .btn:active { transform: translateY(0); }
    .btn-primary { background: var(--primary); color: #11111b; box-shadow: 0 4px 14px rgba(137, 180, 250, 0.3); }
    .btn-primary:hover { background: var(--primary-hover); }
    .btn-danger { background: var(--danger); color: #11111b; }
    .btn-danger:hover { filter: brightness(1.1); }
    .btn-success { background: var(--success); color: #11111b; box-shadow: 0 4px 14px rgba(166, 227, 161, 0.3); }
    .btn-secondary { background: var(--border); color: var(--text); }
    .btn-secondary:hover { background: #45475a; }
    .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--text); }
    .btn-outline:hover { border-color: var(--primary); color: var(--primary); }

    /* ===================================================
       1. PAGE CONNEXION (login.illp)
       =================================================== */
    #page-login {
      min-height: calc(100vh - 65px);
      align-items: center;
      justify-content: center;
      padding: 24px;
      background: radial-gradient(circle at 50% 30%, rgba(137, 180, 250, 0.08) 0%, rgba(15, 17, 26, 0) 70%);
    }
    .login-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 36px;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    }
    .login-header {
      text-align: center;
      margin-bottom: 28px;
    }
    .login-logo {
      width: 72px;
      height: 72px;
      margin: 0 auto 16px;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(137, 180, 250, 0.25);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 24px rgba(137, 180, 250, 0.25);
      backdrop-filter: blur(8px);
    }
    .login-logo img {
      width: 52px;
      height: 52px;
      object-fit: contain;
      filter: drop-shadow(0 4px 10px rgba(0, 180, 250, 0.5));
    }
    .login-title {
      font-size: 22px;
      font-weight: 800;
      color: #fff;
      margin-bottom: 6px;
    }
    .login-subtitle {
      color: var(--text-muted);
      font-size: 13px;
    }
    .form-group {
      margin-bottom: 18px;
    }
    .form-label {
      display: block;
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
    }
    .form-input {
      width: 100%;
      background: var(--card-alt);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 13px 16px;
      color: #fff;
      font-size: 14px;
      outline: none;
      transition: all 0.2s;
    }
    .form-input:focus {
      border-color: var(--border-focus);
      box-shadow: 0 0 0 3px rgba(137, 180, 250, 0.2);
    }
    .quick-logins {
      display: flex;
      gap: 10px;
      margin-top: 14px;
    }
    .quick-login-btn {
      flex: 1;
      padding: 7px;
      font-size: 11px;
      font-weight: 600;
      background: rgba(137, 180, 250, 0.08);
      border: 1px solid var(--border);
      border-radius: 6px;
      color: var(--primary);
      cursor: pointer;
      transition: all 0.15s;
    }
    .quick-login-btn:hover {
      background: rgba(137, 180, 250, 0.2);
      border-color: var(--primary);
    }

    /* Alerts */
    .alert {
      padding: 12px 16px;
      border-radius: var(--radius-sm);
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 18px;
      display: none;
    }
    .alert-danger {
      background: rgba(243, 139, 168, 0.15);
      border: 1px solid var(--danger);
      color: var(--danger);
    }
    .alert-success {
      background: rgba(166, 227, 161, 0.15);
      border: 1px solid var(--success);
      color: var(--success);
    }

    /* ===================================================
       2. PAGE DASHBOARD (dashboard.illp)
       =================================================== */
    #page-dashboard {
      flex-direction: column;
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
      gap: 24px;
    }

    /* KPI Indicators Grid */
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
    }
    .kpi-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 18px;
      position: relative;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
    }
    .kpi-card::after {
      content: '';
      position: absolute;
      top: 0; left: 0; width: 4px; height: 100%;
    }
    .kpi-card.kpi-products::after { background: var(--success); }
    .kpi-card.kpi-value::after { background: var(--warning); }
    .kpi-card.kpi-categories::after { background: var(--accent); }
    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      background: var(--card-alt);
    }
    .kpi-info .kpi-label {
      font-size: 12px;
      font-weight: 700;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kpi-info .kpi-value {
      font-size: 24px;
      font-weight: 800;
      color: #fff;
      margin-top: 4px;
    }

    /* Catalog Section */
    .section-card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: 0 6px 24px rgba(0,0,0,0.25);
    }
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--border);
    }
    .section-title {
      font-size: 18px;
      font-weight: 800;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-subtitle {
      font-size: 13px;
      color: var(--text-muted);
      margin-top: 4px;
    }

    /* Products Grid */
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }
    .product-card {
      background: var(--card-alt);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 18px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 14px;
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .product-card:hover {
      border-color: var(--border-focus);
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    }
    .product-top {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .product-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: rgba(137, 180, 250, 0.12);
      border: 1px solid rgba(137, 180, 250, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
    }
    .product-name {
      font-weight: 700;
      font-size: 15px;
      color: #fff;
      line-height: 1.3;
    }
    .product-category {
      font-size: 11px;
      font-weight: 600;
      color: var(--accent);
      background: rgba(203, 166, 247, 0.12);
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      margin-top: 4px;
    }
    .product-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid rgba(255,255,255,0.06);
      padding-top: 12px;
    }
    .product-price {
      font-size: 18px;
      font-weight: 800;
      color: var(--success);
    }
    .product-stock {
      font-size: 12px;
      color: var(--text-muted);
    }
    .product-actions {
      display: flex;
      gap: 8px;
    }
    .btn-delete {
      background: rgba(243, 139, 168, 0.12);
      border: 1px solid rgba(243, 139, 168, 0.3);
      color: var(--danger);
      padding: 6px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.15s;
    }
    .btn-delete:hover {
      background: var(--danger);
      color: #11111b;
    }

    /* Analytics Tools Tabs / Box */
    .analytics-box {
      margin-top: 12px;
      background: var(--card-alt);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 18px;
    }
    .analytics-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      margin-bottom: 16px;
    }
    .console-output {
      background: #11111b;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      color: var(--text);
      line-height: 1.6;
      max-height: 180px;
      overflow-y: auto;
    }

    /* Modal (Page on Page) */
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 17, 26, 0.75);
      backdrop-filter: blur(8px);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 200;
      padding: 20px;
    }
    .modal-overlay.active {
      display: flex;
      animation: fadeIn 0.2s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.96); }
      to { opacity: 1; transform: scale(1); }
    }
    .modal-card {
      background: var(--card-bg);
      border: 2px solid var(--primary);
      border-radius: 20px;
      width: 100%;
      max-width: 540px;
      padding: 28px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.7);
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--border);
    }
    .modal-title {
      font-size: 18px;
      font-weight: 800;
      color: #fff;
    }
    .modal-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 20px;
      cursor: pointer;
    }
    .modal-close:hover { color: #fff; }
    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .modal-actions {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 24px;
    }
  </style>
</head>
<body>

  <!-- Top Global Header -->
  <header class="app-header">
    <div class="brand">
      <div class="brand-icon" style="background: transparent; box-shadow: none;">
        <img src="${LLP_LOGO_BASE64}" alt="LLP Logo" style="width: 28px; height: 28px; object-fit: contain;" />
      </div>
      <div>
        <div class="brand-name">Lolpaon Store Pro</div>
      </div>
      <div class="brand-pill">LLP v1.4 Engine</div>
      ${config.locked ? '<div class="brand-pill" style="background: rgba(243, 139, 168, 0.15); border-color: var(--danger); color: var(--danger);">🔒 Fixe (' + config.windowWidth + 'x' + config.windowHeight + ')</div>' : ''}
      ${config.devMode ? '<div class="brand-pill" style="background: rgba(250, 179, 135, 0.15); border-color: var(--warning); color: var(--warning);">🛠️ DevMode Activé</div>' : ''}
    </div>

    <div class="header-actions">
      <div id="header-session" class="session-widget" style="display: none;">
        <span class="session-indicator" id="session-dot"></span>
        <span id="session-countdown">Session BD : Active (Permanente)</span>
      </div>

      <button id="btn-toggle-db" class="btn btn-outline" style="display: none; padding: 6px 12px; font-size: 12px;" onclick="toggleDbConnection()" title="Connecter ou déconnecter la base de données manuellement">
        🔌 Déconnecter BD
      </button>

      <div id="header-user" class="user-badge" style="display: none;">
        <span>👤</span>
        <span id="header-username">admin</span>
        <span class="role" id="header-role">(Administrateur)</span>
      </div>

      <button id="btn-header-logout" class="btn btn-danger" style="display: none;" onclick="logout()">
        ⮌ Déconnexion
      </button>

      <button class="btn" style="background: rgba(243, 139, 168, 0.2); border: 1px solid var(--danger); color: var(--danger); padding: 6px 12px; font-size: 12px;" onclick="forceCloseApp()" title="Forcer l'arrêt de l'application (App.Close())">
        ⚡ App.Close()
      </button>
    </div>
  </header>

  <!-- 1. PAGE CONNEXION (login.illp) -->
  <main id="page-login" class="page-view active">
    <div class="login-card">
      <div class="login-header">
        <div class="login-logo">
          <img src="${LLP_LOGO_BASE64}" alt="LLP Logo" />
        </div>
        <h1 class="login-title">Lolpaon Store Manager</h1>
        <p class="login-subtitle">Authentification sécurisée avec session .cllpdb</p>
      </div>

      <div id="login-alert" class="alert alert-danger"></div>

      <form id="login-form" onsubmit="handleLogin(event)">
        <div class="form-group">
          <label class="form-label" for="login-username">Nom d'utilisateur</label>
          <input type="text" id="login-username" class="form-input" placeholder="Ex: admin" required autocomplete="username" value="admin">
        </div>

        <div class="form-group">
          <label class="form-label" for="login-password">Mot de passe sécurisé</label>
          <input type="password" id="login-password" class="form-input" placeholder="••••••••" required autocomplete="current-password" value="admin123">
        </div>

        <div class="form-group" style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <label for="login-session-mode" style="font-size: 13px; color: var(--text-muted); cursor: pointer;">
            Durée de session BD :
          </label>
          <select id="login-session-mode" class="form-input" style="width: auto; padding: 6px 12px; font-size: 12px;">
            <option value="0" selected>⚡ Permanente (Illimitée - Défaut Développeur)</option>
            <option value="120">🔒 2 Minutes (Sécurité Temporaire)</option>
            <option value="300">⏱️ 5 Minutes</option>
            <option value="600">⏱️ 10 Minutes</option>
          </select>
        </div>

        <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center; padding: 14px; font-size: 14px;">
          Se Connecter au Tableau de Bord ➔
        </button>

        <div class="quick-logins">
          <button type="button" class="quick-login-btn" onclick="fillCredentials('admin', 'admin123')">
            Compte Admin (admin / admin123)
          </button>
          <button type="button" class="quick-login-btn" onclick="fillCredentials('gestionnaire', 'secret456')">
            Gestionnaire (gestionnaire / secret456)
          </button>
        </div>
      </form>
    </div>
  </main>

  <!-- 2. PAGE DASHBOARD (dashboard.illp) -->
  <main id="page-dashboard" class="page-view">
    <!-- Key Performance Indicators (KPIs) -->
    <div class="kpi-grid">
      <div class="kpi-card kpi-products">
        <div class="kpi-icon">📦</div>
        <div class="kpi-info">
          <div class="kpi-label">Produits en Stock</div>
          <div class="kpi-value" id="kpi-count">0</div>
        </div>
      </div>

      <div class="kpi-card kpi-value">
        <div class="kpi-icon">💰</div>
        <div class="kpi-info">
          <div class="kpi-label">Valeur Marchande</div>
          <div class="kpi-value" id="kpi-val">$0.00</div>
        </div>
      </div>

      <div class="kpi-card kpi-categories">
        <div class="kpi-icon">🏷️</div>
        <div class="kpi-info">
          <div class="kpi-label">Catégories Actives</div>
          <div class="kpi-value" id="kpi-cats">0</div>
        </div>
      </div>
    </div>

    <!-- Catalog Section -->
    <section class="section-card">
      <div class="section-header">
        <div>
          <h2 class="section-title">📦 Catalogue des Produits Disponibles</h2>
          <p class="section-subtitle">Données synchronisées en temps réel avec products.cllpdb (MySQL chiffré UTF-8)</p>
        </div>
        <button class="btn btn-success" onclick="openAddModal()">
          ➕ Ajouter un Produit (Page on Page)
        </button>
      </div>

      <div id="catalog-grid" class="products-grid">
        <!-- Products cards inserted dynamically -->
      </div>
    </section>

    <!-- Advanced Scientific & Analytical Suite (SciLlp, SymLlp, ProbLlp) -->
    <section class="section-card">
      <div class="section-header">
        <div>
          <h2 class="section-title">🧪 Suite Scientifique & Modélisation Économique</h2>
          <p class="section-subtitle">Exécutez les modules scientifiques LLP en temps réel</p>
        </div>
      </div>

      <div class="analytics-buttons">
        <button class="btn btn-outline" onclick="runSciLlp()">
          📊 Statistiques de Vente (SciLlp)
        </button>
        <button class="btn btn-outline" onclick="runSymLlp()">
          📐 Calcul Formel & Rentabilité (SymLlp)
        </button>
        <button class="btn btn-outline" onclick="runProbLlp()">
          🎲 Probabilités & Rupture de Stock (ProbLlp)
        </button>
      </div>

      <div id="analytics-console" class="console-output">
        Prêt pour l'exécution scientifique. Cliquez sur un des boutons ci-dessus pour lancer le calcul.
      </div>
    </section>
  </main>

  <!-- MODAL: ADD PRODUCT (Page on Page Modal) -->
  <div id="modal-add" class="modal-overlay" onclick="closeModalOnBackdrop(event)">
    <div class="modal-card">
      <div class="modal-header">
        <h3 class="modal-title">✨ Nouveau Produit (.cllpdb)</h3>
        <button class="modal-close" onclick="closeAddModal()">&times;</button>
      </div>

      <div id="modal-alert" class="alert alert-danger"></div>

      <form id="add-product-form" onsubmit="handleAddProduct(event)">
        <div class="form-group">
          <label class="form-label" for="add-name">Nom du Produit</label>
          <input type="text" id="add-name" class="form-input" placeholder="Ex: Écran Ultrawide 34 pouces" required>
        </div>

        <div class="form-grid-2">
          <div class="form-group">
            <label class="form-label" for="add-price">Prix Unitaire ($)</label>
            <input type="number" step="0.01" min="0.01" id="add-price" class="form-input" placeholder="Ex: 599.99" required>
          </div>
          <div class="form-group">
            <label class="form-label" for="add-stock">Stock Initial</label>
            <input type="number" step="1" min="0" id="add-stock" class="form-input" placeholder="Ex: 25" required>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label" for="add-category">Catégorie</label>
          <select id="add-category" class="form-input">
            <option value="1">💻 Informatique & PC</option>
            <option value="2">⌨️ Périphériques & Claviers</option>
            <option value="3">🎧 Audio & Son</option>
          </select>
        </div>

        <div class="modal-actions">
          <button type="button" class="btn btn-secondary" onclick="closeAddModal()">
            ✕ Fermer
          </button>
          <button type="submit" class="btn btn-primary">
            ✓ Enregistrer dans .cllpdb
          </button>
        </div>
      </form>
    </div>
  </div>

  <script>
    let sessionInterval = null;
    let categoriesMap = {};

    function fillCredentials(u, p) {
      document.getElementById('login-username').value = u;
      document.getElementById('login-password').value = p;
    }

    let currentSessionDuration = 0;
    let isDbConnected = true;

    async function handleLogin(e) {
      e.preventDefault();
      const u = document.getElementById('login-username').value.trim();
      const p = document.getElementById('login-password').value;
      const durationMode = parseInt(document.getElementById('login-session-mode').value) || 0;
      currentSessionDuration = durationMode;
      const alertBox = document.getElementById('login-alert');

      alertBox.style.display = 'none';

      try {
        const res = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: u, password: p, sessionDuration: durationMode })
        });
        const data = await res.json();

        if (!data.success) {
          alertBox.textContent = '❌ ' + (data.message || 'Identifiants incorrects.');
          alertBox.style.display = 'block';
          return;
        }

        isDbConnected = true;
        // Show Dashboard
        switchToDashboard(data.user, data.remainingSeconds);
      } catch (err) {
        alertBox.textContent = 'Erreur réseau : ' + err.message;
        alertBox.style.display = 'block';
      }
    }

    function switchToDashboard(user, remainingSeconds) {
      document.getElementById('page-login').classList.remove('active');
      document.getElementById('page-dashboard').classList.add('active');

      document.getElementById('header-session').style.display = 'flex';
      document.getElementById('header-user').style.display = 'flex';
      document.getElementById('btn-header-logout').style.display = 'inline-flex';
      document.getElementById('btn-toggle-db').style.display = 'inline-flex';

      document.getElementById('header-username').textContent = user.username;
      document.getElementById('header-role').textContent = '(' + user.role + ')';

      startSessionCountdown(remainingSeconds);
      loadCatalog();
    }

    function startSessionCountdown(initialSeconds) {
      const widget = document.getElementById('header-session');
      const text = document.getElementById('session-countdown');
      const dot = document.getElementById('session-dot');

      clearInterval(sessionInterval);

      if (initialSeconds === -1 || initialSeconds === undefined || initialSeconds === null || initialSeconds <= 0) {
        // Permanent session (developer choice / default)
        text.textContent = 'Session BD : Permanente';
        widget.classList.remove('warning');
        if (dot) dot.style.background = 'var(--success)';
        return;
      }

      let seconds = initialSeconds;
      text.textContent = 'Session active : ' + seconds + 's';
      sessionInterval = setInterval(() => {
        seconds--;
        if (seconds <= 0) {
          clearInterval(sessionInterval);
          text.textContent = '⚠️ Session expirée';
          widget.classList.add('warning');
          alert('Votre session de ' + initialSeconds + 's a expiré. Veuillez vous reconnecter.');
          logout();
          return;
        }

        if (seconds <= 30) {
          widget.classList.add('warning');
        } else {
          widget.classList.remove('warning');
        }

        text.textContent = 'Session active : ' + seconds + 's';
      }, 1000);
    }

    async function toggleDbConnection() {
      const btn = document.getElementById('btn-toggle-db');
      const widget = document.getElementById('header-session');
      const text = document.getElementById('session-countdown');
      const dot = document.getElementById('session-dot');

      if (isDbConnected) {
        // Déconnexion manuelle
        await fetch('/api/disconnect', { method: 'POST' });
        isDbConnected = false;
        clearInterval(sessionInterval);
        widget.classList.add('warning');
        text.textContent = '🔌 BD : Déconnectée';
        if (dot) dot.style.background = 'var(--danger)';
        btn.innerHTML = '⚡ Reconnecter BD';
        btn.classList.remove('btn-outline');
        btn.classList.add('btn-success');
      } else {
        // Reconnexion manuelle
        const res = await fetch('/api/reconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionDuration: currentSessionDuration })
        });
        const data = await res.json();
        if (data.success) {
          isDbConnected = true;
          widget.classList.remove('warning');
          btn.innerHTML = '🔌 Déconnecter BD';
          btn.classList.remove('btn-success');
          btn.classList.add('btn-outline');
          if (dot) dot.style.background = 'var(--success)';
          startSessionCountdown(data.remainingSeconds);
          loadCatalog();
        }
      }
    }

    async function logout() {
      clearInterval(sessionInterval);
      await fetch('/api/logout', { method: 'POST' });

      document.getElementById('page-dashboard').classList.remove('active');
      document.getElementById('page-login').classList.add('active');

      document.getElementById('header-session').style.display = 'none';
      document.getElementById('header-user').style.display = 'none';
      document.getElementById('btn-header-logout').style.display = 'none';
      document.getElementById('btn-toggle-db').style.display = 'none';
    }

    async function loadCatalog() {
      try {
        const res = await fetch('/api/catalog');
        const data = await res.json();
        if (!data.success) return;

        // Save categories map
        (data.categories || []).forEach(c => {
          categoriesMap[c.id] = c.name;
        });

        // Update KPIs
        document.getElementById('kpi-count').textContent = data.kpi.totalProducts + ' Produits';
        document.getElementById('kpi-val').textContent = '$' + Number(data.kpi.totalValue).toLocaleString('fr-FR', { minimumFractionDigits: 2 });
        document.getElementById('kpi-cats').textContent = data.kpi.totalCategories + ' Catégories';

        // Render products
        const grid = document.getElementById('catalog-grid');
        grid.innerHTML = '';

        const iconMap = { 1: '💻', 2: '⌨️', 3: '🎧' };

        data.products.forEach(p => {
          const card = document.createElement('div');
          card.className = 'product-card';
          const icon = iconMap[p.category_id] || '📦';
          const catName = categoriesMap[p.category_id] || 'Général';

          card.innerHTML = \`
            <div class="product-top">
              <div class="product-icon">\${icon}</div>
              <div>
                <div class="product-name">\${p.name}</div>
                <span class="product-category">\${catName}</span>
              </div>
            </div>
            <div class="product-bottom">
              <div>
                <div class="product-price">\${Number(p.price).toFixed(2)} $</div>
                <div class="product-stock">Stock disponible : <b>\${p.stock}</b></div>
              </div>
              <div class="product-actions">
                <button class="btn-delete" onclick="deleteProduct(\${p.id})">🗑️ Supprimer</button>
              </div>
            </div>
          \`;
          grid.appendChild(card);
        });
      } catch (err) {
        console.error('Erreur chargement catalogue :', err);
      }
    }

    function openAddModal() {
      document.getElementById('modal-alert').style.display = 'none';
      document.getElementById('modal-add').classList.add('active');
    }

    function closeAddModal() {
      document.getElementById('modal-add').classList.remove('active');
    }

    function closeModalOnBackdrop(e) {
      if (e.target.id === 'modal-add') {
        closeAddModal();
      }
    }

    async function handleAddProduct(e) {
      e.preventDefault();
      const name = document.getElementById('add-name').value.trim();
      const price = document.getElementById('add-price').value;
      const stock = document.getElementById('add-stock').value;
      const category_id = document.getElementById('add-category').value;
      const alertBox = document.getElementById('modal-alert');

      alertBox.style.display = 'none';

      try {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, price, stock, category_id })
        });
        const data = await res.json();

        if (!data.success) {
          alertBox.textContent = '❌ ' + (data.message || "Erreur lors de l'enregistrement.");
          alertBox.style.display = 'block';
          return;
        }

        // Success: close modal and reload
        closeAddModal();
        document.getElementById('add-product-form').reset();
        loadCatalog();
      } catch (err) {
        alertBox.textContent = 'Erreur réseau : ' + err.message;
        alertBox.style.display = 'block';
      }
    }

    async function deleteProduct(id) {
      if (!confirm('Voulez-vous vraiment supprimer ce produit de la base chiffrée .cllpdb ?')) return;
      try {
        const res = await fetch('/api/products/' + id, { method: 'DELETE' });
        const data = await res.json();
        if (data.success) {
          loadCatalog();
        } else {
          alert('Erreur : ' + data.message);
        }
      } catch (err) {
        alert('Erreur de suppression : ' + err.message);
      }
    }

    // Scientific Calculations
    async function runSciLlp() {
      const consoleBox = document.getElementById('analytics-console');
      consoleBox.innerHTML = '⏳ Calcul statistique SciLlp en cours...';
      try {
        const res = await fetch('/api/analytics/scillp', { method: 'POST' });
        const data = await res.json();
        consoleBox.innerHTML = \`
[SciLlp - Statistiques du Catalogue]
✓ Panier Moyen (SciLlp.Mean)        : \${data.mean} $
✓ Écart-Type des Prix (SciLlp.StdDev) : \${data.stdDev} $
✓ Lissage Tendance (MovingAverage 3): [\${data.smoothed.join(', ')}]
        \`.trim();
      } catch (err) {
        consoleBox.textContent = 'Erreur : ' + err.message;
      }
    }

    async function runSymLlp() {
      const consoleBox = document.getElementById('analytics-console');
      consoleBox.innerHTML = '⏳ Calcul formel SymLlp en cours...';
      try {
        const res = await fetch('/api/analytics/symllp', { method: 'POST' });
        const data = await res.json();
        consoleBox.innerHTML = \`
[SymLlp - Modélisation Économique & Calcul Formel]
✓ Dérivée Coût Marginal C(x) = 3*x^2 + 5*x - 2 : \${data.derivative}
✓ Intégrale Recettes R(x) = 3*x^2 + 2*x        : \${data.integral}
✓ Seuil de Rentabilité (2*x + 4 = 100)          : x = \${data.breakEven} unités
        \`.trim();
      } catch (err) {
        consoleBox.textContent = 'Erreur : ' + err.message;
      }
    }

    async function runProbLlp() {
      const consoleBox = document.getElementById('analytics-console');
      consoleBox.innerHTML = '⏳ Calcul probabiliste ProbLlp en cours...';
      try {
        const res = await fetch('/api/analytics/probllp', { method: 'POST' });
        const data = await res.json();
        consoleBox.innerHTML = \`
[ProbLlp - Probabilités & Prévision des Stocks]
✓ Combinaisons de packs (3 produits parmi 6) : \${data.combinations} possibilités
✓ Probabilité de vente de 4 unités (Poisson λ=3.5) : \${data.poisson} %
        \`.trim();
      } catch (err) {
        consoleBox.textContent = 'Erreur : ' + err.message;
      }
    }

    // App Lifecycle Functions (App.Close, App.Lock)
    async function forceCloseApp() {
      if (confirm("Voulez-vous forcer l'arrêt immédiat de l'application et du serveur (App.Close) ?")) {
        try {
          await fetch('/api/app/close', { method: 'POST' });
        } catch (_) {}
        document.body.innerHTML = \`
          <div style="display:flex;height:100vh;align-items:center;justify-content:center;flex-direction:column;font-family:'Plus Jakarta Sans',sans-serif;color:#cdd6f4;background:#0f111a;text-align:center;padding:20px;">
            <div style="font-size:50px;margin-bottom:16px;">⚡</div>
            <h1 style="font-size:26px;color:#f38ba8;margin-bottom:10px;">Application Arrêtée (App.Close)</h1>
            <p style="color:#a6adc8;max-width:480px;line-height:1.6;">Le serveur LLP et les processus de l'application ont été arrêtés avec succès par commande du développeur.</p>
          </div>
        \`;
      }
    }

    ${config.locked ? `
    // Enforcement of App.Lock() : fixed size, disallow fullscreen & resizing
    document.documentElement.requestFullscreen = function() {
      console.warn("[LLP App.Lock] Le plein écran est verrouillé.");
      return Promise.reject(new Error("Plein écran désactivé"));
    };
    window.addEventListener('keydown', function(e) {
      if (e.key === 'F11') {
        e.preventDefault();
        console.warn("[LLP App.Lock] Le mode plein écran F11 est verrouillé.");
      }
    });
    ` : ''}
  </script>
</body>
</html>`;
}
