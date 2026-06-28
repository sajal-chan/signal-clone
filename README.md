# Signal Clone

A full-stack messaging app built with Next.js and FastAPI — real-time chat, group conversations, emoji reactions, and typing indicators.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, Zustand |
| Backend | FastAPI, SQLAlchemy (async), SQLite |
| Real-time | WebSockets (FastAPI) |
| Auth | JWT tokens + mock OTP (dev) |

---

## Project Structure

```
signal-clone/
├── backend/        # FastAPI server
│   ├── app/
│   │   ├── models/     # SQLAlchemy models
│   │   ├── routers/    # API routes
│   │   ├── schemas/    # Pydantic schemas
│   │   ├── services/   # Business logic
│   │   ├── main.py     # App entry point
│   │   └── seed.py     # Sample data
│   ├── .env            # Backend environment variables
│   └── requirements.txt
└── frontend/       # Next.js app
    ├── app/            # Pages (App Router)
    ├── components/     # UI components
    ├── store/          # Zustand state
    ├── lib/            # API client, socket
    └── .env.local      # Frontend environment variables
```

---

## Prerequisites

- **Python 3.11+**
- **Node.js 18+**

---

## Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd signal-clone
```

### 2. Backend setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a `backend/.env` file:

```env
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite+aiosqlite:///./signal.db
PORT=3277
CORS_ORIGIN=http://localhost:3000
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

Create a `frontend/.env.local` file:

```env
NEXT_PUBLIC_BACKEND_URL=http://127.0.0.1:3277
NEXT_PUBLIC_WS_URL=ws://127.0.0.1:3277
```

---

## Running the App

### Start the backend

```bash
cd backend
venv\Scripts\activate     # Windows
# or: source venv/bin/activate  (macOS/Linux)

uvicorn app.main:app --host 127.0.0.1 --port 3277 --reload
```

The API will be available at `http://127.0.0.1:3277`.  
Interactive API docs: `http://127.0.0.1:3277/docs`

### Start the frontend

```bash
cd frontend
npm run dev
```

Open `http://localhost:3000` in your browser.

> Both servers need to be running at the same time.

---

## Seed Sample Data (Optional)

Populates the database with 8 users, contacts, 3 DMs, and 2 group chats.

```bash
cd backend
python -m app.seed
```

### Seeded users

All seeded accounts use OTP `123456` to log in.

| Username | Display Name |
|---|---|
| alice | Alice Chen |
| bob | Bob Martinez |
| carol | Carol White |
| dave | Dave Kim |
| eve | Eve Johnson |
| frank | Frank Lee |
| grace | Grace Patel |
| heidi | Heidi Nguyen |

---

## Authentication

This app uses a simplified mock OTP flow (no real SMS):

1. Enter your username on the login page
2. Enter `123456` as the OTP
3. You're in

To register a new account, go to `/register`, fill in your details, then enter `123456` as the OTP.

---

## Features

- One-on-one and group messaging
- Real-time delivery via WebSocket
- Typing indicators
- Emoji reactions (right-click or long-press a message)
- Quoted replies
- Read receipts
- Online presence indicators
- Group management (rename, add/remove members)
- User search
- Profile settings (display name, status message)

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Default |
|---|---|---|
| `SECRET_KEY` | JWT signing secret | — |
| `DATABASE_URL` | SQLAlchemy database URL | `sqlite+aiosqlite:///./signal.db` |
| `PORT` | Port to run the server on | `3277` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:3000` |

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_BACKEND_URL` | Backend HTTP URL (for API proxy) | `http://127.0.0.1:3277` |
| `NEXT_PUBLIC_WS_URL` | Backend WebSocket URL | `ws://127.0.0.1:3277` |

---

## Reset the Database

Delete the database file and re-seed:

```bash
cd backend
rm signal.db        # macOS/Linux
del signal.db       # Windows

python -m app.seed
```

The database is recreated automatically on next server start.
