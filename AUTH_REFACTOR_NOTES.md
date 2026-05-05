# Maestro — Refactor du flux d'authentification

Ce document décrit la migration vers un flux d'authentification 100 %
backend-driven : aucun token n'est manipulé par le frontend, plus de
PKCE en JS, plus rien dans `localStorage`.

## Topologie cible

```
  Frontend                             ApiGateway                Keycloak
     │                                       │                       │
     │ click "Se connecter"                  │                       │
     │ window.location = /auth/login         │                       │
     │──────────────────────────────────────►│                       │
     │                                       │ 302 → /auth?state=...│
     │                                       ├──────────────────────►│
     │                                       │                       │
     │                                       │   user authenticates  │
     │                                       │                       │
     │                                       │  302 /auth/callback?code&state
     │                                       │◄──────────────────────│
     │                                       │                       │
     │                                       │ POST /token (code +   │
     │                                       │   client_secret)      │
     │                                       ├──────────────────────►│
     │                                       │◄── access/refresh/id  │
     │                                       │                       │
     │  Set-Cookie: maestro_access_token     │                       │
     │  Set-Cookie: maestro_refresh_token    │                       │
     │  Set-Cookie: maestro_id_token         │                       │
     │  302 → /workspace/projects            │                       │
     │◄──────────────────────────────────────│                       │
     │                                       │                       │
     │  Le navigateur attache les cookies    │                       │
     │  HttpOnly à chaque requête /api/*     │                       │
```

## Cookies posés par le gateway

| Nom                       | Path    | Durée   | Usage                              |
|---------------------------|---------|---------|------------------------------------|
| `maestro_access_token`    | `/`     | exp JWT | Joué sur chaque appel API          |
| `maestro_refresh_token`   | `/auth` | 30 j    | Lu par `/auth/refresh`             |
| `maestro_id_token`        | `/auth` | 30 j    | `id_token_hint` au logout Keycloak |
| `maestro_oauth_state`     | `/auth` | 10 min  | CSRF protection sur le callback    |

Tous : `HttpOnly = true`, `Secure = isProduction`, `SameSite = Lax` en
dev / `None` en prod.

## Routes du gateway

| Méthode | Chemin           | Rôle                                                                 |
|---------|------------------|----------------------------------------------------------------------|
| `GET`   | `/auth/login`    | Génère un `state`, le pose en cookie, redirige vers Keycloak.        |
| `GET`   | `/auth/callback` | Vérifie `state`, échange le `code` (client confidentiel), pose les cookies, redirige vers `FRONTEND_URL/workspace/projects`. |
| `POST`  | `/auth/refresh`  | Rotation des cookies via `refresh_token`. Renvoie 401 si la session est morte. |
| `POST`  | `/auth/logout`   | Nettoie les cookies. Renvoie JSON (XHR) ou redirige vers Keycloak end-session. |
| `GET`   | `/auth/me`       | Lit le cookie d'accès via le middleware Cookie→Bearer, renvoie le profil. |
| `POST`  | `/auth/register` | Création d'utilisateur Keycloak (Admin API). Inchangé.               |

## Pourquoi un `CookieToBearerMiddleware` ?

Le gateway utilise déjà :
- `services.AddAuthentication().AddJwtBearer(...)` qui valide le JWT lu
  dans l'en-tête `Authorization: Bearer`,
- `[Authorize]` sur `/auth/me`,
- du proxy "à la main" qui transmet le bearer aux services internes.

Le frontend, lui, n'envoie plus de header `Authorization`. Pour ne pas
dupliquer la logique de validation, on glisse un middleware tout en
amont du pipeline :

```csharp
app.UseMiddleware<CookieToBearerMiddleware>();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
```

Si le cookie `maestro_access_token` est présent et qu'il n'y a pas
déjà d'`Authorization` header, le middleware le copie sous la forme
`Authorization: Bearer <cookie>`. Le reste du pipeline ne voit
aucune différence.

## Variables d'environnement ajoutées

```bash
KEYCLOAK_PUBLIC_URL=http://localhost:8080   # accessible par le navigateur
GATEWAY_PUBLIC_URL=http://localhost:5000    # redirect_uri OIDC chez Keycloak
FRONTEND_URL=http://localhost:5173          # post-login + post-logout
```

`KEYCLOAK_PUBLIC_URL` est nécessaire car en docker-compose, le
gateway joint Keycloak via `http://keycloak:8080` mais le navigateur
de l'utilisateur final doit utiliser `http://localhost:8080`. Le code
fait la traduction automatiquement.

## Configuration Keycloak à faire

Sur le client **`maestro-api-gateway`** (confidentiel) dans la console
Keycloak :

1. **Valid redirect URIs** doit contenir : `http://localhost:5000/auth/callback`
2. **Valid post-logout redirect URIs** : `http://localhost:5173/*`
3. **Web origins** : `http://localhost:5000` (ou `+` pour tout
   autoriser parmi les redirect URIs)
4. **Client authentication** : ON (confidentiel)
5. **Standard flow** : ON

Le client public `maestro-frontend` n'est plus utilisé par cette
application — il peut être désactivé (mais on le laisse exister pour
ne rien casser d'autre).

## Côté frontend

Tout ce qui touchait au PKCE / au stockage de tokens a été retiré ou
neutralisé :

| Fichier                                       | Action                                             |
|-----------------------------------------------|----------------------------------------------------|
| `features/auth/authStorage.js`                | Stub — toutes les fonctions sont des no-ops.       |
| `features/auth/authHelpers.js`                | Plus de PKCE. `redirectToKeycloakLogin()` redirige vers `/auth/login` du gateway. |
| `features/auth/authConfig.js`                 | Supprimé.                                          |
| `services/authService.js`                     | Réécrit. `redirectToGatewayLogin()`, `getMe()` (cookie), `refreshAccessToken()`, `logout()`. `exchangeCode` reste comme no-op. |
| `services/api.js`                             | `withCredentials: true`, plus d'intercepteur `Authorization`. Refresh-on-401 ajouté. |
| `pages/Auth/LoginPage.jsx`                    | Bouton → `window.location.href = ${gateway}/auth/login`. |
| `pages/Auth/AuthCallbackPage.jsx`             | Page défensive : ping `/auth/me`, redirige vers `/workspace/projects` ou `/auth/login`. |
| `app/router/AppRouter.jsx`                    | `ProtectedRoute` utilise `getMe()` à la place de `getAccessToken()`. Racine `/` redirige désormais vers `/workspace/projects`. |
| `components/Sidebar/Sidebar.jsx`              | `getMe()` sans paramètre.                          |
| `pages/Auth/RegisterPage.jsx`                 | Inchangé : importe `redirectToKeycloakLogin` qui passe maintenant par le shim. |

## Vérification rapide

```bash
# 1) Plus aucun token dans le navigateur :
#    F12 → Application → Local Storage : aucune clé maestro_*
#    F12 → Application → Cookies         : maestro_access_token (HttpOnly ✓)

# 2) Auth de bout en bout :
#    - http://localhost:5173 → redirige vers /workspace/projects
#    - non auth → redirige vers /auth/login
#    - clic "Se connecter" → URL devient http://localhost:8080/realms/maestro/...
#    - login Keycloak → revient sur http://localhost:5173/workspace/projects
#    - F12 Network : la requête /api/projects part avec les cookies
#      mais sans Authorization en clair côté frontend.

# 3) /auth/me en cookie :
curl -i -b "maestro_access_token=<copie depuis le navigateur>" \
     http://localhost:5000/auth/me
```

## Limitations connues (non bloquantes)

- Le code n'a **pas été compilé** dans cet environnement (pas de SDK
  .NET disponible). Lancez `dotnet build` sur `services/ApiGateway`
  avant le premier `docker compose up`.
- Le client public `maestro-frontend` et la variable
  `KEYCLOAK_FRONTEND_REDIRECT_URI` ne sont plus utilisés mais ont été
  laissés en place pour ne rien casser ailleurs.
- L'ancienne route frontend `/auth/callback` n'est plus utilisée par
  Keycloak ; elle reste comme garde-fou (page défensive qui redirige).
- En **production** (HTTPS), `SameSite=None` est utilisé pour
  les cookies. Vérifiez que le frontend et le gateway sont servis en
  HTTPS — sinon les navigateurs récents refuseront les cookies
  cross-site.
