'use strict';
/* Act 2: the same story in 3D – spheres instead of circles.
   Units: 1 = 1000 km. Earth centre below the receiver R at the origin. */

const B3D = (() => {
  const E = [0, -6.371, 0], RE = 6.371, R = [0, 0, 0];
  const sp = (al, ph) => {
    const a = al * DEG, f = ph * DEG;
    return V3.add(E, V3.mul([Math.sin(a) * Math.cos(f), Math.cos(a), Math.sin(a) * Math.sin(f)], 26.56));
  };
  const S = [sp(42, 205), sp(37, 325), sp(47, 85), sp(13, 140)];
  const r = S.map(s => V3.dist(s, R));
  // mirror of R in the plane through S1, S2, S3
  const n = V3.norm(V3.cross(V3.sub(S[1], S[0]), V3.sub(S[2], S[0])));
  const Rm = V3.sub(R, V3.mul(n, 2 * V3.dot(V3.sub(R, S[0]), n)));
  const cam0 = { target: S[0], yaw: 0, pitch: 89.5 * DEG, dist: 92 };
  const camA = { target: [0, 9, 0], yaw: 0.55, pitch: 0.30, dist: 94 };
  const api = { E, RE, R, S, r, Rm, n, cam0, camA };
  api.startScreen = () => {
    const c = camera(cam0), p = project(c, S[0]);
    return { x: p.x, y: p.y, r: projRadius(c, S[0], r[0]) };
  };
  api.flyFrom = i => V3.add(S[i], V3.add(V3.mul(V3.norm(V3.sub(S[i], [0, 8, 0])), 34), [0, 14, 0]));
  api.fly = (i, t, t0, t1) => {
    const k = es(t, t0, t1), a = api.flyFrom(i), b = S[i];
    const p = V3.lerp(a, b, k);
    return V3.add(p, V3.mul([0, 1, 0], Math.sin(k * Math.PI) * 6));
  };
  // intersection circle of spheres i and j
  api.circ = (i, j, ri = r[i], rj = r[j]) => {
    const d = V3.dist(S[i], S[j]), u = V3.norm(V3.sub(S[j], S[i]));
    const a = (d * d + ri * ri - rj * rj) / (2 * d), h = Math.sqrt(Math.max(0, ri * ri - a * a));
    const C = V3.add(S[i], V3.mul(u, a));
    let e1 = V3.cross(u, [0, 1, 0]); if (V3.len(e1) < 1e-4) e1 = [1, 0, 0]; e1 = V3.norm(e1);
    const e2 = V3.cross(u, e1);
    return { C, h, a, u, at: th => V3.add(C, V3.add(V3.mul(e1, Math.cos(th) * h), V3.mul(e2, Math.sin(th) * h))) };
  };
  return api;
})();

/* overlay helpers in 3D */
const O3 = {
  sat(cam, i, p, a) {
    const q = project(cam, p); if (!q) return;
    drawSat(i, q, a, { scale: 0.72 });
  },
  pt(cam, p) { return project(cam, p); },
  line(cam, a, b, o) { const p = project(cam, a), q = project(cam, b); if (p && q) Sk.line(p, q, o); },
  ring(cam, p, col, a, seed = 1, rad = 13) { const q = project(cam, p); if (!q || a <= 0) return; Sk.circle(q, rad, { color: col, width: 2.6, alpha: a, seed, over: 0.5 }); Sk.dot(q, 3.5, col, a); },
  spheres(list) { return list.map(s => ({ c: s.c, r: s.r, col: s.col, vis: s.vis })); },
};

function yawRun(base, t, rate = 0.01) { return base + rate * t; }

/* ================= 1 sphere ================= */
scene({
  key: 'k1', act: 'Rommet (3D)', title: 'Fra sirkel til kule', dur: 40, gl: true, fadeIn: false,
  cues: [
    [0.8, 12, 'Verden er ikke flat. I rommet brer signalet seg ikke som en ring, men som en <b>kule</b>. Se hva som skjer når vi vipper sirkelen.'],
    [10, 24, 'Alle punkter i avstand r₁ fra satellitten ligger på en kuleflate: <b>|P − S₁| = r₁</b>. Mottakeren er et sted på denne enorme kula – med radius på over 20 000 km.'],
    [22, 39.5, 'Én satellitt: vi har fortsatt to frihetsgrader å gå på. Vi kan være nesten hvor som helst på kula.'],
  ],
  gl3d(t) {
    const c = camLerp(B3D.cam0, B3D.camA, es(t, 4.5, 14));
    if (t > 14) c.yaw += 0.01 * (t - 14);
    this._cam = camera(c);
    return { cam: this._cam, spheres: [{ c: B3D.S[0], r: B3D.r[0], col: 0, vis: es(t, 1.2, 4) }] };
  },
  draw(t) {
    const cam = this._cam, S = B3D.S[0], r = B3D.r[0];
    // the 2D circle from the previous chapter dissolves into the sphere
    const st = B3D.startScreen(), ca = 1 - es(t, 2.5, 5.5);
    if (ca > 0) drawBands([{ c: P(st.x, st.y), r: st.r, i: 0, a: ca }]);
    O3.sat(cam, 0, S, 1);
    const dv = win(t, 15, 39, 1);
    if (dv > 0) {
      for (let k = 0; k < 4; k++) {
        const th = 1.15 + 0.35 * Math.sin(0.25 * t + k * 1.7), ph = k * 1.55 + 0.12 * t;
        const dir = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)];
        const p = V3.add(S, V3.mul(dir, r));
        if (V3.dot(dir, V3.sub(cam.pos, p)) < 0) continue;
        const q = project(cam, p); if (!q) continue;
        Sk.dot(q, 5, INK, dv); Sk.text('?', q.x + 9, q.y - 14, { size: 30, weight: 700, alpha: dv });
        if (k === 0) {
          O3.line(cam, S, p, { color: mixHex([COL.s[0]], 0.6), width: 2.4, alpha: dv, progress: es(t, 16, 18), seed: 500 });
          const s0 = project(cam, S);
          if (s0) segLabel(s0, q, 'r₁', { color: mixHex([COL.s[0]], 0.6), alpha: dv * seg(t, 17.5, 18.5) });
        }
      }
    }
    Sk.text('|P − S₁| = r₁', 90, 880, { size: 42, weight: 700, color: COL.red, progress: es(t, 12, 15) });
    Sk.text('én kule: P kan være hvor som helst på flaten', 90, 932, { size: 30, progress: es(t, 15, 18) });
  },
});

/* ================= 2 spheres ================= */
scene({
  key: 'k2', act: 'Rommet (3D)', title: 'To kuler – én sirkel', dur: 44, gl: true, fadeIn: false, fadeOut: false,
  cues: [
    [0.8, 12, 'En satellitt til – og en kule til, som vokser ut fra den mens signalet brer seg.'],
    [9, 22, 'Der to kuleflater møtes, får vi en <b>sirkel</b>. Den lyser opp der fargene blander seg.'],
    [19, 33, 'Sirkelen står vinkelrett på linjen mellom satellittene. Pytagoras gir radien: <b>h² = r₁² − a²</b>.'],
    [31, 43.5, 'Nå er vi et sted på denne sirkelen. Én frihetsgrad igjen.'],
  ],
  gl3d(t) {
    const c = { ...B3D.camA, yaw: yawRun(0.81, t) };
    this._cam = camera(c);
    const sp = B3D.fly(1, t, 1.2, 4.5);
    return {
      cam: this._cam, spheres: [
        { c: B3D.S[0], r: B3D.r[0], col: 0, vis: 1 },
        { c: sp, r: B3D.r[1] * es(t, 4.8, 9), col: 1, vis: seg(t, 4.6, 5.2) },
      ],
    };
  },
  draw(t) {
    const cam = this._cam, S = B3D.S;
    O3.sat(cam, 0, S[0], 1);
    O3.sat(cam, 1, B3D.fly(1, t, 1.2, 4.5), seg(t, 1.2, 1.7));
    const cc = B3D.circ(0, 1);
    const ov = win(t, 16, 43, 1);
    if (ov > 0) {
      const Q = cc.at(0.5 * t);
      const s0 = project(cam, S[0]), c0 = project(cam, cc.C), q = project(cam, Q), s1 = project(cam, S[1]);
      if (s0 && c0 && q && s1) {
        Sk.line(s0, s1, { color: COL.pencil, width: 1.6, alpha: 0.7 * ov, progress: es(t, 16, 18), seed: 510 });
        Sk.line(s0, c0, { color: INK, width: 2.2, alpha: ov, progress: es(t, 19, 20.5), seed: 511 });
        Sk.line(c0, q, { color: INK, width: 2.2, alpha: ov, progress: es(t, 20.5, 22), seed: 512 });
        Sk.line(s0, q, { color: mixHex([COL.s[0]], 0.6), width: 2.4, alpha: ov, progress: es(t, 22, 23.5), seed: 513 });
        if (t > 22) Sk.rightAngle(c0, nrm(sub(s0, c0)), nrm(sub(q, c0)), 15, { alpha: ov });
        segLabel(s0, c0, 'a', { alpha: ov * seg(t, 20, 21) });
        segLabel(c0, q, 'h', { alpha: ov * seg(t, 21.5, 22.5) });
        segLabel(s0, q, 'r₁', { alpha: ov * seg(t, 23, 24), color: mixHex([COL.s[0]], 0.6), side: -1 });
        Sk.dot(q, 6, INK, ov); Sk.text('?', q.x + 10, q.y - 16, { size: 30, weight: 700, alpha: ov });
      }
    }
    Sk.text('to kuler ∩ = sirkel', 90, 880, { size: 42, weight: 700, color: COL.red, progress: es(t, 11, 14) });
    Sk.text('h² = r₁² − a²', 90, 932, { size: 34, progress: es(t, 24, 26), alpha: 1 });
  },
});

/* ================= 3 spheres ================= */
scene({
  key: 'k3', act: 'Rommet (3D)', title: 'Tre kuler – to punkter', dur: 42, gl: true, fadeIn: false, fadeOut: false,
  cues: [
    [0.8, 12, 'Den tredje kula skjærer sirkelen vår – i nøyaktig to punkter.'],
    [10, 24, 'Alle tre kuleflatene går gjennom begge punktene. Der skjæringslinjene krysser hverandre, ser du dem lyse.'],
    [22, 35, 'Som i flatland er punktene speilbilder – nå om <em>planet</em> gjennom de tre satellittene.'],
    [33, 41.5, 'Hvilket av dem er bilen?'],
  ],
  gl3d(t) {
    const k = es(t, 9, 16);
    const c = { target: V3.lerp(B3D.camA.target, [0, 12, 0], k), yaw: yawRun(1.25, t), pitch: lerp(0.30, 0.24, k), dist: lerp(94, 102, k) };
    this._cam = camera(c);
    const sp = B3D.fly(2, t, 1.2, 4.5);
    return {
      cam: this._cam, spheres: [
        { c: B3D.S[0], r: B3D.r[0], col: 0, vis: 1 },
        { c: B3D.S[1], r: B3D.r[1], col: 1, vis: 1 },
        { c: sp, r: B3D.r[2] * es(t, 4.8, 9), col: 2, vis: seg(t, 4.6, 5.2) },
      ],
    };
  },
  draw(t) {
    const cam = this._cam, S = B3D.S;
    O3.sat(cam, 0, S[0], 1); O3.sat(cam, 1, S[1], 1);
    O3.sat(cam, 2, B3D.fly(2, t, 1.2, 4.5), seg(t, 1.2, 1.7));
    const pa = seg(t, 9, 10.5);
    O3.ring(cam, B3D.R, INK, pa, 520);
    O3.ring(cam, B3D.Rm, INK, pa, 521);
    const p = project(cam, B3D.R), q = project(cam, B3D.Rm);
    if (p && q) {
      Sk.text('P', p.x + 18, p.y + 20, { size: 34, weight: 700, alpha: pa });
      Sk.text('P′', q.x + 18, q.y - 20, { size: 34, weight: 700, alpha: pa });
      const pl = win(t, 21, 42, 1);
      if (pl > 0) {
        const tri = S.slice(0, 3).map(s => project(cam, s));
        if (tri.every(Boolean)) {
          const ctx = Sk.ctx; ctx.save(); ctx.globalAlpha = 0.10 * pl; ctx.fillStyle = INK;
          ctx.beginPath(); tri.forEach((v, i) => (i ? ctx.lineTo(v.x, v.y) : ctx.moveTo(v.x, v.y))); ctx.closePath(); ctx.fill(); ctx.restore();
          Sk.poly(tri, { color: COL.pencil, width: 1.8, alpha: 0.8 * pl, progress: es(t, 21, 24), seed: 530 });
        }
        Sk.line(p, q, { color: INK, width: 2, alpha: pl, progress: es(t, 24, 26), seed: 531 });
        const m = project(cam, V3.lerp(B3D.R, B3D.Rm, 0.5));
        if (m) {
          Sk.text('speilplan', m.x + 26, m.y, { size: 30, weight: 700, color: COL.red, alpha: pl * seg(t, 26, 27) });
          Sk.dot(m, 4, INK, pl * seg(t, 25, 26));
        }
      }
    }
    Sk.text('tre kuler → to punkter', 90, 900, { size: 42, weight: 700, color: COL.red, progress: es(t, 11, 14) });
  },
});

/* ================= discard the impossible point ================= */
scene({
  key: 'k4', act: 'Rommet (3D)', title: 'Punktet vi kan forkaste', dur: 42, gl: true, fadeIn: false, fadeOut: false,
  cues: [
    [0.8, 11, 'La oss sette jorda inn i bildet.'],
    [8, 22, 'Det ene punktet ligger pent på jordoverflaten. Det andre svever ' + fmt(Math.round(V3.dist(B3D.R, B3D.Rm) * 1000 / 100) * 100) + ' km ute i rommet – helt på andre siden av satellittene.'],
    [19, 32, 'En bil kan ikke være der. Mottakeren forkaster det uten å nøle. (Følger vi det punktet over tid, ville det også gitt helt absurde hastigheter.)'],
    [30, 41.5, 'Med tre kuler og fornuft kunne vi altså vært ferdige … hvis det ikke var for klokka.'],
  ],
  gl3d(t) {
    const k = es(t, 1, 9);
    const c = { target: V3.lerp([0, 12, 0], [0, 10, 0], k), yaw: yawRun(1.67, t, 0.007), pitch: lerp(0.24, 0.10, k), dist: lerp(102, 112, k) };
    this._cam = camera(c);
    return {
      cam: this._cam, tilt: 30 * DEG,
      spheres: [0, 1, 2].map(i => ({ c: B3D.S[i], r: B3D.r[i], col: i, vis: 1 - 0.25 * k })),
      earth: { c: B3D.E, r: B3D.RE, vis: es(t, 1.5, 5.5) },
    };
  },
  draw(t) {
    const cam = this._cam, S = B3D.S;
    [0, 1, 2].forEach(i => O3.sat(cam, i, S[i], 1));
    O3.ring(cam, B3D.R, INK, 1, 520);
    O3.ring(cam, B3D.Rm, INK, 1 - seg(t, 34, 38) * 0.6, 521);
    const p = project(cam, B3D.R), q = project(cam, B3D.Rm), e = project(cam, B3D.E);
    if (e) Sk.text('jorda', e.x - 30, e.y + 8, { size: 32, weight: 700, alpha: seg(t, 4, 6), color: '#3b5560' });
    if (q) {
      Sk.crossOut(q, 26, { progress: es(t, 18, 20) });
      Sk.text('ute i rommet ✗', q.x + 36, q.y - 28, { size: 32, weight: 700, color: COL.red, progress: es(t, 19, 21) });
    }
    if (p) {
      Sk.check(P(p.x + 30, p.y - 6), 13, { progress: es(t, 12, 13.5) });
      Sk.text('på bakken ✓', p.x + 52, p.y + 26, { size: 32, weight: 700, color: COL.green, progress: es(t, 12.5, 14.5) });
    }
    if (p && q) {
      const d = Math.round(V3.dist(B3D.R, B3D.Rm) * 1000 / 100) * 100;
      Sk.line(P(p.x - 70, p.y), P(q.x - 70, q.y), { color: COL.pencil, width: 1.5, alpha: win(t, 13, 41, 1), progress: es(t, 13, 15), seed: 540 });
      Sk.text(`≈ ${fmt(d)} km`, lerp(p.x, q.x, 0.5) - 84, lerp(p.y, q.y, 0.5), { size: 30, align: 'right', alpha: win(t, 14, 41, 1) });
    }
  },
});

/* ================= 4th sphere + clock error ================= */
const K5E = 1.7;
scene({
  key: 'k5', act: 'Rommet (3D)', title: 'Fjerde kule og klokka', dur: 54, gl: true, fadeIn: false, fadeOut: false,
  cues: [
    [0.8, 13, 'Klokkefeilen er fortsatt der. Med feil klokke blir alle kulene litt for store. Tre kuler møtes likevel alltid i et punkt – bare på feil sted.'],
    [11, 23, 'Den fjerde kula avslører juksen: den bommer på punktet der de tre andre møtes.'],
    [20, 34, 'Vi krymper alle fire kulene like mye – samme c·δ – til de møtes i ett punkt. Fire likninger, fire ukjente: <b>x, y, z og δ</b>.'],
    [32, 45, 'Derfor trenger GPS minst <b>fire satellitter</b>. Har mottakeren flere, blir svaret bare sikrere – vanligvis ser den 8–12 stykker.'],
    [43, 53.5, 'La oss dykke ned mot punktet på bakken.'],
  ],
  e(t) { return K5E * es(t, 2, 6) * (1 - es(t, 22, 31)); },
  gl3d(t) {
    const c = { target: [0, 10, 0], yaw: yawRun(1.964, t, 0.006), pitch: 0.10, dist: 112 };
    this._cam = camera(c);
    const e = this.e(t), sp = B3D.fly(3, t, 7.5, 10.5);
    return {
      cam: this._cam, tilt: 30 * DEG,
      spheres: [
        ...[0, 1, 2].map(i => ({ c: B3D.S[i], r: B3D.r[i] + e, col: i, vis: 0.75 })),
        { c: sp, r: (B3D.r[3] + e) * es(t, 10.8, 14.5), col: 3, vis: 0.75 * seg(t, 10.6, 11.2) },
      ],
      earth: { c: B3D.E, r: B3D.RE, vis: 1 },
    };
  },
  draw(t) {
    const cam = this._cam, S = B3D.S, e = this.e(t);
    [0, 1, 2].forEach(i => O3.sat(cam, i, S[i], 1));
    O3.sat(cam, 3, B3D.fly(3, t, 7.5, 10.5), seg(t, 7.5, 8));
    const X = trilat3(S[0], S[1], S[2], B3D.r[0] + e, B3D.r[1] + e, B3D.r[2] + e);
    const T = V3.dist(X[0], B3D.R) < V3.dist(X[1], B3D.R) ? X[0] : X[1];
    O3.ring(cam, T, COL.red, seg(t, 3, 4.5), 550);
    const tp = project(cam, T);
    if (tp) Sk.text('tre kuler møtes her', tp.x - 30, tp.y + 44, { size: 28, align: 'right', alpha: win(t, 4, 30, 1) });
    // gap to sphere 4
    const g = V3.dist(T, S[3]) - (B3D.r[3] + e);
    const ga = win(t, 15, 31, 0.8);
    if (ga > 0 && Math.abs(g) > 0.02) {
      const dir = V3.norm(V3.sub(S[3], T));
      const end = V3.add(T, V3.mul(dir, g));
      const ep = project(cam, end);
      if (tp && ep) {
        Sk.arrow(tp, ep, { color: COL.s[3], width: 2.6, alpha: ga, progress: es(t, 15, 16.5), seed: 551, head: 10 });
        Sk.text(`4. kule bommer: ${fmt(Math.abs(g) * 1000)} km`, ep.x + 20, ep.y - 24, { size: 28, weight: 700, color: mixHex([COL.s[3]], 0.7), alpha: ga });
      }
    }
    const ok = seg(t, 31, 32);
    if (ok > 0) {
      const p = project(cam, B3D.R);
      if (p && t < 36) { const k = seg(t, 31, 35); Sk.circle(p, 14 + k * 70, { color: COL.green, width: 3, alpha: (1 - k), seed: 552 }); }
      if (p) Sk.check(P(p.x + 30, p.y - 8), 13, { progress: es(t, 31.5, 32.5) });
    }
    Sk.text('|P − Sᵢ| = ρᵢ − c·δ ,  i = 1 … 4', 90, 880, { size: 40, weight: 700, color: COL.red, progress: es(t, 21, 25) });
    Sk.text('fire likninger · fire ukjente: x, y, z, δ', 90, 932, { size: 32, progress: es(t, 25, 28) });
    const cd = Math.round(e * 1000);
    if (t > 2 && t < 33) Sk.text(`c·δ = ${fmt(cd)} km`, 1240, 210, { size: 34, weight: 700, align: 'right', color: COL.red, alpha: win(t, 2, 33, 0.8) });
  },
});

/* ================= zoom down to the car ================= */
scene({
  key: 'k6', act: 'Rommet (3D)', title: 'Ned på bakken', dur: 44, gl: true, fadeIn: false,
  cues: [
    [0.8, 13, 'Vi zoomer inn mot punktet. Kulene er så enorme at de ser nesten flate ut her nede – som glassplater som skjærer gjennom landskapet.'],
    [12, 27, 'Alle skjæringslinjene møtes akkurat der bilen er. Det er hele posisjonsberegningen: <b>bredde, lengde og høyde</b>.'],
    [25, 43.5, 'Mottakeren gjør dette flere ganger i sekundet. Men hva med farten?'],
  ],
  gl3d(t) {
    const k = es(t, 1, 17);
    const c = {
      target: V3.lerp([0, 10, 0], B3D.R, es(t, 1, 12)), yaw: yawRun(2.28, t, 0.004),
      pitch: lerp(0.10, 0.42, k), dist: Math.exp(lerp(Math.log(112), Math.log(2.2), k)),
    };
    this._cam = camera(c);
    return {
      cam: this._cam, tilt: 30 * DEG, lineW: 2.6,
      spheres: [0, 1, 2, 3].map(i => ({ c: B3D.S[i], r: B3D.r[i], col: i, vis: lerp(0.75, 1, k) })),
      earth: { c: B3D.E, r: B3D.RE, vis: 1 },
    };
  },
  draw(t) {
    const cam = this._cam;
    const far = 1 - seg(t, 6, 10);
    [0, 1, 2, 3].forEach(i => O3.sat(cam, i, B3D.S[i], far));
    const ca = seg(t, 14, 17);
    if (ca > 0) {
      // a road along a great circle through the receiver
      const pts = [];
      for (let s = -1.6; s <= 1.6; s += 0.05) {
        const q = V3.add(B3D.E, V3.mul(V3.norm(V3.sub([s, 0, s * 0.35], B3D.E)), B3D.RE + 0.002));
        const pp = project(cam, q); if (pp) pts.push(P(pp.x, pp.y));
      }
      Sk.path(pts, { color: COL.pencil, width: 3, alpha: 0.6 * ca, seed: 560 });
      const p = project(cam, B3D.R);
      if (p) {
        Sk.carSide(P(p.x, p.y + 2), { alpha: ca, scale: 1.1 });
        Sk.text('59,94° N · 10,72° Ø · 94 moh.', p.x + 60, p.y + 60, { size: 32, weight: 700, progress: es(t, 18, 21) });
        Sk.text('(Blindern, for eksempel)', p.x + 60, p.y + 98, { size: 26, alpha: seg(t, 21, 22.5), color: COL.pencil });
      }
    }
  },
});
