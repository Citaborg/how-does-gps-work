'use strict';
/* Sett 4: hvordan satellitten vet hvor den er – bane, bakkestasjoner, klokker */
const BANE = (() => {
  const { C, es, seg, lerp, clamp, kf, win, TAU } = SK;
  const DUR = 88, E = [690, 570], RE = 150, RO = 390, D = Math.PI / 180;
  const ST = [-130, -88, -46].map(a => a * D), SCOL = [C.VIO, C.GRN, C.BLUE];
  const pol = (r, a) => [E[0] + r * Math.cos(a), E[1] + r * Math.sin(a)];
  const phi = t => (-160 + 1.75 * t) * D;
  const dev = t => kf(t, [[12, 0], [24, 42], [48, 42], [53, 0]]);
  const BLOBS = [[-40, -60, 46], [50, 20, 38], [-70, 50, 30], [60, -80, 26]];

  function draw(t) {
    const ctx = SK.ctx, a = phi(t), dv = dev(t), sp = pol(RO + dv, a), pp = pol(RO, a);
    const z = kf(t, [[0, 3.2], [4, 1]]) * kf(t, [[83, 1], [88, 3.6]]);
    ctx.save();
    if (z !== 1) { ctx.translate(E[0], E[1]); ctx.scale(z, z); ctx.translate(-E[0], -E[1]); }

    /* jorda */
    SK.hatchCircle(E[0], E[1], RE, { color: '#5aa6da', gap: 8, ang: -0.5, a: 0.55, seed: 1 });
    BLOBS.forEach(([x, y, r], i) => SK.hatchCircle(E[0] + x, E[1] + y, r, { color: C.GRN, gap: 6, ang: 0.6, a: 0.6, seed: 5 + i }));
    SK.circle(E[0], E[1], RE, { w: 3.2, seed: 2 });

    /* planlagt bane */
    SK.stroke(SK.arcPts(E[0], E[1], RO, -2.6, -2.6 + TAU), { w: 2.2, color: C.GREY, prog: es(t, 2, 6), seed: 3, rough: 1.8 });
    SK.al(win(t, 5, 18), () => {
      SK.text('v = √(GM / r)', 70, 92, { size: 46, prog: seg(t, 5.3, 7.3) });
      SK.text('r = 26 600 km  →  én runde på 11 t 58 min', 70, 150, { size: 46, prog: seg(t, 7.8, 11) });
      SK.line(E[0], E[1], pp[0], pp[1], { w: 2, a: 0.7, seed: 4 });
      SK.text('r', (E[0] + pp[0]) / 2 - 26, (E[1] + pp[1]) / 2 - 14, { size: 42 });
    });

    /* det som dytter og drar */
    SK.al(win(t, 11, 56, 1.2), () => {
      SK.sun(120, 330, 40, t);
      SK.arrow(190, 345, 300, 372, { w: 2.6, prog: es(t, 13, 14.5), seed: 10 });
      SK.text('strålingstrykk', 60, 420, { size: 34, prog: seg(t, 13.5, 15) });
      SK.disc(1250, 300, 26, C.PAPER, 1); SK.hatchCircle(1250, 300, 26, { color: C.GREY, gap: 6, a: 0.5, seed: 11 });
      SK.circle(1250, 300, 26, { w: 2.2, seed: 12 }); SK.circle(1242, 292, 6, { w: 1.4, seed: 13 });
      SK.text('månen drar', 1180, 356, { size: 34, prog: seg(t, 14.5, 16) });
    });

    /* den virkelige banen (rød fargestift) */
    SK.al(win(t, 12.5, 56, 1), () => {
      const tr = [];
      for (let s = 12; s <= t; s += 0.4) tr.push(pol(RO + dev(s), phi(s)));
      tr.push(sp);
      SK.crayon(tr, { color: C.RED, w: 5, seed: 20 });
    });

    /* bakkestasjoner */
    ST.forEach((sa, i) => SK.al(es(t, 10 + i * 0.7, 11.5 + i * 0.7), () => {
      const q = pol(RE, sa);
      SK.dish(q[0], q[1], 1, sa + Math.PI / 2, { seed: 30 + i * 4, color: SCOL[i], aim: clamp((a - sa) * 0.9, -1, 1) });
    }));
    /* GPS baklengs: stasjonene måler avstanden opp */
    SK.al(win(t, 19, 47, 1), () => ST.forEach((sa, i) => {
      const q = pol(RE + 30, sa), r = Math.hypot(sp[0] - q[0], sp[1] - q[1]), an = Math.atan2(sp[1] - q[1], sp[0] - q[0]);
      const p0 = es(t, 19.5 + i, 21 + i);
      SK.line(q[0], q[1], sp[0], sp[1], { w: 2.4, color: SCOL[i], prog: p0, seed: 40 + i });
      SK.crayon(SK.arcPts(q[0], q[1], r, an - 0.22, an + 0.22), { color: SCOL[i], w: 5, prog: es(t, 21 + i, 22 + i), seed: 44 + i });
    }));
    /* avvik mellom plan og virkelighet */
    SK.al(win(t, 26, 52, 1) * seg(dv, 6, 20), () => {
      SK.circle(pp[0], pp[1], 15, { w: 2, color: C.GREY, seed: 50 });
      const n = [Math.cos(a), Math.sin(a)], tx = [-n[1], n[0]];
      SK.text('planlagt', pp[0] - tx[0] * 96 - 50, pp[1] - tx[1] * 96 - n[1] * 14, { size: 32, color: C.GREY });
      SK.al(win(t, 28, 37), () => SK.text('avvik', (pp[0] + sp[0]) / 2 + tx[0] * 70 - 30, (pp[1] + sp[1]) / 2 + tx[1] * 70, { size: 40, color: C.RED, prog: seg(t, 28.2, 29.2) }));
    });
    /* ny efemeride sendes opp */
    SK.al(win(t, 37, 41.4, 0.4), () => {
      const q = pol(RE + 40, ST[1]), u = es(t, 37.3, 41), x = lerp(q[0], sp[0], u), y = lerp(q[1], sp[1], u);
      const en = [[x - 20, y - 13], [x + 20, y - 13], [x + 20, y + 13], [x - 20, y + 13]];
      SK.fill(en, C.PAPER, 1); SK.stroke(SK.polyPts(en, true), { w: 2.4, seed: 60 });
      SK.line(x - 20, y - 13, x, y + 2, { w: 1.8, seed: 61 }); SK.line(x + 20, y - 13, x, y + 2, { w: 1.8, seed: 62 });
      SK.text('ny efemeride', x + 32, y, { size: 36, color: C.GRN });
    });
    SK.al(win(t, 41, 52, 0.8), () => {
      SK.stroke(SK.arcPts(E[0], E[1], RO + 42, a - 0.7, a + 1.0), { w: 3, color: C.GRN, prog: es(t, 41, 43), seed: 63 });
      SK.al(win(t, 41.5, 47), () => SK.text('«jeg er HER»', sp[0] + 50, sp[1] - 40, { size: 40, color: C.GRN, prog: seg(t, 41.6, 42.8) }));
    });
    /* styreraketter */
    SK.al(win(t, 48, 53.5, 0.4), () => {
      const n = [Math.cos(a), Math.sin(a)];
      for (let k = -1; k <= 1; k++) {
        const b = [sp[0] + n[0] * 30 - n[1] * k * 12, sp[1] + n[1] * 30 + n[0] * k * 12], l = 20 + 10 * Math.sin(t * 20 + k);
        SK.line(b[0], b[1], b[0] + n[0] * l, b[1] + n[1] * l, { w: 3, color: C.YEL, seed: 70 + k + Math.floor(t * 10) });
      }
      SK.text('styreraketter', sp[0] + 60, sp[1] + 20, { size: 36, prog: seg(t, 48.3, 49.5) });
    });

    /* klokkene og Einstein */
    SK.al(win(t, 55.5, 84, 1), () => {
      const n = [Math.cos(a), Math.sin(a)];
      SK.clock(sp[0] + n[0] * 86, sp[1] + n[1] * 86, 40, t * 2.3, { color: C.RED, seed: 80 });
      SK.clock(E[0], E[1], 46, t * 2, { seed: 81 });
      SK.text('fart 3,9 km/s  →  klokka går 7 µs saktere per dag', 70, 92, { size: 42, color: C.RED, prog: seg(t, 64.3, 67.5) });
      SK.text('svakere tyngde  →  45 µs fortere per dag', 70, 146, { size: 42, color: C.BLUE, prog: seg(t, 68.5, 71.5) });
      SK.text('sum:  +38 µs per dag', 70, 200, { size: 42, prog: seg(t, 73.8, 75.5) });
      SK.line(66, 226, 330, 226, { w: 2.4, prog: es(t, 75.3, 76), seed: 82 });
      SK.text('38 µs × lysfarten ≈ 11 km feil – hvert døgn', 70, 262, { size: 42, color: C.RED, prog: seg(t, 76.5, 79.5) });
    });

    SK.sat(sp[0], sp[1], 0.6, { color: C.RED, rot: a + Math.PI / 2, seed: 0 });
    ctx.restore();
  }

  return {
    id: 'bane', dur: DUR, draw,
    chapters: [
      { t: 0, title: 'Hvordan vet satellitten hvor den er?' },
      { t: 19, title: 'Bakken passer på' },
      { t: 55, title: 'Atomklokker og Einstein' }
    ],
    caps: [
      [1, 9.5, 'Ingen å spørre', 'En satellitt har ingen GPS å spørre. Men den har en bane som følger fysikkens lover. Tyngdekraften og farten bestemmer hvor den er i morgen, og om en uke.'],
      [10, 18.5, '', 'Men «nesten» er ikke godt nok. Sola dytter med strålingen sin, månen drar, og jorda er litt klumpete. Satellitten glir sakte ut av den planlagte banen.'],
      [19, 27.5, 'GPS baklengs', 'Derfor følger bakkestasjoner rundt hele kloden med. De vet nøyaktig hvor de selv står, og måler avstanden opp. Nå er det satellitten som blir funnet.'],
      [28, 36.5, '', 'Avviket er lite, men det måles hele tiden. Kontrollsenteret regner ut en ny, nøyaktig banebeskrivelse: efemeriden.'],
      [37, 46, 'Fasit fra bakken', 'Den sendes opp til satellitten, som lagrer den og leser den opp for oss. Når satellitten roper «jeg er her», er det bakkens ferske fasit vi hører.'],
      [46.5, 54.5, '', 'Blir avviket for stort, får satellitten beskjed om å fyre små styreraketter og flytte seg tilbake på plass.'],
      [55, 63.5, 'Klokka om bord', 'Og så tiden. Om bord tikker atomklokker som bare feiler med et sekund på millioner av år. Likevel går de «feil» – naturen sørger for det.'],
      [64, 73, 'Einstein', 'Satellitten går fort, og da går tiden saktere. Men den er også høyt oppe, der tyngdekraften er svakere, og da går tiden fortere. Den andre effekten vinner. <a class="r" href="#ref">[1]</a>'],
      [73.5, 83.5, '', 'Uten korreksjon ville GPS bommet med rundt elleve kilometer etter ett døgn. Så klokkene stilles litt for sakte før oppskyting – og relativitetsteorien blir hverdagsteknikk. <a class="r" href="#ref">[1]</a>']
    ]
  };
})();
