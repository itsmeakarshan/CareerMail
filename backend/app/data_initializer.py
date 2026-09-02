import json
import logging
from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import engine, Base
from app.models.models import (
    User,
    JobApplication,
    TimelineEvent,
    Email,
    Interview,
    FollowUp,
    CvProfile
)
from app.models.enums import (
    ApplicationStatus,
    EmailClassification,
    EmailFolder,
    FollowUpStatus,
    InterviewStatus,
    Priority,
    RecruiterType
)
from app.security import hash_password

logger = logging.getLogger(__name__)


def init_db(db: Session):
    # Ensure all tables are created
    Base.metadata.create_all(bind=engine)

    try:
        # SQLite or Postgres conditional column check for gemini_api_key
        with engine.connect() as conn:
            try:
                conn.execute(text("ALTER TABLE users ADD COLUMN gemini_api_key TEXT;"))
                conn.commit()
            except Exception:
                pass
            try:
                conn.execute(text("""
                    ALTER TABLE emails DROP CONSTRAINT IF EXISTS emails_classification_check;
                    ALTER TABLE emails ADD CONSTRAINT emails_classification_check 
                    CHECK (classification IS NULL OR classification IN (
                        'APPLICATION_SUBMITTED', 'APPLICATION_RECEIVED', 'RECRUITER_MESSAGE',
                        'INTERVIEW_INVITATION', 'INTERVIEW_SCHEDULED', 'ASSESSMENT',
                        'REJECTION', 'OFFER', 'STATUS_UPDATE', 'NEW_OPPORTUNITY', 'OTHER_JOB_RELATED'
                    ));
                """))
                conn.commit()
            except Exception:
                pass
    except Exception as e:
        logger.debug(f"DB schema note: {e}")

    # Seed demo user
    demo_user = db.query(User).filter(User.email == "akarshan@email.com").first()
    if not demo_user:
        demo_user = User(
            name="Akarshan",
            email="akarshan@email.com",
            password=hash_password("password123"),
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        logger.info("Demo user 'akarshan@email.com' created successfully.")
    else:
        demo_user.name = "Akarshan"
        db.commit()

    # Seed CV Profile for Demo User if missing
    cv = db.query(CvProfile).filter(CvProfile.user_id == demo_user.id).first()
    if not cv:
        skills = [
            "Python", "FastAPI", "Django", "Flask", "SQL", "PostgreSQL", "Docker", "Kubernetes",
            "AWS", "Git", "REST API", "Microservices", "React", "TypeScript", "Machine Learning", "PyTorch"
        ]
        roles = ["Python Developer", "Software Engineer", "Backend Developer", "Full Stack Developer"]
        cv = CvProfile(
            user_id=demo_user.id,
            file_name="Akarshan_Software_Engineer_CV.pdf",
            raw_text="Akarshan - Senior Python & Full Stack Software Engineer with expertise in FastAPI, Python, PostgreSQL, AWS, React, Docker, and distributed systems.",
            extracted_skills=json.dumps(skills),
            target_roles=json.dumps(roles),
            experience_years=3,
            education_level="Bachelor's in Computer Science",
            preferred_location="London, United Kingdom",
            is_remote_preferred=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.add(cv)
        db.commit()

    # Seed demo pipeline if empty
    app_count = db.query(JobApplication).filter(JobApplication.user_id == demo_user.id).count()
    if app_count == 0:
        seed_demo_pipeline(db, demo_user)


def seed_demo_pipeline(db: Session, user: User):
    today = date.today()
    now = datetime.utcnow()

    # 1. Google (Interview Stage)
    app1 = JobApplication(
        user_id=user.id,
        company="Google",
        title="Software Engineer - Backend (Python)",
        location="London, UK (Hybrid)",
        employment_type="Full-time",
        salary="£85,000 - £110,000",
        date_applied=today - timedelta(days=14),
        status=ApplicationStatus.INTERVIEW.value,
        priority=Priority.HIGH.value,
        recruiter_name="Sarah Jenkins",
        recruiter_email="sarah.jenkins@google.com",
        recruiter_title="Senior Technical Recruiter",
        recruiter_type=RecruiterType.HUMAN_RECRUITER.value,
        contact_confidence=95,
        contact_extraction_source="Direct Recruiter Outreach",
        source="Google Careers",
        company_logo="google",
        activity_subtitle="Technical Interview",
        notes="Interviewing with Google Cloud distributed systems team.",
        last_activity_date=today - timedelta(days=1),
        created_at=now - timedelta(days=14),
        updated_at=now - timedelta(days=1)
    )
    app1.timeline_events.append(TimelineEvent(
        title="Applied for Software Engineer - Backend (Python)",
        description="Application submitted via Google Careers",
        event_date=now - timedelta(days=14),
        event_type="APPLIED"
    ))
    app1.timeline_events.append(TimelineEvent(
        title="Recruiter Screen Completed",
        description="Discussed experience and technical background with Sarah Jenkins",
        event_date=now - timedelta(days=7),
        event_type="RECRUITER_SCREEN"
    ))
    app1.timeline_events.append(TimelineEvent(
        title="Technical Interview Scheduled",
        description="System design and Python coding round",
        event_date=now - timedelta(days=1),
        event_type="INTERVIEW"
    ))
    db.add(app1)
    db.commit()
    db.refresh(app1)

    # Interview for Google
    int1 = Interview(
        user_id=user.id,
        job_application_id=app1.id,
        company="Google",
        title="Technical Interview - Python Systems",
        interview_date=now + timedelta(days=2, hours=3),
        type="Technical Interview",
        interviewer="Sarah Jenkins & Staff Engineer",
        location="Google Meet",
        meeting_link="https://meet.google.com/abc-defg-hij",
        preparation_notes="Review Python concurrency, asyncio, distributed systems, and PostgreSQL query optimization.",
        status=InterviewStatus.SCHEDULED.value,
        days_away_badge="In 2 days",
        company_logo="google"
    )
    db.add(int1)

    # 2. Revolut (Offer Stage)
    app2 = JobApplication(
        user_id=user.id,
        company="Revolut",
        title="Senior Python Backend Engineer",
        location="London, UK (Remote)",
        employment_type="Full-time",
        salary="£90,000 - £120,000",
        date_applied=today - timedelta(days=28),
        status=ApplicationStatus.OFFER.value,
        priority=Priority.HIGH.value,
        recruiter_name="Alex Turner",
        recruiter_email="alex.turner@revolut.com",
        recruiter_title="Talent Acquisition Lead",
        recruiter_type=RecruiterType.HUMAN_RECRUITER.value,
        contact_confidence=95,
        contact_extraction_source="Direct Recruiter Outreach",
        source="Revolut Careers",
        company_logo="revolut",
        activity_subtitle="Offer Received 🎉",
        notes="Official offer letter received. Reviewing compensation package.",
        last_activity_date=today,
        created_at=now - timedelta(days=28),
        updated_at=now
    )
    app2.timeline_events.append(TimelineEvent(
        title="Applied for Senior Python Backend Engineer",
        description="Application submitted",
        event_date=now - timedelta(days=28),
        event_type="APPLIED"
    ))
    app2.timeline_events.append(TimelineEvent(
        title="Final Round Passed",
        description="Completed executive and architecture rounds",
        event_date=now - timedelta(days=3),
        event_type="FINAL_INTERVIEW"
    ))
    app2.timeline_events.append(TimelineEvent(
        title="Formal Job Offer Received!",
        description="Official written offer received from Alex Turner",
        event_date=now,
        event_type="OFFER"
    ))
    db.add(app2)

    # 3. Monzo (Assessment Stage)
    app3 = JobApplication(
        user_id=user.id,
        company="Monzo",
        title="Backend Software Engineer (Python/Go)",
        location="London, UK (Hybrid)",
        employment_type="Full-time",
        salary="£75,000 - £95,000",
        date_applied=today - timedelta(days=6),
        status=ApplicationStatus.ASSESSMENT.value,
        priority=Priority.MEDIUM.value,
        recruiter_name="Monzo Hiring Team",
        recruiter_email="hiring@monzo.com",
        recruiter_type=RecruiterType.POSSIBLE_RECRUITER.value,
        contact_confidence=80,
        source="Greenhouse (Monzo)",
        company_logo="monzo",
        activity_subtitle="Assessment active",
        notes="Take-home take assignment sent.",
        last_activity_date=today - timedelta(days=1),
        created_at=now - timedelta(days=6),
        updated_at=now - timedelta(days=1)
    )
    app3.timeline_events.append(TimelineEvent(
        title="Applied for Backend Software Engineer",
        description="Applied via Monzo Careers",
        event_date=now - timedelta(days=6),
        event_type="APPLIED"
    ))
    app3.timeline_events.append(TimelineEvent(
        title="Online Coding Assessment Invited",
        description="Take-home architecture assessment",
        event_date=now - timedelta(days=1),
        event_type="ASSESSMENT"
    ))
    db.add(app3)
    db.commit()
    db.refresh(app3)

    # Follow-up for Monzo assessment
    fol1 = FollowUp(
        user_id=user.id,
        job_application_id=app3.id,
        company="Monzo",
        role="Backend Software Engineer",
        due_date=today + timedelta(days=3),
        applied_subtitle="Assessment Active",
        days_due_badge="Due in 3 days",
        company_logo="monzo",
        status=FollowUpStatus.PENDING.value,
        notes="Submit completed Python backend architecture project to Monzo recruiter."
    )
    db.add(fol1)

    # 4. Stripe (Recruiter Screen Stage)
    app4 = JobApplication(
        user_id=user.id,
        company="Stripe",
        title="Software Engineer - Payments Infrastructure",
        location="Remote (UK)",
        employment_type="Full-time",
        salary="£95,000 - £130,000",
        date_applied=today - timedelta(days=10),
        status=ApplicationStatus.RECRUITER_SCREEN.value,
        priority=Priority.HIGH.value,
        recruiter_name="Elena Rostova",
        recruiter_email="elena.rostova@stripe.com",
        recruiter_title="Lead Technical Recruiter",
        recruiter_type=RecruiterType.HUMAN_RECRUITER.value,
        contact_confidence=90,
        source="LinkedIn Recruiter Reachout",
        company_logo="stripe",
        activity_subtitle="Screening call",
        notes="Recruiter outreach message on LinkedIn.",
        last_activity_date=today - timedelta(days=2),
        created_at=now - timedelta(days=10),
        updated_at=now - timedelta(days=2)
    )
    db.add(app4)

    # 5. Bloomberg (Applied Stage)
    app5 = JobApplication(
        user_id=user.id,
        company="Bloomberg",
        title="Senior Python & Data Infrastructure Engineer",
        location="London, UK",
        employment_type="Full-time",
        salary="£90,000 - £120,000",
        date_applied=today - timedelta(days=3),
        status=ApplicationStatus.APPLIED.value,
        priority=Priority.MEDIUM.value,
        source="Direct Application",
        company_logo="bloomberg",
        activity_subtitle="Applied recently",
        created_at=now - timedelta(days=3),
        updated_at=now - timedelta(days=3)
    )
    db.add(app5)

    # Seed Sample Emails in Inbox
    e1 = Email(
        user_id=user.id,
        sender="Sarah Jenkins",
        sender_email="sarah.jenkins@google.com",
        recipient_email=user.email,
        subject="Interview Invitation: Software Engineer - Backend at Google",
        preview="Hi Akarshan, we would love to invite you to a technical interview for the Software Engineer position at Google...",
        body="Hi Akarshan,\n\nThank you for taking the time to speak with our team. We were very impressed with your background in Python backend architectures and distributed systems.\n\nWe would like to invite you to the next round of technical interviews. Please use the Google Meet link below for the session:\nhttps://meet.google.com/abc-defg-hij\n\nLooking forward to speaking with you.\n\nBest regards,\nSarah Jenkins\nSenior Technical Recruiter | Google London",
        timestamp=now - timedelta(days=1),
        is_read=False,
        is_starred=True,
        is_important=True,
        folder=EmailFolder.INBOX.value,
        job_application_id=app1.id,
        is_job_related=True,
        detected_company="Google",
        detected_role="Software Engineer - Backend",
        detected_status="INTERVIEW",
        detected_recruiter_name="Sarah Jenkins",
        detected_recruiter_email="sarah.jenkins@google.com",
        detected_recruiter_title="Senior Technical Recruiter",
        detected_recruiter_type=RecruiterType.HUMAN_RECRUITER.value,
        detected_recruiter_confidence=95,
        classification=EmailClassification.INTERVIEW_INVITATION.value,
        processed_at=now
    )
    db.add(e1)

    e2 = Email(
        user_id=user.id,
        sender="Alex Turner",
        sender_email="alex.turner@revolut.com",
        recipient_email=user.email,
        subject="Offer of Employment — Senior Python Backend Engineer at Revolut",
        preview="Dear Akarshan, on behalf of Revolut, we are pleased to offer you the position of Senior Python Backend Engineer...",
        body="Dear Akarshan,\n\nOn behalf of Revolut, I am delighted to extend a formal offer of employment for the role of Senior Python Backend Engineer!\n\nThe team was immensely impressed with your technical architecture round and domain expertise. Please find the offer terms and agreement details attached for your review.\n\nWelcome to the team!\n\nWarm regards,\nAlex Turner\nTalent Acquisition Lead | Revolut",
        timestamp=now - timedelta(hours=4),
        is_read=True,
        is_starred=True,
        is_important=True,
        folder=EmailFolder.INBOX.value,
        job_application_id=app2.id,
        is_job_related=True,
        detected_company="Revolut",
        detected_role="Senior Python Backend Engineer",
        detected_status="OFFER",
        detected_recruiter_name="Alex Turner",
        detected_recruiter_email="alex.turner@revolut.com",
        detected_recruiter_title="Talent Acquisition Lead",
        detected_recruiter_type=RecruiterType.HUMAN_RECRUITER.value,
        detected_recruiter_confidence=95,
        classification=EmailClassification.OFFER.value,
        processed_at=now
    )
    db.add(e2)

    e3 = Email(
        user_id=user.id,
        sender="DeepMind Talent Acquisition",
        sender_email="recruiting@deepmind.google",
        recipient_email=user.email,
        subject="Exciting new opportunity: Frontier AI Software Engineer with DeepMind",
        preview="Hi Akarshan, I came across your GitHub profile and background in Python and wanted to reach out regarding a new role...",
        body="Hi Akarshan,\n\nI came across your profile and recent projects in Python backend and ML engineering. We have an exciting new role opening in our London research engineering division for a Software Engineer.\n\nGiven your strong expertise in distributed backend systems and Python, I thought you'd be a great fit for our team.\n\nWould you be open for a brief introductory call this week?\n\nBest regards,\nDavid Chen\nDeepMind Talent Acquisition Team",
        timestamp=now - timedelta(hours=12),
        is_read=False,
        is_starred=False,
        is_important=True,
        folder=EmailFolder.INBOX.value,
        is_job_related=True,
        detected_company="DeepMind",
        detected_role="Frontier AI Software Engineer",
        detected_status="APPLIED",
        detected_recruiter_name="David Chen",
        detected_recruiter_email="recruiting@deepmind.google",
        detected_recruiter_title="Talent Acquisition Team",
        detected_recruiter_type=RecruiterType.HUMAN_RECRUITER.value,
        detected_recruiter_confidence=90,
        classification=EmailClassification.NEW_OPPORTUNITY.value,
        processed_at=now
    )
    db.add(e3)

    db.commit()
    logger.info("Demo pipeline seeded with Google, Revolut, Monzo, Stripe, Bloomberg and live emails.")
