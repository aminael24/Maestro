import { useState } from 'react';
import aiService from '../services/aiService';
import { useAiStore } from '../store/useAiStore';

export const useAiAssistant = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const setProjectCode = useAiStore((state) => state.setProjectCode);
  const updateFile     = useAiStore((state) => state.updateFile);

  /**
   * Génère un projet complet depuis une description
   */
  const generateNewProject = async (description) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await aiService.generateCode(description);
      setProjectCode(data);
      return data;
    } catch (err) {
      setError("Échec de la génération. Vérifiez la connexion au backend.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Modifie un fichier existant via le chat
   * @param {string} message       - La demande de l'utilisateur
   * @param {object} currentFiles  - Tous les fichiers actuels du store
   * @param {string} selectedCode  - Le snippet sélectionné (peut être null)
   * @param {string} selectedFile  - La clé du fichier ciblé (peut être null)
   */
  const askModification = async (message, currentFiles, selectedCode, selectedFile) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await aiService.chatWithAi(
        message,
        currentFiles,
        selectedCode,
        selectedFile
      );

      // Cas 1 : le backend renvoie uniquement le fichier modifié
      if (response?.updatedFile && selectedFile) {
        updateFile(selectedFile, response.updatedFile);
      }
      // Cas 2 : le backend renvoie tous les fichiers mis à jour
      else if (response?.updatedData) {
        setProjectCode(response.updatedData);
      }

      return response;
    } catch (err) {
      setError("L'assistant n'a pas pu répondre.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    generateNewProject,
    askModification,
    isLoading,
    error,
  };
};