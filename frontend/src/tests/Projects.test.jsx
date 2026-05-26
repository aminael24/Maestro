/** @jest-environment jsdom */
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
// describe / it / expect / afterEach sont globaux en Jest (pas besoin d'import).
import { ProjectCard } from '../components/Projects/ProjectCard';
import { BrowserRouter } from 'react-router-dom';


/**
 * Task 5 — Test Affichage
 * Vérifie que la carte projet affiche les informations techniques
 */
describe('ProjectCard Component', () => {
  afterEach(cleanup);

  const mockProject = {
    id: 1,
    name: 'Maestro Dashboard',
    description: 'Interface de pilotage',
    dueDate: '2026-05-20',
    type: 'Fullstack'
  };

  it('affiche correctement le nom et le type du projet', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} onDelete={() => {}} />
      </BrowserRouter>
    );

    expect(screen.getByText('Maestro Dashboard')).toBeDefined();
    expect(screen.getByText('Fullstack')).toBeDefined();
    // Vérifie le formatage de la date FR
   expect(screen.getByText(/20 mai 2026/)).toBeDefined();
  });

  it('ouvre la modale de confirmation lors du clic sur supprimer', () => {
    render(
      <BrowserRouter>
        <ProjectCard project={mockProject} onDelete={() => {}} />
      </BrowserRouter>
    );

    const deleteBtn = screen.getByTitle('Supprimer');
    fireEvent.click(deleteBtn);

    // Vérifie que le titre de la modale de confirmation apparaît via le Portal
    expect(screen.getByText(/Supprimer le projet/i)).toBeDefined();
    // On utilise getAllByText car le nom est présent dans la carte ET dans la modale
    expect(screen.getAllByText(new RegExp(mockProject.name, 'i')).length).toBeGreaterThan(1);
  });
});