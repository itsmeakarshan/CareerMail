import re
from datetime import datetime, date
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from app.models.models import JobApplication, TimelineEvent, Email
from app.models.enums import ApplicationStatus, Priority, RecruiterType
from app.schemas.application import JobApplicationRequest


class JobApplicationService:
    def __init__(self, db: Session):
        self.db = db

    def get_all_applications(self, user_id: int) -> list[JobApplication]:
        return (
            self.db.query(JobApplication)
            .filter(JobApplication.user_id == user_id)
            .order_by(JobApplication.date_applied.desc().nullslast(), JobApplication.created_at.desc())
            .all()
        )

    def get_application_by_id(self, user_id: int, app_id: int) -> JobApplication:
        app = (
            self.db.query(JobApplication)
            .filter(JobApplication.id == app_id, JobApplication.user_id == user_id)
            .first()
        )
        if not app:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Job application not found with ID: {app_id}"
            )
        return app

    def create_application(self, user_id: int, request: JobApplicationRequest) -> JobApplication:
        if not request.company or not request.company.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Company is required")
        if not request.title or not request.title.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required")

        company = request.company.strip()
        title = request.title.strip()
        app_status = ApplicationStatus.from_string(request.status).value
        priority = Priority.from_string(request.priority).value

        logo = request.company_logo.strip() if request.company_logo and request.company_logo.strip() else re.sub(r"[^a-z0-9]", "", company.lower())
        applied_date = request.date_applied or date.today()

        recruiter_type = RecruiterType.NO_RECRUITER_IDENTIFIED.value
        if request.recruiter_type:
            try:
                recruiter_type = RecruiterType(request.recruiter_type).value
            except ValueError:
                pass

        app = JobApplication(
            user_id=user_id,
            company=company,
            title=title,
            location=request.location.strip() if request.location else "Remote",
            employment_type=request.employment_type.strip() if request.employment_type else "Full-time",
            salary=request.salary.strip() if request.salary else None,
            date_applied=applied_date,
            status=app_status,
            priority=priority,
            recruiter_name=request.recruiter_name.strip() if request.recruiter_name else None,
            recruiter_email=request.recruiter_email.strip() if request.recruiter_email else None,
            recruiter_title=request.recruiter_title.strip() if request.recruiter_title else None,
            recruiter_phone=request.recruiter_phone.strip() if request.recruiter_phone else None,
            recruiter_linkedin=request.recruiter_linkedin.strip() if request.recruiter_linkedin else None,
            recruiter_type=recruiter_type,
            contact_confidence=request.contact_confidence,
            contact_extraction_source=request.contact_extraction_source,
            source=request.source.strip() if request.source else "Direct Application",
            notes=request.notes.strip() if request.notes else None,
            next_follow_up_date=request.next_follow_up_date,
            company_logo=logo,
            activity_subtitle=request.activity_subtitle.strip() if request.activity_subtitle else "Applied recently",
            last_activity_date=date.today(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        app.timeline_events.append(TimelineEvent(
            title=f"Applied for {title}",
            description=f"Application submitted to {company}",
            event_date=datetime.utcnow(),
            event_type="APPLIED"
        ))

        self.db.add(app)
        self.db.commit()
        self.db.refresh(app)
        return app

    def update_application(self, user_id: int, app_id: int, request: JobApplicationRequest) -> JobApplication:
        app = self.get_application_by_id(user_id, app_id)

        if request.company and request.company.strip():
            app.company = request.company.strip()
        if request.title and request.title.strip():
            app.title = request.title.strip()
        if request.location is not None:
            app.location = request.location.strip()
        if request.employment_type is not None:
            app.employment_type = request.employment_type.strip()
        if request.salary is not None:
            app.salary = request.salary.strip() if request.salary else None
        if request.date_applied is not None:
            app.date_applied = request.date_applied

        if request.status and request.status.strip():
            new_status = ApplicationStatus.from_string(request.status)
            if new_status.value != app.status:
                app.status = new_status.value
                app.last_activity_date = date.today()
                app.timeline_events.append(TimelineEvent(
                    title=f"Status changed to {new_status.get_display_name()}",
                    description="Updated application status",
                    event_date=datetime.utcnow(),
                    event_type=new_status.value
                ))

        if request.priority and request.priority.strip():
            app.priority = Priority.from_string(request.priority).value
        if request.recruiter_name is not None:
            app.recruiter_name = request.recruiter_name.strip() if request.recruiter_name else None
        if request.recruiter_email is not None:
            app.recruiter_email = request.recruiter_email.strip() if request.recruiter_email else None
        if request.recruiter_title is not None:
            app.recruiter_title = request.recruiter_title.strip() if request.recruiter_title else None
        if request.recruiter_phone is not None:
            app.recruiter_phone = request.recruiter_phone.strip() if request.recruiter_phone else None
        if request.recruiter_linkedin is not None:
            app.recruiter_linkedin = request.recruiter_linkedin.strip() if request.recruiter_linkedin else None
        if request.recruiter_type is not None:
            try:
                app.recruiter_type = RecruiterType(request.recruiter_type).value
            except ValueError:
                pass
        if request.contact_confidence is not None:
            app.contact_confidence = request.contact_confidence
        if request.contact_extraction_source is not None:
            app.contact_extraction_source = request.contact_extraction_source
        if request.source is not None:
            app.source = request.source.strip()
        if request.notes is not None:
            app.notes = request.notes.strip()
        if request.next_follow_up_date is not None:
            app.next_follow_up_date = request.next_follow_up_date
        if request.company_logo is not None:
            app.company_logo = request.company_logo.strip()
        if request.activity_subtitle is not None:
            app.activity_subtitle = request.activity_subtitle.strip()

        app.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(app)
        return app

    def update_status(self, user_id: int, app_id: int, status_str: str) -> JobApplication:
        app = self.get_application_by_id(user_id, app_id)
        new_status = ApplicationStatus.from_string(status_str)

        if app.status != new_status.value:
            app.status = new_status.value
            app.last_activity_date = date.today()

            subtitle_map = {
                ApplicationStatus.ASSESSMENT: "Assessment invited",
                ApplicationStatus.RECRUITER_SCREEN: "Screening call",
                ApplicationStatus.INTERVIEW: "Technical Interview",
                ApplicationStatus.FINAL_INTERVIEW: "Final Round",
                ApplicationStatus.OFFER: "Offer Received 🎉",
                ApplicationStatus.REJECTED: "Application closed",
                ApplicationStatus.WITHDRAWN: "Application withdrawn",
            }
            app.activity_subtitle = subtitle_map.get(new_status, "Applied recently")

            app.timeline_events.append(TimelineEvent(
                title=f"Moved to {new_status.get_display_name()}",
                description="Application stage updated on Kanban board",
                event_date=datetime.utcnow(),
                event_type=new_status.value
            ))

            app.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(app)

        return app

    def delete_application(self, user_id: int, app_id: int):
        app = self.get_application_by_id(user_id, app_id)
        # Unlink any emails referencing this application
        emails = self.db.query(Email).filter(Email.job_application_id == app_id).all()
        for e in emails:
            e.job_application_id = None

        self.db.delete(app)
        self.db.commit()

    def search_applications(self, user_id: int, query: str | None) -> list[JobApplication]:
        if not query or not query.strip():
            return self.get_all_applications(user_id)

        q = f"%{query.strip()}%"
        return (
            self.db.query(JobApplication)
            .filter(
                JobApplication.user_id == user_id,
                or_(
                    JobApplication.company.ilike(q),
                    JobApplication.title.ilike(q),
                    JobApplication.location.ilike(q),
                    JobApplication.recruiter_name.ilike(q),
                )
            )
            .order_by(JobApplication.date_applied.desc().nullslast())
            .all()
        )
