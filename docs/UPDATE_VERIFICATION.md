# Kontroll av GPS- og bredland-oppdateringen

Arbeidsgrunnlag: `main` / `1512057ab2002172b41928a3f060073f245ccf5a`.
Isolert gren: `codex/gps-sol-evidence`. Arbeidsreferanse: GitHub #2.
Den opprinnelige utsjekkingen ble ikke endret. Ingen andre modellers runtimekode
er endret; Argons notat har fått dokumentert tid og alle appene sesjonsutdrag.

## Resultater 29. oktober 2026

- `npm --prefix GPT-6.1-Sol-high run check`: bestått, syntaks og **8/8** geometritester.
- `node GPT-6.1-Sol-high/tests/browser.mjs` med lokalt Playwright/Chromium:
  bestått, **18 kapitler / 17 automatiske grenser**, spiller, spoling, dialoger,
  tastatur, 2×, mobil, redusert bevegelse, WebGL og reservevisning. Ingen
  kjøringsfeil eller eksterne avspillingskall. Samme fem runtimefiler som første
  levering, kontrollert byte for byte mot originalen.
- **11 sesjonsutdrag**: JSONL og manifest lest, rekordtall og SHA-256 kontrollert;
  ingen absolutte stier i de parsede dialogtekstene. Originaler er sikkerhetskopiert
  privat og hashkontrollert. Modellvalg, grenser, varighet og tokentellere er
  sammenholdt med de aktuelle native loggene. Eksportøren stopper på sannsynlige
  credential-mønstre; ingen slik match oppstod i den eksporterte teksten.
- Sammenligning og forside/prosjekter kontrollert i lokal forhåndsvisning ved
  **1440×900** og **390×900**: fem appkort, 15 bilder som lastes, begge tabeller
  med seks kolonner, nye tidsverdier, Sensio-/Club-tekst og produktsidelenker.
  Ingen sidebredde-overflyt eller JavaScript-feil. Sol-lenken ble fulgt under
  `/gps/gpt-61-sol-high/` og kapittelvelger brukt der, slik at relativ lasting
  er kontrollert under den planlagte URL-stien. Skjermbilder inspisert i tillegg.
- `python scripts/publish.py --web-root <nettstedets lokale rot>` uten `--apply`:
  **11 filer** forberedt lokalt og hashkontrollert. Det skriver ikke til nettstedet.
- Første forhåndsvisningstest hadde en for streng tekstsjekk: CSS viser datoen i
  versaler, mens testen forventet små bokstaver. DOM-teksten ble undersøkt og
  sjekken gjort uavhengig av bokstavstørrelse; ingen innholdsendring var nødvendig.
- Første eksportørkontroll antok at Antigravity-stegnummer var en tett indeks i
  JSONL-filen. Den stoppet ved et hopp i stegene. Sluttgrensen tas nå fra native
  stegnummer og siste medfølgende tidsstempel. En annen kontroll av rå JSON
  forvekslet en kolon etterfulgt av escaped linjeskift med en disksti; kontrollen
  bruker nå den parsede tekstverdien. Ingen funn ble ignorert ved uendret omkjøring.

## Gjennomgang og publisering

Lead har gjennomgått Sol-kode, avgrensningene, de konkrete tekstendringene,
sesjonsutdragene og kontrollresultatene. En liten visuell mismatch mellom
jamming-sonens ytterkant og mottakstapet er dokumentert og bevart som del av
originalsvaret. Det er ingen identifisert blokkerende appfeil i lead-gjennomgangen.

Pålagt uavhengig Opus/high-review er **ikke fullført**. Ett forsøk identifiserte
`claude-opus-5-5`, men ble avvist av ukekvoten med reset 31. oktober kl. 05:00
Europe/Oslo. Ingen review ble utført, og kontogrensen er ikke forsøkt omgått.
Samme-familie kontroll erstatter ikke dette kravet. Grenen kan derfor forberedes
som PR, men ikke merkes ferdig, merges eller publiseres uten pålagt review eller
et uttrykkelig unntak fra eieren.

Publiseringsskriptet har en eksplisitt liste over fem Sol-runtimefiler, tre nye
bilder, sammenlignings-HTML og de to eksisterende bredland-sidene. Før-utdrag må
matche nøyaktig én gang. Ved `--apply` kreves et nytt privat backupsted utenfor
Git og nettroten; alle gamle filer og en hashmanifest lagres og kontrolleres før
noe overskrives. Nye filer fremgår av manifestet med `before: null`. Det gjøres
ingen sletting eller speiling av de tidligere modellappene. Filer publiseres med
midlertidig fil og navnebytte, og hashkontrolleres etterpå. En feil midt i
publisering kan gi delvis oppdatering; backupmanifestet angir hva som må gjenopprettes.
En HTTP- og nettleserkontroll av det offentlige nettstedet gjenstår til faktisk
publisering. Lokal filkontroll alene er ikke publiseringsbevis.
