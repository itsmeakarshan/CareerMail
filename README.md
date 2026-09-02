<div align="center">

# 📬 CareerMail
### Next-Gen Intelligent Email & Job Application Tracking Platform (Python & FastAPI Backend)

<br/>

<p align="center">
  <b>CareerMail bridges high-performance email management with automated job application tracking, live Gmail OAuth synchronization, recruiter intelligence, and context-aware AI career assistance.</b>
</p>

[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Enabled-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

<br/>

[**📸 Screenshots**](#-application-showcase) • [**✨ Key Features**](#-key-features) • [**🧪 Test with Your Own Gmail**](#-test-careermail-with-your-own-gmail) • [**🏗️ Architecture**](#-system-architecture) • [**🚀 Quickstart**](#-quickstart-guide) • [**☁️ Deployment Guide**](#-deployment-guide) • [**📡 REST API**](#-rest-api-documentation)

</div>

---

## 🌟 Overview

CareerMail eliminates the chaos job seekers experience when managing dozens of recruitment threads across their inbox. By combining a modern webmail client with an autonomous Python NLP ingestion pipeline, CareerMail scans incoming recruiter emails, categorizes interview invites, assessments, rejections, and job offers, extracts contact info and deadlines, and keeps your entire career pipeline updated in real time.

Designed with inspiration from **Linear**, **Notion**, and high-end fintech dashboards, CareerMail features a fluid dark theme, responsive Kanban boards, dynamic analytics charts, recruiter contact books, and an integrated **AI Career Assistant** grounded in your live PostgreSQL data.

---

## 📸 Application Showcase

### 1. 🎯 Job Tracker Dashboard & Kanban Pipeline
Track all your job applications, interviews, offers, and rejections in one high-performance dashboard with real-time KPI metrics, velocity trendlines, and a 6-stage Kanban board.

<div align="center">
  <img src="assets/job-tracker-light.png" alt="Job Tracker Dashboard - Light Theme" width="100%" />
  <p><em>Job Tracker Dashboard (Light Theme) — Live KPI Metrics, Velocity Trendlines, Domain Breakdown & Kanban Pipeline</em></p>
</div>

<div align="center">
  <img src="assets/job-tracker-dark.png" alt="Job Tracker Dashboard - Dark Theme" width="100%" />
  <p><em>Job Tracker Dashboard (Dark Theme) — Sleek Fintech & Linear-Inspired Aesthetic</em></p>
</div>

<div align="center">
  <img src="assets/application-dossier.png" alt="Application Overview & Recruiter Intelligence Dossier" width="85%" />
  <p><em>Application Dossier Modal — Automated Recruiter Contact Extraction & Confidence Scoring</em></p>
</div>

<div align="center">
  <img src="assets/application-email-history.png" alt="Synchronized Email History in Application Dossier" width="85%" />
  <p><em>Linked Email History — Full Rich HTML Recruiter Communications directly inside Application Record</em></p>
</div>

<div align="center">
  <img src="assets/gmail-extracted-opportunities.png" alt="Extracted Opportunities from Gmail" width="100%" />
  <p><em>Gmail Opportunity Scanner — Automated Discovery of Recruiter Outreach & 1-Click Pipeline Ingestion</em></p>
</div>

---

### 2. 🔍 Job Search & Deterministic CV Match Engine
Dynamic multi-source job aggregation from public ATS boards (Greenhouse, Lever, Remotive, RemoteOK, Jobicy) with deterministic 5-pillar CV matching and direct 1-click apply links.

<div align="center">
  <img src="assets/job-search-match.png" alt="Job Search and CV Match Engine" width="100%" />
  <p><em>Job Search & Match Engine — Dynamic NLP CV Skill Extraction, Transparent Match Gauges & Direct Company ATS Links</em></p>
</div>

---

### 3. 📅 Interactive Career Calendar
Unified timeline for upcoming technical interviews, recruiter screens, take-home assessment deadlines, and hiring milestones.

<div align="center">
  <img src="assets/career-calendar.png" alt="Career Calendar and Interview Timeline" width="100%" />
  <p><em>Career Calendar — Month Grid & Day Agenda, Active Interview Countdown, and 1-Click Google Meet / Zoom Links</em></p>
</div>

---

### 4. 📬 Integrated Webmail Inbox & Recruiter AI Composer
Full RFC 822 compliant email client synchronized with your real Gmail account, featuring AI-assisted recruiter follow-up drafting.

<div align="center">
  <img src="assets/inbox-sync.png" alt="Integrated Gmail Inbox & Message Viewer" width="100%" />
  <p><em>Integrated Inbox — Synchronized Gmail Folder Tree, Rich HTML Email Rendering & One-Click Opportunity Conversion</em></p>
</div>

<div align="center">
  <img src="assets/recruiter-followup-compose.png" alt="Quick Recruiter Follow-up & Gmail Compose Modal" width="85%" />
  <p><em>Gmail Compose Modal — Context-Aware AI Follow-up Templates with Direct Google RFC 822 Sending</em></p>
</div>

---

## ✨ Key Features

### 1. 🤖 Context-Aware AI Career Assistant
* **PostgreSQL Data Grounding**: Answers questions directly from your live application records, interview timelines, recruiter notes, and emails.
* **"✨ What Should I Do Next?" Engine**: Categorizes live career data into actionable priorities:
  - 🔴 **Urgent**: Interviews within 48h and overdue follow-ups.
  - 🟠 **Needs Attention**: Stale applications waiting >7 days without a reply.
  - 🔵 **Upcoming**: Scheduled calls and deadlines.
  - 🟢 **Positive Progress**: Active offers and advancements.
* **Smart Email Assistant**: Instantly drafts follow-ups, interview thank-you notes, and recruiter replies with 1-click transfer to the Gmail Compose modal (never auto-sends without user confirmation).
* **Interactive Navigation Cards**: Jump straight to related applications or compose actions directly from chat cards.

### 2. 📬 Integrated Email Client with Real RFC 822 Sending
* **Complete Webmail Suite**: Inbox, Starred, Important, Sent, Drafts, and Archive folders.
* **Real Gmail API Sending**: Composes and encodes standard RFC 822 / MIME messages and dispatches them via Google's `users/me/messages/send` API.
* **Interactive Email Modal**: View full HTML emails with embedded styles, sender chips, and one-click opportunity conversion.

### 3. 🎯 Kanban Pipeline & Stage Tracking
* **6-Stage Lifecycle**: `Applied` → `Recruiter Screen` → `Assessment` → `Interview` → `Offer` → `Rejected / Withdrawn`.
* **Drag-and-Drop / Instant Updates**: Move applications between stages with immediate database persistence and automated timeline tracking.
* **Full Application Dossier**: View linked emails, interview rounds, contact details, notes, and activity chronologies.

### 4. 💡 Extracted Opportunities from Gmail
* **Automated Opportunity Lead Scanner**: Identifies unsolicited recruiter outreach, new job openings, and matched opportunities from your email.
* **1-Click Pipeline Conversion**: Converts opportunity emails directly into tracked job applications with prefilled recruiter details, salary, and notes.

### 5. 👤 Recruiter & Contact Intelligence
* **Autonomous Entity Extraction**: Automatically extracts human recruiter names, direct emails, phone numbers, job titles, and LinkedIn profiles.
* **Confidence Scoring**: Flags verified human recruiters vs. automated ATS notification systems (`Greenhouse`, `Workday`, `Lever`, `Ashby`).

### 6. 📅 Interactive Modern Career Calendar
* **Unified Event Timeline**: Real-time aggregation of technical rounds, screening calls, system design sessions, follow-up deadlines, and application milestones.
* **Month & Agenda Views**: Sleek interactive month grid with day-level inspection, event chips, countdown indicators, and today highlights.
* **1-Click Video Calls & Calendar Sync**: Direct launch for Google Meet / Zoom links, 1-click **Add to Google Calendar**, and **.ics export** for Apple Calendar & Outlook.

### 7. 📊 Real-Time Analytics & Trend Charts
* **Live KPI Counters**: Total Applications, Active Interviews, Formal Offers, Rejection Rates, and Response Rates.
* **Dynamic Time-Series Visualizations**: 3-Month, 14-Day, and 7-Day application velocity trendlines.
* **Status Distribution**: Real-time breakdown of your entire job search funnel.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Backend** | **Python 3.12+**, **FastAPI**, **SQLAlchemy 2.0**, **Pydantic v2**, **Uvicorn**, **AsyncIO**, **Httpx** |
| **Frontend** | **React 18**, **TypeScript**, **Vite 5**, **Tailwind CSS**, **Lucide React**, **Framer Motion** |
| **Security & Auth** | Stateless JWT Bearer Authentication (`PyJWT`), Password Hashing with `BCrypt` |
| **Parsing Engine** | Rule-Based Email Intelligence Pipeline (10 classifications + regex entity extractors) + PyPDF & python-docx CV parsing |
| **AI Integration** | Context-Aware Career Assistant Service + Gemini 2.5 / 1.5 Flash structured extraction |
| **Database** | **PostgreSQL 16** (with zero-config SQLite fallback for local developer testing) |
| **Google Cloud** | Google OAuth 2.0, Gmail REST API (`gmail.readonly`, `gmail.send`, RFC 822 MIME generation) |
| **Testing & Quality** | **Pytest**, **Pytest-Asyncio**, **FastAPI TestClient**, Type Annotations |
| **DevOps & Containers**| **Docker**, **Docker Compose** (Multi-stage builds, Nginx reverse proxy), **Vercel**, **Render** |

---

## 🧪 Test CareerMail with Your Own Gmail

> [!NOTE]
> **Zero-Secrets Policy**: To adhere to industry security standards and Google API Terms of Service, this public repository does **not** include private Google OAuth client secrets. Any developer, evaluator, or recruiter can connect their personal or test Gmail account in **under 5 minutes** by creating a free Google Cloud OAuth client.

---

### 🗺️ Visual Setup Flow

```mermaid
flowchart LR
    A["📦 1. Clone Repo"] --> B["☁️ 2. Google Cloud Project"]
    B --> C["🔐 3. Configure OAuth Screen"]
    C --> D["👤 4. Add Test User"]
    D --> E["🔑 5. Create Web Client ID"]
    E --> F["⚙️ 6. Configure .env"]
    F --> G["🚀 7. Run CareerMail"]
    G --> H["📥 8. Connect Gmail"]
    H --> I["✨ 9. Sync & Send Real Emails"]
```

### 🚀 Step-by-Step Guide

#### 1️⃣ Step 1: Clone the Repository

```bash
git clone https://github.com/akarshanrasyal/CareerMail.git
cd CareerMail
```

---

#### 2️⃣ Step 2: Create a Free Google Cloud Project

1. Open the **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Click the project dropdown in the top navigation bar and select **"New Project"**.
3. Set **Project name** to `CareerMail-Dev` and click **Create**.
4. Select your newly created project.

---

#### 3️⃣ Step 3: Enable the Gmail API

1. Navigate to **APIs & Services > Library** (or search for `Gmail API`).
2. Select **Gmail API** and click **Enable**.

---

#### 4️⃣ Step 4: Configure OAuth Consent Screen & Scopes

1. Go to **APIs & Services > OAuth consent screen**.
2. Select **External** user type and click **Create**.
3. Fill in basic application info:
   * **App name**: `CareerMail`
   * **User support email**: *Select your Gmail address*
   * **Developer contact email**: *Enter your Gmail address*
   * Click **Save and Continue**.
4. In the **Scopes** step, click **"Add or Remove Scopes"** and add:

| Scope | Permission Type | Purpose in CareerMail |
|---|---|---|
| `.../auth/gmail.readonly` | Sensitive | Read incoming recruitment emails & parse job status updates |
| `.../auth/gmail.send` | Sensitive | Send real follow-up and inquiry emails directly via Gmail |
| `.../auth/userinfo.email` | Non-sensitive | Retrieve authenticated Google email address |
| `.../auth/userinfo.profile` | Non-sensitive | Display Google account name and avatar |

5. Click **Update** and then **Save and Continue**.
6. In the **Test Users** step, click **"+ ADD USERS"**:
   * Enter the exact **Gmail address** you will log in with.
   * Click **Add** and then **Save and Continue**.

> [!IMPORTANT]
> **Why Add a Test User?**
> While your Google Cloud app is in *"Testing"* mode, Google's security sandbox only permits authorization for accounts explicitly added to the **Test Users** list.

---

#### 5️⃣ Step 5: Create OAuth 2.0 Web Application Credentials

1. Go to **APIs & Services > Credentials**.
2. Click **+ CREATE CREDENTIALS** and select **OAuth client ID**.
3. Configure the settings:
   * **Application type**: `Web application`
   * **Name**: `CareerMail Web Client`
4. Add **Authorized JavaScript origins**:
   * `http://localhost:5173`
   * `http://localhost`
5. Add **Authorized redirect URIs**:
   * `http://localhost:8080/api/auth/google/callback`
6. Click **Create** and copy your **Client ID** and **Client Secret**.

---

#### 6️⃣ Step 6: Configure Your Local `.env` File

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Open `.env` and fill in your credentials:

```ini
# ==============================================================================
# Google Cloud Platform & Gmail OAuth 2.0 Configuration
# ==============================================================================
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8080/api/auth/google/callback

# Frontend Origin
FRONTEND_URL=http://localhost:5173
```

---

#### 7️⃣ Step 7: Connect Your Gmail & Test the Pipeline

1. Open **[http://localhost:5173](http://localhost:5173)** in your browser.
2. Sign in with the default credentials (`akarshan@email.com` / `password123`).
3. Navigate to **Settings** (`/settings`) from the sidebar.
4. Click **"Connect Gmail"**.
5. When Google displays the consent screen, select your test Gmail account (click *Advanced > Go to CareerMail (unsafe)* if prompted).
6. Grant **Read** and **Send** permissions.
7. Upon redirect, click **"Scan Recent Emails"**:
   * CareerMail will retrieve and parse your recent Gmail messages across the last 90+ days.
   * Job applications, interview invitations, and status changes are automatically created in the database!
8. Click **"Compose"** (or use the AI assistant's draft composer) to send a real email directly through your Gmail account!

---

### 🛠️ Common Troubleshooting & FAQs

| Symptom / Error | Cause | Quick Solution |
|---|---|---|
| **`Access blocked: CareerMail has not completed the Google verification process`** | Gmail address is missing from Test Users in Google Cloud. | Go to **OAuth consent screen > Test users**, add your Gmail address, and click Save. |
| **`Error 400: redirect_uri_mismatch`** | Redirect URI in `.env` doesn't match Google Cloud Console. | Verify `http://localhost:8080/api/auth/google/callback` is added under **Authorized redirect URIs**. |
| **`403 FORBIDDEN: Request had insufficient authentication scopes`** | Account was connected before `gmail.send` was requested. | Go to **Settings**, click **Disconnect**, and re-click **Connect Gmail** to approve sending permissions. |
| **Backend DB connection note** | PostgreSQL container or service is not running. | CareerMail automatically falls back to zero-config local SQLite when Postgres is unreachable. Run `docker compose up` for full PostgreSQL. |

---

## 🚀 Quickstart Guide

### Option 1: Docker Compose (All-in-One)

Launch PostgreSQL 16, Python FastAPI Backend, and Vite React Frontend in isolated containers:

```bash
docker compose up --build
```

Once running:
* **Web App (Frontend)**: [http://localhost](http://localhost) (or [http://localhost:5173](http://localhost:5173))
* **REST API (Backend)**: [http://localhost:8080/api](http://localhost:8080/api)
* **Interactive API Docs (Swagger UI)**: [http://localhost:8080/docs](http://localhost:8080/docs)
* **Health Check**: [http://localhost:8080/api/health](http://localhost:8080/api/health)
* **Database (PostgreSQL)**: `localhost:5432` (`careermail` / `careermail123`)

---

### Option 2: One-Click Local Script (Without Docker)

You can launch both the backend and frontend locally using the starter script:

```bash
./start.sh
```

*(Press `Ctrl+C` at any time to shut down both services).*

---

### Option 3: Manual Multi-Terminal Setup

#### Terminal 1 — Backend (Python FastAPI)
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python run.py
```
The FastAPI server will start at `http://localhost:8080` (auto-initializes database schema and demo user on startup).

#### Terminal 2 — Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
The Vite development server will start at `http://localhost:5173`.

---

## ☁️ Deployment Guide

### Deploying Frontend to Vercel (Free)

CareerMail includes pre-configured [`vercel.json`](vercel.json) files for seamless single-page application (SPA) deployment on Vercel.

1. Push your repository to GitHub.
2. Import your repository on **[Vercel](https://vercel.com/)**.
3. Under **Environment Variables**, add:
   * `VITE_API_URL`: Your deployed backend URL (e.g. `https://careermail-backend.onrender.com`)
4. Click **Deploy**. Vercel will automatically build and serve the React SPA with rewrite routing.

---

### Deploying Backend to Render (Free)

CareerMail includes [`render.yaml`](render.yaml) for 1-click Dockerized backend & PostgreSQL deployment.

1. On **[Render](https://render.com/)**, select **New > Blueprint**.
2. Connect your GitHub repository.
3. Render will provision:
   * **`careermail-backend`**: Dockerized Python FastAPI Web API
   * **`careermail-db`**: Managed PostgreSQL Database
4. Under Environment Variables on Render, provide your `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI`.

---

## 🔐 Default Demo Account Credentials

CareerMail seeds a demo account automatically on startup:

| Field | Value |
|---|---|
| **Email** | `akarshan@email.com` |
| **Password** | `password123` |

---

## 🏗️ System Architecture

```text
┌────────────────────────────────────────────────────────┐
│               CareerMail Web Application               │
│          (React 18 + TypeScript + Vite + Tailwind)     │
└──────────┬──────────────────────────────────▲──────────┘
           │ REST Calls / Bearer JWT          │ JSON / Polling
           ▼                                  │
┌────────────────────────────────────────────────────────┐
│             Python FastAPI Backend Microservice         │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Authentication Middleware & Stateless JWT      │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │    Rule-Based Email Ingestion & Analysis Engine  │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Context-Aware AI Assistant & Priority Engine   │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │    Google OAuth 2.0 & RFC 822 MIME Gmail Client  │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │    5-Pillar CV Matching & Job Search Aggregator  │  │
│  └──────────────────────────────────────────────────┘  │
└──────────┬──────────────────────────────────┬──────────┘
           │ SQLAlchemy 2.0 (Async/Sync)      │ REST / OAuth
           ▼                                  ▼
┌──────────────────────┐           ┌──────────────────────┐
│    PostgreSQL 16     │           │   Google Gmail API   │
│  (Applications,      │           │  (users/me/messages, │
│   Interviews,        │           │   users/me/send,     │
│   Emails, Timeline)  │           │   OAuth2 Token API)  │
└──────────────────────┘           └──────────────────────┘
```

---

## 📡 REST API Documentation

### Authentication & Profile (`/api/auth`)
* `POST /api/auth/register` — Register a new user
* `POST /api/auth/login` — Sign in and receive JWT token
* `GET /api/auth/me` — Retrieve current user profile
* `PUT /api/auth/profile` — Update user profile & avatar
* `GET /api/auth/google/url` — Generate Google OAuth authorization URL
* `GET /api/auth/google/callback` — OAuth code exchange callback
* `GET /api/auth/google/config` — Check OAuth client configuration state

### Gmail Synchronization & Sending (`/api/gmail`)
* `GET /api/gmail/status` — Get Gmail connection and scope status
* `POST /api/gmail/sync` — Scan and ingest emails from Gmail inbox
* `POST /api/gmail/reprocess` — Re-evaluate stored emails with NLP engine
* `POST /api/gmail/disconnect` — Disconnect linked Google account

### AI Career Assistant (`/api/assistant`)
* `POST /api/assistant/ask` — Context-aware natural language Q&A, draft generation, and priority engine

### Extracted Opportunities (`/api/opportunities`)
* `GET /api/opportunities` — Get extracted opportunity leads from Gmail
* `POST /api/opportunities/{emailId}/convert` — Convert opportunity email into tracked application
* `POST /api/opportunities/scan` — Perform dedicated opportunity search scan

### Job Search & CV Match (`/api/job-search`)
* `POST /api/job-search/cv` — Upload and parse CV / Resume (PDF, DOCX)
* `GET /api/job-search/cv` — Get extracted CV profile
* `GET /api/job-search/jobs` — Search aggregated public job feeds
* `POST /api/job-search/match` — Run 5-pillar matching engine against candidate profile
* `POST /api/job-search/save` — Save job listing
* `GET /api/job-search/saved` — Get saved job listings
* `POST /api/job-search/convert-to-application` — Convert job listing to active Kanban application

### Job Applications (`/api/applications`)
* `GET /api/applications` — List all job applications
* `GET /api/applications/{id}` — Get single application with timeline
* `POST /api/applications` — Create job application
* `PUT /api/applications/{id}` — Update job application
* `PATCH /api/applications/{id}/status` — Move application stage
* `DELETE /api/applications/{id}` — Delete application & dissociate emails
* `GET /api/applications/search` — Search applications by keyword

### Emails (`/api/emails`)
* `GET /api/emails` — Filter emails by folder (`inbox`, `sent`, `starred`, `important`, `drafts`)
* `GET /api/emails/{id}` — Get email by ID
* `POST /api/emails/compose` — Send outgoing email via Gmail API
* `PATCH /api/emails/{id}/read` — Toggle read status
* `PATCH /api/emails/{id}/star` — Toggle starred status
* `PATCH /api/emails/{id}/important` — Toggle important status
* `GET /api/emails/counts` — Get folder badge counts

### Interviews & Follow-ups (`/api/interviews` & `/api/followups`)
* `GET /api/interviews` | `POST /api/interviews` | `PUT /api/interviews/{id}` | `DELETE /api/interviews/{id}`
* `GET /api/followups` | `POST /api/followups` | `PUT /api/followups/{id}` | `DELETE /api/followups/{id}`

### Analytics (`/api/analytics`)
* `GET /api/analytics` — Get KPI metrics, response rates, monthly & daily trend charts

### System Health (`/api/health`)
* `GET /api/health` — Service health check endpoint

---

## 🧪 Testing & Verification

### Backend Test Suite (Pytest)
```bash
cd backend
python -m pytest tests/
```
* **Result**: `13 passed, 0 errors`.

### Frontend Typecheck & Build
```bash
cd frontend
npm run build
```
* **Result**: `0 TypeScript/Vite errors`, production assets compiled cleanly.

---

## 👤 Author & Attribution

Created with ❤️ by **[Akarshan Rasyal](https://www.linkedin.com/in/akarshanrasyal/)**

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
