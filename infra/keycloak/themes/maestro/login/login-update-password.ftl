<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Maestro — Nouveau mot de passe</title>
    <link rel="stylesheet" href="${url.resourcesPath}/css/styles.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet">
</head>
<body>

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
  <span class="particle particle--gold"></span><span class="particle particle--aqua"></span>
  <span class="particle particle--gold"></span><span class="particle particle--teal"></span>
  <span class="particle particle--gold"></span><span class="particle particle--aqua"></span>
  <span class="particle particle--gold"></span><span class="particle particle--teal"></span>
  <span class="particle particle--aqua"></span><span class="particle particle--gold"></span>
  <span class="particle particle--aqua"></span><span class="particle particle--gold"></span>
  <span class="particle particle--teal"></span><span class="particle particle--aqua"></span>
  <span class="particle particle--gold"></span><span class="particle particle--aqua"></span>
  <span class="particle particle--gold"></span><span class="particle particle--teal"></span>
  <span class="particle particle--gold"></span><span class="particle particle--aqua"></span>
  <span class="particle particle--gold"></span><span class="particle particle--aqua"></span>
  <span class="particle particle--teal"></span><span class="particle particle--gold"></span>
  <span class="particle particle--aqua"></span><span class="particle particle--gold"></span>
  <span class="particle particle--teal"></span><span class="particle particle--aqua"></span>
  <span class="particle particle--gold"></span><span class="particle particle--aqua"></span>
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

<div class="login-container">
  <div class="login-card">
    <div class="brand">
      <div class="brand-icon">
        <img src="${url.resourcesPath}/img/logo.png" alt="Maestro logo" />
      </div>
      <h1>DevSecOps</h1>
      <p>Plateforme Microservices</p>
    </div>

    <div class="reset-header">
      <h2 class="reset-title">Nouveau mot de passe</h2>
      <p class="reset-subtitle">Choisissez un nouveau mot de passe sécurisé pour votre compte.</p>
    </div>

    <#if message?has_content && (message.type = 'error' || message.type = 'warning')>
      <div class="maestro-alert maestro-alert-error">
        ${kcSanitize(message.summary)?no_esc}
      </div>
    </#if>

    <#-- ═══ Tous les autres messages (info, success) en français en dur
         pour ne PAS afficher "You need to change your password" en anglais ═══
         Keycloak peut envoyer un message de type 'info' avec ce texte
         qu'on remplace ici par notre version FR. -->
    <#if message?has_content && (message.type = 'success' || message.type = 'info')>
      <div class="maestro-alert maestro-alert-success">
        Vous devez définir un nouveau mot de passe pour activer votre compte.
      </div>
    </#if>

    <form id="kc-passwd-update-form" action="${url.loginAction}" method="post">
      <input type="text" id="username" name="username" value="${username}" autocomplete="username" readonly="readonly" style="display:none;" />

      <div class="form-group">
        <label for="password-new">Nouveau mot de passe</label>
        <div class="input-wrap">
          <span class="input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--aqua);">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </span>
          <input id="password-new" name="password-new" type="password" autocomplete="new-password" autofocus placeholder="••••••••••" />
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
          <input id="password-confirm" name="password-confirm" type="password" autocomplete="new-password" placeholder="••••••••••" />
        </div>
      </div>

      <#if isAppInitiatedAction??>
        <button class="submit-btn" type="submit">Enregistrer</button>
        <button class="submit-btn submit-btn--secondary" type="submit" name="cancel-aia" value="true">Ignorer</button>
      <#else>
        <button class="submit-btn" type="submit">Enregistrer le mot de passe</button>
      </#if>

      <div class="footer-link">
        <a href="${url.loginUrl}">← Retour à la connexion</a>
      </div>
    </form>
  </div>
</div>

</body>
</html>
