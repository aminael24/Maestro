import React from 'react';
import RepoActionsDropdown from './RepoActionsDropdown';

const RepoTopBar = () => {
  return (
    <div className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-white font-medium">my-repo</span>
          <span className="text-gray-400">•</span>
          <span className="text-blue-400">main</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-gray-400 text-sm">Synced</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-400">Provider:</span>
          <span className="text-purple-400">GitHub</span>
        </div>
      </div>
      <RepoActionsDropdown />
    </div>
  );
};

export default RepoTopBar;