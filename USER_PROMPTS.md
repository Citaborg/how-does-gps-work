# Brukerprompt for «Hvordan GPS Virker»

Denne filen inneholder brukerprompt som er gitt for å bygge den visuelle nettsiden. Filen inneholder **kun** brukerens egne instruksjoner (ingen AI-svar), slik at den kan brukes direkte til å gjenskape prosjektet.

---

### Prompt

```text
ok, vi skal bygge en pen siden med javascript og pene "strektegning" animasjoner som skal illustrere hvordan GPS-satellitter virker og kan gi feks en bil som kjører mulighet til å finne både nøyaktig posisjon og nøyaktig fart. Vis også problemene med ekko og signalforhold. Vi må også vise hvordan satellittene selv vet sin egen posisjon. Så kan vi også illustrere hvordan GPS-systemene kan jammes.
Noe info og matte: https://www.uio.no/studier/emner/matnat/astro/AST2000/h24/blogger/bloggen-til-ellen-og-erica/9-generell-relativitet/gps(1).html
Legg uio artikkelen som referanse.
Noen retningslinjer: visualisering av hvordan hos virker + hvordan vet en satellitt sin egen posisjon

Her får du en enkel forklaring på hvordan GPS-systemet fungerer for oss på bakken, og hvordan en satellitt i verdensrommet vet nøyaktig hvor den selv befinner seg.

1. Hvordan GPS virker (Trilaterasjon)

En GPS-mottaker (for eksempel i telefonen din) sender ikke ut signaler; den bare lytter. [1]

Tidssignaler: GPS-satellittene sender kontinuerlig ut radiobølger som inneholder informasjon om hva klokken var da signalet ble sendt, og hvor satellitten var akkurat da. [1]

Avstandsberegning: Siden signalene beveger seg med lysets hastighet, kan telefonen din regne ut avstanden til satellitten basert på hvor lang tid signalet brukte (Tid = Avstand). [1]

Skjæringspunktet: Hvis telefonen vet avstanden til én satellitt, vet den at den befinner seg et sted på en stor, tenkt sfære rundt denne satellitten. Med fire satellitter kan telefonen regne ut nøyaktig hvor på jorden du befinner deg (breddegrad, lengdegrad og høyde over havet), samt korrigere tidsfeil i telefonens egen klokke. [1]

Her er noen visuelle modeller som viser hvordan disse avstandssværene krysser hverandre for å finne din posisjon:

2. Hvordan vet satellitten sin egen posisjon?

For at telefonen din skal bruke satellitten som et referansepunkt, må satellitten vite nøyaktig hvor den selv er til enhver tid. Dette løses gjennom et tett samarbeid med bakken:

Forutsigbare baner (Keplers lover): Satellittene går i veldig stabile, sirkulære baner omtrent 20 200 kilometer over jorden. Fysikkens lover gjør at banen stort sett er forutsigbar lang tid i forveien. [1]

Kontrollstasjoner på bakken: Det finnes dedikerte bakkestasjoner (kontrollsegmentet) spredt rundt på jorden som kontinuerlig overvåker satellittene med kraftige radarer. De måler om satellitten har veket ørlite grann av fra banen sin (for eksempel på grunn av jordens ujevne tyngdekraft eller solstormer).

Efemeride-data: Bakkestasjonene beregner de oppdaterte, nøyaktige banedataene (kalt efemerider) og sender disse opp igjen til satellittene. Satellitten lagrer dette og videresender det til telefonen din.

Ekstremt presise atomklokker: For at posisjonen skal være riktig, må tiden være helt synkronisert. Satellittene har derfor med seg flere atomklokker som er så presise at de kun taper et par sekunder i løpet av millioner av år. [1]

Vil du vite mer om hvordan relativitetsteorien påvirker disse atomklokkene i rommet, eller ønsker du hjelp med å forstå forskjellen på GPS og andre systemer som Galileo eller GLONASS? [1]


Kilde: Universitetet i Oslo
GPS – Universitetet i Oslo
13. des. 2024 — Men også litt kult og ekstremt interessant! Vi har jo den spesielle relativitetsteorien også. Satellittene beveger seg jo veldig fort, spesielt sammenlignet med...


Start med å vise 2s-prinsippet, også bygger vi ut til 3d.

Matematikken bak må flettes inn på en smart måte - det er ikke utregningene som er viktige å illustrere, men de matematiske prinsippene (geometri), og det må aniomeres så man skjønner hvordan det benyttes.
enkle strektegninger på canvas

animasjonene må være mye tydeligere og lite rotete
i 3d skal vi vise 1,2,3,4 staelitter og hvordan det endrer muligheten for hvor man kan være - hvordan kulenes intersect begrenser hvor vi kan være
matematiske og dysiske prinsipper skal inn i animasjonen underveis og ikke stå for seg selv
vis også hvordan en satellitt får sin posisjone og hvordan den overvåkes fra jorden og justeres ved avvik
lage animasjonen som en historie som tar oss gjennom 2d med 1, 2, 3 og 4 satelitter, også bytter vi over i 3d og repeterer 1,2,3 og 4.
Jeg ønsker en sammenhengende animasjon som går gjennom løypa og lager en "video" som forklarer matematikk og visuelt hvordan dette fungerer

vis kulene som spheres i egne farger og miks fargene der de skjører hverandre. Ikke bruk for mange bokser og dill rundt om. Fortellingen kan være en rolig tekst på høyre side som fader inn. Pulseringen i 2d bildet for signal blir for rotete, her også kan vi illustrere med fargede sirkler og markere skjæringspunktene. Bilen i videoen kan stoppe innimellom også kan vi tegne på trekanter for å illustrere hva vi regner på av avstadner og vinkler og what-not. Bruk hele skjermen, legg kapittelvelger/video avspiller kontroll nederst i midten. (hel skjerm er full hd oppløsning). Legg kilde/ref til UiO i liten footer nederst til høyre. Lag en fancy under-overskrift, ta ikke ha navigasjon - del1, del2, osv på toppen hvis de er del av hele videoen. Alt. må vi dele videoen opp i scenarier.

hvis bilen stoppes for å vise beregninger, la den stoppe der den er, ikke hopp til et gitt punkt. 3d spheres må rendres i noe transparante farger hele veien (raytrace?) og ikke med tydelig sirkel for yttergrense, skjæringslinjer og sirkler må highlightes der de mikser (ikke unionen, men akkurat skjæringslinjene - som blir sirkler, osv. Når vi legger på en satellitt til må den animeres inn og ikke bare dukke opp. Dette skal være en visuell nytelse som også tegner og viser prinsippene. Vi kan godt bruke "papir og fargestift"-tegninger for å illustrere matematikken og ikke pinne rette datamaskinlinjer. La det ha litt sjarm. Forklaringene til illustrasjonene kan smyge seg inn og smyge seg ut i høyre kant. Alt skal forklares gjennom en rolig og personlig økt og med visuell nytelse.

spherene må være veldig tydelige og skjæringen illustreres med sterkere farge, men ikke med stiplet linje.
overgangen mellom temaene må gjøres pene og smarte.
vi kan bruke mer tegning på skissene våre
i 3d trenger vi ikke vise jorden eller raskt forflyttende punkt, men vi kan vise satelittspheres og skjæringne også plassere jorden inn med bilen, men da antar jeg vi må zoome inn på en del av den siden spheres til satelittene ikke dekker over hele kloden. vi må også vise hvilke skjæringer/punkter vi enkelt kan forkaste og hvorfor.

vi skal vise både posisjons og hastighetsberegning
doppler må få matematikken tegnet på animasjonen
vi kan godt bruke strek som ser hjemmetegnet (blyant, fargestifter) istedenfor data-genererte linjer
når vi stopper og viser beregning til flere satelitter må vi vise gemoetri til alle som overlay, ikke bare til 1

vis feiltrekanten visuelt også

også trenger vi tydelig animasjon på når vi kjører inn i område - bak feks glassbygning som gir spøkelsesposisjoner, og hvordan det virker

Du har ikke lov til å se på andre svar fra andre modeller som ligger her.

lag det nå!
```
