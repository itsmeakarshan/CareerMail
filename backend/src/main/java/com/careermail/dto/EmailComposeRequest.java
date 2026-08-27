package com.careermail.dto;

import jakarta.validation.constraints.NotBlank;

public class EmailComposeRequest {

    private String to;

    @NotBlank(message = "Subject is required")
    private String subject;

    @NotBlank(message = "Body is required")
    private String body;

    private boolean isJobRelated;
    private String detectedCompany;
    private String detectedRole;
    private String detectedStatus;

    public EmailComposeRequest() {}

    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public boolean isJobRelated() { return isJobRelated; }
    public void setJobRelated(boolean jobRelated) { isJobRelated = jobRelated; }

    public String getDetectedCompany() { return detectedCompany; }
    public void setDetectedCompany(String detectedCompany) { this.detectedCompany = detectedCompany; }

    public String getDetectedRole() { return detectedRole; }
    public void setDetectedRole(String detectedRole) { this.detectedRole = detectedRole; }

    public String getDetectedStatus() { return detectedStatus; }
    public void setDetectedStatus(String detectedStatus) { this.detectedStatus = detectedStatus; }
}
