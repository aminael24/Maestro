# Maestro — Tests

Guide complet pour exécuter les tests **unitaires**, **d'intégration** et **fonctionnels** du projet Maestro.

---

## Stack de test

| Niveau                          | Cible             | Outils                                      |
| ------------------------------- | ----------------- | ------------------------------------------- |
| Unitaires frontend              | React components  | **Jest** + **React Testing Library**        |
| Unitaires backend               | Services .NET     | **xUnit** + **Moq** + **FluentAssertions**  |
| Intégration backend             | API HTTP gateway  | **xUnit** + **WebApplicationFactory**       |
| Fonctionnels (E2E)              | Parcours user     | **Cypress**                                 |

---

## 1. Tests unitaires frontend (Jest + RTL)

Tous les tests sont dans `frontend/src/tests/`.

```bash
cd frontend
CYPRESS_INSTALL_BINARY=0 npm install  # CYPRESS_INSTALL_BINARY=0 si pas besoin du binaire Cypress

                              # exécute tous les tests Jest
npm run test:watch                    # mode watch
npm run test:coverage                 # avec couverture
```

### Suites couvertes

| Fichier                            | Tests | Ce qu'on vérifie                                                         |
| ---------------------------------- | ----- | ------------------------------------------------------------------------ |
| `authService.test.js`              | 9     | redirectToGatewayLogin/Google/GitHub, registerUser (FormData, erreurs, body vide, body non-JSON), requestPasswordReset |
| `LandingPage.test.jsx`             | 7     | navbar,  scroll → classe `.scrolled`, bouton "Découvrir" → `#features`, "Créer un compte" → `/auth/register`, "Se connecter" → gateway |
| `RegisterPage.test.jsx`            | 6     | champs obligatoires, onglet Connexion → Keycloak, submit avec FormData complet, succès → redirect `/auth/login`, message d'erreur si throw, état loading |
| `Aboutsection.test.jsx`            | 4     | rendu des 6 services Maestro réels (ApiGateway, Auth OIDC, WorkspaceService, Sécurité tokens, AIService + RunnerService, Infrastructure Docker), bouton "Commencer" → `/auth/register` |
| `FeaturesSection.test.jsx`         | 6     | 4 slides (ApiGateway & Auth OIDC Keycloak, WorkspaceService + Monaco, AIService LLaMA 3.1 + RunnerService Docker, Infrastructure Docker Compose + Kafka) + stats |
| `Projects.test.jsx`                | 2     | ProjectCard — affichage + modale de suppression                          |

**Total : 34 tests dans 6 suites — tous passent.**

---

## 2. Tests unitaires backend (xUnit + Moq + FluentAssertions)

Projet : `tests/ApiGateway.UnitTests/`

```bash
dotnet test tests/ApiGateway.UnitTests
```

### Suites couvertes

- **`Controllers/AuthControllerTests.cs`** — comportement HTTP du contrôleur :
  - `Register` avec payload complet → Ok + service appelé
  - `Register` avec un champ vide (Theory) → BadRequest sans appel au service
  - `Register` si service throw → BadRequest avec message
  - `ForgotPassword` avec email vide → BadRequest
  - `ForgotPassword` avec email valide → Ok (anti-énumération)
  - `Login` → 302 + cookie state posé
  - `LoginGoogle` / `LoginGitHub` → kc_idp_hint correct
  - `Refresh` sans cookie → 401

- **`Services/OidcServiceTests.cs`** — `OidcService` mocké via `HttpMessageHandler` :
  - `BuildAuthorizationUrl` : tous les params OIDC, idp_hint optionnel, URL browser-facing
  - `BuildEndSessionUrl` : id_token_hint, post_logout_redirect_uri
  - `ExchangeCodeAsync` : succès parse correctement, 4xx throw
  - `RefreshTokenAsync` : succès / 4xx throw
  - `RevokeRefreshTokenAsync` : best effort — ne throw JAMAIS, même si Keycloak est down

- **`Services/RegisterServiceTests.cs`** — flow et rollback :
  - Flow heureux : Keycloak → photo → LocalUser
  - Si photo fail → DeleteUser appelé
  - Si DB fail → DeleteUser appelé
  - Si Keycloak fail → pas de rollback (rien à supprimer)
  - Si rollback lui-même throw → l'exception originale est propagée

- **`Services/LocalUserServiceTests.cs`** — EF Core InMemory :
  - `CreateAsync`, `CreateMinimalAsync`, `GetByKeycloakIdAsync`

---

## 3. Tests d'intégration backend (xUnit + WebApplicationFactory)

Projet : `tests/ApiGateway.IntegrationTests/`

```bash
dotnet test tests/ApiGateway.IntegrationTests
```

### Fixture : `MaestroApiGatewayFactory.cs`

- Override `AppDbContext` Postgres → **EF Core InMemory**
- Pose toutes les variables d'env requises par `Program.cs`
- Pose **`SKIP_JWKS_FETCH=1`** pour bypasser le fetch bloquant JWKS (15 retries × 3s)

### Suite : `AuthEndpointsTests.cs`

| Endpoint                                | Scénario                                            | Attendu                            |
| --------------------------------------- | --------------------------------------------------- | ---------------------------------- |
| `GET  /auth/login`                      | sans cookie                                         | 302 vers `/protocol/openid-connect/auth` + cookie state |
| `GET  /auth/login/google`               | redirection IdP social                              | 302 avec `kc_idp_hint=google`      |
| `GET  /auth/login/github`               | redirection IdP social                              | 302 avec `kc_idp_hint=github`      |
| `GET  /auth/callback`                   | sans `code`                                         | 302 vers `/auth/login?error=`      |
| `GET  /auth/callback`                   | `state` mismatch                                    | 302 vers `/auth/login`             |
| `POST /auth/refresh`                    | sans cookie refresh                                 | 401                                |
| `GET  /auth/me`                         | sans token                                          | 401                                |
| `GET  /auth/me`                         | Bearer factice                                      | 401                                |
| `POST /auth/register`                   | payload vide                                        | 400                                |
| `POST /auth/register`                   | payload partiel                                     | 400 + message "obligatoires"       |
| `POST /auth/register`                   | payload complet (Keycloak indisponible)             | 400 + "Echec création compte"      |
| `POST /auth/forgot-password`            | email vide                                          | 400                                |
| `POST /auth/forgot-password`            | email valide                                        | 200 (anti-énumération)             |

---

## 4. Tests fonctionnels (Cypress E2E)

```bash
cd frontend
# Terminal 1 : démarrer le frontend
npm run dev

# Terminal 2 : ouvrir Cypress
npm run cy:open   # mode interactif
npm run cy:run    # mode headless / CI
```

### Suites

- **`cypress/e2e/landing.cy.js`** — page d'accueil :
  - navbar avec logo + boutons CTA
  - clic Découvrir → scroll vers `#features`
  - scroll → classe `.scrolled` sur la navbar
  - clic "Créer un compte" (navbar 
  ) → `/auth/register`
  - section À propos liste les 6 services Maestro
  - section Fonctionnalités contient les 4 slides

- **`cypress/e2e/register.cy.js`** — création de compte :
  - rendu du formulaire complet
  - validation HTML empêche submit si champ vide
  - submit valide → POST `/auth/register` puis redirect `/auth/login`
  - erreur backend 400 → message affiché, on reste sur la page
  - lien "Retour à l'accueil" → `/`

- **`cypress/e2e/login.cy.js`** — flow de login :
  - `/auth/login` déclenche redirection vers gateway
  - clic "Se connecter" sur landing → bouton passe en "Redirection…"

---

## Tout exécuter d'un coup

```bash
# Tests unitaires + intégration backend
dotnet test

# Tests unitaires frontend
cd frontend && npm test

# Tests E2E (avec frontend démarré en parallèle)
cd frontend && npm run cy:run
```

---

## Modifications faites au code source

Pour rendre les tests possibles, j'ai fait quelques modifications **non-intrusives** au code source :

1. **`services/ApiGateway/Program.cs`** :
   - Bypass du fetch JWKS via `SKIP_JWKS_FETCH=1` (sinon timeout de 45s en CI)
   - Auto-détection EF InMemory → `EnsureCreated()` au lieu de `Migrate()`
   - Ajout de `public partial class Program {}` pour `WebApplicationFactory<Program>`

2. **`services/ApiGateway/Services/*`** :
   - Ajout de `virtual` sur les méthodes publiques de `RegisterService`, `LocalUserService`, `OidcService`, `KeycloakService`, `ProfileImageService`, `PasswordResetService`
   - Aucune modification de comportement — juste permettre à Moq de créer des proxies

3. **`frontend/`** :
   - `package.json` : ajout de Jest, Cypress, babel-jest, user-event
   - `jest.config.cjs`, `babel.config.cjs` : configs alignées sur Jest + React 19 + TS
   - `src/setupGlobals.cjs`, `src/setupTests.js` : polyfills (TextEncoder, matchMedia, scrollIntoView, etc.)
   - `src/__mocks__/` : stubs pour assets (PNG, CSS) et env (Vite `import.meta.env`)
