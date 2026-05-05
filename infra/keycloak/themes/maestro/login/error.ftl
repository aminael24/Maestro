<#-- Maestro – Keycloak Error Page -->
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Maestro – Erreur</title>
    <link rel="stylesheet" href="${url.resourcesPath}/css/styles.css" />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body class="maestro-body">
    <div class="maestro-bg-gradient"></div>

    <div class="maestro-center-layout">
        <div class="maestro-card maestro-card-narrow">
            <div class="maestro-error-icon">✕</div>
            <h2 class="maestro-card-title">Une erreur est survenue</h2>

            <#if message?has_content>
                <div class="maestro-alert maestro-alert-error">
                    ${kcSanitize(message.summary)?no_esc}
                </div>
            </#if>

            <div class="maestro-actions" style="margin-top: 24px;">
                <a href="${url.loginUrl}" class="maestro-btn-primary maestro-btn-link">
                    Retour à la connexion
                </a>
            </div>
        </div>
    </div>
</body>
</html>
