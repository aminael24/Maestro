/**
 * api.js
 * Service API de base utilisant axios
 * Configuration simple pour les appels HTTP
 */

import axios from 'axios';
import { getAccessToken } from '../features/auth/authStorage';

// Configuration de base
const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:5000';

// Instance axios configurée
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 secondes
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter automatiquement le token à chaque requête
api.interceptors.request.use((config) => {
  // On récupère le token depuis le stockage centralisé (mémoire ou localStorage)
  const token = getAccessToken();
                
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Fonctions utilitaires pour les appels API
export const apiUtils = {
  // Gestion basique des erreurs
  handleError: (error) => {
    if (error.response) {
      // Traduction des codes d'erreur techniques
      if (error.response.status === 404) 
        throw new Error("The Project Service is currently unavailable. Please try again later.");
      if (error.response.status === 401) 
        throw new Error("Session expired. Please log out and log in again to continue.");
        
      // Erreur de réponse du serveur
      const message = error.response.data?.message ||
                     error.response.data?.error ||
                     `Erreur ${error.response.status}: ${error.response.statusText}`;
      throw new Error(message);
    } else if (error.request) {
      // Erreur réseau
      throw new Error('Network connection error');
    } else {
      // Autre erreur
      throw new Error(error.message || 'Unknown error');
    }
  },
};