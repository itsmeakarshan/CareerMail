import re
import logging
from app.models.enums import RecruiterType
from app.services.analyzer.analysis_result import RecruiterContactInfo

logger = logging.getLogger(__name__)


class RecruiterIntelligenceService:
    NO_REPLY_PATTERNS = [
        r"no[-_]?reply",
        r"donotreply",
        r"notifications?@",
        r"automated@",
        r"mailer[-_]?daemon",
        r"alerts?@",
        r"system@",
        r"jobs-noreply@",
        r"apply@",
        r"careers@",
        r"talent@",
        r"recruiting@",
        r"hr@",
        r"info@"
    ]

    RECRUITER_TITLE_KEYWORDS = [
        "technical recruiter", "senior recruiter", "talent acquisition partner",
        "talent acquisition lead", "talent acquisition specialist", "talent acquisition manager",
        "recruiting coordinator", "recruiting partner", "lead recruiter", "recruiter",
        "headhunter", "talent scout", "hiring partner", "people ops", "head of talent"
    ]

    SIGN_OFF_PATTERNS = [
        r"(?:Best regards|Kind regards|Regards|Warmly|Thanks & regards|Sincerely|Best),\s*\n+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})",
        r"(?:Thanks|Cheers|Best),\s*\n+([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})"
    ]

    PHONE_PATTERN = r"(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}"
    LINKEDIN_PATTERN = r"https?:\/\/(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)"

    def extract_recruiter_info(
        self,
        sender_name: str,
        sender_email: str,
        subject: str,
        body: str,
        detected_company: str | None = None
    ) -> RecruiterContactInfo:
        # Check if automated
        is_automated = any(re.search(p, sender_email, re.IGNORECASE) for p in self.NO_REPLY_PATTERNS)
        
        info = RecruiterContactInfo()
        info.email = sender_email

        # Search for LinkedIn
        li_match = re.search(self.LINKEDIN_PATTERN, body, re.IGNORECASE)
        if li_match:
            info.linkedin_url = li_match.group(0)

        # Search for Phone
        phone_match = re.search(self.PHONE_PATTERN, body)
        if phone_match:
            info.phone = phone_match.group(0)

        # Search for Title in Body / Signature
        body_lower = body.lower()
        for title_kw in self.RECRUITER_TITLE_KEYWORDS:
            if title_kw in body_lower:
                info.title = title_kw.title()
                break

        # Search Sign-off name
        sign_off_name = None
        for pattern in self.SIGN_OFF_PATTERNS:
            m = re.search(pattern, body, re.IGNORECASE)
            if m:
                extracted = m.group(1).strip()
                if len(extracted.split()) <= 4 and not any(kw in extracted.lower() for kw in ["team", "careers", "company", "recruiting", "support", "hiring"]):
                    sign_off_name = extracted
                    break

        if not is_automated and sender_name and not self._is_generic_sender_name(sender_name):
            info.name = sender_name.strip()
            info.recruiter_type = RecruiterType.HUMAN_RECRUITER
            info.confidence = 90
            info.extraction_source = "Sender Header Analysis"
        elif sign_off_name:
            info.name = sign_off_name
            info.recruiter_type = RecruiterType.HUMAN_RECRUITER
            info.confidence = 85
            info.extraction_source = "Email Signature Block"
        elif is_automated:
            info.name = sender_name if (sender_name and not self._is_generic_sender_name(sender_name)) else f"{detected_company or 'Company'} Automated System"
            info.recruiter_type = RecruiterType.AUTOMATED_SYSTEM
            info.confidence = 95
            info.extraction_source = "Automated System Detection"
        else:
            info.name = sender_name if sender_name else "Hiring Coordinator"
            info.recruiter_type = RecruiterType.POSSIBLE_RECRUITER
            info.confidence = 50
            info.extraction_source = "Heuristic Pattern"

        return info

    def _is_generic_sender_name(self, name: str) -> bool:
        generic = ["team", "careers", "recruiting", "talent", "support", "jobs", "hiring", "notifications", "google", "amazon", "meta", "apple", "microsoft"]
        clean = name.lower().strip()
        return any(g == clean or f" {g}" in clean for g in generic)
