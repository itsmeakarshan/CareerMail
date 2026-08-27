package com.careermail.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public class AssistantQueryRequest {

    @NotBlank(message = "Message is required")
    private String query;

    private String currentScreen;

    public AssistantQueryRequest() {}

    public AssistantQueryRequest(String query, String currentScreen) {
        this.query = query;
        this.currentScreen = currentScreen;
    }

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }

    public String getCurrentScreen() { return currentScreen; }
    public void setCurrentScreen(String currentScreen) { this.currentScreen = currentScreen; }
}
