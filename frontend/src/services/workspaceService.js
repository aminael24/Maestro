/**
 * WORKSPACE SERVICE COMPOSITION LAYER
 * Factory layer that selects appropriate implementations
 * No domain logic - only composition and configuration
 */

import { env } from '../utils/env';
import { MockWorkspaceService } from './mock';
import {
  ProjectFilesService,
  AIAgentService,
  PersistenceService
} from './domain';

// ========================================
// CONFIGURATION
// ========================================

const MODE = env.VITE_APP_MODE || 'dev';
const isDevMode = MODE === 'dev';
const isIntegratedMode = MODE === 'integrated';

// ========================================
// UNIFIED WORKSPACE SERVICE
// ========================================

/**
 * Unified workspace service that combines all domains
 */
export class WorkspaceService {
  constructor() {
    this.projectFiles = null;
    this.aiAgent = null;
    this.persistence = null;
  }

  /**
   * Initialize the service with appropriate implementations
   */
  initialize() {
    if (isDevMode) {
      const mockService = new MockWorkspaceService();
      this.projectFiles = mockService.projectFiles;
      this.aiAgent = mockService.aiAgent;
      this.persistence = mockService.persistence;
    } else if (isIntegratedMode) {
      // TODO: Import and instantiate real API service
      throw new Error('Integrated mode not implemented yet');
    } else {
      throw new Error(`Unknown mode: ${MODE}`);
    }
  }

  /**
   * Get project files service
   * @returns {ProjectFilesService}
   */
  getProjectFiles() {
    if (!this.projectFiles) {
      this.initialize();
    }
    return this.projectFiles;
  }

  /**
   * Get AI agent service
   * @returns {AIAgentService}
   */
  getAIAgent() {
    if (!this.aiAgent) {
      this.initialize();
    }
    return this.aiAgent;
  }

  /**
   * Get persistence service
   * @returns {PersistenceService}
   */
  getPersistence() {
    if (!this.persistence) {
      this.initialize();
    }
    return this.persistence;
  }
}

// ========================================
// SINGLETON INSTANCE
// ========================================

export const workspaceService = new WorkspaceService();