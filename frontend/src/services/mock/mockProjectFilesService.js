/**
 * MOCK PROJECT FILES SERVICE
 * Mock implementation of ProjectFilesService for development mode
 */

import { ProjectFilesService } from '../domain';
import { MOCK_FILES } from './mockData';

// ========================================
// MOCK PROJECT FILES SERVICE
// ========================================

export class MockProjectFilesService extends ProjectFilesService {
  async loadProjectFiles(projectId) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const files = Object.keys(MOCK_FILES).map(path => ({
      path,
      type: 'file',
      size: MOCK_FILES[path].length,
      lastModified: new Date().toISOString()
    }));

    return {
      files,
      projectId
    };
  }

  async getFileContent(projectId, filePath) {
    await new Promise(resolve => setTimeout(resolve, 200));

    const content = MOCK_FILES[filePath];
    if (!content) {
      throw new Error(`File not found: ${filePath}`);
    }

    return {
      path: filePath,
      content,
      encoding: 'utf-8',
      size: content.length
    };
  }

  async createFile(projectId, request) {
    await new Promise(resolve => setTimeout(resolve, 300));

    const { path, content } = request;
    MOCK_FILES[path] = content;

    return {
      path,
      content,
      encoding: 'utf-8',
      size: content.length
    };
  }

  async updateFile(projectId, filePath, request) {
    await new Promise(resolve => setTimeout(resolve, 250));

    const { content } = request;
    if (!MOCK_FILES[filePath]) {
      throw new Error(`File not found: ${filePath}`);
    }

    MOCK_FILES[filePath] = content;

    return {
      path: filePath,
      content,
      encoding: 'utf-8',
      size: content.length
    };
  }

  async deleteFile(projectId, filePath) {
    await new Promise(resolve => setTimeout(resolve, 200));

    if (!MOCK_FILES[filePath]) {
      throw new Error(`File not found: ${filePath}`);
    }

    delete MOCK_FILES[filePath];

    return {
      success: true,
      path: filePath
    };
  }

  async createDirectory(projectId, request) {
    await new Promise(resolve => setTimeout(resolve, 200));

    // Mock directories - just return success for now
    return {
      success: true,
      path: request.path
    };
  }
}