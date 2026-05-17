using ApiGateway.Models;

namespace ApiGateway.Services;

public class ProfileImageService
{
    private readonly IWebHostEnvironment _environment;

    public ProfileImageService(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    public virtual async Task<string?> SaveProfilePhotoAsync(IFormFile? file, CancellationToken cancellationToken = default)
    {
        if (file is null || file.Length == 0)
            return null;

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".webp" };

        if (!allowedExtensions.Contains(extension))
            throw new InvalidOperationException("Format image non supporté. Utilise jpg, jpeg, png ou webp.");

        var uploadsRoot = Path.Combine(_environment.WebRootPath ?? "wwwroot", "uploads", "profiles");

        if (!Directory.Exists(uploadsRoot))
            Directory.CreateDirectory(uploadsRoot);

        var fileName = $"{Guid.NewGuid()}{extension}";
        var filePath = Path.Combine(uploadsRoot, fileName);

        await using var stream = new FileStream(filePath, FileMode.Create);
        await file.CopyToAsync(stream, cancellationToken);

        return $"/uploads/profiles/{fileName}";
    }
}