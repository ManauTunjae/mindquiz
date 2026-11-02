# CLAUDE.md — MindQuiz

> Read this file before every task. Follow it strictly.
> If something here is unclear or conflicts with my request, ask me first.

---

## 1. Who I am and how we work

- I am a junior developer and I am learning Claude Code.
- **You write all the code. I review, test and approve.**
- English is not my first language. Explain in **short, simple sentences**.
- Before each step, tell me **what** you will do and **why** (1–3 sentences).
- After each step, tell me **how I can test it** (browser URL, Postman request or command).

### Working mode

1. **Plan first.** For every new feature, start with a short plan:
   files you will create/change, functions, and how to test. **Wait for my "OK".**
2. Build **one small function at a time**.
3. Run lint/type-check/tests. Fix errors before you commit.
4. **Commit after every working function** (see Git rules).
5. Stop at the end of each feature and give me a short summary.

---

## 2. Project overview

**MindQuiz** is a fictional practice SaaS app (test project) for non-profit organisations.
Demo customer: a fictional mental-health non-profit ("MiND-inspired" colours only).

- **Admin** creates campaigns: title, accent colour, 3–5 quiz questions. Can edit and delete.
- **Visitor** opens a public link (`/c/[slug]`), answers one question at a time, sees the result.
- At the end the visitor can leave **name + e-mail + GDPR consent** (lead form).
- **Admin dashboard**: number of participants, answers per question, list of leads.

Rules for content:

- Do NOT use the real names, logos or brand styling (e.g. "MiND") of Adoveo or MiND anywhere in the code or UI.
- Quiz questions are **general knowledge / awareness** questions.
  Never ask visitors about their own health. We do not store health data.

---

## 3. Tech stack

| Part             | Choice                                                             |
| ---------------- | ------------------------------------------------------------------ |
| Monorepo         | one git repo, root folder `mindquiz`                               |
| Backend          | TypeScript + Hono, Node, port **8000** (`/backend`)                |
| Database         | PostgreSQL 17 in **Docker Compose**, port **5433**                 |
| ORM / migrations | **Drizzle ORM** + `drizzle-kit`                                    |
| Validation       | **Zod** (same rules on backend and in forms)                       |
| Frontend         | Next.js (App Router) + Tailwind CSS 4, port **3000** (`/frontend`) |
| Fonts            | `next/font`: Inter (body) + IBM Plex Mono (headings)               |
| Icons            | `lucide-react` (decorative, `aria-hidden`)                         |
| Animations       | CSS transitions + Framer Motion (`motion`), `canvas-confetti`      |
| Tests            | Vitest (backend logic)                                             |
| Root scripts     | `concurrently` → `npm run dev` starts backend + frontend           |

Do not add other big libraries without asking me first.

---

## 4. Folder structure

```
mindquiz/
├── CLAUDE.md
├── README.md
├── docker-compose.yml        # PostgreSQL
├── package.json              # root scripts (concurrently)
├── docs/
│   └── PLAN.md               # plan, data model, feature list (keep updated)
├── backend/
│   ├── src/
│   │   ├── index.ts          # Hono app, port 8000
│   │   ├── db/               # drizzle client, schema.ts, seed.ts
│   │   ├── routes/           # admin/*, public/*
│   │   ├── services/         # business logic (no HTTP here)
│   │   ├── middleware/       # auth, error handler, rate limit
│   │   └── validation/       # zod schemas
│   ├── drizzle/              # generated migrations (commit these)
│   └── .env.example
└── frontend/
    ├── src/app/
    │   ├── (public)/c/[slug]/   # visitor quiz
    │   └── admin/               # login, campaigns, dashboard
    ├── src/components/
    ├── src/lib/                 # api client, types
    └── .env.example
```

---

## 5. Commands

```bash
docker compose up -d          # start PostgreSQL
npm run dev                   # backend :8000 + frontend :3000
npm run db:generate           # create migration from schema.ts
npm run db:migrate            # run migrations
npm run db:seed               # demo admin + demo campaign
npm run db:studio             # look at the data in the browser
npm run lint && npm run typecheck && npm test
```

Keep these scripts working. Update this list if a script changes.

---

## 6. Data model (PostgreSQL)

- `admins` — id, email (unique), password_hash, created_at
- `sessions` — id (hash of random token), admin_id → admins (cascade), expires_at, created_at
- `campaigns` — id (uuid), slug (unique), title, description, accent_color, status (`draft` | `published`), created_at, updated_at
- `questions` — id, campaign_id → campaigns (on delete cascade), text, position
- `answer_options` — id, question_id → questions (cascade), text, is_correct, position
- `submissions` — id, campaign_id → campaigns (cascade), score, total, completed_at
- `submission_answers` — id, submission_id → submissions (cascade), question_id, option_id
- `leads` — id, submission_id (unique), campaign_id, name, email, consent (must be true), consent_text, consent_at, created_at

Rules:

- Always change the schema through **Drizzle migrations**. Never edit the database by hand.
- A campaign has **3–5 questions**. Each question has **2–4 options** and exactly **1 correct** option.

---

## 7. API rules

- Admin routes: `/api/admin/*` → **must be protected** by auth middleware.
- Public routes: `/api/public/*` → never return `is_correct` before the visitor has answered.
- Validate every request body with Zod. Return clear JSON errors:
  `{ "error": "message" }` with the right status code (400, 401, 404, 409, 500).
- Business logic lives in `services/`, not in route handlers.
- Score is calculated on the **backend**, never trusted from the frontend.

---

## 8. Security and GDPR

- Admin login: e-mail + password, password hashed (argon2 or bcrypt), session in an **httpOnly, secure, sameSite cookie**.
- Never commit `.env`. Only commit `.env.example` with fake values.
- CORS: allow only `http://localhost:3000`.
- Rate-limit the public submit and lead endpoints.
- Lead form: consent checkbox is **not pre-checked**. Store the consent text and time.
- Show a short privacy text: what we store, why, and how to ask for deletion.

---

## 9. Design

Style: minimal, modern, calm and premium. Mobile first.

**Colours (warm orange, soft and calm):**

| Token          | Hex       | Use                               |
| -------------- | --------- | --------------------------------- |
| `primary`      | `#FF7A00` | buttons, progress bar, highlights |
| `primary-soft` | `#FFE3CC` | soft backgrounds, selected answer |
| `ivory`        | `#F7F4EF` | page background                   |
| `surface`      | `#FFFFFF` | cards                             |
| `charcoal`     | `#1E1E1E` | text                              |
| `mist`         | `#D9D6D0` | borders, disabled                 |

- Each campaign's `accent_color` can override `primary` on the public pages.
- Check contrast (WCAG AA). White text on orange only on large/bold text.
- Soft UI: rounded corners (16–24px), soft shadows, a lot of white space.
- Big buttons (min 48px high), clear text, **one question at a time**.

**Animations:**

- Soft fade/slide between questions.
- Progress bar that fills up with each question.
- After the last answer: confetti in palette colours + result card "pops" in (soft scale).
- Respect `prefers-reduced-motion`: no confetti and no big movement.

Admin pages: simpler and clean, but same colours and fonts.

---

## 10. Git workflow (VERY IMPORTANT)

Branches: `main` ← `development` ← `feature/<short-name>`

- **Never commit or push directly to `main` or `development`.**
- One feature = one branch = one pull request.

For every feature:

```bash
git checkout development
git pull origin development
git checkout -b feature/<short-name>
# build one function → test → commit
git add <files>
git commit -m "feat: <what>"
git push -u origin feature/<short-name>    # first push
git push                                    # next pushes
gh pr create --base development --title "<title>" --body "<what + how to test>"
```

- **Wait for my "merge" before you merge.** Then:

```bash
gh pr merge --squash --delete-branch
git checkout development
git pull origin development
git fetch --prune
git branch -a
```

- When the MVP is done: PR from `development` → `main`. Wait for my OK.

**Commits:** Conventional Commits, English, short.
`feat:` `fix:` `refactor:` `test:` `docs:` `chore:` `style:`
Example: `feat: add createCampaign service`

**PR description:** what changed, how to test (steps), screenshots if UI.

---

## 11. Never do this without asking me first

- `git push --force`, `git reset --hard`, deleting branches that are not merged
- Deleting files, folders or database data
- `docker compose down -v` (deletes the database volume)
- Committing `.env` or any secret
- Installing big new libraries or changing the tech stack
- Merging any pull request

---

## 12. Definition of done (every feature)

- [ ] Works in the browser / Postman
- [ ] Lint, typecheck and tests pass
- [ ] Mobile view checked (375px wide)
- [ ] Commits pushed, PR created with test steps
- [ ] `docs/PLAN.md` updated (feature marked done)
