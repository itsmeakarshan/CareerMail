from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException, status
from app.models.models import Email, JobApplication, User
from app.models.enums import EmailFolder
from app.schemas.email import EmailComposeRequest, EmailSimulateRequest
from app.services.email_analysis_service import EmailAnalysisService


class EmailService:
    def __init__(self, db: Session, analysis_service: EmailAnalysisService | None = None):
        self.db = db
        self.analysis_service = analysis_service or EmailAnalysisService(db)

    def get_emails_by_folder(self, user_id: int, folder: str = "INBOX") -> list[Email]:
        norm_folder = EmailFolder.from_string(folder).value
        return (
            self.db.query(Email)
            .filter(Email.user_id == user_id, Email.folder == norm_folder)
            .order_by(Email.timestamp.desc())
            .all()
        )

    def get_starred_emails(self, user_id: int) -> list[Email]:
        return (
            self.db.query(Email)
            .filter(Email.user_id == user_id, Email.is_starred == True, Email.folder != EmailFolder.TRASH.value)
            .order_by(Email.timestamp.desc())
            .all()
        )

    def get_important_emails(self, user_id: int) -> list[Email]:
        return (
            self.db.query(Email)
            .filter(Email.user_id == user_id, Email.is_important == True, Email.folder != EmailFolder.TRASH.value)
            .order_by(Email.timestamp.desc())
            .all()
        )

    def get_email_by_id(self, user_id: int, email_id: int) -> Email:
        email = (
            self.db.query(Email)
            .filter(Email.id == email_id, Email.user_id == user_id)
            .first()
        )
        if not email:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Email not found with ID: {email_id}"
            )

        # Lazy upgrade to rich HTML with exact images if previously synced as plain text
        if email.gmail_message_id:
            try:
                from app.services.gmail_service import GmailService
                gmail_svc = GmailService(self.db)
                gmail_svc.upgrade_email_if_needed(email, user_id)
            except Exception:
                pass

        return email


    def get_emails_by_application(self, user_id: int, app_id: int) -> list[Email]:
        return (
            self.db.query(Email)
            .filter(Email.user_id == user_id, Email.job_application_id == app_id)
            .order_by(Email.timestamp.desc())
            .all()
        )

    def mark_as_read(self, user_id: int, email_id: int, is_read: bool = True) -> Email:
        email = self.get_email_by_id(user_id, email_id)
        email.is_read = is_read
        self.db.commit()
        self.db.refresh(email)
        return email

    def toggle_star(self, user_id: int, email_id: int) -> Email:
        email = self.get_email_by_id(user_id, email_id)
        email.is_starred = not email.is_starred
        self.db.commit()
        self.db.refresh(email)
        return email

    def toggle_important(self, user_id: int, email_id: int) -> Email:
        email = self.get_email_by_id(user_id, email_id)
        email.is_important = not email.is_important
        self.db.commit()
        self.db.refresh(email)
        return email

    def move_to_folder(self, user_id: int, email_id: int, target_folder: str) -> Email:
        email = self.get_email_by_id(user_id, email_id)
        email.folder = EmailFolder.from_string(target_folder).value
        self.db.commit()
        self.db.refresh(email)
        return email

    def compose_and_save(self, user_id: int, request: EmailComposeRequest) -> Email:
        user = self.db.query(User).filter(User.id == user_id).first()
        preview = request.body[:120] + "..." if len(request.body) > 120 else request.body

        email = Email(
            user_id=user_id,
            sender=user.name if user else "Me",
            sender_email=user.email if user else "me@careermail.com",
            recipient_email=request.to.strip(),
            subject=request.subject.strip(),
            preview=preview,
            body=request.body,
            timestamp=datetime.utcnow(),
            is_read=True,
            folder=EmailFolder.SENT.value,
            job_application_id=request.job_application_id,
            is_job_related=True if request.job_application_id else False
        )
        self.db.add(email)
        self.db.commit()
        self.db.refresh(email)
        return email

    def simulate_incoming_email(self, user_id: int, request: EmailSimulateRequest) -> Email:
        user = self.db.query(User).filter(User.id == user_id).first()
        preview = request.body[:120] + "..." if len(request.body) > 120 else request.body

        email = Email(
            user_id=user_id,
            sender=request.sender.strip(),
            sender_email=request.sender_email.strip(),
            recipient_email=user.email if user else "user@careermail.com",
            subject=request.subject.strip(),
            preview=preview,
            body=request.body,
            timestamp=datetime.utcnow(),
            is_read=False,
            is_important=request.important,
            folder=EmailFolder.INBOX.value
        )
        self.db.add(email)
        self.db.commit()
        self.db.refresh(email)

        # Analyze & link email
        self.analysis_service.process_and_link_email(email, user_id)
        self.db.commit()
        self.db.refresh(email)
        return email

    def get_folder_counts(self, user_id: int) -> dict[str, int]:
        inbox_count = self.db.query(Email).filter(Email.user_id == user_id, Email.folder == EmailFolder.INBOX.value, Email.is_read == False).count()
        sent_count = self.db.query(Email).filter(Email.user_id == user_id, Email.folder == EmailFolder.SENT.value).count()
        drafts_count = self.db.query(Email).filter(Email.user_id == user_id, Email.folder == EmailFolder.DRAFTS.value).count()
        starred_count = self.db.query(Email).filter(Email.user_id == user_id, Email.is_starred == True, Email.folder != EmailFolder.TRASH.value).count()
        important_count = self.db.query(Email).filter(Email.user_id == user_id, Email.is_important == True, Email.folder != EmailFolder.TRASH.value).count()

        return {
            "inbox": inbox_count,
            "sent": sent_count,
            "drafts": drafts_count,
            "starred": starred_count,
            "important": important_count,
        }

    def search_emails(self, user_id: int, query: str | None) -> list[Email]:
        if not query or not query.strip():
            return self.get_emails_by_folder(user_id, "INBOX")

        q = f"%{query.strip()}%"
        return (
            self.db.query(Email)
            .filter(
                Email.user_id == user_id,
                Email.folder != EmailFolder.TRASH.value,
                or_(
                    Email.subject.ilike(q),
                    Email.body.ilike(q),
                    Email.sender.ilike(q),
                    Email.sender_email.ilike(q),
                    Email.detected_company.ilike(q),
                )
            )
            .order_by(Email.timestamp.desc())
            .all()
        )

    def delete_email(self, user_id: int, email_id: int):
        email = self.get_email_by_id(user_id, email_id)
        if email.folder == EmailFolder.TRASH.value:
            self.db.delete(email)
        else:
            email.folder = EmailFolder.TRASH.value
        self.db.commit()
