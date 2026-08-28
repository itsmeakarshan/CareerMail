package com.careermail.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

public class GoogleAuthUrlResponse {
    @JsonProperty("url")
    @JsonAlias({"authUrl", "authorizationUrl"})
    private String url;
    private String state;

    public GoogleAuthUrlResponse() {}

    public GoogleAuthUrlResponse(String url, String state) {
        this.url = url;
        this.state = state;
    }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }

    @JsonProperty("authUrl")
    public String getAuthUrl() { return url; }

    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
}
