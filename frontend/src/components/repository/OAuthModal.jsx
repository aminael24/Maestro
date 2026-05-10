import React from 'react';
import { Rnd } from 'react-rnd';

const OAuthModal = () => {
  return (
    <Rnd
      default={{
        x: window.innerWidth / 2 - 200,
        y: window.innerHeight / 2 - 125,
        width: 400,
        height: 250,
      }}
      minWidth={300}
      minHeight={200}
      maxWidth={800}
      maxHeight={400}
      bounds="window"
      className="z-50"
    >
      <div className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 w-full h-full flex flex-col">
        <div className="bg-gray-700 px-4 py-2 rounded-t-lg cursor-move flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">GitHub Authorization</h2>
          <div className="w-4 h-4 bg-gray-600 rounded-full"></div>
        </div>
        <div className="p-6 flex flex-col items-center justify-center flex-1">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-400 mb-6 text-center">
            Redirecting to GitHub for authentication...
          </p>
          <button className="text-blue-400 hover:text-blue-300 text-sm">
            Cancel
          </button>
        </div>
      </div>
    </Rnd>
  );
};

export default OAuthModal;