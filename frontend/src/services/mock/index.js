/**
 * MOCK SERVICES INDEX
 * Exports all mock service implementations
 */

export { MockProjectFilesService } from './mockProjectFilesService';
export { MockAIAgentService } from './mockAIAgentService';
export { MockPersistenceService } from './mockPersistenceService';

// Unified mock workspace service
import { MockProjectFilesService } from './mockProjectFilesService';
import { MockAIAgentService } from './mockAIAgentService';
import { MockPersistenceService } from './mockPersistenceService';

export class MockWorkspaceService {
  constructor() {
    this.projectFiles = new MockProjectFilesService();
    this.aiAgent = new MockAIAgentService();
    this.persistence = new MockPersistenceService();
  }
}