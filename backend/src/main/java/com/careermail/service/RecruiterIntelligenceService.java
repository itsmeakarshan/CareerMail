package com.careermail.service;

import com.careermail.model.enums.RecruiterType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class RecruiterIntelligenceService {

    private static final Logger log = LoggerFactory.getLogger(RecruiterIntelligenceService.class);

    @Value("${GEMINI_API_KEY:${AI_API_KEY:}}")
    private String geminiApiKey;

    private final RestTemplate restTemplate;

    public RecruiterIntelligenceService() {
        this.restTemplate = new RestTemplate();
    }

    public static class RecruiterInfo {
        private String name;
        private String email;
        private String title;
        private String phone;
        private String linkedin;
        private RecruiterType type;
        private Integer confidence;
        private String source;

        public RecruiterInfo(String name, String email, String title, String phone, String linkedin,
                             RecruiterType type, Integer confidence, String source) {
            this.name = name;
            this.email = email;
            this.title = title;
            this.phone = phone;
            this.linkedin = linkedin;
            this.type = type != null ? type : RecruiterType.NO_RECRUITER_IDENTIFIED;
            this.confidence = confidence != null ? confidence : 0;
            this.source = source;
        }

        public String getName() { return name; }
        public String getEmail() { return email; }
        public String getTitle() { return title; }
        public String getPhone() { return phone; }
        public String getLinkedin() { return linkedin; }
        public RecruiterType getType() { return type; }
        public Integer getConfidence() { return confidence; }
        public String getSource() { return source; }
    }

    /**
     * Extracts recruiter and contact intelligence from email attributes.
     * Uses rule-based extraction first, with optional AI fallback if key is configured and confidence is low.
     */
    public RecruiterInfo extractIntelligence(String subject, String body, String sender, String senderEmail, String company) {
        RecruiterInfo ruleResult = extractRuleBased(subject, body, sender, senderEmail, company);

        // If rule-based result has high confidence or AI key is not configured, return immediately
        if (ruleResult.getConfidence() >= 80 || geminiApiKey == null || geminiApiKey.isBlank()) {
            return ruleResult;
        }

        // Optional AI fallback for ambiguous / low-confidence emails
        try {
            RecruiterInfo aiResult = callGeminiFallback(subject, body, sender, senderEmail, company);
            if (aiResult != null && aiResult.getConfidence() > ruleResult.getConfidence()) {
                return aiResult;
            }
        } catch (Exception ex) {
            log.debug("Optional AI recruiter extraction skipped: {}", ex.getMessage());
        }

        return ruleResult;
    }

    /**
     * Comprehensive rule-based extraction (zero API keys / zero external calls).
     */
    public RecruiterInfo extractRuleBased(String subject, String body, String sender, String senderEmail, String company) {
        String safeSender = sender != null ? sender.trim() : "";
        String safeEmail = senderEmail != null ? senderEmail.trim() : "";
        String safeBody = body != null ? body : "";
        String cleanBody = safeBody.replaceAll("<[^>]+>", "\n");
        cleanBody = cleanBody.replaceAll("&nbsp;", " ");
        cleanBody = cleanBody.replaceAll("\\r", "");
        cleanBody = cleanBody.replaceAll("[ \\t]+", " ");

        String lowerEmail = safeEmail.toLowerCase();

        // 1. Detect Automated Senders
        List<String> autoPrefixes = Arrays.asList(
                "noreply", "no-reply", "donotreply", "do-not-reply", "notifications", "mailer",
                "careers", "jobs", "earlycareers", "application-no-reply", "recruitment-no-reply",
                "alerts", "updates", "info", "support", "admin", "system", "auto", "apply"
        );
        List<String> autoDomains = Arrays.asList(
                "myworkday.com", "greenhouse.io", "lever.co", "ashbyhq.com", "bamboohr.com",
                "indeed.com", "linkedin.com", "apply4u.co.uk", "totaljobs.com", "jobsite.co.uk",
                "glassdoor.com", "smartrecruiters.com", "icims.com", "taleo.net", "jobvite.com", "workable.com"
        );

        boolean isAutoEmail = false;
        for (String p : autoPrefixes) {
            if (lowerEmail.startsWith(p + "@") || lowerEmail.contains("." + p + "@") || lowerEmail.startsWith(p + "+") || lowerEmail.contains("-" + p + "@")) {
                isAutoEmail = true;
                break;
            }
        }
        if (!isAutoEmail) {
            for (String d : autoDomains) {
                if (lowerEmail.contains(d)) {
                    isAutoEmail = true;
                    break;
                }
            }
        }

        // 2. Parse direct sender name (Handling compound names like "Evie Crowson - Huel" or "Sarah Jenkins | Talent")
        String humanSenderName = null;
        String rawSender = safeSender;
        if (rawSender.contains(" - ")) {
            rawSender = rawSender.substring(0, rawSender.indexOf(" - ")).trim();
        } else if (rawSender.contains(" | ")) {
            rawSender = rawSender.substring(0, rawSender.indexOf(" | ")).trim();
        } else if (rawSender.contains(" (")) {
            rawSender = rawSender.substring(0, rawSender.indexOf(" (")).trim();
        }

        // Check if rawSender is a person name (2-3 title-cased words not matching corporate keywords)
        String[] nameParts = rawSender.split("\\s+");
        List<String> excludedCorporateWords = Arrays.asList(
                "team", "careers", "recruitment", "internal", "notification", "notifications",
                "early", "talent", "support", "apply4u", "linkedin", "indeed", "glassdoor",
                "google", "amazon", "microsoft", "revolut", "workday", "greenhouse", "ashby",
                "firm", "ltd", "limited", "group", "consulting", "resourcing", "hiring", "system",
                "update", "updates", "alert", "alerts", "bot", "auto"
        );

        boolean isLikelyPersonSender = false;
        if (nameParts.length >= 2 && nameParts.length <= 4) {
            boolean hasCorporateWord = false;
            for (String part : nameParts) {
                if (excludedCorporateWords.contains(part.toLowerCase())) {
                    hasCorporateWord = true;
                    break;
                }
            }
            if (!hasCorporateWord && Pattern.compile("^[A-Z][a-zA-Z'.-]+(?:\\s+[A-Z][a-zA-Z'.-]+)+$").matcher(rawSender).matches()) {
                isLikelyPersonSender = true;
                humanSenderName = rawSender;
            }
        }

        // 3. Scan Body & Signature for Contact Information
        String sigName = null;
        String sigTitle = null;
        String sigPhone = null;
        String sigLinkedin = null;
        String sigDirectEmail = null;

        // Extract Phone Number
        Pattern phonePattern = Pattern.compile("(?:\\+?44\\s?7\\d{3}|\\+?44\\s?\\d{4}|\\+?1\\s?\\d{3}|\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3,5}\\)?[-.\\s]?\\d{3,5}[-.\\s]?\\d{3,5}");
        Matcher phoneMatcher = phonePattern.matcher(cleanBody);
        if (phoneMatcher.find()) {
            String phoneStr = phoneMatcher.group().trim();
            if (phoneStr.length() >= 10 && !phoneStr.contains("2024") && !phoneStr.contains("2025") && !phoneStr.contains("2026") && !phoneStr.contains("2027")) {
                sigPhone = phoneStr;
            }
        }

        // Extract LinkedIn Profile URL
        Pattern liPattern = Pattern.compile("https?://(?:www\\.)?linkedin\\.com/in/([a-zA-Z0-9_\\-]+)");
        Matcher liMatcher = liPattern.matcher(cleanBody);
        if (liMatcher.find()) {
            sigLinkedin = liMatcher.group();
        }

        // Extract Sign-Off Block
        Pattern signOffPattern = Pattern.compile(
                "(?m)^(?:Best regards|Kind regards|Warm regards|Warmest regards|Regards|Best|Thanks & regards|With thanks|Thanks,|Sincerely|Yours sincerely|Cheers,|Best wishes|Thank you,)\\s*\\n+([A-Z][a-zA-Z'.-]+(?:\\s+[A-Z][a-zA-Z'.-]+){1,2})",
                Pattern.CASE_INSENSITIVE
        );
        Matcher signOffMatcher = signOffPattern.matcher(cleanBody);
        if (signOffMatcher.find()) {
            String candName = signOffMatcher.group(1).trim();
            boolean isCorporate = false;
            for (String w : excludedCorporateWords) {
                if (candName.toLowerCase().contains(w)) {
                    isCorporate = true;
                    break;
                }
            }
            if (!isCorporate && candName.length() >= 4 && !candName.equalsIgnoreCase("This email")) {
                sigName = candName;
            }
        }

        // Extract Role / Title near signature or body
        Pattern titlePattern = Pattern.compile(
                "(?i)\\b((?:Senior |Lead |Principal |Head of |Technical |Executive )?(?:Recruiter|Talent Acquisition(?: Partner| Specialist| Lead| Manager| Coordinator)?|Talent Partner|People Partner|Talent Lead|Hiring Manager|Recruitment Consultant|People Operations|HR Manager|HR Specialist|Talent Specialist|Engineering Manager|HR Advisor))\\b"
        );
        Matcher titleMatcher = titlePattern.matcher(cleanBody);
        if (titleMatcher.find()) {
            sigTitle = titleMatcher.group(1).trim();
        }

        // Extract Direct Corporate Contact Email in signature (excluding applicant's email)
        Pattern emailPattern = Pattern.compile("\\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,})\\b");
        Matcher emailMatcher = emailPattern.matcher(cleanBody);
        while (emailMatcher.find()) {
            String candEmail = emailMatcher.group(1).trim();
            String lowerCandEmail = candEmail.toLowerCase();
            boolean isAuto = false;
            for (String p : autoPrefixes) {
                if (lowerCandEmail.startsWith(p + "@")) { isAuto = true; break; }
            }
            if (!isAuto && !lowerCandEmail.contains("gmail.com") && !lowerCandEmail.contains("akarshan") && !lowerCandEmail.contains("myworkday")) {
                sigDirectEmail = candEmail;
                break;
            }
        }

        // 4. Synthesize Intelligence Classification

        // Case A: Direct Human Recruiter (Personal corporate address + Human sender name)
        if (isLikelyPersonSender && !isAutoEmail) {
            return new RecruiterInfo(
                    humanSenderName,
                    safeEmail,
                    sigTitle != null ? sigTitle : "Recruiter / Talent Partner",
                    sigPhone,
                    sigLinkedin,
                    RecruiterType.HUMAN_RECRUITER,
                    95,
                    "Direct Recruiter Outreach"
            );
        }

        // Case B: Human contact sent via ATS Notification (e.g. BambooHR on behalf of "Noam Shemesh" or "Evie Crowson")
        if (isLikelyPersonSender && isAutoEmail) {
            return new RecruiterInfo(
                    humanSenderName,
                    sigDirectEmail != null ? sigDirectEmail : safeEmail,
                    sigTitle != null ? sigTitle : "Recruiter / Hiring Contact",
                    sigPhone,
                    sigLinkedin,
                    RecruiterType.POSSIBLE_RECRUITER,
                    85,
                    "ATS Delivery on behalf of Recruiter"
            );
        }

        // Case C: Real human identified in email signature
        if (sigName != null) {
            return new RecruiterInfo(
                    sigName,
                    sigDirectEmail != null ? sigDirectEmail : (!isAutoEmail ? safeEmail : null),
                    sigTitle != null ? sigTitle : "Talent Partner / Recruiter",
                    sigPhone,
                    sigLinkedin,
                    isAutoEmail ? RecruiterType.POSSIBLE_RECRUITER : RecruiterType.HUMAN_RECRUITER,
                    isAutoEmail ? 80 : 90,
                    "Email Signature Analysis"
            );
        }

        // Case D: Automated ATS / Talent Team delivery
        if (isAutoEmail) {
            Pattern teamPattern = Pattern.compile("(?i)\\b([A-Za-z0-9& ]+(?:Talent Acquisition|Recruitment|Hiring|Careers|Talent) Team)\\b");
            Matcher teamMatcher = teamPattern.matcher(cleanBody);
            String teamName = teamMatcher.find() ? teamMatcher.group(1).trim() :
                    (!safeSender.isBlank() && !safeSender.equalsIgnoreCase("noreply") && !safeSender.equalsIgnoreCase("no-reply") ? safeSender : (company != null ? company + " Talent Team" : "Automated Talent System"));

            return new RecruiterInfo(
                    teamName,
                    safeEmail,
                    "Automated ATS / System Sender",
                    null,
                    null,
                    RecruiterType.AUTOMATED_SYSTEM,
                    95,
                    "Automated ATS Delivery"
            );
        }

        // Case E: Fallback when sender is a company/team name but not strictly automated
        String fallbackName = !safeSender.isBlank() ? safeSender : (company != null ? company : "Unknown Sender");
        return new RecruiterInfo(
                fallbackName,
                safeEmail,
                "Job Application Contact",
                sigPhone,
                sigLinkedin,
                RecruiterType.NO_RECRUITER_IDENTIFIED,
                20,
                "No Signature Contact Identified"
        );
    }

    /**
     * Optional Gemini AI fallback for ambiguous emails when API key is provided.
     */
    @SuppressWarnings({"rawtypes", "unchecked"})
    private RecruiterInfo callGeminiFallback(String subject, String body, String sender, String senderEmail, String company) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return null;
        }

        try {
            String prompt = String.format(
                    "You are a recruiter intelligence parser. Analyze this job email and extract structured recruiter/contact information.\n" +
                    "Email Subject: %s\nSender: %s <%s>\nCompany: %s\nBody: %s\n\n" +
                    "Return ONLY valid JSON with keys: name (string or null), email (string or null), title (string or null), phone (string or null), linkedin (string or null), type (one of: HUMAN_RECRUITER, POSSIBLE_RECRUITER, AUTOMATED_SYSTEM, NO_RECRUITER_IDENTIFIED), confidence (integer 0-100), source (string).",
                    subject, sender, senderEmail, company, body.length() > 2000 ? body.substring(0, 2000) : body
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, Object> requestBody = Map.of(
                    "contents", List.of(
                            Map.of("parts", List.of(Map.of("text", prompt)))
                    )
            );

            String url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + geminiApiKey;
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                // Parse AI structured response
                Map bodyMap = response.getBody();
                List candidates = (List) bodyMap.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map first = (Map) candidates.get(0);
                    Map content = (Map) first.get("content");
                    List parts = (List) content.get("parts");
                    if (parts != null && !parts.isEmpty()) {
                        String text = (String) ((Map) parts.get(0)).get("text");
                        // Clean markdown ```json wrapper if present
                        text = text.replaceAll("```json", "").replaceAll("```", "").trim();
                        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                        Map<String, Object> parsed = mapper.readValue(text, Map.class);

                        String name = (String) parsed.get("name");
                        String email = (String) parsed.get("email");
                        String title = (String) parsed.get("title");
                        String phone = (String) parsed.get("phone");
                        String linkedin = (String) parsed.get("linkedin");
                        String typeStr = (String) parsed.get("type");
                        Number confNum = (Number) parsed.get("confidence");
                        String source = (String) parsed.get("source");

                        RecruiterType type = RecruiterType.NO_RECRUITER_IDENTIFIED;
                        if (typeStr != null) {
                            try { type = RecruiterType.valueOf(typeStr); } catch (Exception ignored) {}
                        }

                        return new RecruiterInfo(
                                name, email, title, phone, linkedin, type,
                                confNum != null ? confNum.intValue() : 75,
                                source != null ? source : "AI Assisted Extraction"
                        );
                    }
                }
            }
        } catch (Exception e) {
            log.debug("Gemini AI recruiter extraction failed, falling back to rule-based: {}", e.getMessage());
        }

        return null;
    }
}
