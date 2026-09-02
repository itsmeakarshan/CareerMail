import re


class RoleExpansionHelper:
    @staticmethod
    def expand_role(role_query: str | None) -> list[str]:
        if not role_query or not role_query.strip():
            return []

        q = role_query.strip()
        expansions = {q}
        lower = q.lower()

        # Data Science & AI / ML
        if any(k in lower for k in ["data scien", "machine learn", "ai ", "ml ", "artificial intel", "applied scien"]):
            expansions.update([
                "Data Scientist", "Graduate Data Scientist", "Junior Data Scientist",
                "Machine Learning Engineer", "ML Engineer", "AI Engineer",
                "Applied Scientist", "Research Scientist", "Data Analyst", "Analytics Engineer"
            ])
        # Data Engineering
        elif any(k in lower for k in ["data eng", "big data", "etl", "data platform"]):
            expansions.update([
                "Data Engineer", "Big Data Engineer", "Data Platform Engineer",
                "Analytics Engineer", "ETL Developer", "Data Infrastructure Engineer"
            ])
        # Frontend / React
        elif any(k in lower for k in ["frontend", "front end", "react", "ui developer", "web developer"]):
            expansions.update([
                "Frontend Engineer", "Front End Developer", "React Developer",
                "UI Developer", "Full Stack Developer", "Web Developer", "TypeScript Engineer"
            ])
        # Backend / Python / C# / Java
        elif any(k in lower for k in ["backend", "back end", "python", "fastapi", "django", "c#", ".net", "java", "golang"]):
            expansions.update([
                "Backend Engineer", "Back End Developer", "Software Engineer",
                "Python Developer", "Python Backend Engineer", "Full Stack Developer",
                "Platform Engineer", "API Developer"
            ])
        # Cloud / DevOps
        elif any(k in lower for k in ["devops", "cloud", "sre", "site reliab", "infrastructure"]):
            expansions.update([
                "DevOps Engineer", "Cloud Engineer", "Site Reliability Engineer",
                "SRE", "Platform Engineer", "Infrastructure Engineer", "Cloud Architect"
            ])
        # General Software Engineering
        elif any(k in lower for k in ["software", "developer", "engineer", "programmer", "full stack", "fullstack"]):
            expansions.update([
                "Software Engineer", "Software Developer", "Full Stack Developer",
                "Backend Engineer", "Frontend Engineer", "Python Developer"
            ])

        # Add graduate and junior variations
        base = list(expansions)
        for item in base:
            if not item.lower().startswith("grad") and not item.lower().startswith("jun"):
                expansions.add(f"Graduate {item}")
                expansions.add(f"Junior {item}")

        return list(expansions)

    @staticmethod
    def matches_expanded_role(job_title: str, expanded_roles: list[str]) -> bool:
        if not expanded_roles:
            return True
        if not job_title or not job_title.strip():
            return False

        t_low = job_title.lower()
        t_words = set(re.findall(r"\b\w{3,}\b", t_low))

        for role in expanded_roles:
            r_low = role.lower()
            if r_low in t_low or t_low in r_low:
                return True
            r_words = set(re.findall(r"\b\w{3,}\b", r_low))
            if r_words and r_words.issubset(t_words):
                return True

        return False
