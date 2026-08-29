package com.careermail.dto;

import java.time.LocalDateTime;

public class GmailStatusResponse {
    private boolean connected;
    private String email;
    private String provider;
    private LocalDateTime lastSyncedAt;
    private Integer totalEmailsScanned;
    private boolean configured;
    private String scope;
    private boolean hasSendScope;

    public GmailStatusResponse() {}

    public GmailStatusResponse(boolean connected, String email, String provider, LocalDateTime lastSyncedAt, Integer totalEmailsScanned, boolean configured) {
        this(connected, email, provider, lastSyncedAt, totalEmailsScanned, configured, null, false);
    }

    public GmailStatusResponse(boolean connected, String email, String provider, LocalDateTime lastSyncedAt, Integer totalEmailsScanned, boolean configured, String scope, boolean hasSendScope) {
        this.connected = connected;
        this.email = email;
        this.provider = provider;
        this.lastSyncedAt = lastSyncedAt;
        this.totalEmailsScanned = totalEmailsScanned;
        this.configured = configured;
        this.scope = scope;
        this.hasSendScope = hasSendScope;
    }

    public boolean isConnected() { return connected; }
    public void setConnected(boolean connected) { this.connected = connected; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }

    public LocalDateTime getLastSyncedAt() { return lastSyncedAt; }
    public void setLastSyncedAt(LocalDateTime lastSyncedAt) { this.lastSyncedAt = lastSyncedAt; }

    public Integer getTotalEmailsScanned() { return totalEmailsScanned; }
    public void setTotalEmailsScanned(Integer totalEmailsScanned) { this.totalEmailsScanned = totalEmailsScanned; }

    public Integer getMessagesScanned() { return totalEmailsScanned != null ? totalEmailsScanned : 0; }

    public boolean isConfigured() { return configured; }
    public void setConfigured(boolean configured) { this.configured = configured; }

    public String getScope() { return scope; }
    public void setScope(String scope) { this.scope = scope; }

    public boolean isHasSendScope() { return hasSendScope; }
    public void setHasSendScope(boolean hasSendScope) { this.hasSendScope = hasSendScope; }
}
