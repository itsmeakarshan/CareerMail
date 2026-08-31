using CareerMail.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace CareerMail.Api.Data;

public static class DataInitializer
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        // Automatically ensure database schema is created
        await context.Database.EnsureCreatedAsync();

        try
        {
            await context.Database.ExecuteSqlRawAsync("ALTER TABLE users ADD COLUMN IF NOT EXISTS gemini_api_key TEXT;");
        }
        catch
        {
            // Ignore if column already exists or in-memory DB
        }

        // Seed or update demo user
        var demoUser = await context.Users.FirstOrDefaultAsync(u => u.Email == "akarshan@email.com" || u.Email == "arjun.sharma@email.com");
        if (demoUser != null)
        {
            demoUser.Name = "Akarshan";
            demoUser.Email = "akarshan@email.com";
            await context.SaveChangesAsync();
        }
        else
        {
            var user = new User
            {
                Name = "Akarshan",
                Email = "akarshan@email.com",
                Password = BCrypt.Net.BCrypt.HashPassword("password123"),
                AvatarUrl = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            context.Users.Add(user);
            await context.SaveChangesAsync();
        }
    }
}
