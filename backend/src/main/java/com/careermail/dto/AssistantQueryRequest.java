package com.careermail.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;

public class AssistantQueryRequest {

    @NotBlank(message = "Message is required")
    @JsonAlias({"question", "message"})
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
