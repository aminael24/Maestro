/**
 * MOCK DATA
 * Shared mock data for all mock services
 */

export const MOCK_FILES = {
  'src/App.jsx': `import React from 'react';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>Welcome to Maestro</h1>
        <p>Your AI-powered workspace</p>
      </header>
    </div>
  );
}

export default App;`,

  'src/main.jsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);`,

  'src/index.css': `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}`,

  'package.json': `{
  "name": "frontend",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^19.2.4",
    "react-dom": "^19.2.4"
  }
}`,

  'README.md': `# Maestro Frontend

A modern React application with AI-powered workspace features.

## Development

\`\`\`bash
npm install
npm run dev
\`\`\`
`
};

export const MOCK_PROJECT_MAP = Object.keys(MOCK_FILES);