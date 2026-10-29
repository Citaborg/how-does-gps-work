# Hvordan GPS virker: én prompt, fem KI-modeller

Live: **https://www.bredland.no/gps/**

Den samme samlede oppgaven gitt til fem frontier-modeller høsten 2026. Hver av dem bygde en hel, animert nettside fra bunnen som forklarer hvordan GPS-satellitter gir en bil både posisjon og fart: sirkler og kuler som skjærer hverandre, klokker som lyver, dopplereffekt, ekko mellom glassbygg og jamming. Repoet inneholder svarene, prompten, avgrensede opphavsøkter og kilden til sammenligningssiden. Loggene viser også presiseringer, avbrutte forsøk og senere oppfølging; se [sesjonsoversikten](docs/SESSION_EVIDENCE.md).

*Five frontier models answered the same GPS task. This repo holds the applications, prompt, bounded session excerpts and comparison page. The session evidence documents retries, clarifications and later changes. Everything is in Norwegian.*

| Mappe | Modell | Kjørt i | Til første ferdigmelding¹ | Lengde | Live |
|---|---|---|---|---|---|
| `Fable-5.1-xhigh/` | Claude Fable 5.1 | Claude Code, reasoning effort xhigh | 33:05 | 14 kapitler, 10:33 | https://www.bredland.no/gps/fable-51-xhigh/ |
| `Gemini-3.8-Flash/` | Gemini 3.8 Flash | Antigravity, tenkenivå High | 5:17 | 7 kapitler, 3:23 | https://www.bredland.no/gps/gemini-38-flash/ |
| `GPT6-Astra-xhigh/` | GPT-6 Astra | Codex, reasoning effort xhigh, to underagenter | 38:11 | 17 kapitler, 5:45 | https://www.bredland.no/gps/gpt-6-astra/ |
| `Agy-Argon4/` | Gemini 4 Argon | Antigravity, tenkenivå Medium | 5:54 | 12 kapitler, 3:18 | https://www.bredland.no/gps/agy-argon4/ |
| `GPT-6.1-Sol-high/` | GPT-6.1 Sol | Codex, reasoning effort high | 24:17 | 18 kapitler, 6:07 | https://www.bredland.no/gps/gpt-61-sol-high/ |
| `Gemini-3.8-Flash-interactive/` | Gemini 3.7 → 3.8 Flash | Antigravity, delvis interaktivt, 20. september | 51:29 | 12 scener, 2:00 | https://www.bredland.no/gps/gemini-38-flash-interactive/ |

¹ Veggklokketid fra bestilling til første ferdigmelding; Fable og Astra inkluderer også publisering i samme tur. Argon har et separat blokkert forsøk, Flash en presisering. [Eksakte målepunkter, tokens og forbehold](docs/SESSION_EVIDENCE.md).

Den siste raden er opphavet: en delvis interaktiv økt der prompten vokste fram gjennom en håndfull justeringer. Instruksjonene fra den økten ble samlet til `USER_PROMPTS.md`, som de fem svarene bygger på. Den er med som referanse, ikke som del av sammenligningen.

## Innhold

- [`USER_PROMPTS.md`](USER_PROMPTS.md): den samlede prompten, ordrett. Samme tekst som ligger på nettsiden. Siste linje ble lagt til for Gemini-kjøringen 22. september, siden de andre svarene lå i nabomappene.
- `Fable-5.1-xhigh/`, `Gemini-3.8-Flash/`, `GPT6-Astra-xhigh/`, `Agy-Argon4/`: de første fire svarene. Fable, Gemini og Argon er rene statiske sider (åpne `index.html`). Astra er et Vite-prosjekt med Three.js, tester og publiseringsskript, se `GPT6-Astra-xhigh/README.md`.
- `Gemini-3.8-Flash-interactive/`: det første, delvis interaktive Gemini-svaret. Prompten finnes bare i én versjon, `USER_PROMPTS.md` i roten.
- `GPT-6.1-Sol-high/`: det femte svaret, uten runtime-avhengigheter eller bygging; se mappens README.
- `*/sessions/`: redigerte opphavsutdrag med native sesjons-ID og hasher. Verktøykropper, intern resonnering og miljøinstruksjoner er utelatt; se `docs/SESSION_EVIDENCE.md`.
- `site/`: sammenligningssiden som ligger på bredland.no/gps, med skjermbildene i `site/img/`. Siden bruker `/site.css` fra bredland.no og står derfor ikke alene.

## Kjøre lokalt

Fable, Gemini og Argon: en hvilken som helst statisk filserver i mappen, for eksempel `npx serve Gemini-3.8-Flash`. Gemini bruker ES-moduler og må serveres over HTTP; Fable og Argon kan åpnes rett fra disk.

Astra:

```powershell
cd GPT6-Astra-xhigh
npm ci
npm run dev
```

## Sammenligningen

Tabellene og teksten ligger på https://www.bredland.no/gps/#sammenligning, inkludert tid, tokens og underagenter per kjøring. Kort: Fable tok «papir og fargestift» bokstavelig og skrev en egen WebGL-raytracer for kulene, Gemini laget et mørkt kontrollrom med Three.js, KaTeX og en fri utforskingsmodus på fem minutter, og Astra leverte en rolig fem minutters fortelling på papir med tester, dokumentasjon og to selvvalgte underagenter på andre modeller. Gemini 4 Argon kom til i oktober med varmt skissepapir, fargestift og en egen WebGL-raymarcher for kulene, uten et eneste bibliotek, på 5:54 fra den vellykkede bestillingen. Sol kom til 29. oktober med 18 kapitler på 6:07, egen analytisk WebGL-renderer, lokale systemskrifter, geometri- og nettlesertester; kjøringen tok 24:17. Sammenligningsteksten er skrevet av Claude Fable 5.1, som selv laget ett av svarene; Argon-tilleggene er skrevet av Claude Opus 5.5. Sol-tilleggene og sesjonskontrollen er skrevet av GPT-6.1 Sol. Fables innledning og avslutning ble endret etter første levering; se sesjonsoversikten.

## Bidra

Alle er velkomne: fork, pull request, issues og discussions er åpne. Det mest nyttige bidraget er et nytt svar: gi prompten til en annen modell i én omgang og legg resultatet i en ny mappe, urørt. Se [CONTRIBUTING.md](CONTRIBUTING.md).

*Contributions welcome, in Norwegian or English. The most useful one is a new answer from another model, delivered untouched. See [CONTRIBUTING.md](CONTRIBUTING.md).*

## Kilde

Alle fem bygger på UiO, AST2000: «GPS» (generell relativitet), Ellen og Erica, 2024:
https://www.uio.no/studier/emner/matnat/astro/AST2000/h24/blogger/bloggen-til-ellen-og-erica/9-generell-relativitet/gps(1).html

## Lisens

Kode: MIT, se `LICENSE`. Prompten og teksten på sammenligningssiden: CC BY 4.0. Rough.js, Three.js, KaTeX og skriftene har sine egne lisenser, oppgitt i `LICENSE`.
