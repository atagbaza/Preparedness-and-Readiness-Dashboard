/* PDX data build core: turns ODK CSV submissions into the dashboard data model.
   Pure functions, no dependencies. Used by scripts/build-data.js (Node) and testable in a browser. */
(function (root) {
  'use strict';

  function parseCsv(text) {
    text = String(text).replace(/^\uFEFF/, '');
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    const nonEmpty = rows.filter(r => r.some(c => c.trim() !== ''));
    if (!nonEmpty.length) return { header: [], records: [] };
    const header = nonEmpty[0].map(h => h.trim());
    const records = nonEmpty.slice(1).map((r, i) => { const o = { _line: i + 2 }; header.forEach((h, j) => { o[h] = (r[j] ?? '').trim(); }); return o; });
    return { header, records };
  }

  const YES = new Set(['yes', 'y', '1', 'true', 'oui', 'sim']);
  const NO = new Set(['no', 'n', '0', 'false', 'non', 'nao', 'não']);
  const PERIOD = /^\d{4}(-Q[1-4])?$/;
  const REQUIRED = ['Country', 'DataPeriod', 'QuestionKey', 'NationalYN'];
  const snKey = sn => { const m = String(sn).match(/(\d+)([a-z]?)\.(\d+)/); return m ? [+m[1], m[2], +m[3]] : [999, '', 999]; };
  const sortSn = (a, b) => { const x = snKey(a[0]), y = snKey(b[0]); return (x[0] - y[0]) || x[1].localeCompare(y[1]) || (x[2] - y[2]); };
  const norm = s => String(s || '').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Z]/g, '');

  /**
   * @param {object} cfg       hazards.json entry for this hazard
   * @param {Array}  countries countries.json
   * @param {Array}  qRows     parsed records of data/questions/<hazard>.csv
   * @param {Array}  files     [{name, records, header}] parsed submission CSVs (applied in order; later rows win)
   * @param {object} curated   data/curated/<hazard>.json
   * @returns {{hazard:object, errors:string[], warnings:string[], stats:object}}
   */
  function buildHazard(cfg, countries, qRows, files, curated) {
    const errors = [], warnings = [];
    const pIdx = {}; cfg.pillars.forEach((p, i) => { pIdx[p.code] = i + 1; });
    const pillars = cfg.pillars.map((p, i) => ({ n: i + 1, num: p.num, id: p.code, short: p.short, name: p.name }));

    const bank = {}, questions = {};
    qRows.forEach(q => {
      if (!q.QuestionKey) return;
      if (bank[q.QuestionKey]) { errors.push(`questions: duplicate QuestionKey "${q.QuestionKey}"`); return; }
      const scored = q.AffectsScore === '1';
      const p = pIdx[q.CategoryCode];
      if (scored && !p) errors.push(`questions: "${q.QuestionKey}" has CategoryCode "${q.CategoryCode}" not listed in hazards.json pillars`);
      bank[q.QuestionKey] = { sn: q.SN, p, scored: scored && !!p, w: parseFloat(q.Weight) || 0, text: q.Text_en };
      if (scored && p) (questions[p] = questions[p] || []).push([q.SN, q.Text_en, +(parseFloat(q.Weight) || 0).toFixed(6)]);
    });
    Object.values(questions).forEach(l => l.sort(sortSn));

    const alias = {};
    countries.forEach(c => { alias[norm(c.name)] = c; alias[norm(c.id)] = c; (c.aliases || []).forEach(a => { alias[norm(a)] = c; }); });

    const answers = {}; let rowsRead = 0, rowsUsed = 0;
    files.forEach(f => {
      const miss = REQUIRED.filter(h => !f.header.includes(h));
      if (miss.length) { errors.push(`${f.name}: missing required column(s) ${miss.join(', ')}`); return; }
      f.records.forEach(r => {
        rowsRead++;
        const at = `${f.name}:${r._line}`;
        const c = alias[norm(r.Country)];
        if (!c) { errors.push(`${at}: unknown country "${r.Country}" (add it to data/config/countries.json aliases)`); return; }
        if (!PERIOD.test(r.DataPeriod)) { errors.push(`${at}: DataPeriod "${r.DataPeriod}" must be YYYY or YYYY-Q1..Q4`); return; }
        const lvl = (r.AdminLevel || 'National').trim();
        if (lvl.toLowerCase() !== 'national') { warnings.push(`${at}: AdminLevel "${lvl}" skipped (subnational not yet supported)`); return; }
        const q = bank[r.QuestionKey];
        if (!q) { errors.push(`${at}: unknown QuestionKey "${r.QuestionKey}"`); return; }
        if (!q.scored) return;
        const v = String(r.NationalYN || '').trim().toLowerCase();
        let yes;
        if (v === '') { yes = 0; warnings.push(`${at}: blank NationalYN for ${q.sn}, scored as not met`); }
        else if (YES.has(v)) yes = 1;
        else if (NO.has(v)) yes = 0;
        else { errors.push(`${at}: NationalYN "${r.NationalYN}" must be yes/no`); return; }
        const key = c.id + '|' + r.DataPeriod;
        (answers[key] = answers[key] || { c, period: r.DataPeriod, ans: {} }).ans[r.QuestionKey] = yes;
        rowsUsed++;
      });
    });

    const byC = {}; const periods = new Set();
    Object.values(answers).forEach(({ c, period, ans }) => {
      periods.add(period);
      const C = byC[c.id] = byC[c.id] || { id: c.id, name: c.name, iso: c.iso_numeric || null, code: c.iso3, a: {} };
      const bySn = {}; let w = 0, ws = 0;
      Object.entries(ans).forEach(([k, yes]) => { const q = bank[k]; bySn[q.sn] = yes; w += q.w; ws += yes * q.w; });
      const sc = pillars.map(P => { const v = (questions[P.n] || []).map(q => bySn[q[0]]).filter(x => x != null); return v.length ? Math.round(100 * v.reduce((a, b) => a + b, 0) / v.length) : null; });
      const expected = Object.values(bank).filter(q => q.scored).length, got = Object.keys(ans).length;
      if (got < expected) warnings.push(`${c.name} ${period}: ${expected - got} of ${expected} scored questions missing; their pillars are scored on answered questions only`);
      C.a[period] = { ans: bySn, sc, ov: w ? Math.round(100 * ws / w) : null };
    });

    const hazard = {
      id: cfg.id, name: cfg.name, source: cfg.source, pillars, questions,
      rounds: [...periods].sort(), countries: Object.values(byC).sort((a, b) => a.name.localeCompare(b.name)),
      lib: (curated && curated.lib) || {}, reportActs: (curated && curated.reportActs) || {}, reportYear: cfg.reportYear || null,
      evidence: (curated && curated.evidence) || [], tracker: (curated && curated.tracker) || []
    };
    return { hazard, errors, warnings, stats: { files: files.length, rowsRead, rowsUsed, countries: hazard.countries.length, assessments: Object.keys(answers).length, rounds: hazard.rounds } };
  }

  const api = { parseCsv, buildHazard };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.PDX_BUILD = api;
})(typeof window !== 'undefined' ? window : globalThis);
