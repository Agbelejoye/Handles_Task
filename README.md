# ⚡ Task Handler AI

> **Real-time AI-powered task management** — Track tasks, chat with an AI assistant, run Pomodoro focus sessions, monitor browser activity, and stay on top of your day.

![Task Handler AI Dashboard](https://placehold.co/1200x630/0B0B0B/D4AF37?text=Task+Handler+AI)

---

## ✨ Features (MVP – Phase 1)

| Feature | Status |
|---------|--------|
| Task CRUD (create, edit, delete, complete) | ✅ |
| Task types: Daily / One-Time / Recurring | ✅ |
| Task priority & deadline management | ✅ |
| AI chat assistant (mock + OpenAI) | ✅ |
| Daily progress bar & category breakdown | ✅ |
| Pomodoro focus sessions | ✅ |
| Smart alerts (overdue, break, sleep) | ✅ |
| Browser activity insights | ✅ |
| Activity ingest endpoint (for extension) | ✅ |
| Browser extension scaffold (Chrome/Edge) | ✅ |
| Real-time sync via SSE | ✅ |
| Opt-in activity tracking toggle | ✅ |
| Gold/Black design theme | ✅ |
| Glassmorphism UI + Framer Motion | ✅ |
| Unit tests for business logic | ✅ |

---

## 🏗 Architecture

```
task-handler-ai/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # Main dashboard (client component)
│   │   ├── layout.tsx                # Root layout
│   │   └── api/
│   │       ├── tasks/route.ts        # GET list, POST create
│   │       ├── tasks/[id]/route.ts   # GET, PATCH, DELETE single task
│   │       ├── progress/route.ts     # GET daily progress + categories
│   │       ├── focus/route.ts        # GET active, POST start
│   │       ├── focus/[id]/route.ts   # PATCH stop/complete
│   │       ├── activity/route.ts     # GET insights, POST ingest (extension)
│   │       ├── alerts/route.ts       # GET active alerts
│   │       ├── alerts/[id]/route.ts  # PATCH acknowledge/reschedule/dismiss
│   │       ├── ai/route.ts           # POST chat, GET history
│   │       └── realtime/route.ts     # SSE stream for live updates
│   ├── components/
│   │   ├── dashboard/                # Header, ProgressOverview
│   │   ├── tasks/                    # TaskList, TaskModal
│   │   ├── ai-chat/                  # AIChat panel
│   │   ├── focus/                    # FocusPanel (Pomodoro)
│   │   ├── alerts/                   # AlertsPanel
│   │   ├── activity/                 # ActivityInsights
│   │   └── ui/                       # Card, Button, Badge, ProgressBar
│   ├── lib/
│   │   ├── prisma.ts                 # Prisma client singleton
│   │   ├── task-logic.ts             # Priority scoring, completion %, filtering
│   │   ├── alert-heuristics.ts       # Break/sleep/distraction alert generation
│   │   ├── ai.ts                     # OpenAI + mock AI response engine
│   │   ├── schemas.ts                # Zod validation schemas
│   │   ├── api-helpers.ts            # Response helpers, auth stub
│   │   └── utils.ts                  # Utility functions
│   ├── store/
│   │   └── index.ts                  # Zustand stores (tasks, progress, focus, alerts, chat)
│   └── hooks/
│       └── useRealtimeSync.ts        # SSE + polling-based realtime hook
├── prisma/
│   ├── schema.prisma                 # DB models
│   └── seed.ts                       # Demo data seed
├── extension/                        # Chrome/Edge browser extension (Manifest V3)
│   ├── manifest.json
│   ├── background.js                 # Service worker: tab tracking + sync
│   ├── popup.html / popup.js         # Extension popup UI
│   └── README.md
├── __tests__/
│   └── lib/
│       ├── task-logic.test.ts        # 21 unit tests
│       └── alert-heuristics.test.ts  # 11 unit tests
└── prisma.config.ts                  # Prisma 7 configuration
```

### Tech stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Animation | Framer Motion |
| State | Zustand |
| Database ORM | Prisma 7 + PostgreSQL |
| Validation | Zod v4 |
| AI | OpenAI API (GPT-4o-mini) + deterministic mock fallback |
| Realtime | Server-Sent Events (SSE) + polling fallback |
| Tests | Jest + ts-jest |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL (local or cloud)
- npm

### 1. Clone & install

```bash
git clone https://github.com/Agbelejoye/Handles_Task.git
cd Handles_Task
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Required: PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/task_handler_ai?schema=public"

# Optional: OpenAI key (mock AI used when absent)
OPENAI_API_KEY="sk-..."

# Demo user (used in dev/demo mode)
DEMO_USER_ID="demo-user-001"
```

### 3. Set up the database

```bash
# Generate Prisma client
npm run db:generate

# Run migrations (creates tables)
npm run db:migrate

# Seed with demo data
npm run db:seed
```

### 4. Run the app

```bash
npm run dev
# → http://localhost:3000
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch
```

**32 tests** across:
- `task-logic.ts` – priority scoring, completion %, filtering, break/sleep heuristics
- `alert-heuristics.ts` – alert generation conditions

### Type checking

```bash
npm run typecheck
```

### Lint

```bash
npm run lint
```

---

## 🌐 API Reference

All endpoints return `{ success: boolean, data: T }` on success or `{ success: false, error: string }` on failure.

> **Auth note**: Currently uses a demo user ID for local development. Replace `getUserId()` in `src/lib/api-helpers.ts` with proper session auth (NextAuth, Clerk, etc.) for production.

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks?filter=today&priority=HIGH&tag=work` | List tasks |
| `POST` | `/api/tasks` | Create task |
| `GET` | `/api/tasks/:id` | Get task + progress |
| `PATCH` | `/api/tasks/:id` | Update task |
| `DELETE` | `/api/tasks/:id` | Delete task |

### Progress

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/progress?date=2024-06-15` | Daily % + categories + streak |

### Focus Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/focus` | Get active session |
| `POST` | `/api/focus` | Start session |
| `PATCH` | `/api/focus/:id` | Stop/complete session |

### Activity

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/activity?limit=50` | Get activity + top domains |
| `POST` | `/api/activity` | Ingest batch of events (from extension) |

**Ingest payload:**
```json
{
  "events": [
    {
      "domain": "github.com",
      "url": "https://github.com/...",
      "title": "Page title",
      "durationSec": 300,
      "taskId": "optional-task-id",
      "recordedAt": "2024-06-15T14:00:00Z"
    }
  ]
}
```

### Alerts

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/alerts` | Get active alerts |
| `PATCH` | `/api/alerts/:id` | Acknowledge / Reschedule / Dismiss |

### AI Chat

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/ai` | Send message, get response |
| `GET` | `/api/ai?conversationId=...` | Get conversation history |

**Chat payload:**
```json
{
  "message": "What should I do next?",
  "conversationId": "optional-existing-id"
}
```

### Realtime

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/realtime` | SSE stream for live updates |

---

## 🧩 Browser Extension

See [`/extension/README.md`](./extension/README.md) for full setup instructions.

**Quick setup:**
1. Open `chrome://extensions`
2. Enable Developer mode
3. Click "Load unpacked" → select the `/extension` folder
4. Enable activity tracking in the popup (opt-in)

---

## 🔐 Privacy & Security

- **Activity tracking is opt-in** — disabled by default, user must explicitly enable it
- No data is sent to third parties
- No secrets are hardcoded — use `.env` for all credentials
- The extension only syncs to your configured Task Handler AI instance
- See `.env.example` for required environment variable documentation

---

## 🗺 PRD Feature Map

| PRD Section | Implementation | Notes |
|------------|---------------|-------|
| 4.1 Task Management | ✅ Full CRUD, types, priorities, tags | |
| 4.2 AI Chat | ✅ Mock + OpenAI hybrid | Add `OPENAI_API_KEY` for real AI |
| 4.3 Browser Sync | ✅ Extension scaffold + activity API | |
| 4.4 Progress Tracking | ✅ Daily % + category bars + streak | |
| 4.5 Smart Alerts | ✅ Overdue, break, sleep, distraction | |
| 4.6 Focus/Wellness | ✅ Pomodoro timer with break phases | |
| 4.7 Dashboard | ✅ All 4 sections implemented | |
| 5. UI/UX Design | ✅ Gold/black, glassmorphism, Framer Motion | |
| 6.1 Frontend | ✅ Next.js App Router + Zustand + TailwindCSS | |
| 6.2 Backend | ✅ Next.js API routes + PostgreSQL + Prisma | |
| 6.3 AI Integration | ✅ Context-aware mock + OpenAI path | |
| 6.4 Browser Extension | ✅ Manifest V3 scaffold | |
| 7. Realtime | ✅ SSE stream + 60s polling fallback | |
| 8. Security/Privacy | ✅ Opt-in tracking, env vars, no hardcoded secrets | |

### TODO / Future Enhancements

- [ ] Replace demo user with proper authentication (NextAuth/Clerk)
- [ ] Replace SSE with managed pub/sub (Pusher/Supabase Realtime) for multi-instance
- [ ] Add real-time distraction blocking in extension
- [ ] Mobile app (React Native)
- [ ] Voice assistant integration
- [ ] Google Calendar sync
- [ ] Team collaboration mode
- [ ] Idle detection in browser extension
- [ ] Firefox extension support

---

## 📊 Database Schema

Core models in `prisma/schema.prisma`:

- **User** – profile + opt-in tracking flag
- **Task** – all task fields (type, priority, deadline, tags, recurring days)
- **TaskProgress** – completion events per task
- **FocusSession** – Pomodoro sessions with status
- **ActivityLog** – browser activity records from extension
- **Alert** – smart alerts with type and status
- **AIConversation / AIMessage** – full chat history

---

## 🤝 Contributing

1. Fork the repo
2. Create a feature branch
3. Run `npm test && npm run typecheck` before committing
4. Open a PR

---

*Built with ❤️ and ⚡ — Task Handler AI MVP*
