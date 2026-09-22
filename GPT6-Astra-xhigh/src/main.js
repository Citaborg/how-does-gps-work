import './style.css';
import { chapters, duration, chapterAt } from './story.js';
import { clamp, smoothstep } from './geometry.js';
import { Sketch } from './sketch.js';
import { Space } from './space.js';

const $=s=>document.querySelector(s);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const sketch=new Sketch($('#sketch'));
const space=new Space($('#space'));
let time=0,playing=!reducedMotion,rate=1,lastFrame=null,activeChapter=null,currentIndex=0,dialogResume=false;
const formatter=value=>`${Math.floor(value/60)}:${String(Math.floor(value%60)).padStart(2,'0')}`;
$('#timeline').max=duration;
$('#total-time').textContent=formatter(duration);
$('#chapter-dots').innerHTML=chapters.map(()=>'<span></span>').join('');
$('#chapters-list').innerHTML=chapters.map((c,i)=>`<button class="chapter-option" data-chapter="${i}"><span class="chapter-index">${String(i+1).padStart(2,'0')}</span><span class="chapter-name">${c.name}</span><span class="chapter-time">${formatter(c.start)}</span></button>`).join('');

function updatePlay(){
  $('#play').innerHTML=playing?'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3v14H7zm7 0h3v14h-3z"/></svg>':'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8 4 12 8-12 8z"/></svg>';
  $('#play').setAttribute('aria-label',playing?'Pause':time>=duration?'Spill på nytt':'Spill');
  $('#app').dataset.playing=String(playing);
}
function setPlaying(value){if(value&&time>=duration)time=0;playing=value;lastFrame=null;updatePlay();render();}
function seek(value){time=clamp(value,0,duration);lastFrame=null;if(time>=duration)playing=false;updatePlay();render();}
function jump(index){seek(chapters[clamp(index,0,chapters.length-1)].start);}
function render(){
  const chapter=chapterAt(time),local=time-chapter.start;currentIndex=chapters.indexOf(chapter);
  $('#next').disabled=currentIndex===chapters.length-1;
  if(chapter!==activeChapter){activeChapter=chapter;$('#chapter-number').textContent=String(currentIndex+1).padStart(2,'0');$('#chapter-kicker').textContent=chapter.kicker;$('#chapter-title').innerHTML=chapter.title.replaceAll('<br>','<br> ');$('#chapter-body').innerHTML=chapter.body;$('#chapter-detail').textContent=chapter.detail;$('#scene-label').textContent=chapter.label;$('#sketch-note').textContent=chapter.note;$('#current-chapter-name').textContent=chapter.name;$('#sketch').setAttribute('aria-label',chapter.body.replace(/<[^>]+>/g,'')+' '+chapter.detail);$('#app').dataset.chapter=chapter.id;document.querySelectorAll('.chapter-dots span').forEach((dot,i)=>dot.classList.toggle('active',i===currentIndex));document.querySelectorAll('.chapter-option').forEach((button,i)=>button.setAttribute('aria-current',String(i===currentIndex)));}
  const fadeIn=currentIndex===0?1:smoothstep(clamp(local/1.2)),fadeOut=currentIndex===chapters.length-1?1:smoothstep(clamp((chapter.duration-local)/.9));
  // Keep chapter selection readable immediately while paused; animate the transitions during playback.
  const opacity=playing?Math.max(.03,Math.min(fadeIn,fadeOut)):1;
  $('#narrative-content').style.opacity=String(opacity);
  $('#narrative-content').style.transform=`translateY(${(1-opacity)*9}px)`;
  $('#sketch-note').style.opacity=String(opacity);
  const family=c=>c?.id.startsWith('circle')?'circles':c?.id.startsWith('sphere')?'spheres':['velocity','doppler'].includes(c?.id)?'driving':c?.id;
  const diagramIn=family(chapters[currentIndex-1])===family(chapter)?1:fadeIn;
  const diagramOut=family(chapters[currentIndex+1])===family(chapter)?1:fadeOut;
  const diagramOpacity=playing?Math.max(.03,Math.min(diagramIn,diagramOut)):1;
  const inSpace=chapter.id.startsWith('sphere');$('#space').style.opacity=inSpace?String(diagramOpacity):'0';
  const overlay=inSpace?space.draw(chapter,local,time):null;
  sketch.draw(chapter,local,diagramOpacity,overlay);
  $('#timeline').value=String(time);$('#timeline').style.setProperty('--progress',`${time/duration*100}%`);$('#timeline').setAttribute('aria-valuetext',`${formatter(time)} av ${formatter(duration)}. ${chapter.name}`);$('#current-time').textContent=formatter(time);
}
function frame(now){if(lastFrame!==null&&playing&&!document.hidden){time=Math.min(duration,time+(now-lastFrame)/1000*rate);if(time>=duration){playing=false;updatePlay();}render();}lastFrame=now;requestAnimationFrame(frame);}
function resize(){const rect=$('.drawing').getBoundingClientRect();sketch.resize(rect.width,rect.height);space.resize(rect.width,rect.height);render();}
new ResizeObserver(resize).observe($('.drawing'));
document.addEventListener('visibilitychange',()=>{lastFrame=null;});
$('#play').addEventListener('click',()=>setPlaying(!playing));
$('#timeline').addEventListener('input',e=>seek(Number(e.target.value)));
$('#previous').addEventListener('click',()=>jump(time-activeChapter.start>3?currentIndex:currentIndex-1));
$('#next').addEventListener('click',()=>jump(currentIndex+1));
$('.wordmark').addEventListener('click',e=>{e.preventDefault();seek(0);setPlaying(true);});
$('#speed').addEventListener('click',()=>{const speeds=[1,1.25,1.5,2,.75];rate=speeds[(speeds.indexOf(rate)+1)%speeds.length];$('#speed').textContent=`${rate}×`;$('#speed').setAttribute('aria-label',`Avspillingshastighet: ${rate} ganger`);});
async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#app').requestFullscreen();}catch{$('#fullscreen').title='Fullskjerm er ikke tilgjengelig i denne nettleseren';}}
$('#fullscreen').addEventListener('click',fullscreen);
document.addEventListener('fullscreenchange',()=>$('#fullscreen').setAttribute('aria-label',document.fullscreenElement?'Avslutt fullskjerm':'Fullskjerm'));
function openDialog(id){dialogResume=playing;setPlaying(false);$(id).showModal();}
$('#chapters-toggle').addEventListener('click',()=>openDialog('#chapters-dialog'));
$('#sources-toggle').addEventListener('click',()=>openDialog('#sources-dialog'));
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>document.getElementById(button.dataset.close).close()));
document.querySelectorAll('dialog').forEach(dialog=>{dialog.addEventListener('close',()=>{if(dialogResume)setPlaying(true);});dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});});
document.querySelectorAll('[data-chapter]').forEach(button=>button.addEventListener('click',()=>{jump(Number(button.dataset.chapter));$('#chapters-dialog').close();}));
document.addEventListener('keydown',event=>{
  if(event.altKey||event.ctrlKey||event.metaKey||document.querySelector('dialog[open]'))return;
  if(['INPUT','TEXTAREA','SELECT','BUTTON','A'].includes(event.target.tagName))return;
  if(event.code==='Space'){event.preventDefault();setPlaying(!playing);}else if(event.key==='ArrowRight'){event.preventDefault();seek(time+5);}else if(event.key==='ArrowLeft'){event.preventDefault();seek(time-5);}else if(event.key.toLowerCase()==='f'){fullscreen();}else if(event.key==='Home'){event.preventDefault();seek(0);}else if(event.key==='End'){event.preventDefault();seek(duration);}
});
updatePlay();resize();document.fonts.ready.then(render);requestAnimationFrame(frame);
