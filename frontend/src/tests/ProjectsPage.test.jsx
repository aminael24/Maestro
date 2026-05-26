import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import ProjectsPage from '../pages/ProjectsPage';
import { BrowserRouter } from 'react-router-dom';
import { api } from '../services/api';

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');

  return {
    ...actual,
    useOutletContext: () => ({
      searchTerm: '',
      isFormVisible: false,
      setIsFormVisible: jest.fn(),
    }),
  };
});

jest.mock('../services/api', () => ({
  api: {
    get: jest.fn(),
  },
  apiUtils: {
    handleError: jest.fn(),
  },
}));

describe('ProjectsPage', () => {
  const mockProjects = [
    {
      id: 1,
      name: 'Project Alpha',
      type: 'Frontend',
      status: 'active',
      dueDate: '2025-01-01',
    },
    {
      id: 2,
      name: 'Project Beta',
      type: 'Backend',
      status: 'active',
      dueDate: '2025-01-01',
    },
  ];

  it("charge et affiche la liste des projets depuis l'API", async () => {
    api.get.mockResolvedValue({ data: mockProjects });

    render(
      <BrowserRouter>
        <ProjectsPage />
      </BrowserRouter>
    );

    expect(await screen.findByText('Project Alpha')).toBeInTheDocument();
    expect(await screen.findByText('Project Beta')).toBeInTheDocument();

    expect(api.get).toHaveBeenCalledWith('/api/projects');
  });
});