/* engine.js — én sammenhengende tidslinje: kapitler, kryssfading, forteller, kontroller */
const Engine = (() => {
  const W = 1920, H = 1080, XF = 1.3; // kryssfading i sekunder
  const chapters = []; let total = 0;
  let T = 0, playing = false, last = 0, started = false;
  const stage = document.getElementById('stage');
  const paper = document.getElementById('paper');
  const glc = document.getElementById('gl');
  const ctx = paper.getContext('2d');
  const layers = [0, 1].map(() => { const c = document.createElement('canvas'); c.width = W; c.height = H; return { c, ctx: c.getContext('2d'), rc: rough.canvas(c) }; });
  let paperTex = null;
  const listeners = { seek: [] };

  // ---- papir --------------------------------------------------------------
  function makePaper() {
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
    g.fillStyle = Sketch.COL.paper; g.fillRect(0, 0, W, H);
    const img = g.getImageData(0, 0, W, H), d = img.data;
    for (let i = 0; i < d.length; i += 4) { const n = (Math.random() - 0.5) * 12; d[i] += n; d[i + 1] += n; d[i + 2] += n * 0.8; }
    g.putImageData(img, 0, 0);
    const v = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, H * 1.05);
    v.addColorStop(0, 'rgba(60,40,20,0)'); v.addColorStop(1, 'rgba(60,40,20,0.10)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
    return c;
  }

  // ---- registrering --------------------------------------------------------
  function register(ch) { chapters.push(ch); return ch; }
  function finalize() {
    let off = 0; for (const ch of chapters) { ch.start = off; off += ch.dur; } total = off;
    paperTex = makePaper(); buildControls(); collectNarration(); layoutStage();
    window.addEventListener('resize', layoutStage);
    requestAnimationFrame(frame);
  }
  function layoutStage() {
    const s = Math.min(window.innerWidth / W, window.innerHeight / H);
    stage.style.transform = `translate(-50%,-50%) scale(${s})`;
  }
  function chapterIndex(t) { let i = 0; while (i < chapters.length - 1 && t >= chapters[i + 1].start) i++; return i; }

  // ---- avspilling ------------------------------------------------------------
  function play() { playing = true; if (T >= total - 0.05) T = 0; updatePlayBtn(); }
  function pause() { playing = false; updatePlayBtn(); }
  function toggle() { playing ? pause() : play(); }
  function seek(t) { T = Sketch.clamp(t, 0, total - 0.01); listeners.seek.forEach(f => f(T)); renderNow(); }
  function seekChapter(i) { i = Sketch.clamp(i, 0, chapters.length - 1); seek(chapters[i].start); play(); }
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.1); last = now;
    if (playing) { T += dt; if (T >= total) { T = total - 0.01; pause(); } }
    renderNow(); requestAnimationFrame(frame);
  }
  function drawChapter(ch, t, L) {
    L.ctx.setTransform(1, 0, 0, 1, 0, 0); L.ctx.globalAlpha = 1; L.ctx.globalCompositeOperation = 'source-over';
    L.ctx.clearRect(0, 0, W, H);
    return ch.draw(L.ctx, L.rc, t, T) || null;
  }
  function renderNow() {
    const i = chapterIndex(T), ch = chapters[i], t = T - ch.start;
    const prev = chapters[i - 1];
    const crossing = !!prev && t < XF && prev.group !== ch.group;
    const k = crossing ? Sketch.ease(t / XF) : 1;
    let glA = ch.uses3d ? 1 : 0;
    if (crossing) glA = (ch.uses3d ? k : 0) + (prev.uses3d ? 1 - k : 0);
    if (!crossing && prev && prev.group === ch.group && prev.uses3d !== ch.uses3d) glA = ch.uses3d ? 1 : 0;

    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, W, H);
    ctx.globalAlpha = 1 - glA; ctx.drawImage(paperTex, 0, 0); ctx.globalAlpha = 1;
    glc.style.opacity = glA.toFixed(3);

    let scene = null;
    if (crossing) {
      const s = drawChapter(prev, prev.dur + t, layers[0]);
      if (prev.uses3d) scene = s;
      ctx.globalAlpha = 1 - k; ctx.drawImage(layers[0].c, 0, 0);
    }
    const s2 = drawChapter(ch, t, layers[1]);
    if (ch.uses3d) scene = s2;
    ctx.globalAlpha = crossing ? k : 1; ctx.drawImage(layers[1].c, 0, 0); ctx.globalAlpha = 1;
    if (glA > 0 && scene) GL3D.render(scene, T);

    updateNarration(); updateProgress(i);
    document.getElementById('title-block').classList.toggle('dim', !!ch.dimTitle);
  }

  // ---- forteller (høyre kant) ------------------------------------------------
  let caps = [], shownId = null;
  const narr = document.getElementById('narration');
  function collectNarration() {
    caps = [];
    chapters.forEach((ch, ci) => {
      (ch.narration || []).forEach((n, ni) => {
        const next = ch.narration[ni + 1];
        const end = ch.start + (n.d !== undefined ? n.t + n.d : (next ? next.t - 0.5 : ch.dur - 0.3));
        caps.push({ id: `${ci}-${ni}`, start: ch.start + n.t, end, html: n.text });
      });
    });
  }
  function updateNarration() {
    const cur = caps.find(c => T >= c.start && T < c.end);
    const id = cur ? cur.id : null;
    if (id === shownId) return;
    shownId = id;
    for (const el of narr.querySelectorAll('.cap.in')) { el.classList.remove('in'); el.classList.add('out'); setTimeout(() => el.remove(), 1000); }
    if (cur) {
      const el = document.createElement('div'); el.className = 'cap'; el.innerHTML = cur.html; narr.appendChild(el);
      setTimeout(() => el.classList.add('in'), 30);
    }
  }

  // ---- kontroller ------------------------------------------------------------
  const $ = id => document.getElementById(id);
  let idleTimer = null;
  function buildControls() {
    const cc = $('chapters'); cc.innerHTML = '';
    chapters.forEach((ch, i) => {
      if (ch.hidden) return;
      const b = document.createElement('button'); b.textContent = ch.short || ch.title; b.title = ch.title; b.dataset.i = i;
      b.addEventListener('click', () => seekChapter(i)); cc.appendChild(b);
    });
    const marks = $('bar-marks'); marks.innerHTML = '';
    chapters.forEach((ch, i) => { if (i === 0) return; const s = document.createElement('span'); s.style.left = (ch.start / total * 100) + '%'; marks.appendChild(s); });
    $('btn-play').addEventListener('click', toggle);
    $('btn-prev').addEventListener('click', () => { const i = chapterIndex(T); seekChapter(T - chapters[i].start > 3 ? i : i - 1); });
    $('btn-next').addEventListener('click', () => seekChapter(chapterIndex(T) + 1));
    $('btn-fs').addEventListener('click', () => { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); });
    const bar = $('bar');
    const seekFromEvent = e => { const r = bar.getBoundingClientRect(); seek((e.clientX - r.left) / r.width * total); };
    let dragging = false;
    bar.addEventListener('pointerdown', e => { dragging = true; bar.setPointerCapture(e.pointerId); seekFromEvent(e); });
    bar.addEventListener('pointermove', e => { if (dragging) seekFromEvent(e); });
    bar.addEventListener('pointerup', () => dragging = false);
    $('btn-start').addEventListener('click', start);
    window.addEventListener('keydown', e => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') { e.preventDefault(); started ? toggle() : start(); }
      else if (e.code === 'ArrowRight') seek(T + 5); else if (e.code === 'ArrowLeft') seek(T - 5);
      else if (e.code === 'PageDown') seekChapter(chapterIndex(T) + 1); else if (e.code === 'PageUp') seekChapter(chapterIndex(T) - 1);
      else if (e.key === 'f' || e.key === 'F') $('btn-fs').click();
    });
    const wake = () => { $('controls').classList.remove('idle'); clearTimeout(idleTimer); idleTimer = setTimeout(() => { if (playing) $('controls').classList.add('idle'); }, 3500); };
    window.addEventListener('pointermove', wake); wake();
  }
  function start() { started = true; $('start-overlay').classList.add('hidden'); play(); }
  function updatePlayBtn() { $('btn-play').innerHTML = playing ? '&#10074;&#10074;' : '&#9654;'; }
  const fmt = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  let lastProgress = -1;
  function updateProgress(ci) {
    const p = T / total; $('bar-fill').style.width = (p * 100) + '%'; $('bar-knob').style.left = (p * 100) + '%';
    if (Math.floor(T) !== lastProgress) { lastProgress = Math.floor(T); $('time').textContent = `${fmt(T)} / ${fmt(total)}`; }
    for (const b of $('chapters').children) { const i = +b.dataset.i; b.classList.toggle('active', i === ci); b.classList.toggle('done', i < ci); }
  }

  return { register, finalize, play, pause, seek, seekChapter, get T() { return T; }, get total() { return total; }, chapters, W, H, on: (ev, f) => listeners[ev].push(f) };
})();
