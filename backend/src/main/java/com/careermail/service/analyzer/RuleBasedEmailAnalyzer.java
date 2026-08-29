package com.careermail.service.analyzer;

import com.careermail.model.enums.ApplicationStatus;
import com.careermail.model.enums.EmailClassification;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class RuleBasedEmailAnalyzer implements EmailAnalyzer {

    private final com.careermail.service.RecruiterIntelligenceService recruiterIntelligenceService;

    public RuleBasedEmailAnalyzer() {
        this(new com.careermail.service.RecruiterIntelligenceService());
    }

    public RuleBasedEmailAnalyzer(com.careermail.service.RecruiterIntelligenceService recruiterIntelligenceService) {
        this.recruiterIntelligenceService = recruiterIntelligenceService;
    }

    // Negative indicators: marketing, digests, newsletters, system alerts, non-job platforms, credit cards, licences
    private static final List<String> JUNK_PATTERNS = Arrays.asList(
            "new jobs posted", "just posted a", "jobs matching your", "top jobs for you", "daily leetcoding",
            "visa application", "rewards", "security alert", "survey to tell us",
            "registration code", "confirm your identity", "create password", "get career-ready",
            "preparing for 2027", "latest update from targetjobs", "recommended jobs",
            "job recommendations", "newsletter", "weekly digest", "promotional", "voices you should know",
            "asda rewards", "marketing", "webinar", "podcast", "account verification",
            "password reset", "two-factor", "otp code", "one-time passcode", "adobe for students",
            "groww digest", "groww", "binance", "crypto", "train ticket", "uber", "autofill", "jobright",
            "driving licence", "driving license", "dvla", "barclaycard", "credit card", "klarna", "scentbird",
            "aspora", "real estate", "toro's express", "uber eats", "loan application", "mortgage"
    );

    // Opportunity & recruiter outreach indicators
    private static final List<String> OPPORTUNITY_PATTERNS = Arrays.asList(
            "new opportunity", "job opportunity", "career opportunity", "exciting opportunity",
            "opportunity for you", "opportunity at", "opportunity with", "role opening",
            "position open", "job opening", "we are hiring", "is hiring", "hiring for",
            "thought you'd be a great fit", "thought you might be a fit", "thought you'd be interested",
            "thought of you for", "job match", "job alert", "recruiter reachout",
            "reaching out regarding a role", "reaching out regarding an opportunity",
            "wanted to reach out regarding", "found your profile", "impressed with your background",
            "open role", "new role for", "role opening at", "explore opportunities",
            "new career opportunity", "great opportunity", "exciting role", "position available"
    );

    // Explicit confirmation indicators (including received your application variations)
    private static final List<String> APPLICATION_CONFIRMATION_PATTERNS = Arrays.asList(
            "received your application", "received your job application", "received your application for",
            "received an application from you", "we received your application", "we have received your application",
            "we've received your application", "we received your application for", "application has been received",
            "your application has been received", "application received", "application was received",
            "thank you for applying", "thank you for your application", "thanks for applying",
            "thanks for your application", "thanks for your job application", "thank you for submitting your application",
            "thanks for submitting your application", "your application was sent to", "your application to",
            "job application is confirmed", "application confirmation", "position confirmed", "position is confirmed",
            "successfully submitted your application", "thanks for your interest in", "thank you for your interest in",
            "indeed application:", "your application has been submitted", "confirming your application",
            "applied for the role", "applied for the position", "applied to", "applied for the job",
            "acknowledgement of your application", "application acknowledgement"
    );

    // Comprehensive rejection indicators
    private static final List<String> REJECTION_PATTERNS = Arrays.asList(
            "chosen to move forward with other candidates",
            "chosen to move forward with candidates",
            "chosen to pursue other candidates",
            "we've chosen to move forward with other candidates",
            "we have chosen to move forward with other candidates",
            "we've chosen to move forward",
            "we have chosen to move forward",
            "chosen to move forward",
            "decided not to proceed",
            "decided not to move forward",
            "decided not to progress",
            "decided not to take your application",
            "decided to pursue other candidates",
            "decided to move forward with other candidates",
            "decided to move forward with candidates",
            "move forward with candidates who were able",
            "move forward with other candidates",
            "pursue other candidates",
            "not moving forward with your application",
            "not moving forward with your candidacy",
            "will not be moving forward with your application",
            "will not be moving forward",
            "will not be proceeding",
            "will not be progressing",
            "not be progressing your application",
            "not to progress your application",
            "not to progress to the next stage",
            "not to take your application further",
            "not selected for this position",
            "not selected for the role",
            "not selected for an interview",
            "not selected for this role",
            "were not selected for this position",
            "regret to inform you",
            "regret to inform",
            "unsuccessful with your application",
            "unsuccessful on this occasion",
            "unsuccessful this time",
            "application has been unsuccessful",
            "application was unsuccessful",
            "position has been filled",
            "role has been filled",
            "no longer considering",
            "other candidates whose skills more closely",
            "other candidates more closely fit",
            "more closely fit our requirements",
            "more closely align with our current needs",
            "more closely match our requirements",
            "decided to advance other candidates",
            "decided to go with another candidate",
            "not advancing your application",
            "not advancing to the next round",
            "unfortunately, we have decided", "unfortunately we have decided",
            "unfortunately, we will not", "unfortunately we will not",
            "unfortunately, we are unable", "unfortunately we are unable",
            "unfortunately, on this occasion", "unfortunately on this occasion",
            "wish you all the best in your job search",
            "wish you the best in your job search",
            "wish you the best of luck with your job search",
            "wish you every success in your job search",
            "wish you well in your job search"
    );

    // Interview indicators
    private static final List<String> INTERVIEW_PATTERNS = Arrays.asList(
            "invitation to interview", "invitation to an interview", "invite you to an interview", "invite you to interview",
            "invited to attend an interview", "invited to an interview", "invite you to attend an interview",
            "interview invitation", "schedule an interview", "schedule your interview", "schedule a time for an interview",
            "schedule a call for an interview", "select a time for your interview", "book a time for your interview",
            "please select a time slot", "please choose a time slot", "choose your slot", "choose a slot",
            "select your slot", "select a slot", "book your slot", "book a slot", "book an interview",
            "your interview is scheduled", "your interview has been scheduled", "your interview is confirmed",
            "your interview has been confirmed", "interview is confirmed", "interview confirmation",
            "technical interview", "coding interview", "final round interview",
            "interview with", "phone screen", "screening call", "recruiter screen", "video interview",
            "onsite interview", "next round of interview"
    );

    // Assessment indicators
    private static final List<String> ASSESSMENT_PATTERNS = Arrays.asList(
            "coding assessment", "online assessment", "hackerrank assessment", "codesignal assessment",
            "take-home assessment", "complete your assessment", "coding challenge", "online test invitation",
            "technical assessment", "online coding test", "take-home test", "online test"
    );

    // Offer indicators
    private static final List<String> OFFER_PATTERNS = Arrays.asList(
            "pleased to offer you", "pleased to offer", "offer of employment", "official offer letter",
            "congratulations on your offer", "extend an offer of employment", "job offer from"
    );

    private static final List<String> KNOWN_ROLES = Arrays.asList(
            "Data Scientist and Analyst", "Junior Materials Data Scientist", "Materials Data Scientist", "Data Scientist - Machine Learning",
            "Data Scientist - AI Practice Team", "Junior Data Scientist - AI Platform", "Junior Data Scientist",
            "Senior Data Scientist", "Lead Data Scientist", "Data Scientist", "Applied Machine Learning Scientist",
            "Machine Learning Engineer", "ML Engineer", "Artificial Intelligence Engineer", "AI Engineer",
            "Junior Big Data Developer", "Big Data Developer", "Junior Data Engineer", "Senior Data Engineer", "Data Engineer",
            "Junior SQL Developer", "SQL Developer", "Junior Data Analyst", "Senior Data Analyst", "Data Analyst",
            "Senior Software Engineer", "Lead Software Engineer", "Staff Software Engineer",
            "Full Stack Engineer", "Full Stack Developer", "Frontend Engineer", "Frontend Developer",
            "Backend Engineer", "Backend Developer", "Software Engineer", "Software Developer",
            "Product Engineer", "Platform Engineer", "Infrastructure Engineer", "Infra Engineer",
            "Mobile Engineer", "Security Engineer", "Quantitative Developer", "Quantitative Researcher",
            "SDE Intern", "Software Engineering Intern", "Software Intern", "Engineering Intern",
            "Graduate Software Engineer", "Associate Software Engineer"
    );

    @Override
    public AnalysisResult analyze(String subject, String body, String sender, String senderEmail) {
        String safeSubject = subject != null ? subject : "";
        String safeBody = body != null ? body : "";
        String safeSender = sender != null ? sender : "";
        String safeSenderEmail = senderEmail != null ? senderEmail : "";

        String plainBody = safeBody.replaceAll("<[^>]+>", " ");
        String combined = (safeSubject + " " + plainBody).toLowerCase();
        String lowerSubject = safeSubject.toLowerCase();

        // 1. Check if email is junk / alert / newsletter
        if (isJunkEmail(lowerSubject, combined, safeSender, safeSenderEmail)) {
            return AnalysisResult.nonJob();
        }

        // 2. Check if email matches real job application patterns
        boolean isApplication = matchesAny(combined, APPLICATION_CONFIRMATION_PATTERNS) ||
                lowerSubject.startsWith("indeed application:") ||
                lowerSubject.contains("your application was sent to");

        // Rejections must be genuine job application rejections
        boolean isRejection = isJobRejection(combined, lowerSubject);
        boolean isInterview = !isRejection && isInterviewEmail(lowerSubject, combined);
        boolean isAssessment = !isRejection && isAssessmentEmail(lowerSubject, combined);
        boolean isOffer = !isRejection && matchesAny(combined, OFFER_PATTERNS);
        boolean isOpportunity = !isRejection && !isInterview && !isAssessment && !isOffer && !isApplication &&
                (matchesAny(lowerSubject, OPPORTUNITY_PATTERNS) || matchesAny(combined, OPPORTUNITY_PATTERNS));

        if (!isApplication && !isRejection && !isInterview && !isAssessment && !isOffer && !isOpportunity) {
            return AnalysisResult.nonJob();
        }

        // 3. Determine Classification & Status
        EmailClassification classification;
        ApplicationStatus status;

        if (isOffer) {
            classification = EmailClassification.OFFER;
            status = ApplicationStatus.OFFER;
        } else if (isRejection) {
            classification = EmailClassification.REJECTION;
            status = ApplicationStatus.REJECTED;
        } else if (isInterview) {
            if (combined.contains("final round") || combined.contains("final interview") || lowerSubject.contains("final round") || lowerSubject.contains("final interview")) {
                classification = EmailClassification.INTERVIEW_INVITATION;
                status = ApplicationStatus.FINAL_INTERVIEW;
            } else if (combined.contains("screening call") || combined.contains("phone screen") || combined.contains("recruiter screen")) {
                classification = EmailClassification.INTERVIEW_INVITATION;
                status = ApplicationStatus.RECRUITER_SCREEN;
            } else if (combined.contains("interview confirmation") || combined.contains("interview is confirmed") || combined.contains("interview scheduled") || lowerSubject.contains("interview scheduled") || lowerSubject.contains("interview confirmed")) {
                classification = EmailClassification.INTERVIEW_SCHEDULED;
                status = ApplicationStatus.INTERVIEW;
            } else {
                classification = EmailClassification.INTERVIEW_INVITATION;
                status = ApplicationStatus.INTERVIEW;
            }
        } else if (isAssessment) {
            classification = EmailClassification.ASSESSMENT;
            status = ApplicationStatus.ASSESSMENT;
        } else if (isOpportunity) {
            classification = EmailClassification.NEW_OPPORTUNITY;
            status = ApplicationStatus.APPLIED;
        } else {
            classification = EmailClassification.APPLICATION_RECEIVED;
            status = ApplicationStatus.APPLIED;
        }

        // 4. Accurate Company Extraction
        String company = extractAccurateCompany(safeSubject, safeBody, safeSender, safeSenderEmail);
        if (company == null || company.isBlank() || isInvalidCompany(company)) {
            return AnalysisResult.nonJob();
        }

        // 5. Accurate Role Extraction
        String role = extractJobTitle(safeSubject, safeBody);

        String timelineNote = generateTimelineNote(classification, company, role);

        // 6. Recruiter & Contact Intelligence Extraction
        com.careermail.service.RecruiterIntelligenceService.RecruiterInfo recruiter = recruiterIntelligenceService.extractRuleBased(
                safeSubject, safeBody, safeSender, safeSenderEmail, company
        );

        AnalysisResult result = new AnalysisResult(
                true,
                company,
                role != null ? role : "Data Scientist",
                status,
                classification,
                "Remote",
                "Full-time",
                null,
                recruiter.getName(),
                recruiter.getEmail(),
                null,
                null,
                null,
                null,
                timelineNote,
                0.95
        );
        result.setRecruiterTitle(recruiter.getTitle());
        result.setRecruiterPhone(recruiter.getPhone());
        result.setRecruiterLinkedin(recruiter.getLinkedin());
        result.setRecruiterType(recruiter.getType());
        result.setContactConfidence(recruiter.getConfidence());
        result.setContactExtractionSource(recruiter.getSource());

        return result;
    }

    private boolean isJunkEmail(String lowerSubject, String combined, String sender, String senderEmail) {
        String lowerSender = sender != null ? sender.toLowerCase() : "";
        String lowerEmail = senderEmail != null ? senderEmail.toLowerCase() : "";

        // Reject all job board aggregators, marketing, newsletters, coffee, courses, digests
        if (lowerSender.contains("targetjobs") || lowerEmail.contains("targetjobs.co.uk") ||
            lowerSender.contains("exhale") || lowerEmail.contains("exhalecoffee") ||
            lowerSender.contains("nptel") || lowerEmail.contains("nptel") || lowerEmail.contains("iitm.ac.in") ||
            lowerSender.contains("adobe") || lowerSender.contains("spotify") ||
            lowerSender.contains("coursera") || lowerSender.contains("duolingo") ||
            lowerSender.contains("bill gates") || lowerSender.contains("google alert") ||
            lowerSender.contains("job alert") || lowerSender.contains("job alerts") ||
            lowerSender.contains("jobalert") || lowerEmail.contains("jobalert") ||
            lowerSender.contains("digest") || lowerSender.contains("newsletter")) {
            return true;
        }

        for (String junk : JUNK_PATTERNS) {
            if (lowerSubject.contains(junk) || combined.contains(junk)) {
                // If it's explicitly a direct confirmation from a company, allow it, else discard
                if (!lowerSubject.contains("thank you for applying") &&
                    !lowerSubject.contains("application was sent to") &&
                    !lowerSubject.contains("position confirmed") &&
                    !combined.contains("we received your application")) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean isInterviewEmail(String lowerSubject, String combined) {
        // Exclude interview tips, coaching, mock interviews, or advice articles
        if (lowerSubject.contains("interview tips") || lowerSubject.contains("interview prep") ||
            lowerSubject.contains("how to interview") || lowerSubject.contains("interview practice") ||
            lowerSubject.contains("mock interview") || lowerSubject.contains("interview question") ||
            lowerSubject.contains("preparing for your interview")) {
            return false;
        }

        // 1. Subject explicitly contains the word "interview" in application context
        boolean subjectHasInterview = lowerSubject.contains("interview") &&
                (lowerSubject.contains("invitation") || lowerSubject.contains("invite") ||
                 lowerSubject.contains("scheduled") || lowerSubject.contains("confirm") ||
                 lowerSubject.contains("round") || lowerSubject.contains("screening") ||
                 lowerSubject.contains("technical") || lowerSubject.contains("final") ||
                 lowerSubject.contains("video") || lowerSubject.contains("first") ||
                 lowerSubject.contains("stage") || lowerSubject.contains("slot") ||
                 lowerSubject.contains("with") || lowerSubject.contains("at") ||
                 lowerSubject.contains("for") || lowerSubject.contains("outcome") ||
                 lowerSubject.contains("time") || lowerSubject.contains("date"));

        // 2. Direct invitation / Slot booking phrasing in body or subject matching INTERVIEW_PATTERNS
        boolean matchesInterviewPatterns = matchesAny(lowerSubject, INTERVIEW_PATTERNS) || matchesAny(combined, INTERVIEW_PATTERNS);

        return subjectHasInterview || matchesInterviewPatterns;
    }

    private boolean isAssessmentEmail(String lowerSubject, String combined) {
        if (lowerSubject.contains("assessment") || lowerSubject.contains("coding test") ||
            lowerSubject.contains("hackerrank") || lowerSubject.contains("codesignal") ||
            lowerSubject.contains("take-home test") || lowerSubject.contains("online test")) {
            return true;
        }
        return matchesAny(lowerSubject, ASSESSMENT_PATTERNS) || matchesAny(combined, ASSESSMENT_PATTERNS);
    }

    private boolean isJobRejection(String combined, String lowerSubject) {
        // Exclude bank account / credit card rejections
        if (combined.contains("mobile banking app") || combined.contains("paypal credit") ||
            combined.contains("barclaycard") || combined.contains("aqua card") ||
            combined.contains("chase account")) {
            return false;
        }

        // Only initial position confirmations (like Revolut) require strict rejection decision phrases
        boolean isExplicitConfirmation = lowerSubject.contains("position confirmed") ||
                lowerSubject.contains("position is confirmed") ||
                lowerSubject.contains("application confirmed") ||
                lowerSubject.contains("your application was sent to");

        if (isExplicitConfirmation) {
            return combined.contains("regret to inform") ||
                    combined.contains("decided not to proceed") ||
                    combined.contains("decided not to move forward") ||
                    combined.contains("decided not to progress") ||
                    combined.contains("chosen to move forward with other candidates") ||
                    combined.contains("chosen to move forward") ||
                    combined.contains("not moving forward with your application") ||
                    combined.contains("will not be moving forward") ||
                    combined.contains("decided to pursue other candidates") ||
                    combined.contains("unsuccessful on this occasion");
        }

        if (!matchesAny(combined, REJECTION_PATTERNS)) {
            return false;
        }

        // Must contain job context words to avoid false positive rejections from newsletters
        return combined.contains("application") || combined.contains("candidacy") ||
                combined.contains("role") || combined.contains("position") ||
                combined.contains("interview") || combined.contains("applied") ||
                combined.contains("job search") || lowerSubject.contains("application") ||
                lowerSubject.contains("update on");
    }

    private boolean matchesAny(String text, List<String> patterns) {
        for (String pattern : patterns) {
            if (text.contains(pattern)) {
                return true;
            }
        }
        return false;
    }

    private String extractAccurateCompany(String subject, String body, String sender, String senderEmail) {
        String cleanSubject = subject.trim();

        // 1. LinkedIn Application: "Akarshan, your application was sent to Conquer AI"
        Pattern liPattern = Pattern.compile("your application was sent to\\s+([A-Za-z0-9&.,'’ -]{2,40}?)(?:!|\\.|\\n|$)", Pattern.CASE_INSENSITIVE);
        Matcher liMatcher = liPattern.matcher(cleanSubject);
        if (liMatcher.find()) {
            return cleanCompanyName(liMatcher.group(1));
        }

        // Specific company markers in subject & body
        if (cleanSubject.toLowerCase().contains("oliver wyman")) return "Oliver Wyman";
        if (cleanSubject.toLowerCase().contains("learning curve group") || cleanSubject.toLowerCase().contains("graduate software developer")) {
            return "Learning Curve Group";
        }
        if (cleanSubject.toLowerCase().contains("becoming a hueligan") || cleanSubject.toLowerCase().contains("hueligan")) return "Huel";
        if (cleanSubject.toLowerCase().contains("joining sage") || cleanSubject.toLowerCase().contains("sage careers")) return "Sage";
        if (cleanSubject.toLowerCase().contains("from abound") || cleanSubject.toLowerCase().contains("abound hiring team")) return "Abound";
        if (cleanSubject.toLowerCase().contains("junior data analyst, newcastle") || cleanSubject.toLowerCase().contains("weareams")) return "AMS";

        // 2. McKinsey: "thank you for your application to McKinsey & Company"
        Pattern mckPattern = Pattern.compile("thank(?:s| you) for (?:your )?application to\\s+([A-Za-z0-9&.,'’ -]{2,40}?)(?:!|\\.|\\n|$|,)", Pattern.CASE_INSENSITIVE);
        Matcher mckMatcher = mckPattern.matcher(cleanSubject);
        if (mckMatcher.find()) {
            return cleanCompanyName(mckMatcher.group(1));
        }

        // 3. Chattermill: "Thanks for applying to Chattermill Analytics Limited!"
        Pattern applyToPattern = Pattern.compile("thank(?:s| you) for applying (?:to|at)\\s+([A-Za-z0-9&.,'’ -]{2,40}?)(?:!|\\.|\\n|$|,)", Pattern.CASE_INSENSITIVE);
        Matcher applyToMatcher = applyToPattern.matcher(cleanSubject);
        if (applyToMatcher.find()) {
            return cleanCompanyName(applyToMatcher.group(1));
        }

        // 4. "position with Lucideon" / "position at Lucideon"
        Pattern withPattern = Pattern.compile("(?:position|role|job)\\s+(?:with|at)\\s+([A-Za-z0-9&.,'’ -]{2,30}?)(?:!|\\.|\\n|$|,)", Pattern.CASE_INSENSITIVE);
        Matcher withMatcher = withPattern.matcher(cleanSubject);
        if (withMatcher.find()) {
            return cleanCompanyName(withMatcher.group(1));
        }

        // 5. StackAdapt / Revolut: "Thank you for your interest in StackAdapt!"
        Pattern interestPattern = Pattern.compile("interest in\\s+([A-Za-z0-9&.,'’ -]{2,30}?)(?:!|\\.|\\n|$)", Pattern.CASE_INSENSITIVE);
        Matcher intMatcher = interestPattern.matcher(cleanSubject);
        if (intMatcher.find()) {
            return cleanCompanyName(intMatcher.group(1));
        }

        // Body "Thank you for your interest in Revolut!"
        Matcher intBodyMatcher = interestPattern.matcher(body);
        if (intBodyMatcher.find()) {
            String cand = cleanCompanyName(intBodyMatcher.group(1));
            if (cand != null && !isInvalidCompany(cand)) return cand;
        }

        // 6. "From Abound - thanks for your job application"
        Pattern fromPattern = Pattern.compile("^From\\s+([A-Za-z0-9&.,'’ -]{2,30}?)\\s*-\\s*thanks", Pattern.CASE_INSENSITIVE);
        Matcher fromMatcher = fromPattern.matcher(cleanSubject);
        if (fromMatcher.find()) {
            return cleanCompanyName(fromMatcher.group(1));
        }

        // 7. Domain name extraction from sender email (High reliability)
        if (senderEmail != null && senderEmail.contains("@")) {
            String domain = senderEmail.substring(senderEmail.indexOf("@") + 1).toLowerCase();
            if (domain.contains("learningcurvegroup.co.uk")) return "Learning Curve Group";
            if (domain.contains("sage.com")) return "Sage";
            if (domain.contains("revolut.com") || domain.contains("revolutpeople.com")) return "Revolut";
            if (domain.contains("huel.com")) return "Huel";
            if (domain.contains("weareams.com")) return "AMS";
            if (domain.contains("apply4u.co.uk")) return "Apply4U";
            if (domain.contains("lucideon.com")) return "Lucideon";
            if (domain.contains("comparethemarket.com")) return "Compare the Market";
            if (domain.contains("stackadapt.com")) return "StackAdapt";
            if (domain.contains("talenthawk.com")) return "Talent Hawk";
            if (domain.contains("chattermill.io")) return "Chattermill Analytics";
            if (domain.contains("knowbe4.com")) return "KnowBe4";
            if (domain.contains("sparkbox.ai")) return "Sparkbox";
            if (domain.contains("mckinsey.com")) return "McKinsey & Company";
            if (senderEmail.toLowerCase().startsWith("newcastle@myworkday")) return "Newcastle University";
            if (senderEmail.toLowerCase().startsWith("rbc@myworkday")) return "RBC";
            if (senderEmail.toLowerCase().startsWith("mmc@myworkday")) return "Oliver Wyman";

            String[] parts = domain.split("\\.");
            if (parts.length >= 2) {
                String sub = parts[parts.length - 2];
                if (!sub.equals("gmail") && !sub.equals("yahoo") && !sub.equals("outlook") &&
                        !sub.equals("linkedin") && !sub.equals("indeed") && !sub.equals("greenhouse") &&
                        !sub.equals("lever") && !sub.equals("workday") && !sub.equals("ashbyhq") &&
                        !sub.equals("talosats") && !sub.equals("teamtailor-mail") && sub.length() > 2) {
                    return cleanCompanyName(sub);
                }
            }
        }

        // 8. Sender Name Analysis
        if (sender != null && !sender.isBlank()) {
            String lowerSender = sender.toLowerCase().trim();
            if (lowerSender.contains("revolut")) return "Revolut";
            if (lowerSender.contains("huel")) return "Huel";
            if (lowerSender.contains("mckinsey")) return "McKinsey & Company";
            if (lowerSender.contains("knowbe4")) return "KnowBe4";
            if (lowerSender.contains("abound")) return "Abound";
            if (lowerSender.contains("sparkbox")) return "Sparkbox";
            if (lowerSender.contains("talent hawk")) return "Talent Hawk";
            if (lowerSender.contains("sage")) return "Sage";
            if (lowerSender.contains("tesco")) return "Tesco";
            if (lowerSender.contains("sony") || lowerSender.contains("playstation")) return "PlayStation Global";
            if (lowerSender.contains("chattermill")) return "Chattermill Analytics";
            if (lowerSender.contains("lucideon")) return "Lucideon";
            if (lowerSender.contains("abs careers") || lowerSender.contains("eagle.org")) return "American Bureau of Shipping (ABS)";

            if (!sender.contains("@")) {
                String cleanSender = sender.replaceAll("(?i)(Careers|Recruiting|Hiring|Talent|Team|HR|Jobs|University|Services|Acquisition|Apply|Candidate|Recruitment|People)", "").trim();
                cleanSender = cleanSender.replaceAll("(?i)[^a-zA-Z0-9&' -]", "").trim();
                if (cleanSender.length() >= 2 && !isStopWord(cleanSender) && !cleanSender.equalsIgnoreCase("LinkedIn") && !cleanSender.equalsIgnoreCase("Indeed")) {
                    return cleanCompanyName(cleanSender);
                }
            }
        }

        // 9. Body inspection for "Thank you for applying to <Company>"
        Pattern bodyApplyPattern = Pattern.compile("thank(?:s| you) for (?:your )?application to\\s+([A-Za-z0-9&.,'’ -]{2,30}?)(?:!|\\.|\\n|$|,)", Pattern.CASE_INSENSITIVE);
        Matcher bodyMatcher = bodyApplyPattern.matcher(body);
        if (bodyMatcher.find()) {
            return cleanCompanyName(bodyMatcher.group(1));
        }

        return null;
    }

    private String cleanCompanyName(String raw) {
        if (raw == null) return null;
        String clean = raw.trim();
        clean = clean.replaceAll("(?i)^(the|an|a)\\s+", "").trim();
        clean = clean.replaceAll("(?i)\\s+(ltd|limited|inc|incorporated|corp|corporation|llc|plc|gmbh|co\\.?|company|holdings|services|group|uk|recruitment|careers|talent|people|hiring|team)$", "").trim();
        clean = clean.replaceAll("(?i)[^a-zA-Z0-9&' -]", " ").replaceAll("\\s+", " ").trim();

        if (clean.equalsIgnoreCase("revolut") || clean.equalsIgnoreCase("revolut recruitment") || clean.equalsIgnoreCase("revolut people")) {
            return "Revolut";
        }
        if (clean.equalsIgnoreCase("mckinsey") || clean.equalsIgnoreCase("mckinsey company") || clean.equalsIgnoreCase("mckinsey & company") || clean.equalsIgnoreCase("mckinsey &")) {
            return "McKinsey & Company";
        }
        if (clean.equalsIgnoreCase("chattermill") || clean.equalsIgnoreCase("chattermill analytics")) {
            return "Chattermill Analytics";
        }
        if (clean.equalsIgnoreCase("eagle") || clean.equalsIgnoreCase("american bureau of shipping") || clean.equalsIgnoreCase("abs") || clean.equalsIgnoreCase("abs careers")) {
            return "American Bureau of Shipping (ABS)";
        }
        if (clean.equalsIgnoreCase("compare the market") || clean.equalsIgnoreCase("comparethemarket")) {
            return "Compare the Market";
        }
        if (clean.equalsIgnoreCase("lucideon limited") || clean.equalsIgnoreCase("lucideon")) {
            return "Lucideon";
        }
        if (clean.equalsIgnoreCase("stackadapt") || clean.equalsIgnoreCase("stack adapt")) {
            return "StackAdapt";
        }
        if (clean.equalsIgnoreCase("spg resourcing")) {
            return "SPG Resourcing";
        }
        if (clean.equalsIgnoreCase("tria")) {
            return "TRIA";
        }
        if (clean.equalsIgnoreCase("experis uk") || clean.equalsIgnoreCase("experis")) {
            return "Experis UK";
        }
        if (clean.equalsIgnoreCase("playstation global") || clean.equalsIgnoreCase("playstation")) {
            return "PlayStation Global";
        }
        if (clean.equalsIgnoreCase("knowbe4")) {
            return "KnowBe4";
        }
        if (clean.equalsIgnoreCase("pdi technologies")) {
            return "PDI Technologies";
        }
        if (clean.equalsIgnoreCase("sage") || clean.equalsIgnoreCase("joining sage")) {
            return "Sage";
        }
        if (clean.equalsIgnoreCase("abound") || clean.equalsIgnoreCase("joining us")) {
            return "Abound";
        }
        if (clean.equalsIgnoreCase("huel") || clean.equalsIgnoreCase("becoming a hueligan") || clean.equalsIgnoreCase("hueligan")) {
            return "Huel";
        }
        if (clean.equalsIgnoreCase("ams") || clean.equalsIgnoreCase("this role") || clean.equalsIgnoreCase("weareams")) {
            return "AMS";
        }
        return capitalize(clean);
    }

    private boolean isInvalidCompany(String name) {
        if (name == null || name.length() < 2) return true;
        String lower = name.toLowerCase().trim();
        List<String> invalid = Arrays.asList(
                "applying", "junior", "data", "position", "role", "application", "rest of my life",
                "uk visa", "asda", "asda rewards", "github", "linkedin", "indeed", "autofill",
                "your", "team", "careers", "jobs", "hiring", "recruitment", "notification",
                "update", "early", "early careers", "target", "targetjobs", "target jobs", "grayce",
                "exhale", "exhale coffee", "exhale healthy coffee", "liberty", "rewards",
                "adobe for students", "bill gates via linkedin", "internal recruitment", "recruitment team", "talent team"
        );
        return invalid.contains(lower);
    }

    private String extractJobTitle(String subject, String body) {
        String full = subject + "\n" + body;

        // Check LinkedIn body format: "Your application was sent to Company\n\nJob Title\nCompany"
        Pattern liBodyPattern = Pattern.compile("Your application was sent to [^\n]+\n+([A-Za-z0-9 /&–—-]{4,50})\n", Pattern.CASE_INSENSITIVE);
        Matcher liBodyMatcher = liBodyPattern.matcher(body);
        if (liBodyMatcher.find()) {
            String roleCandidate = liBodyMatcher.group(1).trim();
            if (!isStopWord(roleCandidate) && roleCandidate.length() >= 4 && !roleCandidate.contains("http")) {
                return capitalize(roleCandidate);
            }
        }

        // Check explicit role pattern in subject e.g. "Application to Graduate Programme 2027: Data Scientist and Analyst position confirmed"
        Pattern progPattern = Pattern.compile("Application to (?:[A-Za-z0-9 ]+: )?([A-Za-z0-9 /&–—-]{4,50}?)(?:\\s+position confirmed|\\s+position is confirmed|\\s+confirmed)", Pattern.CASE_INSENSITIVE);
        Matcher progMatcher = progPattern.matcher(subject);
        if (progMatcher.find()) {
            String cand = progMatcher.group(1).trim();
            if (!isStopWord(cand) && cand.length() >= 4) {
                return capitalize(cand);
            }
        }

        // Check explicit role pattern in subject e.g. "application for Junior Data Scientist - AI Practice Team"
        Pattern p = Pattern.compile("(?:application for|applied for|role of|position of|position with|applying for the)\\s+([A-Za-z0-9 /&–—-]{4,50}?)(?:\\s+position|\\s+role|\\s+at\\s+|\\s+with\\s+|\\s+-\\s+\\d+|!|\\.|\\n|,|$)", Pattern.CASE_INSENSITIVE);
        Matcher m = p.matcher(subject);
        if (m.find()) {
            String cand = m.group(1).trim();
            if (!isStopWord(cand) && cand.length() >= 4) {
                return capitalize(cand);
            }
        }

        // Check body pattern e.g. "received your application for Graduate Programme 2027: Data Scientist and Analyst"
        Pattern bodyRecPattern = Pattern.compile("received your application for (?:[A-Za-z0-9 ]+: )?([A-Za-z0-9 /&–—-]{4,50}?)(?:,|\\.|\\n|and we)", Pattern.CASE_INSENSITIVE);
        Matcher bodyRecMatcher = bodyRecPattern.matcher(body);
        if (bodyRecMatcher.find()) {
            String cand = bodyRecMatcher.group(1).trim();
            if (!isStopWord(cand) && cand.length() >= 4 && !cand.contains("http")) {
                return capitalize(cand);
            }
        }

        for (String role : KNOWN_ROLES) {
            if (Pattern.compile("\\b" + Pattern.quote(role) + "\\b", Pattern.CASE_INSENSITIVE).matcher(full).find()) {
                return role;
            }
        }

        return "Data Scientist";
    }

    private String generateTimelineNote(EmailClassification classification, String company, String role) {
        return switch (classification) {
            case OFFER -> "Offer received from " + company + " for " + role + "!";
            case REJECTION -> "Application closed for " + role + " at " + company + ".";
            case INTERVIEW_INVITATION, INTERVIEW_SCHEDULED -> "Interview invitation received for " + role + " at " + company + ".";
            case ASSESSMENT -> "Assessment invitation received for " + role + " at " + company + ".";
            default -> "Application submitted for " + role + " at " + company + ".";
        };
    }

    private boolean isStopWord(String word) {
        if (word == null) return true;
        String w = word.toLowerCase().trim();
        return Arrays.asList("the", "and", "for", "with", "your", "this", "from", "that", "have", "been", "applied", "applying", "position", "role", "jobs").contains(w);
    }

    private String capitalize(String str) {
        if (str == null || str.isEmpty()) return str;
        String[] words = str.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (String w : words) {
            if (w.length() > 0) {
                if (w.equalsIgnoreCase("&") || w.equalsIgnoreCase("and") || w.equalsIgnoreCase("of") || w.equalsIgnoreCase("for")) {
                    sb.append(w.toLowerCase()).append(" ");
                } else if (w.equalsIgnoreCase("ai") || w.equalsIgnoreCase("sql") || w.equalsIgnoreCase("ml") || w.equalsIgnoreCase("sde")) {
                    sb.append(w.toUpperCase()).append(" ");
                } else {
                    sb.append(Character.toUpperCase(w.charAt(0))).append(w.substring(1).toLowerCase()).append(" ");
                }
            }
        }
        return sb.toString().trim();
    }
}
