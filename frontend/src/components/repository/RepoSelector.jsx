import React, { useEffect, useState } from 'react';
import { useGitHubStore } from '../../store/gitHubStore';

const RepoSelector = () => {
  const { repositories, selectedRepository, isLoading, selectRepository, fetchRepositories } = useGitHubStore();
  const [isOpen, setIsOpen] = useState(false);
  
useEffect(() => {
  fetchRepositories();
}, []);

  if (isLoading) {
    return (
      <div className="px-4 py-2 text-gray-400 text-sm">Loading repositories...</div>
    );
  }

  if (repositories.length === 0) {
    return (
      <div className="px-4 py-2 text-gray-400 text-sm">
        No repositories available yet. Create one from Actions.
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm flex items-center space-x-2 transition"
      >
        <span>{selectedRepository ? selectedRepository.name : 'Select Repository'}</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
<div className="absolute bottom-full right-0 mb-2 w-48 bg-gray-800 rounded-md shadow-lg border border-gray-700 z-[9999]">          <div className="py-1">
            {repositories.map((repo) => (
              <button
                key={repo.id}
                onClick={() => {
                  selectRepository(repo);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-4 py-3 text-sm transition ${
                  selectedRepository?.id === repo.id
                    ? 'bg-blue-700 text-white'
                    : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <div className="font-medium">{repo.name || repo.remoteUrl}</div>
                <div className="text-xs text-gray-400 line-clamp-1">{repo.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RepoSelector;
