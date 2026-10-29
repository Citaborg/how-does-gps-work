# Kontroll av aktiv tidsbruk, 29. oktober 2026

Arbeidsreferanse: GitHub #4. Grunnlag: `1e3be454d20282b3b3cfdd3db4756c7e22d61411`.
Gren: `codex/gps-active-time`. Klasse R, dokumentasjons- og tekstendring.

- `docs/TIMING.json` inneholder seks målinger med kildefil, rekordgrenser,
  originale tidsstempler, deløkter og fratrekk. En lokal kontroll sammenholdt
  alle start-/sluttpunkter med dialogene, bruker-/assistentroller, ferdigmeldinger,
  manifestenes SHA-256, delsummer, pauser, avrunding og artikkel/README: bestått.
- Interaktiv referanse: 10 avgrensede turer, hvorav ni implementering/kontroll
  (25:26) og én separat publisering (0:25). Ni brukerpauser summerer til 25:38.
  Fordelingen summerer eksakt til de opprinnelige 51:29.
- Argons blokkerte forforsøk: 0:34 aktivt; vellykket kjøring 5:54; samlet 6:28.
  Pausen før ny bestilling på 0:48 er utelatt. De fem hovedkjøringene har ingen
  venting mellom ferdigmelding og neste brukerbestilling innenfor målegrensene.
- Ingen vilkårlig inaktivitetsgrense eller anslag over token-/prosessortid brukes.
  Verktøy, egenkontroll og publisering blandet inn i implementeringsturer inngår;
  dette forbeholdet står eksplisitt ved målingene.
- Lokal Chromium-kontroll av endret artikkel ved 1440×900 og 390×900: korrekte
  tidsverdier og tabellnavn; ingen horisontal sideoverflyt eller JavaScript-feil.
  Mobilskjermbildet er inspisert. Første tekstassert krevde små bokstaver, mens
  eksisterende CSS viser tabellnavnet i versaler. DOM-kontroll bekreftet riktig
  kildetekst; assert ble gjort uavhengig av bokstavstørrelse. Ingen produktfeil.
- Målrettet lead-review av diff, tidsregning og registrerte resultater: ingen
  gjenstående funn. Appkode, sesjonsutdrag og publiseringskode er uendret.
  Ingen appbygg eller full apptest kjørt for denne tekstendringen.
- `git diff --check`: bestått. Offentlig kontroll registreres på #4 og PR etter
  merge/publisering. Bare `gps/index.html` skal publiseres, med privat backup
  og kontroll av forventet før-/etterhash. Den tidligere 11-filspubliseringen
  skal ikke kjøres om igjen for denne rettelsen.
