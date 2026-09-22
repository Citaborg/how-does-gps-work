/**
 * GPS Story & Scenario Engine
 * 12 focused scenarios grouped in 4 distinct themes with smooth transitions and deep educational math.
 */

window.GPSStory = {
  activeSceneIndex: 0,
  sceneTime: 0,
  totalElapsed: 0,
  isPlaying: true,
  playbackSpeed: 1.0,
  totalDuration: 120, // 10s per scene * 12 = 120s (2 min)

  scenes: [
    /* ==========================================================================
       TEMA 1: 2D TRILATERASJON I PLANET
       ========================================================================== */
    {
      id: '2d_1sat',
      chapter: '2d',
      tema: 'Tema 1: 2D Trilaterasjon',
      num: '01 / 12',
      badge: 'SCENARIO 01 // 2D GEOMETRI',
      title: 'Én Satellitt: Avstandssirkelen',
      duration: 10,
      text: 'Satellitten sender et tidsstempel med lysets hastighet <span class="hl-cyan">c</span>. Mottakeren i bilen måler tidsforsinkelsen <span class="hl-cyan">Δt</span>. Avstanden beregnes som <span class="hl-cyan">d = c · Δt</span>.',
      formula: 'd = c · Δt = \\sqrt{Δx^2 + Δy^2}',
      subformula: 'Pytagoras: Rettvinklet trekant fra satellitt til bil',
      subtext: 'Bilen bremser mykt ned og stopper akkurat der den er for å beregne. Avstanden d danner én hel sirkel av uendelig mange mulige posisjoner.'
    },
    {
      id: '2d_2sat',
      chapter: '2d',
      tema: 'Tema 1: 2D Trilaterasjon',
      num: '02 / 12',
      badge: 'SCENARIO 02 // 2D SIRKELSKJÆRING',
      title: 'To Satellitter: To Mulige Punkter',
      duration: 10,
      text: 'Satellitt 2 flyr inn og tenner sin <span class="hl-magenta">magenta sirkel</span>. De to sirklene skjærer hverandre i <span class="hl-gold">nøyaktig to punkter</span>: Punkt A (bilen) og Punkt B (speilpunktet).',
      formula: '(x - x_1)^2 + (y - y_1)^2 = d_1^2 \\quad \\& \\quad (x - x_2)^2 + (y - y_2)^2 = d_2^2',
      subformula: 'To sirkelligninger gir 2 skjæringspunkter langs en solid kordelinje',
      subtext: 'Den felles korden halverer usikkerheten, men mottakeren må ha et tredje referansepunkt for å vite hvilket punkt som er det sanne.'
    },
    {
      id: '2d_3sat',
      chapter: '2d',
      tema: 'Tema 1: 2D Trilaterasjon',
      num: '03 / 12',
      badge: 'SCENARIO 03 // 2D LÅST POSISJON',
      title: 'Tre Satellitter: Posisjon Låst i Planet',
      duration: 10,
      text: 'Satellitt 3 tenner sin <span class="hl-gold">gylne sirkel</span>. Den treffer nøyaktig i Punkt A, mens Punkt B forkastes. Bilen har nå en 100% entydig (x, y)-posisjon i planet.',
      formula: '(x - x_i)^2 + (y - y_i)^2 = d_i^2 \\quad (i = 1, 2, 3)',
      subformula: 'Tre uavhengige sirkler gir nøyaktig 1 felles skjæringspunkt (x, y)',
      subtext: 'Trekantene fra satellittene låser bilens koordinater. Dette forutsetter imidlertid at bilens klokke tikker i perfekt takt med atomurene i rommet!'
    },
    {
      id: '2d_4sat_clock',
      chapter: '2d',
      tema: 'Tema 1: 2D Trilaterasjon',
      num: '04 / 12',
      badge: 'SCENARIO 04 // FEILTREKANT & ATOMTID',
      title: 'Klokkefeil: Se Feiltrekanten Oppstå & Kollapse',
      duration: 10,
      text: 'Mottakeren i bilen har en rimelig kvartsklokke med et tidsavvik <span class="hl-rose">δt</span>. Dette forskyver alle tre avstandsmålinger likt: sirklene møtes ikke i ett punkt, men danner en <span class="hl-rose">rød feiltrekant</span> rundt bilen. Når Satellitt 4 kobles inn, løses <span class="hl-emerald">δt</span>, og feiltrekanten kollapser umiddelbart til ett eksakt punkt!',
      formula: 'ρ_i = d_i + c · δt_{mottaker} \\quad (i = 1..4)',
      subformula: '3 sirkler med felles feil δt danner en feiltrekant — 4. satellitt eliminerer δt og kollapser trekanten',
      subtext: 'Selv 1 mikrosekund klokkefeil gir ~300 meter avvik (c · 1 μs). Med fire satellitter løses både posisjon (x, y) og klokkefeil (δt) samtidig — kvartsuret oppnår atomur-presisjon gratis!'
    },

    /* ==========================================================================
       TEMA 2: 3D ROMGEOMETRI & SFÆRESKJÆRING
       ========================================================================== */
    {
      id: '2d_to_3d_1sat',
      chapter: '3d',
      tema: 'Tema 2: 3D Romgeometri & Sfærer',
      num: '05 / 12',
      badge: 'SCENARIO 05 // 3D KULESFÆRE',
      title: 'I Rommet: Kulesfære rundt Satellitten',
      duration: 10,
      text: 'Vi hever blikket ut i 3D-rommet over det regionale landskapet. Avstanden blir til en <span class="hl-cyan">lysende, volumetrisk kulesfære</span> med radius d rundt satellitten.',
      formula: '(x - x_1)^2 + (y - y_1)^2 + (z - z_1)^2 = d_1^2',
      subformula: '3D Kulesfære: (x, y, z) befinner seg på kuleflaten',
      subtext: 'Bilen befinner seg et sted på overflaten av denne transparente sfæren som når ned til bakken. Én sfære gir uendelig mange mulige posisjoner i 3D.'
    },
    {
      id: '3d_2sat',
      chapter: '3d',
      tema: 'Tema 2: 3D Romgeometri & Sfærer',
      num: '06 / 12',
      badge: 'SCENARIO 06 // 3D SIRKELRING',
      title: 'To Sfærer Skjærer i en Solid 3D-Sirkel',
      duration: 10,
      text: 'Satellitt 2 flyr inn og legger til sin <span class="hl-magenta">magenta sfære</span>. Der kulene skjærer hverandre, dannes en <span class="hl-cyan">solid, lysende 3D-sirkelring i rommet</span>.',
      formula: 'Sfære_1 \\cap Sfære_2 = \\text{Solid 3D-sirkel i radikalplanet}',
      subformula: 'Skjæringen mellom to kuler er en eksakt 1D-sirkel i 3D-rommet',
      subtext: 'Mulige posisjoner er nå dramatisk innskrenket fra en hel kuleflate til denne lysende ringen som strekker seg fra himmelen ned til veien.'
    },
    {
      id: '3d_3sat',
      chapter: '3d',
      tema: 'Tema 2: 3D Romgeometri & Sfærer',
      num: '07 / 12',
      badge: 'SCENARIO 07 // TO PUNKTER I 3D',
      title: 'Tre Sfærer gir To Punkter: Bakke vs Rom',
      duration: 10,
      text: 'Satellitt 3 tenner sin <span class="hl-gold">gylne sfære</span>. Den kutter 3D-ringen i <span class="hl-gold">nøyaktig to punkter</span>:<br>' +
            '• <span class="hl-emerald">Punkt 1 (Bakken):</span> Nede på veien der bilen kjører (h = 84 m).<br>' +
            '• <span class="hl-rose">Punkt 2 (Rommet):</span> Høyde h ≈ 12 400 km ute i verdensrommet!<br>' +
            '<span class="hl-rose">Hvorfor Punkt 2 enkelt forkastes:</span> En bil kan ikke sveve i tomt rom!',
      formula: '3 \\text{ Sfærer} = 2 \\text{ Skjæringspunkter i 3D}',
      subformula: 'Punkt 1 (Jorden, h = 84 m) vs Punkt 2 (Verdensrommet, h ≈ 12 400 km)',
      subtext: 'GPS-mottakeren forkaster umiddelbart Punkt 2 fordi høyden er fysisk absurd for et bakkekjøretøy. Bakkeplasseringen er dermed i praksis allerede løst!'
    },
    {
      id: '3d_4sat',
      chapter: '3d',
      tema: 'Tema 2: 3D Romgeometri & Sfærer',
      num: '08 / 12',
      badge: 'SCENARIO 08 // FULL 3D LÅS & ATOMTID',
      title: 'Fire Sfærer: Matematisk Bevis & Kvartsur',
      duration: 10,
      text: 'Den fjerde sfæren (<span class="hl-emerald">smaragd</span>) bekrefter Punkt 1 matematisk og beviser at Punkt 2 var falskt. I tillegg løses mottakerens tidsavvik <span class="hl-emerald">δt</span>.',
      formula: '\\sqrt{(x-x_i)^2 + (y-y_i)^2 + (z-z_i)^2} + c · δt = ρ_i \\quad (i=1..4)',
      subformula: '4 Ligninger for 4 Ukjente: Breddegrad, Lengdegrad, Høyde og Tid',
      subtext: 'Bilens kvartsur oppnår atomur-synkronisering med rommet. Koordinatene låses i WGS-84 med millimeterpresisjon.'
    },

    /* ==========================================================================
       TEMA 3: HASTIGHET & EINSTEINS RELATIVITETSTEORI
       ========================================================================== */
    {
      id: 'velocity_doppler',
      chapter: 'velocity',
      tema: 'Tema 3: Hastighet & Relativitet (UiO)',
      num: '09 / 12',
      badge: 'SCENARIO 09 // BÆREBØLGE & HASTIGHET',
      title: 'Fartsberegning via Doppler-effekt',
      duration: 10,
      text: 'GPS måler ikke bilens fart ved å derivere støyete posisjoner. I stedet måles frekvensforskyvningen (<span class="hl-cyan">Doppler-effekten</span>) på bærebølgen L1 = 1575.42 MHz.',
      formula: 'Δf = -f_0 · \\frac{\\mathbf{v} · \\hat{\\mathbf{u}}_{LOS}}{c} = -\\frac{\\mathbf{v} · \\hat{\\mathbf{u}}_{LOS}}{\\lambda}',
      subformula: 'λ ≈ 19.03 cm | v = Bilens øyeblikkelige 3D fartsvektor',
      subtext: 'Bølgene presses sammen foran bilen (+Δf, blåskift) og strekkes bak (-Δf, rødskift). Dette gir bilens øyeblikkelige fart med under ±0.03 km/t feilmargin!'
    },
    {
      id: 'orbit_relativity',
      chapter: 'orbit',
      tema: 'Tema 3: Hastighet & Relativitet (UiO)',
      num: '10 / 12',
      badge: 'SCENARIO 10 // BANER & EINSTEIN (UiO)',
      title: 'Bakkestasjoner & Relativitetsteori',
      duration: 10,
      text: 'Bakkestasjoner måler satellittens bane med radar og laster opp efemerider. Einsteins relativitetsteori er uunnværlig:',
      formula: 'Δt_{net} = +45.7\\ \\mu s\\text{ (GR)} - 7.1\\ \\mu s\\text{ (SR)} = +38.6\\ \\mu s/\\text{dag}',
      subformula: 'Akkumulert posisjonsfeil: c · Δt_{net} ≈ 11.57 km per dag!',
      subtext: 'Uten Einsteins formler ville GPS feilet med over 11 kilometer per dag! Satellittklokkene tunes til 10.22999999543 MHz før oppskytning for å tikke i nøyaktig 10.23 MHz på Jorden.'
    },

    /* ==========================================================================
       TEMA 4: SIGNALFORHOLD, EKKO & SÅRBARHET
       ========================================================================== */
    {
      id: 'multipath_echo',
      chapter: 'multipath',
      tema: 'Tema 4: Signalforhold & Jamming',
      num: '11 / 12',
      badge: 'SCENARIO 11 // URBAN CANYON & SPØKELSESPOSISJON',
      title: 'Glassbygning, Ekko & Spøkelsesposisjoner',
      duration: 10,
      text: 'Når bilen kjører inn bak en <span class="hl-cyan">glassbygning</span>, blokkeres den direkte siktlinjen (NLOS). Signalet spretter i stedet via en motstående glassfasade. Den ekstra omveien forsinker signalet med bare noen nanosekunder — men nok til at GPS-mottakeren lures og tegner en <span class="hl-rose">spøkelsesposisjon 45 meter feil</span>, midt inne i bygget!',
      formula: 'ρ_{falsk} = c · (t + τ) = d_{direkte} + \\Delta d_{omvei}',
      subformula: 'Omvei Δd = 45 m gir tidsforsinkelse τ = Δd / c ≈ 150 ns → Spøkelsesposisjon!',
      subtext: 'GPS-brikken antar alltid at signalet reiser i en rett linje. Uten direkte siktlinje gir refleksjonen en forlenget pseudorange. Avanserte mottakere bruker L1+L5 tofrekvens og 3D-kartmatching for å oppdage og forkaste ekkoet.'
    },
    {
      id: 'jamming_spoofing',
      chapter: 'jamming',
      tema: 'Tema 4: Signalforhold & Jamming',
      num: '12 / 12',
      badge: 'SCENARIO 12 // ELEKTRONISK KRIGFØRING',
      title: 'GPS-Sårbarhet: Jamming & Spoofing',
      duration: 10,
      text: 'Signalet fra rommet er ekstremt svakt (<span class="hl-cyan">-160 dBW ≈ 10⁻¹⁶ W</span>). En lokal 1W støysender overdøver signalet og slår ut navigasjonen. En <span class="hl-gold">spoofer</span> sender falske signaler for å villede bilen.',
      formula: 'P_{GPS} \\approx -160\\text{ dBW} \\ll P_{Jammer} \\approx 0\\text{ dBW (1 W)}',
      subformula: 'Jammeren er over 10 000 000 000 000 000 ganger sterkere lokalt!',
      subtext: 'Forsvares med fase-styrte nullformingsantenner (CRPA) og krypterte militære signaler.'
    }
  ],

  init() {
    this.totalDuration = this.scenes.reduce((acc, s) => acc + s.duration, 0);
  },

  getCurrentScene() {
    return this.scenes[this.activeSceneIndex];
  },

  setScene(index) {
    this.activeSceneIndex = GPSMath.clamp(index, 0, this.scenes.length - 1);
    this.sceneTime = 0;
    this.updateTotalElapsed();
  },

  nextScene() {
    if (this.activeSceneIndex < this.scenes.length - 1) {
      this.setScene(this.activeSceneIndex + 1);
    } else {
      this.setScene(0);
    }
  },

  prevScene() {
    if (this.activeSceneIndex > 0) {
      this.setScene(this.activeSceneIndex - 1);
    }
  },

  seekToProgress(progress) {
    const targetSeconds = progress * this.totalDuration;
    let accumulated = 0;
    for (let i = 0; i < this.scenes.length; i++) {
      if (accumulated + this.scenes[i].duration >= targetSeconds || i === this.scenes.length - 1) {
        this.activeSceneIndex = i;
        this.sceneTime = targetSeconds - accumulated;
        this.totalElapsed = targetSeconds;
        break;
      }
      accumulated += this.scenes[i].duration;
    }
  },

  updateTotalElapsed() {
    let accumulated = 0;
    for (let i = 0; i < this.activeSceneIndex; i++) {
      accumulated += this.scenes[i].duration;
    }
    this.totalElapsed = accumulated + this.sceneTime;
  },

  update(dt) {
    if (!this.isPlaying) return;

    const scaledDt = dt * this.playbackSpeed;
    this.sceneTime += scaledDt;
    this.totalElapsed += scaledDt;

    const currentScene = this.getCurrentScene();
    if (this.sceneTime >= currentScene.duration) {
      if (this.activeSceneIndex < this.scenes.length - 1) {
        this.activeSceneIndex++;
        this.sceneTime = 0;
      } else {
        this.activeSceneIndex = 0;
        this.sceneTime = 0;
        this.totalElapsed = 0;
      }
    }
  }
};
