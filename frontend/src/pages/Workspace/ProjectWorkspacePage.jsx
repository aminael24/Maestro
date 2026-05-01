import React from "react";
import { useParams } from "react-router-dom";

const ProjectWorkspacePage = () => {
  const { projectId } = useParams();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Espace de Travail</h1>
      <p className="mt-4 text-gray-600">Projet ID : <span className="font-mono text-blue-600 font-bold">{projectId}</span></p>
      <p className="text-gray-400 italic mt-2">L'éditeur de code et l'agent IA seront bientôt intégrés ici.</p>
    </div>
  );
};

export default ProjectWorkspacePage;
