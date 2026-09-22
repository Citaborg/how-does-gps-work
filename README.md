# Hvordan GPS virker: én prompt, tre KI-modeller

Live: **https://www.bredland.no/gps/**

Én og samme prompt, gitt i én omgang og uten oppfølging, til tre frontier-modeller høsten 2026. Hver av dem bygde en hel, animert nettside fra bunnen som forklarer hvordan GPS-satellitter gir en bil både posisjon og fart: sirkler og kuler som skjærer hverandre, klokker som lyver, dopplereffekt, ekko mellom glassbygg og jamming. Dette repoet er de tre svarene slik de ble levert, prompten, og kilden til sammenligningssiden.

*One prompt, one shot, three frontier models. Each built a complete animated web page explaining how GPS works. This repo holds the three answers exactly as delivered, the prompt, and the source of the comparison page. Everything is in Norwegian.*

| Mappe | Modell | Kjørt i | Lengde | Live |
|---|---|---|---|---|
| `Fable-5.1-xhigh/` | Claude Fable 5.1 | Claude Code, reasoning effort xhigh | 14 kapitler, 10:33 | https://www.bredland.no/gps/fable-51-xhigh/ |
| `Gemini-3.8-Flash/` | Gemini 3.8 Flash | standardinnstillinger | 12 scener, 2:00 | https://www.bredland.no/gps/gemini-38-flash/ |
| `GPT6-Astra-xhigh/` | GPT-6 Astra | Codex, reasoning effort xhigh | 17 kapitler, 5:45 | https://www.bredland.no/gps/gpt-6-astra/ |

## Innhold

- `USER_PROMPTS.md`: den samlede prompten, ordrett. Samme tekst som ligger på nettsiden.
- `Fable-5.1-xhigh/`, `Gemini-3.8-Flash/`, `GPT6-Astra-xhigh/`: de tre svarene. Fable og Gemini er rene statiske sider (åpne `index.html`). Astra er et Vite-prosjekt med Three.js, tester og publiseringsskript, se `GPT6-Astra-xhigh/README.md`. Hver mappe har også sin egen `USER_PROMPTS.md` med de ti opprinnelige promptene som ble samlet til én.
- `site/`: sammenligningssiden som ligger på bredland.no/gps, med skjermbildene i `site/img/`. Siden bruker `/site.css` fra bredland.no og står derfor ikke alene.

## Kjøre lokalt

Fable og Gemini: en hvilken som helst statisk filserver i mappen, for eksempel `npx serve Fable-5.1-xhigh`. Å åpne `index.html` direkte fra disk virker også.

Astra:

```powershell
cd GPT6-Astra-xhigh
npm ci
npm run dev
```

## Sammenligningen

Tabellen og teksten ligger på https://www.bredland.no/gps/#sammenligning. Kort: Fable tok «papir og fargestift» bokstavelig og skrev en egen WebGL-raytracer for kulene, Gemini laget et mørkt kontrollrom med tolv scener på ti sekunder hver, og Astra leverte en rolig fem minutters fortelling på papir med tester, dokumentasjon og kildeliste på kjøpet. Sammenligningsteksten er skrevet av Claude Fable 5.1, som selv laget ett av svarene.

## Bidra

Alle er velkomne: fork, pull request, issues og discussions er åpne. Det mest nyttige bidraget er et fjerde svar: gi prompten til en annen modell i én omgang og legg resultatet i en ny mappe, urørt. Se [CONTRIBUTING.md](CONTRIBUTING.md).

*Contributions welcome, in Norwegian or English. The most useful one is a fourth answer from another model, delivered untouched. See [CONTRIBUTING.md](CONTRIBUTING.md).*

## Kilde

Alle tre bygger på UiO, AST2000: «GPS» (generell relativitet), Ellen og Erica, 2024:
https://www.uio.no/studier/emner/matnat/astro/AST2000/h24/blogger/bloggen-til-ellen-og-erica/9-generell-relativitet/gps(1).html

## Lisens

Kode: MIT, se `LICENSE`. Prompten og teksten på sammenligningssiden: CC BY 4.0. Rough.js og skriftene har sine egne lisenser, oppgitt i `LICENSE`.
