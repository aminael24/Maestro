import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api/ai";

const aiService = {
  /**
   * Génère un projet CRUD complet depuis une description
   */
  // APRÈS
  generateCode: async (
    description,
    language = "Express + React",
    context = "PostgreSQL",
    projectType = "fullstack",
  ) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/generate`, {
        description,
        language,
        context,
        project_type: projectType,
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'appel au service IA:", error);
      throw error;
    }
  },

  /**
   * Modifie un fichier existant via le chat
   * @param {string} message        - La demande de l'utilisateur
   * @param {object} currentFiles   - Tous les fichiers actuels du store
   * @param {string} selectedCode   - Le snippet sélectionné (peut être null)
   * @param {string} selectedFile   - La clé du fichier ciblé (peut être null)
   */
  chatWithAi: async (
    message,
    currentFiles,
    selectedCode = null,
    selectedFile = null,
  ) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/chat`, {
        message,
        currentFiles,
        selectedCode,
        selectedFile,
      });
      return response.data;
    } catch (error) {
      console.error("Erreur lors du chat avec l'IA:", error);
      throw error;
    }
  },
};

export default aiService;
