package com.careermail.service;

import com.careermail.dto.AssistantCardDTO;
import com.careermail.dto.AssistantEmailDraftDTO;
import com.careermail.dto.AssistantQueryRequest;
import com.careermail.dto.AssistantQueryResponse;
import com.careermail.model.entity.*;
import com.careermail.model.enums.ApplicationStatus;
import com.careermail.model.enums.FollowUpStatus;
import com.careermail.model.enums.InterviewStatus;
import com.careermail.model.enums.RecruiterType;
import com.careermail.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CareerAssistantService {

    private static final Logger log = LoggerFactory.getLogger(CareerAssistantService.class);

    private final JobApplicationRepository jobApplicationRepository;
    private final InterviewRepository interviewRepository;
    private final FollowUpRepository followUpRepository;
    private final EmailRepository emailRepository;
    private final TimelineEventRepository timelineEventRepository;
    private final AuthService authService;

    public CareerAssistantService(JobApplicationRepository jobApplicationRepository,
                                  InterviewRepository interviewRepository,
                                  FollowUpRepository followUpRepository,
                                  EmailRepository emailRepository,
                                  TimelineEventRepository timelineEventRepository,
                                  AuthService authService) {
        this.jobApplicationRepository = jobApplicationRepository;
        this.interviewRepository = interviewRepository;
        this.followUpRepository = followUpRepository;
        this.emailRepository = emailRepository;
        this.timelineEventRepository = timelineEventRepository;
        this.authService = authService;
    }

    @Transactional(readOnly = true)
    public AssistantQueryResponse askAssistant(AssistantQueryRequest request) {
        User user = authService.getCurrentUser();
        String rawQuery = request.getQuery() != null ? request.getQuery().trim() : "";
        String q = rawQuery.toLowerCase();
        String action = request.getAction() != null ? request.getAction().toUpperCase() : "";

        log.info("Processing assistant query for user {}: action='{}', query='{}'", user.getEmail(), action, rawQuery);

        // Safe Context Resolution
        JobApplication contextApp = null;
        if (request.getSelectedApplicationId() != null) {
            contextApp = jobApplicationRepository.findByIdAndUser(request.getSelectedApplicationId(), user).orElse(null);
        }

        // Quick suggestions
        List<String> defaultSuggestions = Arrays.asList(
                "✨ What should I do next?",
                "📊 Analyze my job search progress",
                "👤 Show identified recruiters",
                "⏰ Which applications need follow-up?",
                "✉️ Draft a follow-up email"
        );

        // 1. WHAT SHOULD I DO NEXT? (Explicit action or NLP keyword)
        if ("WHAT_NEXT".equals(action) || q.contains("what should i do next") || q.contains("what next") ||
                q.contains("priorities") || q.contains("action plan") || q.contains("to do") || q.contains("todo")) {
            return handleWhatShouldIDoNext(user, defaultSuggestions);
        }

        // 2. AI JOB SEARCH ANALYTICS / PROGRESS
        if ("ANALYZE_PROGRESS".equals(action) || q.contains("analyze") || q.contains("analytics") ||
                q.contains("conversion rate") || q.contains("response rate") || q.contains("progress") ||
                q.contains("performance") || q.contains("stats") || q.contains("how am i doing")) {
            return handleAnalyzeProgress(user, defaultSuggestions);
        }

        // 3. NEEDS ATTENTION / STALE / OVERDUE
        if ("NEEDS_ATTENTION".equals(action) || q.contains("needs attention") || q.contains("attention") ||
                q.contains("overdue") || q.contains("waiting too long") || q.contains("pending too long") ||
                q.contains("stale") || q.contains("no response")) {
            return handleNeedsAttention(user, defaultSuggestions);
        }

        // 4. SMART EMAIL DRAFTING / ASSISTANT
        if ("DRAFT_REPLY".equals(action) || q.contains("draft") || q.contains("write an email") ||
                q.contains("help me reply") || q.contains("thank you email") || q.contains("follow-up email") ||
                q.contains("reply to recruiter") || q.contains("rewrite email") || q.contains("compose")) {
            return handleEmailDrafting(user, q, contextApp, defaultSuggestions);
        }

        // 5. RECRUITER INTELLIGENCE
        if ("FIND_RECRUITERS".equals(action) || q.contains("recruiter") || q.contains("contact") ||
                q.contains("who reached out") || q.contains("talent acquisition") || q.contains("hiring manager")) {
            return handleRecruiterIntelligence(user, defaultSuggestions);
        }

        // 6. INTERVIEWS INQUIRY
        if (q.contains("interview") || q.contains("schedule") || q.contains("upcoming call") || q.contains("when is my next")) {
            return handleInterviewsInquiry(user, defaultSuggestions);
        }

        // 7. FOLLOW-UPS INQUIRY
        if (q.contains("follow up") || q.contains("follow-up") || q.contains("due follow-up")) {
            return handleFollowUpsInquiry(user, defaultSuggestions);
        }

        // 8. REJECTIONS / OFFERS SPECIFIC QUERY
        if (q.contains("reject") || q.contains("declined") || q.contains("turn down")) {
            return handleRejectionsInquiry(user, defaultSuggestions);
        }
        if (q.contains("offer") || q.contains("package") || q.contains("accepted")) {
            return handleOffersInquiry(user, defaultSuggestions);
        }

        // 9. CONTEXT-AWARE APPLICATION SUMMARY / SPECIFIC APPLICATION QUERY
        if (contextApp != null && (q.contains("this application") || q.contains("summarize") || q.contains("summary") || q.contains("status of this") || q.contains("what should i do with this"))) {
            return handleContextAppSummary(contextApp, user, defaultSuggestions);
        }

        // 10. SPECIFIC COMPANY SEARCH
        List<JobApplication> allApps = jobApplicationRepository.findByUser(user);
        for (JobApplication app : allApps) {
            if (q.contains(app.getCompany().toLowerCase())) {
                return handleCompanyLookup(app, defaultSuggestions);
            }
        }

        // 11. NATURAL LANGUAGE SEARCH (e.g. "show Data Science applications", "search remote roles")
        if (q.contains("show") || q.contains("find") || q.contains("search") || q.contains("list") || q.contains("filter")) {
            return handleNaturalLanguageSearch(user, q, defaultSuggestions);
        }

        // 12. DEFAULT INTELLIGENT EXECUTIVE BRIEFING
        return handleExecutiveBriefing(user, contextApp, defaultSuggestions);
    }

    // =========================================================================
    // 1. WHAT SHOULD I DO NEXT?
    // =========================================================================
    private AssistantQueryResponse handleWhatShouldIDoNext(User user, List<String> suggestions) {
        List<JobApplication> apps = jobApplicationRepository.findByUser(user);
        List<Interview> upcomingInterviews = interviewRepository.findByUserAndStatusOrderByInterviewDateAsc(user, InterviewStatus.SCHEDULED);
        List<FollowUp> pendingFollowUps = followUpRepository.findByUserAndStatusOrderByDueDateAsc(user, FollowUpStatus.PENDING);

        List<AssistantCardDTO> actionCards = new ArrayList<>();
        StringBuilder sb = new StringBuilder();
        sb.append("🎯 **Here is your actionable priority list based on your live CareerMail data:**\n\n");

        int urgentCount = 0;
        int attentionCount = 0;
        int upcomingCount = 0;
        int positiveCount = 0;

        // 🔴 URGENT: Interviews in next 48h
        LocalDateTime now = LocalDateTime.now();
        for (Interview interview : upcomingInterviews) {
            long hoursAway = ChronoUnit.HOURS.between(now, interview.getInterviewDate());
            if (hoursAway >= 0 && hoursAway <= 48) {
                urgentCount++;
                sb.append(String.format("🔴 **Urgent (In %d hours):** Prepare for your interview with **%s** for **%s** (%s).\n",
                        hoursAway, interview.getCompany(), interview.getTitle(), interview.getType()));

                actionCards.add(new AssistantCardDTO(
                        "INTERVIEW",
                        interview.getId(),
                        interview.getCompany() + " — " + interview.getTitle(),
                        "Interview in " + hoursAway + " hours (" + interview.getType() + ")",
                        "URGENT INTERVIEW",
                        "red",
                        "URGENT",
                        "/tracker",
                        interview.getCompany(),
                        interview.getTitle(),
                        "INTERVIEW",
                        interview.getInterviewDate().toString(),
                        null,
                        null
                ));
            }
        }

        // 🔴 URGENT: Overdue follow-ups
        LocalDate today = LocalDate.now();
        for (FollowUp f : pendingFollowUps) {
            if (f.getDueDate() != null && f.getDueDate().isBefore(today)) {
                urgentCount++;
                long daysOverdue = ChronoUnit.DAYS.between(f.getDueDate(), today);
                sb.append(String.format("🔴 **Urgent (Overdue by %d days):** Send follow-up to **%s** for **%s**.\n",
                        daysOverdue, f.getCompany(), f.getRole() != null ? f.getRole() : "Role"));

                actionCards.add(new AssistantCardDTO(
                        "FOLLOW_UP",
                        f.getId(),
                        f.getCompany() + " — Follow-up Overdue",
                        "Was due on " + f.getDueDate() + " (" + daysOverdue + "d ago)",
                        "OVERDUE",
                        "red",
                        "URGENT",
                        "/tracker",
                        f.getCompany(),
                        f.getRole(),
                        "PENDING",
                        f.getDueDate().toString(),
                        null,
                        null
                ));
            }
        }

        // 🟠 NEEDS ATTENTION: Follow-ups due today / this week
        for (FollowUp f : pendingFollowUps) {
            if (f.getDueDate() != null && (f.getDueDate().isEqual(today) || (f.getDueDate().isAfter(today) && f.getDueDate().isBefore(today.plusDays(4))))) {
                attentionCount++;
                sb.append(String.format("🟠 **Needs Attention:** Follow-up due with **%s** on **%s**.\n",
                        f.getCompany(), f.getDueDate().isEqual(today) ? "TODAY" : f.getDueDate().toString()));

                actionCards.add(new AssistantCardDTO(
                        "FOLLOW_UP",
                        f.getId(),
                        f.getCompany() + " — Follow-up Due " + (f.getDueDate().isEqual(today) ? "Today" : f.getDueDate().toString()),
                        f.getRole() != null ? f.getRole() : "Application Check-in",
                        "DUE SOON",
                        "orange",
                        "ATTENTION",
                        "/tracker",
                        f.getCompany(),
                        f.getRole(),
                        "PENDING",
                        f.getDueDate().toString(),
                        null,
                        null
                ));
            }
        }

        // 🟠 NEEDS ATTENTION: Stale applications waiting > 12 days
        List<JobApplication> staleApps = apps.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.APPLIED || a.getStatus() == ApplicationStatus.RECRUITER_SCREEN)
                .filter(a -> a.getDateApplied() != null && ChronoUnit.DAYS.between(a.getDateApplied(), today) >= 12)
                .limit(3)
                .collect(Collectors.toList());

        for (JobApplication stale : staleApps) {
            long days = ChronoUnit.DAYS.between(stale.getDateApplied(), today);
            attentionCount++;
            sb.append(String.format("🟠 **Needs Attention:** Applied to **%s** (%s) %d days ago with no response. Consider sending a polite follow-up.\n",
                    stale.getCompany(), stale.getTitle(), days));

            actionCards.add(new AssistantCardDTO(
                    "APPLICATION",
                    stale.getId(),
                    stale.getCompany() + " — " + stale.getTitle(),
                    "Waiting " + days + " days since applied (" + stale.getDateApplied() + ")",
                    "NO RESPONSE (" + days + "d)",
                    "orange",
                    "ATTENTION",
                    "/tracker",
                    stale.getCompany(),
                    stale.getTitle(),
                    stale.getStatus().name(),
                    stale.getDateApplied().toString(),
                    stale.getRecruiterName(),
                    stale.getRecruiterEmail()
            ));
        }

        // 🔵 UPCOMING: Interviews in > 48h
        for (Interview interview : upcomingInterviews) {
            long hoursAway = ChronoUnit.HOURS.between(now, interview.getInterviewDate());
            if (hoursAway > 48) {
                upcomingCount++;
                long days = hoursAway / 24;
                sb.append(String.format("🔵 **Upcoming (In %d days):** Interview scheduled with **%s** for **%s** on %s.\n",
                        days, interview.getCompany(), interview.getTitle(), interview.getInterviewDate().toLocalDate()));

                actionCards.add(new AssistantCardDTO(
                        "INTERVIEW",
                        interview.getId(),
                        interview.getCompany() + " — " + interview.getTitle(),
                        "Interview on " + interview.getInterviewDate().toLocalDate() + " (" + interview.getType() + ")",
                        "UPCOMING",
                        "blue",
                        "UPCOMING",
                        "/tracker",
                        interview.getCompany(),
                        interview.getTitle(),
                        "INTERVIEW",
                        interview.getInterviewDate().toString(),
                        null,
                        null
                ));
            }
        }

        // 🟢 POSITIVE PROGRESS: Active Offers & Advancements
        List<JobApplication> offers = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.OFFER).collect(Collectors.toList());
        for (JobApplication offer : offers) {
            positiveCount++;
            sb.append(String.format("🟢 **Positive Progress:** Job Offer from **%s** (%s)! Review terms or negotiate.\n",
                    offer.getCompany(), offer.getTitle()));

            actionCards.add(new AssistantCardDTO(
                    "APPLICATION",
                    offer.getId(),
                    "🎉 " + offer.getCompany() + " — Offer Received!",
                    offer.getTitle() + (offer.getSalary() != null ? " • " + offer.getSalary() : ""),
                    "JOB OFFER",
                    "green",
                    "POSITIVE",
                    "/tracker",
                    offer.getCompany(),
                    offer.getTitle(),
                    "OFFER",
                    offer.getDateApplied() != null ? offer.getDateApplied().toString() : "",
                    offer.getRecruiterName(),
                    offer.getRecruiterEmail()
            ));
        }

        if (urgentCount == 0 && attentionCount == 0 && upcomingCount == 0 && positiveCount == 0) {
            if (apps.isEmpty()) {
                sb.append("You don't have any job applications or interviews recorded yet.\n\n" +
                        "💡 **Recommendation:** Connect your Gmail in Settings to automatically sync your job search emails, or manually click **+ Add Application** on your dashboard.");
            } else {
                sb.append("✅ **All clear!** You have no urgent deadlines, overdue follow-ups, or pending alerts.\n\n" +
                        String.format("Your pipeline has **%d applications** actively moving. Keep up the momentum by applying to new opportunities or reviewing your resume.", apps.size()));
            }
        } else {
            sb.append("\n💡 **Next Step Advice:** Click any action card below to view details, draft a follow-up email, or review application history.");
        }

        return new AssistantQueryResponse(sb.toString(), suggestions, actionCards, null, null);
    }

    // =========================================================================
    // 2. AI JOB SEARCH ANALYTICS & STATS
    // =========================================================================
    private AssistantQueryResponse handleAnalyzeProgress(User user, List<String> suggestions) {
        List<JobApplication> apps = jobApplicationRepository.findByUser(user);
        long total = apps.size();

        if (total == 0) {
            String reply = "📊 **No Job Search Data Yet**\n\n" +
                    "I don't have enough tracked applications in your PostgreSQL database to calculate analytics.\n\n" +
                    "To generate real response rates and conversion benchmarks, sync your Gmail account in Settings or add your recent job applications.";
            return new AssistantQueryResponse(reply, suggestions, null);
        }

        long appliedCount = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.APPLIED).count();
        long assessmentCount = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.ASSESSMENT).count();
        long screenCount = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.RECRUITER_SCREEN).count();
        long interviewCount = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.INTERVIEW || a.getStatus() == ApplicationStatus.FINAL_INTERVIEW).count();
        long offerCount = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.OFFER).count();
        long rejectedCount = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.REJECTED).count();

        long respondedCount = total - appliedCount;
        double responseRate = (double) respondedCount / total * 100.0;
        double interviewRate = (double) (screenCount + interviewCount + offerCount) / total * 100.0;
        double rejectionRate = (double) rejectedCount / total * 100.0;

        // Role / Domain breakdown
        Map<String, Long> roleDistribution = apps.stream()
                .collect(Collectors.groupingBy(a -> simplifyRole(a.getTitle()), Collectors.counting()));

        String topRole = roleDistribution.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("Software Engineering");

        StringBuilder sb = new StringBuilder("📊 **Real CareerMail Job Search Analytics:**\n\n");
        sb.append(String.format("• **Total Tracked Applications:** %d\n", total));
        sb.append(String.format("• **Active Pipeline:** %d (Applied: %d, Assessment: %d, Screen: %d, Interview: %d)\n", total - rejectedCount - offerCount, appliedCount, assessmentCount, screenCount, interviewCount));
        sb.append(String.format("• **Response Rate:** %.1f%% (%d of %d applications received a response)\n", responseRate, respondedCount, total));
        sb.append(String.format("• **Interview Conversion Rate:** %.1f%% (%d reached recruiter screen or interview)\n", interviewRate, screenCount + interviewCount + offerCount, total));
        sb.append(String.format("• **Rejection Rate:** %.1f%% (%d formal rejections recorded)\n", rejectionRate, rejectedCount, total));
        sb.append(String.format("• **Job Offers:** %d\n\n", offerCount));

        sb.append("🎯 **Role & Domain Breakdown:**\n");
        for (Map.Entry<String, Long> entry : roleDistribution.entrySet()) {
            sb.append(String.format("  - **%s:** %d applications\n", entry.getKey(), entry.getValue()));
        }

        sb.append("\n💡 **AI Strategic Insight:**\n");
        if (interviewRate >= 15.0) {
            sb.append(String.format("Your interview conversion rate of **%.1f%%** is higher than the tech industry average (10-15%%)! Applications in **%s** are driving the strongest recruiter engagement.", interviewRate, topRole));
        } else if (responseRate < 20.0) {
            sb.append("Your response rate is currently below 20%. Consider tailoring keywords in your resume to match exact job descriptions, or target roles where recruiters are directly reaching out.");
        } else {
            sb.append(String.format("You have solid momentum in **%s**. Following up on applications older than 10 days will help push stalled applications into interview stages.", topRole));
        }

        return new AssistantQueryResponse(sb.toString(), suggestions, null);
    }

    // =========================================================================
    // 3. NEEDS ATTENTION / STALE APPLICATIONS
    // =========================================================================
    private AssistantQueryResponse handleNeedsAttention(User user, List<String> suggestions) {
        List<JobApplication> apps = jobApplicationRepository.findByUser(user);
        LocalDate today = LocalDate.now();

        List<JobApplication> staleApps = apps.stream()
                .filter(a -> a.getStatus() == ApplicationStatus.APPLIED || a.getStatus() == ApplicationStatus.RECRUITER_SCREEN)
                .filter(a -> a.getDateApplied() != null && ChronoUnit.DAYS.between(a.getDateApplied(), today) >= 10)
                .sorted((a1, a2) -> a1.getDateApplied().compareTo(a2.getDateApplied()))
                .collect(Collectors.toList());

        List<FollowUp> overdueFollowUps = followUpRepository.findByUserAndStatusOrderByDueDateAsc(user, FollowUpStatus.PENDING);

        if (staleApps.isEmpty() && overdueFollowUps.isEmpty()) {
            return new AssistantQueryResponse("✅ **Nothing currently needs urgent attention!** All your applications are fresh and there are no overdue follow-ups.", suggestions, null);
        }

        List<AssistantCardDTO> cards = new ArrayList<>();
        StringBuilder sb = new StringBuilder("⏰ **Here are the items that need your attention:**\n\n");

        if (!overdueFollowUps.isEmpty()) {
            sb.append("📌 **Pending Follow-up Tasks:**\n");
            for (FollowUp f : overdueFollowUps.stream().limit(3).collect(Collectors.toList())) {
                sb.append(String.format("• **%s** — Due: %s (%s)\n", f.getCompany(), f.getDueDate(), f.getRole() != null ? f.getRole() : "Role"));
                cards.add(new AssistantCardDTO("FOLLOW_UP", f.getId(), f.getCompany(), "Follow-up due: " + f.getDueDate(), "DUE", "orange", "ATTENTION", "/tracker", f.getCompany(), f.getRole(), "PENDING", f.getDueDate().toString(), null, null));
            }
            sb.append("\n");
        }

        if (!staleApps.isEmpty()) {
            sb.append("⏳ **Applications Waiting for Response (>10 Days):**\n");
            for (JobApplication app : staleApps.stream().limit(5).collect(Collectors.toList())) {
                long days = ChronoUnit.DAYS.between(app.getDateApplied(), today);
                sb.append(String.format("• **%s** (%s) — Waiting **%d days** (Applied: %s)\n", app.getCompany(), app.getTitle(), days, app.getDateApplied()));

                cards.add(new AssistantCardDTO("APPLICATION", app.getId(), app.getCompany() + " — " + app.getTitle(), "Waiting " + days + " days without reply", days + "d PENDING", "orange", "ATTENTION", "/tracker", app.getCompany(), app.getTitle(), app.getStatus().name(), app.getDateApplied().toString(), app.getRecruiterName(), app.getRecruiterEmail()));
            }
            sb.append("\n💡 **Action:** You can ask me to *\"Draft a follow-up for " + staleApps.get(0).getCompany() + "\"* to generate a professional check-in note!");
        }

        return new AssistantQueryResponse(sb.toString(), suggestions, cards, null, null);
    }

    // =========================================================================
    // 4. SMART EMAIL DRAFTING
    // =========================================================================
    private AssistantQueryResponse handleEmailDrafting(User user, String query, JobApplication contextApp, List<String> suggestions) {
        String company = "Company";
        String role = "the open position";
        String recruiterName = "Hiring Team";
        String recipientEmail = "";
        String draftType = "FOLLOW_UP";

        if (contextApp != null) {
            company = contextApp.getCompany();
            role = contextApp.getTitle();
            if (contextApp.getRecruiterName() != null && !contextApp.getRecruiterName().isBlank()) {
                recruiterName = contextApp.getRecruiterName();
            }
            if (contextApp.getRecruiterEmail() != null && !contextApp.getRecruiterEmail().isBlank()) {
                recipientEmail = contextApp.getRecruiterEmail();
            }
        } else {
            // Find mentioned company in query
            List<JobApplication> allApps = jobApplicationRepository.findByUser(user);
            for (JobApplication a : allApps) {
                if (query.contains(a.getCompany().toLowerCase())) {
                    company = a.getCompany();
                    role = a.getTitle();
                    if (a.getRecruiterName() != null && !a.getRecruiterName().isBlank()) recruiterName = a.getRecruiterName();
                    if (a.getRecruiterEmail() != null && !a.getRecruiterEmail().isBlank()) recipientEmail = a.getRecruiterEmail();
                    break;
                }
            }
        }

        String userName = user.getName() != null ? user.getName() : "Candidate";
        String subject;
        String body;

        if (query.contains("thank you") || query.contains("thanks") || query.contains("interview")) {
            draftType = "THANK_YOU";
            subject = String.format("Thank you — %s Interview (%s)", role, userName);
            body = String.format(
                    "Hi %s,\n\n" +
                    "Thank you so much for taking the time to speak with me today about the %s position at %s.\n\n" +
                    "I truly enjoyed learning more about the team's upcoming initiatives and discussing how my background in problem solving and engineering can contribute to your goals.\n\n" +
                    "Please let me know if you need any additional information from my side. Looking forward to hearing about the next steps!\n\n" +
                    "Best regards,\n%s",
                    recruiterName, role, company, userName
            );
        } else if (query.contains("reply to recruiter") || query.contains("opportunity") || query.contains("outreach")) {
            draftType = "REPLY";
            subject = String.format("Re: Opportunity with %s — %s", company, userName);
            body = String.format(
                    "Hi %s,\n\n" +
                    "Thank you for reaching out regarding the %s opportunity at %s.\n\n" +
                    "I am very interested in learning more about the role and team. I have attached my latest resume and would be delighted to schedule a brief introductory call.\n\n" +
                    "I am generally available this week between 10:00 AM – 4:00 PM. Please let me know what time works best for you.\n\n" +
                    "Best regards,\n%s",
                    recruiterName, role, company, userName
            );
        } else {
            draftType = "FOLLOW_UP";
            subject = String.format("Following up on my application: %s — %s", role, userName);
            body = String.format(
                    "Hi %s,\n\n" +
                    "I hope you are having a wonderful week.\n\n" +
                    "I am writing to politely check in on the status of my application for the %s role at %s. I remain very enthusiastic about the opportunity to contribute to the team.\n\n" +
                    "Please let me know if there are any updates or if I can provide any supplementary materials to assist with your evaluation.\n\n" +
                    "Thank you for your time and consideration.\n\n" +
                    "Sincerely,\n%s",
                    recruiterName, role, company, userName
            );
        }

        AssistantEmailDraftDTO draft = new AssistantEmailDraftDTO(
                recipientEmail,
                subject,
                body,
                recruiterName,
                company,
                role,
                draftType
        );

        String reply = String.format(
                "✉️ **I've drafted a professional %s email for you:**\n\n" +
                "**To:** %s\n" +
                "**Subject:** %s\n\n" +
                "```text\n%s\n```\n\n" +
                "🔒 **Safety Note:** CareerMail never automatically sends emails. You can click **'Open in Compose'** below to review, edit, and send it through your connected Gmail.",
                draftType.toLowerCase().replace("_", " "),
                recipientEmail.isEmpty() ? "(Enter recruiter email)" : recipientEmail,
                subject,
                body
        );

        return new AssistantQueryResponse(reply, suggestions, null, draft, null);
    }

    // =========================================================================
    // 5. RECRUITER & CONTACT INTELLIGENCE
    // =========================================================================
    private AssistantQueryResponse handleRecruiterIntelligence(User user, List<String> suggestions) {
        List<JobApplication> apps = jobApplicationRepository.findByUser(user);
        List<JobApplication> appsWithRecruiter = apps.stream()
                .filter(a -> a.getRecruiterName() != null && !a.getRecruiterName().isBlank())
                .collect(Collectors.toList());

        if (appsWithRecruiter.isEmpty()) {
            return new AssistantQueryResponse(
                    "👤 **Recruiter Intelligence Status**\n\n" +
                    "No human recruiter contacts have been identified in your database yet.\n\n" +
                    "When recruiters send outreach messages or interview invitations to your Gmail, CareerMail's NLP analyzer automatically extracts their name, email, and title here.",
                    suggestions, null
            );
        }

        List<AssistantCardDTO> recruiterCards = new ArrayList<>();
        StringBuilder sb = new StringBuilder(String.format("👤 **Identified Recruiter Contacts (%d found):**\n\n", appsWithRecruiter.size()));

        for (JobApplication app : appsWithRecruiter.stream().limit(6).collect(Collectors.toList())) {
            String recruiterType = app.getRecruiterType() == RecruiterType.HUMAN_RECRUITER ? "Recruiter" : "Team";
            String confidenceStr = app.getContactConfidence() != null ? app.getContactConfidence() + "% Match" : "Verified";

            sb.append(String.format("• **%s** (%s) at **%s**\n  - Email: `%s` | Role: %s\n",
                    app.getRecruiterName(),
                    recruiterType,
                    app.getCompany(),
                    app.getRecruiterEmail() != null ? app.getRecruiterEmail() : "Not listed",
                    app.getTitle()
            ));

            recruiterCards.add(new AssistantCardDTO(
                    "RECRUITER",
                    app.getId(),
                    app.getRecruiterName() + " (" + app.getCompany() + ")",
                    app.getTitle() + (app.getRecruiterEmail() != null ? " • " + app.getRecruiterEmail() : ""),
                    confidenceStr,
                    "pink",
                    "ATTENTION",
                    "/tracker",
                    app.getCompany(),
                    app.getTitle(),
                    app.getStatus().name(),
                    app.getDateApplied() != null ? app.getDateApplied().toString() : "",
                    app.getRecruiterName(),
                    app.getRecruiterEmail()
            ));
        }

        sb.append("\n💡 **Action:** Ask me to *\"Draft an email to [Recruiter Name]\"* to compose a personalized message!");
        return new AssistantQueryResponse(sb.toString(), suggestions, recruiterCards, null, null);
    }

    // =========================================================================
    // 6. INTERVIEWS INQUIRY
    // =========================================================================
    private AssistantQueryResponse handleInterviewsInquiry(User user, List<String> suggestions) {
        List<Interview> interviews = interviewRepository.findByUserOrderByInterviewDateAsc(user);
        if (interviews.isEmpty()) {
            return new AssistantQueryResponse("📅 **No Scheduled Interviews**\n\nYou currently have no scheduled interviews logged in CareerMail. Check your Gmail inbox for new interview invitations!", suggestions, null);
        }

        List<AssistantCardDTO> cards = new ArrayList<>();
        StringBuilder sb = new StringBuilder(String.format("📅 **You have %d interview(s) on your schedule:**\n\n", interviews.size()));

        for (int i = 0; i < interviews.size(); i++) {
            Interview intv = interviews.get(i);
            String badge = intv.getDaysAwayBadge() != null ? intv.getDaysAwayBadge() : "Upcoming";
            sb.append(String.format("%d. **%s** — %s\n   • **Date:** %s\n   • **Format:** %s (%s)\n   • **Timing:** %s\n\n",
                    i + 1, intv.getCompany(), intv.getTitle(),
                    intv.getInterviewDate().toString().replace("T", " "),
                    intv.getType(), intv.getLocation(), badge));

            cards.add(new AssistantCardDTO(
                    "INTERVIEW",
                    intv.getId(),
                    intv.getCompany() + " — " + intv.getTitle(),
                    intv.getInterviewDate().toLocalDate() + " (" + intv.getType() + ")",
                    badge,
                    "blue",
                    "UPCOMING",
                    "/tracker",
                    intv.getCompany(),
                    intv.getTitle(),
                    "INTERVIEW",
                    intv.getInterviewDate().toString(),
                    null,
                    null
            ));
        }

        return new AssistantQueryResponse(sb.toString(), suggestions, cards, null, null);
    }

    // =========================================================================
    // 7. FOLLOW-UPS INQUIRY
    // =========================================================================
    private AssistantQueryResponse handleFollowUpsInquiry(User user, List<String> suggestions) {
        List<FollowUp> followUps = followUpRepository.findByUserOrderByDueDateAsc(user);
        if (followUps.isEmpty()) {
            return new AssistantQueryResponse("⏰ **No Pending Follow-ups**\n\nYou are fully caught up with your follow-up schedule!", suggestions, null);
        }

        List<AssistantCardDTO> cards = new ArrayList<>();
        StringBuilder sb = new StringBuilder(String.format("⏰ **You have %d tracked follow-up(s):**\n\n", followUps.size()));

        for (FollowUp f : followUps) {
            String badge = f.getDaysDueBadge() != null ? f.getDaysDueBadge() : "Due Soon";
            sb.append(String.format("• **%s** (%s) — Due: %s (%s)\n", f.getCompany(), f.getRole() != null ? f.getRole() : "Role", f.getDueDate(), badge));

            cards.add(new AssistantCardDTO(
                    "FOLLOW_UP",
                    f.getId(),
                    f.getCompany() + " — Follow-up",
                    (f.getRole() != null ? f.getRole() : "Application") + " • Due " + f.getDueDate(),
                    badge,
                    "orange",
                    "ATTENTION",
                    "/tracker",
                    f.getCompany(),
                    f.getRole(),
                    "PENDING",
                    f.getDueDate().toString(),
                    null,
                    null
            ));
        }

        return new AssistantQueryResponse(sb.toString(), suggestions, cards, null, null);
    }

    // =========================================================================
    // 8. REJECTIONS & OFFERS
    // =========================================================================
    private AssistantQueryResponse handleRejectionsInquiry(User user, List<String> suggestions) {
        List<JobApplication> rejected = jobApplicationRepository.findByUserAndStatus(user, ApplicationStatus.REJECTED);
        if (rejected.isEmpty()) {
            return new AssistantQueryResponse("🎯 **No Rejections Recorded!** All your tracked applications are currently active or progressing.", suggestions, null);
        }

        List<AssistantCardDTO> cards = new ArrayList<>();
        StringBuilder sb = new StringBuilder(String.format("📌 **You have %d rejected application(s) logged:**\n\n", rejected.size()));

        for (JobApplication r : rejected) {
            sb.append(String.format("• **%s** — %s (Applied: %s)\n", r.getCompany(), r.getTitle(), r.getDateApplied() != null ? r.getDateApplied().toString() : "Recent"));
            cards.add(new AssistantCardDTO("APPLICATION", r.getId(), r.getCompany(), r.getTitle(), "REJECTED", "red", "ATTENTION", "/tracker", r.getCompany(), r.getTitle(), "REJECTED", r.getDateApplied() != null ? r.getDateApplied().toString() : "", r.getRecruiterName(), r.getRecruiterEmail()));
        }

        sb.append("\n💡 **Perspective:** Rejections provide valuable data. High-volume applicants average 12-18 rejections before securing their ideal offer.");
        return new AssistantQueryResponse(sb.toString(), suggestions, cards, null, null);
    }

    private AssistantQueryResponse handleOffersInquiry(User user, List<String> suggestions) {
        List<JobApplication> offers = jobApplicationRepository.findByUserAndStatus(user, ApplicationStatus.OFFER);
        if (offers.isEmpty()) {
            return new AssistantQueryResponse("💼 **No Formal Offers Recorded Yet**\n\nKeep driving your active interviews and assessment stages forward!", suggestions, null);
        }

        List<AssistantCardDTO> cards = new ArrayList<>();
        StringBuilder sb = new StringBuilder(String.format("🎉 **Congratulations! You have %d formal offer(s):**\n\n", offers.size()));

        for (JobApplication o : offers) {
            sb.append(String.format("• **%s** — %s%s\n", o.getCompany(), o.getTitle(), o.getSalary() != null ? " (Comp: " + o.getSalary() + ")" : ""));
            cards.add(new AssistantCardDTO("APPLICATION", o.getId(), "🎉 " + o.getCompany(), o.getTitle() + (o.getSalary() != null ? " • " + o.getSalary() : ""), "OFFER", "green", "POSITIVE", "/tracker", o.getCompany(), o.getTitle(), "OFFER", o.getDateApplied() != null ? o.getDateApplied().toString() : "", o.getRecruiterName(), o.getRecruiterEmail()));
        }

        sb.append("\n💡 **Tip:** Ask me for advice on comparing compensation packages or drafting an acceptance/negotiation letter.");
        return new AssistantQueryResponse(sb.toString(), suggestions, cards, null, null);
    }

    // =========================================================================
    // 9. CONTEXT-AWARE APPLICATION SUMMARY
    // =========================================================================
    private AssistantQueryResponse handleContextAppSummary(JobApplication app, User user, List<String> suggestions) {
        List<TimelineEvent> events = timelineEventRepository.findByJobApplicationOrderByEventDateDesc(app);
        List<Email> emails = emailRepository.findByUserAndJobApplication(user, app);

        StringBuilder sb = new StringBuilder(String.format("📋 **Application Context Summary: %s**\n\n", app.getCompany()));
        sb.append(String.format("• **Target Role:** %s\n", app.getTitle()));
        sb.append(String.format("• **Current Status:** **%s**\n", app.getStatus().getDisplayName()));
        sb.append(String.format("• **Location:** %s\n", app.getLocation() != null ? app.getLocation() : "Remote / Hybrid"));
        if (app.getSalary() != null) sb.append(String.format("• **Compensation:** %s\n", app.getSalary()));
        if (app.getDateApplied() != null) sb.append(String.format("• **Date Applied:** %s\n", app.getDateApplied()));

        if (app.getRecruiterName() != null) {
            sb.append(String.format("• **Recruiter Contact:** %s (%s)\n", app.getRecruiterName(), app.getRecruiterEmail() != null ? app.getRecruiterEmail() : "Email on file"));
        }

        if (!events.isEmpty()) {
            sb.append("\n🕒 **Recent Timeline Activity:**\n");
            for (TimelineEvent ev : events.stream().limit(3).collect(Collectors.toList())) {
                sb.append(String.format("  - %s: %s\n", ev.getEventDate().toLocalDate(), ev.getTitle()));
            }
        }

        if (!emails.isEmpty()) {
            sb.append(String.format("\n📬 **Linked Emails:** %d message(s) in thread.\n", emails.size()));
        }

        sb.append("\n💡 **Recommended Action:** ");
        if (app.getStatus() == ApplicationStatus.APPLIED) {
            sb.append("If it's been more than 7 days, consider sending a polite status follow-up to the recruiter.");
        } else if (app.getStatus() == ApplicationStatus.INTERVIEW || app.getStatus() == ApplicationStatus.FINAL_INTERVIEW) {
            sb.append("Review your technical stories and research the interviewer's background.");
        } else {
            sb.append("You are in active progress. Let me know if you need help drafting a message.");
        }

        AssistantCardDTO card = new AssistantCardDTO(
                "APPLICATION",
                app.getId(),
                app.getCompany() + " — " + app.getTitle(),
                "Status: " + app.getStatus().getDisplayName(),
                app.getStatus().name(),
                "pink",
                "POSITIVE",
                "/tracker",
                app.getCompany(),
                app.getTitle(),
                app.getStatus().name(),
                app.getDateApplied() != null ? app.getDateApplied().toString() : "",
                app.getRecruiterName(),
                app.getRecruiterEmail()
        );

        return new AssistantQueryResponse(sb.toString(), suggestions, Collections.singletonList(card), null, null);
    }

    // =========================================================================
    // 10. SPECIFIC COMPANY LOOKUP
    // =========================================================================
    private AssistantQueryResponse handleCompanyLookup(JobApplication app, List<String> suggestions) {
        String reply = String.format("Here is the latest status for **%s**:\n\n" +
                "• **Role:** %s\n" +
                "• **Status:** %s\n" +
                "• **Applied Date:** %s\n" +
                "• **Recruiter:** %s\n" +
                "• **Activity:** %s",
                app.getCompany(),
                app.getTitle(),
                app.getStatus().getDisplayName(),
                app.getDateApplied() != null ? app.getDateApplied().toString() : "Recently",
                app.getRecruiterName() != null ? app.getRecruiterName() + (app.getRecruiterEmail() != null ? " (" + app.getRecruiterEmail() + ")" : "") : "Not specified",
                app.getActivitySubtitle() != null ? app.getActivitySubtitle() : "In review"
        );

        AssistantCardDTO card = new AssistantCardDTO(
                "APPLICATION",
                app.getId(),
                app.getCompany() + " — " + app.getTitle(),
                "Status: " + app.getStatus().getDisplayName(),
                app.getStatus().name(),
                "pink",
                "POSITIVE",
                "/tracker",
                app.getCompany(),
                app.getTitle(),
                app.getStatus().name(),
                app.getDateApplied() != null ? app.getDateApplied().toString() : "",
                app.getRecruiterName(),
                app.getRecruiterEmail()
        );

        return new AssistantQueryResponse(reply, suggestions, Collections.singletonList(card), null, null);
    }

    // =========================================================================
    // 11. NATURAL LANGUAGE SEARCH
    // =========================================================================
    private AssistantQueryResponse handleNaturalLanguageSearch(User user, String query, List<String> suggestions) {
        List<JobApplication> apps = jobApplicationRepository.findByUser(user);
        String cleaned = query.replaceAll("(?i)(show|find|search|my|applications|application|for|in|list|filter|me)", "").trim();

        List<JobApplication> matched = apps.stream()
                .filter(a -> a.getCompany().toLowerCase().contains(cleaned) ||
                        a.getTitle().toLowerCase().contains(cleaned) ||
                        (a.getLocation() != null && a.getLocation().toLowerCase().contains(cleaned)) ||
                        (a.getRecruiterName() != null && a.getRecruiterName().toLowerCase().contains(cleaned)))
                .collect(Collectors.toList());

        if (matched.isEmpty()) {
            return new AssistantQueryResponse(String.format("🔍 No applications found matching **\"%s\"** in your database.", cleaned.isEmpty() ? query : cleaned), suggestions, null);
        }

        List<AssistantCardDTO> cards = new ArrayList<>();
        StringBuilder sb = new StringBuilder(String.format("🔍 **Found %d matching application(s) for \"%s\":**\n\n", matched.size(), cleaned));

        for (JobApplication m : matched.stream().limit(5).collect(Collectors.toList())) {
            sb.append(String.format("• **%s** — %s (`%s`)\n", m.getCompany(), m.getTitle(), m.getStatus().getDisplayName()));
            cards.add(new AssistantCardDTO("APPLICATION", m.getId(), m.getCompany() + " — " + m.getTitle(), "Status: " + m.getStatus().getDisplayName(), m.getStatus().name(), "pink", "POSITIVE", "/tracker", m.getCompany(), m.getTitle(), m.getStatus().name(), m.getDateApplied() != null ? m.getDateApplied().toString() : "", m.getRecruiterName(), m.getRecruiterEmail()));
        }

        return new AssistantQueryResponse(sb.toString(), suggestions, cards, null, null);
    }

    // =========================================================================
    // 12. DEFAULT EXECUTIVE BRIEFING
    // =========================================================================
    private AssistantQueryResponse handleExecutiveBriefing(User user, JobApplication contextApp, List<String> suggestions) {
        List<JobApplication> apps = jobApplicationRepository.findByUser(user);
        long totalApps = apps.size();
        long interviews = interviewRepository.countByUser(user);
        long offers = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.OFFER).count();

        String name = user.getName() != null ? user.getName().split(" ")[0] : "there";
        String contextHint = contextApp != null ? String.format("\n\n📍 *Currently reviewing:* **%s** (%s)", contextApp.getCompany(), contextApp.getTitle()) : "";

        String reply = String.format("Hello **%s**! 👋 I am your context-aware **AI Career Assistant**.\n\n" +
                "📊 **Live Pipeline Status:**\n" +
                "• **%d** Total tracked applications\n" +
                "• **%d** Scheduled interviews\n" +
                "• **%d** Job offers received%s\n\n" +
                "You can ask me to analyze your response rate, find recruiters, create an action priority list (*\"What should I do next?\"*), or draft follow-up emails.",
                name, totalApps, interviews, offers, contextHint
        );

        return new AssistantQueryResponse(reply, suggestions, null);
    }

    private String simplifyRole(String title) {
        if (title == null || title.isBlank()) return "Other";
        String t = title.toLowerCase();
        if (t.contains("data scien")) return "Data Science";
        if (t.contains("data eng") || t.contains("big data")) return "Data Engineering";
        if (t.contains("machine learn") || t.contains("ml") || t.contains("ai")) return "AI / Machine Learning";
        if (t.contains("frontend") || t.contains("front end") || t.contains("react")) return "Frontend Engineering";
        if (t.contains("backend") || t.contains("back end") || t.contains("java") || t.contains("node")) return "Backend Engineering";
        if (t.contains("full stack") || t.contains("fullstack")) return "Full Stack Engineering";
        if (t.contains("product")) return "Product Management";
        if (t.contains("analyst")) return "Data Analytics";
        return "Software Engineering";
    }
}
