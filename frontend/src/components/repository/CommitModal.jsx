import React, { useState } from 'react';

const CommitModal = ({ isOpen, onClose, onCommit }) => {
  const [message, setMessage] = useState('');

  const handleCommit = () => {
    if (message.trim()) {
      onCommit(message);
      setMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 max-w-md w-full mx-4">
        <div className="bg-gray-700 px-4 py-2 rounded-t-lg flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Commit Changes</h2>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Commit Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Enter your commit message..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCommit}
              disabled={!message.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-md transition"
            >
              Commit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommitModal;