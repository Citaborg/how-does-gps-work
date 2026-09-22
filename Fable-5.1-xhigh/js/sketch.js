/* sketch.js — håndtegnede hjelpere («blyant og fargestift») over rough.js */
const Sketch = (() => {
  const COL = {
    pencil: '#2f2a26', soft: '#6b625a', faint: '#a79d92', paper: '#f6f1e7',
    red: '#d9573b', blue: '#3b7dd8', green: '#4c9a5a', purple: '#8a5bc4',
    orange: '#e39b2f', ink: '#1e2a44', note: '#fff7c9', sky: '#9ec5d6', grass: '#b9d8a0',
    road: '#7d7268'
  };
  const SATCOL = [COL.red, COL.blue, COL.green, COL.purple];

  // --- små matte-hjelpere -------------------------------------------------
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const easeOut = t => { t = clamp(t, 0, 1); return 1 - (1 - t) * (1 - t) * (1 - t); };
  const easeIn = t => { t = clamp(t, 0, 1); return t * t * t; };
  const ramp = (t, t0, t1) => clamp((t - t0) / (t1 - t0), 0, 1);
  // konvolutt: fade inn ved t0 (over f), fade ut ved t1 (over f)
  const env = (t, t0, t1, f = 0.8) => ease(ramp(t, t0, t0 + f)) * (1 - ease(ramp(t, t1, t1 + f)));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  // nøkkelbilder: kf(t, [[t0,v0],[t1,v1],...]) med myk overgang
  function kf(t, keys) {
    if (t <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const [t0, v0] = keys[i - 1], [t1, v1] = keys[i];
        return lerp(v0, v1, ease((t - t0) / (t1 - t0)));
      }
    }
    return keys[keys.length - 1][1];
  }
  function kfv(t, keys) { // vektor-varianten
    const n = keys[0][1].length; const out = [];
    for (let k = 0; k < n; k++) out.push(kf(t, keys.map(([tt, v]) => [tt, v[k]])));
    return out;
  }
  // to sirkler → skjæringspunkter
  function circleIntersect(c1, r1, c2, r2) {
    const d = dist(c1, c2); if (d < 1e-6 || d > r1 + r2 || d < Math.abs(r1 - r2)) return null;
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d); const h2 = r1 * r1 - a * a; const h = Math.sqrt(Math.max(0, h2));
    const px = c1.x + a * (c2.x - c1.x) / d, py = c1.y + a * (c2.y - c1.y) / d;
    const rx = -(c2.y - c1.y) / d * h, ry = (c2.x - c1.x) / d * h;
    return [{ x: px + rx, y: py + ry }, { x: px - rx, y: py - ry }];
  }
  function hexA(hex, a) { // '#rrggbb' → rgba()
    const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
  }

  // --- grunnleggende strøk ------------------------------------------------
  function line(rc, x1, y1, x2, y2, o = {}) {
    rc.line(x1, y1, x2, y2, {
      stroke: o.color || COL.pencil, strokeWidth: o.w || 2.2, roughness: o.rough ?? 1.1, bowing: o.bow ?? 1.2,
      seed: o.seed || 7, disableMultiStroke: o.single ?? false
    });
  }
  function circle(rc, x, y, r, o = {}) {
    if (r < 0.5) return;
    rc.circle(x, y, 2 * r, {
      stroke: o.color || COL.pencil, strokeWidth: o.w || 2.4, roughness: o.rough ?? 1.0, bowing: 1,
      fill: o.fill, fillStyle: o.fillStyle || 'hachure', hachureGap: o.gap || 10, fillWeight: o.fw || 1.1,
      hachureAngle: o.angle ?? -41, seed: o.seed || 3, disableMultiStroke: o.single ?? false, curveStepCount: o.steps || 18
    });
  }
  function ellipse(rc, x, y, w, h, o = {}) {
    rc.ellipse(x, y, w, h, {
      stroke: o.color || COL.pencil, strokeWidth: o.w || 2.2, roughness: o.rough ?? 1.0,
      fill: o.fill, fillStyle: o.fillStyle || 'hachure', hachureGap: o.gap || 9, fillWeight: o.fw || 1.1, seed: o.seed || 5
    });
  }
  function poly(rc, pts, o = {}) {
    rc.polygon(pts.map(p => [p.x, p.y]), {
      stroke: o.color || COL.pencil, strokeWidth: o.w || 2.2, roughness: o.rough ?? 1.1,
      fill: o.fill, fillStyle: o.fillStyle || 'hachure', hachureGap: o.gap || 9, fillWeight: o.fw || 1.2,
      hachureAngle: o.angle ?? -35, seed: o.seed || 11
    });
  }
  function rect(rc, x, y, w, h, o = {}) {
    rc.rectangle(x, y, w, h, {
      stroke: o.color || COL.pencil, strokeWidth: o.w || 2.2, roughness: o.rough ?? 1.2,
      fill: o.fill, fillStyle: o.fillStyle || 'hachure', hachureGap: o.gap || 9, fillWeight: o.fw || 1.2,
      hachureAngle: o.angle ?? -35, seed: o.seed || 13
    });
  }
  function curve(rc, pts, o = {}) {
    rc.curve(pts.map(p => [p.x, p.y]), { stroke: o.color || COL.pencil, strokeWidth: o.w || 2.2, roughness: o.rough ?? 1.0, seed: o.seed || 17 });
  }
  function arc(rc, x, y, r, a0, a1, o = {}) {
    rc.arc(x, y, 2 * r, 2 * r, a0, a1, false, { stroke: o.color || COL.pencil, strokeWidth: o.w || 2.2, roughness: o.rough ?? 1.0, seed: o.seed || 19, fill: o.fill, fillStyle: 'hachure', hachureGap: 6, fillWeight: 1 });
  }
  function arrow(rc, x1, y1, x2, y2, o = {}) {
    line(rc, x1, y1, x2, y2, o);
    const a = Math.atan2(y2 - y1, x2 - x1), h = o.head || 16;
    line(rc, x2, y2, x2 - h * Math.cos(a - 0.45), y2 - h * Math.sin(a - 0.45), o);
    line(rc, x2, y2, x2 - h * Math.cos(a + 0.45), y2 - h * Math.sin(a + 0.45), o);
  }
  // fylt, gjennomskinnelig skive – «fargestift-fyll» som mikser farger der de overlapper
  function disc(ctx, x, y, r, color, alpha = 0.16, mode = 'multiply') {
    if (r < 0.5) return;
    ctx.save(); ctx.globalCompositeOperation = mode; ctx.globalAlpha *= alpha;
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  function dot(ctx, x, y, r, color, alpha = 1) {
    ctx.save(); ctx.globalAlpha *= alpha; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  function marker(rc, ctx, x, y, r, color, o = {}) { // håndtegnet ring + prikk
    circle(rc, x, y, r, { color, w: o.w || 3, rough: 1.4, seed: o.seed || 23 });
    dot(ctx, x, y, r * 0.35, color);
  }
  function text(ctx, str, x, y, o = {}) {
    ctx.save();
    ctx.font = `${o.weight || 600} ${o.size || 30}px ${o.font || 'Caveat'}, 'Patrick Hand', cursive`;
    ctx.fillStyle = o.color || COL.pencil; ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'alphabetic';
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    if (o.rot) { ctx.translate(x, y); ctx.rotate(o.rot); x = 0; y = 0; }
    if (o.halo) { ctx.lineWidth = o.halo; ctx.strokeStyle = hexA('#f6f1e7', 0.85); ctx.lineJoin = 'round'; ctx.strokeText(str, x, y); }
    ctx.fillText(str, x, y); ctx.restore();
  }
  // Gul lapp med håndskrevet tekst (linjer = array). Retur: bunn-y.
  function note(rc, ctx, x, y, w, lines, o = {}) {
    const lh = o.lh || 36, pad = 18; const h = pad * 2 + lines.length * lh - 8;
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(o.rot ?? -0.02); ctx.translate(-w / 2, -h / 2);
    ctx.globalAlpha *= (o.alpha ?? 1);
    ctx.fillStyle = o.fill || COL.note; ctx.fillRect(0, 0, w, h);
    rc.rectangle(0, 0, w, h, { stroke: COL.soft, strokeWidth: 1.6, roughness: 1.4, seed: o.seed || 29, fill: undefined });
    let yy = pad + lh * 0.72;
    for (const ln of lines) {
      const s = typeof ln === 'string' ? { t: ln } : ln;
      text(ctx, s.t, pad + (s.indent || 0), yy, { size: s.size || o.size || 28, color: s.color || o.color || COL.ink, weight: s.weight || 600 });
      yy += lh;
    }
    ctx.restore();
    return y + h;
  }

  // --- figurer -------------------------------------------------------------
  function satellite(rc, ctx, x, y, o = {}) {
    const s = o.size || 1, col = o.color || COL.pencil, seed = o.seed || 31;
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? -0.35); ctx.scale(s, s);
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    // solpaneler
    rc.rectangle(-58, -9, 36, 18, { stroke: col, strokeWidth: 2, fill: col, fillStyle: 'hachure', hachureGap: 4, fillWeight: 1, roughness: 0.9, seed });
    rc.rectangle(22, -9, 36, 18, { stroke: col, strokeWidth: 2, fill: col, fillStyle: 'hachure', hachureGap: 4, fillWeight: 1, roughness: 0.9, seed: seed + 1 });
    rc.line(-22, 0, -14, 0, { stroke: col, strokeWidth: 2, seed }); rc.line(14, 0, 22, 0, { stroke: col, strokeWidth: 2, seed });
    // kropp
    rc.rectangle(-14, -14, 28, 28, { stroke: col, strokeWidth: 2.4, fill: '#fffdf5', fillStyle: 'solid', roughness: 1, seed: seed + 2 });
    // antenne (parabol) mot jorda
    rc.arc(0, 26, 26, 16, Math.PI, Math.PI * 2, false, { stroke: col, strokeWidth: 2, roughness: 0.8, seed: seed + 3 });
    rc.line(0, 14, 0, 24, { stroke: col, strokeWidth: 2, seed });
    ctx.restore();
    if (o.label) text(ctx, o.label, x + 34 * s, y - 30 * s, { color: col, size: 26, halo: 4 });
  }
  function carTop(rc, ctx, x, y, ang = 0, o = {}) {
    const col = o.color || COL.ink, s = o.size || 1, seed = o.seed || 37;
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    // hjul
    for (const [wx, wy] of [[-22, -20], [22, -20], [-22, 20], [22, 20]])
      rc.rectangle(wx - 6, wy - 4, 12, 8, { stroke: col, strokeWidth: 2, fill: col, fillStyle: 'solid', roughness: 0.6, seed });
    // karosseri
    rc.rectangle(-36, -16, 72, 32, { stroke: col, strokeWidth: 2.6, fill: o.fill || '#fffdf5', fillStyle: 'solid', roughness: 1.1, seed: seed + 1 });
    // frontrute + bakrute
    rc.line(8, -12, 8, 12, { stroke: col, strokeWidth: 2, seed: seed + 2 }); rc.line(16, -12, 16, 12, { stroke: col, strokeWidth: 2, seed: seed + 2 });
    rc.line(-18, -12, -18, 12, { stroke: col, strokeWidth: 2, seed: seed + 3 });
    // liten GPS-antenne
    dot(ctx, -4, 0, 3.5, col);
    ctx.restore();
  }
  function carSide(rc, ctx, x, y, o = {}) {
    const col = o.color || COL.ink, s = o.size || 1, seed = o.seed || 41;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    rc.polygon([[-44, 0], [-44, -16], [-22, -18], [-10, -36], [22, -36], [36, -18], [46, -14], [46, 0]],
      { stroke: col, strokeWidth: 2.6, fill: o.fill || '#fffdf5', fillStyle: 'solid', roughness: 1.1, seed });
    rc.line(-8, -18, -2, -33, { stroke: col, strokeWidth: 1.8, seed }); rc.line(20, -33, 30, -18, { stroke: col, strokeWidth: 1.8, seed });
    rc.circle(-24, 2, 18, { stroke: col, strokeWidth: 2.4, fill: col, fillStyle: 'solid', roughness: 0.6, seed: seed + 1 });
    rc.circle(26, 2, 18, { stroke: col, strokeWidth: 2.4, fill: col, fillStyle: 'solid', roughness: 0.6, seed: seed + 2 });
    rc.line(4, -36, 4, -46, { stroke: col, strokeWidth: 2, seed }); dot(ctx, 4, -48, 3.5, col);
    ctx.restore();
  }
  function dish(rc, ctx, x, y, o = {}) {
    const col = o.color || COL.pencil, s = o.size || 1, seed = o.seed || 43;
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot || 0); ctx.scale(s, s);
    rc.line(0, 0, 0, -18, { stroke: col, strokeWidth: 2.2, seed });
    rc.arc(0, -30, 34, 26, Math.PI * 0.05, Math.PI * 0.95, false, { stroke: col, strokeWidth: 2.4, roughness: 1, seed: seed + 1, fill: col, fillStyle: 'hachure', hachureGap: 4, fillWeight: 0.8 });
    rc.line(0, -20, 0, -40, { stroke: col, strokeWidth: 1.6, seed }); dot(ctx, 0, -42, 3, col);
    ctx.restore();
  }
  function tower(rc, ctx, x, y, o = {}) {
    const col = o.color || COL.pencil, s = o.size || 1, seed = o.seed || 47;
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    rc.polygon([[-16, 0], [16, 0], [4, -60], [-4, -60]], { stroke: col, strokeWidth: 2.2, fill: col, fillStyle: 'cross-hatch', hachureGap: 7, fillWeight: 0.8, roughness: 1, seed });
    rc.line(0, -60, 0, -76, { stroke: col, strokeWidth: 2, seed }); dot(ctx, 0, -78, 4, col);
    ctx.restore();
  }
  function clock(rc, ctx, x, y, r, o = {}) {
    const col = o.color || COL.pencil;
    circle(rc, x, y, r, { color: col, w: 2.2, rough: 0.8, seed: o.seed || 53, fill: '#fffdf5', fillStyle: 'solid' });
    for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; dot(ctx, x + Math.cos(a) * r * 0.82, y + Math.sin(a) * r * 0.82, i % 3 === 0 ? 2.4 : 1.4, col); }
    const h = o.hour ?? 10, m = o.min ?? 10;
    const ah = (h / 12 + m / 720) * Math.PI * 2 - Math.PI / 2, am = (m / 60) * Math.PI * 2 - Math.PI / 2;
    line(rc, x, y, x + Math.cos(ah) * r * 0.5, y + Math.sin(ah) * r * 0.5, { color: col, w: 2.6, seed: 1 });
    line(rc, x, y, x + Math.cos(am) * r * 0.72, y + Math.sin(am) * r * 0.72, { color: col, w: 2, seed: 2 });
    dot(ctx, x, y, 3, col);
  }
  // bølgetog langs en linje (fra (x1,y1) mot (x2,y2)), bølgelengde λ px, fase-forskyvning
  function waves(rc, ctx, x1, y1, x2, y2, lambda, phase, o = {}) {
    const L = Math.hypot(x2 - x1, y2 - y1), a = Math.atan2(y2 - y1, x2 - x1);
    const col = o.color || COL.pencil, amp = o.amp || 9, n = Math.floor(L / 2);
    ctx.save(); ctx.translate(x1, y1); ctx.rotate(a);
    if (o.alpha !== undefined) ctx.globalAlpha *= o.alpha;
    ctx.strokeStyle = col; ctx.lineWidth = o.w || 2; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let i = 0; i <= n; i++) { const s = i * 2; const lam = typeof lambda === 'function' ? lambda(s / L) : lambda; const yy = Math.sin((s / lam) * Math.PI * 2 + phase) * amp; i ? ctx.lineTo(s, yy) : ctx.moveTo(s, yy); }
    ctx.stroke(); ctx.restore();
  }
  // vei (topp-visning) som en glatt kurve y=f(x)
  function road(rc, ctx, f, x0, x1, o = {}) {
    const w = o.width || 54, step = 40, pts = [];
    for (let x = x0; x <= x1; x += step) pts.push({ x, y: f(x) });
    ctx.save(); ctx.globalAlpha *= (o.alpha ?? 1);
    ctx.strokeStyle = hexA(COL.road, 0.16); ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
    // kantlinjer i blyant
    const off = w / 2;
    for (const sgn of [-1, 1]) {
      const side = pts.map((p, i) => {
        const q = pts[Math.min(i + 1, pts.length - 1)], r = pts[Math.max(i - 1, 0)];
        const ang = Math.atan2(q.y - r.y, q.x - r.x);
        return { x: p.x + Math.cos(ang + Math.PI / 2) * off * sgn, y: p.y + Math.sin(ang + Math.PI / 2) * off * sgn };
      });
      curve(rc, side, { color: COL.soft, w: 1.8, rough: 0.7, seed: 61 + sgn });
    }
    // midtstripe: korte streker
    ctx.strokeStyle = hexA(COL.soft, 0.7); ctx.lineWidth = 2.2;
    for (let i = 0; i < pts.length - 1; i += 2) { ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(lerp(pts[i].x, pts[i + 1].x, 0.55), lerp(pts[i].y, pts[i + 1].y, 0.55)); ctx.stroke(); }
    ctx.restore();
  }
  function building(rc, ctx, x, y, w, h, o = {}) {
    const col = o.color || COL.blue;
    ctx.save(); ctx.globalAlpha *= (o.alpha ?? 1);
    rc.rectangle(x, y, w, h, { stroke: COL.pencil, strokeWidth: 2.6, roughness: 1.2, fill: col, fillStyle: 'hachure', hachureGap: 8, fillWeight: 1.3, hachureAngle: 55, seed: o.seed || 67 });
    // glassfasade: to lyse striper
    rc.line(x + 12, y + 14, x + w - 12, y + 14, { stroke: '#fff', strokeWidth: 3, roughness: 0.6, seed: 3 });
    if (o.label) text(ctx, o.label, x + w / 2, y + h / 2 + 10, { align: 'center', size: 30, color: COL.ink, halo: 5 });
    ctx.restore();
  }

  return {
    COL, SATCOL, clamp, lerp, ease, easeOut, easeIn, ramp, env, dist, kf, kfv, circleIntersect, hexA,
    line, circle, ellipse, poly, rect, curve, arc, arrow, disc, dot, marker, text, note,
    satellite, carTop, carSide, dish, tower, clock, waves, road, building
  };
})();
