(function(){
if (customElements.get('africa-map')) return;
let topoP = null;
const getTopo = () => topoP || (topoP = window.WORLD_TOPO ? Promise.resolve(window.WORLD_TOPO) : fetch('https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json').then(r => r.json()));
const ready = () => new Promise(res => { const t = () => (window.d3 && window.topojson) ? res() : setTimeout(t, 60); t(); });
const EXCL = ['682','887','368','364','760','400','422','376','275','792','196','512','784','634','414','048','300','380','724','620'];
const INK = '#1d1f20', PAPER = '#f2f2f3', DEEP = '#2c455d';
class AfricaMap extends HTMLElement {
  static get observedAttributes(){ return ['values-json','valuesjson','selected','height']; }
  constructor(){ super(); this._vals = {}; this._sel = null; this._k = 1; }
  set valuesJson(v){ this._setVals(v); } get valuesJson(){ return JSON.stringify(this._vals); }
  set selected(v){ this._sel = v || null; this._paint(); } get selected(){ return this._sel; }
  attributeChangedCallback(n, o, v){ if (n === 'values-json' || n === 'valuesjson') this._setVals(v); else if (n === 'selected') { this._sel = v || null; this._paint(); } else this._layout(); }
  _setVals(v){
    try { this._vals = typeof v === 'string' ? JSON.parse(v || '{}') : (v || {}); } catch(e){ this._vals = {}; }
    const keys = Object.keys(this._vals).filter(k => !this._vals[k].noclick).sort().join();
    if (keys !== this._keys) { this._keys = keys; this._layout(); }
    this._paint(true);
  }
  connectedCallback(){
    Object.assign(this.style, { display:'block', position:'relative', width:'100%' });
    if (this._built) return; this._built = true;
    ready().then(getTopo).then(topo => this._build(topo));
  }
  disconnectedCallback(){ this._ro && this._ro.disconnect(); }
  _btn(label, title, fn){
    const b = document.createElement('button'); b.type = 'button'; b.title = title; b.setAttribute('aria-label', title); b.innerHTML = label;
    Object.assign(b.style, { width:'34px', height:'34px', display:'grid', placeItems:'center', background:PAPER, color:INK, border:'1px solid #c9c9cd', cursor:'pointer', padding:0 });
    b.onmouseenter = () => b.style.background = '#e2e7ee'; b.onmouseleave = () => b.style.background = PAPER;
    b.onclick = fn; return b;
  }
  _build(topo){
    const d3 = window.d3;
    this._all = topojson.feature(topo, topo.objects.countries).features.filter(f => { const [x,y] = d3.geoCentroid(f); return x > -26 && x < 60 && y > -40 && y < 38 && !EXCL.includes(f.id); });
    this.innerHTML = '';
    const svg = d3.select(this).append('svg').style('display','block').style('width','100%').style('cursor','grab').style('font-family','Barlow, system-ui, sans-serif');
    this._svg = svg;
    this._root = svg.append('g');
    const self = this;
    this._paths = this._root.append('g').selectAll('path').data(this._all).join('path')
      .attr('vector-effect','non-scaling-stroke').attr('stroke', PAPER).attr('stroke-width', 0.8)
      .on('mouseenter', function(e, f){ self._hover = f.id; d3.select(this).raise(); self._paint(); self._tip(e, f); })
      .on('mousemove', (e, f) => this._tip(e, f))
      .on('mouseleave', () => { this._hover = null; this._paint(); this._tipEl.style.opacity = 0; })
      .on('click', (e, f) => { const v = this._vals[f.id]; if (v && !v.noclick) this.dispatchEvent(new CustomEvent('mapselect', { bubbles:true, composed:true, detail:{ iso:f.id } })); });
    this._lab = this._root.append('g').style('pointer-events','none').selectAll('g').data(this._all).join('g');
    this._lab.append('text').attr('class','c').attr('text-anchor','middle').attr('font-size', 12).attr('font-weight', 700).attr('letter-spacing','0.05em');
    this._lab.append('text').attr('class','v').attr('text-anchor','middle').attr('y', 14).attr('font-size', 12).attr('font-weight', 500);

    const tip = document.createElement('div');
    Object.assign(tip.style, { position:'absolute', pointerEvents:'none', opacity:0, transition:'opacity .12s', background:INK, color:PAPER, padding:'10px 12px', minWidth:'170px', maxWidth:'240px', fontSize:'13px', lineHeight:'1.35', zIndex:3, boxShadow:'0 6px 18px rgba(0,0,0,.18)' });
    this.appendChild(tip); this._tipEl = tip;

    const ctl = document.createElement('div');
    Object.assign(ctl.style, { position:'absolute', right:'14px', top:'14px', display:'flex', flexDirection:'column', gap:'4px', zIndex:2 });
    const ic = p => `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${p}</svg>`;
    this._zoom = d3.zoom().scaleExtent([1, 8]).on('zoom', e => { this._k = e.transform.k; this._root.attr('transform', e.transform); this._placeLabels(); })
      .on('start', () => svg.style('cursor','grabbing')).on('end', () => svg.style('cursor','grab'));
    svg.call(this._zoom).on('wheel.zoom', null).on('dblclick.zoom', null);
    ctl.appendChild(this._btn(ic('<path d="M5 12h14"/><path d="M12 5v14"/>'), 'Zoom in', () => svg.transition().duration(300).call(this._zoom.scaleBy, 1.6)));
    ctl.appendChild(this._btn(ic('<path d="M5 12h14"/>'), 'Zoom out', () => svg.transition().duration(300).call(this._zoom.scaleBy, 1/1.6)));
    ctl.appendChild(this._btn(ic('<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>'), 'Reset view', () => svg.transition().duration(400).call(this._zoom.transform, d3.zoomIdentity)));
    this.appendChild(ctl);

    const hint = document.createElement('div'); hint.textContent = 'Hover for scores · click to select · drag to pan';
    Object.assign(hint.style, { position:'absolute', left:'14px', bottom:'10px', fontSize:'12px', color:'#5d5d60', pointerEvents:'none' });
    this.appendChild(hint);

    this._ro = new ResizeObserver(() => this._layout()); this._ro.observe(this);
    const av = this.getAttribute('valuesjson') || this.getAttribute('values-json');
    if (av && !Object.keys(this._vals).length) { this._keys = null; this._setVals(av); }
    const as = this.getAttribute('selected'); if (as && !this._sel) this._sel = as;
    this._W = null; this._layout(); this._paint(true);
  }
  _layout(){
    if (!this._paths) return;
    const d3 = window.d3, W = Math.max(320, this.clientWidth || 900), H = +(this.getAttribute('height') || 560);
    if (W === this._W && H === this._H && this._keys === this._fitKeys) return;
    this._W = W; this._H = H; this._fitKeys = this._keys;
    this._svg.attr('width', W).attr('height', H).attr('viewBox', `0 0 ${W} ${H}`);
    const focus = this._all.filter(f => this._vals[f.id] && !this._vals[f.id].noclick);
    const proj = d3.geoMercator().fitExtent([[40, 30], [W - 64, H - 40]], { type:'FeatureCollection', features: focus.length ? focus : this._all });
    const path = d3.geoPath(proj);
    this._paths.attr('d', path);
    this._cent = {}; this._all.forEach(f => this._cent[f.id] = path.centroid(f));
    this._placeLabels();
  }
  _placeLabels(){
    if (!this._lab || !this._cent) return;
    const k = this._k || 1;
    this._lab.attr('transform', f => { const c = this._cent[f.id] || [0,0]; return `translate(${c[0]},${c[1] - 2 / k}) scale(${1 / k})`; });
  }
  _tip(e, f){
    const v = this._vals[f.id], name = f.properties.name;
    const [x, y] = window.d3.pointer(e, this);
    const t = this._tipEl;
    if (v && !v.noclick) {
      t.innerHTML = `<div style="font-size:11px;letter-spacing:.1em;text-transform:uppercase;opacity:.7">${v.metric || 'Overall readiness'}</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-weight:600;font-size:22px;line-height:1.1;margin-top:2px">${v.name}</div>
        <div style="display:flex;align-items:baseline;gap:8px;margin-top:4px"><span style="font-family:'Barlow Condensed',sans-serif;font-weight:600;font-size:30px;line-height:1">${v.value || '—'}</span>
        <span style="display:inline-flex;align-items:center;gap:5px"><i style="width:9px;height:9px;background:${v.fill};display:inline-block"></i>${v.band}</span></div>
        ${v.sub ? `<div style="margin-top:4px;opacity:.8">${v.sub}</div>` : ''}
        <div style="margin-top:8px;padding-top:6px;border-top:1px solid rgba(242,242,243,.2);font-size:12px;opacity:.7">Click to see pillar breakdown</div>`;
    } else {
      t.innerHTML = `<div style="font-weight:600">${v && v.name || name}</div><div style="opacity:.7;font-size:12px;margin-top:2px">${v && v.note || 'No assessment submitted'}</div>`;
    }
    const w = t.offsetWidth, h = t.offsetHeight, W = this.clientWidth;
    let lx = x + 16, ly = y + 16;
    if (lx + w > W - 8) lx = x - w - 16;
    if (ly + h > this.clientHeight - 8) ly = y - h - 16;
    t.style.left = Math.max(8, lx) + 'px'; t.style.top = Math.max(8, ly) + 'px'; t.style.opacity = 1;
  }
  _paint(animate){
    if (!this._paths) return;
    const v = this._vals, sel = this._sel, hov = this._hover;
    const active = id => v[id] && !v[id].noclick;
    const p = animate ? this._paths.transition().duration(450) : this._paths;
    p.attr('fill', f => v[f.id] ? v[f.id].fill : '#e0e0e3')
      .attr('opacity', f => hov && active(hov) && active(f.id) && f.id !== hov && f.id !== sel ? 0.55 : 1);
    this._paths
      .attr('stroke', f => f.id === sel ? INK : f.id === hov && active(f.id) ? DEEP : PAPER)
      .attr('stroke-width', f => f.id === sel ? 2.6 : f.id === hov && active(f.id) ? 2 : 0.8)
      .style('cursor', f => active(f.id) ? 'pointer' : 'grab');
    if (sel) this._paths.filter(f => f.id === sel).raise();
    if (hov) this._paths.filter(f => f.id === hov).raise();
    this._lab.select('text.c').text(f => active(f.id) ? v[f.id].label : '').attr('fill', f => v[f.id] && v[f.id].ink || INK);
    this._lab.select('text.v').text(f => active(f.id) ? (v[f.id].value || '') : '').attr('fill', f => v[f.id] && v[f.id].ink || INK);
  }
}
customElements.define('africa-map', AfricaMap);
})();
