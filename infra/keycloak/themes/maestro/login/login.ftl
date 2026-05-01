<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Maestro — Connexion</title>
    <link rel="stylesheet" href="${url.resourcesPath}/css/styles.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
</head>
<body>

<!-- ═══ Back to home → React frontend home ═══ -->
<a href="http://localhost:5173/" class="back-home">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m15 18-6-6 6-6"/>
  </svg>
  Retour à l'accueil
</a>

<div class="bg"></div>
<div class="grid-overlay"></div>
<div class="scanline"></div>
<div class="orb orb-1"></div>
<div class="orb orb-2"></div>
<div class="orb orb-3"></div>

<!-- ═══ Particles ═══ -->
<div class="particles">
  <span class="particle particle--gold"></span>
  <span class="particle particle--aqua"></span>
  <span class="particle particle--gold"></span>
  <span class="particle particle--teal"></span>
  <span class="particle particle--gold"></span>
  <span class="particle particle--aqua"></span>
  <span class="particle particle--gold"></span>
  <span class="particle particle--teal"></span>
  <span class="particle particle--aqua"></span>
  <span class="particle particle--gold"></span>
  <span class="particle particle--aqua"></span>
  <span class="particle particle--gold"></span>
  <span class="particle particle--teal"></span>
  <span class="particle particle--aqua"></span>
  <span class="particle particle--gold"></span>
  <span class="particle particle--aqua"></span>
  <span class="particle particle--gold"></span>
  <span class="particle particle--teal"></span>
  <span class="particle particle--gold"></span>
  <span class="particle particle--aqua"></span>
  <span class="particle particle--gold"></span>
  <span class="particle particle--aqua"></span>
  <span class="particle particle--teal"></span>
  <span class="particle particle--gold"></span>
  <span class="particle particle--aqua"></span>
  <span class="particle particle--gold"></span>
  <span class="particle particle--teal"></span>
  <span class="particle particle--aqua"></span>
  <span class="particle particle--gold"></span>
  <span class="particle particle--aqua"></span>
</div>

<!-- ═══ Connection Lines ═══ -->
<div class="connection-lines">
  <svg viewBox="0 0 1920 1080" preserveAspectRatio="none">
    <line x1="150" y1="200" x2="350" y2="350" />
    <line x1="350" y1="350" x2="200" y2="520" />
    <line x1="200" y1="520" x2="120" y2="700" />
    <line x1="1600" y1="120" x2="1400" y2="280" />
    <line x1="1400" y1="280" x2="1550" y2="450" />
    <line x1="300" y1="150" x2="500" y2="300" />
    <line x1="1650" y1="400" x2="1500" y2="600" />
    <line x1="180" y1="680" x2="400" y2="800" />
    <line x1="1300" y1="700" x2="1550" y2="850" />
    <line x1="400" y1="800" x2="650" y2="880" />
  </svg>
</div>

<!-- ═══ Login Card ═══ -->
<div class="login-container">
  <div class="login-card">
    <div class="brand">
      <div class="brand-icon">
        <img src="${url.resourcesPath}/img/logo.png" alt="Maestro logo" />
      </div>
      <h1>Maestro</h1>
      <p>DevSecOps</p>
    </div>

    <div class="tabs">
      <button class="tab active" type="button">Connexion</button>
      <#if realm.registrationAllowed>
        <!-- ═══ "Créer un compte" → React register page ═══ -->
        <a class="tab tab-link" href="http://localhost:5173/auth/register">Créer un compte</a>
      <#else>
        <button class="tab" type="button" disabled>Créer un compte</button>
      </#if>
    </div>

    <#if message?has_content && (message.type = 'error' || message.type = 'warning')>
      <div class="maestro-alert maestro-alert-error">
        ${kcSanitize(message.summary)?no_esc}
      </div>
    </#if>

    <#if message?has_content && message.type = 'success'>
      <div class="maestro-alert maestro-alert-success">
        ${kcSanitize(message.summary)?no_esc}
      </div>
    </#if>

    <form id="kc-form-login" action="${url.loginAction}" method="post" autocomplete="on">
      <div class="form-group">
        <label for="username">Email</label>
        <div class="input-wrap">
          <span class="input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--aqua);">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </span>
          <input
            id="username"
            name="username"
            type="text"
            value="${(login.username!'')}"
            autocomplete="username"
            autofocus
            placeholder="ingenieur@devsecops.ma"
          />
        </div>
      </div>

      <div class="form-group">
        <label for="password">Mot de passe</label>
        <div class="input-wrap">
          <span class="input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--aqua);">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="current-password"
            placeholder="••••••••••"
          />
        </div>
      </div>

      <input type="hidden" id="id-hidden-input" name="credentialId" value="" />

      <#if realm.rememberMe>
        <div class="remember-row">
          <label class="checkbox-label">
            <input type="checkbox" name="rememberMe" <#if login.rememberMe??>checked</#if> />
            <span>Se souvenir de moi</span>
          </label>
        </div>
      </#if>

      <button class="submit-btn" type="submit" name="login">Se connecter</button>

      <div class="footer-link">
        Mot de passe oublié ? <a href="${url.loginResetCredentialsUrl}">Réinitialiser</a>
      </div>
    </form>
  </div>
</div>

</body>
</html>
