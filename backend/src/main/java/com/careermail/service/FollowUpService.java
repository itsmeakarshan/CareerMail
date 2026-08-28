package com.careermail.service;

import com.careermail.dto.FollowUpRequest;
import com.careermail.model.entity.FollowUp;
import com.careermail.model.entity.JobApplication;
import com.careermail.model.entity.TimelineEvent;
import com.careermail.model.entity.User;
import com.careermail.model.enums.FollowUpStatus;
import com.careermail.repository.FollowUpRepository;
import com.careermail.repository.JobApplicationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class FollowUpService {

    private final FollowUpRepository followUpRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final AuthService authService;

    public FollowUpService(FollowUpRepository followUpRepository,
                           JobApplicationRepository jobApplicationRepository,
                           AuthService authService) {
        this.followUpRepository = followUpRepository;
        this.jobApplicationRepository = jobApplicationRepository;
        this.authService = authService;
    }

    public List<FollowUp> getAllFollowUps() {
        User user = authService.getCurrentUser();
        List<FollowUp> list = followUpRepository.findByUserOrderByDueDateAsc(user);
        list.forEach(this::computeBadges);
        return list;
    }

    public FollowUp getFollowUpById(Long id) {
        User user = authService.getCurrentUser();
        FollowUp followUp = followUpRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Follow-up not found with ID: " + id));
        computeBadges(followUp);
        return followUp;
    }

    @Transactional
    public FollowUp createFollowUp(FollowUpRequest request) {
        if (request.getCompany() == null || request.getCompany().trim().isEmpty()) {
            throw new IllegalArgumentException("Company is required");
        }
        if (request.getDueDate() == null) {
            throw new IllegalArgumentException("Due date is required");
        }

        User user = authService.getCurrentUser();

        FollowUp followUp = new FollowUp();
        followUp.setUser(user);
        followUp.setCompany(request.getCompany().trim());
        followUp.setRole(request.getRole() != null ? request.getRole().trim() : null);
        followUp.setDueDate(request.getDueDate());
        followUp.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);
        followUp.setStatus(request.getStatus() != null ? FollowUpStatus.fromString(request.getStatus()) : FollowUpStatus.PENDING);
        followUp.setCompanyLogo(request.getCompanyLogo() != null && !request.getCompanyLogo().trim().isEmpty()
                ? request.getCompanyLogo().trim()
                : request.getCompany().toLowerCase().replaceAll("[^a-z0-9]", ""));

        if (request.getJobApplicationId() != null) {
            JobApplication app = jobApplicationRepository.findByIdAndUser(request.getJobApplicationId(), user).orElse(null);
            followUp.setJobApplication(app);
            if (app != null) {
                app.setNextFollowUpDate(request.getDueDate());
                TimelineEvent event = new TimelineEvent(
                        app,
                        "Follow-up Scheduled",
                        "Follow-up set for " + request.getDueDate() + ": " + (request.getNotes() != null ? request.getNotes() : "Check on application status"),
                        LocalDateTime.now(),
                        "FOLLOW_UP"
                );
                app.addTimelineEvent(event);
            }
        }

        computeBadges(followUp);
        return followUpRepository.save(followUp);
    }

    @Transactional
    public FollowUp updateFollowUp(Long id, FollowUpRequest request) {
        FollowUp followUp = getFollowUpById(id);

        if (request.getCompany() != null && !request.getCompany().trim().isEmpty()) {
            followUp.setCompany(request.getCompany().trim());
        }
        if (request.getRole() != null) {
            followUp.setRole(request.getRole().trim());
        }
        if (request.getDueDate() != null) {
            followUp.setDueDate(request.getDueDate());
        }
        if (request.getNotes() != null) {
            followUp.setNotes(request.getNotes().trim());
        }
        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            followUp.setStatus(FollowUpStatus.fromString(request.getStatus()));
        }
        if (request.getCompanyLogo() != null && !request.getCompanyLogo().trim().isEmpty()) {
            followUp.setCompanyLogo(request.getCompanyLogo().trim());
        }
        if (request.getJobApplicationId() != null) {
            JobApplication app = jobApplicationRepository.findByIdAndUser(request.getJobApplicationId(), authService.getCurrentUser()).orElse(null);
            followUp.setJobApplication(app);
        }

        computeBadges(followUp);
        return followUpRepository.save(followUp);
    }

    @Transactional
    public void deleteFollowUp(Long id) {
        FollowUp followUp = getFollowUpById(id);
        if (followUp.getJobApplication() != null) {
            followUp.getJobApplication().getFollowUps().remove(followUp);
        }
        followUpRepository.delete(followUp);
    }

    private void computeBadges(FollowUp followUp) {
        if (followUp.getDueDate() == null) return;
        LocalDate today = LocalDate.now();
        long daysUntilDue = ChronoUnit.DAYS.between(today, followUp.getDueDate());

        if (daysUntilDue < 0) {
            followUp.setDaysDueBadge("Overdue by " + Math.abs(daysUntilDue) + "d");
        } else if (daysUntilDue == 0) {
            followUp.setDaysDueBadge("Due today");
        } else if (daysUntilDue == 1) {
            followUp.setDaysDueBadge("Due in 1 day");
        } else {
            followUp.setDaysDueBadge("Due in " + daysUntilDue + " days");
        }

        if (followUp.getJobApplication() != null && followUp.getJobApplication().getDateApplied() != null) {
            long daysAppliedAgo = ChronoUnit.DAYS.between(followUp.getJobApplication().getDateApplied(), today);
            followUp.setAppliedSubtitle("Applied " + daysAppliedAgo + " days ago");
        } else if (followUp.getAppliedSubtitle() == null) {
            followUp.setAppliedSubtitle("Applied recently");
        }
    }
}
