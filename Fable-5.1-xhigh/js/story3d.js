/* story3d.js — rommet: kuler, skjæringssirkel, to punkter, jorda, fjerde kule og klokkefeil.
   Alt styres av gruppetid h = sekunder siden første 3D-kapittel, så kamera og kuler er kontinuerlige. */
const World3D = (() => {
  const R_EARTH = 5000, FOV = 0.70, TD = GL3D.topDownDist(FOV);
  const hex2rgb = h => { const n = parseInt(h.slice(1), 16); return [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]; };
  let car2 = null, carW = null, sats = null;
  function init() {
    if (carW) return;
    car2 = World2D.carPos(World2D.END); carW = [car2.x, -car2.y, 0];
    sats = World2D.SATS.map(s => ({ x: s.x, y: -s.y, h: s.h, rgb: hex2rgb(s.col), col: s.col, name: s.name }));
  }
  const IN = [-10, 36, 66, 122]; // når satellittikonene glir inn (gruppetid)
  const v = GL3D.v;

  function state(h) {
    init();
    const lift = S.kf(h, [[3, 0], [9, 1]]);
    const a = [0.9,
      S.kf(h, [[1.5, 0.9], [4, 0], [38.4, 0], [41, 0.9]]),
      S.kf(h, [[1.5, 0.9], [4, 0], [68.4, 0], [71, 0.9]]),
      S.kf(h, [[1.5, 0.9], [4, 0], [124.4, 0], [127, 0.9]])];
    const rk = [1,
      S.kf(h, [[4, 1], [4.01, 0], [38.4, 0], [41, 1]]),
      S.kf(h, [[4, 1], [4.01, 0], [68.4, 0], [71, 1]]),
      S.kf(h, [[4, 1], [4.01, 0], [124.4, 0], [127, 1]])];
    const delta = S.kf(h, [[130, 0], [132.5, 110], [144, 110], [152, 0]]);
    const earthA = S.kf(h, [[83, 0], [87, 1]]);
    const cam = {
      fov: FOV,
      el: S.kf(h, [[2.5, Math.PI / 2], [9, 0.62], [84, 0.62], [92, 0.48], [104, 0.48], [112, 0.6]]),
      dist: S.kf(h, [[2.5, TD], [9, 3400], [84, 3400], [92, 17000], [104, 17000], [112, 3400]]),
      az: h < 9 ? S.kf(h, [[2.5, 0], [9, 0.35]]) : 0.35 + 0.025 * (h - 9),
      target: S.kfv(h, [[2.5, [960, -540, 0]], [9, [carW[0], carW[1], 120]], [84, [carW[0], carW[1], 120]], [92, [carW[0], carW[1], -1500]], [104, [carW[0], carW[1], -1500]], [112, [carW[0], carW[1], 120]]])
    };
    const pts = [S.kf(h, [[72, 0], [73.5, 1]]), S.kf(h, [[72, 0], [73.5, 1], [99, 1], [102, 0]])];
    const iconK = sats.map((s, i) => i === 0 ? 1 : (h < IN[i] ? (h < 4 ? 1 - S.ramp(h, 1.5, 4) : 0) : S.easeOut(S.ramp(h, IN[i], IN[i] + 2.4))));
    return { h, lift, a, rk, delta, earthA, cam, pts, iconK };
  }
  function satW(i, lift) { return [sats[i].x, sats[i].y, sats[i].h * lift]; }

  function scene(st) {
    const spheres = sats.map((s, i) => { const c = satW(i, st.lift); return { c, r: v.len(v.sub(carW, c)) * st.rk[i] + st.delta * st.rk[i], col: s.rgb, a: st.a[i] }; });
    const earth = { c: [carW[0], carW[1], -R_EARTH], r: R_EARTH, a: st.earthA };
    let P = null;
    if (st.rk[0] === 1 && st.rk[1] === 1 && st.rk[2] === 1) {
      const tr = GL3D.trilaterate(spheres[0].c, spheres[0].r, spheres[1].c, spheres[1].r, spheres[2].c, spheres[2].r);
      if (tr) P = tr[0][2] < tr[1][2] ? tr : [tr[1], tr[0]]; // [bilpunkt, speilpunkt]
    }
    const points = P ? [{ p: P[0], a: st.pts[0] }, { p: P[1], a: st.pts[1] }] : [];
    return { cam: st.cam, spheres, earth, points, linePx: 2.8, glow: 1.0, P };
  }

  /* Skisse-overlegget oppå 3D-bildet. o: { lines:[i], pulses:[i], gap, heights, discard } */
  function overlay(ctx, rc, sc, st, o = {}) {
    const cam = sc.cam, B = GL3D.basis(cam);
    const pr = p => GL3D.project(cam, p, B);
    // veien (på planet z=0)
    const pts = []; for (let x = -40; x <= 1960; x += 40) { const q = pr([x, -World2D.roadY(x), 0]); if (q) pts.push({ x: q[0], y: q[1] }); }
    if (pts.length > 3) {
      ctx.save(); ctx.globalAlpha *= S.clamp(1.4 - st.earthA * 0.4 - (cam.dist > 6000 ? 1 : 0), 0.15, 1);
      ctx.strokeStyle = S.hexA(C.road, 0.16); ctx.lineWidth = 54 * GL3D.pxScale(cam, carW, B); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
      S.curve(rc, pts, { color: C.soft, w: 1.6, rough: 0.6, seed: 61 }); ctx.restore();
    }
    // høydelinjer sat → fotpunkt
    if (st.lift > 0.02) sats.forEach((s, i) => {
      if (st.iconK[i] < 0.98 || st.a[i] < 0.05) return;
      const top = pr(satW(i, st.lift)), foot = pr([s.x, s.y, 0]); if (!top || !foot) return;
      ctx.save(); ctx.globalAlpha *= 0.45; S.line(rc, top[0], top[1], foot[0], foot[1], { color: s.col, w: 1.4, seed: 800 + i, single: true });
      const k = GL3D.pxScale(cam, [s.x, s.y, 0], B); S.ellipse(rc, foot[0], foot[1], 40 * k, 16 * k * Math.sin(cam.el), { color: s.col, w: 1.2, fill: s.col, gap: 4, fw: 0.6, seed: 810 + i });
      ctx.restore();
    });
    // radier sat → bil
    for (const i of (o.lines || [])) {
      if (st.a[i] < 0.05) continue; const a = pr(satW(i, st.lift)), b = pr(carW); if (!a || !b) continue;
      S.line(rc, a[0], a[1], b[0], b[1], { color: sats[i].col, w: 2.6, seed: 300 + i });
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      S.text(ctx, o.lineLabel ? o.lineLabel(i) : `r${['₁', '₂', '₃', '₄'][i]}`, (a[0] + b[0]) / 2 - Math.sin(ang) * 22, (a[1] + b[1]) / 2 + Math.cos(ang) * 22, { color: sats[i].col, size: 32, align: 'center', halo: 6, rot: Math.abs(ang) < Math.PI / 2 ? ang : ang + Math.PI });
    }
    // bilen
    const cp = pr(carW), ct = pr([carW[0] + 40 * Math.cos(car2.ang), carW[1] - 40 * Math.sin(car2.ang), 0]);
    if (cp && ct) {
      const k = GL3D.pxScale(cam, carW, B);
      if (k > 0.05) S.carTop(rc, ctx, cp[0], cp[1], Math.atan2(ct[1] - cp[1], ct[0] - cp[0]), { seed: 37, size: S.clamp(k, 0.05, 1.6) });
      else S.dot(ctx, cp[0], cp[1], 5, C.ink);
    }
    // skjæringspunkter
    if (sc.P) {
      const A = pr(sc.P[0]), M = pr(sc.P[1]);
      if (A && st.pts[0] > 0.01) { ctx.save(); ctx.globalAlpha *= st.pts[0]; S.marker(rc, ctx, A[0], A[1], 20, C.orange, { w: 3.4 }); if (o.ptLabels) S.text(ctx, o.ptLabels[0], A[0] + 30, A[1] + 44, { color: C.orange, size: 30, halo: 6 }); ctx.restore(); }
      if (M && st.pts[1] > 0.01) {
        ctx.save(); ctx.globalAlpha *= st.pts[1]; S.marker(rc, ctx, M[0], M[1], 20, C.orange, { w: 3.4 });
        S.text(ctx, o.ptLabels ? o.ptLabels[1] : '?', M[0] + 30, M[1] - 22, { color: C.orange, size: 34, halo: 6 });
        if (o.discard > 0) { ctx.globalAlpha *= o.discard; S.line(rc, M[0] - 30, M[1] - 30, M[0] + 30, M[1] + 30, { color: C.red, w: 4, seed: 71 }); S.line(rc, M[0] - 30, M[1] + 30, M[0] + 30, M[1] - 30, { color: C.red, w: 4, seed: 72 }); }
        ctx.restore();
      }
      // avvik mot fjerde kule
      if (o.gap && st.delta > 2 && st.a[3] > 0.5 && A) {
        const s4 = sc.spheres[3]; const dir = v.norm(v.sub(sc.P[0], s4.c)); const q = v.add(s4.c, v.mul(dir, s4.r)); const Q = pr(q);
        if (Q) { S.line(rc, A[0], A[1], Q[0], Q[1], { color: C.red, w: 3.6, seed: 73 }); S.marker(rc, ctx, Q[0], Q[1], 10, C.purple); S.text(ctx, 'avvik = c · Δt_klokke', (A[0] + Q[0]) / 2 + 30, (A[1] + Q[1]) / 2 - 16, { color: C.red, size: 30, halo: 6, rot: -0.1 }); }
      }
    }
    // satellittikoner (glir inn fra kanten)
    sats.forEach((s, i) => {
      const k = st.iconK[i]; if (k <= 0.001) return;
      const p = pr(satW(i, st.lift)); if (!p) return;
      const from = [{ x: -200, y: 700 }, { x: 1700, y: -150 }, { x: 900, y: -220 }, { x: 1750, y: 950 }][i];
      const x = (h => S.lerp(from.x, p[0], h))(i === 0 || st.h < 4 ? 1 : k), y = (h => S.lerp(from.y, p[1], h))(i === 0 || st.h < 4 ? 1 : k);
      const alpha = (i === 0 || st.h >= IN[i]) ? 1 : k;
      const sz = S.clamp(GL3D.pxScale(cam, satW(i, st.lift), B) * 1.15, 0.35, 1.4);
      S.satellite(rc, ctx, x, y, { color: s.col, size: sz, seed: 31 + i * 7, alpha, label: k > 0.95 && sz > 0.5 ? s.name : undefined, rot: -0.35 + i * 0.2 });
      if ((o.pulses || []).includes(i) && k > 0.95 && cam.dist < 6000) {
        const tau = (st.h + 1.7 * i) % 3.6; const r = tau * 300 * sz; ctx.save(); ctx.globalAlpha *= S.clamp(1 - r / 700, 0, 1) * 0.5;
        S.circle(rc, x, y, r, { color: s.col, w: 1.5, rough: 0.6, seed: 200 + Math.floor((st.h + 1.7 * i) / 3.6), single: true }); ctx.restore();
      }
    });
    if (st.earthA > 0.01 && cam.dist > 6000) {
      const e = pr([carW[0], carW[1], -R_EARTH]); if (e) S.text(ctx, 'Jorda (ikke i målestokk)', e[0], e[1] + 540 / 17000 * 5000 * 2.2 + 60, { color: C.soft, size: 30, align: 'center', alpha: st.earthA * S.ramp(cam.dist, 6000, 12000), halo: 6 });
    }
  }
  return { state, scene, overlay, init, get carW() { return carW; } };
})();

const H0 = () => Engine.chapters.find(c => c.id === '3d-1').start;
function draw3D(ctx, rc, T, o) {
  const st = World3D.state(T - H0()); const sc = World3D.scene(st); World3D.overlay(ctx, rc, sc, st, o); return sc;
}

/* ---------------- 3D, kapittel 1: én kule ---------------- */
Engine.register({
  id: '3d-1', title: 'Rommet: én satellitt – én kule', short: '3D · én', dur: 36, group: '3d', uses3d: true,
  narration: [
    { t: 0.5, text: 'Her er den samme tegningen – sett rett ovenfra. La oss løfte den opp fra arket.' },
    { t: 6, text: 'En avstand i rommet er ikke en sirkel. Den er en <b class=red>kule</b>: alle punkter som ligger like langt fra satellitten. Vi er et sted på overflaten av den.' },
    { t: 16, text: 'Ikke i målestokk: ekte GPS-satellitter går <b>20 200 km</b> over bakken, og kulene deres er større enn jorda. Vi ser bare en liten flik av verden her.' },
    { t: 27, text: 'Igjen: én satellitt, én overflate. Vi trenger flere.' }
  ],
  draw(ctx, rc, t, T) {
    const o = { pulses: [0] };
    if (t > 10 && t < 26) { o.lines = [0]; o.lineLabel = () => 'r₁ = c · Δt₁'; }
    const sc = draw3D(ctx, rc, T, o);
    if (t > 17) S.note(rc, ctx, 70, 170, 430, ['banehøyde ≈ 20 200 km', 'kuleradius ≈ 20 000 – 26 000 km', 'jordas radius ≈ 6 400 km', '(tegningen er ikke i målestokk)'], { alpha: S.env(t, 17, 27, 0.7), size: 27, lh: 36 });
    return sc;
  }
});

/* ---------------- 3D, kapittel 2: to kuler → en sirkel ---------------- */
Engine.register({
  id: '3d-2', title: 'Rommet: to kuler – en sirkel', short: '3D · to', dur: 30, group: '3d', uses3d: true,
  narration: [
    { t: 0.5, text: 'Den <b class=blue>andre</b> satellitten kommer til. Kula dens vokser til den når bilen – og skjærer den første.' },
    { t: 7, text: 'To kuler skjærer hverandre i en <b>sirkel</b> – en ring som svever i rommet. Et sted på den ringen er vi.' },
    { t: 17, text: 'Se ringen tegne seg der fargene møtes. På arket ga to sirkler oss to punkter; i rommet gir to kuler oss en hel sirkel av muligheter.' }
  ],
  draw(ctx, rc, t, T) {
    const o = { pulses: [1] }; if (t > 6 && t < 16) { o.lines = [0, 1]; }
    const sc = draw3D(ctx, rc, T, o);
    if (t > 8) S.text(ctx, 'skjæringen: en sirkel i rommet', 90, 560, { color: C.purple, size: 34, rot: -0.06, alpha: S.env(t, 8, 26, 0.8), halo: 6 });
    return sc;
  }
});

/* ---------------- 3D, kapittel 3: tre kuler → to punkter, jorda ---------------- */
Engine.register({
  id: '3d-3', title: 'Rommet: tre kuler – to punkter, og jorda', short: '3D · tre', dur: 56, group: '3d', uses3d: true,
  narration: [
    { t: 0.5, text: 'Den <b class=green>tredje</b> kula skjærer ringen – i <b>to punkter</b>.' },
    { t: 8, text: 'To kandidater igjen, akkurat som på arket. Ett av dem er bilen. Det andre henger langt der oppe.' },
    { t: 17, text: 'Så setter vi inn jorda – og trekker oss litt tilbake.' },
    { t: 26, text: 'Det ene punktet ligger på jordoverflaten, der veier finnes. Det andre ligger tusenvis av kilometer ute i rommet – og ville dessuten fare av gårde i umulig fart. Det forkaster vi uten å blunke.' },
    { t: 38, text: 'Så zoomer vi inn igjen. Tre kuler, ett punkt. Men klokka vår …' }
  ],
  draw(ctx, rc, t, T) {
    const o = { pulses: [2], ptLabels: ['A: bilen', 'B: rommet?'] };
    if (t > 26) o.discard = S.ramp(t, 30, 31.5);
    const sc = draw3D(ctx, rc, T, o);
    if (t > 27) S.note(rc, ctx, 70, 170, 430, [{ t: 'A: på bakken, i fornuftig fart  ✓', color: C.green }, { t: 'B: langt ute i rommet  ✗', color: C.red }, { t: '(og i umulig fart)', color: C.red }, { t: 'mottakeren velger A', color: C.ink }], { alpha: S.env(t, 27, 45, 0.7), size: 27, lh: 36 });
    return sc;
  }
});

/* ---------------- 3D, kapittel 4: fire kuler og klokka ---------------- */
Engine.register({
  id: '3d-4', title: 'Rommet: fire kuler – og tiden', short: '3D · fire', dur: 42, group: '3d', uses3d: true,
  narration: [
    { t: 0.5, text: 'Den <b class=purple>fjerde</b> kula skal gå gjennom det samme punktet som de tre andre.' },
    { t: 8, text: 'Men med klokkefeil blir alle fire radier like mye for lange – og den fjerde kula <b>bommer</b> på punktet. Avstanden den bommer med, er klokkefeilen vår.' },
    { t: 21, text: 'Mottakeren justerer klokka si til alle fire overflater møtes i ett punkt. Fire ukjente, fire kuler – <b>x, y, z og tid</b>.' },
    { t: 33, text: 'Det er hele hemmeligheten: en GPS-mottaker er egentlig en ekstremt god klokke, som får posisjonen på kjøpet.' }
  ],
  draw(ctx, rc, t, T) {
    const o = { pulses: [3], gap: true };
    const sc = draw3D(ctx, rc, T, o);
    if (t > 9) S.note(rc, ctx, 70, 170, 470, [{ t: '4 ukjente:  x, y, z, Δt_klokke', color: C.ink }, { t: '4 kuler:', color: C.ink }, { t: '|P − Sᵢ| = c · (Δtᵢ + Δt_klokke)', color: C.purple }, { t: 'i = 1 … 4', color: C.soft, size: 24 }], { alpha: S.env(t, 9, 40, 0.7), size: 27, lh: 36 });
    return sc;
  }
});
