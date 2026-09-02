import io
import json
import logging
import re
from datetime import datetime
from pypdf import PdfReader
from docx import Document
from sqlalchemy.orm import Session
from fastapi import UploadFile, HTTPException, status
from app.models.models import CvProfile, User
from app.schemas.job_search import CvProfileDto
from app.services.gemini_cv_service import GeminiCvService

logger = logging.getLogger(__name__)


class CvParsingService:
    KNOWN_SKILLS = [
        "Python", "FastAPI", "Django", "Flask", "SQL", "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis",
        "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Git", "GitHub", "CI/CD", "REST API", "GraphQL",
        "Microservices", "React", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind CSS", "Next.js",
        "Node.js", "Express", "C#", ".NET", "Java", "Spring Boot", "Go", "Golang", "Rust", "C++",
        "Machine Learning", "Deep Learning", "PyTorch", "TensorFlow", "Scikit-learn", "Pandas", "NumPy",
        "Data Science", "Data Engineering", "Apache Spark", "Kafka", "Airflow", "NLP", "LLMs", "Computer Vision"
    ]

    def __init__(self, db: Session, gemini_service: GeminiCvService | None = None):
        self.db = db
        self.gemini_service = gemini_service or GeminiCvService()

    async def parse_and_save_cv(self, user_id: int, file: UploadFile) -> CvProfileDto:
        filename = file.filename or "uploaded_cv.pdf"
        content_bytes = await file.read()
        raw_text = self._extract_raw_text(filename, content_bytes)

        if not raw_text or len(raw_text.strip()) < 20:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not extract readable text from the uploaded CV file. Please ensure it is a valid PDF or DOCX file."
            )

        # Get user's gemini key if available
        user = self.db.query(User).filter(User.id == user_id).first()
        gemini_key = user.gemini_api_key if user else None

        extracted_skills = []
        target_roles = []
        experience_years = 0
        education_level = "Bachelor's Degree"
        preferred_location = "London, United Kingdom"
        is_remote = True

        # 1. Try Gemini AI extraction if configured
        gemini_data = await self.gemini_service.extract_cv_profile(raw_text, gemini_key)
        if gemini_data:
            extracted_skills = gemini_data.get("extractedSkills", [])
            target_roles = gemini_data.get("targetRoles", [])
            experience_years = gemini_data.get("experienceYears", 0)
            education_level = gemini_data.get("educationLevel", "Bachelor's Degree")
            preferred_location = gemini_data.get("preferredLocation", "London, United Kingdom")
            is_remote = gemini_data.get("isRemotePreferred", True)

        # 2. Rule-based extraction fallback/augmentation
        if not extracted_skills:
            extracted_skills = self._extract_skills_heuristic(raw_text)
        if not target_roles:
            target_roles = self._extract_target_roles_heuristic(raw_text)
        if experience_years == 0:
            experience_years = self._extract_experience_years_heuristic(raw_text)
        if not education_level or education_level == "Bachelor's Degree":
            education_level = self._extract_education_heuristic(raw_text)

        # Save or update CvProfile
        profile = self.db.query(CvProfile).filter(CvProfile.user_id == user_id).first()
        if not profile:
            profile = CvProfile(
                user_id=user_id,
                file_name=filename,
                raw_text=raw_text,
                extracted_skills=json.dumps(extracted_skills),
                target_roles=json.dumps(target_roles),
                experience_years=experience_years,
                education_level=education_level,
                preferred_location=preferred_location,
                is_remote_preferred=is_remote,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            self.db.add(profile)
        else:
            profile.file_name = filename
            profile.raw_text = raw_text
            profile.extracted_skills = json.dumps(extracted_skills)
            profile.target_roles = json.dumps(target_roles)
            profile.experience_years = experience_years
            profile.education_level = education_level
            profile.preferred_location = preferred_location
            profile.is_remote_preferred = is_remote
            profile.updated_at = datetime.utcnow()

        self.db.commit()
        self.db.refresh(profile)

        return self.get_profile_dto(profile)

    def get_user_profile(self, user_id: int) -> CvProfileDto | None:
        profile = self.db.query(CvProfile).filter(CvProfile.user_id == user_id).first()
        return self.get_profile_dto(profile) if profile else None

    def get_profile_entity(self, user_id: int) -> CvProfile:
        profile = self.db.query(CvProfile).filter(CvProfile.user_id == user_id).first()
        if not profile:
            # Return default profile
            skills = ["Python", "FastAPI", "SQL", "PostgreSQL", "Docker", "AWS", "Git", "REST API", "React"]
            roles = ["Software Engineer", "Backend Developer", "Python Developer"]
            profile = CvProfile(
                user_id=user_id,
                file_name="Default_Profile.pdf",
                raw_text="Default Python Software Engineer Profile",
                extracted_skills=json.dumps(skills),
                target_roles=json.dumps(roles),
                experience_years=2,
                education_level="Bachelor's in Computer Science",
                preferred_location="London, United Kingdom",
                is_remote_preferred=True
            )
        return profile

    def get_profile_dto(self, profile: CvProfile) -> CvProfileDto:
        skills = json.loads(profile.extracted_skills) if profile.extracted_skills else []
        roles = json.loads(profile.target_roles) if profile.target_roles else []
        return CvProfileDto(
            id=profile.id,
            file_name=profile.file_name,
            extracted_skills=skills,
            target_roles=roles,
            experience_years=profile.experience_years,
            education_level=profile.education_level,
            preferred_location=profile.preferred_location,
            is_remote_preferred=profile.is_remote_preferred,
            uploaded_at=profile.updated_at or profile.created_at
        )

    def _extract_raw_text(self, filename: str, content: bytes) -> str:
        lower_name = filename.lower()
        if lower_name.endswith(".pdf"):
            try:
                reader = PdfReader(io.BytesIO(content))
                pages_text = [page.extract_text() or "" for page in reader.pages]
                return "\n".join(pages_text)
            except Exception as e:
                logger.error(f"Error reading PDF {filename}: {e}")
                return ""
        elif lower_name.endswith(".docx") or lower_name.endswith(".doc"):
            try:
                doc = Document(io.BytesIO(content))
                paragraphs = [p.text for p in doc.paragraphs if p.text]
                return "\n".join(paragraphs)
            except Exception as e:
                logger.error(f"Error reading DOCX {filename}: {e}")
                return ""
        else:
            try:
                return content.decode("utf-8", errors="ignore")
            except Exception:
                return ""

    def _extract_skills_heuristic(self, text: str) -> list[str]:
        found = []
        for skill in self.KNOWN_SKILLS:
            pattern = rf"\b{re.escape(skill)}\b"
            if re.search(pattern, text, re.IGNORECASE):
                found.append(skill)
        return found if found else ["Python", "FastAPI", "SQL", "Git"]

    def _extract_target_roles_heuristic(self, text: str) -> list[str]:
        candidates = [
            "Software Engineer", "Backend Developer", "Python Developer", "Full Stack Developer",
            "Data Scientist", "Machine Learning Engineer", "DevOps Engineer", "Cloud Engineer"
        ]
        found = []
        for role in candidates:
            if re.search(rf"\b{re.escape(role)}\b", text, re.IGNORECASE):
                found.append(role)
        return found if found else ["Software Engineer", "Backend Developer"]

    def _extract_experience_years_heuristic(self, text: str) -> int:
        match = re.search(r"(\d+)\+?\s*years?(?:\s+of)?\s+experience", text, re.IGNORECASE)
        if match:
            try:
                return int(match.group(1))
            except ValueError:
                pass
        return 2

    def _extract_education_heuristic(self, text: str) -> str:
        if re.search(r"\b(phd|doctorate)\b", text, re.IGNORECASE):
            return "PhD / Doctorate"
        if re.search(r"\b(master|msc|meng)\b", text, re.IGNORECASE):
            return "Master's Degree"
        if re.search(r"\b(bachelor|bsc|beng|b\.s\.|b\.tech)\b", text, re.IGNORECASE):
            return "Bachelor's Degree"
        return "Bachelor's Degree"
