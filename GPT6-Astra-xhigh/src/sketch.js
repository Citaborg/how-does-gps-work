import { circleIntersections, clamp, smoothstep, carPosition, leastSquaresPosition, lineOfSightMotion, segmentIntersectsRect } from './geometry.js';

export const colors = ['#568aab', '#ce8650', '#7b9470', '#9a79a7'];
const ink = '#365447', muted = '#899080', paper = '#f4f0e7';
let ctx;
export function pencil(points, color=ink, width=1.5, alpha=1, close=false) {
  ctx.save(); ctx.strokeStyle=color; ctx.lineWidth=width; ctx.globalAlpha*=alpha; ctx.lineCap='round'; ctx.lineJoin='round';
  for(let pass=0;pass<2;pass++){
    ctx.beginPath();
    points.forEach((p,i)=>{const x=p[0]+Math.sin(i*2.4+pass*11)*pass*.85,y=p[1]+Math.cos(i*3.1+pass*5)*pass*.85;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});
    if(close)ctx.closePath();ctx.stroke();ctx.globalAlpha*=.25;ctx.lineWidth=.8;
  }ctx.restore();
}
export function label(text,x,y,color=ink,size=23,angle=0,align='left') {
  ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.font=`500 ${size}px Caveat, cursive`;ctx.textAlign=align;ctx.fillStyle=color;ctx.fillText(text,0,0);ctx.restore();
}
function sans(text,x,y,color=muted,size=10,align='left') {ctx.save();ctx.font=`500 ${size}px Manrope, sans-serif`;ctx.fillStyle=color;ctx.textAlign=align;ctx.fillText(text,x,y);ctx.restore();}
function line(a,b,color=ink,width=1.3,alpha=1){const pts=[];for(let i=0;i<=20;i++){const t=i/20;pts.push([a[0]+(b[0]-a[0])*t+Math.sin(t*17)*.55,a[1]+(b[1]-a[1])*t+Math.sin(t*19)*.55]);}pencil(pts,color,width,alpha);}
function arrow(a,b,color=ink,width=1.4,alpha=1){line(a,b,color,width,alpha);const t=Math.atan2(b[1]-a[1],b[0]-a[0]);pencil([[b[0]-9*Math.cos(t-.4),b[1]-9*Math.sin(t-.4)],b,[b[0]-9*Math.cos(t+.4),b[1]-9*Math.sin(t+.4)]],color,width,alpha);}
function ring(x,y,r,color,width=1.6,alpha=1,progress=1,fill=0){const pts=[];for(let i=0;i<=120*progress;i++){const t=i/120*Math.PI*2;pts.push([x+Math.cos(t)*r,y+Math.sin(t)*r]);}if(fill&&progress>.98){ctx.save();ctx.fillStyle=color;ctx.globalAlpha*=fill;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore();}pencil(pts,color,width,alpha);}
function dot(x,y,color=ink,r=4){ctx.save();ctx.fillStyle=color;ctx.strokeStyle=paper;ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.restore();}
function fillPolygon(points,color,alpha){ctx.save();ctx.globalAlpha*=alpha;ctx.fillStyle=color;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fill();ctx.restore();}
function cross(x,y,color='#b66451',size=7){line([x-size,y-size],[x+size,y+size],color,2);line([x+size,y-size],[x-size,y+size],color,2);}
export function satellite(x,y,color=ink,scale=1,angle=-.35){ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.scale(scale,scale);fillPolygon([[-10,-13],[10,-13],[10,13],[-10,13]],paper,1);pencil([[-10,-13],[10,-13],[10,13],[-10,13]],color,1.5,1,true);for(const side of [-1,1]){const a=side*15,b=side*41;fillPolygon([[a,-11],[b,-11],[b,11],[a,11]],color,.09);pencil([[a,-11],[b,-11],[b,11],[a,11]],color,1.3,1,true);for(let i=1;i<4;i++)line([a+(b-a)*i/4,-11],[a+(b-a)*i/4,11],color,.7,.65);line([a,0],[b,0],color,.7,.6);line([side*10,0],[a,0],color);}pencil([[-6,17],[0,22],[6,17]],color);line([0,22],[0,30],color);dot(0,30,color,2);ctx.restore();}
export function car(x,y,color=ink,scale=1,ghost=false){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);if(ghost)ctx.globalAlpha*=.48;fillPolygon([[-32,0],[-26,-14],[-13,-17],[-3,-30],[19,-30],[30,-15],[37,-10],[37,3],[-33,3]],paper,1);pencil([[-32,0],[-26,-14],[-13,-17],[-3,-30],[19,-30],[30,-15],[37,-10],[37,3],[-33,3],[-32,0]],color,2);pencil([[-9,-17],[-1,-26],[16,-26],[23,-16],[-9,-17]],color,1);line([7,-26],[7,-16],color,.8);line([3,-10],[9,-10],color,1);ring(-20,4,7,color,2);ring(24,4,7,color,2);dot(-20,4,color,2);dot(24,4,color,2);line([-29,-9],[-23,-9],color,2);line([29,-8],[34,-8],colors[1],2);ctx.restore();}
function tree(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);line([0,0],[0,-30],muted);pencil([[-17,-12],[-10,-25],[-14,-25],[-5,-37],[-8,-37],[0,-52],[9,-37],[6,-37],[16,-23],[11,-23],[20,-12]],muted,1.2,.6,true);ctx.restore();}
function packet(a,b,t,color){const p=((t%1)+1)%1;dot(a[0]+(b[0]-a[0])*p,a[1]+(b[1]-a[1])*p,color,3.5);}
function road(){const points=[],bottom=[];for(let i=0;i<=100;i++){const x=70+i*8.3,y=425-55*Math.sin(Math.PI*clamp((x-150)/640));points.push([x,y+11]);bottom.push([x,y+39]);}pencil(points,muted,1,.6);pencil(bottom,muted,1,.4);for(let i=0;i<14;i++){const x=90+i*57,y=425-55*Math.sin(Math.PI*clamp((x-150)/640));line([x,y+25],[x+19,y+25],muted,.8,.35);}tree(150,480,.7);tree(840,380,.9);tree(810,382,.55);}
function intro(t,outro=false){
  const earth=[];for(let i=0;i<=90;i++){const x=40+i*10,y=570-100*Math.sin(i/90*Math.PI);earth.push([x,y]);}pencil(earth,ink,1.9,.85);
  for(let k=0;k<4;k++){const pts=[];for(let i=0;i<=70;i++){const x=130+i*10,y=590+k*19-88*Math.sin(i/70*Math.PI);pts.push([x,y]);}pencil(pts,muted,.65,.17);}
  const s=[[265,155],[730,130],[840,305]];const px=370+smoothstep(clamp(t/11))*150,py=478;
  s.forEach((p,i)=>{const a=smoothstep(clamp((t-i*.6)/1.8));ctx.save();ctx.globalAlpha*=a;line(p,[px,py-12],colors[i],1,.42);packet(p,[px,py-12],t*.22+i*.33,colors[i]);satellite(...p,colors[i],1.1);label(['tid → avstand','et kjent sted','en presis klokke'][i],p[0]-65,p[1]-48,colors[i],24,-.06);ctx.restore();});
  car(px,py,ink,1.2);tree(225,509,.8);tree(773,515,1);tree(806,534,.7);pencil([[575,482],[575,451],[594,436],[614,450],[614,489]],muted,1,.6);pencil([[570,451],[594,430],[619,452]],muted,1,.6);
  label(outro?'og der er du.':'du er her.',px-36,py+53,ink,31,-.08);arrow([px+92,py+39],[px+31,py+9],muted,1,.6);
  label('20 200 km over hverdagen',385,252,muted,25,-.07);sans('ILLUSTRASJON · IKKE I MÅLESTOKK',394,289,muted,8);
  if(outro){label('posisjon  +  fart  +  tid',350,355,ink,32,-.025);}
}
const receiver={x:520,y:385};
const centers=[{x:335,y:220},{x:680,y:215},{x:725,y:465},{x:265,y:455}];
function circles(chapter,t){
  const count=Number(chapter.id.slice(-1));const base=centers.map(c=>Math.hypot(c.x-receiver.x,c.y-receiver.y));
  const error=count===4?32*smoothstep(t/3)*(1-smoothstep((t-5)/7)):0;
  const radii=base.map(r=>r+error);let intro=smoothstep(clamp(t/3));
  for(let i=0;i<count;i++){const a=i===count-1?intro:1;ctx.save();ctx.globalAlpha*=a;const c=centers[i],r=radii[i];ring(c.x,c.y,r,colors[i],2.05,.85,a,.055);satellite(c.x,c.y,colors[i],.82);label(`S${i+1}`,c.x-12,c.y-39,colors[i],21);line([c.x,c.y],[receiver.x,receiver.y],colors[i],1.25,.65);const mid=[c.x+(receiver.x-c.x)*.52,c.y+(receiver.y-c.y)*.52];label(`r${i+1}`,mid[0]+9,mid[1]-8,colors[i],24);if(t>6&&count>=3){line([c.x,c.y],[receiver.x,c.y],colors[i],.85,.24);line([receiver.x,c.y],[receiver.x,receiver.y],colors[i],.85,.24);pencil([[receiver.x-8,c.y],[receiver.x-8,c.y+8],[receiver.x,c.y+8]],colors[i],.9,.55);}ctx.restore();}
  if(count===1){label('r = c · Δt',640,473,colors[0],33,-.04);label('avstand = lysfart × reisetid',592,510,muted,24,-.04);arrow([655,443],[589,361],colors[0],1,.6);label('alle steder langs kanten',118,539,colors[0],27,-.06);}
  if(count>=2){const points=circleIntersections(centers[0],radii[0],centers[1],radii[1]);points.forEach((p,i)=>{const real=Math.hypot(p.x-receiver.x,p.y-receiver.y)<80;ctx.save();ctx.globalAlpha*=intro;if(count>=3&&!real&&t>5){cross(p.x,p.y);label('passer ikke med S3',p.x+15,p.y+5,'#b66451',22);}else{ring(p.x,p.y,12,real?ink:'#b66451',1.3,.7);dot(p.x,p.y,real?ink:'#b66451',5);if(!real)label('også mulig?',p.x+15,p.y+7,'#b66451',23);}ctx.restore();});}
  if(count>=3){car(receiver.x,receiver.y-7,ink,.7);label(count===4?'x, y og en felles tidsfeil':'bare dette punktet passer',420,598,ink,27,-.02);}
  else if(count===1){dot(receiver.x,receiver.y,ink,5);label('et mulig sted',receiver.x+18,receiver.y+30,ink,24);}
  if(count===4){label('ρᵢ = rᵢ + c · b',575,109,colors[3],32,-.025);label(error>1?'Klokken skyver alle sirklene ut …':'… vi retter klokken, og finner stedet.',365,641,error>1?colors[3]:ink,24);sans(`KLOKKEFEIL I MODELLEN: ${(error/32).toFixed(2)} µs`,585,139,muted,9);}
}
function dish(x,y,s=1){ctx.save();ctx.translate(x,y);ctx.scale(s,s);pencil([[-19,-22],[-13,-10],[0,-3],[13,-6],[21,-15]],ink,1.8);line([-19,-22],[21,-15],ink);line([0,-16],[10,-37],ink);dot(10,-37,colors[1],3);line([0,-3],[-7,15],ink,2);line([0,-3],[9,15],ink,2);line([-17,16],[19,16],ink);ctx.restore();}
function control(t){
  const orbit=[];for(let i=0;i<=160;i++){const a=i/160*Math.PI*2;orbit.push([490+330*Math.cos(a),325+188*Math.sin(a)]);}pencil(orbit,colors[0],1.5,.38);
  const earth=[];for(let i=0;i<=90;i++){let x=150+i*7.7;earth.push([x,526-90*Math.sin(i/90*Math.PI)]);}pencil(earth,ink,1.7,.7);
  const angle=-1.85+t*.038,drift=18*Math.sin(Math.PI*clamp((t-5)/14));const p=[490+(330+drift)*Math.cos(angle),325+(188+drift)*Math.sin(angle)];
  const stations=[[270,474],[505,447],[748,475]];
  stations.forEach((b,i)=>{dish(...b,.9);line(p,[b[0],b[1]-25],colors[i],1,.28);packet(p,[b[0],b[1]-25],t*.19+i*.4,colors[i]);});
  satellite(...p,colors[0],1.1);label('forutsagt bane',643,172,colors[0],25,-.05);label('kontrollstasjoner lytter',338,511,ink,26,-.04);
  if(t>6){const a=smoothstep((t-6)/3);ctx.save();ctx.globalAlpha*=a;ring(p[0]-7,p[1]+14,26,colors[1],1.3,.8);label(t<17?'et lite baneavvik':'oppdatert banemodell',p[0]+45,p[1]+15,colors[1],26,-.03);arrow([p[0]+37,p[1]+20],[p[0]+10,p[1]+18],colors[1]);ctx.restore();}
  const phase=t<8?0:t<15?1:t<22?2:3;const steps=['1  Måle signalene','2  Beregne bane + klokke','3  Laste opp efemerider','4  Følge opp / justere bane'];
  steps.forEach((s,i)=>{const x=140+i*218;label(s,x,584,i===phase?ink:muted,i===phase?24:21,-.025);if(i<3)arrow([x+175,574],[x+206,574],muted,.9,.4);});
  if(t>14){arrow([505,406],p,colors[1],1.8,.8);packet([505,406],p,t*.25,colors[1]);label('nye banedata ↑',514,342,colors[1],27,-.05);}
  label('F = GMm / r²',140,270,muted,27,-.04);label('tyngdekraft bøyer banen',125,307,muted,22,-.04);
  if(t>22){line([p[0]-23,p[1]+25],[p[0]-41,p[1]+45],colors[1],2);line([p[0]-16,p[1]+28],[p[0]-22,p[1]+44],colors[1],1.5);label('en manøver ved behov',595,372,ink,23);}
}
function clockFace(x,y,r,color,t,rate){ring(x,y,r,color,1.8);for(let i=0;i<12;i++){const a=i*Math.PI/6;line([x+Math.sin(a)*(r-7),y-Math.cos(a)*(r-7)],[x+Math.sin(a)*(r-2),y-Math.cos(a)*(r-2)],color,1,.6);}const angle=t*rate;line([x,y],[x+Math.sin(angle)*r*.7,y-Math.cos(angle)*r*.7],color,2);line([x,y],[x+Math.sin(angle*.083+1)*r*.48,y-Math.cos(angle*.083+1)*r*.48],color,2.7);dot(x,y,color,4);}
function relativity(t){clockFace(290,330,95,ink,t,.24);clockFace(660,225,95,colors[0],t,.29);label('på bakken',228,464,ink,32,-.05);label('i bane',626,83,colors[0],32,-.05);satellite(797,173,colors[0],.75);const pts=[];for(let i=0;i<=80;i++)pts.push([140+i*8,490-24*Math.sin(i/80*Math.PI)]);pencil(pts,muted,1,.6);arrow([415,323],[527,246],colors[1],1.4);label('svakere tyngdekraft: raskere',412,372,colors[1],27,-.08);label('høy fart: langsommere',477,409,colors[0],27,-.07);label('samlet: satellittklokken går litt fortere',273,559,ink,30,-.025);sans('KLOKKEFORSKJELLEN ER STERKT OVERDREVET I TEGNINGEN',306,595,muted,9);}
function vehicleGeometry(p,t,all=true){const satellites=[[230,147],[512,103],[811,188],[859,322]];satellites.forEach((s,i)=>{satellite(...s,colors[i],.67);line(s,[p.x,p.y-16],colors[i],1.15,.62);if(all){line(s,[p.x,s[1]],colors[i],.8,.18);line([p.x,s[1]],[p.x,p.y-16],colors[i],.8,.18);}label(`r${i+1}`,s[0]+(p.x-s[0])*.48+8,s[1]+(p.y-s[1])*.48,colors[i],23);});}
function velocity(t,doppler=false){road();const p=carPosition(t+2);vehicleGeometry(p,t);car(p.x,p.y,ink,.95);const stopped=p.speed<.05;if(!doppler)label(stopped?'vi stanser akkurat her':'bilen er i bevegelse',p.x-91,p.y+77,ink,27,-.04);
  if(!doppler){const past=carPosition(Math.max(2,t+.6));dot(past.x,past.y+1,colors[0],4);if(Math.abs(p.x-past.x)>5){arrow([past.x,past.y-42],[p.x,p.y-42],colors[1],2);label('Δs',((p.x+past.x)/2)-8,Math.min(p.y,past.y)-57,colors[1],26);}label('v̄ = Δs / Δt',300,578,ink,39,-.025);label('endring i posisjon / tid',492,576,muted,26,-.025);sans('EN FORSKYVNING GIR GJENNOMSNITTLIG HASTIGHETSVEKTOR',287,616,muted,9);if(stopped)label('alle siktelinjene blir med',430,290,ink,25);}
  else{
    const source=[811,188],target=[p.x,p.y-16],length=Math.hypot(target[0]-source[0],target[1]-source[1]),dx=(target[0]-source[0])/length,dy=(target[1]-source[1])/length;
    const next=carPosition(t+2.03),vx=(next.x-p.x)/.03,vy=(next.y-p.y)/.03;
    const {unit:u,receiverProjection,relativeRangeRate:radial}=lineOfSightMotion(target,source,[vx,vy]);
    const frequency=1-radial/170*.35;
    const pts=[];for(let i=0;i<=160;i++){const f=i/160,w=Math.sin(f*length*.15*frequency-t*4)*6;pts.push([source[0]+(target[0]-source[0])*f-dy*w,source[1]+(target[1]-source[1])*f+dx*w]);}pencil(pts,colors[2],1.5,.8);
    const arrowScale=.72,tip=[target[0]+vx*arrowScale,target[1]+vy*arrowScale];arrow(target,tip,ink,2);label('v',tip[0]+8,tip[1]-8,ink,27);
    arrow(target,[target[0]+u[0]*receiverProjection*arrowScale,target[1]+u[1]*receiverProjection*arrowScale],colors[2],2.5);
    label('Δfᵢ ≈ −(f₀ / c) · ṙᵢ',245,552,ink,34,-.025);label('ṙᵢ = uᵢ · (vₛᵢ − v)',245,594,colors[2],29,-.025);label('fart langs siktelinjen',574,596,muted,23,-.025);sans('GEOMETRISK DOPPLER · KLOKKEDRIFT MÅ OGSÅ ESTIMERES',245,632,muted,9);label(Math.abs(radial)<1?'ingen bevegelse langs siktelinjen':radial<0?'nærmere → høyere frekvens':'lenger unna → lavere frekvens',210,81,colors[2],25);}
}
function errorTriangle(t){
  const c=[{x:230,y:160},{x:782,y:190},{x:500,y:570}],p={x:505,y:362};const offsets=[13,-9,16];const radii=c.map((s,i)=>Math.hypot(s.x-p.x,s.y-p.y)+offsets[i]);
  const triangle=[];for(let i=0;i<3;i++){const j=(i+1)%3;const candidates=circleIntersections(c[i],radii[i],c[j],radii[j]);candidates.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y));if(candidates[0])triangle.push([candidates[0].x,candidates[0].y]);}
  c.forEach((s,i)=>{ring(s.x,s.y,radii[i],colors[i],1.8,.65,1,.025);satellite(s.x,s.y,colors[i],.8);});
  fillPolygon(triangle,'#b96244',.35);pencil(triangle,'#b96244',2.5,1,true);triangle.forEach(p=>dot(...p,'#b96244',4));dot(p.x,p.y,ink,4);label('sann posisjon',p.x-151,p.y-13,ink,24);arrow([p.x-22,p.y-16],[p.x-4,p.y-2],ink,1);
  const centroid=triangle.reduce((a,b)=>[a[0]+b[0]/3,a[1]+b[1]/3],[0,0]);
  const fitted=leastSquaresPosition(c,radii,{x:500,y:350});dot(fitted.x,fitted.y,colors[3],5);label('beste tilpasning',fitted.x+17,fitted.y+24,colors[3],22);
  const zoom=3.5,cx=779,cy=481;ring(cx,cy,89,muted,1,.35);const large=triangle.map(v=>[cx+(v[0]-centroid[0])*zoom,cy+(v[1]-centroid[1])*zoom]);fillPolygon(large,'#b96244',.19);pencil(large,'#b96244',2.5,1,true);large.forEach(v=>dot(...v,'#b96244',4));dot(cx+(fitted.x-centroid[0])*zoom,cy+(fitted.y-centroid[1])*zoom,colors[3],5);line([centroid[0]+20,centroid[1]+10],[cx-65,cy-61],muted,.8,.5);label('feiltrekanten, forstørret',675,603,'#b96244',25,-.025);
  label('min Σ (målt avstand − beregnet avstand)²',184,647,ink,29,-.015);label('litt for lang',194,429,colors[0],24,-.2);label('litt for kort',629,281,colors[1],24,.1);
}
function building(x,y,w,h,glass=false){fillPolygon([[x,y],[x+w,y],[x+w,y-h],[x,y-h]],glass?'#a0b5b1':'#d2d0c3',glass?.15:.38);pencil([[x,y],[x,y-h],[x+w,y-h],[x+w,y]],glass?colors[0]:muted,1.4,.65);for(let row=0;row<5;row++){const yy=y-h+20+row*(h-30)/5;line([x+7,yy],[x+w-7,yy],glass?colors[0]:muted,.65,.38);}for(let col=1;col<4;col++)line([x+w*col/4,y-h+5],[x+w*col/4,y],glass?colors[0]:muted,.7,.25);if(glass){pencil([[x+15,y-h+25],[x+53,y-h+95]],colors[0],1,.3);pencil([[x+20,y-h+40],[x+58,y-h+110]],colors[0],1,.3);}}
function echo(t){
  const progress=smoothstep(clamp((t-1)/23)),p={x:220+progress*600,y:438},s=[185,109],wall=830;
  const block={left:390,right:455,top:255,bottom:415};
  const rayY=x=>s[1]+(p.y-16-s[1])*(x-s[0])/(p.x-s[0]);
  const entersSide=p.x>block.left&&rayY(block.left)>=block.top&&rayY(block.left)<=block.bottom;
  const topX=s[0]+(block.top-s[1])*(p.x-s[0])/(p.y-16-s[1]);
  const blocked=segmentIntersectsRect(s,[p.x,p.y-16],block);
  const mirrorX=2*wall-p.x,reflectY=s[1]+(p.y-16-s[1])*(wall-s[0])/(mirrorX-s[0]),bounce=[wall,reflectY];
  const echoVisible=blocked&&!segmentIntersectsRect(s,bounce,block)&&!segmentIntersectsRect(bounce,[p.x,p.y-16],block);
  const shadowStart=s[0]+(block.left-s[0])*(p.y-16-s[1])/(block.bottom-s[1]);
  const shadowEnd=s[0]+(block.right-s[0])*(p.y-16-s[1])/(block.top-s[1]);
  const reflection=echoVisible?smoothstep((p.x-shadowStart)/35)*smoothstep((p.x-block.right+23)/23)*(1-smoothstep((p.x-shadowEnd+35)/35)):0;
  line([100,455],[930,455],muted,1,.7);line([100,502],[930,502],muted,1,.4);for(let i=0;i<12;i++)line([120+i*65,480],[145+i*65,480],muted,1,.4);
  building(block.left,block.bottom,block.right-block.left,block.bottom-block.top,false);building(wall,408,91,271,true);label('glassfasade',801,107,colors[0],27,-.05);label('bygningen skjermer',327,225,muted,23,-.04);
  satellite(...s,colors[0],1);
  if(!blocked){line(s,[p.x,p.y-16],colors[2],1.8,.8);packet(s,[p.x,p.y-16],t*.25,colors[2]);label('fri sikt',p.x-110,310,colors[2],24);}else{
    const hit=entersSide?[block.left,rayY(block.left)]:[topX,block.top];line(s,hit,colors[2],1.4,.7);cross(...hit,'#b66451',7);
    if(echoVisible){
    line(s,bounce,colors[1],2,.9);line(bounce,[p.x,p.y-16],colors[1],2,.9);dot(...bounce,colors[1],6);packet(s,bounce,t*.2,colors[1]);packet(bounce,[p.x,p.y-16],t*.2-.6,colors[1]);
    const direct=Math.hypot(p.x-s[0],p.y-16-s[1]),detour=Math.hypot(wall-s[0],reflectY-s[1])+Math.hypot(p.x-wall,p.y-16-reflectY);
    label('ekko: en lengre vei',585,194,colors[1],27,.03);label('rₘålt = rₛann + ekstra vei',285,566,colors[1],31,-.015);
    ctx.save();ctx.globalAlpha*=reflection;car(p.x+75,p.y+87,'#b66451',.94,true);line([p.x+10,p.y+17],[p.x+73,p.y+62],'#b66451',1,.6);label('spøkelsesposisjon',p.x+15,p.y+130,'#b66451',26,-.03);ctx.restore();
    sans(`OMVEI I TEGNINGEN: +${Math.round(detour-direct)} LENGDEENHETER`,285,597,muted,9);
    }else{label('også ekkoet er skjermet',510,295,'#b66451',27,-.04);label('et lite øyeblikk uten signal',275,568,'#b66451',30,-.02);}
  }
  car(p.x,p.y,ink,1);label('virkelig bil',p.x-44,p.y-47,ink,24,-.04);if(!blocked){label(t>20?'tilbake i fri sikt → løsningen finner tilbake':'rett vei = riktig reisetid',280,568,ink,30,-.02);}
  sans('SPØKELSESPOSISJONEN ER SKJEMATISK · AVHENGER AV FLERE SATELLITTER',200,639,muted,9);
}
function jamming(t){const noise=smoothstep(clamp((t-3)/7));road();const p=carPosition(5+Math.min(t,7));vehicleGeometry(p,t,false);car(p.x,p.y,ink,.95);
  const x=190,y=574,w=645;line([x,y],[x+w,y],muted,.8,.3);
  for(let k=0;k<4;k++){const pts=[];for(let i=0;i<230;i++){let xx=x+i*w/230;const base=Math.sin(i*.35-t*2)*10;const n=(Math.sin(i*2.79+t)+Math.sin(i*7.14-t*1.3)+Math.sin(i*1.8+t*.7))*noise*23;pts.push([xx,y+base+n+k*1.2]);}pencil(pts,k===0?colors[0]:'#b46f56',k===0?1.5:.7,k===0?1-noise*.6:noise*.28);}
  label('satellittsignal',184,526,colors[0],26);label(noise>.8?'drukner i støyen':'støyen øker',621,523,'#b66451',27,-.03);label(noise>.8?'posisjon: ukjent':'posisjon: søker …',p.x-87,p.y+79,noise>.8?'#b66451':ink,27,-.03);if(noise>.8)cross(p.x,p.y-74,'#b66451',12);sans('SKJEMATISK SIGNALVISNING · INGEN FREKVENS- ELLER UTSTYRSOPPSKRIFT',213,655,muted,8);}

export class Sketch {
  constructor(canvas){this.canvas=canvas;this.context=canvas.getContext('2d');this.width=0;this.height=0;}
  resize(width,height){this.width=width;this.height=height;const dpr=Math.min(devicePixelRatio||1,2);this.canvas.width=Math.round(width*dpr);this.canvas.height=Math.round(height*dpr);this.dpr=dpr;}
  draw(chapter,t,opacity=1,spaceOverlay=null){ctx=this.context;ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,this.canvas.width,this.canvas.height);const scale=Math.min(this.width/1000,this.height/680);ctx.setTransform(this.dpr*scale,0,0,this.dpr*scale,this.dpr*(this.width-1000*scale)/2,this.dpr*(this.height-680*scale)/2);ctx.globalAlpha=opacity;ctx.lineCap='round';
    if(chapter.id.startsWith('sphere')){if(spaceOverlay)this.spaceLabels(spaceOverlay,chapter,t);return;}
    switch(chapter.id){case'intro':intro(t);break;case'outro':intro(t,true);break;case'control':control(t);break;case'relativity':relativity(t);break;case'velocity':velocity(t);break;case'doppler':velocity(t+24,true);break;case'error':errorTriangle(t);break;case'echo':echo(t);break;case'jam':jamming(t);break;default:ctx.translate(500,340);ctx.scale(.84,.84);ctx.translate(-500,-340);circles(chapter,t);}
  }
  spaceLabels(data,chapter,t){
    // Three projects to the same letterboxed 1000 × 680 diagram coordinate system.
    const count=Number(chapter.id.slice(-1));data.satellites.forEach((p,i)=>{if(i>=count)return;ctx.save();ctx.globalAlpha*=i===count-1?smoothstep(t/3):1;satellite(p.x,p.y,colors[i],.65);label(`S${i+1}`,p.x+15,p.y-18,colors[i],22);ctx.restore();});
    if(data.fallback){data.spheres.forEach((s,i)=>{if(i<count)ring(s.x,s.y,s.r,colors[i],.65,.2,1,.09);});if(count>=2)pencil(data.circle.map(p=>[p.x,p.y]),'#a87d38',3,1,true);}
    if(count===1){label('alle punkter på denne flaten',188,546,colors[0],31,-.05);label('r = c · Δt',650,524,colors[0],31,-.05);}
    if(count===2){label('en hel sirkel av muligheter',240,571,'#a66b39',31,-.035);label('to avstander må stemme',295,613,muted,23,-.02);}
    if(count>=3){data.candidates.forEach((p,i)=>{if((count===4&&(i>0||t<10))||t<3.2)return;const isReceiver=i===0;if(!isReceiver&&t>9){cross(p.x,p.y,'#b66451',7);label('for høyt for bilen',p.x+18,p.y-10,'#b66451',23);}else{dot(p.x,p.y,isReceiver?ink:'#b66451',6);ring(p.x,p.y,12,isReceiver?ink:'#b66451',1.3,.8);if(!isReceiver)label('også en kandidat',p.x+18,p.y-10,'#b66451',22);}});
      if(t>9||count===4){const p=data.candidates[0];ctx.save();ctx.globalAlpha*=count===4?1:smoothstep((t-9)/4);pencil([[p.x-100,p.y+22],[p.x-45,p.y+4],[p.x+5,p.y+3],[p.x+62,p.y+12],[p.x+99,p.y+28]],ink,1.6,.7);car(p.x,p.y,ink,.53);label('et lite utsnitt av jorden',p.x-65,p.y+57,ink,23);ctx.restore();}
    }
    if(count===3){label('tre kuleflater → to punkter',202,601,ink,29,-.025);sans('IDEELLE AVSTANDER · KLOKKEN ER FORELØPIG KJENT',248,634,muted,9);}
    if(count===4){label('ρᵢ = √[(x−xᵢ)² + (y−yᵢ)² + (z−zᵢ)²] + c·b',112,601,ink,28,-.01);label('x, y, z, b  →  fire ukjente',297,645,colors[3],27,-.025);}
  }
}
