package com.careermail.controller;

import com.careermail.dto.JobApplicationRequest;
import com.careermail.dto.OpportunityDTO;
import com.careermail.model.entity.JobApplication;
import com.careermail.model.entity.User;
import com.careermail.service.AuthService;
import com.careermail.service.OpportunityService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/opportunities")
public class OpportunityController {

    private final OpportunityService opportunityService;
    private final AuthService authService;

    public OpportunityController(OpportunityService opportunityService, AuthService authService) {
        this.opportunityService = opportunityService;
        this.authService = authService;
    }

    @GetMapping
    public ResponseEntity<List<OpportunityDTO>> getOpportunities() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(opportunityService.getOpportunities(user));
    }

    @PostMapping("/{emailId}/convert")
    public ResponseEntity<JobApplication> convertOpportunity(
            @PathVariable Long emailId,
            @RequestBody(required = false) JobApplicationRequest customRequest) {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(opportunityService.convertOpportunity(user, emailId, customRequest));
    }

    @PostMapping("/scan")
    public ResponseEntity<Map<String, Object>> scanGmailForOpportunities() {
        User user = authService.getCurrentUser();
        return ResponseEntity.ok(opportunityService.scanGmailForOpportunities(user));
    }
}
