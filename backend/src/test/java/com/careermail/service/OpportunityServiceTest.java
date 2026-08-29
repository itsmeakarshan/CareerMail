package com.careermail.service;

import com.careermail.dto.OpportunityDTO;
import com.careermail.model.entity.Email;
import com.careermail.model.entity.JobApplication;
import com.careermail.model.entity.User;
import com.careermail.model.enums.ApplicationStatus;
import com.careermail.model.enums.EmailClassification;
import com.careermail.model.enums.RecruiterType;
import com.careermail.repository.EmailRepository;
import com.careermail.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("local")
@Transactional
class OpportunityServiceTest {

    @Autowired
    private OpportunityService opportunityService;

    @Autowired
    private EmailRepository emailRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = userRepository.findByEmail("arjun.sharma@email.com")
                .orElseThrow(() -> new IllegalStateException("Test user not found"));
    }

    @Test
    void testGetOpportunities_ExtractsOpportunitiesFromEmails() {
        Email email = new Email();
        email.setUser(testUser);
        email.setSubject("Exciting Senior Full Stack Engineer Opportunity at Acme Corp");
        email.setBody("Hi, we have an exciting new opportunity for a Senior Full Stack Engineer with $140,000 - $180,000 salary.");
        email.setSender("Sarah Recruiter");
        email.setSenderEmail("sarah@acme.com");
        email.setDetectedCompany("Acme Corp");
        email.setDetectedRole("Senior Full Stack Engineer");
        email.setDetectedRecruiterName("Sarah Recruiter");
        email.setDetectedRecruiterType(RecruiterType.HUMAN_RECRUITER);
        email.setClassification(EmailClassification.NEW_OPPORTUNITY);
        email.setTimestamp(LocalDateTime.now());
        email = emailRepository.save(email);

        List<OpportunityDTO> opportunities = opportunityService.getOpportunities(testUser);

        assertNotNull(opportunities);
        assertTrue(opportunities.size() >= 1);
        OpportunityDTO found = opportunities.stream()
                .filter(o -> "Acme Corp".equals(o.getCompany()))
                .findFirst()
                .orElse(null);

        assertNotNull(found);
        assertEquals("Senior Full Stack Engineer", found.getRole());
        assertEquals("Sarah Recruiter", found.getRecruiterName());
        assertFalse(found.isConverted());
    }

    @Test
    void testConvertOpportunity_CreatesJobApplicationAndLinksEmail() {
        Email email = new Email();
        email.setUser(testUser);
        email.setSubject("New Opportunity: Lead AI Engineer at Tech Innovations");
        email.setBody("We'd love to connect regarding an open position.");
        email.setSender("Talent Acquisition");
        email.setSenderEmail("talent@techinnovations.io");
        email.setDetectedCompany("Tech Innovations");
        email.setDetectedRole("Lead AI Engineer");
        email.setTimestamp(LocalDateTime.now());
        email = emailRepository.save(email);

        JobApplication createdApp = opportunityService.convertOpportunity(testUser, email.getId(), null);

        assertNotNull(createdApp);
        assertNotNull(createdApp.getId());
        assertEquals("Tech Innovations", createdApp.getCompany());
        assertEquals("Lead AI Engineer", createdApp.getTitle());
        assertEquals(ApplicationStatus.APPLIED, createdApp.getStatus());
        assertEquals("Gmail Opportunity Lead", createdApp.getSource());

        Email refreshedEmail = emailRepository.findById(email.getId()).orElseThrow();
        assertNotNull(refreshedEmail.getJobApplication());
        assertEquals(createdApp.getId(), refreshedEmail.getJobApplication().getId());
    }
}
