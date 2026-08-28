package com.careermail.model.entity;

import com.careermail.model.enums.FollowUpStatus;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "follow_ups")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class FollowUp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_application_id")
    @JsonBackReference
    private JobApplication jobApplication;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String company;

    private String role;

    @Column(nullable = false)
    private LocalDate dueDate;

    private String appliedSubtitle; // e.g. "Applied 12 days ago"
    private String daysDueBadge;    // e.g. "Due in 1 day"
    private String companyLogo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FollowUpStatus status = FollowUpStatus.PENDING;

    @Column(columnDefinition = "TEXT")
    private String notes;

    public FollowUp() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public JobApplication getJobApplication() { return jobApplication; }
    public void setJobApplication(JobApplication jobApplication) { this.jobApplication = jobApplication; }

    public Long getJobApplicationId() {
        return jobApplication != null ? jobApplication.getId() : null;
    }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public String getAppliedSubtitle() { return appliedSubtitle; }
    public void setAppliedSubtitle(String appliedSubtitle) { this.appliedSubtitle = appliedSubtitle; }

    public String getDaysDueBadge() { return daysDueBadge; }
    public void setDaysDueBadge(String daysDueBadge) { this.daysDueBadge = daysDueBadge; }

    public String getCompanyLogo() { return companyLogo; }
    public void setCompanyLogo(String companyLogo) { this.companyLogo = companyLogo; }

    public FollowUpStatus getStatus() { return status; }
    public void setStatus(FollowUpStatus status) { this.status = status; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
