'use strict';
/* Sett 2: rommet. Kuler i stedet for sirkler. */
const ROM = (() => {
  const { C, es, seg, ease, lerp, clamp, kf, win } = SK;
  const V = GLR.V, D = Math.PI / 180, RO = 4.17;
  const dir = (el, az) => [Math.cos(el * D) * Math.cos(az * D), Math.sin(el * D), Math.cos(el * D) * Math.sin(az * D)];
  const P = [0, 1, 0];
  const S = [[48, 215], [60, 335], [40, 95], [72, 150]].map(([e, a]) => V.mul(dir(e, a), RO));
  const R = S.map(s => V.len(V.sub(s, P)));
  const HEX = [C.RED, C.BLUE, C.YEL, C.GRN];
  const RGB = HEX.map(h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255));
  const D0 = 20;
  const RS = GLR.F * R[0] / Math.sqrt(D0 * D0 - R[0] * R[0]);   // skjermradius for kule 1 i åpningsbildet
  const IN = [-10, 18, 38, 95], GROW = [[-2, -1], [22, 27], [42, 47], [99, 103]];
  const K = {
    tx: [[2, S[0][0]], [10, 0]], tz: [[2, S[0][2]], [10, 0]],
    ty: [[2, S[0][1]], [10, 2.6], [66, 2.6], [80, 1]],
    dist: [[2, D0], [10, 22], [47, 22], [56, 24], [66, 24], [80, 6], [93, 6], [98, 7.5], [113, 7.5], [120, 2.4]],
    az: [[2, 270], [10, 300], [18, 305], [38, 335], [47, 350], [58, 380], [66, 392], [80, 415], [95, 420], [104, 432], [113, 440], [120, 446]],
    el: [[2, 10], [10, 16], [38, 14], [47, 9], [58, 10], [66, 12], [80, 38], [113, 38], [120, 50]]
  };
  const DUR = 120;

  function draw(t) {
    const cam = GLR.cam({ tx: kf(t, K.tx), ty: kf(t, K.ty), tz: kf(t, K.tz), dist: kf(t, K.dist), az: kf(t, K.az), el: kf(t, K.el) });
    const pr = p => GLR.project(cam, p);
    const b = kf(t, [[86, 0], [91, 0.24], [104, 0.24], [110, 0]]);
    const out = 1 - es(t, DUR - 1, DUR);
    const spheres = S.map((s, i) => ({
      c: s, col: RGB[i],
      r: (R[i] + b) * (i === 0 ? 1 : ease(seg(t, GROW[i][0], GROW[i][1]))),
      a: i === 0 ? 1 : es(t, GROW[i][0], GROW[i][0] + 0.8)
    }));
    const g = { cam, spheres, alpha: es(t, 0.3, 2.4) * out, earth: es(t, 58, 62), ground: es(t, 68, 72), fill: kf(t, [[66, 1], [79, 0.4], [97, 0.4], [103, 0.3]]) };

    SK.al(out, () => {
      /* overgangen fra arket: sirkelen som blir en kule */
      SK.al(1 - es(t, 0.8, 2.8), () => {
        SK.disc(GLR.CX, GLR.CY, RS, C.RED, 0.3, true);
        SK.ring(GLR.CX, GLR.CY, RS, { color: C.RED, w: 7, seed: 100 });
      });

      /* punktet som kan være hvor som helst på kuleskallet */
      SK.al(win(t, 6, 17), () => {
        const w = V.add(S[0], V.mul(dir(18 + 22 * Math.sin(t * 0.5), 288 + 50 * Math.sin(t * 0.37)), R[0]));
        const a = pr(S[0]), q = pr(w);
        SK.line(a[0], a[1], q[0], q[1], { w: 2.6, seed: 5 });
        SK.text('r = c · Δt', (a[0] + q[0]) / 2 + 14, (a[1] + q[1]) / 2 - 20, { size: 38 });
        SK.mark(q[0], q[1], { seed: 6 });
        SK.text('?', q[0] + 22, q[1] - 22, { size: 54 });
      });

      /* skjæringssirkelen mellom kule 1 og 2 */
      SK.al(win(t, 28, 37), () => {
        const ex = V.norm(V.sub(S[1], S[0])), d = V.len(V.sub(S[1], S[0]));
        const x = (R[0] * R[0] - R[1] * R[1] + d * d) / (2 * d), h = Math.sqrt(Math.max(0, R[0] * R[0] - x * x));
        const c = V.add(S[0], V.mul(ex, x)), e = V.sub(cam.eye, c);
        const pt = pr(V.add(c, V.mul(V.norm(V.sub(e, V.mul(ex, V.dot(ex, e)))), h)));
        SK.text('skjæringssirkel', pt[0] - 300, pt[1] + 150, { size: 44, prog: seg(t, 28.5, 30) });
        SK.arrow(pt[0] - 150, pt[1] + 122, pt[0] - 10, pt[1] + 12, { w: 2.8, prog: seg(t, 30, 31), seed: 9 });
      });

      /* de to punktene der tre kuler møtes */
      const tri = GLR.trilat(S[0], R[0] + b, S[1], R[1] + b, S[2], R[2] + b);
      const dP = p => V.len(V.sub(p, P));
      const est = dP(tri[0]) < dP(tri[1]) ? tri[0] : tri[1], Q = est === tri[0] ? tri[1] : tri[0];
      const e2 = pr(est), q2 = pr(Q), p2 = pr(P);
      const mA = es(t, 47, 48.5);
      SK.al(mA * (1 - es(t, 73, 76)), () => {
        SK.mark(q2[0], q2[1], { seed: 12, r: 10 });
        SK.al(1 - es(t, 63, 64), () => SK.text('?', q2[0] + 24, q2[1] - 24, { size: 54 }));
        SK.cross(q2[0], q2[1], 30, { prog: seg(t, 64, 65.5), color: C.RED, w: 6 });
        SK.text('ute i rommet – forkastes', q2[0] + 44, q2[1] + 6, { size: 40, prog: seg(t, 65.5, 67.5), color: C.RED });
      });

      /* bilen på jordoverflaten */
      const cs = clamp(4.6 / p2[2], 0.3, 1.25);
      SK.al(es(t, 60, 62), () => {
        SK.car(p2[0] + 4 * cs, p2[1] + 60 * cs, cs, { wheel: 0 });
        SK.al(win(t, 62, 70), () => {
          SK.text('her er vi', p2[0] - 250, p2[1] + 120, { size: 42, prog: seg(t, 62.3, 63.5) });
          SK.arrow(p2[0] - 130, p2[1] + 100, p2[0] - 24, p2[1] + 30, { w: 2.8, prog: seg(t, 63.3, 64.2), seed: 14 });
        });
      });
      SK.al(mA, () => {
        SK.mark(e2[0], e2[1], { seed: 11, r: 10 });
        SK.al(1 - es(t, 58, 60), () => SK.text('?', e2[0] + 24, e2[1] - 24, { size: 54 }));
        SK.al(win(t, 89, 108), () => {
          SK.text('her er tre kuler enige …', e2[0] + 60, e2[1] - 120, { size: 40, prog: seg(t, 89.5, 91.5) });
          SK.arrow(e2[0] + 150, e2[1] - 96, e2[0] + 22, e2[1] - 20, { w: 2.8, prog: seg(t, 91.5, 92.5), seed: 15 });
          SK.text('… men bilen står her', p2[0] - 330, p2[1] + 150, { size: 40, prog: seg(t, 92.5, 94.5) });
        });
        SK.al(es(t, 110, 110.6) * (1 - es(t, 114, 116)), () => SK.circle(p2[0], p2[1], 34 + 8 * Math.sin(t * 4), { w: 3.4, color: C.INK, seed: 16 }));
      });

      /* satellittene */
      S.forEach((s, i) => {
        const f = i === 0 ? 1 : es(t, IN[i], IN[i] + 4);
        if (t < IN[i]) return;
        const p = pr(V.lerp(V.add(V.mul(s, 2.3), [0, 3, 0]), s, f));
        if (p[2] < 1) return;
        SK.al(seg(t, IN[i], IN[i] + 0.6), () => SK.sat(p[0], p[1], clamp(11 / p[2], 0.3, 1.1), { color: HEX[i], rot: (1 - f) * 1.5 - 0.2, seed: i * 30 }));
      });

      /* matematikken i margen */
      const M = (a, b2, s, y = 92) => SK.al(win(t, a, b2), () => SK.text(s, 70, y, { size: 44, prog: seg(t, a + 0.3, a + 2.6) }));
      M(4, 17, '(x − x₁)² + (y − y₁)² + (z − z₁)² = r₁²');
      M(27, 37, 'kule ∩ kule = sirkel');
      M(47, 57, 'sirkel ∩ kule = to punkter');
      M(67, 84, 'to punkter – bare ett ligger på jorda');
      M(96, 118, 'rᵢ = c · (Δtᵢ − klokkefeil)');
      M(105, 118, '4 likninger  →  x, y, z og klokkefeil', 150);
      SK.al(win(t, 87, 118), () => SK.text('klokkefeil: ' + (b > 0.002 ? '+' + SK.nb(b * 2.1) + ' µs' : '0,00 µs  ✓'), 70, 208, { size: 44, color: b > 0.002 ? C.RED : C.GRN }));
    });
    return g;
  }

  return {
    id: 'rom', dur: DUR, noFadeIn: true, draw, RS,
    chapters: [
      { t: 0, title: 'I rommet: én satellitt, én kule' },
      { t: 18, title: 'To kuler – en sirkel' },
      { t: 38, title: 'Tre kuler – to punkter' },
      { t: 58, title: 'Jorda avgjør' },
      { t: 86, title: 'Fire kuler – sted og tid' }
    ],
    caps: [
      [1, 8.5, 'Opp fra arket', 'Løft blikket fra arket, og sirkelen blir en kule. Én satellitt, én avstand: vi er et sted på dette kuleskallet.'],
      [9, 17, '', 'Kulens radius er avstanden signalet rakk å gå. Alle punktene på overflaten ligger nøyaktig like langt fra satellitten.'],
      [18.5, 26.5, 'Nummer to', 'Den andre satellitten legger sin egen kule oppå den første. Se hvordan fargene blander seg der de overlapper.'],
      [27, 37, '', 'To kuler skjærer hverandre langs en sirkel. Følg den sterke linjen: bare der stemmer begge avstandene samtidig.'],
      [38.5, 46.5, 'Nummer tre', 'Kule nummer tre skjærer tvers gjennom den sirkelen.'],
      [47, 57, '', 'En sirkel og et kuleskall møtes i to punkter. Hele verdensrommet er krympet til to mulige steder.'],
      [58.5, 67, 'Jorda inn i bildet', 'Nå setter vi jordkloden på plass. Det ene punktet ligger pent på overflaten. Det andre svever tusenvis av kilometer ute i rommet.'],
      [67.5, 76, '', 'Det er lett å forkaste: ingen bil kjører der oppe, og punktet ville flyttet seg i vanvittig fart. Mottakeren velger punktet på jorda.'],
      [76.5, 85.5, '', 'Zoomer vi inn, ser vi kulene som enorme buer over bakken. De tre fargede linjene på jorda møtes akkurat der bilen står.'],
      [86.5, 95, 'Klokkefeilen igjen', 'I rommet er klokkefeilen lumsk. Tre kuler som alle er litt for store, møtes fortsatt i et punkt – bare på feil sted.'],
      [95.5, 104, '', 'Den fjerde kulen avslører feilen: den går ikke gjennom punktet de tre andre er enige om.'],
      [104.5, 113, '', 'Mottakeren skrur på klokka til alle fire kulene møtes i ett punkt. Fire ukjente – x, y, z og tid – krever fire satellitter.'],
      [113.5, 119.6, '', 'Stedet er funnet. Men GPS-en vet mer enn hvor du er. Den vet også hvor fort du kjører.']
    ]
  };
})();
