"""
Tests unitaires — generate_code()
Tous les appels Groq sont mockés : aucun crédit consommé.
"""
import pytest
from unittest.mock import MagicMock, patch
from app.schemas.request import CodeGenRequest
from app.schemas.response import CodeGenResponse


# ─── Helper ───────────────────────────────────────────────────────────────────
def _make_groq_response(content: str):
    mock = MagicMock()
    mock.choices[0].message.content = content
    return mock


# ══════════════════════════════════════════════════════════════════════════════
# Parsing — Fullstack
# ══════════════════════════════════════════════════════════════════════════════

class TestGenerateCodeFullstack:

    def test_retourne_codegen_response(self, mock_groq_client, fullstack_raw_response):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(fullstack_raw_response)
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="Gestion de produits", project_type="fullstack")
        res = generate_code(req)
        assert isinstance(res, CodeGenResponse)

    def test_parse_sql(self, mock_groq_client, fullstack_raw_response):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(fullstack_raw_response)
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="test", project_type="fullstack")
        res = generate_code(req)
        assert "CREATE TABLE" in res.sql
        assert "produits" in res.sql

    def test_parse_model(self, mock_groq_client, fullstack_raw_response):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(fullstack_raw_response)
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="test", project_type="fullstack")
        res = generate_code(req)
        assert "getAll" in res.model

    def test_parse_controller(self, mock_groq_client, fullstack_raw_response):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(fullstack_raw_response)
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="test", project_type="fullstack")
        res = generate_code(req)
        assert len(res.controller) > 0

    def test_parse_routes(self, mock_groq_client, fullstack_raw_response):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(fullstack_raw_response)
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="test", project_type="fullstack")
        res = generate_code(req)
        assert len(res.routes) > 0

    def test_parse_frontend(self, mock_groq_client, fullstack_raw_response):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(fullstack_raw_response)
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="test", project_type="fullstack")
        res = generate_code(req)
        assert "App" in res.frontend or "return" in res.frontend

    def test_parse_explication(self, mock_groq_client, fullstack_raw_response):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(fullstack_raw_response)
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="test", project_type="fullstack")
        res = generate_code(req)
        assert len(res.explanation) > 0

    def test_language_fullstack(self, mock_groq_client, fullstack_raw_response):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(fullstack_raw_response)
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="test", project_type="fullstack")
        res = generate_code(req)
        assert res.language == "javascript + react + postgresql"

    def test_description_transmise_au_prompt(self, mock_groq_client, fullstack_raw_response):
        """Vérifie que la description est bien incluse dans le message envoyé à Groq."""
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(fullstack_raw_response)
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="gestion des commandes", project_type="fullstack")
        generate_code(req)
        call_args = mock_groq_client.chat.completions.create.call_args
        messages = call_args.kwargs.get("messages") or call_args.args[0] if call_args.args else call_args.kwargs["messages"]
        user_message = next(m["content"] for m in messages if m["role"] == "user")
        assert "gestion des commandes" in user_message


# ══════════════════════════════════════════════════════════════════════════════
# Parsing — Frontend only
# ══════════════════════════════════════════════════════════════════════════════

class TestGenerateCodeFrontend:

    def test_language_frontend(self, mock_groq_client, frontend_raw_response):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(frontend_raw_response)
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="interface", project_type="frontend")
        res = generate_code(req)
        assert res.language == "react"

    def test_sql_vide_pour_frontend(self, mock_groq_client, frontend_raw_response):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(frontend_raw_response)
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="interface", project_type="frontend")
        res = generate_code(req)
        assert res.sql == ""

    def test_model_vide_pour_frontend(self, mock_groq_client, frontend_raw_response):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(frontend_raw_response)
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="interface", project_type="frontend")
        res = generate_code(req)
        assert res.model == ""

    def test_frontend_parse_correctement(self, mock_groq_client, frontend_raw_response):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(frontend_raw_response)
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="interface", project_type="frontend")
        res = generate_code(req)
        assert len(res.frontend) > 0


# ══════════════════════════════════════════════════════════════════════════════
# Parsing — Backend only
# ══════════════════════════════════════════════════════════════════════════════

class TestGenerateCodeBackend:

    def test_language_backend(self, mock_groq_client, backend_raw_response):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(backend_raw_response)
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="API", project_type="backend")
        res = generate_code(req)
        assert res.language == "node.js + postgresql"

    def test_frontend_vide_pour_backend(self, mock_groq_client, backend_raw_response):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(backend_raw_response)
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="API", project_type="backend")
        res = generate_code(req)
        assert res.frontend == ""

    def test_sql_present_pour_backend(self, mock_groq_client, backend_raw_response):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(backend_raw_response)
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="API", project_type="backend")
        res = generate_code(req)
        assert "CREATE TABLE" in res.sql


# ══════════════════════════════════════════════════════════════════════════════
# Parsing — Réponse incomplète / edge cases
# ══════════════════════════════════════════════════════════════════════════════

class TestGenerateCodeEdgeCases:

    def test_champs_optionnels_vides_si_absents(self, mock_groq_client):
        """Si Groq ne retourne pas certaines sections, les champs sont vides."""
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(
            "EXPLICATION: Pas grand chose ici."
        )
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="test incomplet", project_type="fullstack")
        res = generate_code(req)
        assert res.sql == ""
        assert res.model == ""
        assert res.controller == ""
        assert res.routes == ""
        assert res.frontend == ""

    def test_explication_vide_si_absente(self, mock_groq_client):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(
            "### SQL\n```sql\nSELECT 1;\n```"
        )
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="test", project_type="fullstack")
        res = generate_code(req)
        assert res.explanation == ""

    def test_project_type_none_traite_comme_fullstack(self, mock_groq_client, fullstack_raw_response):
        """project_type=None doit fallback sur fullstack."""
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(fullstack_raw_response)
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="test", project_type=None)
        res = generate_code(req)
        assert res.language == "javascript + react + postgresql"

    def test_erreur_groq_leve_runtime_error(self, mock_groq_client):
        mock_groq_client.chat.completions.create.side_effect = Exception("Quota dépassé")
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="test", project_type="fullstack")
        with pytest.raises(RuntimeError, match="Erreur Groq"):
            generate_code(req)

    def test_context_optionnel_inclus_dans_prompt(self, mock_groq_client, fullstack_raw_response):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(fullstack_raw_response)
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="app", project_type="fullstack", context="Multi-tenant SaaS")
        generate_code(req)
        call_args = mock_groq_client.chat.completions.create.call_args
        messages = call_args.kwargs["messages"]
        user_message = next(m["content"] for m in messages if m["role"] == "user")
        assert "Multi-tenant SaaS" in user_message

    def test_language_optionnel_inclus_dans_prompt(self, mock_groq_client, fullstack_raw_response):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(fullstack_raw_response)
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="app", project_type="fullstack", language="TypeScript")
        generate_code(req)
        call_args = mock_groq_client.chat.completions.create.call_args
        messages = call_args.kwargs["messages"]
        user_message = next(m["content"] for m in messages if m["role"] == "user")
        assert "TypeScript" in user_message

    def test_modele_groq_utilise(self, mock_groq_client, fullstack_raw_response):
        """Vérifie que le bon modèle Groq est utilisé."""
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(fullstack_raw_response)
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="test", project_type="fullstack")
        generate_code(req)
        call_kwargs = mock_groq_client.chat.completions.create.call_args.kwargs
        assert call_kwargs["model"] == "llama-3.3-70b-versatile"

    def test_temperature_correcte(self, mock_groq_client, fullstack_raw_response):
        mock_groq_client.chat.completions.create.return_value = _make_groq_response(fullstack_raw_response)
        from app.agent.code_agent import generate_code
        req = CodeGenRequest(description="test", project_type="fullstack")
        generate_code(req)
        call_kwargs = mock_groq_client.chat.completions.create.call_args.kwargs
        assert call_kwargs["temperature"] == 0.2