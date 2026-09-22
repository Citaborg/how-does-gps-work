/* story2d.js — intro + den flate verden: 1, 2, 3 og 4 satellitter, klokkefeil og feiltrekant */
const S = Sketch, C = S.COL;

/* Felles 2D-verden. Alt er en funksjon av gruppetid g (sekunder siden første 2D-kapittel),
   slik at spoling alltid er konsistent. */
const World2D = (() => {
  const roadY = x => 760 + 42 * Math.sin((x - 200) / 260);
  const roadAng = x => Math.atan(42 / 260 * Math.cos((x - 200) / 260));
  const SATS = [
    { x: 330, y: 560, col: C.red, name: 'S₁', h: 520 },
    { x: 1180, y: 470, col: C.blue, name: 'S₂', h: 640 },
    { x: 760, y: 150, col: C.green, name: 'S₃', h: 700 },
    { x: 1330, y: 700, col: C.purple, name: 'S₄', h: 480 }
  ];
  const X0 = 230, V = 11;
  const STOPS = [[12, 30], [52, 74], [92, 130], [150, 1e9]];
  const SAT_IN = [2, 42, 82, 140];       // når satellitten glir inn (2.4 s)
  const CIRCLE_ON = [18, 50, 90, 148];   // når avstandssirkelen tegnes
  const GLIDE = 2.4, PULSE_T = 3.6, PULSE_V = 330;
  function moveTime(g) { let m = Math.max(0, g); for (const [a, b] of STOPS) { if (g > b) m -= (b - a); else if (g > a) m -= (g - a); } return m; }
  const carX = g => X0 + V * moveTime(g);
  const carPos = g => { const x = carX(g); return { x, y: roadY(x), ang: roadAng(x) }; };
  const stopped = g => STOPS.some(([a, b]) => g > a + 0.3 && g < b);
  // klokkefeil (px) — brukes i kapittel 3
  const delta = g => S.kf(g, [[104, 0], [106.5, 80], [116, 80], [126, 0]]);
  // satellittens posisjon under innglidning
  function satPos(i, g) {
    const s = SATS[i], k = S.easeOut(S.ramp(g, SAT_IN[i], SAT_IN[i] + GLIDE));
    const from = [{ x: -200, y: 700 }, { x: 1700, y: -150 }, { x: 900, y: -220 }, { x: 1750, y: 950 }][i];
    return { x: S.lerp(from.x, s.x, k), y: S.lerp(from.y, s.y, k), k };
  }
  const satVisible = (i, g) => g >= SAT_IN[i];
  const radius = (i, g, car) => S.dist(SATS[i], car) * S.ease(S.ramp(g, CIRCLE_ON[i], CIRCLE_ON[i] + 1.6));
  const circleOn = (i, g) => g >= CIRCLE_ON[i];

  /* Tegn verden. opts: { pulses:[i..], lines:[i..], ghosts, mirror, triangle, errTri, note, labels, fills } */
  function draw(ctx, rc, g, o = {}) {
    const car = carPos(g);
    S.road(rc, ctx, roadY, -40, 1960);
    // avstandssirkler: fyll (multipliserende farger) + fargestift-omriss
    const radii = SATS.map((s, i) => circleOn(i, g) ? radius(i, g, car) + delta(g) * (g > 100 ? 1 : 0) : 0);
    SATS.forEach((s, i) => { if (radii[i] > 1) S.disc(ctx, s.x, s.y, radii[i], s.col, 0.14); });
    SATS.forEach((s, i) => { if (radii[i] > 1) S.circle(rc, s.x, s.y, radii[i], { color: s.col, w: 3.2, rough: 1.1, seed: 100 + i, fill: undefined }); });
    // pulser fra satellittene
    SATS.forEach((s, i) => {
      if (!satVisible(i, g) || !(o.pulses || []).includes(i)) return;
      const tau = g - SAT_IN[i] - GLIDE; if (tau < 0) return;
      const r = (tau % PULSE_T) * PULSE_V; const a = S.clamp(1 - r / 800, 0, 1) * 0.55;
      ctx.save(); ctx.globalAlpha *= a; S.circle(rc, s.x, s.y, r, { color: s.col, w: 1.6, rough: 0.6, seed: 200 + Math.floor(tau / PULSE_T), single: true }); ctx.restore();
      const d = S.dist(s, car); if (Math.abs(r - d) < 40) S.dot(ctx, car.x, car.y, 10 + (40 - Math.abs(r - d)) * 0.3, s.col, 0.5);
    });
    // linjer sat → bil med d-etikett
    for (const i of (o.lines || [])) {
      const s = SATS[i]; if (!satVisible(i, g)) continue;
      S.line(rc, s.x, s.y, car.x, car.y, { color: s.col, w: 2.6, seed: 300 + i });
      const mx = (s.x + car.x) / 2, my = (s.y + car.y) / 2, a = Math.atan2(car.y - s.y, car.x - s.x);
      S.text(ctx, o.lineLabel ? o.lineLabel(i) : `d${['₁', '₂', '₃', '₄'][i]}`, mx - Math.sin(a) * 22, my + Math.cos(a) * 22, { color: s.col, size: 32, align: 'center', halo: 6, rot: Math.abs(a) < Math.PI / 2 ? a : a + Math.PI });
    }
    // spøkelsesbiler langs sirkel 1
    if (o.ghosts) for (const ang of [-1.3, -0.45, 1.5, 2.3]) {
      const s = SATS[0]; S.carTop(rc, ctx, s.x + Math.cos(ang) * radii[0], s.y + Math.sin(ang) * radii[0], ang + Math.PI / 2, { alpha: 0.32 * o.ghosts, color: C.soft, seed: 500 + Math.round(ang * 10) });
    }
    // to kandidater (sirkel 1 ∩ sirkel 2)
    if (o.mirror) {
      const P = S.circleIntersect(SATS[0], radii[0], SATS[1], radii[1]);
      if (P) {
        const far = P[0].y < P[1].y ? P[0] : P[1]; // speilpunktet ligger over grunnlinja
        ctx.save(); ctx.globalAlpha *= o.mirror;
        S.carTop(rc, ctx, far.x, far.y, car.ang, { alpha: 0.45, color: C.soft, seed: 555 });
        S.marker(rc, ctx, far.x, far.y, 18, C.orange); S.marker(rc, ctx, car.x, car.y, 18, C.orange);
        S.text(ctx, '?', far.x + 28, far.y - 20, { color: C.orange, size: 40 }); ctx.restore();
      }
    }
    // trekant S1–S2–bil (+ speilet)
    if (o.triangle) {
      const A = SATS[0], B = SATS[1], k = o.triangle;
      ctx.save(); ctx.globalAlpha *= k;
      S.poly(rc, [A, B, car], { color: C.ink, w: 2.4, fill: C.orange, gap: 14, fw: 0.9, seed: 601 });
      const mid = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
      const mb = mid(A, B); S.text(ctx, 'b (kjent)', mb.x, mb.y - 16, { color: C.ink, size: 30, align: 'center', halo: 6 });
      const aB = Math.atan2(B.y - A.y, B.x - A.x), aC = Math.atan2(car.y - A.y, car.x - A.x);
      S.arc(rc, A.x, A.y, 70, Math.min(aB, aC), Math.max(aB, aC), { color: C.ink, w: 2.4, seed: 602 });
      S.text(ctx, 'α', A.x + Math.cos((aB + aC) / 2) * 96, A.y + Math.sin((aB + aC) / 2) * 96 + 10, { color: C.ink, size: 36, align: 'center', halo: 5 });
      if (o.mirrorTri) {
        // speil bilen over linja A–B
        const ux = (B.x - A.x) / S.dist(A, B), uy = (B.y - A.y) / S.dist(A, B);
        const pr = (car.x - A.x) * ux + (car.y - A.y) * uy; const fx = A.x + ux * pr, fy = A.y + uy * pr;
        const M = { x: 2 * fx - car.x, y: 2 * fy - car.y };
        ctx.globalAlpha *= o.mirrorTri;
        S.poly(rc, [A, B, M], { color: C.soft, w: 2, fill: C.soft, gap: 18, fw: 0.7, seed: 603 });
        S.arc(rc, A.x, A.y, 70, Math.min(aB, Math.atan2(M.y - A.y, M.x - A.x)), Math.max(aB, Math.atan2(M.y - A.y, M.x - A.x)), { color: C.soft, w: 2, seed: 604 });
      }
      ctx.restore();
    }
    // feiltrekant (tre sirkler som ikke møtes)
    if (o.errTri && delta(g) > 1.5) {
      const pts = [];
      for (const [i, j] of [[0, 1], [1, 2], [0, 2]]) {
        const P = S.circleIntersect(SATS[i], radii[i], SATS[j], radii[j]); if (!P) continue;
        pts.push(S.dist(P[0], car) < S.dist(P[1], car) ? P[0] : P[1]);
      }
      if (pts.length === 3) {
        S.poly(rc, pts, { color: C.red, w: 3, fill: C.red, gap: 6, fw: 1.4, seed: 700 });
        const cx = (pts[0].x + pts[1].x + pts[2].x) / 3, cy = (pts[0].y + pts[1].y + pts[2].y) / 3;
        S.text(ctx, 'feiltrekant', cx + 60, cy - 50, { color: C.red, size: 34, halo: 6, rot: -0.12 });
        S.arrow(rc, cx + 58, cy - 44, cx + 22, cy - 14, { color: C.red, w: 2, seed: 701, head: 12 });
      }
    }
    // skjæringsmarkering når alle sirkler møtes
    if (o.fixMark) { ctx.save(); ctx.globalAlpha *= o.fixMark; S.marker(rc, ctx, car.x, car.y, 22, C.orange, { w: 3.5 }); ctx.restore(); }
    // satellittene
    SATS.forEach((s, i) => {
      if (!satVisible(i, g)) return; const p = satPos(i, g);
      S.satellite(rc, ctx, p.x, p.y, { color: s.col, size: 1.15, seed: 31 + i * 7, label: p.k > 0.95 ? s.name : undefined, rot: -0.35 + i * 0.2 });
      if (o.stamps && p.k > 0.95) S.text(ctx, o.stamps(i), p.x + 40, p.y + 46, { color: s.col, size: 24, halo: 5, weight: 500 });
    });
    // bilen
    S.carTop(rc, ctx, car.x, car.y, car.ang, { seed: 37 });
    if (o.carLabel) S.text(ctx, o.carLabel, car.x + 50, car.y + 76, { color: C.ink, size: 26, halo: 5, weight: 500 });
    return { car, radii };
  }
  const END = 172;
  return { roadY, roadAng, SATS, carPos, satPos, radius, delta, draw, stopped, END, CIRCLE_ON, SAT_IN };
})();

/* ---------------- INTRO ---------------- */
Engine.register({
  id: 'intro', title: 'Innledning', short: 'Innledning', dur: 23, group: 'intro',
  narration: [
    { t: 0.6, text: 'Trodde du at GPS-satellittene <b>måler</b> hvor du er? Det gjør de ikke. De er bare ekstremt nøyaktige <b>klokker</b> som roper klokkeslettet ut i rommet – og hvor de selv er.' },
    { t: 9, text: 'Resten regner telefonen din ut helt selv. Hver dag finner milliarder av telefoner, biler og fly ut hvor de er – ved å <b>lytte</b>. Dette er historien om hvordan.' },
    { t: 16.5, text: 'Vi tar den i to steg. Først <b>flatt</b>, som på et ark. Så løfter vi tegningen ut i rommet.' }
  ],
  draw(ctx, rc, t) {
    const k = S.easeOut(S.ramp(t, 0.2, 2.5));
    // jordklode
    const ex = 700, ey = 1180, er = 620;
    ctx.save(); ctx.globalAlpha = k;
    S.circle(rc, ex, ey, er, { color: C.pencil, w: 3, fill: C.sky, fillStyle: 'hachure', gap: 16, fw: 1.2, seed: 900, steps: 40 });
    // bil på toppen av kloden
    S.carSide(rc, ctx, ex, ey - er - 2, { size: 1.2 });
    ctx.restore();
    // satellitter i bane
    for (let i = 0; i < 4; i++) {
      const a0 = -2.5 + i * 0.62, a = a0 + t * 0.045; const R = er + 300;
      const x = ex + Math.cos(a) * R, y = ey + Math.sin(a) * R; if (y > 900) continue;
      ctx.save(); ctx.globalAlpha = S.easeOut(S.ramp(t, 1.2 + i * 0.5, 2.6 + i * 0.5));
      S.satellite(rc, ctx, x, y, { color: S.SATCOL[i], size: 1.1, seed: 31 + i * 7, rot: a + Math.PI / 2 - 0.3 });
      // en liten klokke ved hver satellitt: det er alt de er
      const ck = S.env(t, 2 + i * 0.4, 15, 0.8);
      if (ck > 0.01) { ctx.save(); ctx.globalAlpha *= ck; S.clock(rc, ctx, x + 70, y - 60, 26, { color: S.SATCOL[i], hour: 12, min: (t * 6 + i * 15) % 60, seed: 60 + i }); ctx.restore(); }
      // signal ned til bilen
      const w = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 2 + i));
      ctx.globalAlpha *= 0.5 * w; S.line(rc, x, y, ex, ey - er - 40, { color: S.SATCOL[i], w: 1.8, seed: 910 + i, single: true });
      ctx.restore();
    }
    // tittelbok: liten forklaring nede til venstre
    if (t > 1.5 && t < 17) S.note(rc, ctx, 70, 170, 470, [{ t: 'Satellittene måler ingenting.', color: C.red }, { t: 'De sier bare:', color: C.ink }, { t: '«klokka er 12:00:00.000 000 0»', color: C.ink }, { t: '«og jeg er her»', color: C.ink }, { t: '– resten regner mottakeren ut selv', color: C.soft, size: 24 }], { alpha: S.env(t, 1.5, 15.5, 0.9), size: 28, lh: 38, rot: -0.02 });
    if (t > 16.5) {
      const a = S.ease(S.ramp(t, 16.5, 17.6));
      S.note(rc, ctx, 70, 700, 430, ['1.  Flatt ark: sirkler', '2.  Rommet: kuler', '3.  Fart, ekko og støy'], { alpha: a, size: 30, lh: 40, rot: -0.03 });
    }
  }
});

/* ---------------- 2D, kapittel 1: én satellitt ---------------- */
const G0 = () => Engine.chapters.find(c => c.id === '2d-1').start; // gruppestart (global tid)
const gOf = T => T - G0();

Engine.register({
  id: '2d-1', title: 'Flatt: én satellitt – én sirkel', short: '2D · én', dur: 42, group: '2d',
  narration: [
    { t: 0.5, text: 'Vi begynner flatt, som på et ark. En bil på en vei – og der ute, <b class=red>én satellitt</b>.' },
    { t: 6, text: 'Satellitten <b>sender</b> bare, den lytter ikke. Hvert signal bærer to ting: <b>klokkeslettet</b> det ble sendt, og <b>hvor</b> satellitten var akkurat da.' },
    { t: 13, text: 'Bilen hører signalet litt senere. Forskjellen er reisetiden – og ganger vi den med lysfarten, får vi avstanden.<span class=f>d = c · (t<sub>mottatt</sub> − t<sub>sendt</sub>)</span>' },
    { t: 20, text: 'Men én avstand gir ikke ett sted. Den gir en hel <b class=red>sirkel</b> av steder vi kan være.' },
    { t: 30, text: 'Bilen kjører videre, og sirkelen følger med. Vi trenger mer enn dette.' }
  ],
  draw(ctx, rc, t, T) {
    const g = gOf(T);
    const o = { pulses: [0] };
    if (t > 6 && t < 30) o.stamps = i => `t = 12:00:00.000 000 ${String(Math.floor((t * 7) % 100)).padStart(2, '0')}`;
    if (t > 13 && t < 30) { o.lines = [0]; o.lineLabel = () => 'd₁ = c · Δt₁'; o.carLabel = 'hører signalet ved t + Δt₁'; }
    if (t > 20.5) o.ghosts = S.env(t, 20.5, 29, 0.8);
    World2D.draw(ctx, rc, g, o);
    if (t > 14) S.note(rc, ctx, 70, 170, 380, ['c ≈ 300 000 km/s', '1 nanosekund ≙ 30 cm', '1 mikrosekund ≙ 300 m'], { alpha: S.env(t, 14, 30, 0.7), size: 29, lh: 38 });
    if (t > 21) S.text(ctx, 'et sted på denne sirkelen …', 120, 520, { color: C.red, size: 34, rot: -0.08, alpha: S.env(t, 21, 29, 0.8), halo: 6 });
  }
});

/* ---------------- 2D, kapittel 2: to satellitter ---------------- */
Engine.register({
  id: '2d-2', title: 'Flatt: to satellitter – to punkter', short: '2D · to', dur: 40, group: '2d',
  narration: [
    { t: 0.5, text: 'Satellitt nummer <b class=blue>to</b> glir inn. Den har sin egen klokke og sin egen posisjon – og gir oss en ny avstand.' },
    { t: 8.5, text: 'To sirkler skjærer hverandre i <b>to punkter</b>. Vi er i ett av dem.' },
    { t: 15, text: 'Se på trekanten: to målte avstander og en <b>kjent grunnlinje</b> mellom satellittene. Det er ren geometri – <b>cosinussetningen</b> gir vinkelen, og vinkelen gir punktet.<span class=f>cos α = (b² + d₁² − d₂²) / (2·b·d₁)</span>' },
    { t: 26, text: 'Men geometrien er symmetrisk: samme trekant kan speiles over grunnlinja. Det andre punktet er like gyldig – enn så lenge.' },
    { t: 33, text: 'Vi trenger en satellitt til.' }
  ],
  draw(ctx, rc, t, T) {
    const g = gOf(T);
    const o = { pulses: [1] };
    if (t > 9 && t < 34) { o.mirror = S.env(t, 9, 33, 0.8); }
    if (t > 15 && t < 33) { o.triangle = S.env(t, 15, 32, 0.9); o.lines = [0, 1]; if (t > 26) o.mirrorTri = S.env(t, 26, 32, 0.8); }
    World2D.draw(ctx, rc, g, o);
    if (t > 16) S.note(rc, ctx, 60, 840, 400, ['b = |S₁S₂|  (begge kjent)', 'd₁, d₂ = målt fra reisetid', 'cos α = (b² + d₁² − d₂²) / 2·b·d₁', '→ vinkel α → ett punkt … eller to'], { alpha: S.env(t, 16, 33, 0.7), size: 25, lh: 33 });
  }
});

/* ---------------- 2D, kapittel 3: tre satellitter, klokkefeil, feiltrekant ---------------- */
Engine.register({
  id: '2d-3', title: 'Flatt: tre satellitter – og klokka som lyver', short: '2D · tre', dur: 58, group: '2d',
  narration: [
    { t: 0.5, text: 'Den <b class=green>tredje</b> satellitten avgjør saken.' },
    { t: 8.5, text: 'Tre sirkler, ett felles punkt. Speilbildet faller bort. I en flat verden er dette nok … <i>hvis</i> klokka vår er perfekt.' },
    { t: 21, text: 'Men klokka i en telefon er billig. Går den bare <b>ett mikrosekund</b> feil, blir <b>alle</b> avstandene 300 meter for lange – på én gang.' },
    { t: 27.5, text: 'Sirklene møtes ikke lenger i ett punkt. De lager en liten <b class=red>feiltrekant</b>. Størrelsen på trekanten forteller hvor mye klokka lyver.' },
    { t: 34.5, text: 'Så gjør mottakeren noe smart: den <b>justerer sin egen klokke</b> til trekanten krymper til et punkt. Da vet den både hvor den er – og hva klokka er, på nanosekundet.' },
    { t: 46.5, text: 'Tre ukjente i planet – <b>x, y</b> og <b>klokkefeil</b> – tre satellitter. Så kjører vi videre.' }
  ],
  draw(ctx, rc, t, T) {
    const g = gOf(T);
    const o = { pulses: [2], errTri: true };
    if (t > 9 && t < 21) o.fixMark = S.env(t, 9, 20, 0.8);
    if (t > 43 && t < 48) o.fixMark = S.env(t, 43, 47, 0.8);
    World2D.draw(ctx, rc, g, o);
    const d = World2D.delta(g);
    if (t > 22 && t < 47) {
      S.note(rc, ctx, 70, 170, 460, [
        { t: 'd = c · (Δt + Δt_klokke)', color: C.ink },
        { t: 'samme klokkefeil på alle tre', color: C.red },
        { t: `Δt_klokke ≈ ${(d / 80).toFixed(2)} µs  →  +${Math.round(d / 80 * 300)} m`, color: C.red },
        { t: 'juster Δt_klokke til trekanten', color: C.ink }, { t: 'blir et punkt', color: C.ink }
      ], { alpha: S.env(t, 22, 46, 0.7), size: 27, lh: 36 });
    }
    if (t > 8 && t < 20) S.text(ctx, 'ett punkt!', 120, 520, { color: C.green, size: 36, rot: -0.08, alpha: S.env(t, 9, 19, 0.8), halo: 6 });
  }
});

/* ---------------- 2D, kapittel 4: fire satellitter ---------------- */
Engine.register({
  id: '2d-4', title: 'Flatt: fire satellitter – kontroll, og et løft', short: '2D · fire', dur: 32, group: '2d',
  narration: [
    { t: 0.5, text: 'En <b class=purple>fjerde</b> satellitt. I planet er den strengt tatt overflødig – men den er en kontroll: alle fire sirkler skal gå gjennom samme punkt.' },
    { t: 10, text: 'Og nå det viktige: verden er ikke flat. I rommet har vi <b>fire</b> ukjente – x, y, z og klokkefeil – og trenger fire satellitter.' },
    { t: 21, text: 'Vi tar med oss bilen, satellittene og avstandene – og løfter tegningen opp fra arket. Sirklene blir <b>kuler</b>.' }
  ],
  draw(ctx, rc, t, T) {
    const g = gOf(T);
    const o = { pulses: [3] };
    if (t > 9 && t < 30) o.fixMark = S.env(t, 9, 29, 0.8);
    World2D.draw(ctx, rc, g, o);
    if (t > 11) S.note(rc, ctx, 70, 170, 470, [
      { t: 'Flatt ark:  x, y, Δt        →  3 satellitter', color: C.ink },
      { t: 'Rommet:    x, y, z, Δt    →  4 satellitter', color: C.purple },
      { t: 'én ligning per satellitt:', color: C.soft, size: 24 },
      { t: '|P − Sᵢ| = c · (Δtᵢ + Δt_klokke)', color: C.ink }
    ], { alpha: S.env(t, 11, 40, 0.7), size: 27, lh: 36 });
  }
});
