# MindQuiz

A fictional practice SaaS app (test project) for non-profit organisations.

- **Admin** creates quiz campaigns: title, description, accent colour and 3–5 questions.
- **Visitor** opens a public link (`/c/<slug>`), answers one question at a time and sees the result with a review of every answer.
- After the quiz the visitor can leave **name + e-mail + GDPR consent** (optional).
- **Dashboard** shows participants, average score, answers per question and the leads. A lead can be deleted.

The quiz questions are general knowledge questions. The app never asks about a visitor's own health and never stores health data.

## Tech stack

| Part       | Choice                                               |
| ---------- | ---------------------------------------------------- |
| Backend    | TypeScript, Hono, Node (port 8000)                   |
| Database   | PostgreSQL 17 in Docker Compose (port **5433**)      |
| ORM        | Drizzle ORM + drizzle-kit (migrations)               |
| Validation | Zod                                                  |
| Frontend   | Next.js (App Router), Tailwind CSS 4 (port 3000)     |
| Animations | motion (Framer Motion), canvas-confetti              |
| Fonts      | Inter (text), IBM Plex Mono (headings) via next/font |
| Icons      | lucide-react                                         |
| Tests      | Vitest (backend)                                     |

## Get started

You need **Node.js 20.9 or newer** (version 20, 22 or 24 and up; the test tool does not support 21 and 23), **npm** and **Docker**.

```bash
git clone https://github.com/ManauTunjae/mindquiz.git
cd mindquiz

npm install
cp backend/.env.example backend/.env   # fake demo values, change them if you like

docker compose up -d                   # start PostgreSQL
npm run db:migrate                     # create the tables
npm run db:seed                        # demo admin + demo campaign

npm run dev                            # backend :8000 + frontend :3000
```

Then open:

| What             | URL                                      |
| ---------------- | ---------------------------------------- |
| Start page       | http://localhost:3000                    |
| Demo quiz        | http://localhost:3000/c/wellbeing-basics |
| Admin login      | http://localhost:3000/admin/login        |
| API health check | http://localhost:8000/api/health         |

**Demo admin:** the e-mail and password are `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` in `backend/.env`.
With the example file they are `admin@example.com` and `change-me-123`. These are fake values for local use only.

The database uses port **5433** (not the usual 5432), so it does not clash with a PostgreSQL that is already installed on your computer.

## Commands

| Command                | What it does                                             |
| ---------------------- | -------------------------------------------------------- |
| `docker compose up -d` | Start PostgreSQL                                         |
| `npm run dev`          | Backend (:8000) and frontend (:3000) together            |
| `npm run db:generate`  | Create a migration from `backend/src/db/schema.ts`       |
| `npm run db:migrate`   | Run the migrations                                       |
| `npm run db:seed`      | Add the demo admin and demo campaign (safe to run again) |
| `npm run db:studio`    | Look at the data in the browser                          |
| `npm run lint`         | ESLint, backend and frontend                             |
| `npm run typecheck`    | TypeScript, backend and frontend                         |
| `npm test`             | Backend tests (the database must be running)             |
| `npm run format`       | Format all files with Prettier                           |

The tests use the same local database. Every test creates its own data with random names and deletes only that data afterwards, so your own campaigns are not touched.

## Project structure

```
mindquiz/
├── CLAUDE.md             # project rules
├── docs/PLAN.md          # plan, data model, API and feature list
├── docker-compose.yml    # PostgreSQL
├── backend/
│   ├── drizzle/          # generated migrations
│   └── src/
│       ├── db/           # drizzle client, schema, seed
│       ├── routes/       # admin/*, public/*  (HTTP only)
│       ├── services/     # business logic (no HTTP)
│       ├── middleware/   # auth, errors, rate limit, body limit
│       └── validation/   # zod schemas
└── frontend/src/
    ├── app/              # pages: (public)/c/[slug], (public)/privacy, admin/*
    ├── components/       # quiz/, dashboard/, ui/
    └── lib/              # api client, types, helpers
```

The full list of API endpoints, pages and the data model is in [docs/PLAN.md](docs/PLAN.md).

## Security and GDPR

- Admin login with e-mail and password. Passwords are hashed with **argon2**.
- The session is a random token in an **httpOnly, sameSite** cookie (`secure` in production). The database stores only a hash of the token.
- Everything under `/api/admin/*` needs a session. CORS only allows `http://localhost:3000`.
- Public routes never return the correct answers before the visitor has answered. The score is counted on the **server**.
- Rate limits on login, quiz submit and the lead form. Small limits on the size of request bodies.
- The consent box is **not** ticked from the start. The exact consent text and the time are saved with the lead, and both are set by the server.
- No IP addresses are stored. Visitors get no cookies.
- The privacy page (`/privacy`) explains what is stored, why, and how to ask for deletion. An admin can delete a lead in the dashboard.
- All brand names and contact details in this project are made up. The privacy e-mail is `privacy@example.org` (set in `frontend/src/lib/site.ts`).

## Known limits

- The rate limit lives in memory, so it works for one server process. Behind a proxy or on several servers it needs a shared store and the real client address.
- "Participants" are finished quizzes. The same person can be counted twice, because visitors do not log in.
- The lead list shows all leads (no pages) and there is no CSV export.
- The frontend has no automated tests. The backend has Vitest tests.
- `npm audit` still reports moderate advisories in development tools (ESLint plugins, esbuild). None of them are in the code that runs for users.

## Status

All planned features are built. See [docs/PLAN.md](docs/PLAN.md) for the feature list.
