import re
import urllib.parse
import httpx
import logging
from html import unescape
from app.schemas.job_search import JobListing
from app.services.job_providers.base_provider import BaseJobProvider

logger = logging.getLogger(__name__)


class RemotiveJobProvider(BaseJobProvider):
    @property
    def provider_name(self) -> str:
        return "Remotive API"

    async def fetch_jobs(self, query: str | None, location: str | None, work_mode: str | None) -> list[JobListing]:
        results = []
        url = "https://remotive.com/api/remote-jobs?limit=50"
        if query and query.strip():
            url += f"&search={urllib.parse.quote_plus(query.strip())}"

        try:
            async with httpx.AsyncClient(timeout=8.0, headers={"User-Agent": "CareerMail/1.0 (JobDiscoveryBot)"}) as client:
                resp = await client.get(url)
                if resp.status_code != 200:
                    return results

                data = resp.json()
                jobs_data = data.get("jobs", [])

                for item in jobs_data:
                    j_id = str(item.get("id", ""))
                    title = item.get("title", "")
                    company = item.get("company_name", "")
                    candidate_loc = item.get("candidate_required_location", "Worldwide")
                    salary = item.get("salary", "Competitive")
                    job_url = item.get("url", "")
                    logo = item.get("company_logo", "")
                    desc_html = item.get("description", "")
                    pub_date = item.get("publication_time", "Recently")
                    tags = item.get("tags", [])

                    plain_desc = unescape(re.sub(r"<.*?>", " ", desc_html)).strip()
                    if len(plain_desc) > 600:
                        plain_desc = plain_desc[:600] + "..."

                    # Domain inference
                    domain = f"{re.sub(r'[^a-z0-9]', '', company.lower())}.com"

                    is_senior = "senior" in title.lower() or "lead" in title.lower()
                    is_junior = "junior" in title.lower() or "graduate" in title.lower()
                    exp_level = "Senior Level" if is_senior else ("Entry Level" if is_junior else "Mid Level")

                    results.Add_item = JobListing(
                        id=f"remotive-{j_id}",
                        title=title,
                        company=company,
                        company_domain=domain,
                        company_logo_url=logo or f"https://www.google.com/s2/favicons?domain={domain}&sz=128",
                        location=f"Remote ({candidate_loc})" if candidate_loc else "Remote (Worldwide)",
                        country="United Kingdom" if ("uk" in candidate_loc.lower() or "united kingdom" in candidate_loc.lower()) else "Remote",
                        city="Remote",
                        work_mode="REMOTE",
                        employment_type="Full-time",
                        experience_level=exp_level,
                        description=plain_desc,
                        salary=salary or "Competitive",
                        url=job_url,
                        source_url=job_url,
                        apply_url=job_url,
                        is_external_application=True,
                        posted_date=pub_date,
                        source="Remotive API",
                        source_job_id=j_id,
                        skills=tags if tags else ["Python", "Software Engineering"]
                    )
                    results.append(results.Add_item)
        except Exception as e:
            logger.warning(f"Remotive provider fetch warning: {e}")

        return results
