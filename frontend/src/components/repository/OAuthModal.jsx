import React from 'react';

const OAuthModal = ({ isOpen, onClose, onConnect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 shadow-lg border border-gray-700 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-white mb-4">Connect GitHub</h2>
        <p className="text-gray-300 mb-6">
          Connect your GitHub account to start managing repositories and syncing code.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-400 hover:text-white transition"
          >
            Cancel
          </button>
          <button
            onClick={onConnect}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
          >
            Connect with GitHub
          </button>
        </div>
      </div>
    </div>
  );
};

export default OAuthModal;