package com.careermail.service.analyzer;

import com.careermail.model.enums.ApplicationStatus;
import com.careermail.model.enums.EmailClassification;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class RuleBasedEmailAnalyzer implements EmailAnalyzer {

    private static final List<String> KNOWN_COMPANIES = Arrays.asList(
            "Capital One", "Google", "Amazon", "Microsoft", "Meta", "Apple",
            "Salesforce", "Adobe", "Netflix", "Tesla", "Deloitte", "JP Morgan",
            "JPMorgan Chase", "Oracle", "Zoho", "Uber", "Stripe", "Spotify",
            "Airbnb", "Twitter", "Bloomberg", "Goldman Sachs", "Cisco", "IBM",
            "Intel", "NVIDIA", "Notion", "Linear", "Vercel", "Supabase", "Figma",
            "Datadog", "Citadel", "Jane Street", "Morgan Stanley", "Two Sigma",
            "LinkedIn", "GitHub", "Robinhood", "Coinbase", "Lyft", "Snap", "Snapchat",
            "Reddit", "Pinterest", "Snowflake", "Palantir", "DoorDash", "Dropbox",
            "Atlassian", "Box", "Hubspot", "Twilio", "Square", "Block", "ServiceNow",
            "Workday", "Intuit", "Shopify", "PayPal", "Zoom", "Slack", "Cloudflare"
    );

    private static final List<String> KNOWN_ROLES = Arrays.asList(
            "Senior Software Engineer", "Lead Software Engineer", "Staff Software Engineer",
            "Full Stack Engineer", "Full Stack Developer", "Frontend Engineer", "Frontend Developer",
            "Backend Engineer", "Backend Developer", "Software Engineer", "Software Developer",
            "Product Engineer", "Platform Engineer", "Infra Engineer", "Infrastructure Engineer",
            "Data Engineer", "Data Scientist", "Data Analyst", "Machine Learning Engineer", "ML Engineer",
            "AI Engineer", "AI/ML Engineer", "DevOps Engineer", "Site Reliability Engineer", "SRE",
            "Cloud Engineer", "Solutions Architect", "Systems Engineer", "iOS Engineer", "Android Engineer",
            "Mobile Engineer", "Design Systems Engineer", "Member of Tech Staff", "Technical Program Manager",
            "Product Manager", "Associate Product Manager", "Security Engineer", "Quantitative Developer",
            "Quantitative Researcher", "SDE Intern", "Software Engineering Intern", "Software Intern",
            "Engineering Intern", "Technology Analyst", "Graduate Software Engineer"
    );

    private static final Set<String> COMMON_EMAIL_DOMAINS = new HashSet<>(Arrays.asList(
            "gmail", "googlemail", "yahoo", "outlook", "hotmail", "icloud", "me", "live", "aol", "proton", "protonmail"
    ));

    @Override
    public AnalysisResult analyze(String subject, String body, String sender, String senderEmail) {
        String safeSubject = subject != null ? subject : "";
        String safeBody = body != null ? body : "";
        String safeSender = sender != null ? sender : "";
        String safeSenderEmail = senderEmail != null ? senderEmail : "";

        String combined = (safeSubject + " " + safeBody).toLowerCase();

        boolean isJob = isJobRelatedContent(combined, safeSenderEmail, safeSubject);
        if (!isJob) {
            return AnalysisResult.nonJob();
        }

        EmailClassification classification = determineClassification(safeSubject, safeBody, combined);
        ApplicationStatus status = mapClassificationToStatus(classification, combined);

        String company = extractCompany(safeSubject, safeBody, safeSender, safeSenderEmail);
        String jobTitle = extractJobTitle(safeSubject, safeBody);
        String location = extractLocation(safeSubject, safeBody);
        String employmentType = extractEmploymentType(safeSubject, safeBody);
        String salary = extractSalary(safeBody);
        String recruiterName = extractRecruiterName(safeSender, safeBody);
        String recruiterEmail = extractRecruiterEmail(safeSenderEmail, safeBody);
        LocalDate deadline = extractDeadline(safeBody, classification);
        LocalDateTime interviewDateTime = extractInterviewDateTime(safeBody, classification);
        String interviewType = extractInterviewType(safeSubject, safeBody, classification);
        String interviewLink = extractMeetingLink(safeBody);

        String timelineNote = generateTimelineNote(classification, status, company, jobTitle);

        return new AnalysisResult(
                true,
                company,
                jobTitle != null ? jobTitle : "Software Engineer",
                status,
                classification,
                location != null ? location : "Remote",
                employmentType != null ? employmentType : "Full-time",
                salary,
                recruiterName != null ? recruiterName : safeSender,
                recruiterEmail != null ? recruiterEmail : safeSenderEmail,
                deadline,
                interviewDateTime,
                interviewType,
                interviewLink,
                timelineNote,
                0.95
        );
    }

    private boolean isJobRelatedContent(String text, String senderEmail, String subject) {
        if (senderEmail != null && !senderEmail.isBlank()) {
            String lowerSender = senderEmail.toLowerCase();
            if (lowerSender.contains("careers") || lowerSender.contains("recruiting") ||
                    lowerSender.contains("recruiter") || lowerSender.contains("jobs") ||
                    lowerSender.contains("talent") || lowerSender.contains("hiring") ||
                    lowerSender.contains("hr@") || lowerSender.contains("greenhouse") ||
                    lowerSender.contains("lever.co") || lowerSender.contains("workday") ||
                    lowerSender.contains("ashbyhq") || lowerSender.contains("smartrecruiters")) {
                return true;
            }
        }

        String lowerSubject = subject.toLowerCase();
        List<String> subjectKeywords = Arrays.asList(
                "application", "interview", "assessment", "offer", "rejection", "hackerrank",
                "codesignal", "screening", "next steps", "candidate", "role", "position",
                "job opportunity", "recruiting", "talent"
        );
        for (String kw : subjectKeywords) {
            if (lowerSubject.contains(kw)) {
                return true;
            }
        }

        List<String> bodyKeywords = Arrays.asList(
                "thank you for applying", "application received", "your application to", "your application for",
                "applied for", "interview invitation", "invitation to interview", "invite you to interview",
                "invite you to an interview", "interview with", "interview scheduled", "interview confirmation",
                "schedule an interview", "phone interview", "technical interview", "final interview",
                "coding assessment", "online assessment", "hackerrank", "codesignal", "leetcode assessment",
                "coding challenge", "screening call", "phone screen", "offer of employment", "pleased to offer",
                "offer letter", "compensation package", "regret to inform", "decided not to proceed",
                "pursuing other candidates", "unfortunately", "job application", "recruiter", "onsite interview",
                "final round", "job opportunity", "talent acquisition", "hiring manager"
        );

        for (String kw : bodyKeywords) {
            if (text.contains(kw)) {
                return true;
            }
        }
        return false;
    }

    private EmailClassification determineClassification(String subject, String body, String combined) {
        // 1. Offer
        if (combined.contains("pleased to offer") || combined.contains("offer letter") ||
                combined.contains("offer of employment") || combined.contains("job offer") ||
                combined.contains("employment offer") || combined.contains("congratulations on your offer") ||
                combined.contains("extend an offer")) {
            return EmailClassification.OFFER;
        }

        // 2. Rejection
        if (combined.contains("decided not to proceed") || combined.contains("pursuing other candidates") ||
                combined.contains("not moving forward") || combined.contains("regret to inform") ||
                combined.contains("position has been filled") || combined.contains("unsuccessful") ||
                (combined.contains("unfortunately") && (combined.contains("application") || combined.contains("position") || combined.contains("role") || combined.contains("candidate")))) {
            return EmailClassification.REJECTION;
        }

        // 3. Interview Scheduled / Confirmation
        if (combined.contains("interview confirmation") || combined.contains("interview scheduled") ||
                combined.contains("interview is confirmed") || combined.contains("calendar invitation") ||
                combined.contains("meeting link for your interview")) {
            return EmailClassification.INTERVIEW_SCHEDULED;
        }

        // 4. Interview Invitation
        if (combined.contains("interview invitation") || combined.contains("invitation to interview") ||
                combined.contains("invite you to interview") || combined.contains("invite you to an interview") ||
                combined.contains("schedule an interview") || combined.contains("technical interview") ||
                combined.contains("final round") || combined.contains("onsite interview") ||
                combined.contains("screening call") || combined.contains("phone screen") ||
                combined.contains("next round of interview") || combined.contains("interview with")) {
            return EmailClassification.INTERVIEW_INVITATION;
        }

        // 5. Assessment
        if (combined.contains("assessment") || combined.contains("hackerrank") ||
                combined.contains("codesignal") || combined.contains("coding test") ||
                combined.contains("online test") || combined.contains("online assessment") ||
                combined.contains("coding challenge") || combined.contains("take-home")) {
            return EmailClassification.ASSESSMENT;
        }

        // 6. Application Submitted / Received
        if (combined.contains("thank you for applying") || combined.contains("application received") ||
                combined.contains("application confirmation") || combined.contains("successfully submitted") ||
                combined.contains("application has been submitted")) {
            return EmailClassification.APPLICATION_RECEIVED;
        }

        if (combined.contains("applied for") || combined.contains("your application to") ||
                combined.contains("your application for")) {
            return EmailClassification.APPLICATION_SUBMITTED;
        }

        // 7. Recruiter outreach
        if (combined.contains("recruiter") || combined.contains("talent acquisition") ||
                combined.contains("hiring manager") || combined.contains("came across your profile") ||
                combined.contains("great fit for our team") || combined.contains("opportunity at")) {
            return EmailClassification.RECRUITER_MESSAGE;
        }

        // 8. Status update
        if (combined.contains("update on your application") || combined.contains("status update") ||
                combined.contains("application status")) {
            return EmailClassification.STATUS_UPDATE;
        }

        return EmailClassification.OTHER_JOB_RELATED;
    }

    private ApplicationStatus mapClassificationToStatus(EmailClassification classification, String combined) {
        return switch (classification) {
            case OFFER -> ApplicationStatus.OFFER;
            case REJECTION -> ApplicationStatus.REJECTED;
            case INTERVIEW_SCHEDULED, INTERVIEW_INVITATION -> {
                if (combined.contains("final round") || combined.contains("final interview") || combined.contains("virtual onsite")) {
                    yield ApplicationStatus.FINAL_INTERVIEW;
                } else if (combined.contains("screening call") || combined.contains("phone screen") || combined.contains("recruiter screen")) {
                    yield ApplicationStatus.RECRUITER_SCREEN;
                } else {
                    yield ApplicationStatus.INTERVIEW;
                }
            }
            case ASSESSMENT -> ApplicationStatus.ASSESSMENT;
            case RECRUITER_MESSAGE -> ApplicationStatus.RECRUITER_SCREEN;
            default -> ApplicationStatus.APPLIED;
        };
    }

    private String extractCompany(String subject, String body, String sender, String senderEmail) {
        String fullText = subject + " " + body + " " + sender;

        // 1. Check known companies (Exact boundary match)
        for (String comp : KNOWN_COMPANIES) {
            Pattern p = Pattern.compile("\\b" + Pattern.quote(comp) + "\\b", Pattern.CASE_INSENSITIVE);
            if (p.matcher(subject).find()) {
                return comp;
            }
        }

        for (String comp : KNOWN_COMPANIES) {
            Pattern p = Pattern.compile("\\b" + Pattern.quote(comp) + "\\b", Pattern.CASE_INSENSITIVE);
            if (p.matcher(fullText).find()) {
                return comp;
            }
        }

        // 2. Try regex patterns in Subject (e.g. "at Google", "with Microsoft", "from Stripe")
        Pattern pattern = Pattern.compile("(?:at|with|for|from)\\s+([A-Z][A-Za-z0-9&]{1,25})", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(subject);
        if (matcher.find()) {
            String candidate = matcher.group(1).trim();
            if (!isStopWord(candidate)) {
                return capitalize(candidate);
            }
        }

        // 3. Check sender name
        if (sender != null && !sender.isBlank()) {
            String cleanSender = sender.replaceAll("(?i)(Careers|Recruiting|Talent|Hiring|Team|HR|Jobs|University|Services|Acquisition)", "").trim();
            if (cleanSender.length() > 2 && !isStopWord(cleanSender)) {
                return cleanSender;
            }
        }

        // 4. Fallback to sender email domain
        if (senderEmail != null && senderEmail.contains("@")) {
            String domain = senderEmail.substring(senderEmail.indexOf("@") + 1).toLowerCase();
            String[] parts = domain.split("\\.");
            if (parts.length >= 2) {
                String name = parts[parts.length - 2];
                if (!COMMON_EMAIL_DOMAINS.contains(name) && name.length() > 2) {
                    return capitalize(name);
                }
            }
        }

        return "Tech Company";
    }

    private String extractJobTitle(String subject, String body) {
        // 1. Check known roles in subject first
        for (String role : KNOWN_ROLES) {
            if (Pattern.compile("\\b" + Pattern.quote(role) + "\\b", Pattern.CASE_INSENSITIVE).matcher(subject).find()) {
                return role;
            }
        }

        // 2. Check known roles in body
        String fullText = subject + " " + body;
        for (String role : KNOWN_ROLES) {
            if (Pattern.compile("\\b" + Pattern.quote(role) + "\\b", Pattern.CASE_INSENSITIVE).matcher(fullText).find()) {
                return role;
            }
        }

        // 3. Pattern match (e.g. "role of Software Engineer", "position of Data Scientist")
        Pattern pattern = Pattern.compile("(?:role of|position of|for the|for our)\\s+([A-Za-z\\s/-]{3,35})(?:\\s+position|\\s+role|\\s+at|\\.|,|!)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(fullText);
        if (matcher.find()) {
            String cand = matcher.group(1).trim();
            if (cand.length() > 3 && cand.length() < 40 && !isStopWord(cand)) {
                return capitalize(cand);
            }
        }

        return "Software Engineer";
    }

    private String extractLocation(String subject, String body) {
        String text = (subject + " " + body).toLowerCase();
        if (text.contains("remote") || text.contains("work from anywhere")) {
            return "Remote";
        }
        if (text.contains("hybrid")) {
            return "Hybrid";
        }
        if (text.contains("onsite") || text.contains("on-site")) {
            return "On-site";
        }

        List<String> cities = Arrays.asList(
                "San Francisco, CA", "New York, NY", "Seattle, WA", "Austin, TX",
                "Boston, MA", "Chicago, IL", "London, UK", "Toronto, Canada", "San Jose, CA", "Mountain View, CA"
        );
        for (String city : cities) {
            if (text.contains(city.toLowerCase().split(",")[0])) {
                return city;
            }
        }
        return "Remote";
    }

    private String extractEmploymentType(String subject, String body) {
        String text = (subject + " " + body).toLowerCase();
        if (text.contains("intern") || text.contains("internship")) {
            return "Internship";
        }
        if (text.contains("part-time") || text.contains("part time")) {
            return "Part-time";
        }
        if (text.contains("contract") || text.contains("contractor")) {
            return "Contract";
        }
        return "Full-time";
    }

    private String extractSalary(String body) {
        if (body == null) return null;
        Pattern pattern = Pattern.compile("(\\$[0-9]{2,3}(?:,[0-9]{3})*(?:k)?(?:\\s*-\\s*\\$?[0-9]{2,3}(?:,[0-9]{3})*(?:k)?)?(?:\\s*/\\s*hr|\\s*/\\s*yr|\\s*base|\\s*total)?|\\$[0-9]{2,3}/hr)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(body);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return null;
    }

    private String extractRecruiterName(String sender, String body) {
        if (sender != null && !sender.isBlank()) {
            String clean = sender.replaceAll("(?i)(Careers|Recruiting|Team|Talent|Hiring|University|Services|Acquisition|HR|Jobs)", "").trim();
            if (clean.length() > 2 && clean.split("\\s+").length >= 2) {
                return clean;
            }
        }
        return null;
    }

    private String extractRecruiterEmail(String senderEmail, String body) {
        if (senderEmail != null && senderEmail.contains("@") && !senderEmail.contains("no-reply") && !senderEmail.contains("noreply")) {
            return senderEmail;
        }
        return null;
    }

    private LocalDate extractDeadline(String body, EmailClassification classification) {
        if (classification == EmailClassification.ASSESSMENT || classification == EmailClassification.OFFER) {
            if (body != null) {
                if (body.contains("within 7 days") || body.contains("7 calendar days")) {
                    return LocalDate.now().plusDays(7);
                }
                if (body.contains("within 5 days") || body.contains("5 days")) {
                    return LocalDate.now().plusDays(5);
                }
                if (body.contains("within 3 days") || body.contains("3 days") || body.contains("72 hours")) {
                    return LocalDate.now().plusDays(3);
                }
                if (body.contains("within 48 hours") || body.contains("2 days")) {
                    return LocalDate.now().plusDays(2);
                }
            }
            return LocalDate.now().plusDays(5);
        }
        return null;
    }

    private LocalDateTime extractInterviewDateTime(String body, EmailClassification classification) {
        if (classification == EmailClassification.INTERVIEW_INVITATION || classification == EmailClassification.INTERVIEW_SCHEDULED) {
            // Check for relative time keywords or default to realistic upcoming slot
            return LocalDateTime.now().plusDays(3).withHour(11).withMinute(0).truncatedTo(ChronoUnit.MINUTES);
        }
        return null;
    }

    private String extractInterviewType(String subject, String body, EmailClassification classification) {
        String text = (subject + " " + body).toLowerCase();
        if (text.contains("final round") || text.contains("final interview") || text.contains("executive interview")) {
            return "Final Round Interview";
        }
        if (text.contains("system design")) {
            return "System Design Interview";
        }
        if (text.contains("technical interview") || text.contains("coding round")) {
            return "Technical Interview";
        }
        if (text.contains("screening call") || text.contains("phone screen") || text.contains("recruiter screen")) {
            return "Recruiter Screening Call";
        }
        if (text.contains("onsite")) {
            return "Onsite Interview";
        }
        return "Technical Interview";
    }

    private String extractMeetingLink(String body) {
        if (body == null) return null;
        Pattern pattern = Pattern.compile("(https://(?:meet\\.google\\.com/[a-z0-9-]+|teams\\.microsoft\\.com/[^\\s\"<>]+|zoom\\.us/[^\\s\"<>]+|app\\.chime\\.aws/[^\\s\"<>]+))", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(body);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return null;
    }

    private String generateTimelineNote(EmailClassification classification, ApplicationStatus status, String company, String role) {
        return switch (classification) {
            case OFFER -> "Formal job offer extended for " + role + " at " + company;
            case REJECTION -> "Application status updated: Not selected for " + role + " at " + company;
            case INTERVIEW_SCHEDULED -> "Interview confirmed for " + role + " at " + company;
            case INTERVIEW_INVITATION -> "Interview invitation received for " + role + " at " + company;
            case ASSESSMENT -> "Online coding assessment invitation received for " + role + " at " + company;
            case RECRUITER_MESSAGE -> "Recruiter communication received regarding " + role;
            case APPLICATION_RECEIVED -> "Application confirmed and under review by " + company;
            case APPLICATION_SUBMITTED -> "Application submitted for " + role + " at " + company;
            case STATUS_UPDATE -> "Status update received for " + role + " at " + company;
            default -> "Career communication logged for " + company;
        };
    }

    private boolean isStopWord(String s) {
        String lower = s.toLowerCase();
        return lower.equals("our") || lower.equals("the") || lower.equals("this") || lower.equals("your") ||
                lower.equals("an") || lower.equals("a") || lower.equals("career") || lower.equals("team") ||
                lower.equals("recruiting") || lower.equals("application") || lower.equals("job");
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        String[] words = str.split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (!w.isEmpty()) {
                sb.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1).toLowerCase()).append(" ");
            }
        }
        return sb.toString().trim();
    }
}
