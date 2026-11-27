# LingoPilot — AI Localization Quality & Operations Platform (product demo)

> **Ship better translations. Scale with confidence.**

LingoPilot is a quality-first localization operations platform for small and mid-sized localization agencies and LSPs. This repository contains an interactive, customer-ready **frontend demo**: every screen is functional, uses a coherent seeded dataset and persists changes in the browser. No backend, API key or paid service is required.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

Sign in with the pre-filled demo credentials (any password works) — the workspace is **Northstar Localization**, user **Alex Morgan, Localization Operations Manager**.

| Script | What it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | Type-check and build to `dist/` (static, relative paths, hash routing — deployable to any static host) |
| `npm run preview` | Serve the production build |
| `npm run typecheck` | TypeScript check only |
| `npm test` | Unit tests (Vitest) — seed consistency, QA engine, scoring |
| `npm run test:e2e` | Playwright smoke tests (desktop + mobile) |

## What's in the demo

| Area | Route | Highlights |
| --- | --- | --- |
| Overview | `/dashboard` | 6 KPIs with period comparison and sparklines, quality trend vs. target, issue mix, pinned projects, risk ranking, activity feed, 7/30/90-day and custom ranges |
| Projects | `/projects` | Status tabs, 5 filters, search, sortable/paginated table (cards on mobile), create-project form with validation, file import |
| String Keys | `/keys` | Resource keys per project (namespaced, e.g. `checkout.title`) with one value per target language: add key + initial values, inline edit in the grid, key drawer with per-language editors and TM suggestions, max-length limits (checked by QA), rename/delete, filters (missing / complete / with issues / namespace), import JSON/CSV/XLIFF by key, export flat or nested JSON per language and CSV |
| Project detail | `/projects/:id` | Header + actions (Run AI QA, export CSV/XLSX/JSON/PDF, assign reviewer, edit, pin, status, delete), 7 tabs: overview (gauge, timeline, language status, team), segments workbench, QA history, issues, reviewers, files, activity |
| AI Quality | `/quality` | Scan configuration (12 rules, 3 sensitivities, options), staged progress, QA report, findings list with filters + detail panel, accept / edit / resolve / ignore (with reason) / assign, segment review with inline editing, TM matches and glossary checks |
| Issues | `/issues` | KPIs, severity/status/category/project/language filters, sorting, bulk resolve & assign, detail drawer with history |
| Linguists & Reviewers | `/team` | Team table, profile drawer with balanced performance metrics, invite member |
| Terminology | `/terminology` | Glossary CRUD, approve, forbidden variants, CSV import, CSV/XLSX/JSON export; approved terms are enforced in QA |
| Translation Memory | `/memory` | TM CRUD, filters, live fuzzy-match lookup (exact / 95% / 85% / no match) |
| Analytics | `/analytics` | 6 KPIs and 7 charts that respond to date, client, project, language and team-member filters |
| Clients | `/clients`, `/clients/:id` | Client list, detail with quality history, editable client quality profile (min score, terminology, style, locale, critical and automatic QA rules) |
| Integrations | `/integrations` | 14 integrations by category, simulated connect flow, disconnect, waitlist |
| Settings | `/settings` | Workspace (logo upload), QA defaults (severity weights, rules, sensitivity, auto-assign, auto-resolve off by default), users & roles with permission matrix, billing (Growth plan, usage, plan change), notifications, **reset demo data** |

Also: sign-in page, ⌘K global search, notification center, light/dark/system theme, **“View as role”** (Admin, PM, Reviewer, Translator, Viewer — disables actions outside the role), and a **Demo guide** panel that walks through the 8-step, 5–7 minute sales demo and ticks steps off automatically.

### Recommended demo script

1. **Overview** — operational picture (24 active projects, 94.2% avg quality, 18 critical issues).
2. Open **Nova E-commerce** (EN→FR, due in 4 days, 88.2 vs. 95% target, high risk).
3. **Run AI QA** → watch the 7 stages → report: **87.4 / 100 · Needs Review · 120 segments · 23 issues (2 critical, 8 major, 10 minor, 3 info)**.
4. **Review findings** → open the subscription-renewal mistranslation (source, target, explanation, correction, confidence).
5. **Accept suggestion** → issue resolved, score 87.4 → 89.4, counters update everywhere.
6. **Analytics** → trend, issues by category, time saved, reviewer performance.
7. **Terminology** → client-approved terms enforced in QA.
8. Close on the value proposition.

## Simulated functionality (honest labelling)

- **AI QA is a deterministic simulation** (labelled “AI QA simulation” in the UI). The demo engine (`src/services/qa/demoQAEngine.ts`) combines:
  - **Real rule-based checks** on any text, including imported files: empty targets, placeholders (`{x}`, `{{x}}`, `%s`, `%d`, HTML tags, URLs), number mismatches, glossary/forbidden terms, sentence-final punctuation, whitespace, repeated words, negation loss, length anomalies.
  - **Predefined semantic findings** for the seeded dataset that stand in for LLM output.
  The same input always produces the same result. No external AI is called.
- Quality score, risk, time-saved and cost figures are **demo product rules/estimates**, not industry standards.
- Integrations, SSO, invitations, billing and plan changes are **simulated**; no accounts, emails or payments are involved.
- File import parses **CSV, TXT, JSON and XLIFF** in the browser; nothing is uploaded.
- Historical metrics (trends, previous-period comparisons) come from a deterministic seeded series; current values are computed live from the workspace data.

## Architecture

```
src/
  app/            App + hash router (lazy-loaded pages)
  components/
    ui/           Design-system primitives (Radix-based dialog, drawer, select, tabs, tooltip…)
    common/       PageHeader, KPIStatCard, badges, tables, ActivityFeed, ConfirmDialog, ExportMenu…
    charts/       QualityTrendChart, IssuesDonutChart, QualityGauge
    layout/       AppShell, Sidebar, Topbar, CommandPalette, NotificationsMenu, DemoGuide
    projects/ quality/ issues/ team/
  pages/          One file per route
  data/           Seed dataset (clients, team, projects, corpus, issues, glossary, TM…) + metric series
  services/
    qa/           QAProvider interface, rule checks, deterministic demo engine
    scanService   Applies scan output to workspace data (pure, unit-tested)
    tmService     Fuzzy TM matching
    importService / exportService / storageService
  store/          Zustand store with localStorage persistence (safe fallback to memory)
  hooks/ utils/ types/
```

- **Stack:** React 19, TypeScript, Vite, Tailwind CSS v4, Radix primitives (shadcn-style components), Lucide, Recharts, TanStack Table, Zustand.
- **Single source of truth:** all pages derive numbers from the central store; project quality = `100 − residual − Σ(severity weight × open issues) × batch factor`, so resolving, ignoring or accepting a fix updates scores, risk and counters everywhere.
- **Swapping in a real AI provider:** implement `QAProvider` (`src/services/qa/types.ts`) — e.g. an HTTP client to a backend that calls OpenAI/Anthropic — and set `activeQAProvider`. The UI, store and report pipeline stay unchanged.

## Suggested next phase

- Backend: NestJS + PostgreSQL (projects, segments, issues, audit trail), Redis queue for scan jobs, S3-compatible storage for files.
- Real AI QA service behind the `QAProvider` contract with prompt/rubric versioning, evaluation sets and human-in-the-loop feedback.
- Auth (Clerk/Auth0) and server-enforced roles; Stripe billing; first CAT/TMS connectors (Phrase, memoQ) via webhooks.
- MQM-aligned scoring profiles per client and LQA sampling workflows.

## Limitations

- Data lives in the browser (localStorage); clearing site data or using “Reset demo data” restores the seed.
- Large imports are capped at 2,000 segments; XLIFF support covers `trans-unit`/`segment` source/target text.
- Charts show seeded history; only current-period values reflect live edits.
