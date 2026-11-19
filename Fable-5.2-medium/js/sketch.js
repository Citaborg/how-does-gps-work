'use strict';
/* Håndtegnet strek: blyant, fargestift og små ikoner på canvas. */
const SK = (() => {
  let ctx = null;
  const TAU = Math.PI * 2;
  const C = {
    INK: '#2f2c36', PAPER: '#f6f0e1', GREY: '#9a96a0',
    RED: '#e2463a', BLUE: '#2c7bd4', YEL: '#eea512', GRN: '#3d9f58', VIO: '#8756c9'
  };
  const HAND = '"Caveat","Segoe Print","Bradley Hand",cursive';
  const S = { A: 1 };

  const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
  const seg = (t, a, b) => clamp((t - a) / (b - a));
  const ease = x => { x = clamp(x); return x * x * (3 - 2 * x); };
  const es = (t, a, b) => ease(seg(t, a, b));
  const lerp = (a, b, u) => a + (b - a) * u;
  const win = (t, a, b, f = 0.8) => es(t, a, a + f) * (1 - es(t, b - f, b));

  function hash(n) {
    n = Math.imul(n ^ (n >>> 15), 2246822519);
    n = Math.imul(n ^ (n >>> 13), 3266489917);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  }
  function noise(seed, x) {
    const i = Math.floor(x), f = x - i;
    const a = hash(seed * 7919 + i), b = hash(seed * 7919 + i + 1);
    return (a + (b - a) * f * f * (3 - 2 * f)) * 2 - 1;
  }
  /* nøkkelbilder med myk overgang */
  function kf(t, keys) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (t < keys[i][0]) {
        const a = keys[i - 1], b = keys[i];
        return a[1] + (b[1] - a[1]) * ease((t - a[0]) / (b[0] - a[0]));
      }
    }
    return keys[keys.length - 1][1];
  }
  /* fartsprofil (lineær mellom nøkler) -> posisjon */
  function integ(keys, dur, step = 0.05) {
    const n = Math.ceil(dur / step) + 3, tab = new Float32Array(n);
    const v = t => {
      if (t <= keys[0][0]) return keys[0][1];
      for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) {
        const a = keys[i - 1], b = keys[i];
        return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]);
      }
      return keys[keys.length - 1][1];
    };
    let x = 0;
    for (let i = 1; i < n; i++) { x += v((i - 0.5) * step) * step; tab[i] = x; }
    const pos = t => {
      const u = clamp(t / step, 0, n - 1.001), i = Math.floor(u);
      return tab[i] + (tab[i + 1] - tab[i]) * (u - i);
    };
    pos.v = v;
    return pos;
  }

  /* ---------- punktlister ---------- */
  const linePts = (x1, y1, x2, y2, step = 9) => {
    const n = Math.max(2, Math.ceil(Math.hypot(x2 - x1, y2 - y1) / step)), r = [];
    for (let i = 0; i <= n; i++) r.push([lerp(x1, x2, i / n), lerp(y1, y2, i / n)]);
    return r;
  };
  const arcPts = (cx, cy, r, a0, a1) => {
    const n = Math.max(8, Math.ceil(Math.abs(a1 - a0) * r / 9)), p = [];
    for (let i = 0; i <= n; i++) { const a = lerp(a0, a1, i / n); p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return p;
  };
  const polyPts = (v, closed) => {
    let r = [];
    const m = closed ? v.length : v.length - 1;
    for (let i = 0; i < m; i++) {
      const a = v[i], b = v[(i + 1) % v.length];
      const l = linePts(a[0], a[1], b[0], b[1], 7);
      if (i) l.shift();
      r = r.concat(l);
    }
    return r;
  };

  /* ---------- strek ---------- */
  function stroke(pts, o = {}) {
    const prog = o.prog === undefined ? 1 : o.prog, n = pts.length;
    if (prog <= 0 || n < 2) return;
    const a = (o.a === undefined ? 1 : o.a) * S.A;
    if (a <= 0.004) return;
    const L = new Array(n); L[0] = 0;
    for (let i = 1; i < n; i++) L[i] = L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const maxL = L[n - 1] * Math.min(1, prog);
    const rough = o.rough === undefined ? 1.4 : o.rough;
    const seed = (o.seed | 0) + 1, passes = o.passes || 2, w = o.w || 2.4, off = o.off || 0;
    ctx.save();
    if (o.mul) ctx.globalCompositeOperation = 'multiply';
    ctx.strokeStyle = o.color || C.INK; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let p = 0; p < passes; p++) {
      ctx.globalAlpha = clamp(a * (p === 0 ? 0.92 : 0.5));
      ctx.lineWidth = w * (p === 0 ? 1 : 0.65);
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        let x = pts[i][0], y = pts[i][1], l = L[i], last = false;
        if (l > maxL) {
          const u = (maxL - L[i - 1]) / ((l - L[i - 1]) || 1);
          x = lerp(pts[i - 1][0], x, u); y = lerp(pts[i - 1][1], y, u); l = maxL; last = true;
        }
        const pa = pts[i > 0 ? i - 1 : 0], pb = pts[i < n - 1 ? i + 1 : n - 1];
        const nx = -(pb[1] - pa[1]), ny = pb[0] - pa[0], nl = Math.hypot(nx, ny) || 1;
        const d = rough * (noise(seed + p * 57, l / 42) + 0.3 * noise(seed + p * 57 + 11, l / 11)) + off;
        x += nx / nl * d; y += ny / nl * d;
        if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        if (last) break;
      }
      ctx.stroke();
    }
    ctx.restore();
  }
  /* fargestift: tre overlappende strøk som blander seg */
  function crayon(pts, o = {}) {
    const w = o.w || 7, a = o.a === undefined ? 1 : o.a;
    for (let k = -1; k <= 1; k++) {
      stroke(pts, Object.assign({}, o, {
        w: w * 0.52, off: k * w * 0.27, seed: (o.seed | 0) + k * 13 + 40, passes: 1,
        a: a * 0.66, rough: (o.rough === undefined ? 1.1 : o.rough) + 0.5, mul: o.mul !== false
      }));
    }
  }
  const line = (x1, y1, x2, y2, o) => stroke(linePts(x1, y1, x2, y2), o);
  const cline = (x1, y1, x2, y2, o) => crayon(linePts(x1, y1, x2, y2), o);
  const circle = (cx, cy, r, o = {}) => { const s = o.start || 0.4; stroke(arcPts(cx, cy, r, s, s + TAU * 1.015), o); };
  const ring = (cx, cy, r, o = {}) => { const s = o.start || 0.4; crayon(arcPts(cx, cy, r, s, s + TAU), o); };

  function path(pts) { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); }
  function fill(pts, color, a = 1, mul) {
    if (a * S.A <= 0.004) return;
    ctx.save(); if (mul) ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = clamp(a * S.A); ctx.fillStyle = color; path(pts); ctx.fill(); ctx.restore();
  }
  function disc(x, y, r, color, a = 1, mul) {
    if (a * S.A <= 0.004 || r <= 0) return;
    ctx.save(); if (mul) ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = clamp(a * S.A); ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore();
  }
  /* skravering med fargestift inni en mangekant */
  function hatch(pts, o = {}) {
    const a = o.a === undefined ? 0.6 : o.a;
    if (a * S.A <= 0.004) return;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const p of pts) { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.hypot(x1 - x0, y1 - y0) / 2 + 4;
    const gap = o.gap || 7, ang = o.ang === undefined ? -0.6 : o.ang, ca = Math.cos(ang), sa = Math.sin(ang);
    fill(pts, o.color, (o.base === undefined ? 0.22 : o.base) * a / 0.6, true);
    ctx.save(); path(pts); ctx.clip();
    let k = 0;
    for (let d = -R; d <= R; d += gap, k++) {
      const px = cx - sa * d, py = cy + ca * d;
      stroke(linePts(px - ca * R, py - sa * R, px + ca * R, py + sa * R, 16),
        { color: o.color, w: gap * 0.72, passes: 1, a, rough: 1.3, seed: (o.seed | 0) + k * 3, mul: true });
    }
    ctx.restore();
  }
  const hatchCircle = (cx, cy, r, o) => hatch(arcPts(cx, cy, r, 0, TAU), o);

  function text(str, x, y, o = {}) {
    const a = (o.a === undefined ? 1 : o.a) * S.A;
    if (a <= 0.004) return;
    let s = str;
    if (o.prog !== undefined) { if (o.prog <= 0) return; s = str.slice(0, Math.ceil(str.length * clamp(o.prog))); }
    ctx.save(); ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot);
    ctx.font = `${o.weight || 700} ${o.size || 36}px ${o.font || HAND}`;
    ctx.textBaseline = 'middle';
    let dx = 0; const al = o.align || 'left';
    if (al !== 'left') { const w = ctx.measureText(str).width; dx = al === 'center' ? -w / 2 : -w; }
    ctx.textAlign = 'left';
    if (o.halo !== false) {
      ctx.globalAlpha = clamp(a * 0.9); ctx.lineWidth = o.haloW || 8; ctx.lineJoin = 'round';
      ctx.strokeStyle = C.PAPER; ctx.strokeText(s, dx, 0);
    }
    ctx.globalAlpha = clamp(a); ctx.fillStyle = o.color || C.INK; ctx.fillText(s, dx, 0);
    ctx.restore();
  }
  function arrow(x1, y1, x2, y2, o = {}) {
    const prog = o.prog === undefined ? 1 : o.prog; if (prog <= 0) return;
    line(x1, y1, x2, y2, o);
    if (prog < 0.95) return;
    const a = Math.atan2(y2 - y1, x2 - x1), h = o.head || 16;
    for (const s of [-1, 1]) line(x2, y2, x2 - h * Math.cos(a + s * 0.42), y2 - h * Math.sin(a + s * 0.42), Object.assign({}, o, { prog: 1, seed: (o.seed | 0) + s }));
  }
  function cross(x, y, r, o = {}) {
    const p = o.prog === undefined ? 1 : o.prog;
    line(x - r, y - r, x + r, y + r, Object.assign({ w: 4, color: C.INK }, o, { prog: clamp(p * 2) }));
    line(x + r, y - r, x - r, y + r, Object.assign({ w: 4, color: C.INK }, o, { prog: clamp(p * 2 - 1), seed: (o.seed | 0) + 5 }));
  }
  /* tydelig markering av et skjæringspunkt */
  function mark(x, y, o = {}) {
    const r = o.r || 9, a = o.a === undefined ? 1 : o.a;
    disc(x, y, r, o.color || C.INK, a);
    circle(x, y, r + 8, { w: 2.2, a, seed: o.seed, color: o.color || C.INK, rough: 0.9 });
  }
  function angle(cx, cy, r, a0, a1, o = {}) {
    stroke(arcPts(cx, cy, r, a0, a1), Object.assign({ w: 2.2, rough: 0.7 }, o));
    if (o.label) { const m = (a0 + a1) / 2; text(o.label, cx + (r + 20) * Math.cos(m), cy + (r + 20) * Math.sin(m), { size: o.size || 30, align: 'center', color: o.color, a: o.a, prog: o.prog === undefined ? 1 : (o.prog > 0.9 ? 1 : 0) }); }
  }
  function al(a, fn) { if (a <= 0.004) return; const old = S.A; S.A = old * a; fn(); S.A = old; }
  function tf(x, y, s, rot, fn) { ctx.save(); ctx.translate(x, y); if (rot) ctx.rotate(rot); ctx.scale(s, s); fn(); ctx.restore(); }

  /* ---------- ikoner ---------- */
  function sat(x, y, s, o = {}) {
    const col = o.color || C.GREY, sd = o.seed || 0;
    tf(x, y, s, o.rot || 0, () => {
      const pl = [[-52, -11], [-16, -11], [-16, 11], [-52, 11]];
      for (const k of [-1, 1]) {
        const p = pl.map(q => [q[0] * -k, q[1]]);
        fill(p, C.PAPER, 1); hatch(p, { color: col, gap: 5, ang: 0.9, seed: sd + k * 5, a: 0.8 });
        stroke(polyPts(p, true), { w: 2.2, seed: sd + k + 2 });
        line(k * 28, -11, k * 28, 11, { w: 1.5, seed: sd + 8 }); line(k * 40, -11, k * 40, 11, { w: 1.5, seed: sd + 9 });
      }
      const b = [[-14, -16], [14, -16], [14, 16], [-14, 16]];
      fill(b, C.PAPER, 1); hatch(b, { color: C.GREY, gap: 5, ang: -0.7, a: 0.5, seed: sd + 20 });
      stroke(polyPts(b, true), { w: 2.6, seed: sd + 21 });
      line(0, 16, 0, 27, { w: 2.2, seed: sd + 22 });
      stroke(arcPts(0, 36, 10, Math.PI * 1.15, Math.PI * 1.85), { w: 2.4, seed: sd + 23 });
    });
  }
  function car(x, y, s, o = {}) {
    const col = o.color || C.RED, g = o.ghost;
    tf(x, y, s, o.rot || 0, () => {
      const body = [[-56, -13], [-56, -29], [-40, -32], [-25, -50], [17, -50], [34, -32], [53, -28], [56, -13]];
      if (!g) { fill(body, C.PAPER, 1); hatch(body, { color: col, gap: 5, ang: -0.5, a: 0.8, base: 0.3, seed: 70 }); }
      stroke(polyPts(body, true), { w: 2.8, seed: 71, color: g ? col : C.INK });
      const w1 = [[-21, -45], [-3, -45], [-3, -33], [-31, -33]], w2 = [[3, -45], [14, -45], [26, -33], [3, -33]];
      for (const w of [w1, w2]) { if (!g) fill(w, C.PAPER, 1); stroke(polyPts(w, true), { w: 1.8, seed: 72, color: g ? col : C.INK }); }
      if (o.antenna !== false) { line(-4, -50, -4, -60, { w: 2.2, seed: 73, color: g ? col : C.INK }); if (!g) disc(-4, -60, 3.5, C.INK); }
      for (const wx of [-31, 31]) {
        if (!g) disc(wx, -11, 12, C.PAPER, 1);
        circle(wx, -11, 10.5, { w: 3.2, seed: 74 + wx, rough: 0.6, color: g ? col : C.INK });
        if (!g) for (let k = 0; k < 2; k++) {
          const a = (o.wheel || 0) + k * Math.PI / 2;
          line(wx - 8 * Math.cos(a), -11 - 8 * Math.sin(a), wx + 8 * Math.cos(a), -11 + 8 * Math.sin(a), { w: 1.5, passes: 1, rough: 0.3 });
        }
      }
    });
  }
  function tree(x, y, s, seed = 0) {
    tf(x, y, s, 0, () => {
      line(0, 0, 0, -34, { w: 3, seed, color: '#7a5a3c' });
      hatchCircle(0, -52, 24, { color: C.GRN, gap: 6, ang: 0.7, a: 0.6, seed });
      circle(0, -52, 24, { w: 2, seed: seed + 3, rough: 2.2 });
    });
  }
  function dish(x, y, s, rot, o = {}) {
    tf(x, y, s, rot, () => {
      const base = [[-12, 0], [12, 0], [3, -22], [-3, -22]];
      fill(base, C.PAPER, 1); stroke(polyPts(base, true), { w: 2.2, seed: o.seed });
      tf(0, -26, 1, o.aim || 0, () => {
        stroke(arcPts(0, -22, 22, Math.PI * 0.12, Math.PI * 0.88), { w: 3, seed: (o.seed | 0) + 2, color: o.color || C.INK });
        line(0, 0, 0, -16, { w: 1.8, seed: (o.seed | 0) + 3 });
        disc(0, -17, 3, o.color || C.INK);
      });
    });
  }
  function building(x, gy, w, h, o = {}) {
    const p = [[x, gy], [x, gy - h], [x + w, gy - h], [x + w, gy]];
    fill(p, C.PAPER, o.solid === undefined ? 1 : o.solid);
    const col = o.glass ? '#5fb4d8' : (o.color || C.GREY);
    hatch(p, { color: col, gap: o.glass ? 9 : 7, ang: o.glass ? -0.95 : 0.2, a: o.glass ? 0.55 : 0.5, seed: o.seed });
    stroke(polyPts(p, true), { w: 2.8, seed: (o.seed | 0) + 1 });
    const cols = Math.max(2, Math.round(w / 55)), rows = Math.max(2, Math.round(h / 62));
    if (o.glass) {
      for (let i = 1; i < cols; i++) line(x + w * i / cols, gy - h, x + w * i / cols, gy, { w: 1.3, passes: 1, a: 0.6, seed: i });
      for (let j = 1; j < rows; j++) line(x, gy - h * j / rows, x + w, gy - h * j / rows, { w: 1.3, passes: 1, a: 0.6, seed: j + 30 });
    } else if (o.windows !== false) {
      for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
        const wx = x + w * (i + 0.5) / cols, wy = gy - h * (j + 0.55) / rows;
        const q = [[wx - 9, wy - 12], [wx + 9, wy - 12], [wx + 9, wy + 10], [wx - 9, wy + 10]];
        fill(q, C.PAPER, 0.9); stroke(polyPts(q, true), { w: 1.4, passes: 1, seed: i * 7 + j });
      }
    }
  }
  function clock(x, y, r, hand, o = {}) {
    disc(x, y, r, C.PAPER, 1);
    circle(x, y, r, { w: 2.8, seed: o.seed, color: o.color || C.INK, rough: 0.9 });
    for (let k = 0; k < 12; k++) { const a = k * TAU / 12; line(x + r * 0.8 * Math.cos(a), y + r * 0.8 * Math.sin(a), x + r * 0.93 * Math.cos(a), y + r * 0.93 * Math.sin(a), { w: 1.6, passes: 1, rough: 0.2 }); }
    line(x, y, x + r * 0.7 * Math.sin(hand), y - r * 0.7 * Math.cos(hand), { w: 2.6, rough: 0.3, color: o.color || C.INK });
    line(x, y, x + r * 0.45 * Math.sin(hand / 12 + 1), y - r * 0.45 * Math.cos(hand / 12 + 1), { w: 3, rough: 0.3 });
  }
  function sun(x, y, r, t = 0) {
    hatchCircle(x, y, r, { color: C.YEL, gap: 6, ang: 0.5, a: 0.8 });
    circle(x, y, r, { w: 2.2, rough: 1.5, color: '#b97d0c' });
    for (let k = 0; k < 10; k++) { const a = k * TAU / 10 + t * 0.1; line(x + (r + 9) * Math.cos(a), y + (r + 9) * Math.sin(a), x + (r + 26) * Math.cos(a), y + (r + 26) * Math.sin(a), { w: 2.4, color: '#d8960f', seed: k }); }
  }
  /* sirkel–sirkel-skjæring */
  function cc(a, ra, b, rb) {
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy);
    if (d > ra + rb || d < Math.abs(ra - rb) || d === 0) return null;
    const x = (ra * ra - rb * rb + d * d) / (2 * d), h = Math.sqrt(Math.max(0, ra * ra - x * x));
    const mx = a[0] + dx / d * x, my = a[1] + dy / d * x;
    return [[mx - dy / d * h, my + dx / d * h], [mx + dy / d * h, my - dx / d * h]];
  }
  const near = (pts, p) => (!pts ? p : (Math.hypot(pts[0][0] - p[0], pts[0][1] - p[1]) < Math.hypot(pts[1][0] - p[0], pts[1][1] - p[1]) ? pts[0] : pts[1]));
  const far = (pts, p) => (!pts ? p : (near(pts, p) === pts[0] ? pts[1] : pts[0]));
  const nb = (x, d = 2) => x.toFixed(d).replace('.', ',');

  return {
    init(c) { ctx = c; }, get ctx() { return ctx; },
    C, S, TAU, HAND, clamp, seg, ease, es, lerp, win, kf, integ, noise, hash,
    linePts, arcPts, polyPts, stroke, crayon, line, cline, circle, ring, fill, disc, hatch, hatchCircle,
    text, arrow, cross, mark, angle, al, tf, sat, car, tree, dish, building, clock, sun, cc, near, far, nb
  };
})();
