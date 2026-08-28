package com.careermail.model.entity;

import com.careermail.model.enums.EmailClassification;
import com.careermail.model.enums.EmailFolder;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "emails", indexes = {
        @Index(name = "idx_email_user_id", columnList = "user_id"),
        @Index(name = "idx_email_gmail_msg_id", columnList = "gmailMessageId")
})
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Email {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String sender;

    @Column(nullable = false)
    private String senderEmail;

    private String recipientEmail;

    @Column(nullable = false)
    private String subject;

    @Column(columnDefinition = "TEXT")
    private String preview;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String body;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    private boolean isRead = false;
    private boolean isStarred = false;
    private boolean isImportant = false;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EmailFolder folder = EmailFolder.INBOX;

    private String labels; // comma-separated e.g. "Job,Recruiter"

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_application_id")
    @JsonIgnoreProperties({"interviews", "followUps", "timelineEvents", "hibernateLazyInitializer", "handler"})
    private JobApplication jobApplication;

    // Extracted job information metadata
    private boolean isJobRelated = false;
    private String detectedCompany;
    private String detectedRole;
    private String detectedStatus;

    @Enumerated(EnumType.STRING)
    private EmailClassification classification;

    private String gmailMessageId;
    private String gmailThreadId;
    private LocalDateTime processedAt;

    public Email() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }

    public String getSenderEmail() { return senderEmail; }
    public void setSenderEmail(String senderEmail) { this.senderEmail = senderEmail; }

    public String getRecipientEmail() { return recipientEmail; }
    public void setRecipientEmail(String recipientEmail) { this.recipientEmail = recipientEmail; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getPreview() { return preview; }
    public void setPreview(String preview) { this.preview = preview; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public boolean isRead() { return isRead; }
    public void setRead(boolean read) { isRead = read; }

    public boolean isStarred() { return isStarred; }
    public void setStarred(boolean starred) { isStarred = starred; }

    public boolean isImportant() { return isImportant; }
    public void setImportant(boolean important) { isImportant = important; }

    public EmailFolder getFolder() { return folder; }
    public void setFolder(EmailFolder folder) { this.folder = folder; }

    public String getLabels() { return labels; }
    public void setLabels(String labels) { this.labels = labels; }

    public JobApplication getJobApplication() { return jobApplication; }
    public void setJobApplication(JobApplication jobApplication) { this.jobApplication = jobApplication; }

    public Long getJobApplicationId() {
        return jobApplication != null ? jobApplication.getId() : null;
    }

    public boolean isJobRelated() { return isJobRelated; }
    public void setJobRelated(boolean jobRelated) { isJobRelated = jobRelated; }

    public String getDetectedCompany() { return detectedCompany; }
    public void setDetectedCompany(String detectedCompany) { this.detectedCompany = detectedCompany; }

    public String getDetectedRole() { return detectedRole; }
    public void setDetectedRole(String detectedRole) { this.detectedRole = detectedRole; }

    public String getDetectedStatus() { return detectedStatus; }
    public void setDetectedStatus(String detectedStatus) { this.detectedStatus = detectedStatus; }

    public EmailClassification getClassification() { return classification; }
    public void setClassification(EmailClassification classification) { this.classification = classification; }

    public String getGmailMessageId() { return gmailMessageId; }
    public void setGmailMessageId(String gmailMessageId) { this.gmailMessageId = gmailMessageId; }

    public String getGmailThreadId() { return gmailThreadId; }
    public void setGmailThreadId(String gmailThreadId) { this.gmailThreadId = gmailThreadId; }

    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }
}
