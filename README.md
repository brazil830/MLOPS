# Kynora — Your AI Companion

A premium AI companion web application that creates emotionally intelligent, persona-driven relationship experiences with 15 unique relationship personas.

## 🏗️ Architecture

```
MLOPS/
├── frontend/          # Next.js (React) — Dark Mode Glassmorphic UI
│   └── src/
│       ├── app/
│       │   ├── auth/         # Login, Register, Forgot Password
│       │   ├── home/         # Persona Selection Grid
│       │   ├── chat/         # Main Conversation (Avatar + Chat)
│       │   ├── settings/     # App Settings
│       │   ├── globals.css   # Design System
│       │   ├── layout.js     # Root Layout
│       │   └── page.js       # Root Redirect
│       └── context/
│           ├── AuthContext.js    # JWT + Google OAuth
│           ├── PersonaContext.js # 15 Persona Definitions
│           ├── ChatContext.js    # Messaging + Online/Offline
│           └── Providers.js     # Combined Provider Wrapper
│
└── backend/           # FastAPI (Python) — ML-powered API
    └── app/
        ├── main.py            # FastAPI App Entry
        ├── config.py          # Pydantic Settings
        ├── database.py        # SQLAlchemy + PostgreSQL
        ├── models.py          # User, Conversation, Message, Memory
        ├── schemas.py         # Pydantic Request/Response Schemas
        ├── auth.py            # JWT + Password Hashing
        ├── emotion.py         # GoEmotions 27-class → 8 Visual States
        ├── persona.py         # 15 Persona Response Engine
        └── routes/
            ├── auth_routes.py    # Register, Login, Google OAuth
            ├── chat_routes.py    # Send Message, Chat History
            └── memory_routes.py  # Relationship Memories
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL

### 1. Database Setup
```bash
# Create PostgreSQL database
psql -U postgres -c "CREATE DATABASE kynora;"
```

### 2. Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Start server (tables auto-created on startup)
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open **http://localhost:3000** and you're ready to go!

## 🎭 15 Relationship Personas

| Persona | Name | Role |
|---------|------|------|
| 👩‍👦 | Amma | Mother |
| 👨‍👦 | Appa | Father |
| 🤝 | Alex | Best Friend |
| 💕 | Sam | Romantic Partner |
| 👫 | Mira | Sibling |
| 🎓 | Dr. Ray | Mentor |
| 🧘 | Dr. Luna | Therapist |
| 🧒 | Ravi | Childhood Friend |
| 👵 | Paatti | Grandparent |
| ⚔️ | Kai | Friendly Rival |
| 🐕 | Biscuit | Pet Companion |
| 💼 | Priya | Work Buddy |
| 🦋 | Jordan | Crush |
| 🕊️ | Sage | Spiritual Guide |
| 🎉 | Zara | Hype Friend |

## 🧠 Core Flow

```
User Message → Emotion Analysis (27 classes) → Persona-Aware Response → Emotion-Synced Avatar
```

## 🎨 Design

- **Theme**: Sleek dark mode with glassmorphism
- **Typography**: Inter + Outfit (Google Fonts)
- **Animations**: CSS keyframe animations for emotion transitions
- **Responsive**: Desktop → Tablet → Mobile adaptive layouts
