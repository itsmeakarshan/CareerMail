from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user_id
from app.schemas.assistant import AssistantQueryRequest, AssistantQueryResponse
from app.services.career_assistant_service import CareerAssistantService

router = APIRouter(prefix="/assistant", tags=["Career Assistant"])


@router.post("/ask", response_model=AssistantQueryResponse)
@router.post("/query", response_model=AssistantQueryResponse)
def ask_assistant(
    request: AssistantQueryRequest,
    user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    service = CareerAssistantService(db)
    return service.process_query(user_id, request)
