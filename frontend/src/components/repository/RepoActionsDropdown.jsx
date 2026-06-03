import React, { useState } from 'react';

const RepoActionsDropdown = ({ onActionSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleActionClick = (action) => {
    if (onActionSelect) {
      onActionSelect(action);
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          console.log("ACTIONS BUTTON CLICKED");
          setIsOpen(!isOpen);
        }}
      className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm flex items-center space-x-2 transition"
      
      >
        <span>Actions</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
<div   className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-md text-sm flex items-center space-x-2 transition"
      >        <div className="py-1">
            <button
              onClick={() => handleActionClick('create')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition"
            >
              Create Repository
            </button>
            <button
              onClick={() => handleActionClick('branch')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition"
            >
              Create Branch
            </button>
            <button
              onClick={() => handleActionClick('commit')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition"
            >
              Commit
            </button>
            <button
              onClick={() => handleActionClick('push')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition"
            >
              Push
            </button>
            <button
              onClick={() => handleActionClick('sync')}
              className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition"
            >
              Sync
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RepoActionsDropdown;