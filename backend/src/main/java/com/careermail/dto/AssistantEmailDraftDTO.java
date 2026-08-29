package com.careermail.dto;

public class AssistantEmailDraftDTO {

    private String to;
    private String subject;
    private String body;
    private String recruiterName;
    private String company;
    private String role;
    private String draftType; // "FOLLOW_UP", "REPLY", "THANK_YOU", "INQUIRY", "NETWORKING"

    public AssistantEmailDraftDTO() {}

    public AssistantEmailDraftDTO(String to, String subject, String body, String recruiterName,
                                  String company, String role, String draftType) {
        this.to = to;
        this.subject = subject;
        this.body = body;
        this.recruiterName = recruiterName;
        this.company = company;
        this.role = role;
        this.draftType = draftType;
    }

    public String getTo() { return to; }
    public void setTo(String to) { this.to = to; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }

    public String getRecruiterName() { return recruiterName; }
    public void setRecruiterName(String recruiterName) { this.recruiterName = recruiterName; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getDraftType() { return draftType; }
    public void setDraftType(String draftType) { this.draftType = draftType; }
}
