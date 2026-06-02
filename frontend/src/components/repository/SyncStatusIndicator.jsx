import React from 'react';

const SyncStatusIndicator = () => {
  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 rounded-lg p-3 shadow-lg border border-gray-700 flex items-center space-x-3">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-white text-sm font-medium">Synced</span>
      </div>
      <div className="text-gray-400 text-xs">
        Last sync: 2 minutes ago
      </div>
    </div>
  );
};

export default SyncStatusIndicator;