/**
 * MOCK PERSISTENCE SERVICE
 * Mock implementation of PersistenceService for development mode
 */

import { PersistenceService } from '../domain';
import { MOCK_FILES } from './mockData';

// ========================================
// MOCK PERSISTENCE SERVICE
// ========================================

export class MockPersistenceService extends PersistenceService {
  constructor() {
    super();
    this.lastSync = new Date().toISOString();
    this.pendingChanges = 0;
  }

  async syncChanges(request) {
    await new Promise(resolve => setTimeout(resolve, 500));

    const { changes } = request;
    const syncedFiles = [];
    const errors = {};

    // Simulate sync process
    for (const change of changes) {
      try {
        // Mock sync delay per file
        await new Promise(resolve => setTimeout(resolve, 100));

        if (change.changeType === 'deleted' && !MOCK_FILES[change.path]) {
          errors[change.path] = 'File not found for deletion';
        } else {
          syncedFiles.push(change.path);
        }
      } catch (error) {
        errors[change.path] = error.message;
      }
    }

    this.lastSync = new Date().toISOString();
    this.pendingChanges = 0;

    return {
      success: Object.keys(errors).length === 0,
      syncedFiles,
      errors,
      timestamp: this.lastSync
    };
  }

  async getSyncStatus(projectId) {
    return {
      isOnline: true,
      pendingChanges: this.pendingChanges,
      lastSync: this.lastSync,
      status: 'synced'
    };
  }
}