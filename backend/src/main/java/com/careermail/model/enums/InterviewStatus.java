package com.careermail.model.enums;

public enum InterviewStatus {
    SCHEDULED,
    COMPLETED,
    CANCELLED;

    public static InterviewStatus fromString(String text) {
        if (text == null) return SCHEDULED;
        try {
            return InterviewStatus.valueOf(text.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return SCHEDULED;
        }
    }
}
