import React, { useState } from 'react';
import { useGitHubStore } from '../../store/gitHubStore';
import RepoActionsDropdown from './RepoActionsDropdown';
import RepoSelector from './RepoSelector';
import CommitModal from './CommitModal';
import BranchModal from './BranchModal';
import CreateRepositoryModal from './CreateRepositoryModal';

const RepoTopBar = () => {
  const {
    selectedRepository,
    currentBranch,
    syncStatus,
    isLoading,
    createRepository,
    mockCommit,
    mockCreateBranch,
    mockPush,
  } = useGitHubStore();

  const [isCommitModalOpen, setIsCommitModalOpen] = useState(false);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [isCreateRepoModalOpen, setIsCreateRepoModalOpen] = useState(false);

  const handleActionSelect = async (action) => {
    switch (action) {
      case 'create':
        setIsCreateRepoModalOpen(true);
        break;
      case 'branch':
        setIsBranchModalOpen(true);
        break;
      case 'commit':
        setIsCommitModalOpen(true);
        break;
      case 'push':
        await mockPush();
        break;
      case 'sync':
        // Sync logic
        break;
      default:
        break;
    }
  };

  const handleCommit = async (message) => {
    await mockCommit(message);
    setIsCommitModalOpen(false);
  };

  const handleCreateBranch = async (branchName) => {
    await mockCreateBranch(branchName);
    setIsBranchModalOpen(false);
  };

  const handleCreateRepository = async (payload) => {
    await createRepository(payload);
    setIsCreateRepoModalOpen(false);
  };

  return (
    <>
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {!selectedRepository ? (
              <>
                <span className="text-gray-400 text-sm">Select a repository:</span>
                <RepoSelector />
              </>
            ) : (
              <>
                <div>
                  <p className="text-white font-semibold">{selectedRepository.name}</p>
                  <p className="text-gray-400 text-sm">{selectedRepository.description}</p>
                </div>
                <div className="flex items-center space-x-2 px-3 py-1 bg-gray-700 rounded-md">
                  <span className="text-gray-400 text-sm">Branch:</span>
                  <span className="text-white font-mono text-sm">{currentBranch}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {syncStatus === 'syncing' && (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      <span className="text-gray-400 text-sm">Syncing...</span>
                    </div>
                  )}
                  {syncStatus === 'success' && (
                    <span className="text-green-400 text-sm">✓ Synced</span>
                  )}
                </div>
              </>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {isLoading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            )}
            <RepoActionsDropdown onActionSelect={handleActionSelect} />
          </div>
        </div>
      </div>

      <CommitModal
        isOpen={isCommitModalOpen}
        onClose={() => setIsCommitModalOpen(false)}
        onCommit={handleCommit}
      />

      <BranchModal
        isOpen={isBranchModalOpen}
        onClose={() => setIsBranchModalOpen(false)}
        onCreateBranch={handleCreateBranch}
      />

      <CreateRepositoryModal
        isOpen={isCreateRepoModalOpen}
        onClose={() => setIsCreateRepoModalOpen(false)}
        onCreateRepository={handleCreateRepository}
      />
    </>
  );
};

export default RepoTopBar;