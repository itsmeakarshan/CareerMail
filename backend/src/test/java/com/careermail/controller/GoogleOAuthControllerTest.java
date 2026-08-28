package com.careermail.controller;

import com.careermail.dto.AuthResponse;
import com.careermail.dto.LoginRequest;
import com.careermail.service.AuthService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
class GoogleOAuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthService authService;

    private String jwtToken;

    @BeforeEach
    void setUp() {
        AuthResponse response = authService.login(new LoginRequest("arjun.sharma@email.com", "password123"));
        this.jwtToken = response.getToken();
    }

    @Test
    void testGetGoogleAuthUrl_ReturnsValidUrl() throws Exception {
        mockMvc.perform(get("/api/auth/google/url")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.url").isString())
                .andExpect(jsonPath("$.url").value(org.hamcrest.Matchers.containsString("accounts.google.com")));
    }

    @Test
    void testGetGoogleConfig_ReturnsConfigStatus() throws Exception {
        mockMvc.perform(get("/api/auth/google/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.redirectUri").isString());
    }

    @Test
    void testGetGmailStatus_ReturnsStatus() throws Exception {
        mockMvc.perform(get("/api/gmail/status")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.provider").value("google"));
    }

    @Test
    void testSyncGmail_PerformsScan() throws Exception {
        mockMvc.perform(post("/api/gmail/sync")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scannedCount").isNumber())
                .andExpect(jsonPath("$.jobEmailsFound").isNumber());
    }
}
