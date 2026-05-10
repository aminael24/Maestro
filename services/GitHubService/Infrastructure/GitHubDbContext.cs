using GitHubService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace GitHubService.Infrastructure;

public class GitHubDbContext : DbContext
{
    public GitHubDbContext(DbContextOptions<GitHubDbContext> options)
        : base(options)
    {
    }

    public DbSet<Repository> Repositories => Set<Repository>();
    public DbSet<GitHubConnection> GithubConnections => Set<GitHubConnection>();
    public DbSet<SyncOperation> SyncOperations => Set<SyncOperation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Repository>(entity =>
        {
            entity.ToTable("repositories");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").IsRequired();
            entity.Property(e => e.ProjectId).HasColumnName("project_id").IsRequired();
            entity.Property(e => e.Provider).HasColumnName("provider").HasMaxLength(50).IsRequired();
            entity.Property(e => e.RemoteUrl).HasColumnName("remote_url").IsRequired();
            entity.Property(e => e.LocalPath).HasColumnName("local_path").IsRequired();
            entity.Property(e => e.DefaultBranch).HasColumnName("default_branch").HasMaxLength(255).HasDefaultValue("main").IsRequired();
            entity.Property(e => e.IsInitialized).HasColumnName("is_initialized").HasDefaultValue(false).IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()").IsRequired();
        });

        modelBuilder.Entity<GitHubConnection>(entity =>
        {
            entity.ToTable("github_connections");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").IsRequired();
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.GitHubUserId).HasColumnName("github_user_id").IsRequired();
            entity.Property(e => e.GitHubUsername).HasColumnName("github_username").HasMaxLength(255);
            entity.Property(e => e.EncryptedAccessToken).HasColumnName("encrypted_access_token").IsRequired();
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()").IsRequired();
        });

        modelBuilder.Entity<SyncOperation>(entity =>
        {
            entity.ToTable("sync_operations");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").IsRequired();
            entity.Property(e => e.RepositoryId).HasColumnName("repository_id").IsRequired();
            entity.Property(e => e.BranchName).HasColumnName("branch_name").HasMaxLength(255).IsRequired();
            entity.Property(e => e.CommitSha).HasColumnName("commit_sha").HasMaxLength(255);
            entity.Property(e => e.Status).HasColumnName("status").HasMaxLength(50).IsRequired();
            entity.Property(e => e.Logs).HasColumnName("logs");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()").IsRequired();
            entity.Property(e => e.CompletedAt).HasColumnName("completed_at");

            entity.HasOne(e => e.Repository)
                .WithMany(r => r.SyncOperations)
                .HasForeignKey(e => e.RepositoryId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
