'use strict';
/* Sett 5: jamming, spoofing og oppsummering */
const JAM = (() => {
  const { C, es, seg, lerp, clamp, kf, win, TAU, noise } = SK;
  const DUR = 68, GY = ROAD.GY, CSX = 520, P = [CSX - 4, GY - 60];
  const X = SK.integ([[0, 240], [17, 240], [20, 0], [46, 0], [49, 240], [68, 240]], DUR);
  const XJ = X(30) + 330;
  const S0 = [[190, 150], [640, 90], [1130, 170]], COL = [C.RED, C.BLUE, C.YEL], DARK = '#5b5566';
  const d2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const arcAt = (c, r, q, half) => { const a = Math.atan2(q[1] - c[1], q[0] - c[0]); return SK.arcPts(c[0], c[1], r, a - half, a + half); };
  const SUM = ['tid × lysfart = avstand', 'én avstand = én kule', 'fire kuler  →  ett punkt og riktig tid', 'Doppler  →  fart', 'bakken passer på baner og klokker'];

  function draw(t) {
    const ctx = SK.ctx, x = X(t), camX = x - CSX, ph = x / 240 + t * 0.3, boil = Math.floor(t * 9);
    const jx = XJ - camX, jy = GY;
    const jamOn = es(t, 9.5, 11) * (1 - es(t, 28, 30));
    const J = (1 - seg(XJ - x, 380, 1500)) * jamOn;
    const sp = es(t, 31, 40) * (1 - es(t, 46, 48.5)) * -270, spOn = es(t, 29.5, 31) * (1 - es(t, 46, 48));
    const Gp = [P[0] + sp, P[1]];
    const z = kf(t, [[0, 0.3], [4, 1]]), fin = 1 - es(t, 47.5, 49.5);
    ctx.save();
    if (z !== 1) { ctx.translate(690, GY); ctx.scale(z, z); ctx.translate(-690, -GY); }

    ROAD.draw(camX, {
      exclude: [XJ - 260, XJ + 260],
      behind: () => SK.al(es(t, 6, 7), () => {
        /* støysenderen: en liten varebil med antenne */
        const b = [[jx - 60, jy - 8], [jx - 60, jy - 62], [jx + 26, jy - 62], [jx + 40, jy - 40], [jx + 62, jy - 36], [jx + 62, jy - 8]];
        SK.fill(b, C.PAPER, 1); SK.hatch(b, { color: DARK, gap: 6, ang: 0.4, a: 0.55, seed: 3 });
        SK.stroke(SK.polyPts(b, true), { w: 2.8, seed: 4 });
        for (const wx of [-34, 36]) { SK.disc(jx + wx, jy - 10, 11, C.PAPER, 1); SK.circle(jx + wx, jy - 10, 10, { w: 3, seed: 5 + wx, rough: 0.6 }); }
        SK.line(jx - 20, jy - 62, jx - 20, jy - 130, { w: 3, seed: 6 });
        SK.line(jx - 34, jy - 118, jx - 6, jy - 118, { w: 2.4, seed: 7 }); SK.line(jx - 30, jy - 104, jx - 10, jy - 104, { w: 2.4, seed: 8 });
      })
    });

    /* støyen */
    SK.al(jamOn, () => {
      for (let k = 0; k < 5; k++) {
        const r = 70 + ((k * 150 + t * 70) % 750);
        SK.stroke(SK.arcPts(jx - 20, jy - 130, r, Math.PI, TAU), { color: DARK, w: 5, passes: 1, rough: 9, a: 0.6 * (1 - r / 820), seed: boil + k * 17 });
      }
      SK.al(win(t, 11.5, 28, 0.8), () => SK.text('bråk på samme frekvens', jx + 86, jy - 84, { size: 38, color: DARK, prog: seg(t, 11.8, 13.5) }));
    });

    /* de svake signalene fra satellittene */
    const clean = 1 - J * 0.92;
    SK.al(fin, () => S0.forEach((s, i) => {
      const u = [P[0] - s[0], P[1] - s[1]], L = Math.hypot(u[0], u[1]), pts = [];
      for (let q = 60; q <= L - 14; q += 3) { const o = 5 * Math.sin(TAU * (q / 34 - ph * 1.5)); pts.push([s[0] + u[0] / L * q - u[1] / L * o, s[1] + u[1] / L * q + u[0] / L * o]); }
      SK.stroke(pts, { color: COL[i], w: 2.6, passes: 1, rough: 0.3, a: 0.75 * es(t, 1.5, 3) });
      const c = spOn > 0.01 ? Gp : P;
      SK.crayon(arcAt(s, d2(s, c), c, 0.2), { color: COL[i], w: 6, a: clean, rough: 1 + J * 16, seed: 20 + i + (J > 0.05 ? boil : 0) });
    }));
    SK.al(clean * (1 - spOn) * fin, () => SK.mark(P[0], P[1], { r: 7, seed: 30 }));
    SK.al(J * win(t, 19, 29, 0.8), () => { SK.text('?', P[0] + 4, P[1] - 70, { size: 110, align: 'center', color: C.RED }); SK.text('ingen posisjon', P[0] - 300, P[1] - 20, { size: 42, color: C.RED, prog: seg(t, 20.5, 22) }); });

    /* «mottatt i bilen» */
    SK.al(win(t, 3, 46, 1), () => {
      SK.text('mottatt i bilen', 800, 596, { size: 36 });
      const pts = [];
      for (let s = 0; s <= 300; s += 3) pts.push([800 + s, 668 + 7 * Math.sin(TAU * (s / 30 - ph * 2)) * (1 + spOn) + J * 46 * noise(boil + 300, s / 7)]);
      SK.stroke(pts, { color: J > 0.3 ? DARK : (spOn > 0.5 ? C.VIO : C.BLUE), w: 3.2, passes: 1, rough: 0.3 });
    });
    SK.al(win(t, 2.5, 10.5), () => {
      SK.text('signalet ved bakken:  0,000 000 000 000 000 1 watt', 70, 92, { size: 44, prog: seg(t, 3, 6.5) });
      SK.text('– en hvisking fra 20 000 km', 70, 148, { size: 44, prog: seg(t, 6.8, 8.6) });
    });

    /* spoofing: falske signaler flytter posisjonen */
    SK.al(spOn, () => {
      const a = [jx - 20, jy - 130], u = [P[0] - a[0], P[1] - a[1]], L = Math.hypot(u[0], u[1]), pts = [];
      for (let q = 10; q <= L - 10; q += 3) { const o = 12 * Math.sin(TAU * (q / 34 - ph * 1.5)); pts.push([a[0] + u[0] / L * q - u[1] / L * o, a[1] + u[1] / L * q + u[0] / L * o]); }
      SK.stroke(pts, { color: C.VIO, w: 4, passes: 1, rough: 0.3 });
      SK.car(CSX + sp, GY, 1, { ghost: true, color: C.VIO });
      SK.mark(Gp[0], Gp[1], { r: 7, seed: 31, color: C.VIO });
      SK.al(win(t, 35, 46, 0.7), () => SK.text('hit tror GPS-en at vi er', CSX + sp - 150, 925, { size: 40, color: C.VIO, prog: seg(t, 35.3, 37.3) }));
      SK.al(win(t, 30.5, 36, 0.6), () => SK.text('falske «satellitter»', jx + 86, jy - 84, { size: 38, color: C.VIO, prog: seg(t, 30.8, 32.4) }));
    });

    /* oppsummering */
    SK.al(es(t, 49, 50), () => SUM.forEach((s, i) => SK.text(s, 70, 92 + i * 60, { size: 50, prog: seg(t, 49.5 + i * 2, 51.3 + i * 2), color: [C.INK, C.RED, C.BLUE, '#b97d0c', C.GRN][i] })));

    SK.al(fin, () => S0.forEach((s, i) => SK.sat(s[0], s[1], 0.72, { color: COL[i], rot: -0.2 + i * 0.2, seed: i * 30 })));
    SK.car(CSX, GY, 1, { wheel: x / 11 });
    ctx.restore();
  }

  return {
    id: 'jam', dur: DUR, draw,
    chapters: [
      { t: 0, title: 'Jamming: når noen roper høyere' },
      { t: 28, title: 'Spoofing: den falske satellitten' },
      { t: 47, title: 'Oppsummert' }
    ],
    caps: [
      [1, 9.5, 'En hvisking', 'Til slutt: hvor skjørt er dette? Signalet har reist 20 000 kilometer fra en sender som ikke er sterkere enn en lyspære. Når det når bakken, er det svakere enn bakgrunnssuset.'],
      [10, 18.5, 'Jamming', 'En støysender – en jammer – trenger ikke være stor. Den sender bare bråk på samme frekvens, og fordi den står så mye nærmere, overdøver den alt.'],
      [19, 27.5, '', 'Mottakeren finner ikke lenger hviskingen i bråket. Sirklene går i oppløsning, og posisjonen forsvinner. Ikke feil posisjon – bare ingen.'],
      [28.5, 37, 'Spoofing', 'Verre er narring. Da sendes falske signaler som ligner på de ekte, bare litt sterkere. Mottakeren regner trofast ut en posisjon – og ledes stille og rolig et annet sted.'],
      [37.5, 46, '', 'Forsvaret er å ikke stole på én kilde: flere frekvenser, flere systemer som Galileo og GLONASS, og sensorer i bilen som merker om bevegelsen faktisk stemmer.'],
      [47.5, 58, 'Neste gang', 'Når prikken følger deg gjennom et kryss: fire klokker i verdensrommet, noen kuler som skjærer hverandre, litt Doppler og en dæsj Einstein. Resten er geometri.'],
      [59, 67.5, '', 'Takk for turen.']
    ]
  };
})();
