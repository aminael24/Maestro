# Maestro Frontend

A React-based frontend application supporting two runtime modes: **dev** (frontend-only) and **integrated** (full system with APIs + auth).

## Architecture

### Service Layer Architecture

The application uses a clean service layer architecture with three domains:

#### A. Project/Files Domain
- **Interface**: `ProjectFilesService` - Load, create, update, delete files
- **Mock**: `src/services/mock/mockProjectFilesService.js` - In-memory file operations for dev mode
- **Real**: TODO - API calls to backend file service

#### B. AI Agent Domain
- **Interface**: `AIAgentService` - Send prompts, receive structured actions
- **Mock**: `src/services/mock/mockAIAgentService.js` - Simulated AI responses with file operations
- **Real**: TODO - API calls to AI service

#### C. Persistence/Sync Domain
- **Interface**: `PersistenceService` - Sync changes, get sync status
- **Mock**: `src/services/mock/mockPersistenceService.js` - Local sync simulation
- **Real**: TODO - API calls to persistence service

### Mode Switching

- **`VITE_APP_MODE=dev`**: Uses mock services, no backend required
- **`VITE_APP_MODE=integrated`**: Uses real API services, requires backend + auth

### Key Features

- **Local-first editing**: Monaco editor updates instantly
- **Debounced auto-save**: Changes sync to backend after 1.5s inactivity
- **AI file operations**: AI can propose create/update/delete actions
- **Change tracking**: Unsynced changes tracked until persisted
- **Service abstraction**: Clean separation between UI and data layers

## Quickstart

### 1. Environment Setup

Create or edit `.env`:

```env
VITE_APP_MODE=dev

VITE_KEYCLOAK_URL=http://localhost:8080
VITE_KEYCLOAK_REALM=myrealm
VITE_KEYCLOAK_CLIENT_ID=myclient

VITE_FRONTEND_URL=http://localhost:5173
VITE_API_GATEWAY_URL=http://localhost:5000
```

### 2. Docker Build & Run

Build the Docker image:

```bash
docker build -t frontend-ui .
```

Run the container:

```bash
docker run -d --name front-ui -p 5173:5173 --env-file src/.env -v ${PWD}:/app -v /app/node_modules frontend-ui
```

The app will be available at `http://localhost:5173`.

## App Modes

### 🟢 DEV mode
- `VITE_APP_MODE=dev`
- No authentication required
- Backend calls disabled
- Fully standalone UI

### 🔵 INTEGRATED mode
- `VITE_APP_MODE=integrated`
- Auth enabled (Keycloak)
- API calls enabled
- Full system behavior
