import base64
import logging
from datetime import datetime, timedelta
import httpx
from sqlalchemy.orm import Session
from app.models.models import ConnectedAccount, Email, User
from app.models.enums import EmailFolder
from app.schemas.gmail import GmailStatusResponse, GmailSyncResponse
from app.services.google_oauth_service import GoogleOAuthService
from app.services.email_analysis_service import EmailAnalysisService

logger = logging.getLogger(__name__)


class GmailService:
    def __init__(
        self,
        db: Session,
        oauth_service: GoogleOAuthService | None = None,
        analysis_service: EmailAnalysisService | None = None
    ):
        self.db = db
        self.oauth_service = oauth_service or GoogleOAuthService()
        self.analysis_service = analysis_service or EmailAnalysisService(db)

    def get_status(self, user_id: int) -> GmailStatusResponse:
        account = (
            self.db.query(ConnectedAccount)
            .filter(ConnectedAccount.user_id == user_id, ConnectedAccount.provider == "google")
            .first()
        )

        is_connected = bool(account and account.access_token)
        has_send = bool(account and account.scope and "gmail.send" in account.scope)

        return GmailStatusResponse(
            connected=is_connected,
            email=account.provider_email if account else None,
            provider="google",
            last_synced_at=account.last_synced_at if account else None,
            total_emails_scanned=account.total_emails_scanned if account else 0,
            messages_scanned=account.total_emails_scanned if account else 0,
            configured=self.oauth_service.is_configured(),
            scope=account.scope if account else None,
            has_send_scope=has_send,
            has_send_permission=has_send
        )

    async def sync_gmail(self, user_id: int, max_results: int = 25) -> GmailSyncResponse:
        account = (
            self.db.query(ConnectedAccount)
            .filter(ConnectedAccount.user_id == user_id, ConnectedAccount.provider == "google")
            .first()
        )

        if not account or not account.access_token:
            return GmailSyncResponse(
                success=False,
                message="Google account not connected. Please connect via Settings."
            )

        # Refresh token if expired
        access_token = account.access_token
        if account.token_expiry and account.token_expiry <= datetime.utcnow() and account.refresh_token:
            new_tokens = await self.oauth_service.refresh_access_token(account.refresh_token)
            if new_tokens and "access_token" in new_tokens:
                access_token = new_tokens["access_token"]
                account.access_token = access_token
                expires_in = new_tokens.get("expires_in", 3600)
                account.token_expiry = datetime.utcnow() + timedelta(seconds=expires_in)
                self.db.commit()

        scanned = 0
        job_emails = 0
        apps_created = 0
        int_created = 0
        fol_created = 0

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                headers = {"Authorization": f"Bearer {access_token}"}
                # Query messages (exclude promotions/social)
                q_param = "newer_than:30d -category:promotions -category:social"
                list_url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults={max_results}&q={q_param}"

                resp = await client.get(list_url, headers=headers)
                if resp.status_code != 200:
                    return GmailSyncResponse(
                        success=False,
                        message=f"Gmail API returned error {resp.status_code}: {resp.text}"
                    )

                data = resp.json()
                messages = data.get("messages", [])

                for m in messages:
                    msg_id = m.get("id")
                    if not msg_id:
                        continue

                    # Check if already imported
                    existing = (
                        self.db.query(Email)
                        .filter(Email.user_id == user_id, Email.gmail_message_id == msg_id)
                        .first()
                    )
                    if existing:
                        continue

                    # Fetch full message
                    msg_url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}?format=full"
                    msg_resp = await client.get(msg_url, headers=headers)
                    if msg_resp.status_code != 200:
                        continue

                    msg_data = msg_resp.json()
                    parsed = self._parse_gmail_message(msg_data, msg_id=msg_id, access_token=access_token)
                    scanned += 1

                    # Save email
                    email = Email(
                        user_id=user_id,
                        sender=parsed["sender_name"],
                        sender_email=parsed["sender_email"],
                        recipient_email=account.provider_email,
                        subject=parsed["subject"],
                        preview=parsed.get("preview") or (parsed["body"][:120] + "..." if len(parsed["body"]) > 120 else parsed["body"]),
                        body=parsed["body"],
                        timestamp=parsed["timestamp"],
                        folder=EmailFolder.INBOX.value,
                        gmail_message_id=msg_id,
                        gmail_thread_id=msg_data.get("threadId")
                    )
                    self.db.add(email)
                    self.db.commit()
                    self.db.refresh(email)

                    # Analyze and link
                    res = self.analysis_service.process_and_link_email(email, user_id)
                    if res.is_job_related:
                        job_emails += 1
                        if res.classification and res.classification.value in ("APPLICATION_RECEIVED", "NEW_OPPORTUNITY"):
                            apps_created += 1
                        if res.classification and res.classification.value in ("INTERVIEW_INVITATION", "INTERVIEW_SCHEDULED"):
                            int_created += 1
                        if res.classification and res.classification.value == "ASSESSMENT":
                            fol_created += 1

                account.last_synced_at = datetime.utcnow()
                account.total_emails_scanned += scanned
                self.db.commit()

        except Exception as e:
            logger.error(f"Error during Gmail sync: {e}")
            return GmailSyncResponse(
                success=False,
                message=f"Sync encountered an error: {e}"
            )

        return GmailSyncResponse(
            success=True,
            scanned_count=scanned,
            total_scanned=scanned,
            messages_scanned=scanned,
            job_emails_found=job_emails,
            job_related_found=job_emails,
            applications_created=apps_created,
            interviews_created=int_created,
            follow_ups_created=fol_created,
            message=f"Sync completed. Scanned {scanned} messages, discovered {job_emails} career-related emails.",
            synced_at=datetime.utcnow(),
            timestamp=datetime.utcnow()
        )

    def reprocess_emails(self, user_id: int) -> GmailSyncResponse:
        emails = self.db.query(Email).filter(Email.user_id == user_id).all()
        job_count = 0
        for e in emails:
            res = self.analysis_service.process_and_link_email(e, user_id)
            if res.is_job_related:
                job_count += 1
        self.db.commit()

        return GmailSyncResponse(
            success=True,
            scanned_count=len(emails),
            job_emails_found=job_count,
            message=f"Reprocessed {len(emails)} emails. Updated classifications and application links."
        )

    def disconnect(self, user_id: int):
        account = (
            self.db.query(ConnectedAccount)
            .filter(ConnectedAccount.user_id == user_id, ConnectedAccount.provider == "google")
            .first()
        )
        if account:
            self.db.delete(account)
            self.db.commit()

    def upgrade_email_if_needed(self, email: Email, user_id: int) -> bool:
        """If an email has gmail_message_id but only plain text, fetch full HTML and exact images from Gmail API."""
        if not email.gmail_message_id:
            return False

        # If already rich HTML, no upgrade needed
        body_lower = email.body.lower()
        if "<html" in body_lower or "<div" in body_lower or "<table" in body_lower or "<p" in body_lower or "<body" in body_lower:
            return False

        account = (
            self.db.query(ConnectedAccount)
            .filter(ConnectedAccount.user_id == user_id, ConnectedAccount.provider == "google")
            .first()
        )
        if not account or not account.access_token:
            return False

        access_token = account.access_token
        url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{email.gmail_message_id}?format=full"
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.get(url, headers={"Authorization": f"Bearer {access_token}"})
                if resp.status_code == 200:
                    msg_data = resp.json()
                    parsed = self._parse_gmail_message(msg_data, msg_id=email.gmail_message_id, access_token=access_token)
                    if parsed["body"] and ("<html" in parsed["body"].lower() or "<div" in parsed["body"].lower() or "<table" in parsed["body"].lower() or "<p" in parsed["body"].lower()):
                        email.body = parsed["body"]
                        if parsed.get("preview"):
                            email.preview = parsed["preview"]
                        self.db.commit()
                        logger.info(f"Successfully upgraded email ID {email.id} ({email.subject}) to rich HTML with exact images")
                        return True
        except Exception as e:
            logger.debug(f"Failed to upgrade email {email.id}: {e}")
        return False

    def _parse_gmail_message(
        self,
        msg_data: dict,
        msg_id: str | None = None,
        access_token: str | None = None,
        client: httpx.Client | httpx.AsyncClient | None = None
    ) -> dict:
        headers = msg_data.get("payload", {}).get("headers", [])
        header_map = {h.get("name", "").lower(): h.get("value", "") for h in headers}

        subject = header_map.get("subject", "No Subject")
        from_raw = header_map.get("from", "Unknown Sender")

        # Parse sender name and email
        sender_name = from_raw
        sender_email = from_raw
        if "<" in from_raw and ">" in from_raw:
            parts = from_raw.split("<")
            sender_name = parts[0].strip().replace('"', "")
            sender_email = parts[1].replace(">", "").strip()

        # Extract body with full HTML & exact images
        body = self._extract_body_and_images(
            msg_data.get("payload", {}),
            msg_id=msg_id or msg_data.get("id"),
            access_token=access_token,
            client=client
        )

        # Parse preview snippet
        snippet = msg_data.get("snippet", "")
        if not snippet and body:
            import re
            plain_preview = re.sub(r"<[^>]+>", " ", body)
            plain_preview = re.sub(r"\s+", " ", plain_preview).strip()
            snippet = plain_preview

        preview = snippet[:140] + ("..." if len(snippet) > 140 else "")

        # Parse timestamp
        internal_date = msg_data.get("internalDate")
        ts = datetime.utcnow()
        if internal_date:
            try:
                ts = datetime.utcfromtimestamp(int(internal_date) / 1000.0)
            except Exception:
                pass

        return {
            "subject": subject,
            "sender_name": sender_name or sender_email,
            "sender_email": sender_email,
            "body": body or subject,
            "preview": preview,
            "timestamp": ts
        }

    def _extract_body_and_images(
        self,
        payload: dict,
        msg_id: str | None = None,
        access_token: str | None = None,
        client: httpx.Client | httpx.AsyncClient | None = None,
    ) -> str:
        plain_parts: list[str] = []
        html_parts: list[str] = []
        inline_images: dict[str, str] = {}

        def _decode_b64(raw: str | None) -> str:
            if not raw:
                return ""
            try:
                padded = raw + "=" * ((4 - len(raw) % 4) % 4)
                return base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8", errors="ignore")
            except Exception:
                return ""

        def _walk_part(part: dict):
            if not part:
                return
            mime_type = part.get("mimeType", "").lower()
            body_dict = part.get("body", {})
            data = body_dict.get("data")

            if mime_type == "text/plain" and data:
                decoded = _decode_b64(data)
                if decoded.strip():
                    plain_parts.append(decoded)
            elif mime_type == "text/html" and data:
                decoded = _decode_b64(data)
                if decoded.strip():
                    html_parts.append(decoded)
            elif mime_type.startswith("image/"):
                img_data = data
                att_id = body_dict.get("attachmentId")
                if not img_data and att_id and access_token and msg_id:
                    try:
                        att_url = f"https://gmail.googleapis.com/gmail/v1/users/me/messages/{msg_id}/attachments/{att_id}"
                        if isinstance(client, httpx.Client):
                            r = client.get(att_url, headers={"Authorization": f"Bearer {access_token}"})
                            if r.status_code == 200:
                                img_data = r.json().get("data")
                        elif client is None:
                            with httpx.Client(timeout=10.0) as sync_c:
                                r = sync_c.get(att_url, headers={"Authorization": f"Bearer {access_token}"})
                                if r.status_code == 200:
                                    img_data = r.json().get("data")
                    except Exception as ex:
                        logger.debug(f"Could not fetch attachment {att_id}: {ex}")

                if img_data:
                    clean_b64 = img_data.replace("-", "+").replace("_", "/")
                    clean_b64 += "=" * ((4 - len(clean_b64) % 4) % 4)
                    data_uri = f"data:{mime_type};base64,{clean_b64}"

                    headers = part.get("headers", [])
                    for h in headers:
                        h_name = h.get("name", "").lower()
                        h_val = h.get("value", "")
                        if h_name == "content-id" and h_val:
                            clean_cid = h_val.strip("<>").strip()
                            inline_images[clean_cid] = data_uri
                            inline_images[h_val.strip()] = data_uri
                        elif h_name == "x-attachment-id" and h_val:
                            inline_images[h_val.strip()] = data_uri

            for subpart in part.get("parts", []):
                _walk_part(subpart)

        _walk_part(payload)

        if html_parts:
            full_html = "\n\n".join(html_parts).strip()
            for cid, data_uri in inline_images.items():
                full_html = full_html.replace(f"cid:{cid}", data_uri)
                full_html = full_html.replace(f"cid:&quot;{cid}&quot;", data_uri)
            return full_html
        elif plain_parts:
            return "\n\n".join(plain_parts).strip()

        direct_data = payload.get("body", {}).get("data")
        if direct_data:
            return _decode_b64(direct_data)

        return ""

