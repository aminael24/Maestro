using Maestro.WorkspaceService.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Maestro.WorkspaceService.Infrastructure.Persistence;

public class WorkspaceDbContext : DbContext
{
    public WorkspaceDbContext(DbContextOptions<WorkspaceDbContext> options) : base(options) { }
    
    public DbSet<Project> Projects => Set<Project>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Force explicit lowercase naming to avoid case-sensitivity issues in PostgreSQL
        modelBuilder.Entity<Project>().ToTable("projects");
        
        foreach (var entity in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entity.GetProperties())
            {
                property.SetColumnName(property.Name.ToLowerInvariant());
            }
        }

        base.OnModelCreating(modelBuilder);
    }
}
