# Data schema and pipeline

```
ODK form ──export──▶ CSV ──PR──▶ data/submissions/<hazard>/*.csv
                                         │
          data/questions/<hazard>.csv ───┤   GitHub Action
          data/config/*.json ────────────┤   scripts/build-data.js
          data/curated/<hazard>.json ────┘   (validate → score)
                                         ▼
                              src/data/pdx-data.js ──▶ dashboard
```

## Folder layout
| Path | What it holds | Who edits |
|---|---|---|
| `data/submissions/<hazard>/*.csv` | ODK submissions, one row per answer | Data focal points, via pull request |
| `data/questions/<hazard>.csv` | Question bank: keys, numbering, pillar, weight, EN/FR/PT text | Technical lead, when the questionnaire changes |
| `data/config/hazards.json` | Hazards and their pillars (order, codes, labels) | Technical lead |
| `data/config/countries.json` | Countries, ISO codes, accepted ODK name spellings | Technical lead |
| `data/curated/<hazard>.json` | Action library, country report actions, tracker and evidence seeds | Programme team |
| `data/templates/*_submission_template.csv` | Blank form with every QuestionKey | Reference |
| `data/build/validation-report.md` | Latest validation output | Generated |
| `src/data/pdx-data.js` | Dashboard data model | **Generated; never edit by hand** |
| `schema/*.json` | Formal schemas for the files above | Technical lead |

## Submission CSV (`schema/submission.schema.json`)
One row per question, per country, per period.

| Column | Required | Rules |
|---|---|---|
| `Country` | ✔ | Must match a name or alias in `countries.json` (case and accents ignored) |
| `AdminLevel` | | `National` (default). Subnational rows are skipped for now. |
| `AdminLevelName` | | Free text |
| `DataPeriod` | ✔ | `YYYY` or `YYYY-Qn`, e.g. `2026-Q4` |
| `QuestionKey` | ✔ | Must exist in `data/questions/<hazard>.csv` |
| `NationalYN` | ✔ | `yes`/`no` (also `1`/`0`, `oui`/`non`, `sim`/`não`). A blank answer is scored as not met and flagged as a warning. |
| `Comments` | | Free text |
| `Source` | | e.g. `ODK Server` |

The full ODK workbook export, with columns such as `QuestionID` and `Category`, is also accepted: extra columns are ignored. If the export repeats each answer in several languages, keep only one language (filter `Language = English`), or the answers will be duplicated.

**Duplicates and corrections:** files are applied in alphabetical order, so a later file overrides an earlier answer for the same country, period and question. To correct a submission, add a file named like `2026-Q4_kenya_correction.csv`.

## Scoring (scripts/build-core.js)
- **Pillar score:** % of the pillar's scored questions (`AffectsScore = 1`) answered yes.
- **Overall score:** Σ(Weight × yes) ÷ Σ(Weight) across all scored questions.
- **Bands:** Adequate ≥80% · Moderate 50–79% · Limited <50%.
- **Comparison:** each country is compared with its own previous period.

## Validation
Errors block the build (the dashboard keeps the last good data):
- a required column is missing
- unknown country, unknown QuestionKey, a malformed DataPeriod, or an invalid answer

Warnings are reported but don't block:
- blank answers
- a submission missing some questions
- subnational rows

## Changing the questionnaire
1. Add or edit rows in `data/questions/<hazard>.csv`. Keep the existing `QuestionKey` values so past rounds stay comparable.
2. If you add a pillar, add it to `hazards.json` → `pillars`.
3. Open a pull request. The Action re-scores every round.

## Adding a hazard (e.g. mpox)
1. Add `"mpox": { id, name, source, pillars: [...] }` to `hazards.json`.
2. Add `data/questions/mpox.csv`.
3. Put submissions in `data/submissions/mpox/`.
4. Optionally add `data/curated/mpox.json`.

The dashboard's hazard switcher picks the new hazard up automatically.
