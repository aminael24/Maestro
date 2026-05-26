import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

import DashboardPage from '../pages/DashboardPage';
import { BrowserRouter } from 'react-router-dom';

jest.mock('../services/authService', () => ({
  getMe: jest.fn(() =>
    Promise.resolve({
      username: 'TestUser',
      firstName: 'Test',
      lastName: 'User',
    })
  ),
  logout: jest.fn(),
}));

jest.mock('../services/projectService', () => ({
  projectService: {
    getProjects: jest.fn(() => Promise.resolve([])),
  },
}));

describe('DashboardPage', () => {
  afterEach(cleanup);

  it('affiche le message de bienvenue et la section Projets actifs', async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>
    );

    expect(await screen.findByText(/Bon retour/i)).toBeInTheDocument();
    const matches = await screen.findAllByText(/Projets actifs/i);
    expect(matches.length).toBeGreaterThan(0);
  });
});