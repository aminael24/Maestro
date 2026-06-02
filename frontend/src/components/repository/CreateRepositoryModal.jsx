import React, { useState } from 'react';

const CreateRepositoryModal = ({ isOpen, onClose, onCreateRepository }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    await onCreateRepository({ name, description, isPrivate });
    setName('');
    setDescription('');
    setIsPrivate(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-lg rounded-2xl bg-gray-900 border border-gray-700 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Create GitHub repository</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
            aria-label="Close"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <label className="block text-sm text-gray-300">
            Repository name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="my-new-repo"
              className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            />
          </label>

          <label className="block text-sm text-gray-300">
            Description
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional repository description"
              rows={3}
              className="mt-2 w-full rounded-xl border border-gray-700 bg-gray-950 px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
            />
          </label>

          <label className="flex items-center gap-3 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="h-4 w-4 rounded border-gray-500 bg-gray-800 text-blue-500 focus:ring-blue-500"
            />
            Create repository as private
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-blue-900"
          >
            Create repository
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRepositoryModal;
