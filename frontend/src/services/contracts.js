/**
 * WORKSPACE SERVICE CONTRACTS
 * Contract-first API definitions for workspace functionality
 */

// ========================================
// PROJECT/FILES DOMAIN
// ========================================

/**
 * @typedef {Object} FileInfo
 * @property {string} path - File path relative to project root
 * @property {string} type - 'file' or 'directory'
 * @property {number} size - File size in bytes
 * @property {string} lastModified - ISO date string
 */

/**
 * @typedef {Object} ProjectFilesResponse
 * @property {FileInfo[]} files - Array of file information
 * @property {string} projectId - Project identifier
 */

/**
 * @typedef {Object} FileContentResponse
 * @property {string} path - File path
 * @property {string} content - File content as string
 * @property {string} encoding - Content encoding (usually 'utf-8')
 * @property {number} size - File size in bytes
 */

/**
 * @typedef {Object} CreateFileRequest
 * @property {string} path - File path to create
 * @property {string} content - Initial file content
 * @property {string} [encoding='utf-8'] - Content encoding
 */

/**
 * @typedef {Object} UpdateFileRequest
 * @property {string} content - New file content
 * @property {string} [encoding='utf-8'] - Content encoding
 */

/**
 * @typedef {Object} CreateDirectoryRequest
 * @property {string} path - Directory path to create
 */

// ========================================
// AI AGENT DOMAIN
// ========================================

/**
 * @typedef {Object} ActiveFileContext
 * @property {string} path - Active file path
 * @property {string} content - Current file content
 */

/**
 * @typedef {Object} RelatedFileContext
 * @property {string} path - Related file path
 * @property {string} content - File content
 */

/**
 * @typedef {Object} AIPromptRequest
 * @property {string} sessionId - AI session identifier
 * @property {string} projectId - Project identifier
 * @property {string} message - User prompt/message
 * @property {Object} context - Context information
 * @property {ActiveFileContext} [context.activeFile] - Currently active file
 * @property {RelatedFileContext[]} [context.relatedFiles] - Related files for context
 * @property {string[]} [context.projectMap] - List of all project file paths
 */

/**
 * @typedef {Object} AIAction
 * @property {string} type - Action type: 'update_file' | 'create_file' | 'delete_file' | 'create_directory'
 * @property {string} filePath - Target file/directory path
 * @property {string} [content] - Content for create/update operations
 */

/**
 * @typedef {Object} AIPromptResponse
 * @property {string} message - AI response message
 * @property {AIAction[]} actions - Array of actions to perform
 * @property {string} [sessionId] - Session identifier for continuation
 */

// ========================================
// PERSISTENCE/SYNC DOMAIN
// ========================================

/**
 * @typedef {Object} FileChange
 * @property {string} path - File path
 * @property {string} content - Current content
 * @property {'created'|'updated'|'deleted'} changeType - Type of change
 * @property {string} timestamp - ISO timestamp of change
 */

/**
 * @typedef {Object} SyncRequest
 * @property {string} projectId - Project identifier
 * @property {FileChange[]} changes - Array of file changes to sync
 */

/**
 * @typedef {Object} SyncResponse
 * @property {boolean} success - Whether sync was successful
 * @property {string[]} syncedFiles - Paths of successfully synced files
 * @property {Object.<string, string>} errors - Map of file paths to error messages
 * @property {string} timestamp - Sync completion timestamp
 */

/**
 * @typedef {Object} SyncStatusResponse
 * @property {boolean} isOnline - Whether backend is reachable
 * @property {number} pendingChanges - Number of unsynced changes
 * @property {string} lastSync - ISO timestamp of last successful sync
 * @property {string} status - 'synced' | 'syncing' | 'error' | 'offline'
 */

// ========================================
// ERROR HANDLING
// ========================================

/**
 * @typedef {Object} APIError
 * @property {string} code - Error code
 * @property {string} message - Human-readable error message
 * @property {Object} [details] - Additional error details
 */

/**
 * @typedef {Object} APIResponse
 * @property {boolean} success - Whether the request succeeded
 * @property {Object} [data] - Response data (when success=true)
 * @property {APIError} [error] - Error information (when success=false)
 */