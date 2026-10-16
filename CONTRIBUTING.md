# Contributing

## Workflow
1. Create a branch, for example `feature/mpox-hazard` or `fix/map-labels`.
2. Make your changes in `src/`.
3. Test locally (see README › Run locally).
4. Open a Pull Request describing what changed and why. Add screenshots for visual changes.
5. At least one reviewer approves before merging to `main`.

## Where things live
- **Layout and text:** `src/dashboard.dc.html`, the markup at the top of the file. All styles are inline.
- **Behaviour and calculations:** `src/dashboard.dc.html`, the `class Component` script at the bottom. `renderVals()` computes everything the page shows.
- **Map:** `src/africa-map.js`
- **PowerPoint slides:** `src/pptx-summary.js`
- **Data:** edit `data/`, never `src/data/pdx-data.js`, which is generated. See [docs/DATA_SCHEMA.md](docs/DATA_SCHEMA.md).
- **Colours and type:** use the `var(--color-*)` and `var(--font-*)` tokens from `src/ds/styles.css`. Don't hard-code new colours.

## Scoring rules (keep consistent)
- Pillar score = % of that pillar's criteria answered "Yes".
- Overall score = weighted share of all scored criteria met.
- Capacity bands: Adequate ≥80% · Moderate 50–79% · Limited <50%.

## Data changes
- New submissions: follow [docs/SUBMITTING_DATA.md](docs/SUBMITTING_DATA.md).
- Questionnaire, pillars, countries or a new hazard: see [docs/DATA_SCHEMA.md](docs/DATA_SCHEMA.md).
- Before pushing, run `node scripts/build-data.js --check` locally. The pull request check runs it too.

## Do not commit
- API keys or credentials
- Raw ODK exports containing personal data
- Large binary files (xlsx, docx). Convert data to `pdx-data.js` instead.

## Offline snapshot
`dist/dashboard-offline.html` is a single-file snapshot for sharing offline. It is rebuilt manually and may lag behind. The live dashboard (`src/dashboard.dc.html`) is always current.
