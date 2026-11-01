'use strict';
/* Small math toolkit shared by every scene. */

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const ease = t => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const easeOut = t => { t = clamp(t); return 1 - Math.pow(1 - t, 3); };
const seg = (t, a, b) => clamp((t - a) / (b - a));
const es = (t, a, b) => ease(seg(t, a, b));          // eased segment 0..1
const win = (t, a, b, f = 0.7) => Math.min(smooth((t - a) / f), smooth((b - t) / f)); // fade in/out window

function hash1(n) { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function noise1(x, seed = 0) {
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(hash1(i + seed * 91.7), hash1(i + 1 + seed * 91.7), u) * 2 - 1;
}

/* ---- 2D vectors ---- */
const P = (x, y) => ({ x, y });
const add = (a, b) => P(a.x + b.x, a.y + b.y);
const sub = (a, b) => P(a.x - b.x, a.y - b.y);
const mul = (a, k) => P(a.x * k, a.y * k);
const dot = (a, b) => a.x * b.x + a.y * b.y;
const len = a => Math.hypot(a.x, a.y);
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const nrm = a => { const l = len(a) || 1; return P(a.x / l, a.y / l); };
const perp = a => P(-a.y, a.x);
const lerpP = (a, b, t) => P(lerp(a.x, b.x, t), lerp(a.y, b.y, t));
const polar = (c, r, a) => P(c.x + Math.cos(a) * r, c.y + Math.sin(a) * r);
const angOf = v => Math.atan2(v.y, v.x);

/* intersection points of two circles, or null */
function circleX(c1, r1, c2, r2) {
  const d = dist(c1, c2);
  if (d < 1e-6 || d > r1 + r2 || d < Math.abs(r1 - r2)) return null;
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
  const u = mul(sub(c2, c1), 1 / d), m = add(c1, mul(u, a)), v = perp(u);
  return [add(m, mul(v, h)), add(m, mul(v, -h))];
}

/* least-squares position from ranges (Gauss–Newton) */
function solve2D(sats, ranges, guess) {
  const p = { x: guess.x, y: guess.y };
  for (let it = 0; it < 14; it++) {
    let a11 = 0, a12 = 0, a22 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < sats.length; i++) {
      const d = dist(p, sats[i]) || 1e-6;
      const ux = (p.x - sats[i].x) / d, uy = (p.y - sats[i].y) / d, r = ranges[i] - d;
      a11 += ux * ux; a12 += ux * uy; a22 += uy * uy; b1 += ux * r; b2 += uy * r;
    }
    const det = a11 * a22 - a12 * a12;
    if (Math.abs(det) < 1e-9) break;
    p.x += (a22 * b1 - a12 * b2) / det;
    p.y += (a11 * b2 - a12 * b1) / det;
  }
  return p;
}

function segHitsRect(a, b, r) {
  // sample-based test: good enough for illustration geometry
  for (let i = 0; i <= 60; i++) {
    const p = lerpP(a, b, i / 60);
    if (p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h) return true;
  }
  return false;
}
function segEnterRect(a, b, r) {
  for (let i = 0; i <= 200; i++) {
    const p = lerpP(a, b, i / 200);
    if (p.x > r.x && p.x < r.x + r.w && p.y > r.y && p.y < r.y + r.h) return p;
  }
  return null;
}

/* ---- 3D vectors (arrays) ---- */
const V3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  mul: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: a => Math.hypot(a[0], a[1], a[2]),
  norm: a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)],
  dist: (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]),
};

/* the two intersection points of three spheres (classic trilateration) */
function trilat3(p1, p2, p3, r1, r2, r3) {
  const ex = V3.norm(V3.sub(p2, p1));
  const i = V3.dot(ex, V3.sub(p3, p1));
  const ey = V3.norm(V3.sub(V3.sub(p3, p1), V3.mul(ex, i)));
  const ez = V3.cross(ex, ey);
  const d = V3.dist(p2, p1);
  const j = V3.dot(ey, V3.sub(p3, p1));
  const x = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const y = (r1 * r1 - r3 * r3 + i * i + j * j) / (2 * j) - (i / j) * x;
  const z = Math.sqrt(Math.max(0, r1 * r1 - x * x - y * y));
  const base = V3.add(p1, V3.add(V3.mul(ex, x), V3.mul(ey, y)));
  return [V3.add(base, V3.mul(ez, z)), V3.sub(base, V3.mul(ez, z))];
}

/* ---- colours ---- */
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
function rgbHex(c) { return '#' + c.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join(''); }
function mixHex(list, dark = 0.8) {
  const s = [0, 0, 0];
  list.forEach(h => { const c = hexRgb(h); s[0] += c[0]; s[1] += c[1]; s[2] += c[2]; });
  return rgbHex(s.map(v => (v / list.length) * dark));
}
function tint(h, k) { const c = hexRgb(h); return rgbHex(c.map(v => v + (255 - v) * k)); }
function rgb01(h) { return hexRgb(h).map(v => v / 255); }

const fmt = (x, d = 0) => x.toLocaleString('nb-NO', { minimumFractionDigits: d, maximumFractionDigits: d });
