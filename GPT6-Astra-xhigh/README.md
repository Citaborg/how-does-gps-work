# Hvordan GPS virker — Astra

En norsk, sammenhengende animert fortelling på 5 minutter og 45 sekunder, laget fra instruksjonene i [USER_PROMPTS.md](USER_PROMPTS.md). 17 kapitler, et rolig papirpreg, Canvas-skisser og transparente 3D-kuleflater med Three.js. Ingen innlogging, analyseverktøy eller eksterne forespørsler under avspilling. Skriftene leveres lokalt med sine OFL-lisenser.

Publiseringsmål: **https://www.bredland.no/gps/astra/**, montert som `Y:\bredland.no\gps\astra`. Domenet uten `www` har en eksisterende videresending til `http://www.bredland.no`; bruk den direkte HTTPS-adressen over. Domenets felles oppsett er ikke endret.

Arbeidsoppgave: `WI#how-does-gps-work/0002` i `X:\repos\docs\ai\wi\how-does-gps-work\0002-astra-gps-story.json`.

## Kjør lokalt

Krever en støttet Node-versjon for Vite 8 (testet med Node 24.18.0 og npm 12.0.2).

```powershell
npm ci
npm run dev -- --port 5173 --strictPort
```

Åpne http://127.0.0.1:5173/. Fortellingen starter automatisk, unntatt når operativsystemet ber om redusert bevegelse. Mellomrom spiller/pauser, piltastene flytter fem sekunder, Home/End går til starten/slutten og F åpner fullskjerm. Standard tastaturadferd beholdes når en kontroll har fokus.

## Kontroller og bygg

```powershell
npm test
npm run test:browser
npm run build
```

Nettlesertestene bruker installert Microsoft Edge og starter en lokal Vite-server ved behov. De verifiserer avspilling, pause, 17 kapittelvalg, spoling, hastighet, tastatur, avslutning, redusert bevegelse og layout på 1920 × 1080 og 390 × 844. Skjermbilder havner i `test-results/`. Geometritestene kontrollerer sirkel-/kuleskjæringer, feiltilpasning, Doppler, signalkollisjon med bygninger og bilens sammenhengende bevegelse.

## Publiser

Kjør kun når publisering til målet er autorisert:

```powershell
.\scripts\publish.ps1
.\scripts\verify-public.ps1
```

Skriptet bygger siden, tar en hashkontrollert lokal kopi dersom målområdet allerede finnes, kopierer ressurser før `index.html`, og verifiserer SHA-256 for alle publiserte filer. Bare `dist/` publiseres. Kildekode, brukerprompter, tester og arbeidsnotater blir ikke kopiert. Tidligere versjoner og manifest ligger i `.local/`. Ingen andre GPS-varianter eller mapper berøres.

Tilbakerulling: dersom en tidligere versjon finnes, kopier filene fra den oppgitte `.local/backups/astra-<tidspunkt>/` tilbake til nøyaktig samme målområde, ressurser først og `index.html` sist. Ved første publisering finnes ingen tidligere versjon; gjenopprett ved å bygge og publisere den ønskede kildeversjonen. Stopp publisering dersom bygg, funksjonstester eller hashkontroll feiler.

## Innhold og modell

- `src/story.js`: fortelling, kapitler og tidspunkter.
- `src/sketch.js`: skisser, siktelinjer, refleksjoner, matematiske overlegg og forklaringer.
- `src/space.js`: faktiske 3D-kuler og beregnede skjæringssirkler, med projiserte Canvas-markeringer.
- `src/geometry.js`: ren matematikk for skjæringer, minste kvadrater, Doppler, blokkering og deterministisk bilbevegelse.
- `src/main.js`: avspilling, spoling, kapittelvalg og tilpasning av skjermflaten.

Sirkel- og kulemodellen starter med kjent klokke og ideelle avstander. Deretter innføres én felles mottakerklokkefeil. Avstandsflater er ikke signaldekning. Feiltrekanten er en pedagogisk illustrasjon, og dens lilla punkt er en beregnet minste-kvadraters tilpasning. Satellitter holdes stille i Doppler-skissen; teksten og ligningen forklarer korreksjon for deres virkelige bevegelse og klokkedrift. Ekkoet følger en speilkonstruksjon og vises bare når begge delene av refleksjonsveien er frie. Spøkelsesposisjonen er skjematisk.

Avstander, bølger og tid er ikke i målestokk. UiO-bloggens regneeksempler gjelder en modellplanet; de brukes ikke som tall for GPS rundt jorden. Kilder og forenklinger er tilgjengelige i sidens footer. Jamming forklares som signal som overdøves av støy, uten praktiske instruksjoner.

## Arbeid og kontroll

Prosjektmappen hadde bare `USER_PROMPTS.md` ved oppstart. Den ligger under workspace-repositoriet `X:\repos`, gren `main`, grunnrevisjon `245e5429a14be04df3d37e1930b807a7149bae1e`. Workspace sin rotregel i `.gitignore` ignorerer prosjektet. Ingen commit eller push er utført; publisering skjer med de bygde filene til den bestilte mappen. Eksisterende, uvedkommende endringer i workspace er bevart. Gemini-/Fable-variantene er ikke brukt.

Se [VALIDATION.md](VALIDATION.md) for kontrollbevis og publiseringsstatus.
