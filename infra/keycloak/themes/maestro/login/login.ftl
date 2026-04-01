<#-- ═══════════════════════════════════════════════════════
     Maestro – Keycloak Login Template
     Thème sombre / dégradé violet-bleu, cohérent avec le frontend React.
     ═══════════════════════════════════════════════════════ -->
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Maestro – Connexion</title>
    <link rel="stylesheet" href="${url.resourcesPath}/css/styles.css" />
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body class="maestro-body">

    <div class="maestro-bg-gradient"></div>

    <div class="maestro-layout">

        <#-- ── Branding gauche ────────────────────────────── -->
        <div class="maestro-branding">
            <div class="maestro-logo-circle">
                <span class="maestro-logo-letter">M</span>
            </div>
            <h1 class="maestro-brand-title">Maestro</h1>
            <p class="maestro-brand-subtitle">
                Plateforme intelligente pour orchestrer vos projets,
                automatiser votre workflow DevOps et piloter votre workspace.
            </p>
            <p class="maestro-brand-hint">Authentification sécurisée via OIDC + PKCE</p>
        </div>

        <#-- ── Carte de connexion ─────────────────────────── -->
        <div class="maestro-card">
            <#if realm.password>
                <form id="kc-form-login" action="${url.loginAction}" method="post" autocomplete="on">
                    <h2 class="maestro-card-title">Connexion</h2>
                    <p class="maestro-card-subtitle">Bienvenue ! Connectez-vous à votre espace.</p>

                    <#-- ── Messages d'erreur Keycloak ─────── -->
                    <#if message?has_content && (message.type = 'error' || message.type = 'warning')>
                        <div class="maestro-alert maestro-alert-${message.type}">
                            ${kcSanitize(message.summary)?no_esc}
                        </div>
                    </#if>

                    <#if message?has_content && message.type = 'success'>
                        <div class="maestro-alert maestro-alert-success">
                            ${kcSanitize(message.summary)?no_esc}
                        </div>
                    </#if>

                    <div class="maestro-field">
                        <label for="username">Nom d'utilisateur ou email</label>
                        <input id="username" name="username" type="text"
                               autofocus autocomplete="username"
                               placeholder="john.doe@exemple.com"
                               <#if login.username??>value="${login.username}"</#if> />
                    </div>

                    <div class="maestro-field">
                        <label for="password">Mot de passe</label>
                        <input id="password" name="password" type="password"
                               autocomplete="current-password"
                               placeholder="••••••••" />
                    </div>

                    <div class="maestro-remember-row">
                        <#if realm.rememberMe>
                            <label class="maestro-checkbox-label">
                                <input type="checkbox" name="rememberMe"
                                       <#if login.rememberMe??>checked</#if> />
                                <span>Se souvenir de moi</span>
                            </label>
                        </#if>

                        <#if realm.resetPasswordAllowed>
                            <a href="${url.loginResetCredentialsUrl}" class="maestro-forgot-link">
                                Mot de passe oublié ?
                            </a>
                        </#if>
                    </div>

                    <div class="maestro-actions">
                        <button type="submit" class="maestro-btn-primary">Se connecter</button>
                    </div>

                    <#if realm.registrationAllowed>
                        <p class="maestro-register-text">
                            Pas encore de compte ?
                            <a href="${url.registrationUrl}" class="maestro-register-link">Créer un compte</a>
                        </p>
                    </#if>
                </form>
            </#if>
        </div>

    </div>

</body>
</html>
