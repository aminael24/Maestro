import React, { useState } from 'react';
import { Rnd } from 'react-rnd';

const CommitModal = () => {
  const [message, setMessage] = useState('');

  return (
    <Rnd
      default={{
        x: window.innerWidth / 2 - 250,
        y: window.innerHeight / 2 - 150,
        width: 500,
        height: 300,
      }}
      minWidth={400}
      minHeight={250}
      maxWidth={800}
      maxHeight={500}
      bounds="window"
      className="z-50"
    >
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 w-full h-full flex flex-col">
        <div className="bg-gray-700 px-4 py-2 rounded-t-lg cursor-move flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Commit Changes</h2>
          <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
        </div>
        <div className="p-6 flex-1">
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
            <button className="px-4 py-2 text-gray-400 hover:text-white">
              Cancel
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
              Commit
            </button>
          </div>
        </div>
      </div>
    </Rnd>
  );
};

export default CommitModal;