'use strict';
/* Act 0 + Act 1: the listening car, then "flatland" with 1, 2, 3 and 4 satellites. */

/* ================= INTRO ================= */
scene({
  key: 'intro', act: 'Innledning', title: 'Bilen som lytter', dur: 42,
  cues: [
    [1, 14, 'Hver gang du åpner kartet på telefonen, skjer det noe ganske magisk: en liten mottaker finner ut hvor den er – ned til noen få meter – bare ved å <em>lytte</em>.'],
    [11, 25, 'Høyt over oss går rundt 30 GPS-satellitter, omtrent 20 200 km over bakken. Hver av dem sier hele tiden det samme: <em>«Klokka er nå … og jeg er akkurat her …»</em>'],
    [22, 36, 'Signalet farer av sted med lysets fart. Vet vi når det ble sendt og når det kom fram, vet vi hvor langt det har reist: <b>avstand = c · Δt</b>.'],
    [33, 41.5, 'La oss begynne enkelt – i en flat verden, på et kart – og bygge oss opp derfra.'],
  ],
  draw(t) {
    const C = P(700, 1580), R = 840, RO = 1370;
    const up = a => P(C.x + Math.sin(a) * R, C.y - Math.cos(a) * R);
    Sk.arc(C, R + 28, -Math.PI / 2 - 0.6, -Math.PI / 2 + 0.6, { color: COL.water, width: 6, alpha: 0.35, progress: es(t, 1, 3.5), seed: 12 });
    Sk.arc(C, R, -Math.PI / 2 - 0.62, -Math.PI / 2 + 0.62, { width: 3.2, progress: es(t, 0.2, 3), seed: 11 });
    // a few land strokes under the horizon
    for (let i = 0; i < 9; i++) {
      const a = -0.55 + i * 0.13, p = up(a), q = P(C.x + Math.sin(a + 0.05) * (R - 18), C.y - Math.cos(a + 0.05) * (R - 18));
      Sk.line(p, q, { width: 1.3, alpha: 0.35 * seg(t, 2 + i * 0.1, 3), passes: 1, color: COL.green });
    }
    Sk.arc(C, RO, -Math.PI / 2 - 0.48, -Math.PI / 2 + 0.48, { color: COL.pencil, width: 1.6, alpha: 0.35, progress: es(t, 1.6, 4.6), seed: 13 });
    Sk.text('satellittbane (ikke i skala)', 1140, 360, { size: 22, color: COL.pencil, alpha: 0.7 * seg(t, 4, 5.5), rot: 0.32 });

    const angs = [-0.37, -0.12, 0.14, 0.37], sats = angs.map(a => { const b = a + 0.0035 * t; return P(C.x + Math.sin(b) * RO, C.y - Math.cos(b) * RO); });
    sats.forEach((p, i) => drawSat(i, p, seg(t, 2.5 + i * 0.4, 3.6 + i * 0.4), { label: false, scale: 0.75 }));

    const car = P(700, C.y - R);
    Sk.carSide(car, { alpha: seg(t, 4, 5) });
    Sk.text('mottakeren lytter – den sender ingenting', car.x + 52, car.y - 28, { size: 26, alpha: seg(t, 5, 6.5) * (1 - seg(t, 13, 14)) });

    // the message travelling from satellite 2 to the car
    const S = sats[1];
    const k = es(t, 9, 13.5);
    if (t > 9) {
      Sk.line(S, lerpP(S, car, k), { color: COL.s[1], width: 2.4, alpha: 0.85, seed: 15 });
      if (k < 1) Sk.envelope(lerpP(S, car, k), angOf(sub(car, S)) - Math.PI / 2 + 1.57, { color: mixHex([COL.s[1]], 0.6) });
    }
    Sk.text('«kl. 12:00:00,000 000 – jeg er her: (x, y, z)»', S.x + 50, S.y - 46, { size: 27, color: mixHex([COL.s[1]], 0.65), progress: es(t, 8, 10.5) });
    Sk.text('mottatt kl. 12:00:00,067 301', car.x + 52, car.y + 30, { size: 27, progress: es(t, 13.5, 15.5) });

    const ex = 790, ey = 470;
    Sk.text('Δt = 0,067 301 s', ex, ey, { size: 38, weight: 700, progress: es(t, 16.5, 18.5) });
    Sk.text('avstand  d = c · Δt', ex, ey + 58, { size: 38, weight: 700, color: COL.red, progress: es(t, 21, 23.5) });
    Sk.text('= 299 792 km/s · 0,0673 s ≈ 20 200 km', ex + 20, ey + 112, { size: 32, progress: es(t, 24, 27) });
    const ux = ex + 152;
    Sk.path([P(ux, ey + 82), P(ux + 140, ey + 84)], { color: COL.red, width: 2, alpha: 0.6, progress: es(t, 23.5, 24.5), seed: 17 });
  },
});

/* ================= helpers for the flatland act ================= */
const FL = {
  bands(car, idx, alphas, extra = 0, w = 16) {
    return idx.map((i, n) => ({ c: MAP.sats[i], r: dist(MAP.sats[i], car) + extra, i, a: alphas[n], w }));
  },
  // pencil triangle legs for Pythagoras: sat → corner → car
  legs(S, car, i, a, prog) {
    if (a <= 0.004) return;
    const corner = P(car.x, S.y);
    const col = mixHex([COL.s[i]], 0.7);
    Sk.line(S, corner, { color: col, width: 1.5, alpha: 0.75 * a, progress: prog, seed: 300 + i, passes: 1 });
    Sk.line(corner, car, { color: col, width: 1.5, alpha: 0.75 * a, progress: clamp(prog * 2 - 1), seed: 310 + i, passes: 1 });
    const dx = nrm(sub(S, corner)), dy = nrm(sub(car, corner));
    if (prog > 0.95) Sk.rightAngle(corner, dx, dy, 14, { color: col, alpha: 0.8 * a });
    const sub_ = '₁₂₃₄'[i];
    Sk.text('Δx' + sub_, lerp(S.x, corner.x, 0.5), S.y - 18, { size: 24, color: col, alpha: a * seg(prog, 0.4, 0.6), align: 'center' });
    Sk.text('Δy' + sub_, car.x + (S.x < car.x ? 12 : -12), lerp(corner.y, car.y, 0.5), { size: 24, color: col, alpha: a * seg(prog, 0.9, 1), align: S.x < car.x ? 'left' : 'right' });
  },
  ranges(car, idx, a, t0, step = 0.6, extra = 0) {
    idx.forEach((i, n) => {
      const S = MAP.sats[i], k = es(a.t, t0 + n * step, t0 + n * step + 1.2);
      Sk.line(S, lerpP(S, car, k), { color: mixHex([COL.s[i]], 0.72), width: 2.4, alpha: 0.9 * a.v, seed: 320 + i });
      if (k > 0.9) segLabel(S, car, 'd' + '₁₂₃₄'[i] + (extra ? '′' : ''), { color: mixHex([COL.s[i]], 0.65), alpha: a.v * seg(k, 0.9, 1), at: 0.55 });
    });
  },
};

/* ================= 1 satellite ================= */
scene({
  key: 'f1', act: 'Flatland (2D)', title: 'Én satellitt', dur: 42, road: true, speed: 45, stops: [[7.5, 21]], sStart: () => roadNearest(P(940, 840)), stopAt: P(560, 835),
  cues: [
    [0.8, 11, 'Her er kartet vårt, og en bil som kjører. En satellitt kommer inn over horisonten …'],
    [6, 17, 'Signalet brer seg utover som én ring på vannet. Bilen stopper der den er, og vi måler hvor lang tid signalet brukte: <b>d₁ = c · Δt₁</b>.'],
    [14, 29, 'Men én avstand sier ikke <em>hvor</em>. Alle punkter like langt fra satellitten ligger på en sirkel – bilen kan være hvor som helst på den.'],
    [27, 41.5, 'Når bilen kjører videre, vokser og krymper sirkelen. Den følger alltid bilen, men den alene kan ikke peke den ut.'],
  ],
  draw(t) {
    const car = carAt(this, t);
    drawMap(1);
    const S = MAP.sats[0], r = dist(S, car);
    signalRing(S, r, 0, t, 4.4, 6.6);
    drawBands([{ c: S, r, i: 0, a: seg(t, 6.2, 7), w: 16 }]);

    const ov = { v: win(t, 8.2, 21, 0.7), t };
    if (ov.v > 0) {
      FL.ranges(car, [0], ov, 8.3);
      Sk.text('d₁ = c · Δt₁', lerp(S.x, car.x, 0.5) + 40, lerp(S.y, car.y, 0.5) + 40, { size: 32, weight: 700, color: COL.red, progress: es(t, 9.6, 11), alpha: ov.v });
      Sk.circle(S, r, { color: mixHex([COL.s[0]], 0.55), width: 3.4, alpha: 0.9 * ov.v, progress: es(t, 11.2, 14.5), seed: 333, a0: angOf(sub(car, S)) });
      const base = angOf(sub(car, S));
      [0.5, -0.45, 1.15, -1.05, 2.2].forEach((d, n) => {
        const a = base + d, p = polar(S, r, a);
        if (p.x < 40 || p.x > 1360 || p.y < 120 || p.y > 970) return;
        ghostCar(p, a + Math.PI / 2, 0.75 * ov.v * seg(t, 13 + n * 0.35, 14 + n * 0.35), INK);
      });
      const lp = polar(S, r + 40, base + 0.85);
      Sk.text('alle punkter i avstand d₁', lp.x, lp.y, { size: 28, progress: es(t, 15, 17), alpha: ov.v, rot: base + 0.85 + Math.PI / 2 });
    }
    drawSat(0, satFly(0, t, 1.5, 4.3), seg(t, 1.5, 2));
    Sk.carTop(car, car.ang);
  },
});

/* ================= 2 satellites ================= */
scene({
  key: 'f2', act: 'Flatland (2D)', title: 'To satellitter', dur: 46, road: true, speed: 45, stops: [[9, 26]], stopAt: P(640, 360), fadeIn: false,
  cues: [
    [0.8, 12, 'En satellitt til. Nå har vi to sirkler – og der fargene møtes, blir de sterkere.'],
    [8, 20, 'To sirkler skjærer hverandre i høyst <b>to punkter</b>. Bilen står i det ene. Men hvilket? Det andre er et spøkelse som passer like godt.'],
    [17, 31, 'De to punktene er speilbilder av hverandre om linjen mellom satellittene. Geometrien alene kan ikke skille dem.'],
    [29, 45.5, 'Kjører bilen videre, følger spøkelset etter – alltid speilet på andre siden av linjen S₁S₂.'],
  ],
  draw(t) {
    const car = carAt(this, t);
    drawMap(1);
    const S0 = MAP.sats[0], S1 = MAP.sats[1];
    const r0 = dist(S0, car), r1 = dist(S1, car);
    signalRing(S1, r1, 1, t, 4.4, 6.6);
    const a1 = seg(t, 6.2, 7);
    drawBands([{ c: S0, r: r0, i: 0, a: 1 }, { c: S1, r: r1, i: 1, a: a1 }]);
    const X = circleX(S0, r0, S1, r1);
    let ghost = null;
    if (X && a1 > 0) {
      const [p, q] = dist(X[0], car) < dist(X[1], car) ? X : [X[1], X[0]];
      ghost = q;
      markPoint(p, COL.s[0], COL.s[1], a1, 5);
      markPoint(q, COL.s[0], COL.s[1], a1, 6);
      ghostCar(q, car.ang + 2 * (angOf(sub(S1, S0)) - car.ang), seg(t, 7, 8), INK);
    }
    const ov = { v: win(t, 9.6, 26, 0.7), t };
    if (ov.v > 0 && ghost) {
      FL.ranges(car, [0, 1], ov, 9.8);
      // baseline and the chord between both candidates
      Sk.line(S0, S1, { color: COL.pencil, width: 1.6, alpha: 0.7 * ov.v, progress: es(t, 12.5, 14.5), seed: 340 });
      Sk.line(car, ghost, { color: INK, width: 1.8, alpha: 0.8 * ov.v, progress: es(t, 15, 16.5), seed: 341 });
      const u = nrm(sub(S1, S0)), m = add(S0, mul(u, dot(sub(car, S0), u)));
      if (t > 16.5) Sk.rightAngle(m, u, nrm(sub(car, m)), 16, { alpha: ov.v * seg(t, 16.5, 17) });
      const mid = lerpP(car, ghost, 0.5), nn = perp(nrm(sub(ghost, car)));
      Sk.text('speilbilder', mid.x + nn.x * 60, mid.y + nn.y * 60, { size: 30, weight: 700, color: COL.red, progress: es(t, 17.5, 19), alpha: ov.v, align: 'center' });
      Sk.text('to sirkler → to punkter', 90, 900, { size: 36, weight: 700, progress: es(t, 19, 21), alpha: ov.v });
    }
    drawSat(0, S0, 1);
    drawSat(1, satFly(1, t, 1.5, 4.3), seg(t, 1.5, 2));
    Sk.carTop(car, car.ang);
  },
});

/* ================= 3 satellites ================= */
scene({
  key: 'f3', act: 'Flatland (2D)', title: 'Tre satellitter', dur: 52, road: true, speed: 45, stops: [[10, 33]], stopAt: P(1240, 640), fadeIn: false,
  cues: [
    [0.8, 11, 'Den tredje satellitten avgjør saken. Sirkelen dens går gjennom bare ett av de to punktene – spøkelset kan strykes.'],
    [9, 22, 'Bilen stopper igjen, og vi tegner inn alle tre avstandene samtidig. Hver avstand er hypotenusen i en rettvinklet trekant.'],
    [18, 31, '<b>dᵢ² = (x − xᵢ)² + (y − yᵢ)²</b> – Pytagoras, tre ganger. Tre likninger, to ukjente: x og y.'],
    [27, 39, 'Vinklene teller også: når satellittene står spredt rundt bilen, krysser sirklene hverandre skarpt, og punktet blir presist.'],
    [37, 51.5, 'Der alle tre fargene møtes, står bilen. Sirklene følger den videre langs veien.'],
  ],
  draw(t) {
    const car = carAt(this, t);
    drawMap(1);
    const S = MAP.sats, r = [0, 1, 2].map(i => dist(S[i], car));
    signalRing(S[2], r[2], 2, t, 4.4, 6.6);
    drawBands([{ c: S[0], r: r[0], i: 0, a: 1 }, { c: S[1], r: r[1], i: 1, a: 1 }, { c: S[2], r: r[2], i: 2, a: seg(t, 6.2, 7) }]);
    const X = circleX(S[0], r[0], S[1], r[1]);
    if (X) {
      const [p, q] = dist(X[0], car) < dist(X[1], car) ? X : [X[1], X[0]];
      const ga = 1 - seg(t, 10, 11.5);
      markPoint(q, COL.s[0], COL.s[1], ga, 6);
      ghostCar(q, car.ang, ga * 0.8, INK, null);
      Sk.crossOut(q, 22, { progress: es(t, 7.4, 9), alpha: ga });
      markPoint(p, COL.s[0], COL.s[2], 1, 9);
    }
    const ov = { v: win(t, 10.6, 33, 0.7), t };
    if (ov.v > 0) {
      FL.ranges(car, [0, 1, 2], ov, 10.8, 0.5);
      const lg = win(t, 13.5, 26, 0.8) * ov.v;
      [0, 1, 2].forEach(i => FL.legs(S[i], car, i, lg, es(t, 13.8 + i * 0.7, 15.6 + i * 0.7)));
      Sk.text('dᵢ² = (x − xᵢ)² + (y − yᵢ)²', 90, 905, { size: 40, weight: 700, color: COL.red, progress: es(t, 18, 21), alpha: ov.v });
      // angles between the directions to the satellites
      const ag = win(t, 26.5, 33, 0.6) * ov.v;
      if (ag > 0) {
        const an = [0, 1, 2].map(i => angOf(sub(S[i], car))).sort((a, b) => a - b);
        for (let k = 0; k < 3; k++) {
          let a0 = an[k], a1 = an[(k + 1) % 3]; if (a1 < a0) a1 += TAU;
          Sk.arc(car, 52 + k * 9, a0 + 0.04, a1 - 0.04, { color: COL.pencil, width: 1.8, alpha: ag, progress: es(t, 27 + k * 0.5, 28.5 + k * 0.5), seed: 360 + k });
        }
        Sk.text('spredte vinkler → skarpt kryss', car.x + 70, car.y + 80, { size: 28, progress: es(t, 29, 31), alpha: ag });
      }
    }
    drawSat(0, S[0], 1); drawSat(1, S[1], 1);
    drawSat(2, satFly(2, t, 1.5, 4.3), seg(t, 1.5, 2));
    Sk.carTop(car, car.ang);
  },
});

/* ================= clock error + 4th satellite ================= */
const F4 = { E: 48, mPerPx: 3 };
/* curved error triangle: bounded by arcs of three (too large) circles between their pairwise crossings nearest the car */
function errorTriangle(S, r, near) {
  const V = [];
  for (const [i, j] of [[0, 1], [1, 2], [2, 0]]) {
    const X = circleX(S[i], r[i], S[j], r[j]); if (!X) return null;
    V.push(dist(X[0], near) < dist(X[1], near) ? X[0] : X[1]);
  }
  // V0 = 0∩1, V1 = 1∩2, V2 = 2∩0 ; edge V0→V1 on circle 1, V1→V2 on circle 2, V2→V0 on circle 0
  const pts = [];
  [[V[0], V[1], 1], [V[1], V[2], 2], [V[2], V[0], 0]].forEach(([a, b, k]) => {
    let a0 = angOf(sub(a, S[k])), a1 = angOf(sub(b, S[k])), d = a1 - a0;
    while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
    for (let n = 0; n <= 16; n++) pts.push(polar(S[k], r[k], a0 + d * n / 16));
  });
  return pts;
}
scene({
  key: 'f4', act: 'Flatland (2D)', title: 'Klokka som går feil', dur: 64, road: true, speed: 45, stops: [[2.5, 70]], fadeIn: false, fadeOut: false,
  cues: [
    [0.8, 12, 'Nå til lureriet. Satellittene har atomklokker – bilen har en billig kvartsklokke. Går den bare ett mikrosekund feil, blir hver avstand 300 meter feil.'],
    [9, 21, 'Feilen er <em>lik</em> for alle satellittene. Alle sirklene blir like mye for store. De møtes ikke lenger i ett punkt, men omslutter en liten <b>feiltrekant</b>.'],
    [18, 30, 'Trikset: vi gjør klokkefeilen δ til en ukjent. En fjerde satellitt gir oss en ekstra likning.'],
    [26, 39, 'Vi krymper alle radiene med samme c·δ til sirklene møtes i ett punkt. Da vet vi både hvor vi er – og hva klokka egentlig er.'],
    [37, 49, 'I flatland holder tre satellitter når også klokka er ukjent; den fjerde blir en kontroll. I tre dimensjoner trenger vi én til.'],
    [47, 63.5, 'La oss løfte blikket fra kartet. Vi tar med oss den første sirkelen …'],
  ],
  draw(t) {
    const car = carAt(this, t);
    const out = seg(t, 48, 52);                 // map and other sats fade
    const tw = es(t, 52, 59);                   // satellite 1 travels to the centre
    drawMap(1 - out);
    const S = MAP.sats;
    const e = F4.E * es(t, 4, 8.5) * (1 - es(t, 22, 31));
    const a3 = seg(t, 17, 17.8);
    const r = [0, 1, 2, 3].map(i => dist(S[i], car) + e);

    // satellite 1 and its circle morph toward the 3D start view
    const target = B3D.startScreen();
    const S0 = lerpP(S[0], P(target.x, target.y), tw);
    const r0 = lerp(r[0], target.r, tw);

    signalRing(S[3], r[3], 3, t, 15, 17.2);
    drawBands([
      { c: S0, r: r0, i: 0, a: 1 },
      { c: S[1], r: r[1], i: 1, a: 1 - out },
      { c: S[2], r: r[2], i: 2, a: 1 - out },
      { c: S[3], r: r[3], i: 3, a: a3 * (1 - out) },
    ], { cross: 1 - out });

    // the error triangle: inside all three (too large) circles
    const ft = clamp(e / F4.E * 1.4) * (1 - out) * (1 - a3 * 0.3);
    if (ft > 0.01) {
      const tri = errorTriangle(S.slice(0, 3), r.slice(0, 3), car);
      if (tri) {
        const ctx = Sk.ctx;
        ctx.save(); ctx.beginPath(); tri.forEach((q, i) => (i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))); ctx.closePath();
        ctx.globalAlpha = 0.45 * ft; ctx.fillStyle = '#7b3b5c'; ctx.fill(); ctx.clip();
        Sk.hatch(car.x - 90, car.y - 90, 180, 180, { gap: 4, alpha: 0.7 * ft, color: '#3d1730', angle: -0.6 });
        ctx.restore();
      }
      const lp = add(car, P(150, -110));
      Sk.arrow(lp, add(car, P(18, -12)), { color: COL.red, width: 2, alpha: ft * seg(t, 9, 10), progress: es(t, 9.5, 11), seed: 401 });
      Sk.text('feiltrekant', lp.x + 6, lp.y - 18, { size: 34, weight: 700, color: COL.red, progress: es(t, 9, 10.5), alpha: ft });
    }
    // receiver clock
    const ck = win(t, 9, 30, 0.8) * (1 - out);
    if (ck > 0) {
      const cp = P(1220, 560);
      Sk.clock(cp, 46, { alpha: ck, time: t * 3.1, hand: COL.red });
      Sk.text('bilens klokke', cp.x, cp.y + 70, { size: 26, align: 'center', alpha: ck });
      const cd = Math.round(e * F4.mPerPx);
      Sk.text(`c·δ = ${cd} m`, cp.x, cp.y + 104, { size: 34, weight: 700, align: 'center', color: COL.red, alpha: ck });
      Sk.text(`δ ≈ ${fmt(cd / 300, 2)} µs`, cp.x, cp.y + 140, { size: 26, align: 'center', alpha: ck });
    }
    // the fourth equation
    const eq = win(t, 23, 46, 0.8) * (1 - out);
    Sk.text('(x − xᵢ)² + (y − yᵢ)² = (ρᵢ − c·δ)²', 90, 870, { size: 38, weight: 700, color: COL.red, progress: es(t, 23, 26.5), alpha: eq });
    Sk.text('ukjente: x, y og δ  ·  ρᵢ = målt avstand', 90, 920, { size: 30, progress: es(t, 27, 29.5), alpha: eq });
    // the moment they meet
    if (t > 30.5 && t < 34.5) {
      const k = seg(t, 30.5, 34.5);
      Sk.circle(car, 14 + k * 60, { color: COL.green, width: 3, alpha: (1 - k) * 0.9, seed: 410 });
    }
    Sk.check(add(car, P(30, -30)), 12, { progress: es(t, 31, 32), alpha: win(t, 31, 46, 0.6) });

    drawSat(0, S0, 1);
    drawSat(1, S[1], 1 - out); drawSat(2, S[2], 1 - out);
    drawSat(3, satFly(3, t, 12.5, 15), seg(t, 12.5, 13) * (1 - out));
    Sk.carTop(car, car.ang, { alpha: 1 - out });
  },
});
