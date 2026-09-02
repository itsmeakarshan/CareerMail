from fastapi import APIRouter, Depends, Query, status, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user_id
from app.schemas.email import EmailResponse, EmailComposeRequest, EmailSimulateRequest
from app.services.email_service import EmailService

router = APIRouter(prefix="/emails", tags=["Emails"])


def _map_email_response(e) -> EmailResponse:
    return EmailResponse(
        id=e.id,
        sender=e.sender,
        sender_email=e.sender_email,
        recipient_email=e.recipient_email,
        subject=e.subject,
        preview=e.preview,
        body=e.body,
        timestamp=e.timestamp,
        read=e.is_read,
        starred=e.is_starred,
        important=e.is_important,
        folder=e.folder,
        labels=e.labels,
        job_related=e.is_job_related,
        detected_company=e.detected_company,
        detected_role=e.detected_role,
        detected_status=e.detected_status,
        detected_recruiter_name=e.detected_recruiter_name,
        detected_recruiter_email=e.detected_recruiter_email,
        detected_recruiter_title=e.detected_recruiter_title,
        detected_recruiter_type=e.detected_recruiter_type,
        detected_recruiter_confidence=e.detected_recruiter_confidence,
        classification=e.classification,
        gmail_message_id=e.gmail_message_id,
        gmail_thread_id=e.gmail_thread_id,
        job_application=e.job_application
    )


@router.get("", response_model=list[EmailResponse])
def get_emails_by_folder(
    folder: str = Query(default="INBOX"),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = EmailService(db)
    emails = service.get_emails_by_folder(user_id, folder)
    return [_map_email_response(e) for e in emails]


@router.get("/starred", response_model=list[EmailResponse])
def get_starred_emails(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = EmailService(db)
    emails = service.get_starred_emails(user_id)
    return [_map_email_response(e) for e in emails]


@router.get("/important", response_model=list[EmailResponse])
def get_important_emails(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = EmailService(db)
    emails = service.get_important_emails(user_id)
    return [_map_email_response(e) for e in emails]


@router.get("/counts")
def get_folder_counts(
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = EmailService(db)
    return service.get_folder_counts(user_id)


@router.get("/search", response_model=list[EmailResponse])
def search_emails(
    q: str = Query(default=""),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = EmailService(db)
    emails = service.search_emails(user_id, q)
    return [_map_email_response(e) for e in emails]


@router.get("/application/{app_id}", response_model=list[EmailResponse])
def get_emails_by_application(
    app_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = EmailService(db)
    emails = service.get_emails_by_application(user_id, app_id)
    return [_map_email_response(e) for e in emails]


@router.get("/{email_id}", response_model=EmailResponse)
def get_email_by_id(
    email_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = EmailService(db)
    email = service.get_email_by_id(user_id, email_id)
    return _map_email_response(email)


@router.patch("/{email_id}/read", response_model=EmailResponse)
def mark_email_read(
    email_id: int,
    is_read: bool = Query(default=True, alias="isRead"),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = EmailService(db)
    email = service.mark_as_read(user_id, email_id, is_read)
    return _map_email_response(email)


@router.patch("/{email_id}/star", response_model=EmailResponse)
def toggle_star(
    email_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = EmailService(db)
    email = service.toggle_star(user_id, email_id)
    return _map_email_response(email)


@router.patch("/{email_id}/important", response_model=EmailResponse)
def toggle_important(
    email_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = EmailService(db)
    email = service.toggle_important(user_id, email_id)
    return _map_email_response(email)


@router.patch("/{email_id}/folder", response_model=EmailResponse)
def move_email_to_folder(
    email_id: int,
    folder: str = Query(...),
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = EmailService(db)
    email = service.move_to_folder(user_id, email_id, folder)
    return _map_email_response(email)


@router.post("/compose", response_model=EmailResponse, status_code=status.HTTP_201_CREATED)
def compose_email(
    request: EmailComposeRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = EmailService(db)
    email = service.compose_and_save(user_id, request)
    return _map_email_response(email)


@router.post("/simulate", response_model=EmailResponse, status_code=status.HTTP_201_CREATED)
def simulate_email(
    request: EmailSimulateRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = EmailService(db)
    email = service.simulate_incoming_email(user_id, request)
    return _map_email_response(email)


@router.delete("/{email_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_email(
    email_id: int,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = EmailService(db)
    service.delete_email(user_id, email_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
