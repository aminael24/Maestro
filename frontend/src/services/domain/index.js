/**
 * DOMAIN INTERFACES
 * Clean, domain-separated interfaces for workspace functionality
 * Implementation-agnostic - can be backed by mock or real API
 */

// ========================================
// PROJECT/FILES DOMAIN INTERFACE
// ========================================

/**
 * Project and Files service interface
 */
export class ProjectFilesService {
  /**
   * Load all files for a project
   * @param {string} projectId - Project identifier
   * @returns {Promise<ProjectFilesResponse>} Project files information
   */
  async loadProjectFiles(projectId) {
    throw new Error('loadProjectFiles not implemented');
  }

  /**
   * Get content of a specific file
   * @param {string} projectId - Project identifier
   * @param {string} filePath - File path relative to project root
   * @returns {Promise<FileContentResponse>} File content
   */
  async getFileContent(projectId, filePath) {
    throw new Error('getFileContent not implemented');
  }

  /**
   * Create a new file
   * @param {string} projectId - Project identifier
   * @param {CreateFileRequest} request - File creation request
   * @returns {Promise<FileContentResponse>} Created file information
   */
  async createFile(projectId, request) {
    throw new Error('createFile not implemented');
  }

  /**
   * Update an existing file
   * @param {string} projectId - Project identifier
   * @param {string} filePath - File path to update
   * @param {UpdateFileRequest} request - File update request
   * @returns {Promise<FileContentResponse>} Updated file information
   */
  async updateFile(projectId, filePath, request) {
    throw new Error('updateFile not implemented');
  }

  /**
   * Delete a file
   * @param {string} projectId - Project identifier
   * @param {string} filePath - File path to delete
   * @returns {Promise<{success: boolean, path: string}>} Deletion result
   */
  async deleteFile(projectId, filePath) {
    throw new Error('deleteFile not implemented');
  }

  /**
   * Create a new directory
   * @param {string} projectId - Project identifier
   * @param {CreateDirectoryRequest} request - Directory creation request
   * @returns {Promise<{success: boolean, path: string}>} Creation result
   */
  async createDirectory(projectId, request) {
    throw new Error('createDirectory not implemented');
  }
}

// ========================================
// AI AGENT DOMAIN INTERFACE
// ========================================

/**
 * AI Agent service interface
 */
export class AIAgentService {
  /**
   * Send a prompt to the AI agent
   * @param {AIPromptRequest} request - AI prompt request
   * @returns {Promise<AIPromptResponse>} AI response with actions
   */
  async sendPrompt(request) {
    throw new Error('sendPrompt not implemented');
  }
}

// ========================================
// PERSISTENCE/SYNC DOMAIN INTERFACE
// ========================================

/**
 * Persistence and Sync service interface
 */
export class PersistenceService {
  /**
   * Sync file changes to backend
   * @param {SyncRequest} request - Sync request with changes
   * @returns {Promise<SyncResponse>} Sync result
   */
  async syncChanges(request) {
    throw new Error('syncChanges not implemented');
  }

  /**
   * Get current sync status
   * @param {string} projectId - Project identifier
   * @returns {Promise<SyncStatusResponse>} Sync status
   */
  async getSyncStatus(projectId) {
    throw new Error('getSyncStatus not implemented');
  }
}