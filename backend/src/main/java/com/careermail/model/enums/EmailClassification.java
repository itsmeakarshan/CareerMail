package com.careermail.model.enums;

public enum EmailClassification {
    APPLICATION_SUBMITTED("Application Submitted"),
    APPLICATION_RECEIVED("Application Received"),
    RECRUITER_MESSAGE("Recruiter Message"),
    INTERVIEW_INVITATION("Interview Invitation"),
    INTERVIEW_SCHEDULED("Interview Scheduled"),
    ASSESSMENT("Assessment / Coding Test"),
    REJECTION("Rejection"),
    OFFER("Job Offer"),
    STATUS_UPDATE("Status Update"),
    OTHER_JOB_RELATED("Other Job Related");

    private final String displayName;

    EmailClassification(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
