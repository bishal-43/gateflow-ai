# GateFlow AI Backend

Smart visitor management and event entry backend built with FastAPI.

GateFlow AI helps organizers and guards manage two main flows:
- **Pre-invite flow** (visitor already invited, QR is ready)
- **Walk-in flow** (visitor not invited, organizer approval creates invite + QR)

---

## Why This Project Exists

Managing event or apartment entry manually is slow and error-prone.  
GateFlow AI makes it fast, traceable, and secure:

- invite visitors with QR
- scan entry/exit at the gate
- approve walk-ins quickly
- monitor occupancy in real time
- prevent duplicate scans

---

## Tech Stack

- **FastAPI** - async REST APIs + Swagger docs
- **PostgreSQL** - primary database
- **SQLAlchemy 2.0 (async)** - ORM + async sessions
- **Redis** - QR deduplication + token blacklist
- **JWT** - access and refresh authentication
- **WebSockets** - live dashboard updates
- **Pydantic v2** - request/response validation

---

## Architecture (Simple and Traceable)

Request flow:

```text
Route -> Controller -> Service -> Database
```

Responsibilities:

- **Routes**: endpoint definitions + dependency injection only
- **Controllers**: receive input, call service, return response
- **Services**: business logic, DB operations, validations, Redis, QR logic

No overengineering: no repository pattern, no CQRS, no DDD, no factories.

---

## Project Structure

```text
gateflow-backend/
├── controllers/
├── models/
├── routes/
├── schemas/
├── services/
├── tests/
├── uploads/
├── utils/
├── websocket/
├── main.py
├── config.py
├── database.py
├── dependencies.py
├── security.py
└── requirements.txt
```

---

## Quick Start

### 1) Create and activate virtual environment

```bash
python -m venv .venv
```

Windows:
```bash
.venv\Scripts\activate
```

Mac/Linux:
```bash
source .venv/bin/activate
```

### 2) Install dependencies

```bash
pip install -r requirements.txt
```

### 3) Setup environment variables

```bash
copy .env
```

Then edit `.env`.

### 4) Run backend

```bash
uvicorn main:app --reload
```

Open:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- Health: `http://localhost:8000/health`

---

## Environment Variables

```env
# App
APP_ENV=development
SECRET_KEY=your-secret-key-min-32-chars

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@host/dbname

# Redis
REDIS_URL=redis://localhost:6379

# OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5174
```

---

## Roles

- **ADMIN**: full system access
- **ORGANIZER**: manage spaces/invites, approve walk-ins, dashboard access
- **RESIDENT**: create spaces/invites (residential use cases)
- **GUARD**: entry/exit scan, create walk-in requests
- **VISITOR**: no login; uses invite token link

---

## Core Flows

### 1) Pre-Invite Flow

1. Organizer creates invite
2. System generates QR token
3. Visitor opens invite link
4. Guard scans QR at entry (`/entry/scan`)
5. Guard scans at exit (`/exit/scan`)

### 2) Walk-In Flow

1. Guard creates walk-in request (`/walkins/request`)
2. Organizer approves (`/walkins/approve/{walkin_id}`)
3. System auto-creates a **normal invite** with QR
4. Guard scans QR through the **same** entry flow

### 3) QR Validation Rules

- All scans use one shared validation flow
- Redis prevents duplicate scans and race conditions
- Database constraints provide final safety
- WebSocket events broadcast only after successful DB commit

---

## API Overview

> Full request/response schemas are available in Swagger (`/docs`).

### Auth

- `POST /auth/register` - register new user (role is always **ORGANIZER**; no client-supplied role)
- `POST /auth/login` - login and get tokens
- `POST /auth/logout` - revoke tokens
- `POST /auth/refresh` - rotate access/refresh tokens
- `GET /auth/me` - current user profile
- `GET /auth/google` - start Google OAuth
- `GET /auth/google/callback` - OAuth callback

### Spaces

- `POST /spaces` - create space
- `GET /spaces` - list spaces
- `GET /spaces/{space_id}` - get one space
- `PUT /spaces/{space_id}` - update space
- `DELETE /spaces/{space_id}` - soft delete space

### Invites

- `POST /invites` - create invite + QR
- `GET /invites` - list invites
- `GET /invites/{invite_id}` - get invite
- `PUT /invites/{invite_id}` - update invite
- `DELETE /invites/{invite_id}` - revoke invite

### Visitor (Public)

- `GET /visitor/invite/{token}` - open invite link
- `GET /visitor/qr/{token}` - get QR token
- `GET /visitor/details/{token}` - invite + visitor details

### Entry / Exit

- `POST /entry/scan` - scan entry QR
- `GET /entry/active` - visitors currently inside
- `POST /exit/scan` - scan exit QR
- `GET /exit/occupancy` - occupancy snapshot

### Walk-ins

- `POST /walkins/request` - guard submits walk-in
- `POST /walkins/approve/{walkin_id}` - organizer approves
- `POST /walkins/reject/{walkin_id}` - organizer rejects
- `GET /walkins/pending` - pending requests

### Dashboard / Overstay

- `GET /dashboard/stats` - overview counts
- `GET /dashboard/occupancy` - occupancy metrics
- `GET /dashboard/entries` - recent entries
- `GET /dashboard/walkins` - walk-in history
- `GET /dashboard/overstays` - overstay list
- `GET /overstay/active` - active overstays
- `POST /overstay/resolve/{session_id}` - resolve overstay

### Notifications

- `POST /notifications/send` - admin send notification
- `GET /notifications/` - list own notifications
- `PATCH /notifications/{notif_id}/read` - mark as read

### Documents

- `POST /documents/upload` - upload PDF document
- `GET /documents/` - list space documents
- `DELETE /documents/{doc_id}` - delete document

### WebSocket

- `ws://host/ws/dashboard/{space_id}` - live dashboard events

---

## Running Tests

```bash
pytest -q
```

Current test modules include:
- auth
- invites
- entry
- walkins
- documents/uploads

---

## Security and Validation Notes

- JWT access + refresh token flow
- Redis token blacklist for logout
- Role-based access control via dependencies
- Rate limiting on sensitive routes (for example login)
- QR deduplication to block replay/double scan

---

## Contribution Guidelines (Team Friendly)

- keep routes thin
- keep business logic in services
- avoid unnecessary abstractions
- write clear names and small functions
- update tests for behavior changes

---

## License

Internal project for training and team development.
