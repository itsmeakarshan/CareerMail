import re
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.models import Interview, JobApplication, TimelineEvent
from app.models.enums import InterviewStatus
from app.schemas.interview import InterviewRequest


class InterviewService:
    def __init__(self, db: Session):
        self.db = db

    def get_all_interviews(self, user_id: int) -> list[Interview]:
        interviews = (
            self.db.query(Interview)
            .filter(Interview.user_id == user_id)
            .order_by(Interview.interview_date.asc())
            .all()
        )
        for i in interviews:
            self._compute_days_away_badge(i)
        return interviews

    def get_interview_by_id(self, user_id: int, interview_id: int) -> Interview:
        interview = (
            self.db.query(Interview)
            .filter(Interview.id == interview_id, Interview.user_id == user_id)
            .first()
        )
        if not interview:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Interview not found with ID: {interview_id}"
            )
        self._compute_days_away_badge(interview)
        return interview

    def create_interview(self, user_id: int, request: InterviewRequest) -> Interview:
        if not request.company or not request.company.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Company is required")
        if not request.title or not request.title.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Title is required")
        if not request.interview_date:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Interview date is required")

        company = request.company.strip()
        logo = request.company_logo.strip() if request.company_logo and request.company_logo.strip() else re.sub(r"[^a-z0-9]", "", company.lower())

        interview = Interview(
            user_id=user_id,
            job_application_id=request.job_application_id,
            company=company,
            title=request.title.strip(),
            interview_date=request.interview_date,
            type=request.type.strip() if request.type else "Technical Interview",
            interviewer=request.interviewer.strip() if request.interviewer else None,
            location=request.location.strip() if request.location else "Google Meet",
            meeting_link=request.meeting_link.strip() if request.meeting_link else None,
            preparation_notes=request.preparation_notes.strip() if request.preparation_notes else None,
            status=InterviewStatus.from_string(request.status).value,
            company_logo=logo
        )

        if request.job_application_id:
            app = (
                self.db.query(JobApplication)
                .filter(JobApplication.id == request.job_application_id, JobApplication.user_id == user_id)
                .first()
            )
            if app:
                app.timeline_events.append(TimelineEvent(
                    title=f"Interview Scheduled: {interview.type}",
                    description=f"Date: {interview.interview_date} with {interview.interviewer or 'Hiring Team'}",
                    event_date=datetime.utcnow(),
                    event_type="INTERVIEW"
                ))

        self._compute_days_away_badge(interview)
        self.db.add(interview)
        self.db.commit()
        self.db.refresh(interview)
        return interview

    def update_interview(self, user_id: int, interview_id: int, request: InterviewRequest) -> Interview:
        interview = self.get_interview_by_id(user_id, interview_id)

        if request.company and request.company.strip():
            interview.company = request.company.strip()
        if request.title and request.title.strip():
            interview.title = request.title.strip()
        if request.interview_date is not None:
            interview.interview_date = request.interview_date
        if request.type is not None:
            interview.type = request.type.strip()
        if request.interviewer is not None:
            interview.interviewer = request.interviewer.strip() if request.interviewer else None
        if request.location is not None:
            interview.location = request.location.strip()
        if request.meeting_link is not None:
            interview.meeting_link = request.meeting_link.strip() if request.meeting_link else None
        if request.preparation_notes is not None:
            interview.preparation_notes = request.preparation_notes.strip() if request.preparation_notes else None
        if request.status and request.status.strip():
            interview.status = InterviewStatus.from_string(request.status).value
        if request.company_logo is not None:
            interview.company_logo = request.company_logo.strip()
        if request.job_application_id is not None:
            interview.job_application_id = request.job_application_id

        self._compute_days_away_badge(interview)
        self.db.commit()
        self.db.refresh(interview)
        return interview

    def delete_interview(self, user_id: int, interview_id: int):
        interview = self.get_interview_by_id(user_id, interview_id)
        self.db.delete(interview)
        self.db.commit()

    @staticmethod
    def _compute_days_away_badge(interview: Interview):
        now = datetime.utcnow()
        if interview.interview_date < now:
            interview.days_away_badge = "Completed"
            return

        diff = interview.interview_date - now
        if diff.total_seconds() < 86400:
            hours = int(diff.total_seconds() // 3600)
            interview.days_away_badge = "Today" if hours <= 0 else f"In {hours}h"
        elif diff.total_seconds() < 172800:
            interview.days_away_badge = "Tomorrow"
        else:
            days = int(diff.total_seconds() // 86400)
            interview.days_away_badge = f"In {days} days"
