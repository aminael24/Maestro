/** @vitest-environment jsdom */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest'; // Ajout de afterEach
import Sidebar from '../components/Sidebar/Sidebar';
import { cleanup } from '@testing-library/react'; // cleanup est déjà importé, mais on s'assure que afterEach l'est aussi
import { BrowserRouter } from 'react-router-dom';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);

// Mock du service auth car la Sidebar utilise getMe() pour afficher l'utilisateur
vi.mock('../services/authService', () => ({
  getMe: vi.fn(() => Promise.resolve({ username: 'TestUser', firstName: 'Test', lastName: 'User' })),
  logout: vi.fn()
}));

describe('Sidebar Component', () => {
  afterEach(cleanup); // Nettoie le DOM après chaque test

  it('affiche les liens de navigation principaux', async () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );

    // Vérifie la présence des menus clés
    expect(screen.getByText(/Tableau de bord/i)).toBeInTheDocument();
    expect(screen.getByText(/Projets/i)).toBeInTheDocument();
    expect(screen.getByText(/AI Generator/i)).toBeInTheDocument();
  });

  it('contient un bouton de déconnexion', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );

    // On cherche l'icône ou le bouton de logout (souvent un titre ou une aria-label)
    expect(screen.getByRole('button', { name: /se déconnecter/i })).toBeInTheDocument();
  });
});