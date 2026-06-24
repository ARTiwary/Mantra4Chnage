# PBL Program Intelligence & Grant Reporting Assistant

A program review and grant-reporting platform built for Mantra4Change's PBL (Project-Based Learning) implementation data. It turns three months of school-level survey responses and three grant-reporting CSVs into filterable dashboards, deterministic risk classification, AI-assisted (and AI-optional) narrative generation, and a recommended-actions list for monthly review meetings.

Built as a take-home assignment response. All data is synthetic.

---

## Table of contents

- [Quick start](#quick-start)
- [Architecture overview](#architecture-overview)
- [Data model](#data-model)
- [Risk & gap engine](#risk--gap-engine)
- [AI workflow](#ai-workflow)
- [Feature map vs. assignment spec](#feature-map-vs-assignment-spec)
- [Project structure](#project-structure)
- [Testing](#testing)
- [Assumptions](#assumptions)
- [Limitations](#limitations)
- [Production readiness notes](#production-readiness-notes)
- [Future improvements](#future-improvements)

---

## Quick start

**Requirements:** Node.js **≥ 22.5.0** (the backend uses Node's built-in `node:sqlite` module — see [Architecture overview](#architecture-overview) for why).

```bash
# 1. Install all dependencies (root, server, client)
npm run install:all

# 2. Seed the database from the CSVs in /data
npm run seed

# 3. Run both server (port 4000) and client (port 5173) together
npm run dev
```

Then open **http://localhost:5173**.

The app works fully with no further configuration — every dashboard metric, risk classification, and grant fact panel works out of the box. AI narrative generation is optional; see [AI workflow](#ai-workflow) to enable it.

### Running server and client separately

```bash
npm run dev:server   # Express API on :4000
npm run dev:client   # Vite dev server on :5173, proxies /api and /images to :4000
```

### Running tests

```bash
npm test    # runs the server's vitest suite (33 tests across 4 service files)
```

### Enabling AI narrative generation (optional)

1. Get a free API key from [console.groq.com/keys](https://console.groq.com/keys).
2. In `server/.env`, set `GROQ_API_KEY=your-key-here`.
3. Restart the server.

With no key set, every narrative-generating feature (Grant Reporting Assistant, Monthly Review Summary, Program Reporting Assistant) automatically falls back to a deterministic, fact-only summary instead of failing. The UI clearly labels which mode produced the text shown.

---

## Architecture overview

```
┌─────────────────┐      ┌──────────────────────────────────────┐      ┌─────────────┐
│   React client   │◄────►│            Express API                │◄────►│   SQLite    │
│  (Vite, plain JS) │  /api │  routes → services → repositories     │  SQL │ (pbl.sqlite)│
└─────────────────┘      └──────────────────────────────────────┘      └─────────────┘
                                          │
                                          ▼
                                 ┌──────────────────┐
                                 │   Groq (LLM)      │  optional, narrative only
                                 │  llama-3.1-8b-     │  never touches risk/metrics
                                 │  instant            │
                                 └──────────────────┘
```

**Stack:** React (Vite, plain JavaScript — no TypeScript), Node.js + Express, SQLite, Groq for optional LLM narrative generation.

**Why SQLite over PostgreSQL.** The full dataset is ~7,000 rows total — trivially small. SQLite needs no running server, no connection string, no Docker — `npm install && npm run seed` and the database exists as a single file. The assignment explicitly allows "SQLite... or static seed data with a clear production plan," and the production plan is straightforward: every SQL query lives in `server/src/repositories/`, written as plain parameterized SQL with no SQLite-specific syntax. Migrating to PostgreSQL means swapping the connection module in `server/db/connection.js` for a `pg` Pool and changing `?` placeholders to `$1, $2...` — nothing else in the codebase touches the database driver directly.

**Why `node:sqlite` over `better-sqlite3`.** `better-sqlite3` is a native module requiring platform-specific compiled binaries. In review/CI environments without reliable access to prebuilt binary hosts, installation can fail outright. Node's built-in `node:sqlite` (stable enough for this read-heavy workload, available from Node 22.5+) needs zero native compilation — it works identically on any machine with a modern Node install. Trade-off: it's officially "experimental" in Node's documentation, and the option to swap to `better-sqlite3` for higher-throughput production use is a one-file change (`server/db/connection.js`).

**Layering, backend.** Each request flows `route → service → repository`:
- **Routes** (`src/routes/`) — thin HTTP handlers. Parse params, call one or two services, shape the JSON response. No business logic.
- **Services** (`src/services/`) — all business logic, fully decoupled from Express and SQL. Each is independently unit-testable with plain JS objects in, plain JS objects out.
- **Repositories** (`src/repositories/`) — the only files that touch SQL. Raw parameterized queries, no ORM.

This separation is what makes the deterministic risk/insight logic testable without spinning up a server or a database (see [Testing](#testing)), and is also what the assignment's "preferred runtime flow" maps onto directly:

```
deterministic calculations  →  structured insights  →  generated narrative
   (aggregation.service)        (insight.service)         (groq.service)
```

`groq.service.js` is the **only** file in the entire backend that imports the Groq SDK or makes a network call to an LLM. Every other service, route, and the entire dashboard/risk/grant-facts pipeline has zero dependency on AI being available.

**Layering, frontend.** `pages/` compose `components/`, which are grouped by feature area (`dashboard/`, `grants/`, `filters/`, `shared/`). `api/client.js` is the single file that knows any HTTP endpoint path — components never call `axios` or `fetch` directly. The Vite dev server proxies `/api` and `/images` to the backend (`vite.config.js`), so the same relative-path client code works unchanged whether the client is served by Vite in dev or built and served behind the same origin as the API in production.

---

## Data model

### Primary PBL data (`school_responses` table)

One row per school, per reporting month (July/August/September 2025) — 2,300 schools × 3 months = 6,900 rows, seeded from the three monthly CSVs in `data/primary/`. Columns mirror the source survey fields: school identity (name, synthetic code, district, block), whether PBL was conducted, whether evidence was submitted, which classes/subjects were covered, per-class-per-subject enrollment and attendance, and the CSV's own derived totals (total enrollment, total attendance, attendance rate, risk status).

The application **recomputes** completion rate, evidence rate, attendance rate, and risk status from the raw per-class fields at query time (in `aggregation.service.js` and `risk.service.js`) rather than trusting the CSV's own derived columns wholesale — this is what lets the same logic apply consistently at the district, block, grade, and program level, not just per-school.

**Important data-shape finding, verified against all 6,900 source rows:** attendance is tracked per enrolled student across *both* a Science session and a Math session for every class, regardless of which subject a teacher is labeled as teaching (the raw survey data populates both attendance columns inconsistently relative to the "subject taught" label). This means `total_attendance` can legitimately exceed `total_enrollment` — a student attending both sessions counts twice. The correct attendance rate denominator is therefore `enrollment × 2`, not `enrollment`. This was verified to reproduce the source CSV's own "Derived: Overall PBL attendance rate" column exactly, with zero mismatches across the full dataset, and is documented inline in `aggregation.service.js`.

### Grant reporting data (3 tables)

- **`grant_finances`** — one row per grant, per reporting month, per budget line (45 rows: 3 grants × 3 months × 5 budget lines). Approved budget, monthly/cumulative utilization.
- **`grant_performance`** — one row per grant, per reporting month (9 rows). Pre-aggregated performance metrics: sampled schools, completion rate, evidence rate, attendance rate, risk status, milestone summary.
- **`evidence_media_index`** — one row per media/evidence asset (9 rows), linking a grant + month to an image or news-clipping file under `data/grants/images/`.

**Design choice:** grant-level figures in `grant_performance` are treated as **authoritative** for the Grant Reporting Assistant — they are not recomputed from `school_responses`. The two datasets use different geography-naming schemes in places (`covered_districts` in the grant data is a free-text field that overlaps with, but isn't a guaranteed 1:1 join key to, `district_name` in the primary data), so grant facts are reported as given, and the primary dataset is used only for the separate, district/block-scoped Program Reporting Assistant — not blended into grant numbers.

### Why a normalized class/subject table was *not* used

Each school response has a small, fixed set of class/subject combinations (3 classes × 2 subjects = 6 attendance columns). A separate `class_attendance` child table would add joins without adding real flexibility at this data volume. If the program expands to more grades or subjects, that's the natural refactor point — noted in [Future improvements](#future-improvements).

---

## Risk & gap engine

Entirely deterministic — **no AI is involved in risk classification at any level** (school, block, district, or program). Lives in `server/src/services/risk.service.js`, fully unit tested (`server/tests/risk.service.test.js`, 9 tests covering every threshold boundary).

| Status | Condition |
|---|---|
| **On Track** | PBL conducted **and** attendance rate ≥ 75% |
| **Behind** | PBL conducted **and** attendance rate 60% – <75% |
| **At Risk** | PBL conducted **and** attendance rate 35% – <60% |
| **Critical** | PBL **not** conducted, **or** attendance rate < 35% |

These thresholds match the assignment's suggested values exactly. A school that didn't conduct PBL is always Critical, regardless of any other field — there's no attendance to measure, so it can't be classified any other way.

**Aggregation-level risk** (district, block) is calculated by first summing that geography's total enrollment and total attendance across all its schools, then applying the same thresholds to the *aggregate* attendance rate — not by taking a majority vote of individual school statuses. This matches how a program reviewer actually reads "this district is At Risk": as a property of the district's combined numbers.

`insight.service.js` builds on top of this to produce the structured, human-readable layer: achievements, risks, ranked priority districts/blocks (sorted ascending by attendance rate, excluding On Track), and discussion points — all still 100% deterministic, all unit tested (`insight.service.test.js`, 7 tests). `action.service.js` generates the Tier 3 recommended-actions list from the same priority data (`action.service.test.js`, 7 tests).

---

## AI workflow

```
Deterministic calculations  →  Structured insights  →  Generated narrative
 (aggregation.service.js)      (insight.service.js)      (groq.service.js)
        no AI                       no AI                  Groq, optional
```

Three features generate narrative text on top of structured, pre-computed facts:

1. **Grant Reporting Assistant** — narrative for a selected grant + month, grounded in `grant_performance` + `grant_finances` facts.
2. **Monthly Review Summary** (Tier 2) — narrative for a selected month + filter scope, grounded in the full `InsightService` output (achievements, risks, priority geographies).
3. **Program Reporting Assistant** (Tier 2) — narrative for a single clicked district/block, grounded in that geography's own metrics and month-over-month movement.

All three follow the same pattern, implemented once in `GroqService._callWithFallback()`:

- If `GROQ_API_KEY` is not set, skip the network call entirely and return a deterministic, fully-readable text summary built from the same fact object that would have been sent to the LLM.
- If the key is set, call Groq (`llama-3.1-8b-instant`) with a prompt that explicitly lists every fact as structured data and instructs the model not to invent names, numbers, or events not present in that data.
- If the Groq call throws (network error, rate limit, invalid key), catch it and fall back to the same deterministic summary, with a note explaining why.

Every API response for these three endpoints includes `{ narrative, source, usedAi }` — `source` is either `'groq'` or `'deterministic'` — so the frontend can honestly label which mode produced the text rather than presenting AI output and rule-based output identically. The Grant Reporting page also shows a banner if `GROQ_API_KEY` is unset, so it's never ambiguous why a narrative looks the way it does.

**Validation approach:** prompts pass only pre-computed, already-correct numbers (percentages, counts, names taken directly from the database) — the model is never asked to calculate anything, only to phrase already-correct facts in readable prose. This bounds the failure mode to "awkward phrasing" rather than "wrong numbers."

---

## Feature map vs. assignment spec

| Spec item | Implementation |
|---|---|
| **Tier 1 — Filters** | Month, district, block, grade, subject — `FilterBar.jsx` → `/api/dashboard/filters` |
| **Tier 1 — Monthly dashboard** | KPI cards (schools, completion, evidence, attendance) with month-over-month movement on 3 metrics — `KpiCards.jsx` → `/api/dashboard/summary` |
| **Tier 1 — District/block performance** | Sortable tables, risk-colored row indicator, click-through drilldown — `GeographyTable.jsx` → `/api/dashboard/breakdown/{district,block}` |
| **Tier 1 — Risk & gap engine** | Code-based thresholds, see [Risk & gap engine](#risk--gap-engine) |
| **Tier 1 — Grant Reporting Assistant** | Grant + month selector, fact panel, linked evidence/media gallery, narrative generation — `GrantReporting.jsx` |
| **Tier 2 — Monthly Review Summary** | Achievements, risks, priority districts/blocks, discussion points, optional AI narrative — `ReviewSummaryPanel.jsx` → `/api/review/summary` |
| **Tier 2 — Program Reporting Assistant** | Click any district/block row → scoped report with its own narrative — `GeographyDrilldown.jsx` → `/api/geography/:type/:name/summary` |
| **Tier 2 — Report Export** | Copy-to-clipboard and download-as-.txt on every generated narrative — `ExportButton.jsx` |
| **Tier 3 — Recommended actions** | 3–5 actions per filter scope, each with owner, priority, due date, status, linked metric/geography — `RecommendedActions.jsx` → `/api/review/actions` |
| **AI disabled fallback** | Every narrative endpoint verified working end-to-end with `GROQ_API_KEY` unset |

---

## Project structure

```
├── server/
│   ├── db/
│   │   ├── schema.sql          # table definitions
│   │   └── connection.js       # node:sqlite singleton, applies schema on startup
│   ├── scripts/seed.js         # idempotent CSV → SQLite importer
│   ├── src/
│   │   ├── app.js              # Express app, middleware, route mounting
│   │   ├── server.js           # entry point
│   │   ├── routes/             # dashboard, grants, review, geography
│   │   ├── services/           # risk, aggregation, insight, action, groq
│   │   └── repositories/       # schoolResponse, grant — all raw SQL lives here
│   └── tests/                  # vitest, 33 tests across 4 service files
├── client/
│   └── src/
│       ├── api/client.js       # the only file that knows HTTP paths
│       ├── components/         # dashboard/, grants/, filters/, shared/
│       └── pages/               # ReviewDashboard, GrantReporting, ReviewSummaryPanel, RecommendedActions
└── data/
    ├── primary/                # 3 monthly CSVs
    └── grants/                 # 3 grant CSVs + images/
```

---

## Testing

```bash
npm test
```

33 tests across 4 files, all testing pure service-layer logic with no database or HTTP server involved:

- `risk.service.test.js` (9) — every threshold boundary, including floating-point edge cases at exactly 75%/60%/35%.
- `aggregation.service.test.js` (10) — completion/evidence/attendance rate math, grouping, month-over-month deltas, top/bottom ranking.
- `insight.service.test.js` (7) — achievement/risk text generation, priority ranking, discussion points always non-empty.
- `action.service.test.js` (7) — action cap at 5, required fields present, priority assignment, due-date logic.

No backend route or database integration tests are included — see [Limitations](#limitations).

---

## Assumptions

Documented here per the assignment's instruction to "document assumptions and move forward when the data is intentionally ambiguous":

1. **Evidence submission rate** is computed as `schools with evidence submitted ÷ all schools in scope`, not `÷ schools that conducted PBL`. The assignment lists it as an independent headline KPI alongside participation/completion, which reads as scoped to all schools, not conditional on conduct. (Verified: no row has `evidence_submitted = Yes` while `conducted_pbl = No`, so this only affects the denominator, not which rows count.)
2. **Attendance rate denominator is `enrollment × 2`**, not `enrollment` — see [Data model](#data-model) for the full verification against source data.
3. **Aggregate risk status is recalculated from the geography's combined attendance rate**, not a majority vote or average of individual school statuses.
4. **Grant performance figures are authoritative as given** in `grant_performance`/`grant_finances` and are not cross-validated against or blended with the primary `school_responses` dataset, since the two use different (overlapping but not identical) district-naming conventions.
5. **"Block" filtering** uses the raw `block_details` string (e.g. `"District A - Block 001"`) as a single dimension, since the source data doesn't provide a separate normalized block code independent of district.
6. **Recommended actions are generated fresh per request**, not persisted or stateful (no "mark as done" workflow) — see [Limitations](#limitations).

---

## Limitations

- **No authentication or access control.** Anyone who can reach the server can read all data and trigger AI narrative generation. Fine for a take-home demo; not fine for production with real grant/donor data.
- **No persistence for Recommended Actions.** They're recomputed from current data on every request, not stored, so there's no way to mark one as in-progress/done, reassign it, or track history across visits. See [Future improvements](#future-improvements).
- **Groq calls are unauthenticated client-side requests proxied through the server**, but there's no rate limiting on the narrative endpoints — a user could trigger repeated LLM calls. Acceptable at demo scale; would need throttling in production.
- **No automated route/integration tests** — only service-layer unit tests. The route and repository layers were verified manually against a running server during development (every endpoint hit with `curl`, responses inspected), but there's no regression suite covering the HTTP layer.
- **SQLite is single-writer.** Fine for this read-heavy workload with an offline seed step; would not scale to concurrent multi-instance writes without migrating to PostgreSQL (see [Architecture overview](#architecture-overview) for the migration path).
- **`node:sqlite` is still labeled experimental** by Node.js, though stable for the read patterns this app uses.
- **Grant-to-primary-data district matching is not automated.** Since `covered_districts` in grant data and `district_name` in primary data aren't guaranteed to match 1:1, no feature currently cross-references "how is this grant's district performing in the primary dataset right now" — the two stay deliberately separate.

---

## Production readiness notes

- **Scalability:** the aggregation/insight/risk pipeline runs entirely in application memory over rows fetched per-request. At current scale (6,900 rows) this is fast; at materially larger scale, move the aggregation into SQL (`GROUP BY` + computed columns) rather than JS array iteration, or add a materialized summary table refreshed on import.
- **Reliability:** the AI-disabled fallback path is the main reliability feature already in place — the app's core value (dashboards, risk classification, grant facts) has zero dependency on an external API being up.
- **Security:** before any real deployment, add authentication, input validation on filter query params (currently passed close to raw into parameterized SQL — safe from injection, but not validated against an allowlist of known districts/months), and rate limiting on the two narrative-generation POST endpoints.
- **Observability:** currently only `console.log`/`console.error`. Production would need structured logging and a request ID per call to trace a narrative generation failure back through the Groq call.

## Future improvements

- Persist Recommended Actions to a table with status-update endpoints (mark done, reassign, add notes), instead of regenerating them stateless on every request.
- Normalize per-class/per-subject attendance into a child table if the program expands beyond the current fixed 3-class × 2-subject shape.
- Add a join/reconciliation step between grant `covered_districts` and primary-data `district_name` so a grant's narrative can optionally cite live primary-dataset performance for its districts, with discrepancies flagged rather than silently blended.
- PDF export for the Grant Reporting and Monthly Review Summary sections (currently .txt copy/download only).
- Route/integration test suite (e.g. supertest against the Express app) to complement the existing service-layer unit tests.
- Swap `node:sqlite` for PostgreSQL if/when multi-instance concurrent writes are needed.