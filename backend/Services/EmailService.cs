using CareerMail.Api.Data;
using CareerMail.Api.Models.DTOs;
using CareerMail.Api.Models.Entities;
using CareerMail.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CareerMail.Api.Services;

public interface IEmailService
{
    Task<List<Email>> GetEmailsByFolderAsync(long userId, string? folderName);
    Task<List<Email>> GetStarredEmailsAsync(long userId);
    Task<List<Email>> GetImportantEmailsAsync(long userId);
    Task<List<Email>> GetEmailsByJobApplicationAsync(long userId, long applicationId);
    Task<Email> GetEmailByIdAsync(long userId, long id);
    Task<Email> MarkReadAsync(long userId, long id, bool read);
    Task<Email> ToggleStarAsync(long userId, long id);
    Task<Email> ToggleImportantAsync(long userId, long id);
    Task<Email> MoveToFolderAsync(long userId, long id, string folderName);
    Task<Email> ComposeEmailAsync(long userId, EmailComposeRequest request);
    Task<Email> SimulateIncomingEmailAsync(long userId, string sender, string senderEmail, string subject, string body, bool markImportant);
    Task DeleteEmailAsync(long userId, long id);
    Task<Dictionary<string, long>> GetFolderCountsAsync(long userId);
    Task<List<Email>> SearchEmailsAsync(long userId, string? query);
}

public class EmailService : IEmailService
{
    private readonly AppDbContext _context;
    private readonly IGmailService _gmailService;
    private readonly IEmailAnalysisService _emailAnalysisService;

    public EmailService(AppDbContext context, IGmailService gmailService, IEmailAnalysisService emailAnalysisService)
    {
        _context = context;
        _gmailService = gmailService;
        _emailAnalysisService = emailAnalysisService;
    }

    public async Task<List<Email>> GetEmailsByFolderAsync(long userId, string? folderName)
    {
        if (string.IsNullOrWhiteSpace(folderName) || "all".Equals(folderName, StringComparison.OrdinalIgnoreCase))
        {
            return await _context.Emails
                .Include(e => e.JobApplication)
                .Where(e => e.UserId == userId)
                .OrderByDescending(e => e.Timestamp)
                .ToListAsync();
        }

        var folder = EmailFolderExtensions.FromString(folderName);
        return await _context.Emails
            .Include(e => e.JobApplication)
            .Where(e => e.UserId == userId && e.Folder == folder)
            .OrderByDescending(e => e.Timestamp)
            .ToListAsync();
    }

    public async Task<List<Email>> GetStarredEmailsAsync(long userId)
    {
        return await _context.Emails
            .Include(e => e.JobApplication)
            .Where(e => e.UserId == userId && e.IsStarred)
            .OrderByDescending(e => e.Timestamp)
            .ToListAsync();
    }

    public async Task<List<Email>> GetImportantEmailsAsync(long userId)
    {
        return await _context.Emails
            .Include(e => e.JobApplication)
            .Where(e => e.UserId == userId && e.IsImportant)
            .OrderByDescending(e => e.Timestamp)
            .ToListAsync();
    }

    public async Task<List<Email>> GetEmailsByJobApplicationAsync(long userId, long applicationId)
    {
        return await _context.Emails
            .Where(e => e.UserId == userId && e.JobApplicationId == applicationId)
            .OrderByDescending(e => e.Timestamp)
            .ToListAsync();
    }

    public async Task<Email> GetEmailByIdAsync(long userId, long id)
    {
        var email = await _context.Emails
            .Include(e => e.JobApplication)
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);

        if (email == null)
        {
            throw new ArgumentException($"Email not found with ID: {id}");
        }

        return email;
    }

    public async Task<Email> MarkReadAsync(long userId, long id, bool read)
    {
        var email = await GetEmailByIdAsync(userId, id);
        email.IsRead = read;
        await _context.SaveChangesAsync();
        return email;
    }

    public async Task<Email> ToggleStarAsync(long userId, long id)
    {
        var email = await GetEmailByIdAsync(userId, id);
        email.IsStarred = !email.IsStarred;
        await _context.SaveChangesAsync();
        return email;
    }

    public async Task<Email> ToggleImportantAsync(long userId, long id)
    {
        var email = await GetEmailByIdAsync(userId, id);
        email.IsImportant = !email.IsImportant;
        await _context.SaveChangesAsync();
        return email;
    }

    public async Task<Email> MoveToFolderAsync(long userId, long id, string folderName)
    {
        var email = await GetEmailByIdAsync(userId, id);
        email.Folder = EmailFolderExtensions.FromString(folderName);
        await _context.SaveChangesAsync();
        return email;
    }

    public async Task<Email> ComposeEmailAsync(long userId, EmailComposeRequest request)
    {
        var user = await _context.Users.FindAsync(userId) ?? throw new UnauthorizedAccessException("User not found");
        return await _gmailService.SendEmailAsync(user, request);
    }

    public async Task<Email> SimulateIncomingEmailAsync(long userId, string sender, string senderEmail, string subject, string body, bool markImportant)
    {
        var user = await _context.Users.FindAsync(userId) ?? throw new UnauthorizedAccessException("User not found");

        var email = new Email
        {
            UserId = userId,
            Sender = sender,
            SenderEmail = senderEmail,
            RecipientEmail = user.Email,
            Subject = subject,
            Body = body,
            Preview = body.Length > 100 ? body[..100] + "..." : body,
            Timestamp = DateTime.UtcNow,
            IsRead = false,
            IsImportant = markImportant,
            Folder = EmailFolder.INBOX
        };

        _context.Emails.Add(email);
        await _context.SaveChangesAsync();

        await _emailAnalysisService.ProcessEmailAsync(email, user);
        return email;
    }

    public async Task DeleteEmailAsync(long userId, long id)
    {
        var email = await GetEmailByIdAsync(userId, id);
        _context.Emails.Remove(email);
        await _context.SaveChangesAsync();
    }

    public async Task<Dictionary<string, long>> GetFolderCountsAsync(long userId)
    {
        return new Dictionary<string, long>
        {
            ["inbox"] = await _context.Emails.CountAsync(e => e.UserId == userId && e.Folder == EmailFolder.INBOX),
            ["important"] = await _context.Emails.CountAsync(e => e.UserId == userId && e.IsImportant),
            ["starred"] = await _context.Emails.CountAsync(e => e.UserId == userId && e.IsStarred),
            ["sent"] = await _context.Emails.CountAsync(e => e.UserId == userId && e.Folder == EmailFolder.SENT),
            ["drafts"] = await _context.Emails.CountAsync(e => e.UserId == userId && e.Folder == EmailFolder.DRAFTS)
        };
    }

    public async Task<List<Email>> SearchEmailsAsync(long userId, string? query)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return await GetEmailsByFolderAsync(userId, "inbox");
        }

        var q = query.Trim().ToLowerInvariant();
        return await _context.Emails
            .Include(e => e.JobApplication)
            .Where(e => e.UserId == userId && (
                e.Subject.ToLower().Contains(q) ||
                e.Sender.ToLower().Contains(q) ||
                e.SenderEmail.ToLower().Contains(q) ||
                e.Body.ToLower().Contains(q)
            ))
            .OrderByDescending(e => e.Timestamp)
            .ToListAsync();
    }
}
