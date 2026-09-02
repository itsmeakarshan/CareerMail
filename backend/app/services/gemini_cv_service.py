import json
import logging
import re
import urllib.parse
import httpx
from app.config import settings

logger = logging.getLogger(__name__)


class GeminiCvService:
    GEMINI_MODELS = [
        "gemini-2.5-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro"
    ]

    async def test_api_key(self, api_key: str) -> tuple[bool, str]:
        if not api_key or not api_key.strip():
            return False, "API key cannot be empty"

        clean_key = api_key.strip()
        for model in self.GEMINI_MODELS:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={clean_key}"
            payload = {
                "contents": [{
                    "parts": [{"text": "Hello, please reply with 'OK'."}]
                }]
            }
            try:
                async with httpx.AsyncClient(timeout=8.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        return True, f"Gemini API key is valid and connected ({model})."
                    elif resp.status_code in (400, 403, 401):
                        err_msg = resp.json().get("error", {}).get("message", "Authentication failed")
                        return False, f"Invalid Gemini API key: {err_msg}"
            except Exception as e:
                logger.warning(f"Failed testing model {model}: {e}")

        return False, "Could not verify Gemini API key. Please check network connection or key validity."

    async def extract_cv_profile(self, cv_text: str, api_key: str | None = None) -> dict | None:
        key = api_key or settings.gemini_api_key
        if not key:
            return None

        prompt = (
            "Analyze the following CV / Resume text and extract structured candidate data strictly as JSON.\n"
            "Required JSON fields:\n"
            "- extractedSkills: list of strings (technical skills, frameworks, databases, cloud, methodologies)\n"
            "- targetRoles: list of strings (e.g. ['Software Engineer', 'Backend Developer'])\n"
            "- experienceYears: integer (estimated total years of professional tech experience)\n"
            "- educationLevel: string (e.g. 'Bachelor of Science in Computer Science' or 'Master's Degree')\n"
            "- preferredLocation: string (e.g. 'London, United Kingdom' or 'Remote')\n"
            "- isRemotePreferred: boolean\n\n"
            f"CV TEXT:\n{cv_text[:4000]}"
        )

        for model in self.GEMINI_MODELS:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key.strip()}"
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "responseMimeType": "application/json"
                }
            }
            try:
                async with httpx.AsyncClient(timeout=12.0) as client:
                    resp = await client.post(url, json=payload)
                    if resp.status_code == 200:
                        data = resp.json()
                        text_resp = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                        return json.loads(text_resp)
            except Exception as e:
                logger.warning(f"Gemini CV extraction model {model} failed: {e}")

        return None

    def resolve_real_job_url(
        self,
        job_id: str | None,
        title: str | None,
        company: str | None,
        location: str | None,
        current_url: str | None
    ) -> str:
        clean_company = (company or "").strip()
        clean_title = (title or "").strip()
        clean_loc = (location or "United Kingdom").strip()

        # Known direct career portals
        company_portals = {
            "monzo": "https://monzo.com/careers",
            "revolut": "https://revolut.com/careers",
            "deepmind": "https://deepmind.google/careers",
            "google": "https://careers.google.com",
            "bloomberg": "https://careers.bloomberg.com",
            "bbc": "https://careers.bbc.co.uk",
            "amazon": "https://amazon.jobs",
            "microsoft": "https://careers.microsoft.com",
            "stripe": "https://stripe.com/careers",
            "deliveroo": "https://deliveroo.co.uk/careers",
            "spotify": "https://spotify.com/careers",
            "palantir": "https://palantir.com/careers",
            "canonical": "https://canonical.com/careers",
            "cloudflare": "https://cloudflare.com/careers",
            "gitlab": "https://gitlab.com/careers",
            "datadog": "https://datadoghq.com/careers",
            "snyk": "https://snyk.io/careers",
            "elastic": "https://elastic.co/careers",
            "reddit": "https://reddit.com/careers",
            "figma": "https://figma.com/careers"
        }

        for comp_key, portal_url in company_portals.items():
            if comp_key in clean_company.lower():
                return portal_url

        if current_url and current_url.startswith("http") and not any(k in current_url for k in ["example.com", "placeholder"]):
            return current_url

        query = urllib.parse.quote_plus(f"{clean_company} {clean_title} careers {clean_loc}")
        return f"https://www.google.com/search?q={query}"
