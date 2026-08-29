package com.careermail.dto;

public class AssistantCardDTO {

    private String cardType; // "APPLICATION", "INTERVIEW", "FOLLOW_UP", "RECRUITER", "OPPORTUNITY", "ACTION_ITEM"
    private Long id;
    private String title;
    private String subtitle;
    private String badge;
    private String badgeColor; // "red", "orange", "blue", "green", "pink"
    private String priority; // "URGENT", "ATTENTION", "UPCOMING", "POSITIVE"
    private String actionUrl;
    private String company;
    private String role;
    private String status;
    private String date;
    private String recruiterName;
    private String recruiterEmail;

    public AssistantCardDTO() {}

    public AssistantCardDTO(String cardType, Long id, String title, String subtitle, String badge,
                            String badgeColor, String priority, String actionUrl, String company,
                            String role, String status, String date, String recruiterName, String recruiterEmail) {
        this.cardType = cardType;
        this.id = id;
        this.title = title;
        this.subtitle = subtitle;
        this.badge = badge;
        this.badgeColor = badgeColor;
        this.priority = priority;
        this.actionUrl = actionUrl;
        this.company = company;
        this.role = role;
        this.status = status;
        this.date = date;
        this.recruiterName = recruiterName;
        this.recruiterEmail = recruiterEmail;
    }

    public String getCardType() { return cardType; }
    public void setCardType(String cardType) { this.cardType = cardType; }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSubtitle() { return subtitle; }
    public void setSubtitle(String subtitle) { this.subtitle = subtitle; }

    public String getBadge() { return badge; }
    public void setBadge(String badge) { this.badge = badge; }

    public String getBadgeColor() { return badgeColor; }
    public void setBadgeColor(String badgeColor) { this.badgeColor = badgeColor; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getActionUrl() { return actionUrl; }
    public void setActionUrl(String actionUrl) { this.actionUrl = actionUrl; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getRecruiterName() { return recruiterName; }
    public void setRecruiterName(String recruiterName) { this.recruiterName = recruiterName; }

    public String getRecruiterEmail() { return recruiterEmail; }
    public void setRecruiterEmail(String recruiterEmail) { this.recruiterEmail = recruiterEmail; }
}
