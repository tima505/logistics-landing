(function(){
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = n => Math.round(n).toLocaleString('ru-RU').replace(/,/g,' ');
  const SVGNS = 'http://www.w3.org/2000/svg';

  /* Mobile menu */
  const burger = document.getElementById('burger'), mnav = document.getElementById('mnav');
  const ICON_OPEN = '<path d="M2 5h16M2 10h16M2 15h16"/>', ICON_CLOSE = '<path d="M4 4l12 12M16 4L4 16"/>';
  function setMenu(open){
    mnav.classList.toggle('open', open);
    burger.setAttribute('aria-expanded', open);
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    burger.querySelector('svg').innerHTML = open ? ICON_CLOSE : ICON_OPEN;
    document.body.classList.toggle('menu-open', open);
  }
  burger.addEventListener('click', () => setMenu(!mnav.classList.contains('open')));
  mnav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && mnav.classList.contains('open')) { setMenu(false); burger.focus(); } });
  window.matchMedia('(min-width: 981px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  /* Mobile action bar: прячем на форме заявки и при открытой клавиатуре */
  const mbar = document.getElementById('mbar');
  if (mbar) {
    let inContact = false, typing = false;
    const sync = () => mbar.classList.toggle('hide', inContact || typing);
    const contactSec = document.getElementById('contact');
    const checkContact = () => {
      const r = contactSec.getBoundingClientRect(), vh = window.innerHeight;
      const v = r.top < vh * 0.7 && r.bottom > 0;
      if (v !== inContact) { inContact = v; sync(); }
    };
    window.addEventListener('scroll', checkContact, {passive:true});
    window.addEventListener('resize', checkContact);
    checkContact();
    document.addEventListener('focusin', e => { if (e.target.matches('input:not([type=range]):not([type=checkbox]):not([type=radio]),textarea,select')) { typing = true; sync(); } });
    document.addEventListener('focusout', () => { typing = false; sync(); });
  }

  /* Map grid */
  const gl = document.getElementById('gridlines');
  for (let x = 0; x <= 600; x += 50) {
    const l = document.createElementNS(SVGNS,'line'); l.setAttribute('x1',x); l.setAttribute('x2',x); l.setAttribute('y1',0); l.setAttribute('y2',430); l.setAttribute('class','grid-line'); gl.appendChild(l);
  }
  for (let y = 0; y <= 430; y += 50) {
    const l = document.createElementNS(SVGNS,'line'); l.setAttribute('y1',y); l.setAttribute('y2',y); l.setAttribute('x1',0); l.setAttribute('x2',600); l.setAttribute('class','grid-line'); gl.appendChild(l);
  }
  [['50°N',4,62],['45°N',4,212],['42°N',4,362]].forEach(([t,x,y])=>{const e=document.createElementNS(SVGNS,'text');e.setAttribute('x',x);e.setAttribute('y',y);e.setAttribute('class','coord');e.textContent=t;gl.appendChild(e);});
  [['60°E',152,424],['70°E',352,424],['80°E',552,424]].forEach(([t,x,y])=>{const e=document.createElementNS(SVGNS,'text');e.setAttribute('x',x);e.setAttribute('y',y);e.setAttribute('class','coord');e.textContent=t;gl.appendChild(e);});

  /* Trucks along routes */
  const tg = document.getElementById('trucks');
  const fleet = [
    {id:'r1', dur:22, off:.35, hot:true},
    {id:'r2', dur:30, off:.1},
    {id:'r2', dur:30, off:.6, rev:true},
    {id:'r3', dur:16, off:.5, rev:true},
    {id:'r4', dur:20, off:.2},
    {id:'r5', dur:24, off:.75}
  ].map(t => {
    const path = document.getElementById(t.id);
    const g = document.createElementNS(SVGNS,'g');
    g.setAttribute('class','truck' + (t.hot ? ' hot' : ''));
    g.innerHTML = '<rect class="body" x="-10" y="-4.5" width="13" height="9" rx="1"/><rect class="cab" x="3.5" y="-3.5" width="6" height="7" rx="1.2"/>';
    tg.appendChild(g);
    return {...t, path, g, len: path.getTotalLength()};
  });
  const bar = document.getElementById('tc-bar'), kmEl = document.getElementById('tc-km'), etaEl = document.getElementById('tc-eta');
  const TOTAL = 1120;
  function place(t, p){
    const d = t.rev ? (1 - p) * t.len : p * t.len;
    const a = t.path.getPointAtLength(d);
    const b = t.path.getPointAtLength(Math.min(t.len, Math.max(0, d + (t.rev ? -1 : 1))));
    const ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
    t.g.setAttribute('transform', `translate(${a.x.toFixed(1)},${a.y.toFixed(1)}) rotate(${ang.toFixed(1)})`);
  }
  function card(p){
    bar.style.width = (p * 100).toFixed(1) + '%';
    const km = p * TOTAL;
    kmEl.textContent = fmt(km) + ' / 1 120 км';
    const hours = (TOTAL - km) / 62;
    etaEl.textContent = 'ETA ' + (hours >= 24 ? Math.floor(hours/24) + 'д ' + Math.floor(hours%24) + 'ч' : Math.floor(hours) + 'ч ' + Math.floor((hours%1)*60) + 'м');
  }
  if (reduce) {
    fleet.forEach(t => place(t, t.off)); card(fleet[0].off);
  } else {
    const t0 = performance.now();
    (function loop(now){
      const s = (now - t0) / 1000;
      fleet.forEach(t => { const p = (t.off + s / t.dur) % 1; place(t, p); if (t.hot) card(p); });
      requestAnimationFrame(loop);
    })(t0);
  }

  /* Conveyor boxes */
  const items = [
    ['s','12 кг','SHY → ALA'],['m','340 кг','URC → SHY',1],['l','1 200 кг','KHG → NQZ'],['s','48 кг','SHY → TAS',1],
    ['m','560 кг','MOW → SHY'],['s','26 кг','ALA → SHY'],['l','980 кг','URC → ALA',1],['m','215 кг','SHY → FRU']
  ];
  const conv = document.getElementById('conveyor');
  let html = '';
  for (let r = 0; r < 2; r++) items.forEach(([sz,w,rt,tag],i) => {
    html += `<div class="box ${sz}${tag?' tag':''}"><b>${w}</b><span>${rt}</span><span class="bc"></span><span>№ ${String(48213 + i * 7).padStart(7,'0')}</span></div>`;
  });
  conv.innerHTML = html;
  const proc = document.getElementById('processed'); let pc = 1284;
  if (!reduce) setInterval(() => { pc += 1 + Math.floor(Math.random()*3); proc.textContent = fmt(pc); }, 2400);

  /* Count-up (final values already in markup) */
  const counters = document.querySelectorAll('[data-count]');
  function countUp(el){
    const target = parseFloat(el.dataset.count), dec = +(el.dataset.dec || 0), suf = el.dataset.suffix || '';
    const t0 = performance.now(), D = 1400;
    (function step(now){
      const k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3), v = target * e;
      el.textContent = (dec ? v.toFixed(dec).replace('.', ',') : fmt(v)) + suf;
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { countUp(e.target); io.unobserve(e.target); } }), {threshold:.6});
    counters.forEach(c => io.observe(c));
  }

  /* Process road driven by scroll */
  const road = document.getElementById('road'), steps = [...document.querySelectorAll('#steps .step')], cps = [...document.querySelectorAll('.cp')];
  const procSec = document.getElementById('process');
  function onScroll(){
    const r = procSec.getBoundingClientRect(), vh = window.innerHeight;
    let p = (vh * 0.85 - r.top) / (r.height * (window.innerWidth <= 900 ? 0.55 : 0.75));
    p = Math.max(0, Math.min(1, p));
    road.style.setProperty('--p', p.toFixed(3));
    steps.forEach((s,i) => { const on = p >= i / 4 - 0.001; s.classList.toggle('on', on); cps[i] && cps[i].classList.toggle('on', on); });
  }
  if (reduce) { road.style.setProperty('--p', 1); steps.forEach(s=>s.classList.add('on')); cps.forEach(c=>c.classList.add('on')); }
  else { window.addEventListener('scroll', onScroll, {passive:true}); window.addEventListener('resize', onScroll); onScroll(); }

  /* Calculator */
  const ROUTES = {
    'CN-SHY': {from:'Урумчи', to:'Шымкент', km:1650, base:180000, perKg:62, days:'7–10 дней', tr:'Авто, сборный'},
    'KHG-ALA':{from:'Хоргос', to:'Алматы', km:380, base:60000, perKg:18, days:'1–2 дня', tr:'Авто'},
    'ALA-SHY':{from:'Алматы', to:'Шымкент', km:690, base:70000, perKg:22, days:'1–2 дня', tr:'Авто'},
    'SHY-AST':{from:'Шымкент', to:'Астана', km:1450, base:130000, perKg:38, days:'2–3 дня', tr:'Авто'},
    'SHY-TAS':{from:'Шымкент', to:'Ташкент', km:120, base:45000, perKg:14, days:'1 день + граница', tr:'Авто'},
    'MSK-SHY':{from:'Москва', to:'Шымкент', km:3600, base:320000, perKg:75, days:'6–8 дней', tr:'Авто / Ж/д'}
  };
  const $ = id => document.getElementById(id);
  const priceEl = $('o-price'); let shown = 0, anim;
  function tween(to){
    cancelAnimationFrame(anim);
    if (reduce) { shown = to; priceEl.textContent = fmt(to); return; }
    const from = shown, t0 = performance.now();
    (function s(now){ const k = Math.min(1,(now-t0)/500), e = 1-Math.pow(1-k,3); shown = from + (to-from)*e; priceEl.textContent = fmt(shown); if (k<1) anim = requestAnimationFrame(s); })(t0);
  }
  function calc(){
    const r = ROUTES[$('c-route').value];
    const kg = +$('c-kg').value, m3 = +$('c-m3').value;
    const mult = +document.querySelector('input[name=ctype]:checked').value;
    $('c-kg-v').textContent = fmt(kg); $('c-m3-v').textContent = String(m3).replace('.', ',');
    const cw = Math.max(kg, m3 * 250);
    let price = r.base * 0.5 + cw * r.perKg * mult;
    if ($('c-exp').checked) price *= 1.25;
    if ($('c-ins').checked) price *= 1.07;
    if ($('c-door').checked) price += 15000;
    price = Math.round(price / 500) * 500;
    tween(price);
    $('o-from').textContent = r.from; $('o-to').textContent = r.to;
    $('o-days').textContent = $('c-exp').checked ? r.days.replace(/(\d+)–(\d+)/, (m,a,b)=>a+'–'+Math.max(+a, b-1)) : r.days;
    $('o-km').textContent = fmt(r.km) + ' км';
    $('o-cw').textContent = fmt(cw) + ' кг';
    $('o-tr').textContent = cw > 10000 ? 'Отдельная машина' : r.tr;
  }
  $('calcForm').addEventListener('input', calc);
  $('calcForm').addEventListener('change', calc);
  calc();
  $('o-cta').addEventListener('click', () => {
    const r = ROUTES[$('c-route').value];
    $('f-from').value = r.from; $('f-to').value = r.to;
    $('f-msg').value = `Вес ${fmt(+$('c-kg').value)} кг, объём ${String($('c-m3').value).replace('.', ',')} м³. Предварительная цена ${priceEl.textContent} ₸`;
  });

  /* Tracking demo */
  const tl = [...document.querySelectorAll('#tl li')];
  function runTrack(){
    tl.forEach(li => li.classList.remove('done','now'));
    const finish = 3;
    if (reduce) { tl.forEach((li,i)=>{ if(i<finish) li.classList.add('done'); if(i===finish) li.classList.add('now'); }); return; }
    tl.forEach((li,i) => setTimeout(() => {
      if (i < finish) li.classList.add('done');
      else if (i === finish) li.classList.add('now');
    }, 250 + i * 450));
  }
  // resting state visible immediately
  tl.forEach((li,i)=>{ if(i<3) li.classList.add('done'); if(i===3) li.classList.add('now'); });
  $('trkForm').addEventListener('submit', e => {
    e.preventDefault();
    const v = $('trk-in').value.trim().toUpperCase() || 'KZ-0482-HS';
    $('trk-no').textContent = v;
    runTrack();
  });

  /* Lead form */
  $('leadForm').addEventListener('submit', e => {
    e.preventDefault();
    const ok = $('f-name').value.trim() && $('f-phone').value.replace(/\D/g,'').length >= 10;
    $('f-err').classList.toggle('show', !ok);
    if (!ok) return;
    $('f-sent').classList.add('show');
    e.target.reset();
  });
})();
