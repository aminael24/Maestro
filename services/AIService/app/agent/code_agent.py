import re
from groq import Groq
from app.core.config import settings
from app.schemas.request import CodeGenRequest, ChatRequest
from app.schemas.response import CodeGenResponse

client = Groq(api_key=settings.groq_api_key)


def generate_code(req: CodeGenRequest):
    system = """Tu es un expert développeur fullstack Node.js + React + PostgreSQL.

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

Règles STRICTES :
- PostgreSQL UNIQUEMENT comme base de données (jamais MongoDB, jamais SQLite)
- Le model utilise le package 'pg' (node-postgres) avec un pool de connexion
- Le model.js utilise TOUJOURS les variables d'environnement pour la connexion PostgreSQL :
  const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT) || 5432,
  });
- Controller appelle le model, gère les erreurs avec try/catch
- Routes utilisent express.Router()
- CORS inclus dans le backend
- Code propre, commenté, directement utilisable
- Les INSERT SQL n'utilisent JAMAIS d'apostrophes dans les valeurs
- Les noms de tables et colonnes SQL n'utilisent JAMAIS d'accents ni de caractères spéciaux (utiliser 'etudiants' au lieu de 'étudiants', 'prenom' au lieu de 'prénom', 'telephone' au lieu de 'téléphone')
- Le nom de la table dans le model.js doit être EXACTEMENT le même que dans le SQL
- Dans App.jsx, l'URL du backend utilise TOUJOURS : const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'; et utilise API_URL dans tous les appels axios/fetch
- App.jsx doit TOUJOURS utiliser une interface React moderne et professionnelle.

Règles UI STRICTES :

- Utiliser une constante styles en React
- Utiliser des cards modernes glassmorphism
- Utiliser une palette dark mode élégante
- Utiliser des gradients bleus/violets
- Utiliser flexbox ou CSS grid
- Utiliser des bordures arrondies modernes
- Utiliser box-shadow
- Utiliser des formulaires premium
- Utiliser des inputs modernes avec fond sombre
- Utiliser des boutons avec gradients et hover effects
- Utiliser spacing et padding professionnels
- Utiliser transitions fluides
- Utiliser une mise en page responsive
- Ne jamais utiliser de HTML brut simple
- Ne jamais utiliser <br />
- Toujours styliser toute l’interface
- Le résultat doit ressembler à une vraie application SaaS moderne

IMPORTANT :
Toute l’interface doit être immédiatement belle sans CSS externe."""
    user = f"Génère une application CRUD complète pour : {req.description}"
    if req.language:
        user += f"\nPréférence : {req.language}"
    if req.context:
        user += f"\nContexte supplémentaire : {req.context}"

    try:
        raw = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": system},
                {"role": "user",   "content": user}
            ],
            temperature=0.2,
            max_tokens=4000
        ).choices[0].message.content
    except Exception as e:
        raise RuntimeError(f"Erreur Groq : {str(e)}")

    print("=== RAW RESPONSE ===")
    print(raw)
    print("=== END RAW ===")

    sql_match        = re.search(r"#{1,3}\s*SQL\s*\n```(?:sql)?\n([\s\S]*?)```",                    raw, re.IGNORECASE)
    model_match      = re.search(r"#{1,3}\s*MODEL\s*\n```(?:javascript|js)?\n([\s\S]*?)```",        raw, re.IGNORECASE)
    controller_match = re.search(r"#{1,3}\s*CONTROLLER\s*\n```(?:javascript|js)?\n([\s\S]*?)```",   raw, re.IGNORECASE)
    routes_match     = re.search(r"#{1,3}\s*ROUTES\s*\n```(?:javascript|js)?\n([\s\S]*?)```",       raw, re.IGNORECASE)
    frontend_match   = re.search(r"#{1,3}\s*FRONTEND\s*\n```(?:jsx|js|react|javascript)?\n([\s\S]*?)```", raw, re.IGNORECASE)
    exp_match        = re.search(r"EXPLICATION:\s*(.+)", raw, re.DOTALL)

    return CodeGenResponse(
        sql         = sql_match.group(1).strip()        if sql_match        else "",
        model       = model_match.group(1).strip()      if model_match      else "",
        controller  = controller_match.group(1).strip() if controller_match else "",
        routes      = routes_match.group(1).strip()     if routes_match     else "",
        frontend    = frontend_match.group(1).strip()   if frontend_match   else "",
        language    = "javascript + react + postgresql",
        explanation = exp_match.group(1).strip()        if exp_match        else ""
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
Fichier cible : {target_label}"""

    user_parts = [f"Demande : {req.message}"]

    if req.selectedCode:
        user_parts.append(f"\nCode sélectionné (partie à modifier) :\n{req.selectedCode}")

    user_parts.append(f"\nContenu complet actuel de {target_label} :\n{current_content}")

    user = "\n".join(user_parts)

    try:
        raw = client.chat.completions.create(
            model="llama-3.1-8b-instant",
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

    return {
        "updatedFile":  clean,
        "selectedFile": target_file,
        "explanation":  f"✅ {target_label} modifié avec succès.",
        "message":      f"✅ {target_label} modifié avec succès."
    }