package com.careermail.service;

import com.careermail.dto.JobApplicationRequest;
import com.careermail.model.entity.JobApplication;
import com.careermail.model.entity.TimelineEvent;
import com.careermail.model.entity.User;
import com.careermail.model.enums.ApplicationStatus;
import com.careermail.model.enums.Priority;
import com.careermail.repository.EmailRepository;
import com.careermail.repository.JobApplicationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class JobApplicationService {

    private final JobApplicationRepository jobApplicationRepository;
    private final EmailRepository emailRepository;
    private final AuthService authService;

    public JobApplicationService(JobApplicationRepository jobApplicationRepository,
                                 EmailRepository emailRepository,
                                 AuthService authService) {
        this.jobApplicationRepository = jobApplicationRepository;
        this.emailRepository = emailRepository;
        this.authService = authService;
    }

    public List<JobApplication> getAllApplications() {
        User user = authService.getCurrentUser();
        return jobApplicationRepository.findByUserOrderByDateAppliedDesc(user);
    }

    public JobApplication getApplicationById(Long id) {
        User user = authService.getCurrentUser();
        return jobApplicationRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Job application not found with ID: " + id));
    }

    @Transactional
    public JobApplication createApplication(JobApplicationRequest request) {
        if (request.getCompany() == null || request.getCompany().trim().isEmpty()) {
            throw new IllegalArgumentException("Company is required");
        }
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Title is required");
        }

        User user = authService.getCurrentUser();

        JobApplication app = new JobApplication();
        app.setUser(user);
        app.setCompany(request.getCompany().trim());
        app.setTitle(request.getTitle().trim());
        app.setLocation(request.getLocation() != null ? request.getLocation().trim() : "Remote");
        app.setEmploymentType(request.getEmploymentType() != null ? request.getEmploymentType().trim() : "Full-time");
        app.setSalary(request.getSalary() != null ? request.getSalary().trim() : null);
        app.setDateApplied(request.getDateApplied() != null ? request.getDateApplied() : LocalDate.now());
        app.setStatus(request.getStatus() != null ? ApplicationStatus.fromString(request.getStatus()) : ApplicationStatus.APPLIED);
        app.setPriority(request.getPriority() != null ? Priority.fromString(request.getPriority()) : Priority.MEDIUM);
        app.setRecruiterName(request.getRecruiterName() != null ? request.getRecruiterName().trim() : null);
        app.setRecruiterEmail(request.getRecruiterEmail() != null ? request.getRecruiterEmail().trim() : null);
        app.setRecruiterTitle(request.getRecruiterTitle() != null ? request.getRecruiterTitle().trim() : null);
        app.setRecruiterPhone(request.getRecruiterPhone() != null ? request.getRecruiterPhone().trim() : null);
        app.setRecruiterLinkedin(request.getRecruiterLinkedin() != null ? request.getRecruiterLinkedin().trim() : null);
        if (request.getRecruiterType() != null) {
            try { app.setRecruiterType(com.careermail.model.enums.RecruiterType.valueOf(request.getRecruiterType())); } catch (Exception ignored) {}
        }
        app.setContactConfidence(request.getContactConfidence());
        app.setContactExtractionSource(request.getContactExtractionSource());
        app.setSource(request.getSource() != null ? request.getSource().trim() : "Direct Application");
        app.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);
        app.setNextFollowUpDate(request.getNextFollowUpDate());
        app.setCompanyLogo(request.getCompanyLogo() != null && !request.getCompanyLogo().trim().isEmpty()
                ? request.getCompanyLogo().trim()
                : request.getCompany().toLowerCase().replaceAll("[^a-z0-9]", ""));
        app.setActivitySubtitle(request.getActivitySubtitle() != null && !request.getActivitySubtitle().trim().isEmpty()
                ? request.getActivitySubtitle().trim()
                : "Applied recently");

        // Add initial timeline event
        TimelineEvent initialEvent = new TimelineEvent(
                app,
                "Applied for " + app.getTitle(),
                "Application submitted to " + app.getCompany(),
                LocalDateTime.now(),
                "APPLIED"
        );
        app.addTimelineEvent(initialEvent);

        return jobApplicationRepository.save(app);
    }

    @Transactional
    public JobApplication updateApplication(Long id, JobApplicationRequest request) {
        JobApplication app = getApplicationById(id);

        if (request.getCompany() != null && !request.getCompany().trim().isEmpty()) {
            app.setCompany(request.getCompany().trim());
        }
        if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
            app.setTitle(request.getTitle().trim());
        }
        if (request.getLocation() != null) app.setLocation(request.getLocation().trim());
        if (request.getEmploymentType() != null) app.setEmploymentType(request.getEmploymentType().trim());
        if (request.getSalary() != null) app.setSalary(request.getSalary().trim());
        if (request.getDateApplied() != null) app.setDateApplied(request.getDateApplied());

        if (request.getStatus() != null) {
            ApplicationStatus newStatus = ApplicationStatus.fromString(request.getStatus());
            if (newStatus != app.getStatus()) {
                app.setStatus(newStatus);
                app.setLastActivityDate(LocalDate.now());
                TimelineEvent statusEvent = new TimelineEvent(
                        app,
                        "Status changed to " + newStatus.getDisplayName(),
                        "Updated application status",
                        LocalDateTime.now(),
                        newStatus.name()
                );
                app.addTimelineEvent(statusEvent);
            }
        }

        if (request.getPriority() != null) app.setPriority(Priority.fromString(request.getPriority()));
        if (request.getRecruiterName() != null) app.setRecruiterName(request.getRecruiterName());
        if (request.getRecruiterEmail() != null) app.setRecruiterEmail(request.getRecruiterEmail());
        if (request.getRecruiterTitle() != null) app.setRecruiterTitle(request.getRecruiterTitle());
        if (request.getRecruiterPhone() != null) app.setRecruiterPhone(request.getRecruiterPhone());
        if (request.getRecruiterLinkedin() != null) app.setRecruiterLinkedin(request.getRecruiterLinkedin());
        if (request.getRecruiterType() != null) {
            try { app.setRecruiterType(com.careermail.model.enums.RecruiterType.valueOf(request.getRecruiterType())); } catch (Exception ignored) {}
        }
        if (request.getContactConfidence() != null) app.setContactConfidence(request.getContactConfidence());
        if (request.getContactExtractionSource() != null) app.setContactExtractionSource(request.getContactExtractionSource());
        if (request.getSource() != null) app.setSource(request.getSource());
        if (request.getNotes() != null) app.setNotes(request.getNotes());
        if (request.getNextFollowUpDate() != null) app.setNextFollowUpDate(request.getNextFollowUpDate());
        if (request.getCompanyLogo() != null) app.setCompanyLogo(request.getCompanyLogo());
        if (request.getActivitySubtitle() != null) app.setActivitySubtitle(request.getActivitySubtitle());

        return jobApplicationRepository.save(app);
    }

    @Transactional
    public JobApplication updateStatus(Long id, String statusStr) {
        JobApplication app = getApplicationById(id);
        ApplicationStatus newStatus = ApplicationStatus.fromString(statusStr);

        if (app.getStatus() != newStatus) {
            app.setStatus(newStatus);
            app.setLastActivityDate(LocalDate.now());

            String subtitle = switch (newStatus) {
                case ASSESSMENT -> "Assessment invited";
                case RECRUITER_SCREEN -> "Screening call";
                case INTERVIEW -> "Technical Interview";
                case FINAL_INTERVIEW -> "Final Round";
                case OFFER -> "Offer Received";
                case REJECTED -> "Application closed";
                case WITHDRAWN -> "Application withdrawn";
                default -> "Applied recently";
            };
            app.setActivitySubtitle(subtitle);

            TimelineEvent event = new TimelineEvent(
                    app,
                    "Moved to " + newStatus.getDisplayName(),
                    "Application stage updated on Kanban board",
                    LocalDateTime.now(),
                    newStatus.name()
            );
            app.addTimelineEvent(event);
        }

        return jobApplicationRepository.save(app);
    }

    @Transactional
    public void deleteApplication(Long id) {
        JobApplication app = getApplicationById(id);
        emailRepository.dissociateJobApplication(app);
        jobApplicationRepository.delete(app);
    }

    public List<JobApplication> searchApplications(String query) {
        User user = authService.getCurrentUser();
        if (query == null || query.trim().isEmpty()) {
            return getAllApplications();
        }
        return jobApplicationRepository.searchApplications(user, query.trim());
    }
}
