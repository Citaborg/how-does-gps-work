/**
 * Hvordan virker GPS? — Interactive Visual Story (Agy-Argon4)
 * Hand-drawn pencil & crayon 2D sketch engine + WebGL 3D volumetric raymarched sphere intersection engine.
 */

(() => {
  'use strict';

  // ============================================================================
  // 1. CHAPTER STORY DEFINITION (12 Continuous Chapters)
  // ============================================================================
  const CHAPTERS = [
    {
      id: 1,
      duration: 16,
      badge: 'Kapittel 1 · 2D-prinsippet (1 satellitt)',
      tag: '2D Trilaterasjon',
      title: 'Én satellitt: En sirkel av muligheter',
      hint: 'Bilen kjører langs veien og stopper akkurat der den er for å måle reisetiden Δt₁',
      body: `
        <p>En GPS-mottaker i bilen <strong>sender aldri ut signaler</strong> — den bare lytter tålmodig.</p>
        <p><span class="crayon-pill pill-red">Satellitt 1</span> sender ut hva klokken var da signalet forlot satellitten (<em>t<sub>send</sub></em>) og hvor satellitten befant seg.</p>
        <p>Når bilen stopper og regner ut reisetiden <strong>Δt₁</strong> multiplisert med lysets hastighet <strong>c</strong>, vet vi avstanden <strong>d₁</strong>. I 2D betyr det at bilen kan være <em>hvor som helst</em> på den røde fargestift-sirkelen.</p>
      `,
      mathNote: 'Avstand: d₁ = c · (t_mottatt − t_sendt)   →   (x − x₁)² + (y − y₁)² = r₁²'
    },
    {
      id: 2,
      duration: 16,
      badge: 'Kapittel 2 · 2D-prinsippet (2 satellitter)',
      tag: '2D Skjæringspunkter',
      title: 'To satellitter: Sirkelen krympes til to punkter',
      hint: 'Satellitt 2 glir inn i banen — fargene blandes og avslører to skjæringspunkter',
      body: `
        <p>Nå animeres <span class="crayon-pill pill-blue">Satellitt 2</span> inn på himmelen. Bilen kjører et stykke videre og stopper på nytt for å måle avstand til <em>begge</em> satellittene samtidig.</p>
        <p>Der den røde og den blå sirkelen krysser hverandre, oppstår <strong>to mulige posisjoner</strong>: <span class="crayon-pill pill-amber">P<sub>A</sub></span> og <span class="crayon-pill pill-amber">P<sub>B</sub></span>.</p>
        <p>Legg merke til geometrien: linjen mellom satellittene og linjen mellom skjæringspunktene står vinkelrett på hverandre og danner to speilsymmetriske trekanter.</p>
      `,
      mathNote: 'To sirkler i planet krysser i maks 2 punkter: S₁ ∩ S₂ = { P_A , P_B }'
    },
    {
      id: 3,
      duration: 18,
      badge: 'Kapittel 3 · 2D-prinsippet (3 satellitter & feiltrekant)',
      tag: 'Klokkefeil & Feiltrekant',
      title: 'Tre satellitter: Hvorfor treffer de ikke i ett punkt?',
      hint: 'Med en billig kvartsklokke i bilen oppstår en synlig «feiltrekant» mellom de tre sirklene',
      body: `
        <p><span class="crayon-pill pill-green">Satellitt 3</span> svever inn. I en perfekt verden ville alle tre sirklene møttes i <em>nøyaktig ett punkt</em>.</p>
        <p>Men bilens klokke er ikke en atomklokke! Selv en bitteliten tidsfeil <strong>Δt<sub>feil</sub></strong> legger til en lik feil <strong>Δr = c · Δt<sub>feil</sub></strong> på alle tre målte avstander (<em>pseudoranges</em>).</p>
        <p>Derfor spriker skjæringene og danner en tydelig <strong>feiltrekant</strong> midt på kartet, med trekantgeometri tegnet opp mot alle tre satellittene samtidig.</p>
      `,
      mathNote: 'Pseudorange: Rᵢ = dᵢ + c · Δt_klokke   →   Gir en «feiltrekant» av usikkerhet'
    },
    {
      id: 4,
      duration: 16,
      badge: 'Kapittel 4 · 2D-prinsippet (4 satellitter)',
      tag: 'Klokkekorreksjon',
      title: 'Den fjerde satellitten løser klokkemysteriet',
      hint: 'Satellitt 4 tvinger ligningssystemet til å krympe feiltrekanten til ett eksakt punkt',
      body: `
        <p>Når <span class="crayon-pill pill-amber">Satellitt 4</span> kommer inn, får mottakeren en fjerde uavhengig måling.</p>
        <p>Det finnes kun <strong>én</strong> verdi for klokkefeilen <strong>Δt<sub>klokke</sub></strong> som får alle fire sirklene til å krympe inn og møtes i nøyaktig <strong>ett felles skjæringspunkt</strong>!</p>
        <p>Samtidig som bilen finner sin eksakte posisjon, har telefonen eller bil-GPS-en plutselig fått sin egen klokke synkronisert med atomklokkepresisjon.</p>
      `,
      mathNote: 'Løser for Δt_klokke slik at feiltrekanten kollapser → Eksakt posisjon + eksakt tid!'
    },
    {
      id: 5,
      duration: 16,
      badge: 'Kapittel 5 · Overgang til 3D (1 satellitt)',
      tag: '3D Rom-sfære',
      title: 'Ut i 3D-rommet: Én satellitt gir et kuleskall',
      hint: 'Vi løfter blikket fra det flate arket til 3D-rommet med volumetriske kuler (raymarching)',
      body: `
        <p>I virkeligheten kjører vi ikke på et flatt papirark — satellittene kretser i tre dimensjoner.</p>
        <p>Med en kjent avstand <strong>r₁</strong> til <span class="crayon-pill pill-red">Satellitt 1</span> befinner du deg et sted på overflaten av en enorm, gjennomsiktig <strong>sfære (kuleskall)</strong> i rommet.</p>
        <p>Sirkelen fra 2D har blitt til en hel kuleflate med uendelig mange mulige punkter i <em>(x, y, z)</em>.</p>
      `,
      mathNote: 'Sfære i 3D: (x − x₁)² + (y − y₁)² + (z − z₁)² = r₁²'
    },
    {
      id: 6,
      duration: 16,
      badge: 'Kapittel 6 · 3D-rommet (2 satellitter)',
      tag: '3D Skjæringssirkel',
      title: 'To kuler som møtes: En lysende skjæringssirkel',
      hint: 'Se hvordan den røde og blå sfæren smelter sammen i en glødende sirkel i 3D',
      body: `
        <p><span class="crayon-pill pill-blue">Satellitt 2</span> glir på plass i 3D-rommet med sin blå sfære.</p>
        <p>Når to kuleskall skjærer hverandre i tre dimensjoner, er skjæringen ikke to punkter — men en <strong>hel sirkel i rommet</strong>!</p>
        <p>Vi fremhever akkurat skjæringsranden der det røde og blå kuleskallet møtes og blander farge til en skarp, lysende ring.</p>
      `,
      mathNote: 'To kuleflater i ℝ³ skjærer hverandre i en 3D-sirkel: S₁ ∩ S₂ = Sirkel C₁₂'
    },
    {
      id: 7,
      duration: 17,
      badge: 'Kapittel 7 · 3D-rommet (3 satellitter & spøkelsespunkt)',
      tag: 'Forkaste rom-punktet',
      title: 'Tre kuler: To punkter — og ett vi enkelt forkaster!',
      hint: 'Den grønne sfæren kutter skjæringssirkelen i to punkter: ett på bakken og ett langt ute i rommet',
      body: `
        <p>Når <span class="crayon-pill pill-green">Satellitt 3</span> svever inn, skjærer den grønne sfæren gjennom sirkelen fra de to første kulene.</p>
        <p>En kule som krysser en sirkel treffer i <strong>nøyaktig to punkter</strong>! Når vi nå legger inn et utsnitt av jordoverflaten med bilen vår, ser vi noe fascinerende:</p>
        <p>Det ene punktet ligger pent på jordoverflaten ved bilen, mens tvillingpunktet svever <strong>flere tusen kilometer ute i verdensrommet</strong> — det kan mottakeren umiddelbart forkaste!</p>
      `,
      mathNote: 'S₁ ∩ S₂ ∩ S₃ = { P_jord , P_rom }   →   P_rom forkastes fordi r_punkt ≫ R_jord'
    },
    {
      id: 8,
      duration: 16,
      badge: 'Kapittel 8 · 3D-rommet (4 satellitter)',
      tag: '4 Ukjente: x, y, z, Δt',
      title: 'Fire kuler i 3D: Bredde, lengde, høyde og klokketid',
      hint: 'Den fjerde (gylne) sfæren låser fast alle 4 ukjente (x, y, z og klokkefeil Δt)',
      body: `
        <p><span class="crayon-pill pill-amber">Satellitt 4</span> fullfører 3D-puslespillet. I tre dimensjoner har vi <strong>fire ukjente</strong>: posisjonen <em>(x, y, z)</em> samt klokkefeilen <em>Δt</em> i mottakeren.</p>
        <p>Alle fire kuleskallene møtes nå i ett intenst lysende punkt rett over bilens tak på jordutsnittet.</p>
        <p>Dermed vet bilen sin nøyaktige breddegrad, lengdegrad, høyde over havet — og nøyaktig tid ned på nanosekundet.</p>
      `,
      mathNote: '4 ligninger med 4 ukjente (x, y, z, Δt): √((x−xᵢ)²+(y−yᵢ)²+(z−zᵢ)²) + c·Δt = Rᵢ'
    },
    {
      id: 9,
      duration: 18,
      badge: 'Kapittel 9 · Satellittens egen posisjon & Relativitet',
      tag: 'Kepler, Efemerider & UiO',
      title: 'Hvordan vet satellitten hvor den selv er?',
      hint: 'Kontrollstasjoner på bakken måler baneavvik med radar og laster opp nye efemeride-data',
      body: `
        <p>For at satellitten skal være et referansepunkt, må den vite sin egen posisjon 20 200 km over jorden:</p>
        <p><strong>1. Keplers lover &amp; Bakkekontroll:</strong> Banen er nesten sirkulær (<em>v ≈ 3,87 km/s</em>), men ujevn tyngdekraft og solstormer gir små avvik. Kontrollstasjoner på jorden måler avviket med radar og sender opp oppdaterte banedata (<strong>efemerider</strong>).</p>
        <p><strong>2. Atomklokker &amp; Einsteins relativitet (UiO):</strong> Ifølge <em>spesiell relativitet</em> går satellittklokken <strong>7 µs saktere</strong> per døgn pga. farten, men ifølge <em>generell relativitet</em> går den <strong>45 µs raskere</strong> pga. svakere tyngdefelt. Netto <strong>+38 µs/døgn</strong> (11,4 km feil per dag hvis vi ikke korrigerer!).</p>
      `,
      mathNote: 'UiO AST2000: Δt_SR = −7 µs/døgn, Δt_GR = +45 µs/døgn  →  Netto +38 µs/døgn korrigeres!'
    },
    {
      id: 10,
      duration: 17,
      badge: 'Kapittel 10 · Nøyaktig fart med Doppler-effekten',
      tag: 'Hastighetsvektor & Doppler',
      title: 'Hvordan måler GPS bilens eksakte fart?',
      hint: 'Vi tegner bølgetopper, vinkler θᵢ og projeksjonen av bilens fart langs siktlinjene',
      body: `
        <p>GPS finner ikke fart bare ved å ta «posisjon nå minus posisjon i sted» — det ville gitt hoppende fartsmåling. I stedet brukes <strong>Doppler-skiftet</strong> på bærebølgen (<em>f₀ = 1575,42 MHz</em>)!</p>
        <p>Når bilen kjører <em>mot</em> en satellitt, presses radiobølgene sammen (høyere frekvens <strong>+Δf</strong>). Kjører den <em>fra</em> en satellitt, strekkes bølgene ut (lavere frekvens <strong>−Δf</strong>).</p>
        <p>Ved å kombinere radielle hastigheter <strong>v<sub>r,i</sub> = v · cos(θᵢ)</strong> fra flere satellitter, regner bilen ut sin eksakte hastighetsvektor <strong>v⃗</strong> øyeblikkelig.</p>
      `,
      mathNote: 'Doppler: Δfᵢ = −(v_rel,i / c) · f₀   der   v_rel,i = (v⃗_bil − v⃗_sat,i) · êᵢ = v · cos(θᵢ)'
    },
    {
      id: 11,
      duration: 17,
      badge: 'Kapittel 11 · Ekko & Spøkelsesposisjoner (Multipath)',
      tag: 'Glassbygg & Refleksjon',
      title: 'Bykjøring: Når glassfasader skaper spøkelsesbiler',
      hint: 'Bilen kjører forbi en høy glassbygning — reflekterte signaler lurer sirkelen til en spøkelsesposisjon',
      body: `
        <p>Nå kjører bilen inn i en bygata med høye, glatte <strong>glassbygninger</strong>.</p>
        <p>Direktesignalet (grønt) blokkeres eller blandes med et <strong>ekko-signal (rødt)</strong> som spretter i glassfasaden før det når bilantennen.</p>
        <p>Fordi omveien via glassveggen er lengre (<strong>d<sub>ekko</sub> &gt; d<sub>direkte</sub></strong>), tror GPS-mottakeren at satellitten er lenger unna. Sirkelen utvides med <strong>Δd</strong>, og skjæringspunktet hopper over i en <strong>spøkelsesposisjon</strong> i nabogata!</p>
      `,
      mathNote: 'Omvei: d_ekko = d₁ + d₂ > d_direkte  →  Falsk radius r_falsk = r + Δd gir «spøkelsesbil»'
    },
    {
      id: 12,
      duration: 15,
      badge: 'Kapittel 12 · Sårbarhet & GPS-jamming',
      tag: 'Signalstyrke & Støysender',
      title: 'Hvordan GPS-systemet kan jammes ut',
      hint: 'Satellittsignalet er ekstremt svakt etter 20 200 km — en lokal støysender overdøver sirklene',
      body: `
        <p>Et GPS-signal som har reist 20 200 km gjennom rommet er ufattelig svakt når det treffer bilantennen — omtrent som å se en <strong>25-watts lyspære på 20 000 kilometers avstand</strong> (ca. −130 dBm).</p>
        <p>Hvis en lokal <strong>jammer (støysender)</strong> sender ut kraftig radiostøy på samme frekvensbånd (L1-båndet), drukner de tynne satellitt-strekene i støy.</p>
        <p>Signal-til-støy-forholdet (<strong>SNR</strong>) kollapser, sirklene løser seg opp, og bilen må falle tilbake på egne hjul- og treghetssensorer (<em>dead reckoning</em>).</p>
      `,
      mathNote: 'Frisii ligning: P_mottatt ∝ P_sendt / (4π·d²)   →   Når P_jammer ≫ P_sat faller SNR under låsegrensen'
    }
  ];

  const TOTAL_DURATION = CHAPTERS.reduce((acc, c) => acc + c.duration, 0);

  // Compute cumulative start/end times for each chapter
  let accumTime = 0;
  CHAPTERS.forEach((c) => {
    c.startTime = accumTime;
    c.endTime = accumTime + c.duration;
    accumTime = c.endTime;
  });

  // ============================================================================
  // 2. DOM ELEMENTS & PLAYER STATE
  // ============================================================================
  const glCanvas = document.getElementById('gl-canvas');
  const sketchCanvas = document.getElementById('sketch-canvas');
  const ctx = sketchCanvas.getContext('2d');

  const narrativeCard = document.getElementById('narrative-card');
  const chapterBadge = document.getElementById('chapter-badge');
  const narrativeHeading = document.getElementById('narrative-heading');
  const narrativeBody = document.getElementById('narrative-body');
  const narrativeMathNote = document.getElementById('narrative-math-note');
  const hintText = document.getElementById('hint-text');

  const btnPrev = document.getElementById('btn-prev');
  const btnPlay = document.getElementById('btn-play');
  const btnNext = document.getElementById('btn-next');
  const iconPause = document.getElementById('icon-pause');
  const iconPlay = document.getElementById('icon-play');
  const timelineSlider = document.getElementById('timeline-slider');
  const chapterSegments = document.getElementById('chapter-segments');
  const timeCurrent = document.getElementById('time-current');
  const timeTotal = document.getElementById('time-total');
  const btnChapters = document.getElementById('btn-chapters');
  const currentChapterShort = document.getElementById('current-chapter-short');
  const chapterPopover = document.getElementById('chapter-popover');
  const chapterList = document.getElementById('chapter-list');

  let state = {
    playing: true,
    globalTime: 0,
    activeChapterIndex: -1,
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: Math.min(window.devicePixelRatio || 1, 2),
    lastFrameTs: performance.now(),
    carProgress2D: 0.14 // Continuous car parameter along the road so it NEVER jumps!
  };

  // Format seconds as MM:SS
  function formatTime(sec) {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${String(m).padStart(2, '0')}:${String(rem).padStart(2, '0')}`;
  }

  timeTotal.textContent = formatTime(TOTAL_DURATION);

  // Build chapter timeline segments and popover items
  const segmentFills = [];
  CHAPTERS.forEach((chap, idx) => {
    const seg = document.createElement('div');
    seg.className = 'seg-bar';
    seg.style.flex = String(chap.duration);
    const fill = document.createElement('div');
    fill.className = 'seg-fill';
    seg.appendChild(fill);
    chapterSegments.appendChild(seg);
    segmentFills.push(fill);

    const item = document.createElement('button');
    item.className = 'chapter-item';
    item.innerHTML = `
      <span class="chap-num">${chap.id}</span>
      <span class="chap-meta">
        <span class="chap-title">${chap.title}</span>
        <span class="chap-tag">${chap.tag} · ${formatTime(chap.startTime)}</span>
      </span>
    `;
    item.addEventListener('click', () => {
      jumpToChapter(idx);
      chapterPopover.classList.add('hidden');
    });
    chapterList.appendChild(item);
  });

  function updateNarrativePanel(chapIndex) {
    if (chapIndex === state.activeChapterIndex) return;
    state.activeChapterIndex = chapIndex;
    const chap = CHAPTERS[chapIndex];

    // Smooth glide-out and glide-in transition on the right side
    narrativeCard.classList.add('glide-out');
    setTimeout(() => {
      chapterBadge.textContent = chap.badge;
      narrativeHeading.textContent = chap.title;
      narrativeBody.innerHTML = chap.body;
      narrativeMathNote.textContent = chap.mathNote;
      hintText.textContent = chap.hint;
      narrativeCard.classList.remove('glide-out');
    }, 240);

    currentChapterShort.textContent = `Kap. ${chap.id} / ${CHAPTERS.length}`;
    const items = chapterList.querySelectorAll('.chapter-item');
    items.forEach((el, i) => el.classList.toggle('active', i === chapIndex));

    // Toggle WebGL 3D canvas visibility for chapters 5, 6, 7, 8
    const is3D = chap.id >= 5 && chap.id <= 8;
    glCanvas.classList.toggle('active', is3D);
  }

  function jumpToChapter(idx) {
    const targetIdx = Math.max(0, Math.min(CHAPTERS.length - 1, idx));
    state.globalTime = CHAPTERS[targetIdx].startTime + 0.01;
    // Sync continuous car road parameter smoothly for scrubbed chapter
    syncCarToGlobalTime(state.globalTime);
    updateNarrativePanel(targetIdx);
  }

  // Player controls
  function togglePlay() {
    state.playing = !state.playing;
    iconPause.style.display = state.playing ? 'block' : 'none';
    iconPlay.style.display = state.playing ? 'none' : 'block';
  }

  btnPlay.addEventListener('click', togglePlay);
  btnPrev.addEventListener('click', () => jumpToChapter(state.activeChapterIndex - 1));
  btnNext.addEventListener('click', () => jumpToChapter(state.activeChapterIndex + 1));

  btnChapters.addEventListener('click', (e) => {
    e.stopPropagation();
    chapterPopover.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!chapterPopover.contains(e.target) && e.target !== btnChapters) {
      chapterPopover.classList.add('hidden');
    }
  });

  timelineSlider.addEventListener('input', () => {
    const ratio = parseFloat(timelineSlider.value) / 1000;
    state.globalTime = ratio * TOTAL_DURATION;
    syncCarToGlobalTime(state.globalTime);
  });

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      togglePlay();
    } else if (e.code === 'ArrowRight') {
      jumpToChapter(state.activeChapterIndex + 1);
    } else if (e.code === 'ArrowLeft') {
      jumpToChapter(state.activeChapterIndex - 1);
    }
  });

  // ============================================================================
  // 3. RESIZE & COORDINATE HELPERS
  // ============================================================================
  function handleResize() {
    state.width = window.innerWidth;
    state.height = window.innerHeight;
    state.dpr = Math.min(window.devicePixelRatio || 1, 2);

    sketchCanvas.width = Math.floor(state.width * state.dpr);
    sketchCanvas.height = Math.floor(state.height * state.dpr);

    glCanvas.width = Math.floor(state.width * state.dpr);
    glCanvas.height = Math.floor(state.height * state.dpr);
    if (gl) {
      gl.viewport(0, 0, glCanvas.width, glCanvas.height);
    }
  }
  window.addEventListener('resize', handleResize);

  // Math utilities
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smoothstep = (edge0, edge1, x) => {
    const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  };
  const easeOutBack = (t) => {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  };

  // ============================================================================
  // 4. HAND-DRAWN PENCIL & CRAYON SKETCH ENGINE (Paper & Crayon Charm)
  // ============================================================================
  // Deterministic pseudo-noise so hand-drawn wobble looks alive yet stable
  function hashNoise(n) {
    const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return s - Math.floor(s);
  }

  function smoothNoise(x, seed = 1) {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * (3 - 2 * f);
    return lerp(hashNoise(i + seed * 19.3), hashNoise(i + 1 + seed * 19.3), u) * 2 - 1;
  }

  /**
   * Draws a hand-drawn pencil/crayon line between (x1, y1) and (x2, y2).
   * Supports partial drawing via `progress` (0..1).
   */
  function drawSketchLine(x1, y1, x2, y2, opts = {}) {
    const {
      color = '#1d222b',
      width = 2.2,
      alpha = 1.0,
      wobble = 2.2,
      passes = 2,
      progress = 1.0,
      seed = 1
    } = opts;

    if (progress <= 0.001 || alpha <= 0.001) return;

    const ex = lerp(x1, x2, clamp(progress, 0, 1));
    const ey = lerp(y1, y2, clamp(progress, 0, 1));
    const dist = Math.hypot(ex - x1, ey - y1);
    const steps = Math.max(8, Math.min(70, Math.floor(dist / 10)));

    const dx = ex - x1;
    const dy = ey - y1;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let p = 0; p < passes; p++) {
      ctx.beginPath();
      ctx.lineWidth = width * (p === 0 ? 1 : 0.72);
      ctx.globalAlpha = alpha * (p === 0 ? 0.88 : 0.45);

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        // Taper wobble at endpoints so vertices still meet cleanly
        const env = Math.sin(t * Math.PI);
        const n = smoothNoise(t * 9 + p * 7.1, seed + p * 13);
        const offset = n * wobble * env;
        const px = lerp(x1, ex, t) + nx * offset;
        const py = lerp(y1, ey, t) + ny * offset;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Draws a hand-drawn crayon circle with multi-pass organic strokes and optional soft wash.
   * No dashed lines! Uses solid hand-drawn crayon strokes.
   */
  function drawCrayonCircle(cx, cy, r, opts = {}) {
    const {
      color = '#d94e34',
      fillColor = null,
      width = 3.0,
      alpha = 1.0,
      wobble = 2.4,
      passes = 3,
      progress = 1.0,
      seed = 1
    } = opts;

    if (r <= 1 || progress <= 0.001 || alpha <= 0.001) return;

    ctx.save();
    const maxAngle = Math.PI * 2 * clamp(progress, 0, 1);
    const steps = Math.max(48, Math.min(140, Math.floor(r * 0.45)));

    // Optional translucent crayon fill inside circle
    if (fillColor && progress > 0.95) {
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * Math.PI * 2;
        const n = smoothNoise(i * 0.25, seed);
        const rr = r + n * wobble * 0.6;
        const px = cx + Math.cos(a) * rr;
        const py = cy + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.globalAlpha = alpha;
      ctx.fill();
    }

    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let p = 0; p < passes; p++) {
      ctx.beginPath();
      ctx.lineWidth = width * (p === 0 ? 1.05 : p === 1 ? 0.8 : 0.55);
      ctx.globalAlpha = alpha * (p === 0 ? 0.85 : p === 1 ? 0.55 : 0.35);

      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const a = t * maxAngle;
        // Periodic noise around the circle
        const n =
          Math.sin(a * 3 + seed * 1.7 + p * 2.1) * 0.5 +
          Math.cos(a * 5 - seed * 2.3 + p * 1.4) * 0.35 +
          Math.sin(a * 9 + p * 3.2) * 0.15;
        const rr = r + n * wobble + (p - 1) * 0.9;
        const px = cx + Math.cos(a) * rr;
        const py = cy + Math.sin(a) * rr;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  /**
   * Draws a hand-drawn arc (for angle markers θ in geometry overlays)
   */
  function drawSketchArc(cx, cy, r, startAngle, endAngle, opts = {}) {
    const {
      color = '#1d222b',
      width = 2.0,
      alpha = 0.9,
      seed = 3
    } = opts;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.globalAlpha = alpha;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const steps = 24;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const a = lerp(startAngle, endAngle, t);
      const rr = r + smoothNoise(t * 5, seed) * 1.2;
      const px = cx + Math.cos(a) * rr;
      const py = cy + Math.sin(a) * rr;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  /**
   * Draws a hand-drawn arrow
   */
  function drawSketchArrow(x1, y1, x2, y2, opts = {}) {
    const {
      color = '#1d222b',
      width = 2.4,
      alpha = 1.0,
      headSize = 11,
      progress = 1.0,
      seed = 1
    } = opts;
    if (progress <= 0.01) return;
    drawSketchLine(x1, y1, x2, y2, { color, width, alpha, progress, seed });
    if (progress > 0.85) {
      const ex = lerp(x1, x2, progress);
      const ey = lerp(y1, y2, progress);
      const angle = Math.atan2(ey - y1, ex - x1);
      const a1 = angle + Math.PI * 0.82;
      const a2 = angle - Math.PI * 0.82;
      drawSketchLine(ex, ey, ex + Math.cos(a1) * headSize, ey + Math.sin(a1) * headSize, {
        color, width, alpha, wobble: 0.8, passes: 2, seed: seed + 5
      });
      drawSketchLine(ex, ey, ex + Math.cos(a2) * headSize, ey + Math.sin(a2) * headSize, {
        color, width, alpha, wobble: 0.8, passes: 2, seed: seed + 9
      });
    }
  }

  /**
   * Draws a charming hand-sketched GPS Satellite icon
   */
  function drawSketchSatellite(x, y, color, label, scale = 1.0, alpha = 1.0, seed = 1) {
    if (alpha <= 0.01 || scale <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    // Soft crayon aura behind satellite
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha * 0.14;
    ctx.fill();
    ctx.globalAlpha = alpha;

    // Solar wings (tilted)
    const tilt = -0.28;
    ctx.save();
    ctx.rotate(tilt);

    // Left solar wing
    ctx.fillStyle = 'rgba(43, 108, 176, 0.22)';
    ctx.fillRect(-38, -7, 22, 14);
    drawSketchLine(-38, -7, -16, -7, { color, width: 2, wobble: 0.9, seed });
    drawSketchLine(-38, 7, -16, 7, { color, width: 2, wobble: 0.9, seed: seed + 1 });
    drawSketchLine(-38, -7, -38, 7, { color, width: 2, wobble: 0.9, seed: seed + 2 });
    drawSketchLine(-27, -7, -27, 7, { color, width: 1.4, wobble: 0.7, seed: seed + 3 });

    // Right solar wing
    ctx.fillRect(16, -7, 22, 14);
    drawSketchLine(16, -7, 38, -7, { color, width: 2, wobble: 0.9, seed: seed + 4 });
    drawSketchLine(16, 7, 38, 7, { color, width: 2, wobble: 0.9, seed: seed + 5 });
    drawSketchLine(38, -7, 38, 7, { color, width: 2, wobble: 0.9, seed: seed + 6 });
    drawSketchLine(27, -7, 27, 7, { color, width: 1.4, wobble: 0.7, seed: seed + 7 });

    // Connectors
    drawSketchLine(-16, 0, -10, 0, { color: '#1d222b', width: 2.2, wobble: 0.5 });
    drawSketchLine(10, 0, 16, 0, { color: '#1d222b', width: 2.2, wobble: 0.5 });

    // Central satellite body (gold/warm crayon box)
    ctx.fillStyle = '#f4d58d';
    ctx.fillRect(-10, -10, 20, 20);
    drawSketchLine(-10, -10, 10, -10, { color: '#1d222b', width: 2.2, wobble: 0.8 });
    drawSketchLine(10, -10, 10, 10, { color: '#1d222b', width: 2.2, wobble: 0.8 });
    drawSketchLine(10, 10, -10, 10, { color: '#1d222b', width: 2.2, wobble: 0.8 });
    drawSketchLine(-10, 10, -10, -10, { color: '#1d222b', width: 2.2, wobble: 0.8 });

    // Transmitter dish pointing down
    drawSketchArc(0, 13, 6, 0.15, Math.PI - 0.15, { color: '#1d222b', width: 2 });
    drawSketchLine(0, 13, 0, 19, { color, width: 2, wobble: 0.4 });
    ctx.restore();

    // Label in handwritten font
    if (label) {
      ctx.font = '700 20px Caveat, cursive';
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.fillText(label, 0, -24);
    }

    ctx.restore();
  }

  /**
   * Draws a charming hand-sketched top/side hybrid car on the road
   */
  function drawSketchCar(x, y, angle, opts = {}) {
    const {
      color = '#d94e34',
      alpha = 1.0,
      scale = 1.0,
      isGhost = false,
      label = null,
      stopped = false
    } = opts;

    if (alpha <= 0.01) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.scale(scale, scale);
    ctx.globalAlpha = alpha;

    // Soft shadow
    ctx.fillStyle = isGhost ? 'rgba(124, 77, 255, 0.14)' : 'rgba(29, 34, 43, 0.14)';
    ctx.beginPath();
    ctx.ellipse(0, 3, 24, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#1d222b';
    ctx.fillRect(-15, -13, 9, 4);
    ctx.fillRect(7, -13, 9, 4);
    ctx.fillRect(-15, 9, 9, 4);
    ctx.fillRect(7, 9, 9, 4);

    // Car body fill
    ctx.fillStyle = isGhost ? 'rgba(124, 77, 255, 0.28)' : color;
    ctx.beginPath();
    ctx.roundRect(-21, -10, 42, 20, 6);
    ctx.fill();

    // Windshield / roof cabin
    ctx.fillStyle = isGhost ? 'rgba(255, 255, 255, 0.45)' : '#f8f4ec';
    ctx.beginPath();
    ctx.roundRect(-9, -7.5, 20, 15, 4);
    ctx.fill();

    // Hand-drawn outline around car
    const strokeCol = isGhost ? '#7c4dff' : '#1d222b';
    drawSketchLine(-19, -10, 19, -10, { color: strokeCol, width: 2.1, wobble: 0.9, seed: 11 });
    drawSketchLine(19, -10, 21, 10, { color: strokeCol, width: 2.1, wobble: 0.9, seed: 12 });
    drawSketchLine(21, 10, -19, 10, { color: strokeCol, width: 2.1, wobble: 0.9, seed: 13 });
    drawSketchLine(-19, 10, -19, -10, { color: strokeCol, width: 2.1, wobble: 0.9, seed: 14 });

    // Roof GPS receiver dot
    ctx.beginPath();
    ctx.arc(-2, 0, 3.2, 0, Math.PI * 2);
    ctx.fillStyle = isGhost ? '#7c4dff' : '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#1d222b';
    ctx.lineWidth = 1.4;
    ctx.stroke();

    ctx.restore();

    // Optional label above car (unrotated for readability)
    if (label) {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '700 19px Caveat, cursive';
      ctx.textAlign = 'center';
      ctx.fillStyle = isGhost ? '#6b38fb' : '#1d222b';
      ctx.fillText(label, x, y - 24);
      ctx.restore();
    }

    // If stopped for geometric calculation, show a subtle hand-drawn pause/measure ring
    if (stopped && !isGhost) {
      drawCrayonCircle(x, y, 29, {
        color: '#1d222b',
        width: 1.5,
        alpha: alpha * 0.45,
        wobble: 1.6,
        passes: 2,
        seed: 77
      });
    }
  }

  /**
   * Draws a handwritten math callout note directly on the canvas
   */
  function drawMathCallout(x, y, text, subtext = null, color = '#1d222b', alpha = 1.0, align = 'center') {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '700 22px Caveat, cursive';
    ctx.textAlign = align;

    const m = ctx.measureText(text);
    const w = m.width + 20;
    const h = subtext ? 48 : 30;
    const bx = align === 'center' ? x - w / 2 : align === 'left' ? x - 8 : x - w + 8;
    const by = y - 21;

    // Soft paper backing so lines behind don't make text hard to read
    ctx.fillStyle = 'rgba(246, 241, 230, 0.88)';
    ctx.beginPath();
    ctx.roundRect(bx, by, w, h, 8);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.fillText(text, x, y);

    if (subtext) {
      ctx.font = '600 17px Caveat, cursive';
      ctx.fillStyle = '#525866';
      ctx.fillText(subtext, x, y + 18);
    }
    ctx.restore();
  }

  // ============================================================================
  // 5. CONTINUOUS CAR ROAD & SATELLITE POSITIONS (2D Chapters 1-4)
  // ============================================================================
  // The road spans the left-center stage area so the right narrative card never overlaps
  function getStageCenter() {
    // Center shifted slightly left to leave breathing room for the right narrative panel
    return {
      cx: state.width * 0.37,
      cy: state.height * 0.54,
      scale: Math.min(state.width * 0.62, state.height * 0.78)
    };
  }

  // Smooth curved country road in 2D space
  function getRoadPoint(u) {
    const { cx, cy, scale } = getStageCenter();
    const x = cx + (u - 0.5) * scale * 0.78;
    const y =
      cy +
      Math.sin((u - 0.15) * Math.PI * 1.65) * (scale * 0.11) -
      Math.cos(u * Math.PI * 0.9) * (scale * 0.04);
    return { x, y };
  }

  function getRoadPose(u) {
    const p1 = getRoadPoint(u);
    const p2 = getRoadPoint(u + 0.005);
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    return { x: p1.x, y: p1.y, angle };
  }

  /**
   * Computes a continuous, monotonic road parameter `u` as a function of globalTime.
   * When the car stops to draw math triangles, it stops *exactly where it is* and never jumps!
   */
  const CAR_STOPS = [
    // Chapter 1: drives from 0.14 to 0.28 during first 4.2s, then holds still at 0.28
    { tStart: 0, tMoveEnd: 4.2, tChapEnd: 16, uStart: 0.14, uEnd: 0.28 },
    // Chapter 2: drives from 0.28 to 0.44 during first 4.2s, then holds still at 0.44
    { tStart: 16, tMoveEnd: 20.2, tChapEnd: 32, uStart: 0.28, uEnd: 0.44 },
    // Chapter 3: drives from 0.44 to 0.61 during first 4.2s, then holds still at 0.61
    { tStart: 32, tMoveEnd: 36.2, tChapEnd: 50, uStart: 0.44, uEnd: 0.61 },
    // Chapter 4: drives from 0.61 to 0.77 during first 4.0s, then holds still at 0.77
    { tStart: 50, tMoveEnd: 54.0, tChapEnd: 66, uStart: 0.61, uEnd: 0.77 }
  ];

  function getCarStateAtTime(globalTime) {
    for (const seg of CAR_STOPS) {
      if (globalTime >= seg.tStart && globalTime <= seg.tChapEnd) {
        if (globalTime < seg.tMoveEnd) {
          const p = smoothstep(seg.tStart, seg.tMoveEnd, globalTime);
          return {
            u: lerp(seg.uStart, seg.uEnd, p),
            stopped: false,
            stopTime: 0
          };
        } else {
          return {
            u: seg.uEnd,
            stopped: true,
            stopTime: globalTime - seg.tMoveEnd
          };
        }
      }
    }
    return { u: 0.77, stopped: true, stopTime: 5 };
  }

  function syncCarToGlobalTime(globalTime) {
    state.carProgress2D = getCarStateAtTime(globalTime).u;
  }

  // 2D Satellite positions around the sky/map
  function get2DSatellites() {
    const { cx, cy, scale } = getStageCenter();
    return [
      {
        id: 1,
        label: 'Satellitt 1',
        color: '#d94e34',
        fill: 'rgba(217, 78, 52, 0.08)',
        x: cx - scale * 0.34,
        y: cy - scale * 0.32
      },
      {
        id: 2,
        label: 'Satellitt 2',
        color: '#2b6cb0',
        fill: 'rgba(43, 108, 176, 0.08)',
        x: cx + scale * 0.33,
        y: cy - scale * 0.30
      },
      {
        id: 3,
        label: 'Satellitt 3',
        color: '#2b8a58',
        fill: 'rgba(43, 138, 88, 0.08)',
        x: cx - scale * 0.04,
        y: cy + scale * 0.38
      },
      {
        id: 4,
        label: 'Satellitt 4',
        color: '#c78d20',
        fill: 'rgba(217, 130, 43, 0.08)',
        x: cx + scale * 0.38,
        y: cy + scale * 0.24
      }
    ];
  }

  // Analytic intersection of two 2D circles (S1 and S2)
  function intersectTwoCircles(x1, y1, r1, x2, y2, r2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const d = Math.hypot(dx, dy);
    if (d > r1 + r2 || d < Math.abs(r1 - r2) || d === 0) return [];
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
    const xm = x1 + (a * dx) / d;
    const ym = y1 + (a * dy) / d;
    const rx = (-dy * h) / d;
    const ry = (dx * h) / d;
    return [
      { x: xm + rx, y: ym + ry },
      { x: xm - rx, y: ym - ry }
    ];
  }

  // Draw the charming 2D road & landscape sketch
  function draw2DRoadAndLandscape(alpha = 1.0) {
    if (alpha <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    // Draw subtle compass/grid ticks in pencil
    const { cx, cy, scale } = getStageCenter();
    drawSketchLine(cx - scale * 0.46, cy, cx + scale * 0.46, cy, {
      color: 'rgba(29, 34, 43, 0.08)',
      width: 1.2,
      wobble: 1.0,
      passes: 1,
      seed: 101
    });
    drawSketchLine(cx, cy - scale * 0.42, cx, cy + scale * 0.42, {
      color: 'rgba(29, 34, 43, 0.08)',
      width: 1.2,
      wobble: 1.0,
      passes: 1,
      seed: 102
    });

    // Draw roadbed (warm asphalt crayon stroke)
    const steps = 70;
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const u = i / steps;
      const pt = getRoadPoint(u);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.strokeStyle = 'rgba(82, 88, 102, 0.18)';
    ctx.lineWidth = 26;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Road edges (pencil lines)
    for (const offset of [-12, 12]) {
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) {
        const u = i / steps;
        const pose = getRoadPose(u);
        const nx = -Math.sin(pose.angle) * offset;
        const ny = Math.cos(pose.angle) * offset;
        const n = smoothNoise(u * 12, offset > 0 ? 4 : 8) * 1.2;
        if (i === 0) ctx.moveTo(pose.x + nx + n, pose.y + ny + n);
        else ctx.lineTo(pose.x + nx + n, pose.y + ny + n);
      }
      ctx.strokeStyle = 'rgba(29, 34, 43, 0.35)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Draws full geometric overlay (distance line, right-angle tick, angle arc θᵢ, and distance label)
   * from the stopped car to ALL active satellites simultaneously!
   */
  function drawMultiSatelliteGeometryOverlay(carPose, sats, count, stopTime, radiusBias = 0) {
    const geoProgress = clamp(stopTime / 1.8, 0, 1);
    if (geoProgress <= 0.01) return;

    // Draw connecting baseline polygon between the active satellites to show triangulation/trilateration frame
    if (count >= 2) {
      for (let i = 0; i < count; i++) {
        const sA = sats[i];
        const sB = sats[(i + 1) % count];
        if (count === 2 && i === 1) break;
        drawSketchLine(sA.x, sA.y, sB.x, sB.y, {
          color: 'rgba(29, 34, 43, 0.25)',
          width: 1.6,
          alpha: geoProgress,
          wobble: 1.8,
          passes: 1,
          progress: geoProgress,
          seed: 300 + i
        });
      }
    }

    // For EVERY active satellite, draw the distance ray, angle arc θ_i, perpendicular tick, and math readout
    for (let i = 0; i < count; i++) {
      const sat = sats[i];
      const stagger = clamp((stopTime - i * 0.22) / 1.2, 0, 1);
      if (stagger <= 0.01) continue;

      const trueDist = Math.hypot(carPose.x - sat.x, carPose.y - sat.y);
      const measuredDist = trueDist + radiusBias;

      // 1. Hand-drawn distance ray from satellite to car
      drawSketchLine(sat.x, sat.y, carPose.x, carPose.y, {
        color: sat.color,
        width: 2.5,
        alpha: 0.9 * stagger,
        wobble: 1.8,
        passes: 2,
        progress: stagger,
        seed: 40 + i * 7
      });

      // 2. Angle arc θ_i at the car between road heading and satellite line-of-sight
      const losAngle = Math.atan2(sat.y - carPose.y, sat.x - carPose.x);
      const arcRadius = 34 + i * 7;
      drawSketchArc(carPose.x, carPose.y, arcRadius, carPose.angle, losAngle, {
        color: sat.color,
        width: 1.8,
        alpha: 0.75 * stagger,
        seed: 55 + i
      });

      // 3. Distance & travel-time label along the ray
      if (stagger > 0.65) {
        const mx = lerp(sat.x, carPose.x, 0.52);
        const my = lerp(sat.y, carPose.y, 0.52);
        const fakeMs = (measuredDist * 0.068).toFixed(1);
        const label =
          radiusBias !== 0
            ? `R${i + 1} = d${i + 1} + Δr`
            : `d${i + 1} = c·Δt${i + 1} (${fakeMs} ms)`;
        drawMathCallout(mx, my, label, null, sat.color, smoothstep(0.65, 1.0, stagger));
      }
    }
  }

  // ============================================================================
  // 6. RENDER CHAPTERS 1 - 4 (2D TRILATERATION & ERROR TRIANGLE STORY)
  // ============================================================================
  function render2DTrilaterationChapters(chapId, localTime) {
    const sats = get2DSatellites();
    const carState = getCarStateAtTime(state.globalTime);
    const carPose = getRoadPose(carState.u);

    draw2DRoadAndLandscape(1.0);

    // Determine how many satellites are active in this chapter (1, 2, 3, or 4)
    const activeCount = chapId; // Chap 1 -> 1, Chap 2 -> 2, Chap 3 -> 3, Chap 4 -> 4

    // In Chapter 3, we demonstrate clock error Δt_feil causing an Error Triangle (feiltrekant).
    // In Chapter 4, the 4th satellite arrives and animates the clock error Δr shrinking to 0!
    let radiusBias = 0;
    if (chapId === 3 && carState.stopped) {
      const errGrow = smoothstep(0.4, 2.4, carState.stopTime);
      radiusBias = 28 * errGrow;
    } else if (chapId === 4) {
      // Starts with the error triangle bias from Chapter 3 and shrinks it to zero once stopped
      const solveProgress = carState.stopped ? smoothstep(1.2, 4.8, carState.stopTime) : 0;
      radiusBias = 28 * (1 - solveProgress);
    }

    // Draw active satellites and their crayon distance circles
    for (let i = 0; i < activeCount; i++) {
      const sat = sats[i];
      const isNewest = i === activeCount - 1;

      // Animate newly added satellite gliding in from top/outer edge instead of popping in!
      const enterT = isNewest ? clamp(localTime / 2.2, 0, 1) : 1.0;
      const easeT = easeOutBack(enterT);
      const { cx, cy } = getStageCenter();
      const startX = sat.x + (sat.x - cx) * 0.45;
      const startY = sat.y + (sat.y - cy) * 0.45;
      const curSatX = lerp(startX, sat.x, clamp(easeT, 0, 1.08));
      const curSatY = lerp(startY, sat.y, clamp(easeT, 0, 1.08));

      const trueRadius = Math.hypot(carPose.x - curSatX, carPose.y - curSatY);
      const displayRadius = trueRadius + radiusBias;

      // Circle draws in smoothly
      const circleProgress = isNewest ? smoothstep(0.6, 2.6, localTime) : 1.0;
      drawCrayonCircle(curSatX, curSatY, displayRadius, {
        color: sat.color,
        fillColor: sat.fill,
        width: 3.2,
        alpha: 0.9,
        wobble: 2.5,
        passes: 3,
        progress: circleProgress,
        seed: i * 17 + 3
      });

      drawSketchSatellite(curSatX, curSatY, sat.color, sat.label, clamp(enterT * 1.1, 0, 1), enterT, i + 1);
    }

    // When the car stops, draw the geometric triangles & distance lines to ALL active satellites
    if (carState.stopped) {
      drawMultiSatelliteGeometryOverlay(carPose, sats, activeCount, carState.stopTime, radiusBias);
    }

    // Highlight intersections depending on chapter:
    // CHAPTER 1: Highlight the whole circle as a locus of possibilities
    if (chapId === 1 && carState.stopped) {
      const a = smoothstep(0.5, 1.8, carState.stopTime);
      const r1 = Math.hypot(carPose.x - sats[0].x, carPose.y - sats[0].y);
      // Show a couple of "question mark" candidate ghost cars along the red circle
      for (const ang of [-0.35, 0.85, 2.15]) {
        const gx = sats[0].x + Math.cos(ang) * r1;
        const gy = sats[0].y + Math.sin(ang) * r1;
        drawSketchCar(gx, gy, ang + Math.PI / 2, {
          isGhost: true,
          alpha: a * 0.55,
          scale: 0.85,
          label: 'Mulig posisjon?'
        });
      }
    }

    // CHAPTER 2: Two circles intersect in TWO distinct points P_A and P_B + symmetric triangle geometry
    if (chapId === 2 && carState.stopped) {
      const a = smoothstep(0.3, 1.5, carState.stopTime);
      const r1 = Math.hypot(carPose.x - sats[0].x, carPose.y - sats[0].y);
      const r2 = Math.hypot(carPose.x - sats[1].x, carPose.y - sats[1].y);
      const pts = intersectTwoCircles(sats[0].x, sats[0].y, r1, sats[1].x, sats[1].y, r2);

      if (pts.length === 2) {
        // Draw the radical chord connecting P_A and P_B, and triangles to S1 & S2
        drawSketchLine(pts[0].x, pts[0].y, pts[1].x, pts[1].y, {
          color: '#7c4dff',
          width: 2.2,
          alpha: a * 0.8,
          seed: 88
        });

        // Also draw ghost triangle to the mirror intersection point
        const mirrorPt =
          Math.hypot(pts[0].x - carPose.x, pts[0].y - carPose.y) >
          Math.hypot(pts[1].x - carPose.x, pts[1].y - carPose.y)
            ? pts[0]
            : pts[1];

        drawSketchLine(sats[0].x, sats[0].y, mirrorPt.x, mirrorPt.y, {
          color: sats[0].color,
          width: 1.6,
          alpha: a * 0.45,
          seed: 91
        });
        drawSketchLine(sats[1].x, sats[1].y, mirrorPt.x, mirrorPt.y, {
          color: sats[1].color,
          width: 1.6,
          alpha: a * 0.45,
          seed: 92
        });

        pts.forEach((pt, idx) => {
          // Glowing mixed-color intersection marker (Red + Blue = Purple/Magenta glow)
          ctx.save();
          ctx.globalAlpha = a;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 13, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(124, 77, 255, 0.32)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 6.5, 0, Math.PI * 2);
          ctx.fillStyle = '#7c4dff';
          ctx.fill();
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.restore();

          const isReal = Math.hypot(pt.x - carPose.x, pt.y - carPose.y) < 15;
          drawMathCallout(
            pt.x,
            pt.y + (isReal ? 36 : -26),
            isReal ? 'P_A (Ekte bil)' : 'P_B (Speilpunkt)',
            null,
            '#7c4dff',
            a
          );
        });
      }
    }

    // CHAPTER 3 & 4: Draw the visual "Feiltrekant" (Error Triangle) formed by clock bias Δt_klokke
    if ((chapId === 3 || chapId === 4) && carState.stopped) {
      const a = smoothstep(0.4, 1.5, carState.stopTime);
      const r1 = Math.hypot(carPose.x - sats[0].x, carPose.y - sats[0].y) + radiusBias;
      const r2 = Math.hypot(carPose.x - sats[1].x, carPose.y - sats[1].y) + radiusBias;
      const r3 = Math.hypot(carPose.x - sats[2].x, carPose.y - sats[2].y) + radiusBias;

      // Pick the pairwise intersections closest to the car to form the vertices of the Error Triangle
      const pickClosest = (arr) => {
        if (!arr.length) return { x: carPose.x, y: carPose.y };
        return arr.reduce((best, p) =>
          Math.hypot(p.x - carPose.x, p.y - carPose.y) < Math.hypot(best.x - carPose.x, best.y - carPose.y)
            ? p
            : best
        );
      };

      const v12 = pickClosest(intersectTwoCircles(sats[0].x, sats[0].y, r1, sats[1].x, sats[1].y, r2));
      const v23 = pickClosest(intersectTwoCircles(sats[1].x, sats[1].y, r2, sats[2].x, sats[2].y, r3));
      const v31 = pickClosest(intersectTwoCircles(sats[2].x, sats[2].y, r3, sats[0].x, sats[0].y, r1));

      if (radiusBias > 2.5) {
        // Fill shaded error triangle in warm amber/red crayon
        ctx.save();
        ctx.globalAlpha = a * 0.38;
        ctx.beginPath();
        ctx.moveTo(v12.x, v12.y);
        ctx.lineTo(v23.x, v23.y);
        ctx.lineTo(v31.x, v31.y);
        ctx.closePath();
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.restore();

        // Hand-drawn triangle edges
        drawSketchLine(v12.x, v12.y, v23.x, v23.y, { color: '#b5361e', width: 3.2, alpha: a, seed: 201 });
        drawSketchLine(v23.x, v23.y, v31.x, v31.y, { color: '#b5361e', width: 3.2, alpha: a, seed: 202 });
        drawSketchLine(v31.x, v31.y, v12.x, v12.y, { color: '#b5361e', width: 3.2, alpha: a, seed: 203 });

        // Vertices dots
        for (const v of [v12, v23, v31]) {
          ctx.beginPath();
          ctx.arc(v.x, v.y, 5.5, 0, Math.PI * 2);
          ctx.fillStyle = '#b5361e';
          ctx.fill();
        }

        drawMathCallout(
          carPose.x,
          carPose.y + 48,
          'Feiltrekant pga. klokkefeil Δt_klokke!',
          'Alle radier er Δr = c · Δt_klokke for store',
          '#b5361e',
          a
        );
      } else if (chapId === 4) {
        // Error triangle has collapsed into a single golden-green locked point!
        ctx.save();
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(carPose.x, carPose.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(43, 138, 88, 0.28)';
        ctx.fill();
        ctx.beginPath();
        ctx.arc(carPose.x, carPose.y, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = '#2b8a58';
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.restore();

        drawMathCallout(
          carPose.x,
          carPose.y + 46,
          'Δt_klokke korrigert → Eksakt skjæringspunkt!',
          '4 sirkler møtes i (x, y) med atomklokke-tid',
          '#1d6b42',
          a
        );
      }
    }

    // Finally draw the car on top of the road at its exact current position
    drawSketchCar(carPose.x, carPose.y, carPose.angle, {
      color: '#d94e34',
      stopped: carState.stopped,
      label: carState.stopped ? 'Måler avstander...' : null
    });
  }

  // ============================================================================
  // 7. WEBGL 3D RAYMARCHING ENGINE FOR TRANSPARENT SPHERES & INTERSECTIONS
  //    (Chapters 5, 6, 7, 8 — True volumetric raytracing without hard outer rings,
  //     with glowing mixed-color intersection circles and points!)
  // ============================================================================
  const gl = glCanvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false });

  const vsSource = `
    attribute vec2 a_pos;
    varying vec2 v_uv;
    void main() {
      v_uv = a_pos;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  const fsSource = `
    precision highp float;
    varying vec2 v_uv;

    uniform vec2 u_resolution;
    uniform float u_time;
    uniform int u_numSpheres;
    uniform vec4 u_spheres[4];      // xyz = center, w = radius
    uniform vec3 u_colors[4];       // rgb color of each satellite sphere
    uniform float u_weights[4];     // smooth animation fade-in weight (0..1)
    uniform vec3 u_camPos;
    uniform vec3 u_camTarget;
    uniform float u_showPatch;      // 0..1 visibility of local zoomed Earth patch

    // Ray-sphere intersection returning (tNear, tFar), or (-1.0, -1.0) if miss
    vec2 hitSphere(vec3 ro, vec3 rd, vec3 center, float rad) {
      vec3 oc = ro - center;
      float b = dot(oc, rd);
      float c = dot(oc, oc) - rad * rad;
      float h = b * b - c;
      if (h < 0.0) return vec2(-1.0);
      h = sqrt(h);
      return vec2(-b - h, -b + h);
    }

    void main() {
      // Shift center slightly left so 3D visualization sits nicely left of the narrative card
      vec2 screenUV = v_uv;
      screenUV.x += 0.24;
      screenUV.x *= u_resolution.x / u_resolution.y;

      // Camera basis
      vec3 ww = normalize(u_camTarget - u_camPos);
      vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
      vec3 vv = normalize(cross(uu, ww));
      vec3 rd = normalize(screenUV.x * uu + screenUV.y * vv + 1.85 * ww);
      vec3 ro = u_camPos;

      vec3 accumColor = vec3(0.0);
      float accumAlpha = 0.0;

      // 1. Subtle zoomed-in Earth patch underneath the car (y = -0.35 curved surface)
      if (u_showPatch > 0.01) {
        vec3 earthCenter = vec3(0.0, -3.25, 0.0);
        float earthRad = 3.25;
        vec2 eh = hitSphere(ro, rd, earthCenter, earthRad);
        if (eh.x > 0.0) {
          vec3 p = ro + rd * eh.x;
          float distFromOrigin = length(p.xz);
          if (distFromOrigin < 1.55) {
            float edgeFade = smoothstep(1.55, 1.05, distFromOrigin) * u_showPatch;
            vec3 n = normalize(p - earthCenter);
            float diff = clamp(dot(n, normalize(vec3(0.4, 0.9, 0.5))), 0.2, 1.0);
            // Soft topographic grid lines on the zoomed Earth patch
            float grid = smoothstep(0.94, 0.98, abs(sin(p.x * 14.0))) +
                         smoothstep(0.94, 0.98, abs(sin(p.z * 14.0)));
            vec3 patchCol = mix(vec3(0.22, 0.52, 0.36), vec3(0.75, 0.85, 0.72), grid * 0.35) * diff;
            accumColor += patchCol * edgeFade * 0.42;
            accumAlpha += edgeFade * 0.42;
          }
        }
      }

      // 2. Analytic Transparent Volumetric Spheres (soft interior glow, NO hard outer border line!)
      for (int i = 0; i < 4; i++) {
        if (i >= u_numSpheres) break;
        float w = u_weights[i];
        if (w <= 0.001) continue;

        vec3 c = u_spheres[i].xyz;
        float r = u_spheres[i].w;
        vec3 col = u_colors[i];

        vec2 hit = hitSphere(ro, rd, c, r);
        if (hit.y > 0.0) {
          float t0 = max(0.0, hit.x);
          float t1 = hit.y;
          float chord = max(0.0, t1 - t0);
          float normChord = clamp(chord / (2.0 * r), 0.0, 1.0);

          // Soft volumetric fill: thickest smoothly toward center, fading softly to 0 at grazing edge
          // so there is NO harsh circular outer ring!
          float volDensity = pow(sin(normChord * 3.14159), 1.15) * 0.23 * w;

          // Subtle 3D shading on the front & back shell without creating a sharp silhouette border
          vec3 pFront = ro + rd * t0;
          vec3 nFront = normalize(pFront - c);
          float mu = abs(dot(nFront, rd)); // 1 at center, 0 at silhouette edge
          float softShell = smoothstep(0.0, 0.35, mu) * 0.14 * w;
          float spec = pow(max(0.0, dot(reflect(rd, nFront), normalize(vec3(0.5, 0.8, 0.6)))), 18.0) * mu * 0.22 * w;

          float contrib = volDensity + softShell;
          accumColor += col * contrib + vec3(1.0, 0.98, 0.94) * spec;
          accumAlpha += contrib;
        }
      }

      // 3. Raymarch along the ray to highlight EXACT sphere-sphere intersection seams (circles & points!)
      //    Where two or more sphere shells |length(p - c_i) - r_i| == 0 meet simultaneously,
      //    we mix their colors and boost luminance strongly!
      float tMin = 2.0;
      float tMax = 9.2;
      const int STEPS = 84;
      float dt = (tMax - tMin) / float(STEPS);

      vec3 seamAccum = vec3(0.0);
      float seamAlpha = 0.0;

      for (int s = 0; s < STEPS; s++) {
        float t = tMin + (float(s) + 0.5) * dt;
        vec3 p = ro + rd * t;

        // Evaluate shell proximity for each active sphere
        float d0 = abs(length(p - u_spheres[0].xyz) - u_spheres[0].w);
        float d1 = abs(length(p - u_spheres[1].xyz) - u_spheres[1].w);
        float d2 = abs(length(p - u_spheres[2].xyz) - u_spheres[2].w);
        float d3 = abs(length(p - u_spheres[3].xyz) - u_spheres[3].w);

        float s0 = exp(-d0 * d0 * 115.0) * u_weights[0];
        float s1 = (u_numSpheres >= 2) ? exp(-d1 * d1 * 115.0) * u_weights[1] : 0.0;
        float s2 = (u_numSpheres >= 3) ? exp(-d2 * d2 * 115.0) * u_weights[2] : 0.0;
        float s3 = (u_numSpheres >= 4) ? exp(-d3 * d3 * 115.0) * u_weights[3] : 0.0;

        // Pairwise intersection rings (solid glowing 3D circles where two sphere shells cross)
        float pair01 = s0 * s1;
        float pair02 = s0 * s2;
        float pair12 = s1 * s2;
        float pair03 = s0 * s3;
        float pair13 = s1 * s3;
        float pair23 = s2 * s3;

        vec3 pairColor =
          pair01 * mix(u_colors[0], u_colors[1], 0.5) * 1.45 +
          pair02 * mix(u_colors[0], u_colors[2], 0.5) * 1.35 +
          pair12 * mix(u_colors[1], u_colors[2], 0.5) * 1.35 +
          pair03 * mix(u_colors[0], u_colors[3], 0.5) * 1.35 +
          pair13 * mix(u_colors[1], u_colors[3], 0.5) * 1.35 +
          pair23 * mix(u_colors[2], u_colors[3], 0.5) * 1.35;

        float pairStrength = (pair01 + pair02 + pair12 + pair03 + pair13 + pair23) * dt * 5.2;

        // Triple / Quadruple intersection point (intense white-gold core where 3 or 4 spheres meet!)
        float triple = s0 * s1 * s2;
        float quad = s0 * s1 * s2 * s3;

        seamAccum += pairColor * dt * 5.6 + vec3(1.0, 0.96, 0.80) * (triple * 12.0 + quad * 18.0) * dt;
        seamAlpha += pairStrength + (triple * 9.0 + quad * 14.0) * dt;
      }

      vec3 finalRGB = accumColor + seamAccum;
      float finalA = clamp(accumAlpha + seamAlpha, 0.0, 0.95);

      // Avoid premultiplied blowout while keeping glowing seams vibrant on warm paper
      if (finalA > 0.001) {
        finalRGB = clamp(finalRGB / max(finalA, 0.35), 0.0, 1.0);
      }

      gl_FragColor = vec4(finalRGB, finalA);
    }
  `;

  let glProg = null;
  let glUniforms = {};

  function initWebGL() {
    if (!gl) return;
    const compile = (type, src) => {
      const sh = gl.createShader(type);
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, vsSource);
    const fs = compile(gl.FRAGMENT_SHADER, fsSource);
    glProg = gl.createProgram();
    gl.attachShader(glProg, vs);
    gl.attachShader(glProg, fs);
    gl.linkProgram(glProg);
    gl.useProgram(glProg);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(glProg, 'a_pos');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    glUniforms = {
      res: gl.getUniformLocation(glProg, 'u_resolution'),
      time: gl.getUniformLocation(glProg, 'u_time'),
      numSpheres: gl.getUniformLocation(glProg, 'u_numSpheres'),
      spheres: gl.getUniformLocation(glProg, 'u_spheres'),
      colors: gl.getUniformLocation(glProg, 'u_colors'),
      weights: gl.getUniformLocation(glProg, 'u_weights'),
      camPos: gl.getUniformLocation(glProg, 'u_camPos'),
      camTarget: gl.getUniformLocation(glProg, 'u_camTarget'),
      showPatch: gl.getUniformLocation(glProg, 'u_showPatch')
    };
  }

  initWebGL();
  handleResize();

  // 3D Scene Geometry:
  // We choose 3D satellite centers so that:
  // - P_earth = (0, 0, 0) is the true car position on the zoomed Earth patch.
  // - P_space = (0, 1.45, 0) is the 2nd intersection point of the first 3 spheres high up in space!
  // Let's place S1, S2, S3 at y = 0.725 so their plane of centers is midway between y=0 and y=1.45!
  // That guarantees S1, S2, S3 intersect at BOTH (0, 0, 0) [on Earth] and (0, 1.45, 0) [in outer space]!
  // And S4 is placed higher at y = 1.55 so its sphere passes through (0, 0, 0) and eliminates (0, 1.45, 0)!
  const SATS_3D = [
    {
      label: 'Satellitt 1',
      pos: [-1.18, 0.725, 0.35],
      colorHex: '#d94e34',
      rgb: [0.88, 0.28, 0.18]
    },
    {
      label: 'Satellitt 2',
      pos: [1.18, 0.725, 0.35],
      colorHex: '#2b6cb0',
      rgb: [0.16, 0.45, 0.78]
    },
    {
      label: 'Satellitt 3',
      pos: [0.0, 0.725, -1.24],
      colorHex: '#2b8a58',
      rgb: [0.16, 0.62, 0.36]
    },
    {
      label: 'Satellitt 4',
      pos: [0.35, 1.58, 0.92],
      colorHex: '#c78d20',
      rgb: [0.92, 0.60, 0.12]
    }
  ];

  // True radii so every sphere passes through P_earth = (0, 0, 0)
  SATS_3D.forEach((s) => {
    s.radius = Math.hypot(s.pos[0], s.pos[1], s.pos[2]);
  });

  // Project a 3D world point to 2D canvas coordinates (matching the WebGL shader camera!)
  function project3DTo2D(pt, camPos, camTarget) {
    const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const cross = (a, b) => [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
    const norm = (a) => {
      const l = Math.hypot(a[0], a[1], a[2]) || 1;
      return [a[0] / l, a[1] / l, a[2] / l];
    };

    const ww = norm(sub(camTarget, camPos));
    const uu = norm(cross(ww, [0, 1, 0]));
    const vv = norm(cross(uu, ww));

    const rel = sub(pt, camPos);
    const z = dot(rel, ww);
    if (z <= 0.1) return null;

    const fov = 1.85;
    const sx = (dot(rel, uu) / z) * fov;
    const sy = (dot(rel, vv) / z) * fov;

    const aspect = state.width / state.height;
    const ndcX = sx / aspect - 0.24;
    const ndcY = sy;

    return {
      x: (ndcX * 0.5 + 0.5) * state.width,
      y: (0.5 - ndcY * 0.5) * state.height
    };
  }

  function render3DChapters(chapId, localTime) {
    const numSpheres = chapId - 4; // Chap 5->1, Chap 6->2, Chap 7->3, Chap 8->4
    const orbitAngle = (state.globalTime - 66) * 0.16;
    const camDist = 5.35;
    const camPos = [
      Math.sin(orbitAngle) * camDist * 0.65,
      1.65 + Math.sin(orbitAngle * 0.5) * 0.25,
      Math.cos(orbitAngle) * camDist
    ];
    const camTarget = [0.0, 0.42, 0.0];

    const sphereArr = [];
    const colorArr = [];
    const weightArr = [];

    for (let i = 0; i < 4; i++) {
      const s = SATS_3D[i];
      const isNewest = i === numSpheres - 1;
      const w = i < numSpheres ? (isNewest ? smoothstep(0.0, 2.2, localTime) : 1.0) : 0.0;
      // Smoothly grow sphere radius as satellite arrives
      const rScale = isNewest ? smoothstep(0.2, 2.4, localTime) : 1.0;

      sphereArr.push(s.pos[0], s.pos[1], s.pos[2], s.radius * rScale);
      colorArr.push(s.rgb[0], s.rgb[1], s.rgb[2]);
      weightArr.push(w);
    }

    const showPatch = chapId >= 7 ? smoothstep(1.0, 3.0, chapId === 7 ? localTime : 10.0) : 0.0;

    // 1. Render volumetric spheres & glowing intersection circles in WebGL
    if (gl && glProg) {
      gl.useProgram(glProg);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);

      gl.uniform2f(glUniforms.res, glCanvas.width, glCanvas.height);
      gl.uniform1f(glUniforms.time, state.globalTime);
      gl.uniform1i(glUniforms.numSpheres, numSpheres);
      gl.uniform4fv(glUniforms.spheres, new Float32Array(sphereArr));
      gl.uniform3fv(glUniforms.colors, new Float32Array(colorArr));
      gl.uniform1fv(glUniforms.weights, new Float32Array(weightArr));
      gl.uniform3fv(glUniforms.camPos, new Float32Array(camPos));
      gl.uniform3fv(glUniforms.camTarget, new Float32Array(camTarget));
      gl.uniform1f(glUniforms.showPatch, showPatch);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    // 2. Overlay hand-drawn satellites, labels, 3D intersection callouts & car on zoomed Earth patch
    const pEarth2D = project3DTo2D([0, 0, 0], camPos, camTarget);
    const pSpace2D = project3DTo2D([0, 1.45, 0], camPos, camTarget);

    for (let i = 0; i < numSpheres; i++) {
      const s = SATS_3D[i];
      const w = weightArr[i];
      const pSat = project3DTo2D(s.pos, camPos, camTarget);
      if (pSat) {
        // Draw distance line from satellite center to the car on Earth
        if (pEarth2D && w > 0.4) {
          drawSketchLine(pSat.x, pSat.y, pEarth2D.x, pEarth2D.y, {
            color: s.colorHex,
            width: 1.8,
            alpha: w * 0.65,
            wobble: 1.4,
            passes: 1,
            seed: 500 + i
          });
        }
        drawSketchSatellite(pSat.x, pSat.y, s.colorHex, s.label, 0.85, w, 60 + i);
      }
    }

    // Chapter-specific 3D Geometric Annotations
    if (chapId === 5 && pEarth2D) {
      drawMathCallout(
        pEarth2D.x,
        pEarth2D.y + 52,
        '1 sfære i 3D = Hele kuleskallet er mulig',
        '(x − x₁)² + (y − y₁)² + (z − z₁)² = r₁²',
        '#d94e34',
        smoothstep(1.2, 2.8, localTime)
      );
    }

    if (chapId === 6 && pEarth2D) {
      const a = smoothstep(1.4, 3.0, localTime);
      drawMathCallout(
        pEarth2D.x,
        pEarth2D.y + 62,
        '2 sfærer møtes i en lysende 3D-sirkel!',
        'Skjæringen S₁ ∩ S₂ danner en ring i rommet',
        '#7c4dff',
        a
      );
    }

    if (chapId === 7 && pEarth2D && pSpace2D) {
      const a = smoothstep(1.5, 3.2, localTime);

      // Draw the car on the zoomed-in Earth patch at P_earth = (0,0,0)
      drawSketchCar(pEarth2D.x, pEarth2D.y, 0.15, {
        color: '#d94e34',
        scale: 0.92,
        alpha: a,
        label: 'P_jord (Bilen på bakken ✓)'
      });

      // Highlight the false space intersection point P_rom = (0, 1.45, 0) and cross it out!
      ctx.save();
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.arc(pSpace2D.x, pSpace2D.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = '#d94e34';
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      // Hand-drawn X over the rejected space point
      drawSketchLine(pSpace2D.x - 14, pSpace2D.y - 14, pSpace2D.x + 14, pSpace2D.y + 14, {
        color: '#b5361e',
        width: 3.2,
        alpha: a,
        seed: 701
      });
      drawSketchLine(pSpace2D.x + 14, pSpace2D.y - 14, pSpace2D.x - 14, pSpace2D.y + 14, {
        color: '#b5361e',
        width: 3.2,
        alpha: a,
        seed: 702
      });

      drawMathCallout(
        pSpace2D.x,
        pSpace2D.y - 34,
        'P_rom (Ute i verdensrommet — Forkastes!)',
        'Kun 2 skjæringspunkter når 3 kuler møtes',
        '#b5361e',
        a
      );
    }

    if (chapId === 8 && pEarth2D) {
      const a = smoothstep(1.2, 2.8, localTime);
      drawSketchCar(pEarth2D.x, pEarth2D.y, 0.15, {
        color: '#2b8a58',
        scale: 0.98,
        alpha: 1.0,
        label: 'Låst 3D-posisjon (x, y, z) + klokketid Δt!'
      });

      drawMathCallout(
        pEarth2D.x,
        pEarth2D.y + 56,
        'Alle 4 sfærer skjærer i ett punkt på jordutsnittet',
        'Breddegrad, lengdegrad, høyde og nanosekund-tid',
        '#1d6b42',
        a
      );
    }
  }

  // ============================================================================
  // 8. CHAPTER 9: HOW SATELLITES KNOW THEIR OWN POSITION & RELATIVITY (UiO)
  // ============================================================================
  function renderChapter9OrbitAndRelativity(localTime) {
    const { cx, cy, scale } = getStageCenter();
    const earthX = cx - scale * 0.06;
    const earthY = cy + scale * 0.04;
    const earthR = scale * 0.16;
    const orbitR = scale * 0.39;

    // 1. Draw Earth in crayon & pencil
    drawCrayonCircle(earthX, earthY, earthR, {
      color: '#2b6cb0',
      fillColor: 'rgba(43, 108, 176, 0.14)',
      width: 3.2,
      seed: 901
    });

    // Simple hand-drawn continents
    drawCrayonCircle(earthX - earthR * 0.25, earthY - earthR * 0.15, earthR * 0.35, {
      color: '#2b8a58',
      fillColor: 'rgba(43, 138, 88, 0.22)',
      width: 2.0,
      wobble: 4.5,
      seed: 902
    });
    drawMathCallout(earthX, earthY + 6, 'Jorden', 'R ≈ 6 371 km', '#1e5288', 0.95);

    // 2. Predicted Keplerian circular orbit (20 200 km)
    drawCrayonCircle(earthX, earthY, orbitR, {
      color: 'rgba(43, 108, 176, 0.45)',
      width: 2.2,
      wobble: 1.8,
      passes: 2,
      seed: 905
    });

    // 3. Perturbed actual satellite path (gravity anomalies / solar radiation pressure)
    //    and correction back to ephemeris!
    const satAngle = -Math.PI * 0.68 + localTime * 0.085;
    const driftWave = Math.sin(localTime * 1.4) * 18 * (1 - smoothstep(9.0, 13.0, localTime));
    const satX = earthX + Math.cos(satAngle) * (orbitR + driftWave);
    const satY = earthY + Math.sin(satAngle) * (orbitR + driftWave);

    // Draw perturbed path trail
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i <= 40; i++) {
      const a = satAngle - (i / 40) * 0.95;
      const dw = Math.sin((localTime - i * 0.08) * 1.4) * 16;
      const px = earthX + Math.cos(a) * (orbitR + dw);
      const py = earthY + Math.sin(a) * (orbitR + dw);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = '#d94e34';
    ctx.lineWidth = 2.6;
    ctx.stroke();
    ctx.restore();

    // 4. Ground Control Stations (Kontrollsegmentet) with Radar & Ephemeris Upload
    const stations = [
      { ang: -Math.PI * 0.78, name: 'Kontrollstasjon A (Radar)' },
      { ang: -Math.PI * 0.35, name: 'Kontrollstasjon B (Efemerider)' }
    ];

    stations.forEach((st, idx) => {
      const sx = earthX + Math.cos(st.ang) * earthR;
      const sy = earthY + Math.sin(st.ang) * earthR;

      // Radar dish icon on ground
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#d9822b';
      ctx.fill();
      ctx.strokeStyle = '#1d222b';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Radar measurement beam & Ephemeris upload waves
      drawSketchLine(sx, sy, satX, satY, {
        color: idx === 0 ? '#2b8a58' : '#d9822b',
        width: 2.0,
        alpha: 0.75,
        seed: 910 + idx
      });

      // Moving data packet along the beam
      const pT = ((localTime * 0.55 + idx * 0.4) % 1);
      const px = lerp(sx, satX, pT);
      const py = lerp(sy, satY, pT);
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fillStyle = idx === 0 ? '#2b8a58' : '#d9822b';
      ctx.fill();

      const labelPos = {
        x: earthX + Math.cos(st.ang) * (earthR + 42),
        y: earthY + Math.sin(st.ang) * (earthR + 42)
      };
      drawMathCallout(labelPos.x, labelPos.y, st.name, null, '#1d222b', 0.9);
    });

    drawSketchSatellite(satX, satY, '#d94e34', 'GPS-satellitt (20 200 km)', 1.05, 1.0, 99);

    // 5. Hand-drawn Relativistic Atomic Clock Comparison Card on the left side (UiO AST2000 math)
    const boxX = cx - scale * 0.44;
    const boxY = cy + scale * 0.22;
    drawMathCallout(
      boxX,
      boxY,
      'Spesiell relativitet (v = 3,87 km/s): −7 µs/døgn',
      'Generell relativitet (svakere tyngdekraft): +45 µs/døgn',
      '#b5361e',
      smoothstep(1.0, 2.5, localTime),
      'left'
    );
    drawMathCallout(
      boxX,
      boxY + 58,
      'Netto avvik: +38 µs per døgn (≈ 11,4 km feil/dag!)',
      'Atomklokkene justeres før oppskyting (UiO AST2000)',
      '#1d6b42',
      smoothstep(2.2, 3.8, localTime),
      'left'
    );
  }

  // ============================================================================
  // 9. CHAPTER 10: EXACT VELOCITY VIA DOPPLER SHIFT (MATHEMATICS DRAWN ON CANVAS)
  // ============================================================================
  function renderChapter10DopplerVelocity(localTime) {
    draw2DRoadAndLandscape(0.95);

    // Car moves smoothly along the road so we see live velocity vector v_vec and Doppler waves!
    const u = 0.25 + ((localTime / 17) * 0.52);
    const carPose = getRoadPose(u);
    const sats = get2DSatellites();

    // Active satellites for Doppler velocity demonstration:
    // Sat 2 (ahead of the car -> compressed waves, +Δf blue-shifted)
    // Sat 1 (behind the car -> stretched waves, -Δf red-shifted)
    // Sat 3 (to the side -> small radial component v*cos(θ₃))
    const dopplerSats = [sats[0], sats[1], sats[2]];

    dopplerSats.forEach((sat, idx) => {
      const dx = sat.x - carPose.x;
      const dy = sat.y - carPose.y;
      const dist = Math.hypot(dx, dy);
      const losAngle = Math.atan2(dy, dx);
      const theta = losAngle - carPose.angle;
      const cosTheta = Math.cos(theta); // > 0 means moving toward satellite, < 0 moving away

      // Draw line of sight
      drawSketchLine(sat.x, sat.y, carPose.x, carPose.y, {
        color: sat.color,
        width: 2.0,
        alpha: 0.7,
        seed: 1000 + idx
      });

      // Draw wavefront arcs along the line of sight showing compression (+Δf) vs stretching (-Δf)
      const numWaves = 9;
      const waveColor = cosTheta > 0.15 ? '#2b6cb0' : cosTheta < -0.15 ? '#d94e34' : '#2b8a58';
      for (let w = 1; w <= numWaves; w++) {
        // Compress wavelength when car moves toward satellite, stretch when moving away
        const spacingFactor = 1.0 - cosTheta * 0.28;
        const frac = ((w / numWaves + localTime * 0.25) % 1) * spacingFactor;
        const r = clamp(frac * dist * 0.85, 22, dist - 28);
        const dirFromSat = Math.atan2(carPose.y - sat.y, carPose.x - sat.x);
        drawSketchArc(sat.x, sat.y, r, dirFromSat - 0.16, dirFromSat + 0.16, {
          color: waveColor,
          width: 2.1,
          alpha: 0.65,
          seed: 1020 + w + idx * 20
        });
      }

      // Draw angle arc θ_i and radial velocity projection vector v_r,i = v * cos(θ_i) at the car
      drawSketchArc(carPose.x, carPose.y, 42 + idx * 8, carPose.angle, losAngle, {
        color: sat.color,
        width: 1.9,
        alpha: 0.85,
        seed: 1090 + idx
      });

      const vMag = 95;
      const vrLen = vMag * cosTheta;
      const ux = dx / dist;
      const uy = dy / dist;
      const projX = carPose.x + ux * vrLen;
      const projY = carPose.y + uy * vrLen;

      // Projection dashed/pencil drop-line from tip of velocity vector to line-of-sight
      const vTipX = carPose.x + Math.cos(carPose.angle) * vMag;
      const vTipY = carPose.y + Math.sin(carPose.angle) * vMag;
      drawSketchLine(vTipX, vTipY, projX, projY, {
        color: sat.color,
        width: 1.6,
        alpha: 0.65,
        seed: 1110 + idx
      });

      // Radial velocity vector along line of sight
      drawSketchArrow(carPose.x, carPose.y, projX, projY, {
        color: sat.color,
        width: 3.0,
        alpha: 0.95,
        headSize: 9,
        seed: 1120 + idx
      });

      // Math callout on each satellite ray showing Δf_i and v * cos(θ_i)
      const midX = lerp(sat.x, carPose.x, 0.45);
      const midY = lerp(sat.y, carPose.y, 0.45);
      const signStr = cosTheta >= 0 ? '+' : '−';
      const hzVal = Math.abs(Math.round(cosTheta * 118));
      drawMathCallout(
        midX,
        midY,
        `Δf_${idx + 1} = ${signStr}${hzVal} Hz  (θ_${idx + 1} = ${Math.round(( Math.abs(theta) * 180) / Math.PI)}°)`,
        `v_r,${idx + 1} = v · cos(θ_${idx + 1})`,
        sat.color,
        0.92
      );

      drawSketchSatellite(sat.x, sat.y, sat.color, sat.label, 1.0, 1.0, 1150 + idx);
    });

    // Draw the true velocity vector v_vec arrow straight ahead of the car
    const vTipX = carPose.x + Math.cos(carPose.angle) * 95;
    const vTipY = carPose.y + Math.sin(carPose.angle) * 95;
    drawSketchArrow(carPose.x, carPose.y, vTipX, vTipY, {
      color: '#1d222b',
      width: 3.6,
      headSize: 13,
      seed: 1199
    });
    drawMathCallout(
      vTipX + 18,
      vTipY - 16,
      'Hastighetsvektor v⃗ = 80,0 km/t',
      'Δf = −(v · cos θ / c) · f₀',
      '#1d222b',
      1.0
    );

    drawSketchCar(carPose.x, carPose.y, carPose.angle, {
      color: '#d94e34',
      stopped: false
    });
  }

  // ============================================================================
  // 10. CHAPTER 11: MULTIPATH ECHO & GHOST POSITIONS BEHIND GLASS BUILDING
  // ============================================================================
  function renderChapter11MultipathEcho(localTime) {
    const { cx, cy, scale } = getStageCenter();

    // Draw urban street & high-rise glass facade
    draw2DRoadAndLandscape(0.9);

    // Tall modern glass building next to the street
    const bldX = cx - scale * 0.08;
    const bldY = cy - scale * 0.14;
    const bldW = scale * 0.34;
    const bldH = 54;

    ctx.save();
    ctx.fillStyle = 'rgba(43, 108, 176, 0.18)';
    ctx.beginPath();
    ctx.roundRect(bldX, bldY - bldH, bldW, bldH, 6);
    ctx.fill();

    // Glass window grid lines
    for (let gx = bldX + 22; gx < bldX + bldW - 10; gx += 26) {
      drawSketchLine(gx, bldY - bldH + 4, gx, bldY - 4, {
        color: 'rgba(43, 108, 176, 0.4)',
        width: 1.4,
        wobble: 0.6,
        passes: 1,
        seed: gx
      });
    }
    // Mirror reflective bottom facade edge
    drawSketchLine(bldX, bldY, bldX + bldW, bldY, {
      color: '#2b6cb0',
      width: 4.0,
      wobble: 1.0,
      seed: 1201
    });
    ctx.restore();

    drawMathCallout(
      bldX + bldW * 0.5,
      bldY - bldH - 14,
      'Høy glassbygning (reflekterer radiobølger som et speil)',
      null,
      '#1e5288',
      0.95
    );

    // Car drives into the urban canyon behind/under the glass building and stops to show the echo geometry
    const u = localTime < 3.6 ? lerp(0.25, 0.54, smoothstep(0, 3.6, localTime)) : 0.54;
    const carPose = getRoadPose(u);
    const sats = get2DSatellites();
    const sat1 = sats[0]; // Red satellite whose signal bounces off the glass facade
    const sat2 = sats[1]; // Blue satellite with clean direct signal

    drawSketchSatellite(sat1.x, sat1.y, sat1.color, sat1.label, 1.0, 1.0, 1210);
    drawSketchSatellite(sat2.x, sat2.y, sat2.color, sat2.label, 1.0, 1.0, 1211);

    // Clean circle from Sat 2
    const r2 = Math.hypot(carPose.x - sat2.x, carPose.y - sat2.y);
    drawCrayonCircle(sat2.x, sat2.y, r2, {
      color: sat2.color,
      width: 2.6,
      alpha: 0.75,
      seed: 1212
    });

    // True direct distance d_direkte from Sat 1 vs Reflected path via the glass wall!
    const bounceX = bldX + bldW * 0.58;
    const bounceY = bldY;
    const dDirect = Math.hypot(carPose.x - sat1.x, carPose.y - sat1.y);
    const dLeg1 = Math.hypot(bounceX - sat1.x, bounceY - sat1.y);
    const dLeg2 = Math.hypot(carPose.x - bounceX, carPose.y - bounceY);
    const dEcho = dLeg1 + dLeg2;

    // 1. Direct green/faint path (partially obstructed)
    drawSketchLine(sat1.x, sat1.y, carPose.x, carPose.y, {
      color: '#2b8a58',
      width: 2.0,
      alpha: 0.55,
      seed: 1220
    });
    drawCrayonCircle(sat1.x, sat1.y, dDirect, {
      color: '#2b8a58',
      width: 2.2,
      alpha: 0.5,
      seed: 1221
    });

    // 2. Reflected Multipath Echo Ray (Sat 1 -> Glass Facade -> Car)
    const echoAnim = smoothstep(1.2, 3.5, localTime);
    drawSketchLine(sat1.x, sat1.y, bounceX, bounceY, {
      color: '#d94e34',
      width: 3.0,
      alpha: echoAnim,
      progress: clamp(echoAnim * 1.4, 0, 1),
      seed: 1230
    });
    drawSketchArrow(bounceX, bounceY, carPose.x, carPose.y, {
      color: '#d94e34',
      width: 3.0,
      alpha: echoAnim,
      progress: clamp((echoAnim - 0.3) * 1.4, 0, 1),
      seed: 1231
    });

    // Bounce flash on glass building
    if (echoAnim > 0.3) {
      ctx.beginPath();
      ctx.arc(bounceX, bounceY, 7, 0, Math.PI * 2);
      ctx.fillStyle = '#d94e34';
      ctx.fill();
    }

    // 3. Expanded false circle of radius d_ekko = d1 + d2 > d_direkte
    if (echoAnim > 0.5) {
      const a = smoothstep(0.5, 1.0, echoAnim);
      drawCrayonCircle(sat1.x, sat1.y, dEcho, {
        color: '#d94e34',
        fillColor: 'rgba(217, 78, 52, 0.06)',
        width: 3.4,
        alpha: a,
        seed: 1240
      });

      // Find the Ghost Car position where the expanded echo circle intersects Sat 2's circle!
      const ghostCandidates = intersectTwoCircles(sat1.x, sat1.y, dEcho, sat2.x, sat2.y, r2);
      if (ghostCandidates.length) {
        const ghostPt = ghostCandidates.reduce((best, p) =>
          Math.hypot(p.x - carPose.x, p.y - carPose.y) < Math.hypot(best.x - carPose.x, best.y - carPose.y)
            ? p
            : best
        );

        // Draw displacement arrow from real car to ghost car
        drawSketchArrow(carPose.x, carPose.y, ghostPt.x, ghostPt.y, {
          color: '#7c4dff',
          width: 2.6,
          alpha: a,
          seed: 1250
        });

        drawSketchCar(ghostPt.x, ghostPt.y, carPose.angle + 0.12, {
          isGhost: true,
          alpha: a,
          scale: 1.0,
          label: 'Spøkelsesposisjon (GPS tror du er her!)'
        });

        drawMathCallout(
          (carPose.x + ghostPt.x) * 0.5,
          Math.max(carPose.y, ghostPt.y) + 46,
          'Ekko-omvei: d_ekko = d₁ + d₂ > d_direkte',
          'Forstørret rød sirkel flytter skjæringspunktet!',
          '#b5361e',
          a
        );
      }
    }

    drawSketchCar(carPose.x, carPose.y, carPose.angle, {
      color: '#2b8a58',
      stopped: localTime >= 3.6,
      label: 'Faktisk bil'
    });
  }

  // ============================================================================
  // 11. CHAPTER 12: GPS JAMMING & SIGNAL-TO-NOISE COLLAPSE
  // ============================================================================
  function renderChapter12Jamming(localTime) {
    const { cx, cy, scale } = getStageCenter();
    draw2DRoadAndLandscape(0.9);

    const carPose = getRoadPose(0.56);
    const sats = get2DSatellites();

    // Jammer transmitter placed near the road
    const jamX = cx + scale * 0.14;
    const jamY = cy + scale * 0.14;
    const jamPower = smoothstep(1.5, 5.5, localTime);

    // 1. Draw satellites with fragile, attenuating signals from 20 200 km away
    sats.slice(0, 3).forEach((sat, idx) => {
      drawSketchSatellite(sat.x, sat.y, sat.color, sat.label, 0.95, 1.0, 1300 + idx);

      const r = Math.hypot(carPose.x - sat.x, carPose.y - sat.y);
      // As jammer power rises, the delicate satellite circles jitter and dissolve!
      const survivingAlpha = clamp(1.0 - jamPower * 0.78, 0.16, 1.0);
      const jitterWobble = 2.4 + jamPower * 14.0;

      drawCrayonCircle(sat.x, sat.y, r, {
        color: sat.color,
        width: 2.6,
        alpha: survivingAlpha,
        wobble: jitterWobble,
        passes: 2,
        seed: 1310 + idx + Math.floor(localTime * 6)
      });

      drawSketchLine(sat.x, sat.y, carPose.x, carPose.y, {
        color: sat.color,
        width: 1.8,
        alpha: survivingAlpha,
        wobble: 2.0 + jamPower * 9.0,
        seed: 1320 + idx
      });
    });

    // 2. Draw the Jammer tower & aggressive expanding crimson interference rings
    ctx.save();
    ctx.translate(jamX, jamY);
    // Jammer antenna mast
    drawSketchLine(-12, 18, 0, -16, { color: '#b5361e', width: 2.8, wobble: 0.8, seed: 1350 });
    drawSketchLine(12, 18, 0, -16, { color: '#b5361e', width: 2.8, wobble: 0.8, seed: 1351 });
    drawSketchLine(-8, 4, 8, 4, { color: '#b5361e', width: 2.2, wobble: 0.8, seed: 1352 });
    ctx.beginPath();
    ctx.arc(0, -18, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#d94e34';
    ctx.fill();
    ctx.restore();

    drawMathCallout(
      jamX,
      jamY + 38,
      'Lokal Jammer (Støysender på 1575,42 MHz)',
      'P_jammer ≫ P_satellitt (−130 dBm)',
      '#b5361e',
      0.95
    );

    if (jamPower > 0.05) {
      for (let w = 0; w < 4; w++) {
        const phase = ((localTime * 0.55 + w * 0.25) % 1);
        const rad = 20 + phase * scale * 0.42;
        drawCrayonCircle(jamX, jamY, rad, {
          color: '#d94e34',
          width: 3.4,
          alpha: (1 - phase) * jamPower * 0.85,
          wobble: 6.5,
          passes: 2,
          seed: 1360 + w + Math.floor(localTime * 8)
        });
      }
    }

    // 3. Draw car & rapidly expanding uncertainty cloud when SNR collapses
    drawSketchCar(carPose.x, carPose.y, carPose.angle, {
      color: jamPower > 0.6 ? '#7b818f' : '#d94e34',
      stopped: false,
      label: jamPower > 0.6 ? 'Ingen GPS-lås! (Kun usikkert estimat)' : 'GPS-lås aktiv'
    });

    if (jamPower > 0.35) {
      const errRad = 25 + jamPower * 68;
      drawCrayonCircle(carPose.x, carPose.y, errRad, {
        color: '#b5361e',
        fillColor: 'rgba(217, 78, 52, 0.14)',
        width: 2.5,
        alpha: jamPower,
        wobble: 5.5,
        seed: 1390
      });
    }
  }

  // ============================================================================
  // 12. MAIN ANIMATION LOOP & SMOOTH CROSSFADE TRANSITIONS
  // ============================================================================
  function renderFrame(now) {
    const dt = Math.min(0.05, (now - state.lastFrameTs) / 1000);
    state.lastFrameTs = now;

    if (state.playing) {
      state.globalTime += dt;
      if (state.globalTime >= TOTAL_DURATION) {
        state.globalTime = 0;
      }
    }

    // Determine active chapter from globalTime
    let chapIdx = CHAPTERS.findIndex(
      (c) => state.globalTime >= c.startTime && state.globalTime < c.endTime
    );
    if (chapIdx === -1) chapIdx = CHAPTERS.length - 1;

    const chap = CHAPTERS[chapIdx];
    const localTime = state.globalTime - chap.startTime;

    updateNarrativePanel(chapIdx);

    // Update UI timeline & segment bars
    timeCurrent.textContent = formatTime(state.globalTime);
    timelineSlider.value = String(Math.round((state.globalTime / TOTAL_DURATION) * 1000));
    CHAPTERS.forEach((c, i) => {
      let pct = 0;
      if (i < chapIdx) pct = 100;
      else if (i === chapIdx) pct = clamp((localTime / c.duration) * 100, 0, 100);
      segmentFills[i].style.width = `${pct}%`;
    });

    // Clear 2D Sketch Canvas
    ctx.save();
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
    ctx.clearRect(0, 0, state.width, state.height);

    // Dispatch chapter rendering
    if (chap.id >= 1 && chap.id <= 4) {
      render2DTrilaterationChapters(chap.id, localTime);
    } else if (chap.id >= 5 && chap.id <= 8) {
      render3DChapters(chap.id, localTime);
    } else if (chap.id === 9) {
      renderChapter9OrbitAndRelativity(localTime);
    } else if (chap.id === 10) {
      renderChapter10DopplerVelocity(localTime);
    } else if (chap.id === 11) {
      renderChapter11MultipathEcho(localTime);
    } else if (chap.id === 12) {
      renderChapter12Jamming(localTime);
    }

    ctx.restore();
    requestAnimationFrame(renderFrame);
  }

  // Initialize first chapter and start playback
  updateNarrativePanel(0);
  requestAnimationFrame(renderFrame);
})();
