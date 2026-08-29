package com.careermail.controller;

import com.careermail.dto.EmailComposeRequest;
import com.careermail.model.entity.Email;
import com.careermail.service.EmailService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/emails")
public class EmailController {

    private final EmailService emailService;

    public EmailController(EmailService emailService) {
        this.emailService = emailService;
    }

    @GetMapping
    public ResponseEntity<List<Email>> getEmails(
            @RequestParam(name = "folder", defaultValue = "inbox") String folder
    ) {
        if ("starred".equalsIgnoreCase(folder)) {
            return ResponseEntity.ok(emailService.getStarredEmails());
        }
        if ("important".equalsIgnoreCase(folder)) {
            return ResponseEntity.ok(emailService.getImportantEmails());
        }
        return ResponseEntity.ok(emailService.getEmailsByFolder(folder));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Email> getEmailById(@PathVariable Long id) {
        return ResponseEntity.ok(emailService.getEmailById(id));
    }

    @GetMapping("/application/{applicationId}")
    public ResponseEntity<List<Email>> getEmailsByApplication(@PathVariable Long applicationId) {
        return ResponseEntity.ok(emailService.getEmailsByJobApplication(applicationId));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<Email> markRead(@PathVariable Long id, @RequestParam(name = "read", defaultValue = "true") boolean read) {
        return ResponseEntity.ok(emailService.markRead(id, read));
    }

    @PatchMapping("/{id}/star")
    public ResponseEntity<Email> toggleStar(@PathVariable Long id) {
        return ResponseEntity.ok(emailService.toggleStar(id));
    }

    @PatchMapping("/{id}/important")
    public ResponseEntity<Email> toggleImportant(@PathVariable Long id) {
        return ResponseEntity.ok(emailService.toggleImportant(id));
    }

    @PatchMapping("/{id}/move")
    public ResponseEntity<Email> moveToFolder(@PathVariable Long id, @RequestParam(name = "folder") String folder) {
        return ResponseEntity.ok(emailService.moveToFolder(id, folder));
    }

    @PostMapping("/compose")
    public ResponseEntity<Email> composeEmail(@Valid @RequestBody EmailComposeRequest request) {
        return ResponseEntity.ok(emailService.composeEmail(request));
    }

    @PostMapping("/send")
    public ResponseEntity<Email> sendEmail(@Valid @RequestBody EmailComposeRequest request) {
        return ResponseEntity.ok(emailService.composeEmail(request));
    }

    @PostMapping("/simulate")
    public ResponseEntity<Email> simulateIncomingEmail(@RequestBody Map<String, Object> payload) {
        String sender = payload.get("sender") != null ? String.valueOf(payload.get("sender")) : "Recruiter";
        String senderEmail = payload.get("senderEmail") != null ? String.valueOf(payload.get("senderEmail")) : "recruiter@example.com";
        String subject = payload.get("subject") != null ? String.valueOf(payload.get("subject")) : "Update on your application";
        String body = payload.get("body") != null ? String.valueOf(payload.get("body")) : "Thank you for applying.";
        boolean imp = false;
        if (payload.get("important") != null) {
            imp = Boolean.parseBoolean(String.valueOf(payload.get("important")));
        }
        return ResponseEntity.ok(emailService.simulateIncomingEmail(sender, senderEmail, subject, body, imp));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteEmail(@PathVariable Long id) {
        emailService.deleteEmail(id);
        return ResponseEntity.ok(Map.of("message", "Email deleted successfully"));
    }

    @GetMapping("/counts")
    public ResponseEntity<Map<String, Long>> getFolderCounts() {
        return ResponseEntity.ok(emailService.getFolderCounts());
    }

    @GetMapping("/search")
    public ResponseEntity<List<Email>> searchEmails(@RequestParam(name = "q", defaultValue = "") String query) {
        return ResponseEntity.ok(emailService.searchEmails(query));
    }
}
