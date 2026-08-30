using CareerMail.Api.Data;
using CareerMail.Api.Models.DTOs;
using CareerMail.Api.Models.Entities;
using CareerMail.Api.Models.Enums;
using Microsoft.EntityFrameworkCore;

namespace CareerMail.Api.Services;

public interface ICareerAssistantService
{
    Task<AssistantQueryResponse> AskAssistantAsync(long userId, AssistantQueryRequest request);
}

public class CareerAssistantService : ICareerAssistantService
{
    private readonly AppDbContext _context;
    private readonly ILogger<CareerAssistantService> _logger;

    public CareerAssistantService(AppDbContext context, ILogger<CareerAssistantService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<AssistantQueryResponse> AskAssistantAsync(long userId, AssistantQueryRequest request)
    {
        var user = await _context.Users.FindAsync(userId) ?? throw new UnauthorizedAccessException("User not found");
        var rawQuery = request.Query?.Trim() ?? "";
        var q = rawQuery.ToLowerInvariant();
        var action = request.Action?.ToUpperInvariant() ?? "";

        JobApplication? contextApp = null;
        if (request.SelectedApplicationId.HasValue)
        {
            contextApp = await _context.JobApplications
                .Include(ja => ja.TimelineEvents)
                .FirstOrDefaultAsync(ja => ja.Id == request.SelectedApplicationId.Value && ja.UserId == userId);
        }

        var defaultSuggestions = new List<string>
        {
            "✨ What should I do next?",
            "📊 Analyze my job search progress",
            "👤 Show identified recruiters",
            "⏰ Which applications need follow-up?",
            "✉️ Draft a follow-up email"
        };

        // 1. WHAT SHOULD I DO NEXT?
        if (action == "WHAT_NEXT" || q.Contains("what should i do next") || q.Contains("what next") ||
            q.Contains("priorities") || q.Contains("action plan") || q.Contains("to do") || q.Contains("todo"))
        {
            return await HandleWhatShouldIDoNextAsync(user, defaultSuggestions);
        }

        // 2. ANALYZE PROGRESS
        if (action == "ANALYZE_PROGRESS" || q.Contains("analyze") || q.Contains("analytics") ||
            q.Contains("conversion rate") || q.Contains("response rate") || q.Contains("progress") ||
            q.Contains("performance") || q.Contains("stats") || q.Contains("how am i doing"))
        {
            return await HandleAnalyzeProgressAsync(user, defaultSuggestions);
        }

        // 3. NEEDS ATTENTION
        if (action == "NEEDS_ATTENTION" || q.Contains("needs attention") || q.Contains("attention") ||
            q.Contains("overdue") || q.Contains("waiting too long") || q.Contains("pending too long") ||
            q.Contains("stale") || q.Contains("no response"))
        {
            return await HandleNeedsAttentionAsync(user, defaultSuggestions);
        }

        // 4. SMART EMAIL DRAFTING
        if (action == "DRAFT_REPLY" || q.Contains("draft") || q.Contains("write an email") ||
            q.Contains("help me reply") || q.Contains("thank you email") || q.Contains("follow-up email") ||
            q.Contains("reply to recruiter") || q.Contains("rewrite email") || q.Contains("compose"))
        {
            return await HandleEmailDraftingAsync(user, q, contextApp, defaultSuggestions);
        }

        // 5. RECRUITER INTELLIGENCE
        if (action == "FIND_RECRUITERS" || q.Contains("recruiter") || q.Contains("contact") ||
            q.Contains("who reached out") || q.Contains("talent acquisition") || q.Contains("hiring manager"))
        {
            return await HandleRecruiterIntelligenceAsync(user, defaultSuggestions);
        }

        // 6. INTERVIEWS INQUIRY
        if (q.Contains("interview") || q.Contains("schedule") || q.Contains("upcoming call") || q.Contains("when is my next"))
        {
            return await HandleInterviewsInquiryAsync(user, defaultSuggestions);
        }

        // 7. FOLLOW-UPS INQUIRY
        if (q.Contains("follow up") || q.Contains("follow-up") || q.Contains("due follow-up"))
        {
            return await HandleFollowUpsInquiryAsync(user, defaultSuggestions);
        }

        // 8. REJECTIONS / OFFERS
        if (q.Contains("reject") || q.Contains("declined") || q.Contains("turn down"))
        {
            return await HandleRejectionsInquiryAsync(user, defaultSuggestions);
        }
        if (q.Contains("offer") || q.Contains("package") || q.Contains("accepted"))
        {
            return await HandleOffersInquiryAsync(user, defaultSuggestions);
        }

        // 9. CONTEXT APP SUMMARY
        if (contextApp != null && (q.Contains("this application") || q.Contains("summarize") || q.Contains("summary") || q.Contains("status of this") || q.Contains("what should i do with this")))
        {
            return await HandleContextAppSummaryAsync(contextApp, user, defaultSuggestions);
        }

        // 10. SPECIFIC COMPANY SEARCH
        var allApps = await _context.JobApplications.Where(ja => ja.UserId == userId).ToListAsync();
        foreach (var app in allApps)
        {
            if (q.Contains(app.Company.ToLowerInvariant()))
            {
                return HandleCompanyLookup(app, defaultSuggestions);
            }
        }

        // 11. NATURAL LANGUAGE SEARCH
        if (q.Contains("show") || q.Contains("find") || q.Contains("search") || q.Contains("list") || q.Contains("filter"))
        {
            return HandleNaturalLanguageSearch(allApps, q, defaultSuggestions);
        }

        // 12. DEFAULT EXECUTIVE BRIEFING
        return await HandleExecutiveBriefingAsync(user, contextApp, defaultSuggestions);
    }

    private async Task<AssistantQueryResponse> HandleWhatShouldIDoNextAsync(User user, List<string> suggestions)
    {
        var apps = await _context.JobApplications.Where(ja => ja.UserId == user.Id).ToListAsync();
        var upcomingInterviews = await _context.Interviews
            .Where(i => i.UserId == user.Id && i.Status == InterviewStatus.SCHEDULED)
            .OrderBy(i => i.InterviewDate)
            .ToListAsync();
        var pendingFollowUps = await _context.FollowUps
            .Where(f => f.UserId == user.Id && f.Status == FollowUpStatus.PENDING)
            .OrderBy(f => f.DueDate)
            .ToListAsync();

        var actionCards = new List<AssistantCardDTO>();
        var sb = new System.Text.StringBuilder("🎯 **Here is your actionable priority list based on your live CareerMail data:**\n\n");

        var urgentCount = 0;
        var attentionCount = 0;
        var upcomingCount = 0;
        var positiveCount = 0;

        var now = DateTime.UtcNow;
        foreach (var interview in upcomingInterviews)
        {
            var diff = interview.InterviewDate - now;
            if (diff.TotalHours is >= 0 and <= 48)
            {
                urgentCount++;
                var hours = (int)diff.TotalHours;
                sb.AppendLine($"🔴 **Urgent (In {hours} hours):** Prepare for your interview with **{interview.Company}** for **{interview.Title}** ({interview.Type}).");

                actionCards.Add(new AssistantCardDTO(
                    "INTERVIEW", interview.Id, $"{interview.Company} — {interview.Title}",
                    $"Interview in {hours} hours ({interview.Type})", "URGENT INTERVIEW", "red",
                    "URGENT", "/tracker", interview.Company, interview.Title, "INTERVIEW",
                    interview.InterviewDate.ToString("o"), null, null
                ));
            }
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        foreach (var f in pendingFollowUps)
        {
            if (f.DueDate < today)
            {
                urgentCount++;
                var daysOverdue = today.DayNumber - f.DueDate.DayNumber;
                sb.AppendLine($"🔴 **Urgent (Overdue by {daysOverdue} days):** Send follow-up to **{f.Company}** for **{f.Role ?? "Role"}**.");

                actionCards.Add(new AssistantCardDTO(
                    "FOLLOW_UP", f.Id, $"{f.Company} — Follow-up Overdue",
                    $"Was due on {f.DueDate} ({daysOverdue}d ago)", "OVERDUE", "red",
                    "URGENT", "/tracker", f.Company, f.Role, "PENDING", f.DueDate.ToString("o"), null, null
                ));
            }
        }

        foreach (var f in pendingFollowUps)
        {
            if (f.DueDate == today || (f.DueDate > today && f.DueDate < today.AddDays(4)))
            {
                attentionCount++;
                sb.AppendLine($"🟠 **Needs Attention:** Follow-up due with **{f.Company}** on **{(f.DueDate == today ? "TODAY" : f.DueDate.ToString())}**.");

                actionCards.Add(new AssistantCardDTO(
                    "FOLLOW_UP", f.Id, $"{f.Company} — Follow-up Due {(f.DueDate == today ? "Today" : f.DueDate.ToString())}",
                    f.Role ?? "Application Check-in", "DUE SOON", "orange", "ATTENTION",
                    "/tracker", f.Company, f.Role, "PENDING", f.DueDate.ToString("o"), null, null
                ));
            }
        }

        var staleApps = apps
            .Where(a => a.Status is ApplicationStatus.APPLIED or ApplicationStatus.RECRUITER_SCREEN)
            .Where(a => a.DateApplied.HasValue && (today.DayNumber - a.DateApplied.Value.DayNumber) >= 12)
            .Take(3)
            .ToList();

        foreach (var stale in staleApps)
        {
            var days = today.DayNumber - stale.DateApplied!.Value.DayNumber;
            attentionCount++;
            sb.AppendLine($"🟠 **Needs Attention:** Applied to **{stale.Company}** ({stale.Title}) {days} days ago with no response. Consider sending a polite follow-up.");

            actionCards.Add(new AssistantCardDTO(
                "APPLICATION", stale.Id, $"{stale.Company} — {stale.Title}",
                $"Waiting {days} days since applied ({stale.DateApplied})", $"NO RESPONSE ({days}d)",
                "orange", "ATTENTION", "/tracker", stale.Company, stale.Title, stale.Status.ToString(),
                stale.DateApplied.ToString(), stale.RecruiterName, stale.RecruiterEmail
            ));
        }

        foreach (var interview in upcomingInterviews)
        {
            var diff = interview.InterviewDate - now;
            if (diff.TotalHours > 48)
            {
                upcomingCount++;
                var days = (int)diff.TotalDays;
                sb.AppendLine($"🔵 **Upcoming (In {days} days):** Interview scheduled with **{interview.Company}** for **{interview.Title}** on {DateOnly.FromDateTime(interview.InterviewDate)}.");

                actionCards.Add(new AssistantCardDTO(
                    "INTERVIEW", interview.Id, $"{interview.Company} — {interview.Title}",
                    $"Interview on {DateOnly.FromDateTime(interview.InterviewDate)} ({interview.Type})",
                    "UPCOMING", "blue", "UPCOMING", "/tracker", interview.Company, interview.Title,
                    "INTERVIEW", interview.InterviewDate.ToString("o"), null, null
                ));
            }
        }

        var offers = apps.Where(a => a.Status == ApplicationStatus.OFFER).ToList();
        foreach (var offer in offers)
        {
            positiveCount++;
            sb.AppendLine($"🟢 **Positive Progress:** Job Offer from **{offer.Company}** ({offer.Title})! Review terms or negotiate.");

            actionCards.Add(new AssistantCardDTO(
                "APPLICATION", offer.Id, $"🎉 {offer.Company} — Offer Received!",
                $"{offer.Title}{(offer.Salary != null ? $" • {offer.Salary}" : "")}", "JOB OFFER",
                "green", "POSITIVE", "/tracker", offer.Company, offer.Title, "OFFER",
                offer.DateApplied?.ToString() ?? "", offer.RecruiterName, offer.RecruiterEmail
            ));
        }

        if (urgentCount == 0 && attentionCount == 0 && upcomingCount == 0 && positiveCount == 0)
        {
            if (apps.Count == 0)
            {
                sb.AppendLine("You don't have any job applications or interviews recorded yet.\n\n" +
                              "💡 **Recommendation:** Connect your Gmail in Settings to automatically sync your job search emails, or manually click **+ Add Application** on your dashboard.");
            }
            else
            {
                sb.AppendLine($"✅ **All clear!** You have no urgent deadlines, overdue follow-ups, or pending alerts.\n\nYour pipeline has **{apps.Count} applications** actively moving. Keep up the momentum by applying to new opportunities or reviewing your resume.");
            }
        }
        else
        {
            sb.AppendLine("\n💡 **Next Step Advice:** Click any action card below to view details, draft a follow-up email, or review application history.");
        }

        return new AssistantQueryResponse(sb.ToString(), suggestions, actionCards);
    }

    private async Task<AssistantQueryResponse> HandleAnalyzeProgressAsync(User user, List<string> suggestions)
    {
        var apps = await _context.JobApplications.Where(ja => ja.UserId == user.Id).ToListAsync();
        var total = apps.Count;

        if (total == 0)
        {
            const string reply = "📊 **No Job Search Data Yet**\n\nI don't have enough tracked applications in your database to calculate analytics.\n\nTo generate real response rates and conversion benchmarks, sync your Gmail account in Settings or add your recent job applications.";
            return new AssistantQueryResponse(reply, suggestions);
        }

        var appliedCount = apps.Count(a => a.Status == ApplicationStatus.APPLIED);
        var assessmentCount = apps.Count(a => a.Status == ApplicationStatus.ASSESSMENT);
        var screenCount = apps.Count(a => a.Status == ApplicationStatus.RECRUITER_SCREEN);
        var interviewCount = apps.Count(a => a.Status is ApplicationStatus.INTERVIEW or ApplicationStatus.FINAL_INTERVIEW);
        var offerCount = apps.Count(a => a.Status == ApplicationStatus.OFFER);
        var rejectedCount = apps.Count(a => a.Status == ApplicationStatus.REJECTED);

        var respondedCount = total - appliedCount;
        var responseRate = (double)respondedCount / total * 100.0;
        var interviewRate = (double)(screenCount + interviewCount + offerCount) / total * 100.0;
        var rejectionRate = (double)rejectedCount / total * 100.0;

        var roleDistribution = apps.GroupBy(a => SimplifyRole(a.Title))
            .ToDictionary(g => g.Key, g => g.LongCount());

        var topRole = roleDistribution.OrderByDescending(r => r.Value).Select(r => r.Key).FirstOrDefault() ?? "Software Engineering";

        var sb = new System.Text.StringBuilder("📊 **Real CareerMail Job Search Analytics:**\n\n");
        sb.AppendLine($"• **Total Tracked Applications:** {total}");
        sb.AppendLine($"• **Active Pipeline:** {total - rejectedCount - offerCount} (Applied: {appliedCount}, Assessment: {assessmentCount}, Screen: {screenCount}, Interview: {interviewCount})");
        sb.AppendLine($"• **Response Rate:** {responseRate:F1}% ({respondedCount} of {total} applications received a response)");
        sb.AppendLine($"• **Interview Conversion Rate:** {interviewRate:F1}% ({screenCount + interviewCount + offerCount} reached recruiter screen or interview)");
        sb.AppendLine($"• **Rejection Rate:** {rejectionRate:F1}% ({rejectedCount} formal rejections recorded)");
        sb.AppendLine($"• **Job Offers:** {offerCount}\n");

        sb.AppendLine("🎯 **Role & Domain Breakdown:**");
        foreach (var entry in roleDistribution)
        {
            sb.AppendLine($"  - **{entry.Key}:** {entry.Value} applications");
        }

        sb.AppendLine("\n💡 **AI Strategic Insight:**");
        if (interviewRate >= 15.0)
        {
            sb.AppendLine($"Your interview conversion rate of **{interviewRate:F1}%** is higher than the tech industry average (10-15%)! Applications in **{topRole}** are driving the strongest recruiter engagement.");
        }
        else if (responseRate < 20.0)
        {
            sb.AppendLine("Your response rate is currently below 20%. Consider tailoring keywords in your resume to match exact job descriptions, or target roles where recruiters are directly reaching out.");
        }
        else
        {
            sb.AppendLine($"You have solid momentum in **{topRole}**. Following up on applications older than 10 days will help push stalled applications into interview stages.");
        }

        return new AssistantQueryResponse(sb.ToString(), suggestions);
    }

    private async Task<AssistantQueryResponse> HandleNeedsAttentionAsync(User user, List<string> suggestions)
    {
        var apps = await _context.JobApplications.Where(ja => ja.UserId == user.Id).ToListAsync();
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var staleApps = apps
            .Where(a => a.Status is ApplicationStatus.APPLIED or ApplicationStatus.RECRUITER_SCREEN)
            .Where(a => a.DateApplied.HasValue && (today.DayNumber - a.DateApplied.Value.DayNumber) >= 10)
            .OrderBy(a => a.DateApplied)
            .ToList();

        var overdueFollowUps = await _context.FollowUps
            .Where(f => f.UserId == user.Id && f.Status == FollowUpStatus.PENDING)
            .OrderBy(f => f.DueDate)
            .ToListAsync();

        if (staleApps.Count == 0 && overdueFollowUps.Count == 0)
        {
            return new AssistantQueryResponse("✅ **Nothing currently needs urgent attention!** All your applications are fresh and there are no overdue follow-ups.", suggestions);
        }

        var cards = new List<AssistantCardDTO>();
        var sb = new System.Text.StringBuilder("⏰ **Here are the items that need your attention:**\n\n");

        if (overdueFollowUps.Count > 0)
        {
            sb.AppendLine("📌 **Pending Follow-up Tasks:**");
            foreach (var f in overdueFollowUps.Take(3))
            {
                sb.AppendLine($"• **{f.Company}** — Due: {f.DueDate} ({f.Role ?? "Role"})");
                cards.Add(new AssistantCardDTO("FOLLOW_UP", f.Id, f.Company, $"Follow-up due: {f.DueDate}", "DUE", "orange", "ATTENTION", "/tracker", f.Company, f.Role, "PENDING", f.DueDate.ToString("o"), null, null));
            }
            sb.AppendLine();
        }

        if (staleApps.Count > 0)
        {
            sb.AppendLine("⏳ **Applications Waiting for Response (>10 Days):**");
            foreach (var app in staleApps.Take(5))
            {
                var days = today.DayNumber - app.DateApplied!.Value.DayNumber;
                sb.AppendLine($"• **{app.Company}** ({app.Title}) — Waiting **{days} days** (Applied: {app.DateApplied})");
                cards.Add(new AssistantCardDTO("APPLICATION", app.Id, $"{app.Company} — {app.Title}", $"Waiting {days} days without reply", $"{days}d PENDING", "orange", "ATTENTION", "/tracker", app.Company, app.Title, app.Status.ToString(), app.DateApplied.ToString(), app.RecruiterName, app.RecruiterEmail));
            }
            sb.AppendLine($"\n💡 **Action:** You can ask me to *\"Draft a follow-up for {staleApps[0].Company}\"* to generate a professional check-in note!");
        }

        return new AssistantQueryResponse(sb.ToString(), suggestions, cards);
    }

    private async Task<AssistantQueryResponse> HandleEmailDraftingAsync(User user, string query, JobApplication? contextApp, List<string> suggestions)
    {
        var company = "Company";
        var role = "the open position";
        var recruiterName = "Hiring Team";
        var recipientEmail = "";
        var draftType = "FOLLOW_UP";

        if (contextApp != null)
        {
            company = contextApp.Company;
            role = contextApp.Title;
            if (!string.IsNullOrWhiteSpace(contextApp.RecruiterName)) recruiterName = contextApp.RecruiterName;
            if (!string.IsNullOrWhiteSpace(contextApp.RecruiterEmail)) recipientEmail = contextApp.RecruiterEmail;
        }
        else
        {
            var allApps = await _context.JobApplications.Where(ja => ja.UserId == user.Id).ToListAsync();
            foreach (var a in allApps)
            {
                if (query.Contains(a.Company.ToLowerInvariant()))
                {
                    company = a.Company;
                    role = a.Title;
                    if (!string.IsNullOrWhiteSpace(a.RecruiterName)) recruiterName = a.RecruiterName;
                    if (!string.IsNullOrWhiteSpace(a.RecruiterEmail)) recipientEmail = a.RecruiterEmail;
                    break;
                }
            }
        }

        var userName = !string.IsNullOrWhiteSpace(user.Name) ? user.Name : "Candidate";
        string subject;
        string body;

        if (query.Contains("thank you") || query.Contains("thanks") || query.Contains("interview"))
        {
            draftType = "THANK_YOU";
            subject = $"Thank you — {role} Interview ({userName})";
            body = $"Hi {recruiterName},\n\nThank you so much for taking the time to speak with me today about the {role} position at {company}.\n\nI truly enjoyed learning more about the team's upcoming initiatives and discussing how my background in problem solving and engineering can contribute to your goals.\n\nPlease let me know if you need any additional information from my side. Looking forward to hearing about the next steps!\n\nBest regards,\n{userName}";
        }
        else if (query.Contains("reply to recruiter") || query.Contains("opportunity") || query.Contains("outreach"))
        {
            draftType = "REPLY";
            subject = $"Re: Opportunity with {company} — {userName}";
            body = $"Hi {recruiterName},\n\nThank you for reaching out regarding the {role} opportunity at {company}.\n\nI am very interested in learning more about the role and team. I have attached my latest resume and would be delighted to schedule a brief introductory call.\n\nI am generally available this week between 10:00 AM – 4:00 PM. Please let me know what time works best for you.\n\nBest regards,\n{userName}";
        }
        else
        {
            draftType = "FOLLOW_UP";
            subject = $"Following up on my application: {role} — {userName}";
            body = $"Hi {recruiterName},\n\nI hope you are having a wonderful week.\n\nI am writing to politely check in on the status of my application for the {role} role at {company}. I remain very enthusiastic about the opportunity to contribute to the team.\n\nPlease let me know if there are any updates or if I can provide any supplementary materials to assist with your evaluation.\n\nThank you for your time and consideration.\n\nSincerely,\n{userName}";
        }

        var draft = new AssistantEmailDraftDTO(recipientEmail, subject, body, recruiterName, company, role, draftType);
        var reply = $"✉️ **I've drafted a professional {draftType.ToLower().Replace("_", " ")} email for you:**\n\n**To:** {(string.IsNullOrEmpty(recipientEmail) ? "(Enter recruiter email)" : recipientEmail)}\n**Subject:** {subject}\n\n```text\n{body}\n```\n\n🔒 **Safety Note:** CareerMail never automatically sends emails. You can click **'Open in Compose'** below to review, edit, and send it through your connected Gmail.";

        return new AssistantQueryResponse(reply, suggestions, null, draft);
    }

    private async Task<AssistantQueryResponse> HandleRecruiterIntelligenceAsync(User user, List<string> suggestions)
    {
        var apps = await _context.JobApplications.Where(ja => ja.UserId == user.Id).ToListAsync();
        var appsWithRecruiter = apps.Where(a => !string.IsNullOrWhiteSpace(a.RecruiterName)).ToList();

        if (appsWithRecruiter.Count == 0)
        {
            return new AssistantQueryResponse(
                "👤 **Recruiter Intelligence Status**\n\nNo human recruiter contacts have been identified in your database yet.\n\nWhen recruiters send outreach messages or interview invitations to your Gmail, CareerMail automatically extracts their name, email, and title here.",
                suggestions
            );
        }

        var recruiterCards = new List<AssistantCardDTO>();
        var sb = new System.Text.StringBuilder($"👤 **Identified Recruiter Contacts ({appsWithRecruiter.Count} found):**\n\n");

        foreach (var app in appsWithRecruiter.Take(6))
        {
            var recruiterType = app.RecruiterType == RecruiterType.HUMAN_RECRUITER ? "Recruiter" : "Team";
            var confidenceStr = app.ContactConfidence.HasValue ? $"{app.ContactConfidence}% Match" : "Verified";

            sb.AppendLine($"• **{app.RecruiterName}** ({recruiterType}) at **{app.Company}**\n  - Email: `{app.RecruiterEmail ?? "Not listed"}` | Role: {app.Title}");

            recruiterCards.Add(new AssistantCardDTO(
                "RECRUITER", app.Id, $"{app.RecruiterName} ({app.Company})",
                $"{app.Title}{(app.RecruiterEmail != null ? $" • {app.RecruiterEmail}" : "")}",
                confidenceStr, "pink", "ATTENTION", "/tracker", app.Company, app.Title,
                app.Status.ToString(), app.DateApplied?.ToString() ?? "", app.RecruiterName, app.RecruiterEmail
            ));
        }

        sb.AppendLine("\n💡 **Action:** Ask me to *\"Draft an email to [Recruiter Name]\"* to compose a personalized message!");
        return new AssistantQueryResponse(sb.ToString(), suggestions, recruiterCards);
    }

    private async Task<AssistantQueryResponse> HandleInterviewsInquiryAsync(User user, List<string> suggestions)
    {
        var interviews = await _context.Interviews
            .Where(i => i.UserId == user.Id)
            .OrderBy(i => i.InterviewDate)
            .ToListAsync();

        if (interviews.Count == 0)
        {
            return new AssistantQueryResponse("📅 **No Scheduled Interviews**\n\nYou currently have no scheduled interviews logged in CareerMail. Check your Gmail inbox for new interview invitations!", suggestions);
        }

        var cards = new List<AssistantCardDTO>();
        var sb = new System.Text.StringBuilder($"📅 **You have {interviews.Count} interview(s) on your schedule:**\n\n");

        for (var i = 0; i < interviews.Count; i++)
        {
            var intv = interviews[i];
            var badge = intv.DaysAwayBadge ?? "Upcoming";
            sb.AppendLine($"{i + 1}. **{intv.Company}** — {intv.Title}\n   • **Date:** {intv.InterviewDate:yyyy-MM-dd HH:mm}\n   • **Format:** {intv.Type} ({intv.Location})\n   • **Timing:** {badge}\n");

            cards.Add(new AssistantCardDTO(
                "INTERVIEW", intv.Id, $"{intv.Company} — {intv.Title}",
                $"{DateOnly.FromDateTime(intv.InterviewDate)} ({intv.Type})", badge,
                "blue", "UPCOMING", "/tracker", intv.Company, intv.Title, "INTERVIEW",
                intv.InterviewDate.ToString("o"), null, null
            ));
        }

        return new AssistantQueryResponse(sb.ToString(), suggestions, cards);
    }

    private async Task<AssistantQueryResponse> HandleFollowUpsInquiryAsync(User user, List<string> suggestions)
    {
        var followUps = await _context.FollowUps
            .Where(f => f.UserId == user.Id)
            .OrderBy(f => f.DueDate)
            .ToListAsync();

        if (followUps.Count == 0)
        {
            return new AssistantQueryResponse("⏰ **No Pending Follow-ups**\n\nYou are fully caught up with your follow-up schedule!", suggestions);
        }

        var cards = new List<AssistantCardDTO>();
        var sb = new System.Text.StringBuilder($"⏰ **You have {followUps.Count} tracked follow-up(s):**\n\n");

        foreach (var f in followUps)
        {
            var badge = f.DaysDueBadge ?? "Due Soon";
            sb.AppendLine($"• **{f.Company}** ({f.Role ?? "Role"}) — Due: {f.DueDate} ({badge})");

            cards.Add(new AssistantCardDTO(
                "FOLLOW_UP", f.Id, $"{f.Company} — Follow-up",
                $"{(f.Role ?? "Application")} • Due {f.DueDate}", badge, "orange", "ATTENTION",
                "/tracker", f.Company, f.Role, "PENDING", f.DueDate.ToString("o"), null, null
            ));
        }

        return new AssistantQueryResponse(sb.ToString(), suggestions, cards);
    }

    private async Task<AssistantQueryResponse> HandleRejectionsInquiryAsync(User user, List<string> suggestions)
    {
        var rejected = await _context.JobApplications
            .Where(ja => ja.UserId == user.Id && ja.Status == ApplicationStatus.REJECTED)
            .ToListAsync();

        if (rejected.Count == 0)
        {
            return new AssistantQueryResponse("🎯 **No Rejections Recorded!** All your tracked applications are currently active or progressing.", suggestions);
        }

        var cards = new List<AssistantCardDTO>();
        var sb = new System.Text.StringBuilder($"📌 **You have {rejected.Count} rejected application(s) logged:**\n\n");

        foreach (var r in rejected)
        {
            sb.AppendLine($"• **{r.Company}** — {r.Title} (Applied: {r.DateApplied?.ToString() ?? "Recent"})");
            cards.Add(new AssistantCardDTO("APPLICATION", r.Id, r.Company, r.Title, "REJECTED", "red", "ATTENTION", "/tracker", r.Company, r.Title, "REJECTED", r.DateApplied?.ToString() ?? "", r.RecruiterName, r.RecruiterEmail));
        }

        sb.AppendLine("\n💡 **Perspective:** Rejections provide valuable data. High-volume applicants average 12-18 rejections before securing their ideal offer.");
        return new AssistantQueryResponse(sb.ToString(), suggestions, cards);
    }

    private async Task<AssistantQueryResponse> HandleOffersInquiryAsync(User user, List<string> suggestions)
    {
        var offers = await _context.JobApplications
            .Where(ja => ja.UserId == user.Id && ja.Status == ApplicationStatus.OFFER)
            .ToListAsync();

        if (offers.Count == 0)
        {
            return new AssistantQueryResponse("💼 **No Formal Offers Recorded Yet**\n\nKeep driving your active interviews and assessment stages forward!", suggestions);
        }

        var cards = new List<AssistantCardDTO>();
        var sb = new System.Text.StringBuilder($"🎉 **Congratulations! You have {offers.Count} formal offer(s):**\n\n");

        foreach (var o in offers)
        {
            sb.AppendLine($"• **{o.Company}** — {o.Title}{(o.Salary != null ? $" (Comp: {o.Salary})" : "")}");
            cards.Add(new AssistantCardDTO("APPLICATION", o.Id, $"🎉 {o.Company}", $"{o.Title}{(o.Salary != null ? $" • {o.Salary}" : "")}", "OFFER", "green", "POSITIVE", "/tracker", o.Company, o.Title, "OFFER", o.DateApplied?.ToString() ?? "", o.RecruiterName, o.RecruiterEmail));
        }

        sb.AppendLine("\n💡 **Tip:** Ask me for advice on comparing compensation packages or drafting an acceptance/negotiation letter.");
        return new AssistantQueryResponse(sb.ToString(), suggestions, cards);
    }

    private async Task<AssistantQueryResponse> HandleContextAppSummaryAsync(JobApplication app, User user, List<string> suggestions)
    {
        var events = await _context.TimelineEvents
            .Where(te => te.JobApplicationId == app.Id)
            .OrderByDescending(te => te.EventDate)
            .ToListAsync();
        var emails = await _context.Emails
            .Where(e => e.UserId == user.Id && e.JobApplicationId == app.Id)
            .ToListAsync();

        var sb = new System.Text.StringBuilder($"📋 **Application Context Summary: {app.Company}**\n\n");
        sb.AppendLine($"• **Target Role:** {app.Title}");
        sb.AppendLine($"• **Current Status:** **{app.Status.GetDisplayName()}**");
        sb.AppendLine($"• **Location:** {app.Location ?? "Remote / Hybrid"}");
        if (app.Salary != null) sb.AppendLine($"• **Compensation:** {app.Salary}");
        if (app.DateApplied.HasValue) sb.AppendLine($"• **Date Applied:** {app.DateApplied}");
        if (!string.IsNullOrWhiteSpace(app.RecruiterName)) sb.AppendLine($"• **Recruiter Contact:** {app.RecruiterName} ({app.RecruiterEmail ?? "Email on file"})");

        if (events.Count > 0)
        {
            sb.AppendLine("\n🕒 **Recent Timeline Activity:**");
            foreach (var ev in events.Take(3))
            {
                sb.AppendLine($"  - {DateOnly.FromDateTime(ev.EventDate)}: {ev.Title}");
            }
        }

        if (emails.Count > 0)
        {
            sb.AppendLine($"\n📬 **Linked Emails:** {emails.Count} message(s) in thread.");
        }

        var card = new AssistantCardDTO(
            "APPLICATION", app.Id, $"{app.Company} — {app.Title}",
            $"Status: {app.Status.GetDisplayName()}", app.Status.ToString(), "pink",
            "POSITIVE", "/tracker", app.Company, app.Title, app.Status.ToString(),
            app.DateApplied?.ToString() ?? "", app.RecruiterName, app.RecruiterEmail
        );

        return new AssistantQueryResponse(sb.ToString(), suggestions, new List<AssistantCardDTO> { card });
    }

    private static AssistantQueryResponse HandleCompanyLookup(JobApplication app, List<string> suggestions)
    {
        var reply = $"Here is the latest status for **{app.Company}**:\n\n• **Role:** {app.Title}\n• **Status:** {app.Status.GetDisplayName()}\n• **Applied Date:** {app.DateApplied?.ToString() ?? "Recently"}\n• **Recruiter:** {(!string.IsNullOrWhiteSpace(app.RecruiterName) ? app.RecruiterName + (app.RecruiterEmail != null ? $" ({app.RecruiterEmail})" : "") : "Not specified")}\n• **Activity:** {app.ActivitySubtitle ?? "In review"}";

        var card = new AssistantCardDTO(
            "APPLICATION", app.Id, $"{app.Company} — {app.Title}",
            $"Status: {app.Status.GetDisplayName()}", app.Status.ToString(), "pink",
            "POSITIVE", "/tracker", app.Company, app.Title, app.Status.ToString(),
            app.DateApplied?.ToString() ?? "", app.RecruiterName, app.RecruiterEmail
        );

        return new AssistantQueryResponse(reply, suggestions, new List<AssistantCardDTO> { card });
    }

    private static AssistantQueryResponse HandleNaturalLanguageSearch(List<JobApplication> apps, string query, List<string> suggestions)
    {
        var cleaned = System.Text.RegularExpressions.Regex.Replace(query, @"(?i)(show|find|search|my|applications|application|for|in|list|filter|me)", "").Trim();

        var matched = apps.Where(a =>
            a.Company.Contains(cleaned, StringComparison.OrdinalIgnoreCase) ||
            a.Title.Contains(cleaned, StringComparison.OrdinalIgnoreCase) ||
            (a.Location != null && a.Location.Contains(cleaned, StringComparison.OrdinalIgnoreCase)) ||
            (a.RecruiterName != null && a.RecruiterName.Contains(cleaned, StringComparison.OrdinalIgnoreCase))
        ).ToList();

        if (matched.Count == 0)
        {
            return new AssistantQueryResponse($"🔍 No applications found matching **\"{(string.IsNullOrEmpty(cleaned) ? query : cleaned)}\"** in your database.", suggestions);
        }

        var cards = new List<AssistantCardDTO>();
        var sb = new System.Text.StringBuilder($"🔍 **Found {matched.Count} matching application(s) for \"{cleaned}\":**\n\n");

        foreach (var m in matched.Take(5))
        {
            sb.AppendLine($"• **{m.Company}** — {m.Title} (`{m.Status.GetDisplayName()}`)");
            cards.Add(new AssistantCardDTO("APPLICATION", m.Id, $"{m.Company} — {m.Title}", $"Status: {m.Status.GetDisplayName()}", m.Status.ToString(), "pink", "POSITIVE", "/tracker", m.Company, m.Title, m.Status.ToString(), m.DateApplied?.ToString() ?? "", m.RecruiterName, m.RecruiterEmail));
        }

        return new AssistantQueryResponse(sb.ToString(), suggestions, cards);
    }

    private async Task<AssistantQueryResponse> HandleExecutiveBriefingAsync(User user, JobApplication? contextApp, List<string> suggestions)
    {
        var apps = await _context.JobApplications.Where(ja => ja.UserId == user.Id).ToListAsync();
        var interviews = await _context.Interviews.CountAsync(i => i.UserId == user.Id);
        var offers = apps.Count(a => a.Status == ApplicationStatus.OFFER);

        var name = !string.IsNullOrWhiteSpace(user.Name) ? user.Name.Split(' ')[0] : "there";
        var contextHint = contextApp != null ? $"\n\n📍 *Currently reviewing:* **{contextApp.Company}** ({contextApp.Title})" : "";

        var reply = $"Hello **{name}**! 👋 I am your context-aware **AI Career Assistant**.\n\n📊 **Live Pipeline Status:**\n• **{apps.Count}** Total tracked applications\n• **{interviews}** Scheduled interviews\n• **{offers}** Job offers received{contextHint}\n\nYou can ask me to analyze your response rate, find recruiters, create an action priority list (*\"What should I do next?\"*), or draft follow-up emails.";

        return new AssistantQueryResponse(reply, suggestions);
    }

    private static string SimplifyRole(string? title)
    {
        if (string.IsNullOrWhiteSpace(title)) return "Other";
        var t = title.ToLowerInvariant();
        if (t.Contains("data scien")) return "Data Science";
        if (t.Contains("data eng") || t.Contains("big data")) return "Data Engineering";
        if (t.Contains("machine learn") || t.Contains("ml") || t.Contains("ai")) return "AI / Machine Learning";
        if (t.Contains("frontend") || t.Contains("front end") || t.Contains("react")) return "Frontend Engineering";
        if (t.Contains("backend") || t.Contains("back end") || t.Contains("java") || t.Contains("node")) return "Backend Engineering";
        if (t.Contains("full stack") || t.Contains("fullstack")) return "Full Stack Engineering";
        if (t.Contains("product")) return "Product Management";
        if (t.Contains("analyst")) return "Data Analytics";
        return "Software Engineering";
    }
}
