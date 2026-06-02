import React from 'react';
import RepoGate from '../../components/repository/RepoGate';
import RepoTopBar from '../../components/repository/RepoTopBar';
import OAuthModal from '../../components/repository/OAuthModal';
import CommitModal from '../../components/repository/CommitModal';
import BranchModal from '../../components/repository/BranchModal';
import SyncStatusIndicator from '../../components/repository/SyncStatusIndicator';

const PreviewPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 overflow-y-auto">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-white mb-8">Repository Components Preview</h1>

        <div className="space-y-12">
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">1. RepoGate</h2>
            <div className="border border-gray-700 rounded-lg overflow-hidden" style={{ height: '400px' }}>
              <RepoGate />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">2. RepoTopBar</h2>
            <div className="border border-gray-700 rounded-lg">
              <RepoTopBar />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">3. OAuthModal</h2>
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-800 relative" style={{ height: '300px' }}>
              <p className="text-gray-400 mb-4">Modal appears as a draggable/resizable window</p>
              <OAuthModal />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">4. CommitModal</h2>
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-800 relative" style={{ height: '350px' }}>
              <p className="text-gray-400 mb-4">Modal appears as a draggable/resizable window</p>
              <CommitModal />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">5. BranchModal</h2>
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-800 relative" style={{ height: '300px' }}>
              <p className="text-gray-400 mb-4">Modal appears as a draggable/resizable window</p>
              <BranchModal />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold text-white mb-4">6. SyncStatusIndicator</h2>
            <div className="border border-gray-700 rounded-lg p-4 bg-gray-800 relative" style={{ height: '200px' }}>
              <p className="text-gray-400">Status indicator appears in bottom-right</p>
              <SyncStatusIndicator />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewPage;