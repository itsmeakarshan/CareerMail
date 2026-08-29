package com.careermail.service;

import com.careermail.dto.AssistantQueryRequest;
import com.careermail.dto.AssistantQueryResponse;
import com.careermail.model.entity.*;
import com.careermail.model.enums.*;
import com.careermail.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("local")
@Transactional
class CareerAssistantServiceTest {

    @Autowired
    private CareerAssistantService careerAssistantService;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired
    private InterviewRepository interviewRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserDetailsService userDetailsService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = userRepository.findByEmail("arjun.sharma@email.com")
                .orElseThrow(() -> new IllegalStateException("Test user not found"));

        UserDetails userDetails = userDetailsService.loadUserByUsername("arjun.sharma@email.com");
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                userDetails, null, userDetails.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void testWhatShouldIDoNext_GeneratesActionablePriorityList() {
        // Create an interview within 24h
        JobApplication app = new JobApplication();
        app.setUser(testUser);
        app.setCompany("Stripe");
        app.setTitle("Senior Full Stack Engineer");
        app.setStatus(ApplicationStatus.INTERVIEW);
        app.setDateApplied(LocalDate.now().minusDays(5));
        app = jobApplicationRepository.save(app);

        Interview interview = new Interview();
        interview.setUser(testUser);
        interview.setJobApplication(app);
        interview.setCompany("Stripe");
        interview.setTitle("Technical Architecture Interview");
        interview.setInterviewDate(LocalDateTime.now().plusHours(12));
        interview.setType("Technical");
        interview.setLocation("Google Meet");
        interview.setStatus(InterviewStatus.SCHEDULED);
        interviewRepository.save(interview);

        AssistantQueryRequest request = new AssistantQueryRequest("What should I do next?", "/tracker");
        AssistantQueryResponse response = careerAssistantService.askAssistant(request);

        assertNotNull(response);
        assertNotNull(response.getReply());
        assertTrue(response.getReply().contains("Stripe"));
        assertTrue(response.getReply().contains("Urgent"));
        assertNotNull(response.getCards());
        assertFalse(response.getCards().isEmpty());
    }

    @Test
    void testAnalyzeProgress_CalculatesAccurateConversionRates() {
        JobApplication app1 = new JobApplication();
        app1.setUser(testUser);
        app1.setCompany("Google");
        app1.setTitle("Data Scientist");
        app1.setStatus(ApplicationStatus.INTERVIEW);
        app1.setDateApplied(LocalDate.now().minusDays(10));
        jobApplicationRepository.save(app1);

        JobApplication app2 = new JobApplication();
        app2.setUser(testUser);
        app2.setCompany("Meta");
        app2.setTitle("Software Engineer");
        app2.setStatus(ApplicationStatus.REJECTED);
        app2.setDateApplied(LocalDate.now().minusDays(15));
        jobApplicationRepository.save(app2);

        AssistantQueryRequest request = new AssistantQueryRequest("Analyze my progress", "/tracker");
        AssistantQueryResponse response = careerAssistantService.askAssistant(request);

        assertNotNull(response);
        assertTrue(response.getReply().contains("Analytics"));
        assertTrue(response.getReply().contains("Response Rate"));
        assertTrue(response.getReply().contains("Interview Conversion"));
    }

    @Test
    void testEmailDrafting_GeneratesProfessionalFollowUpDraft() {
        JobApplication app = new JobApplication();
        app.setUser(testUser);
        app.setCompany("Anthropic");
        app.setTitle("Research Engineer");
        app.setStatus(ApplicationStatus.APPLIED);
        app.setRecruiterName("Emily Recruiter");
        app.setRecruiterEmail("emily@anthropic.com");
        app.setDateApplied(LocalDate.now().minusDays(12));
        app = jobApplicationRepository.save(app);

        AssistantQueryRequest request = new AssistantQueryRequest("Draft a follow-up email for Anthropic", "/tracker");
        request.setSelectedApplicationId(app.getId());

        AssistantQueryResponse response = careerAssistantService.askAssistant(request);

        assertNotNull(response);
        assertNotNull(response.getEmailDraft());
        assertEquals("emily@anthropic.com", response.getEmailDraft().getTo());
        assertEquals("Anthropic", response.getEmailDraft().getCompany());
        assertTrue(response.getEmailDraft().getBody().contains("Anthropic"));
        assertTrue(response.getEmailDraft().getBody().contains("Research Engineer"));
    }

    @Test
    void testRecruiterIntelligence_ExtractsRealContacts() {
        JobApplication app = new JobApplication();
        app.setUser(testUser);
        app.setCompany("Figma");
        app.setTitle("Frontend Engineer");
        app.setStatus(ApplicationStatus.RECRUITER_SCREEN);
        app.setRecruiterName("David Chen");
        app.setRecruiterEmail("david@figma.com");
        app.setRecruiterType(RecruiterType.HUMAN_RECRUITER);
        app.setContactConfidence(92);
        jobApplicationRepository.save(app);

        AssistantQueryRequest request = new AssistantQueryRequest("Show my recruiters", "/tracker");
        AssistantQueryResponse response = careerAssistantService.askAssistant(request);

        assertNotNull(response);
        assertTrue(response.getReply().contains("David Chen"));
        assertTrue(response.getReply().contains("Figma"));
        assertNotNull(response.getCards());
    }

    @Test
    void testNaturalLanguageSearch_FindsApplications() {
        JobApplication app = new JobApplication();
        app.setUser(testUser);
        app.setCompany("Linear");
        app.setTitle("Product Engineer");
        app.setStatus(ApplicationStatus.APPLIED);
        jobApplicationRepository.save(app);

        AssistantQueryRequest request = new AssistantQueryRequest("Search for Linear", "/tracker");
        AssistantQueryResponse response = careerAssistantService.askAssistant(request);

        assertNotNull(response);
        assertTrue(response.getReply().contains("Linear"));
        assertNotNull(response.getCards());
    }
}
