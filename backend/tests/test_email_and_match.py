import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.services.analyzer.rule_based_email_analyzer import RuleBasedEmailAnalyzer
from app.models.enums import EmailClassification, ApplicationStatus, RecruiterType
from app.services.candidate_domain_engine import CandidateDomainEngine
from app.models.models import CvProfile
import json

client = TestClient(app)


def test_rule_based_email_analyzer_offer():
    analyzer = RuleBasedEmailAnalyzer()
    res = analyzer.analyze(
        sender="Alex Turner",
        sender_email="alex.turner@revolut.com",
        subject="Offer of Employment — Senior Python Backend Engineer at Revolut",
        body="Dear Akarshan,\n\nWe are pleased to offer you the position of Senior Python Backend Engineer at Revolut!\n\nBest regards,\nAlex Turner\nTalent Acquisition Lead"
    )

    assert res.is_job_related is True
    assert res.classification == EmailClassification.OFFER
    assert res.suggested_status == ApplicationStatus.OFFER
    assert res.detected_company == "Revolut"
    assert res.recruiter_info.recruiter_type == RecruiterType.HUMAN_RECRUITER


def test_rule_based_email_analyzer_interview():
    analyzer = RuleBasedEmailAnalyzer()
    res = analyzer.analyze(
        sender="Google Recruiting",
        sender_email="recruiting@google.com",
        subject="Interview Invitation: Software Engineer at Google",
        body="Hi Akarshan,\n\nWe would love to invite you to a technical interview for the Software Engineer role.\nPlease join via https://meet.google.com/abc-defg-hij\n\nBest,\nSarah Jenkins"
    )

    assert res.is_job_related is True
    assert res.classification == EmailClassification.INTERVIEW_INVITATION
    assert res.suggested_status == ApplicationStatus.INTERVIEW
    assert res.detected_company == "Google"
    assert res.meeting_link == "https://meet.google.com/abc-defg-hij"


def test_rule_based_email_analyzer_junk():
    analyzer = RuleBasedEmailAnalyzer()
    res = analyzer.analyze(
        sender="Uber Eats Deals",
        sender_email="deals@ubereats.com",
        subject="50% off your next lunch order!",
        body="Use promo code LUNCH50 to get a discount on your meal. Unsubscribe here."
    )

    assert res.is_job_related is False


def test_candidate_domain_engine():
    engine = CandidateDomainEngine()
    profile = CvProfile(
        extracted_skills=json.dumps(["Python", "Machine Learning", "PyTorch", "SQL", "Scikit-learn"]),
        target_roles=json.dumps(["Data Scientist", "AI Engineer"]),
        raw_text="Data Scientist specializing in PyTorch and Machine Learning."
    )
    analysis = engine.analyze_profile(profile)
    assert analysis.primary_domain == "Data Science & AI"
    assert "Data Scientist" in analysis.target_roles


def test_unauthenticated_protected_endpoint():
    resp = client.get("/api/applications")
    assert resp.status_code == 401
