# Opphavet til GPS-svarene

Kontrollert 29. oktober 2026. Hver app har en `sessions/`-mappe med avgrensede
JSONL-utdrag og manifest med opprinnelig sesjons-ID, kildefilens SHA-256,
inklusive linje-/steggrenser og utdragets SHA-256. Dialogene er lesbare uten et
bestemt KI-verktøy. Den felles bestillingen ligger i [USER_PROMPTS.md](../USER_PROMPTS.md).

## Tid: fra bestilling til første ferdigmelding

Her måles **veggklokketid**, uten skjønnsmessig fratrekk for «inaktivitet».
Verktøy og egenkontroll inngår. Fable og Astra ble også bedt om å publisere i
samme tur; deres ferdigmeldinger inkluderer dette. Det er derfor ikke en ren
måling av kodegenerering eller modellhastighet. Sekunder er avrundet til nærmeste
hele sekund. Tidene fra den gamle artikkelen (29 og 39 minutter) var oppgitt som
aktiv tid og kan ikke sammenlignes direkte med disse grensene.

| Svar | Start UTC | Første ferdigmelding UTC | Tid | Utdrag |
|---|---|---|---|---|
| Claude Fable 5.1 | 20.09 12:17:54.542 | 20.09 12:50:59.142 | **33:05** | [dialog](../Fable-5.1-xhigh/sessions/creation.jsonl) |
| Gemini 3.8 Flash | 22.09 12:49:31 | 22.09 12:54:48 | **5:17** | [dialog](../Gemini-3.8-Flash/sessions/creation.jsonl) |
| GPT-6 Astra | 22.09 10:57:55.054 | 22.09 11:36:05.774 | **38:11** | [dialog](../GPT6-Astra-xhigh/sessions/creation.jsonl) |
| Gemini 4 Argon | 26.10 08:10:30 | 26.10 08:16:24 | **5:54** | [dialog](../Agy-Argon4/sessions/creation.jsonl) |
| GPT-6.1 Sol/high | 29.10 16:45:51.720 | 29.10 17:10:08.716 | **24:17** | [dialog](../GPT-6.1-Sol-high/sessions/creation.jsonl) |
| Interaktiv Gemini-referanse | 20.09 11:15:03 | 20.09 12:06:32 | **51:29**, inkludert brukerpauser | [dialog](../Gemini-3.8-Flash-interactive/sessions/creation.jsonl) |

Fable sier «Alt ser riktig ut. Deployer» klokken 12:49:56.277: **32:02** til
kontrollpunktet før publisering. Astra sier «Siden er klar for publisering»
11:31:33.278: **33:38**. En feil i Astras fullskjermbakgrunn ble oppdaget og
rettet under den etterfølgende publiseringskontrollen. Første ferdigmelding er
derfor hovedmålet, med dette forbeholdet synlig.

## Forsøk og oppfølging

- Fable har også et [avbrutt forforsøk](../Fable-5.1-xhigh/sessions/aborted-attempt.jsonl),
  12:08–12:16 den 20. september. Det er ikke lagt til tiden for hovedkjøringen.
  Første levering var 10:11 lang. Brukeroppfølging 13:20 ba om avslutning, og
  oppfølging 13:50 ba om en ny innledning. Dagens side på 10:33 er dermed ikke
  et helt urørt engangssvar. Disse senere turene er utenfor opphavsutdraget.
- Flash har et [tidligere forsøk](../Gemini-3.8-Flash/sessions/earlier-attempt.jsonl)
  12:44:57–12:47:53. Hovedøkten startet 12:49:31, med en presisering fra brukeren
  12 sekunder senere. Fra presiseringen til ferdigmeldingen var det **5:05**.
- Astra ble først avbrutt etter en ufullstendig bestilling. Hovedutdraget starter
  ved den fullstendige bestillingen 10:57:55. To selvvalgte underagenter er bevart:
  [geometri og nettlesertester](../GPT6-Astra-xhigh/sessions/geometry-agent.jsonl)
  på GPT-5.6 Terra/medium og [gjennomgang](../GPT6-Astra-xhigh/sessions/review-agent.jsonl)
  på GPT-5.6 Sol/high. Tiden deres er parallell og skal ikke summeres til hovedtiden.
- Argons [første forsøk](../Agy-Argon4/sessions/blocked-attempt.jsonl) stoppet i
  en lokal verktøyhook. Den vellykkede, gjentatte bestillingen tok **5:54**;
  inkludert forforsøket var det **7:16**. Turen om commit/PR/publisering klokken
  11:41 er utelatt. Notatets «ca. 6 min» er nå erstattet med loggmålingen.
- Den interaktive referansen begynte med Gemini **3.7 Flash High**, og skiftet
  til **3.8 Flash High** i brukerhendelsen 11:28:47. Navnet på mappen er beholdt.
  Iterasjonene og brukerpausene inngår i de 51:29. Publiseringsbestillinger som
  ligger mellom disse iterasjonene er med som dialogkontekst.
- Sol-utdraget stopper ved første ferdigmelding. Denne senere innsamlingen,
  sammenligningen og publiseringen er ikke med i de 24:17.

## Tokenregnskap

Codex-manifestene beholder siste kumulative teller innenfor hver avgrensning.
Astra: 59 815 output i hovedtråden, 12 484 hos geometriagenten og 22 730 hos
review-agenten, totalt **95 029**. Input totalt **10 453 537**, hvorav
**10 120 192** cachet. Sol: **58 899** output og **2 832 624** input, hvorav
**2 732 416** cachet. `reasoning_output_tokens` er en underkategori av output,
og legges ikke til en gang til. Lange mellomrom mellom underagentenes turer er
ikke aktiv arbeidstid.

Fables første levering har **137 718** output, **2 456** vanlig input,
**361 957** cache-opprettelse og **14 606 830** cache-lesing, summert én gang per
unik meldings-ID (siste usage-felt). Disse kategoriene er ulike Codex-formatet.
Det gamle tallet 151 000 er ikke gjenbrukt for dette kortere utdraget.
Antigravity-utdragene har ikke tilsvarende tokenregnskap; tidligere Flash-anslag
på 50 000 behandles ikke lenger som et sammenlignbart målt tall.

## Hva de offentlige filene inneholder

Dette er **redigerte sesjonsutdrag, ikke komplette native eksporter**. De
beholder brukerbestillinger, synlige assistentsvar, verktøynavn, tidsstempler og
originale rekordnumre. Verktøyargumenter og -utdata, intern resonnering,
system-/utviklerinstruksjoner, miljømetadata og binærdata er utelatt. Absolutte
maskin- og nettverksstier er erstattet med `[local-path]` / `[network-path]`.
Appkoden finnes separat i hver appmappe. Manifestene gjør avgrensningen og
hashene etterprøvbare mot en privat original, men gjør ikke den redigerte teksten
til en fullstendig revisjonslogg for hvert verktøykall.

Native originaler er kopiert til et privat arkiv utenfor Git og hashkontrollert
før eksport. Originalene er ikke endret. Eksportøren er
[scripts/archive-sessions.py](../scripts/archive-sessions.py), Python 3.14+.
Den stopper ved sannsynlige credential-mønstre; ingen slik match ble funnet i
teksten som ble eksportert. Dette erstatter ikke manuell kontroll.

Søket omfattet lokale Codex-økter (og zstd-komprimerte økter), Claude Code-
prosjekter, Antigravitys native JSONL-logger og samtaleindeks, samt tilgjengelige
ChatGPT-samtaler i Codex-appen og vanlige eksportplasseringer. Ingen selvstendig
ChatGPT-opphavsøkt ble identifisert i disse kildene. ChatGPT-tilgangen gir ikke
et uttømmende søk i hele kontohistorikken. Importerte Claude-samtaler i Codex
ble gjenkjent som duplikater og er ikke telt som egne modellkjøringer.
