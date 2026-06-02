import re
from groq import Groq
from app.core.config import settings
from app.schemas.request import CodeGenRequest, ChatRequest
from app.schemas.response import CodeGenResponse

client = Groq(api_key=settings.groq_api_key)


def validate_jsx(code: str) -> str:
    """Corrige les balises JSX malformées les plus communes"""
    code = re.sub(
        r'<(\w+)>((?:\s*(?:style|className|onClick|onChange|onSubmit|onKeyDown|type|value|defaultValue|placeholder|key|href|src|alt|id|name|checked|disabled|ref|required|min|max|step|rows|cols|data-[a-z-]+)=(?:\{[^}]*\}|"[^"]*"))+\s*)>',
        lambda m: f'<{m.group(1)} {m.group(2).strip()}>',
        code
    )
    return code


def ensure_react_import(code: str) -> str:
    """Garantit que React et les hooks sont importés"""
    if not code:
        return code
    if "import React" not in code:
        hooks = []
        if "useState" in code:
            hooks.append("useState")
        if "useRef" in code:
            hooks.append("useRef")
        if "useEffect" in code:
            hooks.append("useEffect")
        hooks_str = ", ".join(hooks)
        if hooks_str:
            import_line = f"import React, {{ {hooks_str} }} from 'react';\n"
        else:
            import_line = "import React from 'react';\n"
        code = import_line + code
    return code


def ensure_export_default(code: str) -> str:
    """Garantit que App.jsx a bien un export default"""
    if not code:
        return code
    if "export default" not in code:
        if "function App(" in code:
            code = code.replace("function App(", "export default function App(", 1)
        elif "const App" in code:
            code = code + "\n\nexport default App;"
    return code


def sanitize_sql_inserts(sql: str) -> str:
    """Supprime les doubles apostrophes incorrectes générées par l'IA"""
    sql = sql.replace("''", "'")
    sql = sql.replace("\\'", "")
    lines = sql.split('\n')
    result = []
    for line in lines:
        if line.strip().upper().startswith(('INSERT', '(', 'VALUES')) or line.strip().startswith("'"):
            line = re.sub(r"'([^']*)'",
                         lambda m: "'" + m.group(1).replace("'", "") + "'",
                         line)
        result.append(line)
    return '\n'.join(result)


def generate_code(req: CodeGenRequest):
    project_type = (req.project_type or "fullstack").lower()

    # ─── RÈGLES COMMUNES ──────────────────────────────────────────────────────

    common_jsx_rules = """
Règles JSX STRICTES :
- Chaque balise JSX doit être syntaxiquement correcte
- Format OBLIGATOIRE : <h1>texte</h1> et JAMAIS <h1 texte</h1>
- Le texte ou contenu va TOUJOURS après le > de la balise ouvrante
- Ne JAMAIS écrire du texte entre le nom d'une balise et son >
- Chaque balise ouvrante <tag> doit immédiatement se fermer avec >
- Vérifie TOUJOURS que chaque balise est valide avant de terminer
- Ne JAMAIS laisser des attributs HTML visibles comme texte : type="submit">Créer est INTERDIT
- Si un mot contient une apostrophe, le remplacer : "d'école" → "decole"

ERREUR CRITIQUE À NE JAMAIS FAIRE :
  <div>style={styles.container}>        ← INTERDIT, le > est mal placé
  <button>onClick={fn}>Texte</button>   ← INTERDIT, le > est mal placé
  <li>key={id} style={styles.item}>     ← INTERDIT, le > est mal placé
  <h1>style={styles.title}>Titre</h1>  ← INTERDIT, le > est mal placé

FORMAT CORRECT OBLIGATOIRE :
  <div style={styles.container}>        ← CORRECT, attribut AVANT le >
  <button onClick={fn}>Texte</button>   ← CORRECT, attribut AVANT le >
  <li key={id} style={styles.item}>     ← CORRECT, attributs AVANT le >
  <h1 style={styles.title}>Titre</h1>  ← CORRECT, attribut AVANT le >

Règle mnémotechnique : les attributs vont TOUJOURS avant le premier >, jamais après.
"""

    common_ui_rules = """
Règles UI STRICTES :
- Utiliser une constante styles en React avec du CSS-in-JS
- Utiliser des cards modernes glassmorphism
- Utiliser une palette dark mode élégante
- Utiliser des gradients bleus/violets
- Utiliser flexbox ou CSS grid
- Utiliser des bordures arrondies modernes, box-shadow
- Utiliser des formulaires premium avec inputs modernes fond sombre
- Utiliser des boutons avec gradients et hover effects
- Utiliser spacing et padding professionnels, transitions fluides
- Mise en page responsive
- Ne jamais utiliser de HTML brut simple, jamais <br />
- Ne JAMAIS écrire {styles.nomDuStyle} comme enfant d'une balise
- Les styles s'appliquent TOUJOURS avec style={styles.nomDuStyle} comme attribut
- Exemple CORRECT : <div style={styles.container}>contenu</div>
- Exemple INTERDIT : <div>{styles.container}</div>
- Le résultat doit ressembler à une vraie application SaaS moderne
- Toute l'interface doit être immédiatement belle sans CSS externe.
"""

    common_backend_rules = """
Règles STRICTES backend :
- PostgreSQL UNIQUEMENT (jamais MongoDB, jamais SQLite)
- Le model utilise le package 'pg' avec un pool de connexion via variables d'environnement :
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5432,
  });
- Controller appelle le model, gère les erreurs avec try/catch
- Routes utilisent express.Router(), CORS inclus
- Les INSERT SQL n'utilisent JAMAIS d'apostrophes dans les valeurs texte
- Pour les données d'exemple dans les INSERT, utiliser UNIQUEMENT des mots simples SANS apostrophe
- Exemples INTERDITS : d'aventure, l'homme → utiliser : aventure, homme
- Les noms de tables et colonnes SQL n'utilisent JAMAIS d'accents ni de caractères spéciaux
- Le nom de la table dans le model.js doit être EXACTEMENT le même que dans le SQL
"""

    # ─── SYSTEM PROMPT SELON LE TYPE ──────────────────────────────────────────

    if project_type == "frontend":
        system = f"""Tu es un expert développeur frontend React spécialisé en UI/UX moderne.

Quand on te demande de générer une interface frontend, tu génères UNIQUEMENT :

### FRONTEND
```jsx
<App.jsx : landing page React complète, moderne, interactive et visuellement impressionnante>
```

EXPLICATION: <explication courte>

STRUCTURE OBLIGATOIRE DE L'APP (dans cet ordre) :
1. NAVBAR : logo + nom de l'app + liens de navigation avec smooth scroll
2. HERO SECTION : grand titre accrocheur (gros, bold, gradient text), sous-titre descriptif, bouton CTA avec gradient, statistiques ou badges visuels animés
3. FEATURES SECTION : 3 ou 4 cards avec icônes emoji, titre et description, hover effects avec transform
4. SECTION PRINCIPALE INTERACTIVE : formulaire pour ajouter des données + liste/tableau des données ajoutées avec animations d'apparition
5. SECTION STATS ou TÉMOIGNAGES : chiffres clés animés ou cards de témoignages fictifs
6. FOOTER : copyright, liens et nom de l'app

Règles STRICTES :
- TOUJOURS commencer par : import React, {{ useState, useRef }} from 'react';
- Puis : export default function App() {{
- AUCUN appel API, AUCUN axios, AUCUN fetch
- Toutes les données gérées uniquement avec useState
- Utiliser useRef pour le smooth scroll entre sections
- Le titre hero doit être directement lié à la description du projet demandé
- Les features doivent être pertinentes par rapport au projet demandé
- Ne générer AUCUN code SQL, backend, model, controller ou routes
- Ne JAMAIS importer de fichiers CSS externes : INTERDIT import './App.css', import './index.css'
- Tout le styling se fait UNIQUEMENT avec CSS-in-JS via la constante styles et style={{}}
- Le bouton CTA du hero doit TOUJOURS scroller vers la section formulaire en utilisant formRef.current?.scrollIntoView avec behavior smooth
- Ne JAMAIS appeler une fonction d'ajout directement depuis le bouton CTA du hero
- Le formulaire d'ajout doit avoir un bouton submit séparé avec validation complète
- Chaque bouton doit avoir un texte visible et une action claire
- WebkitTextFillColor: 'transparent' ne doit JAMAIS être appliqué sur une section entière, uniquement sur le h1 hero
- Pour les boutons : color: '#fff', WebkitTextFillColor: '#fff' TOUJOURS explicitement défini

Pour une landing page riche et détaillée :
- Hero : titre principal 3rem + sous-titre descriptif long (2-3 phrases) + 3 badges de stats
- Features : 4 cards minimum avec emoji icône + titre + description de 2 lignes minimum
- Chaque section doit avoir un titre de section stylisé et un sous-titre descriptif
- Les cards doivent avoir des icônes emoji grandes (2rem) en haut
- Témoignages : 3 cards avec nom fictif, rôle et citation
- La page doit être longue et scrollable avec beaucoup de contenu

Interactivité OBLIGATOIRE :
- Formulaire complet avec validation (champs requis) et feedback visuel
- Liste des éléments ajoutés avec boutons Modifier et Supprimer
- Compteur en temps réel dans la navbar ou hero
- Hover effects sur toutes les cards et boutons
- Messages de confirmation après ajout ou suppression (toast stylisé)
- Filtres ou recherche sur la liste si pertinent

Règles UI OBLIGATOIRES :
- Fond global : background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #0f3460 100%)'
- Le container global : minHeight: '100vh', overflowY: 'auto'
- Glassmorphism sur toutes les cards : background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)'
- Gradient text sur le titre hero : background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontSize: '3rem', fontWeight: '800'
- Boutons CTA : background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', color: '#fff', padding: '14px 28px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600'
- Inputs : background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', color: '#fff', borderRadius: '10px', padding: '12px 16px', width: '100%'
- Couleurs texte : titres #ffffff, sous-titres #94a3b8, accents #3b82f6 et #8b5cf6
- Spacing généreux : padding minimum 60px pour les sections, gap: '30px' entre éléments
- Border radius : 16px pour les cards, 10px pour les inputs et boutons
- Box shadow coloré : boxShadow: '0 8px 32px rgba(59,130,246,0.15)'
- Hover effects sur les cards : transform: 'translateY(-5px)', transition: 'all 0.3s ease'
- Toast notification stylisée en position fixe en bas à droite après chaque action
- Le résultat DOIT ressembler à une vraie startup SaaS moderne comme Linear ou Notion
{common_jsx_rules}"""

    elif project_type == "backend":
        system = f"""Tu es un expert développeur backend Node.js + PostgreSQL.

Quand on te demande de générer un backend, tu génères UNIQUEMENT ces 4 éléments dans cet ordre :

### SQL
```sql
<script PostgreSQL : CREATE TABLE avec tous les champs, contraintes, et quelques INSERT exemple>
```

### MODEL
```javascript
<model.js : connexion PostgreSQL avec pg, requêtes SQL (getAll, getById, create, update, delete)>
```

### CONTROLLER
```javascript
<controller.js : fonctions async/await qui appellent le model et renvoient les réponses HTTP>
```

### ROUTES
```javascript
<routes.js : Express Router avec GET/, GET/:id, POST/, PUT/:id, DELETE/:id liés au controller>
```

EXPLICATION: <explication courte>

- Ne générer AUCUN code frontend ou React
{common_backend_rules}"""

    else:  # fullstack
        system = f"""Tu es un expert développeur fullstack Node.js + React + PostgreSQL.

Quand on te demande de générer une application CRUD, tu génères TOUJOURS ces 5 éléments dans cet ordre exact :

### SQL
```sql
<script PostgreSQL : CREATE TABLE avec tous les champs, contraintes, et quelques INSERT exemple>
```

### MODEL
```javascript
<model.js : connexion PostgreSQL avec pg, requêtes SQL (getAll, getById, create, update, delete)>
```

### CONTROLLER
```javascript
<controller.js : fonctions async/await qui appellent le model et renvoient les réponses HTTP>
```

### ROUTES
```javascript
<routes.js : Express Router avec GET/, GET/:id, POST/, PUT/:id, DELETE/:id liés au controller>
```

### FRONTEND
```jsx
<App.jsx : composant React complet avec liste, formulaire ajout/modification, suppression, appels API vers backend>
```

EXPLICATION: <explication courte de ce qui a été généré>

- TOUJOURS commencer App.jsx par : import React, {{ useState }} from 'react';
- Puis : export default function App() {{
- Dans App.jsx : const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
{common_backend_rules}
{common_jsx_rules}
{common_ui_rules}"""

    # ─── USER MESSAGE ─────────────────────────────────────────────────────────

    user = f"Génère une application CRUD complète pour : {req.description}"
    if req.language:
        user += f"\nPréférence : {req.language}"
    if req.context:
        user += f"\nContexte supplémentaire : {req.context}"

    # ─── APPEL API ────────────────────────────────────────────────────────────

    try:
        raw = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system},
                {"role": "user",   "content": user}
            ],
            temperature=0.2,
            max_tokens=6000 if project_type == "frontend" else 4000
        ).choices[0].message.content
    except Exception as e:
        raise RuntimeError(f"Erreur Groq : {str(e)}")

    print("=== RAW RESPONSE ===")
    print(raw)
    print("=== END RAW ===")

    # ─── PARSING ──────────────────────────────────────────────────────────────

    sql_match        = re.search(r"#{1,3}\s*SQL\s*\n```(?:sql)?\n([\s\S]*?)```",                          raw, re.IGNORECASE)
    model_match      = re.search(r"#{1,3}\s*MODEL\s*\n```(?:javascript|js)?\n([\s\S]*?)```",              raw, re.IGNORECASE)
    controller_match = re.search(r"#{1,3}\s*CONTROLLER\s*\n```(?:javascript|js)?\n([\s\S]*?)```",         raw, re.IGNORECASE)
    routes_match     = re.search(r"#{1,3}\s*ROUTES\s*\n```(?:javascript|js)?\n([\s\S]*?)```",             raw, re.IGNORECASE)
    frontend_match   = re.search(r"#{1,3}\s*FRONTEND\s*\n```(?:jsx|js|react|javascript)?\n([\s\S]*?)```", raw, re.IGNORECASE)
    exp_match        = re.search(r"EXPLICATION:\s*(.+)", raw, re.DOTALL)

    sql_code      = sanitize_sql_inserts(sql_match.group(1).strip()) if sql_match      else ""
    frontend_code = validate_jsx(frontend_match.group(1).strip())    if frontend_match else ""
    # ✅ FIX : garantit que React est importé et export default présent
    frontend_code = ensure_react_import(frontend_code)
    frontend_code = ensure_export_default(frontend_code)

    return CodeGenResponse(
        sql         = sql_code,
        model       = model_match.group(1).strip()      if model_match      else "",
        controller  = controller_match.group(1).strip() if controller_match else "",
        routes      = routes_match.group(1).strip()     if routes_match     else "",
        frontend    = frontend_code,
        language    = "react" if project_type == "frontend"
                      else ("node.js + postgresql" if project_type == "backend"
                      else "javascript + react + postgresql"),
        explanation = exp_match.group(1).strip() if exp_match else ""
    )


def modify_code(req: ChatRequest) -> dict:
    file_labels = {
        "sql":        "schema.sql",
        "model":      "model.js",
        "controller": "controller.js",
        "routes":     "routes.js",
        "frontend":   "App.jsx",
    }

    target_file     = req.selectedFile or "unknown"
    target_label    = file_labels.get(target_file, target_file)
    current_content = req.currentFiles.get(target_file, "") if req.currentFiles else ""

    system = f"""Tu es un expert développeur fullstack Node.js + React + PostgreSQL.
On te donne le contenu actuel d'un fichier et une demande de modification.
Tu dois retourner UNIQUEMENT le fichier modifié, sans explication ni markdown, juste le code brut.
Fichier cible : {target_label}
Si le fichier cible est App.jsx, assure-toi que tout le JSX est syntaxiquement correct.
TOUJOURS commencer App.jsx par : import React, {{ useState, useRef }} from 'react';
Puis : export default function App() {{
Format OBLIGATOIRE pour les balises : <h1>texte</h1> et JAMAIS <h1 texte</h1>.
Ne JAMAIS laisser des attributs HTML visibles comme texte brut dans le rendu.

ERREUR CRITIQUE À NE JAMAIS FAIRE :
  <div>style={{styles.container}}>   ← INTERDIT
  <button>onClick={{fn}}>Texte</button>  ← INTERDIT

FORMAT CORRECT OBLIGATOIRE :
  <div style={{styles.container}}>   ← CORRECT
  <button onClick={{fn}}>Texte</button>  ← CORRECT"""

    user_parts = [f"Demande : {req.message}"]

    if req.selectedCode:
        user_parts.append(f"\nCode sélectionné (partie à modifier) :\n{req.selectedCode}")

    user_parts.append(f"\nContenu complet actuel de {target_label} :\n{current_content}")

    user = "\n".join(user_parts)

    try:
        raw = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system},
                {"role": "user",   "content": user}
            ],
            temperature=0.2,
            max_tokens=4000
        ).choices[0].message.content
    except Exception as e:
        raise RuntimeError(f"Erreur Groq : {str(e)}")

    clean = re.sub(r"```(?:sql|javascript|jsx|js|react)?\n?", "", raw)
    clean = re.sub(r"```", "", clean).strip()

    if target_file == "frontend":
        clean = validate_jsx(clean)
        clean = ensure_react_import(clean)
        clean = ensure_export_default(clean)

    if target_file == "sql":
        clean = sanitize_sql_inserts(clean)

    return {
        "updatedFile":  clean,
        "selectedFile": target_file,
        "explanation":  f"✅ {target_label} modifié avec succès.",
        "message":      f"✅ {target_label} modifié avec succès."
    }