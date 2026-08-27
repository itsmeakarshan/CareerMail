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
        User user = authService.getCurrentUser();

        FollowUp followUp = new FollowUp();
        followUp.setUser(user);
        followUp.setCompany(request.getCompany());
        followUp.setRole(request.getRole());
        followUp.setDueDate(request.getDueDate());
        followUp.setNotes(request.getNotes());
        followUp.setStatus(request.getStatus() != null ? FollowUpStatus.valueOf(request.getStatus().toUpperCase()) : FollowUpStatus.PENDING);
        followUp.setCompanyLogo(request.getCompanyLogo() != null ? request.getCompanyLogo() : request.getCompany().toLowerCase().replaceAll("[^a-z0-9]", ""));

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

        followUp.setCompany(request.getCompany());
        if (request.getRole() != null) followUp.setRole(request.getRole());
        followUp.setDueDate(request.getDueDate());
        if (request.getNotes() != null) followUp.setNotes(request.getNotes());
        if (request.getStatus() != null) followUp.setStatus(FollowUpStatus.valueOf(request.getStatus().toUpperCase()));
        if (request.getCompanyLogo() != null) followUp.setCompanyLogo(request.getCompanyLogo());

        computeBadges(followUp);
        return followUpRepository.save(followUp);
    }

    @Transactional
    public void deleteFollowUp(Long id) {
        FollowUp followUp = getFollowUpById(id);
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
