# MindQuiz — Plan

## 1. About the app

MindQuiz is a small practice SaaS for non-profit organisations.

- An **admin** creates quiz campaigns: title, description, accent colour and 3–5 questions.
- A **visitor** opens `/c/[slug]`, answers one question at a time and sees the score at the end.
- After the quiz the visitor can leave **name + e-mail + GDPR consent** (lead form).
- The admin sees **participants, answers per question and leads** on a dashboard.

Questions are general knowledge / awareness questions. We never ask about the visitor's own health
and we do not store health data.

## 2. Data model (PostgreSQL + Drizzle)

| Table                | Columns                                                                                                             | Relations                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `admins`             | id, email (unique), password_hash, created_at                                                                       | —                                              |
| `sessions`           | id (hash of random token), admin_id, expires_at, created_at                                                         | admin_id → admins (cascade)                    |
| `campaigns`          | id (uuid), slug (unique), title, description, accent_color, status (`draft` \| `published`), created_at, updated_at | —                                              |
| `questions`          | id, campaign_id, text, position                                                                                     | campaign_id → campaigns (cascade)              |
| `answer_options`     | id, question_id, text, is_correct, position                                                                         | question_id → questions (cascade)              |
| `submissions`        | id, campaign_id, score, total, completed_at                                                                         | campaign_id → campaigns (cascade)              |
| `submission_answers` | id, submission_id, question_id, option_id                                                                           | submission_id → submissions (cascade)          |
| `leads`              | id, submission_id (unique), campaign_id, name, email, consent (must be true), consent_text, consent_at, created_at  | → submissions (cascade), → campaigns (cascade) |

Rules (checked with Zod and in the service):

- A campaign has **3–5 questions**.
- A question has **2–4 options** and **exactly 1 correct** option.
- Schema changes only through Drizzle migrations.

The database also enforces some of these rules itself:

- at most one correct option per question (partial unique index)
- `consent` must be `true` in `leads` (check constraint)
- one lead per submission (unique `submission_id`)
- unique positions of questions in a campaign and of options in a question
- `submissions.id` is a uuid, because it is used in a public URL

## 3. API endpoints (backend, port 8000)

Errors always look like `{ "error": "message" }` with status 400, 401, 404, 409, 413, 429 or 500.
JSON field names are camelCase (`isCorrect`, `questionId`). The database columns are snake_case.

### Health

- `GET /api/health` → `{ "status": "ok" }`

### Public — `/api/public` (no login)

| Method | Path                           | What                                                                                                                                                                                                                                                                                                                                          |
| ------ | ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET    | `/campaigns/:slug`             | Published campaign with questions and options, and the `consentText` for the lead form. **No `isCorrect`.** A draft and an unknown slug both give 404.                                                                                                                                                                                        |
| POST   | `/campaigns/:slug/submissions` | Body `{ answers: [{ questionId, optionId }] }`. Every question must be answered once, and every answer must belong to its question (else 400, nothing saved). The score is counted on the server. 201 `{ submissionId, score, total, results: [{ questionId, chosenOptionId, correctOptionId }] }`. 30 per 15 min per client, body max 10 KB. |
| POST   | `/submissions/:id/lead`        | Body `{ name, email, consent: true }`. `consent` must be exactly `true`. The server sets the consent text and the time. 201 `{ ok: true }`, 400, 404 (unknown submission), 409 (a lead already exists). 10 per 15 min per client, body max 4 KB.                                                                                              |

The visitor sees right/wrong answers **only at the end** (one submit call).

### Admin — `/api/admin` (all protected, except login)

| Method | Path                           | What                                                                                                                                   |
| ------ | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/auth/login`                  | E-mail + password → sets httpOnly session cookie. 10 per 15 min per client.                                                            |
| POST   | `/auth/logout`                 | Deletes session + cookie                                                                                                               |
| GET    | `/auth/me`                     | Current admin                                                                                                                          |
| GET    | `/campaigns`                   | List campaigns (with number of participants)                                                                                           |
| POST   | `/campaigns`                   | Create campaign with questions and options. The slug is made from the title and never changes.                                         |
| GET    | `/campaigns/:id`               | One campaign with questions, options and `isCorrect`                                                                                   |
| PUT    | `/campaigns/:id`               | Update title, description, colour or status (always). Questions can only be changed while the campaign has no participants (else 409). |
| DELETE | `/campaigns/:id`               | Delete campaign (cascade: questions, submissions, leads)                                                                               |
| GET    | `/campaigns/:id/stats`         | Participants, average score, number of leads, and for every question how many people chose each answer (count and percent)             |
| GET    | `/campaigns/:id/leads`         | List of leads (name, e-mail, score, when consent was given), newest first                                                              |
| DELETE | `/campaigns/:id/leads/:leadId` | Delete one lead. The quiz submission stays, but is no longer linked to a person.                                                       |

## 4. Frontend pages (Next.js, port 3000)

| Path                         | What                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| `/`                          | Home page: hero, benefits, animated how-to, sample questions, privacy, footer (feature 13) |
| `/c/[slug]`                  | Visitor quiz: intro → one question at a time → result + confetti → lead form → thank you   |
| `/privacy`                   | What we store, why, and how to ask for deletion                                            |
| `/admin/login`               | Admin login                                                                                |
| `/admin/campaigns`           | Campaign list (title, status, public link, participants)                                   |
| `/admin/campaigns/new`       | Create campaign                                                                            |
| `/admin/campaigns/[id]/edit` | Edit campaign                                                                              |
| `/admin/campaigns/[id]`      | Dashboard: stats + leads                                                                   |

## 5. Features (in order)

Every feature: one branch → lint, typecheck, tests pass → PR to `development` → wait for "merge" → mark ✅ here.

| #   | Status | Branch                                  | What                                                                                                                                                                                                          | What to test                                                                                                                 |
| --- | ------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 1   | ✅     | `main` (only this once) → `development` | **project-setup**: `git init`, `.gitignore`, README, CLAUDE.md, this PLAN.md. First commit on `main`. Create public GitHub repo `ManauTunjae/mindquiz` with `gh`, push `main`, create and push `development`. | GitHub page shows the repo with `main` and `development`. `git branch -a`                                                    |
| 2   | ✅     | `feature/monorepo-setup`                | Root `package.json` + `concurrently`. Backend Hono with `/api/health`. Frontend Next.js + Tailwind 4 + fonts + colour tokens. ESLint, typecheck, Vitest.                                                      | `npm run dev` → http://localhost:8000/api/health and http://localhost:3000. `npm run lint && npm run typecheck && npm test`  |
| 3   | ✅     | `feature/database`                      | `docker-compose.yml`, Drizzle client + schema, first migration, seed (demo admin + demo campaign), db scripts                                                                                                 | `docker compose up -d`, `npm run db:migrate`, `npm run db:seed`, `npm run db:studio`                                         |
| 4   | ✅     | `feature/admin-auth`                    | Password hashing, sessions, login/logout/me, auth middleware, error handler, CORS                                                                                                                             | Postman: login → cookie is set; `GET /api/admin/auth/me` → 200; without cookie → 401                                         |
| 5   | ✅     | `feature/campaign-api`                  | Zod schemas, campaign service (create/list/get/update/delete), admin routes, Vitest tests for the rules                                                                                                       | Postman CRUD; bad body → 400; `npm test`                                                                                     |
| 6   | ✅     | `feature/admin-campaign-ui`             | Login page, campaign list, create/edit form, delete, publish                                                                                                                                                  | Browser: log in, create / edit / delete a campaign. Check at 375px                                                           |
| 7   | ✅     | `feature/public-quiz-api`               | Get campaign by slug, submit answers, score on backend, rate limit, tests                                                                                                                                     | Postman: GET has no `is_correct`; submit → correct score                                                                     |
| 8   | ✅     | `feature/public-quiz-ui`                | Quiz flow, progress bar, fade/slide, result card, confetti, accent colour, `prefers-reduced-motion`                                                                                                           | Browser `/c/<slug>` on desktop and 375px; turn on "reduce motion" in macOS → no confetti                                     |
| 9   | ✅     | `feature/lead-form`                     | Lead API + form, consent not pre-checked, store consent text + time, privacy page, rate limit                                                                                                                 | Send a lead; without consent → error; second time → 409                                                                      |
| 10  | ✅     | `feature/admin-dashboard`               | Stats + leads API, dashboard page                                                                                                                                                                             | Do 2–3 quizzes, check the numbers and leads on the dashboard                                                                 |
| 11  | ✅     | `feature/polish`                        | Contrast / a11y check, empty states, loading states, README update                                                                                                                                            | Full flow end to end, mobile check                                                                                           |
| 12  | ✅     | `feature/design-refresh`                | Added after the MVP: IBM Plex Mono for all headings, `lucide-react` icons on all pages, logo (word mark with icon), small UI improvements                                                                     | Open every page (admin, quiz, privacy, 404). Headings are IBM Plex Mono, icons are visible, nothing breaks at 375px          |
| 13  | ✅     | `feature/landing-page`                  | Added after the MVP: a real home page with hero, benefits, animated how-to (create a campaign and questions), sample questions to try, privacy section, footer                                                | Open `/`: check each section, try the sample questions, use Pause/Play and the step buttons, check 375px and "Reduce motion" |
| —   | ⬜     | release PR                              | PR `development` → `main` (after your OK)                                                                                                                                                                     | —                                                                                                                            |
