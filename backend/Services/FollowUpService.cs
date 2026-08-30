using System.Text.RegularExpressions;
using CareerMail.Api.Data;
using CareerMail.Api.Models.DTOs;
using CareerMail.Api.Models.Entities;
using CareerMail.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CareerMail.Api.Services;

public interface IFollowUpService
{
    Task<List<FollowUp>> GetAllFollowUpsAsync(long userId);
    Task<FollowUp> GetFollowUpByIdAsync(long userId, long id);
    Task<FollowUp> CreateFollowUpAsync(long userId, FollowUpRequest request);
    Task<FollowUp> UpdateFollowUpAsync(long userId, long id, FollowUpRequest request);
    Task DeleteFollowUpAsync(long userId, long id);
}

public class FollowUpService : IFollowUpService
{
    private readonly AppDbContext _context;

    public FollowUpService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<FollowUp>> GetAllFollowUpsAsync(long userId)
    {
        var list = await _context.FollowUps
            .Include(f => f.JobApplication)
            .Where(f => f.UserId == userId)
            .OrderBy(f => f.DueDate)
            .ToListAsync();

        list.ForEach(ComputeBadges);
        return list;
    }

    public async Task<FollowUp> GetFollowUpByIdAsync(long userId, long id)
    {
        var followUp = await _context.FollowUps
            .Include(f => f.JobApplication)
            .FirstOrDefaultAsync(f => f.Id == id && f.UserId == userId);

        if (followUp == null)
        {
            throw new ArgumentException($"Follow-up not found with ID: {id}");
        }

        ComputeBadges(followUp);
        return followUp;
    }

    public async Task<FollowUp> CreateFollowUpAsync(long userId, FollowUpRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Company)) throw new ArgumentException("Company is required");
        if (!request.DueDate.HasValue) throw new ArgumentException("Due date is required");

        var followUp = new FollowUp
        {
            UserId = userId,
            JobApplicationId = request.JobApplicationId,
            Company = request.Company.Trim(),
            Role = request.Role?.Trim(),
            DueDate = request.DueDate.Value,
            Notes = request.Notes?.Trim(),
            Status = FollowUpStatusExtensions.FromString(request.Status),
            CompanyLogo = !string.IsNullOrWhiteSpace(request.CompanyLogo)
                ? request.CompanyLogo.Trim()
                : Regex.Replace(request.Company.ToLowerInvariant(), "[^a-z0-9]", "")
        };

        if (request.JobApplicationId.HasValue)
        {
            var app = await _context.JobApplications.FirstOrDefaultAsync(ja => ja.Id == request.JobApplicationId.Value && ja.UserId == userId);
            if (app != null)
            {
                app.NextFollowUpDate = request.DueDate.Value;
                app.TimelineEvents.Add(new TimelineEvent
                {
                    Title = "Follow-up Scheduled",
                    Description = $"Follow-up set for {request.DueDate.Value}: {request.Notes ?? "Check on application status"}",
                    EventDate = DateTime.UtcNow,
                    EventType = "FOLLOW_UP"
                });
            }
        }

        ComputeBadges(followUp);
        _context.FollowUps.Add(followUp);
        await _context.SaveChangesAsync();

        return followUp;
    }

    public async Task<FollowUp> UpdateFollowUpAsync(long userId, long id, FollowUpRequest request)
    {
        var followUp = await GetFollowUpByIdAsync(userId, id);

        if (!string.IsNullOrWhiteSpace(request.Company)) followUp.Company = request.Company.Trim();
        if (request.Role != null) followUp.Role = request.Role.Trim();
        if (request.DueDate.HasValue) followUp.DueDate = request.DueDate.Value;
        if (request.Notes != null) followUp.Notes = request.Notes.Trim();
        if (!string.IsNullOrWhiteSpace(request.Status)) followUp.Status = FollowUpStatusExtensions.FromString(request.Status);
        if (!string.IsNullOrWhiteSpace(request.CompanyLogo)) followUp.CompanyLogo = request.CompanyLogo.Trim();
        if (request.JobApplicationId.HasValue) followUp.JobApplicationId = request.JobApplicationId.Value;

        ComputeBadges(followUp);
        await _context.SaveChangesAsync();
        return followUp;
    }

    public async Task DeleteFollowUpAsync(long userId, long id)
    {
        var followUp = await GetFollowUpByIdAsync(userId, id);
        _context.FollowUps.Remove(followUp);
        await _context.SaveChangesAsync();
    }

    private static void ComputeBadges(FollowUp followUp)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var daysUntilDue = followUp.DueDate.DayNumber - today.DayNumber;

        if (daysUntilDue < 0)
        {
            followUp.DaysDueBadge = $"Overdue by {Math.Abs(daysUntilDue)}d";
        }
        else if (daysUntilDue == 0)
        {
            followUp.DaysDueBadge = "Due today";
        }
        else if (daysUntilDue == 1)
        {
            followUp.DaysDueBadge = "Due in 1 day";
        }
        else
        {
            followUp.DaysDueBadge = $"Due in {daysUntilDue} days";
        }

        if (followUp.JobApplication?.DateApplied != null)
        {
            var daysAppliedAgo = today.DayNumber - followUp.JobApplication.DateApplied.Value.DayNumber;
            followUp.AppliedSubtitle = $"Applied {daysAppliedAgo} days ago";
        }
        else if (followUp.AppliedSubtitle == null)
        {
            followUp.AppliedSubtitle = "Applied recently";
        }
    }
}
