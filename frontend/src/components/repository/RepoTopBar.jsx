import React, { useState } from 'react';
import { useGitHubStore } from '../../store/gitHubStore';
import { isDevMode } from '../../utils/env';
import RepoActionsDropdown from './RepoActionsDropdown';
import RepoSelector from './RepoSelector';
import CommitModal from './CommitModal';
import BranchModal from './BranchModal';
import CreateRepositoryModal from './CreateRepositoryModal';
import { useNavigate } from 'react-router-dom';

const RepoTopBar = () => {
  const navigate = useNavigate();
  const {
    selectedRepository,
    currentBranch,
    syncStatus,
    isLoading,
    error,
    createRepository,
    // real actions
    commit,
    push,
    // mock actions (dev only)
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
        // Use real push in production, mock in dev
        if (isDevMode) {
          await mockPush();
        } else {
          await push();
        }
        break;
      case 'sync':
        break;
      default:
        break;
    }
  };

  const handleCommit = async (message) => {
    if (isDevMode) {
      await mockCommit(message);
    } else {
      await commit(message);
    }
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
            {/* Show push error inline */}
            {error && (
              <span style={{ color: '#f87171', fontSize: 12, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                ⚠ {error}
              </span>
            )}
            {isLoading && (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            )}
            <RepoActionsDropdown onActionSelect={handleActionSelect} />

            {selectedRepository && (
              <button
                onClick={() => navigate('/workspace/deploy-config')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px',
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  color: '#fff', border: 'none', borderRadius: 8,
                  cursor: 'pointer', fontWeight: 600, fontSize: 13,
                }}
              >
                 Déployer
              </button>
            )}
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