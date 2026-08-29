package com.careermail.model.entity;

import com.careermail.model.enums.ApplicationStatus;
import com.careermail.model.enums.Priority;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "job_applications")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String company;

    @Column(nullable = false)
    private String title;

    private String location;

    private String employmentType;

    private String salary;

    private LocalDate dateApplied;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ApplicationStatus status = ApplicationStatus.APPLIED;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority = Priority.MEDIUM;

    private String recruiterName;
    private String recruiterEmail;
    private String recruiterTitle;
    private String recruiterPhone;
    private String recruiterLinkedin;

    @Enumerated(EnumType.STRING)
    private com.careermail.model.enums.RecruiterType recruiterType = com.careermail.model.enums.RecruiterType.NO_RECRUITER_IDENTIFIED;

    private Integer contactConfidence;
    private String contactExtractionSource;

    private String source;

    @Column(columnDefinition = "TEXT")
    private String notes;

    private LocalDate lastActivityDate;
    private LocalDate nextFollowUpDate;

    private String companyLogo;
    private String activitySubtitle; // e.g. "Applied 3 days ago", "Screening call", "Assessment invited"

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "jobApplication", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("eventDate DESC")
    @JsonManagedReference
    private List<TimelineEvent> timelineEvents = new ArrayList<>();

    @OneToMany(mappedBy = "jobApplication", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<Interview> interviews = new ArrayList<>();

    @OneToMany(mappedBy = "jobApplication", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<FollowUp> followUps = new ArrayList<>();

    public JobApplication() {}

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (dateApplied == null) {
            dateApplied = LocalDate.now();
        }
        if (lastActivityDate == null) {
            lastActivityDate = dateApplied;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void addTimelineEvent(TimelineEvent event) {
        timelineEvents.add(event);
        event.setJobApplication(this);
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }

    public String getSalary() { return salary; }
    public void setSalary(String salary) { this.salary = salary; }

    public LocalDate getDateApplied() { return dateApplied; }
    public void setDateApplied(LocalDate dateApplied) { this.dateApplied = dateApplied; }

    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }

    public Priority getPriority() { return priority; }
    public void setPriority(Priority priority) { this.priority = priority; }

    public String getRecruiterName() { return recruiterName; }
    public void setRecruiterName(String recruiterName) { this.recruiterName = recruiterName; }

    public String getRecruiterEmail() { return recruiterEmail; }
    public void setRecruiterEmail(String recruiterEmail) { this.recruiterEmail = recruiterEmail; }

    public String getRecruiterTitle() { return recruiterTitle; }
    public void setRecruiterTitle(String recruiterTitle) { this.recruiterTitle = recruiterTitle; }

    public String getRecruiterPhone() { return recruiterPhone; }
    public void setRecruiterPhone(String recruiterPhone) { this.recruiterPhone = recruiterPhone; }

    public String getRecruiterLinkedin() { return recruiterLinkedin; }
    public void setRecruiterLinkedin(String recruiterLinkedin) { this.recruiterLinkedin = recruiterLinkedin; }

    public com.careermail.model.enums.RecruiterType getRecruiterType() { return recruiterType; }
    public void setRecruiterType(com.careermail.model.enums.RecruiterType recruiterType) { this.recruiterType = recruiterType; }

    public Integer getContactConfidence() { return contactConfidence; }
    public void setContactConfidence(Integer contactConfidence) { this.contactConfidence = contactConfidence; }

    public String getContactExtractionSource() { return contactExtractionSource; }
    public void setContactExtractionSource(String contactExtractionSource) { this.contactExtractionSource = contactExtractionSource; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDate getLastActivityDate() { return lastActivityDate; }
    public void setLastActivityDate(LocalDate lastActivityDate) { this.lastActivityDate = lastActivityDate; }

    public LocalDate getNextFollowUpDate() { return nextFollowUpDate; }
    public void setNextFollowUpDate(LocalDate nextFollowUpDate) { this.nextFollowUpDate = nextFollowUpDate; }

    public String getCompanyLogo() { return companyLogo; }
    public void setCompanyLogo(String companyLogo) { this.companyLogo = companyLogo; }

    public String getActivitySubtitle() { return activitySubtitle; }
    public void setActivitySubtitle(String activitySubtitle) { this.activitySubtitle = activitySubtitle; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    public List<TimelineEvent> getTimelineEvents() { return timelineEvents; }
    public void setTimelineEvents(List<TimelineEvent> timelineEvents) { this.timelineEvents = timelineEvents; }

    public List<Interview> getInterviews() { return interviews; }
    public void setInterviews(List<Interview> interviews) { this.interviews = interviews; }

    public List<FollowUp> getFollowUps() { return followUps; }
    public void setFollowUps(List<FollowUp> followUps) { this.followUps = followUps; }
}
