package com.careermail.model.enums;

public enum Priority {
    LOW,
    MEDIUM,
    HIGH;

    public static Priority fromString(String text) {
        if (text == null) return MEDIUM;
        try {
            return Priority.valueOf(text.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return MEDIUM;
        }
    }
}
