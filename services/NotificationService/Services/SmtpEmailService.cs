using System.Net;
using System.Net.Mail;
using NotificationService.Models;

namespace NotificationService.Services;


public class SmtpEmailService : IEmailService
{
    private readonly ILogger<SmtpEmailService> _logger;

    // ── SMTP settings (injected at runtime via env vars) ──────────────────
    private static string SmtpHost     => Env("SMTP_HOST",     "smtp.gmail.com");
    private static int    SmtpPort     => int.Parse(Env("SMTP_PORT", "587"));
    private static string SmtpUser     => Env("SMTP_USERNAME", "");
    private static string SmtpPass     => Env("SMTP_PASSWORD", "");
    private static string FromAddress  => Env("EMAIL_FROM",    "noreply@maestro.app");
    private static string FromName     => Env("EMAIL_FROM_NAME", "Maestro");
    private static string AppUrl       => Env("APP_URL",       "https://maestro.app");

    public SmtpEmailService(ILogger<SmtpEmailService> logger) => _logger = logger;

    public async Task SendWelcomeEmailAsync(UserRegisteredEvent evt, CancellationToken ct = default)
    {
        using var client = BuildSmtpClient();

        var body = BuildWelcomeHtml(evt);

        using var mail = new MailMessage
        {
            From       = new MailAddress(FromAddress, FromName),
            Subject    = $"Welcome to Maestro, {evt.FirstName}! 🎉",
            Body       = body,
            IsBodyHtml = true
        };
        mail.To.Add(new MailAddress(evt.Email, $"{evt.FirstName} {evt.LastName}"));

        await client.SendMailAsync(mail, ct);
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private static SmtpClient BuildSmtpClient() =>
        new(SmtpHost, SmtpPort)
        {
            Credentials    = new NetworkCredential(SmtpUser, SmtpPass),
            EnableSsl = true,
            UseDefaultCredentials = false,  
            DeliveryMethod = SmtpDeliveryMethod.Network
        };

private static string BuildWelcomeHtml(UserRegisteredEvent evt) => $"""
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome to Maestro</title>
</head>

<body style="
    margin:0;
    padding:0;
    background:#041e2a;
    font-family:Segoe UI,sans-serif;
">

<table width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:60px 20px;">

<table width="620" cellpadding="0" cellspacing="0" style="
    background:#083A4F;
    border-radius:28px;
    overflow:hidden;
    border:1px solid rgba(192,213,214,0.12);
">

<!-- HERO -->
<tr>
<td style="
    padding:60px 50px 40px;
    text-align:center;
    background:
      radial-gradient(circle at top right,#407E8C55,transparent 40%),
      radial-gradient(circle at bottom left,#A58D6640,transparent 35%),
      #083A4F;
">

<div style="
    font-size:14px;
    letter-spacing:4px;
    color:#C0D5D6;
    text-transform:uppercase;
    margin-bottom:18px;
">
MAESTRO AI PLATFORM
</div>

<h1 style="
    color:white;
    font-size:42px;
    line-height:1.1;
    margin:0;
    font-weight:800;
">
Welcome,<br>
<span style="color:#A58D66;">
{evt.FirstName}
</span>
</h1>

<p style="
    color:#C0D5D6;
    font-size:16px;
    line-height:1.8;
    margin-top:28px;
">
Your workspace is ready.<br>
Describe an idea. Maestro generates the architecture,
backend, frontend and deployment pipeline automatically.
</p>

<a href="{AppUrl}/dashboard"
style="
    display:inline-block;
    margin-top:34px;
    background:linear-gradient(135deg,#A58D66,#c4aa80);
    color:#041e2a;
    text-decoration:none;
    padding:16px 34px;
    border-radius:14px;
    font-weight:700;
    font-size:15px;
">
Launch Workspace →
</a>

</td>
</tr>

<!-- FEATURES -->
<tr>
<td style="padding:38px 50px; background:#062c3d;">

<table width="100%">
<tr>

<td align="center">
<div style="font-size:28px;">⚡</div>
<p style="color:white;font-weight:700;margin:12px 0 6px;">
AI Generation
</p>
<p style="color:#9fb5bb;font-size:13px;margin:0;">
Full-stack projects instantly
</p>
</td>

<td align="center">
<div style="font-size:28px;">🔐</div>
<p style="color:white;font-weight:700;margin:12px 0 6px;">
Secure Auth
</p>
<p style="color:#9fb5bb;font-size:13px;margin:0;">
Keycloak + JWT architecture
</p>
</td>

<td align="center">
<div style="font-size:28px;">🚀</div>
<p style="color:white;font-weight:700;margin:12px 0 6px;">
Deploy Fast
</p>
<p style="color:#9fb5bb;font-size:13px;margin:0;">
Docker-powered delivery
</p>
</td>

</tr>
</table>

</td>
</tr>

<!-- FOOTER -->
<tr>
<td style="
    padding:26px;
    text-align:center;
    background:#041e2a;
">

<p style="
    color:#6f8790;
    font-size:13px;
    margin:0;
">
Maestro © {DateTime.UtcNow.Year}
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
""";

    private static string Env(string key, string fallback) =>
        Environment.GetEnvironmentVariable(key) ?? fallback;
}
