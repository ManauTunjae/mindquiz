# MindQuiz

A fictional practice SaaS app (test project) for non-profit organisations.

- **Admin** creates quiz campaigns (title, accent colour, 3–5 questions).
- **Visitor** opens a public link, answers one question at a time and sees the result.
- At the end the visitor can leave name + e-mail + GDPR consent.
- **Dashboard** shows participants, answers per question and leads.

## Tech stack

- Backend: TypeScript, Hono, Node (port 8000)
- Database: PostgreSQL 17 (Docker Compose), Drizzle ORM
- Frontend: Next.js (App Router), Tailwind CSS 4 (port 3000)
- Validation: Zod
- Tests: Vitest

## Docs

- [Project plan](docs/PLAN.md): data model, API, pages and feature list
- [CLAUDE.md](CLAUDE.md): project rules

## Status

Project setup. The app code comes in the next features.
