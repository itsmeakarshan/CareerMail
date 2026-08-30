using System.Text.RegularExpressions;
using CareerMail.Api.Data;
using CareerMail.Api.Models.DTOs;
using CareerMail.Api.Models.Entities;
using CareerMail.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CareerMail.Api.Services;

public interface IInterviewService
{
    Task<List<Interview>> GetAllInterviewsAsync(long userId);
    Task<Interview> GetInterviewByIdAsync(long userId, long id);
    Task<Interview> CreateInterviewAsync(long userId, InterviewRequest request);
    Task<Interview> UpdateInterviewAsync(long userId, long id, InterviewRequest request);
    Task DeleteInterviewAsync(long userId, long id);
}

public class InterviewService : IInterviewService
{
    private readonly AppDbContext _context;

    public InterviewService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<Interview>> GetAllInterviewsAsync(long userId)
    {
        var list = await _context.Interviews
            .Include(i => i.JobApplication)
            .Where(i => i.UserId == userId)
            .OrderBy(i => i.InterviewDate)
            .ToListAsync();

        list.ForEach(ComputeDaysAwayBadge);
        return list;
    }

    public async Task<Interview> GetInterviewByIdAsync(long userId, long id)
    {
        var interview = await _context.Interviews
            .Include(i => i.JobApplication)
            .FirstOrDefaultAsync(i => i.Id == id && i.UserId == userId);

        if (interview == null)
        {
            throw new ArgumentException($"Interview not found with ID: {id}");
        }

        ComputeDaysAwayBadge(interview);
        return interview;
    }

    public async Task<Interview> CreateInterviewAsync(long userId, InterviewRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Company)) throw new ArgumentException("Company is required");
        if (string.IsNullOrWhiteSpace(request.Title)) throw new ArgumentException("Title is required");
        if (!request.InterviewDate.HasValue) throw new ArgumentException("Interview date is required");

        var interview = new Interview
        {
            UserId = userId,
            JobApplicationId = request.JobApplicationId,
            Company = request.Company.Trim(),
            Title = request.Title.Trim(),
            InterviewDate = request.InterviewDate.Value,
            Type = !string.IsNullOrWhiteSpace(request.Type) ? request.Type.Trim() : "Technical Interview",
            Interviewer = request.Interviewer?.Trim(),
            Location = !string.IsNullOrWhiteSpace(request.Location) ? request.Location.Trim() : "Google Meet",
            MeetingLink = request.MeetingLink?.Trim(),
            PreparationNotes = request.PreparationNotes?.Trim(),
            Status = InterviewStatusExtensions.FromString(request.Status),
            CompanyLogo = !string.IsNullOrWhiteSpace(request.CompanyLogo)
                ? request.CompanyLogo.Trim()
                : Regex.Replace(request.Company.ToLowerInvariant(), "[^a-z0-9]", "")
        };

        if (request.JobApplicationId.HasValue)
        {
            var app = await _context.JobApplications.FirstOrDefaultAsync(ja => ja.Id == request.JobApplicationId.Value && ja.UserId == userId);
            if (app != null)
            {
                app.TimelineEvents.Add(new TimelineEvent
                {
                    Title = $"Interview Scheduled: {interview.Type}",
                    Description = $"Date: {interview.InterviewDate} with {interview.Interviewer ?? "Hiring Team"}",
                    EventDate = DateTime.UtcNow,
                    EventType = "INTERVIEW"
                });
            }
        }

        ComputeDaysAwayBadge(interview);
        _context.Interviews.Add(interview);
        await _context.SaveChangesAsync();

        return interview;
    }

    public async Task<Interview> UpdateInterviewAsync(long userId, long id, InterviewRequest request)
    {
        var interview = await GetInterviewByIdAsync(userId, id);

        if (!string.IsNullOrWhiteSpace(request.Company)) interview.Company = request.Company.Trim();
        if (!string.IsNullOrWhiteSpace(request.Title)) interview.Title = request.Title.Trim();
        if (request.InterviewDate.HasValue) interview.InterviewDate = request.InterviewDate.Value;
        if (!string.IsNullOrWhiteSpace(request.Type)) interview.Type = request.Type.Trim();
        if (request.Interviewer != null) interview.Interviewer = request.Interviewer.Trim();
        if (request.Location != null) interview.Location = request.Location.Trim();
        if (request.MeetingLink != null) interview.MeetingLink = request.MeetingLink.Trim();
        if (request.PreparationNotes != null) interview.PreparationNotes = request.PreparationNotes.Trim();
        if (!string.IsNullOrWhiteSpace(request.Status)) interview.Status = InterviewStatusExtensions.FromString(request.Status);
        if (!string.IsNullOrWhiteSpace(request.CompanyLogo)) interview.CompanyLogo = request.CompanyLogo.Trim();
        if (request.JobApplicationId.HasValue) interview.JobApplicationId = request.JobApplicationId.Value;

        ComputeDaysAwayBadge(interview);
        await _context.SaveChangesAsync();
        return interview;
    }

    public async Task DeleteInterviewAsync(long userId, long id)
    {
        var interview = await GetInterviewByIdAsync(userId, id);
        _context.Interviews.Remove(interview);
        await _context.SaveChangesAsync();
    }

    private static void ComputeDaysAwayBadge(Interview interview)
    {
        var now = DateTime.UtcNow;
        if (interview.InterviewDate < now)
        {
            interview.DaysAwayBadge = "Completed";
            return;
        }

        var diff = interview.InterviewDate - now;
        if (diff.TotalDays < 1)
        {
            var hours = (int)diff.TotalHours;
            interview.DaysAwayBadge = hours <= 0 ? "Today" : $"In {hours}h";
        }
        else if (diff.TotalDays < 2)
        {
            interview.DaysAwayBadge = "Tomorrow";
        }
        else
        {
            interview.DaysAwayBadge = $"In {(int)diff.TotalDays} days";
        }
    }
}
