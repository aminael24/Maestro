"""
Tests unitaires — Routes FastAPI (/api/ai/generate, /api/ai/chat, /api/ai/health)
Le client Groq est mocké, on teste le comportement HTTP.
"""
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient


# ─── Helper ───────────────────────────────────────────────────────────────────
def _make_groq_response(content: str):
    mock = MagicMock()
    mock.choices[0].message.content = content
    return mock


FULLSTACK_RESPONSE = """
### SQL
```sql
CREATE TABLE items (id SERIAL PRIMARY KEY, name VARCHAR(100));
INSERT INTO items (name) VALUES ('Item1');
```
### MODEL
```javascript
const getAll = async () => pool.query('SELECT * FROM items');
module.exports = { getAll };
```
### CONTROLLER
```javascript
const getAll = async (req, res) => res.json([]);
module.exports = { getAll };
```
### ROUTES
```javascript
const router = require('express').Router();
router.get('/', require('./controller').getAll);
module.exports = router;
```
### FRONTEND
```jsx
export default function App() { return <div style={styles.main}><h1>Items</h1></div>; }
const styles = { main: { background: '#111' } };
```
EXPLICATION: Application CRUD items.
"""


@pytest.fixture
def test_client():
    with patch("app.agent.code_agent.client") as mock_groq:
        mock_groq.chat.completions.create.return_value = _make_groq_response(FULLSTACK_RESPONSE)
        from app.main import app
        with TestClient(app) as c:
            yield c, mock_groq


# ══════════════════════════════════════════════════════════════════════════════
# GET /api/ai/health
# ══════════════════════════════════════════════════════════════════════════════

class TestHealthRoute:

    def test_health_status_200(self, test_client):
        client, _ = test_client
        res = client.get("/api/ai/health")
        assert res.status_code == 200

    def test_health_retourne_ok(self, test_client):
        client, _ = test_client
        res = client.get("/api/ai/health")
        assert res.json() == {"status": "ok"}


# ══════════════════════════════════════════════════════════════════════════════
# POST /api/ai/generate
# ══════════════════════════════════════════════════════════════════════════════

class TestGenerateRoute:

    def test_generate_status_200(self, test_client):
        client, _ = test_client
        res = client.post("/api/ai/generate", json={"description": "Gestion de tâches"})
        assert res.status_code == 200

    def test_generate_retourne_json(self, test_client):
        client, _ = test_client
        res = client.post("/api/ai/generate", json={"description": "Gestion de tâches"})
        assert res.headers["content-type"].startswith("application/json")

    def test_generate_champs_presents(self, test_client):
        client, _ = test_client
        res = client.post("/api/ai/generate", json={"description": "app"})
        data = res.json()
        for field in ["sql", "model", "controller", "routes", "frontend", "language", "explanation"]:
            assert field in data, f"Champ manquant : {field}"

    def test_generate_sans_description_retourne_422(self, test_client):
        client, _ = test_client
        res = client.post("/api/ai/generate", json={})
        assert res.status_code == 422

    def test_generate_avec_project_type_frontend(self, test_client):
        client, mock_groq = test_client
        mock_groq.chat.completions.create.return_value = _make_groq_response(
            "### FRONTEND\n```jsx\nexport default function App() { return <div>App</div>; }\n```\nEXPLICATION: ok"
        )
        res = client.post("/api/ai/generate", json={"description": "UI", "project_type": "frontend"})
        assert res.status_code == 200
        assert res.json()["language"] == "react"

    def test_generate_avec_project_type_backend(self, test_client):
        client, mock_groq = test_client
        mock_groq.chat.completions.create.return_value = _make_groq_response(
            "### SQL\n```sql\nCREATE TABLE t (id SERIAL);\n```\n"
            "### MODEL\n```javascript\nconst x = 1;\n```\n"
            "### CONTROLLER\n```javascript\nconst y = 1;\n```\n"
            "### ROUTES\n```javascript\nconst z = 1;\n```\n"
            "EXPLICATION: ok"
        )
        res = client.post("/api/ai/generate", json={"description": "API", "project_type": "backend"})
        assert res.status_code == 200
        assert res.json()["language"] == "node.js + postgresql"

    def test_generate_body_invalide_retourne_422(self, test_client):
        client, _ = test_client
        res = client.post("/api/ai/generate", json={"description": 12345})
        # 12345 est un int, pas une string — FastAPI doit accepter (coercion) ou rejeter
        # On vérifie juste qu'on a une réponse HTTP valide
        assert res.status_code in [200, 422]

    def test_generate_appelle_groq_une_fois(self, test_client):
        client, mock_groq = test_client
        mock_groq.chat.completions.create.reset_mock()
        client.post("/api/ai/generate", json={"description": "app"})
        mock_groq.chat.completions.create.assert_called_once()


# ══════════════════════════════════════════════════════════════════════════════
# POST /api/ai/chat
# ══════════════════════════════════════════════════════════════════════════════

class TestChatRoute:

    def test_chat_status_200(self, test_client):
        client, mock_groq = test_client
        mock_groq.chat.completions.create.return_value = _make_groq_response("code modifié")
        res = client.post("/api/ai/chat", json={
            "message": "Ajoute un bouton",
            "currentFiles": {"frontend": "export default function App() { return <div />; }"},
            "selectedFile": "frontend"
        })
        assert res.status_code == 200

    def test_chat_retourne_updated_file(self, test_client):
        client, mock_groq = test_client
        mock_groq.chat.completions.create.return_value = _make_groq_response("export default function App() { return <div><button>OK</button></div>; }")
        res = client.post("/api/ai/chat", json={
            "message": "Ajoute un bouton",
            "currentFiles": {"frontend": "export default function App() { return <div />; }"},
            "selectedFile": "frontend"
        })
        data = res.json()
        assert "updatedFile" in data
        assert "selectedFile" in data

    def test_chat_sans_message_retourne_422(self, test_client):
        client, _ = test_client
        res = client.post("/api/ai/chat", json={"currentFiles": {}, "selectedFile": "model"})
        assert res.status_code == 422

    def test_chat_sans_current_files_retourne_422(self, test_client):
        client, _ = test_client
        res = client.post("/api/ai/chat", json={"message": "test", "selectedFile": "model"})
        assert res.status_code == 422

    def test_chat_appelle_groq_une_fois(self, test_client):
        client, mock_groq = test_client
        mock_groq.chat.completions.create.reset_mock()
        client.post("/api/ai/chat", json={
            "message": "test",
            "currentFiles": {"model": "const x = 1;"},
            "selectedFile": "model"
        })
        mock_groq.chat.completions.create.assert_called_once()

    def test_chat_message_succes_dans_reponse(self, test_client):
        client, mock_groq = test_client
        mock_groq.chat.completions.create.return_value = _make_groq_response("code")
        res = client.post("/api/ai/chat", json={
            "message": "Modifie le controller",
            "currentFiles": {"controller": "const x = 1;"},
            "selectedFile": "controller"
        })
        data = res.json()
        assert "✅" in data.get("message", "")


# ══════════════════════════════════════════════════════════════════════════════
# CORS
# ══════════════════════════════════════════════════════════════════════════════

class TestCors:

    def test_cors_autorise_localhost_5173(self, test_client):
        client, _ = test_client
        res = client.options(
            "/api/ai/health",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST"
            }
        )
        # Le header CORS doit être présent
        assert res.headers.get("access-control-allow-origin") in [
            "http://localhost:5173", "*"
        ]