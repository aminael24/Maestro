import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

import Sidebar from '../components/Sidebar/Sidebar';
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

describe('Sidebar Component', () => {
  afterEach(cleanup);

  it('affiche les liens de navigation principaux', () => {
    render(
      <BrowserRouter>
        <Sidebar />
      </BrowserRouter>
    );

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

    expect(
      screen.getByRole('button', { name: /se déconnecter/i })
    ).toBeInTheDocument();
  });
});