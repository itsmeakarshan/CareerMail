package com.careermail.service.analyzer;

import com.careermail.model.enums.ApplicationStatus;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class RuleBasedEmailAnalyzer implements EmailAnalyzer {

    private static final List<String> KNOWN_COMPANIES = Arrays.asList(
            "Capital One", "Google", "Amazon", "Microsoft", "Meta", "Apple",
            "Salesforce", "Adobe", "Netflix", "Tesla", "Deloitte", "JP Morgan",
            "Oracle", "Zoho", "Uber", "Stripe", "Spotify", "Airbnb", "Twitter",
            "Bloomberg", "Goldman Sachs", "Cisco", "IBM", "Intel", "NVIDIA"
    );

    private static final List<String> KNOWN_ROLES = Arrays.asList(
            "Software Engineer", "Frontend Engineer", "Backend Engineer",
            "Full Stack Engineer", "Product Engineer", "Data Analyst",
            "Data Scientist", "SDE Intern", "Software Engineering Intern",
            "Member of Tech Staff", "Cloud Engineer", "Product Manager",
            "DevOps Engineer", "Machine Learning Engineer", "Solutions Architect"
    );

    @Override
    public AnalysisResult analyze(String subject, String body, String sender, String senderEmail) {
        String combined = (subject + " " + body).toLowerCase();

        boolean isJob = isJobRelatedContent(combined, senderEmail);
        if (!isJob) {
            return new AnalysisResult(false, null, null, null, null, null, null, 0.0);
        }

        String company = extractCompany(subject, body, sender, senderEmail);
        String jobTitle = extractJobTitle(subject, body);
        ApplicationStatus status = determineStatus(combined);
        String timelineNote = generateTimelineNote(status, company, jobTitle);

        return new AnalysisResult(
                true,
                company,
                jobTitle != null ? jobTitle : "Software Engineer",
                status,
                sender,
                senderEmail,
                timelineNote,
                0.92
        );
    }

    private boolean isJobRelatedContent(String text, String senderEmail) {
        if (senderEmail != null && (senderEmail.contains("careers") || senderEmail.contains("recruiting") ||
                senderEmail.contains("jobs") || senderEmail.contains("talent"))) {
            return true;
        }

        List<String> keywords = Arrays.asList(
                "thank you for applying", "application received", "your application to",
                "applied for", "interview invitation", "invitation to interview",
                "assessment", "hackerrank", "codesignal", "screening call",
                "phone screen", "offer of employment", "pleased to offer",
                "regret to inform", "decided not to proceed", "other candidates",
                "job application", "recruiter", "onsite interview", "final round"
        );

        for (String kw : keywords) {
            if (text.contains(kw)) {
                return true;
            }
        }
        return false;
    }

    private String extractCompany(String subject, String body, String sender, String senderEmail) {
        String fullText = subject + " " + body + " " + sender;

        // 1. Check known companies
        for (String comp : KNOWN_COMPANIES) {
            if (Pattern.compile("\\b" + Pattern.quote(comp) + "\\b", Pattern.CASE_INSENSITIVE).matcher(fullText).find()) {
                return comp;
            }
        }

        // 2. Try regex patterns (e.g. "at Google", "with Microsoft")
        Pattern pattern = Pattern.compile("(?:at|with|for)\\s+([A-Z][A-Za-z0-9&]{2,20})", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(subject);
        if (matcher.find()) {
            String candidate = matcher.group(1).trim();
            if (!candidate.equalsIgnoreCase("our") && !candidate.equalsIgnoreCase("the") && !candidate.equalsIgnoreCase("this")) {
                return candidate;
            }
        }

        // 3. Fallback to sender email domain
        if (senderEmail != null && senderEmail.contains("@")) {
            String domain = senderEmail.substring(senderEmail.indexOf("@") + 1);
            String[] parts = domain.split("\\.");
            if (parts.length >= 2) {
                String name = parts[parts.length - 2];
                if (!name.equalsIgnoreCase("gmail") && !name.equalsIgnoreCase("yahoo") && !name.equalsIgnoreCase("outlook")) {
                    return Character.toUpperCase(name.charAt(0)) + name.substring(1);
                }
            }
        }

        return "Tech Company";
    }

    private String extractJobTitle(String subject, String body) {
        String fullText = subject + " " + body;

        // 1. Check known roles
        for (String role : KNOWN_ROLES) {
            if (Pattern.compile("\\b" + Pattern.quote(role) + "\\b", Pattern.CASE_INSENSITIVE).matcher(fullText).find()) {
                return role;
            }
        }

        // 2. Pattern match
        Pattern pattern = Pattern.compile("(?:role of|position of|for the)\\s+([A-Za-z\\s]{4,30})(?:\\s+position|\\s+role|\\s+at|\\.|,)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(fullText);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }

        return "Software Engineer";
    }

    private ApplicationStatus determineStatus(String text) {
        if (text.contains("pleased to offer") || text.contains("offer letter") || text.contains("congratulations on your offer") || text.contains("offer received")) {
            return ApplicationStatus.OFFER;
        }
        if (text.contains("decided not to proceed") || text.contains("pursuing other candidates") ||
                text.contains("not moving forward") || text.contains("regret to inform") || text.contains("position has been filled")) {
            return ApplicationStatus.REJECTED;
        }
        if (text.contains("final round") || text.contains("final interview") || text.contains("executive interview")) {
            return ApplicationStatus.FINAL_INTERVIEW;
        }
        if (text.contains("interview invitation") || text.contains("invite you to interview") ||
                text.contains("technical interview") || text.contains("onsite interview") || text.contains("next round of interview")) {
            return ApplicationStatus.INTERVIEW;
        }
        if (text.contains("screening call") || text.contains("recruiter screen") || text.contains("phone screen") || text.contains("chat with our recruiter")) {
            return ApplicationStatus.RECRUITER_SCREEN;
        }
        if (text.contains("assessment") || text.contains("hackerrank") || text.contains("codesignal") || text.contains("coding test")) {
            return ApplicationStatus.ASSESSMENT;
        }
        return ApplicationStatus.APPLIED;
    }

    private String generateTimelineNote(ApplicationStatus status, String company, String role) {
        return switch (status) {
            case OFFER -> "Formal job offer extended for " + role + " at " + company;
            case FINAL_INTERVIEW -> "Advanced to Final Round Interview for " + role;
            case INTERVIEW -> "Interview scheduled for " + role;
            case RECRUITER_SCREEN -> "Recruiter screening call arranged";
            case ASSESSMENT -> "Online coding assessment invitation received";
            case REJECTED -> "Application status updated: Not selected";
            case WITHDRAWN -> "Application withdrawn";
            default -> "Application submitted for " + role + " at " + company;
        };
    }
}
