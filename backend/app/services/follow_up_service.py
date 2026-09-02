import re
from datetime import datetime, date
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import FollowUp, JobApplication, TimelineEvent
from app.models.enums import FollowUpStatus
from app.schemas.follow_up import FollowUpRequest


class FollowUpService:
    def __init__(self, db: Session):
        self.db = db

    def get_all_follow_ups(self, user_id: int) -> list[FollowUp]:
        follow_ups = (
            self.db.query(FollowUp)
            .filter(FollowUp.user_id == user_id)
            .order_by(FollowUp.due_date.asc())
            .all()
        )
        for f in follow_ups:
            self._compute_badges(f)
        return follow_ups

    def get_follow_up_by_id(self, user_id: int, follow_up_id: int) -> FollowUp:
        follow_up = (
            self.db.query(FollowUp)
            .filter(FollowUp.id == follow_up_id, FollowUp.user_id == user_id)
            .first()
        )
        if not follow_up:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Follow-up not found with ID: {follow_up_id}"
            )
        self._compute_badges(follow_up)
        return follow_up

    def create_follow_up(self, user_id: int, request: FollowUpRequest) -> FollowUp:
        if not request.company or not request.company.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Company is required")
        if not request.due_date:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Due date is required")

        company = request.company.strip()
        logo = request.company_logo.strip() if request.company_logo and request.company_logo.strip() else re.sub(r"[^a-z0-9]", "", company.lower())

        follow_up = FollowUp(
            user_id=user_id,
            job_application_id=request.job_application_id,
            company=company,
            role=request.role.strip() if request.role else None,
            due_date=request.due_date,
            notes=request.notes.strip() if request.notes else None,
            status=FollowUpStatus.from_string(request.status).value,
            company_logo=logo
        )

        if request.job_application_id:
            app = (
                self.db.query(JobApplication)
                .filter(JobApplication.id == request.job_application_id, JobApplication.user_id == user_id)
                .first()
            )
            if app:
                app.next_follow_up_date = request.due_date
                app.timeline_events.append(TimelineEvent(
                    title="Follow-up Scheduled",
                    description=f"Follow-up set for {request.due_date}: {request.notes or 'Check on application status'}",
                    event_date=datetime.utcnow(),
                    event_type="FOLLOW_UP"
                ))

        self._compute_badges(follow_up)
        self.db.add(follow_up)
        self.db.commit()
        self.db.refresh(follow_up)
        return follow_up

    def update_follow_up(self, user_id: int, follow_up_id: int, request: FollowUpRequest) -> FollowUp:
        follow_up = self.get_follow_up_by_id(user_id, follow_up_id)

        if request.company and request.company.strip():
            follow_up.company = request.company.strip()
        if request.role is not None:
            follow_up.role = request.role.strip() if request.role else None
        if request.due_date is not None:
            follow_up.due_date = request.due_date
        if request.notes is not None:
            follow_up.notes = request.notes.strip() if request.notes else None
        if request.status and request.status.strip():
            follow_up.status = FollowUpStatus.from_string(request.status).value
        if request.company_logo is not None:
            follow_up.company_logo = request.company_logo.strip()
        if request.job_application_id is not None:
            follow_up.job_application_id = request.job_application_id

        self._compute_badges(follow_up)
        self.db.commit()
        self.db.refresh(follow_up)
        return follow_up

    def delete_follow_up(self, user_id: int, follow_up_id: int):
        follow_up = self.get_follow_up_by_id(user_id, follow_up_id)
        self.db.delete(follow_up)
        self.db.commit()

    @staticmethod
    def _compute_badges(follow_up: FollowUp):
        today = date.today()
        diff_days = (follow_up.due_date - today).days

        if diff_days < 0:
            follow_up.days_due_badge = f"Overdue by {abs(diff_days)}d"
        elif diff_days == 0:
            follow_up.days_due_badge = "Due today"
        elif diff_days == 1:
            follow_up.days_due_badge = "Due in 1 day"
        else:
            follow_up.days_due_badge = f"Due in {diff_days} days"

        if follow_up.job_application and follow_up.job_application.date_applied:
            applied_ago = (today - follow_up.job_application.date_applied).days
            follow_up.applied_subtitle = f"Applied {applied_ago} days ago"
        elif not follow_up.applied_subtitle:
            follow_up.applied_subtitle = "Applied recently"
