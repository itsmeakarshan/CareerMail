using CareerMail.Api.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace CareerMail.Api.Data;

public static class DataInitializer
{
    public static async Task InitializeAsync(AppDbContext context)
    {
        // Automatically ensure database schema is created
        await context.Database.EnsureCreatedAsync();

        // Seed demo user if not present
        if (!await context.Users.AnyAsync(u => u.Email == "arjun.sharma@email.com"))
        {
            var user = new User
            {
                Name = "Arjun Sharma",
                Email = "arjun.sharma@email.com",
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
