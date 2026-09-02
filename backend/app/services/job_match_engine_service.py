import json
import re
from dataclasses import dataclass, field
from app.models.models import CvProfile
from app.schemas.job_search import RelatedSkillMatch
from app.services.candidate_domain_engine import CandidateDomainEngine


@dataclass
class JobMatchResult:
    match_score: int = 0
    match_quality_label: str = "FAIR MATCH"
    matching_skills: list[str] = field(default_factory=list)
    related_skills: list[RelatedSkillMatch] = field(default_factory=list)
    missing_skills: list[str] = field(default_factory=list)
    skills_score: int = 0
    role_relevance_score: int = 0
    experience_relevance_score: int = 0
    location_score: int = 0
    education_score: int = 0
    explanation: str = ""


class JobMatchEngineService:
    # Semantic skill transferability graph with similarity multipliers
    SKILL_GRAPH = {
        "fastapi": [("flask", 0.9, "Python API Framework"), ("django", 0.85, "Python Web Framework"), ("express", 0.7, "RESTful Architecture")],
        "django": [("fastapi", 0.85, "Python Web Backend"), ("flask", 0.9, "Python Backend")],
        "pytorch": [("tensorflow", 0.9, "Deep Learning Framework"), ("scikit-learn", 0.8, "ML Modeling"), ("keras", 0.85, "Deep Learning")],
        "tensorflow": [("pytorch", 0.9, "Deep Learning Framework"), ("keras", 0.9, "Deep Learning"), ("scikit-learn", 0.8, "ML Modeling")],
        "scikit-learn": [("pytorch", 0.8, "Machine Learning"), ("pandas", 0.85, "Data Science Ecosystem"), ("machine learning", 0.95, "ML Core")],
        "postgresql": [("sql", 0.95, "Relational SQL"), ("mysql", 0.9, "RDBMS"), ("sqlite", 0.85, "RDBMS"), ("mongodb", 0.65, "Database Systems")],
        "mysql": [("postgresql", 0.9, "RDBMS"), ("sql", 0.95, "Relational SQL")],
        "sql": [("postgresql", 0.95, "RDBMS"), ("mysql", 0.95, "RDBMS"), ("bigquery", 0.85, "SQL Analytics")],
        "react": [("next.js", 0.9, "React Framework"), ("typescript", 0.85, "Frontend Ecosystem"), ("vue", 0.75, "Frontend Framework")],
        "typescript": [("javascript", 0.95, "Core JavaScript"), ("react", 0.85, "Frontend Typing"), ("node.js", 0.8, "Full Stack JS")],
        "docker": [("kubernetes", 0.85, "Container Orchestration"), ("aws", 0.75, "Cloud Infrastructure"), ("ci/cd", 0.8, "DevOps Pipelines")],
        "aws": [("gcp", 0.85, "Cloud Platform"), ("azure", 0.85, "Cloud Platform"), ("docker", 0.75, "Cloud Deployment")],
        "machine learning": [("data science", 0.9, "AI / ML Domain"), ("deep learning", 0.9, "Neural Networks"), ("python", 0.85, "Core ML Tooling")],
        "python": [("fastapi", 0.9, "Python Framework"), ("django", 0.85, "Python Backend"), ("machine learning", 0.85, "Python ML Stack")]
    }

    def __init__(self, domain_engine: CandidateDomainEngine | None = None):
        self.domain_engine = domain_engine or CandidateDomainEngine()

    def calculate_match(
        self,
        profile: CvProfile,
        job_title: str,
        job_company: str,
        job_location: str,
        employment_type: str,
        job_description: str,
        job_skills: list[str]
    ) -> JobMatchResult:
        candidate_skills = json.loads(profile.extracted_skills) if profile.extracted_skills else []
        candidate_roles = json.loads(profile.target_roles) if profile.target_roles else []
        candidate_years = profile.experience_years or 0

        # Normalization
        cand_skills_lower = {s.lower().strip(): s for s in candidate_skills}
        
        # 1. TECHNICAL SKILLS COMPATIBILITY (40 points max)
        exact_matches = []
        related_matches = []
        missing_skills = []

        all_job_skills = list(job_skills)
        if not all_job_skills:
            all_job_skills = self._extract_skills_from_text(f"{job_title} {job_description}")

        for j_skill in all_job_skills:
            j_clean = j_skill.strip()
            j_lower = j_clean.lower()

            # Exact match check
            if j_lower in cand_skills_lower or any(c_low == j_lower or c_low in j_lower for c_low in cand_skills_lower):
                exact_matches.append(j_clean)
                continue

            # Semantic / Related match check via graph
            found_related = False
            for c_low, c_orig in cand_skills_lower.items():
                relations = self.SKILL_GRAPH.get(c_low, [])
                for rel_name, weight, rel_desc in relations:
                    if rel_name in j_lower or j_lower in rel_name:
                        related_matches.append(RelatedSkillMatch(
                            candidate_skill=c_orig,
                            job_skill=j_clean,
                            weight_multiplier=weight,
                            relation_type=rel_desc,
                            explanation=f"{c_orig} provides transferable foundation for {j_clean} ({int(weight*100)}% match)"
                        ))
                        found_related = True
                        break
                if found_related:
                    break

            if not found_related:
                missing_skills.append(j_clean)

        exact_points = len(exact_matches) * 7.5
        related_points = sum(r.weight_multiplier * 5.0 for r in related_matches)
        skills_score = int(min(40, max(12, exact_points + related_points)))

        # 2. ROLE & TITLE RELEVANCE (25 points max)
        candidate_domain = self.domain_engine.analyze_profile(profile)
        role_score = self.domain_engine.calculate_domain_compatibility(candidate_domain, job_title, job_description)
        role_score = min(25, max(5, role_score))

        # 3. EXPERIENCE LEVEL CALIBRATION (15 points max)
        title_lower = job_title.lower()
        desc_lower = job_description.lower()

        is_junior_or_grad = any(k in title_lower or k in desc_lower for k in ["graduate", "junior", "entry level", "trainee", "associate", "intern", "0-1"])
        is_senior = any(k in title_lower or k in desc_lower for k in ["senior", "lead", "staff", "principal", "head of", "director", "5+"])

        if candidate_years <= 1:
            if is_junior_or_grad:
                exp_score = 15
            elif is_senior:
                exp_score = 4
            else:
                exp_score = 11
        elif candidate_years >= 5:
            if is_senior:
                exp_score = 15
            elif is_junior_or_grad:
                exp_score = 8
            else:
                exp_score = 13
        else:
            # Mid-level (2-4 years)
            if is_senior:
                exp_score = 10 if candidate_years >= 3 else 6
            elif is_junior_or_grad:
                exp_score = 11
            else:
                exp_score = 15

        exp_score = min(15, max(0, exp_score))

        # 4. LOCATION & WORK MODE (10 points max)
        loc_lower = (job_location or "").lower()
        desc_loc = job_description.lower()
        is_remote_job = "remote" in loc_lower or "remote" in desc_loc or "remote" in (employment_type or "").lower()

        if profile.is_remote_preferred and is_remote_job:
            location_score = 10
        elif profile.preferred_location and (profile.preferred_location.lower() in loc_lower or "london" in loc_lower or "uk" in loc_lower or "united kingdom" in loc_lower):
            location_score = 10
        elif is_remote_job:
            location_score = 8
        else:
            location_score = 5

        # 5. EDUCATION FIT (10 points max)
        education_score = 8
        edu = (profile.education_level or "").lower()
        if "master" in edu or "phd" in edu or "doctorate" in edu:
            education_score = 10
        elif "bachelor" in edu or is_junior_or_grad:
            education_score = 9

        # 6. TOTAL WEIGHTED SCORE (0-100)
        total_score = min(100, max(0, skills_score + role_score + exp_score + location_score + education_score))

        if total_score >= 85:
            quality_label = "STRONG MATCH"
        elif total_score >= 70:
            quality_label = "GOOD MATCH"
        elif total_score >= 50:
            quality_label = "FAIR MATCH"
        else:
            quality_label = "LOW MATCH"

        explanation_parts = [
            f"CareerMail Match Score: {total_score}% ({quality_label}).",
            f"• Technical Skills ({skills_score}/40): {len(exact_matches)} direct match(es), {len(related_matches)} transferable skill(s).",
            f"• Role Relevance ({role_score}/25): Title '{job_title}' vs candidate domain.",
            f"• Experience ({exp_score}/15): Candidate has ~{candidate_years} yrs exp.",
            f"• Location ({location_score}/10): {job_location}.",
            f"• Education ({education_score}/10): '{profile.education_level}'."
        ]

        return JobMatchResult(
            match_score=total_score,
            match_quality_label=quality_label,
            matching_skills=list(set(exact_matches)),
            related_skills=related_matches,
            missing_skills=list(set(missing_skills)),
            skills_score=skills_score,
            role_relevance_score=role_score,
            experience_relevance_score=exp_score,
            location_score=location_score,
            education_score=education_score,
            explanation=" ".join(explanation_parts)
        )

    def _extract_skills_from_text(self, text: str) -> list[str]:
        known = [
            "Python", "SQL", "FastAPI", "Django", "Flask", "PostgreSQL", "Docker", "Kubernetes",
            "AWS", "PyTorch", "TensorFlow", "React", "TypeScript", "Machine Learning", "Git", "REST API"
        ]
        found = []
        for k in known:
            if re.search(rf"\b{re.escape(k)}\b", text, re.IGNORECASE):
                found.append(k)
        return found if found else ["Software Engineering", "Python"]
