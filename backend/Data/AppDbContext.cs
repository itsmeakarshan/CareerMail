using CareerMail.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace CareerMail.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<ConnectedAccount> ConnectedAccounts => Set<ConnectedAccount>();
    public DbSet<JobApplication> JobApplications => Set<JobApplication>();
    public DbSet<TimelineEvent> TimelineEvents => Set<TimelineEvent>();
    public DbSet<Email> Emails => Set<Email>();
    public DbSet<Interview> Interviews => Set<Interview>();
    public DbSet<FollowUp> FollowUps => Set<FollowUp>();
    public DbSet<CvProfile> CvProfiles => Set<CvProfile>();
    public DbSet<SavedJobListing> SavedJobListings => Set<SavedJobListing>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
        });

        // ConnectedAccount
        modelBuilder.Entity<ConnectedAccount>(entity =>
        {
            entity.HasOne(ca => ca.User)
                .WithMany(u => u.ConnectedAccounts)
                .HasForeignKey(ca => ca.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // JobApplication
        modelBuilder.Entity<JobApplication>(entity =>
        {
            entity.HasOne(ja => ja.User)
                .WithMany(u => u.JobApplications)
                .HasForeignKey(ja => ja.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.Priority).HasConversion<string>();
            entity.Property(e => e.RecruiterType).HasConversion<string>();
        });

        // TimelineEvent
        modelBuilder.Entity<TimelineEvent>(entity =>
        {
            entity.HasOne(te => te.JobApplication)
                .WithMany(ja => ja.TimelineEvents)
                .HasForeignKey(te => te.JobApplicationId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Email
        modelBuilder.Entity<Email>(entity =>
        {
            entity.HasOne(e => e.User)
                .WithMany(u => u.Emails)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.JobApplication)
                .WithMany(ja => ja.Emails)
                .HasForeignKey(e => e.JobApplicationId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.GmailMessageId);

            entity.Property(e => e.Folder).HasConversion<string>();
            entity.Property(e => e.Classification).HasConversion<string>();
            entity.Property(e => e.DetectedRecruiterType).HasConversion<string>();
        });

        // Interview
        modelBuilder.Entity<Interview>(entity =>
        {
            entity.HasOne(i => i.User)
                .WithMany(u => u.Interviews)
                .HasForeignKey(i => i.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(i => i.JobApplication)
                .WithMany(ja => ja.Interviews)
                .HasForeignKey(i => i.JobApplicationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.Status).HasConversion<string>();
        });

        // FollowUp
        modelBuilder.Entity<FollowUp>(entity =>
        {
            entity.HasOne(f => f.User)
                .WithMany(u => u.FollowUps)
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(f => f.JobApplication)
                .WithMany(ja => ja.FollowUps)
                .HasForeignKey(f => f.JobApplicationId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.Status).HasConversion<string>();
        });
    }
}
