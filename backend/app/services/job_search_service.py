import re
import asyncio
import logging
import urllib.parse
from datetime import datetime, date
from sqlalchemy.orm import Session
from app.models.models import CvProfile, SavedJobListing, JobApplication, TimelineEvent
from app.models.enums import ApplicationStatus, Priority, RecruiterType
from app.schemas.job_search import (
    JobListing,
    ConvertJobToApplicationRequest,
    SaveJobRequest
)
from app.services.job_match_engine_service import JobMatchEngineService
from app.services.candidate_domain_engine import CandidateDomainEngine
from app.services.job_providers import (
    BaseJobProvider,
    RemotiveJobProvider,
    AtsPublicJobProvider,
    JobicyJobProvider,
    RemoteOKJobProvider,
    AggregatorJobProvider,
    LocationExpansionHelper,
    RoleExpansionHelper
)

logger = logging.getLogger(__name__)


class JobSearchService:
    def __init__(
        self,
        db: Session,
        match_engine: JobMatchEngineService | None = None,
        domain_engine: CandidateDomainEngine | None = None
    ):
        self.db = db
        self.match_engine = match_engine or JobMatchEngineService()
        self.domain_engine = domain_engine or CandidateDomainEngine()
        self.providers: list[BaseJobProvider] = [
            AtsPublicJobProvider(),
            RemotiveJobProvider(),
            JobicyJobProvider(),
            RemoteOKJobProvider(),
            AggregatorJobProvider()
        ]

    async def search_jobs(
        self,
        profile: CvProfile,
        query: str | None = None,
        location: str | None = None,
        work_type: str | None = None,
        min_score: int = 0,
        sort_by: str = "score"
    ) -> list[JobListing]:
        clean_query, extracted_loc = self._parse_natural_query(query, location)
        candidate_domain = self.domain_engine.analyze_profile(profile)
        expanded_roles = RoleExpansionHelper.expand_role(clean_query) if clean_query else candidate_domain.target_roles

        # 1. Query all modular providers in parallel
        tasks = [p.fetch_jobs(clean_query, extracted_loc, work_type) for p in self.providers]
        nested_results = await asyncio.gather(*tasks, return_exceptions=True)

        raw_listings: list[JobListing] = []
        for res in nested_results:
            if isinstance(res, list):
                raw_listings.extend(res)

        # 2. Deduplicate listings
        deduplicated = self._deduplicate_and_merge_jobs(raw_listings)

        # 3. Match, enrich & filter
        matched_listings: list[JobListing] = []
        for job in deduplicated:
            clean_title = job.title
            clean_comp = job.company
            clean_loc = job.location or "United Kingdom"

            encoded_kw = urllib.parse.quote_plus(f"{clean_title} {clean_comp}")
            encoded_l = urllib.parse.quote_plus(clean_loc)

            # Direct Search URLs
            job.linked_in_url = f"https://www.linkedin.com/jobs/search/?keywords={encoded_kw}&location={encoded_l}"
            is_uk = LocationExpansionHelper.is_uk_location(clean_loc)
            job.indeed_url = f"https://uk.indeed.com/jobs?q={encoded_kw}&l={encoded_l}" if is_uk else f"https://www.indeed.com/jobs?q={encoded_kw}&l={encoded_l}"
            job.google_jobs_url = f"https://www.google.com/search?q={urllib.parse.quote_plus(f'{clean_comp} {clean_title} careers {clean_loc}')}&ibp=htl;jobs"

            # Apply URLs
            if not job.apply_url:
                job.apply_url = job.source_url or job.url
            if not job.apply_url:
                job.apply_url = f"https://www.google.com/search?q={urllib.parse.quote_plus(f'{clean_comp} {clean_title} jobs {clean_loc}')}"

            if not job.source_url:
                job.source_url = job.apply_url
            if not job.url:
                job.url = job.apply_url

            # Domain & Logo
            if not job.company_domain:
                job.company_domain = self.infer_company_domain(job.company, job.apply_url)
            if not job.company_logo_url:
                job.company_logo_url = f"https://www.google.com/s2/favicons?domain={job.company_domain}&sz=128"

            # Calculate 5-Pillar Match Score
            match_res = self.match_engine.calculate_match(
                profile=profile,
                job_title=job.title,
                job_company=job.company,
                job_location=job.location,
                employment_type=job.employment_type,
                job_description=job.description,
                job_skills=job.skills
            )

            job.match_score = match_res.match_score
            job.match_quality_label = match_res.match_quality_label
            job.matching_skills = match_res.matching_skills
            job.related_skills = match_res.related_skills
            job.missing_skills = match_res.missing_skills
            job.skills_score = match_res.skills_score
            job.role_relevance_score = match_res.role_relevance_score
            job.experience_relevance_score = match_res.experience_relevance_score
            job.location_score = match_res.location_score
            job.education_score = match_res.education_score
            job.explanation = match_res.explanation

            # Apply Filters
            if clean_query:
                matches_q = (
                    RoleExpansionHelper.matches_expanded_role(job.title, expanded_roles)
                    or clean_query.lower() in job.company.lower()
                    or clean_query.lower() in job.description.lower()
                    or any(clean_query.lower() in s.lower() for s in job.skills)
                )
                if not matches_q:
                    continue

            if extracted_loc:
                if not LocationExpansionHelper.matches_location(extracted_loc, job.location, job.country, job.city, job.work_mode):
                    continue

            if work_type and work_type.upper() != "ALL":
                wt = work_type.upper()
                if wt == "REMOTE" and job.work_mode != "REMOTE" and "remote" not in (job.location or "").lower():
                    continue
                if wt == "HYBRID" and job.work_mode != "HYBRID" and "hybrid" not in (job.location or "").lower():
                    continue
                if wt == "ONSITE" and job.work_mode != "ONSITE" and ("remote" in (job.location or "").lower() or job.work_mode == "REMOTE"):
                    continue

            if job.match_score < min_score:
                continue

            matched_listings.append(job)

        # 4. Sort Results
        return self._apply_sorting(matched_listings, sort_by)

    async def get_job_by_id(self, profile: CvProfile, job_id: str) -> JobListing | None:
        all_jobs = await self.search_jobs(profile)
        for j in all_jobs:
            if j.id.lower() == job_id.lower():
                return j
        return None

    def save_job(self, user_id: int, request: SaveJobRequest) -> SavedJobListing:
        existing = (
            self.db.query(SavedJobListing)
            .filter(SavedJobListing.user_id == user_id, SavedJobListing.job_id == request.job_id)
            .first()
        )
        if existing:
            return existing

        saved = SavedJobListing(
            user_id=user_id,
            job_id=request.job_id,
            title=request.title,
            company=request.company,
            location=request.location,
            employment_type=request.employment_type or "Full-time",
            salary=request.salary,
            url=request.url,
            match_score=request.match_score,
            saved_at=datetime.utcnow()
        )
        self.db.add(saved)
        self.db.commit()
        self.db.refresh(saved)
        return saved

    def get_saved_jobs(self, user_id: int) -> list[SavedJobListing]:
        return (
            self.db.query(SavedJobListing)
            .filter(SavedJobListing.user_id == user_id)
            .order_by(SavedJobListing.saved_at.desc())
            .all()
        )

    def convert_job_to_application(self, user_id: int, request: ConvertJobToApplicationRequest) -> JobApplication:
        company = request.company.strip() or "Company"
        title = request.title.strip() or "Software Engineer"
        logo = re.sub(r"[^a-z0-9]", "", company.lower())

        app = JobApplication(
            user_id=user_id,
            company=company,
            title=title,
            location=request.location or "Remote",
            employment_type=request.employment_type or "Full-time",
            salary=request.salary,
            date_applied=date.today(),
            status=ApplicationStatus.APPLIED.value,
            priority=Priority.HIGH.value,
            source="CareerMail Job Search",
            notes=f"Converted from Job Search listing: {request.url}\n\nDescription summary:\n{request.description[:300]}",
            company_logo=logo,
            activity_subtitle="Applied via Job Search",
            last_activity_date=date.today(),
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )

        app.timeline_events.append(TimelineEvent(
            title=f"Applied for {title}",
            description=f"Direct job application submitted for {company}",
            event_date=datetime.utcnow(),
            event_type="APPLIED"
        ))

        self.db.add(app)
        self.db.commit()
        self.db.refresh(app)
        return app

    def infer_company_domain(self, company_name: str, job_url: str | None = None) -> str:
        if job_url:
            try:
                parsed = urllib.parse.urlparse(job_url)
                host = parsed.netloc.lower().replace("www.", "").replace("careers.", "").replace("jobs.", "")
                if not any(k in host for k in ["remoteok", "jobicy", "workable", "lever", "greenhouse", "remotive"]):
                    return host
            except Exception:
                pass

        if not company_name:
            return "company.com"

        c_low = company_name.lower().strip()
        domain_lookup = {
            "google": "google.com",
            "deepmind": "deepmind.google",
            "bloomberg": "bloomberg.com",
            "bbc": "bbc.co.uk",
            "cloudflare": "cloudflare.com",
            "monzo": "monzo.com",
            "revolut": "revolut.com",
            "spotify": "spotify.com",
            "amazon": "amazon.com",
            "microsoft": "microsoft.com",
            "apple": "apple.com",
            "meta": "meta.com",
            "netflix": "netflix.com",
            "stripe": "stripe.com",
            "deliveroo": "deliveroo.co.uk",
            "palantir": "palantir.com",
            "snyk": "snyk.io",
            "gitlab": "gitlab.com",
            "datadog": "datadoghq.com",
            "canonical": "canonical.com",
            "elastic": "elastic.co",
            "reddit": "reddit.com",
            "figma": "figma.com",
            "astrazeneca": "astrazeneca.co.uk"
        }

        for k, v in domain_lookup.items():
            if k in c_low:
                return v

        slug = re.sub(r"[^a-z0-9]", "", c_low)
        return f"{slug}.com" if slug else "company.com"

    def _parse_natural_query(self, query: str | None, explicit_location: str | None) -> tuple[str, str]:
        if not query or not query.strip():
            return "", explicit_location or ""

        q = query.strip()
        loc = explicit_location or ""

        known_locs = ["london", "manchester", "birmingham", "cambridge", "oxford", "bristol", "edinburgh", "uk", "united kingdom", "remote"]
        for l in known_locs:
            if q.lower().endswith(f" {l}"):
                clean_q = q[:-(len(l) + 1)].strip()
                if not loc:
                    loc = l
                return clean_q, loc

        return q, loc

    def _deduplicate_and_merge_jobs(self, jobs: list[JobListing]) -> list[JobListing]:
        groups = {}
        for j in jobs:
            t_norm = re.sub(r"[^a-z0-9]", "", j.title.lower())
            c_norm = re.sub(r"[^a-z0-9]", "", j.company.lower())
            l_norm = "uk" if LocationExpansionHelper.is_uk_location(j.location) else re.sub(r"[^a-z0-9]", "", (j.location or "").lower())
            key = f"{c_norm}|{t_norm}|{l_norm}"

            if key not in groups:
                groups[key] = []
            groups[key].append(j)

        canonical_list = []
        for group in groups.values():
            canonical = sorted(group, key=lambda j: self._get_source_priority(j.source))[0]
            best_apply_url = next((j.apply_url for j in group if j.apply_url and any(k in j.apply_url for k in ["greenhouse.io", "lever.co", "careers.", "jobs."])), None)
            if best_apply_url:
                canonical.apply_url = best_apply_url
                canonical.is_external_application = True
            canonical_list.append(canonical)

        return canonical_list

    def _get_source_priority(self, source: str | None) -> int:
        if not source:
            return 5
        s = source.lower()
        if any(k in s for k in ["greenhouse", "lever", "ats", "ashby"]):
            return 1
        if any(k in s for k in ["careers", "official"]):
            return 2
        if "linkedin" in s:
            return 3
        if any(k in s for k in ["remotive", "jobicy", "remoteok"]):
            return 4
        return 5

    def _apply_sorting(self, jobs: list[JobListing], sort_by: str | None) -> list[JobListing]:
        s = (sort_by or "score").lower()
        if s in ("score_desc", "score"):
            return sorted(jobs, key=lambda j: j.match_score, reverse=True)
        elif s == "score_asc":
            return sorted(jobs, key=lambda j: j.match_score)
        elif s == "company":
            return sorted(jobs, key=lambda j: j.company.lower())
        elif s in ("salary_desc", "salary"):
            return sorted(jobs, key=lambda j: self._extract_salary_number(j.salary), reverse=True)
        elif s == "recent":
            return sorted(jobs, key=lambda j: 3 if "hour" in j.posted_date.lower() else (2 if "day" in j.posted_date.lower() else 1), reverse=True)
        return sorted(jobs, key=lambda j: j.match_score, reverse=True)

    def _extract_salary_number(self, salary: str | None) -> int:
        if not salary:
            return 0
        m = re.search(r"[£$€]?\s*(\d{2,3})(?:,\d{3})?", salary)
        if m:
            try:
                return int(m.group(1)) * 1000
            except ValueError:
                pass
        return 0
