# 📚 API Routes Recap - Maestro Workspace

Complete list of all API routes needed for the workspace pages with data JSON format.

---

## 🔐 Authentication Routes

### POST `/auth/register`
**Purpose:** User registration  
**Request Format:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response Format:**
```json
{
  "message": "Registration successful",
  "userId": "user-123",
  "email": "user@example.com"
}
```

---

### POST `/auth/callback`
**Purpose:** OIDC/OAuth2 code exchange (PKCE flow)  
**Request Format:**
```json
{
  "code": "auth_code_from_provider",
  "codeVerifier": "pkce_code_verifier_string"
}
```

**Response Format:**
```json
{
  "accessToken": "eyJhbGc...",
  "idToken": "eyJhbGc...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

---

### POST `/auth/refresh`
**Purpose:** Refresh access token (uses HttpOnly refresh_token cookie)  
**Request Format:**
```json
{}
```

**Response Format:**
```json
{
  "accessToken": "eyJhbGc...",
  "idToken": "eyJhbGc...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

---

### GET `/auth/me`
**Purpose:** Get authenticated user profile  
**Headers:** `Authorization: Bearer {accessToken}`  
**Response Format:**
```json
{
  "userId": "user-123",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "profilePicture": "https://...",
  "createdAt": "2026-01-15T10:30:00Z"
}
```

---

### POST `/auth/logout`
**Purpose:** Logout and invalidate refresh token  
**Response Format:**
```json
{
  "message": "Logged out successfully"
}
```

---

## 📁 Projects Routes

### GET `/api/projects`
**Purpose:** List all user projects  
**Response Format:**
```json
[
  {
    "id": "proj-123",
    "name": "App React Native",
    "description": "Mobile application development",
    "status": "active",
    "dueDate": "2026-05-15",
    "createdAt": "2026-01-10T08:00:00Z",
    "updatedAt": "2026-04-20T15:30:00Z",
    "owner": {
      "id": "user-123",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    },
    "members": 3,
    "filesCount": 15
  }
]
```

---

### POST `/api/projects`
**Purpose:** Create a new project  
**Request Format:**
```json
{
  "name": "New Project",
  "description": "Project description here",
  "status": "active",
  "dueDate": "2026-06-30"
}
```

**Response Format:**
```json
{
  "id": "proj-124",
  "name": "New Project",
  "description": "Project description here",
  "status": "active",
  "dueDate": "2026-06-30",
  "createdAt": "2026-04-23T10:00:00Z",
  "updatedAt": "2026-04-23T10:00:00Z",
  "owner": {
    "id": "user-123",
    "email": "user@example.com"
  }
}
```

---

### DELETE `/api/projects/{projectId}`
**Purpose:** Delete a project  
**Response Format:**
```json
{
  "message": "Project deleted successfully",
  "id": "proj-123"
}
```

---

## 📝 Project Files Routes

### GET `/api/projects/{projectId}/files`
**Purpose:** Load all files in a project  
**Response Format:**
```json
{
  "projectId": "proj-123",
  "files": [
    {
      "path": "src/App.jsx",
      "type": "file",
      "size": 1024,
      "lastModified": "2026-04-20T14:30:00Z"
    },
    {
      "path": "src/main.jsx",
      "type": "file",
      "size": 512,
      "lastModified": "2026-04-19T10:15:00Z"
    },
    {
      "path": "src/components",
      "type": "directory",
      "size": 0,
      "lastModified": "2026-04-15T08:00:00Z"
    },
    {
      "path": "package.json",
      "type": "file",
      "size": 2048,
      "lastModified": "2026-04-18T11:45:00Z"
    },
    {
      "path": "README.md",
      "type": "file",
      "size": 4096,
      "lastModified": "2026-04-10T09:30:00Z"
    }
  ]
}
```

---

### GET `/api/projects/{projectId}/files/{filePath}`
**Purpose:** Get content of a specific file  
**Note:** `filePath` should be URL encoded  
**Response Format:**
```json
{
  "path": "src/App.jsx",
  "content": "import React from 'react';\nimport './App.css';\n\nfunction App() {\n  return (\n    <div className=\"App\">\n      <header className=\"App-header\">\n        <h1>Welcome to Maestro</h1>\n        <p>Your AI-powered workspace</p>\n      </header>\n    </div>\n  );\n}\n\nexport default App;",
  "encoding": "utf-8",
  "size": 1024
}
```

---

### POST `/api/projects/{projectId}/files`
**Purpose:** Create a new file  
**Request Format:**
```json
{
  "path": "src/components/Button.jsx",
  "content": "import React from 'react';\n\nconst Button = ({ children, onClick }) => {\n  return <button onClick={onClick}>{children}</button>;\n};\n\nexport default Button;",
  "encoding": "utf-8"
}
```

**Response Format:**
```json
{
  "path": "src/components/Button.jsx",
  "content": "import React from 'react';\n\nconst Button = ({ children, onClick }) => {\n  return <button onClick={onClick}>{children}</button>;\n};\n\nexport default Button;",
  "encoding": "utf-8",
  "size": 156
}
```

---

### PUT `/api/projects/{projectId}/files/{filePath}`
**Purpose:** Update an existing file  
**Request Format:**
```json
{
  "content": "import React from 'react';\n\nconst Button = ({ children, onClick, variant = 'primary' }) => {\n  return (\n    <button className={`btn btn-${variant}`} onClick={onClick}>\n      {children}\n    </button>\n  );\n};\n\nexport default Button;",
  "encoding": "utf-8"
}
```

**Response Format:**
```json
{
  "path": "src/components/Button.jsx",
  "content": "import React from 'react';\n\nconst Button = ({ children, onClick, variant = 'primary' }) => {\n  return (\n    <button className={`btn btn-${variant}`} onClick={onClick}>\n      {children}\n    </button>\n  );\n};\n\nexport default Button;",
  "encoding": "utf-8",
  "size": 198
}
```

---

### DELETE `/api/projects/{projectId}/files/{filePath}`
**Purpose:** Delete a file  
**Response Format:**
```json
{
  "success": true,
  "path": "src/components/Button.jsx",
  "message": "File deleted successfully"
}
```

---

### POST `/api/projects/{projectId}/directories`
**Purpose:** Create a new directory  
**Request Format:**
```json
{
  "path": "src/utils"
}
```

**Response Format:**
```json
{
  "success": true,
  "path": "src/utils",
  "message": "Directory created successfully"
}
```

---

## 🤖 AI Agent Routes

### POST `/api/projects/{projectId}/ai/prompt`
**Purpose:** Send a prompt to AI agent and get code suggestions  
**Request Format:**
```json
{
  "sessionId": "session-abc123",
  "projectId": "proj-123",
  "message": "Add a button component to the App.jsx file",
  "context": {
    "activeFile": {
      "path": "src/App.jsx",
      "content": "import React from 'react';\n..."
    },
    "relatedFiles": [
      {
        "path": "src/App.css",
        "content": ".App { ... }"
      }
    ],
    "projectMap": [
      "src/App.jsx",
      "src/main.jsx",
      "src/index.css",
      "package.json"
    ]
  }
}
```

**Response Format:**
```json
{
  "message": "I've added a button component to your App.jsx file. The button is styled with a primary color and includes a click handler.",
  "sessionId": "session-abc123",
  "actions": [
    {
      "type": "update_file",
      "filePath": "src/App.jsx",
      "content": "import React from 'react';\nimport './App.css';\n\nfunction App() {\n  return (\n    <div className=\"App\">\n      <header className=\"App-header\">\n        <h1>Welcome to Maestro</h1>\n        <p>Your AI-powered workspace</p>\n        <button onClick={() => alert('Hello!')}>Click me!</button>\n      </header>\n    </div>\n  );\n}\n\nexport default App;"
    }
  ]
}
```

---

### POST `/api/projects/{projectId}/ai/actions/apply`
**Purpose:** Apply AI-suggested actions (bulk file operations)  
**Request Format:**
```json
{
  "sessionId": "session-abc123",
  "actions": [
    {
      "type": "update_file",
      "filePath": "src/App.jsx",
      "content": "..."
    },
    {
      "type": "create_file",
      "filePath": "src/components/Button.jsx",
      "content": "..."
    },
    {
      "type": "delete_file",
      "filePath": "src/old-component.jsx"
    }
  ]
}
```

**Response Format:**
```json
{
  "success": true,
  "appliedActions": 3,
  "results": [
    {
      "type": "update_file",
      "filePath": "src/App.jsx",
      "success": true
    },
    {
      "type": "create_file",
      "filePath": "src/components/Button.jsx",
      "success": true
    },
    {
      "type": "delete_file",
      "filePath": "src/old-component.jsx",
      "success": true
    }
  ],
  "timestamp": "2026-04-23T10:30:00Z"
}
```

---

## 🔄 Sync/Persistence Routes

### POST `/api/projects/{projectId}/sync`
**Purpose:** Sync pending changes to backend  
**Request Format:**
```json
{
  "projectId": "proj-123",
  "changes": [
    {
      "path": "src/App.jsx",
      "content": "...",
      "changeType": "updated",
      "timestamp": "2026-04-23T10:25:00Z"
    },
    {
      "path": "src/components/Button.jsx",
      "content": "...",
      "changeType": "created",
      "timestamp": "2026-04-23T10:20:00Z"
    }
  ]
}
```

**Response Format:**
```json
{
  "success": true,
  "syncedFiles": [
    "src/App.jsx",
    "src/components/Button.jsx"
  ],
  "errors": {},
  "timestamp": "2026-04-23T10:30:00Z",
  "conflictedFiles": []
}
```

---

### GET `/api/projects/{projectId}/sync/status`
**Purpose:** Get current sync status  
**Response Format:**
```json
{
  "projectId": "proj-123",
  "isOnline": true,
  "status": "synced",
  "pendingChanges": 0,
  "lastSync": "2026-04-23T10:30:00Z",
  "syncQueueSize": 0,
  "errors": []
}
```

---

## 📊 Data Models & Enums

### File Types
```json
{
  "types": ["file", "directory", "symlink"]
}
```

### Project Status
```json
{
  "statuses": ["active", "archived", "draft", "completed"]
}
```

### AI Action Types
```json
{
  "actionTypes": [
    "create_file",
    "update_file",
    "delete_file",
    "create_directory"
  ]
}
```

### File Change Types
```json
{
  "changeTypes": ["created", "updated", "deleted"]
}
```

### Sync Status
```json
{
  "statuses": ["synced", "syncing", "error", "offline", "conflict"]
}
```

---

## 🔗 Summary Table

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|-----------------|
| `/auth/register` | POST | User registration | ❌ |
| `/auth/callback` | POST | OAuth2 callback | ❌ |
| `/auth/refresh` | POST | Refresh token | ❌ (uses cookie) |
| `/auth/me` | GET | Get user profile | ✅ |
| `/auth/logout` | POST | Logout | ✅ |
| `/api/projects` | GET | List projects | ✅ |
| `/api/projects` | POST | Create project | ✅ |
| `/api/projects/{id}` | DELETE | Delete project | ✅ |
| `/api/projects/{id}/files` | GET | List files | ✅ |
| `/api/projects/{id}/files/{path}` | GET | Get file content | ✅ |
| `/api/projects/{id}/files` | POST | Create file | ✅ |
| `/api/projects/{id}/files/{path}` | PUT | Update file | ✅ |
| `/api/projects/{id}/files/{path}` | DELETE | Delete file | ✅ |
| `/api/projects/{id}/directories` | POST | Create directory | ✅ |
| `/api/projects/{id}/ai/prompt` | POST | AI prompt | ✅ |
| `/api/projects/{id}/ai/actions/apply` | POST | Apply AI actions | ✅ |
| `/api/projects/{id}/sync` | POST | Sync changes | ✅ |
| `/api/projects/{id}/sync/status` | GET | Sync status | ✅ |

---

## 🚀 Usage Flow

### User Workflow

1. **Register/Login**: `/auth/register` → `/auth/callback` → `/auth/me`
2. **View Projects**: `GET /api/projects`
3. **Open Project**: `GET /api/projects/{id}/files`
4. **View File**: `GET /api/projects/{id}/files/{path}`
5. **Edit File**: `PUT /api/projects/{id}/files/{path}`
6. **Ask AI**: `POST /api/projects/{id}/ai/prompt`
7. **Apply Changes**: `POST /api/projects/{id}/ai/actions/apply`
8. **Sync Changes**: `POST /api/projects/{id}/sync`

### Error Handling

All endpoints follow standard HTTP status codes:

```json
{
  "status": 400,
  "error": "Bad Request",
  "message": "Invalid file path",
  "timestamp": "2026-04-23T10:30:00Z"
}
```

Common errors:
- `400`: Bad Request (invalid input)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource doesn't exist)
- `409`: Conflict (file exists or merge conflict)
- `500`: Server Error

---

## 📋 Notes

- All dates use ISO 8601 format (`YYYY-MM-DDTHH:mm:ssZ`)
- File paths are relative to project root
- Authentication uses Bearer token in `Authorization` header
- Refresh token is stored in HttpOnly cookie (secure)
- All endpoints return JSON
- File content can be up to 10MB
- Project IDs and user IDs are UUIDs or custom identifiers
