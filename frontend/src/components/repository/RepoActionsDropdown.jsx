import React, { useState } from 'react';

const RepoActionsDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-md flex items-center space-x-2"
      >
        <span>Actions</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg border border-gray-700 z-10">
          <div className="py-1">
            <button className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
              Create Branch
            </button>
            <button className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
              Commit
            </button>
            <button className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
              Push
            </button>
            <button className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
              Sync
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepoActionsDropdown;