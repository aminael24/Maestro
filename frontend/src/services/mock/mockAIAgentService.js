/**
 * MOCK AI AGENT SERVICE
 * Mock implementation of AIAgentService for development mode
 */

import { AIAgentService } from '../domain';
import { MOCK_FILES } from './mockData';

// ========================================
// MOCK AI AGENT SERVICE
// ========================================

export class MockAIAgentService extends AIAgentService {
  async sendPrompt(request) {
    const { message, context, sessionId, projectId } = request;

    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock AI responses based on message content
    let responseMessage = '';
    let actions = [];

    if (message.toLowerCase().includes('button')) {
      responseMessage = 'I\'ve added a button component to your App.jsx file.';
      const currentContent = context?.activeFile?.content || MOCK_FILES['src/App.jsx'];

      actions = [{
        type: 'update_file',
        filePath: 'src/App.jsx',
        content: currentContent.replace(
          '<p>Your AI-powered workspace</p>',
          '<p>Your AI-powered workspace</p>\n        <button onClick={() => alert("Hello!")}>Click me!</button>'
        )
      }];
    } else if (message.toLowerCase().includes('component')) {
      responseMessage = 'I\'ve created a new Button component file.';
      actions = [{
        type: 'create_file',
        filePath: 'src/components/Button.jsx',
        content: `import React from 'react';

const Button = ({ children, onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '10px 20px',
        backgroundColor: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );
};

export default Button;`
      }];
    } else if (message.toLowerCase().includes('delete') || message.toLowerCase().includes('remove')) {
      responseMessage = 'I\'ve removed the README.md file as requested.';
      actions = [{
        type: 'delete_file',
        filePath: 'README.md'
      }];
    } else {
      responseMessage = `I understand you want me to: "${message}". However, I'm currently in mock mode and can only demonstrate basic file operations. Try asking me to "add a button" or "create a component"!`;
    }

    return {
      message: responseMessage,
      actions,
      sessionId: sessionId || 'mock-session-' + Date.now()
    };
  }
}