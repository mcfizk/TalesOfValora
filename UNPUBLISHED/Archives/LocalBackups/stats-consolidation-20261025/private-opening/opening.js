import {OPENING} from '../story.js';
import {createAudio} from '../audio.js';
import {SPAWN,makeWorld,move,findPath,walkable,waterDistance,inWater,movementScale,terrainAt} from './world.js';
import {loadArt,createRenderer} from './renderer.js';
import {movementDirection,fenrisFrame} from './fenris-animation.js';
import {awakeningAt} from './character-animation.js';

const $=id=>document.getElementById(id),canvas=$('forest'),world=makeWorld(crypto.getRandomValues(new Uint32Array(1))[0]);
const state={phase:'title',age:0,time:0,paused:false,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,player:{...SPAWN,direction:'left',moving:false,running:false,animation:0,action:'sleep',actionTime:0},found:new Set(),notes:new Map(),destination:null,distance:0};
let renderer,animationConfig,path=[],near=null,pendingInterest=null,last=performance.now(),stepDistance=0,noticeTimer,subtitleUntil=0,voiceIds=new Set(),audioOn=true,joystick={x:0,y:0},stalled=0;
const keys=new Set(),audio=createAudio(notify);
function notify(text){$('notice').textContent=text;$('notice').classList.add('visible');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').classList.remove('visible'),3000);}
function updateSound(){ $('sound').textContent=audioOn?'♫':'♪';$('sound').setAttribute('aria-label',audioOn?'Mute sound':'Enable sound');$('sound').title=audioOn?'Sound on — click to mute':'Sound off — click to enable';audio.set(audioOn); }
function clearInput(){keys.clear();joystick={x:0,y:0};$('stick').style.transform='';}
function pause(){state.paused=true;clearInput();audio.pause();}
function resume(){state.paused=false;audio.resume();last=performance.now();}
function closePanel(){if($('panel').open)$('panel').close();resume();}
function dialog(title,content){pause();$('panel-content').replaceChildren();const tag=document.createElement('span');tag.className='eyebrow';tag.textContent='THE BOOK OF FENRIS';const heading=document.createElement('h2');heading.id='panel-title';heading.textContent=title;$('panel-content').append(tag,heading,content);if(!$('panel').open)$('panel').showModal();}
function button(text,action,cls='dialog-action'){const el=document.createElement('button');el.type='button';el.className=cls;el.textContent=text;el.addEventListener('click',action);return el;}
function paragraph(text){const el=document.createElement('p');el.textContent=text;return el;}
function examine(){
  if(state.phase!=='explore'||state.paused||!near)return;
  const id=near.id,entry=OPENING.observations[near.type];state.found.add(id);state.notes.set(id,entry);pendingInterest=null;$('journal-dot').hidden=false;path=[];state.destination=null;
  const content=document.createElement('div');content.append(paragraph(entry.text));const note=document.createElement('div');note.className='dialog-footer';note.textContent='Recorded in your journal.';content.append(note,button('Continue searching',closePanel));dialog(entry.title,content);updateObjective();
}
function journal(){
  if(state.phase==='title')return;
  $('journal-dot').hidden=true;const content=document.createElement('div');content.append(paragraph('An unfamiliar forest. No memory of who you are or how you came here.'));
  content.append(paragraph('The voices woke you. Find where they are coming from.'));
  for(const id of state.found){const entry=state.notes.get(id),h=document.createElement('h3');h.textContent=entry.title;content.append(h,paragraph(entry.text));}
  content.append(button('Close journal',closePanel));dialog('What you have noticed',content);
}
function menu(){
  if(state.phase==='title')return;
  const content=document.createElement('div');content.className='menu-actions';
  content.append(button('Continue',closePanel,''),button(audioOn?'Sound: on':'Sound: off',()=>{audioOn=!audioOn;updateSound();audio.pause();menu();},''));
  const label=document.createElement('label'),checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=state.reduced;checkbox.addEventListener('change',()=>state.reduced=checkbox.checked);label.append(checkbox,document.createTextNode('Reduce drifting leaves and camera motion'));content.append(label);
  content.append(button('Restart the awakening',()=>{closePanel();start();},''));const note=document.createElement('p');note.className='dialog-footer';note.textContent='WASD / arrows to move · Shift to run · E to examine · J for journal. Click the ground to walk. Your discoveries last for this visit.';content.append(note);dialog('A moment of quiet',content);
}
function start(){
  state.phase='waking';state.age=0;state.paused=false;state.player={...SPAWN,direction:'left',moving:false,running:false,animation:0,action:'sleep',actionTime:0};state.found.clear();state.notes.clear();pendingInterest=null;state.distance=0;state.destination=null;path=[];voiceIds.clear();subtitleUntil=0;near=null;clearInput();audio.cancel();
  renderer?.resetCamera(SPAWN.x,SPAWN.y-28);
  $('journal-dot').hidden=true;$('subtitles').hidden=true;$('game-ui').hidden=false;$('start').classList.add('leaving');$('veil').style.opacity='1';$('character-state').textContent='Waking';updateSound();updateObjective();last=performance.now();
}
function updateObjective(){
  $('objective-text').textContent='Seek the source of the voices.';
  $('progress').textContent='Search deeper into the forest.';
}
function moveTo(target){
  if(state.phase!=='explore'||state.paused)return;
  const interest=world.points.find(p=>Math.min(Math.hypot(target.x-p.x,target.y-p.y),Math.hypot(target.x-p.x,target.y-(p.y-26)))<15);
  pendingInterest=interest?.id||null;
  if(interest){
    if(Math.hypot(state.player.x-interest.x,state.player.y-interest.y)<48){near=interest;examine();return;}
    target={x:interest.x,y:interest.y};
  }
  if(interest&&!walkable(target.x,target.y,world.colliders)){
    const choices=Array.from({length:12},(_,i)=>({x:interest.x+Math.cos(i*Math.PI/6)*31,y:interest.y+Math.sin(i*Math.PI/6)*31})).filter(p=>walkable(p.x,p.y,world.colliders));
    choices.sort((a,b)=>Math.hypot(a.x-state.player.x,a.y-state.player.y)-Math.hypot(b.x-state.player.x,b.y-state.player.y));if(choices.length)target=choices[0];
  }
  if(!walkable(target.x,target.y,world.colliders)){pendingInterest=null;notify('Find a clear spot on the ground.');return;}
  const route=findPath(state.player,target,world.colliders);if(!route.length){pendingInterest=null;notify('The way is blocked. Try following the path.');return;}
  path=route;state.destination=target;stalled=0;
}
function update(dt){
  if(state.paused)return;
  world.update(state.player.x,state.player.y,renderer?.loadingRadius||800);
  state.time+=dt;
  if(state.phase==='title'){state.player.actionTime+=dt;return;}
  state.age+=dt;
  if(state.phase==='waking'){
    $('veil').style.opacity=String(Math.max(0,1-(state.age-.5)/1.3));
    $('chapter-intro').classList.toggle('visible',state.age>1.6&&state.age<4.7);
    const wake=awakeningAt(state.age,animationConfig);
    state.player.action=wake.action;state.player.actionTime=wake.actionTime;
    if(wake.complete){state.phase='explore';state.player.animation=0;$('veil').style.opacity='0';$('chapter-intro').classList.remove('visible');$('character-state').textContent='Finding his footing';updateObjective();}
  }
  for(const voice of OPENING.voices)if(state.age>=voice.at&&!voiceIds.has(voice.id)){voiceIds.add(voice.id);$('subtitle-text').textContent=voice.text;$('subtitles').hidden=false;subtitleUntil=state.age+voice.duration;}
  if(state.age>subtitleUntil)$('subtitles').hidden=true;
  const p=state.player;let dx=0,dy=0;
  if(state.phase==='explore'){
    dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+joystick.x;
    dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)+joystick.y;
    if(Math.hypot(dx,dy)>.08){path=[];state.destination=null;pendingInterest=null;}
    else if(path.length){let point=path[0];while(point&&Math.hypot(point.x-p.x,point.y-p.y)<5){path.shift();point=path[0];}if(point){dx=point.x-p.x;dy=point.y-p.y;}else state.destination=null;}
  }
  const length=Math.hypot(dx,dy),wasMoving=p.moving;p.moving=false;p.running=false;
  if(length>.08){
    const speed=keys.has('shift')?112:68;const travel=Math.min(speed*dt,path.length?length:Infinity);const next=move(p,dx/length*travel,dy/length*travel,world.colliders);const moved=Math.hypot(next.x-p.x,next.y-p.y);
    if(moved>.05)p.direction=movementDirection(next.x-p.x,next.y-p.y,p.direction);
    p.x=next.x;p.y=next.y;p.moving=moved>.05;p.running=p.moving&&keys.has('shift');state.distance+=moved;stepDistance+=moved;
    if(stepDistance>22){audio.step();stepDistance=0;}if(path.length){stalled=moved<.05?stalled+dt:0;if(stalled>.7){path=[];state.destination=null;notify('The way is blocked. Try another spot.');}}
  }
  if(wasMoving!==p.moving)p.animation=0;
  p.animation+=dt*(p.running?112/68:1)*(p.moving?movementScale(p.x,p.y):1);$('character-state').textContent=state.phase==='waking'?({sleep:'Sleeping',sleepToSit:'Waking',sit:'Sitting',sitToStand:'Standing up'}[p.action]||'Waking'):p.moving?(inWater(p.x,p.y)?'Wading':p.running?'Running':'Searching'):'Listening';
  near=state.phase==='explore'?world.points.filter(point=>Math.hypot(point.x-p.x,point.y-p.y)<48).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]||null:null;
  if(pendingInterest){
    const interest=world.points.find(point=>point.id===pendingInterest);
    if(interest&&Math.hypot(interest.x-p.x,interest.y-p.y)<48){near=interest;examine();}
  }
  audio.update(state.time,waterDistance(p.x,p.y)/12);
}
function frame(now){
  const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;update(dt);renderer.render(state,dt);
  $('touch-examine').disabled=!(near&&!state.paused&&state.phase==='explore');
  requestAnimationFrame(frame);
}
$('begin').addEventListener('click',()=>{audioOn=$('enable-audio').checked;start();});
$('sound').addEventListener('click',()=>{audioOn=!audioOn;updateSound();});
$('journal').addEventListener('click',journal);$('menu').addEventListener('click',menu);$('close-panel').addEventListener('click',closePanel);
$('touch-examine').addEventListener('click',examine);
$('panel').addEventListener('cancel',e=>{e.preventDefault();closePanel();});
window.addEventListener('keydown',e=>{
  if(state.phase==='title')return;
  const key=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key))e.preventDefault();
  if(key==='escape'){e.preventDefault();if($('panel').open)closePanel();else menu();return;}
  if(state.paused)return;
  if(!e.repeat&&key==='j'){journal();return;}if(!e.repeat&&key==='e'){examine();return;}keys.add(key);
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{clearInput();if(state.phase!=='title'&&!state.paused)menu();});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.phase!=='title'&&!state.paused)menu();});
window.addEventListener('resize',()=>renderer?.resize());
let pointerStart;
canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;pointerStart={x:e.clientX,y:e.clientY};});
canvas.addEventListener('pointerup',e=>{if(pointerStart&&Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)<12)moveTo(renderer.toWorld(e.clientX,e.clientY));pointerStart=null;});
canvas.addEventListener('pointercancel',()=>pointerStart=null);
canvas.addEventListener('wheel',e=>{e.preventDefault();if(!state.paused)renderer?.setZoom(e.deltaY<0?.1:-.1);},{passive:false});
const pad=$('joystick');let touchId=null;
function padMove(e){if(e.pointerId!==touchId)return;const rect=pad.getBoundingClientRect(),dx=e.clientX-rect.left-rect.width/2,dy=e.clientY-rect.top-rect.height/2;const len=Math.hypot(dx,dy),scale=len>34?34/len:1;joystick={x:dx*scale/34,y:dy*scale/34};$('stick').style.transform=`translate(${dx*scale}px,${dy*scale}px)`;}
pad.addEventListener('pointerdown',e=>{if(state.paused)return;touchId=e.pointerId;pad.setPointerCapture(touchId);padMove(e);});pad.addEventListener('pointermove',padMove);
function release(e){if(e.pointerId===touchId){touchId=null;joystick={x:0,y:0};$('stick').style.transform='';}}
pad.addEventListener('pointerup',release);pad.addEventListener('pointercancel',release);pad.addEventListener('lostpointercapture',release);
try {
  const art=await loadArt();animationConfig=art.manifest.fenrisAnimations;renderer=createRenderer(canvas,art,world);$('begin').disabled=false;$('begin').querySelector('span').textContent='Open your eyes';$('load-status').textContent='WASD or arrows to move · Click ground to walk';
  window.__fenris2d=Object.freeze({snapshot:()=>({phase:state.phase,age:state.age,paused:state.paused,position:{x:state.player.x,y:state.player.y},animation:{...fenrisFrame(state.player,art.manifest.fenrisAnimations),moving:state.player.moving,running:state.player.running},distance:state.distance,found:[...state.found],near:near?.id||null,pathLength:path.length,voices:[...voiceIds],audio:audio.status(),view:renderer.snapshot(),points:world.points.map(p=>({...p})),treeCount:world.trees.length,world:{seed:world.seed,chunks:world.chunks.size,terrain:terrainAt(state.player.x,state.player.y,world.seed),inWater:inWater(state.player.x,state.player.y),movementScale:movementScale(state.player.x,state.player.y)}}),worldToScreen:(x,y)=>renderer.toScreen(x,y)});
  requestAnimationFrame(frame);
} catch(error){console.error(error);$('load-status').textContent='The local artwork could not be loaded. Start this scene with npm start, then reload.';$('begin').querySelector('span').textContent='Unable to load the forest';}
