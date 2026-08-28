# 📬 CareerMail — Intelligent Email & Job Application Tracker

CareerMail combines a modern, high-performance email experience with an intelligent job application tracking platform. It solves the friction job seekers face with critical career communications scattered across hundreds of recruiter emails by automatically parsing, detecting, organizing, and visualizing job applications in one unified workspace.

Inspired by the design aesthetics of Linear, Notion, and premium fintech dashboards, CareerMail features a pixel-perfect dark theme, interactive Kanban pipeline, area and donut charts, countdown reminders, an integrated Q&A Career Assistant, and a **complete Google OAuth 2.0 Gmail integration**.

---

## 📸 Dashboard Preview

CareerMail features a pixel-perfect dark workspace matching modern SaaS standards:

* **5 Real-Time KPI Metric Cards**: Total Applications, Interviews, Offers, Rejections, Response Rate.
* **Applications Over Time Chart**: Smooth gradient spline chart with hover metrics.
* **Application Status Donut Chart**: Breakdown across Applied, Interview, Assessment, Offer, Rejected, and Withdrawn stages.
* **Upcoming Interviews & Follow-ups Queue**: Real-time countdown badges (`In 2 days`, `Due in 1 day`) with video link launchers.
* **Kanban Application Pipeline**: Drag-and-drop board across 6 stages with instant database persistence.
* **Floating Career Assistant**: An intelligent in-app assistant that queries your real career database.
* **Full-Featured Email Client**: Inbox, Important, Starred, Sent, Drafts with real-time job detection pipeline banners.
* **Google Gmail OAuth 2.0 & Live Sync**: Authorize with Google, scan recent emails, automatically detect job updates, and link them to your application timeline.

---

## 🛠️ Technology Stack

### Frontend
* **Framework**: React 18 with TypeScript
* **Build Tool**: Vite 5
* **Styling**: Tailwind CSS with custom glassmorphism and deep-navy theme
* **Animation & Polish**: Framer Motion, canvas-confetti
* **Icons**: Lucide React
* **Routing**: React Router DOM 6

### Backend
* **Language & Framework**: Java 21, Spring Boot 3.3
* **Security & Auth**: Spring Security with stateless JWT (`jjwt` 0.12) & BCrypt password hashing
* **Persistence**: Spring Data JPA / Hibernate ORM
* **Google Integration**: Google OAuth 2.0 token exchange, auto-refresh, and Gmail REST API Client
* **Parsing Engine**: Rule-Based Email Intelligence Pipeline (10 classification categories + entity extraction)
* **Validation**: Jakarta Bean Validation

### Database & DevOps
* **Primary Database**: PostgreSQL 16
* **Local In-Memory Fallback**: H2 Database (with `local` profile)
* **Containers**: Docker & Docker Compose (Multi-stage builds, Nginx reverse proxy)

---

## 🔑 Google Cloud Console & Gmail OAuth 2.0 Setup

To enable live Google OAuth and Gmail scanning with your own Google Cloud project:

### 1. Create / Configure Google Cloud Project
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Navigate to **APIs & Services > OAuth consent screen**:
   * **User Type**: External (or Internal for Google Workspace).
   * **App Name**: `CareerMail`
   * **Scopes**: Add:
     * `https://www.googleapis.com/auth/gmail.readonly` (Read-only access to messages)
     * `https://www.googleapis.com/auth/userinfo.email`
     * `https://www.googleapis.com/auth/userinfo.profile`
   * **Test Users**: Add your testing Gmail address.

### 2. Create OAuth 2.0 Client Credentials
1. Navigate to **APIs & Services > Credentials > Create Credentials > OAuth client ID**:
   * **Application type**: Web application
   * **Name**: `CareerMail Web Client`
   * **Authorized JavaScript origins**:
     * `http://localhost:5173`
     * `http://localhost`
   * **Authorized redirect URIs**:
     * `http://localhost:8080/api/auth/google/callback`
2. Copy the **Client ID** and **Client Secret**.

### 3. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your credentials:

```bash
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8080/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

> *Note: If Google credentials are not supplied, CareerMail operates in high-fidelity simulation mode so you can still test full end-to-end scanning, classification, and deduplication without hitting Google APIs.*

---

## 🚀 Quick Start with Docker

Launch the complete stack (PostgreSQL, Spring Boot Backend, and React Frontend) with Docker Compose:

```bash
docker compose up --build
```

Once started:
* **Web App (Frontend)**: [http://localhost](http://localhost) (or [http://localhost:5173](http://localhost:5173))
* **REST API (Backend)**: [http://localhost:8080/api](http://localhost:8080/api)
* **Database (PostgreSQL)**: `localhost:5432` (`careermail` / `careermail123`)

---

## 💻 Local Setup Without Docker

### Prerequisites
* **Java 21** or higher
* **Maven 3.9+**
* **Node.js 18+** & **npm**

### 1. Start the Backend
You can run the backend against the embedded database (zero configuration required):

```bash
cd backend
mvn spring-boot:run -Dspring-boot.run.profiles=local
```
The backend will start at `http://localhost:8080`.

### 2. Start the Frontend
In a new terminal:

```bash
cd frontend
npm install
npm run dev
```
The Vite development server will open at `http://localhost:5173` with automatic API proxying to `http://localhost:8080`.

---

## 🔐 Default Demo Account Credentials

CareerMail automatically seeds realistic data on first launch:

| Field | Value |
|---|---|
| **Email** | `arjun.sharma@email.com` |
| **Password** | `password123` |

> *Tip: On the login page, you can click **"Continue with Google"** or **"One-Click Demo Login"** to sign in instantly!*

---

## 🤖 Automatic Email → Job Tracker Intelligence Pipeline

CareerMail's ingestion engine parses email subjects, headers, and RFC2822 base64 bodies through 10 classification categories:

```text
Incoming Gmail Message / Ingested Email
                 ↓
      RuleBasedEmailAnalyzer
  (10 Classification Categories)
   • APPLICATION_SUBMITTED
   • APPLICATION_RECEIVED
   • RECRUITER_MESSAGE
   • INTERVIEW_INVITATION
   • INTERVIEW_SCHEDULED
   • ASSESSMENT
   • REJECTION
   • OFFER
   • STATUS_UPDATE
   • OTHER_JOB_RELATED
                 ↓
      Entity & Field Extractor
   • Company (Known entities & regex patterns)
   • Job Title & Seniority Level
   • Location & Work Type (Remote / Hybrid / On-site)
   • Deadlines & Assessment Durations
   • Interview Dates & Google Meet / Zoom Links
   • Compensation & Salary Figures
                 ↓
      Smart Deduplication & Grouping
   • Check existing applications by company & title
   • Update application stage (e.g. APPLIED → INTERVIEW → OFFER)
   • Append chronological Timeline Event
   • Auto-create Interview or Follow-up task if needed
                 ↓
      Real-Time Dashboard & Board Refresh
```

---

## 📡 REST API Documentation

### Authentication & Google OAuth (`/api/auth`)
* `POST /api/auth/register` — Register a new account
* `POST /api/auth/login` — Sign in and obtain a JWT bearer token
* `GET /api/auth/me` — Retrieve currently authenticated user profile
* `GET /api/auth/google/url` — Generate Google OAuth 2.0 authorization URL
* `GET /api/auth/google/callback` — Exchange auth code, store refresh tokens, redirect to frontend
* `GET /api/auth/google/config` — View OAuth client configuration status

### Gmail Integration (`/api/gmail`)
* `GET /api/gmail/status` — Get Gmail connection status, email address, sync timestamp
* `POST /api/gmail/sync?maxResults=30` — Scan Gmail messages, extract applications, prevent duplicates
* `POST /api/gmail/disconnect` — Disconnect Gmail account and revoke access

### Job Applications (`/api/applications`)
* `GET /api/applications` — List all tracked applications
* `GET /api/applications/{id}` — Get application details with timeline & contacts
* `POST /api/applications` — Create a job application manually
* `PUT /api/applications/{id}` — Update application details
* `PATCH /api/applications/{id}/status` — Update Kanban pipeline status
* `DELETE /api/applications/{id}` — Remove an application
* `GET /api/applications/search?q={query}` — Search across company, title, recruiter

### Emails (`/api/emails`)
* `GET /api/emails?folder={inbox|important|starred|sent|drafts}` — List folder emails
* `GET /api/emails/{id}` — Read specific email
* `PATCH /api/emails/{id}/read` — Toggle read/unread
* `PATCH /api/emails/{id}/star` — Toggle starred status
* `PATCH /api/emails/{id}/important` — Toggle important bookmark
* `POST /api/emails/compose` — Send outgoing email
* `POST /api/emails/simulate` — Ingest simulated email to trigger auto-pipeline
* `GET /api/emails/counts` — Retrieve folder badge counters

### Interviews (`/api/interviews`)
* `GET /api/interviews` — List upcoming and past interviews
* `POST /api/interviews` — Schedule a new interview
* `PUT /api/interviews/{id}` — Update interview information
* `DELETE /api/interviews/{id}` — Delete interview

### Follow-ups (`/api/followups`)
* `GET /api/followups` — List pending follow-ups with due badges
* `POST /api/followups` — Create a follow-up reminder
* `PUT /api/followups/{id}` — Update follow-up status (e.g. `COMPLETED`)
* `DELETE /api/followups/{id}` — Remove follow-up

### Analytics & AI Assistant
* `GET /api/analytics` — Dynamic KPI counters, trends, and status distributions
* `POST /api/assistant/ask` — Natural-language query interface against live career data

---

## 🧪 Testing

### Backend Unit & Integration Tests
Run the comprehensive Spring Boot test suite:
```bash
cd backend
mvn clean test
```

### Frontend Typecheck & Production Build
Validate TypeScript types and compile the Vite asset bundle:
```bash
cd frontend
npm run build
```

---

## 📄 License
MIT License. Built as an end-to-end full-stack portfolio product.
