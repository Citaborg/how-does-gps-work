'use strict';

const beats = [
 ['2D · Avstandssirkler','Alt starter med et signal','Bilen lytter etter satellittens sendetid og banedata. Reisetiden gir én avstand, og dermed en hel sirkel av mulige posisjoner.','Vi starter med synkroniserte klokker. Én mikrosekund klokkefeil tilsvarer omtrent 300 meter.',14],
 ['2D · Avstandssirkler','To steder å lete','Et signal til gir en ny sirkel. Bare i de to skjæringspunktene stemmer begge avstandene.','Bilen står stille mens vi tegner. Linjene tilbake til satellittene viser avstandene.',11],
 ['2D · Avstandssirkler','Én posisjon står igjen','Den tredje sirkelen går gjennom bare ett punkt. Trekanten viser forholdet mellom bilen og de første satellittene.','Dette er trilaterasjon. Avstandene bestemmer geometrien. Vinklene følger av avstandene.',12],
 ['2D · Avstandssirkler','En måling til','Den fjerde sirkelen treffer samme punkt. I planet, med kjent tid, kan vi bruke målingen til å sjekke svaret.','I rommet trenger vi også høyden. Der skal en fjerde måling hjelpe med en ukjent klokke.',10],
 ['3D · Avstandskuler','Sirkelen blir en kule','Tenk deg at vi løfter tegningen av papiret. Alle punkter på kuleflaten ligger like langt fra satellitten.','Den gjennomsiktige kulen viser hvor mottakeren kan være.',12],
 ['3D · Avstandskuler','Kulene møtes i en sirkel','Den neste kuleflaten skjærer gjennom den første. Den mørke linjen følger punktene som oppfyller begge avstandene.','Snittet ligger i et plan vinkelrett på linjen mellom satellittene.',11],
 ['3D · Avstandskuler','To punkter i rommet','Den tredje kuleflaten skjærer sirkelen i to punkter. Begge passer målingene, men i denne modellen ligger ett av dem under bakken.','Vi viser bare et lite utsnitt av bakken rundt bilen. Skissen er ikke i målestokk.',13],
 ['3D · Avstandskuler','Fire målinger, én klokke','Klokkefeilen forskyver alle de målte avstandene like mye. Se radiene justeres sammen til alle fire flatene passer med én posisjon.','De fire ukjente er tre posisjonskoordinater og én klokkefeil. Mottakeren kan bruke flere signaler når de er tilgjengelige.',15],
 ['Bane og tid','Hvem følger satellitten?','Bakkestasjoner med kjente posisjoner måler satellittenes radiosignaler. Kontrollsenteret beregner banene og klokkeavvikene.','En bakkeantenne laster opp efemerider og klokkekorreksjoner som satellitten kringkaster videre. Ved behov kan kontrollsenteret også be satellitten manøvrere.',19],
 ['Fart · Dopplereffekt','Signalet røper farten','Når avstanden minker, øker den mottatte frekvensen. Når avstanden øker, synker frekvensen.','Flere siktelinjer lar mottakeren løse for hastighet og klokkedrift. Den regner også med satellittenes bevegelser.',19],
 ['Signalforhold · Refleksjon','En bil, to signalveier','Bilen kjører inn bak en bygning. Den direkte banen svekkes. Et ekko fra en glassfasade går en lengre vei, som kan se ut som en større avstand.','Feiltrekanten viser sann posisjon, spøkelsesposisjon og projeksjonen langs veien. Her får én måling ekkofeil.',20],
 ['Signalforhold · Radiostøy','Når signalene drukner','I et område med sterk radiostøy blir signalene vanskeligere å skille ut. Når for få kan spores, mister mottakeren posisjonslåsen.','Det kalles jamming når radiostøy brukes til å forstyrre mottaket. Når støyen avtar, kan signalene spores igjen.',18]
];
const times = [0];
for (const beat of beats) times.push(times.at(-1)+beat[4]);
const total = times.at(-1);
const $ = id => document.getElementById(id);
const canvas = $('drawing'), g = canvas.getContext('2d');
const W = 960, H = 610, tau = 2*Math.PI;
const ink = '#254236', muted = '#657461', red = '#a34d40';
const colors = ['#197171','#a95035','#615898','#946317'];
const sats = [[284,252],[593,218],[655,417],[351,488]];
const position = [461,368];
const add = (a,b) => a.map((v,i)=>v+b[i]);
const sub = (a,b) => a.map((v,i)=>v-b[i]);
const scale = (a,s) => a.map(v=>v*s);
const dot = (a,b) => a.reduce((sum,v,i)=>sum+v*b[i],0);
const norm = a => Math.hypot(...a);
const distance = (a,b) => norm(sub(a,b));
const unit = a => scale(a,1/norm(a));
const cross = ([a,b,c],[x,y,z]) => [b*z-c*y,c*x-a*z,a*y-b*x];
const clamp = t => Math.max(0,Math.min(1,t));
const smooth = t => clamp(t)**2*(3-2*clamp(t));
const mix = (a,b,t) => a+(b-a)*t;
const between = (a,b,t) => add(a,scale(sub(b,a),t));
const random = n => ((Math.sin(n*71.173+4.13)*43758.5453)%1+1)%1;
const rgba = (hex,a) => 'rgba('+[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)).join(',')+','+a+')';

function path(points,color,width=1.4,fill=null) {
  g.beginPath();
  points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));
  if(fill) { g.closePath(); g.fillStyle=fill; g.fill(); }
  if(color) { g.strokeStyle=color; g.lineWidth=width; g.stroke(); }
}
function pencil(a,b,color=ink,width=1.4) {
  const [dx,dy]=sub(b,a);
  const length=Math.hypot(dx,dy)||1;
  const points=Array.from({length:9},(_,i)=>add(between(a,b,i/8),scale([-dy/length,dx/length],Math.min(1.35,length/70)*Math.sin(i*2.4)*Math.sin(i*Math.PI/8))));
  path(points,color,width);
}
function curve(center,radius,start,end,color,width=1.5,fill=null) {
  const count=Math.max(3,Math.ceil(27*Math.abs(end-start)));
  path(Array.from({length:count+1},(_,i)=>{
    const a=mix(start,end,i/count), r=radius+.55*Math.sin(9*a)+.32*Math.sin(19*a);
    return add(center,[r*Math.cos(a),r*Math.sin(a)]);
  }),color,width,fill);
}
function disc([x,y],r,fill,stroke=null,width=1) {
  g.beginPath(); g.arc(x,y,r,0,tau); g.fillStyle=fill; g.fill();
  if(stroke) { g.strokeStyle=stroke; g.lineWidth=width; g.stroke(); }
}
function label(text,[x,y],color=ink,size=17,paper=false) {
  g.font='italic '+size+'px Georgia, serif';
  if(paper) {
    g.fillStyle='#f5ecd9ed';
    g.fillRect(x-4,y-size+1,g.measureText(text).width+8,size+5);
  }
  g.fillStyle=color; g.fillText(text,x,y);
}
function arrow(a,b,color=ink,width=1.7) {
  pencil(a,b,color,width);
  const angle=Math.atan2(b[1]-a[1],b[0]-a[0]);
  path([add(b,[-10*Math.cos(angle-.5),-10*Math.sin(angle-.5)]),b,add(b,[-10*Math.cos(angle+.5),-10*Math.sin(angle+.5)])],color,width);
}
function marker(p,color=ink) { disc(p,8,'#f6edd5',color,1.3); disc(p,4.6,color); }
function reject(p) {
  pencil(add(p,[-9,-9]),add(p,[9,9]),red,2.6);
  pencil(add(p,[-9,9]),add(p,[9,-9]),red,2.6);
}
function satellite([x,y],color,s=1) {
  g.save(); g.translate(x,y); g.rotate(-.29); g.scale(s,s);
  path([[-32,-8],[-11,-9],[-10,9],[-32,8]],color,1.6,rgba(color,.24));
  path([[10,-9],[32,-8],[32,8],[10,9]],color,1.6,rgba(color,.24));
  for(const k of [-25,-18,17,24]) pencil([k,-8],[k,8],color,.7);
  pencil([-31,0],[-10,0],color,.8); pencil([10,0],[31,0],color,.8);
  path([[-9,-10],[8,-10],[9,9],[-8,10]],ink,1.4,'#e6b16a');
  pencil([0,-10],[0,-20]); path([[-6,-22],[0,-19],[6,-23]],ink);
  g.restore();
}
function car([x,y],angle=-.17,ghost=false) {
  g.save(); g.translate(x,y); g.rotate(angle);
  const color=ghost?red:ink;
  g.fillStyle=color;
  for(const [a,b] of [[-12,-10],[8,-10],[-12,7],[8,7]]) g.fillRect(a,b,6,4);
  path([[-17,-6],[-11,-9],[8,-9],[17,-6],[17,5],[10,8],[-12,8],[-17,5]],color,1.5,ghost?'#e5a89c':'#e5aa60');
  path([[-6,-6],[6,-6],[9,-4],[9,4],[5,6],[-6,5]],color,1.1,'#f6e8ac');
  pencil([5,-6],[5,6],color,.9); g.restore();
}
function layer(draw) {
  const surface=document.createElement('canvas');
  surface.width=W; surface.height=H;
  g.save();
  draw();
  surface.getContext('2d').drawImage(canvas,0,0);
  g.restore();
  g.clearRect(0,0,W,H);
  return surface;
}
const paper=layer(()=>{
  const tone=g.createRadialGradient(445,275,60,465,285,580);
  tone.addColorStop(0,'#f8efdb'); tone.addColorStop(1,'#e9dec3');
  g.fillStyle=tone; g.fillRect(0,0,W,H);
  for(let i=0;i<19000;i++) {
    g.fillStyle=i%3?'#795d3220':'#ffffff53';
    g.fillRect(random(i*2)*W,random(i*2+1)*H,1+random(i*3)*1.5,1);
  }
  for(let x=25;x<W;x+=35) for(let y=64;y<H-41;y+=35) disc([x,y],.8,'#68766048');
});
const roadY=x=>368-(x-461)*.17+23*(Math.cos((x-461)/115)-1);
const roadPoint=x=>[x,roadY(x)];
const roadAngle=x=>Math.atan(-.17-.2*Math.sin((x-461)/115));
const map=layer(()=>{
  for(let side=0;side<2;side++) for(let band=0;band<7;band++) {
    const points=Array.from({length:95},(_,i)=>{
      const x=i*11-32;
      return [x,(side?470:110)+band*14+15*Math.sin(x/105+band*.11)+11*Math.sin(x/46+side)];
    });
    path(points,'#73816448',1.04);
  }
  const river=Array.from({length:120},(_,i)=>[128+31*Math.sin(i/16)+i*.65,-12+i*5.3]);
  path(river,'#88aca780',15); path(river.map(([x,y])=>[x+7,y]),'#6c989785',1.25);
  for(let i=0;i<53;i++) {
    const x=65+random(i*3+133)*805,y=i%2?158+random(i*3+134)*82:430+random(i*3+135)*97;
    path([[x-7,y+3],[x-3,y-3],[x-5,y-3],[x,y-13],[x+5,y-3],[x+3,y-3],[x+7,y+3]],'#64816b91',1,'#a6ad8342');
    pencil([x,y+3],[x,y+7],'#64816b91',1);
  }
  const road=Array.from({length:105},(_,i)=>roadPoint(i*9.5-8));
  path(road,'#877d5a96',18); path(road,'#e1c795',15); path(road,'#f6e6c1',9);
  for(let i=0;i<road.length-2;i+=4) pencil(road[i],road[i+2],'#8d774890',1);
  label('N',[862,118],muted); arrow([867,164],[867,129],muted);
});
function sight(sat,p,i,amount=1) {
  const end=between(sat,p,amount);
  pencil(sat,end,colors[i],1.7);
  if(amount<.99) disc(end,3.5,'#f8ecd3',colors[i],1.4);
}
function draw2D(index,t) {
  g.drawImage(map,0,0);
  const x=index===0?mix(338,461,smooth(t/.19)):461;
  const p=roadPoint(x), reveal=smooth(t/.34), solved=smooth((t-.29)/.28);
  const axis=unit(sub(sats[1],sats[0]));
  const foot=add(sats[0],scale(axis,dot(sub(position,sats[0]),axis)));
  const mirror=sub(scale(foot,2),position);
  for(let i=0;i<=index;i++) {
    const progress=i===index?(index===0?mix(.48,1,reveal):reveal):1;
    const radius=distance(sats[i],i===0&&index===0?p:position);
    if(progress>0) curve(sats[i],radius,-Math.PI/2,-Math.PI/2+tau*progress,colors[i],2.25,progress===1?rgba(colors[i],.06):null);
  }
  if(index>=2&&solved>0) {
    path([sats[0],sats[1],position],rgba(ink,.46*solved),1.3,rgba('#c99d53',.18*solved));
    const [a,b]=sats.slice(0,2).map(s=>Math.atan2(s[1]-p[1],s[0]-p[0]));
    curve(p,32,a,b,ink,1.3);
    label('θ',add(p,[0,-39]),ink,17,true);
  }
  for(let i=0;i<=index;i++) {
    g.save(); g.globalAlpha=i===index&&index>0?reveal:1;
    satellite(sats[i],colors[i],.88);
    label('S'+(i+1),add(sats[i],[25,-16]),colors[i],16,true);
    sight(sats[i],p,i,i===index?mix(.48,1,smooth(t/.32)):1);
    if(i!==index||t>.31) label('d'+['₁','₂','₃','₄'][i],add(between(sats[i],p,.53),[4,-9]),colors[i],19,true);
    g.restore();
  }
  if(index>=1&&solved>0) {
    g.save(); g.globalAlpha=solved;
    marker(position);
    if(index===1) marker(mirror);
    if(index===2) reject(mirror);
    if(index<3) label(index===1?'Også mulig':'Passer ikke S3',add(mirror,[15,0]),index===1?ink:red,16,true);
    g.restore();
  }
  car(p,roadAngle(x));
  label(index===0?'d₁ = c × Δt':index===3?'Fire avstander, samme punkt':'Bilen',add(p,[22,29]),ink,index===0?24:17,true);
  if(index===0) label('avstand = lysfart × reisetid',add(p,[23,51]),muted,16,true);
  label('Åpent landskap',[65,523],muted,18);
}


const sats3=[[-149,64,98],[104,82,111.5],[45,174,180.5],[-33,-90,152]];
const target3=[-9,8,89];
const planeNormal=unit(cross(sub(sats3[1],sats3[0]),sub(sats3[2],sats3[0])));
const mirror3=sub(target3,scale(planeNormal,2*dot(sub(target3,sats3[0]),planeNormal)));
const ranges3=sats3.map(s=>distance(s,target3));
function sphere([x,y],r,color,a) {
  const glow=g.createRadialGradient(x-r*.28,y-r*.35,r*.06,x,y,r);
  for(const [stop,alpha] of [[0,.04],[.55,.18],[.88,.33],[.97,.17],[1,0]]) glow.addColorStop(stop,rgba(color,a*alpha));
  disc([x,y],r,glow);
}
function section(a,ra,b,rb) {
  const delta=sub(b,a), d=norm(delta), u=unit(delta), shift=(ra*ra-rb*rb+d*d)/(2*d);
  const r=Math.sqrt(Math.max(0,ra*ra-shift*shift));
  const origin=add(a,scale(u,shift));
  const v=unit(cross(u,Math.abs(u[2])>.95?[1,0,0]:[0,0,1])), w=cross(u,v);
  return Array.from({length:151},(_,i)=>add(origin,add(scale(v,r*Math.cos(tau*i/150)),scale(w,r*Math.sin(tau*i/150)))));
}
function draw3D(index,t,elapsed) {
  const a=.26+.47*Math.sin(elapsed*.079);
  const project=([x,y,z])=>[480+x*Math.cos(a)-y*Math.sin(a),283+.64*(x*Math.sin(a)+y*Math.cos(a))-.768*z];
  const reveal=smooth(t/.27), final=smooth((t-.49)/.28);
  const bias=index===3?30*smooth(t/.27)*(1-final):0;
  const p=project(target3), mirror=project(mirror3);
  if(index>=2) {
    const ground=[[-115,-74,89],[98,-74,89],[98,108,89],[-115,108,89]].map(project);
    g.save(); g.globalAlpha=index===2?smooth((t-.48)/.21):1;
    path([...ground,ground[0]],'#697b5b9c',1.4,'#aeb58766');
    for(let x=-109;x<88;x+=14) pencil(project([x,-74,89]),project([x+10,108,89]),'#72826243',1);
    pencil(project([-105,8,89]),project([83,8,89]),'#ac8654',5);
    g.restore();
  }
  g.save(); g.globalCompositeOperation='multiply';
  for(let i=0;i<=index;i++) {
    const visibility=i===index?mix(index===0?.25:0,1,reveal):1;
    if(visibility>0) sphere(project(sats3[i]),ranges3[i]+bias,colors[i],visibility);
  }
  g.restore();
  for(let i=0;i<=index;i++) for(let j=i+1;j<=index;j++) {
    const visibility=j===index?smooth((t-.17)/.22):1;
    if(visibility===0) continue;
    const ring=section(sats3[i],ranges3[i]+bias,sats3[j],ranges3[j]+bias).map(project);
    path(ring,rgba(i===0&&j===1?'#31495d':colors[j],visibility*(index===1?.96:.68)),i===0&&j===1?3.15:1.8);
  }
  for(let i=0;i<=index;i++) {
    const center=project(sats3[i]);
    g.save(); g.globalAlpha=i===index?mix(index===0?.52:0,1,reveal):1;
    if(index===3&&bias<1) pencil(center,p,rgba(colors[i],.75),1.35);
    satellite(center,colors[i],.78);
    label('S'+(i+1),add(center,[25,-17]),colors[i],16,true);
    g.restore();
  }
  if(index===0) label('Alle punktene på flaten har samme avstand',[520,510],ink,18,true);
  if(index===1&&t>.35) label('Felles skjæringssirkel',[603,499],ink,21,true);
  if(index>=2) {
    g.save(); g.globalAlpha=index===2?smooth((t-.29)/.21):final;
    marker(p); car(p); label('Mulig ved veien',add(p,[34,-22]),ink,17,true);
    g.restore();
  }
  if(index===2&&t>.29) {
    marker(mirror,red);
    if(t>.59) reject(mirror);
    label(t>.59?'Forkastes · under bakken':'Også mulig',add(mirror,[14,10]),red,17,true);
  }
  if(index===3) {
    label('ρ = avstand + c × klokkefeil',[290,511],ink,25,true);
    if(t>.29) label(bias>.7?'Felles klokkebidrag trekkes fra':'Fire avstander stemmer',[290,538],muted,17,true);
  }
}
function dish([x,y],color) {
  path([[x-18,y-15],[x-8,y-1],[x+7,y-1],[x+17,y-12]],color,2,'#cbd1ae');
  pencil([x,y-1],[x,y+13],color,2); pencil([x-12,y+13],[x+12,y+13],color,2);
  pencil([x,y-1],[x+5,y-18],color,1.5); disc([x+5,y-18],2.8,color);
}
function drawOrbit(t) {
  const world=[461,400];
  const terrain=g.createRadialGradient(398,327,15,461,400,170);
  terrain.addColorStop(0,'#d7e3cd'); terrain.addColorStop(1,'#a9bd97');
  disc(world,170,terrain,'#617957',1.5);
  g.save(); g.beginPath(); g.arc(...world,170,0,tau); g.clip();
  for(let i=-4;i<=4;i++) {
    path(Array.from({length:57},(_,j)=>[285+j*6.4,400+i*39+17*Math.sin(j/56*Math.PI)]),'#657c5e5e',1);
    path(Array.from({length:57},(_,j)=>[461+i*44*Math.sin(j/56*Math.PI),228+j*6.2]),'#657c5e5e',1);
  }
  path([[313,386],[363,369],[396,352],[407,382],[430,392],[410,422],[388,429],[404,461],[380,482],[349,450],[324,456]],'#70856c',1.2,'#95aa83');
  path([[492,316],[548,334],[557,354],[591,375],[573,416],[546,409],[555,449],[521,465],[519,419],[491,410],[463,370]],'#70856c',1.2,'#95aa83');
  g.restore();
  const orbit=a=>[461+302*Math.cos(a),322+162*Math.sin(a)-58*Math.cos(a)];
  path(Array.from({length:161},(_,i)=>orbit(tau*i/160)),'#616f57ab',1.55);
  const ideal=orbit(mix(3.79,5.02,smooth(t)));
  const deviation=30*smooth((t-.14)/.21)*(1-smooth((t-.77)/.18));
  const actual=add(ideal,[0,-deviation]);
  const stations=[[350,335],[547,309],[602,394]], control=[453,419];
  stations.forEach((p,i)=>{
    dish(p,colors[i]);
    const scan=smooth((t-.07-i*.043)/.24);
    if(scan>0) pencil(actual,between(actual,p,scan),rgba(colors[i],.7),1.6);
    if(t>.37) pencil(p,between(p,control,smooth((t-.37)/.18)),rgba(ink,.55),1.4);
  });
  marker(control); label('Kontrollsenter',add(control,[15,18]),ink,17,true);
  satellite(actual,colors[0],1.1);
  if(deviation>9) {
    marker(ideal,red);
    pencil(ideal,actual,red,2);
    label('Målt baneavvik',add(actual,[33,-8]),red,17,true);
  }
  if(t>.53) {
    arrow(stations[1],between(stations[1],actual,smooth((t-.53)/.18)),colors[0],2.4);
    label('Opplasting · bane og klokke',add(between(stations[1],actual,.48),[15,6]),ink,17,true);
  }
  label('GPS-bane · ca. 20 200 km over jorden',[619,492],ink,17,true);
  label(t>.78?'Ved behov · banemanøver':'Bakkestasjonene lytter',[67,465],ink,20,true);
}


function drawDoppler(t) {
  g.drawImage(map,0,0);
  const x=mix(461,560,smooth(t/.3)), p=roadPoint(x);
  const facing=[Math.cos(roadAngle(x)),Math.sin(roadAngle(x))];
  const velocity=scale(facing,20);
  const show=smooth((t-.18)/.21);
  sats.forEach((sat,i)=>{
    const direction=unit(sub(sat,p));
    const rate=-dot(velocity,direction);
    const shift=-rate*1575.42e6/299792458;
    sight(sat,p,i);
    satellite(sat,colors[i],.74);
    label('S'+(i+1),add(sat,[22,-15]),colors[i],16,true);
    if(show>0) {
      const projection=add(p,scale(direction,-rate*3.2));
      g.save(); g.globalAlpha=show;
      if(distance(p,projection)>2) arrow(p,projection,colors[i],2.7);
      const sign=shift>=0?'+':'−';
      label('Δf '+sign+Math.abs(Math.round(shift))+' Hz',add(between(sat,p,.51),[i===3?-38:10,i===2?25:-8]),colors[i],17,true);
      g.restore();
    }
  });
  car(p,roadAngle(x));
  arrow(add(p,scale(facing,24)),add(p,scale(facing,105)),ink,2.8);
  label('72 km/t',add(p,[112,-29]),ink,19,true);
  if(t>.3) label('Øyeblikksbilde',add(p,[112,-7]),muted,15,true);
  if(show>0) {
    g.save(); g.globalAlpha=show;
    label('Δf ≈ −(f₀/c) × ḋ',[57,488],ink,29,true);
    label('ḋ er endringen i avstand per sekund',[58,519],muted,17,true);
    label('Her viser vi signalbidraget fra bilen alene',[58,542],muted,16,true);
    g.restore();
  }
}
function building(x,y,w,h,glass) {
  const top=[[x,y],[x+w,y-17],[x+w,y+h-17],[x,y+h]];
  const side=[[x+w,y-17],[x+w+22,y],[x+w+22,y+h],[x+w,y+h-17]];
  path(top,glass?'#457879':'#796b52',1.7,glass?'#a8c8bf':'#c9a787');
  path(side,glass?'#457879':'#796b52',1.7,glass?'#6f9e96':'#9c7c60');
  for(let i=1;i<5;i++) pencil(between(top[0],top[1],i/5),between(top[3],top[2],i/5),glass?'#4c828388':'#8c745d82',1.25);
  for(let i=1;i<5;i++) pencil(between(top[0],top[3],i/5),between(top[1],top[2],i/5),glass?'#f4f0d1c0':'#f4e3c58a',1.65);
}
function fitRanges(satellites,ranges,seed) {
  let p=seed;
  for(let i=0;i<10;i++) {
    let xx=0, xy=0, yy=0, bx=0, by=0;
    satellites.forEach((sat,j)=>{
      const d=distance(p,sat), [x,y]=scale(sub(p,sat),1/d), error=ranges[j]-d;
      xx+=x*x; xy+=x*y; yy+=y*y; bx+=x*error; by+=y*error;
    });
    const determinant=xx*yy-xy*xy;
    if(Math.abs(determinant)<1e-9) break;
    p=add(p,[(yy*bx-xy*by)/determinant,(xx*by-xy*bx)/determinant]);
  }
  return p;
}
function drawEcho(t) {
  g.drawImage(map,0,0);
  const face=746, sat=sats[1], x=mix(560,677,smooth(t/.47)), p=roadPoint(x);
  const reflectedSource=[2*face-sat[0],sat[1]];
  const bounce=between(reflectedSource,p,(face-reflectedSource[0])/(p[0]-reflectedSource[0]));
  const visibility=smooth((t-.26)/.22);
  building(611,237,47,27,false);
  building(face,224,70,77,true);
  label('Glassfasade',[765,324],ink,17,true);
  for(const i of [0,2,3]) {
    pencil(sats[i],p,rgba(colors[i],.48),1.3);
    satellite(sats[i],colors[i],.61);
  }
  pencil(sat,p,rgba(colors[1],mix(.85,.18,visibility)),1.65);
  satellite(sat,colors[1],.82);
  if(visibility>0) {
    const exact=distance(sat,p);
    const extra=distance(sat,bounce)+distance(bounce,p)-exact;
    const observed=sats.map((s,i)=>distance(s,p)+(i===1?extra*visibility:0));
    const ghost=fitRanges(sats,observed,p);
    const forward=[Math.cos(roadAngle(x)),Math.sin(roadAngle(x))];
    const projection=add(p,scale(forward,dot(sub(ghost,p),forward)));
    g.save(); g.globalAlpha=visibility;
    path([sat,bounce,p],colors[1],3);
    marker(bounce,colors[1]);
    label('Reflektert signal',add(bounce,[-155,-17]),colors[1],17,true);
    label('Svak direkte bane',[487,276],muted,16,true);
    const lateral=sub(ghost,projection);
    if(norm(lateral)>11&&distance(p,projection)>11) {
      const along=scale(unit(sub(p,projection)),9);
      const across=scale(unit(lateral),9);
      path([add(projection,along),add(add(projection,along),across),add(projection,across)],red,1.25);
    }
    path([p,projection,ghost,p],red,2.2,'#bd5a5141');
    if(distance(p,ghost)>13) {
      marker(ghost,red);
      car(ghost,roadAngle(x),true);
      label('Spøkelsesposisjon',add(ghost,[-186,28]),red,19,true);
      label('Feiltrekant',add(projection,[18,21]),red,17,true);
    }
    label('Ekkoets vei > direkte vei',[70,497],ink,24,true);
    label('Ekstra reisetid gir for stor målt avstand',[70,524],muted,17,true);
    g.restore();
  }
  car(p,roadAngle(x));
  if(visibility>.4) label('Sann posisjon',add(p,[9,-17]),ink,16,true);
}

function drawJamming(t,elapsed) {
  g.drawImage(map,0,0);
  const x=mix(677,868,smooth(t)), p=roadPoint(x);
  const interference=smooth((t-.18)/.25)*(1-smooth((t-.69)/.24));
  const tracked=sats.map((_,i)=>interference<[.73,.51,.89,.62][i]);
  const locked=tracked.filter(Boolean).length===4;
  const center=[766,307];
  const wash=g.createRadialGradient(...center,12,...center,176);
  wash.addColorStop(0,rgba(red,.21*interference)); wash.addColorStop(1,rgba(red,0));
  disc(center,176,wash);
  sats.forEach((sat,i)=>{
    satellite(sat,colors[i],.72);
    label('S'+(i+1),add(sat,[24,-16]),colors[i],16,true);
    const progress=tracked[i]?1:.6+i*.07;
    sight(sat,p,i,progress);
    if(!tracked[i]) reject(between(sat,p,progress));
  });
  for(let i=0;i<120;i++) {
    const seed=i+Math.floor(elapsed*4)*123;
    const angle=tau*random(seed*3), r=160*Math.sqrt(random(seed*3+1));
    const spot=add(center,[Math.cos(angle)*r,Math.sin(angle)*r]);
    pencil(spot,add(spot,[4+8*random(seed*3+2),-3]),rgba(red,.53*interference),1.2);
  }
  if(interference>.03) label('Område med radiostøy',[691,180],red,19,true);
  if(locked) marker(p); else arcLost(p);
  car(p,roadAngle(x));
  label(locked?'Posisjonslås':'Posisjonslås mistet',[672,447],locked?ink:red,24,true);
  label(tracked.filter(Boolean).length+' av 4 signaler kan spores',[672,477],muted,17,true);
}
function arcLost(p) { curve(p,27,0,tau,red,2); }

const plate=$('plate'), counter=$('counter'), legend=$('legend'), story=$('story');
const chapter=$('chapters'), timeline=$('timeline'), play=$('play'), time=$('time');
const prev=$('prev'), next=$('next');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const format=s=>Math.floor(s/60)+':'+String(Math.floor(s%60)).padStart(2,'0');
const icon=(shape)=>'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="'+shape+'"/></svg>';
const playShape='M8 5l11 7-11 7z', pauseShape='M8 5h2v14H8zM14 5h2v14h-2z';
const number=i=>String(i).padStart(2,'0');
beats.forEach((beat,i)=>{
  const option=document.createElement('option');
  option.value=i; option.textContent=number(i+1)+' · '+beat[1];
  chapter.append(option);
});
timeline.max=total;
const transitionFrame=document.createElement('canvas');
transitionFrame.width=W;
transitionFrame.height=H;
let current=0, scene=-1, previous=0, running=false, frame=0, transitionScene=-1;

function showScene(index) {
  const [name,title,copy,note]=beats[index];
  plate.textContent=name;
  counter.textContent='Scene '+number(index+1)+' / '+beats.length;
  $('chapter-title').textContent=title;
  $('chapter-copy').textContent=copy;
  $('chapter-note').textContent=note;
  chapter.value=index;
  prev.disabled=index===0;
  next.disabled=index===beats.length-1;
  canvas.setAttribute('aria-label',title+'. '+copy);
  const items=index<8?colors.slice(0,index%4+1).map((color,i)=>[color,'S'+(i+1)]):
    index===8?[[colors[0],'Banedata'],[red,'Avvik']]:
    index===9?[[ink,'Bilens hastighet'],[colors[0],'Siktelinjer']]:
    index===10?[[colors[1],'Ekko'],[red,'Posisjonsfeil']]:[[red,'Radiostøy']];
  legend.replaceChildren(...items.map(([color,name])=>{
    const item=document.createElement('span'), swatch=document.createElement('i');
    swatch.style.backgroundColor=color;
    item.append(swatch,name);
    return item;
  }));
  if(!reducedMotion) {
    story.getAnimations().forEach(animation=>animation.cancel());
    story.animate([{opacity:0,transform:'translateX(9px)'},{opacity:1,transform:'translateX(0)'}],{duration:560,easing:'ease-out'});
  }
}
function artwork(index,t,seconds) {
  g.drawImage(paper,0,0);
  if(index<4) draw2D(index,t);
  else if(index<8) draw3D(index-4,t,seconds);
  else if(index===8) drawOrbit(t);
  else if(index===9) drawDoppler(t);
  else if(index===10) drawEcho(t);
  else drawJamming(t,seconds);
}
function render() {
  const index=times.findLastIndex((start,i)=>i<beats.length&&current>=start);
  const t=clamp((current-times[index])/beats[index][4]);
  if(index!==scene) { scene=index; showScene(index); }
  const transition=t<.055&&running&&!reducedMotion&&[4,8,9,10,11].includes(index);
  if(transition&&transitionScene!==index) {
    artwork(index-1,1,times[index]);
    transitionFrame.getContext('2d').drawImage(canvas,0,0);
    transitionScene=index;
  }
  artwork(index,t,current);
  if(transition) {
    g.save();
    g.globalAlpha=1-smooth(t/.055);
    g.drawImage(transitionFrame,0,0);
    g.restore();
  }
  timeline.value=current;
  const elapsed=format(current);
  if(time.dataset.elapsed!==elapsed) {
    time.dataset.elapsed=elapsed;
    time.value=elapsed+' / '+format(total);
    timeline.setAttribute('aria-valuetext',elapsed+' av '+format(total));
  }
}
function updatePlay() {
  const name=running?'Sett på pause':current>=total?'Spill av på nytt':'Spill av';
  play.innerHTML=icon(running?pauseShape:playShape);
  play.title=name;
  play.setAttribute('aria-label',name);
}
function animate(now) {
  if(previous) current=Math.min(total,current+(now-previous)/1000);
  previous=now;
  render();
  if(current>=total) stop();
  else frame=requestAnimationFrame(animate);
}
function stop() {
  cancelAnimationFrame(frame);
  previous=0;
  running=false;
  updatePlay();
}
function toggle() {
  if(running) { stop(); return; }
  if(current>=total) seek(0);
  running=true;
  updatePlay();
  frame=requestAnimationFrame(animate);
}
function seek(value) {
  current=Math.max(0,Math.min(total,value));
  previous=0;
  if(current===total) stop();
  else updatePlay();
  render();
}
play.addEventListener('click',toggle);
prev.addEventListener('click',()=>seek(times[Math.max(0,scene-1)]));
next.addEventListener('click',()=>seek(times[Math.min(beats.length-1,scene+1)]));
chapter.addEventListener('change',()=>seek(times[Number(chapter.value)]));
timeline.addEventListener('input',()=>seek(Number(timeline.value)));
const fullscreen=$('fullscreen');
if(!document.fullscreenEnabled) fullscreen.hidden=true;
fullscreen.addEventListener('click',async()=>{
  try {
    if(document.fullscreenElement) await document.exitFullscreen();
    else await document.documentElement.requestFullscreen();
  } catch { fullscreen.title='Fullskjerm er utilgjengelig'; }
});
document.addEventListener('fullscreenchange',()=>{
  const name=document.fullscreenElement?'Avslutt fullskjerm':'Fullskjerm';
  fullscreen.title=name; fullscreen.setAttribute('aria-label',name);
});
document.addEventListener('keydown',event=>{
  if(event.target.closest('button, select, input, a')) return;
  if(event.code==='Space') { event.preventDefault(); toggle(); }
  if(event.key==='ArrowLeft') seek(current-5);
  if(event.key==='ArrowRight') seek(current+5);
});
updatePlay();
render();


