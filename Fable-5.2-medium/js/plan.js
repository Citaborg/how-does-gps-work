'use strict';
/* Sett 1: arket. Trilaterasjon i 2D med 1, 2, 3 og 4 satellitter. */
const PLAN = (() => {
  const { C, es, seg, ease, lerp, clamp, kf, win, TAU } = SK;
  const R = 4200, GX = 640, GY = 880;
  const gy = x => GY + R - Math.sqrt(R * R - (x - GX) * (x - GX));
  const SATS = [
    { p: [300, 520], c: C.RED, from: [-140, 140] },
    { p: [610, 360], c: C.BLUE, from: [1500, 40] },
    { p: [1010, 500], c: C.YEL, from: [1560, 260] },
    { p: [850, 300], c: C.GRN, from: [760, -160] }
  ];
  const IN = [14, 46, 70, 130], GROW = [[20, 26], [50, 55], [74, 79], [134, 138]];
  const carKeys = [[3, -160], [13.5, 380], [36, 380], [46, 520], [60, 520], [70, 640], [104, 640], [112, 760]];
  const biasKeys = [[113, 0], [118, -46], [139, -46], [145, 0]];
  const zoomKeys = [[118, 1], [123, 1.9], [130, 1.9], [134, 1.15], [146, 1.15], [149, 1]];
  const ground = []; for (let x = -40; x <= 1960; x += 12) ground.push([x, gy(x)]);
  const TREES = [[110, 0.9], [235, 1.1], [985, 1], [1150, 0.85], [1290, 1.05]];
  const DUR = 158;
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

  function draw(t) {
    const ctx = SK.ctx;
    const cx = kf(t, carKeys), cy = gy(cx), tilt = Math.atan((cx - GX) / Math.sqrt(R * R - (cx - GX) * (cx - GX)));
    const P = [cx - 4, cy - 60];
    const fade = 1 - es(t, 150, 152.5), m = es(t, 151.5, 156.5);
    const b = kf(t, biasKeys), z = kf(t, zoomKeys);
    const rad = SATS.map(s => dist(s.p, P));
    ctx.save();
    if (z !== 1) { ctx.translate(P[0], P[1] - 50); ctx.scale(z, z); ctx.translate(-P[0], -(P[1] - 50)); }

    SK.al(fade, () => {
      SK.stroke(ground, { w: 3.2, prog: es(t, 0.6, 3.4), seed: 3 });
      TREES.forEach(([x, s], i) => SK.al(es(t, 2 + i * 0.3, 3 + i * 0.3), () => SK.tree(x, gy(x), s, i * 9)));
    });

    /* avstandssirklene */
    SATS.forEach((s, i) => {
      const g = seg(t, GROW[i][0], GROW[i][1]);
      if (g <= 0) return;
      let c = s.p, r = (rad[i] + b) * g, a = fade, fa = 0.07;
      if (i === 0) { c = [lerp(s.p[0], GLR.CX, m), lerp(s.p[1], GLR.CY, m)]; r = lerp(r, ROM.RS, m); a = 1; fa = lerp(0.07, 0.3, m); }
      SK.al(a, () => {
        SK.disc(c[0], c[1], r, s.c, fa, true);
        SK.ring(c[0], c[1], r, { color: s.c, w: 7, seed: 100 + i * 10 });
      });
    });

    SK.al(fade, () => {
      /* kap. 1: tid blir avstand */
      const A = SATS[0].p;
      SK.al(win(t, 18.5, 26, 0.6), () => SK.text('«klokka er 12:00:00,000 – og jeg er akkurat HER»', A[0] + 70, A[1] - 44, { size: 34, color: C.RED, prog: seg(t, 18.6, 21) }));
      SK.al(win(t, 26, 45), () => {
        SK.line(A[0], A[1], P[0], P[1], { w: 2.8, prog: es(t, 26, 28), seed: 21 });
        const a = Math.atan2(P[1] - A[1], P[0] - A[0]);
        SK.text('d = c · Δt', (A[0] + P[0]) / 2 + 22, (A[1] + P[1]) / 2 - 10, { size: 40, rot: a > 1.57 ? a - Math.PI : a, prog: seg(t, 28, 29.5) });
      });
      SK.al(win(t, 20, 45), () => {
        SK.text('Δt = ' + SK.nb(0.0674 * seg(t, 20, 26), 4) + ' s', 70, 92, { size: 44 });
        SK.text('d = c · Δt = 300 000 km/s · 0,0674 s ≈ 20 200 km', 70, 148, { size: 44, prog: seg(t, 27, 30.5) });
      });
      SK.al(win(t, 30, 36.2, 0.5), () => {
        const a0 = Math.atan2(P[1] - A[1], P[0] - A[0]), a = a0 + TAU * ease(seg(t, 30.5, 35.7));
        const q = [A[0] + rad[0] * Math.cos(a), A[1] + rad[0] * Math.sin(a)];
        SK.mark(q[0], q[1], { seed: 22 }); SK.text('?', q[0] + 22, q[1] - 24, { size: 54 });
      });

      /* kap. 2–3: skjæringspunktene */
      const ab = SK.cc(SATS[0].p, rad[0], SATS[1].p, rad[1]);
      const falseP = SK.far(ab, P);
      SK.al(es(t, 55, 56) * (1 - es(t, 83, 85)), () => {
        SK.mark(falseP[0], falseP[1], { seed: 23 });
        SK.al(1 - es(t, 79, 80), () => SK.text('?', falseP[0] + 24, falseP[1] - 24, { size: 54 }));
        SK.cross(falseP[0], falseP[1], 26, { prog: seg(t, 79.5, 81), color: C.RED, w: 6 });
      });
      SK.al(es(t, 55, 56) * (1 - es(t, 79, 80)) * (1 - es(t, 59.5, 60.5) * (1 - es(t, 70, 71))), () => SK.text('?', P[0] + 30, P[1] - 46, { size: 54 }));

      /* kap. 3: trekantene */
      SK.al(win(t, 87, 104.5), () => {
        const [a, bb, c] = [SATS[0].p, SATS[1].p, SATS[2].p];
        SK.hatch([a, bb, P], { color: C.VIO, gap: 12, ang: 0.4, a: 0.22 * es(t, 91, 93), base: 0.1, seed: 31 });
        SK.hatch([bb, c, P], { color: C.GRN, gap: 12, ang: -0.9, a: 0.22 * es(t, 92, 94), base: 0.1, seed: 32 });
        SK.line(a[0], a[1], bb[0], bb[1], { w: 2.6, color: C.INK, prog: es(t, 89.5, 90.5), seed: 33 });
        SK.line(bb[0], bb[1], c[0], c[1], { w: 2.6, color: C.INK, prog: es(t, 90, 91), seed: 34 });
        SK.text('kjent', (a[0] + bb[0]) / 2 - 30, (a[1] + bb[1]) / 2 - 30, { size: 34, prog: seg(t, 90.5, 91.2) });
        SK.text('kjent', (c[0] + bb[0]) / 2 + 4, (c[1] + bb[1]) / 2 - 30, { size: 34, prog: seg(t, 91, 91.7) });
        [a, bb, c].forEach((s, i) => {
          SK.line(s[0], s[1], P[0], P[1], { w: 3.4, color: SATS[i].c, prog: es(t, 87.3 + i * 0.6, 88.5 + i * 0.6), seed: 35 + i });
          const u = 0.42;
          SK.text('d' + '₁₂₃'[i], lerp(s[0], P[0], u) + [-44, 12, 18][i], lerp(s[1], P[1], u), { size: 44, color: SATS[i].c, prog: seg(t, 88.5 + i * 0.6, 89 + i * 0.6) });
        });
        const an = s => Math.atan2(s[1] - P[1], s[0] - P[0]);
        SK.angle(P[0], P[1], 70, an(a), an(bb), { prog: es(t, 93, 94), label: 'α', seed: 38 });
        SK.angle(P[0], P[1], 90, an(bb), an(c), { prog: es(t, 93.5, 94.5), label: 'β', seed: 39 });
        ['(x − x₁)² + (y − y₁)² = d₁²', '(x − x₂)² + (y − y₂)² = d₂²', '(x − x₃)² + (y − y₃)² = d₃²'].forEach((s, i) =>
          SK.text(s, 70, 92 + i * 54, { size: 44, color: SATS[i].c, prog: seg(t, 96 + i * 1.4, 97.6 + i * 1.4) }));
      });

      /* kap. 4: klokkefeil og feiltrekant */
      const bn = (i, j) => SK.near(SK.cc(SATS[i].p, rad[i] + b, SATS[j].p, rad[j] + b), P);
      const T3 = [bn(0, 1), bn(1, 2), bn(0, 2)];
      const hasTri = seg(-b, 1.5, 6) * es(t, 118, 119);
      SK.al(hasTri, () => {
        SK.hatch(T3, { color: C.RED, gap: 5, ang: 0.5, a: 0.75, base: 0.3, seed: 41 });
        T3.forEach((q, i) => SK.disc(q[0], q[1], 5.5 / Math.sqrt(z), C.INK));
        SK.al(win(t, 123, 139.5), () => {
          const cgx = (T3[0][0] + T3[1][0] + T3[2][0]) / 3, cgy = (T3[0][1] + T3[1][1] + T3[2][1]) / 3;
          SK.text('feiltrekanten', cgx + 74, cgy - 46, { size: 30, prog: seg(t, 123.3, 124.8) });
          SK.arrow(cgx + 70, cgy - 38, cgx + 10, cgy - 6, { w: 2, head: 9, prog: seg(t, 124.6, 125.4), seed: 42 });
        });
      });
      SK.al(win(t, 113, 149), () => {
        SK.clock(P[0] - 130, P[1] + 10, 28 / Math.sqrt(z), t * 3 + b * 0.4, { color: b < -1 ? C.RED : C.GRN, seed: 43 });
        SK.text('klokkefeil: ' + (b < -0.4 ? '−' + SK.nb(-b / 60) + ' µs' : '0,00 µs  ✓'), 70, 92, { size: 44, color: b < -0.4 ? C.RED : C.GRN });
        SK.text('1 µs feil  ×  lysfarten  =  300 m', 70, 148, { size: 44, prog: seg(t, 115, 118) });
      });

      /* punktet der alt møtes */
      const hit = es(t, 79, 80) * (1 - seg(-b, 0.5, 4));
      SK.al(hit, () => SK.mark(P[0], P[1], { seed: 44, r: 8 }));
      SK.al(es(t, 144.8, 145.3) * (1 - es(t, 147, 149)), () => SK.circle(P[0], P[1], 30 + 6 * Math.sin(t * 5), { w: 3.4, color: C.GRN, seed: 45 }));
    });

    /* satellittene */
    SATS.forEach((s, i) => {
      if (t < IN[i]) return;
      const f = es(t, IN[i], IN[i] + 4);
      let x = lerp(s.from[0], s.p[0], f), y = lerp(s.from[1], s.p[1], f) - 70 * Math.sin(Math.PI * f);
      let a = seg(t, IN[i], IN[i] + 0.6) * (i === 0 ? 1 : fade);
      if (i === 0) { x = lerp(x, GLR.CX, m); y = lerp(y, GLR.CY, m); }
      SK.al(a, () => SK.sat(x, y, lerp(0.85, 0.55, i === 0 ? m : 0), { color: s.c, rot: (1 - f) * 1.4 - 0.2, seed: i * 30 }));
    });
    SK.al(fade, () => SK.car(cx, cy, 1, { rot: tilt, wheel: cx / 11 }));
    ctx.restore();
  }

  return {
    id: 'plan', dur: DUR, noFadeOut: true, draw,
    chapters: [
      { t: 0, title: 'Hvor er jeg?' },
      { t: 14, title: 'Én satellitt: tid blir avstand' },
      { t: 46, title: 'To satellitter: to muligheter' },
      { t: 70, title: 'Tre satellitter: ett punkt' },
      { t: 106, title: 'Klokkefeilen og feiltrekanten' }
    ],
    caps: [
      [2, 8, 'Hvor er jeg?', 'Hver dag spør vi telefonen eller bilen om akkurat det. Svaret kommer fra verdensrommet.'],
      [8.5, 13.8, '', 'Det rare er at mottakeren i bilen ikke sender noe som helst. Den bare lytter – og regner.'],
      [14.5, 21, 'Én satellitt', '20 200 kilometer over oss går en satellitt med en atomklokke om bord. Den roper ut det samme, om og om igjen: hva klokka er, og hvor den selv er.'],
      [21.5, 29.5, '', 'Signalet går med lysets hastighet. Bilen måler hvor lenge det var underveis. Tid ganger lysfart er avstand.'],
      [30, 36.5, '', 'Men avstand er ikke retning. Vi vet bare at vi er et eller annet sted på denne sirkelen.'],
      [37, 45.5, '', 'Kjører bilen videre, følger sirkelen med. En ny måling, mange ganger i sekundet.'],
      [46.5, 55, 'To satellitter', 'Så kommer satellitt nummer to inn over horisonten, med sin egen avstand og sin egen sirkel.'],
      [55.5, 63, '', 'To sirkler krysser hverandre i nøyaktig to punkter. Vi er i ett av dem – men hvilket?'],
      [63.5, 69.6, '', 'Det ene ligger her nede på veien. Det andre svever høyt oppe. Fristende å gjette, men la oss være sikre.'],
      [70.5, 79, 'Tre satellitter', 'Den tredje satellitten avgjør saken.'],
      [79.5, 87, '', 'Tre sirkler har bare ett felles punkt. Det falske krysset faller bort. Dette er trilaterasjon: posisjon fra tre avstander.'],
      [87.5, 96, 'Geometrien bak', 'Vi stopper et øyeblikk. Satellittenes posisjoner er kjent, avstandene er målt. Da er trekantene låst – de kan bare settes sammen på én måte.'],
      [96.5, 104.5, '', 'Hver sirkel er en likning. Tre likninger, to ukjente: x og y. Det går opp, med én til overs.'],
      [105, 113, 'En liten tilståelse', 'Én ting har vi jukset med. Satellitten har atomklokke. Bilen har en billig kvartsklokke.'],
      [113.5, 122, '', 'Går bilens klokke bare ett mikrosekund feil, blir alle avstandene 300 meter gale – like mye for hver satellitt.'],
      [122.5, 131, 'Feiltrekanten', 'Sirklene møtes ikke lenger i ett punkt. De lager en liten trekant. Jo større klokkefeil, jo større trekant.'],
      [131.5, 139, '', 'Løsningen er en satellitt til. Mottakeren behandler sin egen klokkefeil som en ukjent – og begynner å skru på den …'],
      [139.5, 149, '', '… helt til alle sirklene møtes i ett eneste punkt. Da har vi fått to ting på en gang: riktig sted og riktig tid.'],
      [150.5, 157.6, '', 'Så langt har vi tegnet på et flatt ark. Men verden er ikke flat. Hver sirkel er egentlig et snitt gjennom noe større.']
    ]
  };
})();
