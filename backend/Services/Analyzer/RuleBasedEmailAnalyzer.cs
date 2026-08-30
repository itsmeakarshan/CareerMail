using System.Text.RegularExpressions;
using CareerMail.Api.Models.Enums;
using CareerMail.Api.Services;

namespace CareerMail.Api.Services.Analyzer;

public class RuleBasedEmailAnalyzer : IEmailAnalyzer
{
    private readonly IRecruiterIntelligenceService _recruiterIntelligenceService;

    public RuleBasedEmailAnalyzer(IRecruiterIntelligenceService recruiterIntelligenceService)
    {
        _recruiterIntelligenceService = recruiterIntelligenceService;
    }

    private static readonly string[] JunkPatterns = new[]
    {
        "new jobs posted", "just posted a", "jobs matching your", "top jobs for you", "daily leetcoding",
        "visa application", "rewards", "security alert", "survey to tell us",
        "registration code", "confirm your identity", "create password", "get career-ready",
        "preparing for 2027", "latest update from targetjobs", "recommended jobs",
        "job recommendations", "newsletter", "weekly digest", "promotional", "voices you should know",
        "asda rewards", "marketing", "webinar", "podcast", "account verification",
        "password reset", "two-factor", "otp code", "one-time passcode", "adobe for students",
        "groww digest", "groww", "binance", "crypto", "train ticket", "uber", "autofill", "jobright",
        "driving licence", "driving license", "dvla", "barclaycard", "credit card", "klarna", "scentbird",
        "aspora", "real estate", "toro's express", "uber eats", "loan application", "mortgage"
    };

    private static readonly string[] OpportunityPatterns = new[]
    {
        "new opportunity", "job opportunity", "career opportunity", "exciting opportunity",
        "opportunity for you", "opportunity at", "opportunity with", "role opening",
        "position open", "job opening", "we are hiring", "is hiring", "hiring for",
        "thought you'd be a great fit", "thought you might be a fit", "thought you'd be interested",
        "thought of you for", "job match", "job alert", "recruiter reachout",
        "reaching out regarding a role", "reaching out regarding an opportunity",
        "wanted to reach out regarding", "found your profile", "impressed with your background",
        "open role", "new role for", "role opening at", "explore opportunities",
        "new career opportunity", "great opportunity", "exciting role", "position available"
    };

    private static readonly string[] ConfirmationPatterns = new[]
    {
        "received your application", "received your job application", "received your application for",
        "received an application from you", "we received your application", "we have received your application",
        "we've received your application", "we received your application for", "application has been received",
        "your application has been received", "application received", "application was received",
        "thank you for applying", "thank you for your application", "thanks for applying",
        "thanks for your application", "thanks for your job application", "thank you for submitting your application",
        "thanks for submitting your application", "your application was sent to", "your application to",
        "job application is confirmed", "application confirmation", "position confirmed", "position is confirmed",
        "successfully submitted your application", "thanks for your interest in", "thank you for your interest in",
        "indeed application:", "your application has been submitted", "confirming your application",
        "applied for the role", "applied for the position", "applied to", "applied for the job",
        "acknowledgement of your application", "application acknowledgement"
    };

    private static readonly string[] RejectionPatterns = new[]
    {
        "chosen to move forward with other candidates", "chosen to pursue other candidates",
        "we've chosen to move forward with other candidates", "we have chosen to move forward with other candidates",
        "decided not to proceed", "decided not to move forward", "decided not to progress",
        "decided to pursue other candidates", "decided to move forward with other candidates",
        "move forward with other candidates", "pursue other candidates",
        "not moving forward with your application", "not moving forward with your candidacy",
        "will not be moving forward with your application", "will not be moving forward",
        "will not be proceeding", "will not be progressing", "not be progressing your application",
        "not to progress your application", "not to progress to the next stage",
        "not to take your application further", "not selected for this position", "not selected for the role",
        "not selected for an interview", "not selected for this role", "unsuccessful on this occasion",
        "application has been unsuccessful", "application was unsuccessful", "we will not be able to offer you",
        "we are unable to offer you", "not able to offer you an interview", "unable to proceed with your application",
        "position has now been filled", "we have filled the position", "no longer considering your application"
    };

    private static readonly string[] OfferPatterns = new[]
    {
        "pleased to offer you", "delighted to offer you", "thrilled to offer you",
        "offer of employment", "job offer for", "formal job offer", "conditional job offer",
        "formal offer", "extending an offer", "extend an offer", "offer letter",
        "welcome to the team", "employment agreement", "contract of employment"
    };

    private static readonly string[] InterviewInvitationPatterns = new[]
    {
        "invite you to an interview", "invite you to interview", "invited to interview",
        "invitation to interview", "like to invite you to", "pleased to invite you to",
        "schedule an interview", "schedule a call", "schedule a phone screen",
        "schedule a screening call", "schedule your next round", "book your interview",
        "select a time for your interview", "interview availability", "availability for a quick call",
        "availability for an interview", "interview with", "round of interviews"
    };

    private static readonly string[] AssessmentPatterns = new[]
    {
        "hackerrank", "codility", "codesignal", "testgorilla", "hirevue", "pymetrics",
        "online assessment", "coding challenge", "technical assessment", "online test",
        "complete your assessment", "assessment deadline", "take-home test", "take home project"
    };

    public AnalysisResult Analyze(string? subject, string? body, string? sender, string? senderEmail)
    {
        var s = subject ?? "";
        var b = body ?? "";
        var snd = sender ?? "";
        var sndEmail = senderEmail ?? "";

        var combined = $"{s} {b}".ToLowerInvariant();

        // 1. Junk Check
        if (JunkPatterns.Any(p => combined.Contains(p)))
        {
            // If it matches junk pattern and neither strong application confirmation nor offer nor rejection
            var hasStrongConfirmation = ConfirmationPatterns.Any(c => combined.Contains(c));
            if (!hasStrongConfirmation && !OfferPatterns.Any(o => combined.Contains(o)))
            {
                return AnalysisResult.NonJob();
            }
        }

        // Extract company first
        var company = ExtractCompany(s, b, snd, sndEmail);
        var jobTitle = ExtractRole(s, b);

        var recruiterInfo = _recruiterIntelligenceService.ExtractIntelligence(s, b, snd, sndEmail, company);

        // 2. Offer Check
        if (OfferPatterns.Any(o => combined.Contains(o)))
        {
            return new AnalysisResult
            {
                JobRelated = true,
                Company = company,
                JobTitle = jobTitle,
                Status = ApplicationStatus.OFFER,
                Classification = EmailClassification.OFFER,
                RecruiterName = recruiterInfo.Name,
                RecruiterEmail = recruiterInfo.Email,
                RecruiterTitle = recruiterInfo.Title,
                RecruiterPhone = recruiterInfo.Phone,
                RecruiterLinkedin = recruiterInfo.Linkedin,
                RecruiterType = recruiterInfo.Type,
                ContactConfidence = recruiterInfo.Confidence,
                ContactExtractionSource = recruiterInfo.Source,
                TimelineNote = "Job Offer extended!",
                Confidence = 95
            };
        }

        // 3. Rejection Check
        if (RejectionPatterns.Any(r => combined.Contains(r)))
        {
            return new AnalysisResult
            {
                JobRelated = true,
                Company = company,
                JobTitle = jobTitle,
                Status = ApplicationStatus.REJECTED,
                Classification = EmailClassification.REJECTION,
                RecruiterName = recruiterInfo.Name,
                RecruiterEmail = recruiterInfo.Email,
                RecruiterTitle = recruiterInfo.Title,
                RecruiterPhone = recruiterInfo.Phone,
                RecruiterLinkedin = recruiterInfo.Linkedin,
                RecruiterType = recruiterInfo.Type,
                ContactConfidence = recruiterInfo.Confidence,
                ContactExtractionSource = recruiterInfo.Source,
                TimelineNote = "Application status update: Not selected",
                Confidence = 95
            };
        }

        // 4. Interview Check
        if (InterviewInvitationPatterns.Any(i => combined.Contains(i)))
        {
            var isFinal = combined.Contains("final round") || combined.Contains("final interview");
            var (interviewTime, meetingLink) = ExtractInterviewDetails(b);

            return new AnalysisResult
            {
                JobRelated = true,
                Company = company,
                JobTitle = jobTitle,
                Status = isFinal ? ApplicationStatus.FINAL_INTERVIEW : ApplicationStatus.INTERVIEW,
                Classification = EmailClassification.INTERVIEW_INVITATION,
                InterviewDateTime = interviewTime,
                InterviewLink = meetingLink,
                InterviewType = isFinal ? "Final Round Interview" : "Technical Interview",
                RecruiterName = recruiterInfo.Name,
                RecruiterEmail = recruiterInfo.Email,
                RecruiterTitle = recruiterInfo.Title,
                RecruiterPhone = recruiterInfo.Phone,
                RecruiterLinkedin = recruiterInfo.Linkedin,
                RecruiterType = recruiterInfo.Type,
                ContactConfidence = recruiterInfo.Confidence,
                ContactExtractionSource = recruiterInfo.Source,
                TimelineNote = "Interview invitation received",
                Confidence = 90
            };
        }

        // 5. Assessment Check
        if (AssessmentPatterns.Any(a => combined.Contains(a)))
        {
            var deadline = ExtractDeadline(b);
            return new AnalysisResult
            {
                JobRelated = true,
                Company = company,
                JobTitle = jobTitle,
                Status = ApplicationStatus.ASSESSMENT,
                Classification = EmailClassification.ASSESSMENT,
                Deadline = deadline,
                RecruiterName = recruiterInfo.Name,
                RecruiterEmail = recruiterInfo.Email,
                RecruiterTitle = recruiterInfo.Title,
                RecruiterPhone = recruiterInfo.Phone,
                RecruiterLinkedin = recruiterInfo.Linkedin,
                RecruiterType = recruiterInfo.Type,
                ContactConfidence = recruiterInfo.Confidence,
                ContactExtractionSource = recruiterInfo.Source,
                TimelineNote = "Online assessment / coding challenge received",
                Confidence = 90
            };
        }

        // 6. Application Confirmation Check
        if (ConfirmationPatterns.Any(c => combined.Contains(c)))
        {
            return new AnalysisResult
            {
                JobRelated = true,
                Company = company,
                JobTitle = jobTitle,
                Status = ApplicationStatus.APPLIED,
                Classification = EmailClassification.APPLICATION_RECEIVED,
                RecruiterName = recruiterInfo.Name,
                RecruiterEmail = recruiterInfo.Email,
                RecruiterTitle = recruiterInfo.Title,
                RecruiterPhone = recruiterInfo.Phone,
                RecruiterLinkedin = recruiterInfo.Linkedin,
                RecruiterType = recruiterInfo.Type,
                ContactConfidence = recruiterInfo.Confidence,
                ContactExtractionSource = recruiterInfo.Source,
                TimelineNote = "Application confirmed",
                Confidence = 85
            };
        }

        // 7. Opportunity / Recruiter Message Check
        if (OpportunityPatterns.Any(o => combined.Contains(o)) || recruiterInfo.Type == RecruiterType.HUMAN_RECRUITER)
        {
            return new AnalysisResult
            {
                JobRelated = true,
                Company = company,
                JobTitle = jobTitle,
                Status = ApplicationStatus.APPLIED,
                Classification = EmailClassification.NEW_OPPORTUNITY,
                RecruiterName = recruiterInfo.Name,
                RecruiterEmail = recruiterInfo.Email,
                RecruiterTitle = recruiterInfo.Title,
                RecruiterPhone = recruiterInfo.Phone,
                RecruiterLinkedin = recruiterInfo.Linkedin,
                RecruiterType = recruiterInfo.Type,
                ContactConfidence = recruiterInfo.Confidence,
                ContactExtractionSource = recruiterInfo.Source,
                TimelineNote = "Recruiter outreach / discovered opportunity lead",
                Confidence = 80
            };
        }

        // Not identified as job related
        return AnalysisResult.NonJob();
    }

    private string ExtractCompany(string subject, string body, string sender, string senderEmail)
    {
        // 1. Try Subject: "Application to [Company]" or "Thank you for applying to [Company]"
        var subjMatch = Regex.Match(subject, @"(?i)(?:at|to|with)\s+([A-Za-z0-9&.\- ]+?)(?:\s*(?:for|as|\-|\(|\||$))");
        if (subjMatch.Success)
        {
            var cand = subjMatch.Groups[1].Value.Trim();
            if (cand.Length >= 2 && cand.Length <= 35 && !cand.Contains("your application", StringComparison.OrdinalIgnoreCase))
            {
                return CleanCompany(cand);
            }
        }

        // 2. Try Sender Name if not generic
        if (!string.IsNullOrWhiteSpace(sender) && !sender.Equals("Recruiter", StringComparison.OrdinalIgnoreCase) && !sender.Contains("@"))
        {
            var cleaned = Regex.Replace(sender, @"(?i)(Careers|Recruiting|Team|Talent|Jobs|No-Reply|Notifications)", "").Trim();
            if (cleaned.Length >= 2 && cleaned.Length <= 35)
            {
                return CleanCompany(cleaned);
            }
        }

        // 3. Try Sender Email Domain
        if (!string.IsNullOrWhiteSpace(senderEmail) && senderEmail.Contains("@"))
        {
            var domain = senderEmail[(senderEmail.IndexOf("@") + 1)..];
            var parts = domain.Split('.');
            if (parts.Length > 0 && !parts[0].Equals("gmail", StringComparison.OrdinalIgnoreCase) && !parts[0].Equals("outlook", StringComparison.OrdinalIgnoreCase) && !parts[0].Equals("greenhouse", StringComparison.OrdinalIgnoreCase) && !parts[0].Equals("lever", StringComparison.OrdinalIgnoreCase))
            {
                var name = parts[0];
                return char.ToUpper(name[0]) + name[1..];
            }
        }

        return "Unknown Company";
    }

    private string CleanCompany(string comp)
    {
        var res = Regex.Replace(comp, @"(?i)\b(team|ltd|limited|inc|corp|group|careers|jobs|recruitment|technologies|software|solutions)\b", "").Trim();
        return string.IsNullOrWhiteSpace(res) ? comp : res;
    }

    private string ExtractRole(string subject, string body)
    {
        var match = Regex.Match(subject, @"(?i)(?:for|as a|position:|role:)\s+([A-Za-z0-9\s/\-]+?)(?:at|with|in|\||-|$)", RegexOptions.IgnoreCase);
        if (match.Success)
        {
            var extracted = match.Groups[1].Value.Trim();
            if (extracted.Length > 3 && extracted.Length < 50)
            {
                return extracted;
            }
        }
        return "Software Engineer";
    }

    private (DateTime?, string?) ExtractInterviewDetails(string body)
    {
        string? link = null;
        var linkMatch = Regex.Match(body, @"https?://(?:[a-zA-Z0-9_\-]+\.)?(?:meet\.google\.com|zoom\.us|teams\.microsoft\.com)/[a-zA-Z0-9_\-\?=/]+");
        if (linkMatch.Success)
        {
            link = linkMatch.Value;
        }

        // Default to in 3 days at 11 AM if not strictly parsed
        var interviewTime = DateTime.UtcNow.AddDays(3).Date.AddHours(11);
        return (interviewTime, link);
    }

    private DateOnly? ExtractDeadline(string body)
    {
        return DateOnly.FromDateTime(DateTime.UtcNow.AddDays(5));
    }
}
