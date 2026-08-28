package com.careermail.service.analyzer;

import com.careermail.model.enums.ApplicationStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class RuleBasedEmailAnalyzerTest {

    private RuleBasedEmailAnalyzer analyzer;

    @BeforeEach
    void setUp() {
        analyzer = new RuleBasedEmailAnalyzer();
    }

    @Test
    void testDetectsInterviewInvitation() {
        String subject = "Invitation to Interview: Software Engineer at Google";
        String body = "We would love to invite you to an interview for the Software Engineer role at Google.";
        String sender = "Google Recruiting";
        String senderEmail = "recruiter@google.com";

        AnalysisResult result = analyzer.analyze(subject, body, sender, senderEmail);

        assertTrue(result.isJobRelated());
        assertEquals("Google", result.getCompany());
        assertEquals(ApplicationStatus.INTERVIEW, result.getStatus());
    }

    @Test
    void testDetectsOfferOfEmployment() {
        String subject = "Offer of Employment: Senior Platform Engineer at Netflix";
        String body = "We are pleased to offer you the position of Senior Platform Engineer at Netflix.";
        String sender = "Netflix Talent";
        String senderEmail = "talent@netflix.com";

        AnalysisResult result = analyzer.analyze(subject, body, sender, senderEmail);

        assertTrue(result.isJobRelated());
        assertEquals("Netflix", result.getCompany());
        assertEquals(ApplicationStatus.OFFER, result.getStatus());
    }

    @Test
    void testDetectsRejection() {
        String subject = "Update regarding your application at Stripe";
        String body = "Thank you for your interest in Stripe. Unfortunately, after careful consideration, we have decided not to proceed with your candidacy.";
        String sender = "Stripe Careers";
        String senderEmail = "careers@stripe.com";

        AnalysisResult result = analyzer.analyze(subject, body, sender, senderEmail);

        assertTrue(result.isJobRelated());
        assertEquals("Stripe", result.getCompany());
        assertEquals(ApplicationStatus.REJECTED, result.getStatus());
    }

    @Test
    void testDetectsAssessment() {
        String subject = "Coding Assessment for Software Engineer at Amazon";
        String body = "Please complete your HackerRank assessment within 5 days.";
        String sender = "Amazon Recruiting";
        String senderEmail = "jobs@amazon.com";

        AnalysisResult result = analyzer.analyze(subject, body, sender, senderEmail);

        assertTrue(result.isJobRelated());
        assertEquals(ApplicationStatus.ASSESSMENT, result.getStatus());
    }

    @Test
    void testIgnoresNonJobEmail() {
        String subject = "Your Amazon.com order has shipped";
        String body = "Your package with order #12345 has shipped and will arrive tomorrow.";
        String sender = "Amazon Orders";
        String senderEmail = "auto-confirm@amazon.com";

        AnalysisResult result = analyzer.analyze(subject, body, sender, senderEmail);

        assertFalse(result.isJobRelated());
    }
}
