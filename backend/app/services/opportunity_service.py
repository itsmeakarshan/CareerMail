import re
from datetime import datetime, date
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import Email, JobApplication, TimelineEvent
from app.models.enums import EmailClassification, ApplicationStatus, RecruiterType
from app.schemas.opportunity import OpportunityDTO, OpportunityScanResult
from app.schemas.application import JobApplicationResponse
from app.services.email_analysis_service import EmailAnalysisService


class OpportunityService:
    def __init__(self, db: Session, analysis_service: EmailAnalysisService | None = None):
        self.db = db
        self.analysis_service = analysis_service or EmailAnalysisService(db)

    def get_opportunities(self, user_id: int) -> list[OpportunityDTO]:
        emails = (
            self.db.query(Email)
            .filter(
                Email.user_id == user_id,
                Email.classification == EmailClassification.NEW_OPPORTUNITY.value
            )
            .order_by(Email.timestamp.desc())
            .all()
        )

        opportunities = []
        for e in emails:
            opp = self._map_to_opportunity_dto(e)
            opportunities.append(opp)

        return opportunities

    def convert_to_application(self, user_id: int, email_id: int) -> JobApplication:
        email = (
            self.db.query(Email)
            .filter(Email.id == email_id, Email.user_id == user_id)
            .first()
        )
        if not email:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Email opportunity not found with ID: {email_id}"
            )

        if email.job_application_id:
            existing = (
                self.db.query(JobApplication)
                .filter(JobApplication.id == email.job_application_id, JobApplication.user_id == user_id)
                .first()
            )
            if existing:
                return existing

        company = email.detected_company or (email.sender if email.sender and len(email.sender.split()) <= 3 else "Unknown Company")
        title = email.detected_role or "Software Engineer"
        logo = re.sub(r"[^a-z0-9]", "", company.lower())

        app = JobApplication(
            user_id=user_id,
            company=company,
            title=title,
            location="Remote / Hybrid",
            employment_type="Full-time",
            date_applied=date.today(),
            status=ApplicationStatus.APPLIED.value,
            recruiter_name=email.detected_recruiter_name or email.sender,
            recruiter_email=email.detected_recruiter_email or email.sender_email,
            recruiter_title=email.detected_recruiter_title,
            recruiter_type=email.detected_recruiter_type or RecruiterType.HUMAN_RECRUITER.value,
            contact_confidence=email.detected_recruiter_confidence or 85,
            source="Email Opportunity Inbound",
            notes=f"Converted from inbound opportunity email: '{email.subject}'",
            company_logo=logo,
            activity_subtitle="Converted from Opportunity",
            last_activity_date=date.today(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        app.timeline_events.append(TimelineEvent(
            title=f"Converted Opportunity to Active Application",
            description=f"Inbound opportunity from {company} converted to tracked application.",
            event_date=datetime.utcnow(),
            event_type="CONVERTED_OPPORTUNITY"
        ))

        self.db.add(app)
        self.db.commit()
        self.db.refresh(app)

        email.job_application_id = app.id
        self.db.commit()

        return app

    def scan_for_opportunities(self, user_id: int) -> OpportunityScanResult:
        unprocessed_emails = (
            self.db.query(Email)
            .filter(Email.user_id == user_id)
            .all()
        )

        found_count = 0
        for e in unprocessed_emails:
            res = self.analysis_service.process_and_link_email(e, user_id)
            if res.classification == EmailClassification.NEW_OPPORTUNITY:
                found_count += 1

        self.db.commit()
        opps = self.get_opportunities(user_id)

        return OpportunityScanResult(
            success=True,
            scanned_count=len(unprocessed_emails),
            opportunities_count=len(opps),
            opportunities_found=found_count,
            message=f"Scanned {len(unprocessed_emails)} emails. Discovered {len(opps)} relevant opportunities.",
            opportunities=opps
        )

    def _map_to_opportunity_dto(self, email: Email) -> OpportunityDTO:
        company = email.detected_company or email.sender
        role = email.detected_role or "Software Engineer"
        snippet = email.preview or (email.body[:150] + "..." if len(email.body) > 150 else email.body)

        tags = ["Inbound"]
        if "remote" in email.body.lower():
            tags.append("Remote")
        if "senior" in (role or "").lower():
            tags.append("Senior")
        elif "junior" in (role or "").lower() or "graduate" in (role or "").lower():
            tags.append("Entry Level")
        else:
            tags.append("Full-time")

        return OpportunityDTO(
            id=email.id,
            company=company,
            role=role,
            recruiter_name=email.detected_recruiter_name or email.sender,
            recruiter_email=email.detected_recruiter_email or email.sender_email,
            subject=email.subject,
            snippet=snippet,
            full_body=email.body,
            body=email.body,
            received_at=email.timestamp,
            timestamp=email.timestamp,
            location="Remote / Hybrid",
            salary="Competitive",
            opportunity_type="Recruiter Reachout",
            type="Recruiter Reachout",
            is_converted=email.job_application_id is not None,
            converted=email.job_application_id is not None,
            application_id=email.job_application_id,
            tags=tags,
            is_dismissed=False,
            dismissed=False
        )
