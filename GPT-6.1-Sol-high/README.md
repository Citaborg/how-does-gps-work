# GPS · En liten fortelling om å finne fram

Et selvstendig svar på den vedlagte norske GPS-oppgaven, laget i `GPT-6.1-Sol-high/`. De andre modellenes løsningsfiler er ikke lest. Dette beskriver den opprinnelige appkjøringen. Sammenligningssiden er senere oppdatert separat.

Fortellingen varer **6 minutter og 7 sekunder**, med 18 kapitler. Den bruker varmt papir, stabile blyantstreker, fargede avstandssirkler og transparente kuleflater. Forklaringene følger tegningene i høyre kant. Ingen lyd.

## Åpne lokalt

Du trenger Node.js, men ingen pakkeinstallasjon:

```powershell
cd GPT-6.1-Sol-high
npm start
```

Åpne **http://127.0.0.1:4176/**. `PORT` kan settes dersom porten er opptatt. Serveren lytter bare lokalt. Nettstedet kan også serveres som vanlige statiske filer fra denne mappen. Bruk HTTP; ES-modulene lastes ikke normalt fra `file://`.

## Betjening

- Spill/pause med knappen eller mellomrom når ingen kontroll har fokus.
- Dra tidslinjen for å spole. Pil venstre/høyre flytter ti sekunder når ingen kontroll har fokus.
- Velg et kapittel, eller bruk forrige/neste. Forrige starter gjeldende kapittel på nytt hvis det har gått mer enn tre sekunder.
- Velg 0,75×, 1×, 1,5× eller 2×. Fullskjerm finnes på større skjermer når nettleseren støtter det.
- «Om & kilder» inneholder lesestoffet. UiO-lenken står også nederst til høyre på skrivebordet.

Dialoger pauser avspillingen og gjenoppretter forrige avspillingsstatus når de lukkes. En skjult nettleserfane lar tiden vente. Ved operativsystemets innstilling for redusert bevegelse starter siden pauset; man kan spille av eller velge stillbilder selv.

## Reisen

| Tid | Tema |
|---|---|
| 0:00 | En bil og et lite spørsmål |
| 0:18–1:29 | Én, to, tre og fire satellitter på et 2D-ark |
| 1:29 | Fra sirkel til kuleflate |
| 1:41–3:04 | Én, to, tre og fire satellitter i 3D |
| 3:04 | Kontrollstasjoner, banemodell og navigasjonsdata |
| 3:30 | Atomklokker og relativitet |
| 3:52 | Gjennomsnittsfart fra to posisjoner |
| 4:12 | Doppler, siktelinjer og hastighetsvektor |
| 4:39 | Feiltrekanten og satellittgeometri |
| 5:01 | Skjerming, refleksjon og mulig spøkelsesposisjon |
| 5:27 | Jamming og tap av posisjon |
| 5:49 | Tilbake på veien |

## Faglige og visuelle forenklinger

- De første 2D- og 3D-scenene antar ideelle klokker. Tre sirkler kan da bestemme et punkt i 2D; tre kuler gir vanligvis to punkter i 3D. I praksis løser mottakeren posisjon og klokkefeil samtidig. I 2D er det tre ukjente; i 3D er det fire. Ekstra signaler gir redundans, men god geometri og kvalitetskontroll er også nødvendig.
- Sirkel-, kule- og trippelskjæringer beregnes geometrisk. Kuleflatene rendres med analytiske stråle/kule-skjæringer i en egen WebGL-renderer, med begge overflater i dybderekkefølge. Sterkere farger følger overflatenes faktiske skjæringer. En rolig kameravinkel gir dybde. Uten WebGL vises en enklere Canvas-illustrasjon med de samme projiserte skjæringskurvene; denne reservevisningen er ikke en nøyaktig strålerendering av kuleflatene.
- Kuleoppstillingen er et lokalt, fritt skalert geometrieksempel, ikke en fysisk GPS-konstellasjon. Bakken er en forstørret lokal flate ved bilen. Høyde brukes som eksplisitt tilleggskunnskap for å forkaste den andre kandidaten i tre-kule-eksemplet.
- Klokkekorreksjonen animeres som en kjent felles endring i radiene for å synliggjøre prinsippet. Dette er ikke en GNSS-mottaker. En separat, testet iterativ pseudorange-løser kontrollerer det matematiske fire-ukjente-prinsippet.
- Avstand-, bølge-, klokke-, avviks- og bevegelsesskalaene er illustrative. Bilens bevegelse og stopp bestemmes av tidslinjen, slik at spoling gjenskaper samme sted uten akkumulerte hopp.
- Dopplerformelen viser siktelinjeprojeksjonen av relativ hastighet og mottakerens klokkedrift. Satellittklokkens bidrag og øvrige korreksjoner er underforstått korrigert i denne forenklede modellen. Fire uavhengige målinger kan gi tre hastighetskomponenter og klokkedrift; diagrammet tegnes på et 2D-ark.
- Feiltrekanten er en geometrisk illustrasjon, med et forstørret utsnitt. Den er ikke en statistisk konfidensregion. En virkelig mottaker bruker flere, vektede målinger.
- Refleksjonspunktet beregnes ved speiling i fasaden. Den bleke bilen er en kandidat på den falske avstandsgrensen fra ett forsinket signal, ikke en utregnet GPS-løsning fra en hel konstellasjon. Skjermtekst sier dette eksplisitt. Jamming vises bare som støy og mottakstap.

## Kilder

- [UiO, Ellen og Erica · GPS, AST2000, 2024](https://www.uio.no/studier/emner/matnat/astro/AST2000/h24/blogger/bloggen-til-ellen-og-erica/9-generell-relativitet/gps(1).html). Referansen fra oppgaven. Artikkelen bruker en modellplanet; jordens GPS-tall er kontrollert separat.
- [GPS.gov · Control Segment](https://www.gps.gov/control-segment).
- [FAA · GPS – How It Works](https://www.faa.gov/about/office_org/headquarters_offices/ato/service_units/techops/navservices/gnss/gps/howitworks).
- [GPS.gov · GPS Accuracy](https://www.gps.gov/gps-accuracy).
- [NIST · Putting Einstein to the Test](https://www.nist.gov/atomic-clocks/a-powerful-tool-for-science/putting-einstein-test).
- [ESA Navipedia · GNSS Basic Observables](https://gssc.esa.int/navipedia/index.php/GNSS_Basic_Observables).

## Kontroller

```powershell
npm run check
```

Syntakskontroll og Node-tester for sirkelkandidater, skjæringssirkler, tre-/fire-kulegeometri, pseudorange og klokkefeil, feiltrekant gjennom hele overgangen, dopplerfortegn og kameraprojeksjon.

En ekstra nettlesertest ligger i `tests/browser.mjs`. Den krever et tilgjengelig Playwright med Chromium, og en kjørende lokal server. Den installerer ingenting:

```powershell
# Playwright må kunne finnes av Node, eventuelt via NODE_PATH.
# Valgfritt: GPS_TEST_URL og GPS_SCREENSHOTS (mappe for skjermbilder).
node tests/browser.mjs
```

Testen besøker alle 18 scener og alle automatiske kapittelgrenser, bruker avspillingskontrollene, sjekker deterministisk tilbakespoling, dialoger, tastatur, 2× hastighet, Full HD, mobil, redusert bevegelse og reservevisning uten WebGL. Den fanger kjøringsfeil og uventede nettverkskall. Visuell gjennomgang kommer i tillegg; beståtte skjermtester er ikke en garanti for alle nettlesere eller GPU-er.

## Filer

`index.html` og `style.css` gir grensesnittet. `app.js` eier fortelling, avspilling og tegninger. `geometry.js` inneholder geometrien og måleprinsippene. `spheres.js` tegner kuleflatene. Alt er lokalt, uten eksterne skrifter, biblioteker eller bildefiler. Kode følger repoets MIT-lisens.

Opphavsøkten tok **24:17** fra bestilling til første ferdigmelding; se [sesjonsutdrag](sessions/creation.jsonl) og [målemetode](../docs/SESSION_EVIDENCE.md). Arbeidsreferanser: `WI#how-does-gps-work/0005` og GitHub #2.
