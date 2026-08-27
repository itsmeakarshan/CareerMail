package com.careermail.service.analyzer;

import com.careermail.model.enums.ApplicationStatus;

public class AnalysisResult {
    private boolean jobRelated;
    private String company;
    private String jobTitle;
    private ApplicationStatus status;
    private String recruiterName;
    private String recruiterEmail;
    private String timelineNote;
    private double confidence;

    public AnalysisResult() {}

    public AnalysisResult(boolean jobRelated, String company, String jobTitle, ApplicationStatus status,
                          String recruiterName, String recruiterEmail, String timelineNote, double confidence) {
        this.jobRelated = jobRelated;
        this.company = company;
        this.jobTitle = jobTitle;
        this.status = status;
        this.recruiterName = recruiterName;
        this.recruiterEmail = recruiterEmail;
        this.timelineNote = timelineNote;
        this.confidence = confidence;
    }

    public boolean isJobRelated() { return jobRelated; }
    public void setJobRelated(boolean jobRelated) { this.jobRelated = jobRelated; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getJobTitle() { return jobTitle; }
    public void setJobTitle(String jobTitle) { this.jobTitle = jobTitle; }

    public ApplicationStatus getStatus() { return status; }
    public void setStatus(ApplicationStatus status) { this.status = status; }

    public String getRecruiterName() { return recruiterName; }
    public void setRecruiterName(String recruiterName) { this.recruiterName = recruiterName; }

    public String getRecruiterEmail() { return recruiterEmail; }
    public void setRecruiterEmail(String recruiterEmail) { this.recruiterEmail = recruiterEmail; }

    public String getTimelineNote() { return timelineNote; }
    public void setTimelineNote(String timelineNote) { this.timelineNote = timelineNote; }

    public double getConfidence() { return confidence; }
    public void setConfidence(double confidence) { this.confidence = confidence; }
}
