'use strict';
/* The flat "map world": road, buildings, satellites, car motion and the
   coloured range circles (bands) with highlighted intersections. */

const SCENES = [];
const scene = s => SCENES.push(s);

const MAP = {
  sats: [P(210, 190), P(660, 948), P(1220, 205), P(72, 872)],
  roadCtrl: [P(180, 620), P(360, 420), P(640, 360), P(900, 430), P(1120, 380), P(1268, 520),
    P(1200, 760), P(940, 840), P(640, 800), P(420, 862), P(220, 800)],
  block: { x: 880, y: 268, w: 100, h: 92 },          // concrete office block
  glass: { x: 560, y: 470, w: 340, h: 90 },          // glass tower, north facade at y = 470
  lake: { c: P(665, 652), rx: 98, ry: 52 },
  buildings: [
    { x: 420, y: 486, w: 80, h: 56 }, { x: 990, y: 560, w: 96, h: 62 }, { x: 290, y: 690, w: 74, h: 62 },
    { x: 1060, y: 650, w: 62, h: 72 }, { x: 128, y: 318, w: 62, h: 52 }, { x: 760, y: 190, w: 70, h: 52 },
    { x: 1040, y: 226, w: 58, h: 60 }, { x: 470, y: 920, w: 90, h: 40 }, { x: 1120, y: 890, w: 70, h: 52 },
  ],
  trees: [P(500, 300), P(522, 286), P(540, 306), P(1160, 470), P(1180, 488), P(330, 560), P(312, 580),
    P(820, 720), P(842, 742), P(1300, 680), P(1290, 860), P(240, 470), P(980, 950), P(560, 720), P(1030, 760)],
  road: null,
};

/* ---- road (closed Catmull–Rom loop sampled by arc length) ---- */
(function buildRoad() {
  const c = MAP.roadCtrl, n = c.length, pts = [];
  for (let i = 0; i < n; i++) {
    const p0 = c[(i - 1 + n) % n], p1 = c[i], p2 = c[(i + 1) % n], p3 = c[(i + 2) % n];
    for (let k = 0; k < 40; k++) {
      const t = k / 40, t2 = t * t, t3 = t2 * t;
      pts.push(P(
        0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)));
    }
  }
  pts.push(pts[0]);
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + dist(pts[i - 1], pts[i]));
  MAP.road = { pts, L, total: L[L.length - 1] };
})();

function roadPose(s) {
  const R = MAP.road, tot = R.total;
  s = ((s % tot) + tot) % tot;
  let lo = 0, hi = R.L.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (R.L[m] <= s) lo = m; else hi = m; }
  const k = (s - R.L[lo]) / ((R.L[hi] - R.L[lo]) || 1);
  const p = lerpP(R.pts[lo], R.pts[hi], k);
  const d = nrm(sub(R.pts[hi], R.pts[lo]));
  return { x: p.x, y: p.y, ang: angOf(d), dir: d };
}
function roadNearest(q) {
  const R = MAP.road; let best = 0, bd = 1e9;
  for (let i = 0; i < R.pts.length; i++) { const d = dist(R.pts[i], q); if (d < bd) { bd = d; best = i; } }
  return R.L[best];
}

/* ---- car motion: each road scene integrates its own speed profile; stops happen wherever the car is ---- */
function buildDrives() {
  let s = roadNearest(P(190, 600));
  for (const sc of SCENES) {
    if (!sc.road) continue;
    if (sc.sStart != null) s = typeof sc.sStart === 'function' ? sc.sStart() : sc.sStart;
    const dt = 1 / 30, n = Math.ceil(sc.dur / dt) + 2, tab = new Float64Array(n), vt = new Float32Array(n);
    const prof = t => {
      let stop = 0;
      (sc.stops || []).forEach(([a, b]) => { stop = Math.max(stop, win(t, a, b, 1.1)); });
      return (1 - stop) * (sc.speedFn ? sc.speedFn(t) : 1);
    };
    let speed = sc.speed ?? 55;
    if (sc.stopAt) {
      // choose the speed so the car comes to rest exactly at stopAt – it still just brakes where it is
      let unit = 0; const tStop = sc.stops[0][0] + 1.1;
      for (let t = 0; t < tStop; t += dt) unit += prof(t) * dt;
      const tot = MAP.road.total;
      let need = ((roadNearest(sc.stopAt) - s) % tot + tot) % tot;
      if (need < unit * 25) need += tot;
      speed = need / unit;
    }
    for (let i = 0; i < n; i++) {
      const v = speed * prof(i * dt);
      tab[i] = s; vt[i] = v;
      s += v * dt;
    }
    sc._drive = { tab, vt, dt };
  }
}
function carAt(sc, t) {
  const D = sc._drive, f = clamp(t, 0, sc.dur) / D.dt, i = Math.min(D.tab.length - 2, Math.floor(f)), k = f - i;
  const s = lerp(D.tab[i], D.tab[i + 1], k);
  const pose = roadPose(s);
  pose.s = s; pose.v = lerp(D.vt[i], D.vt[i + 1], k);
  return pose;
}

/* ---- static map, pre-rendered once per resize ---- */
let mapCanvas = null;
function renderMap(k) {
  mapCanvas = document.createElement('canvas');
  mapCanvas.width = 1920 * k; mapCanvas.height = 1080 * k;
  const ctx = mapCanvas.getContext('2d'); ctx.setTransform(k, 0, 0, k, 0, 0);
  const old = Sk.ctx; Sk.ctx = ctx;

  // faint graph paper
  ctx.strokeStyle = 'rgba(80,110,140,.07)'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 40; x < 1400; x += 40) { ctx.moveTo(x, 110); ctx.lineTo(x, 975); }
  for (let y = 120; y < 975; y += 40) { ctx.moveTo(20, y); ctx.lineTo(1400, y); }
  ctx.stroke();

  // lake
  const L = MAP.lake;
  ctx.save(); ctx.fillStyle = 'rgba(141,184,212,.35)';
  ctx.beginPath(); ctx.ellipse(L.c.x, L.c.y, L.rx, L.ry, -0.08, 0, TAU); ctx.fill(); ctx.restore();
  const lakePts = []; for (let i = 0; i <= 80; i++) { const a = i / 80 * TAU + 0.3; lakePts.push(P(L.c.x + Math.cos(a) * L.rx * (1 + 0.05 * noise1(i / 8, 3)), L.c.y + Math.sin(a) * L.ry * (1 + 0.05 * noise1(i / 8, 4)))); }
  Sk.path(lakePts, { color: '#5b8fb0', width: 1.8, alpha: 0.6, seed: 21 });
  for (let i = 0; i < 4; i++) Sk.wave(L.c.x - 50 + (i % 2) * 30, L.c.y - 20 + i * 13, 50, 2, 25, { color: '#5b8fb0', alpha: 0.4, width: 1.2 });

  // road: soft surface, two pencil edges, centre ticks
  const R = MAP.road.pts;
  ctx.save(); ctx.strokeStyle = 'rgba(120,110,95,.13)'; ctx.lineWidth = 32; ctx.lineJoin = 'round';
  ctx.beginPath(); R.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.stroke(); ctx.restore();
  [-16, 16].forEach((off, j) => {
    const e = R.map((p, i) => { const a = R[Math.max(0, i - 1)], b = R[Math.min(R.length - 1, i + 1)]; return add(p, mul(perp(nrm(sub(b, a))), off)); });
    Sk.path(e, { color: COL.pencil, width: 1.5, alpha: 0.55, seed: 30 + j, wobble: 1 });
  });
  for (let s = 0; s < MAP.road.total; s += 30) {
    const a = roadPose(s), b = roadPose(s + 11);
    Sk.line(a, b, { color: COL.pencil, width: 1.2, alpha: 0.35, passes: 1, wobble: 0.2 });
  }

  // buildings
  MAP.buildings.forEach((b, i) => {
    ctx.save(); ctx.fillStyle = 'rgba(160,150,135,.16)'; ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.beginPath(); ctx.rect(b.x, b.y, b.w, b.h); ctx.clip();
    Sk.hatch(b.x, b.y, b.w, b.h, { gap: 8, alpha: 0.22, seed: i, color: COL.pencil });
    ctx.restore();
    Sk.rect(b.x, b.y, b.w, b.h, { color: COL.pencil, width: 1.4, alpha: 0.55, seed: 50 + i, passes: 1 });
  });
  // concrete block
  const B = MAP.block;
  ctx.save(); ctx.fillStyle = 'rgba(120,112,100,.28)'; ctx.fillRect(B.x, B.y, B.w, B.h);
  ctx.beginPath(); ctx.rect(B.x, B.y, B.w, B.h); ctx.clip();
  Sk.hatch(B.x, B.y, B.w, B.h, { gap: 5, alpha: 0.35, seed: 3, color: INK, angle: 0.8 });
  ctx.restore();
  Sk.rect(B.x, B.y, B.w, B.h, { color: INK, width: 2, alpha: 0.7, seed: 61 });
  // glass tower
  const G = MAP.glass;
  ctx.save(); ctx.fillStyle = 'rgba(95,159,196,.22)'; ctx.fillRect(G.x, G.y, G.w, G.h);
  ctx.beginPath(); ctx.rect(G.x, G.y, G.w, G.h); ctx.clip();
  for (let i = 0; i < 9; i++) Sk.line(P(G.x + 20 + i * 40, G.y + G.h + 5), P(G.x + 50 + i * 40, G.y - 5), { color: '#ffffff', width: 3, alpha: 0.7, passes: 1 });
  ctx.restore();
  Sk.rect(G.x, G.y, G.w, G.h, { color: '#3b6f90', width: 2, alpha: 0.8, seed: 62 });
  Sk.line(P(G.x, G.y), P(G.x + G.w, G.y), { color: '#3b6f90', width: 3.2, alpha: 0.85, seed: 63 });

  // trees
  MAP.trees.forEach((t, i) => {
    const r = 9 + hash1(i) * 6;
    ctx.save(); ctx.fillStyle = 'rgba(79,138,60,.16)'; ctx.beginPath(); ctx.arc(t.x, t.y, r, 0, TAU); ctx.fill(); ctx.restore();
    Sk.circle(t, r, { color: COL.green, width: 1.4, alpha: 0.55, seed: 80 + i, over: 0.5, passes: 1 });
  });

  Sk.ctx = old;
}
function drawMap(alpha = 1) {
  if (!mapCanvas || alpha <= 0.004) return;
  const ctx = Sk.ctx; ctx.save(); ctx.globalAlpha = alpha;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(mapCanvas, 0, 0); ctx.restore();
}

/* ---- range bands: soft coloured rings, intersections in a stronger mixed colour ---- */
function ringPath(ctx, c, r, w) {
  ctx.beginPath();
  ctx.arc(c.x, c.y, r + w / 2, 0, TAU, false);
  ctx.moveTo(c.x + Math.max(0, r - w / 2), c.y);
  ctx.arc(c.x, c.y, Math.max(0, r - w / 2), 0, TAU, true);
}
/* items: [{c, r, i (colour index), a (alpha), w (band width)}] */
function drawBands(items, o = {}) {
  const ctx = Sk.ctx;
  items = items.filter(b => b.a > 0.004 && b.r > 1);
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  items.forEach(b => {
    ctx.globalAlpha = 0.26 * b.a * (o.fill ?? 1); ctx.fillStyle = COL.s[b.i];
    ringPath(ctx, b.c, b.r, b.w || 16); ctx.fill();
  });
  ctx.restore();
  if (o.cross !== false) {
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) {
      const A = items[i], B = items[j];
      ctx.save(); ringPath(ctx, A.c, A.r, A.w || 16); ctx.clip();
      ctx.globalAlpha = 0.9 * Math.min(A.a, B.a) * (o.cross ?? 1);
      ctx.fillStyle = mixHex([COL.s[A.i], COL.s[B.i]], 0.78);
      ringPath(ctx, B.c, B.r, B.w || 16); ctx.fill(); ctx.restore();
      for (let k = j + 1; k < items.length; k++) {
        const C = items[k];
        ctx.save();
        ringPath(ctx, A.c, A.r, A.w || 16); ctx.clip();
        ringPath(ctx, B.c, B.r, B.w || 16); ctx.clip();
        ctx.globalAlpha = 0.95 * Math.min(A.a, B.a, C.a) * (o.cross ?? 1);
        ctx.fillStyle = mixHex([COL.s[A.i], COL.s[B.i], COL.s[C.i]], 0.5);
        ringPath(ctx, C.c, C.r, C.w || 16); ctx.fill(); ctx.restore();
      }
    }
  }
  items.forEach(b => Sk.circle(b.c, b.r, { color: mixHex([COL.s[b.i]], 0.8), width: 2.1, alpha: 0.85 * b.a, seed: 100 + b.i * 7, wobble: 0.9 }));
}

function markPoint(p, colA, colB, a, seed = 1) {
  if (a <= 0.004) return;
  Sk.circle(p, 11, { color: mixHex([colA, colB], 0.7), width: 2.2, alpha: a, seed, over: 0.5 });
  Sk.dot(p, 3.2, mixHex([colA, colB], 0.6), a);
}

/* satellite flying in along a gentle curve */
function satFly(i, t, t0, t1, pts = MAP.sats, centre = P(700, 560)) {
  const to = pts[i];
  const from = add(to, mul(nrm(sub(to, centre)), 650));
  const k = es(t, t0, t1);
  const base = lerpP(from, to, k), off = perp(nrm(sub(to, from)));
  return add(base, mul(off, Math.sin(k * Math.PI) * 110));
}
function drawSat(i, p, a, o = {}) {
  Sk.satIcon(p, { color: COL.s[i], alpha: a, scale: o.scale || 0.8, label: o.label === false ? null : 'S' + '₁₂₃₄'[i], rot: o.rot });
}

/* label at the middle of a segment, pushed off the line */
function segLabel(a, b, str, o = {}) {
  const m = lerpP(a, b, o.at ?? 0.5), n = perp(nrm(sub(b, a)));
  const side = o.side ?? 1;
  Sk.text(str, m.x + n.x * 22 * side, m.y + n.y * 22 * side, { align: 'center', size: 30, weight: 700, ...o });
}

/* ghost car marker */
function ghostCar(p, ang, a, color = INK, q = '?') {
  if (a <= 0.004) return;
  Sk.carTop(p, ang, { ghost: true, alpha: a, ghostColor: color });
  if (q) Sk.text(q, p.x + 22, p.y - 26, { size: 34, weight: 700, color, alpha: a });
}

/* expanding signal ring (one clean ring, no pulsing) */
function signalRing(c, r, i, t, t0, t1) {
  if (t < t0 || t > t1 + 0.8) return;
  const k = es(t, t0, t1), a = 1 - seg(t, t1, t1 + 0.8);
  Sk.circle(c, r * k, { color: COL.s[i], width: 3, alpha: 0.85 * a, seed: 200 + i });
  if (k < 0.97) {
    const p = polar(c, r * k, -0.6);
    Sk.text('c ≈ 300 000 km/s', p.x + 10, p.y - 14, { size: 24, color: mixHex([COL.s[i]], 0.7), alpha: a * (1 - seg(k, 0.8, 0.97)) });
  }
}
