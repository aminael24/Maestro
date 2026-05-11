<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Maestro — Réinitialiser le mot de passe</title>
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
      <h2 class="reset-title">Mot de passe oublié ?</h2>
      <p class="reset-subtitle">Entrez votre adresse email pour recevoir un lien de réinitialisation.</p>
    </div>

    <#if message?has_content && (message.type = 'error' || message.type = 'warning')>
      <div class="maestro-alert maestro-alert-error">
        ${kcSanitize(message.summary)?no_esc}
      </div>
    </#if>

    <#-- ═══ Message de succès en français — bypass i18n Keycloak ═══
         On ignore le texte fourni par Keycloak (souvent en anglais)
         et on affiche notre propre message FR en dur, peu importe
         la locale du navigateur ou la config du realm. -->
    <#if message?has_content && message.type = 'success'>
      <div class="maestro-alert maestro-alert-success">
        Vous allez recevoir un email avec les instructions pour réinitialiser votre mot de passe.
      </div>
    </#if>

    <form id="kc-reset-password-form" action="${url.loginAction}" method="post">
      <div class="form-group">
        <label for="username">Email</label>
        <div class="input-wrap">
          <span class="input-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--aqua);">
              <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
          </span>
          <input id="username" name="username" type="text" autocomplete="username" autofocus placeholder="ingenieur@devsecops.ma" />
        </div>
      </div>

      <button class="submit-btn" type="submit">Envoyer le lien</button>

      <div class="footer-link">
        <a href="${url.loginUrl}">← Retour à la connexion</a>
      </div>
    </form>

    <#-- ═══ Identity Providers (alternative au reset) ═══ -->
    <#if realm.password && social.providers?? && social.providers?has_content>
      <div class="social-divider">
        <span class="social-divider-line"></span>
        <span class="social-divider-text">ou connectez-vous avec</span>
        <span class="social-divider-line"></span>
      </div>

      <div class="social-providers">
        <#list social.providers as p>
          <a class="social-btn social-btn--${p.alias}"
             href="${p.loginUrl}"
             aria-label="Continuer avec ${p.displayName!p.alias}">
            <#if p.alias == "google">
              <svg class="social-icon" width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
              </svg>
              <span>Continuer avec Google</span>
            <#elseif p.alias == "github">
              <svg class="social-icon" width="18" height="18" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.6.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>Continuer avec GitHub</span>
            <#else>
              <span>Continuer avec ${p.displayName!p.alias}</span>
            </#if>
          </a>
        </#list>
      </div>
    </#if>
  </div>
</div>

</body>
</html>
