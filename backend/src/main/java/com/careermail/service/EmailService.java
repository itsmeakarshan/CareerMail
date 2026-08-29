package com.careermail.service;

import com.careermail.dto.EmailComposeRequest;
import com.careermail.model.entity.Email;
import com.careermail.model.entity.User;
import com.careermail.model.enums.EmailFolder;
import com.careermail.repository.EmailRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private final EmailRepository emailRepository;
    private final com.careermail.repository.JobApplicationRepository jobApplicationRepository;
    private final AuthService authService;
    private final EmailAnalysisService emailAnalysisService;
    private final GmailService gmailService;

    public EmailService(EmailRepository emailRepository,
                        com.careermail.repository.JobApplicationRepository jobApplicationRepository,
                        AuthService authService,
                        EmailAnalysisService emailAnalysisService,
                        GmailService gmailService) {
        this.emailRepository = emailRepository;
        this.jobApplicationRepository = jobApplicationRepository;
        this.authService = authService;
        this.emailAnalysisService = emailAnalysisService;
        this.gmailService = gmailService;
    }

    public List<Email> getEmailsByJobApplication(Long applicationId) {
        User user = authService.getCurrentUser();
        com.careermail.model.entity.JobApplication app = jobApplicationRepository.findByIdAndUser(applicationId, user)
                .orElseThrow(() -> new IllegalArgumentException("Application not found with ID: " + applicationId));
        return emailRepository.findByJobApplicationOrderByTimestampDesc(app);
    }

    public List<Email> getEmailsByFolder(String folderName) {
        User user = authService.getCurrentUser();
        if (folderName == null || folderName.isBlank() || "all".equalsIgnoreCase(folderName)) {
            return emailRepository.findByUserOrderByTimestampDesc(user);
        }
        try {
            EmailFolder folder = EmailFolder.valueOf(folderName.toUpperCase());
            return emailRepository.findByUserAndFolderOrderByTimestampDesc(user, folder);
        } catch (IllegalArgumentException e) {
            return emailRepository.findByUserAndFolderOrderByTimestampDesc(user, EmailFolder.INBOX);
        }
    }

    public List<Email> getStarredEmails() {
        User user = authService.getCurrentUser();
        return emailRepository.findByUserAndIsStarredTrueOrderByTimestampDesc(user);
    }

    public List<Email> getImportantEmails() {
        User user = authService.getCurrentUser();
        return emailRepository.findByUserAndIsImportantTrueOrderByTimestampDesc(user);
    }

    public Email getEmailById(Long id) {
        User user = authService.getCurrentUser();
        return emailRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new IllegalArgumentException("Email not found with ID: " + id));
    }

    @Transactional
    public Email markRead(Long id, boolean read) {
        Email email = getEmailById(id);
        email.setRead(read);
        return emailRepository.save(email);
    }

    @Transactional
    public Email toggleStar(Long id) {
        Email email = getEmailById(id);
        email.setStarred(!email.isStarred());
        return emailRepository.save(email);
    }

    @Transactional
    public Email toggleImportant(Long id) {
        Email email = getEmailById(id);
        email.setImportant(!email.isImportant());
        return emailRepository.save(email);
    }

    @Transactional
    public Email moveToFolder(Long id, String folderName) {
        Email email = getEmailById(id);
        try {
            email.setFolder(EmailFolder.valueOf(folderName.toUpperCase()));
        } catch (Exception e) {
            email.setFolder(EmailFolder.INBOX);
        }
        return emailRepository.save(email);
    }

    @Transactional
    public Email composeEmail(EmailComposeRequest request) {
        User user = authService.getCurrentUser();
        return gmailService.sendEmail(user, request);
    }

    @Transactional
    public Email simulateIncomingEmail(String sender, String senderEmail, String subject, String body, boolean markImportant) {
        User user = authService.getCurrentUser();

        Email email = new Email();
        email.setUser(user);
        email.setSender(sender);
        email.setSenderEmail(senderEmail);
        email.setRecipientEmail(user.getEmail());
        email.setSubject(subject);
        email.setBody(body);
        email.setPreview(body.length() > 100 ? body.substring(0, 100) + "..." : body);
        email.setTimestamp(LocalDateTime.now());
        email.setRead(false);
        email.setImportant(markImportant);
        email.setFolder(EmailFolder.INBOX);

        emailAnalysisService.processEmail(email, user);

        return emailRepository.save(email);
    }

    @Transactional
    public void deleteEmail(Long id) {
        Email email = getEmailById(id);
        emailRepository.delete(email);
    }

    public Map<String, Long> getFolderCounts() {
        User user = authService.getCurrentUser();
        Map<String, Long> counts = new HashMap<>();
        counts.put("inbox", emailRepository.countByUserAndFolder(user, EmailFolder.INBOX));
        counts.put("important", emailRepository.countByUserAndIsImportantTrue(user));
        counts.put("starred", emailRepository.countByUserAndIsStarredTrue(user));
        counts.put("sent", emailRepository.countByUserAndFolder(user, EmailFolder.SENT));
        counts.put("drafts", emailRepository.countByUserAndFolder(user, EmailFolder.DRAFTS));
        return counts;
    }

    public List<Email> searchEmails(String query) {
        User user = authService.getCurrentUser();
        if (query == null || query.trim().isEmpty()) {
            return emailRepository.findByUserAndFolderOrderByTimestampDesc(user, EmailFolder.INBOX);
        }
        return emailRepository.searchEmails(user, query.trim());
    }
}
