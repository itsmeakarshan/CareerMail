import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "UP"
    assert "CareerMail" in data["service"]


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ONLINE"
    assert data["framework"] == "FastAPI"


def test_demo_login():
    response = client.post("/api/auth/login", json={
        "email": "akarshan@email.com",
        "password": "password123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert data["email"] == "akarshan@email.com"
    assert data["name"] == "Akarshan"


def test_get_applications_authenticated():
    # Login first
    login_resp = client.post("/api/auth/login", json={
        "email": "akarshan@email.com",
        "password": "password123"
    })
    token = login_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Fetch applications
    app_resp = client.get("/api/applications", headers=headers)
    assert app_resp.status_code == 200
    apps = app_resp.json()
    assert isinstance(apps, list)
    assert len(apps) >= 1

    # Verify camelCase serialization
    first_app = apps[0]
    assert "dateApplied" in first_app or "date_applied" in first_app
    assert "company" in first_app
    assert "status" in first_app


def test_create_and_update_application():
    login_resp = client.post("/api/auth/login", json={
        "email": "akarshan@email.com",
        "password": "password123"
    })
    token = login_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create new application
    new_app_payload = {
        "company": "DeepMind",
        "title": "Senior Python Infrastructure Engineer",
        "location": "London, UK",
        "employmentType": "Full-time",
        "salary": "£110,000",
        "status": "APPLIED",
        "priority": "HIGH",
        "notes": "Testing python backend creation"
    }
    create_resp = client.post("/api/applications", json=new_app_payload, headers=headers)
    assert create_resp.status_code == 201
    created = create_resp.json()
    assert created["company"] == "DeepMind"
    app_id = created["id"]

    # Update status to INTERVIEW
    status_resp = client.patch(f"/api/applications/{app_id}/status", json={"status": "INTERVIEW"}, headers=headers)
    assert status_resp.status_code == 200
    assert status_resp.json()["status"] == "INTERVIEW"

    # Clean up
    del_resp = client.delete(f"/api/applications/{app_id}", headers=headers)
    assert del_resp.status_code == 204


def test_analytics_summary():
    login_resp = client.post("/api/auth/login", json={
        "email": "akarshan@email.com",
        "password": "password123"
    })
    token = login_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    analytics_resp = client.get("/api/analytics", headers=headers)
    assert analytics_resp.status_code == 200
    data = analytics_resp.json()
    assert "totalApplications" in data or "total_applications" in data
    assert "applicationStatus" in data or "application_status" in data


def test_assistant_query():
    login_resp = client.post("/api/auth/login", json={
        "email": "akarshan@email.com",
        "password": "password123"
    })
    token = login_resp.json()["token"]
    headers = {"Authorization": f"Bearer {token}"}

    query_payload = {
        "query": "What should I do next?",
        "action": "WHAT_NEXT"
    }
    assistant_resp = client.post("/api/assistant/ask", json=query_payload, headers=headers)
    assert assistant_resp.status_code == 200
    data = assistant_resp.json()
    assert "reply" in data
    assert len(data["reply"]) > 10


def test_job_match_engine():
    from app.services.job_match_engine_service import JobMatchEngineService
    from app.models.models import CvProfile
    import json

    engine = JobMatchEngineService()
    profile = CvProfile(
        extracted_skills=json.dumps(["Python", "FastAPI", "PostgreSQL", "Docker", "AWS", "PyTorch"]),
        target_roles=json.dumps(["Python Developer", "Software Engineer"]),
        experience_years=3,
        education_level="Bachelor's in Computer Science",
        preferred_location="London, United Kingdom",
        is_remote_preferred=True
    )

    result = engine.calculate_match(
        profile=profile,
        job_title="Software Engineer - Backend (Python)",
        job_company="Google",
        job_location="London, UK",
        employment_type="Full-time",
        job_description="Looking for a Python Backend Engineer with FastAPI, PostgreSQL, and Docker experience.",
        job_skills=["Python", "FastAPI", "Docker", "PostgreSQL"]
    )

    assert result.match_score >= 75
    assert len(result.matching_skills) >= 2
    assert "Python" in result.matching_skills or "FastAPI" in result.matching_skills
