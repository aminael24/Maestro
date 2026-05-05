using ApiGateway.Models;
using Microsoft.EntityFrameworkCore;

namespace ApiGateway.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<LocalUser> Users => Set<LocalUser>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<LocalUser>(entity =>
        {
            entity.ToTable("users");

            entity.HasKey(x => x.Id);

            entity.Property(x => x.KeycloakId)
                .IsRequired()
                .HasMaxLength(100);

            entity.Property(x => x.ProfileUrl)
                .HasMaxLength(500);

            entity.HasIndex(x => x.KeycloakId).IsUnique();
        });
    }
}