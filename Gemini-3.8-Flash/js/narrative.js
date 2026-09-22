/**
 * narrative.js
 * Pedagogisk fortellertekst og kapittelstruktur for GPS-visualiseringen
 * Tekstene smyger seg rolig inn og ut i høyre panel i takt med tidslinjen.
 */

export const CHAPTERS = [
  {
    id: 1,
    title: '1. Grunnprinsippet: Tid = Avstand',
    subtitle: 'Hvordan radiobølger med lysets hastighet blir til avstandsmålinger',
    mode: '2D',
    sceneMode: 'trilateration',
    duration: 22,
    satellitesActive: 1,
    clockBias: 0,
    carStopped: false,
    text: `
      <h3>Radiosignaler og lysets hastighet</h3>
      <p class="lead">En GPS-mottaker i en bil eller mobiltelefon sender aldri signaler ut – <strong>den lytter bare passivt</strong>.</p>
      <p>GPS-satellittene sender kontinuerlig ut radiobølger. Signalet inneholder to kritiske opplysninger:</p>
      <ul>
        <li><strong>Nøyaktig tidsstempel ($t_0$)</strong> for når signalet forlot satellitten (fra atomklokken om bord).</li>
        <li><strong>Satellittens posisjon</strong> i rommet akkurat da (efemeride-data).</li>
      </ul>
      <div class="formula-card">
        <span class="formula-label">AVSTANDSFORMEL:</span>
        <div class="formula-math">$$r = c \\cdot \\Delta t = c \\cdot (t_{\\text{mottatt}} - t_{\\text{sendt}})$$</div>
        <div class="formula-desc">Der $c \\approx 299\\,792\\text{ km/s}$ er lysets hastighet.</div>
      </div>
      <p>Når mottakeren kjenner avstanden til én satellitt, vet den at den befinner seg på en sirkel (i 2D) eller en sfære (i 3D) rundt satellitten.</p>
    `
  },
  {
    id: 2,
    title: '2. 2D Trilaterasjon & Feiltrekanten',
    subtitle: 'Fra 1 til 4 satellitter, vinkelberegninger og eliminering av klokkefeil',
    mode: '2D',
    sceneMode: 'trilateration',
    duration: 38,
    satellitesActive: 2,
    clockBias: 0,
    carStopped: true,
    text: `
      <h3>Kryssende sirkler og feiltrekanten</h3>
      <p>La oss bygge opp trilaterasjonen steg for steg i to dimensjoner:</p>
      
      <div class="step-card">
        <strong>1. Satellitt 1:</strong> Bilen kan befinne seg på et uendelig antall punkter langs sirkel $r_1$.
      </div>
      <div class="step-card">
        <strong>2. Satellitt 2:</strong> Sirkel $r_2$ legges til. To sirkler skjærer hverandre i nøyaktig <strong>to punkter</strong> ($P_1$ og $P_2$). Bilen stopper, og vi skisserer geometrien med trekanter og vinkler!
      </div>
      <div class="step-card">
        <strong>3. Satellitt 3:</strong> Sirkel $r_3$ kutter bort det falske punktet og gir ett unikt skjæringspunkt dersom klokkene er perfekte.
      </div>
      <div class="step-card highlight">
        <strong>4. Feiltrekanten (Klokkebias):</strong> Bilen har ikke en millionkroners atomklokke, men et billig kvartsur med en liten tidsfeil ($\\Delta t$). 
        Bare $1\\,\\mu\\text{s}$ feil gir en avviksfeil på $300\\text{ meter}$! Sirklene møtes ikke lenger i ett punkt, men danner en <strong>feiltrekant</strong>.
      </div>
      <div class="step-card">
        <strong>5. Satellitt 4:</strong> Løser for bilens klokkefeil $\\Delta t$. Feiltrekanten kollapser til ett knappenålspresis punkt, og bilens klokke synkroniseres atomnøyaktig!
      </div>
    `
  },
  {
    id: 3,
    title: '3. 3D Trilaterasjon: Kuler & Skjæringsringer',
    subtitle: 'Hvordan sfærer i rommet begrenser bilens posisjon i tre dimensjoner',
    mode: '3D',
    sceneMode: '3d_spheres',
    duration: 34,
    satellitesActive: 4,
    carStopped: false,
    text: `
      <h3>Sfærisk geometri i det tredimensjonale rom</h3>
      <p>I virkeligheten lever vi i et 3D-rom. Her erstattes sirkler med kuler (sfærer):</p>
      <ul>
        <li><strong>1 Sfære:</strong> Bilen kan være hvor som helst på sfærens 2D-overflate i rommet.</li>
        <li><strong>2 Sfærer:</strong> Skjæringen mellom to kuler danner en <strong>perfekt 3D-sirkel</strong> (en skjæringsring markert med lysende fargemiks).</li>
        <li><strong>3 Sfærer:</strong> Kutter skjæringsringen i nøyaktig <strong>to diskrete punkter</strong> i rommet!</li>
      </ul>
      <div class="formula-card">
        <span class="formula-label">HVILKET PUNKT FORKASTES?</span>
        <p>Det ene punktet ligger ved jordoverflaten. Det andre punktet havner enten <em>titusenvis av kilometer ute i verdensrommet</em> eller <em>dypt inne i jordens kjerne</em>. Mottakeren kan enkelt forkaste det umulige punktet!</p>
      </div>
      <p><strong>4. Sfære:</strong> Fjerner enhver tvil, bekrefter $(x, y, z)$ og nøyaktig høyde over havet, samt eliminerer mottakerens klokkefeil.</p>
      <div class="tip-box">
        💡 <em>Du kan rotere, panorere og zoome i 3D-modellen ved å dra med musen eller berøringsskjermen!</em>
      </div>
    `
  },
  {
    id: 4,
    title: '4. Hastighetsberegning via Doppler-effekten',
    subtitle: 'Hvordan frekvensforskyvning på radiobølgene måler fart direkte',
    mode: '2D',
    sceneMode: 'doppler',
    duration: 25,
    satellitesActive: 1,
    carStopped: false,
    text: `
      <h3>Momentan fart uten posisjonsstøy</h3>
      <p class="lead">Visste du at bilens speedometer fra GPS ikke beregnes ved å dele tilbakelagt avstand på tid?</p>
      <p>Å derivere posisjoner gir hakkete og forsinkede målinger. I stedet måler GPS-mottakeren <strong>Doppler-effekten</strong> direkte på radiobølgens bærefrekvens ($L_1 = 1575.42\\text{ MHz}$):</p>
      
      <div class="formula-card">
        <span class="formula-label">DOPPLER-FORMEL:</span>
        <div class="formula-math">$$\\Delta f = - f_0 \\frac{\\mathbf{v}_{\\text{bil}} \\cdot \\hat{\\mathbf{u}}}{c} = - f_0 \\frac{v_{\\text{radial}}}{c}$$</div>
        <div class="formula-desc">Bølgene presses sammen foran bilen (blåskift) og strekkes ut bak bilen (rødskift).</div>
      </div>
      <p>Ved å måle frekvensskiftet $\\Delta f$ mot fire eller flere satellitter, beregner mottakeren bilens komplette 3D-hastighetsvektor $(v_x, v_y, v_z)$ med centimeternøyaktighet hvert eneste brøkdels sekund!</p>
    `
  },
  {
    id: 5,
    title: '5. Hvordan vet satellitten sin posisjon? & Relativitet',
    subtitle: 'Kontrollsegmentet, efemeridedata og Einsteins relativitetsteori (UiO AST2000)',
    mode: '2D',
    sceneMode: 'orbit_relativity',
    duration: 32,
    satellitesActive: 1,
    carStopped: true,
    text: `
      <h3>Bakkestasjoner og Einsteins tidskorreksjon</h3>
      <p>For at bilen skal vite hvor den er, må satellittene vite sin egen bane med millimeterpresisjon.</p>
      <ul>
        <li><strong>Keplers baner:</strong> Satellittene kretser i stabile baner ca. $20\\,200\\text{ km}$ over jorden med hastighet $v \\approx 3.87\\text{ km/s}$.</li>
        <li><strong>Kontrollsegmentet:</strong> Radarstasjoner på bakken overvåker satellittene kontinuerlig og kalkulerer baneavvik (pga. ujevn gravitasjon, solstormer og månetrekk). Oppdaterte banedata (<strong>efemerider</strong>) sendes opp via radio.</li>
      </ul>
      
      <div class="formula-card">
        <span class="formula-label">RELATIVITETSTEORI (UiO-PENSUM):</span>
        <p>Satellittenes atomur påvirkes av to motsatte relativistiske effekter:</p>
        <ol>
          <li><strong>Spesiell relativitet (fart):</strong> Satellittens høye hastighet gjør at klokken går saktere: $\\approx -7.2\\,\\mu\\text{s/dag}$.</li>
          <li><strong>Generell relativitet (gravitasjon):</strong> Svakere gravitasjonsfelt i $20\\,200\\text{ km}$ høyde gjør at klokken går raskere: $\\approx +45.9\\,\\mu\\text{s/dag}$.</li>
        </ol>
        <div class="formula-math">$$\\Delta t_{\\text{netto}} = +45.9 - 7.2 = \\mathbf{+38.7\\,\\mu\\text{s per døgn}}$$</div>
        <p>Uten korreksjon ville tidsfeilen gitt en posisjonsfeil på <strong>$11.6\\text{ km}$ hver eneste dag!</strong></p>
      </div>
      <p><strong>Løsningen:</strong> Før oppskyting stilles satellittenes atomur ned fra $10.23\\text{ MHz}$ til nøyaktig $10.22999999543\\text{ MHz}$, slik at de i bane tikker synkront med jorden!</p>
    `
  },
  {
    id: 6,
    title: '6. Ekko & Flervei: Glassbygninger og Spøkelsesposisjoner',
    subtitle: 'Når signalet reflekteres fra glassfasader og skaper falske posisjoner',
    mode: '2D',
    sceneMode: 'multipath',
    duration: 26,
    satellitesActive: 1,
    carStopped: false,
    text: `
      <h3>Multipath og urbane signalfeller</h3>
      <p class="lead">Når du kjører mellom høye bygninger med glass- eller metallfasader, kan GPS-en plutselig tro at du kjører inne i en bygning eller i nabogaten.</p>
      <p>Dette kalles <strong>Multipath (flerveisutbredelse)</strong>:</p>
      <ul>
        <li>Den direkte siktlinjen (Line-of-Sight) til satellitten blokkeres av bygget.</li>
        <li>Satellittens radiobølge treffer en speilende glassfasade og reflekteres ned til bilens mottakerantenne.</li>
      </ul>
      <div class="formula-card">
        <span class="formula-label">EKKO-FORSINKELSE:</span>
        <p>Refleksjonsveien er alltid lenger enn den rette linjen:</p>
        <div class="formula-math">$$d_{\\text{reflektert}} = d_{\\text{direkte}} + \\Delta d$$</div>
        <p>Mottakeren vet ikke at signalet har sprettet, og antar at signalet reiste rett frem. Dermed beregnes en <strong>spøkelsesposisjon</strong> titalls meter forskjøvet!</p>
      </div>
    `
  },
  {
    id: 7,
    title: '7. Signalstyrke, Jamming og Spoofing',
    subtitle: 'Hvor sårbare er satellittsignalene mot forstyrrelser og angrep?',
    mode: '2D',
    sceneMode: 'jamming',
    duration: 26,
    satellitesActive: 3,
    carStopped: false,
    text: `
      <h3>Svake signaler og elektronisk krigføring</h3>
      <p>GPS-satellittene sender med en sendereffekt på under $50\\text{ W}$. Når signalet når jorden etter $20\\,200\\text{ km}$, er signalstyrken under:</p>
      <div class="formula-card">
        <div class="formula-math">$$P_{\\text{mottatt}} \\approx -160\\text{ dBW} \\approx 10^{-16}\\text{ Watt}$$</div>
        <div class="formula-desc">Dette tilsvarer lyset fra en lommelykt på månen sett fra jorden – svakere enn den termiske bakgrunnsstøyen!</div>
      </div>
      
      <h4>Hvordan virker jamming?</h4>
      <p>En enkel jammer på bare 1 Watt plassert på bakken sender ut radiostøy på GPS-frekvensen ($1575.42\\text{ MHz}$). Fordi jammeren er så nær bilen, overdøver den satellittsignalene med over $50\\text{ dB}$:</p>
      <ul>
        <li>Mottakeren mister fasesynkroniseringen («carrier lock»).</li>
        <li>Signal-til-støy-forholdet (C/N₀) stuper til null.</li>
        <li>Bilens navigasjonssystem går i sort med advarselen <em>«SIGNAL TAPT»</em>.</li>
      </ul>
      <p><strong>Spoofing:</strong> Ved spoofing sender angriperen falske, kalkulerte signaler for aktivt å narre bilen til å tro den befinner seg et helt annet sted!</p>
    `
  }
];
