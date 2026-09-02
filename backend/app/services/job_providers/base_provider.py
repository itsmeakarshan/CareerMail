from abc import ABC, abstractmethod
from app.schemas.job_search import JobListing


class BaseJobProvider(ABC):
    @property
    @abstractmethod
    def provider_name(self) -> str:
        pass

    @abstractmethod
    async def fetch_jobs(self, query: str | None, location: str | None, work_mode: str | None) -> list[JobListing]:
        pass
