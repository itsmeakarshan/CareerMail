package com.careermail.dto;

import java.time.LocalDate;

public class JobApplicationRequest {

    private String company;
    private String title;

    private String location;
    private String employmentType;
    private String salary;
    private LocalDate dateApplied;
    private String status; // "APPLIED", "ASSESSMENT", etc.
    private String recruiterName;
    private String recruiterEmail;
    private String recruiterTitle;
    private String recruiterPhone;
    private String recruiterLinkedin;
    private String recruiterType;
    private Integer contactConfidence;
    private String contactExtractionSource;
    private String source;
    private String notes;
    private LocalDate nextFollowUpDate;
    private String companyLogo;
    private String activitySubtitle;

    public JobApplicationRequest() {}

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

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    private String priority; // "LOW", "MEDIUM", "HIGH"

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

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

    public String getRecruiterType() { return recruiterType; }
    public void setRecruiterType(String recruiterType) { this.recruiterType = recruiterType; }

    public Integer getContactConfidence() { return contactConfidence; }
    public void setContactConfidence(Integer contactConfidence) { this.contactConfidence = contactConfidence; }

    public String getContactExtractionSource() { return contactExtractionSource; }
    public void setContactExtractionSource(String contactExtractionSource) { this.contactExtractionSource = contactExtractionSource; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDate getNextFollowUpDate() { return nextFollowUpDate; }
    public void setNextFollowUpDate(LocalDate nextFollowUpDate) { this.nextFollowUpDate = nextFollowUpDate; }

    public String getCompanyLogo() { return companyLogo; }
    public void setCompanyLogo(String companyLogo) { this.companyLogo = companyLogo; }

    public String getActivitySubtitle() { return activitySubtitle; }
    public void setActivitySubtitle(String activitySubtitle) { this.activitySubtitle = activitySubtitle; }
}
