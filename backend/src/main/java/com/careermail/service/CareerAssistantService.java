package com.careermail.service;

import com.careermail.dto.AssistantQueryRequest;
import com.careermail.dto.AssistantQueryResponse;
import com.careermail.model.entity.FollowUp;
import com.careermail.model.entity.Interview;
import com.careermail.model.entity.JobApplication;
import com.careermail.model.entity.User;
import com.careermail.model.enums.ApplicationStatus;
import com.careermail.repository.FollowUpRepository;
import com.careermail.repository.InterviewRepository;
import com.careermail.repository.JobApplicationRepository;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class CareerAssistantService {

    private final JobApplicationRepository jobApplicationRepository;
    private final InterviewRepository interviewRepository;
    private final FollowUpRepository followUpRepository;
    private final AuthService authService;

    public CareerAssistantService(JobApplicationRepository jobApplicationRepository,
                                  InterviewRepository interviewRepository,
                                  FollowUpRepository followUpRepository,
                                  AuthService authService) {
        this.jobApplicationRepository = jobApplicationRepository;
        this.interviewRepository = interviewRepository;
        this.followUpRepository = followUpRepository;
        this.authService = authService;
    }

    public AssistantQueryResponse askAssistant(AssistantQueryRequest request) {
        User user = authService.getCurrentUser();
        String q = request.getQuery().toLowerCase().trim();

        List<String> defaultSuggestions = Arrays.asList(
                "Show my applications",
                "Which applications need follow-up?",
                "When is my next interview?",
                "Show rejected applications"
        );

        if (q.contains("show my application") || q.contains("how many application") || q.contains("active application") || q.contains("all applications")) {
            List<JobApplication> apps = jobApplicationRepository.findByUser(user);
            long activeCount = apps.stream().filter(a -> a.getStatus() != ApplicationStatus.REJECTED && a.getStatus() != ApplicationStatus.WITHDRAWN).count();
            String topCompanies = apps.stream().limit(4).map(JobApplication::getCompany).collect(Collectors.joining("**, **"));
            String companyListStr = topCompanies.isEmpty() ? "No applications found yet. Sync your Gmail or add an application to start tracking." : "Your latest applications include **" + topCompanies + "**.";
            String reply = String.format("You have **%d total applications** logged in CareerMail, with **%d currently active** in your pipeline.\n\n" +
                    "• **Applied:** %d\n• **Assessment:** %d\n• **Recruiter Screen:** %d\n• **Interview:** %d\n• **Final Interview:** %d\n• **Offer:** %d\n\n" +
                    "%s",
                    apps.size(),
                    activeCount,
                    apps.stream().filter(a -> a.getStatus() == ApplicationStatus.APPLIED).count(),
                    apps.stream().filter(a -> a.getStatus() == ApplicationStatus.ASSESSMENT).count(),
                    apps.stream().filter(a -> a.getStatus() == ApplicationStatus.RECRUITER_SCREEN).count(),
                    apps.stream().filter(a -> a.getStatus() == ApplicationStatus.INTERVIEW).count(),
                    apps.stream().filter(a -> a.getStatus() == ApplicationStatus.FINAL_INTERVIEW).count(),
                    apps.stream().filter(a -> a.getStatus() == ApplicationStatus.OFFER).count(),
                    companyListStr
            );
            return new AssistantQueryResponse(reply, defaultSuggestions, apps);
        }

        if (q.contains("follow-up") || q.contains("follow up") || q.contains("need follow-up") || q.contains("replied")) {
            List<FollowUp> followUps = followUpRepository.findByUserOrderByDueDateAsc(user);
            StringBuilder sb = new StringBuilder("Here are your upcoming follow-ups that need your attention:\n\n");
            for (FollowUp f : followUps.stream().limit(3).collect(Collectors.toList())) {
                sb.append(String.format("• **%s** (%s) — %s (%s)\n", f.getCompany(), f.getRole() != null ? f.getRole() : "Job Application", f.getDaysDueBadge() != null ? f.getDaysDueBadge() : "Due soon", f.getAppliedSubtitle() != null ? f.getAppliedSubtitle() : "Applied recently"));
            }
            sb.append("\nTip: Sending a polite follow-up after 7-10 days increases response rate by 24%!");
            return new AssistantQueryResponse(sb.toString(), defaultSuggestions, followUps);
        }

        if (q.contains("interview") || q.contains("when is my next")) {
            List<Interview> interviews = interviewRepository.findByUserOrderByInterviewDateAsc(user);
            if (interviews.isEmpty()) {
                return new AssistantQueryResponse("You don't have any interviews scheduled right now. Check your inbox for new interview invitations!", defaultSuggestions, null);
            }
            Interview next = interviews.get(0);
            String reply = String.format("Your next interview is with **%s** for the **%s** role!\n\n" +
                    "📅 **Date & Time:** %s\n" +
                    "📍 **Format:** %s (%s)\n" +
                    "⏳ **Countdown:** %s\n\n" +
                    "You also have %d other upcoming interview(s) lined up with %s.",
                    next.getCompany(),
                    next.getTitle(),
                    next.getInterviewDate().toString().replace("T", " "),
                    next.getType(),
                    next.getLocation(),
                    next.getDaysAwayBadge() != null ? next.getDaysAwayBadge() : "Soon",
                    interviews.size() - 1,
                    interviews.size() > 1 ? interviews.get(1).getCompany() : "other teams"
            );
            return new AssistantQueryResponse(reply, defaultSuggestions, interviews);
        }

        if (q.contains("reject") || q.contains("declined")) {
            List<JobApplication> rejected = jobApplicationRepository.findByUserAndStatus(user, ApplicationStatus.REJECTED);
            String reply = String.format("You have **%d rejected applications** recorded.\n\n" +
                    "Remember that rejections are a normal part of the hiring journey. Top performers average 10-15 rejections per offer!",
                    rejected.size()
            );
            return new AssistantQueryResponse(reply, defaultSuggestions, rejected);
        }

        if (q.contains("offer")) {
            List<JobApplication> offers = jobApplicationRepository.findByUserAndStatus(user, ApplicationStatus.OFFER);
            if (offers.isEmpty()) {
                return new AssistantQueryResponse("You don't have any formal offers recorded yet. Keep pushing your active interview stages!", defaultSuggestions, null);
            }
            StringBuilder sb = new StringBuilder(String.format("🎉 Congratulations! You have **%d formal offer(s)**:\n\n", offers.size()));
            for (int i = 0; i < offers.size(); i++) {
                JobApplication o = offers.get(i);
                sb.append(String.format("%d. **%s** — %s\n", i + 1, o.getCompany(), o.getTitle()));
            }
            sb.append("\nYou can compare compensation packages or negotiate before your deadline.");
            return new AssistantQueryResponse(sb.toString(), defaultSuggestions, offers);
        }

        if (q.contains("response rate") || q.contains("conversion") || q.contains("rate") || q.contains("stats") || q.contains("analytics")) {
            List<JobApplication> apps = jobApplicationRepository.findByUser(user);
            long total = apps.size();
            long responded = apps.stream().filter(a -> a.getStatus() != ApplicationStatus.APPLIED).count();
            int rate = total > 0 ? (int) Math.round((double) responded / total * 100) : 68;
            long interviews = interviewRepository.countByUser(user);
            long offers = apps.stream().filter(a -> a.getStatus() == ApplicationStatus.OFFER).count();
            String reply = String.format("📊 **Career Analytics Overview**:\n\n" +
                    "• **Overall Response Rate:** %d%%\n" +
                    "• **Total Applications:** %d\n" +
                    "• **Interviews Secured:** %d\n" +
                    "• **Offers Received:** %d\n\n" +
                    "Your interview conversion is trending strong compared to the industry benchmark of 15-20%%!",
                    rate, total, interviews, offers);
            return new AssistantQueryResponse(reply, defaultSuggestions, null);
        }

        // Check if user is inquiring about a specific company in their pipeline
        List<JobApplication> allApps = jobApplicationRepository.findByUser(user);
        for (JobApplication app : allApps) {
            if (q.contains(app.getCompany().toLowerCase())) {
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
                        app.getRecruiterName() != null ? app.getRecruiterName() : "Not specified",
                        app.getActivitySubtitle() != null ? app.getActivitySubtitle() : "In review"
                );
                return new AssistantQueryResponse(reply, defaultSuggestions, java.util.Collections.singletonList(app));
            }
        }

        // Default intelligent response
        long totalApps = allApps.size();
        long interviews = interviewRepository.countByUser(user);
        long offers = allApps.stream().filter(a -> a.getStatus() == ApplicationStatus.OFFER).count();
        String reply = String.format("I'm monitoring your career pipeline, **%s**! You currently have **%d tracked applications**, **%d scheduled interviews**, and **%d job offer(s)**.\n\n" +
                "You can ask me questions about upcoming interviews, pending follow-ups, application conversion rates, or specific companies.",
                user.getName() != null ? user.getName().split(" ")[0] : "there",
                totalApps,
                interviews,
                offers
        );
        return new AssistantQueryResponse(reply, defaultSuggestions, null);
    }
}
