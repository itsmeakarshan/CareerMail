import re
import httpx
import logging
from html import unescape
from app.schemas.job_search import JobListing
from app.services.job_providers.base_provider import BaseJobProvider

logger = logging.getLogger(__name__)


class RemoteOKJobProvider(BaseJobProvider):
    @property
    def provider_name(self) -> str:
        return "RemoteOK API"

    async def fetch_jobs(self, query: str | None, location: str | None, work_mode: str | None) -> list[JobListing]:
        results = []
        url = "https://remoteok.com/api"

        try:
            async with httpx.AsyncClient(timeout=8.0, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) CareerMail/1.0"}) as client:
                resp = await client.get(url)
                if resp.status_code != 200:
                    return results

                data = resp.json()
                if not isinstance(data, list):
                    return results

                q_lower = query.lower() if query else ""

                for item in data:
                    if not isinstance(item, dict) or "id" not in item:
                        continue

                    j_id = str(item.get("id", ""))
                    title = item.get("position", "")
                    if not title:
                        continue

                    company = item.get("company", "")
                    tags = item.get("tags", [])
                    if not isinstance(tags, list):
                        tags = []

                    if q_lower:
                        matches = q_lower in title.lower() or q_lower in company.lower() or any(q_lower in t.lower() for t in tags)
                        if not matches:
                            continue

                    logo = item.get("company_logo", "") or item.get("logo", "")
                    loc = item.get("location", "Remote")
                    desc = unescape(re.sub(r"<.*?>", "", item.get("description", "")))
                    job_url = item.get("url", "")
                    date_str = item.get("date", "Recently")

                    domain = f"{re.sub(r'[^a-z0-9]', '', company.lower())}.com"
                    is_senior = "senior" in title.lower() or "lead" in title.lower()
                    is_junior = "junior" in title.lower() or "graduate" in title.lower()
                    exp_level = "Senior Level" if is_senior else ("Entry Level" if is_junior else "Mid Level")

                    results.append(JobListing(
                        id=f"remoteok-{j_id}",
                        title=title,
                        company=company,
                        company_domain=domain,
                        company_logo_url=logo or f"https://www.google.com/s2/favicons?domain={domain}&sz=128",
                        location=loc or "Remote",
                        country="Worldwide",
                        city="Remote",
                        work_mode="REMOTE",
                        employment_type="Full-time",
                        experience_level=exp_level,
                        salary="$90,000 - $160,000 / year",
                        description=desc[:500] + "..." if len(desc) > 500 else desc,
                        url=job_url,
                        source_url=job_url,
                        apply_url=job_url,
                        posted_date=date_str or "Recently",
                        source="RemoteOK API",
                        source_job_id=j_id,
                        skills=tags if tags else ["Python", "Software Engineering"]
                    ))
        except Exception as e:
            logger.debug(f"RemoteOK provider error: {e}")

        return results
