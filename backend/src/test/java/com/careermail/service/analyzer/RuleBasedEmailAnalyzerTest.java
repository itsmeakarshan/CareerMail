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

    @Test
    void testExtractsHumanRecruiterDirectOutreach() {
        String subject = "Interview with Hana Taylor for Graduate Software Developer";
        String body = "Hi Akarshan,\n\nI would love to invite you to an interview for the role.\n\nBest regards,\nHana Taylor\nTalent Acquisition Partner\nPhone: +44 7123 456789";
        String sender = "Hana Taylor";
        String senderEmail = "hana.taylor@learningcurvegroup.co.uk";

        AnalysisResult result = analyzer.analyze(subject, body, sender, senderEmail);

        assertTrue(result.isJobRelated());
        assertEquals("Hana Taylor", result.getRecruiterName());
        assertEquals("hana.taylor@learningcurvegroup.co.uk", result.getRecruiterEmail());
        assertEquals(com.careermail.model.enums.RecruiterType.HUMAN_RECRUITER, result.getRecruiterType());
        assertTrue(result.getContactConfidence() >= 90);
    }

    @Test
    void testExtractsSignatureRecruiterFromAutomatedEmail() {
        String subject = "Thank you for your interest in Latent AI";
        String body = "Hi Akarshan,\n\nThank you for applying to Latent AI for the Data Scientist role.\n\nBest,\nNoam Shemesh\nLatent AI";
        String sender = "Noam Shemesh";
        String senderEmail = "notifications@app.bamboohr.com";

        AnalysisResult result = analyzer.analyze(subject, body, sender, senderEmail);

        assertTrue(result.isJobRelated());
        assertEquals("Noam Shemesh", result.getRecruiterName());
        assertEquals(com.careermail.model.enums.RecruiterType.POSSIBLE_RECRUITER, result.getRecruiterType());
        assertTrue(result.getContactConfidence() >= 80);
    }

    @Test
    void testIdentifiesAutomatedSystemSender() {
        String subject = "Thank you for your application at Corpay";
        String body = "Your application has been received. Our team will review your application.";
        String sender = "Corpay Workday Notification (Do Not Reply)";
        String senderEmail = "corpay@myworkday.com";

        AnalysisResult result = analyzer.analyze(subject, body, sender, senderEmail);

        assertTrue(result.isJobRelated());
        assertEquals(com.careermail.model.enums.RecruiterType.AUTOMATED_SYSTEM, result.getRecruiterType());
        assertTrue(result.getContactConfidence() >= 90);
    }
}
