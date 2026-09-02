import re
import asyncio
import httpx
import logging
from app.schemas.job_search import JobListing
from app.services.job_providers.base_provider import BaseJobProvider
from app.services.job_providers.role_expansion_helper import RoleExpansionHelper
from app.services.job_providers.location_helper import LocationExpansionHelper

logger = logging.getLogger(__name__)


class AtsPublicJobProvider(BaseJobProvider):
    GREENHOUSE_BOARDS = [
        ("monzo", "Monzo", "monzo.com"),
        ("canonical", "Canonical", "canonical.com"),
        ("cloudflare", "Cloudflare", "cloudflare.com"),
        ("gitlab", "GitLab", "gitlab.com"),
        ("datadog", "Datadog", "datadoghq.com"),
        ("figma", "Figma", "figma.com"),
        ("elastic", "Elastic", "elastic.co"),
        ("reddit", "Reddit", "reddit.com")
    ]

    LEVER_BOARDS = [
        ("spotify", "Spotify", "spotify.com"),
        ("palantir", "Palantir Technologies", "palantir.com")
    ]

    @property
    def provider_name(self) -> str:
        return "ATS Public Feeds (Greenhouse & Lever)"

    async def fetch_jobs(self, query: str | None, location: str | None, work_mode: str | None) -> list[JobListing]:
        tasks = []
        async with httpx.AsyncClient(timeout=6.0, headers={"User-Agent": "CareerMail/1.0 (ATSJobDiscovery)"}) as client:
            for board, comp, domain in self.GREENHOUSE_BOARDS:
                tasks.append(self._fetch_greenhouse_board(client, board, comp, domain, query, location))
            for site, comp, domain in self.LEVER_BOARDS:
                tasks.append(self._fetch_lever_board(client, site, comp, domain, query, location))

            results_nested = await asyncio.gather(*tasks, return_exceptions=True)

        all_jobs = []
        for res in results_nested:
            if isinstance(res, list):
                all_jobs.extend(res)
        return all_jobs

    async def _fetch_greenhouse_board(
        self,
        client: httpx.AsyncClient,
        board_slug: str,
        company_name: str,
        domain: str,
        query: str | None,
        location: str | None
    ) -> list[JobListing]:
        results = []
        url = f"https://boards-api.greenhouse.io/v1/boards/{board_slug}/jobs"
        try:
            resp = await client.get(url)
            if resp.status_code != 200:
                return results

            data = resp.json()
            jobs_list = data.get("jobs", [])
            expanded_roles = RoleExpansionHelper.expand_role(query) if query else []

            for item in jobs_list:
                j_id = str(item.get("id", ""))
                title = item.get("title", "")
                abs_url = item.get("absolute_url", "")
                updated_at = item.get("updated_at", "Recently")
                loc_obj = item.get("location", {})
                loc_name = loc_obj.get("name", "Worldwide / Remote") if isinstance(loc_obj, dict) else "Worldwide / Remote"

                if query and not RoleExpansionHelper.matches_expanded_role(title, expanded_roles):
                    continue

                country = "United Kingdom" if LocationExpansionHelper.is_uk_location(loc_name) else "Remote"
                city = "London" if "london" in loc_name.lower() else ("Manchester" if "manchester" in loc_name.lower() else loc_name)
                work_m = "REMOTE" if "remote" in loc_name.lower() else ("HYBRID" if "hybrid" in loc_name.lower() else "ONSITE")

                is_senior = any(k in title.lower() for k in ["senior", "lead", "principal", "staff"])
                is_junior = any(k in title.lower() for k in ["junior", "graduate", "intern", "associate"])
                exp_level = "Senior Level" if is_senior else ("Entry Level" if is_junior else "Mid Level")

                skills = self._extract_skills(title)

                results.append(JobListing(
                    id=f"greenhouse-{board_slug}-{j_id}",
                    title=title,
                    company=company_name,
                    company_domain=domain,
                    company_logo_url=f"https://www.google.com/s2/favicons?domain={domain}&sz=128",
                    location=loc_name,
                    country=country,
                    city=city,
                    work_mode=work_m,
                    employment_type="Full-time",
                    experience_level=exp_level,
                    description=f"Official open position for {title} at {company_name}. Location: {loc_name}. Apply directly via Greenhouse ATS.",
                    skills=skills,
                    salary="Competitive market rate",
                    posted_date=updated_at or "Recently",
                    source=f"Greenhouse ({company_name})",
                    source_url=abs_url,
                    apply_url=abs_url,
                    is_external_application=True
                ))
        except Exception as e:
            logger.debug(f"Greenhouse board {board_slug} error: {e}")

        return results

    async def _fetch_lever_board(
        self,
        client: httpx.AsyncClient,
        site_slug: str,
        company_name: str,
        domain: str,
        query: str | None,
        location: str | None
    ) -> list[JobListing]:
        results = []
        url = f"https://api.lever.co/v0/postings/{site_slug}?mode=json"
        try:
            resp = await client.get(url)
            if resp.status_code != 200:
                return results

            data = resp.json()
            if not isinstance(data, list):
                return results

            expanded_roles = RoleExpansionHelper.expand_role(query) if query else []

            for item in data:
                j_id = str(item.get("id", ""))
                title = item.get("text", "")
                apply_url = item.get("hostedUrl", "")
                desc = item.get("descriptionPlain", "")
                categories = item.get("categories", {})
                loc_name = categories.get("location", "Remote") if isinstance(categories, dict) else "Remote"

                if query and not RoleExpansionHelper.matches_expanded_role(title, expanded_roles):
                    continue

                country = "United Kingdom" if LocationExpansionHelper.is_uk_location(loc_name) else "Remote"
                city = "London" if "london" in loc_name.lower() else loc_name
                work_m = "REMOTE" if "remote" in loc_name.lower() else ("HYBRID" if "hybrid" in loc_name.lower() else "ONSITE")

                is_senior = any(k in title.lower() for k in ["senior", "lead", "principal"])
                is_junior = any(k in title.lower() for k in ["junior", "graduate", "intern"])
                exp_level = "Senior Level" if is_senior else ("Entry Level" if is_junior else "Mid Level")

                skills = self._extract_skills(f"{title} {desc}")

                results.append(JobListing(
                    id=f"lever-{site_slug}-{j_id}",
                    title=title,
                    company=company_name,
                    company_domain=domain,
                    company_logo_url=f"https://www.google.com/s2/favicons?domain={domain}&sz=128",
                    location=loc_name,
                    country=country,
                    city=city,
                    work_mode=work_m,
                    employment_type="Full-time",
                    experience_level=exp_level,
                    description=desc[:500] + "..." if len(desc) > 500 else (desc or f"Official opening for {title} at {company_name}."),
                    skills=skills,
                    salary="Competitive market rate",
                    posted_date="Recently",
                    source=f"Lever ({company_name})",
                    source_url=apply_url,
                    apply_url=apply_url,
                    is_external_application=True
                ))
        except Exception as e:
            logger.debug(f"Lever board {site_slug} error: {e}")

        return results

    def _extract_skills(self, text: str) -> list[str]:
        known = ["Python", "SQL", "Machine Learning", "PyTorch", "React", "TypeScript", "FastAPI", "AWS", "Docker", "PostgreSQL", "Go", "Java", "C++"]
        found = [k for k in known if re.search(rf"\b{re.escape(k)}\b", text, re.IGNORECASE)]
        return found if found else ["Software Engineering", "Python"]
