(function () {
  const C = { bg: 'F2F2F3', ink: '1D1F20', mute: '5D5D60', rule: 'C9C9CD', acc: '5980A6', acc7: '416180', deep: '2C455D', acc3: 'A9BDD1', acc1: 'E2E9F0', red: '9A3526', redF: 'B3432F' };
  const BAND = {
    A: { l: 'Adequate', f: '62AE83', t: 'E0F0E5', i: '2F6545' },
    M: { l: 'Moderate', f: 'E3B658', t: 'F6ECD6', i: '7A5A1E' },
    L: { l: 'Limited', f: 'D0654F', t: 'F6E0DB', i: '9A3526' },
    N: { l: 'Not assessed', f: 'D4D4D7', t: 'E7E7EA', i: '5D5D60' }
  };
  const band = s => s == null ? BAND.N : s >= 80 ? BAND.A : s >= 50 ? BAND.M : BAND.L;
  const H = 'Barlow Condensed', F = 'Barlow';
  const pct = s => s == null ? '—' : s + '%';
  const horizon = t => /water sector|elimination plan|lobby|position of|toilets|latrines available|standards|infrastructure|long-term|legislat/i.test(t) ? 'long'
    : /preposition|procure|distribute|print|install|provide|designate|disseminate|update.*list|keep a regularly|stock/i.test(t) ? 'now' : 'mid';
  const clip = (t, n) => t.length > n ? t.slice(0, n - 1).trim() + '…' : t;

  function frame(pres, p, o) {
    const s = pres.addSlide();
    s.background = { color: o.dark ? C.deep : C.bg };
    if (!o.dark) {
      s.addText(o.kicker.toUpperCase(), { x: 0.6, y: 0.4, w: 9, h: 0.35, fontFace: F, fontSize: 12, color: o.kc || C.acc7, charSpacing: 2 });
      s.addText(o.title, { x: 0.6, y: 0.72, w: 12.1, h: 0.8, fontFace: H, fontSize: 34, bold: true, color: C.ink, fit: 'shrink' });
      s.addText(`${p.scopeName} · ${p.roundLabel}`, { x: 0.6, y: 7.02, w: 8, h: 0.3, fontFace: F, fontSize: 10, color: C.mute });
      s.addText('Preparedness and Readiness Dashboard · WHO African Region', { x: 6.7, y: 7.02, w: 6, h: 0.3, fontFace: F, fontSize: 10, color: C.mute, align: 'right' });
    }
    if (p.isDemo) s.addText('DUMMY TEST DATA · NOT FOR CIRCULATION', { x: 8.2, y: 0.38, w: 4.53, h: 0.36, fontFace: H, fontSize: 12, bold: true, color: 'FFFFFF', fill: { color: C.redF }, align: 'center', charSpacing: 1 });
    return s;
  }
  function card(s, x, y, w, h) {
    s.addShape('rect', { x, y, w, h, fill: { type: 'none' }, line: { color: C.rule, width: 0.75 } });
    [[x, y], [x + w, y], [x, y + h], [x + w, y + h]].forEach(([cx, cy]) => {
      s.addShape('line', { x: cx - 0.08, y: cy, w: 0.16, h: 0, line: { color: C.acc, width: 0.75 } });
      s.addShape('line', { x: cx, y: cy - 0.08, w: 0, h: 0.16, line: { color: C.acc, width: 0.75 } });
    });
  }
  function stat(s, x, y, w, label, value, sub, color) {
    card(s, x, y, w, 1.75);
    s.addText(label, { x: x + 0.2, y: y + 0.15, w: w - 0.4, h: 0.35, fontFace: F, fontSize: 13, color: C.mute });
    s.addText(value, { x: x + 0.2, y: y + 0.5, w: w - 0.4, h: 0.8, fontFace: H, fontSize: 44, bold: true, color: color || C.ink });
    if (sub) s.addText(sub, { x: x + 0.2, y: y + 1.3, w: w - 0.4, h: 0.32, fontFace: F, fontSize: 11, color: C.mute });
  }
  function bars(s, rows, x, y, w, h) {
    const rh = Math.min(0.5, h / rows.length), lw = 2.2, vw = 0.8, bw = w - lw - vw - 0.2;
    rows.forEach((r, i) => {
      const yy = y + i * rh, b = band(r.v);
      s.addText(r.label, { x, y: yy, w: lw, h: rh, fontFace: F, fontSize: 13, color: C.ink, valign: 'middle', fit: 'shrink' });
      s.addShape('rect', { x: x + lw, y: yy + rh * 0.22, w: bw, h: rh * 0.56, fill: { color: 'E4E4E7' }, line: { type: 'none' } });
      if (r.v) s.addShape('rect', { x: x + lw, y: yy + rh * 0.22, w: bw * r.v / 100, h: rh * 0.56, fill: { color: b.f }, line: { type: 'none' } });
      s.addText(pct(r.v), { x: x + lw + bw + 0.1, y: yy, w: vw, h: rh, fontFace: H, fontSize: 16, bold: true, color: C.ink, align: 'right', valign: 'middle' });
    });
  }
  function list(s, items, x, y, w, h, o = {}) {
    const runs = items.map(it => ({ text: (it.tag ? it.tag + '  ' : '') + it.text, options: { bullet: o.bullet ? { indent: 14 } : false, breakLine: true, paraSpaceAfter: 6 } }));
    if (!runs.length) runs.push({ text: o.empty || '—', options: {} });
    s.addText(runs, { x, y, w, h, fontFace: F, fontSize: o.size || 13, color: C.ink, valign: 'top', fit: 'shrink' });
  }

  async function build(p) {
    if (!window.PptxGenJS) throw new Error('PowerPoint library not loaded');
    const pres = new PptxGenJS();
    pres.layout = 'LAYOUT_WIDE';
    pres.title = `${p.scopeName} – ${p.hazardName || 'Cholera'} preparedness and readiness summary`;
    const isReg = p.scope === 'region';

    // Cover
    let s = frame(pres, p, { dark: true });
    s.addText('WHO AFRICAN REGION · PDX', { x: 0.8, y: 0.6, w: 8, h: 0.4, fontFace: F, fontSize: 14, color: C.acc3, charSpacing: 3 });
    s.addText(isReg ? (p.hazardName || 'Cholera') + ' preparedness\nand readiness' : p.scopeName, { x: 0.8, y: 2.0, w: 11.5, h: 2.4, fontFace: H, fontSize: 66, bold: true, color: 'F2F2F3', valign: 'bottom' });
    s.addText(isReg ? 'Regional summary: capacities, gaps, anticipatory actions and progress' : (p.hazardName || 'Cholera') + ' preparedness and readiness: capacities, gaps, anticipatory actions and progress', { x: 0.8, y: 4.5, w: 11, h: 0.9, fontFace: F, fontSize: 20, color: 'D5DEE8' });
    s.addText(`${p.roundLabel} · generated ${p.date}`, { x: 0.8, y: 6.6, w: 8, h: 0.4, fontFace: F, fontSize: 13, color: C.acc3 });
    s.addNotes('Auto-generated from the Preparedness and Readiness Dashboard.');

    // Overview
    const kpiVal = isReg ? p.regionAvg : p.me.ov;
    const counts = { A: 0, M: 0, L: 0 };
    (isReg ? p.countries.map(c => c.ov) : p.me.sc).forEach(v => { const b = band(v); if (b === BAND.A) counts.A++; else if (b === BAND.M) counts.M++; else if (b === BAND.L) counts.L++; });
    s = frame(pres, p, { kicker: '01 · Overview', title: isReg ? 'Readiness across reporting Member States' : `${p.scopeName}: readiness by pillar` });
    stat(s, 0.6, 1.75, 3.3, isReg ? 'Regional average' : 'Overall readiness', pct(kpiVal), band(kpiVal).l + (p.delta != null ? `  ·  ${p.delta > 0 ? '+' : ''}${p.delta} pts vs ${p.prevLabel || 'previous'}` : ''));
    [['A', 'Adequate ≥80%'], ['M', 'Moderate 50–79%'], ['L', 'Limited <50%']].forEach(([k, l], i) => {
      s.addShape('rect', { x: 0.6, y: 3.85 + i * 0.5, w: 0.25, h: 0.25, fill: { color: BAND[k].f }, line: { type: 'none' } });
      s.addText(`${counts[k]}  ${l}`, { x: 1.0, y: 3.78 + i * 0.5, w: 3, h: 0.4, fontFace: F, fontSize: 14, color: C.ink });
    });
    s.addText(isReg ? 'countries by overall capacity' : 'pillars by capacity', { x: 0.6, y: 5.35, w: 3.3, h: 0.3, fontFace: F, fontSize: 11, color: C.mute });
    bars(s, isReg ? p.countries.slice().sort((a, b) => b.ov - a.ov).map(c => ({ label: c.name, v: c.ov })) : p.pillars.map((n, i) => ({ label: n, v: p.me.sc[i] })), 4.5, 1.75, 8.25, 5.1);
    s.addNotes(isReg ? `Regional average ${pct(p.regionAvg)}.` : `${p.scopeName} overall ${pct(p.me.ov)} (${band(p.me.ov).l}).`);

    // Comparison (country)
    if (p.cmp) {
      const K = p.cmp, d = K.toOv - K.fromOv, dc = d > 0 ? '2F6545' : d < 0 ? C.red : C.mute;
      s = frame(pres, p, { kicker: '02 · Change between assessments', title: `${p.scopeName}: readiness pillar change, ${K.fromKey} vs ${K.toKey}` });
      [[K.fromKey + ' · overall', pct(K.fromOv), C.mute], [K.toKey + ' · overall', pct(K.toOv), C.acc7], ['Change', (d > 0 ? '+' : '') + d + ' pts', dc]].forEach(([l, v, col], i) => {
        const y = 1.75 + i * 1.6; card(s, 0.6, y, 2.8, 1.4);
        s.addText(l, { x: 0.8, y: y + 0.12, w: 2.4, h: 0.3, fontFace: F, fontSize: 12, color: C.mute });
        s.addText(v, { x: 0.8, y: y + 0.45, w: 2.4, h: 0.8, fontFace: H, fontSize: 38, bold: true, color: col });
      });
      const n = K.rows.length, top = 2.05, rh = (6.85 - top) / n, lx = 3.8, lw = 2.5, bx = lx + lw + 0.1, bw = 5.2, dx = bx + bw + 0.7;
      s.addShape('rect', { x: bx, y: 1.72, w: 0.18, h: 0.16, fill: { color: C.acc3 }, line: { type: 'none' } });
      s.addText(K.fromKey, { x: bx + 0.24, y: 1.64, w: 1.4, h: 0.3, fontFace: F, fontSize: 11, color: C.ink });
      s.addShape('rect', { x: bx + 1.7, y: 1.72, w: 0.18, h: 0.16, fill: { color: C.acc7 }, line: { type: 'none' } });
      s.addText(K.toKey, { x: bx + 1.94, y: 1.64, w: 1.4, h: 0.3, fontFace: F, fontSize: 11, color: C.ink });
      s.addText('Δ change', { x: dx, y: 1.64, w: 1.1, h: 0.3, fontFace: F, fontSize: 11, color: C.mute, align: 'right' });
      K.rows.forEach((r, i) => {
        const y = top + i * rh, bh = Math.min(0.16, rh * 0.32);
        if (i % 2) s.addShape('rect', { x: lx, y, w: 8.95, h: rh, fill: { color: 'E8EBEF' }, line: { type: 'none' } });
        s.addText(r.label, { x: lx, y, w: lw, h: rh, fontFace: F, fontSize: 11, color: C.ink, valign: 'middle', fit: 'shrink' });
        [[r.a, C.acc3, C.mute, 0], [r.b, C.acc7, C.acc7, 1]].forEach(([v, fill, ink, j]) => {
          const yy = y + rh / 2 - bh - 0.01 + j * (bh + 0.02);
          if (v) s.addShape('rect', { x: bx, y: yy, w: bw * v / 100, h: bh, fill: { color: fill }, line: { type: 'none' } });
          s.addText(pct(v), { x: bx + bw * (v || 0) / 100 + 0.05, y: yy - 0.05, w: 0.6, h: bh + 0.1, fontFace: F, fontSize: 9, bold: true, color: ink, valign: 'middle' });
        });
        const dd = r.a == null || r.b == null ? null : r.b - r.a;
        s.addText(dd == null ? '—' : (dd > 0 ? '+' + dd + ' ▲' : dd < 0 ? dd + ' ▼' : '0'), { x: dx, y, w: 1.1, h: rh, fontFace: H, fontSize: 14, bold: true, color: dd > 0 ? '2F6545' : dd < 0 ? C.red : C.mute, align: 'right', valign: 'middle' });
      });
      s.addNotes(`Overall readiness moved from ${pct(K.fromOv)} (${K.fromKey}) to ${pct(K.toOv)} (${K.toKey}).`);
    }

    // Matrix (region)
    if (isReg) {
      s = frame(pres, p, { kicker: '02 · Capacity by pillar', title: 'Country × pillar readiness (% of criteria met)' });
      const hdr = [{ text: 'Country', options: { bold: true, color: C.mute, align: 'left' } }].concat(p.short.map(h => ({ text: h, options: { bold: true, color: C.mute } }))).concat([{ text: 'Overall', options: { bold: true } }]);
      const rows = [hdr].concat(p.countries.slice().sort((a, b) => b.ov - a.ov).map(c => [{ text: c.name, options: { align: 'left', bold: true } }].concat(c.sc.map(v => { const b = band(v); return { text: v == null ? '—' : String(v), options: { fill: { color: b.t }, color: b.i } }; })).concat([{ text: String(c.ov), options: { bold: true, fill: { color: band(c.ov).t }, color: band(c.ov).i } }])));
      rows.push([{ text: 'Average', options: { align: 'left', color: C.mute } }].concat(p.pAvg.map(v => ({ text: v == null ? '—' : String(v), options: { bold: true, color: band(v).i } }))).concat([{ text: String(p.regionAvg), options: { bold: true } }]));
      s.addTable(rows, { x: 0.6, y: 1.7, w: 12.1, colW: [1.6].concat(p.short.map(() => (12.1 - 1.6 - 0.9) / p.short.length)).concat([0.9]), fontFace: F, fontSize: 11, align: 'center', valign: 'middle', border: { type: 'solid', pt: 1.5, color: C.bg }, rowH: 0.4 });
    }

    // Capacities & gaps
    s = frame(pres, p, { kicker: (isReg ? '03' : '02') + ' · Capacities and gaps', title: isReg ? 'Strongest capacities and most common gaps' : `${p.scopeName}: capacities in place and gaps` });
    s.addText('CAPACITIES IN PLACE', { x: 0.6, y: 1.7, w: 5.9, h: 0.35, fontFace: F, fontSize: 12, color: '2F6545', charSpacing: 2 });
    s.addText('GAPS', { x: 6.85, y: 1.7, w: 5.9, h: 0.35, fontFace: F, fontSize: 12, color: C.red, charSpacing: 2 });
    card(s, 0.6, 2.1, 5.9, 4.75); card(s, 6.85, 2.1, 5.9, 4.75);
    const topP = p.pillars.map((n, i) => ({ n, v: isReg ? p.pAvg[i] : p.me.sc[i] })).filter(x => x.v != null).sort((a, b) => b.v - a.v);
    s.addText(topP.slice(0, 3).map(x => `${x.n} ${pct(x.v)}`).join('   ·   '), { x: 0.8, y: 2.2, w: 5.5, h: 0.6, fontFace: H, fontSize: 15, bold: true, color: '2F6545', fit: 'shrink' });
    list(s, p.met.slice(0, 7).map(m => ({ tag: m.tag, text: clip(m.text, 110) })), 0.8, 2.85, 5.5, 3.9, { size: 12 });
    s.addText(topP.slice(-3).reverse().map(x => `${x.n} ${pct(x.v)}`).join('   ·   '), { x: 7.05, y: 2.2, w: 5.5, h: 0.6, fontFace: H, fontSize: 15, bold: true, color: C.red, fit: 'shrink' });
    list(s, p.gaps.slice(0, 7).map(m => ({ tag: m.tag, text: clip(m.text, 110) })), 7.05, 2.85, 5.5, 3.9, { size: 12, empty: 'No unmet criteria' });

    // Country focus (region)
    if (isReg) {
      s = frame(pres, p, { kicker: '04 · Country priorities', title: 'Each country\'s two weakest pillars' });
      const rows = p.countries.map(c => { const w = c.sc.map((v, i) => [v, i]).filter(x => x[0] != null).sort((a, b) => a[0] - b[0]).slice(0, 2); return [{ text: c.name, options: { bold: true, fontFace: H, fontSize: 15 } }, { text: w.map(([v, i]) => `${p.pillars[i]} ${v}%`).join('   ·   ') }]; });
      s.addTable(rows, { x: 0.6, y: 1.75, w: 12.1, colW: [2.6, 9.5], fontFace: F, fontSize: 13, color: C.ink, valign: 'middle', border: [{ type: 'none' }, { type: 'none' }, { type: 'solid', pt: 0.75, color: C.rule }, { type: 'none' }], rowH: 0.48 });
    }

    // Actions by horizon
    s = frame(pres, p, { kicker: (isReg ? '05' : '03') + ' · Anticipatory actions', title: 'Actions by time horizon: readiness to preparedness' });
    const H3 = [['now', 'Readiness · 0–3 months', 'Immediate'], ['mid', 'Preparedness · 3–12 months', 'Medium term'], ['long', 'Preparedness · 1–3 years', 'Long term']];
    H3.forEach(([k, kick, t], i) => {
      const x = 0.6 + i * 4.1;
      card(s, x, 1.75, 3.9, 5.1);
      s.addText(kick.toUpperCase(), { x: x + 0.2, y: 1.88, w: 3.5, h: 0.3, fontFace: F, fontSize: 10, color: C.acc7, charSpacing: 1 });
      s.addText(t, { x: x + 0.2, y: 2.15, w: 3.5, h: 0.5, fontFace: H, fontSize: 22, bold: true, color: C.ink });
      const items = p.actions.filter(a => horizon(a.text) === k).slice(0, 6).map(a => ({ tag: '', text: clip(a.text, 105) + (isReg ? '' : ` (${a.pillar})`) }));
      list(s, items, x + 0.2, 2.75, 3.5, 4.0, { size: 11, bullet: true, empty: 'No actions in this horizon' });
    });
    s.addNotes('Horizons are assigned automatically from action wording; review before use.');

    // Progress
    s = frame(pres, p, { kicker: (isReg ? '06' : '04') + ' · Progress to date', title: 'Priority action tracker' });
    const T = p.tracker, tot = T.done + T.progress + T.todo + T.blocked;
    [['Implemented', T.done, '2F6545'], ['In progress', T.progress, C.acc7], ['Not started', T.todo, C.mute], ['Blocked', T.blocked, C.red]].forEach(([l, n, col], i) => stat(s, 0.6 + i * 3.08, 1.75, 2.85, l, String(n), tot ? Math.round(100 * n / tot) + '% of ' + tot : '', col));
    let bx = 0.6; [[T.done, BAND.A.f], [T.progress, C.acc], [T.todo, 'D4D4D7'], [T.blocked, BAND.L.f]].forEach(([n, col]) => { if (!tot || !n) return; const w = 12.1 * n / tot; s.addShape('rect', { x: bx, y: 3.8, w: Math.max(0.02, w - 0.03), h: 0.4, fill: { color: col }, line: { type: 'none' } }); bx += w; });
    if (p.trackerByPillar.length) {
      s.addText('BY PILLAR (IMPLEMENTED / TRACKED)', { x: 0.6, y: 4.45, w: 8, h: 0.3, fontFace: F, fontSize: 11, color: C.mute, charSpacing: 1 });
      s.addText(p.trackerByPillar.map(r => `${r.pillar}  ${r.done}/${r.n}`).join('     '), { x: 0.6, y: 4.8, w: 12.1, h: 1.4, fontFace: F, fontSize: 13, color: C.ink, valign: 'top', fit: 'shrink' });
    }
    s.addText('Prototype: tracker statuses include test values until countries update the action tracker.', { x: 0.6, y: 6.45, w: 12.1, h: 0.35, fontFace: F, fontSize: 11, italic: true, color: C.red });

    const fname = `${p.scopeName.replace(/[^\w]+/g, '_')}_${(p.hazardName || 'Cholera').replace(/[^\w]+/g, '_')}_Preparedness_Readiness_${p.round}${p.isDemo ? '_DUMMY' : ''}.pptx`;
    await pres.writeFile({ fileName: fname });
    return fname;
  }
  window.PDX_PPTX = { build };
})();
