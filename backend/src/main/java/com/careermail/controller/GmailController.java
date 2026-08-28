package com.careermail.controller;

import com.careermail.dto.GmailStatusResponse;
import com.careermail.dto.GmailSyncResponse;
import com.careermail.model.entity.ConnectedAccount;
import com.careermail.model.entity.User;
import com.careermail.service.AuthService;
import com.careermail.service.GmailService;
import com.careermail.service.GoogleOAuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/gmail")
public class GmailController {

    private final GmailService gmailService;
    private final AuthService authService;
    private final GoogleOAuthService googleOAuthService;

    public GmailController(GmailService gmailService, AuthService authService, GoogleOAuthService googleOAuthService) {
        this.gmailService = gmailService;
        this.authService = authService;
        this.googleOAuthService = googleOAuthService;
    }

    @GetMapping("/status")
    public ResponseEntity<GmailStatusResponse> getStatus() {
        User user = authService.getCurrentUser();
        Optional<ConnectedAccount> accountOpt = gmailService.getConnectedAccount(user);

        boolean configured = googleOAuthService.isConfigured();

        if (accountOpt.isPresent()) {
            ConnectedAccount acc = accountOpt.get();
            return ResponseEntity.ok(new GmailStatusResponse(
                    true,
                    acc.getProviderEmail() != null ? acc.getProviderEmail() : user.getEmail(),
                    acc.getProvider(),
                    acc.getLastSyncedAt(),
                    acc.getTotalEmailsScanned(),
                    configured
            ));
        }

        return ResponseEntity.ok(new GmailStatusResponse(
                false,
                null,
                "google",
                null,
                0,
                configured
        ));
    }

    @PostMapping("/sync")
    public ResponseEntity<GmailSyncResponse> syncGmail(
            @RequestParam(name = "maxResults", defaultValue = "30") int maxResults
    ) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(gmailService.scanAndProcess(user, maxResults));
    }

    @PostMapping("/disconnect")
    public ResponseEntity<Map<String, String>> disconnect() {
        User user = authService.getCurrentUser();
        gmailService.disconnectAccount(user);
        return ResponseEntity.ok(Map.of("message", "Gmail integration disconnected successfully"));
    }
}
