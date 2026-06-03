# GitHub Routes Connection: Frontend ↔ API Gateway ↔ GitHub Service

## 🏗️ Architecture Overview

```
Frontend (React/Vite)
    ↓
API Gateway (localhost:5000) 
    ↓
GitHub Service (localhost:5101)
    ↓
GitHub DB (postgres)
```

---

## 📡 Frontend Configuration

### Environment Variables
**File:** `frontend/.env` or `docker-compose.yml`
```env
VITE_API_GATEWAY_URL=http://localhost:5000  # Backend URL
VITE_FRONTEND_URL=http://localhost:5173     # Frontend URL
VITE_KEYCLOAK_URL=...
VITE_KEYCLOAK_REALM=maestro
VITE_KEYCLOAK_CLIENT_ID=...
```

### API Client Configuration
**File:** `frontend/src/services/api.js`
```javascript
const API_BASE_URL = import.meta.env.VITE_API_GATEWAY_URL || 'http://localhost:5000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,  // ← Sends HttpOnly cookies (maestro_access_token)
})
```

---

## 🔗 Frontend → API Gateway Routes

**File:** `frontend/src/services/gitHubApi.js`

### 1. Get Authorization URL (OAuth Flow)
```javascript
GET /github/providers/{provider}/auth-url?redirectUri=...&state=...
```
- **Frontend Call:** `gitHubApi.getAuthorizationUrl('github', redirectUri, state)`
- **Purpose:** Get GitHub OAuth authorization URL
- **Response:** `{ authUrl: "https://github.com/login/oauth/authorize?..." }`

### 2. Exchange OAuth Code for Token
```javascript
POST /github/providers/{provider}/token
Content-Type: application/json
{
  "code": "...",
  "redirectUri": "http://localhost:5173/github/callback"
}
```
- **Frontend Call:** `gitHubApi.exchangeCode('github', code, redirectUri)`
- **Response:** `{ accessToken: "...", expiresIn: 3600 }`

### 3. Create Repository on Provider
```javascript
POST /github/providers/{provider}/repositories
Content-Type: application/json
{
  "projectId": "uuid",
  "accessToken": "...",
  "name": "my-repo",
  "description": "...",
  "isPrivate": false
}
```
- **Frontend Call:** `gitHubApi.createRepository(provider, projectId, accessToken, name, description, isPrivate)`
- **Response:** Repository metadata

### 4. Get Repository Metadata
```javascript
GET /github/providers/{provider}/repositories/{owner}/{repoName}?accessToken=...
```
- **Frontend Call:** `gitHubApi.getSavedRepository(projectId)`
- **Purpose:** Fetch details about a specific GitHub repository
- **Response:** Repository metadata (branches, issues, etc.)

### 5. Get All Saved Repositories
```javascript
GET /github/repositories
```
- **Frontend Call:** `gitHubApi.getSavedRepositories()`
- **Response:** Array of repository objects

### 6. Get Single Repository by Project ID
```javascript
GET /github/repositories/{projectId}
```
- **Frontend Call:** `gitHubApi.getSavedRepository(projectId)`
- **Response:** Repository object or 404

### 7. Save Repository Mapping
```javascript
POST /github/repositories
Content-Type: application/json
{
  "projectId": "uuid",
  "provider": "github",
  "remoteUrl": "https://github.com/user/repo.git",
  "localPath": "/app/projects/...",
  "defaultBranch": "main"
}
```

---

## 🚀 API Gateway Routes (Proxy Layer)

**File:** `services/ApiGateway/Program.cs` (lines 430-550+)

The API Gateway proxies all `/api/github/*` requests to the GitHub Service:

```csharp
// Configuration
var gitHubServiceUrl = Environment.GetEnvironmentVariable("GITHUB_SERVICE_URL") ?? "http://github-service:8080";

// Routes
app.MapGet("/api/github/providers", ...) 
app.MapGet("/api/github/providers/{provider}/auth-url", ...)
app.MapPost("/api/github/providers/{provider}/token", ...)
app.MapPost("/api/github/providers/{provider}/repositories", ...)
app.MapGet("/api/github/providers/{provider}/repositories/{owner}/{repoName}", ...)
app.MapGet("/api/github/repositories", ...)
app.MapGet("/api/github/repositories/{projectId}", ...)
app.MapPost("/api/github/repositories", ...)
```

**Key Features:**
- ✅ All routes are behind `.RequireAuthorization()` (JWT)
- ✅ Automatic bearer token extraction
- ✅ Error handling with 502 Gateway Unavailable fallback
- ✅ Request body forwarding
- ✅ Query string preservation
- ✅ Content-Type preservation

---

## 💾 GitHub Service Endpoints

**File:** `services/GitHubService/Controllers/`

### ProviderController (`api/providers`)
```csharp
GET    /api/providers                              → List available providers
GET    /api/providers/{provider}/auth-url?redirectUri&state  → Get OAuth URL
POST   /api/providers/{provider}/token             → Exchange code for token
POST   /api/providers/{provider}/repositories      → Create repo
GET    /api/providers/{provider}/repositories/{owner}/{repoName}  → Get repo metadata
```

### RepositoryController (`api/repositories`)
```csharp
GET    /api/repositories                           → Get all saved repos
GET    /api/repositories/{projectId}               → Get repo by projectId
POST   /api/repositories                           → Create repo mapping
```

---

## 🔐 Authentication Flow

### GitHub OAuth Login Flow
1. **Frontend:** User clicks "Connect GitHub" button
2. **Frontend → Gateway:** `GET /github/providers/github/auth-url`
3. **Gateway → GitHubService:** Proxies request
4. **GitHubService:** Returns GitHub OAuth URL
5. **Frontend:** Redirects to GitHub login page
6. **GitHub:** User authorizes app, redirects to `/github/callback?code=...`
7. **Frontend:** Extracts code, calls `POST /github/providers/github/token`
8. **Gateway → GitHubService:** Proxies request with code
9. **GitHubService:** Exchanges code for access token
10. **Frontend:** Stores token, fetches repositories

### API Authentication
All API requests use **HttpOnly cookies** with JWT:
- Cookie name: `maestro_access_token`
- Managed by: API Gateway
- Sent automatically by browser with `withCredentials: true`

---

## 📊 Frontend Store Integration

**File:** `frontend/src/store/gitHubStore.js`

State management:
```javascript
useGitHubStore = {
  isConnected,        // Boolean
  user,              // { id, name, username, avatar }
  repositories,      // Array
  selectedRepository,
  currentBranch,
  syncStatus,
  error,
  accessToken,       // GitHub OAuth token
  
  connect(),         // Initiates OAuth flow
  finishOAuthCallback(code, state),  // Completes OAuth
  fetchRepositories(),   // Loads repos
  // ... other methods
}
```

---

## ⚡ Docker Compose Networking

**File:** `docker-compose.yml`

Services communicate on internal network `maestro-net`:
```yaml
api-gateway:
  environment:
    GITHUB_SERVICE_URL: http://github-service:8080  # Internal DNS
  ports:
    - "5000:8080"

github-service:
  environment:
    DATABASE_URL: Host=github-db:5432;...
  ports:
    - "5101:8080"

frontend:
  environment:
    VITE_API_GATEWAY_URL: http://localhost:5000  # External URL (browser)
  depends_on:
    - api-gateway
```

---

## ✅ Connection Checklist

- [x] Frontend has `VITE_API_GATEWAY_URL` environment variable
- [x] API Gateway has `GITHUB_SERVICE_URL` environment variable
- [x] GitHub Service is running on port 8080 in container
- [x] GitHub DB is initialized and accessible
- [x] All routes are properly proxied in API Gateway
- [x] Authentication middleware is in place (`RequireAuthorization()`)
- [x] CORS is configured in API Gateway
- [x] Frontend uses `withCredentials: true` for cookie-based auth
- [x] Docker services are on same network (`maestro-net`)

---

## 🐛 Troubleshooting

### "GitHub Service unreachable" (502 Error)
1. Check if GitHub Service is running: `docker ps | grep github-service`
2. Verify GitHub DB is healthy: `docker logs github-db`
3. Check `GITHUB_SERVICE_URL` in API Gateway: Should be `http://github-service:8080`
4. Verify network: `docker network inspect maestro_maestro-net`

### OAuth Code Exchange Fails
1. Verify redirect URI matches: Frontend callback URL = GitHub App settings
2. Check GitHub App credentials in database
3. Verify `GITHUB_SERVICE_URL` resolves correctly from API Gateway container

### Repositories Not Loading
1. Check authentication token: Ensure `maestro_access_token` cookie is present
2. Verify JWT is valid: Check API Gateway logs
3. Check GitHub Service database: `docker exec github-db psql -U admin -d github_db -c "SELECT * FROM repositories;"`

---

## 📝 Testing API Routes

### Test OAuth URL Endpoint
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/github/providers/github/auth-url?redirectUri=http://localhost:5173/github/callback&state=abc123
```

### Test Get Repositories
```bash
curl -H "Authorization: Bearer {token}" \
  -H "Cookie: maestro_access_token={token}" \
  http://localhost:5000/api/github/repositories
```

---

## 🔗 Related Files

- **Frontend Gateway Config:** [frontend/src/services/api.js](frontend/src/services/api.js)
- **Frontend GitHub API:** [frontend/src/services/gitHubApi.js](frontend/src/services/gitHubApi.js)
- **Frontend GitHub Store:** [frontend/src/store/gitHubStore.js](frontend/src/store/gitHubStore.js)
- **API Gateway Routes:** [services/ApiGateway/Program.cs](services/ApiGateway/Program.cs#L430)
- **GitHub Service:** [services/GitHubService/](services/GitHubService/)
- **Docker Compose:** [docker-compose.yml](docker-compose.yml)

