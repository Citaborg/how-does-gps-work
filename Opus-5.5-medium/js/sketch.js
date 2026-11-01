'use strict';
/* Hand-drawn primitives: pencil / crayon strokes on canvas.
   Everything is deterministic (seeded noise) so strokes never flicker. */

const INK = '#2b2833';
const PAPER = '#f5efe3';
const HAND = '"Caveat", "Segoe Print", "Comic Sans MS", cursive';

const COL = {
  ink: INK,
  pencil: '#5d574f',
  s: ['#e0533d', '#2f7fd0', '#1d9b68', '#d4921a'], // satellite colours
  red: '#c8372d',
  glass: '#5f9fc4',
  green: '#4f8a3c',
  water: '#8db8d4',
};

const Sk = {
  ctx: null,

  /* polyline with wobble, multiple passes, optional draw-on progress */
  path(pts, o = {}) {
    const ctx = this.ctx, n = pts.length;
    const prog = o.progress ?? 1, alpha = o.alpha ?? 0.9;
    if (n < 2 || prog <= 0 || alpha <= 0.004) return;
    const color = o.color || INK, w = o.width || 2.2, seed = o.seed || 1;
    const wob = o.wobble ?? 1.3, passes = o.passes ?? 2;
    const L = new Float32Array(n);
    for (let i = 1; i < n; i++) L[i] = L[i - 1] + dist(pts[i - 1], pts[i]);
    const total = L[n - 1] * prog;
    ctx.save();
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = color;
    if (o.comp) ctx.globalCompositeOperation = o.comp;
    for (let p = 0; p < passes; p++) {
      ctx.globalAlpha = alpha * (p === 0 ? 0.88 : 0.42);
      ctx.lineWidth = w * (p === 0 ? 1 : 0.62);
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        let q = pts[i], s = L[i];
        if (s > total) {
          const k = (total - L[i - 1]) / ((L[i] - L[i - 1]) || 1);
          q = lerpP(pts[i - 1], q, k); s = total;
        }
        const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
        const nn = perp(nrm(sub(b, a)));
        const off = wob * (noise1(s / 75 + p * 3.3, seed) + 0.3 * noise1(s / 14 + p * 7.7, seed + 5))
          + (p ? 0.9 * noise1(s / 33, seed + p * 11) : 0);
        const x = q.x + nn.x * off, y = q.y + nn.y * off;
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        if (s >= total) break;
      }
      ctx.stroke();
    }
    ctx.restore();
  },

  linePts(a, b, step = 10) {
    const n = Math.max(2, Math.ceil(dist(a, b) / step)), pts = [];
    for (let i = 0; i <= n; i++) pts.push(lerpP(a, b, i / n));
    return pts;
  },
  line(a, b, o = {}) { this.path(this.linePts(a, b), o); },

  circlePts(c, r, seed = 1, over = 0.2, a0) {
    const N = Math.min(260, Math.max(36, Math.round(r * 0.55)));
    const start = a0 ?? hash1(seed * 3.1) * TAU, sweep = TAU + over, pts = [];
    const wob = Math.min(r * 0.01, 2.6);
    for (let i = 0; i <= N; i++) {
      const k = i / N, a = start + sweep * k;
      const rr = r + wob * noise1(k * 5, seed) + (k - 0.5) * wob * 0.8;
      pts.push(P(c.x + Math.cos(a) * rr, c.y + Math.sin(a) * rr));
    }
    return pts;
  },
  circle(c, r, o = {}) { if (r > 0.5) this.path(this.circlePts(c, r, o.seed || 1, o.over ?? 0.2, o.a0), o); },

  arcPts(c, r, a0, a1, n) {
    n = n || Math.max(8, Math.ceil(Math.abs(a1 - a0) * r / 8));
    const pts = [];
    for (let i = 0; i <= n; i++) pts.push(polar(c, r, lerp(a0, a1, i / n)));
    return pts;
  },
  arc(c, r, a0, a1, o = {}) { this.path(this.arcPts(c, r, a0, a1), o); },

  poly(pts, o = {}) {
    const q = [];
    for (let i = 0; i < pts.length; i++) q.push(...this.linePts(pts[i], pts[(i + 1) % pts.length], o.step || 9).slice(i ? 1 : 0));
    q.push(lerpP(pts[0], pts[1], 0.12)); // slight overshoot like a real hand
    this.path(q, o);
  },
  rect(x, y, w, h, o = {}) { this.poly([P(x, y), P(x + w, y), P(x + w, y + h), P(x, y + h)], o); },

  arrow(a, b, o = {}) {
    const prog = o.progress ?? 1;
    const tip = lerpP(a, b, prog);
    this.line(a, tip, o);
    if (prog > 0.9 && dist(a, b) > 4) {
      const d = nrm(sub(b, a)), hs = o.head || 13;
      const ha = o.alpha ?? 0.9;
      const l = add(tip, mul(add(mul(d, -Math.cos(0.42)), mul(perp(d), Math.sin(0.42))), hs));
      const r = add(tip, mul(add(mul(d, -Math.cos(0.42)), mul(perp(d), -Math.sin(0.42))), hs));
      const oo = { ...o, progress: 1, alpha: ha * seg(prog, 0.9, 1), wobble: 0.4 };
      this.line(tip, l, oo); this.line(tip, r, oo);
    }
  },

  rightAngle(p, d1, d2, s, o = {}) {
    const a = add(p, mul(d1, s)), b = add(a, mul(d2, s)), c = add(p, mul(d2, s));
    this.path([a, b, c], { width: 1.4, wobble: 0.3, passes: 1, ...o });
  },

  text(str, x, y, o = {}) {
    const ctx = this.ctx, prog = o.progress ?? 1, alpha = o.alpha ?? 1;
    if (prog <= 0 || alpha <= 0.004) return;
    const size = o.size || 30;
    ctx.save();
    ctx.font = `${o.weight || 500} ${size}px ${o.font || HAND}`;
    ctx.textAlign = o.align || 'left';
    ctx.textBaseline = o.base || 'middle';
    ctx.translate(x, y);
    ctx.rotate(o.rot ?? (hash1((o.seed || x * 0.13 + y * 0.07)) - 0.5) * 0.03);
    if (prog < 1) {
      const w = ctx.measureText(str).width;
      const x0 = ctx.textAlign === 'center' ? -w / 2 : ctx.textAlign === 'right' ? -w : 0;
      ctx.beginPath(); ctx.rect(x0 - 6, -size * 1.2, (w + 12) * prog, size * 2.4); ctx.clip();
    }
    ctx.globalAlpha = alpha;
    if (o.halo !== false) {
      ctx.lineJoin = 'round';
      ctx.strokeStyle = o.haloColor || 'rgba(245,239,227,0.92)';
      ctx.lineWidth = o.haloW || Math.max(5, size * 0.24);
      ctx.strokeText(str, 0, 0);
    }
    ctx.fillStyle = o.color || INK;
    ctx.fillText(str, 0, 0);
    ctx.restore();
  },
  /* text with ^{superscript} parts, drawn left-aligned */
  textSup(str, x, y, o = {}) {
    const size = o.size || 30, parts = str.split(/\^\{([^}]*)\}/);
    let cx = x;
    const ctx = this.ctx, prog = o.progress ?? 1;
    const full = parts.reduce((w, p, i) => w + this.textWidth(p, i % 2 ? size * 0.6 : size, o.weight || 500), 0);
    ctx.save(); ctx.beginPath(); ctx.rect(x - 6, y - size * 1.4, (full + 12) * prog, size * 2.8); ctx.clip();
    parts.forEach((p, i) => {
      const sz = i % 2 ? size * 0.6 : size;
      this.text(p, cx, i % 2 ? y - size * 0.38 : y, { ...o, size: sz, progress: 1, rot: 0 });
      cx += this.textWidth(p, sz, o.weight || 500);
    });
    ctx.restore();
  },
  textWidth(str, size = 30, weight = 500) {
    const ctx = this.ctx; ctx.save(); ctx.font = `${weight} ${size}px ${HAND}`;
    const w = ctx.measureText(str).width; ctx.restore(); return w;
  },

  dot(p, r, color = INK, alpha = 1) {
    const ctx = this.ctx; if (alpha <= 0.004) return;
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill(); ctx.restore();
  },

  /* crayon-ish hatching inside current clip */
  hatch(x, y, w, h, o = {}) {
    const ctx = this.ctx, gap = o.gap || 7, ang = o.angle ?? -0.8;
    const c = P(x + w / 2, y + h / 2), R = Math.hypot(w, h) / 2 + 4;
    const d = P(Math.cos(ang), Math.sin(ang)), nn = perp(d);
    ctx.save();
    ctx.strokeStyle = o.color || INK; ctx.lineWidth = o.width || 1.2; ctx.lineCap = 'round';
    ctx.globalAlpha = o.alpha ?? 0.5;
    ctx.beginPath();
    let k = 0;
    for (let s = -R; s <= R; s += gap, k++) {
      const j = (hash1(k + (o.seed || 0)) - 0.5) * gap * 0.5;
      const m = add(c, mul(nn, s + j));
      const a = add(m, mul(d, -R)), b = add(m, mul(d, R));
      ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
    }
    ctx.stroke(); ctx.restore();
  },

  /* ---------- little pictograms ---------- */

  satIcon(p, o = {}) {
    const ctx = this.ctx, a = o.alpha ?? 1; if (a <= 0.004) return;
    const s = o.scale || 1, col = o.color || INK;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(o.rot ?? -0.42); ctx.scale(s, s);
    ctx.globalAlpha = a;
    ctx.fillStyle = tint(col, 0.72);
    ctx.fillRect(-46, -8, 30, 16); ctx.fillRect(16, -8, 30, 16);
    ctx.fillStyle = tint(col, 0.25);
    ctx.fillRect(-11, -11, 22, 22);
    const oo = { color: INK, width: 1.5, alpha: a * 0.9, wobble: 0.35, passes: 1 };
    this.rect(-46, -8, 30, 16, { ...oo, seed: 2 });
    this.rect(16, -8, 30, 16, { ...oo, seed: 3 });
    this.rect(-11, -11, 22, 22, { ...oo, seed: 4, width: 1.8 });
    for (let i = 1; i < 4; i++) {
      this.line(P(-46 + i * 7.5, -8), P(-46 + i * 7.5, 8), { ...oo, width: 0.9, alpha: a * 0.6 });
      this.line(P(16 + i * 7.5, -8), P(16 + i * 7.5, 8), { ...oo, width: 0.9, alpha: a * 0.6 });
    }
    this.line(P(-16, 0), P(-11, 0), oo); this.line(P(11, 0), P(16, 0), oo);
    this.line(P(0, 11), P(0, 18), oo);
    this.arc(P(0, 25), 8, -Math.PI * 0.85, -Math.PI * 0.15, oo);
    ctx.restore();
    if (o.label) this.text(o.label, p.x + 30 * s, p.y - 30 * s, { size: 26 * Math.max(0.8, s), color: mixHex([col], 0.75), alpha: a, weight: 700 });
  },

  carTop(p, ang, o = {}) {
    const ctx = this.ctx, a = o.alpha ?? 1; if (a <= 0.004) return;
    const s = o.scale || 1, col = o.color || '#f0b84a';
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang); ctx.scale(s, s);
    const body = [P(-22, -10), P(16, -11), P(22, -7), P(23, 7), P(16, 11), P(-22, 10)];
    if (!o.ghost) {
      ctx.globalAlpha = a; ctx.fillStyle = col;
      ctx.beginPath(); body.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(43,40,51,.55)';
      ctx.beginPath(); ctx.moveTo(4, -8); ctx.lineTo(11, -7); ctx.lineTo(11, 7); ctx.lineTo(4, 8); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-16, -7); ctx.lineTo(-12, -7); ctx.lineTo(-12, 7); ctx.lineTo(-16, 7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = INK;
      [[-14, -12.5], [10, -12.5], [-14, 10], [10, 10]].forEach(([x, y]) => ctx.fillRect(x, y, 8, 2.6));
    }
    this.poly(body, { color: o.ghost ? (o.ghostColor || INK) : INK, width: o.ghost ? 1.8 : 1.6, alpha: a * (o.ghost ? 0.8 : 0.9), wobble: 0.5, seed: o.seed || 7, passes: o.ghost ? 2 : 1 });
    ctx.restore();
  },

  carSide(p, o = {}) {
    const ctx = this.ctx, a = o.alpha ?? 1; if (a <= 0.004) return;
    const s = o.scale || 1, col = o.color || '#f0b84a';
    ctx.save(); ctx.translate(p.x, p.y); ctx.scale(s * (o.flip ? -1 : 1), s);
    const body = [P(-36, -8), P(-35, -20), P(-18, -22), P(-8, -35), P(14, -35), P(25, -22), P(37, -19), P(38, -8)];
    ctx.globalAlpha = a; ctx.fillStyle = col;
    ctx.beginPath(); body.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(95,159,196,.55)';
    ctx.beginPath(); ctx.moveTo(-6, -32); ctx.lineTo(3, -32); ctx.lineTo(3, -22); ctx.lineTo(-14, -22); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(6, -32); ctx.lineTo(13, -32); ctx.lineTo(21, -22); ctx.lineTo(6, -22); ctx.closePath(); ctx.fill();
    this.poly(body, { width: 1.8, alpha: a * 0.9, wobble: 0.5, seed: 9, passes: 1 });
    [-21, 23].forEach(x => {
      ctx.fillStyle = INK; ctx.globalAlpha = a;
      ctx.beginPath(); ctx.arc(x, -7, 7.5, 0, TAU); ctx.fill();
      ctx.fillStyle = '#ddd2bf'; ctx.beginPath(); ctx.arc(x, -7, 3, 0, TAU); ctx.fill();
    });
    this.line(P(-2, -35), P(-2, -40), { width: 1.4, alpha: a * 0.8, passes: 1 });
    ctx.restore();
  },

  clock(c, r, o = {}) {
    const a = o.alpha ?? 1; if (a <= 0.004) return;
    const ctx = this.ctx;
    ctx.save(); ctx.globalAlpha = a * 0.85; ctx.fillStyle = o.fill || '#fbf7ee';
    ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, TAU); ctx.fill(); ctx.restore();
    this.circle(c, r, { width: 2.2, alpha: a, seed: o.seed || 31, color: o.color || INK });
    for (let i = 0; i < 12; i++) {
      const an = i * TAU / 12;
      this.line(polar(c, r * 0.8, an), polar(c, r * 0.92, an), { width: 1.3, alpha: a * 0.7, passes: 1, wobble: 0.2 });
    }
    const t = o.time || 0;
    this.line(c, polar(c, r * 0.5, t / 12 - Math.PI / 2), { width: 2.6, alpha: a, passes: 1, wobble: 0.2 });
    this.line(c, polar(c, r * 0.75, t - Math.PI / 2), { width: 1.8, alpha: a, passes: 1, wobble: 0.2, color: o.hand || INK });
    this.dot(c, 2.5, INK, a);
  },

  antenna(p, o = {}) {
    const a = o.alpha ?? 1, s = o.scale || 1, up = o.up || P(0, -1);
    const side = perp(up);
    const top = add(p, mul(up, 22 * s));
    this.line(p, top, { width: 2, alpha: a, passes: 1, seed: 41 });
    this.line(add(p, mul(side, -7 * s)), top, { width: 1.4, alpha: a * 0.8, passes: 1, seed: 42 });
    this.line(add(p, mul(side, 7 * s)), top, { width: 1.4, alpha: a * 0.8, passes: 1, seed: 43 });
    const dc = add(top, mul(up, 4 * s));
    const an = angOf(up);
    this.arc(dc, 9 * s, an + Math.PI * 0.62, an + Math.PI * 1.38, { width: 2, alpha: a, passes: 1, seed: 44 });
  },

  envelope(p, ang, o = {}) {
    const ctx = this.ctx, a = o.alpha ?? 1; if (a <= 0.004) return;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(ang);
    ctx.globalAlpha = a; ctx.fillStyle = o.fill || '#fff9ea'; ctx.fillRect(-15, -10, 30, 20);
    this.rect(-15, -10, 30, 20, { width: 1.5, alpha: a, wobble: 0.3, passes: 1, color: o.color || INK });
    this.path([P(-15, -10), P(0, 2), P(15, -10)], { width: 1.3, alpha: a, wobble: 0.2, passes: 1, color: o.color || INK });
    ctx.restore();
  },

  crossOut(p, s, o = {}) {
    const pr = o.progress ?? 1;
    this.line(add(p, P(-s, -s)), add(p, P(s, s)), { width: 3.2, color: COL.red, ...o, progress: clamp(pr * 2) });
    this.line(add(p, P(s, -s)), add(p, P(-s, s)), { width: 3.2, color: COL.red, ...o, progress: clamp(pr * 2 - 1), seed: 77 });
  },

  check(p, s, o = {}) {
    this.path([add(p, P(-s, 0)), add(p, P(-s * 0.3, s * 0.7)), add(p, P(s, -s * 0.9))], { width: 3.2, color: COL.green, wobble: 0.6, ...o });
  },

  /* tiny sine sketch (for frequency illustrations) */
  wave(x0, y0, w, amp, lambda, o = {}) {
    const pts = [];
    for (let x = 0; x <= w; x += 2) pts.push(P(x0 + x, y0 + Math.sin((x / lambda) * TAU + (o.phase || 0)) * amp));
    this.path(pts, { width: 2, wobble: 0.4, passes: 1, ...o });
  },
};

/* paper grain used to "erode" strokes so they look like pencil on rough paper */
function makeGrain() {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), im = g.createImageData(256, 256);
  for (let i = 0; i < 256 * 256; i++) {
    const v = Math.random();
    im.data[i * 4 + 3] = v < 0.42 ? Math.pow(1 - v / 0.42, 2) * 150 : 0;
  }
  g.putImageData(im, 0, 0);
  return c;
}
