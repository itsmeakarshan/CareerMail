package com.careermail.service;

import com.careermail.dto.InterviewRequest;
import com.careermail.model.entity.Interview;
import com.careermail.model.entity.JobApplication;
import com.careermail.model.entity.TimelineEvent;
import com.careermail.model.entity.User;
import com.careermail.model.enums.InterviewStatus;
import com.careermail.repository.InterviewRepository;
import com.careermail.repository.JobApplicationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class InterviewService {

    private final InterviewRepository interviewRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final AuthService authService;

    public InterviewService(InterviewRepository interviewRepository,
                            JobApplicationRepository jobApplicationRepository,
                            AuthService authService) {
        this.interviewRepository = interviewRepository;
        this.jobApplicationRepository = jobApplicationRepository;
        this.authService = authService;
    }

    public List<Interview> getAllInterviews() {
        User user = authService.getCurrentUser();
        List<Interview> list = interviewRepository.findByUserOrderByInterviewDateAsc(user);
        list.forEach(this::computeDaysAwayBadge);
        return list;
    }

    public Interview getInterviewById(Long id) {
        User user = authService.getCurrentUser();
        Interview interview = interviewRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Interview not found with ID: " + id));
        computeDaysAwayBadge(interview);
        return interview;
    }

    @Transactional
    public Interview createInterview(InterviewRequest request) {
        User user = authService.getCurrentUser();

        Interview interview = new Interview();
        interview.setUser(user);
        interview.setCompany(request.getCompany());
        interview.setTitle(request.getTitle());
        interview.setInterviewDate(request.getInterviewDate());
        interview.setType(request.getType() != null ? request.getType() : "Technical Interview");
        interview.setInterviewer(request.getInterviewer());
        interview.setLocation(request.getLocation() != null ? request.getLocation() : "Google Meet");
        interview.setMeetingLink(request.getMeetingLink());
        interview.setPreparationNotes(request.getPreparationNotes());
        interview.setStatus(request.getStatus() != null ? InterviewStatus.valueOf(request.getStatus().toUpperCase()) : InterviewStatus.SCHEDULED);
        interview.setCompanyLogo(request.getCompanyLogo() != null ? request.getCompanyLogo() : request.getCompany().toLowerCase().replaceAll("[^a-z0-9]", ""));

        if (request.getJobApplicationId() != null) {
            JobApplication app = jobApplicationRepository.findByIdAndUser(request.getJobApplicationId(), user).orElse(null);
            interview.setJobApplication(app);
            if (app != null) {
                TimelineEvent event = new TimelineEvent(
                        app,
                        "Interview Scheduled: " + interview.getType(),
                        "Date: " + interview.getInterviewDate().toString() + " with " + interview.getInterviewer(),
                        LocalDateTime.now(),
                        "INTERVIEW"
                );
                app.addTimelineEvent(event);
            }
        }

        computeDaysAwayBadge(interview);
        return interviewRepository.save(interview);
    }

    @Transactional
    public Interview updateInterview(Long id, InterviewRequest request) {
        Interview interview = getInterviewById(id);

        interview.setCompany(request.getCompany());
        interview.setTitle(request.getTitle());
        interview.setInterviewDate(request.getInterviewDate());
        if (request.getType() != null) interview.setType(request.getType());
        if (request.getInterviewer() != null) interview.setInterviewer(request.getInterviewer());
        if (request.getLocation() != null) interview.setLocation(request.getLocation());
        if (request.getMeetingLink() != null) interview.setMeetingLink(request.getMeetingLink());
        if (request.getPreparationNotes() != null) interview.setPreparationNotes(request.getPreparationNotes());
        if (request.getStatus() != null) interview.setStatus(InterviewStatus.valueOf(request.getStatus().toUpperCase()));
        if (request.getCompanyLogo() != null) interview.setCompanyLogo(request.getCompanyLogo());

        computeDaysAwayBadge(interview);
        return interviewRepository.save(interview);
    }

    @Transactional
    public void deleteInterview(Long id) {
        Interview interview = getInterviewById(id);
        interviewRepository.delete(interview);
    }

    private void computeDaysAwayBadge(Interview interview) {
        if (interview.getInterviewDate() == null) return;
        LocalDateTime now = LocalDateTime.now();
        if (interview.getInterviewDate().isBefore(now)) {
            interview.setDaysAwayBadge("Completed");
            return;
        }

        long days = Duration.between(now, interview.getInterviewDate()).toDays();
        if (days == 0) {
            long hours = Duration.between(now, interview.getInterviewDate()).toHours();
            interview.setDaysAwayBadge(hours <= 0 ? "Today" : "In " + hours + "h");
        } else if (days == 1) {
            interview.setDaysAwayBadge("Tomorrow");
        } else {
            interview.setDaysAwayBadge("In " + days + " days");
        }
    }
}
