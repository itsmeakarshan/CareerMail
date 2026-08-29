package com.careermail.service;

import com.careermail.dto.JobApplicationRequest;
import com.careermail.dto.OpportunityDTO;
import com.careermail.model.entity.*;
import com.careermail.model.enums.*;
import com.careermail.repository.ConnectedAccountRepository;
import com.careermail.repository.EmailRepository;
import com.careermail.repository.JobApplicationRepository;
import com.careermail.repository.TimelineEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class OpportunityService {

    private static final Logger log = LoggerFactory.getLogger(OpportunityService.class);

    private final EmailRepository emailRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final TimelineEventRepository timelineEventRepository;
    private final ConnectedAccountRepository connectedAccountRepository;
    private final GoogleOAuthService googleOAuthService;
    private final GmailService gmailService;
    private final EmailAnalysisService emailAnalysisService;
    private final RestTemplate restTemplate;

    private static final List<String> OPPORTUNITY_KEYWORDS = Arrays.asList(
            "new opportunity", "job opportunity", "career opportunity", "exciting opportunity",
            "opportunity for", "opportunity at", "opportunity with", "role opening",
            "position open", "job opening", "we are hiring", "is hiring", "hiring for",
            "thought you'd be a great fit", "thought you might be a fit", "thought of you for",
            "job match", "job alert", "recruiter reachout", "reaching out regarding",
            "wanted to reach out regarding", "found your profile", "impressed with your background",
            "open role", "new role for", "role opening at", "explore opportunities"
    );

    public OpportunityService(EmailRepository emailRepository,
                              JobApplicationRepository jobApplicationRepository,
                              TimelineEventRepository timelineEventRepository,
                              ConnectedAccountRepository connectedAccountRepository,
                              GoogleOAuthService googleOAuthService,
                              GmailService gmailService,
                              EmailAnalysisService emailAnalysisService) {
        this.emailRepository = emailRepository;
        this.jobApplicationRepository = jobApplicationRepository;
        this.timelineEventRepository = timelineEventRepository;
        this.connectedAccountRepository = connectedAccountRepository;
        this.googleOAuthService = googleOAuthService;
        this.gmailService = gmailService;
        this.emailAnalysisService = emailAnalysisService;
        this.restTemplate = new RestTemplate();
    }

    @Transactional(readOnly = true)
    public List<OpportunityDTO> getOpportunities(User user) {
        List<Email> allEmails = emailRepository.findByUserOrderByTimestampDesc(user);
        List<OpportunityDTO> opportunities = new ArrayList<>();
        Set<String> seenSubjects = new HashSet<>();

        for (Email email : allEmails) {
            boolean isExplicitOpportunity = email.getClassification() == EmailClassification.NEW_OPPORTUNITY;
            boolean isUnlinkedRecruiter = email.getJobApplication() == null && (
                    email.getClassification() == EmailClassification.RECRUITER_MESSAGE ||
                    email.getDetectedRecruiterType() == RecruiterType.HUMAN_RECRUITER
            );

            String combined = (email.getSubject() + " " + (email.getBody() != null ? email.getBody() : "")).toLowerCase();
            boolean matchesKeywords = containsAnyKeyword(combined);

            if (isExplicitOpportunity || isUnlinkedRecruiter || (email.getJobApplication() == null && matchesKeywords)) {
                String dedupeKey = (email.getSubject() != null ? email.getSubject().trim().toLowerCase() : "") + "|" + email.getSenderEmail();
                if (!seenSubjects.add(dedupeKey)) {
                    continue;
                }

                OpportunityDTO dto = mapEmailToOpportunity(email);
                opportunities.add(dto);
            }
        }

        return opportunities;
    }

    @Transactional
    public JobApplication convertOpportunity(User user, Long emailId, JobApplicationRequest customRequest) {
        Email email = emailRepository.findByIdAndUser(emailId, user)
                .orElseThrow(() -> new IllegalArgumentException("Email not found with ID: " + emailId));

        String company = customRequest != null && customRequest.getCompany() != null && !customRequest.getCompany().isBlank()
                ? customRequest.getCompany()
                : (email.getDetectedCompany() != null && !email.getDetectedCompany().isBlank() ? email.getDetectedCompany() : extractCompanyFromSender(email));

        String role = customRequest != null && customRequest.getTitle() != null && !customRequest.getTitle().isBlank()
                ? customRequest.getTitle()
                : (email.getDetectedRole() != null && !email.getDetectedRole().isBlank() ? email.getDetectedRole() : "Software Engineer");

        ApplicationStatus status = ApplicationStatus.APPLIED;
        if (customRequest != null && customRequest.getStatus() != null && !customRequest.getStatus().isBlank()) {
            try {
                status = ApplicationStatus.valueOf(customRequest.getStatus().toUpperCase());
            } catch (Exception ignored) {}
        }

        JobApplication app = new JobApplication();
        app.setUser(user);
        app.setCompany(company);
        app.setTitle(role);
        app.setStatus(status);
        app.setLocation(customRequest != null && customRequest.getLocation() != null ? customRequest.getLocation() : "Remote / Hybrid");
        app.setEmploymentType(customRequest != null && customRequest.getEmploymentType() != null ? customRequest.getEmploymentType() : "Full-time");
        app.setSalary(customRequest != null && customRequest.getSalary() != null ? customRequest.getSalary() : extractSalary(email.getBody()));
        app.setDateApplied(LocalDate.now());
        app.setLastActivityDate(LocalDate.now());
        app.setSource("Gmail Opportunity Lead");
        app.setCompanyLogo(company.toLowerCase().replaceAll("[^a-z0-9]", ""));
        app.setPriority(Priority.HIGH);

        app.setRecruiterName(email.getDetectedRecruiterName() != null ? email.getDetectedRecruiterName() : email.getSender());
        app.setRecruiterEmail(email.getDetectedRecruiterEmail() != null ? email.getDetectedRecruiterEmail() : email.getSenderEmail());
        app.setRecruiterType(email.getDetectedRecruiterType() != null ? email.getDetectedRecruiterType() : RecruiterType.HUMAN_RECRUITER);
        app.setContactConfidence(85);

        JobApplication savedApp = jobApplicationRepository.save(app);

        // Link email to newly created application
        email.setJobApplication(savedApp);
        email.setJobRelated(true);
        emailRepository.save(email);

        // Add timeline event
        TimelineEvent event = new TimelineEvent(
                savedApp,
                "Converted Opportunity",
                "Converted from Gmail opportunity reachout: " + email.getSubject(),
                LocalDateTime.now(),
                "OPPORTUNITY_CONVERTED"
        );
        timelineEventRepository.save(event);

        log.info("Successfully converted opportunity email ID {} into JobApplication ID {} ({}) for user {}",
                emailId, savedApp.getId(), savedApp.getCompany(), user.getEmail());

        return savedApp;
    }

    @Transactional
    public Map<String, Object> scanGmailForOpportunities(User user) {
        Optional<ConnectedAccount> accountOpt = connectedAccountRepository.findByUserAndProvider(user, "google");
        if (accountOpt.isEmpty() || accountOpt.get().getAccessToken() == null) {
            throw new IllegalStateException("No Google account connected. Please connect Gmail in Settings first.");
        }

        ConnectedAccount account = accountOpt.get();
        String accessToken = googleOAuthService.getValidAccessToken(account);
        if (accessToken == null || accessToken.isBlank()) {
            throw new IllegalStateException("Google authentication expired. Please reconnect Gmail in Settings.");
        }

        String query = "newer_than:100d (\"new opportunity\" OR \"job opportunity\" OR \"career opportunity\" OR \"exciting opportunity\" OR \"opportunity with\" OR \"opportunity at\" OR \"role opening\" OR \"job opening\" OR \"we are hiring\" OR \"thought you'd be a great fit\" OR \"hiring for\")";
        String endpoint = "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=60&q=" + org.springframework.web.util.UriUtils.encode(query, java.nio.charset.StandardCharsets.UTF_8);

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);
        ParameterizedTypeReference<Map<String, Object>> mapType = new ParameterizedTypeReference<>() {};

        int scanned = 0;
        int opportunitiesFound = 0;

        try {
            ResponseEntity<Map<String, Object>> listResp = restTemplate.exchange(endpoint, HttpMethod.GET, request, mapType);
            if (listResp.getStatusCode().is2xxSuccessful() && listResp.getBody() != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> messages = (List<Map<String, Object>>) listResp.getBody().get("messages");
                if (messages != null) {
                    for (Map<String, Object> m : messages) {
                        String msgId = (String) m.get("id");
                        String threadId = (String) m.get("threadId");
                        if (msgId == null) continue;

                        String detailUrl = "https://gmail.googleapis.com/gmail/v1/users/me/messages/" + msgId + "?format=full";
                        try {
                            ResponseEntity<Map<String, Object>> detailResp = restTemplate.exchange(detailUrl, HttpMethod.GET, request, mapType);
                            if (detailResp.getStatusCode().is2xxSuccessful() && detailResp.getBody() != null) {
                                Email email = emailRepository.findByUserAndGmailMessageId(user, msgId)
                                        .orElseGet(() -> gmailService.parseGmailMessage(detailResp.getBody(), user, msgId, threadId, account.getAccessToken()));

                                email.setClassification(EmailClassification.NEW_OPPORTUNITY);
                                email.setJobRelated(true);
                                emailAnalysisService.processEmail(email, user);
                                emailRepository.save(email);
                                scanned++;
                                opportunitiesFound++;
                            }
                        } catch (Exception ex) {
                            log.warn("Failed to fetch detail for opportunity msg {}: {}", msgId, ex.getMessage());
                        }
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Error scanning Gmail for opportunities: {}", ex.getMessage(), ex);
            throw new RuntimeException("Error scanning Gmail for opportunities: " + ex.getMessage(), ex);
        }

        List<OpportunityDTO> currentOpportunities = getOpportunities(user);

        Map<String, Object> result = new HashMap<>();
        result.put("success", true);
        result.put("scannedCount", scanned);
        result.put("opportunitiesFound", opportunitiesFound);
        result.put("opportunitiesCount", currentOpportunities.size());
        result.put("message", String.format("Found %d extracted opportunities from your Gmail inbox.", currentOpportunities.size()));
        result.put("opportunities", currentOpportunities);
        return result;
    }

    private OpportunityDTO mapEmailToOpportunity(Email email) {
        String company = email.getDetectedCompany() != null && !email.getDetectedCompany().isBlank()
                ? email.getDetectedCompany()
                : extractCompanyFromSender(email);

        String role = email.getDetectedRole() != null && !email.getDetectedRole().isBlank()
                ? email.getDetectedRole()
                : extractRoleFromSubject(email.getSubject());

        String recruiterName = email.getDetectedRecruiterName() != null && !email.getDetectedRecruiterName().isBlank()
                ? email.getDetectedRecruiterName()
                : email.getSender();

        String recruiterEmail = email.getDetectedRecruiterEmail() != null && !email.getDetectedRecruiterEmail().isBlank()
                ? email.getDetectedRecruiterEmail()
                : email.getSenderEmail();

        String snippet = email.getPreview() != null && !email.getPreview().isBlank()
                ? email.getPreview()
                : (email.getBody() != null && email.getBody().length() > 140 ? email.getBody().substring(0, 140) + "..." : email.getBody());

        List<String> tags = new ArrayList<>();
        if (email.getDetectedRecruiterType() == RecruiterType.HUMAN_RECRUITER) {
            tags.add("Direct Recruiter Reachout");
        } else {
            tags.add("Curated Lead");
        }
        tags.add("Full-time");
        tags.add("Remote / Hybrid");

        String salary = extractSalary(email.getBody());
        String oppType = email.getDetectedRecruiterType() == RecruiterType.HUMAN_RECRUITER ? "Recruiter Reachout" : "Job Match Lead";

        return new OpportunityDTO(
                email.getId(),
                company,
                role,
                recruiterName,
                recruiterEmail,
                email.getSubject(),
                snippet,
                email.getBody(),
                email.getTimestamp(),
                "Remote / Hybrid",
                salary != null ? salary : "Competitive",
                oppType,
                email.getJobApplication() != null,
                email.getJobApplication() != null ? email.getJobApplication().getId() : null,
                tags,
                false
        );
    }

    private boolean containsAnyKeyword(String text) {
        if (text == null) return false;
        for (String kw : OPPORTUNITY_KEYWORDS) {
            if (text.contains(kw)) return true;
        }
        return false;
    }

    private String extractCompanyFromSender(Email email) {
        if (email.getSender() != null && !email.getSender().equalsIgnoreCase("Recruiter") && !email.getSender().contains("@")) {
            return email.getSender().replaceAll("(?i)(Careers|Recruiting|Team|Talent|Jobs)", "").trim();
        }
        if (email.getSenderEmail() != null && email.getSenderEmail().contains("@")) {
            String domain = email.getSenderEmail().substring(email.getSenderEmail().indexOf("@") + 1);
            String name = domain.split("\\.")[0];
            return Character.toUpperCase(name.charAt(0)) + name.substring(1);
        }
        return "Discovered Lead";
    }

    private String extractRoleFromSubject(String subject) {
        if (subject == null || subject.isBlank()) return "Software Engineer";
        Pattern pattern = Pattern.compile("(?i)(?:for|as a|position:|role:)\\s+([A-Za-z0-9\\s/\\-]+?)(?:at|with|in|\\||-|$)", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(subject);
        if (matcher.find()) {
            String extracted = matcher.group(1).trim();
            if (extracted.length() > 3 && extracted.length() < 50) {
                return extracted;
            }
        }
        return "Software Engineer";
    }

    private String extractSalary(String body) {
        if (body == null) return null;
        Pattern pattern = Pattern.compile("(?i)(\\$[0-9]{2,3}(?:,[0-9]{3})*(?:\\s*-\\s*\\$[0-9]{2,3}(?:,[0-9]{3})*)?(?:\\s*(?:k|k/yr|/year|per year))?)");
        Matcher matcher = pattern.matcher(body);
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        return null;
    }
}
