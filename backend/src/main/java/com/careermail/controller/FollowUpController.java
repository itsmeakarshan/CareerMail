package com.careermail.controller;

import com.careermail.dto.FollowUpRequest;
import com.careermail.model.entity.FollowUp;
import com.careermail.service.FollowUpService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping({"/api/followups", "/api/follow-ups"})
public class FollowUpController {

    private final FollowUpService followUpService;

    public FollowUpController(FollowUpService followUpService) {
        this.followUpService = followUpService;
    }

    @GetMapping
    public ResponseEntity<List<FollowUp>> getAllFollowUps() {
        return ResponseEntity.ok(followUpService.getAllFollowUps());
    }

    @GetMapping("/{id}")
    public ResponseEntity<FollowUp> getFollowUpById(@PathVariable Long id) {
        return ResponseEntity.ok(followUpService.getFollowUpById(id));
    }

    @PostMapping
    public ResponseEntity<FollowUp> createFollowUp(@Valid @RequestBody FollowUpRequest request) {
        return ResponseEntity.ok(followUpService.createFollowUp(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FollowUp> updateFollowUp(@PathVariable Long id, @RequestBody FollowUpRequest request) {
        return ResponseEntity.ok(followUpService.updateFollowUp(id, request));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<FollowUp> patchFollowUp(@PathVariable Long id, @RequestBody FollowUpRequest request) {
        return ResponseEntity.ok(followUpService.updateFollowUp(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteFollowUp(@PathVariable Long id) {
        followUpService.deleteFollowUp(id);
        return ResponseEntity.ok(Map.of("message", "Follow-up deleted successfully"));
    }
}
