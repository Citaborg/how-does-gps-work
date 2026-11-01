'use strict';
/* Speed (Doppler), how a satellite knows where it is, echoes, signal
   conditions, jamming/spoofing and the closing summary. */

function paperBlob(c, r, a = 0.9) {
  const ctx = Sk.ctx, g = ctx.createRadialGradient(c.x, c.y, r * 0.55, c.x, c.y, r);
  g.addColorStop(0, `rgba(245,239,227,${a})`); g.addColorStop(1, 'rgba(245,239,227,0)');
  ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, r, 0, TAU); ctx.fill(); ctx.restore();
}

function drawEarth(c, R, o = {}) {
  const a = o.alpha ?? 1, ctx = Sk.ctx; if (a <= 0.004) return;
  ctx.save(); ctx.globalAlpha = a;
  const g = ctx.createRadialGradient(c.x - R * 0.35, c.y - R * 0.4, R * 0.1, c.x, c.y, R);
  g.addColorStop(0, '#e3ece6'); g.addColorStop(1, '#b7cdd2');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c.x, c.y, R, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(c.x, c.y, R, 0, TAU); ctx.clip();
  // continents: soft green scribbled blobs
  [[-0.35, -0.3, 0.38], [0.3, 0.15, 0.32], [-0.1, 0.5, 0.22], [0.45, -0.45, 0.18]].forEach(([dx, dy, s], i) => {
    const pc = P(c.x + dx * R, c.y + dy * R), pts = [];
    for (let k = 0; k <= 40; k++) { const an = k / 40 * TAU; pts.push(polar(pc, s * R * (1 + 0.28 * noise1(k / 5, i + 3)), an)); }
    ctx.fillStyle = 'rgba(111,154,92,.38)'; ctx.beginPath(); pts.forEach((p, j) => (j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.fill();
    Sk.path(pts, { color: COL.green, width: 1.3, alpha: 0.55 * a, passes: 1, seed: 600 + i });
  });
  Sk.hatch(c.x - R, c.y - R, R * 2, R * 2, { gap: 6, alpha: 0.12, angle: 0.9 });
  ctx.restore();
  // night-side shading
  ctx.save(); ctx.globalAlpha = a * 0.25; ctx.beginPath(); ctx.arc(c.x, c.y, R, -0.3, Math.PI - 0.3); ctx.arc(c.x + R * 0.18, c.y + R * 0.1, R * 0.95, Math.PI - 0.3, -0.3, true); ctx.fillStyle = '#556070'; ctx.fill(); ctx.restore();
  Sk.circle(c, R, { width: 2.8, alpha: a, seed: o.seed || 610 });
}

/* ================= SPEED: DOPPLER ================= */
const VS = 1.6; // velocity drawing scale (px per px/s)
scene({
  key: 'v1', act: 'Fart', title: 'Farten – Dopplereffekten', dur: 66, road: true, speed: 62, sStart: () => roadNearest(P(240, 530)),
  cues: [
    [0.8, 12, 'Posisjon er én ting. Men hvor fort kjører bilen? Vi kunne målt posisjonen to ganger og delt på tiden – men GPS kan gjøre det mye bedre.'],
    [8, 20, 'Når bilen kjører <em>mot</em> en satellitt, møter den bølgetoppene litt oftere: frekvensen øker. Kjører den bort, synker den. Det er Dopplereffekten: <b>f = f₀ (1 + v·û / c)</b>.'],
    [17, 31, 'Frekvensskiftet forteller bare om farten <em>langs</em> siktelinjen til satellitten: <b>v·û = |v| cos θ</b>. Geometrisk er det skyggen av fartspila på siktelinjen.'],
    [28, 40, 'Hver satellitt gir sin egen skygge – vi tegner alle samtidig. Tre skygger, tre retninger.'],
    [37, 52, 'I et fartsdiagram blir hver måling en <b>rett linje</b> (alle v med samme skygge). Linjene krysser i bilens fartsvektor – akkurat som sirklene krysset i posisjonen.'],
    [49, 65.5, 'Mottakerens klokkedrift skyver alle linjene likt – igjen en liten trekant som løses med én ekstra satellitt. Satellittenes egen fart kjenner vi fra banedataene. Resultatet: fart på centimeter per sekund.'],
  ],
  draw(t) {
    const car = carAt(this, t);
    drawMap(0.55);
    const S = MAP.sats, idx = [0, 1, 2];
    drawBands(idx.map(i => ({ c: S[i], r: dist(S[i], car), i, a: 0.4 })), { cross: 0.5 });
    idx.forEach(i => drawSat(i, S[i], 1));
    const v = mul(car.dir, car.v), sp = len(v), tip = add(car, mul(v, VS));
    const ctx = Sk.ctx;

    // 1. wave crests from S1 arriving at the car
    const w1 = win(t, 3, 18, 1);
    if (w1 > 0) {
      const S0 = S[0], rc = dist(S0, car), ph = (t * 0.9) % 1;
      ctx.save(); ctx.beginPath(); ctx.arc(car.x, car.y, 170, 0, TAU); ctx.clip();
      for (let k = -6; k <= 6; k++) {
        const rr = rc + (k + ph) * 28, fade = 1 - Math.abs(k + ph) / 6.5;
        Sk.arc(S0, rr, angOf(sub(car, S0)) - 0.4, angOf(sub(car, S0)) + 0.4, { color: COL.s[0], width: 2, alpha: 0.75 * w1 * clamp(fade), passes: 1, seed: 620 + k });
      }
      ctx.restore();
      const u = nrm(sub(S0, car)), c = dot(nrm(v), u);
      const x0 = 90, y0 = 790;
      paperBlob(P(x0 + 150, y0 + 40), 190, 0.85 * w1);
      Sk.text('sendt: f₀', x0, y0 - 30, { size: 26, alpha: w1 });
      Sk.wave(x0 + 110, y0 - 30, 200, 9, 26, { color: COL.pencil, alpha: w1, phase: -t * 4 });
      Sk.text('mottatt:', x0, y0 + 20, { size: 26, alpha: w1 });
      Sk.wave(x0 + 110, y0 + 20, 200, 9, 26 / (1 + 0.35 * c), { color: COL.s[0], alpha: w1, phase: -t * 4 * (1 + 0.35 * c) });
      Sk.text(c > 0 ? '(tettere: bilen kjører mot S₁)' : '(glissere: bilen kjører fra S₁)', x0 + 110, y0 + 56, { size: 22, alpha: w1, color: COL.pencil });
      Sk.text('f = f₀ (1 + v·û / c)', x0, y0 + 110, { size: 38, weight: 700, color: COL.red, progress: es(t, 9, 12), alpha: w1 });
    }

    // 2–3. projections of v onto every line of sight
    const pr = Math.max(win(t, 17, 47, 1) * (1), 0);
    if (pr > 0 && sp > 1) {
      idx.forEach((i, n) => {
        const a = pr * (i === 0 ? 1 : seg(t, 28 + n, 29.5 + n));
        if (a <= 0) return;
        const u = nrm(sub(S[i], car)), vp = dot(v, u), F = add(car, mul(u, vp * VS));
        const col = mixHex([COL.s[i]], 0.7), sb = '₁₂₃'[i];
        Sk.arrow(car, add(car, mul(u, 150)), { color: col, width: 1.5, alpha: 0.6 * a, seed: 630 + i, head: 9 });
        Sk.text('û' + sb, car.x + u.x * 168, car.y + u.y * 168, { size: 26, color: col, alpha: a, align: 'center' });
        if (dist(tip, F) > 6) {
          Sk.line(tip, F, { color: COL.pencil, width: 1.3, alpha: 0.8 * a, passes: 1, seed: 640 + i });
          Sk.rightAngle(F, nrm(sub(car, F)), nrm(sub(tip, F)), 9, { alpha: a * 0.8 });
        }
        Sk.line(car, F, { color: col, width: 5, alpha: 0.85 * a, seed: 650 + i, wobble: 0.6 });
        const df = Math.round(105 * vp / 62);
        const lp = add(F, mul(u, vp >= 0 ? 26 : -26));
        Sk.text(`Δf${sb} = ${df >= 0 ? '+' : '−'}${Math.abs(df)} Hz`, lp.x + 8, lp.y + 22, { size: 25, weight: 700, color: col, alpha: a });
        if (i === 0) {
          const a0 = angOf(v), a1 = angOf(u);
          let d = a1 - a0; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
          Sk.arc(car, 38, a0, a0 + d, { color: col, width: 1.6, alpha: a * seg(t, 20, 21), seed: 660 });
          const m = polar(car, 54, a0 + d / 2);
          Sk.text('θ₁', m.x, m.y, { size: 24, color: col, alpha: a * seg(t, 20, 21), align: 'center' });
          Sk.text('v·û₁ = |v| cos θ₁', 90, 905, { size: 38, weight: 700, color: COL.red, progress: es(t, 21, 24), alpha: win(t, 21, 47, 1) });
        }
      });
    }

    // 4. velocity diagram: every measurement is a line, they cross at v
    const dv = win(t, 36, 66, 1);
    if (dv > 0) {
      const O = P(905, 650);
      paperBlob(O, 210, 0.93 * dv);
      Sk.arrow(P(O.x - 140, O.y), P(O.x + 140, O.y), { color: COL.pencil, width: 1.4, alpha: dv, head: 9, seed: 670 });
      Sk.arrow(P(O.x, O.y + 140), P(O.x, O.y - 140), { color: COL.pencil, width: 1.4, alpha: dv, head: 9, seed: 671 });
      Sk.text('vₓ', O.x + 150, O.y + 4, { size: 24, alpha: dv }); Sk.text('v_y', O.x + 8, O.y - 152, { size: 24, alpha: dv });
      Sk.text('fartsdiagram', O.x - 140, O.y - 150, { size: 28, weight: 700, alpha: dv });
      const drift = 16 * (es(t, 51, 54) - es(t, 58, 61));
      ctx.save(); ctx.beginPath(); ctx.arc(O.x, O.y, 150, 0, TAU); ctx.clip();
      idx.forEach((i, n) => {
        const u = nrm(sub(S[i], car)), m = (dot(v, u) * VS) + drift, base = add(O, mul(u, m)), q = perp(u);
        Sk.line(add(base, mul(q, -160)), add(base, mul(q, 160)), { color: mixHex([COL.s[i]], 0.75), width: 2.3, alpha: dv, progress: es(t, 38 + n * 1.2, 40 + n * 1.2), seed: 680 + i });
      });
      ctx.restore();
      const vt = add(O, mul(v, VS));
      if (t > 42.5) {
        Sk.arrow(O, vt, { color: INK, width: 3, alpha: dv, progress: es(t, 42.5, 44), seed: 690 });
        if (drift < 2) Sk.circle(vt, 10, { color: INK, width: 2, alpha: dv, seed: 691, over: 0.5 });
        Sk.text('v', vt.x + 14, vt.y - 14, { size: 30, weight: 700, alpha: dv });
      }
      if (drift > 2) Sk.text('klokkedrift → liten trekant', O.x - 140, O.y + 170, { size: 26, color: COL.red, alpha: dv });
    }

    if (sp > 1) {
      Sk.arrow(car, tip, { color: INK, width: 3.2, alpha: seg(t, 15, 16), seed: 695, head: 12 });
      Sk.text('v', tip.x + 10, tip.y - 12, { size: 30, weight: 700, alpha: seg(t, 15, 16) });
    }
    Sk.carTop(car, car.ang);
    Sk.text('72 km/t', car.x - 30, car.y + 34, { size: 24, alpha: seg(t, 15, 16), color: COL.pencil });
  },
});

/* ================= SATELLITE ORBIT: KEPLER ================= */
scene({
  key: 's1', act: 'Satellittens posisjon', title: 'Banen – Keplers lover', dur: 50,
  cues: [
    [0.8, 12, 'Men hvordan vet satellitten selv hvor den er? Alt vi har gjort hviler jo på at den oppgir riktig posisjon.'],
    [9, 22, 'Satellitter følger Keplers lover. Banen er en ellipse med jorda i det ene brennpunktet – her kraftig overdrevet.'],
    [19, 32, 'Linja fra jorda til satellitten sveiper over <b>like store arealer på like lang tid</b>. Nær jorda går den fort, langt unna sakte.'],
    [30, 43, 'Ekte GPS-baner er nesten sirkler: radius ca. 26 560 km, omløpstid <b>11 t 58 min</b> – to runder per døgn.'],
    [41, 49.5, 'Det gjør banen svært forutsigbar. Men ikke perfekt …'],
  ],
  draw(t) {
    const Fc = P(640, 560), a = 400, T = 14;
    const e = lerp(0.45, 0.02, es(t, 31, 37));
    const b = a * Math.sqrt(1 - e * e);
    const pos = tt => {
      const M = TAU * (tt - 3) / T; let E = M;
      for (let k = 0; k < 8; k++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
      return P(Fc.x + a * (Math.cos(E) - e), Fc.y + b * Math.sin(E) * -1);
    };
    drawEarth(Fc, 70, { alpha: seg(t, 0.2, 1.5) });
    const orbit = []; for (let k = 0; k <= 160; k++) { const E = k / 160 * TAU; orbit.push(P(Fc.x + a * (Math.cos(E) - e), Fc.y + b * Math.sin(E))); }
    Sk.path(orbit, { color: COL.pencil, width: 1.8, alpha: 0.75, progress: es(t, 1, 4), seed: 700 });
    // equal areas
    const sa = 1 - seg(t, 28, 31);
    [[8.77, 11.23, 1], [15.77, 18.23, 2]].forEach(([t0, t1, ci]) => {
      if (t < t0 || sa <= 0) return;
      const pts = [Fc]; for (let tt = t0; tt <= Math.min(t, t1); tt += 0.05) pts.push(pos(tt));
      const ctx = Sk.ctx; ctx.save(); ctx.globalAlpha = 0.28 * sa; ctx.fillStyle = COL.s[ci];
      ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))); ctx.closePath(); ctx.fill(); ctx.restore();
      if (t > t1) {
        Sk.poly(pts.filter((_, i) => i % 6 === 0 || i === pts.length - 1), { color: mixHex([COL.s[ci]], 0.7), width: 1.6, alpha: sa, seed: 710 + ci });
        const m = lerpP(Fc, pts[Math.floor(pts.length / 2)], 0.62);
        Sk.text('A', m.x, m.y, { size: 36, weight: 700, color: mixHex([COL.s[ci]], 0.6), alpha: sa, align: 'center' });
      }
    });
    Sk.text('Δt = Δt  →  A = A', 900, 300, { size: 36, weight: 700, color: COL.red, progress: es(t, 19, 21), alpha: sa });
    Sk.text('r(ν) = a(1 − e²) / (1 + e·cos ν)', 880, 380, { size: 32, progress: es(t, 13, 16) });
    Sk.text('T² = 4π² a³ / GM', 880, 440, { size: 34, weight: 700, progress: es(t, 24, 26) });
    Sk.text(`e = ${fmt(e, 2)}` + (e > 0.3 ? '  (overdrevet)' : '  (GPS: e ≈ 0,01)'), 880, 500, { size: 28, progress: es(t, 9, 11) });
    Sk.text('a = 26 560 km  →  T = 11 t 58 min', 880, 580, { size: 32, weight: 700, color: COL.red, progress: es(t, 36, 39) });
    Sk.text('= et halvt stjernedøgn', 900, 624, { size: 26, color: COL.pencil, progress: es(t, 39, 41) });
    const sp = pos(t);
    drawSat(1, sp, seg(t, 2, 3), { label: false, scale: 0.7 });
    if (t > 4) Sk.line(Fc, sp, { color: COL.pencil, width: 1.2, alpha: 0.5, passes: 1, seed: 720 });
  },
});

/* ================= GROUND CONTROL ================= */
scene({
  key: 's2', act: 'Satellittens posisjon', title: 'Bakkestasjonene passer på', dur: 58,
  cues: [
    [0.8, 12, 'Forutsigbar – men ikke perfekt. Jordas ujevne tyngdefelt, Månen, Sola og trykket fra sollyset dytter satellitten litt ut av kurs.'],
    [9, 22, 'Rundt om på jorda står overvåkingsstasjoner som hele tiden måler avstanden til satellittene. Det er trilaterasjon – bare <em>baklengs</em>: nå er det bakken som er kjent, og satellitten som skal finnes.'],
    [20, 33, 'Kontrollsenteret sammenligner målt bane med forventet bane, regner ut nye banedata – <b>efemerider</b> – og en klokkekorreksjon, og sender dem opp.'],
    [31, 43, 'Blir avviket for stort, fyrer satellitten små rakettmotorer og legger seg tilbake i riktig bane.'],
    [41, 57.5, 'Satellitten legger efemeridene inn i hvert eneste signal den sender. Slik vet bilen nøyaktig hvor satellitten var da signalet gikk.'],
  ],
  draw(t) {
    const c = P(560, 585), R = 165, RO = 355;
    drawEarth(c, R, { alpha: seg(t, 0.2, 1.4) });
    Sk.circle(c, RO, { color: COL.pencil, width: 1.5, alpha: 0.5, progress: es(t, 0.6, 3), seed: 730 });
    Sk.text('forventet bane', c.x - RO * 0.72 - 30, c.y - RO * 0.72 - 10, { size: 24, color: COL.pencil, alpha: seg(t, 3, 4), rot: -0.75, align: 'center' });
    const th = -2.4 + 0.075 * t;
    const dev = 28 * es(t, 4, 16) * (1 - es(t, 34, 41)) + 3 * Math.sin(t * 0.8) * seg(t, 4, 8) * (1 - seg(t, 34, 41));
    const satP = polar(c, RO + dev, th), pred = polar(c, RO, th);
    // actual path trail
    const trail = []; for (let tt = Math.max(0, t - 12); tt <= t; tt += 0.2) {
      const d = 28 * es(tt, 4, 16) * (1 - es(tt, 34, 41)) + 3 * Math.sin(tt * 0.8) * seg(tt, 4, 8) * (1 - seg(tt, 34, 41));
      trail.push(polar(c, RO + d, -2.4 + 0.075 * tt));
    }
    Sk.path(trail, { color: COL.s[1], width: 2, alpha: 0.7, seed: 731 });
    if (dev > 6) {
      Sk.satIcon(pred, { color: COL.pencil, alpha: 0.35, scale: 0.6, rot: th + Math.PI / 2 });
      Sk.arrow(pred, satP, { color: COL.red, width: 2, alpha: seg(dev, 6, 12), head: 8, seed: 732 });
      const lp = polar(c, RO + dev + 70, th - 0.05);
      Sk.text('avvik (overdrevet)', lp.x, lp.y, { size: 26, color: COL.red, alpha: seg(dev, 8, 14), align: 'center' });
    }
    // monitor stations
    const st = [-2.1, -1.25, -0.4, 0.55, 2.55, 1.6].map(a => ({ a, p: polar(c, R, a) }));
    st.forEach((s, i) => {
      Sk.antenna(s.p, { up: P(Math.cos(s.a), Math.sin(s.a)), alpha: seg(t, 5 + i * 0.3, 6 + i * 0.3), scale: i === 1 ? 1.2 : 0.9 });
      const vis = dot(sub(satP, s.p), P(Math.cos(s.a), Math.sin(s.a))) > 30;
      const la = win(t, 8 + i * 0.4, 24, 0.8);
      if (vis && la > 0) {
        Sk.line(s.p, satP, { color: INK, width: 1.4, alpha: 0.7 * la, passes: 1, seed: 740 + i, progress: es(t, 8 + i * 0.4, 9.5 + i * 0.4) });
        if (i === 2) segLabel(s.p, satP, 'ρ', { alpha: la, size: 26 });
      }
    });
    const M = st[1].p;
    Sk.text('★ kontrollsenter', M.x + 26, M.y - 60, { size: 26, weight: 700, alpha: seg(t, 18, 19.5), color: COL.red });
    // computation notes
    const nx = 990, ny = 250, na = win(t, 20, 57, 1);
    paperBlob(P(nx + 150, ny + 90), 260, 0.8 * na);
    Sk.text('målt − forventet = Δr', nx, ny, { size: 30, progress: es(t, 20, 22), alpha: na });
    Sk.text('nye efemerider:', nx, ny + 52, { size: 30, weight: 700, progress: es(t, 23, 24.5), alpha: na });
    Sk.text('a, e, i, Ω, ω, M₀ …', nx + 20, ny + 98, { size: 30, color: COL.s[1], progress: es(t, 24.5, 26.5), alpha: na });
    Sk.text('+ klokkekorreksjon', nx + 20, ny + 142, { size: 30, color: COL.s[1], progress: es(t, 26.5, 28), alpha: na });
    // upload
    const up = win(t, 28, 34, 0.5);
    if (up > 0) {
      const k = es(t, 28, 32.5);
      const pts = []; const d = sub(satP, M), L = len(d), u = nrm(d), q = perp(u);
      for (let s = 0; s <= L * k; s += 3) pts.push(add(add(M, mul(u, s)), mul(q, Math.sin(s / 9) * 6)));
      if (pts.length > 1) Sk.path(pts, { color: COL.red, width: 2, alpha: up, passes: 1, seed: 750 });
      if (k < 1) Sk.envelope(add(M, mul(u, L * k)), 0, { alpha: up, color: COL.red });
    }
    // thruster burn
    if (t > 34 && t < 39) {
      const out = P(Math.cos(th), Math.sin(th)), k = seg(t, 34, 39);
      for (let i = 0; i < 6; i++) {
        const dd = add(out, mul(perp(out), (i - 2.5) * 0.18));
        Sk.line(add(satP, mul(dd, 20)), add(satP, mul(dd, 34 + 14 * Math.sin(t * 20 + i))), { color: '#e08a2b', width: 2, alpha: (1 - k) * 0.9, passes: 1 });
      }
      Sk.text('korreksjon', satP.x + 40, satP.y - 30, { size: 26, color: '#c0661a', alpha: 1 - k });
    }
    if (t > 40) Sk.check(add(satP, P(36, 24)), 11, { progress: es(t, 40, 41), alpha: win(t, 40, 47, 0.6) });
    // broadcast to a car
    const bc = win(t, 43, 58, 1);
    if (bc > 0) {
      const ca = th + 0.35, cp = polar(c, R, ca), cu = P(Math.cos(ca), Math.sin(ca));
      Sk.dot(cp, 6, '#f0b84a', bc); Sk.circle(cp, 7, { width: 1.6, alpha: bc, seed: 760 });
      Sk.text('bilen', cp.x + cu.x * 40, cp.y + cu.y * 40, { size: 26, alpha: bc, align: 'center' });
      const k = (t - 43) % 3 / 3;
      Sk.line(satP, cp, { color: COL.s[1], width: 2, alpha: bc * 0.8, seed: 761 });
      Sk.envelope(lerpP(satP, cp, k), 0, { alpha: bc * (1 - seg(k, 0.85, 1)), color: mixHex([COL.s[1]], 0.6) });
      Sk.text('«her er jeg, og klokka er …»', satP.x + 40, satP.y + 40, { size: 26, color: mixHex([COL.s[1]], 0.6), progress: es(t, 44, 46), alpha: bc });
    }
    Sk.satIcon(satP, { color: COL.s[1], scale: 0.75, rot: th + Math.PI / 2, alpha: seg(t, 1, 2) });
  },
});

/* ================= CLOCKS & RELATIVITY ================= */
scene({
  key: 's3', act: 'Satellittens posisjon', title: 'Atomklokker og Einstein', dur: 60,
  cues: [
    [0.8, 12, 'Klokkene må være ekstremt presise: ett nanosekund feil gir 30 cm feil. Hver satellitt har derfor flere atomklokker om bord.'],
    [10, 22, 'Men Einstein blander seg inn. Høyt over jorda er tyngdefeltet svakere, og da går klokka <em>fortere</em>: ca. <b>+45 µs per døgn</b> (generell relativitet).'],
    [19, 31, 'Samtidig farer satellitten av sted med 3,9 km/s, og da går klokka <em>saktere</em>: ca. <b>−7 µs per døgn</b> (spesiell relativitet).'],
    [29, 43, 'Netto: +38 µs per døgn. Ganger vi med lysfarten, blir det over <b>11 km feil – hver eneste dag</b>.'],
    [41, 59.5, 'Derfor stilles klokkene før oppskyting til 10,229 999 995 43 MHz i stedet for 10,23 MHz. Utregningen er godt forklart i UiO-bloggen som er kilde nederst til høyre.'],
  ],
  draw(t) {
    const c = P(330, 770), R = 150;
    drawEarth(c, R, { alpha: seg(t, 0.2, 1.4) });
    Sk.arc(c, 470, -1.65, -0.25, { color: COL.pencil, width: 1.5, alpha: 0.5, progress: es(t, 0.6, 3), seed: 800 });
    const sp = polar(c, 470, -0.95 + 0.004 * t);
    Sk.satIcon(sp, { color: COL.s[2], scale: 0.8, rot: -0.95 + Math.PI / 2, alpha: seg(t, 1, 2) });
    const gC = P(330, 560), sC = P(sp.x + 110, sp.y - 70);
    Sk.clock(gC, 42, { alpha: seg(t, 2, 3), time: t * 1.6 });
    Sk.clock(sC, 42, { alpha: seg(t, 2.5, 3.5), time: t * 1.6 * (1 + 0.035 * seg(t, 12, 14)), hand: COL.s[2] });
    Sk.text('bakken', gC.x, gC.y - 60, { size: 26, align: 'center', alpha: seg(t, 3, 4) });
    Sk.text('satellitten', sC.x, sC.y - 60, { size: 26, align: 'center', alpha: seg(t, 3, 4) });
    Sk.text('atomklokke ⚛', sC.x + 60, sC.y + 30, { size: 24, color: COL.pencil, alpha: seg(t, 4, 5) });

    // number line, µs per day
    const x0 = 960, sc = 8, y = 300;
    const nl = seg(t, 10, 11);
    Sk.line(P(x0 - 30, y + 140), P(x0 + 45 * sc + 30, y + 140), { color: COL.pencil, width: 1.4, alpha: nl, seed: 801 });
    [0, 10, 20, 30, 40].forEach(v => { Sk.line(P(x0 + v * sc, y + 133), P(x0 + v * sc, y + 147), { width: 1.2, alpha: nl, passes: 1 }); Sk.text(String(v), x0 + v * sc, y + 166, { size: 20, align: 'center', alpha: nl, color: COL.pencil }); });
    Sk.text('µs per døgn', x0 + 45 * sc + 20, y + 166, { size: 20, alpha: nl, color: COL.pencil });
    Sk.arrow(P(x0, y), P(x0 + 45 * sc, y), { color: COL.green, width: 4, progress: es(t, 12, 15), seed: 802 });
    Sk.text('tyngdefelt (GR): +45', x0, y - 30, { size: 28, weight: 700, color: COL.green, progress: es(t, 13, 15) });
    Sk.arrow(P(x0 + 45 * sc, y + 45), P(x0 + 38 * sc, y + 45), { color: COL.red, width: 4, progress: es(t, 21, 23), seed: 803, head: 10 });
    Sk.text('fart (SR): −7', x0 + 38 * sc - 14, y + 45, { size: 28, weight: 700, color: COL.red, align: 'right', progress: es(t, 21.5, 23.5) });
    Sk.arrow(P(x0, y + 90), P(x0 + 38 * sc, y + 90), { color: INK, width: 4, progress: es(t, 30, 32), seed: 804 });
    Sk.text('netto +38', x0 + 38 * sc + 14, y + 90, { size: 30, weight: 700, progress: es(t, 31, 33) });

    const fx = 860, fy = 560;
    Sk.text('Δτ/τ ≈ GM/c² · (1/R − 1/r) − v²/(2c²)', fx, fy, { size: 30, weight: 700, progress: es(t, 15, 19) });
    Sk.text('R = jordradius, r = baneradius, v = 3,9 km/s', fx, fy + 40, { size: 22, color: COL.pencil, progress: es(t, 18, 20) });
    Sk.textSup('≈ 5,3·10^{-10} − 0,8·10^{-10} = 4,5·10^{-10}', fx, fy + 80, { size: 30, progress: es(t, 25, 28) });
    Sk.text('× 86 400 s ≈ 38 µs per døgn', fx, fy + 124, { size: 30, progress: es(t, 31, 33.5) });
    Sk.text('× c ≈ 11 km feil per døgn!', fx, fy + 176, { size: 36, weight: 700, color: COL.red, progress: es(t, 34, 37) });

    // what 11 km a day looks like
    const dd = win(t, 37, 60, 1);
    if (dd > 0) {
      const a = P(880, 880), b = P(1320, 880), k = es(t, 38, 46);
      Sk.line(a, b, { color: COL.pencil, width: 1.5, alpha: dd, seed: 805 });
      Sk.carTop(a, 0, { alpha: dd, scale: 0.8 });
      const g = lerpP(a, b, k);
      Sk.carTop(g, 0, { alpha: dd, ghost: true, ghostColor: COL.red, scale: 0.8 });
      Sk.text(`uten korreksjon: ${fmt(11.4 * k, 1)} km etter ett døgn`, a.x, a.y + 40, { size: 26, alpha: dd, color: COL.red });
      Sk.text('10,229 999 995 43 MHz', fx, fy + 246, { size: 34, weight: 700, color: COL.green, progress: es(t, 46, 49) });
      Sk.text('(i stedet for 10,23 MHz)', fx + 330, fy + 246, { size: 24, color: COL.pencil, progress: es(t, 49, 50) });
    }
  },
});

/* ================= ECHO BETWEEN GLASS BUILDINGS ================= */
const ECHO = {
  FY: 470,
  info(car) {
    const S = MAP.sats[2], B = MAP.block, G = MAP.glass;
    const blocked = segHitsRect(S, car, B);
    const Sm = P(S.x, 2 * this.FY - S.y);
    let F = null, reflOK = false;
    if (car.y < this.FY) {
      const k = (this.FY - Sm.y) / (car.y - Sm.y);
      F = P(Sm.x + (car.x - Sm.x) * k, this.FY);
      reflOK = F.x > G.x + 4 && F.x < G.x + G.w - 4 && !segHitsRect(S, F, B);
    }
    return { blocked, reflOK, F, Sm, extra: dist(Sm, car) - dist(S, car) };
  },
  measured(s) {
    let ex = 0, lost = 0, n = 0;
    for (let ds = -30; ds <= 30; ds += 10) {
      const p = roadPose(s + ds), e = this.info(p);
      if (e.blocked) { if (e.reflOK) ex += e.extra; else lost += 1; }
      n++;
    }
    return { extra: ex / n, lost: lost / n };
  },
};
scene({
  key: 'e1', act: 'Ekko og signalforhold', title: 'Ekko mellom glassbygg', dur: 58, road: true, speed: 30, stops: [[20, 37]],
  sStart: () => roadNearest(P(200, 590)),
  cues: [
    [0.8, 12, 'Ute på åpen vei er signalene rene, og sirklene møtes pent. Men byen er full av speil.'],
    [9, 21, 'Bilen kjører inn bak et høyt betongbygg. Det direkte signalet fra S₃ blokkeres – men et <em>ekko</em> fra glassfasaden kommer fram.'],
    [18, 31, 'Ekkoet har gått en omvei. Mottakeren tror S₃ er lenger unna, den grønne sirkelen blir for stor – og vi får en <b>spøkelsesposisjon</b>.'],
    [28, 40, 'Et geometrisk triks: omveien er nøyaktig like lang som den rette linja fra en <em>speilsatellitt</em> bak fasaden.'],
    [38, 50, 'Spøkelset hopper rundt når bilen beveger seg, fordi refleksjonen endrer seg. Kjenner du igjen at kartet plutselig setter deg i feil gate? Det er dette.'],
    [48, 57.5, 'La oss skjære gjennom gata her, og se det fra siden.'],
  ],
  ghostAt(t) {
    const car = carAt(this, t), S = MAP.sats, m = ECHO.measured(car.s);
    const rng = [dist(S[0], car), dist(S[1], car), dist(S[2], car) + m.extra];
    const g = m.lost > 0.5 ? solve2D([S[0], S[1]], [rng[0], rng[1]], car) : solve2D(S.slice(0, 3), rng, car);
    return { car, m, g, rng };
  },
  draw(t) {
    const { car, m, g, rng } = this.ghostAt(t);
    const S = MAP.sats;
    drawMap(1);
    Sk.text('glassfasade', MAP.glass.x + 10, MAP.glass.y + 22, { size: 24, color: '#3b6f90', alpha: seg(t, 6, 8) });
    Sk.text('betongbygg', MAP.block.x + MAP.block.w + 10, MAP.block.y + 20, { size: 24, alpha: seg(t, 6, 8) });
    drawBands([
      { c: S[0], r: rng[0], i: 0, a: 1 },
      { c: S[1], r: rng[1], i: 1, a: 1 },
      { c: S[2], r: rng[2], i: 2, a: 1 - m.lost * 0.8 },
    ]);
    [0, 1, 2].forEach(i => drawSat(i, S[i], 1));
    const off = dist(g, car);
    // ghost trail
    for (let k = 1; k <= 14; k++) {
      const tt = t - k * 0.35; if (tt < 0) break;
      const h = this.ghostAt(tt);
      if (dist(h.g, h.car) > 6) Sk.dot(h.g, 3, COL.red, 0.5 * (1 - k / 15));
    }
    // geometry while stopped: all three lines of sight at once
    const ov = win(t, 20.6, 37, 0.7);
    if (ov > 0) {
      const e = ECHO.info(car);
      [0, 1].forEach((i, n) => {
        Sk.line(S[i], lerpP(S[i], car, es(t, 21 + n * 0.5, 22.5 + n * 0.5)), { color: mixHex([COL.s[i]], 0.72), width: 2.3, alpha: ov, seed: 820 + i });
      });
      const hit = segEnterRect(S[2], car, MAP.block);
      if (hit) {
        Sk.line(S[2], lerpP(S[2], hit, es(t, 22, 23.5)), { color: mixHex([COL.s[2]], 0.72), width: 2.3, alpha: ov, seed: 822 });
        Sk.crossOut(hit, 15, { progress: es(t, 23.5, 24.5), alpha: ov });
      }
      if (e.F && e.reflOK) {
        Sk.arrow(S[2], e.F, { color: COL.s[2], width: 2.8, alpha: ov, progress: es(t, 25, 26.5), seed: 823 });
        Sk.arrow(e.F, car, { color: COL.s[2], width: 2.8, alpha: ov, progress: es(t, 26.5, 27.5), seed: 824 });
        const ma = ov * seg(t, 28.5, 29.5);
        Sk.satIcon(e.Sm, { color: COL.s[2], alpha: 0.4 * ma, scale: 0.75 });
        Sk.text('S₃′ (speilbilde)', e.Sm.x - 40, e.Sm.y + 50, { size: 26, color: mixHex([COL.s[2]], 0.6), alpha: ma, align: 'right' });
        Sk.line(e.Sm, e.F, { color: COL.pencil, width: 1.4, alpha: 0.8 * ma, progress: es(t, 29, 31), seed: 825, passes: 1 });
        Sk.text('|S₃F| + |FB| = |S₃′B|', 90, 870, { size: 36, weight: 700, color: COL.red, progress: es(t, 31, 33.5), alpha: ov });
        Sk.text(`omvei Δ = |S₃′B| − |S₃B| ≈ ${Math.round(m.extra * 0.5)} m`, 90, 922, { size: 30, progress: es(t, 33.5, 35.5), alpha: ov });
      }
    }
    if (off > 6) {
      ghostCar(g, car.ang, seg(off, 6, 16), COL.red, null);
      Sk.text('spøkelse', g.x + 20, g.y + 34, { size: 28, weight: 700, color: COL.red, alpha: seg(off, 8, 18) });
    }
    Sk.carTop(car, car.ang);
    // section line A–A
    const sl = seg(t, 48, 50);
    if (sl > 0) {
      const n = perp(car.dir), a = add(car, mul(n, -110)), b = add(car, mul(n, 110));
      Sk.line(a, b, { color: INK, width: 2.4, progress: es(t, 48, 50), seed: 830 });
      Sk.text('A', a.x - 18 * n.x, a.y - 18 * n.y, { size: 30, weight: 700, alpha: sl, align: 'center' });
      Sk.text('A', b.x + 18 * n.x, b.y + 18 * n.y, { size: 30, weight: 700, alpha: sl, align: 'center' });
      Sk.text('snitt A–A', b.x + 30, b.y + 10, { size: 26, alpha: seg(t, 50, 51) });
    }
  },
});

/* ================= CROSS-SECTION THROUGH THE STREET ================= */
scene({
  key: 'e2', act: 'Ekko og signalforhold', title: 'Snitt gjennom gata', dur: 50,
  cues: [
    [0.8, 12, 'Her står vi i snitt A–A: et betongbygg på den ene siden, et glasstårn på den andre. Satellitten står lavt på himmelen.'],
    [9, 21, 'Det direkte signalet stopper i betongen. Men det treffer glasset og spretter ned til bilen. Satellitten rett over oss har fri sikt.'],
    [18, 32, 'Speil satellitten i fasaden: den reflekterte veien er like lang som den rette linja fra speilbildet S₃′. Omveien blir <b>Δ ≈ 2a·cos ε</b>.'],
    [30, 42, 'Med a = 15 m til fasaden og ε = 45° blir det rundt 20 meter for mye – fra én eneste refleksjon.'],
    [40, 49.5, 'Inne i mottakeren ser det ut som en korrelasjonstopp som kommer for sent. Gode mottakere prøver å skille ekko fra direkte signal, men når det direkte mangler helt, er det vanskelig.'],
  ],
  draw(t) {
    const gy = 820, car = P(720, gy), A = { x: 480, w: 140, top: 470 }, G = { x: 860, w: 160, top: 200 };
    const S = P(430, 175), S1 = P(800, 180), Sm = P(2 * G.x - S.x, S.y);
    const ctx = Sk.ctx;
    Sk.line(P(60, gy), P(1340, gy), { width: 3, progress: es(t, 0.2, 2), seed: 840 });
    for (let x = 80; x < 1340; x += 26) Sk.line(P(x, gy + 4), P(x - 14, gy + 20), { width: 1, alpha: 0.4 * seg(t, 1, 2), passes: 1 });
    // concrete
    ctx.save(); ctx.globalAlpha = seg(t, 0.8, 2); ctx.fillStyle = 'rgba(120,112,100,.25)'; ctx.fillRect(A.x, A.top, A.w, gy - A.top);
    ctx.beginPath(); ctx.rect(A.x, A.top, A.w, gy - A.top); ctx.clip(); Sk.hatch(A.x, A.top, A.w, gy - A.top, { gap: 7, alpha: 0.3, angle: 0.8 }); ctx.restore();
    Sk.rect(A.x, A.top, A.w, gy - A.top, { width: 2.2, alpha: seg(t, 0.8, 2), seed: 841 });
    Sk.text('betong', A.x + A.w / 2, A.top + 40, { size: 26, align: 'center', alpha: seg(t, 2, 3) });
    // glass tower
    ctx.save(); ctx.globalAlpha = seg(t, 1, 2.2); ctx.fillStyle = 'rgba(95,159,196,.25)'; ctx.fillRect(G.x, G.top, G.w, gy - G.top);
    ctx.beginPath(); ctx.rect(G.x, G.top, G.w, gy - G.top); ctx.clip();
    for (let y = G.top + 30; y < gy; y += 46) Sk.line(P(G.x, y), P(G.x + G.w, y), { color: '#3b6f90', width: 1, alpha: 0.5, passes: 1 });
    for (let i = 0; i < 8; i++) Sk.line(P(G.x + 10 + i * 30, gy), P(G.x + 70 + i * 30, G.top), { color: '#fff', width: 3, alpha: 0.6, passes: 1 });
    ctx.restore();
    Sk.rect(G.x, G.top, G.w, gy - G.top, { color: '#3b6f90', width: 2.2, alpha: seg(t, 1, 2.2), seed: 842 });
    Sk.text('glass', G.x + G.w / 2, G.top + 40, { size: 26, align: 'center', color: '#3b6f90', alpha: seg(t, 2, 3) });
    Sk.carSide(car, { alpha: seg(t, 1.5, 2.5) });
    Sk.text('B', car.x, car.y + 40, { size: 30, weight: 700, align: 'center', alpha: seg(t, 2, 3) });
    drawSat(2, S, seg(t, 3, 4), { label: false });
    Sk.text('S₃', S.x - 60, S.y - 20, { size: 30, weight: 700, color: mixHex([COL.s[2]], 0.6), alpha: seg(t, 3, 4) });
    drawSat(0, S1, seg(t, 3.5, 4.5), { label: false });
    Sk.text('S₁', S1.x + 50, S1.y - 24, { size: 30, weight: 700, color: mixHex([COL.s[0]], 0.6), alpha: seg(t, 3.5, 4.5) });

    // direct, blocked
    const hit = segEnterRect(S, car, { x: A.x, y: A.top, w: A.w, h: gy - A.top });
    Sk.line(S, lerpP(S, hit, es(t, 6, 8)), { color: COL.s[2], width: 2.6, seed: 843 });
    Sk.crossOut(hit, 16, { progress: es(t, 8, 9) });
    // clear sky line from S1
    Sk.arrow(S1, lerpP(S1, car, 0.94), { color: COL.s[0], width: 2.6, progress: es(t, 10, 12), seed: 844 });
    Sk.check(P(car.x + 70, car.y - 120), 11, { progress: es(t, 12, 13) });
    // reflection
    const k = (G.x - Sm.x) / (car.x - Sm.x), F = P(G.x, Sm.y + (car.y - Sm.y) * k);
    Sk.arrow(S, F, { color: COL.s[2], width: 3, progress: es(t, 13, 15), seed: 845 });
    Sk.arrow(F, lerpP(F, car, 0.93), { color: COL.s[2], width: 3, progress: es(t, 15, 16.5), seed: 846 });
    Sk.text('F', F.x + 14, F.y + 4, { size: 28, weight: 700, alpha: seg(t, 15, 16) });
    // mirror construction
    const mc = seg(t, 19, 20);
    Sk.line(P(G.x, 150), P(G.x, G.top), { color: '#3b6f90', width: 1.4, alpha: 0.6 * mc, seed: 847, passes: 1 });
    Sk.satIcon(Sm, { color: COL.s[2], alpha: 0.4 * mc, scale: 0.8 });
    Sk.text('S₃′', Sm.x + 40, Sm.y + 50, { size: 30, weight: 700, color: mixHex([COL.s[2]], 0.6), alpha: mc });
    Sk.line(Sm, F, { color: COL.pencil, width: 1.6, alpha: 0.8 * mc, progress: es(t, 20, 22), seed: 848 });
    Sk.line(S, Sm, { color: COL.pencil, width: 1.2, alpha: 0.5 * mc, progress: es(t, 22, 24), seed: 849, passes: 1 });
    const mid = P(G.x, S.y);
    if (t > 24) { Sk.text('|', lerp(S.x, G.x, 0.5), S.y, { size: 26, alpha: mc, align: 'center' }); Sk.text('|', lerp(G.x, Sm.x, 0.5), S.y, { size: 26, alpha: mc, align: 'center' }); Sk.rightAngle(mid, P(-1, 0), P(0, 1), 12, { alpha: mc }); }
    // a and ε
    const da = seg(t, 25, 26.5);
    Sk.line(P(car.x, gy + 40), P(G.x, gy + 40), { width: 1.6, alpha: da, seed: 850 });
    Sk.line(P(car.x, gy + 30), P(car.x, gy + 50), { width: 1.6, alpha: da, passes: 1 });
    Sk.line(P(G.x, gy + 30), P(G.x, gy + 50), { width: 1.6, alpha: da, passes: 1 });
    Sk.text('a', (car.x + G.x) / 2, gy + 66, { size: 30, weight: 700, align: 'center', alpha: da });
    const eps = angOf(sub(S, car));
    const cp = P(car.x, car.y - 20);
    Sk.line(cp, P(cp.x - 90, cp.y), { color: COL.pencil, width: 1.3, alpha: da, passes: 1 });
    Sk.arc(cp, 60, Math.PI, eps < 0 ? eps + TAU : eps, { width: 1.8, alpha: da, seed: 851 });
    Sk.text('ε', cp.x - 80, cp.y - 30, { size: 30, weight: 700, alpha: da });
    Sk.text('Δ ≈ 2a·cos ε', 70, 310, { size: 44, weight: 700, color: COL.red, progress: es(t, 26, 28) });
    Sk.text('Δ = |S₃′B| − |S₃B|', 70, 362, { size: 30, progress: es(t, 28, 30) });
    Sk.text('a = 15 m, ε = 45° → Δ ≈ 21 m', 70, 408, { size: 28, progress: es(t, 31, 34) });
    // correlation peaks
    const cr = seg(t, 40, 41.5);
    if (cr > 0) {
      const x0 = 100, y0 = 960;
      Sk.line(P(x0, y0), P(x0 + 330, y0), { width: 1.4, alpha: cr, seed: 852 });
      Sk.text('forsinkelse →', x0 + 340, y0, { size: 22, alpha: cr, color: COL.pencil });
      Sk.path([P(x0 + 60, y0), P(x0 + 100, y0 - 60), P(x0 + 140, y0)], { color: COL.pencil, width: 1.6, alpha: 0.6 * cr, seed: 853 });
      Sk.text('ventet', x0 + 100, y0 - 76, { size: 22, alpha: cr, align: 'center', color: COL.pencil });
      Sk.path([P(x0 + 170, y0), P(x0 + 210, y0 - 46), P(x0 + 250, y0)], { color: COL.s[2], width: 2.4, alpha: cr, seed: 854, progress: es(t, 41, 43) });
      Sk.text('ekko: for sent', x0 + 210, y0 - 62, { size: 22, alpha: cr * seg(t, 43, 44), align: 'center', color: mixHex([COL.s[2]], 0.6) });
    }
  },
});

/* ================= SIGNAL CONDITIONS / DOP ================= */
scene({
  key: 'e3', act: 'Ekko og signalforhold', title: 'Signalforhold og geometri', dur: 52,
  cues: [
    [0.8, 12, 'Ingen måling er perfekt. Støy, trær, regn og ionosfæren gjør hver avstand litt usikker – sirklene blir til <b>bånd</b>.'],
    [10, 23, 'Det vi faktisk vet, er området der alle båndene overlapper. Står satellittene godt spredt, blir området lite og rundt.'],
    [20, 34, 'Står de samlet på én side av himmelen, krysser båndene hverandre spisst – og usikkerheten strekkes ut. Dette kalles <b>DOP</b>, «Dilution of Precision».'],
    [32, 45, 'Svakere signaler – under trær, mellom høye hus, i en tunnelåpning – gir bredere bånd. Geometri og signalstyrke ganges sammen.'],
    [43, 51.5, 'Neste: hva skjer når noen forstyrrer signalene med vilje?'],
  ],
  draw(t) {
    const ctx = Sk.ctx;
    const w = lerp(22, 46, es(t, 33, 38));
    const D = [
      { c: P(360, 560), ang: [-150, -30, 90], lab: 'god geometri (lav DOP)', clip: [0, 700] },
      { c: P(1040, 560), ang: [-118, -92, -66], lab: 'samlet på én side (høy DOP)', clip: [700, 1400] },
    ];
    D.forEach((d, n) => {
      const a = seg(t, 1 + n * 8 * (t < 20 ? 1 : 0), 3 + n * 8 * (t < 20 ? 1 : 0));
      const ra = n === 1 ? seg(t, 18, 20) : seg(t, 1, 3);
      if (ra <= 0) return;
      ctx.save(); ctx.beginPath(); ctx.rect(d.clip[0], 110, d.clip[1] - d.clip[0], 870); ctx.clip();
      const sats = d.ang.map(g => polar(d.c, 210, g * DEG));
      drawBands(sats.map((s, i) => ({ c: s, r: 210, i, a: ra, w })), { fill: 1.1 });
      ctx.restore();
      sats.forEach((s, i) => drawSat(i, s, ra, { label: false, scale: 0.6 }));
      const lp = add(d.c, P(n ? 90 : -90, 150));
      Sk.arrow(lp, add(d.c, P(n ? 18 : -18, 22)), { width: 1.8, alpha: ra * seg(t, 10 + n * 10, 12 + n * 10), seed: 860 + n, head: 9 });
      Sk.text(n ? 'langstrakt område' : 'lite, rundt område', lp.x, lp.y + 24, { size: 28, weight: 700, align: 'center', alpha: ra * seg(t, 10 + n * 10, 12 + n * 10), color: COL.red });
      Sk.text(d.lab, d.c.x, 900, { size: 32, weight: 700, align: 'center', alpha: ra });
      void a;
    });
    Sk.text('bredere bånd = svakere signal', 700, 200, { size: 32, color: COL.red, align: 'center', progress: es(t, 36, 38.5) });
  },
});

/* ================= JAMMING ================= */
const JAM = { J: P(1010, 905), R: 270 };
function jamAt(p) { return smooth((JAM.R - dist(p, JAM.J)) / (JAM.R * 0.35)); }
scene({
  key: 'j1', act: 'Jamming og spoofing', title: 'Jamming', dur: 58, road: true, speed: 26, sStart: () => roadNearest(P(1190, 455)),
  cues: [
    [0.8, 13, 'GPS-signalet er utrolig svakt når det når bakken – omtrent som å skimte en 50-watts lyspære 20 000 km unna. Det ligger faktisk <em>under</em> bakgrunnsstøyen.'],
    [10, 23, 'Mottakeren finner det likevel, fordi den vet nøyaktig hvilken kode hver satellitt sender. Men en jammer trenger ikke være sterk – den er bare mye nærmere.'],
    [20, 33, 'Effekten avtar med kvadratet av avstanden: <b>P = P_T / 4πr²</b>. En liten sender på 1 watt én kilometer unna er millioner av ganger sterkere enn satellittene.'],
    [30, 44, 'Bilen kjører inn i støyskyen. Sirklene drukner, og posisjonen forsvinner. Mottakeren kan bare gjette videre ut fra siste kjente fart og retning – og gjettingen sklir ut.'],
    [42, 57.5, 'Dette er ikke teori: i Finnmark og over Østersjøen har fly og skip opplevd omfattende GPS-forstyrrelser.'],
  ],
  est(t) {
    const car = carAt(this, t);
    if (jamAt(car) < 0.5) return { car, est: car, lost: false };
    let tl = t; while (tl > 0 && jamAt(carAt(this, tl)) >= 0.5) tl -= 0.1;
    const c0 = carAt(this, tl);
    return { car, est: add(c0, mul(c0.dir, c0.v * (t - tl))), lost: true, dt: t - tl, ang: c0.ang };
  },
  draw(t) {
    const { car, est, lost, dt, ang } = this.est(t);
    drawMap(0.85);
    const S = MAP.sats, j = jamAt(car);
    // noise cloud
    const na = seg(t, 5, 9), ctx = Sk.ctx;
    if (na > 0) {
      const g = ctx.createRadialGradient(JAM.J.x, JAM.J.y, 10, JAM.J.x, JAM.J.y, JAM.R);
      g.addColorStop(0, `rgba(90,80,90,${0.32 * na})`); g.addColorStop(1, 'rgba(90,80,90,0)');
      ctx.save(); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(JAM.J.x, JAM.J.y, JAM.R, 0, TAU); ctx.fill(); ctx.restore();
      for (let k = 0; k < 70; k++) {
        const a = hash1(k * 3.3) * TAU, r = Math.sqrt(hash1(k * 7.1)) * JAM.R * 0.95 * es(t, 5, 9);
        const p = polar(JAM.J, r, a), q = add(p, P((hash1(k) - 0.5) * 22, (hash1(k + 9) - 0.5) * 22));
        Sk.line(p, q, { color: '#5a505a', width: 1.2, alpha: 0.45 * na * (1 - r / JAM.R), passes: 1, wobble: 2.5, seed: k });
      }
      [0.35, 0.65, 0.95].forEach((f, k) => Sk.circle(JAM.J, JAM.R * f * es(t, 5, 9), { color: '#5a505a', width: 1.2, alpha: 0.3 * na, wobble: 4, seed: 870 + k, a0: t * 0.05 * (k + 1) }));
      Sk.carTop(P(JAM.J.x, JAM.J.y), 0.2, { color: '#9a9aa2', alpha: na, scale: 1.1 });
      Sk.antenna(P(JAM.J.x + 4, JAM.J.y - 6), { alpha: na, scale: 0.8 });
      Sk.text('jammer', JAM.J.x + 36, JAM.J.y + 26, { size: 28, weight: 700, color: '#4a404a', alpha: na });
    }
    drawBands(S.slice(0, 3).map((s, i) => ({ c: s, r: dist(s, car) + (hash1(Math.floor(t * 6) + i) - 0.5) * 30 * j, i, a: 1 - j, w: 16 + 30 * j })));
    [0, 1, 2].forEach(i => drawSat(i, S[i], 1));
    // power ladder
    const pa = win(t, 12, 40, 1);
    if (pa > 0) {
      const x0 = 420, x1 = 900, y = 250, X = dbm => lerp(x0, x1, (dbm + 140) / 90);
      paperBlob(P(660, 260), 300, 0.92 * pa);
      Sk.arrow(P(x0 - 10, y), P(x1 + 20, y), { width: 1.6, alpha: pa, head: 9, seed: 880 });
      Sk.text('mottatt effekt (dBm)', x1 + 20, y + 30, { size: 22, alpha: pa, align: 'right', color: COL.pencil });
      [[-130, 'GPS-satellitt', COL.s[1], -1], [-111, 'bakgrunnsstøy', COL.pencil, 1], [-66, 'jammer 1 W, 1 km', COL.red, -1]].forEach(([d, l, c, side], k) => {
        const x = X(d), a = pa * seg(t, 13 + k * 2, 14 + k * 2);
        Sk.line(P(x, y - 22), P(x, y + 22), { color: c, width: 4, alpha: a, seed: 881 + k });
        Sk.text(`${l}: ${d}`, x, y + side * 44, { size: 24, weight: 700, color: c, align: 'center', alpha: a });
      });
      Sk.text('P = P_T / (4π r²)', x0, y + 100, { size: 34, weight: 700, color: COL.red, progress: es(t, 20, 23), alpha: pa });
      Sk.text('64 dB ≈ 2,5 millioner ganger sterkere', x0, y + 146, { size: 26, progress: es(t, 23, 26), alpha: pa });
    }
    // estimated position
    if (lost) {
      const r = 12 + dt * 9;
      Sk.circle(est, r, { color: COL.red, width: 1.6, alpha: 0.8, seed: 890, wobble: 2 });
      ghostCar(est, ang, 0.85, COL.red, '?');
      Sk.text('posisjon tapt – gjetter videre', est.x - 40, est.y - r - 22, { size: 26, weight: 700, color: COL.red, align: 'center' });
    } else if (t > 10) {
      const back = this.est(Math.max(0, t - 1.5));
      if (back.lost) Sk.text('signal tilbake ✓', car.x + 30, car.y - 36, { size: 26, weight: 700, color: COL.green });
    }
    Sk.carTop(car, car.ang);
  },
});

/* ================= SPOOFING ================= */
scene({
  key: 'j2', act: 'Jamming og spoofing', title: 'Spoofing – falske signaler', dur: 50, road: true, speed: 28, sStart: () => roadNearest(P(1010, 832)),
  cues: [
    [0.8, 12, 'Enda lurere er <em>spoofing</em>: en sender som etterligner satellittene.'],
    [9, 22, 'Den falske senderen justerer forsinkelsene slik at sirklene fortsatt møtes pent i ett punkt – bare et annet sted enn der bilen er.'],
    [19, 33, 'Langsomt trekkes den beregnede posisjonen bort fra veien. Alt ser konsistent ut – helt til bilen «kjører» ut i vannet.'],
    [31, 49.5, 'Forsvaret: flere satellittsystemer samtidig (Galileo, GLONASS, BeiDou), antenner som peker ut retningen til falske signaler, treghetsnavigasjon som sjekker hvert hopp – og kryptografisk signerte signaler, som Galileos OSNMA.'],
  ],
  draw(t) {
    const car = carAt(this, t);
    drawMap(0.9);
    const S = MAP.sats, lakeP = P(MAP.lake.c.x + 10, MAP.lake.c.y + 6);
    const k = es(t, 9, 32);
    const B = lerpP(car, lakeP, k);
    const sp = P(330, 930);
    const sa = seg(t, 3, 5);
    Sk.carTop(sp, -0.1, { color: '#9a9aa2', alpha: sa, scale: 1.1 });
    Sk.antenna(P(sp.x, sp.y - 6), { alpha: sa, scale: 0.8 });
    Sk.text('falsk sender', sp.x + 34, sp.y + 30, { size: 26, weight: 700, alpha: sa, color: '#4a404a' });
    for (let i = 0; i < 3; i++) Sk.line(sp, car, { color: '#5a505a', width: 1.1, alpha: 0.35 * sa, passes: 1, seed: 900 + i, wobble: 3 });
    drawBands(S.slice(0, 3).map((s, i) => ({ c: s, r: dist(s, B), i, a: 1 })));
    [0, 1, 2].forEach(i => drawSat(i, S[i], 1));
    const off = dist(B, car);
    if (off > 10) {
      ghostCar(B, car.ang, seg(off, 10, 30), COL.red, null);
      Sk.text('mottakeren tror den er her', B.x + 26, B.y - 34, { size: 26, weight: 700, color: COL.red, alpha: seg(off, 20, 40) });
      Sk.arrow(car, lerpP(car, B, 0.85), { color: COL.red, width: 1.6, alpha: 0.6 * seg(off, 20, 40), head: 9, seed: 910 });
    }
    Sk.carTop(car, car.ang);
    Sk.text('ekte posisjon', car.x - 30, car.y + 38, { size: 24, alpha: seg(off, 20, 40) });
  },
});

/* ================= SUMMARY ================= */
scene({
  key: 'end', act: 'Avslutning', title: 'Hele kjeden', dur: 46,
  cues: [
    [0.8, 13, 'Avstand er tid ganger lysfart. Én avstand gir en kule. Fire kuler – og en ukjent klokkefeil – gir ett punkt.'],
    [10, 22, 'Farten finner vi fra Dopplerskiftet: skyggen av fartsvektoren mot hver satellitt.'],
    [19, 31, 'Alt hviler på at satellittene vet hvor de er og hva klokka er – takket være Kepler, bakkestasjonene og Einstein.'],
    [28, 40, 'Og alt er sårbart for ekko, dårlig geometri, jamming og falske signaler. Neste gang kartet ditt hopper, vet du hvorfor.'],
    [37, 45.5, 'Takk for at du så på.'],
  ],
  draw(t) {
    const C = P(700, 1580), R = 840, RO = 1370;
    Sk.arc(C, R + 28, -Math.PI / 2 - 0.6, -Math.PI / 2 + 0.6, { color: COL.water, width: 6, alpha: 0.35, progress: es(t, 0.5, 3), seed: 12 });
    Sk.arc(C, R, -Math.PI / 2 - 0.62, -Math.PI / 2 + 0.62, { width: 3.2, progress: es(t, 0.2, 2.5), seed: 11 });
    Sk.arc(C, RO, -Math.PI / 2 - 0.48, -Math.PI / 2 + 0.48, { color: COL.pencil, width: 1.6, alpha: 0.35, progress: es(t, 1, 4), seed: 13 });
    const car = P(700, C.y - R);
    const angs = [-0.37, -0.12, 0.14, 0.37];
    angs.forEach((a0, i) => {
      const a = a0 + 0.003 * t, p = P(C.x + Math.sin(a) * RO, C.y - Math.cos(a) * RO);
      Sk.line(p, lerpP(p, car, es(t, 3 + i * 0.6, 5 + i * 0.6)), { color: COL.s[i], width: 2.4, alpha: 0.8, seed: 950 + i });
      drawSat(i, p, seg(t, 2 + i * 0.3, 3 + i * 0.3), { scale: 0.75 });
    });
    Sk.carSide(car, { alpha: seg(t, 2, 3) });
    const x = 780, y = 470;
    Sk.text('avstand = c · Δt', x, y, { size: 40, weight: 700, color: COL.red, progress: es(t, 3, 5.5) });
    Sk.text('4 kuler → x, y, z og δ', x, y + 56, { size: 36, progress: es(t, 7, 9.5) });
    Sk.text('Doppler → v', x, y + 108, { size: 36, progress: es(t, 12, 14) });
    Sk.text('Kepler + bakkestasjoner + Einstein → Sᵢ og tid', x, y + 160, { size: 32, progress: es(t, 20, 23) });
    Sk.text('takk!', 220, 300, { size: 64, weight: 700, color: COL.red, progress: es(t, 38, 40), rot: -0.08 });
  },
});
