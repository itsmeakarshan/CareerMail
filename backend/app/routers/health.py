from datetime import datetime
from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
def health_check():
    return {
        "status": "UP",
        "service": "CareerMail Python FastAPI API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }
