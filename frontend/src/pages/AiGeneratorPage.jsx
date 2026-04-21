import { useState } from "react";
import { Sparkles, RotateCw } from "lucide-react";
import { ResultSection } from "../components/AiGenerator";
import { generateCode, parseCode } from "../services/aiService";
import "./AiGeneratorPage.css";

export default function AiGeneratorPage() {
  const [description, setDescription] = useState("");
  const [language, setLanguage] = useState("Express + React");
  const [context, setContext] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const handleGenerate = async () => {
    if (!description.trim()) {
      setError("Veuillez saisir une description.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const data = await generateCode({
        description,
        language,
        context: context || undefined,
      });
      const { backend, frontend } = parseCode(data.code);
      setResult({
        backend,
        frontend,
        explanation: data.explanation,
        language: data.language,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-page">
      {/* Fond décoratif */}
      <div className="ai-page__bg" />

      {/* Header de la page */}
      <header className="ai-page__header">
        <h1 className="ai-page__title">
          AI Code <em>Generator</em>
        </h1>
        <p className="ai-page__subtitle">
          Décrivez votre application CRUD — l'agent génère le backend Express et
          le frontend React.
        </p>
      </header>

      {/* Formulaire */}
      <div className="ai-page__form">
        {/* Description */}
        <div className="ai-form__group">
          <label className="ai-form__label">Description de l'application</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="ex : gestion des étudiants avec nom, email et filière..."
            className="ai-form__textarea"
          />
        </div>

        {/* Stack + Contexte */}
        <div className="ai-form__row">
          <div className="ai-form__group">
            <label className="ai-form__label">Stack</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="ai-form__select"
            >
              <option>Express + React</option>
              <option>Express + Vue</option>
              <option>Express + HTML</option>
            </select>
          </div>
          <div className="ai-form__group">
            <label className="ai-form__label">Contexte</label>
            <input
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="ex : MongoDB, PostgreSQL..."
              className="ai-form__input"
            />
          </div>
        </div>

        {/* Barre de chargement */}
        {loading && (
          <div className="ai-form__loading-bar">
            <div className="ai-form__loading-progress" />
          </div>
        )}

        {/* Bouton générer */}
        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`ai-form__btn ${loading ? "ai-form__btn--loading" : ""}`}
        >
          {loading ? (
            <>
              <RotateCw size={16} className="spin" /> Génération en cours...
            </>
          ) : (
            <>
              <Sparkles size={16} /> Générer le code
            </>
          )}
        </button>
      </div>

      {/* Erreur */}
      {error && <div className="ai-page__error">{error}</div>}

      {/* Résultat */}
      {result && <ResultSection {...result} />}
    </div>
  );
}
