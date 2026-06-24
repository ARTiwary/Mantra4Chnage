<div align="center">

# 📚 PBL Program Intelligence & Grant Reporting Assistant

**Mantra4Change** · Turning school-level survey data into review-ready decisions and grant-ready reports

[![Live Demo](https://img.shields.io/badge/demo-live-2f6b4f?style=flat-square)](https://mantra4-chnage.vercel.app/)
[![API Health](https://img.shields.io/badge/api-healthy-2f6b4f?style=flat-square)](https://mantra4chnage.onrender.com/api/health)
[![Tests](https://img.shields.io/badge/tests-33%20passing-2f6b4f?style=flat-square)](#-testing)
[![Node](https://img.shields.io/badge/node-%E2%89%A522.22.0-c25e2e?style=flat-square)](#-quick-start)
[![Stack](https://img.shields.io/badge/stack-React%20%C2%B7%20Express%20%C2%B7%20SQLite-1c2b24?style=flat-square)](#-architecture)

**[🚀 Live App](https://mantra4-chnage.vercel.app/)** &nbsp;·&nbsp; **[🩺 API Health](https://mantra4chnage.onrender.com/api/health)** &nbsp;·&nbsp; **[📖 Jump to setup](#-quick-start)**

</div>

All data — grant labels, school codes, districts, finance figures, evidence images — is synthetic. Built as a take-home assignment response.

---

### What this does

Ingests three months of school survey data + three grant-reporting CSVs, then gives a program team:

| | |
|---|---|
| 📊 **A filterable review dashboard** | Month/district/block/grade/subject filters, KPIs with month-over-month movement, sortable district & block tables |
| 🚦 **A deterministic risk engine** | Code-based thresholds — no AI — classify any school, block, or district as On Track / Behind / At Risk / Critical |
| 📝 **A Monthly Review Summary** | Achievements, risks, priority geographies, and discussion points generated from the numbers, with optional AI narrative on top |
| 🔍 **Click-through geography reports** | Click any district/block row for its own scoped report and narrative |
| 💰 **A Grant Reporting Assistant** | Select a grant + month → fact panel, linked evidence/media gallery, report-ready narrative |
| ✅ **Recommended next actions** | Auto-generated, each with an owner, priority, due date, and linked metric |
| 📤 **Report export** | Copy or download any generated narrative as plain text |

Every one of the above works **fully with AI disabled** — narrative generation is the only thing that touches an LLM, and it degrades gracefully to a deterministic fact summary if no API key is set.

---

## 🚀 Quick start

> **Just want to look at it?** → **[mantra4-chnage.vercel.app](https://mantra4-chnage.vercel.app/)**
> The backend free-tier sleeps when idle — first load after inactivity can take 30–60s to wake up. Refresh if it looks empty.

**To run locally:**

```bash
npm run install:all   # installs root + server + client deps
npm run seed           # builds SQLite from the CSVs in /data
npm run dev             # server on :4000, client on :5173, together
```

Open **http://localhost:5173** — works immediately, no `.env` needed.

<details>
<summary><strong>Other useful commands</strong></summary>

```bash
npm run dev:server   # Express API only, :4000
npm run dev:client   # Vite dev server only, :5173 (proxies /api → :4000)
npm test               # 33 backend unit tests across 4 service files
```

</details>

<details>
<summary>⚠️ <strong>Node version requirement — read this if setup fails</strong></summary>

Requires **Node ≥ 22.22.0**. The backend uses Node's built-in `node:sqlite` module instead of `better-sqlite3`, to avoid native-binary compilation entirely (see [Architecture](#-architecture)).

`node:sqlite` shipped in `22.5.0` — but that *exact* patch version requires an `--experimental-sqlite` CLI flag to work, due to a known issue in that release. It works flag-free from roughly `22.22.0` onward, which is what this project targets and pins via `server/.node-version` and `engines.node`. If you hit `ERR_UNKNOWN_BUILTIN_MODULE: node:sqlite`, this is why — upgrade Node rather than add the flag.

</details>

### 🤖 Enabling AI narrative generation (optional)

1. Get a free key at [console.groq.com/keys](https://console.groq.com/keys)
2. Set `GROQ_API_KEY=your-key` in `server/.env`
3. Restart the server

No key? Every narrative feature automatically falls back to a deterministic, fact-only summary — the UI always labels which mode produced the text you're reading.

---

## ☁️ Deployment

| | Service | Root dir | Build | Env vars |
|---|---|---|---|---|
| 🖥️ Backend | [Render](https://render.com) (Web Service) | `server` | `npm install && npm run seed` → `npm start` | `GROQ_API_KEY` (optional), `NODE_VERSION=22.22.0` |
| 🌐 Frontend | [Vercel](https://vercel.com) (Static / Vite) | `client` | `npm run build` → `dist` | `VITE_API_BASE_URL=<render-url>` |

<details>
<summary><strong>Why the frontend needs an API base URL in production</strong></summary>

Locally, Vite's dev server proxies relative `/api` calls to `localhost:4000` (`vite.config.js`), so `client/src/api/client.js` can use relative paths. In production, frontend and backend live on different domains with no proxy — so `client.js` reads `VITE_API_BASE_URL` at build time and prefixes every request with it. Unset, it falls back to relative paths, so local dev is unaffected. Same pattern for evidence images in `EvidenceGallery.jsx`.

</details>

<details>
<summary><strong>Why re-seeding SQLite on every deploy is fine</strong></summary>

Render's free-tier filesystem is ephemeral — anything written at runtime may not survive a restart. Since nothing in this app ever writes to the database after seeding (seed-once, read-many), every fresh deploy just re-runs the seed script against the committed CSVs, producing an identical clean database. This would only be a problem if the app supported persistent user edits, which it doesn't.

</details>

---

## 🏗 Architecture

```
┌──────────────┐         ┌────────────────────────────────┐         ┌──────────┐
│ React client  │ ◄─────► │           Express API            │ ◄─────► │  SQLite   │
│ (Vite, JS)     │  /api   │  routes → services → repositories │  SQL    │(pbl.sqlite)│
└──────────────┘         └────────────────────────────────┘         └──────────┘
                                          │
                                          ▼
                                 ┌──────────────────┐
                                 │ Groq (LLM)         │  optional — narrative
                                 │ llama-3.1-8b-instant│  text only, never touches
                                 └──────────────────┘  risk/metric calculations
```

**Stack:** React (Vite, plain JavaScript — no TypeScript) · Node.js + Express · SQLite · Groq (optional)

**Backend layering**, every request: `route → service → repository`
- **Routes** — thin HTTP handlers, no business logic
- **Services** — all business logic, zero dependency on Express or SQL, fully unit-testable
- **Repositories** — the only files that touch SQL, raw parameterized queries

This maps directly onto the assignment's preferred flow:

```
deterministic calculations  →  structured insights  →  generated narrative
   aggregation.service.js        insight.service.js       groq.service.js
```

`groq.service.js` is the **only** file in the backend that imports the Groq SDK. Everything else — dashboard, risk engine, grant facts — has zero AI dependency.

<details>
<summary><strong>Why SQLite over PostgreSQL, and node:sqlite over better-sqlite3</strong></summary>

**SQLite:** the full dataset is ~7,000 rows — trivially small. No server, no connection string, no Docker. The assignment explicitly allows "SQLite... or static seed data with a clear production plan" — every query lives in `server/src/repositories/` as plain parameterized SQL, so migrating to PostgreSQL later is a one-file swap (`server/db/connection.js`) plus changing `?` placeholders to `$1, $2...`.

**`node:sqlite` over `better-sqlite3`:** `better-sqlite3` needs native compiled binaries, which can fail in CI/review environments without reliable binary-host access. `node:sqlite` is built into Node — zero native compilation, works identically everywhere a modern Node runs. Trade-off: officially "experimental" in Node's docs; swapping to `better-sqlite3` later is a one-file change.

</details>

---

## 🗂 Data model

| Table | Rows | Source |
|---|---|---|
| `school_responses` | 6,900 (2,300 schools × 3 months) | `data/primary/*.csv` |
| `grant_finances` | 45 (3 grants × 3 months × 5 budget lines) | `data/grants/01_*.csv` |
| `grant_performance` | 9 (3 grants × 3 months) | `data/grants/02_*.csv` |
| `evidence_media_index` | 9 | `data/grants/03_*.csv` |

The app **recomputes** completion/evidence/attendance rates and risk status from raw fields at query time, rather than trusting the CSV's own derived columns — this is what lets identical logic apply at school, block, district, and program level consistently.

<details>
<summary>📐 <strong>Key data-shape finding: the attendance rate formula</strong></summary>

Attendance is tracked per enrolled student across **both** a Science session and a Math session for every class, regardless of which subject a teacher is labeled as teaching — the raw data populates both attendance columns inconsistently relative to the "subject taught" label. This means `total_attendance` can legitimately *exceed* `total_enrollment` (a student attending both sessions counts twice).

**Correct formula:** `attendance_rate = total_attendance / (total_enrollment × 2)`

Verified to reproduce the source CSV's own "Derived: Overall PBL attendance rate" column exactly, with **zero mismatches across all 6,900 rows**. Documented inline in `aggregation.service.js`.

</details>

<details>
<summary><strong>Why grant data and primary data stay separate</strong></summary>

Grant data's `covered_districts` field overlaps with but isn't a guaranteed 1:1 join key to primary data's `district_name`. Grant-level figures in `grant_performance` are treated as authoritative for the Grant Reporting Assistant and are not recomputed or blended with `school_responses` — see [Future improvements](#-future-improvements) for the reconciliation idea.

</details>

---

## 🚦 Risk & gap engine

100% deterministic — **no AI in risk classification, at any level.** Lives in `risk.service.js`, fully unit tested.

| Status | Condition |
|---|---|
| 🟢 **On Track** | Conducted **and** attendance ≥ 75% |
| 🟡 **Behind** | Conducted **and** attendance 60–<75% |
| 🟠 **At Risk** | Conducted **and** attendance 35–<60% |
| 🔴 **Critical** | Not conducted, **or** attendance < 35% |

Aggregate (district/block) risk is calculated from that geography's **combined** attendance rate, not a vote of individual school statuses — matching how a reviewer actually reads "this district is At Risk."

`insight.service.js` builds achievements, risks, ranked priority geographies, and discussion points on top — still 100% deterministic. `action.service.js` turns the same priority data into the Tier 3 recommended-actions list.

---

## 🤖 AI workflow

```
Deterministic calculations  →  Structured insights  →  Generated narrative
        no AI                       no AI               Groq, optional
```

Three features generate narrative on top of pre-computed facts (Grant Reporting Assistant, Monthly Review Summary, Program Reporting Assistant) — all three share one pattern in `GroqService._callWithFallback()`:

1. No API key → skip the network call, return a deterministic text summary built from the same facts.
2. Key set → call `llama-3.1-8b-instant` with every fact listed as structured data, explicitly instructed not to invent anything.
3. Call fails → catch it, fall back to the deterministic summary with a note.

Every response includes `{ narrative, source, usedAi }` so the UI always honestly labels AI vs. deterministic output. Prompts only ever pass already-correct numbers for rephrasing — the model never calculates anything, which bounds failure to "awkward phrasing," not "wrong numbers."

---

## ✅ Feature map vs. assignment spec

| Spec item | Implementation |
|---|---|
| Tier 1 — Filters | `FilterBar.jsx` → `/api/dashboard/filters` |
| Tier 1 — Monthly dashboard | `KpiCards.jsx` → `/api/dashboard/summary` (MoM movement on 3 metrics) |
| Tier 1 — District/block performance | `GeographyTable.jsx` → `/api/dashboard/breakdown/{district,block}` |
| Tier 1 — Risk & gap engine | See [🚦 Risk & gap engine](#-risk--gap-engine) |
| Tier 1 — Grant Reporting Assistant | `GrantReporting.jsx` — fact panel + evidence gallery + narrative |
| Tier 2 — Monthly Review Summary | `ReviewSummaryPanel.jsx` → `/api/review/summary` |
| Tier 2 — Program Reporting Assistant | `GeographyDrilldown.jsx` → `/api/geography/:type/:name/summary` |
| Tier 2 — Report Export | `ExportButton.jsx` — copy / download .txt |
| Tier 3 — Recommended actions | `RecommendedActions.jsx` → `/api/review/actions` |
| AI-disabled fallback | Verified end-to-end with `GROQ_API_KEY` unset |

---

## 📁 Project structure

```
├── server/
│   ├── db/                    schema.sql, node:sqlite connection
│   ├── scripts/seed.js        idempotent CSV → SQLite importer
│   ├── src/
│   │   ├── routes/             dashboard · grants · review · geography
│   │   ├── services/           risk · aggregation · insight · action · groq
│   │   └── repositories/       all raw SQL lives here, nowhere else
│   └── tests/                 33 vitest tests, 4 files
├── client/src/
│   ├── api/client.js          the only file that knows HTTP paths
│   ├── components/             dashboard/ · grants/ · filters/ · shared/
│   └── pages/                  ReviewDashboard · GrantReporting · ReviewSummaryPanel · RecommendedActions
└── data/
    ├── primary/                3 monthly CSVs
    └── grants/                 3 grant CSVs + images/
```

---

## 🧪 Testing

```bash
npm test
```

**33 tests, 4 files** — pure service-layer logic, no database or HTTP server needed:

| File | Tests | Covers |
|---|---|---|
| `risk.service.test.js` | 9 | Every threshold boundary, incl. floating-point edges at 75/60/35% |
| `aggregation.service.test.js` | 10 | Rate math, grouping, MoM deltas, top/bottom ranking |
| `insight.service.test.js` | 7 | Achievement/risk text, priority ranking, non-empty discussion points |
| `action.service.test.js` | 7 | Action cap at 5, required fields, priority assignment, due dates |

No automated route/integration tests — see [Limitations](#-limitations).

---

## 📌 Assumptions

> Documented per the assignment's instruction to "document assumptions... when the data is intentionally ambiguous."

1. **Evidence rate** = evidence-submitted ÷ *all* schools, not ÷ schools-that-conducted — it's listed as an independent headline KPI. (No row has evidence=Yes with conduct=No, so this only changes the denominator.)
2. **Attendance rate denominator is `enrollment × 2`** — see [data model](#-data-model) finding above.
3. **Aggregate risk = recalculated from combined attendance rate**, not a vote across schools.
4. **Grant figures are authoritative as given**, not cross-validated against primary data (different district-naming conventions).
5. **Block filtering** uses the raw `block_details` string as one dimension — no separate normalized block code exists in the source data.
6. **Recommended actions are stateless** — regenerated per request, not persisted.

---

## ⚠️ Limitations

- No authentication — anyone reaching the server can read all data and trigger AI calls.
- Recommended Actions aren't persisted — no mark-done/reassign/history workflow.
- No rate limiting on the two narrative-generation endpoints.
- No automated route/integration tests (route layer was manually verified via `curl` during development).
- SQLite is single-writer — fine for this read-heavy, seed-once workload; would need PostgreSQL for concurrent multi-instance writes.
- `node:sqlite` is still labeled experimental by Node.js.
- Grant-to-primary-data district matching isn't automated (see assumption 4).

## 🔭 Future improvements

- Persist Recommended Actions with status-update endpoints.
- Normalize per-class/per-subject attendance into a child table if grades/subjects expand beyond the current fixed shape.
- Reconcile grant `covered_districts` with primary `district_name` so grant narratives can optionally cite live primary-data performance, with mismatches flagged rather than blended.
- PDF export alongside the current .txt copy/download.
- Route/integration test suite (e.g. supertest) on top of the existing service-layer unit tests.
- Swap `node:sqlite` for PostgreSQL if concurrent multi-instance writes are ever needed.

---

<div align="center">

Built for the Mantra4Change Lead Full-Stack Product Developer assessment · All data synthetic

</div>