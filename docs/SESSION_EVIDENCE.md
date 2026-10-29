# Opphavet til GPS-svarene

Kontrollert 29. oktober 2026. Hver app har en `sessions/`-mappe med avgrensede
JSONL-utdrag og manifest med opprinnelig sesjons-ID, kildefilens SHA-256,
inklusive linje-/steggrenser og utdragets SHA-256. Dialogene er lesbare uten et
bestemt KI-verktøy. Den felles bestillingen ligger i [USER_PROMPTS.md](../USER_PROMPTS.md).

## Tid: aktive implementeringsøkter uten brukerpauser

Tiden er summen av arbeidsøktene som laget og kontrollerte svaret. Hver økt
starter med bestillingen og slutter ved ferdigmeldingen. Mellomrommet fra en
ferdigmelding til neste brukerbestilling trekkes fra; en presisering som kommer
mens modellen allerede arbeider, regnes ikke som en brukerpause. En separat
bestilling om bare publisering holdes også utenfor. Deløktene og de originale
rekordnumrene finnes i [TIMING.json](TIMING.json), med samme tidsstempler som
i de arkiverte dialogene. Totalen avrundes én gang til nærmeste hele sekund.

Dette måler aktiv gjennomføring av implementeringsoppgaven, med verktøy og
egenkontroll, ikke prosessor- eller ren genereringstid. Fable og Astra publiserte
også inne i samme sammenhengende arbeidsøkt; slik blandet verktøy-/publiseringstid
inngår og er ikke skilt ut med et anslag. De hadde ingen brukerpauser innenfor
hovedutdraget, og tallene deres endres derfor ikke av pausefratrekket.

| Svar | Start UTC | Første ferdigmelding UTC | Aktiv tid | Utdrag |
|---|---|---|---|---|
| Claude Fable 5.1 | 20.09 12:17:54.542 | 20.09 12:50:59.142 | **33:05** | [dialog](../Fable-5.1-xhigh/sessions/creation.jsonl) |
| Gemini 3.8 Flash | 22.09 12:49:31 | 22.09 12:54:48 | **5:17** | [dialog](../Gemini-3.8-Flash/sessions/creation.jsonl) |
| GPT-6 Astra | 22.09 10:57:55.054 | 22.09 11:36:05.774 | **38:11** | [dialog](../GPT6-Astra-xhigh/sessions/creation.jsonl) |
| Gemini 4 Argon | 26.10 08:10:30 | 26.10 08:16:24 | **5:54** | [dialog](../Agy-Argon4/sessions/creation.jsonl) |
| GPT-6.1 Sol/high | 29.10 16:45:51.720 | 29.10 17:10:08.716 | **24:17** | [dialog](../GPT-6.1-Sol-high/sessions/creation.jsonl) |
| Interaktiv Gemini-referanse | 20.09 11:15:03 | 20.09 12:06:32 (siste) | **25:26** | [dialog](../Gemini-3.8-Flash-interactive/sessions/creation.jsonl) |

### Den interaktive referansen, økt for økt

| Rekorder | Start UTC | Ferdig UTC | Arbeidstid | Med i implementeringstiden |
|---|---|---|---|---|
| 0–37 | 11:15:03 | 11:18:06 | 3:03 | Ja |
| 38–55 | 11:18:17 | 11:18:42 | 0:25 | Nei, separat publiseringsbestilling |
| 56–75 | 11:25:13 | 11:27:16 | 2:03 | Ja |
| 76–135 | 11:28:47 | 11:31:18 | 2:31 | Ja, feilretting og kontroll |
| 136–157 | 11:38:04 | 11:39:46 | 1:42 | Ja |
| 158–246 | 11:44:56 | 11:48:58 | 4:02 | Ja |
| 247–306 | 11:54:01 | 11:57:09 | 3:08 | Ja |
| 307–334 | 11:57:18 | 11:59:12 | 1:54 | Ja |
| 335–449 | 11:59:19 | 12:03:45 | 4:26 | Ja |
| 450–501 | 12:03:55 | 12:06:32 | 2:37 | Ja |

**51:29 totalt − 25:38 brukerpauser − 0:25 separat publisering = 25:26.**
De ni brukerpausene er 0:11, 6:31, 1:31, 6:46, 5:10, 5:03, 0:09,
0:07 og 0:10. Publisering som er blandet inn i en implementeringsøkt inngår
fortsatt i denne øktens tid, som for hovedkjøringene. Ingen lange mellomrom
inne i en arbeidsøkt fjernes bare fordi modellen eller et verktøy brukte tid.

Fable sier «Alt ser riktig ut. Deployer» klokken 12:49:56.277: **32:02** til
kontrollpunktet før publisering. Astra sier «Siden er klar for publisering»
11:31:33.278: **33:38**. En feil i Astras fullskjermbakgrunn ble oppdaget og
rettet under den etterfølgende publiseringskontrollen. Disse kontrollpunktene
er derfor oppgitt separat og erstatter ikke tiden til ferdig svar.

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
  forforsøket tok **0:34** aktivt, slik at summen med dette forsøket er **6:28**.
  Mellom forsøkene ventet modellen **0:48** på ny bestilling; den pausen er trukket fra.
  Den tidligere oppgitte **7:16** var total forløpt tid, inkludert denne pausen. Turen om commit/PR/publisering klokken
  11:41 er utelatt. Notatets «ca. 6 min» er nå erstattet med loggmålingen.
- Den interaktive referansen begynte med Gemini **3.7 Flash High**, og skiftet
  til **3.8 Flash High** i brukerhendelsen 11:28:47. Navnet på mappen er beholdt.
  Iterasjonene utgjør **25:26** aktiv implementering og kontroll; brukerpausene
  og den separate publiseringsbestillingen er trukket fra de 51:29. Publiseringsbestillinger som
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
