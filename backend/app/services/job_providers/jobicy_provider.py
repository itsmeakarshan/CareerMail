import re
import urllib.parse
import httpx
import logging
from html import unescape
from app.schemas.job_search import JobListing
from app.services.job_providers.base_provider import BaseJobProvider

logger = logging.getLogger(__name__)


class JobicyJobProvider(BaseJobProvider):
    @property
    def provider_name(self) -> str:
        return "Jobicy API"

    async def fetch_jobs(self, query: str | None, location: str | None, work_mode: str | None) -> list[JobListing]:
        results = []
        url = "https://jobicy.com/api/v2/remote-jobs?count=30"
        if query and query.strip():
            url += f"&tag={urllib.parse.quote_plus(query.strip())}"

        try:
            async with httpx.AsyncClient(timeout=8.0, headers={"User-Agent": "CareerMail/1.0"}) as client:
                resp = await client.get(url)
                if resp.status_code != 200:
                    return results

                data = resp.json()
                jobs_list = data.get("jobs", [])

                for item in jobs_list:
                    j_id = str(item.get("id", ""))
                    title = item.get("jobTitle", "")
                    company = item.get("companyName", "")
                    logo = item.get("companyLogo", "") or item.get("companyLogoUrl", "")
                    job_geo = item.get("jobGeo", "Remote")
                    job_type = item.get("jobType", "Full-time")
                    if isinstance(job_type, list):
                        job_type = ", ".join(job_type)
                    desc = unescape(re.sub(r"<.*?>", "", item.get("jobExcerpt", "")))
                    url_link = item.get("url", "")
                    pub_date = item.get("pubDate", "Recently")
                    skills = item.get("jobIndustry", []) if isinstance(item.get("jobIndustry"), list) else []

                    work_m = "ONSITE" if "onsite" in job_geo.lower() else ("HYBRID" if "hybrid" in job_geo.lower() else "REMOTE")
                    domain = f"{re.sub(r'[^a-z0-9]', '', company.lower())}.com"

                    is_senior = "senior" in title.lower() or "lead" in title.lower()
                    is_junior = "junior" in title.lower() or "graduate" in title.lower()
                    exp_level = "Senior Level" if is_senior else ("Entry Level" if is_junior else "Mid Level")

                    results.append(JobListing(
                        id=f"jobicy-{j_id}",
                        title=title,
                        company=company,
                        company_domain=domain,
                        company_logo_url=logo or f"https://www.google.com/s2/favicons?domain={domain}&sz=128",
                        location=job_geo or "Remote",
                        country="United Kingdom" if ("uk" in job_geo.lower() or "united kingdom" in job_geo.lower()) else "Worldwide",
                        city="Remote",
                        work_mode=work_m,
                        employment_type=job_type or "Full-time",
                        experience_level=exp_level,
                        salary="$80,000 - $140,000 / year",
                        description=desc[:500] + "..." if len(desc) > 500 else desc,
                        url=url_link,
                        source_url=url_link,
                        apply_url=url_link,
                        posted_date=pub_date or "Recently",
                        source="Jobicy API",
                        source_job_id=j_id,
                        skills=skills if skills else ["Python", "Software Engineering"]
                    ))
        except Exception as e:
            logger.debug(f"Jobicy provider error: {e}")

        return results
