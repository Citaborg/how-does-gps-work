'use strict';
/* Timeline, rendering loop, narration column and the player controls. */

(function () {
  const W = 1920, H = 1080;
  const stage = document.getElementById('stage');
  const ink = document.getElementById('ink'), glc = document.getElementById('gl');
  const ctx = ink.getContext('2d');
  const narr = document.getElementById('narr');
  let K = 1, KG = 1, grain = null, grainPat = null;

  // timeline
  let acc = 0;
  SCENES.forEach(s => { s.start = acc; acc += s.dur; s.fadeIn = s.fadeIn ?? true; s.fadeOut = s.fadeOut ?? true; });
  const TOTAL = acc;
  buildDrives();

  const state = { T: 0, playing: false, speed: 1, dirty: true, last: 0, cur: -1 };

  function sceneIndex(T) {
    for (let i = SCENES.length - 1; i >= 0; i--) if (T >= SCENES[i].start) return i;
    return 0;
  }

  /* ---------- sizing ---------- */
  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const s = Math.min(vw / W, vh / H);
    stage.style.transform = `translate(${(vw - W * s) / 2}px, ${(vh - H * s) / 2}px) scale(${s})`;
    const dpr = window.devicePixelRatio || 1;
    K = s * dpr;
    ink.width = Math.round(W * K); ink.height = Math.round(H * K);
    KG = s * Math.min(dpr, 1.5);
    GL.resize(Math.round(W * KG), Math.round(H * KG));
    renderMap(K);
    grainPat = ctx.createPattern(grain, 'repeat');
    state.dirty = true;
  }

  /* ---------- narration ---------- */
  const narrItems = SCENES.map(s => {
    const items = [];
    const h = document.createElement('div');
    h.className = 'item h';
    h.innerHTML = `<span class="act">${s.act}</span>${s.title}`;
    narr.appendChild(h);
    items.push({ el: h, a: 0.2, b: s.dur - 0.3, vis: false });
    (s.cues || []).forEach(([a, b, html]) => {
      const el = document.createElement('div'); el.className = 'item c'; el.innerHTML = html;
      narr.appendChild(el); items.push({ el, a, b, vis: false });
    });
    return items;
  });
  let lastKey = '';
  function updateNarr(si, t) {
    const items = narrItems[si];
    const vis = items.filter(it => t >= it.a && t < it.b);
    const key = si + ':' + vis.map(v => items.indexOf(v)).join(',');
    if (key === lastKey) return;
    lastKey = key;
    narrItems.forEach((list, j) => list.forEach(it => {
      if (j === si && vis.includes(it)) return;
      if (it.vis) { it.vis = false; it.el.style.opacity = 0; it.el.style.filter = 'blur(3px)'; it.el.style.transform = `translate(60px, ${it.y || 0}px)`; it.el.classList.remove('old'); }
    }));
    const gap = 26;
    const heights = vis.map(it => it.el.offsetHeight);
    const total = heights.reduce((a, b) => a + b, 0) + gap * Math.max(0, vis.length - 1);
    let y = Math.max(0, (800 - total) / 2 - 40);
    const cues = vis.filter(v => !v.el.classList.contains('h'));
    vis.forEach((it, n) => {
      if (!it.vis) {
        it.el.style.transition = 'none';
        it.el.style.transform = `translate(60px, ${y}px)`;
        void it.el.offsetHeight;
        it.el.style.transition = '';
      }
      it.vis = true; it.y = y;
      it.el.style.opacity = 1; it.el.style.filter = 'none';
      it.el.style.transform = `translate(0px, ${y}px)`;
      it.el.classList.toggle('old', cues.length > 1 && it !== cues[cues.length - 1] && !it.el.classList.contains('h'));
      y += heights[n] + gap;
    });
  }

  /* ---------- render ---------- */
  function render() {
    const si = sceneIndex(state.T), sc = SCENES[si];
    const t = clamp(state.T - sc.start, 0, sc.dur);
    const fade = (sc.fadeIn ? smooth(t / 1.0) : 1) * (sc.fadeOut ? smooth((sc.dur - t) / 1.0) : 1);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, ink.width, ink.height);
    ctx.setTransform(K, 0, 0, K, 0, 0);
    Sk.ctx = ctx;
    if (sc.gl && GL.ok) {
      const st = sc.gl3d(t); st.k = KG;
      GL.render(st);
      glc.style.opacity = fade;
    } else {
      if (sc.gl) sc.gl3d(t);
      glc.style.opacity = 0;
    }
    ink.style.opacity = fade;
    sc.draw(t);
    // pencil grain + soft edge towards the narration column
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 0.55; ctx.fillStyle = grainPat; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 1;
    const g = ctx.createLinearGradient(1330, 0, 1420, 0);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)');
    ctx.fillStyle = g; ctx.fillRect(1330, 0, W - 1330, H);
    const g2 = ctx.createLinearGradient(0, 95, 0, 135);
    g2.addColorStop(0, 'rgba(0,0,0,1)'); g2.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g2; ctx.fillRect(0, 0, 1000, 135);
    ctx.restore();
    updateNarr(si, t);
    if (si !== state.cur) { state.cur = si; onChapter(si); }
    updateControls();
  }

  /* ---------- controls ---------- */
  const $ = id => document.getElementById(id);
  const bar = $('bar'), fill = $('barFill'), knob = $('knob'), tip = $('tip'), ticks = $('ticks');
  const fmtT = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  $('tTot').textContent = fmtT(TOTAL);
  SCENES.forEach((s, i) => {
    const el = document.createElement('i');
    el.style.left = (s.start / TOTAL * 100) + '%';
    if (i === 0 || SCENES[i - 1].act !== s.act) el.className = 'act';
    ticks.appendChild(el);
  });
  const menu = $('chapMenu');
  let lastAct = '';
  SCENES.forEach((s, i) => {
    if (s.act !== lastAct) { const g = document.createElement('div'); g.className = 'grp'; g.textContent = s.act; menu.appendChild(g); lastAct = s.act; }
    const b = document.createElement('button');
    b.innerHTML = `<span class="n">${fmtT(s.start)}</span><span>${s.title}</span>`;
    b.onclick = () => { seek(s.start + 0.01); menu.hidden = true; };
    menu.appendChild(b);
  });
  function onChapter(si) {
    $('chapName').textContent = SCENES[si].title;
    [...menu.querySelectorAll('button')].forEach((b, i) => b.classList.toggle('on', i === si));
  }
  function updateControls() {
    const f = state.T / TOTAL;
    fill.style.width = (f * 100) + '%'; knob.style.left = (f * 100) + '%';
    $('tNow').textContent = fmtT(state.T);
    $('playPath').setAttribute('d', state.playing ? 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z' : 'M7 4.5 19 12 7 19.5z');
  }
  function seek(T) { state.T = clamp(T, 0, TOTAL - 0.01); state.dirty = true; lastKey = ''; startUI(); }
  function play(p) {
    state.playing = p ?? !state.playing;
    if (state.playing && state.T >= TOTAL - 0.05) state.T = 0;
    startUI(); state.dirty = true;
  }
  function startUI() { $('startCard').classList.add('gone'); }
  function chapterJump(d) {
    const si = sceneIndex(state.T), t = state.T - SCENES[si].start;
    const ni = d < 0 && t > 3 ? si : clamp(si + d, 0, SCENES.length - 1);
    seek(SCENES[ni].start + 0.01);
  }

  $('startBtn').onclick = () => play(true);
  $('btnPlay').onclick = () => play();
  $('btnPrev').onclick = () => chapterJump(-1);
  $('btnNext').onclick = () => chapterJump(1);
  $('btnChap').onclick = e => { e.stopPropagation(); menu.hidden = !menu.hidden; };
  document.addEventListener('click', e => { if (!menu.contains(e.target)) menu.hidden = true; });
  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];
  $('btnSpeed').onclick = () => { state.speed = speeds[(speeds.indexOf(state.speed) + 1) % speeds.length]; $('btnSpeed').textContent = String(state.speed).replace('.', ',') + '×'; };
  $('btnFull').onclick = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen?.(); else document.exitFullscreen?.(); };

  let dragging = false;
  const barT = e => { const r = bar.getBoundingClientRect(); return clamp((e.clientX - r.left) / r.width) * TOTAL; };
  bar.addEventListener('pointerdown', e => { dragging = true; bar.setPointerCapture(e.pointerId); seek(barT(e)); });
  bar.addEventListener('pointermove', e => {
    const T = barT(e), r = bar.getBoundingClientRect();
    tip.textContent = `${fmtT(T)} · ${SCENES[sceneIndex(T)].title}`;
    tip.style.left = ((e.clientX - r.left) / r.width * 100) + '%';
    if (dragging) seek(T);
  });
  bar.addEventListener('pointerup', () => { dragging = false; });

  window.addEventListener('keydown', e => {
    if (e.key === ' ') { e.preventDefault(); play(); }
    else if (e.key === 'ArrowRight') seek(state.T + 5);
    else if (e.key === 'ArrowLeft') seek(state.T - 5);
    else if (e.key === 'PageDown' || e.key === ']') chapterJump(1);
    else if (e.key === 'PageUp' || e.key === '[') chapterJump(-1);
    else if (e.key === 'f' || e.key === 'F') $('btnFull').click();
  });

  const controls = $('controls');
  let idleTimer = 0;
  window.addEventListener('pointermove', () => { controls.classList.remove('idle'); clearTimeout(idleTimer); idleTimer = setTimeout(() => state.playing && controls.classList.add('idle'), 3000); });

  /* ---------- loop ---------- */
  function frame(now) {
    const dt = Math.min(0.1, (now - (state.last || now)) / 1000);
    state.last = now;
    if (state.playing) {
      state.T += dt * state.speed;
      if (state.T >= TOTAL) { state.T = TOTAL - 0.01; state.playing = false; }
      state.dirty = true;
    }
    if (state.dirty) { render(); state.dirty = false; }
    requestAnimationFrame(frame);
  }

  /* ---------- boot ---------- */
  grain = makeGrain();
  if (!GL.init(glc)) {
    const n = document.createElement('div'); n.id = 'nogl';
    n.textContent = 'WebGL2 er ikke tilgjengelig – 3D-kapitlene vises uten kuler.';
    stage.appendChild(n);
  }
  window.addEventListener('resize', resize);
  const boot = () => {
    resize();
    const m = location.hash.match(/t=([\d.]+)/), c = location.hash.match(/c=(\w+)/);
    if (m) seek(parseFloat(m[1]));
    if (c) { const s = SCENES.find(x => x.key === c[1]); if (s) seek(s.start + (parseFloat((location.hash.match(/o=([\d.]+)/) || [])[1]) || 0.01)); }
    requestAnimationFrame(frame);
  };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(boot);
  window.GPSPlayer = { seek, play, state, SCENES, TOTAL, render: () => render() };
})();
