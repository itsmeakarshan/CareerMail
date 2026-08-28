package com.careermail;

import com.careermail.dto.AuthResponse;
import com.careermail.dto.FollowUpRequest;
import com.careermail.dto.InterviewRequest;
import com.careermail.dto.JobApplicationRequest;
import com.careermail.dto.LoginRequest;
import com.careermail.model.entity.Email;
import com.careermail.model.entity.FollowUp;
import com.careermail.model.entity.Interview;
import com.careermail.model.entity.JobApplication;
import com.careermail.model.enums.FollowUpStatus;
import com.careermail.model.enums.InterviewStatus;
import com.careermail.repository.EmailRepository;
import com.careermail.repository.JobApplicationRepository;
import com.careermail.service.AuthService;
import com.careermail.service.EmailService;
import com.careermail.service.FollowUpService;
import com.careermail.service.InterviewService;
import com.careermail.service.JobApplicationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
class BackendIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthService authService;

    @Autowired
    private JobApplicationService jobApplicationService;

    @Autowired
    private JobApplicationRepository jobApplicationRepository;

    @Autowired
    private EmailRepository emailRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private FollowUpService followUpService;

    @Autowired
    private com.careermail.repository.FollowUpRepository followUpRepository;

    @Autowired
    private InterviewService interviewService;

    @Autowired
    private com.careermail.repository.InterviewRepository interviewRepository;

    @Autowired
    private org.springframework.security.core.userdetails.UserDetailsService userDetailsService;

    private String jwtToken;

    @BeforeEach
    void setUp() {
        AuthResponse response = authService.login(new LoginRequest("arjun.sharma@email.com", "password123"));
        this.jwtToken = response.getToken();

        org.springframework.security.core.userdetails.UserDetails userDetails =
                userDetailsService.loadUserByUsername("arjun.sharma@email.com");
        org.springframework.security.authentication.UsernamePasswordAuthenticationToken auth =
                new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities()
                );
        org.springframework.security.core.context.SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void testGetEmailsByFolder_DoesNotCrashWithByteBuddyProxySerialization() throws Exception {
        // GET /api/emails?folder=INBOX
        mockMvc.perform(get("/api/emails")
                        .header("Authorization", "Bearer " + jwtToken)
                        .param("folder", "INBOX"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON));

        // GET /api/emails?folder=STARRED
        mockMvc.perform(get("/api/emails")
                        .header("Authorization", "Bearer " + jwtToken)
                        .param("folder", "STARRED"))
                .andExpect(status().isOk());

        // GET /api/emails?folder=IMPORTANT
        mockMvc.perform(get("/api/emails")
                        .header("Authorization", "Bearer " + jwtToken)
                        .param("folder", "IMPORTANT"))
                .andExpect(status().isOk());
    }

    @Test
    void testDeleteApplicationWithLinkedEmails_DissociatesCleanlyWithoutFKViolation() throws Exception {
        // 1. Create a test application
        JobApplicationRequest appReq = new JobApplicationRequest();
        appReq.setCompany("Acme Test Corp");
        appReq.setTitle("Senior Architect");
        appReq.setStatus("APPLIED");
        JobApplication createdApp = jobApplicationService.createApplication(appReq);

        // 2. Simulate an incoming email linked to this application
        Email email = emailService.simulateIncomingEmail(
                "Acme Recruiter",
                "recruiter@acme.com",
                "Your application to Acme Test Corp",
                "Thank you for applying for Senior Architect at Acme Test Corp.",
                true
        );
        email.setJobApplication(createdApp);
        emailRepository.save(email);

        // 3. Delete the application via DELETE /api/applications/{id}
        mockMvc.perform(delete("/api/applications/" + createdApp.getId())
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk());

        // 4. Verify application is gone
        assertFalse(jobApplicationRepository.findById(createdApp.getId()).isPresent());

        // 5. Verify the email still exists and its jobApplication is null (dissociated)
        Email updatedEmail = emailRepository.findById(email.getId()).orElse(null);
        assertNotNull(updatedEmail);
        assertNull(updatedEmail.getJobApplication());
    }

    @Test
    void testPartialUpdateFollowUp_AllowsStatusTransitionWithoutOverwritingExistingFields() throws Exception {
        // 1. Create a follow-up
        FollowUpRequest createReq = new FollowUpRequest();
        createReq.setCompany("Airbnb");
        createReq.setRole("Frontend Engineer");
        createReq.setDueDate(LocalDate.now().plusDays(3));
        createReq.setNotes("Follow up with recruiter Sarah");
        FollowUp created = followUpService.createFollowUp(createReq);

        // 2. Send partial update with just status (e.g. as frontend does on checkmark)
        String partialUpdateJson = "{\"status\":\"COMPLETED\"}";
        mockMvc.perform(put("/api/followups/" + created.getId())
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(partialUpdateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.company").value("Airbnb"))
                .andExpect(jsonPath("$.role").value("Frontend Engineer"));

        FollowUp updated = followUpRepository.findById(created.getId()).orElse(null);
        assertNotNull(updated);
        assertEquals(FollowUpStatus.COMPLETED, updated.getStatus());
        assertEquals("Airbnb", updated.getCompany());
        assertEquals("Frontend Engineer", updated.getRole());
    }

    @Test
    void testPartialUpdateInterview_AllowsStatusTransition() throws Exception {
        // 1. Create an interview
        InterviewRequest createReq = new InterviewRequest();
        createReq.setCompany("Stripe");
        createReq.setTitle("Systems Engineer");
        createReq.setInterviewDate(LocalDateTime.now().plusDays(4));
        createReq.setType("Technical Interview");
        Interview created = interviewService.createInterview(createReq);

        // 2. Send partial update
        String partialUpdateJson = "{\"status\":\"COMPLETED\"}";
        mockMvc.perform(put("/api/interviews/" + created.getId())
                        .header("Authorization", "Bearer " + jwtToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(partialUpdateJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.company").value("Stripe"))
                .andExpect(jsonPath("$.title").value("Systems Engineer"));

        Interview updated = interviewRepository.findById(created.getId()).orElse(null);
        assertNotNull(updated);
        assertEquals(InterviewStatus.COMPLETED, updated.getStatus());
        assertEquals("Stripe", updated.getCompany());
    }

    @Test
    void testFollowUpAndInterview_ExposeJobApplicationIdInJson() throws Exception {
        // Create an application
        JobApplicationRequest appReq = new JobApplicationRequest();
        appReq.setCompany("Datadog");
        appReq.setTitle("DevOps Engineer");
        JobApplication app = jobApplicationService.createApplication(appReq);

        // Create a linked follow-up
        FollowUpRequest fReq = new FollowUpRequest();
        fReq.setCompany("Datadog");
        fReq.setDueDate(LocalDate.now().plusDays(2));
        fReq.setJobApplicationId(app.getId());
        FollowUp followUp = followUpService.createFollowUp(fReq);

        // Create a linked interview
        InterviewRequest iReq = new InterviewRequest();
        iReq.setCompany("Datadog");
        iReq.setTitle("DevOps Engineer");
        iReq.setInterviewDate(LocalDateTime.now().plusDays(5));
        iReq.setJobApplicationId(app.getId());
        Interview interview = interviewService.createInterview(iReq);

        // Check GET /api/followups/{id} contains jobApplicationId
        mockMvc.perform(get("/api/followups/" + followUp.getId())
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobApplicationId").value(app.getId()));

        // Check GET /api/interviews/{id} contains jobApplicationId
        mockMvc.perform(get("/api/interviews/" + interview.getId())
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.jobApplicationId").value(app.getId()));
    }

    @Test
    void testAnalyticsEndpoint_ReturnsValidDynamicData() throws Exception {
        mockMvc.perform(get("/api/analytics/dashboard")
                        .header("Authorization", "Bearer " + jwtToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalApplications").isNumber())
                .andExpect(jsonPath("$.applicationStatus").isArray());
    }
}
