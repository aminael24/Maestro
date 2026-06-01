using ApiGateway.Models;

namespace ApiGateway.Services;

public class RegisterService
{
    private readonly KeycloakService _keycloakService;
    private readonly LocalUserService _localUserService;
    private readonly ProfileImageService _profileImageService;

    public RegisterService(
        KeycloakService keycloakService,
        LocalUserService localUserService,
        ProfileImageService profileImageService)
    {
        _keycloakService = keycloakService;
        _localUserService = localUserService;
        _profileImageService = profileImageService;
    }

    public virtual async Task<object> RegisterAsync(RegisterRequest request, CancellationToken cancellationToken = default)
    {
        string? keycloakId = null;

        try
        {
            keycloakId = await _keycloakService.CreateUserAsync(request, cancellationToken);

            var profileUrl = await _profileImageService.SaveProfilePhotoAsync(
                request.ProfilePhoto,
                cancellationToken);

            var localUser = await _localUserService.CreateAsync(
                keycloakId,
                request,
                profileUrl,
                cancellationToken);

            return new
            {
                message = "Compte créé avec succès",
                localUser.Id,
                localUser.KeycloakId,
                localUser.ProfileUrl
            };
        }
        catch
        {
            if (!string.IsNullOrWhiteSpace(keycloakId))
            {
                try
                {
                    await _keycloakService.DeleteUserAsync(keycloakId, cancellationToken);
                }
                catch
                {
                    // rollback best effort
                }
            }

            throw;
        }
    }
}