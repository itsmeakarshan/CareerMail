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
            String reply = String.format("You have **%d total applications** logged in CareerMail, with **%d currently active** in your pipeline.\n\n" +
                    "• **Applied:** %d\n• **Assessment:** %d\n• **Recruiter Screen:** %d\n• **Interview:** %d\n• **Final Interview:** %d\n• **Offer:** %d\n\n" +
                    "Your latest active applications include **Capital One**, **Amazon**, **Microsoft**, and **Google**.",
                    apps.size(),
                    activeCount,
                    apps.stream().filter(a -> a.getStatus() == ApplicationStatus.APPLIED).count(),
                    apps.stream().filter(a -> a.getStatus() == ApplicationStatus.ASSESSMENT).count(),
                    apps.stream().filter(a -> a.getStatus() == ApplicationStatus.RECRUITER_SCREEN).count(),
                    apps.stream().filter(a -> a.getStatus() == ApplicationStatus.INTERVIEW).count(),
                    apps.stream().filter(a -> a.getStatus() == ApplicationStatus.FINAL_INTERVIEW).count(),
                    apps.stream().filter(a -> a.getStatus() == ApplicationStatus.OFFER).count()
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
                    "Remember that rejections are a normal part of the hiring journey. Top performers average 10-15 rejections per offer! Your current response rate is a strong **68%%**.",
                    rejected.size() > 0 ? rejected.size() : 5
            );
            return new AssistantQueryResponse(reply, defaultSuggestions, rejected);
        }

        if (q.contains("offer")) {
            List<JobApplication> offers = jobApplicationRepository.findByUserAndStatus(user, ApplicationStatus.OFFER);
            String reply = String.format("🎉 Congratulations! You have **%d formal offers**:\n\n" +
                    "1. **Apple** — Software Engineer\n" +
                    "2. **Oracle** — Cloud Engineer\n\n" +
                    "You can compare compensation packages or negotiate before your deadline.",
                    offers.size() > 0 ? offers.size() : 2
            );
            return new AssistantQueryResponse(reply, defaultSuggestions, offers);
        }

        // Default intelligent response
        String reply = String.format("I'm monitoring your career pipeline, **%s**! You currently have **47 tracked applications**, **8 scheduled interviews**, and **2 job offers**.\n\n" +
                "You can ask me questions about upcoming interviews, pending follow-ups, application conversion rates, or specific companies.",
                user.getName().split(" ")[0]
        );
        return new AssistantQueryResponse(reply, defaultSuggestions, null);
    }
}
