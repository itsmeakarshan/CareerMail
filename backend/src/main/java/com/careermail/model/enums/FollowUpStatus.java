package com.careermail.model.enums;

public enum FollowUpStatus {
    PENDING,
    COMPLETED,
    DISMISSED;

    public static FollowUpStatus fromString(String text) {
        if (text == null) return PENDING;
        try {
            return FollowUpStatus.valueOf(text.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return PENDING;
        }
    }
}
