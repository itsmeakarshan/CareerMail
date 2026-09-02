from datetime import datetime, date, timedelta
from sqlalchemy.orm import Session
from app.models.models import JobApplication, Email, Interview, FollowUp, User
from app.models.enums import ApplicationStatus, InterviewStatus, FollowUpStatus
from app.schemas.assistant import (
    AssistantQueryRequest,
    AssistantQueryResponse,
    AssistantCardDTO,
    AssistantEmailDraftDTO
)


class CareerAssistantService:
    def __init__(self, db: Session):
        self.db = db

    def process_query(self, user_id: int, request: AssistantQueryRequest) -> AssistantQueryResponse:
        q = (request.query or "").strip().lower()
        user = self.db.query(User).filter(User.id == user_id).first()
        user_name = user.name if user else "there"

        apps = self.db.query(JobApplication).filter(JobApplication.user_id == user_id).all()
        interviews = (
            self.db.query(Interview)
            .filter(Interview.user_id == user_id, Interview.status == InterviewStatus.SCHEDULED.value)
            .order_by(Interview.interview_date.asc())
            .all()
        )
        follow_ups = (
            self.db.query(FollowUp)
            .filter(FollowUp.user_id == user_id, FollowUp.status == FollowUpStatus.PENDING.value)
            .order_by(FollowUp.due_date.asc())
            .all()
        )
        emails = self.db.query(Email).filter(Email.user_id == user_id).order_by(Email.timestamp.desc()).all()

        # Handle explicit actions or natural query routing
        action = request.action or ""
        
        # 1. Draft Email / Follow-up Template
        if action == "DRAFT_EMAIL" or "draft" in q or "email" in q or "write to" in q:
            return self._handle_draft_email(user_name, apps, request)

        # 2. What Next / Priority Actions
        if action == "WHAT_NEXT" or "next" in q or "do now" in q or "priorit" in q:
            return self._handle_what_next(user_name, apps, interviews, follow_ups)

        # 3. Analyze Progress / Pipeline Funnel
        if action == "ANALYZE_PROGRESS" or "progress" in q or "funnel" in q or "stat" in q or "summary" in q or "analytics" in q:
            return self._handle_analyze_progress(apps, interviews)

        # 4. Needs Attention / Stale Applications
        if action == "NEEDS_ATTENTION" or "attention" in q or "stale" in q or "waiting" in q or "pending" in q:
            return self._handle_needs_attention(apps, follow_ups)

        # 5. Interviews
        if "interview" in q:
            return self._handle_interviews(interviews, apps)

        # 6. Offers
        if "offer" in q or "salary" in q or "negotiat" in q:
            return self._handle_offers(apps)

        # 7. Rejections
        if "reject" in q:
            return self._handle_rejections(apps)

        # 8. Check specific company mention in query
        for app in apps:
            if app.company.lower() in q:
                return self._handle_company_query(app)

        # Default Intelligent Executive Briefing
        return self._handle_executive_briefing(user_name, apps, interviews, follow_ups)

    def _handle_what_next(self, user_name: str, apps: list[JobApplication], interviews: list[Interview], follow_ups: list[FollowUp]) -> AssistantQueryResponse:
        cards = []
        suggestions = ["Analyze my progress", "Draft follow-up for pending roles", "Review upcoming interviews"]

        reply_parts = [f"Here are your top recommended actions right now, {user_name}:"]

        if interviews:
            first_int = interviews[0]
            reply_parts.append(f"\n1. **Prepare for {first_int.company} ({first_int.type})** - Scheduled for {first_int.interview_date.strftime('%A, %d %b')}.")
            cards.append(AssistantCardDTO(
                card_type="INTERVIEW",
                type="INTERVIEW",
                id=first_int.id,
                title=f"Interview: {first_int.company}",
                subtitle=f"{first_int.type} • {first_int.interview_date.strftime('%d %b')}",
                badge=first_int.days_away_badge or "Upcoming",
                badge_color="amber",
                priority="HIGH",
                company=first_int.company,
                role=first_int.title,
                link="/interviews"
            ))

        if follow_ups:
            first_fol = follow_ups[0]
            reply_parts.append(f"\n2. **Follow up with {first_fol.company}** - {first_fol.days_due_badge or 'Due soon'}.")
            cards.append(AssistantCardDTO(
                card_type="FOLLOW_UP",
                type="FOLLOW_UP",
                id=first_fol.id,
                title=f"Follow-up: {first_fol.company}",
                subtitle=first_fol.role or "Check application status",
                badge=first_fol.days_due_badge or "Due",
                badge_color="blue",
                priority="MEDIUM",
                company=first_fol.company,
                role=first_fol.role,
                link="/follow-ups"
            ))

        offers = [a for a in apps if a.status == ApplicationStatus.OFFER.value]
        if offers:
            off = offers[0]
            reply_parts.append(f"\n3. **Review Offer from {off.company}** - {off.salary or 'Competitive compensation'}.")
            cards.append(AssistantCardDTO(
                card_type="OFFER",
                type="APPLICATION",
                id=off.id,
                title=f"Offer: {off.company}",
                subtitle=f"{off.title} • {off.salary or 'Offer Active'}",
                badge="Offer 🎉",
                badge_color="emerald",
                priority="HIGH",
                company=off.company,
                role=off.title,
                link="/tracker"
            ))

        if not cards:
            reply_parts.append("\nYour pipeline is currently smooth with no overdue follow-ups or immediate interviews. Consider searching for high-match roles in the Job Search tab!")
            suggestions = ["Search for Python jobs", "Update my CV", "View analytics"]

        return AssistantQueryResponse(
            reply=" ".join(reply_parts),
            suggestions=suggestions,
            cards=cards,
            action_cards=cards
        )

    def _handle_analyze_progress(self, apps: list[JobApplication], interviews: list[Interview]) -> AssistantQueryResponse:
        total = len(apps)
        offers = sum(1 for a in apps if a.status == ApplicationStatus.OFFER.value)
        rejections = sum(1 for a in apps if a.status == ApplicationStatus.REJECTED.value)
        in_interview = sum(1 for a in apps if a.status in (ApplicationStatus.INTERVIEW.value, ApplicationStatus.FINAL_INTERVIEW.value, ApplicationStatus.RECRUITER_SCREEN.value))
        applied_only = sum(1 for a in apps if a.status == ApplicationStatus.APPLIED.value)
        assessment = sum(1 for a in apps if a.status == ApplicationStatus.ASSESSMENT.value)

        response_rate = int(((total - applied_only) / total * 100)) if total > 0 else 0

        reply = (
            f"### 📊 CareerMail Pipeline Performance\n\n"
            f"- **Total Tracked Applications:** {total}\n"
            f"- **Active Interview Stages:** {in_interview}\n"
            f"- **Assessments / Challenges:** {assessment}\n"
            f"- **Offers Received:** {offers} 🎉\n"
            f"- **Rejections:** {rejections}\n"
            f"- **Overall Response Rate:** **{response_rate}%** (High market benchmark)\n\n"
            f"**Key Insight:** Your response rate of {response_rate}% indicates strong CV targeting and relevant technical skill matching."
        )

        cards = [
            AssistantCardDTO(
                card_type="METRIC",
                type="ANALYTICS",
                title="Response Rate",
                subtitle=f"{response_rate}% conversion from submitted",
                badge="Healthy",
                badge_color="emerald",
                link="/analytics"
            ),
            AssistantCardDTO(
                card_type="METRIC",
                type="ANALYTICS",
                title="Active Interviews",
                subtitle=f"{in_interview} ongoing technical / recruiter rounds",
                badge=f"{in_interview} Active",
                badge_color="blue",
                link="/interviews"
            )
        ]

        return AssistantQueryResponse(
            reply=reply,
            suggestions=["What should I do next?", "Draft follow-up email", "Show upcoming interviews"],
            cards=cards,
            action_cards=cards
        )

    def _handle_needs_attention(self, apps: list[JobApplication], follow_ups: list[FollowUp]) -> AssistantQueryResponse:
        stale_cutoff = date.today() - timedelta(days=7)
        stale_apps = [a for a in apps if a.status == ApplicationStatus.APPLIED.value and (a.date_applied is None or a.date_applied <= stale_cutoff)]

        cards = []
        for a in stale_apps[:3]:
            days_ago = (date.today() - a.date_applied).days if a.date_applied else 7
            cards.append(AssistantCardDTO(
                card_type="STALE_APP",
                type="APPLICATION",
                id=a.id,
                title=f"{a.company} - {a.title}",
                subtitle=f"Applied {days_ago} days ago without status update",
                badge="Needs Follow-up",
                badge_color="rose",
                company=a.company,
                role=a.title,
                recruiter_name=a.recruiter_name,
                recruiter_email=a.recruiter_email,
                link="/tracker"
            ))

        for f in follow_ups:
            if "overdue" in (f.days_due_badge or "").lower() or (f.due_date <= date.today()):
                cards.append(AssistantCardDTO(
                    card_type="FOLLOW_UP",
                    type="FOLLOW_UP",
                    id=f.id,
                    title=f"Overdue Follow-up: {f.company}",
                    subtitle=f.role or "Follow-up due",
                    badge=f.days_due_badge or "Overdue",
                    badge_color="rose",
                    company=f.company,
                    role=f.role,
                    link="/follow-ups"
                ))

        reply = (
            f"Found **{len(stale_apps)} application(s)** and **{len(follow_ups)} follow-up item(s)** that require your attention.\n\n"
            f"Sending a polite status inquiry email after 7-10 days increases recruiter callback rate by up to 28%."
        ) if cards else "All your applications and follow-ups are up to date! Nothing requires urgent intervention."

        return AssistantQueryResponse(
            reply=reply,
            suggestions=["Draft follow-up email", "Analyze my progress", "What should I do next?"],
            cards=cards,
            action_cards=cards
        )

    def _handle_draft_email(self, user_name: str, apps: list[JobApplication], request: AssistantQueryRequest) -> AssistantQueryResponse:
        # Pick target application
        target_app = None
        if request.selected_application_id:
            target_app = next((a for a in apps if a.id == request.selected_application_id), None)
        if not target_app and apps:
            target_app = apps[0]

        company = target_app.company if target_app else "the Hiring Team"
        role = target_app.title if target_app else "Software Engineer"
        recruiter = target_app.recruiter_name if target_app and target_app.recruiter_name else "Hiring Manager"
        recruiter_email = target_app.recruiter_email if target_app and target_app.recruiter_email else f"recruiting@{company.lower().replace(' ', '')}.com"

        body = (
            f"Dear {recruiter},\n\n"
            f"I hope this message finds you well.\n\n"
            f"I am writing to follow up on my recent application for the {role} role at {company}. "
            f"I remain very enthusiastic about the opportunity to contribute my backend engineering and software architecture experience to your team.\n\n"
            f"Please let me know if there are any additional details or work samples I can provide to support my application. I look forward to hearing from you regarding next steps.\n\n"
            f"Best regards,\n{user_name}"
        )

        draft = AssistantEmailDraftDTO(
            to=recruiter_email,
            recipient_email=recruiter_email,
            subject=f"Application Follow-Up: {role} - {user_name}",
            body=body,
            recruiter_name=recruiter,
            company=company,
            role=role,
            draft_type="FOLLOW_UP"
        )

        reply = f"I have drafted a professional follow-up email for **{company}** ({role}). You can copy or edit it below:"

        return AssistantQueryResponse(
            reply=reply,
            suggestions=["Send follow-up email", "What should I do next?", "Analyze my progress"],
            email_draft=draft
        )

    def _handle_interviews(self, interviews: list[Interview], apps: list[JobApplication]) -> AssistantQueryResponse:
        if not interviews:
            return AssistantQueryResponse(
                reply="You do not have any scheduled interviews at the moment. Keep applying to accelerate interview invitations!",
                suggestions=["Search for Python jobs", "Analyze my progress", "What should I do next?"]
            )

        cards = []
        for i in interviews:
            cards.append(AssistantCardDTO(
                card_type="INTERVIEW",
                type="INTERVIEW",
                id=i.id,
                title=f"{i.company} • {i.title}",
                subtitle=f"{i.type} on {i.interview_date.strftime('%a %d %b at %H:%M')}",
                badge=i.days_away_badge or "Scheduled",
                badge_color="amber",
                company=i.company,
                role=i.title,
                link="/interviews"
            ))

        return AssistantQueryResponse(
            reply=f"You have **{len(interviews)} upcoming interview(s)** scheduled. Review the agenda and preparation notes below:",
            suggestions=["What should I do next?", "Draft thank-you note", "Review prep notes"],
            cards=cards,
            action_cards=cards
        )

    def _handle_offers(self, apps: list[JobApplication]) -> AssistantQueryResponse:
        offers = [a for a in apps if a.status == ApplicationStatus.OFFER.value]
        if not offers:
            return AssistantQueryResponse(
                reply="No formal offers recorded in your pipeline yet. Continue excelling in your interview rounds!",
                suggestions=["Show upcoming interviews", "Analyze my progress", "What should I do next?"]
            )

        cards = []
        for o in offers:
            cards.append(AssistantCardDTO(
                card_type="OFFER",
                type="APPLICATION",
                id=o.id,
                title=f"{o.company} — {o.title}",
                subtitle=f"Offer terms: {o.salary or 'Competitive compensation'}",
                badge="Offer 🎉",
                badge_color="emerald",
                company=o.company,
                role=o.title,
                link="/tracker"
            ))

        return AssistantQueryResponse(
            reply=f"Congratulations! You have **{len(offers)} active job offer(s)**. Review compensation packages and benefits:",
            suggestions=["Draft acceptance email", "Draft negotiation response", "What should I do next?"],
            cards=cards,
            action_cards=cards
        )

    def _handle_rejections(self, apps: list[JobApplication]) -> AssistantQueryResponse:
        rejections = [a for a in apps if a.status == ApplicationStatus.REJECTED.value]
        return AssistantQueryResponse(
            reply=(
                f"You have **{len(rejections)} closed application(s)**. "
                f"In tech recruitment, top candidates routinely experience rejections before landing strong offers. "
                f"Focus on the active interview pipelines and continuous skill matching."
            ),
            suggestions=["Show upcoming interviews", "Search for new Python roles", "What should I do next?"]
        )

    def _handle_company_query(self, app: JobApplication) -> AssistantQueryResponse:
        card = AssistantCardDTO(
            card_type="APPLICATION",
            type="APPLICATION",
            id=app.id,
            title=f"{app.company} — {app.title}",
            subtitle=f"Stage: {ApplicationStatus.from_string(app.status).get_display_name()} • Applied {app.date_applied}",
            badge=app.status,
            badge_color="blue",
            company=app.company,
            role=app.title,
            recruiter_name=app.recruiter_name,
            recruiter_email=app.recruiter_email,
            link="/tracker"
        )
        return AssistantQueryResponse(
            reply=f"Here is the current status and recruiter details for **{app.company}** ({app.title}):",
            suggestions=["Draft follow-up email", "What should I do next?", "Show all applications"],
            cards=[card],
            action_cards=[card]
        )

    def _handle_executive_briefing(self, user_name: str, apps: list[JobApplication], interviews: list[Interview], follow_ups: list[FollowUp]) -> AssistantQueryResponse:
        reply = (
            f"Hello {user_name}! I am your AI Career Assistant.\n\n"
            f"Currently tracking **{len(apps)} applications**, with **{len(interviews)} upcoming interview(s)** and **{len(follow_ups)} pending follow-up(s)**.\n\n"
            f"How can I assist you today?"
        )
        return AssistantQueryResponse(
            reply=reply,
            suggestions=["What should I do next?", "Analyze my progress", "Draft follow-up email", "Show upcoming interviews"]
        )
