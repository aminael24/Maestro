# Configuration Keycloak — Maestro

Ce document explique tout ce qu'il faut configurer dans la console
Keycloak pour activer :

  1. Login standard (username + mot de passe)
  2. Login Google
  3. Login GitHub
  4. Forgot password (email de reset)
  5. Logout COMPLET (révocation de session)

> Console Keycloak : http://localhost:8080
> Admin : `admin` / `admin123` (selon ton `.env`)
> Realm cible : `maestro`

---

## 1. Client `maestro-api-gateway` (à vérifier)

Dans **Clients → maestro-api-gateway** :

| Champ                              | Valeur                                          |
|------------------------------------|-------------------------------------------------|
| Client ID                          | `maestro-api-gateway`                           |
| Client authentication              | **ON** (confidentiel)                           |
| Standard flow                      | **ON**                                          |
| Direct access grants               | OFF                                             |
| Service accounts roles             | **ON** (besoin pour Admin API)                  |
| Valid redirect URIs                | `http://localhost:5000/auth/callback`           |
| Valid post-logout redirect URIs    | `http://localhost:5173/*`                       |
| Web origins                        | `+`                                             |

Sous-onglet **Credentials** : copier le **Client secret** dans
`KEYCLOAK_CLIENT_SECRET` du `.env`.

Sous-onglet **Service accounts roles** :
  - Cliquer **Assign role**
  - Filter by clients → `realm-management`
  - Cocher : `manage-users`, `query-users`, `view-users`

⚠️ **Sans ces 3 rôles**, le gateway ne peut PAS créer de user, ni
envoyer de mail de reset.

---

## 2. SMTP du realm (pour le forgot password)

Sans SMTP configuré, **aucun email ne part**. C'est le pré-requis
absolu du forgot password.

**Realm settings → Email** :

| Champ                     | Valeur exemple (Gmail)                        |
|---------------------------|-----------------------------------------------|
| From                      | `noreply@maestro.local`                       |
| From display name         | `Maestro`                                     |
| Host                      | `smtp.gmail.com`                              |
| Port                      | `587`                                         |
| Encryption                | **Enable StartTLS**                           |
| Authentication            | **Enabled**                                   |
| Username                  | ton adresse Gmail                             |
| Password                  | un App Password (PAS le mot de passe normal)  |

> Pour Gmail : générer un **App Password** depuis
> https://myaccount.google.com/apppasswords. Le mot de passe normal
> est refusé par Google.

Cliquer **Test connection** pour vérifier.

> En dev local, tu peux utiliser **MailHog** : ajouter le service
> `mailhog/mailhog` dans docker-compose, puis dans Keycloak mettre
> `Host=mailhog`, `Port=1025`, sans auth ni TLS. Tu vois tous les
> emails dans une UI web sans rien envoyer pour de vrai.

---

## 3. Identity Provider Google

### Étape 1 — Créer une OAuth App dans Google Cloud Console

1. Aller sur https://console.cloud.google.com/apis/credentials
2. **Create Credentials → OAuth client ID**
3. Application type : **Web application**
4. Name : `Maestro` (ou autre)
5. **Authorized redirect URIs** :
   ```
   http://localhost:8080/realms/maestro/broker/google/endpoint
   ```
   ⚠️ L'alias `google` dans l'URL DOIT correspondre EXACTEMENT à
   l'alias que tu mettras dans Keycloak à l'étape 2.
6. Save → Google donne un **Client ID** et un **Client Secret**

### Étape 2 — Configurer dans Keycloak

Console Keycloak → **Identity providers → Add provider → Google** :

| Champ                  | Valeur                                |
|------------------------|---------------------------------------|
| Alias                  | `google` (⚠️ exactement)              |
| Display name           | `Google`                              |
| Client ID              | (depuis Google Cloud)                 |
| Client Secret          | (depuis Google Cloud)                 |
| Default scopes         | `openid profile email`                |
| Trust email            | **ON** (Google vérifie déjà l'email)  |

Save.

### Étape 3 — Tester

`http://localhost:5173/auth/login` → clic "Continuer avec Google"
→ frontend redirige vers `http://localhost:5000/auth/login/google`
→ gateway ajoute `?kc_idp_hint=google` à l'URL d'autorisation
→ Keycloak shunte sa page de login et envoie direct chez Google.

---

## 4. Identity Provider GitHub

### Étape 1 — Créer une OAuth App sur GitHub

1. Aller sur https://github.com/settings/developers
2. **New OAuth App**
3. Application name : `Maestro`
4. Homepage URL : `http://localhost:5173`
5. **Authorization callback URL** :
   ```
   http://localhost:8080/realms/maestro/broker/github/endpoint
   ```
6. Register application → GitHub donne un **Client ID** et un
   **Client Secret**

### Étape 2 — Configurer dans Keycloak

Console Keycloak → **Identity providers → Add provider → GitHub** :

| Champ                  | Valeur                                |
|------------------------|---------------------------------------|
| Alias                  | `github` (⚠️ exactement)              |
| Display name           | `GitHub`                              |
| Client ID              | (depuis GitHub)                       |
| Client Secret          | (depuis GitHub)                       |
| Default scopes         | `read:user user:email`                |
| Trust email            | **ON**                                |

Save.

⚠️ Avec le scope `user:email`, GitHub renvoie l'email principal même
s'il est privé. Tester avec un compte qui a un email vérifié.

---

## 5. Durées de session (Realm settings → Tokens)

| Réglage                      | Valeur recommandée |
|------------------------------|--------------------|
| Default Signature Algorithm  | `RS256`            |
| SSO Session Idle             | `30 Minutes`       |
| SSO Session Max              | `10 Hours`         |
| Access Token Lifespan        | `5 Minutes`        |
| Refresh Token Max Reuse      | `0`                |

Le forgot-password code passe `lifespan=43200` (12h) au mail de reset.

---

## 6. Vérifier le logout COMPLET

Quand l'utilisateur clique le bouton ↪ dans la sidebar :

1. Frontend POST `/auth/logout` au gateway.
2. Gateway POST `/protocol/openid-connect/logout` à Keycloak avec le
   `refresh_token` → **Keycloak invalide la session côté serveur**
   (back-channel logout).
3. Gateway clear les cookies `maestro_*`.
4. Gateway renvoie `{ logoutUrl: "http://localhost:8080/realms/.../logout?id_token_hint=..." }`.
5. Frontend redirige le navigateur vers cette URL → **Keycloak clear
   ses cookies SSO côté navigateur** (`AUTH_SESSION_ID`, `KEYCLOAK_IDENTITY`).
6. Keycloak redirige vers `/auth/login`.

**Pour vérifier** :
  - Après logout, DevTools → Application → Cookies sur `localhost:8080`
    et `localhost:5000` : tous les cookies de session ont disparu.
  - Aller sur `/workspace/dashboard` : redirection vers `/auth/login`.
  - Cliquer "Se connecter" : tu retombes sur le formulaire Keycloak
    (pas un re-login silencieux qui auto-loggue).

---

## 7. Variables d'environnement (.env)

```bash
# Keycloak interne (URL utilisée par le gateway côté docker)
KEYCLOAK_REALM_URL=http://keycloak:8080/realms/maestro
KEYCLOAK_TOKEN_ENDPOINT=http://keycloak:8080/realms/maestro/protocol/openid-connect/token

# Keycloak public (URL utilisée par le navigateur de l'utilisateur)
KEYCLOAK_PUBLIC_URL=http://localhost:8080

# Gateway et frontend publics
GATEWAY_PUBLIC_URL=http://localhost:5000
FRONTEND_URL=http://localhost:5173

# Client confidentiel maestro-api-gateway
KEYCLOAK_CLIENT_ID=maestro-api-gateway
KEYCLOAK_CLIENT_SECRET=<secret-copié-depuis-keycloak>

# Compte admin Keycloak (pour Admin API : create user, send reset email)
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=admin123
KEYCLOAK_ADMIN_CLIENT_ID=admin-cli
KEYCLOAK_ADMIN_TOKEN_ENDPOINT=http://keycloak:8080/realms/master/protocol/openid-connect/token
KEYCLOAK_ADMIN_API_BASE_URL=http://keycloak:8080/admin/realms/maestro
```

---

## 8. Tests bout-en-bout

| Action                      | Résultat attendu                                                                                          |
|-----------------------------|------------------------------------------------------------------------------------------------------------|
| Login standard              | `/auth/login` → bouton "Se connecter" → page Keycloak → `/workspace/dashboard`                             |
| Login Google                | `/auth/login` → "Continuer avec Google" → consent Google → `/workspace/dashboard`. LocalUser auto-créé.   |
| Login GitHub                | `/auth/login` → "Continuer avec GitHub" → consent GitHub → `/workspace/dashboard`. LocalUser auto-créé.   |
| Forgot password             | `/auth/forgot-password` → email saisi → message générique. Email reçu (si SMTP OK).                        |
| Reset password depuis email | Clic lien → page Keycloak "New password" → après validation → `/auth/callback`                             |
| Logout                      | Sidebar bouton ↪ → cookies `maestro_*` clear, cookies Keycloak clear, retour sur `/auth/login`             |
| Logout puis Login           | Le re-login N'EST PAS silencieux : on retombe sur la page de login Keycloak (pas auto-loggué).             |
