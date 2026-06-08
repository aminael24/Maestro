# Maestro – Projet 

## Architecture Finale

```
Navigateur (React/Vite :5173)
  │
  ├── /auth/login ........... Page custom → clic → redirect Keycloak (OIDC + PKCE)
  ├── /auth/register ........ Page custom → POST /auth/register → API Gateway → Keycloak Admin API + DB locale
  ├── /auth/callback ........ Reçoit le code → POST /auth/callback → API Gateway → Keycloak token endpoint (code + code_verifier)
  └── /workspace ............ Protégé par token JWT en localStorage
        │
        └── GET /auth/me .... API Gateway valide le JWT et retourne le profil

Keycloak (:8080)
  ├── Realm: maestro
  ├── Client: maestro-frontend (PUBLIC, PKCE activé)
  └── Client: maestro-api-gateway (confidentiel, pour admin API et token exchange)

Workspace Service (:8080 - Interne)
  ├── API REST de gestion des projets
  └── Persistence: PostgreSQL (workspace-db)

API Gateway (.NET :5000)
  ├── POST /auth/register ... Crée user Keycloak + user local
  ├── POST /auth/callback ... Échange code OIDC + PKCE → tokens
  ├── GET  /auth/me ......... JWT protégé, retourne profil
  └── Proxy vers Workspace Service (/api/projects) et Deploy Service
```

## Flux d'authentification

1. **Register** : L'utilisateur remplit le formulaire personnalisé → le frontend envoie un `POST /auth/register` (multipart/form-data) à l'API Gateway → l'API utilise la Keycloak Admin API pour créer l'utilisateur + mot de passe → crée aussi un LocalUser en base PostgreSQL.

2. **Login** : L'utilisateur clique "Se connecter" sur la page personnalisée → le frontend génère un `code_verifier` + `code_challenge` (PKCE S256) → stocke le `code_verifier` en `sessionStorage` → redirige vers `keycloak:8080/realms/maestro/protocol/openid-connect/auth?...&code_challenge=...&code_challenge_method=S256`. L'utilisateur saisit son login/mdp **directement sur Keycloak** (pas via l'API Gateway). Keycloak redirige vers `/auth/callback?code=...`.

3. **Callback** : Le frontend récupère le `code` de l'URL + le `code_verifier` de `sessionStorage` → envoie `POST /auth/callback` à l'API Gateway → l'API envoie `grant_type=authorization_code` + `code` + `code_verifier` au token endpoint Keycloak → reçoit les tokens → les retourne au frontend → le frontend les stocke en `localStorage`.

4. **API protégée** : Le frontend envoie `Authorization: Bearer <access_token>` → l'API Gateway valide le JWT (signature, issuer, expiration) → retourne les données.

## Prérequis

- Docker & Docker Compose

## Lancement

```bash
cd Maestro
docker-compose up --build -d
```

Attendre ~30 secondes que Keycloak démarre.

## Configuration Keycloak (OBLIGATOIRE au 1er lancement)

### 1. Accéder à Keycloak

Ouvrir http://localhost:8080 → se connecter avec `admin` / `admin123`.
Avant de créer le realm applicatif, rester dans le realm **`master`** puis :

- Menu gauche → **Users**
- Cliquer **Add user** / **Create user**
- Username : `admin1`
- Cliquer **Create**

Ensuite ouvrir l’utilisateur `admin1` :

- Aller dans l’onglet **Credentials**
- Définir le mot de passe : `admin123`
- Désactiver **Temporary** si l’option apparaît
- Sauvegarder

Puis donner les droits admin :

- Aller dans **Role mapping**
- Attribuer le rôle **admin** dans le realm **`master`**

> `admin1` devient ainsi l’administrateur permanent de Keycloak.

---

Après création de `admin1` :

- Cliquer sur le menu utilisateur en haut à droite
- Cliquer **Sign out** / **Logout**

---

### 4. Se reconnecter avec l’admin permanent

Se reconnecter sur http://localhost:8080 avec :

- Username : `admin1`
- Password : `admin123`

Vérifier que l’accès à l’Admin Console fonctionne normalement.

### 2. Créer le realm

- Menu gauche → cliquer sur "master" → "Create realm"
- Realm name : `maestro`
- Cliquer "Create"

### 3. Créer le client `maestro-frontend` (PUBLIC + PKCE)

- Clients → Create client
- Client ID : `maestro-frontend`
- Client authentication : **OFF** (client public)
- Authentication flow : cocher **Standard flow** uniquement
- Cliquer Next/Save
- Onglet Settings :
  - Root URL : `http://localhost:5173`
  - Valid redirect URIs : `http://localhost:5173/auth/callback`
  - Valid post logout redirect URIs : `http://localhost:5173/*`
  - Web origins : `http://localhost:5173`
- Onglet Advanced :
  - Proof Key for Code Exchange (PKCE) → Code Challenge Method : **S256**
- Sauvegarder

### 4. Créer le client `maestro-api-gateway` (confidentiel)

- Clients → Create client
- Client ID : `maestro-api-gateway`
- Client authentication : **ON** (confidentiel)
- Authentication flow : cocher **Standard flow** + **Service accounts roles**
- Cliquer Next/Save
- Onglet Credentials → copier le Secret → le mettre dans `.env` à `KEYCLOAK_CLIENT_SECRET`

### 5. Vérifier l'admin

L'admin `admin1` / `admin123` du realm `master` est utilisé par l'API Gateway pour créer des users via l'Admin API. C'est le bootstrap admin, il est déjà configuré.

### 6. Redémarrer l'API Gateway

```bash
docker-compose restart api-gateway
```

## Test complet

### Test 1 : Register

1. Ouvrir http://localhost:5173
2. Cliquer "Créer un compte"
3. Remplir : username, email, prénom, nom, mot de passe
4. Cliquer "Créer le compte"
5. ✅ Message "Compte créé avec succès"
6. Vérifier dans Keycloak Admin (http://localhost:8080) → realm maestro → Users → l'utilisateur apparaît

### Test 2 : Login (OIDC + PKCE)

1. Sur http://localhost:5173/auth/login → cliquer "Se connecter"
2. ✅ Redirection vers Keycloak (page login Keycloak avec le thème Maestro)
3. Saisir les identifiants créés au step 1
4. ✅ Redirection vers http://localhost:5173/auth/callback
5. ✅ Échange code OIDC + PKCE réussi
6. ✅ Redirection vers /workspace

### Test 3 : Workspace protégé

1. Ouvrir http://localhost:5173/workspace directement sans être connecté
2. ✅ Redirigé vers /auth/login

### Test 4 : /auth/me

1. Depuis le navigateur, ouvrir les DevTools → Console
2. Exécuter :
```js
fetch('http://localhost:5000/auth/me', {
  headers: { Authorization: 'Bearer ' + localStorage.getItem('maestro_access_token') }
}).then(r => r.json()).then(console.log)
```
3. ✅ Retourne { keycloakId, username, email, firstName, lastName, profileUrl }

## Corrections effectuées

| Fichier | Problème | Correction |
|---------|----------|------------|
| `.env` | Admin user `admin1` inexistant | Changé en `admin` (bootstrap admin) |
| `.env` | Variables `USER_DB_DATABASE` etc. utilisaient `${...}` imbriqué | Valeurs directes |
| `docker-compose.yml` | Aucune variable `VITE_*` passée au frontend | Ajoutées dans `environment` |
| `docker-compose.yml` | Variables `KEYCLOAK_FRONTEND_*` manquantes pour api-gateway | Ajoutées |
| `docker-compose.yml` | Variable `CORS_ALLOWED_ORIGINS` manquante | Ajoutée |
| `docker-compose.yml` | Version Keycloak 26.5.6 inexistante | Changée en 26.0.5 |
| `ApiGateway.csproj` | EF Core 9.0.0 incompatible avec net8.0 | Changé en 8.0.11 |
| `Program.cs` | Aucun CORS configuré | Ajouté `AddCors` + `UseCors` |
| `Program.cs` | Aucune auto-migration | Ajouté avec retry |
| `Program.cs` | `ValidateAudience = true` bloque les tokens du client public | `ValidateAudience = false` |
| `AuthController.cs` | Aucune action `/auth/callback` | Ajoutée avec support PKCE |
| `AuthCodeExchangeRequest.cs` | Pas de champ `CodeVerifier` | Ajouté |
| `OidcService.cs` | Utilisait `IConfiguration` + envoyait `client_secret` | Env vars directes + client public (pas de secret) + `code_verifier` PKCE |
| `KeycloakService.cs` | Utilisait `IConfiguration` (inconsistant) | Env vars directes |
| `LoginService.cs` | Idem | Env vars directes |
| `theme.properties` | Référençait `css/style.css` (sans 's') | Corrigé en `css/styles.css` |
| `authHelpers.js` | Simple redirect sans PKCE | PKCE complet (code_verifier + code_challenge S256) |
| `authStorage.js` | Pas de `clearTokens()` | Ajouté |
| `authService.js` | `exchangeCode` n'envoyait pas `code_verifier` | Envoi du `codeVerifier` depuis sessionStorage |
| `LoginPage.jsx` | Appelait `redirectToLogin` (ancien nom) | Appelle `redirectToKeycloakLogin` (async pour PKCE) |
| `AuthCallbackPage.jsx` | Pas de gestion d'erreur détaillée | Messages de progression + gestion erreurs |
| `AppRouter.jsx` | Pas de déconnexion | Ajout bouton logout dans WorkspacePage |
| `index.css` | Style clair Vite par défaut | Refait en dark theme cohérent |
| `keycloak.js` | Fichier obsolète avec URLs en dur (port 3000) | **SUPPRIMÉ** |
| `App.jsx` / `App.css` | Template Vite par défaut | Nettoyés |
