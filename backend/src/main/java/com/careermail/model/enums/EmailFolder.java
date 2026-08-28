package com.careermail.model.enums;

public enum EmailFolder {
    INBOX,
    SENT,
    DRAFTS,
    ARCHIVE,
    TRASH;

    public static EmailFolder fromString(String text) {
        if (text == null) return INBOX;
        try {
            return EmailFolder.valueOf(text.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return INBOX;
        }
    }
}
