/* storyB.js — fart (doppler), satellittens egen posisjon, ekko i byen, jamming/spoofing, avslutning */

/* ---------------- FART: dopplereffekten ---------------- */
Engine.register({
  id: 'fart', title: 'Fart: dopplereffekten', short: 'Fart', dur: 62, group: 'fart',
  narration: [
    { t: 0.5, text: 'Posisjon er halve historien. Bilen vet også hvor <b>fort</b> den kjører – og det kommer ikke fra å se hvordan posisjonen endrer seg, men fra <b>tonehøyden</b> i signalet.' },
    { t: 8, text: 'Du kjenner det fra en sirene som passerer: nærmer den seg, høres den lysere ut. Radiobølger gjør det samme. Det er <b>dopplereffekten</b>.' },
    { t: 16, text: 'Satellitten sender på en fast frekvens f₀. Når avstanden krymper, kommer bølgetoppene tettere; når den vokser, glisnere.<span class=f>f = f₀ · (1 − v_r / c)</span>' },
    { t: 24, text: 'v_r er den <b>radielle</b> farten – hvor fort avstanden endrer seg. Bare den delen av farten som peker langs siktelinjen teller.<span class=f>v_r = v · cos θ</span>' },
    { t: 31, text: 'Bilen stopper. Da er skiftet vi måler bare satellittens egen fart – og den er kjent på millimeteren fra banen. Alt som er til overs når vi kjører igjen, er bilen.' },
    { t: 44, text: 'Med fire satellitter i fire retninger får vi fire slike ligninger – nok til hele fartsvektoren, pluss hvor fort klokka vår driver. Slik vet bilen at den kjører 80 km/t, og hvilken vei.' },
    { t: 55, text: 'Posisjon fra tid. Fart fra tonehøyde. Begge fra det samme signalet.' }
  ],
  draw(ctx, rc, t) {
    const GY = 830;
    // bilens bevegelse (stopper 31–42)
    const moving = !(t > 31 && t < 42);
    const mt = t < 31 ? t : (t < 42 ? 31 : t - 11);
    const cx = 260 + 15 * mt, vcar = moving ? 15 : 0;
    // satellitt langs en bue
    const sp = tt => { const x = 250 + 17 * tt; return { x, y: 330 - 170 * Math.sin(Math.PI * (x - 150) / 1400) }; };
    const sat = sp(t), satN = sp(t + 0.05); const vs = { x: (satN.x - sat.x) / 0.05, y: (satN.y - sat.y) / 0.05 };
    // bakke og himmel
    S.line(rc, -20, GY, 1940, GY, { color: C.pencil, w: 2.6, seed: 1001 });
    for (let x = 60; x < 1900; x += 140) S.line(rc, x, GY + 14, x + 40, GY + 14, { color: C.faint, w: 1.4, seed: 1002 + x });
    // siktelinje og radiell fart
    const car = { x: cx, y: GY - 46 };
    const L = S.dist(sat, car); const u = { x: (car.x - sat.x) / L, y: (car.y - sat.y) / L };
    const rate = (vcar - vs.x) * u.x + (0 - vs.y) * u.y; // d(avstand)/dt i px/s (>0: øker)
    const ratio = S.clamp(rate / 30, -0.55, 0.55);
    // bølgetog langs siktelinjen: tettere når avstanden krymper
    const phase = -t * 9;
    S.waves(rc, ctx, sat.x, sat.y, car.x, car.y, 30 * (1 + ratio), phase, { color: C.blue, amp: 8, w: 2, alpha: 0.85 });
    S.line(rc, sat.x, sat.y, car.x, car.y, { color: C.blue, w: 1.2, seed: 1003, single: true });
    // satellitt + fartsvektor
    S.satellite(rc, ctx, sat.x, sat.y, { color: C.blue, size: 1.15, seed: 38, rot: Math.atan2(vs.y, vs.x) - 0.2 });
    S.arrow(rc, sat.x + 40, sat.y - 40, sat.x + 40 + vs.x * 5, sat.y - 40 + vs.y * 5, { color: C.blue, w: 2.6, seed: 1004 });
    S.text(ctx, 'v_sat ≈ 3,9 km/s', sat.x + 60, sat.y - 60, { color: C.blue, size: 26, halo: 5 });
    // sendt frekvens ved satellitten
    S.text(ctx, 'f₀', sat.x - 70, sat.y + 60, { color: C.blue, size: 32, halo: 5 });
    // bil + fartsvektor + vinkel θ
    S.carSide(rc, ctx, car.x, GY, { size: 1.15 });
    if (vcar > 0) { S.arrow(rc, car.x + 60, car.y - 10, car.x + 60 + vcar * 8, car.y - 10, { color: C.ink, w: 2.8, seed: 1005 }); S.text(ctx, 'v', car.x + 70 + vcar * 8, car.y - 20, { color: C.ink, size: 34, halo: 5 }); }
    else S.text(ctx, 'v = 0', car.x + 70, car.y - 20, { color: C.ink, size: 34, halo: 5 });
    if (t > 24 && t < 44) {
      const a = S.env(t, 24, 43, 0.7); ctx.save(); ctx.globalAlpha *= a;
      const aLOS = Math.atan2(sat.y - car.y, sat.x - car.x); // fra bilen mot satellitten
      S.arc(rc, car.x, car.y - 10, 80, Math.min(aLOS, 0), Math.max(aLOS, 0), { color: C.red, w: 2.4, seed: 1006 });
      S.text(ctx, 'θ', car.x + Math.cos(aLOS / 2) * 108, car.y - 10 + Math.sin(aLOS / 2) * 108, { color: C.red, size: 38, halo: 5 });
      S.line(rc, car.x, car.y - 10, car.x + 260, car.y - 10, { color: C.faint, w: 1.4, seed: 1007, single: true });
      ctx.restore();
    }
    // mottatt bølge ved bilen: liten «måler»
    const mx = 70, my = 560;
    S.note(rc, ctx, mx, my - 40, 420, [{ t: 'sendt  f₀', color: C.blue }, { t: ' ' }, { t: 'mottatt  f', color: C.red }, { t: ' ' }], { size: 26, lh: 34, rot: 0.01 });
    S.waves(rc, ctx, mx + 150, my + 8, mx + 400, my + 8, 30, phase, { color: C.blue, amp: 8, w: 2 });
    S.waves(rc, ctx, mx + 150, my + 76, mx + 400, my + 76, 30 * (1 + ratio), phase, { color: C.red, amp: 8, w: 2 });
    const shift = -ratio;
    S.text(ctx, `Δf / f₀ ≈ ${shift >= 0 ? '+' : '−'}${Math.abs(shift * 100).toFixed(0)} ‰`, mx + 20, my + 150, { color: C.red, size: 28, halo: 5 });
    S.text(ctx, shift > 0.05 ? 'avstanden krymper → høyere tone' : shift < -0.05 ? 'avstanden vokser → lavere tone' : 'nesten uendret', mx + 20, my + 186, { color: C.soft, size: 24, halo: 5 });
    // matte-lapper
    if (t > 17 && t < 31) S.note(rc, ctx, 70, 170, 430, [{ t: 'f = f₀ · (1 − v_r / c)', color: C.ink }, { t: 'v_r = (v_bil − v_sat) · û', color: C.ink }, { t: 'û = retning mot satellitten', color: C.soft, size: 24 }, { t: 'v_r = v · cos θ   (bilens del)', color: C.red }], { alpha: S.env(t, 17, 30, 0.7), size: 27, lh: 36 });
    if (t > 32 && t < 44) S.note(rc, ctx, 70, 170, 430, [{ t: 'bilen står: v = 0', color: C.ink }, { t: '→ målt skift = bare satellitten', color: C.ink }, { t: '   (kjent fra banen)', color: C.soft, size: 24 }, { t: 'kjører vi: resten er v · cos θ', color: C.red }], { alpha: S.env(t, 32, 43, 0.7), size: 27, lh: 36 });
    // fire satellitter → fartsvektor
    if (t > 45) {
      const a = S.env(t, 45, 61, 0.9); ctx.save(); ctx.globalAlpha *= a;
      const extra = [{ x: 120, y: 260, col: C.red, n: 1 }, { x: 700, y: 60, col: C.green, n: 3 }, { x: 1350, y: 420, col: C.purple, n: 4 }];
      extra.forEach((e, k) => {
        S.satellite(rc, ctx, e.x, e.y, { color: e.col, size: 0.95, seed: 31 + k * 7 });
        S.line(rc, e.x, e.y, car.x, car.y, { color: e.col, w: 1.6, seed: 1100 + k, single: true });
        const aL = Math.atan2(e.y - car.y, e.x - car.x);
        S.arc(rc, car.x, car.y - 10, 60 + k * 18, Math.min(aL, 0), Math.max(aL, 0), { color: e.col, w: 2, seed: 1110 + k });
        S.text(ctx, `θ${['₁', '₃', '₄'][k]}`, car.x + Math.cos(aL) * (120 + k * 30), car.y - 10 + Math.sin(aL) * (120 + k * 30), { color: e.col, size: 28, halo: 5 });
      });
      S.note(rc, ctx, 70, 170, 460, [{ t: 'fire målte v_r:', color: C.ink }, { t: 'v_r,i = v · ûᵢ + klokkedrift', color: C.ink }, { t: '4 ligninger → v_x, v_y, v_z, drift', color: C.red }, { t: '→ fart og retning, uten kart', color: C.soft, size: 24 }], { size: 27, lh: 36 });
      ctx.restore();
    }
  }
});

/* ---------------- BANE: hvordan satellitten vet hvor den er ---------------- */
Engine.register({
  id: 'bane', title: 'Hvordan satellitten vet hvor den selv er', short: 'Satellittens bane', dur: 68, group: 'bane',
  narration: [
    { t: 0.5, text: 'Alt dette forutsetter at satellitten vet hvor den <b>selv</b> er – på centimeteren. Hvordan?' },
    { t: 6, text: 'Bane er fysikk. 20 200 km oppe går satellitten i en nesten sirkelrund bane, to runder i døgnet – akkurat som <b>Kepler og Newton</b> sier. Den er forutsigbar lang tid i forveien.' },
    { t: 16, text: 'Men ikke perfekt. Jorda er ujevn, månen og sola drar, og sollyset dytter. Sakte glir satellitten litt vekk fra den beregnede banen.' },
    { t: 26, text: 'Derfor lytter <b>bakkestasjoner</b> rundt hele kloden. De kjenner sin egen posisjon nøyaktig og måler avstanden til satellittene – samme triks som bilen bruker, bare snudd på hodet.' },
    { t: 36, text: 'Kontrollsenteret regner ut hvor satellitten <b>egentlig</b> er, lager en ny baneformel – en <b>efemeride</b> – og laster den opp. Av og til fyrer satellitten en liten motor for å rette kursen.' },
    { t: 47, text: 'Satellitten sender efemeriden videre til deg, sammen med tiden. Tiden kommer fra <b>atomklokker</b> så presise at de mister ett sekund på hundre tusen år.' },
    { t: 56, text: 'Selv relativitetsteorien er regnet inn: klokkene går <b>38 mikrosekund</b> for fort per døgn der oppe. Uten den korreksjonen ville posisjonen din drevet over ti kilometer om dagen.' }
  ],
  draw(ctx, rc, t) {
    const E = { x: 640, y: 530, r: 250 }, OR = 400;
    // jorda
    S.circle(rc, E.x, E.y, E.r, { color: C.pencil, w: 3, fill: C.sky, gap: 14, fw: 1.2, seed: 1200, steps: 36 });
    S.ellipse(rc, E.x - 60, E.y - 40, 180, 120, { color: C.green, w: 1.5, fill: C.grass, gap: 7, fw: 1, seed: 1201 });
    S.ellipse(rc, E.x + 90, E.y + 80, 120, 150, { color: C.green, w: 1.5, fill: C.grass, gap: 7, fw: 1, seed: 1202 });
    S.text(ctx, 'Jorda', E.x - 34, E.y + 14, { color: C.ink, size: 34, halo: 6 });
    // beregnet bane
    S.circle(rc, E.x, E.y, OR, { color: C.soft, w: 1.8, rough: 0.7, seed: 1203, steps: 40 });
    S.text(ctx, 'beregnet bane (efemeride)', E.x + 340, E.y - OR + 90, { color: C.soft, size: 26, halo: 5, rot: -0.05 });
    // satellitt: vinkel og drift
    const ang = -2.9 + 0.05 * t;
    const drift = S.kf(t, [[14, 0], [32, 26], [44, 26], [46.5, 0]]);
    const sat = { x: E.x + Math.cos(ang) * (OR + drift), y: E.y + Math.sin(ang) * (OR + drift) };
    const nominal = { x: E.x + Math.cos(ang) * OR, y: E.y + Math.sin(ang) * OR };
    if (drift > 2) { S.line(rc, nominal.x, nominal.y, sat.x, sat.y, { color: C.red, w: 2.4, seed: 1204 }); S.marker(rc, ctx, nominal.x, nominal.y, 7, C.soft); S.text(ctx, 'avvik', sat.x + 26, sat.y + 48, { color: C.red, size: 28, halo: 5 }); }
    // bakkestasjoner
    const stations = [-2.2, -1.55, -0.85, -0.25, 0.7].map(a => ({ a, x: E.x + Math.cos(a) * E.r, y: E.y + Math.sin(a) * E.r }));
    const stOn = S.ramp(t, 26, 28);
    stations.forEach((s, i) => { ctx.save(); ctx.globalAlpha *= stOn; S.dish(rc, ctx, s.x, s.y, { size: 0.9, rot: s.a + Math.PI / 2, seed: 1300 + i }); ctx.restore(); });
    // måling: linjer fra stasjoner som «ser» satellitten
    if (t > 27 && t < 47) stations.forEach((s, i) => {
      const dx = sat.x - s.x, dy = sat.y - s.y; const nx = Math.cos(s.a), ny = Math.sin(s.a);
      if (dx * nx + dy * ny < 0.25 * Math.hypot(dx, dy)) return; // under horisonten
      const blink = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 3 + i * 1.7));
      ctx.save(); ctx.globalAlpha *= S.env(t, 27, 46, 0.6) * blink; S.line(rc, s.x, s.y, sat.x, sat.y, { color: C.green, w: 1.6, seed: 1310 + i, single: true }); ctx.restore();
    });
    // kontrollsenter (stjerne) og opplasting
    const cs = stations[2];
    if (t > 34) { ctx.save(); ctx.globalAlpha *= S.ramp(t, 34, 35); S.poly(rc, [[0, -22], [7, -7], [22, -7], [10, 3], [14, 19], [0, 10], [-14, 19], [-10, 3], [-22, -7], [-7, -7]].map(p => ({ x: cs.x + p[0] + Math.cos(cs.a) * 40, y: cs.y + p[1] + Math.sin(cs.a) * 40 })), { color: C.orange, w: 2, fill: C.orange, gap: 5, fw: 1, seed: 1320 }); S.text(ctx, 'kontrollsenter', cs.x + Math.cos(cs.a) * 40 + 30, cs.y + Math.sin(cs.a) * 40 + 8, { color: C.orange, size: 26, halo: 5 }); ctx.restore(); }
    if (t > 38 && t < 47) {
      const k = S.env(t, 38, 46, 0.6); ctx.save(); ctx.globalAlpha *= k;
      const p = S.ease(((t - 38) % 3) / 3); const px = S.lerp(cs.x, sat.x, p), py = S.lerp(cs.y, sat.y, p);
      S.arrow(rc, cs.x, cs.y, sat.x, sat.y, { color: C.orange, w: 2.6, seed: 1330 });
      S.note(rc, ctx, px - 90, py - 70, 200, ['ny efemeride', '+ klokkekorr.'], { size: 22, lh: 26, rot: 0.03, seed: 1331 });
      ctx.restore();
    }
    if (t > 44 && t < 47) { const k = S.env(t, 44, 46.5, 0.4); ctx.save(); ctx.globalAlpha *= k; S.text(ctx, 'pfft', sat.x + 40, sat.y - 40, { color: C.soft, size: 28, rot: 0.2 }); for (let i = 0; i < 4; i++) S.line(rc, sat.x + 28, sat.y - 20 - i * 6, sat.x + 54 + i * 8, sat.y - 26 - i * 10, { color: C.faint, w: 1.6, seed: 1340 + i, single: true }); ctx.restore(); }
    // satellitten
    S.satellite(rc, ctx, sat.x, sat.y, { color: C.blue, size: 1.2, seed: 38, rot: ang + Math.PI / 2 - 0.3 });
    // navigasjonsmelding ned til bilen på bakken
    const carA = -0.95, carP = { x: E.x + Math.cos(carA) * E.r, y: E.y + Math.sin(carA) * E.r };
    ctx.save(); ctx.translate(carP.x, carP.y); ctx.rotate(carA + Math.PI / 2); S.carSide(rc, ctx, 0, 0, { size: 0.8 }); ctx.restore();
    if (t > 48 && t < 56) {
      const k = S.env(t, 48, 55, 0.6); ctx.save(); ctx.globalAlpha *= k;
      const p = S.ease(((t - 48) % 2.6) / 2.6); const px = S.lerp(sat.x, carP.x, p), py = S.lerp(sat.y, carP.y, p);
      S.line(rc, sat.x, sat.y, carP.x, carP.y, { color: C.blue, w: 1.6, seed: 1350, single: true });
      S.note(rc, ctx, px - 110, py - 60, 240, ['«her er jeg,', 'og klokka er …»'], { size: 22, lh: 26, rot: -0.03, seed: 1351 });
      ctx.restore();
    }
    // atomklokke + relativitet
    if (t > 49) {
      const k = S.env(t, 49, 67, 0.8); ctx.save(); ctx.globalAlpha *= k;
      S.clock(rc, ctx, 1240, 300, 56, { hour: 10, min: 8 + (t % 60) });
      S.text(ctx, 'atomklokke', 1240, 390, { color: C.ink, size: 30, align: 'center', halo: 5 });
      S.text(ctx, '1 s feil på 100 000 år', 1240, 424, { color: C.soft, size: 24, align: 'center', halo: 5 });
      ctx.restore();
    }
    if (t > 57) S.note(rc, ctx, 70, 170, 470, [{ t: 'spesiell rel.: farten → −7 µs/døgn', color: C.ink }, { t: 'generell rel.: svakere tyngde → +45 µs/døgn', color: C.ink }, { t: 'netto +38 µs/døgn ≈ 11 km feil per døgn', color: C.red }, { t: '→ klokkene justeres før oppskyting', color: C.soft, size: 24 }], { alpha: S.env(t, 57, 67, 0.7), size: 26, lh: 36 });
    if (t > 7 && t < 16) S.note(rc, ctx, 70, 170, 430, [{ t: 'høyde ≈ 20 200 km', color: C.ink }, { t: 'omløpstid ≈ 11 t 58 min', color: C.ink }, { t: 'fart ≈ 3,9 km/s', color: C.ink }, { t: 'Keplers lover → banen er kjent', color: C.soft, size: 24 }], { alpha: S.env(t, 7, 15, 0.7), size: 27, lh: 36 });
    if (t > 17 && t < 26) S.note(rc, ctx, 70, 170, 430, [{ t: 'forstyrrelser:', color: C.ink }, { t: '• ujevn tyngdekraft', color: C.red }, { t: '• måne og sol', color: C.red }, { t: '• strålingstrykk fra sola', color: C.red }], { alpha: S.env(t, 17, 25, 0.7), size: 27, lh: 36 });
  }
});

/* ---------------- EKKO: flerveisfeil i byen ---------------- */
Engine.register({
  id: 'ekko', title: 'Ekko: spøkelsesposisjoner mellom glassbygg', short: 'Ekko i byen', dur: 60, group: 'ekko',
  narration: [
    { t: 0.5, text: 'Så langt har signalet gått i rett linje. I byen gjør det ikke alltid det.' },
    { t: 7, text: 'Vi kjører inn mellom høye hus. Bygget til høyre skygger for satellitten – den <b>direkte veien</b> er borte.' },
    { t: 19, text: 'Men glassfasaden på den andre siden <b>speiler</b> signalet. Det kommer likevel fram – bare via en omvei.' },
    { t: 27, text: 'Mottakeren måler tiden, og tiden er nå for lang. Den tror avstanden er lengre – og plasserer oss der den avstanden passer: en <b class=red>spøkelsesposisjon</b> et annet sted i gata.' },
    { t: 37, text: 'Dette er <b>flerveisfeil</b> – ekko. Prikken hopper når refleksjonene skifter. Du har sett det: kartet som plasserer deg i nabogata.' },
    { t: 46, text: 'Ut av kløfta kommer den direkte veien tilbake, og prikken faller til ro.' },
    { t: 52, text: 'Gode mottakere slår tilbake: ekkoet er svakere, kommer alltid litt etter, og passer ikke med de andre satellittene. Så vektes det ned – mens telefonen støtter seg på fart, kompass og kart.' }
  ],
  draw(ctx, rc, t) {
    const GY = 850, cx = 120 + 22 * t;
    const L = { x: 300, w: 260, y: 200 }, R = { x: 1150, w: 150, y: 250 };
    const S2 = { x: 1380, y: 70 }, S3 = { x: 850, y: 40 };
    const car = { x: cx, y: GY - 46 };
    // bakke, bygg
    S.line(rc, -20, GY, 1940, GY, { color: C.pencil, w: 2.6, seed: 1401 });
    S.building(rc, ctx, L.x, L.y, L.w, GY - L.y, { color: C.blue, label: 'glass', seed: 1402 });
    S.building(rc, ctx, R.x, R.y, R.w, GY - R.y, { color: C.soft, seed: 1403 });
    S.text(ctx, 'glassfasade', L.x + L.w + 12, L.y + 40, { color: C.blue, size: 26, rot: Math.PI / 2, halo: 5 });
    // satellitter
    S.satellite(rc, ctx, S2.x, S2.y, { color: C.blue, size: 1.1, seed: 38, label: 'S₂' });
    S.satellite(rc, ctx, S3.x, S3.y, { color: C.green, size: 1.0, seed: 45, label: 'S₃' });
    // direkte vei fra S2: blokkert av R når linjen krysser bygget
    const yAtR = S2.y + (car.y - S2.y) * (R.x + R.w - S2.x) / (car.x - S2.x); // ved høyre kant av R
    const yAtRl = S2.y + (car.y - S2.y) * (R.x - S2.x) / (car.x - S2.x);
    const blocked = car.x < R.x && (yAtR > R.y || yAtRl > R.y);
    // S3 (nesten rett opp) går alltid klar
    S.line(rc, S3.x, S3.y, car.x, car.y, { color: C.green, w: 1.8, seed: 1404, single: true });
    let ghostX = null, extra = 0;
    if (!blocked) S.line(rc, S2.x, S2.y, car.x, car.y, { color: C.blue, w: 2.4, seed: 1405 });
    else {
      // tegn den blokkerte linjen svakt fram til bygget, kryss der den treffer
      let hitX = R.x + R.w, hitY = Math.min(yAtR, GY);
      if (yAtR < R.y) { hitY = R.y; hitX = S2.x + (car.x - S2.x) * (R.y - S2.y) / (car.y - S2.y); }
      ctx.save(); ctx.globalAlpha *= 0.35; S.line(rc, S2.x, S2.y, hitX, hitY, { color: C.blue, w: 2, seed: 1405, single: true }); ctx.restore();
      S.line(rc, hitX - 16, hitY - 16, hitX + 16, hitY + 16, { color: C.red, w: 4, seed: 1406 }); S.line(rc, hitX - 16, hitY + 16, hitX + 16, hitY - 16, { color: C.red, w: 4, seed: 1407 });
      // refleksjon i L sin fasade (x = L.x + L.w)
      const fx = L.x + L.w; const mirror = { x: 2 * fx - car.x, y: car.y };
      const fy = S2.y + (mirror.y - S2.y) * (fx - S2.x) / (mirror.x - S2.x);
      if (fy > L.y && fy < GY) {
        S.line(rc, S2.x, S2.y, fx, fy, { color: C.orange, w: 2.6, seed: 1408 }); S.line(rc, fx, fy, car.x, car.y, { color: C.orange, w: 2.6, seed: 1409 });
        S.marker(rc, ctx, fx, fy, 9, C.orange);
        // like vinkler
        const a1 = Math.atan2(S2.y - fy, S2.x - fx), a2 = Math.atan2(car.y - fy, car.x - fx);
        S.arc(rc, fx, fy, 40, Math.min(a1, 0), Math.max(a1, 0), { color: C.orange, w: 1.8, seed: 1410 }); S.arc(rc, fx, fy, 40, Math.min(a2, 0), Math.max(a2, 0), { color: C.orange, w: 1.8, seed: 1411 });
        const direct = S.dist(S2, car), refl = S.dist(S2, { x: fx, y: fy }) + S.dist({ x: fx, y: fy }, car);
        // litt «hopping»: refleksjonene skifter
        const jitter = 1 + 0.18 * Math.sin(t * 5.3) * Math.sin(t * 2.1 + 1) + 0.08 * Math.sin(t * 13.7);
        extra = (refl - direct) * jitter;
        const rp = direct + extra * 0.45; const dy = S2.y - car.y; const gx = Math.max(L.x + L.w + 70, S2.x - Math.sqrt(Math.max(0, rp * rp - dy * dy)));
        ghostX = gx;
        // spøkelsesbil
        S.carSide(rc, ctx, gx, GY, { size: 1.15, alpha: 0.45, color: C.red, fill: '#fbe4dd' });
        S.text(ctx, 'spøkelsesposisjon', gx - 90, GY - 92, { color: C.red, size: 30, halo: 6, rot: -0.05 });
        S.arrow(rc, car.x - 60, GY + 22, gx + 50, GY + 22, { color: C.red, w: 2.2, seed: 1412 });
        S.text(ctx, 'for lang måling → for langt unna S₂', (car.x + gx) / 2, GY + 56, { color: C.red, size: 26, align: 'center', halo: 6 });
      }
    }
    S.carSide(rc, ctx, car.x, GY, { size: 1.15 });
    // signalkvalitet
    const q2 = blocked ? (ghostX !== null ? 0.35 : 0) : 1;
    const bars = (x, y, q, col, label) => { S.text(ctx, label, x, y + 8, { color: col, size: 26, halo: 5 }); for (let i = 0; i < 5; i++) { const on = q > (i + 0.5) / 5; S.rect(rc, x + 50 + i * 20, y - 8 - i * 4, 12, 14 + i * 4, { color: col, w: 1.4, fill: on ? col : undefined, fillStyle: 'solid', seed: 1420 + i }); } };
    bars(70, 190, q2, C.blue, 'S₂'); bars(70, 240, 1, C.green, 'S₃');
    S.text(ctx, blocked ? (ghostX !== null ? 'S₂: bare ekko – svakt og for sent' : 'S₂: mistet') : 'S₂: direkte signal', 70, 292, { color: blocked ? C.red : C.soft, size: 24, halo: 5 });
    if (t > 28 && t < 46) S.note(rc, ctx, 70, 330, 430, [{ t: 'ekko = lengre vei', color: C.ink }, { t: '→ tiden for lang', color: C.ink }, { t: '→ avstanden for lang', color: C.ink }, { t: `→ posisjonen flyttes ${extra > 0 ? Math.round(extra) : '…'} «meter»`, color: C.red }], { alpha: S.env(t, 28, 45, 0.7), size: 27, lh: 36 });
    if (t > 52) S.note(rc, ctx, 70, 330, 450, [{ t: 'avsløres fordi ekkoet:', color: C.ink }, { t: '• er svakere', color: C.green }, { t: '• alltid kommer etter', color: C.green }, { t: '• ikke passer med S₁, S₃, S₄', color: C.green }], { alpha: S.env(t, 52, 59, 0.7), size: 27, lh: 36 });
  }
});

/* ---------------- STØY: jamming og spoofing ---------------- */
Engine.register({
  id: 'stoy', title: 'Jamming og spoofing', short: 'Jamming', dur: 52, group: 'stoy',
  narration: [
    { t: 0.5, text: 'GPS-signalet er utrolig svakt når det når bakken – svakere enn støyen i mottakeren selv. Det virker bare fordi mottakeren vet nøyaktig hvilket <b>mønster</b> den leter etter.' },
    { t: 9, text: 'Det gjør det også lett å <b>jamme</b>: en liten sender som bråker på samme frekvens drukner signalet i mils omkrets. Sirklene løser seg opp – ingen posisjon.' },
    { t: 20, text: 'Mottakeren merker det – styrken faller, mønsteret forsvinner – og sier fra: <i>«GPS-signal mistet»</i>. Bilen klarer seg en stund på hjulsensorer og kompass.' },
    { t: 30, text: 'Verre er <b>spoofing</b>: en sender som etterligner satellittene, med falske tider. Sirklene flytter seg – alle på én gang, helt konsistent – og prikken glir rolig av veien.' },
    { t: 41, text: 'Forsvar: flere frekvenser, retningsantenner, signerte signaler i nye systemer – og sunn fornuft. En bil som plutselig kjører gjennom en åker i 200 km/t, lyver noen om.' }
  ],
  draw(ctx, rc, t) {
    const roadY = World2D.roadY, SATS = World2D.SATS;
    const cx = 200 + 22 * t; const car = { x: cx, y: roadY(cx), ang: World2D.roadAng(cx) };
    const J = { x: 1130, y: 240 }, F = { x: 260, y: 300 };
    const jamOn = S.ramp(t, 8, 9.5) * (1 - S.ramp(t, 28, 30));
    const dJ = S.dist(J, car); const q = S.clamp(1 - jamOn * S.clamp((900 - dJ) / 500, 0, 1) * 1.3, 0, 1); // signalkvalitet
    const spoof = S.ramp(t, 32, 44) * (1 - S.ramp(t, 47, 50)); const off = { x: -150 * spoof, y: -190 * spoof };
    S.road(rc, ctx, roadY, -40, 1960);
    // sirkler (svake) rundt satellittene – gjennom den «antatte» posisjonen
    const est = { x: car.x + off.x, y: car.y + off.y };
    ctx.save(); ctx.globalAlpha *= 0.55 * q;
    SATS.forEach((s, i) => { const r = S.dist(s, est); S.disc(ctx, s.x, s.y, r, s.col, 0.08); S.circle(rc, s.x, s.y, r, { color: s.col, w: 2.2, rough: 1 + (1 - q) * 6, seed: 100 + i + (q < 0.7 ? Math.floor(t * 8) : 0) }); });
    ctx.restore();
    SATS.forEach((s, i) => S.satellite(rc, ctx, s.x, s.y, { color: s.col, size: 1.1, seed: 31 + i * 7, label: s.name, rot: -0.35 + i * 0.2 }));
    // jammer
    if (t > 7) {
      ctx.save(); ctx.globalAlpha *= S.ramp(t, 7, 8);
      S.tower(rc, ctx, J.x, J.y, { color: C.red }); S.text(ctx, 'støysender', J.x + 30, J.y - 60, { color: C.red, size: 28, halo: 5 });
      for (let k = 0; k < 4; k++) { const r = ((t * 140 + k * 110) % 440); ctx.globalAlpha = S.clamp(1 - r / 440, 0, 1) * 0.6 * jamOn; S.circle(rc, J.x, J.y - 60, r, { color: C.red, w: 2, rough: 3.5, seed: 1500 + k + Math.floor(t * 6), single: true }); }
      ctx.restore();
    }
    // spoofer
    if (t > 31) {
      ctx.save(); ctx.globalAlpha *= S.ramp(t, 31, 32);
      S.tower(rc, ctx, F.x, F.y, { color: C.orange }); S.text(ctx, 'falsk «satellitt»', F.x + 30, F.y - 60, { color: C.orange, size: 28, halo: 5 });
      for (let k = 0; k < 3; k++) { const r = ((t * 120 + k * 150) % 460); ctx.globalAlpha = S.clamp(1 - r / 460, 0, 1) * 0.5 * spoof; S.circle(rc, F.x, F.y - 60, r, { color: C.orange, w: 1.8, rough: 0.8, seed: 1520 + k, single: true }); }
      ctx.restore();
    }
    // bilen og antatt posisjon
    S.carTop(rc, ctx, car.x, car.y, car.ang, { seed: 37 });
    if (q > 0.35) {
      ctx.save(); ctx.globalAlpha *= S.ramp(q, 0.35, 0.7);
      S.marker(rc, ctx, est.x, est.y, 20, C.orange, { w: 3.2 });
      if (spoof > 0.05) { S.carTop(rc, ctx, est.x, est.y, car.ang, { seed: 37, alpha: 0.45, color: C.red, fill: '#fbe4dd' }); S.text(ctx, 'der bilen tror den er', est.x + 34, est.y - 30, { color: C.red, size: 28, halo: 6 }); }
      ctx.restore();
    } else {
      const u = (1 - q) * 120 + 20; S.circle(rc, car.x, car.y, u + Math.sin(t * 4) * 6, { color: C.red, w: 2.6, rough: 3, seed: 1530 + Math.floor(t * 5), single: true });
      S.text(ctx, '?', car.x - 12, car.y - u - 16, { color: C.red, size: 48, halo: 6 });
      S.text(ctx, 'GPS-signal mistet', car.x - 110, car.y + u + 48, { color: C.red, size: 30, halo: 6 });
    }
    // signalkvalitet
    S.text(ctx, 'signal / støy', 70, 190, { color: C.ink, size: 28, halo: 5 });
    SATS.forEach((s, i) => { const qq = Math.max(q, spoof > 0.3 ? 1 : 0); for (let k = 0; k < 6; k++) { const on = qq > (k + 0.5) / 6; S.rect(rc, 70 + k * 18, 210 + i * 34, 12, 20, { color: s.col, w: 1.3, fill: on ? s.col : undefined, fillStyle: 'solid', seed: 1540 + k }); } S.text(ctx, s.name, 190, 228 + i * 34, { color: s.col, size: 24, halo: 5 }); });
    if (spoof > 0.3) S.text(ctx, 'sterkt … for sterkt?', 70, 372, { color: C.orange, size: 24, halo: 5 });
    if (t > 42) S.note(rc, ctx, 70, 400, 440, [{ t: 'forsvar:', color: C.ink }, { t: '• flere frekvenser (L1, L5)', color: C.green }, { t: '• retningsantenner', color: C.green }, { t: '• signerte signaler (Galileo OSNMA)', color: C.green }, { t: '• rimelighetssjekk mot fart og kart', color: C.green }], { alpha: S.env(t, 42, 51, 0.7), size: 26, lh: 34 });
  }
});

/* ---------------- AVSLUTNING ---------------- */
Engine.register({
  id: 'slutt', title: 'Oppsummering og slutt', short: 'Slutt', dur: 32, group: 'slutt', dimTitle: true,
  narration: [
    { t: 0.5, text: 'Så neste gang prikken på kartet finner deg: den kom fra fire klokker i rommet, litt geometri – og en mottaker som er flinkere til å måle tid enn noe annet du eier.' },
    { t: 10, text: 'Kilde og mer av matematikken: artikkelen fra Universitetet i Oslo, nederst til høyre.', d: 7.5 }
  ],
  draw(ctx, rc, t) {
    const k = S.easeOut(S.ramp(t, 0.2, 2));
    const ex = 700, ey = 1180, er = 620;
    // stjerner som tennes mot slutten
    const stars = S.ramp(t, 16, 24);
    if (stars > 0) for (let i = 0; i < 46; i++) {
      const sx = ((i * 733) % 1900) + 10, sy = ((i * 271) % 520) + 20; if (Math.hypot(sx - ex, sy - ey) < er + 30) continue;
      const on = S.clamp((stars * 46 - i) / 6, 0, 1) * (0.55 + 0.45 * Math.sin(t * 2.3 + i));
      if (on <= 0) continue; ctx.save(); ctx.globalAlpha = on;
      S.line(rc, sx - 7, sy, sx + 7, sy, { color: C.orange, w: 1.6, seed: 2000 + i, single: true }); S.line(rc, sx, sy - 7, sx, sy + 7, { color: C.orange, w: 1.6, seed: 2001 + i, single: true });
      ctx.restore();
    }
    // jordklode
    ctx.save(); ctx.globalAlpha = k;
    S.circle(rc, ex, ey, er, { color: C.pencil, w: 3, fill: C.sky, gap: 16, fw: 1.2, seed: 900, steps: 40 });
    ctx.restore();
    // satellittene fortsetter i bane, med svake signaler ned til bilen
    const carA = -Math.PI / 2 + S.ease(S.ramp(t, 16, 28)) * 1.05;
    const carP = { x: ex + Math.cos(carA) * (er + 2), y: ey + Math.sin(carA) * (er + 2) };
    for (let i = 0; i < 4; i++) {
      const a = -2.5 + i * 0.62 + t * 0.045, R = er + 300; const x = ex + Math.cos(a) * R, y = ey + Math.sin(a) * R; if (y > 900) continue;
      ctx.save(); ctx.globalAlpha = k; S.satellite(rc, ctx, x, y, { color: S.SATCOL[i], size: 1.1, seed: 31 + i * 7, rot: a + Math.PI / 2 - 0.3 });
      ctx.globalAlpha *= 0.4 * (1 - S.ramp(t, 18, 22)); if (ctx.globalAlpha > 0.01) S.line(rc, x, y, carP.x, carP.y - 40, { color: S.SATCOL[i], w: 1.8, seed: 910 + i, single: true }); ctx.restore();
    }
    // bilen kjører videre rundt kloden
    ctx.save(); ctx.globalAlpha = k; ctx.translate(carP.x, carP.y); ctx.rotate(carA + Math.PI / 2); S.carSide(rc, ctx, 0, 0, { size: 1.2 }); ctx.restore();
    // oppsummeringslapp
    const na = S.env(t, 1, 15.5, 1.1);
    if (na > 0.01) S.note(rc, ctx, 70, 170, 520, [
      { t: 'satellittene måler ikke – de er klokker', color: C.red },
      { t: 'tid  →  avstand  →  sirkler og kuler', color: C.ink },
      { t: '4 satellitter  →  x, y, z og tid', color: C.ink },
      { t: 'doppler  →  fart og retning', color: C.ink },
      { t: 'bakkestasjoner  →  satellittens bane', color: C.ink },
      { t: 'ekko og støy  →  feil vi kan avsløre', color: C.red }
    ], { alpha: na, size: 28, lh: 40 });
    // «Slutt.» skrives med hånd, bokstav for bokstav
    const w = S.ease(S.ramp(t, 18, 22.5));
    if (w > 0) {
      const cx = 760, cy = 430;
      ctx.save(); ctx.font = '700 230px Caveat, cursive'; const tw = ctx.measureText('Slutt.').width; ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(cx - tw / 2 - 20, cy - 220, (tw + 60) * w, 300); ctx.clip();
      S.text(ctx, 'Slutt.', cx, cy, { size: 230, weight: 700, align: 'center', color: C.pencil, rot: -0.03 });
      ctx.restore();
      const ul = S.ease(S.ramp(t, 22.3, 23.8));
      if (ul > 0) S.line(rc, cx - tw / 2 + 10, cy + 42, cx - tw / 2 + 10 + (tw - 20) * ul, cy + 52, { color: C.red, w: 5, rough: 1.6, seed: 2100 });
      const te = S.ease(S.ramp(t, 24, 25.5));
      if (te > 0) S.text(ctx, '– the end –', cx, cy + 120, { size: 44, weight: 400, align: 'center', color: C.soft, alpha: te, rot: 0.02 });
      const tk = S.ease(S.ramp(t, 26, 27.5));
      if (tk > 0) S.text(ctx, 'takk for turen', cx + 300, cy - 150, { size: 40, weight: 600, align: 'center', color: C.orange, alpha: tk, rot: -0.14 });
    }
  }
});
