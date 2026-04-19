using Maestro.WorkspaceService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Maestro.WorkspaceService.Infrastructure.Persistence;

public class WorkspaceDbContext : DbContext
{
    public WorkspaceDbContext(DbContextOptions<WorkspaceDbContext> options) : base(options) { }
    
    public DbSet<Project> Projects => Set<Project>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Force explicit lowercase table naming to avoid "Relation Projects does not exist"
        modelBuilder.Entity<Project>().ToTable("projects");
        base.OnModelCreating(modelBuilder);
    }
}
