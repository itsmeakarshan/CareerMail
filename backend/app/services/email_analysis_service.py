import re
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from app.models.models import Email, JobApplication, TimelineEvent, Interview, FollowUp
from app.models.enums import ApplicationStatus, EmailClassification, InterviewStatus, FollowUpStatus, RecruiterType
from app.services.analyzer.rule_based_email_analyzer import RuleBasedEmailAnalyzer
from app.services.analyzer.analysis_result import EmailAnalysisResult


class EmailAnalysisService:
    def __init__(self, db: Session, analyzer: RuleBasedEmailAnalyzer | None = None):
        self.db = db
        self.analyzer = analyzer or RuleBasedEmailAnalyzer()

    def process_and_link_email(self, email: Email, user_id: int) -> EmailAnalysisResult:
        result = self.analyzer.analyze(
            sender=email.sender,
            sender_email=email.sender_email,
            subject=email.subject,
            body=email.body
        )

        email.is_job_related = result.is_job_related
        if not result.is_job_related:
            email.processed_at = datetime.utcnow()
            return result

        email.classification = result.classification.value if result.classification else None
        email.detected_company = result.detected_company
        email.detected_role = result.detected_role
        email.detected_status = result.suggested_status.value if result.suggested_status else None

        if result.recruiter_info:
            email.detected_recruiter_name = result.recruiter_info.name
            email.detected_recruiter_email = result.recruiter_info.email
            email.detected_recruiter_title = result.recruiter_info.title
            email.detected_recruiter_type = result.recruiter_info.recruiter_type.value
            email.detected_recruiter_confidence = result.recruiter_info.confidence

        email.processed_at = datetime.utcnow()

        # Try to find or link existing JobApplication
        app = None
        if result.detected_company:
            comp_clean = result.detected_company.strip().lower()
            app = (
                self.db.query(JobApplication)
                .filter(
                    JobApplication.user_id == user_id,
                    JobApplication.company.ilike(f"%{comp_clean}%")
                )
                .first()
            )

        if not app and result.detected_company and result.classification != EmailClassification.REJECTION:
            # Auto-create new application
            logo = re.sub(r"[^a-z0-9]", "", result.detected_company.lower())
            app = JobApplication(
                user_id=user_id,
                company=result.detected_company,
                title=result.detected_role or "Software Engineer",
                location="Remote / Hybrid",
                employment_type="Full-time",
                date_applied=date.today(),
                status=result.suggested_status.value if result.suggested_status else ApplicationStatus.APPLIED.value,
                company_logo=logo,
                source="Email Inbound",
                recruiter_name=result.recruiter_info.name,
                recruiter_email=result.recruiter_info.email,
                recruiter_title=result.recruiter_info.title,
                recruiter_phone=result.recruiter_info.phone,
                recruiter_linkedin=result.recruiter_info.linkedin_url,
                recruiter_type=result.recruiter_info.recruiter_type.value,
                contact_confidence=result.recruiter_info.confidence,
                contact_extraction_source=result.recruiter_info.extraction_source,
                last_activity_date=date.today(),
                activity_subtitle=f"Inbound from {result.detected_company}",
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            app.timeline_events.append(TimelineEvent(
                title=f"Application Initialized: {app.title}",
                description=f"Auto-created from email inbound: '{email.subject}'",
                event_date=datetime.utcnow(),
                event_type="EMAIL_INBOUND"
            ))
            self.db.add(app)
            self.db.commit()
            self.db.refresh(app)

        if app:
            email.job_application_id = app.id

            # Apply Status Upgrade if higher or Rejection/Offer
            if result.suggested_status:
                self._update_application_status(app, result.suggested_status, result.timeline_title, result.timeline_description)

            # Update Recruiter if higher confidence
            if result.recruiter_info and result.recruiter_info.confidence > (app.contact_confidence or 0):
                if result.recruiter_info.name:
                    app.recruiter_name = result.recruiter_info.name
                if result.recruiter_info.email:
                    app.recruiter_email = result.recruiter_info.email
                if result.recruiter_info.title:
                    app.recruiter_title = result.recruiter_info.title
                if result.recruiter_info.phone:
                    app.recruiter_phone = result.recruiter_info.phone
                if result.recruiter_info.linkedin_url:
                    app.recruiter_linkedin = result.recruiter_info.linkedin_url
                app.recruiter_type = result.recruiter_info.recruiter_type.value
                app.contact_confidence = result.recruiter_info.confidence
                app.contact_extraction_source = result.recruiter_info.extraction_source

            # Auto-schedule Interview if detected
            if result.classification == EmailClassification.INTERVIEW_INVITATION:
                int_date = result.interview_date or (datetime.utcnow() + timedelta(days=2, hours=3))
                existing_int = (
                    self.db.query(Interview)
                    .filter(Interview.job_application_id == app.id, Interview.user_id == user_id)
                    .first()
                )
                if not existing_int:
                    intv = Interview(
                        user_id=user_id,
                        job_application_id=app.id,
                        company=app.company,
                        title=f"{result.interview_type or 'Technical Interview'} - {app.company}",
                        interview_date=int_date,
                        type=result.interview_type or "Technical Interview",
                        interviewer=result.recruiter_info.name or "Hiring Team",
                        location="Google Meet",
                        meeting_link=result.meeting_link or "https://meet.google.com/new",
                        status=InterviewStatus.SCHEDULED.value,
                        company_logo=app.company_logo
                    )
                    self.db.add(intv)

            # Auto-schedule FollowUp if assessment
            if result.classification == EmailClassification.ASSESSMENT:
                existing_fol = (
                    self.db.query(FollowUp)
                    .filter(FollowUp.job_application_id == app.id, FollowUp.user_id == user_id)
                    .first()
                )
                if not existing_fol:
                    fol = FollowUp(
                        user_id=user_id,
                        job_application_id=app.id,
                        company=app.company,
                        role=app.title,
                        due_date=date.today() + timedelta(days=3),
                        applied_subtitle="Assessment Active",
                        status=FollowUpStatus.PENDING.value,
                        company_logo=app.company_logo,
                        notes="Complete and submit online assessment."
                    )
                    self.db.add(fol)

            app.last_activity_date = date.today()
            app.updated_at = datetime.utcnow()
            self.db.commit()

        return result

    def _update_application_status(
        self,
        app: JobApplication,
        new_status: ApplicationStatus,
        title: str | None,
        description: str | None
    ):
        status_rank = {
            ApplicationStatus.APPLIED: 1,
            ApplicationStatus.ASSESSMENT: 2,
            ApplicationStatus.RECRUITER_SCREEN: 3,
            ApplicationStatus.INTERVIEW: 4,
            ApplicationStatus.FINAL_INTERVIEW: 5,
            ApplicationStatus.OFFER: 6,
            ApplicationStatus.REJECTED: 7,
            ApplicationStatus.WITHDRAWN: 8,
        }

        current_rank = status_rank.get(ApplicationStatus.from_string(app.status), 1)
        target_rank = status_rank.get(new_status, 1)

        # Allow upgrade if higher rank or offer/rejection
        if target_rank > current_rank or new_status in (ApplicationStatus.OFFER, ApplicationStatus.REJECTED):
            app.status = new_status.value
            subtitle_map = {
                ApplicationStatus.ASSESSMENT: "Assessment invited",
                ApplicationStatus.RECRUITER_SCREEN: "Screening call",
                ApplicationStatus.INTERVIEW: "Technical Interview",
                ApplicationStatus.FINAL_INTERVIEW: "Final Round",
                ApplicationStatus.OFFER: "Offer Received 🎉",
                ApplicationStatus.REJECTED: "Application closed",
            }
            app.activity_subtitle = subtitle_map.get(new_status, "Status updated")

            app.timeline_events.append(TimelineEvent(
                title=title or f"Moved to {new_status.get_display_name()}",
                description=description or f"Updated via incoming email",
                event_date=datetime.utcnow(),
                event_type=new_status.value
            ))
