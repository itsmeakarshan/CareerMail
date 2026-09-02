import re


class LocationExpansionHelper:
    UK_CITIES = {
        "london", "manchester", "birmingham", "bristol", "leeds", "edinburgh",
        "cambridge", "oxford", "belfast", "glasgow", "newcastle", "sheffield",
        "cardiff", "liverpool", "nottingham", "southampton", "reading", "brighton",
        "united kingdom", "uk", "great britain", "england", "scotland", "wales", "northern ireland"
    }

    @classmethod
    def is_uk_location(cls, location: str | None) -> bool:
        if not location or not str(location).strip():
            return False
        clean = str(location).lower()
        if any(k in clean for k in ["uk", "united kingdom", "great britain", "england", "scotland", "wales"]):
            return True
        return any(city in clean for city in cls.UK_CITIES)

    @classmethod
    def matches_location(
        cls,
        query_location: str | None,
        job_location: str | None,
        job_country: str | None,
        job_city: str | None,
        work_mode: str | None
    ) -> bool:
        if not query_location or query_location.lower() in ("anywhere", "all", ""):
            return True

        q = query_location.strip().lower()
        j_loc = (job_location or "").lower()
        j_country = (job_country or "").lower()
        j_city = (job_city or "").lower()
        mode = (work_mode or "").lower()

        # UK Search
        if q in ("uk", "united kingdom", "great britain"):
            if "united kingdom" in j_country or j_country in ("uk", "gb"):
                return True
            if cls.is_uk_location(j_loc) or cls.is_uk_location(j_city):
                return True
            if mode == "remote" and any(k in j_loc for k in ["uk", "europe", "worldwide", "anywhere"]):
                return True
            return False

        # Remote Search
        if q == "remote":
            return mode == "remote" or "remote" in j_loc

        # Direct string matching
        if q in j_loc or q in j_country or q in j_city:
            return True

        # UK Cities alias matching
        if cls.is_uk_location(q):
            if q in j_loc or q in j_city:
                return True
            if "united kingdom" in j_country and (q in j_loc or mode == "remote"):
                return True

        return False
