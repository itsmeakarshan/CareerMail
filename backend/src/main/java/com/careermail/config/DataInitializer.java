package com.careermail.config;

import com.careermail.model.entity.*;
import com.careermail.model.enums.*;
import com.careermail.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final JobApplicationRepository jobApplicationRepository;
    private final InterviewRepository interviewRepository;
    private final FollowUpRepository followUpRepository;
    private final EmailRepository emailRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           JobApplicationRepository jobApplicationRepository,
                           InterviewRepository interviewRepository,
                           FollowUpRepository followUpRepository,
                           EmailRepository emailRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jobApplicationRepository = jobApplicationRepository;
        this.interviewRepository = interviewRepository;
        this.followUpRepository = followUpRepository;
        this.emailRepository = emailRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.findByEmail("arjun.sharma@email.com").isPresent()) {
            return; // Already initialized
        }

        // 1. Create Default User (Arjun Sharma)
        User user = new User();
        user.setName("Arjun Sharma");
        user.setEmail("arjun.sharma@email.com");
        user.setPassword(passwordEncoder.encode("password123"));
        user.setAvatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80");
        user = userRepository.save(user);

        LocalDate now = LocalDate.now();
        LocalDateTime nowDateTime = LocalDateTime.now();

        // 2. Seed Kanban Board Job Applications (Matching dashboard.png)

        // APPLIED (24 total)
        JobApplication capOne = createJob(user, "Capital One", "Software Engineer", "Applied 3 days ago", "capitalone", ApplicationStatus.APPLIED, Priority.HIGH, now.minusDays(3), "$135k - $155k", "New York, NY", "Sarah Jenkins", "sjenkins@capitalone.com");
        JobApplication deloitte = createJob(user, "Deloitte", "Data Analyst", "Applied 5 days ago", "deloitte", ApplicationStatus.APPLIED, Priority.MEDIUM, now.minusDays(5), "$110k - $130k", "Chicago, IL", "Marcus Chen", "mchen@deloitte.com");
        createJob(user, "Zoho", "Full Stack Engineer", "Applied 7 days ago", "zoho", ApplicationStatus.APPLIED, Priority.MEDIUM, now.minusDays(7), "$120k", "Austin, TX", "Priya Nair", "priya@zoho.com");

        String[] moreApplied = {"Goldman Sachs", "Cisco", "IBM", "Intel", "NVIDIA", "Stripe", "Spotify", "Airbnb", "Bloomberg", "Reddit", "Pinterest", "Figma", "Datadog", "Snowflake", "Palantir", "DoorDash", "Dropbox", "Atlassian", "Box", "Hubspot", "Twilio"};
        for (int i = 0; i < moreApplied.length; i++) {
            createJob(user, moreApplied[i], "Software Engineer", "Applied " + (i + 8) + " days ago", moreApplied[i].toLowerCase().replaceAll("[^a-z]", ""), ApplicationStatus.APPLIED, Priority.MEDIUM, now.minusDays(i + 8), "$140k - $170k", "Remote", "Recruiting Team", "careers@" + moreApplied[i].toLowerCase() + ".com");
        }

        // ASSESSMENT (6 total)
        JobApplication amazon = createJob(user, "Amazon", "SDE Intern", "Assessment invited", "amazon", ApplicationStatus.ASSESSMENT, Priority.HIGH, now.minusDays(8), "$55/hr", "Seattle, WA", "David Miller", "dmiller@amazon.com");
        JobApplication jpmorgan = createJob(user, "JP Morgan", "Software Engineer", "Assessment in progress", "jpmorgan", ApplicationStatus.ASSESSMENT, Priority.HIGH, now.minusDays(10), "$130k - $150k", "New York, NY", "Elena Rostova", "erostova@jpmchase.com");
        createJob(user, "Citadel", "Quantitative Developer", "HackerRank sent", "citadel", ApplicationStatus.ASSESSMENT, Priority.HIGH, now.minusDays(12), "$200k+", "New York, NY", "Alex Vance", "avance@citadel.com");
        createJob(user, "Jane Street", "Software Engineer", "Online Test active", "janestreet", ApplicationStatus.ASSESSMENT, Priority.HIGH, now.minusDays(14), "$220k+", "New York, NY", "Sam Taylor", "recruiting@janestreet.com");
        createJob(user, "Morgan Stanley", "Technology Analyst", "Coding challenge", "morganstanley", ApplicationStatus.ASSESSMENT, Priority.MEDIUM, now.minusDays(15), "$125k", "New York, NY", "Laura Brooks", "lbrooks@morganstanley.com");
        createJob(user, "Two Sigma", "Software Engineer", "Take-home project", "twosigma", ApplicationStatus.ASSESSMENT, Priority.HIGH, now.minusDays(16), "$190k+", "New York, NY", "Nathan Green", "ngreen@twosigma.com");

        // RECRUITER SCREEN (4 total)
        JobApplication microsoft = createJob(user, "Microsoft", "Product Engineer", "Screening call", "microsoft", ApplicationStatus.RECRUITER_SCREEN, Priority.HIGH, now.minusDays(12), "$155k - $175k", "Redmond, WA", "Jessica Davis", "jdavis@microsoft.com");
        JobApplication salesforce = createJob(user, "Salesforce", "Member of Tech Staff", "Screening call", "salesforce", ApplicationStatus.RECRUITER_SCREEN, Priority.MEDIUM, now.minusDays(14), "$160k - $185k", "San Francisco, CA", "Brian Wong", "bwong@salesforce.com");
        createJob(user, "LinkedIn", "Software Engineer", "Screening call", "linkedin", ApplicationStatus.RECRUITER_SCREEN, Priority.HIGH, now.minusDays(15), "$165k", "Sunnyvale, CA", "Amanda Wright", "awright@linkedin.com");
        createJob(user, "GitHub", "Backend Engineer", "Introductory chat", "github", ApplicationStatus.RECRUITER_SCREEN, Priority.HIGH, now.minusDays(16), "$150k", "Remote", "Tom Harrison", "tharrison@github.com");

        // INTERVIEW (8 total)
        JobApplication google = createJob(user, "Google", "Software Engineer", "Technical Interview", "google", ApplicationStatus.INTERVIEW, Priority.HIGH, now.minusDays(18), "$180k - $210k", "Mountain View, CA", "Emily Watson", "emilyw@google.com");
        JobApplication adobe = createJob(user, "Adobe", "Software Engineer", "Onsite Interview", "adobe", ApplicationStatus.INTERVIEW, Priority.HIGH, now.minusDays(20), "$150k - $170k", "San Jose, CA", "Carlos Mendez", "cmendez@adobe.com");
        createJob(user, "Notion", "Product Engineer", "System Design", "notion", ApplicationStatus.INTERVIEW, Priority.HIGH, now.minusDays(21), "$175k", "San Francisco, CA", "Clara Bell", "clara@makenotion.com");
        createJob(user, "Linear", "Frontend Engineer", "Architecture Deep Dive", "linear", ApplicationStatus.INTERVIEW, Priority.HIGH, now.minusDays(22), "$170k", "Remote", "Karri Saarinen", "team@linear.app");
        createJob(user, "Vercel", "Full Stack Engineer", "Pair Programming", "vercel", ApplicationStatus.INTERVIEW, Priority.HIGH, now.minusDays(23), "$165k", "Remote", "Guillermo Rauch", "team@vercel.com");
        createJob(user, "Supabase", "Backend Engineer", "Technical Round 2", "supabase", ApplicationStatus.INTERVIEW, Priority.HIGH, now.minusDays(24), "$160k", "Remote", "Ant Wilson", "ant@supabase.io");
        createJob(user, "Figma", "Design Systems Engineer", "Technical Deep Dive", "figma", ApplicationStatus.INTERVIEW, Priority.HIGH, now.minusDays(25), "$175k", "San Francisco, CA", "Dylan Field", "dylan@figma.com");
        createJob(user, "Datadog", "Software Engineer", "Coding Round 2", "datadog", ApplicationStatus.INTERVIEW, Priority.MEDIUM, now.minusDays(26), "$165k", "New York, NY", "Olivier Pomel", "careers@datadog.com");

        // FINAL INTERVIEW (3 total)
        JobApplication meta = createJob(user, "Meta", "E4 Software Engineer", "Final Round", "meta", ApplicationStatus.FINAL_INTERVIEW, Priority.HIGH, now.minusDays(25), "$190k - $220k", "Menlo Park, CA", "Rachel Green", "rgreen@meta.com");
        JobApplication tesla = createJob(user, "Tesla", "Software Engineer", "Final Round", "tesla", ApplicationStatus.FINAL_INTERVIEW, Priority.HIGH, now.minusDays(28), "$160k - $190k", "Austin, TX", "Vikram Patel", "vpatel@tesla.com");
        createJob(user, "Netflix", "Senior Platform Engineer", "Executive Round", "netflix", ApplicationStatus.FINAL_INTERVIEW, Priority.HIGH, now.minusDays(30), "$240k All Cash", "Los Gatos, CA", "Greg Peters", "gpeters@netflix.com");

        // OFFER (2 total)
        JobApplication apple = createJob(user, "Apple", "Software Engineer", "Offer Received", "apple", ApplicationStatus.OFFER, Priority.HIGH, now.minusDays(35), "$185k base + $120k RSU", "Cupertino, CA", "Lisa Jackson", "ljackson@apple.com");
        JobApplication oracle = createJob(user, "Oracle", "Cloud Engineer", "Offer Received", "oracle", ApplicationStatus.OFFER, Priority.HIGH, now.minusDays(40), "$160k base + $60k bonus", "Austin, TX", "Larry Ellison", "recruiting@oracle.com");

        // REJECTED (5 total)
        createJob(user, "Uber", "Software Engineer", "Application closed", "uber", ApplicationStatus.REJECTED, Priority.MEDIUM, now.minusDays(45), "$165k", "San Francisco, CA", "Talent Team", "careers@uber.com");
        createJob(user, "Robinhood", "Backend Engineer", "Not selected", "robinhood", ApplicationStatus.REJECTED, Priority.LOW, now.minusDays(50), "$150k", "Menlo Park, CA", "Talent Team", "recruiting@robinhood.com");
        createJob(user, "Coinbase", "Infra Engineer", "Position filled", "coinbase", ApplicationStatus.REJECTED, Priority.LOW, now.minusDays(55), "$170k", "Remote", "Talent Acquisition", "talent@coinbase.com");
        createJob(user, "Lyft", "Data Engineer", "Not moving forward", "lyft", ApplicationStatus.REJECTED, Priority.LOW, now.minusDays(60), "$155k", "San Francisco, CA", "Talent Acquisition", "talent@lyft.com");
        createJob(user, "Snap", "iOS Engineer", "Application closed", "snap", ApplicationStatus.REJECTED, Priority.LOW, now.minusDays(65), "$165k", "Santa Monica, CA", "Talent Acquisition", "careers@snap.com");

        // WITHDRAWN (2 total)
        createJob(user, "Twitter/X", "Core Systems", "Application withdrawn", "twitter", ApplicationStatus.WITHDRAWN, Priority.LOW, now.minusDays(70), "$160k", "San Francisco, CA", "Talent Team", "jobs@x.com");
        createJob(user, "Cruise", "Robotics Software", "Application withdrawn", "cruise", ApplicationStatus.WITHDRAWN, Priority.LOW, now.minusDays(75), "$175k", "San Francisco, CA", "Talent Team", "jobs@getcruise.com");

        // 3. Seed Upcoming Interviews (Matching screenshot)
        // Item 1: Google - Software Engineer - May 17, 2025 · 10:00 AM - "In 2 days"
        createInterview(user, google, "Google", "Software Engineer", nowDateTime.plusDays(2).withHour(10).withMinute(0), "Technical Interview", "Emily Watson & Staff SWE", "Google Meet", "https://meet.google.com/abc-defg-hij", "In 2 days", "google");

        // Item 2: Microsoft - Product Engineer - May 20, 2025 · 02:30 PM - "In 5 days"
        createInterview(user, microsoft, "Microsoft", "Product Engineer", nowDateTime.plusDays(5).withHour(14).withMinute(30), "Screening call", "Jessica Davis", "Microsoft Teams", "https://teams.microsoft.com/l/meetup-join/123", "In 5 days", "microsoft");

        // Item 3: Amazon - SDE Intern - May 22, 2025 · 11:00 AM - "In 7 days"
        createInterview(user, amazon, "Amazon", "SDE Intern", nowDateTime.plusDays(7).withHour(11).withMinute(0), "Assessment Review & Coding", "David Miller", "Amazon Chime", "https://app.chime.aws/meet/456", "In 7 days", "amazon");

        // Additional interviews
        createInterview(user, adobe, "Adobe", "Software Engineer", nowDateTime.plusDays(10).withHour(13).withMinute(0), "Onsite Interview", "Carlos Mendez", "Zoom", "https://zoom.us/j/789", "In 10 days", "adobe");
        createInterview(user, meta, "Meta", "E4 Software Engineer", nowDateTime.plusDays(14).withHour(15).withMinute(0), "Final Round", "Rachel Green", "BlueJeans / Portal", "https://meta.zoom.us/j/101", "In 14 days", "meta");

        // 4. Seed Follow-ups Due (Matching screenshot)
        // Item 1: Capital One - Applied 12 days ago - "Due in 1 day"
        createFollowUp(user, capOne, "Capital One", "Software Engineer", now.plusDays(1), "Applied 12 days ago", "Due in 1 day", "capitalone", "Send email to Sarah Jenkins regarding application status.");

        // Item 2: Deloitte - Applied 9 days ago - "Due in 2 days"
        createFollowUp(user, deloitte, "Deloitte", "Data Analyst", now.plusDays(2), "Applied 9 days ago", "Due in 2 days", "deloitte", "Ping Marcus Chen on LinkedIn or send status inquiry.");

        // Item 3: Zoho - Applied 7 days ago - "Due in 3 days"
        createFollowUp(user, null, "Zoho", "Full Stack Engineer", now.plusDays(3), "Applied 7 days ago", "Due in 3 days", "zoho", "Follow up regarding online test submission.");

        // Additional follow-ups to match badge count 12
        String[] moreFollowUps = {"Goldman Sachs", "Cisco", "IBM", "Intel", "NVIDIA", "Stripe", "Spotify", "Airbnb", "Bloomberg"};
        for (int i = 0; i < moreFollowUps.length; i++) {
            createFollowUp(user, null, moreFollowUps[i], "Software Engineer", now.plusDays(4 + i), "Applied " + (10 + i) + " days ago", "Due in " + (4 + i) + " days", moreFollowUps[i].toLowerCase().replaceAll("[^a-z]", ""), "Check with recruiting team on timeline.");
        }

        // 5. Seed Realistic Emails
        seedEmails(user, capOne, deloitte, amazon, jpmorgan, microsoft, google, adobe, meta, apple, oracle);
    }

    private JobApplication createJob(User user, String company, String title, String subtitle, String logo,
                                     ApplicationStatus status, Priority priority, LocalDate dateApplied,
                                     String salary, String location, String recruiterName, String recruiterEmail) {
        JobApplication app = new JobApplication();
        app.setUser(user);
        app.setCompany(company);
        app.setTitle(title);
        app.setActivitySubtitle(subtitle);
        app.setCompanyLogo(logo);
        app.setStatus(status);
        app.setPriority(priority);
        app.setDateApplied(dateApplied);
        app.setLastActivityDate(dateApplied);
        app.setSalary(salary);
        app.setLocation(location);
        app.setRecruiterName(recruiterName);
        app.setRecruiterEmail(recruiterEmail);
        app.setSource("Direct Career Portal");

        TimelineEvent event = new TimelineEvent(
                app,
                "Applied for " + title,
                "Application submitted to " + company + " via CareerMail tracker",
                dateApplied.atTime(10, 0),
                "APPLIED"
        );
        app.addTimelineEvent(event);

        if (status == ApplicationStatus.INTERVIEW || status == ApplicationStatus.FINAL_INTERVIEW) {
            TimelineEvent intEvent = new TimelineEvent(
                    app,
                    "Interview Scheduled",
                    "Technical interview round arranged with engineering panel",
                    dateApplied.plusDays(4).atTime(14, 0),
                    "INTERVIEW"
            );
            app.addTimelineEvent(intEvent);
        } else if (status == ApplicationStatus.OFFER) {
            TimelineEvent offEvent = new TimelineEvent(
                    app,
                    "Job Offer Received!",
                    "Formal written offer package received for " + title,
                    dateApplied.plusDays(10).atTime(16, 30),
                    "OFFER"
            );
            app.addTimelineEvent(offEvent);
        }

        return jobApplicationRepository.save(app);
    }

    private void createInterview(User user, JobApplication app, String company, String title,
                                 LocalDateTime date, String type, String interviewer, String location,
                                 String link, String daysBadge, String logo) {
        Interview interview = new Interview();
        interview.setUser(user);
        interview.setJobApplication(app);
        interview.setCompany(company);
        interview.setTitle(title);
        interview.setInterviewDate(date);
        interview.setType(type);
        interview.setInterviewer(interviewer);
        interview.setLocation(location);
        interview.setMeetingLink(link);
        interview.setDaysAwayBadge(daysBadge);
        interview.setCompanyLogo(logo);
        interview.setPreparationNotes("Review core data structures, algorithms, and system design patterns for " + company + ".");
        interview.setStatus(InterviewStatus.SCHEDULED);
        interviewRepository.save(interview);
    }

    private void createFollowUp(User user, JobApplication app, String company, String role,
                                LocalDate dueDate, String appliedSub, String daysBadge, String logo, String notes) {
        FollowUp followUp = new FollowUp();
        followUp.setUser(user);
        followUp.setJobApplication(app);
        followUp.setCompany(company);
        followUp.setRole(role);
        followUp.setDueDate(dueDate);
        followUp.setAppliedSubtitle(appliedSub);
        followUp.setDaysDueBadge(daysBadge);
        followUp.setCompanyLogo(logo);
        followUp.setNotes(notes);
        followUp.setStatus(FollowUpStatus.PENDING);
        followUpRepository.save(followUp);
    }

    private void seedEmails(User user, JobApplication capOne, JobApplication deloitte,
                            JobApplication amazon, JobApplication jpmorgan,
                            JobApplication microsoft, JobApplication google,
                            JobApplication adobe, JobApplication meta,
                            JobApplication apple, JobApplication oracle) {
        LocalDateTime now = LocalDateTime.now();

        // 1. Google Technical Interview
        createEmail(user, google, "Google Careers", "recruiting@google.com",
                "Invitation to Interview: Software Engineer at Google",
                "Hi Arjun, We were very impressed with your background and would love to invite you to interview for the Software Engineer role at Google Mountain View...",
                now.minusHours(2), false, true, true, EmailFolder.INBOX, "Interview,Google");

        // 2. Apple Formal Offer
        createEmail(user, apple, "Apple Talent Acquisition", "ljackson@apple.com",
                "Offer of Employment: Software Engineer at Apple",
                "Dear Arjun, On behalf of Apple Inc., we are pleased to offer you the position of Software Engineer! Please review the attached formal offer letter...",
                now.minusDays(1), true, true, true, EmailFolder.INBOX, "Offer,Apple");

        // 3. Oracle Cloud Offer
        createEmail(user, oracle, "Oracle Recruiting", "recruiting@oracle.com",
                "Formal Offer: Cloud Engineer at Oracle Cloud Infrastructure",
                "Hi Arjun, Congratulations! We are excited to extend an offer to join our OCI Core Engineering group. Details regarding compensation and start date are enclosed...",
                now.minusDays(2), false, false, true, EmailFolder.INBOX, "Offer,Oracle");

        // 4. Microsoft Recruiter Screen
        createEmail(user, microsoft, "Microsoft University & Experienced Hiring", "jdavis@microsoft.com",
                "Next Steps: Product Engineer role at Microsoft",
                "Hello Arjun, Thanks for speaking with our sourcing team. I would like to schedule a 30-minute screening call this week to discuss your background and technical interests...",
                now.minusDays(3), true, true, false, EmailFolder.INBOX, "Recruiter,Microsoft");

        // 5. Amazon Online Assessment
        createEmail(user, amazon, "Amazon Student Programs", "talent@amazon.com",
                "Action Required: Amazon Online Assessment Invitation",
                "Dear Arjun, Thank you for applying to the SDE Intern position at Amazon. The next step in our process is an online technical assessment on HackerRank...",
                now.minusDays(4), true, false, false, EmailFolder.INBOX, "Assessment,Amazon");

        // 6. Capital One Confirmation
        createEmail(user, capOne, "Capital One Careers", "sjenkins@capitalone.com",
                "Thank you for applying for the Software Engineer position at Capital One",
                "Hi Arjun, Thank you for taking the time to apply for the Software Engineer position at Capital One. We have received your application and our team is currently reviewing your qualifications...",
                now.minusDays(5), true, false, false, EmailFolder.INBOX, "Applied,CapitalOne");

        // 7. Deloitte Confirmation
        createEmail(user, deloitte, "Deloitte Talent Services", "mchen@deloitte.com",
                "Deloitte Application Received: Data Analyst",
                "Dear Arjun, We appreciate your interest in Deloitte. This email confirms that we have successfully received your application for the Data Analyst role...",
                now.minusDays(6), true, false, false, EmailFolder.INBOX, "Applied,Deloitte");

        // 8. Meta Final Round
        createEmail(user, meta, "Meta Recruiting", "rgreen@meta.com",
                "Confirmation: Final Round Interview for E4 Software Engineer",
                "Hi Arjun, You did great in the technical screen! We are thrilled to invite you to the Final Round Virtual Onsite for the E4 Software Engineer role...",
                now.minusDays(7), true, true, true, EmailFolder.INBOX, "Interview,Meta");

        // 9. Adobe Onsite Interview
        createEmail(user, adobe, "Adobe Talent Team", "cmendez@adobe.com",
                "Adobe Interview Confirmation: Software Engineer",
                "Hi Arjun, Your upcoming onsite interview panel for Software Engineer has been scheduled. Please find the agenda and interviewer bios below...",
                now.minusDays(8), true, false, false, EmailFolder.INBOX, "Interview,Adobe");

        // 10. JP Morgan Assessment
        createEmail(user, jpmorgan, "J.P. Morgan Campus Recruiting", "erostova@jpmchase.com",
                "JPMorgan Chase & Co. Coding Assessment Invitation",
                "Hi Arjun, As part of your application for Software Engineer, please complete our CodeSignal technical challenge within 7 calendar days...",
                now.minusDays(9), true, false, false, EmailFolder.INBOX, "Assessment,JPMorgan");

        // Seed additional background emails to reach realistic counts (e.g. 128 in inbox, 32 important, 8 drafts)
        for (int i = 11; i <= 128; i++) {
            boolean imp = (i % 4 == 0); // ~32 important
            boolean read = (i > 15);
            createEmail(user, null, "Recruiter Team " + i, "recruiting" + i + "@techhiring.com",
                    "Update on your application inquiry #" + (1000 + i),
                    "Hello Arjun, this is an automated confirmation update regarding your profile submission and hiring status...",
                    now.minusDays(i / 2 + 1).minusHours(i % 24), read, false, imp, EmailFolder.INBOX, "Update");
        }

        // Seed 8 Drafts
        for (int d = 1; d <= 8; d++) {
            createEmail(user, null, "Arjun Sharma", "arjun.sharma@email.com",
                    "Draft Follow-up to Hiring Manager #" + d,
                    "Hi, following up on our recent conversation regarding the engineering opportunity...",
                    now.minusDays(d), true, false, false, EmailFolder.DRAFTS, "Draft");
        }
    }

    private void createEmail(User user, JobApplication app, String sender, String senderEmail,
                             String subject, String body, LocalDateTime time, boolean isRead,
                             boolean isStarred, boolean isImportant, EmailFolder folder, String labels) {
        Email email = new Email();
        email.setUser(user);
        email.setJobApplication(app);
        email.setSender(sender);
        email.setSenderEmail(senderEmail);
        email.setRecipientEmail(user.getEmail());
        email.setSubject(subject);
        email.setBody(body);
        email.setPreview(body.length() > 90 ? body.substring(0, 90) + "..." : body);
        email.setTimestamp(time);
        email.setRead(isRead);
        email.setStarred(isStarred);
        email.setImportant(isImportant);
        email.setFolder(folder);
        email.setLabels(labels);
        email.setJobRelated(true);
        if (app != null) {
            email.setDetectedCompany(app.getCompany());
            email.setDetectedRole(app.getTitle());
            email.setDetectedStatus(app.getStatus().name());
        }
        emailRepository.save(email);
    }
}
