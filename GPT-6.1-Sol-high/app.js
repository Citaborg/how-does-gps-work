import { clamp, mix, smooth, add, sub, mul, unit, distance, dot, circleIntersections, errorGeometry, sphereCircle, circlePoint, trilaterate, SPACE_SATS, SPACE_RADII, SPACE_RECEIVER, cameraBasis, project } from './geometry.js';
import { SphereRenderer } from './spheres.js';

const $ = id => document.getElementById(id);
const scenes = [
  { duration:18, kind:'intro', category:'FØR VI BEGYNNER', short:'Et lite spørsmål', title:'Hvordan finner<br>vi <em>veien?</em>', label:'ET LITE SPØRSMÅL. ET STORT VERDENSROM.', dimension:'EN TEGNET REISE', insight:'Bilen spør ikke. Den lytter.', beats:[
    'Du kjører på en liten vei. Langt over deg går satellitter i bane. På et øyeblikk vet bilen hvor den er. Hvordan kan noen radiobølger fortelle så mye?',
    'Hver satellitt sender et klokkeslett og data om banen sin. Mottakeren i bilen bare lytter. La oss begynne med én avstand, på et helt flatt ark.' ] },
  { duration:17, kind:'flat', count:1, category:'FØRST PÅ ET ARK', short:'Én satellitt · en sirkel', title:'Én avstand.<br><em>Mange steder.</em>', label:'01 SATELLITT · EN HEL SIRKEL AV MULIGHETER', dimension:'2D · IDEELLE KLOKKER', insight:'Avstand = lyshastighet × reisetid', beats:[
    'Et signal bruker tid på reisen. Gang reisetiden med lyshastigheten, og du får avstanden til satellitten. Her later vi først som alle klokkene er helt enige.',
    'Alle punktene på den blå sirkelen ligger like langt unna. Vi har målt en avstand, ikke en retning. Bilen kan ennå være hvor som helst langs streken.' ] },
  { duration:18, kind:'flat', count:2, category:'FØRST PÅ ET ARK', short:'To satellitter · to punkter', title:'To spor.<br><em>To muligheter.</em>', label:'02 SATELLITTER · DER SIRKLENE MØTES', dimension:'2D · IDEELLE KLOKKER', insight:'Begge avstandene må stemme samtidig.', beats:[
    'Nå kommer en avstand til. Den okergule sirkelen tegnes inn, og de fleste stedene på den blå sirkelen kan strykes.',
    'To sirkler skjærer vanligvis hverandre i to punkter. Begge oppfyller de to målingene. Uten mer informasjon vet vi ikke hvilket som er vårt.' ] },
  { duration:18, kind:'flat', count:3, category:'FØRST PÅ ET ARK', short:'Tre satellitter · et møtested', title:'Et tredje spor.<br><em>Der er vi.</em>', label:'03 SATELLITTER · ETT FELLES MØTESTED', dimension:'2D · IDEELLE KLOKKER', insight:'Vi finner avstander. Vinklene følger av geometrien.', beats:[
    'Den tredje sirkelen treffer bare ett av de to punktene. Den andre kandidaten passer ikke med denne avstanden og må forkastes.',
    'Med ideelle klokker har vi nå funnet x og y på arket. Se trekantene: hver avstand er en hypotenus. Pythagoras knytter tegningen til koordinatene.' ] },
  { duration:18, kind:'flat', count:4, category:'EN LITEN HAKE', short:'Fire på arket · klokkefeilen', title:'Men klokken<br>er <em>ikke perfekt.</em>', label:'04 SATELLITTER · ÉN FELLES KLOKKEFEIL', dimension:'2D · x, y OG δt', insight:'ρᵢ = avstandᵢ + c · δt', beats:[
    'Bilens klokke er ikke en atomklokke. Går den litt foran, blir alle de målte avstandene for lange. Sirklene får ikke ett felles møtested.',
    'Mottakeren løser posisjon og klokkefeil sammen. I 2D har vi tre ukjente, så tre gode målinger kan være nok. Den fjerde gir ekstra kontroll. Se sirklene finne sammen.' ] },
  { duration:12, kind:'lift', category:'ARKET FÅR DYBDE', short:'Fra sirkel til kule', title:'Verden har<br><em>en høyde også.</em>', label:'VI LØFTER GEOMETRIEN UT AV ARKET', dimension:'2D → 3D', insight:'En sirkel på et ark blir en kuleflate i rommet.', beats:[
    'Bilen befinner seg i en tredimensjonal verden. Alle punkter med samme avstand til en satellitt ligger nå på en kuleflate. Vi gjør det samme en gang til, med plass til høyden.' ] },
  { duration:16, kind:'space', count:1, category:'SÅ UT I ROMMET', short:'Én kule · en hel flate', title:'Én satellitt.<br><em>En hel kule.</em>', label:'01 SATELLITT · MULIGE STEDER PÅ KULEFLATEN', dimension:'3D · IDEELLE KLOKKER', insight:'|p − s₁| = r₁', beats:[
    'Satellitten er kulens sentrum. Reisetiden gir radiusen. Vi kan være hvor som helst på overflaten, også på baksiden.',
    'Fargen gjør dybden synlig. Innsiden er ikke en mengde mulige posisjoner: det er selve kuleflaten som har akkurat den målte avstanden.' ] },
  { duration:20, kind:'space', count:2, category:'SÅ UT I ROMMET', short:'To kuler · en sirkel', title:'To kuler.<br><em>En sirkel igjen.</em>', label:'02 SATELLITTER · EN SIRKEL I ROMMET', dimension:'3D · IDEELLE KLOKKER', insight:'To flater møtes langs én felles sirkel.', beats:[
    'Den andre kulen glir inn. Det mørkere båndet viser der kuleflatene skjærer hverandre. Skjæringen er en sirkel som svever i rommet.',
    'Alle stedene langs denne sirkelen passer med begge avstandene. Det fargede volumet mellom kulene er ikke løsningen. Følg den tydelige skjæringslinjen.' ] },
  { duration:22, kind:'space', count:3, category:'SÅ UT I ROMMET', short:'Tre kuler · to kandidater', title:'Tre kuler.<br><em>To kandidater.</em>', label:'03 SATELLITTER · TO FELLES PUNKTER', dimension:'3D · IDEELLE KLOKKER', insight:'En tredje kule skjærer sirkelen i to punkter.', beats:[
    'En tredje avstand begrenser oss vanligvis til to punkter. Se hvordan den korallfargede kuleflaten krysser skjæringssirkelen.',
    'I denne tegningen ligger én kandidat ved bakken og den andre langt over den. For en bil kan vi forkaste den høye kandidaten med denne tilleggskunnskapen. Men vi mangler fortsatt en god klokke.' ] },
  { duration:25, kind:'space', count:4, category:'POSISJON OG TID', short:'Fire satellitter · fire ukjente', title:'Fire signaler.<br><em>Her. Og nå.</em>', label:'04 SATELLITTER · x, y, z OG KLOKKEFEIL', dimension:'3D · FIRE UKJENTE', insight:'ρᵢ = √((x−xᵢ)² + (y−yᵢ)² + (z−zᵢ)²) + cδt', beats:[
    'Nå slipper vi antakelsen om en perfekt bilklokke. De oppblåste kulene viser tilsynelatende avstander: avstandene slik den unøyaktige klokken får dem til å se ut.',
    'Fire uavhengige signaler lar oss løse fire ukjente: x, y, z og δt. Her tegner vi korreksjonen som kuler som krymper like mye, til de passer ved bilen.',
    'Med god satellittgeometri finner mottakeren en lokal løsning. I virkeligheten bruker den gjerne flere signaler, vekter målingene og kontrollerer at de er troverdige.' ] },
  { duration:26, kind:'orbit', category:'REFERANSEPUNKTENE', short:'Hvem forteller satellitten hvor den er?', title:'Hvem finner<br><em>satellitten?</em>', label:'BAKKE → BANEMODELL → SATELLITT → BIL', dimension:'KONTROLLSEGMENTET', insight:'Banedata + sendetid → satellittens posisjon', beats:[
    'Satellitten går i en forutsigbar bane, omtrent 20 200 km over jorden. Kontrollstasjoner med kjente posisjoner følger radiosignalene og måler avstander, bærebølger og klokker.',
    'Et kontrollsenter bruker observasjonene til å beregne bane- og klokkedata. Disse lastes opp til satellitten og sendes videre som en del av navigasjonsmeldingen.',
    'Bilen beregner satellittens posisjon ved sendetid fra disse dataene. Små avvik håndteres med nye modeller. Ved behov gjør operatørene også en egen banemanøver; ikke for hver oppdatering.' ] },
  { duration:22, kind:'clocks', category:'TID ER AVSTAND', short:'En liten dose Einstein', title:'Et mikrosekund<br>er <em>langt.</em>', label:'1 MIKROSEKUND · NESTEN 300 METER SIGNALVEI', dimension:'RELATIVITET', insight:'−7 + 45 ≈ +38 μs per døgn', beats:[
    'Satellitten har atomklokker. Likevel er tiden vrien: høy fart gjør at klokken går omtrent 7 mikrosekunder saktere per døgn enn en klokke på bakken.',
    'Svakere gravitasjon gjør at den går rundt 45 mikrosekunder raskere. Netto blir det omtrent +38. GPS tar hensyn til relativitet og sender klokkekorreksjoner.',
    'Bare ett mikrosekund tilsvarer nesten 300 meter i signalavstand. Tid er ikke en detalj i denne fortellingen. Tid er selve målebåndet.' ] },
  { duration:20, kind:'speed', category:'NÅ BEGYNNER VI Å KJØRE', short:'Fart fra to posisjoner', title:'Fra «hvor»<br>til <em>«hvor fort».</em>', label:'TO POSISJONER · EN AVSTAND · ET TIDSROM', dimension:'GJENNOMSNITTSFART', insight:'100 m / 5 s = 20 m/s = 72 km/t', beats:[
    'Én mulighet er å sammenligne to posisjoner. Flytter bilen seg 100 meter på fem sekunder langs denne rette veien, er gjennomsnittsfarten 72 km/t.',
    'Vi lar bilen stoppe der den kom til, og tegner avstandene til alle satellittene. Men posisjonsstøy kan gi usikker fart. Heldigvis har radiosignalet enda en ledetråd.' ] },
  { duration:27, kind:'doppler', category:'FARTEN LIGGER I BØLGENE', short:'Doppler · mer enn to prikker', title:'Hør bevegelsen.<br><em>Uten å høre.</em>', label:'FLERE SIKTELINJER · EN HASTIGHETSVEKTOR', dimension:'DOPPLEREFFEKT', insight:'Δfᵢ ≈ −ρ̇ᵢ / λ  ·  λ = c / f₀', beats:[
    'Når avstanden til en satellitt minker, tar mottakeren imot flere bølgetopper per sekund. Frekvensen øker. Øker avstanden, synker frekvensen. Dette er dopplereffekten.',
    'Hver satellitt ser bare bevegelsen langs sin siktelinje. Pilene er projeksjoner av bilens hastighetsvektor. Satellitten beveger seg også; den bevegelsen må regnes med.',
    'Flere dopplermålinger lar mottakeren løse tre hastighetskomponenter og klokkedrift. Etter korreksjonene gir vektoren både kjøreretning og fart, selv før posisjonen rekker å flytte seg langt.' ] },
  { duration:22, kind:'errors', category:'VERDEN ER IKKE ET PERFEKT ARK', short:'Feiltrekanten og geometrien', title:'Strekene er<br><em>aldri helt enige.</em>', label:'MÅLEFEIL + SATELLITTGEOMETRI = POSISJONSUSIKKERHET', dimension:'FEILTREKANT · SKJEMATISK', insight:'Spredte satellitter gir som regel bedre geometri.', beats:[
    'Atmosfære, støy og små modellfeil gjør avstandene usikre. Sirklene møtes ikke helt. Den lille feiltrekanten viser uenigheten mellom tre målinger.',
    'Samler vi satellittene på én kant av himmelen, møtes sirklene i slake vinkler. Samme avstandsfeil gir større usikkerhet. Mottakeren bruker en vektet tilpasning; feiltrekanten er vår tegneforklaring.' ] },
  { duration:26, kind:'multipath', category:'SIGNALER SOM TAR EN OMVEI', short:'Glassbyen og spøkelsesbilen', title:'Et ekko.<br><em>Et annet sted.</em>', label:'LENGRE SIGNALVEI → FOR STOR MÅLT AVSTAND', dimension:'REFLEKSJON OG SKJERMING', insight:'Ekstra avstand = c · ekstra reisetid', beats:[
    'Vi kjører inn bak et bygg. Den rette signalveien blir skjermet. Et signal kan likevel nå bilen etter å ha blitt reflektert i glassfasaden på den andre siden.',
    'Den knekte veien er lengre. Hvis mottakeren tolker det forsinkede signalet som direkte, blir avstanden for stor. Når direkte signal og ekko blandes, kaller vi det multipath.',
    'Den bleke bilen viser en mulig feilplassering, ikke en ny bil. Mottakere prøver å avvise dårlige målinger, men i trange bygater kan posisjonen hoppe eller forsvinne helt.' ] },
  { duration:22, kind:'jamming', category:'NÅR LYTTING BLIR UMULIG', short:'Når signalene drukner', title:'En hvisking.<br><em>I mye støy.</em>', label:'STØY KAN GJØRE SATELLITTSIGNALENE UBRUKELIGE', dimension:'JAMMING', insight:'Uten pålitelige signaler: ingen ny GPS-posisjon.', beats:[
    'GPS-signalene er svært svake når de når bakken. Radiostøy i mottaksbåndet kan overdøve dem. Det er prinsippet bak jamming.',
    'Bilen fortsetter, men mottakeren mister låsen. Her markerer vi siste gyldige posisjon og slutter å vise en ny GPS-fart. Andre sensorer kan hjelpe en stund.',
    'Jamming forstyrrer mottaket. Spoofing er noe annet: falske navigasjonssignaler kan lure mottakeren. Begge deler minner oss om at en prikk på et kart trenger gode målinger.' ] },
  { duration:18, kind:'ending', category:'TILBAKE PÅ VEIEN', short:'Her er du', title:'Du er her.<br>Og nå vet du<br><em>hvorfor.</em>', label:'AVSTANDER. EN FELLES TID. ET LITE PUNKT PÅ ET STORT KART.', dimension:'TAKK FOR REISEN', insight:'Noen ganger er det fineste i verden et møtested.', beats:[
    'En håndfull signaler. Baner som følges fra bakken. Klokker som korrigeres. Litt geometri og et lite nikk til Einstein. Slik finner bilen både hvor den er og hvor fort den kjører.',
    'Og når signalene tar en omvei eller drukner i støy, vet vi hvorfor prikken kan ta feil. Du kan se reisen igjen, eller hoppe tilbake til en tegning som gjorde deg nysgjerrig.' ] }
];
let total=0;
for(const scene of scenes){scene.start=total;total+=scene.duration;}
$('duration').textContent=formatTime(total);$('scrubber').max=String(total);

const palette={ink:'#293f3c',soft:'#758174',faint:'#cbd1c4',paper:'#f6f3eb',blue:'#438597',ochre:'#b78a45',coral:'#c57463',green:'#7a9264'};
const colors=[palette.blue,palette.ochre,palette.coral,palette.green];
const canvas=$('drawing'), ctx=canvas.getContext('2d'), sphereCanvas=$('spheres'), sphereRenderer=new SphereRenderer(sphereCanvas);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let playing=!reducedMotion.matches, time=0, rate=1, lastFrame=null, activeIndex=-1, activeBeat=-1, width=0,height=0,dpr=1, fit=1, lastPaint=-1;
let suspendedPlaying=false;

function formatTime(value){const n=Math.floor(value);return `${Math.floor(n/60)}:${String(n%60).padStart(2,'0')}`;}
function alpha(color,a){return `${color}${Math.round(clamp(a)*255).toString(16).padStart(2,'0')}`;}
function line(points,color=palette.ink,w=1.5,opacity=1){
  if(!points.length)return;
  ctx.save();ctx.globalAlpha*=opacity;ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();ctx.restore();
}
// A stable second pencil pass: no frame-to-frame jitter or flicker.
function pencil(points,color=palette.ink,w=1.3,opacity=1){
  line(points,color,w,opacity);line(points.map((p,i)=>[p[0]+Math.sin(i*2.1+1)*.8,p[1]+Math.cos(i*1.7)*.8]),color,w*.5,opacity*.3);
}
function text(content,x,y,{size=16,color=palette.soft,align='left',italic=false,serif=false,opacity=1}={}){
  ctx.save();ctx.globalAlpha*=opacity;ctx.fillStyle=color;ctx.font=`${italic?'italic ':''}${size}px ${serif?'Georgia, serif':'"Segoe UI", sans-serif'}`;ctx.textAlign=align;ctx.fillText(content,x,y);ctx.restore();
}
function ellipse(x,y,rx,ry,color=palette.faint,w=1,rotation=0,fill=null,progress=1){
  ctx.save();ctx.strokeStyle=color;ctx.lineWidth=w;ctx.beginPath();ctx.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),rotation,-Math.PI/2,-Math.PI/2+Math.PI*2*clamp(progress));if(fill){ctx.fillStyle=fill;ctx.fill();}ctx.stroke();ctx.restore();
}
function dotAt(p,color=palette.ink,r=5,ring=true){ctx.save();if(ring){ctx.beginPath();ctx.arc(p[0],p[1],r+5,0,Math.PI*2);ctx.fillStyle=alpha(palette.paper,.9);ctx.fill();}ctx.beginPath();ctx.arc(p[0],p[1],r,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();ctx.restore();}
function arrow(a,b,color=palette.soft,w=1.2,opacity=1){
  const v=unit(sub(b,a)),n=[-v[1],v[0]],head=8;
  pencil([a,b],color,w,opacity);line([add(b,add(mul(v,-head),mul(n,head*.45))),b,add(b,add(mul(v,-head),mul(n,-head*.45)))],color,w,opacity);
}
function crossOut(p,size=9,color=palette.coral){pencil([[p[0]-size,p[1]-size],[p[0]+size,p[1]+size]],color,2);pencil([[p[0]+size,p[1]-size],[p[0]-size,p[1]+size]],color,2);}
function drawPathProgress(points,progress,color=palette.ink,w=1.7){
  const distances=points.slice(1).map((p,i)=>distance(p,points[i])),totalDistance=distances.reduce((a,b)=>a+b,0);
  let remaining=clamp(progress)*totalDistance,draw=[points[0]];
  for(let i=0;i<distances.length;i++){if(remaining>=distances[i]){draw.push(points[i+1]);remaining-=distances[i];}else{draw.push(add(points[i],mul(sub(points[i+1],points[i]),remaining/distances[i])));break;}}
  pencil(draw,color,w);
}
function satellite(x,y,color=palette.blue,scale=1,angle=-.22,opacity=1){
  ctx.save();ctx.globalAlpha*=opacity;ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);
  ctx.fillStyle=alpha(color,.13);ctx.strokeStyle=color;ctx.lineWidth=1.4;
  [[-48,-13,31,26],[17,-13,31,26]].forEach(([a,b,w,h])=>{ctx.fillRect(a,b,w,h);pencil([[a,b],[a+w,b+.5],[a+w-.5,b+h],[a,b+h-.5],[a,b]],color,1.4);for(let i=1;i<3;i++)line([[a+w*i/3,b],[a+w*i/3,b+h]],color,.65,.7);line([[a,b+h/2],[a+w,b+h/2]],color,.65,.7);});
  line([[-17,0],[17,0]],color,2);ctx.fillStyle=palette.paper;ctx.fillRect(-10,-15,20,30);pencil([[-10,-15],[10,-14],[11,15],[-10,15],[-10,-15]],palette.ink,1.6);
  pencil([[0,15],[0,27],[-8,31]],palette.ink,1.2);ellipse(-8,30,8,3,color,1,-.25);line([[0,-15],[0,-26],[4,-29]],palette.ink,1);
  ctx.restore();
}
function car(x,y,scale=1,opacity=1,color=palette.ink){
  ctx.save();ctx.globalAlpha*=opacity;ctx.translate(x,y);ctx.scale(scale,scale);
  ellipse(0,6,43,4,alpha(color,.08),0,0,alpha(color,.07));
  ctx.beginPath();ctx.moveTo(-39,-4);ctx.quadraticCurveTo(-44,-19,-26,-21);ctx.lineTo(-16,-36);ctx.quadraticCurveTo(-13,-39,9,-37);ctx.lineTo(26,-22);ctx.quadraticCurveTo(42,-21,44,-13);ctx.lineTo(43,-3);ctx.closePath();ctx.fillStyle=alpha(color,.11);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=1.8;ctx.stroke();
  pencil([[-23,-23],[-14,-33],[-1,-34],[-1,-22],[-23,-23]],color,1.1);pencil([[4,-34],[10,-33],[22,-22],[4,-22],[4,-34]],color,1.1);
  line([[-39,-9],[40,-9]],color,1,.5);line([[5,-18],[12,-18]],color,1);
  [-25,27].forEach(wx=>{ellipse(wx,-1,8,8,color,1.7,0,palette.paper);ellipse(wx,-1,3,3,color,.9);});
  line([[38,-17],[43,-16]],palette.ochre,3);ellipse(0,-40,3,2,palette.ochre,1,0,palette.ochre);
  ctx.restore();
}
function tree(x,y,size=1){
  pencil([[x,y],[x+1,y-42*size]],palette.soft,1.2,.6);
  pencil([[x-17*size,y-16*size],[x,y-54*size],[x+17*size,y-16*size]],palette.green,1.2,.6);
  pencil([[x-14*size,y-29*size],[x,y-65*size],[x+14*size,y-29*size]],palette.green,1.2,.5);
}
function road(y=530){
  const top=Array.from({length:70},(_,i)=>[i*15,y+Math.sin(i*.13)*3]);pencil(top,palette.soft,1.1,.65);
  pencil(top.map(p=>[p[0],p[1]+23]),palette.faint,1,.8);
  for(let i=0;i<18;i++)line([[i*62+8,y+13],[i*62+28,y+13]],palette.faint,.8,.7);
}
function note(content,x,y,to,color=palette.soft){text(content,x,y,{size:18,italic:true,serif:true,color});if(to)arrow([x+10,y+11],to,color,1,.7);}
function formula(content,x=500,y=637,size=22){text(content,x,y,{size,color:palette.ink,serif:true,align:'center',italic:true});}

function drawIntro(t,ending=false){
  const p=smooth(t/9),cx=ending?575:mix(400,500,smooth(t/11)),cy=526;
  ctx.save();ctx.globalAlpha=.55;
  ellipse(480,302,340,185,palette.faint,.8,-.23);ellipse(480,302,320,240,palette.faint,.7,.3);
  ctx.restore();
  const sats=[[220,215],[540,100],[790,210],[820,390]];
  sats.forEach((s,i)=>{const a=smooth((t-i*.9)/3);satellite(s[0],s[1],colors[i],.72,-.25+i*.22,a);const dest=[cx,cy-36];pencil([s,dest],colors[i],1.1,a*(ending?.6:.28));if(i<3&&a>.9)text(`s${'₁₂₃'[i]}`,s[0]+46,s[1]+6,{size:15,color:colors[i],serif:true});});
  pencil([[0,525],[100,524],[200,529],[340,526],[490,528],[620,522],[800,526],[1000,523]],palette.soft,1.2,.65);
  pencil([[0,550],[190,548],[330,552],[500,550],[720,548],[1000,551]],palette.faint,1);
  pencil([[0,509],[70,492],[130,500],[210,477],[280,506]],palette.faint,1);
  pencil([[710,510],[790,479],[850,487],[930,467],[1000,485]],palette.faint,1);
  tree(145,523,.75);tree(183,523,.52);tree(875,522,.6);
  for(let i=0;i<13;i++)pencil([[40+i*76,540],[64+i*76,540]],palette.faint,1);
  car(cx,cy,1.1);dotAt([cx,cy-55],palette.ochre,4);
  note(ending?'Her er du.':'Du er her.',cx+95,cy-70,[cx+9,cy-48],palette.ink);
  text('20 200 km over hverdagen',435,47,{size:18,italic:true,serif:true,color:palette.soft,opacity:p});
  text(ending?'Avstand + tid + bevegelse':'Signalene kommer én vei. Kunnskapen går langt.',500,625,{align:'center',size:17,italic:true,serif:true,color:palette.soft});
  if(ending){ellipse(cx,cy-36,70,70,alpha(palette.green,.35),1);text('● posisjon funnet',cx-55,cy+64,{size:13,color:palette.green});}
}

const flatSats=[[325,280],[675,280],[490,150],[790,440]],flatReceiver=[500,475];
function drawFlat(scene,t){
  const count=scene.count,progress=smooth((t-.7)/4.5),radii=flatSats.map(s=>distance(s,flatReceiver));
  const correction=count===4 ? smooth((t-5)/9) : 1,bias=count===4?43*(1-correction):0;
  // Map-like registration marks, deliberately sparse.
  for(let x=100;x<950;x+=125)for(let y=90;y<630;y+=110){line([[x-3,y],[x+3,y]],palette.faint,.7,.5);line([[x,y-3],[x,y+3]],palette.faint,.7,.5);}
  for(let i=0;i<count;i++){
    const reveal=i===count-1?progress:1,r=radii[i]+bias;
    ctx.save();ctx.globalAlpha*=reveal;
    ellipse(flatSats[i][0],flatSats[i][1],r,r,colors[i],1.7,0,alpha(colors[i],.035),reveal);
    if(t>7&&count>=3){
      const corner=[flatReceiver[0],flatSats[i][1]];
      pencil([flatSats[i],corner,flatReceiver],colors[i],.95,.38*smooth((t-7)/4));
      pencil([flatSats[i],flatReceiver],colors[i],1.5,.65*smooth((t-7)/4));
      const sign=flatSats[i][0]>flatReceiver[0]?1:-1,vert=flatSats[i][1]>flatReceiver[1]?1:-1;
      line([[corner[0]+sign*9,corner[1]],[corner[0]+sign*9,corner[1]-vert*9],[corner[0],corner[1]-vert*9]],colors[i],1,.5);
    }
    satellite(...flatSats[i],colors[i],.58,.12-i*.13);
    text(`${i+1}`,flatSats[i][0]+40,flatSats[i][1]-18,{size:14,color:colors[i],serif:true});ctx.restore();
  }
  if(count===1){
    const s=flatSats[0],r=radii[0];
    [0,.7,1.5,2.3,3.3,4].forEach((angle,i)=>{const point=[s[0]+Math.cos(angle)*r,s[1]+Math.sin(angle)*r];dotAt(point,palette.blue,3,false);if(i===1)note('Kanskje her?',point[0]+20,point[1]+30);});
    const a=s,b=flatReceiver;arrow(a,b,palette.blue,1.2,progress);text('r = c · Δt',415,360,{size:23,color:palette.blue,serif:true,italic:true,opacity:progress});
    text('Samme avstand. Alle retninger.',500,638,{align:'center',size:20,italic:true,serif:true});
  }
  if(count>=2){
    const hits=circleIntersections(flatSats[0],radii[0],flatSats[1],radii[1]);
    hits.forEach(point=>{
      const isCorrect=distance(point,flatReceiver)<1, rejected=count>=3&&!isCorrect;
      ctx.save();ctx.globalAlpha*=count===2?progress:1;
      if(rejected){crossOut(point,7);text('passer ikke avstand 3',point[0]+20,point[1]-10,{size:13,color:palette.coral,opacity:.85});}
      else if(count!==4||correction>.8){dotAt(point,isCorrect&&count>=3?palette.ink:palette.ochre,5);if(!isCorrect)text('også mulig',point[0]+20,point[1]-9,{size:16,italic:true,serif:true});}
      ctx.restore();
    });
  }
  if(count>=3){car(...add(flatReceiver,[0,12]),.7);note('Et møtested.',585,537,[512,483],palette.ink);}
  if(count===2)text('To avstander. To kandidater.',500,638,{align:'center',size:20,italic:true,serif:true});
  if(count===3)formula('(x − xᵢ)² + (y − yᵢ)² = rᵢ²');
  if(count===4){
    text('Samme tidsfeil i alle målingene',500,590,{align:'center',size:16,italic:true,serif:true});
    line([[340,622],[660,622]],palette.faint,2);dotAt([mix(650,350,correction),622],palette.green,4);
    text(correction<.98?'δt korrigeres …':'δt funnet  ·  sirklene er enige',500,660,{align:'center',size:17,color:palette.green,italic:true,serif:true});
  }
}

function drawLift(t){
  const p=smooth(t/10),cx=480,cy=340,r=225;
  ellipse(cx,cy,r,r,palette.blue,1.4,0,alpha(palette.blue,.03));
  for(let i=0;i<6;i++){const angle=i*Math.PI/6;ellipse(cx,cy,r,Math.max(1,r*Math.sin(angle)*p),alpha(palette.blue,.22+.2*p),1,angle*p);}
  const gradient=ctx.createRadialGradient(cx-r*.3,cy-r*.3,10,cx,cy,r);gradient.addColorStop(0,alpha(palette.blue,.02));gradient.addColorStop(1,alpha(palette.blue,.13*p));ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
  satellite(cx,cy,palette.blue,.7);arrow([cx,cy+10],[cx+r*.8,cy+r*.6],palette.blue);
  text('r',cx+116,cy+60,{serif:true,size:25,color:palette.blue,italic:true});
  formula('En avstand er den samme. Mulighetsrommet får dybde.',500,650,19);
  text('x',730,350,{size:17,serif:true});text('y',485,83,{size:17,serif:true});text('z',mix(480,335,p),mix(340,480,p),{size:17,serif:true,opacity:p});
}

function spaceState(scene,t){
  const reveal=smooth((t-.8)/5),amounts=SPACE_SATS.map((_,i)=>i<scene.count-1?1:i===scene.count-1?reveal:0);
  const corrected=scene.count===4?smooth((t-6)/12):1;
  const bias=scene.count===4?.22*(1-corrected):0;
  const orbit=reducedMotion.matches?0:Math.sin(t/24)*.08;
  const camera=cameraBasis(.64+orbit,.2,[0,-.05,0],9.2);
  return {amounts,bias,corrected,camera};
}

function drawSpace(scene,t){
  const {amounts,bias,corrected,camera}=spaceState(scene,t);
  const P=p=>project(p,camera,width,height);
  const labelScale=clamp(width/950,.65,1.2),S=v=>v*labelScale;
  ctx.save();ctx.setTransform(dpr,0,0,dpr,0,0);
  if(!sphereRenderer.available){
    SPACE_SATS.forEach((s,i)=>{if(!amounts[i])return;const q=P(s),edge=P(add(s,[SPACE_RADII[i]+bias,0,0])),r=Math.abs(edge[0]-q[0]);const gradient=ctx.createRadialGradient(q[0]-r*.3,q[1]-r*.3,0,q[0],q[1],r);gradient.addColorStop(0,alpha(colors[i],.04*amounts[i]));gradient.addColorStop(.8,alpha(colors[i],.12*amounts[i]));gradient.addColorStop(1,alpha(colors[i],.025*amounts[i]));ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(q[0],q[1],r,0,Math.PI*2);ctx.fill();});
  }
  // Project true intersection circles. They remain curves, never dashed unions.
  if(scene.count>=2){
    for(let i=0;i<scene.count;i++)for(let j=i+1;j<scene.count;j++){
      const circle=sphereCircle(SPACE_SATS[i],SPACE_RADII[i]+bias,SPACE_SATS[j],SPACE_RADII[j]+bias);
      if(!circle)continue;
      const opacity=Math.min(amounts[i],amounts[j])*(scene.count===2?.85:.37);
      const points=Array.from({length:181},(_,k)=>P(circlePoint(circle,k*Math.PI*2/180)));
      line(points,colors[i],S(2.9),opacity*.8);line(points,colors[j],S(1.4),opacity);
      if(scene.count===2&&t>5){const p=P(circlePoint(circle,1.8));text('hele denne sirkelen',p[0]+S(20),p[1]+S(22),{size:S(16),serif:true,italic:true,color:palette.ink,opacity:smooth((t-5)/3)});}
    }
  }
  if(scene.count>=3){
    const hits=trilaterate(SPACE_SATS[0],SPACE_RADII[0],SPACE_SATS[1],SPACE_RADII[1],SPACE_SATS[2],SPACE_RADII[2]);
    const reveal=scene.count===3?amounts[2]:corrected;
    hits.forEach(p=>{
      const q=P(p),good=distance(p,SPACE_RECEIVER)<.01;
      ctx.save();ctx.globalAlpha*=reveal;
      if(!good){
        dotAt(q,palette.coral,S(4));
        if(scene.count===3&&t>11){const a=smooth((t-11)/3);ctx.globalAlpha*=a;crossOut(q,S(9));text('langt over bakken',q[0]-S(22),q[1]-S(62),{align:'right',size:S(14),color:palette.coral,italic:true,serif:true});pencil([[q[0]-S(60),q[1]-S(53)],[q[0]-S(8),q[1]-S(14)]],palette.coral,S(1));}
        if(scene.count===4&&corrected>.8){crossOut(q,S(8));text('passer ikke fjerde avstand',q[0]-S(22),q[1]-S(62),{align:'right',size:S(13),color:palette.coral,italic:true,serif:true});pencil([[q[0]-S(60),q[1]-S(53)],[q[0]-S(8),q[1]-S(14)]],palette.coral,S(1));}
      } else {
        dotAt(q,palette.ink,S(5));
        if(scene.count===3&&t>11||scene.count===4&&corrected>.75){
          // Local tangent patch; scale intentionally enlarged, not a whole Earth.
          const patch=Array.from({length:50},(_,i)=>{const a=i*Math.PI*2/49;return P(add(SPACE_RECEIVER,[Math.cos(a)*.36,-.06,Math.sin(a)*.25]));});
          line(patch,palette.green,S(1.2),.6);
          car(q[0],q[1]+S(5),S(.42));
          text('ved bakken',q[0]-S(155),q[1]+S(65),{size:S(17),serif:true,italic:true,color:palette.ink});
          arrow([q[0]-S(95),q[1]+S(47)],[q[0]-S(12),q[1]+S(13)],palette.ink,S(1),.7);
        }
      }ctx.restore();
    });
  }
  SPACE_SATS.forEach((s,i)=>{
    if(amounts[i]===0)return;
    const p=P(s);satellite(p[0],p[1],colors[i],S(.48),-.15+i*.13,amounts[i]);
    text(`s${'₁₂₃₄'[i]}`,p[0]+S(35),p[1]-S(10),{size:S(14),color:colors[i],serif:true,opacity:amounts[i]});
    if(scene.count===1)arrow(p,P(SPACE_RECEIVER),palette.blue,S(1),amounts[i]*.8);
  });
  if(scene.count===4){
    const p=P(SPACE_RECEIVER);
    text(corrected<.96?'Felles klokkefeil: kulene er for store.':'Tre koordinater. Én klokkefeil. Ett felles sted.',width/2,height-S(30),{align:'center',size:S(17),italic:true,serif:true,color:corrected<.96?palette.soft:palette.green});
    if(corrected>.99){SPACE_SATS.forEach((s,i)=>line([P(s),p],colors[i],S(.8),.35));}
  }
  ctx.restore();
}

function station(x,y,scale=1,color=palette.ink){
  ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
  pencil([[-16,15],[0,-10],[16,15],[-16,15]],color,1.4);line([[0,-10],[0,-23]],color,1.4);ellipse(4,-24,15,5,color,1,-.5);line([[-7,16],[7,16]],color,2);ctx.restore();
}
function drawOrbit(t){
  const center=[465,375],er=138,phase=t/26,angle=-.9+phase*.42;
  ellipse(...center,337,228,palette.faint,1,-.22);
  ctx.save();ctx.fillStyle=alpha(palette.green,.08);ctx.beginPath();ctx.arc(...center,er,0,Math.PI*2);ctx.fill();ctx.restore();
  ellipse(...center,er,er,palette.soft,1.4);ellipse(...center,er*.6,er,palette.faint,.8,.3);ellipse(...center,er,er*.3,palette.faint,.8,-.2);
  pencil([[390,280],[415,270],[435,293],[429,319],[453,337],[431,362],[412,357],[398,384],[374,370],[368,340]],palette.green,1.4,.75);
  pencil([[478,399],[513,380],[543,391],[556,423],[532,442],[516,476],[490,459],[478,399]],palette.green,1.4,.7);
  const predicted=[center[0]+Math.cos(angle)*337,center[1]+Math.sin(angle)*228];
  const deviation=13*Math.sin(Math.PI*clamp((t-2)/20)),sat=add(predicted,[deviation,-deviation*.6]);
  const stations=[[370,300],[520,256],[584,410]];
  stations.forEach((s,i)=>{station(...s,.65);text('•',s[0]-26,s[1]+9,{color:palette.ochre,size:17});});
  const observe=smooth(t/5);
  stations.forEach((s,i)=>{drawPathProgress([sat,s],observe,colors[i],1.1);});
  satellite(...sat,palette.blue,.7,-.5);
  text('jorden',450,552,{size:19,serif:true,italic:true});
  text('banemodell',180,190,{size:17,serif:true,italic:true});arrow([270,195],[305,162],palette.soft,1);
  if(t>7){
    const upload=smooth((t-7)/6);drawPathProgress([stations[1],sat],upload,palette.ochre,2.7);arrow(stations[1],add(stations[1],mul(sub(sat,stations[1]),upload)),palette.ochre,1.5);
    text('nye efemerider',590,180,{size:19,color:palette.ochre,serif:true,italic:true,opacity:upload});text('+ klokkekorreksjon',590,205,{size:15,color:palette.ochre,serif:true,italic:true,opacity:upload});
  }
  if(t>15){
    const a=smooth((t-15)/5);dotAt(predicted,palette.coral,3);arrow(predicted,sat,palette.coral,1,a);
    text('avvik måles og modelleres',635,365,{size:16,color:palette.coral,serif:true,italic:true,opacity:a});text('(avviket er sterkt overdrevet)',635,389,{size:12,color:palette.soft,opacity:a});
  }
  if(t>22){const a=smooth((t-22)/2);text('ved behov: egen banemanøver',205,609,{size:17,serif:true,italic:true,opacity:a});pencil([[sat[0]-40,sat[1]+20],[sat[0]-70,sat[1]+35],[sat[0]-48,sat[1]+10]],palette.ochre,2,a);}
  formula('Observasjoner → beregnet bane → navigasjonsmelding',500,674,19);
}

function clock(x,y,r,offset,color){
  ellipse(x,y,r,r,color,1.5,0,alpha(color,.025));
  for(let i=0;i<12;i++){const a=i*Math.PI/6-Math.PI/2;pencil([[x+Math.cos(a)*(r-10),y+Math.sin(a)*(r-10)],[x+Math.cos(a)*(r-4),y+Math.sin(a)*(r-4)]],color,1.3);}
  arrow([x,y],[x+Math.cos(offset)*r*.7,y+Math.sin(offset)*r*.7],color,2);
  arrow([x,y],[x+r*.3,y-r*.25],color,2);dotAt([x,y],color,3,false);
}
function drawClocks(t){
  const p=clamp(t/22),r=106;
  clock(300,290,r,-Math.PI/2+p*.5,palette.soft);clock(680,290,r,-Math.PI/2+p*.5+smooth(t/15)*.22,palette.blue);
  text('på bakken',300,440,{align:'center',size:19,italic:true,serif:true});text('i satellitten',680,440,{align:'center',size:19,italic:true,serif:true,color:palette.blue});
  satellite(680,130,palette.blue,.53);station(300,148,.7,palette.soft);
  text('fart',220,511,{align:'right',size:15});line([[260,506],[260-75*smooth(t/5),506]],palette.coral,10);text('−7 μs',440,511,{size:18,color:palette.coral,serif:true,italic:true});
  text('gravitasjon',220,558,{align:'right',size:15});line([[260,553],[260+300*smooth((t-6)/6),553]],palette.green,10);text('+45 μs',650,558,{size:18,color:palette.green,serif:true,italic:true});
  text('per døgn · klokkevisernes forskjell er overdrevet',500,598,{align:'center',size:12,color:palette.soft});
  formula(t<15?'Netto: omtrent +38 mikrosekunder per døgn':'c × 0,000001 s ≈ 300 m',500,659,24);
}

function drawSpeed(t){
  const moving=smooth(t/10),carX=mix(270,660,moving),carP=[carX,490],sats=[[220,160],[500,100],[820,175],[890,350]];
  road(490);tree(115,489,.6);tree(904,490,.8);
  sats.forEach((s,i)=>{
    satellite(...s,colors[i],.52,-.2+i*.1);pencil([s,add(carP,[0,-30])],colors[i],1.1,.25+smooth((t-9)/4)*.5);
    if(t>10){const a=smooth((t-10)/3),foot=[carX,s[1]];pencil([s,foot,[carX,460]],colors[i],.9,a*.4);text(`r${'₁₂₃₄'[i]}`,mix(s[0],carX,.5),mix(s[1],460,.5)-8,{size:15,serif:true,color:colors[i],opacity:a});}
  });
  car(270,490,.8,.2);car(...carP,.9);
  text('A',270,547,{align:'center',size:22,serif:true,color:palette.soft});text('B',660,547,{align:'center',size:22,serif:true,color:palette.ink,opacity:moving});
  arrow([270,581],[carX,581],palette.ochre,1.4,moving);text('100 m på 5 s',465,609,{align:'center',size:20,serif:true,italic:true,color:palette.ochre,opacity:moving});
  formula('v̄ = Δs / Δt',500,670,25);
  if(t>10)text('Vi stopper her og tegner på målingene.',500,44,{align:'center',size:17,serif:true,italic:true,opacity:smooth((t-10)/3)});
}

function waveform(x,y,width,amplitude,cycles,color,phase=0){
  pencil(Array.from({length:Math.ceil(width/2)+1},(_,i)=>[x+i*2,y+Math.sin(i*2/width*Math.PI*2*cycles+phase)*amplitude]),color,1.3);
}
function drawDoppler(t){
  const move=smooth(t/12),cx=mix(390,550,move),receiver=[cx,425],sats=[[180,150],[660,100],[850,255],[255,300]],velocity=[100,0];
  road(454);car(cx,454,.9);
  sats.forEach((s,i)=>{
    satellite(...s,colors[i],.48,-.2+i*.2);pencil([s,receiver],colors[i],1,.65);
    const los=unit(sub(s,receiver)),projection=dot(velocity,los),base=add(receiver,mul(los,75));
    if(t>7){
      arrow(base,add(base,mul(los,projection*.75)),colors[i],2,smooth((t-7)/4));
      const mid=add(s,mul(sub(receiver,s),.43));text(`ρ̇${'₁₂₃₄'[i]}`,mid[0]+10,mid[1],{size:16,serif:true,color:colors[i]});
    }
    if(i<2){
      const ray=sub(receiver,s),len=distance(s,receiver),n=[-ray[1]/len,ray[0]/len];
      const points=Array.from({length:110},(_,k)=>{const f=k/109;return add(add(s,mul(ray,f)),mul(n,Math.sin(f*25-t*.5)*3));});line(points,colors[i],.8,.5);
    }
  });
  arrow(add(receiver,[0,3]),add(receiver,[110,3]),palette.ink,2);text('v',cx+112,receiver[1]-5,{size:23,serif:true,italic:true,color:palette.ink});
  if(t>13){const a=smooth((t-13)/4);arrow([660,69],[705,57],palette.ochre,1.4,a);text('satellittens bevegelse',710,56,{size:13,serif:true,italic:true,opacity:a});}
  waveform(180,552,220,14,6,palette.soft);waveform(590,552,220,14,8.3,palette.blue);
  text('uten avstandsendring: f₀',290,601,{align:'center',size:16,serif:true,italic:true});text('avstanden minker: f₀ + Δf',700,601,{align:'center',size:16,serif:true,italic:true,color:palette.blue});
  formula('ρ̇ᵢ = uᵢ · (v_sat,i − v_bil) + c · δṫ',500,666,22);
  text('Bølger og pilstørrelser er skjematiske.',500,703,{align:'center',size:11});
}

function drawErrors(t){
  const cluster=smooth((t-9)/8),{receiver,satellites:sats,radii,triangle}=errorGeometry(cluster);
  sats.forEach((s,i)=>{
    ellipse(...s,radii[i],radii[i],alpha(colors[i],.15),12);ellipse(...s,radii[i],radii[i],colors[i],1.3);
    satellite(...s,colors[i],.47);pencil([s,receiver],colors[i],.8,.2);
  });
  if(triangle.length===3){
    ctx.beginPath();triangle.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=alpha(palette.ochre,.26);ctx.fill();pencil([...triangle,triangle[0]],palette.ochre,2);
    triangle.forEach(p=>dotAt(p,palette.ochre,3,false));
    const left=Math.min(...triangle.map(p=>p[0]));note('feiltrekanten',left-155,515,[left-4,490],palette.ochre);
    // A pencil magnifier keeps the small disagreement visible at normal size.
    const center=triangle.reduce((sum,p)=>add(sum,mul(p,1/3)),[0,0]),lens=[220,530];
    const zoom=Math.min(4,72/Math.max(...triangle.map(p=>distance(p,center))));
    const enlarged=triangle.map(p=>add(lens,mul(sub(p,center),zoom)));
    pencil([[left-18,486],[300,510]],palette.faint,.9);
    ellipse(...lens,82,82,palette.faint,1,0,alpha(palette.paper,.96));
    ctx.beginPath();enlarged.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle=alpha(palette.ochre,.23);ctx.fill();pencil([...enlarged,enlarged[0]],palette.ochre,2);
    enlarged.forEach(p=>dotAt(p,palette.ochre,3,false));text('forstørret utsnitt',220,638,{align:'center',serif:true,italic:true,size:15,color:palette.ochre});
  }
  dotAt(receiver,palette.ink,4);text('sann posisjon',receiver[0]+13,receiver[1]+29,{size:12,color:palette.ink});
  text(cluster<.5?'God spredning på himmelen':'Samme målefeil. Dårligere geometri.',500,605,{align:'center',size:21,serif:true,italic:true,color:cluster<.5?palette.green:palette.coral});
  formula('ρᵢ ± ε   →   et område, ikke et magisk perfekt punkt',500,664,19);
}

function building(x,y,w,h,color=palette.soft,glass=false){
  ctx.save();ctx.fillStyle=alpha(glass?palette.blue:palette.soft,glass?.055:.065);ctx.fillRect(x,y,w,h);pencil([[x,y+h],[x,y],[x+w,y-3],[x+w,y+h]],color,1.5);
  for(let row=0;row<Math.floor(h/30)-1;row++)for(let col=0;col<Math.floor(w/24)-1;col++){
    const px=x+14+col*24,py=y+16+row*30;line([[px,py],[px+11,py],[px+11,py+16]],color,.8,.35);
  }
  if(glass){pencil([[x+5,y+40],[x+w-8,y+90]],palette.blue,1,.3);pencil([[x+7,y+160],[x+w-6,y+210]],palette.blue,1,.3);}
  ctx.restore();
}
function reflectionPoint(s,receiver,wallX){
  const mirror=[2*wallX-s[0],s[1]],f=(wallX-mirror[0])/(receiver[0]-mirror[0]);
  return [wallX,mix(mirror[1],receiver[1],f)];
}
function drawMultipath(t){
  const progress=smooth(t/15),carX=mix(270,690,progress),receiver=[carX,530],sat=[190,90],reflect=reflectionPoint(sat,receiver,800),blocked=smooth((carX-480)/45);
  building(470,330,100,210,palette.soft);building(800,220,105,320,palette.blue,true);road(565);
  text('skjerming',455,312,{size:15,serif:true,italic:true});text('glassfasade',798,195,{size:16,color:palette.blue,serif:true,italic:true});
  satellite(...sat,palette.blue,.65,-.2);
  const directOpacity=1-blocked*.8;pencil([sat,receiver],palette.green,1.5,directOpacity);
  if(blocked>.1){
    const f=(470-sat[0])/(receiver[0]-sat[0]),hit=[470,mix(sat[1],receiver[1],f)];
    pencil([sat,hit],palette.green,1.6);crossOut(hit,7);
    drawPathProgress([sat,reflect,receiver],smooth((t-6)/6),palette.ochre,2.2);
    dotAt(reflect,palette.ochre,4);
    const extra=distance(sat,reflect)+distance(reflect,receiver)-distance(sat,receiver);
    const falseBoundary=add(sat,mul(unit(sub(receiver,sat)),distance(sat,receiver)+extra));
    // One biased range alone defines a false boundary, not a unique GPS fix.
    // This ghost is a candidate on that boundary, explicitly labelled as such.
    const ghost=receiver.map((x,i)=>mix(x,falseBoundary[i],smooth((t-11)/6)));
    car(ghost[0],ghost[1]+35,.8,.3,palette.coral);pencil([receiver,ghost],palette.coral,1,blocked*.6);
    text('mulig spøkelsesposisjon',Math.min(ghost[0]+25,735),Math.min(ghost[1]+70,669),{size:15,serif:true,italic:true,color:palette.coral,opacity:smooth((t-11)/5)});
    text('ekkoet tar en lengre vei',370,200,{size:18,serif:true,italic:true,color:palette.ochre,opacity:blocked});
  }
  car(carX,565,.87);dotAt(receiver,palette.ink,3);
  text('Den bleke bilen er skjematisk; flere målinger bestemmer den faktiske feilplasseringen.',500,699,{size:11,align:'center'});
}

function drawJamming(t){
  const cx=mix(260,700,smooth(t/17)),enter=clamp((cx-435)/120),receiver=[cx,510];
  const zone=[690,410];
  ctx.save();ctx.beginPath();ctx.ellipse(...zone,255,200,0,0,Math.PI*2);ctx.clip();
  for(let i=0;i<23;i++){pencil([[400+i*22,200],[250+i*22,650]],palette.ochre,.7,.17);}
  ctx.restore();
  ellipse(...zone,255,200,alpha(palette.ochre,.23),1);
  road(550);car(cx,550,.9);
  [[220,130],[490,90],[790,145],[870,285]].forEach((s,i)=>{
    satellite(...s,colors[i],.49,-.2+i*.1);pencil([s,receiver],colors[i],1.1,Math.max(.07,1-enter));
  });
  station(...zone,.9,palette.ochre);text('radiostøy',zone[0]+30,zone[1]+15,{size:17,serif:true,italic:true,color:palette.ochre});
  if(enter>.1){
    const last=[435,510];dotAt(last,palette.coral,5);car(435,550,.9,.18,palette.coral);note('siste gyldige posisjon',125,603,[430,520],palette.coral);
    text('GPS: posisjon utilgjengelig   ·   fart: —',cx-85,598,{size:13,color:palette.coral});
  }
  const x=220,y=665;
  waveform(x,y,560,5,20,palette.blue,t*.4);
  const noise=Array.from({length:281},(_,i)=>[x+i*2,y+enter*(Math.sin(i*2.7+t*.15)+Math.sin(i*1.17)+Math.cos(i*4.71)) *13]);
  line(noise,palette.ochre,1,.7);
  text('svakt satellittsignal',210,712,{size:13,color:palette.blue});text('støyen tar over',610,712,{size:13,color:palette.ochre,opacity:enter});
}

function resize(){
  const rect=canvas.getBoundingClientRect();width=rect.width;height=rect.height;dpr=Math.min(devicePixelRatio||1,2);fit=Math.min(width/1000,height/740);
  canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
  // Cap the ray renderer independently to keep the full-HD story quiet on laptops.
  const gpuDpr=Math.min(dpr,1.35);sphereCanvas.width=Math.round(width*gpuDpr);sphereCanvas.height=Math.round(height*gpuDpr);lastPaint=-1;
  render();
}

function currentScene(){return Math.min(scenes.length-1,scenes.findIndex(s=>time<s.start+s.duration) < 0?scenes.length-1:scenes.findIndex(s=>time<s.start+s.duration));}
function updatePlayButton(){
  $('play').setAttribute('aria-label',playing?'Pause':time>=total?'Spill på nytt':'Spill');
  $('play-icon').setAttribute('d',playing?'M6 4v12M14 4v12':'M6 3l10 7-10 7z');
}
function updateNarrative(scene,index,localTime){
  if(index!==activeIndex){
    activeIndex=index;activeBeat=-1;
    $('scene-title').innerHTML=scene.title.replaceAll('<br>','<br> ');
    $('scene-category').textContent=scene.category;
    $('scene-number').textContent=`${String(index+1).padStart(2,'0')} / ${scenes.length}`;
    $('drawing-label').textContent=scene.label;$('dimension').textContent=scene.dimension;$('insight-text').textContent=scene.insight;
    $('illustration').setAttribute('aria-label',`${scene.short}. ${scene.label.toLowerCase()}.`);
    $('reading-note').textContent=index===0?'Len deg tilbake. Vi tegner det underveis.':index===17?'Se igjen, eller ta en omvei gjennom kapitlene.':'Du kan stoppe tiden. Tegningen venter på deg.';
    document.querySelectorAll('.chapter-item').forEach((button,i)=>button.setAttribute('aria-current',String(i===index)));
  }
  const beat=Math.min(scene.beats.length-1,Math.floor(localTime/scene.duration*scene.beats.length));
  if(beat!==activeBeat){activeBeat=beat;$('scene-copy').textContent=scene.beats[beat];}
  const beatProgress=localTime/scene.duration*scene.beats.length-beat;
  const fade=!playing||reducedMotion.matches?1:.35+.65*Math.min(smooth(beatProgress/.1),smooth((1-beatProgress)/.07));
  $('scene-copy').style.opacity=String(fade);
  $('scene-copy').style.transform=`translateY(${(1-fade)*6}px)`;
  const sceneFade=reducedMotion.matches?1:.55+.45*smooth(localTime/1.3);
  $('scene-title').style.opacity=String(sceneFade);
}

function render(){
  if(!width||!height)return;
  const index=currentScene(),scene=scenes[index],t=clamp(time-scene.start,0,scene.duration);
  updateNarrative(scene,index,t);
  ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.setTransform(dpr,0,0,dpr,0,0);
  ctx.translate((width-1000*fit)/2,(height-740*fit)/2);ctx.scale(fit,fit);
  // Drawings breathe away into paper, then the next sheet arrives.
  const entrance=index===0?1:smooth(t/1.2),exit=index===scenes.length-1?1:smooth((scene.duration-t)/1.1);
  ctx.globalAlpha=reducedMotion.matches?1:mix(.15,1,Math.min(entrance,exit));
  const inSpace=scene.kind==='space';
  sphereCanvas.style.opacity=inSpace&&sphereRenderer.available?String(ctx.globalAlpha):'0';
  if(inSpace){const state=spaceState(scene,t);sphereRenderer.render(state.camera,state.amounts,state.bias);drawSpace(scene,t);}
  else if(scene.kind==='intro')drawIntro(t);
  else if(scene.kind==='ending')drawIntro(t,true);
  else if(scene.kind==='flat')drawFlat(scene,t);
  else if(scene.kind==='lift')drawLift(t);
  else if(scene.kind==='orbit')drawOrbit(t);
  else if(scene.kind==='clocks')drawClocks(t);
  else if(scene.kind==='speed')drawSpeed(t);
  else if(scene.kind==='doppler')drawDoppler(t);
  else if(scene.kind==='errors')drawErrors(t);
  else if(scene.kind==='multipath')drawMultipath(t);
  else if(scene.kind==='jamming')drawJamming(t);
  ctx.globalAlpha=1;
  $('elapsed').textContent=formatTime(time);$('scrubber').value=String(time);$('scrubber').style.setProperty('--progress',`${time/total*100}%`);
  $('scrubber').setAttribute('aria-valuetext',`${formatTime(time)} av ${formatTime(total)}. ${scene.short}`);
}

function seek(value){time=clamp(value,0,total);lastFrame=null;lastPaint=-1;if(time>=total){playing=false;updatePlayButton();}render();}
function togglePlay(){if(time>=total)seek(0);playing=!playing;lastFrame=null;updatePlayButton();render();}
function tick(timestamp){
  if(playing&&!document.hidden){
    if(lastFrame!==null)time=Math.min(total,time+Math.min((timestamp-lastFrame)/1000,.25)*rate);
    lastFrame=timestamp;
    if(timestamp-lastPaint>1000/30){render();lastPaint=timestamp;}
    if(time>=total){playing=false;updatePlayButton();render();}
  }else lastFrame=null;
  requestAnimationFrame(tick);
}
$('play').addEventListener('click',togglePlay);
$('scrubber').addEventListener('input',event=>seek(Number(event.target.value)));
$('previous').addEventListener('click',()=>{const i=currentScene();seek(time-scenes[i].start>3?scenes[i].start:scenes[Math.max(0,i-1)].start);});
$('next').addEventListener('click',()=>seek(scenes[Math.min(scenes.length-1,currentScene()+1)].start));
$('speed').addEventListener('change',event=>{rate=Number(event.target.value);});
$('home').addEventListener('click',event=>{event.preventDefault();seek(0);});
function openDialog(id){suspendedPlaying=playing;playing=false;updatePlayButton();$(id).showModal();}
function closeDialog(dialog){dialog.close();}
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.querySelector('[data-close]').addEventListener('click',()=>closeDialog(dialog));
  dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog(dialog);}});
  dialog.addEventListener('close',()=>{playing=suspendedPlaying&&time<total;lastFrame=null;updatePlayButton();});
});
$('chapters').addEventListener('click',()=>openDialog('chapter-dialog'));
$('about').addEventListener('click',()=>openDialog('about-dialog'));
scenes.forEach((scene,i)=>{
  const button=document.createElement('button');button.className='chapter-item';
  const number=document.createElement('span');number.className='num';number.textContent=String(i+1).padStart(2,'0');
  const label=document.createElement('span');label.textContent=scene.short;
  const stamp=document.createElement('time');stamp.textContent=formatTime(scene.start);
  button.append(number,label,stamp);button.addEventListener('click',()=>{seek(scene.start);closeDialog($('chapter-dialog'));});$('chapter-list').append(button);
  if(i){const mark=document.createElement('i');mark.style.left=`${scene.start/total*100}%`;$('chapter-ticks').append(mark);}
});
$('fullscreen').addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
  catch{$('fullscreen').title='Fullskjerm støttes ikke her. Bruk nettleserens fullskjermvalg.';}
});
document.addEventListener('fullscreenchange',()=>{$('fullscreen').setAttribute('aria-label',document.fullscreenElement?'Avslutt fullskjerm':'Fullskjerm');});
document.addEventListener('keydown',event=>{
  if(document.querySelector('dialog[open]')||['INPUT','SELECT','BUTTON','A'].includes(document.activeElement.tagName))return;
  if(event.code==='Space'){event.preventDefault();togglePlay();}
  if(event.code==='ArrowLeft'){event.preventDefault();seek(time-10);}
  if(event.code==='ArrowRight'){event.preventDefault();seek(time+10);}
});
document.addEventListener('visibilitychange',()=>{lastFrame=null;});
reducedMotion.addEventListener('change',event=>{if(event.matches){playing=false;updatePlayButton();render();}});
new ResizeObserver(resize).observe($('illustration'));
updatePlayButton();requestAnimationFrame(tick);
