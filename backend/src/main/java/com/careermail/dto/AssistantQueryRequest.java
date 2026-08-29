package com.careermail.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

public class AssistantQueryRequest {

    @JsonAlias({"question", "message"})
    private String query;

    private String currentScreen;
    private Long selectedApplicationId;
    private Long selectedEmailId;
    private String action; // e.g. "WHAT_NEXT", "ANALYZE_PROGRESS", "NEEDS_ATTENTION", "DRAFT_REPLY", "FIND_RECRUITERS", "SEARCH"

    public AssistantQueryRequest() {}

    public AssistantQueryRequest(String query, String currentScreen) {
        this.query = query;
        this.currentScreen = currentScreen;
    }

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }

    public String getCurrentScreen() { return currentScreen; }
    public void setCurrentScreen(String currentScreen) { this.currentScreen = currentScreen; }

    public Long getSelectedApplicationId() { return selectedApplicationId; }
    public void setSelectedApplicationId(Long selectedApplicationId) { this.selectedApplicationId = selectedApplicationId; }

    public Long getSelectedEmailId() { return selectedEmailId; }
    public void setSelectedEmailId(Long selectedEmailId) { this.selectedEmailId = selectedEmailId; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
}
