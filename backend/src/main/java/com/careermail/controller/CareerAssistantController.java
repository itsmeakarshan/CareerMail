package com.careermail.controller;

import com.careermail.dto.AssistantQueryRequest;
import com.careermail.dto.AssistantQueryResponse;
import com.careermail.service.CareerAssistantService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assistant")
public class CareerAssistantController {

    private final CareerAssistantService assistantService;

    public CareerAssistantController(CareerAssistantService assistantService) {
        this.assistantService = assistantService;
    }

    @PostMapping({"/ask", "/query"})
    public ResponseEntity<AssistantQueryResponse> askAssistant(@Valid @RequestBody AssistantQueryRequest request) {
        return ResponseEntity.ok(assistantService.askAssistant(request));
    }
}
