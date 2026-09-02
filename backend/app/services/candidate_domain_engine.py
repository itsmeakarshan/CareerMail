import json
from dataclasses import dataclass, field
from app.models.models import CvProfile


@dataclass
class CandidateDomainAnalysis:
    primary_domain: str
    target_roles: list[str] = field(default_factory=list)
    dynamic_search_queries: list[str] = field(default_factory=list)
    core_skills: list[str] = field(default_factory=list)
    adjacent_skills: list[str] = field(default_factory=list)


class CandidateDomainEngine:
    def analyze_profile(self, profile: CvProfile) -> CandidateDomainAnalysis:
        skills = json.loads(profile.extracted_skills) if profile.extracted_skills else []
        roles = json.loads(profile.target_roles) if profile.target_roles else []
        
        all_text = (" ".join(skills) + " " + " ".join(roles) + " " + (profile.raw_text or "")).lower()

        # 1. Data Science & AI / ML Domain
        if any(k in all_text for k in ["data scien", "machine learn", "pytorch", "tensorflow", "scikit", "deep learning", "nlp", "llm"]):
            return CandidateDomainAnalysis(
                primary_domain="Data Science & AI",
                target_roles=[
                    "Data Scientist", "Graduate Data Scientist", "Machine Learning Engineer",
                    "AI Engineer", "Applied Scientist", "Data Analyst", "Analytics Engineer"
                ],
                dynamic_search_queries=[
                    "Data Scientist London", "Junior Data Scientist", "Machine Learning Engineer",
                    "AI Engineer", "Data Analyst Graduate"
                ],
                core_skills=["Python", "SQL", "Machine Learning", "PyTorch", "Scikit-learn", "Pandas"],
                adjacent_skills=["Data Engineering", "AWS", "Docker", "FastAPI", "BigQuery"]
            )

        # 2. Data Engineering Domain
        if any(k in all_text for k in ["data eng", "spark", "kafka", "airflow", "snowflake", "bigquery", "dbt", "etl"]):
            return CandidateDomainAnalysis(
                primary_domain="Data Engineering",
                target_roles=[
                    "Data Engineer", "Graduate Data Engineer", "Big Data Engineer",
                    "Data Platform Engineer", "Analytics Engineer", "ETL Developer"
                ],
                dynamic_search_queries=[
                    "Data Engineer London", "Junior Data Engineer", "Data Platform Engineer", "Analytics Engineer"
                ],
                core_skills=["Python", "SQL", "Spark", "Kafka", "PostgreSQL", "Docker"],
                adjacent_skills=["FastAPI", "AWS", "Kubernetes", "Airflow", "GCP"]
            )

        # 3. Frontend & Full Stack Domain
        if any(k in all_text for k in ["react", "frontend", "front end", "next.js", "typescript", "javascript", "vue", "angular"]):
            return CandidateDomainAnalysis(
                primary_domain="Frontend & Full Stack",
                target_roles=[
                    "Frontend Engineer", "Full Stack Developer", "React Developer",
                    "Software Engineer", "Web Developer", "TypeScript Engineer"
                ],
                dynamic_search_queries=[
                    "Frontend Engineer London", "Full Stack Developer", "React Developer", "Software Engineer"
                ],
                core_skills=["React", "TypeScript", "JavaScript", "HTML", "CSS", "Tailwind CSS"],
                adjacent_skills=["Node.js", "Python", "FastAPI", "REST API", "Docker"]
            )

        # 4. Cloud & DevOps Domain
        if any(k in all_text for k in ["devops", "kubernetes", "terraform", "cloud engineer", "sre", "site reliability"]):
            return CandidateDomainAnalysis(
                primary_domain="Cloud & DevOps",
                target_roles=[
                    "DevOps Engineer", "Cloud Engineer", "Site Reliability Engineer",
                    "SRE", "Infrastructure Engineer", "Platform Engineer"
                ],
                dynamic_search_queries=[
                    "DevOps Engineer London", "Cloud Engineer", "Site Reliability Engineer", "Platform Engineer"
                ],
                core_skills=["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD", "Linux"],
                adjacent_skills=["Python", "Go", "PostgreSQL", "Prometheus", "GCP"]
            )

        # 5. Backend & Software Engineering (Default)
        return CandidateDomainAnalysis(
            primary_domain="Backend Software Engineering",
            target_roles=[
                "Software Engineer", "Backend Developer", "Python Developer",
                "Full Stack Developer", "API Engineer", "Systems Developer"
            ],
            dynamic_search_queries=[
                "Software Engineer London", "Python Developer", "Backend Engineer", "Graduate Software Engineer"
            ],
            core_skills=["Python", "FastAPI", "SQL", "PostgreSQL", "REST API", "Git"],
            adjacent_skills=["Docker", "AWS", "Microservices", "React", "TypeScript", "Redis"]
        )

    def calculate_domain_compatibility(self, domain: CandidateDomainAnalysis, job_title: str, job_desc: str) -> int:
        title_lower = job_title.lower()
        desc_lower = job_desc.lower()

        # Check target roles direct match
        for r in domain.target_roles:
            if r.lower() in title_lower or title_lower in r.lower():
                return 25

        # Check token overlaps
        title_words = set(title_lower.split())
        matched_tokens = 0
        for r in domain.target_roles:
            r_words = set(r.lower().split())
            if r_words.intersection(title_words):
                matched_tokens += 1

        if matched_tokens >= 2:
            return 22
        elif matched_tokens == 1:
            return 18

        # Fallback to description match
        if any(s.lower() in desc_lower for s in domain.core_skills):
            return 14

        return 8
