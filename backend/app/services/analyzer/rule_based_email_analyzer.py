import re
from datetime import datetime, timedelta
from app.models.enums import EmailClassification, ApplicationStatus
from app.services.analyzer.analysis_result import EmailAnalysisResult
from app.services.recruiter_intelligence_service import RecruiterIntelligenceService


class RuleBasedEmailAnalyzer:
    def __init__(self, recruiter_service: RecruiterIntelligenceService | None = None):
        self.recruiter_service = recruiter_service or RecruiterIntelligenceService()

    def analyze(self, sender: str, sender_email: str, subject: str, body: str) -> EmailAnalysisResult:
        result = EmailAnalysisResult()
        clean_subj = subject.strip()
        clean_body = body.strip()
        full_text = f"{clean_subj}\n{clean_body}".lower()

        # 1. Quick Junk Filter
        if self._is_junk_or_spam(sender_email, full_text):
            result.is_job_related = False
            return result

        # 2. Extract Company & Role
        company = self._extract_company(sender, sender_email, clean_subj, clean_body)
        role = self._extract_role(clean_subj, clean_body)
        result.detected_company = company
        result.detected_role = role

        # 3. Recruiter Intelligence Extraction
        result.recruiter_info = self.recruiter_service.extract_recruiter_info(
            sender, sender_email, clean_subj, clean_body, company
        )

        # 4. Classification Rules in Priority Order:
        # A. Job Offer (Highest Priority)
        if self._is_offer(full_text):
            result.is_job_related = True
            result.classification = EmailClassification.OFFER
            result.suggested_status = ApplicationStatus.OFFER
            result.confidence_score = 0.95
            result.timeline_title = "Formal Job Offer Received!"
            result.timeline_description = f"Offer letter received from {company or 'employer'}"
            return result

        # B. Interview Invitation / Scheduled
        if self._is_interview(full_text):
            result.is_job_related = True
            result.classification = EmailClassification.INTERVIEW_INVITATION
            result.suggested_status = ApplicationStatus.INTERVIEW
            result.confidence_score = 0.92
            result.timeline_title = "Interview Scheduled"
            result.timeline_description = f"Interview with {company or 'team'}"
            result.meeting_link = self._extract_meeting_link(clean_body)
            result.interview_type = "Technical Interview" if "technical" in full_text or "coding" in full_text else "Recruiter Screen"
            result.interview_date = datetime.utcnow() + timedelta(days=2, hours=3)
            return result

        # C. Assessment / Test
        if self._is_assessment(full_text):
            result.is_job_related = True
            result.classification = EmailClassification.ASSESSMENT
            result.suggested_status = ApplicationStatus.ASSESSMENT
            result.confidence_score = 0.90
            result.timeline_title = "Assessment / Coding Test Received"
            result.timeline_description = f"Online assessment for {role or 'the role'} from {company or 'employer'}"
            return result

        # D. Rejection
        if self._is_rejection(full_text):
            result.is_job_related = True
            result.classification = EmailClassification.REJECTION
            result.suggested_status = ApplicationStatus.REJECTED
            result.confidence_score = 0.92
            result.timeline_title = "Application Status Update: Not Moving Forward"
            result.timeline_description = f"Decision received from {company or 'employer'}"
            return result

        # E. New Opportunity / Recruiter Reachout
        if self._is_opportunity(full_text):
            result.is_job_related = True
            result.classification = EmailClassification.NEW_OPPORTUNITY
            result.suggested_status = ApplicationStatus.APPLIED
            result.confidence_score = 0.88
            result.timeline_title = "Recruiter Opportunity Inbound"
            result.timeline_description = f"Recruiter reachout from {company or 'hiring team'}"
            return result

        # F. Application Confirmation / Submitted
        if self._is_confirmation(full_text):
            result.is_job_related = True
            result.classification = EmailClassification.APPLICATION_RECEIVED
            result.suggested_status = ApplicationStatus.APPLIED
            result.confidence_score = 0.85
            result.timeline_title = "Application Confirmed"
            result.timeline_description = f"Application received by {company or 'employer'}"
            return result

        # G. General Job Related
        if self._is_general_job_related(full_text):
            result.is_job_related = True
            result.classification = EmailClassification.OTHER_JOB_RELATED
            result.confidence_score = 0.65
            return result

        return result

    def _is_junk_or_spam(self, email: str, text: str) -> bool:
        junk_senders = ["marketing@", "promo@", "deals@", "newsletter@", "uber@", "ubereats@", "deliveroo-order@", "amazon-order@", "receipts@"]
        if any(j in email.lower() for j in junk_senders):
            return True
        spam_keywords = ["unsubscribe", "privacy policy update", "your order has shipped", "tracking number", "promo code", "discount code"]
        if sum(1 for kw in spam_keywords if kw in text) >= 2 and not any(kw in text for kw in ["interview", "application", "hiring", "job offer", "recruiter"]):
            return True
        return False

    def _is_offer(self, text: str) -> bool:
        patterns = [
            r"offer of employment",
            r"pleased to offer you",
            r"delighted to offer you",
            r"formal offer",
            r"written offer",
            r"congratulations on your offer",
            r"offer letter attached",
            r"job offer for",
            r"compensation package"
        ]
        return any(re.search(p, text, re.IGNORECASE) for p in patterns)

    def _is_interview(self, text: str) -> bool:
        patterns = [
            r"invitation to interview",
            r"interview invitation",
            r"invite you to an interview",
            r"schedule an interview",
            r"schedule a call",
            r"technical interview",
            r"system design interview",
            r"coding interview",
            r"chat with the team",
            r"speak with our hiring manager",
            r"meet\.google\.com",
            r"zoom\.us\/j\/",
            r"calendly\.com",
            r"next round of interviews"
        ]
        return any(re.search(p, text, re.IGNORECASE) for p in patterns)

    def _is_assessment(self, text: str) -> bool:
        patterns = [
            r"online assessment",
            r"coding assessment",
            r"hackerrank",
            r"codility",
            r"codesignal",
            r"take-home challenge",
            r"technical test",
            r"complete the test"
        ]
        return any(re.search(p, text, re.IGNORECASE) for p in patterns)

    def _is_rejection(self, text: str) -> bool:
        patterns = [
            r"unfortunately",
            r"not moving forward",
            r"pursue other candidates",
            r"decided to move forward with other",
            r"other applicants",
            r"will not be moving forward",
            r"not selected for an interview",
            r"not a fit at this time",
            r"wish you the best in your job search"
        ]
        return any(re.search(p, text, re.IGNORECASE) for p in patterns)

    def _is_opportunity(self, text: str) -> bool:
        patterns = [
            r"exciting (?:new )?opportunity",
            r"came across your profile",
            r"saw your background",
            r"thought you might be interested in",
            r"reaching out regarding a role",
            r"would you be open for a call",
            r"new opening for",
            r"potential fit for"
        ]
        return any(re.search(p, text, re.IGNORECASE) for p in patterns)

    def _is_confirmation(self, text: str) -> bool:
        patterns = [
            r"thank you for applying",
            r"thanks for applying",
            r"application received",
            r"application submitted",
            r"received your application",
            r"we have received your resume",
            r"application confirmation"
        ]
        return any(re.search(p, text, re.IGNORECASE) for p in patterns)

    def _is_general_job_related(self, text: str) -> bool:
        patterns = [r"recruiter", r"hiring manager", r"talent acquisition", r"job application", r"candidate status", r"interview process"]
        return any(re.search(p, text, re.IGNORECASE) for p in patterns)

    def _extract_company(self, sender: str, email: str, subject: str, body: str) -> str | None:
        # Check domain first
        domain_match = re.search(r"@([a-zA-Z0-9.-]+)\.([a-zA-Z]{2,})", email)
        if domain_match:
            dom = domain_match.group(1).lower()
            if dom not in ["gmail", "yahoo", "hotmail", "outlook", "icloud", "mail", "greenhouse", "lever", "workable", "ashbyhq"]:
                return dom.capitalize()

        # Check subject patterns: "at [Company]" or "[Company] - Application"
        at_match = re.search(r"\bat\s+([A-Z][a-zA-Z0-9\s&]+?)(?:\s+for|\s+-\s+|\s+\(|$|\.|\!)", subject)
        if at_match:
            cand = at_match.group(1).strip()
            if len(cand) > 1 and len(cand.split()) <= 4:
                return cand

        # Check sender name
        if sender and not any(k in sender.lower() for k in ["notification", "careers", "talent", "support", "no-reply"]):
            parts = sender.split()
            if len(parts) <= 3:
                return sender.strip()

        return None

    def _extract_role(self, subject: str, body: str) -> str | None:
        patterns = [
            r"(?:role|position|job|for)\s*:\s*([A-Za-z\s\/\-\#\.\+]+?)(?:\s+at|\s+with|\s+\-|\s+\(|$|\.|\!)",
            r"(?:for the)\s+([A-Za-z\s\/\-\#\.\+]+?)\s+(?:role|position)",
            r"(Software Engineer|Backend Developer|Frontend Developer|Full Stack Engineer|Data Scientist|Machine Learning Engineer|DevOps Engineer|Python Developer)"
        ]
        for p in patterns:
            m = re.search(p, subject, re.IGNORECASE)
            if m:
                cand = m.group(1).strip()
                if 3 <= len(cand) <= 50:
                    return cand

        return "Software Engineer"

    def _extract_meeting_link(self, text: str) -> str | None:
        m = re.search(r"(https:\/\/(?:meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}|[a-zA-Z0-9.-]+\.zoom\.us\/j\/\d+|teams\.microsoft\.com\/l\/meetup-join\/[^\s\>]+))", text)
        return m.group(1) if m else None
