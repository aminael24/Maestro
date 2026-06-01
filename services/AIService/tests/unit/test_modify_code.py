"""
Tests unitaires — modify_code()
Tous les appels Groq sont mockés.
"""
import pytest
from unittest.mock import MagicMock
from app.schemas.request import ChatRequest


# ─── Helper ───────────────────────────────────────────────────────────────────
def _make_groq_response(content: str):
    mock = MagicMock()
    mock.choices[0].message.content = content
    return mock


SAMPLE_FILES = {
    "sql": "CREATE TABLE users (id SERIAL PRIMARY KEY);",
    "model": "const getAll = async () => pool.query('SELECT * FROM users');",
    "controller": "const getAll = async (req, res) => res.json([]);",
    "routes": "router.get('/', getAll);",
    "frontend": "export default function App() { return <div>App</div>; }",
}


# ══════════════════════════════════════════════════════════════════════════════
# Retour de la fonction
# ══════════════════════════════════════════════════════════════════════════════

class TestModifyCodeReturnShape:

    def test_retourne_dict(self, mock_groq_client):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response("const x = 1;")
        from app.agent.code_agent import modify_code
        req = ChatRequest(message="Ajoute une fonction", currentFiles=SAMPLE_FILES, selectedFile="model")
        res = modify_code(req)
        assert isinstance(res, dict)

    def test_cles_presentes(self, mock_groq_client):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response("code modifié")
        from app.agent.code_agent import modify_code
        req = ChatRequest(message="test", currentFiles=SAMPLE_FILES, selectedFile="controller")
        res = modify_code(req)
        assert "updatedFile" in res
        assert "selectedFile" in res
        assert "explanation" in res
        assert "message" in res

    def test_selected_file_retourne_correctement(self, mock_groq_client):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response("code")
        from app.agent.code_agent import modify_code
        req = ChatRequest(message="test", currentFiles=SAMPLE_FILES, selectedFile="routes")
        res = modify_code(req)
        assert res["selectedFile"] == "routes"

    def test_updated_file_contient_code(self, mock_groq_client):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response("const router = require('express').Router();")
        from app.agent.code_agent import modify_code
        req = ChatRequest(message="Ajoute une route DELETE", currentFiles=SAMPLE_FILES, selectedFile="routes")
        res = modify_code(req)
        assert len(res["updatedFile"]) > 0


# ══════════════════════════════════════════════════════════════════════════════
# Nettoyage des backticks markdown
# ══════════════════════════════════════════════════════════════════════════════

class TestModifyCodeCleanup:

    def test_supprime_backticks_javascript(self, mock_groq_client):
        raw = "```javascript\nconst x = 1;\n```"
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(raw)
        from app.agent.code_agent import modify_code
        req = ChatRequest(message="test", currentFiles=SAMPLE_FILES, selectedFile="model")
        res = modify_code(req)
        assert "```" not in res["updatedFile"]

    def test_supprime_backticks_jsx(self, mock_groq_client):
        raw = "```jsx\nexport default function App() { return <div />; }\n```"
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(raw)
        from app.agent.code_agent import modify_code
        req = ChatRequest(message="test", currentFiles=SAMPLE_FILES, selectedFile="frontend")
        res = modify_code(req)
        assert "```" not in res["updatedFile"]

    def test_supprime_backticks_sql(self, mock_groq_client):
        raw = "```sql\nCREATE TABLE t (id SERIAL);\n```"
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(raw)
        from app.agent.code_agent import modify_code
        req = ChatRequest(message="test", currentFiles=SAMPLE_FILES, selectedFile="sql")
        res = modify_code(req)
        assert "```" not in res["updatedFile"]

    def test_supprime_backticks_generiques(self, mock_groq_client):
        raw = "```\ndu code quelconque\n```"
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(raw)
        from app.agent.code_agent import modify_code
        req = ChatRequest(message="test", currentFiles=SAMPLE_FILES, selectedFile="controller")
        res = modify_code(req)
        assert "```" not in res["updatedFile"]


# ══════════════════════════════════════════════════════════════════════════════
# Post-processing par type de fichier
# ══════════════════════════════════════════════════════════════════════════════

class TestModifyCodePostProcessing:

    def test_frontend_passe_par_validate_jsx(self, mock_groq_client):
        """Un JSX malformé doit être corrigé pour le fichier frontend."""
        bad_jsx = "<div>style={styles.container}>"
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(bad_jsx)
        from app.agent.code_agent import modify_code
        req = ChatRequest(message="Modifie le style", currentFiles=SAMPLE_FILES, selectedFile="frontend")
        res = modify_code(req)
        # Après validate_jsx, le > mal placé doit être corrigé
        assert not res["updatedFile"].startswith("<div>style=")

    def test_sql_passe_par_sanitize(self, mock_groq_client):
        """Les doubles apostrophes SQL doivent être nettoyées."""
        bad_sql = "INSERT INTO t (nom) VALUES ('l''homme');"
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(bad_sql)
        from app.agent.code_agent import modify_code
        req = ChatRequest(message="Ajoute un INSERT", currentFiles=SAMPLE_FILES, selectedFile="sql")
        res = modify_code(req)
        assert "''" not in res["updatedFile"]

    def test_model_non_modifie_post_processing(self, mock_groq_client):
        """Le fichier model ne subit pas de post-processing JSX ou SQL."""
        code = "const getAll = async () => pool.query('SELECT * FROM users');"
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(code)
        from app.agent.code_agent import modify_code
        req = ChatRequest(message="test", currentFiles=SAMPLE_FILES, selectedFile="model")
        res = modify_code(req)
        assert res["updatedFile"].strip() == code.strip()


# ══════════════════════════════════════════════════════════════════════════════
# Messages utilisateur et fichier cible
# ══════════════════════════════════════════════════════════════════════════════

class TestModifyCodePrompt:

    def test_message_inclus_dans_prompt(self, mock_groq_client):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response("code")
        from app.agent.code_agent import modify_code
        req = ChatRequest(message="Ajoute une validation email", currentFiles=SAMPLE_FILES, selectedFile="controller")
        modify_code(req)
        call_args = mock_groq_client.chat.completions.create.call_args
        messages = call_args.kwargs["messages"]
        user_msg = next(m["content"] for m in messages if m["role"] == "user")
        assert "Ajoute une validation email" in user_msg

    def test_contenu_fichier_actuel_inclus_dans_prompt(self, mock_groq_client):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response("code")
        from app.agent.code_agent import modify_code
        req = ChatRequest(message="test", currentFiles=SAMPLE_FILES, selectedFile="model")
        modify_code(req)
        call_args = mock_groq_client.chat.completions.create.call_args
        messages = call_args.kwargs["messages"]
        user_msg = next(m["content"] for m in messages if m["role"] == "user")
        assert SAMPLE_FILES["model"] in user_msg

    def test_selected_code_inclus_si_present(self, mock_groq_client):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response("code")
        from app.agent.code_agent import modify_code
        req = ChatRequest(
            message="Optimise ça",
            currentFiles=SAMPLE_FILES,
            selectedFile="controller",
            selectedCode="const getAll = async (req, res) => res.json([]);"
        )
        modify_code(req)
        call_args = mock_groq_client.chat.completions.create.call_args
        messages = call_args.kwargs["messages"]
        user_msg = next(m["content"] for m in messages if m["role"] == "user")
        assert "const getAll = async (req, res) => res.json([]);" in user_msg

    def test_selected_code_absent_si_none(self, mock_groq_client):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response("code")
        from app.agent.code_agent import modify_code
        req = ChatRequest(message="test", currentFiles=SAMPLE_FILES, selectedFile="model", selectedCode=None)
        modify_code(req)
        call_args = mock_groq_client.chat.completions.create.call_args
        messages = call_args.kwargs["messages"]
        user_msg = next(m["content"] for m in messages if m["role"] == "user")
        assert "Code sélectionné" not in user_msg

    def test_fichier_cible_dans_system_prompt(self, mock_groq_client):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response("code")
        from app.agent.code_agent import modify_code
        req = ChatRequest(message="test", currentFiles=SAMPLE_FILES, selectedFile="frontend")
        modify_code(req)
        call_args = mock_groq_client.chat.completions.create.call_args
        messages = call_args.kwargs["messages"]
        system_msg = next(m["content"] for m in messages if m["role"] == "system")
        assert "App.jsx" in system_msg


# ══════════════════════════════════════════════════════════════════════════════
# Gestion d'erreurs
# ══════════════════════════════════════════════════════════════════════════════

class TestModifyCodeErrors:

    def test_erreur_groq_leve_runtime_error(self, mock_groq_client):
        mock_groq_client.chat.completions.create.side_effect = Exception("Rate limit")
        from app.agent.code_agent import modify_code
        req = ChatRequest(message="test", currentFiles=SAMPLE_FILES, selectedFile="model")
        with pytest.raises(RuntimeError, match="Erreur Groq"):
            modify_code(req)

    def test_selected_file_unknown_ne_plante_pas(self, mock_groq_client):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response("code")
        from app.agent.code_agent import modify_code
        req = ChatRequest(message="test", currentFiles=SAMPLE_FILES, selectedFile="fichier_inconnu")
        res = modify_code(req)
        assert res["selectedFile"] == "fichier_inconnu"

    def test_current_files_vide_ne_plante_pas(self, mock_groq_client):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response("code")
        from app.agent.code_agent import modify_code
        req = ChatRequest(message="test", currentFiles={}, selectedFile="model")
        res = modify_code(req)
        assert isinstance(res, dict)

    def test_message_succes_dans_reponse(self, mock_groq_client):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response("code")
        from app.agent.code_agent import modify_code
        req = ChatRequest(message="test", currentFiles=SAMPLE_FILES, selectedFile="routes")
        res = modify_code(req)
        assert "routes.js" in res["message"]
        assert "✅" in res["message"]