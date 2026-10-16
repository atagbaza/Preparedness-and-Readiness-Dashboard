# Preparedness and Readiness Dashboard

WHO African Region · PDX. A multi-hazard preparedness and readiness dashboard. Cholera and filovirus disease are live; mpox and floods are planned.

**Live:** https://atagbaza.github.io/Preparedness-and-Readiness-Dashboard/ (after GitHub Pages is enabled)

## How data flows
```
Member State ODK submission ──CSV──▶ pull request to data/submissions/<hazard>/
      ▶ GitHub Action validates (report posted on the PR)
      ▶ merge ▶ Action rebuilds src/data/pdx-data.js ▶ dashboard updates
```
- **Submitting data:** [docs/SUBMITTING_DATA.md](docs/SUBMITTING_DATA.md)
- **Schema, scoring and validation rules:** [docs/DATA_SCHEMA.md](docs/DATA_SCHEMA.md)
- **Formal schemas:** [`schema/`](schema/)

## Repository layout
```
index.html                     Redirects to the live dashboard
src/
  dashboard.dc.html            Dashboard: layout + logic
  support.js                   Runtime for the .dc.html format (do not edit)
  africa-map.js                Interactive map (d3 + topojson)
  pptx-summary.js              PowerPoint generator (pptxgenjs)
  data/pdx-data.js             GENERATED dashboard data. Never edit by hand.
  data/world-topo.js           Country boundaries
  ds/styles.css                Design-system stylesheet
data/
  submissions/<hazard>/*.csv   ODK submissions (one row per answer)
  questions/<hazard>.csv       Question bank (keys, numbering, pillar, weight, EN/FR/PT)
  config/hazards.json          Hazards and pillars
  config/countries.json        Countries, ISO codes, ODK name aliases
  curated/<hazard>.json        Action library, report actions, tracker/evidence seeds
  templates/                   Blank submission templates
  build/validation-report.md   Latest validation output (generated)
schema/                        submission, question-bank and data-model schemas
scripts/
  build-core.js                Validation + scoring engine (no dependencies)
  build-data.js                CLI: node scripts/build-data.js [--check]
.github/workflows/             Automated validate/build
dist/dashboard-offline.html    Single-file snapshot for offline sharing (rebuilt manually)
docs/                          Guides
```

## Run locally
```
node scripts/build-data.js      # rebuild data after editing data/
python -m http.server 8000      # from the repo root
```
Then open http://localhost:8000/src/dashboard.dc.html

## Enable GitHub Pages
Go to **Settings › Pages** → **Deploy from a branch** → `main` / `(root)`.
The workflow also needs write access: **Settings › Actions › General › Workflow permissions** → **Read and write**.

## Features
- Regional overview with an interactive map, a country × pillar matrix and the most common gaps
- Country profile with history and a side-by-side comparison of any two assessments
- Pillar analysis at question level
- Anticipatory actions with optional AI drafts, which must be reviewed before adoption
- Action tracker with CSV export
- Evidence repository
- Summary and detailed country reports (PDF), plus PowerPoint decks
- Role-based views: the regional team, or a country focal point with peers anonymised

## Data
| Hazard | Coverage |
|---|---|
| Cholera | 2023–2025 · 41 countries · 12 pillars · 62 scored criteria |
| Filovirus | 2023-Q1 – 2025-Q4 · 18 countries · 11 pillars · 135 criteria |

Tracker and evidence statuses are **illustrative**. User edits are saved in each browser only.

## AI suggestions
Paste an Anthropic API key in the Anticipatory actions tab. It is stored in that browser only. **Never commit keys.** For production, route AI calls through a WHO-managed server.

## Known limitations (prototype)
- No back-end: the tracker, evidence and uploads stay in the browser.
- Roles are simulated, with no real authentication.
- Only national-level data is scored; subnational rows are skipped.
- Cholera overall scores use the weighted share of criteria met, which differs from the source workbook's summary sheet. This needs confirmation.
