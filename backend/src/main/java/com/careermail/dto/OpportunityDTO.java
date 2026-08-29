package com.careermail.dto;

import java.time.LocalDateTime;
import java.util.List;

public class OpportunityDTO {
    private Long id;
    private String company;
    private String role;
    private String recruiterName;
    private String recruiterEmail;
    private String subject;
    private String snippet;
    private String fullBody;
    private LocalDateTime receivedAt;
    private String location;
    private String salary;
    private String opportunityType;
    private boolean isConverted;
    private Long applicationId;
    private List<String> tags;
    private boolean isDismissed;

    public OpportunityDTO() {}

    public OpportunityDTO(Long id, String company, String role, String recruiterName, String recruiterEmail,
                          String subject, String snippet, String fullBody, LocalDateTime receivedAt,
                          String location, String salary, String opportunityType, boolean isConverted,
                          Long applicationId, List<String> tags, boolean isDismissed) {
        this.id = id;
        this.company = company;
        this.role = role;
        this.recruiterName = recruiterName;
        this.recruiterEmail = recruiterEmail;
        this.subject = subject;
        this.snippet = snippet;
        this.fullBody = fullBody;
        this.receivedAt = receivedAt;
        this.location = location;
        this.salary = salary;
        this.opportunityType = opportunityType;
        this.isConverted = isConverted;
        this.applicationId = applicationId;
        this.tags = tags;
        this.isDismissed = isDismissed;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getRecruiterName() { return recruiterName; }
    public void setRecruiterName(String recruiterName) { this.recruiterName = recruiterName; }

    public String getRecruiterEmail() { return recruiterEmail; }
    public void setRecruiterEmail(String recruiterEmail) { this.recruiterEmail = recruiterEmail; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getSnippet() { return snippet; }
    public void setSnippet(String snippet) { this.snippet = snippet; }

    public String getFullBody() { return fullBody; }
    public void setFullBody(String fullBody) { this.fullBody = fullBody; }

    public LocalDateTime getReceivedAt() { return receivedAt; }
    public void setReceivedAt(LocalDateTime receivedAt) { this.receivedAt = receivedAt; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getSalary() { return salary; }
    public void setSalary(String salary) { this.salary = salary; }

    public String getOpportunityType() { return opportunityType; }
    public void setOpportunityType(String opportunityType) { this.opportunityType = opportunityType; }

    public boolean isConverted() { return isConverted; }
    public void setConverted(boolean converted) { isConverted = converted; }

    public Long getApplicationId() { return applicationId; }
    public void setApplicationId(Long applicationId) { this.applicationId = applicationId; }

    public List<String> getTags() { return tags; }
    public void setTags(List<String> tags) { this.tags = tags; }

    public boolean isDismissed() { return isDismissed; }
    public void setDismissed(boolean dismissed) { isDismissed = dismissed; }
}
