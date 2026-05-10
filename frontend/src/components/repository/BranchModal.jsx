import React, { useState } from 'react';
import { Rnd } from 'react-rnd';

const BranchModal = () => {
  const [branchName, setBranchName] = useState('');

  return (
    <Rnd
      default={{
        x: window.innerWidth / 2 - 225,
        y: window.innerHeight / 2 - 125,
        width: 450,
        height: 250,
      }}
      minWidth={350}
      minHeight={200}
      maxWidth={700}
      maxHeight={400}
      bounds="window"
      className="z-50"
    >
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 w-full h-full flex flex-col">
        <div className="bg-gray-700 px-4 py-2 rounded-t-lg cursor-move flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Create Branch</h2>
          <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
        </div>
        <div className="p-6 flex-1">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Branch Name
            </label>
            <input
              type="text"
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter branch name..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button className="px-4 py-2 text-gray-400 hover:text-white">
              Cancel
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
              Create Branch
            </button>
          </div>
        </div>
      </div>
    </Rnd>
  );
};

export default BranchModal;