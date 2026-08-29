package com.careermail.service;

import com.careermail.dto.EmailComposeRequest;
import com.careermail.dto.GmailSyncResponse;
import com.careermail.model.entity.ConnectedAccount;
import com.careermail.model.entity.Email;
import com.careermail.model.entity.User;
import com.careermail.model.enums.EmailFolder;
import com.careermail.repository.ConnectedAccountRepository;
import com.careermail.repository.EmailRepository;
import jakarta.mail.Message;
import jakarta.mail.Session;
import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;

import java.io.ByteArrayOutputStream;
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
    private final com.careermail.repository.JobApplicationRepository jobApplicationRepository;
    private final com.careermail.repository.InterviewRepository interviewRepository;
    private final com.careermail.repository.FollowUpRepository followUpRepository;
    private final GoogleOAuthService googleOAuthService;
    private final EmailAnalysisService emailAnalysisService;
    private final RestTemplate restTemplate;

    public GmailService(ConnectedAccountRepository connectedAccountRepository,
                        EmailRepository emailRepository,
                        com.careermail.repository.JobApplicationRepository jobApplicationRepository,
                        com.careermail.repository.InterviewRepository interviewRepository,
                        com.careermail.repository.FollowUpRepository followUpRepository,
                        GoogleOAuthService googleOAuthService,
                        EmailAnalysisService emailAnalysisService) {
        this.connectedAccountRepository = connectedAccountRepository;
        this.emailRepository = emailRepository;
        this.jobApplicationRepository = jobApplicationRepository;
        this.interviewRepository = interviewRepository;
        this.followUpRepository = followUpRepository;
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

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(accessToken);
            HttpEntity<Void> request = new HttpEntity<>(headers);

            ParameterizedTypeReference<Map<String, Object>> mapType = new ParameterizedTypeReference<>() {};

            // 1. Verify User Profile & OAuth Token Validity via /users/me/profile
            String profileUrl = "https://gmail.googleapis.com/gmail/v1/users/me/profile";
            try {
                ResponseEntity<Map<String, Object>> profileResp = restTemplate.exchange(profileUrl, HttpMethod.GET, request, mapType);
                if (profileResp.getStatusCode().is2xxSuccessful() && profileResp.getBody() != null) {
                    Map<String, Object> profile = profileResp.getBody();
                    log.info("[Gmail Profile Verification] Token authenticated for Gmail address: '{}' | Total Messages in Account: {} | Total Threads: {} | History ID: {}",
                            profile.get("emailAddress"), profile.get("messagesTotal"), profile.get("threadsTotal"), profile.get("historyId"));
                }
            } catch (org.springframework.web.client.HttpClientErrorException.Unauthorized ue) {
                log.warn("Access token expired or unauthorized. Forcing token refresh with Google OAuth endpoint...");
                accessToken = googleOAuthService.forceRefreshToken(account);
                headers.setBearerAuth(accessToken);
                request = new HttpEntity<>(headers);

                ResponseEntity<Map<String, Object>> profileResp = restTemplate.exchange(profileUrl, HttpMethod.GET, request, mapType);
                if (profileResp.getStatusCode().is2xxSuccessful() && profileResp.getBody() != null) {
                    Map<String, Object> profile = profileResp.getBody();
                    log.info("[Gmail Profile Verification (After Refresh)] Token authenticated for Gmail address: '{}' | Total Messages: {}",
                            profile.get("emailAddress"), profile.get("messagesTotal"));
                }
            }

            // 2. Query Gmail Messages with targeted 3-month queries to fetch all applications before & after Aug 21
            int maxTotalLimit = Math.max(maxResults, 600);
            List<Map<String, Object>> allMessageSummaries = new ArrayList<>();
            Set<String> seenMessageIds = new HashSet<>();

            List<String> queries = Arrays.asList(
                    "newer_than:100d (\"received your application\" OR \"we received your application\" OR \"we've received your application\" OR \"we have received your application\" OR \"application received\" OR \"application has been received\" OR \"thank you for applying\" OR \"thanks for applying\" OR \"your application was sent to\" OR \"application is confirmed\" OR \"application submitted\" OR \"applied to\" OR \"applied for\" OR \"acknowledgement of your application\")",
                    "newer_than:100d (\"unfortunately\" OR \"wish you luck\" OR \"other candidates\" OR \"interview\" OR \"assessment\" OR \"coding challenge\" OR \"screening call\" OR \"job application\" OR \"candidacy\" OR \"application status\" OR \"regret to inform\")",
                    "newer_than:100d (from:careers OR from:recruiting OR from:jobs OR from:talent OR from:greenhouse OR from:lever OR from:workday OR from:smartrecruiters OR from:linkedin OR from:indeed OR from:ashby)",
                    "newer_than:45d"
            );

            log.info("========== Gmail Messages Targeted 3-Month Search ==========");
            log.info("[Gmail Request Info] Running {} targeted search queries across last 3 months (100 days)...", queries.size());

            for (String query : queries) {
                String pageToken = null;
                int queryPage = 1;

                do {
                    int pageSize = Math.min(maxTotalLimit - allMessageSummaries.size(), 100);
                    if (pageSize <= 0) break;

                    org.springframework.web.util.UriComponentsBuilder uriBuilder =
                            org.springframework.web.util.UriComponentsBuilder.fromHttpUrl(GMAIL_MESSAGES_ENDPOINT)
                                    .queryParam("maxResults", pageSize)
                                    .queryParam("q", query);

                    if (pageToken != null && !pageToken.isBlank()) {
                        uriBuilder.queryParam("pageToken", pageToken);
                    }

                    java.net.URI uri = uriBuilder.build().toUri();
                    try {
                        ResponseEntity<Map<String, Object>> listResp = restTemplate.exchange(uri, HttpMethod.GET, request, mapType);

                        if (!listResp.getStatusCode().is2xxSuccessful() || listResp.getBody() == null) {
                            break;
                        }

                        Map<String, Object> body = listResp.getBody();
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> messages = (List<Map<String, Object>>) body.get("messages");
                        pageToken = (String) body.get("nextPageToken");

                        if (messages != null) {
                            for (Map<String, Object> m : messages) {
                                String msgId = (String) m.get("id");
                                if (msgId != null && seenMessageIds.add(msgId)) {
                                    allMessageSummaries.add(m);
                                }
                            }
                        }
                    } catch (Exception ex) {
                        log.warn("Error querying Gmail with query '{}': {}", query, ex.getMessage());
                        break;
                    }

                    queryPage++;
                } while (pageToken != null && queryPage <= 5 && allMessageSummaries.size() < maxTotalLimit);
            }

            log.info("Total unique Gmail message headers retrieved across 3-month queries: {}", allMessageSummaries.size());

            // Process each retrieved Gmail message
            int totalToProcess = allMessageSummaries.size();
            for (int i = 0; i < totalToProcess; i++) {
                Map<String, Object> msgSummary = allMessageSummaries.get(i);
                String msgId = (String) msgSummary.get("id");
                String threadId = (String) msgSummary.get("threadId");

                Optional<Email> existingEmailOpt = emailRepository.findByUserAndGmailMessageId(user, msgId);

                // Fetch complete message details using URI to avoid double encoding
                java.net.URI detailUri = org.springframework.web.util.UriComponentsBuilder.fromHttpUrl(GMAIL_MESSAGES_ENDPOINT + "/" + msgId)
                        .queryParam("format", "full")
                        .build().toUri();
                try {
                    ResponseEntity<Map<String, Object>> detailResp = restTemplate.exchange(detailUri, HttpMethod.GET, request, mapType);
                    if (detailResp.getStatusCode().is2xxSuccessful() && detailResp.getBody() != null) {
                        Map<String, Object> msgData = detailResp.getBody();
                        Email email;
                        if (existingEmailOpt.isPresent()) {
                            email = existingEmailOpt.get();
                            Email parsed = parseGmailMessage(msgData, user, msgId, threadId, account.getAccessToken());
                            email.setBody(parsed.getBody());
                            email.setPreview(parsed.getPreview());
                            email.setSubject(parsed.getSubject());
                            email.setSender(parsed.getSender());
                            email.setSenderEmail(parsed.getSenderEmail());
                            email.setRecipientEmail(parsed.getRecipientEmail());
                            email.setFolder(parsed.getFolder());
                            email.setStarred(parsed.isStarred());
                            email.setImportant(parsed.isImportant());
                            email.setRead(parsed.isRead());
                        } else {
                            email = parseGmailMessage(msgData, user, msgId, threadId, account.getAccessToken());
                        }

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
                    log.warn("Failed to fetch message {}: {}", msgId, e.getMessage());
                }
            }

            // Always update sync state on connected account
            account.setLastSyncedAt(LocalDateTime.now());
            account.setTotalEmailsScanned((account.getTotalEmailsScanned() != null ? account.getTotalEmailsScanned() : 0) + scannedCount);
            connectedAccountRepository.save(account);

            long totalApps = jobApplicationRepository.countByUser(user);
            long totalJobEmails = emailRepository.countByUserAndIsJobRelatedTrue(user);
            long totalInterviews = interviewRepository.countByUser(user);
            long totalFollowUps = followUpRepository.countByUser(user);

            String summaryMessage = String.format(
                    "Scanned %d recent messages across 3 months. %d active job applications tracked, %d job emails logged.",
                    scannedCount > 0 ? scannedCount : totalToProcess,
                    totalApps,
                    totalJobEmails
            );

            log.info("Gmail sync completed successfully for user {}: {}", user.getEmail(), summaryMessage);

            return new GmailSyncResponse(
                    true,
                    scannedCount > 0 ? scannedCount : totalToProcess,
                    (int) totalJobEmails,
                    (int) totalApps,
                    0,
                    duplicatesSkipped,
                    (int) totalInterviews,
                    (int) totalFollowUps,
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
        return parseGmailMessage(msgData, user, msgId, threadId, null);
    }

    public Email parseGmailMessage(Map<String, Object> msgData, User user, String msgId, String threadId, String accessToken) {
        Email email = new Email();
        email.setUser(user);
        email.setGmailMessageId(msgId);
        email.setGmailThreadId(threadId);
        @SuppressWarnings("unchecked")
        List<String> labelIds = (List<String>) msgData.get("labelIds");
        if (labelIds != null) {
            if (labelIds.contains("SENT")) {
                email.setFolder(EmailFolder.SENT);
            } else if (labelIds.contains("DRAFT")) {
                email.setFolder(EmailFolder.DRAFTS);
            } else if (labelIds.contains("TRASH")) {
                email.setFolder(EmailFolder.TRASH);
            } else if (labelIds.contains("INBOX")) {
                email.setFolder(EmailFolder.INBOX);
            } else {
                email.setFolder(EmailFolder.ARCHIVE);
            }
            email.setStarred(labelIds.contains("STARRED"));
            email.setImportant(labelIds.contains("IMPORTANT"));
            email.setRead(!labelIds.contains("UNREAD"));
            email.setLabels(String.join(",", labelIds));
        } else {
            email.setFolder(EmailFolder.INBOX);
            email.setRead(true);
        }

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

        StringBuilder plainSb = new StringBuilder();
        StringBuilder htmlSb = new StringBuilder();
        Map<String, String> inlineImages = new HashMap<>();
        extractTextRecursively(payload, plainSb, htmlSb, inlineImages, msgId, accessToken);

        String body = "";
        if (htmlSb.length() > 0) {
            String rawHtml = htmlSb.toString().trim();
            for (Map.Entry<String, String> entry : inlineImages.entrySet()) {
                rawHtml = rawHtml.replace("cid:" + entry.getKey(), entry.getValue());
            }
            body = rawHtml;
        } else if (plainSb.length() > 0) {
            body = plainSb.toString().trim();
        }

        if (body.isBlank()) {
            body = (String) msgData.get("snippet");
        }
        if (body == null) body = "";

        email.setBody(body);

        String snippet = (String) msgData.get("snippet");
        if (snippet == null || snippet.isBlank()) {
            snippet = (plainSb.length() > 0 ? plainSb.toString() : body).replaceAll("<[^>]+>", " ");
            snippet = snippet.replaceAll("\\s+", " ").trim();
        }
        if (snippet.length() > 140) {
            snippet = snippet.substring(0, 140) + "...";
        }
        email.setPreview(snippet);

        LocalDateTime timestamp = parseTimestamp(dateStr, msgData.get("internalDate"));
        email.setTimestamp(timestamp);

        return email;
    }

    private void extractTextRecursively(Map<String, Object> part, StringBuilder plainSb, StringBuilder htmlSb, Map<String, String> inlineImages, String msgId, String accessToken) {
        if (part == null) return;

        String mimeType = (String) part.get("mimeType");

        @SuppressWarnings("unchecked")
        Map<String, Object> body = (Map<String, Object>) part.get("body");
        if (body != null) {
            String rawData = (String) body.get("data");
            if ("text/plain".equalsIgnoreCase(mimeType) && rawData != null) {
                String decoded = decodeBase64Url(rawData);
                if (plainSb.length() > 0) plainSb.append("\n\n");
                plainSb.append(decoded);
            } else if ("text/html".equalsIgnoreCase(mimeType) && rawData != null) {
                String decoded = decodeBase64Url(rawData);
                if (htmlSb.length() > 0) htmlSb.append("\n\n");
                htmlSb.append(decoded);
            } else if (mimeType != null && mimeType.toLowerCase().startsWith("image/")) {
                String imgBase64 = rawData;
                String attId = (String) body.get("attachmentId");

                // If image data is not inline, fetch attachment bytes using Gmail API
                if ((imgBase64 == null || imgBase64.isBlank()) && attId != null && !attId.isBlank() && accessToken != null && msgId != null) {
                    try {
                        HttpHeaders headers = new HttpHeaders();
                        headers.setBearerAuth(accessToken);
                        HttpEntity<Void> req = new HttpEntity<>(headers);
                        String attUrl = GMAIL_MESSAGES_ENDPOINT + "/" + msgId + "/attachments/" + attId;
                        ParameterizedTypeReference<Map<String, Object>> mapType = new ParameterizedTypeReference<>() {};
                        ResponseEntity<Map<String, Object>> attResp = restTemplate.exchange(attUrl, HttpMethod.GET, req, mapType);
                        if (attResp.getStatusCode().is2xxSuccessful() && attResp.getBody() != null) {
                            imgBase64 = (String) attResp.getBody().get("data");
                        }
                    } catch (Exception ex) {
                        log.debug("Could not fetch inline image attachment {} for message {}: {}", attId, msgId, ex.getMessage());
                    }
                }

                if (imgBase64 != null && !imgBase64.isBlank()) {
                    String base64Data = imgBase64.replace("-", "+").replace("_", "/");
                    String dataUri = "data:" + mimeType.toLowerCase() + ";base64," + base64Data;
                    @SuppressWarnings("unchecked")
                    List<Map<String, String>> headers = (List<Map<String, String>>) part.get("headers");
                    if (headers != null) {
                        for (Map<String, String> h : headers) {
                            String name = h.get("name");
                            String val = h.get("value");
                            if ("Content-ID".equalsIgnoreCase(name) && val != null) {
                                String cleanCid = val.replaceAll("[<>]", "").trim();
                                inlineImages.put(cleanCid, dataUri);
                                inlineImages.put(val.trim(), dataUri);
                            } else if ("X-Attachment-Id".equalsIgnoreCase(name) && val != null) {
                                inlineImages.put(val.trim(), dataUri);
                            }
                        }
                    }
                }
            }
        }

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> subParts = (List<Map<String, Object>>) part.get("parts");
        if (subParts != null) {
            for (Map<String, Object> subPart : subParts) {
                extractTextRecursively(subPart, plainSb, htmlSb, inlineImages, msgId, accessToken);
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

    @Transactional
    public GmailSyncResponse reprocessStoredEmails(User user) {
        log.info("========== Reprocessing All Stored Emails for user {} ==========", user.getEmail());
        emailAnalysisService.reprocessAllUserEmails(user);

        long totalApps = jobApplicationRepository.countByUser(user);
        long totalEmails = emailRepository.countByUser(user);
        long jobEmails = emailRepository.countByUserAndIsJobRelatedTrue(user);

        String summary = String.format("Reprocessed %d emails from your database. Found %d verified job applications.", totalEmails, totalApps);
        log.info(summary);

        return new GmailSyncResponse(
                true,
                (int) totalEmails,
                (int) jobEmails,
                (int) totalApps,
                0,
                0,
                0,
                0,
                summary,
                LocalDateTime.now()
        );
    }

    @Transactional
    public Email sendEmail(User user, EmailComposeRequest request) {
        if (request.getTo() == null || request.getTo().trim().isBlank()) {
            throw new IllegalArgumentException("Recipient email address is required.");
        }
        if (request.getSubject() == null || request.getSubject().trim().isBlank()) {
            throw new IllegalArgumentException("Email subject is required.");
        }
        if (request.getBody() == null || request.getBody().trim().isBlank()) {
            throw new IllegalArgumentException("Email body is required.");
        }

        Optional<ConnectedAccount> accountOpt = connectedAccountRepository.findByUserAndProvider(user, "google");
        if (accountOpt.isEmpty() || accountOpt.get().getAccessToken() == null) {
            log.error("[Gmail Send Error] User {} tried to send email without connecting Google account.", user.getEmail());
            throw new IllegalStateException("No Google account connected. Please connect your Gmail account in Settings or Login before sending emails.");
        }

        ConnectedAccount account = accountOpt.get();
        String accessToken = googleOAuthService.getValidAccessToken(account);
        if (accessToken == null || accessToken.isBlank()) {
            log.error("[Gmail Send Error] Access token unavailable for user {}.", user.getEmail());
            throw new IllegalStateException("Google authentication token is unavailable or expired. Please reconnect your Gmail account.");
        }

        String fromEmail = account.getProviderEmail() != null && !account.getProviderEmail().isBlank()
                ? account.getProviderEmail()
                : user.getEmail();
        String fromName = user.getName() != null && !user.getName().isBlank()
                ? user.getName()
                : fromEmail;
        String recipientEmail = request.getTo().trim();
        String subject = request.getSubject().trim();
        String body = request.getBody();

        log.info("[Gmail Send Initiated] User: {} | From: {} <{}> | To: {} | Subject: '{}'",
                user.getEmail(), fromName, fromEmail, recipientEmail, subject);

        // 1. Create standard RFC 822 / MIME message
        String encodedRawMessage;
        try {
            Properties props = new Properties();
            Session session = Session.getDefaultInstance(props, null);
            MimeMessage mimeMessage = new MimeMessage(session);

            mimeMessage.setFrom(new InternetAddress(fromEmail, fromName, "UTF-8"));
            mimeMessage.setRecipients(Message.RecipientType.TO, InternetAddress.parse(recipientEmail));
            mimeMessage.setSubject(subject, "UTF-8");

            if (body.contains("<html") || body.contains("<p>") || body.contains("<br") || body.contains("<div>") || body.contains("<b>")) {
                mimeMessage.setContent(body, "text/html; charset=UTF-8");
            } else {
                mimeMessage.setText(body, "UTF-8", "plain");
            }
            mimeMessage.setSentDate(new java.util.Date());

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            mimeMessage.writeTo(baos);
            byte[] rawBytes = baos.toByteArray();
            encodedRawMessage = Base64.getUrlEncoder().withoutPadding().encodeToString(rawBytes);
        } catch (Exception e) {
            log.error("[Gmail Send Failed] Error building RFC 822 MIME message: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to format email as RFC 822 MIME message: " + e.getMessage(), e);
        }

        // 2. Call Gmail API users/me/messages/send
        String sendEndpoint = "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> sendPayload = Map.of("raw", encodedRawMessage);
        ParameterizedTypeReference<Map<String, Object>> mapType = new ParameterizedTypeReference<>() {};

        Map<String, Object> responseBody = null;
        try {
            ResponseEntity<Map<String, Object>> resp = restTemplate.exchange(
                    sendEndpoint,
                    HttpMethod.POST,
                    new HttpEntity<>(sendPayload, headers),
                    mapType
            );
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                responseBody = resp.getBody();
            }
        } catch (HttpStatusCodeException ex) {
            String errorDetails = ex.getResponseBodyAsString();
            log.warn("[Gmail Send Warning] Status {} from Gmail API: {}. Attempting token refresh...", ex.getStatusCode(), errorDetails);

            if (ex.getStatusCode() == HttpStatus.UNAUTHORIZED) {
                try {
                    String refreshedToken = googleOAuthService.forceRefreshToken(account);
                    headers.setBearerAuth(refreshedToken);
                    ResponseEntity<Map<String, Object>> retryResp = restTemplate.exchange(
                            sendEndpoint,
                            HttpMethod.POST,
                            new HttpEntity<>(sendPayload, headers),
                            mapType
                    );
                    if (retryResp.getStatusCode().is2xxSuccessful() && retryResp.getBody() != null) {
                        responseBody = retryResp.getBody();
                    }
                } catch (HttpStatusCodeException retryEx) {
                    String retryError = retryEx.getResponseBodyAsString();
                    log.error("[Gmail Send Failed after retry] Status: {} | Details: {}", retryEx.getStatusCode(), retryError, retryEx);
                    throw new RuntimeException(parseFriendlyGmailError(retryEx.getStatusCode(), retryError), retryEx);
                }
            } else {
                log.error("[Gmail Send Failed] Status: {} | Details: {}", ex.getStatusCode(), errorDetails, ex);
                throw new RuntimeException(parseFriendlyGmailError(ex.getStatusCode(), errorDetails), ex);
            }
        } catch (Exception ex) {
            log.error("[Gmail Send Error] Unexpected failure communicating with Gmail API: {}", ex.getMessage(), ex);
            throw new RuntimeException(ex.getMessage(), ex);
        }

        if (responseBody == null || !responseBody.containsKey("id")) {
            log.error("[Gmail Send Failed] No valid message ID returned from Gmail API response: {}", responseBody);
            throw new RuntimeException("Gmail API did not return a valid message confirmation");
        }

        String gmailMessageId = (String) responseBody.get("id");
        String gmailThreadId = (String) responseBody.get("threadId");

        log.info("[Gmail Send SUCCESS] Delivered to Gmail! Gmail Message ID: {}, Thread ID: {}", gmailMessageId, gmailThreadId);

        // 3. Save into PostgreSQL database as SENT folder with real Gmail metadata
        Email email = new Email();
        email.setUser(user);
        email.setSender(fromName);
        email.setSenderEmail(fromEmail);
        email.setRecipientEmail(recipientEmail);
        email.setSubject(subject);
        email.setBody(body);
        email.setPreview(body.length() > 100 ? body.substring(0, 100) + "..." : body);
        email.setTimestamp(LocalDateTime.now());
        email.setRead(true);
        email.setFolder(EmailFolder.SENT);
        email.setGmailMessageId(gmailMessageId);
        email.setGmailThreadId(gmailThreadId);
        email.setLabels("SENT");

        emailAnalysisService.processEmail(email, user);
        return emailRepository.save(email);
    }

    private String parseFriendlyGmailError(HttpStatusCode status, String errorDetails) {
        if (errorDetails != null && (errorDetails.contains("ACCESS_TOKEN_SCOPE_INSUFFICIENT") || errorDetails.contains("insufficientPermissions") || errorDetails.contains("insufficient authentication scopes"))) {
            return "Your connected Google account was authorized without the Send Email permission. Please go to Settings, disconnect your Gmail account, and reconnect to grant the 'Send Email' scope.";
        }
        return "Gmail API error (" + status + "): " + errorDetails;
    }
}
