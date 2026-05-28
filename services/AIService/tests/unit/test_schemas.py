"""
Tests unitaires — Schémas Pydantic (request.py & response.py)
Aucun mock nécessaire, on teste la validation des données.
"""
import pytest
from pydantic import ValidationError
from app.schemas.request import CodeGenRequest, ChatRequest
from app.schemas.response import CodeGenResponse


# ══════════════════════════════════════════════════════════════════════════════
# CodeGenRequest
# ══════════════════════════════════════════════════════════════════════════════

class TestCodeGenRequest:

    # ─── Champs obligatoires ──────────────────────────────────────────────────

    def test_description_obligatoire(self):
        with pytest.raises(ValidationError):
            CodeGenRequest()

    def test_description_seule_suffit(self):
        req = CodeGenRequest(description="Gestion de produits")
        assert req.description == "Gestion de produits"

    # ─── Valeurs par défaut ───────────────────────────────────────────────────

    def test_project_type_defaut_fullstack(self):
        req = CodeGenRequest(description="test")
        assert req.project_type == "fullstack"

    def test_language_defaut_none(self):
        req = CodeGenRequest(description="test")
        assert req.language is None

    def test_context_defaut_none(self):
        req = CodeGenRequest(description="test")
        assert req.context is None

    # ─── Valeurs acceptées ────────────────────────────────────────────────────

    def test_project_type_frontend(self):
        req = CodeGenRequest(description="test", project_type="frontend")
        assert req.project_type == "frontend"

    def test_project_type_backend(self):
        req = CodeGenRequest(description="test", project_type="backend")
        assert req.project_type == "backend"

    def test_project_type_fullstack_explicite(self):
        req = CodeGenRequest(description="test", project_type="fullstack")
        assert req.project_type == "fullstack"

    def test_language_optionnel(self):
        req = CodeGenRequest(description="test", language="TypeScript")
        assert req.language == "TypeScript"

    def test_context_optionnel(self):
        req = CodeGenRequest(description="test", context="SaaS multi-tenant")
        assert req.context == "SaaS multi-tenant"

    def test_tous_champs_renseignes(self):
        req = CodeGenRequest(
            description="Gestion des commandes",
            language="TypeScript",
            context="E-commerce B2B",
            project_type="fullstack"
        )
        assert req.description == "Gestion des commandes"
        assert req.language == "TypeScript"
        assert req.context == "E-commerce B2B"
        assert req.project_type == "fullstack"

    def test_project_type_none_accepte(self):
        req = CodeGenRequest(description="test", project_type=None)
        assert req.project_type is None


# ══════════════════════════════════════════════════════════════════════════════
# ChatRequest
# ══════════════════════════════════════════════════════════════════════════════

class TestChatRequest:

    # ─── Champs obligatoires ──────────────────────────────────────────────────

    def test_message_obligatoire(self):
        with pytest.raises(ValidationError):
            ChatRequest(currentFiles={})

    def test_current_files_obligatoire(self):
        with pytest.raises(ValidationError):
            ChatRequest(message="test")

    def test_champs_minimaux(self):
        req = ChatRequest(message="Modifie le style", currentFiles={})
        assert req.message == "Modifie le style"
        assert req.currentFiles == {}

    # ─── Valeurs par défaut ───────────────────────────────────────────────────

    def test_selected_code_defaut_none(self):
        req = ChatRequest(message="test", currentFiles={})
        assert req.selectedCode is None

    def test_selected_file_defaut_none(self):
        req = ChatRequest(message="test", currentFiles={})
        assert req.selectedFile is None

    # ─── Valeurs acceptées ────────────────────────────────────────────────────

    def test_current_files_avec_contenu(self):
        files = {"frontend": "export default function App() {}", "model": "const x = 1;"}
        req = ChatRequest(message="test", currentFiles=files)
        assert req.currentFiles["frontend"] == "export default function App() {}"

    def test_selected_code_optionnel(self):
        req = ChatRequest(message="test", currentFiles={}, selectedCode="const x = 1;")
        assert req.selectedCode == "const x = 1;"

    def test_selected_file_optionnel(self):
        req = ChatRequest(message="test", currentFiles={}, selectedFile="controller")
        assert req.selectedFile == "controller"

    def test_tous_champs(self):
        req = ChatRequest(
            message="Ajoute une validation",
            currentFiles={"model": "code ici"},
            selectedCode="ligne sélectionnée",
            selectedFile="model"
        )
        assert req.message == "Ajoute une validation"
        assert req.selectedFile == "model"
        assert req.selectedCode == "ligne sélectionnée"


# ══════════════════════════════════════════════════════════════════════════════
# CodeGenResponse
# ══════════════════════════════════════════════════════════════════════════════

class TestCodeGenResponse:

    # ─── Champs obligatoires ──────────────────────────────────────────────────

    def test_language_obligatoire(self):
        with pytest.raises(ValidationError):
            CodeGenResponse(explanation="test")

    def test_explanation_obligatoire(self):
        with pytest.raises(ValidationError):
            CodeGenResponse(language="react")

    def test_champs_minimaux(self):
        res = CodeGenResponse(language="react", explanation="Explication ici")
        assert res.language == "react"
        assert res.explanation == "Explication ici"

    # ─── Valeurs par défaut ───────────────────────────────────────────────────

    def test_sql_defaut_chaine_vide(self):
        res = CodeGenResponse(language="react", explanation="ok")
        assert res.sql == ""

    def test_model_defaut_chaine_vide(self):
        res = CodeGenResponse(language="react", explanation="ok")
        assert res.model == ""

    def test_controller_defaut_chaine_vide(self):
        res = CodeGenResponse(language="react", explanation="ok")
        assert res.controller == ""

    def test_routes_defaut_chaine_vide(self):
        res = CodeGenResponse(language="react", explanation="ok")
        assert res.routes == ""

    def test_frontend_defaut_chaine_vide(self):
        res = CodeGenResponse(language="react", explanation="ok")
        assert res.frontend == ""

    # ─── Valeurs acceptées ────────────────────────────────────────────────────

    def test_tous_champs_renseignes(self):
        res = CodeGenResponse(
            sql="CREATE TABLE t (id SERIAL);",
            model="const getAll = async () => {};",
            controller="const getAll = async (req, res) => res.json([]);",
            routes="router.get('/', getAll);",
            frontend="export default function App() { return <div />; }",
            language="javascript + react + postgresql",
            explanation="Application CRUD complète."
        )
        assert "CREATE TABLE" in res.sql
        assert res.language == "javascript + react + postgresql"

    def test_champs_optionnels_acceptent_none(self):
        res = CodeGenResponse(
            sql=None,
            model=None,
            controller=None,
            routes=None,
            frontend=None,
            language="react",
            explanation="ok"
        )
        # None est accepté (Optional), la valeur sera None ou ""
        assert res.language == "react"