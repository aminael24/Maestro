/** @vitest-environment jsdom */
import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest'; // Ajout de vi et afterEach
import DashboardPage from '../pages/DashboardPage';
import { BrowserRouter } from 'react-router-dom';
import { api } from '../services/api'; // Importez l'API pour la mocker
import { getMe } from '../services/authService'; // Importez getMe pour la mocker
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);

// Mock du service auth pour éviter les appels réseau réels
vi.mock('../services/authService', () => ({
  getMe: vi.fn(() => Promise.resolve({ username: 'TestUser', firstName: 'Test', lastName: 'User' })),
  logout: vi.fn()
}));

// Mock du service projet pour éviter l'erreur réseau dans le dashboard
vi.mock('../services/projectService', () => ({
  projectService: {
    getProjects: vi.fn(() => Promise.resolve([]))
  }
}));

describe('DashboardPage', () => {
  afterEach(cleanup); // Nettoie le DOM après chaque test
  it('affiche le message de bienvenue et les sections de résumé', async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    // Attendre que le contenu soit chargé et affiché
    expect(await screen.findByText(/Centre de Contrôle/i)).toBeInTheDocument();
    // Vérifie la présence d'une zone de statistiques
    expect(await screen.findByText(/SERVICES ACTIFS/i)).toBeInTheDocument();
  });
});