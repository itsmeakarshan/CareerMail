package com.careermail.controller;

import com.careermail.dto.GoogleAuthUrlResponse;
import com.careermail.service.AuthService;
import com.careermail.service.GoogleOAuthService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/auth/google")
public class GoogleOAuthController {

    private final GoogleOAuthService googleOAuthService;
    private final AuthService authService;

    public GoogleOAuthController(GoogleOAuthService googleOAuthService, AuthService authService) {
        this.googleOAuthService = googleOAuthService;
        this.authService = authService;
    }

    @GetMapping("/url")
    public ResponseEntity<GoogleAuthUrlResponse> getAuthorizationUrl(
            @RequestParam(name = "state", required = false) String state
    ) {
        // If current user is authenticated, we can encode user ID in state to link accounts
        String finalState = state;
        try {
            var currentUser = authService.getCurrentUser();
            if (currentUser != null && (finalState == null || finalState.isBlank())) {
                finalState = "user:" + currentUser.getId();
            }
        } catch (Exception ignored) {}

        String url = googleOAuthService.generateAuthorizationUrl(finalState);
        return ResponseEntity.ok(new GoogleAuthUrlResponse(url, finalState));
    }

    @GetMapping("/callback")
    public void handleCallback(
            @RequestParam(name = "code", required = false) String code,
            @RequestParam(name = "state", required = false) String state,
            @RequestParam(name = "error", required = false) String error,
            HttpServletResponse response
    ) throws IOException {
        String frontendUrl = googleOAuthService.getFrontendUrl();

        if (error != null) {
            response.sendRedirect(frontendUrl + "/settings?error=" + URLEncoder.encode(error, StandardCharsets.UTF_8));
            return;
        }

        if (code == null || code.isBlank()) {
            response.sendRedirect(frontendUrl + "/settings?error=missing_code");
            return;
        }

        try {
            GoogleOAuthService.OAuthCallbackResult result = googleOAuthService.handleOAuthCallback(code, state);
            // Redirect with success flag and token
            response.sendRedirect(frontendUrl + "/settings?gmail=connected&token=" + URLEncoder.encode(result.jwt, StandardCharsets.UTF_8));
        } catch (Exception e) {
            response.sendRedirect(frontendUrl + "/settings?error=" + URLEncoder.encode(e.getMessage() != null ? e.getMessage() : "oauth_failed", StandardCharsets.UTF_8));
        }
    }

    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getConfig() {
        return ResponseEntity.ok(Map.of(
                "configured", googleOAuthService.isConfigured(),
                "redirectUri", googleOAuthService.getRedirectUri(),
                "frontendUrl", googleOAuthService.getFrontendUrl()
        ));
    }
}
