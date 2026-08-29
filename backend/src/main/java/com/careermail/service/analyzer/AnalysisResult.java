package com.careermail.service.analyzer;

import com.careermail.model.enums.ApplicationStatus;
import com.careermail.model.enums.EmailClassification;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class AnalysisResult {
    private boolean jobRelated;
    private String company;
    private String jobTitle;
    private ApplicationStatus status;
    private EmailClassification classification;
    private String location;
    private String employmentType;
    private String salary;
    private String recruiterName;
    private String recruiterEmail;
    private String recruiterTitle;
    private String recruiterPhone;
    private String recruiterLinkedin;
    private com.careermail.model.enums.RecruiterType recruiterType = com.careermail.model.enums.RecruiterType.NO_RECRUITER_IDENTIFIED;
    private Integer contactConfidence;
    private String contactExtractionSource;

    private LocalDate deadline;
    private LocalDateTime interviewDateTime;
    private String interviewType;
    private String interviewLink;
    private String timelineNote;
    private double confidence;

    public AnalysisResult() {}

    public AnalysisResult(boolean jobRelated, String company, String jobTitle, ApplicationStatus status,
                          EmailClassification classification, String location, String employmentType,
                          String salary, String recruiterName, String recruiterEmail, LocalDate deadline,
                          LocalDateTime interviewDateTime, String interviewType, String interviewLink,
                          String timelineNote, double confidence) {
        this.jobRelated = jobRelated;
        this.company = company;
        this.jobTitle = jobTitle;
        this.status = status;
        this.classification = classification;
        this.location = location;
        this.employmentType = employmentType;
        this.salary = salary;
        this.recruiterName = recruiterName;
        this.recruiterEmail = recruiterEmail;
        this.deadline = deadline;
        this.interviewDateTime = interviewDateTime;
        this.interviewType = interviewType;
        this.interviewLink = interviewLink;
        this.timelineNote = timelineNote;
        this.confidence = confidence;
    }

    public static AnalysisResult nonJob() {
        AnalysisResult res = new AnalysisResult();
        res.setJobRelated(false);
        res.setConfidence(0.0);
        return res;
    }

    // Getters and Setters
    public boolean isJobRelated() { return jobRelated; }
    public void setJobRelated(boolean jobRelated) { this.jobRelated = jobRelated; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }

    public EmailClassification getClassification() { return classification; }
    public void setClassification(EmailClassification classification) { this.classification = classification; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public String getEmploymentType() { return employmentType; }
    public void setEmploymentType(String employmentType) { this.employmentType = employmentType; }

    public String getSalary() { return salary; }
    public void setSalary(String salary) { this.salary = salary; }

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

    public LocalDate getDeadline() { return deadline; }
    public void setDeadline(LocalDate deadline) { this.deadline = deadline; }

    public LocalDateTime getInterviewDateTime() { return interviewDateTime; }
    public void setInterviewDateTime(LocalDateTime interviewDateTime) { this.interviewDateTime = interviewDateTime; }

    public String getInterviewType() { return interviewType; }
    public void setInterviewType(String interviewType) { this.interviewType = interviewType; }

    public String getInterviewLink() { return interviewLink; }
    public void setInterviewLink(String interviewLink) { this.interviewLink = interviewLink; }

    public String getTimelineNote() { return timelineNote; }
    public void setTimelineNote(String timelineNote) { this.timelineNote = timelineNote; }

    public double getConfidence() { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }
}
