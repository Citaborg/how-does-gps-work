# Kontroll og publisering

Dato: 2026-09-22. Arbeidsoppgave: `WI#how-does-gps-work/0002`.

## Akseptanse

- 17 sammenhengende kapitler / 345 sekunder: intro; 1–4 satellitter i 2D; 1–4 satellitter i 3D; kontrollsegment; relativitet; posisjon/fart; Doppler; feiltrekant; byrefleksjoner; jamming; avslutning.
- Avspilling, pause, spoling, kapittelvelger, hastighet og fullskjerm. Tekst i høyre del på desktop, under illustrasjonen på mobil. Footer med UiO-lenken.
- Geometrisk korrekte skjæringer, to mulige 3D-punkter med eksplisitt høydeprior, og fire ukjente inkludert klokke. Kuleflater vokser inn og skjæringslinjer er heltrukne.
- Bilen stanser uten sprang. Alle satellittenes avstandsgeometri vises. Fartsvektor og Doppler-projeksjon bruker både x- og y-bevegelse.
- Feiltrekanten bygges fra de parvise sirkelskjæringene. Anslått posisjon beregnes med minste kvadrater.
- Direkte og reflekterte signalveier kontrolleres mot bygningen; en kort periode med helt blokkert signal er synlig før ekkoet kommer frem.

## Verifisert lokalt

- `npm test`: 9 tester bestått. Omfatter skjæringer, tangent/disjunkt geometri, minste-kvadraters minimum, Doppler mot endring i avstand, blokkering av begge ekkoben, kontinuerlig bilbevegelse og samme vei i begge retninger.
- `npm run test:browser`: 8 av 8 tester bestått på endelig kode (17,8 sekunder), inkludert fullskjerm med korrekt papirbakgrunn og retur til vanlig visning.
- `npm run build`: Vite-produksjonsbygg bestått. Relative ressursstier støtter publisering under `/gps/astra/`.
- Visuell kontroll i Edge og gjennom Playwright-skjermbilder. Full HD og mobil 390 × 844. Alle 17 kapitler søker til et faktisk bilde 10 sekunder inn i kapitlet; det aktive kapittelet verifiseres eksplisitt.
- Ingen runtime-/konsollfeil i den lokale nettlesersuiten. Installerte avhengigheter rapporterte 0 sårbarheter ved `npm install`.

## Uavhengig gjennomgang

Sol/high gjorde en lesende gjennomgang av prosjektets nye kildefiler. Fire konkrete funn ble rettet og kontrollert på nytt: full vektor i Doppler-tegningen, fysisk blokkering av refleksjonsveien, «Neste» i sluttkapitlet og tidsriktig visning av kuleskjæringer. Ingen andre varianter ble åpnet. En etterfølgende visuell kontroll fant og rettet returbanen til bilen og innrammingen av fire kuleflater.

## Publiseringsstatus

Publisert og verifisert: **https://www.bredland.no/gps/astra/**. Mål: `Y:\bredland.no\gps\astra`.

- Siste publiseringsmanifest: `.local/publish-20260922-133329.json`.
- Alle 10 bygde filer er SHA-256-verifisert både mot den monterte målmappen og HTTP-responsen fra offentlig HTTPS-adresse. Nettstedet svarer HTTP 200. Bevis: `.local/public-verification.json`; gjenta med `scripts/verify-public.ps1`.
- Publisert `index.html`: SHA-256 `769036071BEE00BADA0D13D0F70BCB22A4B940A6534BE449277A61FF76474B5D`.
- Offentlig Edge-kontroll bekreftet automatisk avspilling gjennom første kapittelovergang, pause, kapittelvelger med 17 kapitler, spoling til 3D og fullskjerm. Den første fullskjermkontrollen avslørte svart bakgrunn fra nettleserens fullscreen-flate; eksplisitt papirbakgrunn ble lagt på appen, regresjonstest lagt til, og korrigeringen publisert og visuelt kontrollert på nytt.
- Før korrigeringspubliseringen ble forrige versjon kopiert og hash-verifisert til `.local/backups/astra-20260922-133329/`. Publiseringsskriptet berørte bare den bestilte undermappen.

Før publisering var målområdet fraværende, og det offentlige HTTPS-endepunktet svarte HTTP 404. Det eksisterende domenet uten `www` videresender til HTTP; dette ligger utenfor siden og er ikke endret. Den direkte HTTPS-adressen med `www` brukes ved verifikasjon og levering.

## Avgrensninger

Dette er en undervisningsmodell, ikke en virkelig GNSS-mottaker eller måledataserie. Ingen lydspor. Hovedmål er desktop/Full HD; mobil beholder alle kapitler og kontroller, men de tegnede detaljene blir mindre. WebGL brukes i normal 3D-visning; uten WebGL vises en merket, projisert skisse. Den eksplisitte WebGL-reserven er ikke kvalifisert på fysisk maskinvare uten WebGL. Ingen git-commit/push er utført; leveransen er publisert som bygde statiske filer etter brukerens bestilling.
