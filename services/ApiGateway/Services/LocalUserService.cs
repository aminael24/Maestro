using ApiGateway.Data;
using ApiGateway.Models;
using Microsoft.EntityFrameworkCore;

namespace ApiGateway.Services;

public class LocalUserService
{
    private readonly AppDbContext _dbContext;

    public LocalUserService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<LocalUser> CreateAsync(
        string keycloakId,
        RegisterRequest request,
        string? profileUrl,
        CancellationToken cancellationToken = default)
    {
        var user = new LocalUser
        {
            KeycloakId = keycloakId,
            ProfileUrl = profileUrl
        };

        // ⚠️ utiliser le bon DbSet
        _dbContext.Users.Add(user);

        await _dbContext.SaveChangesAsync(cancellationToken);

        return user;
    }

    public async Task<LocalUser?> GetByKeycloakIdAsync(
        string keycloakId,
        CancellationToken cancellationToken = default)
    {
        return await _dbContext.Users.FirstOrDefaultAsync(
            x => x.KeycloakId == keycloakId,
            cancellationToken);
    }
}