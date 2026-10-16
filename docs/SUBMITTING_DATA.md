# Submitting a new assessment (for country data focal points)

## 1. Export from ODK
Export the submission from the ODK server as **CSV**. Check that it has at least these columns: `Country`, `DataPeriod`, `QuestionKey`, `NationalYN`. Optional columns are `AdminLevel`, `AdminLevelName`, `Comments` and `Source`.
If you're filling the data in by hand, start from `data/templates/<hazard>_submission_template.csv`. The `_SN` and `_Question` columns are there for reference only.

## 2. Name the file
`<period>_<country>.csv`, for example `2026-Q4_kenya.csv`. Use a separate file per country and per round.

## 3. Upload it through GitHub (no installation needed)
1. Open the repository → `data/submissions/cholera/` (or `fvd/`).
2. Click **Add file › Upload files** and drop in your CSV.
3. Select **Create a new branch for this commit and start a pull request**, then **Propose changes**.
4. A check runs automatically and posts a **validation report** on the pull request:
   - ✔ green: the data is valid, and a reviewer can merge it.
   - ✖ red: open the report, fix the rows it lists, and upload the corrected file to the same branch.
5. Once the pull request is merged, the dashboard updates itself within a few minutes.

## Common errors
| Message | Fix |
|---|---|
| `unknown country "X"` | Use the official country name. If a new spelling is needed, the technical lead adds it to `data/config/countries.json`. |
| `unknown QuestionKey` | The column must hold the ODK question *name*, not the label. Compare with the template. |
| `DataPeriod … must be YYYY or YYYY-Q1..Q4` | Use, for example, `2026-Q4`. |
| `NationalYN … must be yes/no` | Answer with yes or no only. |
