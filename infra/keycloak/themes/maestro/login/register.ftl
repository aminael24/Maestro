<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Maestro — Créer un compte</title>
    <link rel="stylesheet" href="${url.resourcesPath}/css/styles.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
</head>
<body>

<!-- ═══ Back to home ═══ -->
<a href="/" class="back-home">
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

<!-- ═══ Register Card ═══ -->
<div class="login-container">
  <div class="login-card">
    <div class="brand">
      <div class="brand-icon">
        <img src="${url.resourcesPath}/img/maestro-logo.svg" alt="Maestro logo" />
      </div>
      <h1>DevSecOps</h1>
      <p>Plateforme Microservices</p>
    </div>

    <div class="tabs">
      <a class="tab tab-link" href="${url.loginUrl}">Connexion</a>
      <button class="tab active" type="button">Créer un compte</button>
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

    <form id="kc-register-form" action="${url.registrationAction}" method="post">

      <div class="form-row">
        <div class="form-group form-group--half">
          <label for="firstName">Prénom</label>
          <div class="input-wrap">
            <span class="input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--aqua);">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <input
              id="firstName"
              name="firstName"
              type="text"
              value="${(register.formData.firstName!'')}"
              placeholder="Prénom"
            />
          </div>
        </div>

        <div class="form-group form-group--half">
          <label for="lastName">Nom</label>
          <div class="input-wrap">
            <span class="input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--aqua);">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </span>
            <input
              id="lastName"
              name="lastName"
              type="text"
              value="${(register.formData.lastName!'')}"
              placeholder="Nom"
            />
          </div>
        </div>
      </div>

      <div class="form-group">
        <label for="email">Email</label>
        <div class="input-wrap">
          <span class="input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--aqua);">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </span>
          <input
            id="email"
            name="email"
            type="email"
            value="${(register.formData.email!'')}"
            autocomplete="email"
            placeholder="ingenieur@devsecops.ma"
          />
        </div>
      </div>

      <#if !realm.registrationEmailAsUsername>
        <div class="form-group">
          <label for="username">Nom d'utilisateur</label>
          <div class="input-wrap">
            <span class="input-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--aqua);">
                <circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2m-7.07-3.93 1.41-1.41m12.02-12.02 1.41-1.41M1 12h2m18 0h2m-3.93 7.07-1.41-1.41M4.34 4.34 2.93 2.93"/>
              </svg>
            </span>
            <input
              id="username"
              name="username"
              type="text"
              value="${(register.formData.username!'')}"
              autocomplete="username"
              placeholder="nom.utilisateur"
            />
          </div>
        </div>
      </#if>

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
            autocomplete="new-password"
            placeholder="••••••••••"
          />
        </div>
      </div>

      <div class="form-group">
        <label for="password-confirm">Confirmer le mot de passe</label>
        <div class="input-wrap">
          <span class="input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--aqua);">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </span>
          <input
            id="password-confirm"
            name="password-confirm"
            type="password"
            autocomplete="new-password"
            placeholder="••••••••••"
          />
        </div>
      </div>

      <#if recaptchaRequired??>
        <div class="form-group">
          <div class="g-recaptcha" data-size="compact" data-sitekey="${recaptchaSiteKey}"></div>
        </div>
      </#if>

      <button class="submit-btn" type="submit">Créer mon compte</button>

      <div class="footer-link">
        Déjà un compte ? <a href="${url.loginUrl}">Se connecter</a>
      </div>
    </form>
  </div>
</div>

</body>
</html>
