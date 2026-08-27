package com.careermail.model.enums;

public enum ApplicationStatus {
    APPLIED("Applied"),
    ASSESSMENT("Assessment"),
    RECRUITER_SCREEN("Recruiter Screen"),
    INTERVIEW("Interview"),
    FINAL_INTERVIEW("Final Interview"),
    OFFER("Offer"),
    REJECTED("Rejected"),
    WITHDRAWN("Withdrawn");

    private final String displayName;

    ApplicationStatus(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }

    public static ApplicationStatus fromString(String text) {
        if (text == null) return APPLIED;
        String normalized = text.trim().toUpperCase().replace(" ", "_").replace("-", "_");
        for (ApplicationStatus status : ApplicationStatus.values()) {
            if (status.name().equalsIgnoreCase(normalized) || status.displayName.equalsIgnoreCase(text.trim())) {
                return status;
            }
        }
        return APPLIED;
    }
}
