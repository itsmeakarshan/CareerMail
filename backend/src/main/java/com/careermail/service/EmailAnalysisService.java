package com.careermail.service;

import com.careermail.model.entity.Email;
import com.careermail.model.entity.JobApplication;
import com.careermail.model.entity.TimelineEvent;
import com.careermail.model.entity.User;
import com.careermail.model.enums.ApplicationStatus;
import com.careermail.model.enums.Priority;
import com.careermail.repository.JobApplicationRepository;
import com.careermail.service.analyzer.AnalysisResult;
import com.careermail.service.analyzer.EmailAnalyzer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class EmailAnalysisService {

    private final EmailAnalyzer emailAnalyzer;
    private final JobApplicationRepository jobApplicationRepository;

    public EmailAnalysisService(EmailAnalyzer emailAnalyzer, JobApplicationRepository jobApplicationRepository) {
        this.emailAnalyzer = emailAnalyzer;
        this.jobApplicationRepository = jobApplicationRepository;
    }

    @Transactional
    public void processEmail(Email email, User user) {
        AnalysisResult result = emailAnalyzer.analyze(
                email.getSubject(),
                email.getBody(),
                email.getSender(),
                email.getSenderEmail()
        );

        if (!result.isJobRelated()) {
            email.setJobRelated(false);
            return;
        }

        email.setJobRelated(true);
        email.setDetectedCompany(result.getCompany());
        email.setDetectedRole(result.getJobTitle());
        email.setDetectedStatus(result.getStatus().name());

        String company = result.getCompany();
        Optional<JobApplication> existingAppOpt = jobApplicationRepository.findTopByUserAndCompanyIgnoreCase(user, company);

        JobApplication app;
        if (existingAppOpt.isPresent()) {
            app = existingAppOpt.get();
            // Update status if appropriate
            if (result.getStatus() != null && result.getStatus() != ApplicationStatus.APPLIED) {
                app.setStatus(result.getStatus());
            }
            app.setLastActivityDate(LocalDate.now());

            String subtitle = switch (app.getStatus()) {
                case ASSESSMENT -> "Assessment invited";
                case RECRUITER_SCREEN -> "Screening call";
                case INTERVIEW -> "Technical Interview";
                case FINAL_INTERVIEW -> "Final Round";
                case OFFER -> "Offer Received";
                case REJECTED -> "Application closed";
                case WITHDRAWN -> "Application withdrawn";
                default -> app.getActivitySubtitle() != null ? app.getActivitySubtitle() : "Applied recently";
            };
            app.setActivitySubtitle(subtitle);

            TimelineEvent timelineEvent = new TimelineEvent(
                    app,
                    "Email received: " + email.getSubject(),
                    result.getTimelineNote() != null ? result.getTimelineNote() : email.getPreview(),
                    LocalDateTime.now(),
                    result.getStatus().name()
            );
            app.addTimelineEvent(timelineEvent);
            jobApplicationRepository.save(app);
        } else {
            app = new JobApplication();
            app.setUser(user);
            app.setCompany(company);
            app.setTitle(result.getJobTitle() != null ? result.getJobTitle() : "Software Engineer");
            app.setLocation("Remote");
            app.setEmploymentType("Full-time");
            app.setDateApplied(LocalDate.now());
            app.setLastActivityDate(LocalDate.now());
            app.setStatus(result.getStatus());
            app.setPriority(Priority.MEDIUM);
            app.setRecruiterName(result.getRecruiterName());
            app.setRecruiterEmail(result.getRecruiterEmail());
            app.setSource("Email Auto-Detection");
            app.setCompanyLogo(company.toLowerCase().replaceAll("[^a-z0-9]", ""));
            app.setActivitySubtitle(result.getStatus() == ApplicationStatus.APPLIED ? "Applied today" : result.getStatus().getDisplayName());

            TimelineEvent initialEvent = new TimelineEvent(
                    app,
                    "Detected application: " + app.getTitle(),
                    result.getTimelineNote() != null ? result.getTimelineNote() : "Extracted from email: " + email.getSubject(),
                    LocalDateTime.now(),
                    result.getStatus().name()
            );
            app.addTimelineEvent(initialEvent);
            app = jobApplicationRepository.save(app);
        }

        email.setJobApplication(app);
    }
}
