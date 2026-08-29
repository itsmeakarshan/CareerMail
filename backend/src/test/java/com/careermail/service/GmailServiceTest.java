package com.careermail.service;

import com.careermail.dto.GmailSyncResponse;
import com.careermail.model.entity.Email;
import com.careermail.model.entity.User;
import com.careermail.repository.UserRepository;
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

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("local")
@Transactional
class GmailServiceTest {

    @Autowired
    private GmailService gmailService;

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
    void testScanWithoutConnectedAccount_ReturnsNotConnectedResponse() {
        GmailSyncResponse response = gmailService.scanAndProcess(testUser, 30);

        assertNotNull(response);
        assertEquals(0, response.getScannedCount());
        assertTrue(response.getMessage().toLowerCase().contains("no google account connected") ||
                response.getMessage().toLowerCase().contains("please connect"));
    }

    @Test
    void testParseGmailMessage_ExtractsMetadataCorrectly() {
        Map<String, Object> msgData = new HashMap<>();
        msgData.put("snippet", "Thank you for applying to the Software Engineer role.");
        msgData.put("internalDate", "1747000000000");

        Map<String, Object> payload = new HashMap<>();
        List<Map<String, String>> headers = List.of(
                Map.of("name", "Subject", "value", "Application Confirmation: Software Engineer at Stripe"),
                Map.of("name", "From", "value", "Stripe Recruiting <careers@stripe.com>"),
                Map.of("name", "To", "value", "arjun.sharma@email.com")
        );
        payload.put("headers", headers);
        msgData.put("payload", payload);

        Email email = gmailService.parseGmailMessage(msgData, testUser, "msg_stripe_123", "thread_stripe_123");

        assertNotNull(email);
        assertEquals("msg_stripe_123", email.getGmailMessageId());
        assertEquals("thread_stripe_123", email.getGmailThreadId());
        assertEquals("Stripe Recruiting", email.getSender());
        assertEquals("careers@stripe.com", email.getSenderEmail());
        assertEquals("Application Confirmation: Software Engineer at Stripe", email.getSubject());
    }

    @Test
    void testSendEmailWithoutConnectedAccount_ThrowsIllegalStateException() {
        com.careermail.dto.EmailComposeRequest request = new com.careermail.dto.EmailComposeRequest();
        request.setTo("recruiter@google.com");
        request.setSubject("Follow up on application");
        request.setBody("Hello, checking on the status of my application.");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> {
            gmailService.sendEmail(testUser, request);
        });

        assertTrue(ex.getMessage().contains("No Google account connected") || ex.getMessage().contains("Please connect"));
    }

    @Test
    void testSendEmailValidation_ThrowsIllegalArgumentExceptionOnBlankFields() {
        com.careermail.dto.EmailComposeRequest emptyTo = new com.careermail.dto.EmailComposeRequest();
        emptyTo.setTo("   ");
        emptyTo.setSubject("Subject");
        emptyTo.setBody("Body");

        assertThrows(IllegalArgumentException.class, () -> gmailService.sendEmail(testUser, emptyTo));

        com.careermail.dto.EmailComposeRequest emptySubject = new com.careermail.dto.EmailComposeRequest();
        emptySubject.setTo("recruiter@google.com");
        emptySubject.setSubject("   ");
        emptySubject.setBody("Body");

        assertThrows(IllegalArgumentException.class, () -> gmailService.sendEmail(testUser, emptySubject));

        com.careermail.dto.EmailComposeRequest emptyBody = new com.careermail.dto.EmailComposeRequest();
        emptyBody.setTo("recruiter@google.com");
        emptyBody.setSubject("Subject");
        emptyBody.setBody("   ");

        assertThrows(IllegalArgumentException.class, () -> gmailService.sendEmail(testUser, emptyBody));
    }
}
