from app.schemas.base import CamelModel


class AssistantCardDTO(CamelModel):
    card_type: str | None = None
    type: str = "APPLICATION"
    id: int | None = None
    title: str
    subtitle: str | None = None
    badge: str | None = None
    badge_color: str | None = "blue"
    priority: str | None = None
    action_type: str | None = "ATTENTION"
    action_url: str | None = None
    link: str | None = "/tracker"
    company: str | None = None
    role: str | None = None
    status: str | None = None
    date: str | None = None
    recruiter_name: str | None = None
    recruiter_email: str | None = None


class AssistantEmailDraftDTO(CamelModel):
    to: str | None = None
    recipient_email: str | None = None
    subject: str
    body: str
    recruiter_name: str | None = None
    company: str | None = None
    role: str | None = None
    draft_type: str | None = "FOLLOW_UP"


class AssistantQueryRequest(CamelModel):
    query: str | None = ""
    current_screen: str | None = None
    selected_application_id: int | None = None
    selected_email_id: int | None = None
    action: str | None = None


class AssistantQueryResponse(CamelModel):
    reply: str
    suggestions: list[str] = []
    cards: list[AssistantCardDTO] | None = None
    action_cards: list[AssistantCardDTO] | None = None
    email_draft: AssistantEmailDraftDTO | None = None
    data: dict | None = None
    metadata: dict | None = None
