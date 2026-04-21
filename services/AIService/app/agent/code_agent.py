import re
from groq import Groq
from app.core.config import settings
from app.schemas.request import CodeGenRequest
from app.schemas.response import CodeGenResponse

client = Groq(api_key=settings.groq_api_key)

def generate_code(req: CodeGenRequest) -> CodeGenResponse:
    system = """Tu es un expert développeur fullstack.
Quand on te demande de générer une application CRUD, tu génères TOUJOURS :
1. Le backend Express.js complet (routes, modèle, connexion DB)
2. Le frontend React simple (liste, formulaire ajout, suppression)

Réponds TOUJOURS dans ce format exact :

### BACKEND
```javascript
<code backend Express complet>
```

### FRONTEND
```jsx
<code frontend React complet>
```

EXPLICATION: <explication courte de ce qui a été généré>

Règles :
- Backend : Express + mongoose (MongoDB) ou express + better-sqlite3 selon le contexte
- Frontend : React avec fetch() vers le backend, pas de librairie externe
- Code propre, commenté, fonctionnel directement
- Toujours inclure les CORS dans le backend"""

    user = f"Génère une application CRUD pour : {req.description}"
    if req.language: user += f"\nPréférence : {req.language}"
    if req.context:  user += f"\nContexte supplémentaire : {req.context}"

    raw = client.chat.completions.create(
        model=settings.groq_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user}
        ],
        temperature=0.2,
        max_tokens=4096
    ).choices[0].message.content

    backend_match  = re.search(r"### BACKEND\n```(?:javascript|js)?\n([\s\S]*?)```", raw)
    frontend_match = re.search(r"### FRONTEND\n```(?:jsx|js|react)?\n([\s\S]*?)```", raw)
    exp_match      = re.search(r"EXPLICATION:\s*(.+)", raw, re.DOTALL)

    backend  = backend_match.group(1).strip()  if backend_match  else ""
    frontend = frontend_match.group(1).strip() if frontend_match else ""

    return CodeGenResponse(
        code        = f"// ===== BACKEND (Express) =====\n{backend}\n\n// ===== FRONTEND (React) =====\n{frontend}",
        language    = "javascript + react",
        explanation = exp_match.group(1).strip() if exp_match else ""
    )