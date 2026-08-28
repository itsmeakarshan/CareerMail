package com.careermail.service;

import com.careermail.dto.GmailSyncResponse;
import com.careermail.model.entity.ConnectedAccount;
import com.careermail.model.entity.Email;
import com.careermail.model.entity.User;
import com.careermail.model.enums.EmailFolder;
import com.careermail.repository.ConnectedAccountRepository;
import com.careermail.repository.EmailRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class GmailService {

    private static final Logger log = LoggerFactory.getLogger(GmailService.class);

    private static final String GMAIL_MESSAGES_ENDPOINT = "https://gmail.googleapis.com/gmail/v1/users/me/messages";

    private final ConnectedAccountRepository connectedAccountRepository;
    private final EmailRepository emailRepository;
    private final GoogleOAuthService googleOAuthService;
    private final EmailAnalysisService emailAnalysisService;
    private final RestTemplate restTemplate;

    public GmailService(ConnectedAccountRepository connectedAccountRepository,
                        EmailRepository emailRepository,
                        GoogleOAuthService googleOAuthService,
                        EmailAnalysisService emailAnalysisService) {
        this.connectedAccountRepository = connectedAccountRepository;
        this.emailRepository = emailRepository;
        this.googleOAuthService = googleOAuthService;
        this.emailAnalysisService = emailAnalysisService;
        this.restTemplate = new RestTemplate();
    }

    public Optional<ConnectedAccount> getConnectedAccount(User user) {
        return connectedAccountRepository.findByUserAndProvider(user, "google");
    }

    @Transactional
    public void disconnectAccount(User user) {
        connectedAccountRepository.findByUserAndProvider(user, "google")
                .ifPresent(connectedAccountRepository::delete);
    }

    @Transactional
    public GmailSyncResponse scanAndProcess(User user, int maxResults) {
        Optional<ConnectedAccount> accountOpt = connectedAccountRepository.findByUserAndProvider(user, "google");

        if (accountOpt.isEmpty() || accountOpt.get().getAccessToken() == null) {
            log.warn("Gmail sync requested for user {} but no connected Google account was found.", user.getEmail());
            return new GmailSyncResponse(
                    false,
                    0, 0, 0, 0, 0, 0, 0,
                    "No Google account connected. Please connect your Gmail account in Settings or Login.",
                    LocalDateTime.now()
            );
        }

        ConnectedAccount account = accountOpt.get();
        String accessToken = googleOAuthService.getValidAccessToken(account);

        if (accessToken == null || accessToken.isBlank()) {
            log.warn("Unable to obtain a valid access token for user {}.", user.getEmail());
            return new GmailSyncResponse(
                    false,
                    0, 0, 0, 0, 0, 0, 0,
                    "Google authentication expired or token unavailable. Please reconnect Gmail in Settings.",
                    LocalDateTime.now()
            );
        }

        log.info("========== Gmail Sync Started ==========");
        log.info("Target user: {} (Google: {})", user.getEmail(), account.getProviderEmail());

        int scannedCount = 0;
        int jobEmailsFound = 0;
        int appsCreated = 0;
        int appsUpdated = 0;
        int interviewsFound = 0;
        int followUpsFound = 0;
        int duplicatesSkipped = 0;
        int targetLimit = Math.max(maxResults, 250);

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ParameterizedTypeReference<Map<String, Object>> mapType = new ParameterizedTypeReference<>() {};

            // Tier 1: Search last 3-4 months (newer_than:120d)
            // Evaluated dynamically on Google servers, unaffected by local system clock
            List<String> queryTiers = Arrays.asList(
                    "newer_than:120d", // All messages in last ~4 months
                    ""                 // Fallback: Latest messages regardless of date if mailbox has older emails
            );

            List<Map<String, Object>> allMessageSummaries = new ArrayList<>();
            Set<String> seenMessageIds = new HashSet<>();

            for (String query : queryTiers) {
                if (!allMessageSummaries.isEmpty()) {
                    break; // Already found messages in earlier tier
                }

                String pageToken = null;
                int pageNum = 1;
                log.info("Attempting Gmail API query tier: '{}'", query.isEmpty() ? "(all recent messages)" : query);

                do {
                    int pageSize = Math.min(targetLimit - allMessageSummaries.size(), 100);
                    if (pageSize <= 0) break;

                    String url = GMAIL_MESSAGES_ENDPOINT + "?maxResults=" + pageSize;
                    if (!query.isBlank()) {
                        url += "&q=" + URLEncoder.encode(query, StandardCharsets.UTF_8);
                    }
                    if (pageToken != null && !pageToken.isBlank()) {
                        url += "&pageToken=" + URLEncoder.encode(pageToken, StandardCharsets.UTF_8);
                    }

                    log.debug("Calling Gmail endpoint: {}", url);
                    ResponseEntity<Map<String, Object>> listResp = restTemplate.exchange(url, HttpMethod.GET, request, mapType);
                    if (!listResp.getStatusCode().is2xxSuccessful() || listResp.getBody() == null) {
                        log.warn("Gmail API list returned status: {}", listResp.getStatusCode());
                        break;
                    }

                    Map<String, Object> body = listResp.getBody();
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> messages = (List<Map<String, Object>>) body.get("messages");
                    pageToken = (String) body.get("nextPageToken");

                    int foundOnPage = messages != null ? messages.size() : 0;
                    log.info("Page {} returned {} message headers. Next page available: {}", pageNum, foundOnPage, pageToken != null);

                    if (messages != null) {
                        for (Map<String, Object> m : messages) {
                            String msgId = (String) m.get("id");
                            if (msgId != null && seenMessageIds.add(msgId)) {
                                allMessageSummaries.add(m);
                            }
                        }
                    }

                    pageNum++;
                } while (pageToken != null && allMessageSummaries.size() < targetLimit);

                log.info("Query '{}' retrieved {} total message summaries.", query.isEmpty() ? "(all recent)" : query, allMessageSummaries.size());
            }

            log.info("Total message headers to process: {}", allMessageSummaries.size());

            // Process each retrieved Gmail message
            int totalToProcess = allMessageSummaries.size();
            for (int i = 0; i < totalToProcess; i++) {
                Map<String, Object> msgSummary = allMessageSummaries.get(i);
                String msgId = (String) msgSummary.get("id");
                String threadId = (String) msgSummary.get("threadId");

                // Deduplicate: check if this message ID is already saved in database
                if (emailRepository.existsByUserAndGmailMessageId(user, msgId)) {
                    duplicatesSkipped++;
                    continue;
                }

                // Fetch complete message details
                String detailUrl = GMAIL_MESSAGES_ENDPOINT + "/" + msgId + "?format=full";
                try {
                    ResponseEntity<Map<String, Object>> detailResp = restTemplate.exchange(detailUrl, HttpMethod.GET, request, mapType);
                    if (detailResp.getStatusCode().is2xxSuccessful() && detailResp.getBody() != null) {
                        Map<String, Object> msgData = detailResp.getBody();
                        Email email = parseGmailMessage(msgData, user, msgId, threadId);

                        EmailAnalysisService.ProcessOutcome outcome = emailAnalysisService.processEmail(email, user);
                        emailRepository.save(email);

                        scannedCount++;
                        if (outcome.isJobRelated) {
                            jobEmailsFound++;
                            if (outcome.applicationCreated) appsCreated++;
                            if (outcome.applicationUpdated) appsUpdated++;
                            if (outcome.interviewCreated) interviewsFound++;
                            if (outcome.followUpCreated) followUpsFound++;
                            log.info("Processed [{}/{}]: '{}' from {} -> Job-Related [Created: {}, Updated: {}]",
                                    i + 1, totalToProcess, email.getSubject(), email.getSender(), outcome.applicationCreated, outcome.applicationUpdated);
                        }
                    }
                } catch (Exception e) {
                    log.error("Failed to parse Gmail message ID {}: {}", msgId, e.getMessage());
                }
            }

            account.setLastSyncedAt(LocalDateTime.now());
            account.setTotalEmailsScanned(account.getTotalEmailsScanned() + scannedCount);
            connectedAccountRepository.save(account);

            log.info("========== Gmail Sync Summary ==========");
            log.info("Total messages scanned: {}", scannedCount);
            log.info("Job-related emails identified: {}", jobEmailsFound);
            log.info("Applications created: {}", appsCreated);
            log.info("Applications updated: {}", appsUpdated);
            log.info("Interviews recorded: {}", interviewsFound);
            log.info("Follow-ups scheduled: {}", followUpsFound);
            log.info("Duplicates skipped: {}", duplicatesSkipped);
            log.info("=========================================");

            String summaryMessage = String.format("Scanned %d emails from your Gmail. Found %d job-related updates (%d created, %d updated).",
                    scannedCount, jobEmailsFound, appsCreated, appsUpdated);

            return new GmailSyncResponse(
                    true,
                    scannedCount,
                    jobEmailsFound,
                    appsCreated,
                    appsUpdated,
                    duplicatesSkipped,
                    interviewsFound,
                    followUpsFound,
                    summaryMessage,
                    LocalDateTime.now()
            );

        } catch (Exception e) {
            log.error("Error executing Gmail sync for user {}: {}", user.getEmail(), e.getMessage(), e);
            return new GmailSyncResponse(
                    false,
                    scannedCount,
                    jobEmailsFound,
                    appsCreated,
                    appsUpdated,
                    duplicatesSkipped,
                    interviewsFound,
                    followUpsFound,
                    "Gmail sync encountered an error: " + e.getMessage(),
                    LocalDateTime.now()
            );
        }
    }

    public Email parseGmailMessage(Map<String, Object> msgData, User user, String msgId, String threadId) {
        Email email = new Email();
        email.setUser(user);
        email.setGmailMessageId(msgId);
        email.setGmailThreadId(threadId);
        email.setFolder(EmailFolder.INBOX);

        @SuppressWarnings("unchecked")
        Map<String, Object> payload = (Map<String, Object>) msgData.get("payload");
        String subject = "No Subject";
        String from = "Unknown Sender";
        String to = user.getEmail();
        String dateStr = null;

        if (payload != null) {
            @SuppressWarnings("unchecked")
            List<Map<String, String>> headers = (List<Map<String, String>>) payload.get("headers");
            if (headers != null) {
                for (Map<String, String> h : headers) {
                    String name = h.get("name");
                    String val = h.get("value");
                    if ("Subject".equalsIgnoreCase(name) && val != null) {
                        subject = val;
                    } else if ("From".equalsIgnoreCase(name) && val != null) {
                        from = val;
                    } else if ("To".equalsIgnoreCase(name) && val != null) {
                        to = val;
                    } else if ("Date".equalsIgnoreCase(name) && val != null) {
                        dateStr = val;
                    }
                }
            }
        }

        // Parse Sender Name & Email
        String senderName = from;
        String senderEmail = from;
        if (from.contains("<") && from.contains(">")) {
            senderName = from.substring(0, from.indexOf("<")).trim().replace("\"", "");
            senderEmail = from.substring(from.indexOf("<") + 1, from.indexOf(">")).trim();
        }

        email.setSender(senderName.isEmpty() ? senderEmail : senderName);
        email.setSenderEmail(senderEmail);
        email.setRecipientEmail(to);
        email.setSubject(subject);

        // Body extraction supporting deeply nested MIME trees
        String body = extractBodyFromPayload(payload);
        if (body == null || body.isBlank()) {
            body = (String) msgData.get("snippet");
        }
        if (body == null) body = "";

        email.setBody(body);
        email.setPreview(body.length() > 120 ? body.substring(0, 120) + "..." : body);

        // Timestamp parsing
        LocalDateTime timestamp = parseTimestamp(dateStr, msgData.get("internalDate"));
        email.setTimestamp(timestamp);

        return email;
    }

    private String extractBodyFromPayload(Map<String, Object> payload) {
        if (payload == null) return "";

        StringBuilder plainSb = new StringBuilder();
        StringBuilder htmlSb = new StringBuilder();

        extractTextRecursively(payload, plainSb, htmlSb);

        if (plainSb.length() > 0) {
            return plainSb.toString().trim();
        }
        if (htmlSb.length() > 0) {
            return htmlSb.toString().replaceAll("<[^>]+>", " ").replaceAll("\\s+", " ").trim();
        }
        return "";
    }

    private void extractTextRecursively(Map<String, Object> part, StringBuilder plainSb, StringBuilder htmlSb) {
        if (part == null) return;

        String mimeType = (String) part.get("mimeType");

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) part.get("body");
        if (body != null && body.get("data") != null) {
            String decoded = decodeBase64Url((String) body.get("data"));
            if ("text/plain".equalsIgnoreCase(mimeType)) {
                if (plainSb.length() > 0) plainSb.append("\n\n");
                plainSb.append(decoded);
            } else if ("text/html".equalsIgnoreCase(mimeType)) {
                if (htmlSb.length() > 0) htmlSb.append("\n\n");
                htmlSb.append(decoded);
            }
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> subParts = (List<Map<String, Object>>) part.get("parts");
        if (subParts != null) {
            for (Map<String, Object> subPart : subParts) {
                extractTextRecursively(subPart, plainSb, htmlSb);
            }
        }
    }

    private String decodeBase64Url(String base64Url) {
        if (base64Url == null || base64Url.isBlank()) return "";
        try {
            byte[] decoded = Base64.getUrlDecoder().decode(base64Url);
            return new String(decoded, StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "";
        }
    }

    private LocalDateTime parseTimestamp(String dateStr, Object internalDateObj) {
        if (internalDateObj != null) {
            try {
                long millis = Long.parseLong(internalDateObj.toString());
                return LocalDateTime.ofInstant(Instant.ofEpochMilli(millis), ZoneId.systemDefault());
            } catch (Exception ignored) {}
        }

        if (dateStr != null) {
            try {
                return LocalDateTime.parse(dateStr, DateTimeFormatter.RFC_1123_DATE_TIME);
            } catch (Exception ignored) {}
        }

        return LocalDateTime.now();
    }
}
