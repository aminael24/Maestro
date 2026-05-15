import React, { useState } from 'react';
import { useGitHubStore } from '../../store/gitHubStore';
import OAuthModal from './OAuthModal';

const RepoGate = () => {
  const { isConnected, connect, fetchRepositories } = useGitHubStore();
  const [isOAuthModalOpen, setIsOAuthModalOpen] = useState(!isConnected);

  const handleOAuthConnect = async () => {
    const authUrl = await connect();
    if (authUrl) {
      window.location.href = authUrl;
      return;
    }

    setIsOAuthModalOpen(false);
    await fetchRepositories();
  };

  if (isConnected) {
    return null;
  }

  return (
    <>
      <OAuthModal
        isOpen={isOAuthModalOpen}
        onClose={() => {
          // For now, don't allow closing without connecting
        }}
        onConnect={handleOAuthConnect}
      />
    </>
  );
};

export default RepoGate;