# Hvordan GPS virker: én prompt, tre KI-modeller

Live: **https://www.bredland.no/gps/**

Én og samme prompt, gitt i én omgang til tre frontier-modeller høsten 2026. Hver av dem bygde en hel, animert nettside fra bunnen som forklarer hvordan GPS-satellitter gir en bil både posisjon og fart: sirkler og kuler som skjærer hverandre, klokker som lyver, dopplereffekt, ekko mellom glassbygg og jamming. Dette repoet er de tre svarene slik de ble levert, prompten, og kilden til sammenligningssiden.

*One prompt, one shot, three frontier models. Each built a complete animated web page explaining how GPS works. This repo holds the three answers exactly as delivered, the prompt, and the source of the comparison page. Everything is in Norwegian.*

| Mappe | Modell | Kjørt i | Tid | Lengde | Live |
|---|---|---|---|---|---|
| `Fable-5.1-xhigh/` | Claude Fable 5.1 | Claude Code, reasoning effort xhigh | 29 min | 14 kapitler, 10:33 | https://www.bredland.no/gps/fable-51-xhigh/ |
| `Gemini-3.8-Flash/` | Gemini 3.8 Flash | Antigravity, tenkenivå High | 5 min | 7 kapitler, 3:23 | https://www.bredland.no/gps/gemini-38-flash/ |
| `GPT6-Astra-xhigh/` | GPT-6 Astra | Codex, reasoning effort xhigh, to underagenter | 39 min | 17 kapitler, 5:45 | https://www.bredland.no/gps/gpt-6-astra/ |
| `Gemini-3.8-Flash-interactive/` | Gemini 3.8 Flash | Antigravity, delvis interaktivt, 20. september | 51 min | 12 scener, 2:00 | https://www.bredland.no/gps/gemini-38-flash-interactive/ |

Den siste raden er opphavet: en delvis interaktiv økt der prompten vokste fram gjennom en håndfull justeringer. Instruksjonene fra den økten ble samlet til `USER_PROMPTS.md`, som de tre andre fikk i én omgang. Den er med som referanse, ikke som del av sammenligningen.

## Innhold

- [`USER_PROMPTS.md`](USER_PROMPTS.md): den samlede prompten, ordrett. Samme tekst som ligger på nettsiden. Siste linje ble lagt til for Gemini-kjøringen 22. september, siden de andre svarene lå i nabomappene.
- `Fable-5.1-xhigh/`, `Gemini-3.8-Flash/`, `GPT6-Astra-xhigh/`: de tre svarene. Fable og Gemini er rene statiske sider (åpne `index.html`). Astra er et Vite-prosjekt med Three.js, tester og publiseringsskript, se `GPT6-Astra-xhigh/README.md`.
- `Gemini-3.8-Flash-interactive/`: det første, delvis interaktive Gemini-svaret. Prompten finnes bare i én versjon, `USER_PROMPTS.md` i roten.
- `site/`: sammenligningssiden som ligger på bredland.no/gps, med skjermbildene i `site/img/`. Siden bruker `/site.css` fra bredland.no og står derfor ikke alene.

## Kjøre lokalt

Fable og Gemini: en hvilken som helst statisk filserver i mappen, for eksempel `npx serve Gemini-3.8-Flash`. Gemini bruker ES-moduler og må serveres over HTTP; Fable kan åpnes rett fra disk.

Astra:

```powershell
cd GPT6-Astra-xhigh
npm ci
npm run dev
```

## Sammenligningen

Tabellene og teksten ligger på https://www.bredland.no/gps/#sammenligning, inkludert tid, tokens og underagenter per kjøring. Kort: Fable tok «papir og fargestift» bokstavelig og skrev en egen WebGL-raytracer for kulene, Gemini laget et mørkt kontrollrom med Three.js, KaTeX og en fri utforskingsmodus på fem minutter, og Astra leverte en rolig fem minutters fortelling på papir med tester, dokumentasjon og to selvvalgte underagenter på andre modeller. Sammenligningsteksten er skrevet av Claude Fable 5.1, som selv laget ett av svarene.

## Bidra

Alle er velkomne: fork, pull request, issues og discussions er åpne. Det mest nyttige bidraget er et fjerde svar: gi prompten til en annen modell i én omgang og legg resultatet i en ny mappe, urørt. Se [CONTRIBUTING.md](CONTRIBUTING.md).

*Contributions welcome, in Norwegian or English. The most useful one is a fourth answer from another model, delivered untouched. See [CONTRIBUTING.md](CONTRIBUTING.md).*

## Kilde

Alle tre bygger på UiO, AST2000: «GPS» (generell relativitet), Ellen og Erica, 2024:
https://www.uio.no/studier/emner/matnat/astro/AST2000/h24/blogger/bloggen-til-ellen-og-erica/9-generell-relativitet/gps(1).html

## Lisens

Kode: MIT, se `LICENSE`. Prompten og teksten på sammenligningssiden: CC BY 4.0. Rough.js, Three.js, KaTeX og skriftene har sine egne lisenser, oppgitt i `LICENSE`.
