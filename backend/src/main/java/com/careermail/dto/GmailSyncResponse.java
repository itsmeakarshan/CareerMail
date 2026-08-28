package com.careermail.dto;

import java.time.LocalDateTime;

public class GmailSyncResponse {
    private boolean success;
    private int scannedCount;
    private int jobEmailsFound;
    private int applicationsCreated;
    private int applicationsUpdated;
    private int duplicatesSkipped;
    private int interviewsFound;
    private int followUpsFound;
    private String message;
    private LocalDateTime syncedAt;

    public GmailSyncResponse() {}

    public GmailSyncResponse(boolean success, int scannedCount, int jobEmailsFound, int applicationsCreated,
                             int applicationsUpdated, int duplicatesSkipped, int interviewsFound, int followUpsFound,
                             String message, LocalDateTime syncedAt) {
        this.success = success;
        this.scannedCount = scannedCount;
        this.jobEmailsFound = jobEmailsFound;
        this.applicationsCreated = applicationsCreated;
        this.applicationsUpdated = applicationsUpdated;
        this.duplicatesSkipped = duplicatesSkipped;
        this.interviewsFound = interviewsFound;
        this.followUpsFound = followUpsFound;
        this.message = message;
        this.syncedAt = syncedAt;
    }

    public boolean isSuccess() { return success; }
    public void setSuccess(boolean success) { this.success = success; }

    public int getScannedCount() { return scannedCount; }
    public void setScannedCount(int scannedCount) { this.scannedCount = scannedCount; }

    public int getMessagesScanned() { return scannedCount; }

    public int getJobEmailsFound() { return jobEmailsFound; }
    public void setJobEmailsFound(int jobEmailsFound) { this.jobEmailsFound = jobEmailsFound; }

    public int getApplicationsCreated() { return applicationsCreated; }
    public void setApplicationsCreated(int applicationsCreated) { this.applicationsCreated = applicationsCreated; }

    public int getApplicationsUpdated() { return applicationsUpdated; }
    public void setApplicationsUpdated(int applicationsUpdated) { this.applicationsUpdated = applicationsUpdated; }

    public int getDuplicatesSkipped() { return duplicatesSkipped; }
    public void setDuplicatesSkipped(int duplicatesSkipped) { this.duplicatesSkipped = duplicatesSkipped; }

    public int getInterviewsFound() { return interviewsFound; }
    public void setInterviewsFound(int interviewsFound) { this.interviewsFound = interviewsFound; }

    public int getInterviewsCreated() { return interviewsFound; }

    public int getFollowUpsFound() { return followUpsFound; }
    public void setFollowUpsFound(int followUpsFound) { this.followUpsFound = followUpsFound; }

    public int getFollowUpsCreated() { return followUpsFound; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public LocalDateTime getSyncedAt() { return syncedAt; }
    public void setSyncedAt(LocalDateTime syncedAt) { this.syncedAt = syncedAt; }
}
