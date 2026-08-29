package com.careermail.service;

import com.careermail.model.entity.*;
import com.careermail.model.enums.*;
import com.careermail.repository.FollowUpRepository;
import com.careermail.repository.InterviewRepository;
import com.careermail.repository.JobApplicationRepository;
import com.careermail.service.analyzer.AnalysisResult;
import com.careermail.service.analyzer.EmailAnalyzer;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;

@Service
public class EmailAnalysisService {

    private final EmailAnalyzer emailAnalyzer;
    private final JobApplicationRepository jobApplicationRepository;
    private final InterviewRepository interviewRepository;
    private final FollowUpRepository followUpRepository;
    private final com.careermail.repository.EmailRepository emailRepository;

    public EmailAnalysisService(EmailAnalyzer emailAnalyzer,
                                JobApplicationRepository jobApplicationRepository,
                                InterviewRepository interviewRepository,
                                FollowUpRepository followUpRepository,
                                com.careermail.repository.EmailRepository emailRepository) {
        this.emailAnalyzer = emailAnalyzer;
        this.jobApplicationRepository = jobApplicationRepository;
        this.interviewRepository = interviewRepository;
        this.followUpRepository = followUpRepository;
        this.emailRepository = emailRepository;
    }

    public static class ProcessOutcome {
        public final boolean isJobRelated;
        public final boolean applicationCreated;
        public final boolean applicationUpdated;
        public final boolean interviewCreated;
        public final boolean followUpCreated;

        public ProcessOutcome(boolean isJobRelated, boolean applicationCreated, boolean applicationUpdated,
                              boolean interviewCreated, boolean followUpCreated) {
            this.isJobRelated = isJobRelated;
            this.applicationCreated = applicationCreated;
            this.applicationUpdated = applicationUpdated;
            this.interviewCreated = interviewCreated;
            this.followUpCreated = followUpCreated;
        }
    }

    @Transactional
    public ProcessOutcome processEmail(Email email, User user) {
        AnalysisResult result = emailAnalyzer.analyze(
                email.getSubject(),
                email.getBody(),
                email.getSender(),
                email.getSenderEmail()
        );

        if (!result.isJobRelated()) {
            email.setJobRelated(false);
            email.setClassification(null);
            email.setDetectedCompany(null);
            email.setDetectedRole(null);
            email.setDetectedStatus(null);
            email.setProcessedAt(LocalDateTime.now());
            return new ProcessOutcome(false, false, false, false, false);
        }

        email.setJobRelated(true);
        email.setDetectedCompany(result.getCompany());
        email.setDetectedRole(result.getJobTitle());
        email.setDetectedStatus(result.getStatus() != null ? result.getStatus().name() : ApplicationStatus.APPLIED.name());
        email.setDetectedRecruiterName(result.getRecruiterName());
        email.setDetectedRecruiterEmail(result.getRecruiterEmail());
        email.setDetectedRecruiterTitle(result.getRecruiterTitle());
        email.setDetectedRecruiterType(result.getRecruiterType());
        email.setDetectedRecruiterConfidence(result.getContactConfidence());
        email.setClassification(result.getClassification());
        email.setProcessedAt(LocalDateTime.now());

        String company = result.getCompany();
        if (company == null || company.isBlank()) {
            company = "Unknown Company";
        }

        // Thread Matching first: check if previous messages in same thread linked to an application
        JobApplication matchedApp = null;
        if (email.getGmailThreadId() != null && !email.getGmailThreadId().isBlank()) {
            var threadEmails = emailRepository.findByUserAndGmailThreadId(user, email.getGmailThreadId());
            for (var te : threadEmails) {
                if (te.getJobApplication() != null) {
                    matchedApp = te.getJobApplication();
                    break;
                }
            }
        }

        // Company Name Matching second
        if (matchedApp == null && !"Unknown Company".equalsIgnoreCase(company)) {
            matchedApp = jobApplicationRepository.findTopByUserAndCompanyIgnoreCase(user, company).orElse(null);
        }

        if (matchedApp == null && result.getClassification() == EmailClassification.NEW_OPPORTUNITY) {
            // Keep email saved as a discovered job opportunity lead without auto-creating an APPLIED application
            return new ProcessOutcome(true, false, false, false, false);
        }

        JobApplication app;
        boolean appCreated = false;
        boolean appUpdated = false;
        boolean interviewCreated = false;
        boolean followUpCreated = false;

        if (matchedApp != null) {
            app = matchedApp;
            appUpdated = true;

            // Always update with cleaned/improved company name and role
            if (company != null && !company.isBlank() && !company.equalsIgnoreCase("Unknown Company")) {
                app.setCompany(company);
                app.setCompanyLogo(company.toLowerCase().replaceAll("[^a-z0-9]", ""));
            }
            if (result.getJobTitle() != null && !result.getJobTitle().isBlank() && !result.getJobTitle().equalsIgnoreCase("Applicant")) {
                app.setTitle(result.getJobTitle());
            }

            // Intelligent status progression
            if (shouldUpgradeStatus(app.getStatus(), result.getStatus())) {
                app.setStatus(result.getStatus());
            }

            if (result.getSalary() != null && app.getSalary() == null) {
                app.setSalary(result.getSalary());
            }

            // Update recruiter intelligence if higher confidence or human identified
            if (result.getRecruiterName() != null && !result.getRecruiterName().isBlank()) {
                boolean shouldUpdateRecruiter = app.getRecruiterName() == null
                        || (result.getRecruiterType() == com.careermail.model.enums.RecruiterType.HUMAN_RECRUITER && app.getRecruiterType() != com.careermail.model.enums.RecruiterType.HUMAN_RECRUITER)
                        || (result.getContactConfidence() != null && (app.getContactConfidence() == null || result.getContactConfidence() > app.getContactConfidence()));

                if (shouldUpdateRecruiter) {
                    app.setRecruiterName(result.getRecruiterName());
                    app.setRecruiterEmail(result.getRecruiterEmail());
                    app.setRecruiterTitle(result.getRecruiterTitle());
                    app.setRecruiterPhone(result.getRecruiterPhone());
                    app.setRecruiterLinkedin(result.getRecruiterLinkedin());
                    app.setRecruiterType(result.getRecruiterType());
                    app.setContactConfidence(result.getContactConfidence());
                    app.setContactExtractionSource(result.getContactExtractionSource());
                }
            }

            // Keep dateApplied as the earliest application/confirmation date
            if (email.getTimestamp() != null) {
                LocalDate emailDate = email.getTimestamp().toLocalDate();
                if (app.getDateApplied() == null || emailDate.isBefore(app.getDateApplied())) {
                    app.setDateApplied(emailDate);
                }
            }

            app.setLastActivityDate(LocalDate.now());
            app.setActivitySubtitle(computeSubtitle(app.getStatus()));

            TimelineEvent timelineEvent = new TimelineEvent(
                    app,
                    email.getSubject(),
                    result.getTimelineNote() != null ? result.getTimelineNote() : (email.getPreview() != null ? email.getPreview() : email.getSubject()),
                    email.getTimestamp() != null ? email.getTimestamp() : LocalDateTime.now(),
                    result.getStatus() != null ? result.getStatus().name() : app.getStatus().name()
            );
            app.addTimelineEvent(timelineEvent);
            app = jobApplicationRepository.save(app);
        } else {
            appCreated = true;
            app = new JobApplication();
            app.setUser(user);
            app.setCompany(company);
            app.setTitle(result.getJobTitle() != null && !result.getJobTitle().isBlank() ? result.getJobTitle() : "Applicant");
            app.setLocation(result.getLocation());
            app.setEmploymentType(result.getEmploymentType());
            app.setSalary(result.getSalary());
            app.setDateApplied(email.getTimestamp() != null ? email.getTimestamp().toLocalDate() : LocalDate.now());
            app.setLastActivityDate(LocalDate.now());
            app.setStatus(result.getStatus() != null ? result.getStatus() : ApplicationStatus.APPLIED);
            app.setPriority(computePriority(result.getStatus()));

            app.setRecruiterName(result.getRecruiterName());
            app.setRecruiterEmail(result.getRecruiterEmail());
            app.setRecruiterTitle(result.getRecruiterTitle());
            app.setRecruiterPhone(result.getRecruiterPhone());
            app.setRecruiterLinkedin(result.getRecruiterLinkedin());
            app.setRecruiterType(result.getRecruiterType() != null ? result.getRecruiterType() : com.careermail.model.enums.RecruiterType.NO_RECRUITER_IDENTIFIED);
            app.setContactConfidence(result.getContactConfidence());
            app.setContactExtractionSource(result.getContactExtractionSource());

            app.setSource("Gmail Auto-Detection");
            app.setCompanyLogo(company.toLowerCase().replaceAll("[^a-z0-9]", ""));
            app.setActivitySubtitle(computeSubtitle(app.getStatus()));

            TimelineEvent initialEvent = new TimelineEvent(
                    app,
                    "Discovered: " + app.getTitle() + " at " + app.getCompany(),
                    result.getTimelineNote() != null ? result.getTimelineNote() : "Detected from email: " + email.getSubject(),
                    email.getTimestamp() != null ? email.getTimestamp() : LocalDateTime.now(),
                    app.getStatus().name()
            );
            app.addTimelineEvent(initialEvent);
            app = jobApplicationRepository.save(app);
        }

        email.setJobApplication(app);

        // Auto-create Interview if detected
        if (result.getClassification() == EmailClassification.INTERVIEW_INVITATION ||
                result.getClassification() == EmailClassification.INTERVIEW_SCHEDULED ||
                result.getStatus() == ApplicationStatus.INTERVIEW ||
                result.getStatus() == ApplicationStatus.FINAL_INTERVIEW) {
            LocalDateTime intDate = result.getInterviewDateTime() != null
                    ? result.getInterviewDateTime()
                    : LocalDateTime.now().plusDays(3).withHour(11).withMinute(0);

            if (!interviewRepository.existsByUserAndJobApplicationAndInterviewDate(user, app, intDate)) {
                Interview interview = new Interview();
                interview.setUser(user);
                interview.setJobApplication(app);
                interview.setCompany(app.getCompany());
                interview.setTitle(app.getTitle());
                interview.setInterviewDate(intDate);
                interview.setType(result.getInterviewType() != null ? result.getInterviewType() : "Technical Interview");
                interview.setInterviewer(result.getRecruiterName() != null ? result.getRecruiterName() : "Hiring Team");
                interview.setLocation(result.getInterviewLink() != null ? "Online / Video" : "Online");
                interview.setMeetingLink(result.getInterviewLink());
                interview.setDaysAwayBadge("In 3 days");
                interview.setCompanyLogo(app.getCompanyLogo());
                interview.setPreparationNotes("Prepare technical background and experience for " + app.getCompany() + ".");
                interview.setStatus(InterviewStatus.SCHEDULED);
                interviewRepository.save(interview);
                interviewCreated = true;
            }
        }

        // Auto-create Follow-up if assessment / deadline detected
        if (result.getClassification() == EmailClassification.ASSESSMENT || result.getDeadline() != null) {
            LocalDate dueDate = result.getDeadline() != null ? result.getDeadline() : LocalDate.now().plusDays(5);
            if (!followUpRepository.existsByUserAndJobApplicationAndDueDate(user, app, dueDate)) {
                FollowUp followUp = new FollowUp();
                followUp.setUser(user);
                followUp.setJobApplication(app);
                followUp.setCompany(app.getCompany());
                followUp.setRole(app.getTitle());
                followUp.setDueDate(dueDate);
                followUp.setAppliedSubtitle("Assessment Active");
                followUp.setDaysDueBadge("Due in " + ChronoUnit.DAYS.between(LocalDate.now(), dueDate) + " days");
                followUp.setCompanyLogo(app.getCompanyLogo());
                followUp.setNotes("Complete online coding assessment for " + app.getCompany() + " before deadline.");
                followUp.setStatus(FollowUpStatus.PENDING);
                followUpRepository.save(followUp);
                followUpCreated = true;
            }
        }

        return new ProcessOutcome(true, appCreated, appUpdated, interviewCreated, followUpCreated);
    }

    private boolean shouldUpgradeStatus(ApplicationStatus current, ApplicationStatus incoming) {
        if (incoming == null || current == null) return false;
        if (current == incoming) return false;
        // Never downgrade from OFFER unless explicitly REJECTED or WITHDRAWN
        if (current == ApplicationStatus.OFFER && incoming != ApplicationStatus.REJECTED && incoming != ApplicationStatus.WITHDRAWN) {
            return false;
        }
        // Hierarchy of states
        return getStatusWeight(incoming) >= getStatusWeight(current);
    }

    private int getStatusWeight(ApplicationStatus status) {
        return switch (status) {
            case APPLIED -> 1;
            case ASSESSMENT -> 2;
            case RECRUITER_SCREEN -> 3;
            case INTERVIEW -> 4;
            case FINAL_INTERVIEW -> 5;
            case OFFER -> 6;
            case REJECTED -> 7;
            case WITHDRAWN -> 8;
        };
    }

    @Transactional
    public void reprocessAllUserEmails(User user) {
        // Clear old auto-detected interviews and followups
        interviewRepository.deleteAll(interviewRepository.findByUserOrderByInterviewDateAsc(user));
        followUpRepository.deleteAll(followUpRepository.findByUserOrderByDueDateAsc(user));

        // Clear old auto-detected entities
        var userApps = jobApplicationRepository.findByUser(user);
        for (var app : userApps) {
            if ("Gmail Auto-Detection".equalsIgnoreCase(app.getSource()) || app.getSource() == null) {
                var emailsLinked = emailRepository.findByUserAndJobApplication(user, app);
                for (var e : emailsLinked) {
                    e.setJobApplication(null);
                    e.setJobRelated(false);
                    emailRepository.save(e);
                }
                jobApplicationRepository.delete(app);
            }
        }
        jobApplicationRepository.flush();
        emailRepository.flush();

        // Re-process all emails with the new accurate rule-based analyzer in chronological order (earliest first)
        var allEmails = emailRepository.findByUserOrderByTimestampAsc(user);
        for (var e : allEmails) {
            processEmail(e, user);
            emailRepository.save(e);
        }
    }

    private Priority computePriority(ApplicationStatus status) {
        if (status == ApplicationStatus.OFFER || status == ApplicationStatus.FINAL_INTERVIEW || status == ApplicationStatus.INTERVIEW) {
            return Priority.HIGH;
        }
        return Priority.MEDIUM;
    }

    private String computeSubtitle(ApplicationStatus status) {
        return switch (status) {
            case ASSESSMENT -> "Assessment active";
            case RECRUITER_SCREEN -> "Screening call";
            case INTERVIEW -> "Technical Interview";
            case FINAL_INTERVIEW -> "Final Round";
            case OFFER -> "Offer Received 🎉";
            case REJECTED -> "Application closed";
            case WITHDRAWN -> "Application withdrawn";
            default -> "Applied recently";
        };
    }
}
