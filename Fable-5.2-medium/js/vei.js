'use strict';
/* Felles veilandskap (sidevisning som ruller) */
const ROAD = (() => {
  const { C, hash } = SK;
  const GY = 860;
  function draw(camX, o = {}) {
    const hp = [];
    for (let x = -20; x <= 1940; x += 24) { const wx = x + camX * 0.25; hp.push([x, 790 - 55 * Math.sin(wx / 310) - 28 * Math.sin(wx / 127 + 1)]); }
    SK.stroke(hp, { w: 2, color: C.GREY, a: 0.5, seed: 1, rough: 0.6 });
    const ex = o.exclude || [1e9, -1e9];
    for (let k = Math.floor((camX - 300) / 520); k * 520 < camX + 2100; k++) {
      const wx = k * 520 + hash(k + 99) * 220;
      if (wx > ex[0] && wx < ex[1]) continue;
      SK.tree(wx - camX, GY, 0.85 + hash(k + 7) * 0.4, (k & 255) * 9);
    }
    if (o.behind) o.behind();
    SK.line(-20, GY, 1940, GY, { w: 3.2, seed: 3 });
    for (let k = Math.floor((camX - 100) / 90); k * 90 < camX + 2000; k++) {
      const sx = k * 90 + hash(k + 500) * 50 - camX;
      SK.line(sx, GY + 11, sx + 16, GY + 11, { w: 2, a: 0.45, passes: 1, rough: 0.4 });
    }
  }
  return { GY, draw };
})();

/* Sett 3: fart (Doppler), ekko mellom husene, luft og geometri */
const VEI = (() => {
  const { C, es, seg, ease, lerp, clamp, kf, win, TAU } = SK;
  const DUR = 140, GY = ROAD.GY, CSX = 520, P = [CSX - 4, GY - 60];
  const X = SK.integ([[0, 260], [17, 260], [19, 0], [44, 0], [46.5, 260], [57, 260], [60, 0], [84, 0], [87, 260], [100, 260], [103, 0], [126, 0], [128, 260], [140, 260]], DUR);
  const XS = X(70);
  const BLOCK = { x: XS - 400, w: 260, h: 380 }, TOWER = { x: XS + 160, w: 240, h: 560 };
  const BG = [[XS - 1010, 150, 190], [XS - 780, 180, 250], [XS + 560, 190, 270], [XS + 820, 150, 180]];
  const S0 = [[190, 150], [640, 90], [1130, 170]], COL = [C.RED, C.BLUE, C.YEL];
  const d2 = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const rect = (b, camX) => ({ x0: b.x - camX, x1: b.x + b.w - camX, y0: GY - b.h, y1: GY });
  function segRect(p, q, r) {
    let u0 = 0, u1 = 1; const dx = q[0] - p[0], dy = q[1] - p[1];
    const cl = (pp, qq) => {
      if (pp === 0) return qq >= 0;
      const u = qq / pp;
      if (pp < 0) { if (u > u1) return false; if (u > u0) u0 = u; } else { if (u < u0) return false; if (u < u1) u1 = u; }
      return true;
    };
    if (cl(-dx, p[0] - r.x0) && cl(dx, r.x1 - p[0]) && cl(-dy, p[1] - r.y0) && cl(dy, r.y1 - p[1]) && u0 < u1) return u0;
    return null;
  }
  const blockU = t => {
    const camX = X(t) - CSX;
    const a = segRect(S0[0], P, rect(BLOCK, camX)), b = segRect(S0[0], P, rect(TOWER, camX));
    return a === null ? b : (b === null ? a : Math.min(a, b));
  };
  let TC = 100; for (let t = 84; t < 100; t += 0.05) if (blockU(t) === null) { TC = t; break; }

  /* geometri i stoppet mellom husene */
  const GXW = 680;                                   // glassveggen på skjermen
  const PM = [2 * GXW - P[0], P[1]];                  // speilbildet av bilen
  const G = [GXW, lerp(S0[0][1], PM[1], (GXW - S0[0][0]) / (PM[0] - S0[0][0]))];
  const RR = d2(S0[0], PM), R2 = d2(S0[1], P), R3 = d2(S0[2], P);
  const TRI = [P, SK.near(SK.cc(S0[0], RR, S0[1], R2), P), SK.near(SK.cc(S0[0], RR, S0[2], R3), P)];
  const CEN = [(TRI[0][0] + TRI[1][0] + TRI[2][0]) / 3, (TRI[0][1] + TRI[1][1] + TRI[2][1]) / 3];
  const arcAt = (c, r, q, half) => { const a = Math.atan2(q[1] - c[1], q[0] - c[0]); return SK.arcPts(c[0], c[1], r, a - half, a + half); };
  const sinePts = (a, b, lam, amp, ph) => {
    const L = d2(a, b), ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L, pts = [];
    for (let s = 0; s <= L; s += 3) { const o = amp * Math.sin(TAU * (s / lam - ph)) * Math.min(1, s / 30, (L - s) / 30); pts.push([a[0] + ux * s - uy * o, a[1] + uy * s + ux * o]); }
    return pts;
  };

  function draw(t) {
    const ctx = SK.ctx, x = X(t), camX = x - CSX, ph = x / 260;
    const mv = kf(t, [[112, 0], [118, 1], [122, 1], [126, 0]]);
    const SP = [[lerp(190, 560, mv), lerp(150, 110, mv)], S0[1], [lerp(1130, 760, mv), lerp(170, 120, mv)]];
    const zi = kf(t, [[0, 2.4], [4, 1]]), zo = kf(t, [[132, 1], [140, 0.22]]);
    ctx.save();
    if (zi !== 1) { ctx.translate(CSX, GY - 30); ctx.scale(zi, zi); ctx.translate(-CSX, -(GY - 30)); }
    if (zo !== 1) { ctx.translate(690, GY); ctx.scale(zo, zo); ctx.translate(-690, -GY); }

    ROAD.draw(camX, {
      exclude: [XS - 1200, XS + 1100],
      behind: () => {
        BG.forEach(([bx, w, h], i) => SK.al(0.55, () => SK.building(bx - camX, GY, w, h, { seed: i * 5, windows: true })));
        SK.building(BLOCK.x - camX, GY, BLOCK.w, BLOCK.h, { seed: 50, color: '#8b8790' });
        SK.building(TOWER.x - camX, GY, TOWER.w, TOWER.h, { seed: 60, glass: true });
      }
    });

    /* ionosfæren */
    SK.al(win(t, 95, 127, 1.5), () => {
      const top = [], bot = [];
      for (let xx = -20; xx <= 1400; xx += 30) { top.push([xx, 330 + 9 * Math.sin(xx / 90)]); bot.unshift([xx, 392 + 9 * Math.sin(xx / 70 + 2)]); }
      SK.hatch(top.concat(bot), { color: C.VIO, gap: 11, ang: 0.15, a: 0.3, base: 0.12, seed: 70 });
      SK.text('ionosfæren', 44, 300, { size: 36, color: C.VIO, prog: seg(t, 96, 97.5) });
      SK.al(win(t, 97.5, 104), () => SK.text('+ noen meter forsinkelse', 800, 318, { size: 34, color: C.VIO, prog: seg(t, 97.8, 99.5) }));
    });

    /* bølgene fra satellittene (Doppler) */
    SK.al(win(t, 5, 46.5, 1), () => SP.forEach((s, i) => {
      const u = [(P[0] - s[0]), (P[1] - s[1])], L = Math.hypot(u[0], u[1]);
      const a = [s[0] + u[0] / L * 60, s[1] + u[1] / L * 60], b = [P[0] - u[0] / L * 14, P[1] - u[1] / L * 14];
      SK.stroke(sinePts(a, b, 34, 8, ph * 1.5), { color: COL[i], w: 3.2, passes: 1, rough: 0.3, a: 0.85 });
    }));
    /* «mottatt i bilen» – tre små bølger */
    SK.al(win(t, 10, 46, 1), () => {
      SK.text('mottatt i bilen', 800, 606, { size: 36 });
      const f = [-0.45, 0.17, 0.7];
      [2, 1, 0].forEach((i, row) => {
        const y = 656 + row * 50, lam = 36 / (1 + 0.5 * f[i]);
        SK.stroke(sinePts([800, y], [1060, y], lam, 13, ph * 2 * (1 + 0.5 * f[i])), { color: COL[i], w: 3.4, passes: 1, rough: 0.3 });
        SK.text(['f₀ − Δf', 'f₀', 'f₀ + Δf'][i], 1082, y, { size: 36, color: COL[i] });
      });
    });
    /* fartspila og projeksjonene */
    SK.al(win(t, 19.5, 45, 0.9), () => {
      const VL = 190, tip = [P[0] + VL, P[1]];
      [2, 0, 1].forEach((i, k) => {
        const t0 = k === 0 ? 21 : 28 + k * 1.2;
        const s = SP[i], L = d2(s, P), u = [(s[0] - P[0]) / L, (s[1] - P[1]) / L], pr = VL * u[0];
        const F = [P[0] + u[0] * pr, P[1] + u[1] * pr];
        SK.line(P[0], P[1], P[0] + u[0] * 260, P[1] + u[1] * 260, { w: 1.6, color: COL[i], a: 0.7, prog: es(t, t0, t0 + 0.8), seed: 80 + i });
        SK.line(tip[0], tip[1], F[0], F[1], { w: 2, prog: es(t, t0 + 0.9, t0 + 1.8), seed: 83 + i });
        SK.cline(P[0], P[1], F[0], F[1], { color: COL[i], w: 8, prog: es(t, t0 + 1.8, t0 + 2.8), seed: 86 + i });
        if (i === 2) {
          SK.angle(P[0], P[1], 62, Math.atan2(u[1], u[0]), 0, { prog: es(t, t0 + 2.8, t0 + 3.6), label: 'θ', seed: 89 });
          SK.text('v · cos θ', F[0] - 16, F[1] - 34, { size: 38, color: '#b97d0c', align: 'right', prog: seg(t, t0 + 3.2, t0 + 4.4) });
        }
      });
      SK.arrow(P[0], P[1], tip[0], tip[1], { w: 4.6, head: 20, prog: es(t, 19.6, 20.8), seed: 90 });
      SK.text('v', tip[0] + 18, tip[1] - 6, { size: 50, prog: seg(t, 20.6, 21) });
      SK.text('Δf = f₀ · v · cos θ / c', 70, 92, { size: 46, prog: seg(t, 23.5, 26.5) });
      SK.text('tre målinger  →  én fartspil:   v = 62 km/t', 70, 150, { size: 46, prog: seg(t, 36.5, 40) });
    });

    /* siktlinjer i byen */
    const bu = blockU(t);
    SK.al(win(t, 47, 127, 1) * (1 - win(t, 60.5, 85, 0.6)), () => SP.forEach((s, i) => {
      const u = i === 0 && bu !== null ? bu : 1;
      SK.line(s[0], s[1], lerp(s[0], P[0], u), lerp(s[1], P[1], u), { w: 2, color: COL[i], a: i === 1 ? 0.75 * (1 - win(t, 103, 127, 1)) : 0.75, passes: 1, rough: 0.6, seed: 91 + i });
      if (u < 1) SK.cross(lerp(s[0], P[0], u), lerp(s[1], P[1], u), 12, { color: C.RED, w: 4 });
    }));

    /* stoppet mellom betong og glass */
    SK.al(win(t, 60.8, 84.8, 0.7), () => {
      const u = segRect(S0[0], P, rect(BLOCK, XS - CSX)) || 0.5, H = [lerp(S0[0][0], P[0], u), lerp(S0[0][1], P[1], u)];
      SK.line(S0[1][0], S0[1][1], P[0], P[1], { w: 2, color: C.BLUE, a: 0.6, passes: 1, seed: 92 });
      SK.line(S0[2][0], S0[2][1], P[0], P[1], { w: 2, color: C.YEL, a: 0.7, passes: 1, seed: 93 });
      SK.al(1 - es(t, 70, 72) * 0.6, () => {
        SK.cline(S0[0][0], S0[0][1], H[0], H[1], { color: C.RED, w: 6, prog: es(t, 61, 63), seed: 94 });
        SK.cross(H[0], H[1], 18, { prog: seg(t, 63, 63.8), color: C.INK, w: 5 });
        SK.text('stengt', H[0] + 26, H[1] - 26, { size: 38, prog: seg(t, 63.6, 64.4) });
      });
      SK.cline(S0[0][0], S0[0][1], G[0], G[1], { color: C.RED, w: 6, prog: es(t, 66, 68), seed: 95 });
      SK.cline(G[0], G[1], P[0], P[1], { color: C.RED, w: 6, prog: es(t, 68, 69.3), seed: 96 });
      SK.line(G[0] - 130, G[1], G[0], G[1], { w: 1.8, prog: es(t, 69.3, 70), seed: 97 });
      const ain = Math.atan2(S0[0][1] - G[1], S0[0][0] - G[0]) + TAU, aout = Math.atan2(P[1] - G[1], P[0] - G[0]);
      SK.angle(G[0], G[1], 58, Math.PI, ain, { prog: es(t, 70, 70.7), label: 'α', seed: 98 });
      SK.angle(G[0], G[1], 58, aout, Math.PI, { prog: es(t, 70.5, 71.2), label: 'α', seed: 99 });
      SK.al(es(t, 71.5, 72.5), () => {
        SK.line(G[0], G[1], PM[0], PM[1], { w: 2.4, color: C.RED, prog: es(t, 71.5, 73), seed: 100 });
        SK.mark(PM[0], PM[1], { color: C.RED, r: 6, a: es(t, 73, 73.5), seed: 101 });
        SK.text('omvei', (G[0] + PM[0]) / 2 + 22, (G[1] + PM[1]) / 2 - 16, { size: 38, color: C.RED, prog: seg(t, 73.2, 74) });
      });
      SK.text('målt avstand = rett vei + omvei', 70, 92, { size: 46, prog: seg(t, 72.5, 75.5) });
      SK.al(es(t, 76, 77), () => {
        SK.crayon(arcAt(S0[1], R2, P, 0.3), { color: C.BLUE, w: 6, prog: es(t, 76, 77.2), seed: 102 });
        SK.crayon(arcAt(S0[2], R3, P, 0.3), { color: C.YEL, w: 6, prog: es(t, 76.4, 77.6), seed: 103 });
        SK.crayon(arcAt(S0[0], RR, PM, 0.26), { color: C.RED, w: 6, prog: es(t, 77, 78.4), seed: 104 });
        SK.hatch(TRI, { color: C.RED, gap: 8, ang: 0.5, a: 0.5 * es(t, 78.4, 79.4), base: 0.2, seed: 105 });
        TRI.forEach(q => SK.disc(q[0], q[1], 6, C.INK, es(t, 78.4, 79)));
        SK.text('feiltrekanten', TRI[1][0] + 46, TRI[1][1] + 58, { size: 36, prog: seg(t, 79.2, 80.4) });
      });
    });
    /* spøkelsesbilen */
    const gh = es(t, 79.5, 81) * (1 - es(t, TC, TC + 0.25));
    SK.al(gh, () => {
      const gx = CSX + (CEN[0] - P[0]) * gh, gyy = GY + (CEN[1] - P[1]) * gh;
      SK.car(gx, gyy, 1, { ghost: true, color: C.VIO });
      SK.al(win(t, 80.5, 92, 0.6), () => SK.text('spøkelsesposisjon', gx - 150, gyy + 40, { size: 38, color: C.VIO, prog: seg(t, 80.8, 82.2) }));
    });
    SK.al(win(t, TC, TC + 3, 0.4), () => SK.text('hopp!', CSX + 70, GY - 110, { size: 44, color: C.VIO, rot: -0.12 }));

    /* usikkerhetsbånd og satellittgeometri */
    SK.al(win(t, 104, 126.5, 1), () => {
      [0, 2].forEach(i => SK.crayon(arcAt(SP[i], d2(SP[i], P), P, 0.33), { color: COL[i], w: 34, a: 0.75, seed: 110 + i, rough: 0.6 }));
      SK.al(win(t, 106, 112.5, 0.6), () => SK.text('lite kryss = liten usikkerhet', P[0] - 190, 925, { size: 40, prog: seg(t, 106.2, 108) }));
      SK.al(win(t, 117.5, 125, 0.6), () => SK.text('langt kryss = stor usikkerhet', P[0] - 190, 925, { size: 40, prog: seg(t, 117.8, 119.6), color: C.RED }));
    });

    /* satellitter og bil */
    SP.forEach((s, i) => SK.al(i === 1 ? 1 - 0.75 * win(t, 103, 127, 1) : 1, () =>
      SK.sat(s[0], s[1] - 320 * (1 - es(t, 0.8 + i * 0.5, 4 + i * 0.5)), 0.72, { color: COL[i], rot: -0.2 + i * 0.2, seed: i * 30 })));
    SK.car(CSX, GY, 1, { wheel: x / 11 });
    ctx.restore();
  }

  return {
    id: 'vei', dur: DUR, draw,
    chapters: [
      { t: 0, title: 'Fart: Doppler-effekten' },
      { t: 46, title: 'Ekko: spøkelser mellom husene' },
      { t: 94, title: 'Signalforhold: luft og geometri' }
    ],
    caps: [
      [1, 9, 'Hvor fort?', 'Fart kunne vi funnet ved å sammenligne to posisjoner. Men det finnes en finere måte – den samme effekten som får en sirene til å skifte tone når den passerer.'],
      [9.5, 18, 'Doppler', 'Satellitten sender en ren tone, en bølge med fast frekvens. Kjører bilen mot bølgene, møter den toppene litt oftere. Kjører den fra dem, litt sjeldnere.'],
      [18.5, 27, '', 'Vi fryser bildet. Bilens fart er en pil, v. Satellitten merker bare den delen av pila som peker langs siktlinjen: v · cos θ.'],
      [27.5, 36, '', 'Hver satellitt måler sin egen bit av farten. Den foran ser bilen komme, den bak ser den dra, den rett over merker nesten ingenting.'],
      [36.5, 45.5, '', 'Tre slike biter, og fartspila er bestemt – lengde og retning. En fjerde tar klokka. Slik måler GPS fart ned til centimeter per sekund.'],
      [46.5, 55, 'Inn mot byen', 'Så langt har signalene hatt fri bane. Men vi kjører sjelden på en åpen slette. Foran oss venter glass og betong.'],
      [57.5, 65.5, '', 'Bak betongblokka når ikke signalet fra den røde satellitten frem. Den rette veien er stengt.'],
      [66, 75, 'Ekkoet', 'Men glassfasaden på andre siden virker som et speil. Signalet spretter – inn og ut i samme vinkel – og når bilen likevel.'],
      [75.5, 84.5, 'Spøkelset', 'Mottakeren vet ikke om omveien. Den måler en for lang avstand, den røde sirkelen blir for stor, og feiltrekanten åpner seg. Midt i den havner posisjonen – et annet sted enn bilen.'],
      [85, 93.5, '', 'Får vi fri sikt igjen, hopper posisjonen tilbake på plass. Det er slike hopp du ser når prikken på kartet plutselig bytter gate.'],
      [94.5, 103, 'Luften over oss', 'Også på åpen vei finnes småfeil. På vei ned bremses signalet litt i ionosfæren og i fuktig luft. Noen meter, typisk.'],
      [103.5, 112, '', 'Derfor er hver avstand egentlig et litt tykt bånd, ikke en tynn strek. Står satellittene godt spredt, krysser båndene hverandre i et lite, skarpt felt.'],
      [112.5, 121.5, 'Geometri', 'Står de tett sammen på himmelen, krysser båndene i spiss vinkel. Samme målefeil – mye større usikkerhet. God spredning er like viktig som mange satellitter.'],
      [127, 136.5, '', 'Alt dette hviler på én ting: at satellitten vet nøyaktig hvor den selv er. Hvordan vet den det? La oss løfte oss opp og se.']
    ]
  };
})();
