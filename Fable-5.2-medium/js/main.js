'use strict';
/* Tidslinje, avspiller og fortellertekst */
(() => {
  const W = 1920, H = 1080, $ = s => document.querySelector(s);
  const stage = $('#stage'), cv = $('#sk'), ctx = cv.getContext('2d');
  SK.init(ctx);
  GLR.init($('#gl'));

  const SETS = [PLAN, ROM, VEI, BANE, JAM], CH = [];
  let off = 0;
  SETS.forEach(s => { s.t0 = off; s.chapters.forEach(c => CH.push({ T: off + c.t, title: c.title })); off += s.dur; });
  const TOTAL = off;
  CH.forEach((c, i) => { c.end = i < CH.length - 1 ? CH[i + 1].T : TOTAL; });

  let T = 0, playing = true, speed = 1, last = performance.now(), capKey = null, chIdx = -1;
  const m = /[#&]t=([\d.]+)/.exec(location.hash); if (m) T = Math.min(TOTAL - 0.01, +m[1]);
  if (/paused/.test(location.hash)) playing = false;

  /* ---------- avspiller ---------- */
  const segs = $('#segs'), cap = $('#cap'), title = $('#title'), tip = $('#tip');
  CH.forEach((c, i) => {
    const d = document.createElement('div'); d.className = 'seg'; d.style.flexGrow = c.end - c.T; d.dataset.i = i;
    d.innerHTML = '<i></i>'; segs.appendChild(d); c.el = d; c.fill = d.firstChild;
  });
  const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const timeAt = e => {
    const el = document.elementFromPoint(e.clientX, e.clientY), sg = el && el.closest('.seg');
    if (!sg) return null;
    const c = CH[+sg.dataset.i], r = sg.getBoundingClientRect();
    return { c, t: c.T + SK.clamp((e.clientX - r.left) / r.width) * (c.end - c.T) };
  };
  let drag = false;
  segs.addEventListener('pointerdown', e => { drag = true; const h = timeAt(e); if (h) T = h.t; });
  window.addEventListener('pointerup', () => { drag = false; });
  segs.addEventListener('pointermove', e => {
    const h = timeAt(e);
    if (!h) { tip.style.opacity = 0; return; }
    if (drag) T = h.t;
    const r = segs.getBoundingClientRect();
    tip.textContent = h.c.title; tip.style.opacity = 1;
    tip.style.left = ((e.clientX - r.left) / r.width * 100) + '%';
  });
  segs.addEventListener('pointerleave', () => { tip.style.opacity = 0; });
  const setPlay = p => { playing = p; if (p && T >= TOTAL - 0.05) T = 0; $('#play').classList.toggle('paused', !playing); last = performance.now(); };
  const jump = d => {
    const i = CH.findIndex(c => T < c.end);
    if (d < 0) T = (T - CH[i].T > 2.5 || i === 0) ? CH[i].T : CH[i - 1].T;
    else T = i < CH.length - 1 ? CH[i + 1].T : TOTAL - 0.02;
  };
  $('#play').onclick = () => setPlay(!playing);
  $('#prev').onclick = () => jump(-1);
  $('#next').onclick = () => jump(1);
  $('#spd').onclick = e => { speed = speed === 1 ? 1.5 : speed === 1.5 ? 2 : 1; e.currentTarget.textContent = String(speed).replace('.', ',') + '×'; };
  $('#fs').onclick = () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); };
  window.addEventListener('keydown', e => {
    if (e.code === 'Space') { e.preventDefault(); setPlay(!playing); }
    else if (e.code === 'ArrowRight') T = Math.min(TOTAL - 0.02, T + 5);
    else if (e.code === 'ArrowLeft') T = Math.max(0, T - 5);
    else if (e.code === 'KeyF') $('#fs').onclick();
  });
  const fit = () => { stage.style.transform = `translate(-50%,-50%) scale(${Math.min(innerWidth / W, innerHeight / H)})`; };
  window.addEventListener('resize', fit); fit();
  setPlay(playing);

  /* ---------- bilde for bilde ---------- */
  function render() {
    const s = SETS.find(q => T < q.t0 + q.dur) || SETS[SETS.length - 1], t = T - s.t0;
    let a = 1;
    if (!s.noFadeIn) a *= SK.es(t, 0, 0.9);
    if (!s.noFadeOut) a *= 1 - SK.es(t, s.dur - 0.9, s.dur);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, W, H);
    SK.S.A = a;
    let g = null;
    try { g = s.draw(t) || null; } catch (e) { if (!render.err) { console.error(e); render.err = 1; } ctx.setTransform(1, 0, 0, 1, 0, 0); }
    GLR.render(g);

    /* fortellerteksten smyger seg inn og ut fra høyre */
    const c = s.caps.find(q => t >= q[0] && t < q[1]);
    const key = c ? s.id + c[0] : null;
    if (key !== capKey) { capKey = key; cap.innerHTML = c ? (c[2] ? `<h3>${c[2]}</h3>` : '') + `<p>${c[3]}</p>` : ''; }
    if (c) {
      const i = SK.es(t, c[0], c[0] + 1), o = SK.es(t, c[1] - 0.9, c[1]);
      cap.style.opacity = i * (1 - o);
      cap.style.transform = `translateX(${(1 - i) * 70 + o * 70}px)`;
    }
    title.classList.toggle('intro', T < 13.2);

    const ci = CH.findIndex(q => T < q.end);
    CH.forEach((q, i) => { q.fill.style.width = (i < ci ? 100 : i > ci ? 0 : (T - q.T) / (q.end - q.T) * 100) + '%'; });
    if (ci !== chIdx) { chIdx = ci; $('#chname').textContent = CH[ci].title; CH.forEach((q, i) => q.el.classList.toggle('on', i === ci)); }
    $('#time').textContent = fmt(T) + ' / ' + fmt(TOTAL);
  }
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (playing) { T += dt * speed; if (T >= TOTAL) { T = TOTAL - 0.01; setPlay(false); } }
    render();
    requestAnimationFrame(frame);
  }
  window.GPS = { seek(t) { T = t; render(); }, pause() { setPlay(false); }, play() { setPlay(true); }, get T() { return T; }, TOTAL, CH };
  (document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()).then(() => requestAnimationFrame(frame));
})();
