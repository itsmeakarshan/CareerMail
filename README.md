# 📬 CareerMail — Intelligent Email & Job Application Tracker

CareerMail combines a modern, high-performance email experience with an intelligent job application tracking platform. It solves the friction job seekers face with critical career communications scattered across hundreds of recruiter emails by automatically parsing, detecting, organizing, and visualizing job applications in one unified workspace.

Inspired by the design aesthetics of Linear, Notion, and premium fintech dashboards, CareerMail features a pixel-perfect dark theme, interactive Kanban pipeline, area and donut charts, countdown reminders, and an integrated Q&A Career Assistant.

---

## 📸 Dashboard Preview

CareerMail features a pixel-perfect dark workspace matching modern SaaS standards:

* **5 Real-Time KPI Metric Cards**: Total Applications (47), Interviews (8), Offers (2), Rejections (5), Response Rate (68%).
* **Applications Over Time Chart**: Smooth gradient spline chart with hover metrics.
* **Application Status Donut Chart**: Breakdown across Applied, Interview, Assessment, Offer, Rejected, and Withdrawn stages.
* **Upcoming Interviews & Follow-ups Queue**: Real-time countdown badges (`In 2 days`, `Due in 1 day`) with video link launchers.
* **Kanban Application Pipeline**: Drag-and-drop board across 6 stages with instant database persistence.
* **Floating Career Assistant**: An intelligent in-app assistant that queries your real career database.
* **Full-Featured Email Client**: Inbox, Important, Starred, Sent, Drafts with real-time job detection pipeline banners.

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
* **Validation**: Jakarta Bean Validation
* **Parsing Engine**: Rule-Based Email Intelligence Pipeline (extensible for AI provider handoff)

### Database & DevOps
* **Primary Database**: PostgreSQL 16
* **Local In-Memory Fallback**: H2 Database (with `local` profile)
* **Containers**: Docker & Docker Compose (Multi-stage builds, Nginx reverse proxy)

---

## 🚀 Quick Start with Docker

The fastest way to launch the entire stack (PostgreSQL, Spring Boot Backend, and React Frontend) is with Docker Compose:

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

> *Tip: On the login page, you can also click the **"One-Click Demo Login"** button to log in instantly!*

---

## 🤖 Automatic Email → Job Tracker Pipeline

CareerMail incorporates a deterministic rule-based analysis pipeline that extracts structured job metadata from email subjects, bodies, and sender domains:

```text
Email (Received or Composed)
         ↓
  EmailAnalysisService
         ↓
  RuleBasedEmailAnalyzer
    • Is this job-related?
    • Extract Company (Known entities & regex patterns)
    • Extract Job Title (Role dictionaries & regex patterns)
    • Determine Stage (Applied, Assessment, Interview, Offer, Rejection)
         ↓
  Match Existing Application OR Create New Application
         ↓
  Append Event to Application Timeline
         ↓
  Update Dashboard & Kanban Pipeline
```

### Live Pipeline Testing
In the **Inbox** or from the **Compose** button, click the **Simulate Job Email** presets (e.g. *Stripe Application*, *Google Interview*, or *Netflix Offer*) to see emails auto-classified and applications created in real-time.

---

## 📡 REST API Documentation

### Authentication (`/api/auth`)
* `POST /api/auth/register` — Register a new account
* `POST /api/auth/login` — Sign in and obtain a JWT bearer token
* `GET /api/auth/me` — Retrieve currently authenticated user profile

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

## 📁 Project Structure

```text
careermail/
├── backend/
│   ├── src/main/java/com/careermail/
│   │   ├── config/              # Security, CORS, DataInitializer
│   │   ├── controller/          # REST Controllers
│   │   ├── dto/                 # Request/Response DTOs
│   │   ├── model/
│   │   │   ├── entity/          # User, JobApplication, Email, Interview, etc.
│   │   │   └── enums/           # ApplicationStatus, Priority, etc.
│   │   ├── repository/          # Spring Data JPA Repositories
│   │   ├── security/            # JWT Filter, Token Service, UserDetails
│   │   └── service/             # Domain Services & Email Analyzer
│   ├── src/main/resources/      # application.yml, application-local.yml
│   ├── Dockerfile
│   └── pom.xml
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/          # CompanyLogo, CareerAssistantWidget
│   │   │   ├── dashboard/       # KpiCards, Charts, KanbanPipeline, Drawers
│   │   │   ├── email/           # ComposeEmailModal
│   │   │   └── layout/          # AppLayout, Sidebar, Navbar
│   │   ├── context/             # AuthContext, ThemeContext
│   │   ├── pages/               # JobTrackerPage, InboxPage, Interviews, etc.
│   │   ├── services/            # Typed API client
│   │   └── types/               # TypeScript models
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── vite.config.ts
│
├── docker-compose.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## 📩 Future Gmail Integration Architecture

CareerMail's `EmailAnalyzer` interface is designed to seamlessly ingest messages from external providers:

```text
User clicks "Connect Gmail"
       ↓
Google OAuth 2.0 Flow (offline access & restricted gmail.readonly scope)
       ↓
Backend stores encrypted Refresh Token in PostgreSQL
       ↓
Scheduled Background Sync via Gmail API
       ↓
EmailAnalysisService processes new messages
       ↓
Live updates pushed to Job Tracker Pipeline
```
A placeholder connection module is available directly inside the **Settings** view.

---

## 📄 License
MIT License. Built as an end-to-end full-stack portfolio product.
