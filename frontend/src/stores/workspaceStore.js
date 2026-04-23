import { create } from 'zustand';
import { workspaceService } from '../services/workspaceService';

// Debounce utility for auto-save
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const useWorkspaceStore = create((set, get) => ({
  // Current project context
  projectId: null,

  // Current file state
  selectedFile: null,
  fileContent: '',
  files: {}, // Cache of loaded files: { path: content }

  // AI interaction state
  pendingActions: [], // Array of actions from AI
  isApplyingActions: false,
  aiSessionId: null,

  // Sync state
  isOnline: true,
  pendingChanges: 0,
  lastSync: new Date().toISOString(),
  syncStatus: 'synced', // 'synced' | 'syncing' | 'error' | 'offline'

  // Change tracking
  unsyncedChanges: new Map(), // Map<path, change>

  // ========================================
  // INITIALIZATION
  // ========================================

  initializeProject: (projectId) => {
    set({ projectId });
    get().loadProjectFiles();
    get().loadSyncStatus();
  },

  // ========================================
  // FILE OPERATIONS
  // ========================================

  loadProjectFiles: async () => {
    const { projectId } = get();
    if (!projectId) return;

    try {
      const response = await workspaceService.getProjectFiles().loadProjectFiles(projectId);
      // Files are loaded on-demand, not pre-cached
      console.log('Project files loaded:', response.files.length);
    } catch (error) {
      console.error('Failed to load project files:', error);
    }
  },

  selectFile: async (filePath) => {
    set({ selectedFile: filePath });

    // Check if file is already cached
    const { files, projectId } = get();
    if (files[filePath]) {
      set({ fileContent: files[filePath] });
      return;
    }

    // Load file content from service
    try {
      const response = await workspaceService.getProjectFiles().getFileContent(projectId, filePath);
      set(state => ({
        fileContent: response.content,
        files: { ...state.files, [filePath]: response.content }
      }));
    } catch (error) {
      console.error('Failed to load file:', error);
      const errorContent = `// Error loading ${filePath}: ${error.message}`;
      set(state => ({
        fileContent: errorContent,
        files: { ...state.files, [filePath]: errorContent }
      }));
    }
  },

  updateFileContent: (content) => {
    const { selectedFile, projectId } = get();
    if (!selectedFile) return;

    // Update local state immediately
    set(state => ({
      fileContent: content,
      files: { ...state.files, [selectedFile]: content }
    }));

    // Track change for sync
    const change = {
      path: selectedFile,
      content,
      changeType: 'updated',
      timestamp: new Date().toISOString()
    };

    set(state => ({
      unsyncedChanges: new Map(state.unsyncedChanges).set(selectedFile, change),
      pendingChanges: state.unsyncedChanges.size + 1
    }));

    // Debounced auto-save (1.5 seconds)
    get().debouncedSync();
  },

  // ========================================
  // AI OPERATIONS
  // ========================================

  sendAIPrompt: async (message) => {
    const { projectId, selectedFile, files, aiSessionId } = get();

    try {
      const context = {
        activeFile: selectedFile ? {
          path: selectedFile,
          content: files[selectedFile] || ''
        } : undefined,
        relatedFiles: [], // Could be populated based on imports/dependencies
        projectMap: Object.keys(files)
      };

      const request = {
        sessionId: aiSessionId,
        projectId,
        message,
        context
      };

      const response = await workspaceService.getAIAgent().sendPrompt(request);

      // Store session ID for continuation
      set({ aiSessionId: response.sessionId });

      // Set pending actions for user review
      set({ pendingActions: response.actions });

      return response.message;
    } catch (error) {
      console.error('AI prompt failed:', error);
      throw error;
    }
  },

  applyPendingActions: async () => {
    const { pendingActions, projectId } = get();
    if (pendingActions.length === 0) return;

    set({ isApplyingActions: true });

    try {
      for (const action of pendingActions) {
        await applyAction(action, get, set, projectId);
      }

      // Clear pending actions after successful application
      set({ pendingActions: [] });
    } catch (error) {
      console.error('Error applying actions:', error);
      throw error;
    } finally {
      set({ isApplyingActions: false });
    }
  },

  clearPendingActions: () => {
    set({ pendingActions: [] });
  },

  // ========================================
  // SYNC OPERATIONS
  // ========================================

  debouncedSync: debounce(async () => {
    const { unsyncedChanges, projectId } = get();
    if (unsyncedChanges.size === 0) return;

    set({ syncStatus: 'syncing' });

    try {
      const changes = Array.from(unsyncedChanges.values());
      const request = { projectId, changes };

      const response = await workspaceService.getPersistence().syncChanges(request);

      if (response.success) {
        set({
          unsyncedChanges: new Map(),
          pendingChanges: 0,
          syncStatus: 'synced',
          lastSync: response.timestamp
        });
      } else {
        set({ syncStatus: 'error' });
        console.error('Sync errors:', response.errors);
      }
    } catch (error) {
      set({ syncStatus: 'error' });
      console.error('Sync failed:', error);
    }
  }, 1500),

  loadSyncStatus: async () => {
    const { projectId } = get();
    if (!projectId) return;

    try {
      const status = await workspaceService.getPersistence().getSyncStatus(projectId);
      set({
        isOnline: status.isOnline,
        pendingChanges: status.pendingChanges,
        lastSync: status.lastSync,
        syncStatus: status.status
      });
    } catch (error) {
      set({ syncStatus: 'offline' });
      console.error('Failed to load sync status:', error);
    }
  },

  // ========================================
  // UTILITY METHODS
  // ========================================

  getCurrentFileContent: () => {
    const { selectedFile, files } = get();
    return selectedFile ? files[selectedFile] || '' : '';
  },

  getFileContent: (filePath) => {
    const { files } = get();
    return files[filePath] || '';
  }
}));

// ========================================
// ACTION APPLIER
// ========================================

async function applyAction(action, get, set, projectId) {
  const { type, filePath, content } = action;
  const service = workspaceService.getProjectFiles();

  switch (type) {
    case 'update_file':
      await service.updateFile(projectId, filePath, { content });
      // Update local cache
      set(state => ({
        files: { ...state.files, [filePath]: content }
      }));
      break;

    case 'create_file':
      await service.createFile(projectId, { path: filePath, content: content || '' });
      // Update local cache
      set(state => ({
        files: { ...state.files, [filePath]: content || '' }
      }));
      break;

    case 'delete_file':
      await service.deleteFile(projectId, filePath);
      // Remove from local cache
      set(state => {
        const newFiles = { ...state.files };
        delete newFiles[filePath];
        return {
          files: newFiles,
          fileContent: state.selectedFile === filePath ? '' : state.fileContent,
          selectedFile: state.selectedFile === filePath ? null : state.selectedFile
        };
      });
      break;

    case 'create_directory':
      await service.createDirectory(projectId, { path: filePath });
      break;

    default:
      console.warn(`Unknown action type: ${type}`);
  }
}