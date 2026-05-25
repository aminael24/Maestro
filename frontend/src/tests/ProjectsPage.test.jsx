/** @vitest-environment jsdom */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ProjectsPage from '../pages/ProjectsPage';
import { BrowserRouter } from 'react-router-dom';
import { api } from '../services/api';
import * as matchers from '@testing-library/jest-dom/matchers';
expect.extend(matchers);

// On simule l'instance axios pour ne pas faire de vrai appel réseau
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useOutletContext: () => ({
      searchTerm: '',
      isFormVisible: false,
      setIsFormVisible: vi.fn(),
    }),
  };
});

vi.mock('../services/api', () => ({
  api: {
    get: vi.fn()
  },
  apiUtils: {
    handleError: vi.fn()
  }
}));

describe('ProjectsPage', () => {
  const mockProjects = [
    { id: 1, name: 'Project Alpha', type: 'Frontend', status: 'active', dueDate: '2025-01-01' },
    { id: 2, name: 'Project Beta', type: 'Backend', status: 'active', dueDate: '2025-01-01' }
  ];

  it('charge et affiche la liste des projets depuis l\'API', async () => {
    // On définit ce que l'API doit renvoyer
    api.get.mockResolvedValue({ data: mockProjects });

    render(
      <BrowserRouter>
        <ProjectsPage />
      </BrowserRouter>
    );

    // On attend que les titres des projets apparaissent à l'écran
    expect(await screen.findByText('Project Alpha')).toBeInTheDocument();
    expect(await screen.findByText('Project Beta')).toBeInTheDocument();
    
    // Vérifie que l'appel API a été fait sur la route correcte utilisée par le composant
    expect(api.get).toHaveBeenCalledWith('/api/projects');
  });
});