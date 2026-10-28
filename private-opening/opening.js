import {REST_RULES,createRestTracker,applyRestEffects} from './resting.js';
import {WAIT_DURATIONS,minutesUntilMorning,advanceWait,clockLabel} from './waiting.js';
import {eventAudio} from '../audio-catalog.js';
import {createEventOverlay} from './event-overlay.js';
import {createSaveSlots} from './saves.js';
import {makeInterior} from './village-layout.js';
import {createPerception} from './perception.js';
import {PERCEPTION_EVENTS,PERCEPTION_MODE} from './perception-events.js';
import {villagePeople,ALL_PEOPLE} from './village-people.js';
import {inVillage} from './village-layout.js';
import {createVillageUI} from './village-ui.js';
import {OPENING} from '../story.js';
import {createAudio} from '../audio.js';
import {createCharacterRoster} from '../world-characters.js';
import {SPAWN,makeWorld,move,findPath,walkable,waterDistance,inWater,movementScale,terrainAt} from './world.js';
import {loadArt,createRenderer} from './renderer.js';
import {movementDirection,fenrisFrame} from './fenris-animation.js';
import {awakeningAt} from './character-animation.js';
import {createGameClock} from './game-clock.js';
import {createPartyHud} from './party-hud.js';
import {villageLocation,waypointReading} from './navigation.js';

const $=id=>document.getElementById(id),canvas=$('forest'),world=makeWorld(crypto.getRandomValues(new Uint32Array(1))[0]);
const state={phase:'title',age:0,time:0,paused:false,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,player:{...SPAWN,direction:'left',moving:false,running:false,animation:0,action:'sleep',actionTime:0},found:new Set(),notes:new Map(),destination:null,distance:0};
const characters=createCharacterRoster(['fenris',...ALL_PEOPLE.map(p=>p.id)]);
let stats=characters.get('fenris');
const perception=createPerception({events:PERCEPTION_EVENTS,mode:PERCEPTION_MODE});
state.perception=perception.snapshot();
const gameClock=createGameClock(),partyHud=createPartyHud($('party-panel'));
let village=villageLocation(world.seed),activeSlot=null,autosaveAge=0,saveFailed=false;
const saves=createSaveSlots({getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)});
let characterStatus='Sleeping',villageTracking=true,lastParty='',lastClock='';
state.clock=gameClock.snapshot();state.village=null;state.waiting=null;
const rests=createRestTracker(state.clock.totalMinutes);let restEffectsKey='';
function syncRestEffects(){const r=rests.snapshot(),key=JSON.stringify([r.waitPenalty,r.exhausted]);if(key!==restEffectsKey){applyRestEffects(stats,r);restEffectsKey=key;}}
partyHud.update([{id:'fenris',name:'Fenris',portrait:'assets/fenris/portrait.png',portraitCrop:{scale:2.6,left:-.48,top:-.2},stats:stats.snapshot(),status:characterStatus}]);
let renderer,eventOverlay,animationConfig,path=[],near=null,pendingInterest=null,last=performance.now(),stepDistance=0,noticeTimer,subtitleUntil=0,voiceIds=new Set(),audioOn=true,joystick={x:0,y:0},stalled=0;
const keys=new Set(),audio=createAudio(notify,{onVoice:line=>{
  floatText({id:'fenris-voice',...state.player},{title:line.speaker,text:line.text});const card=state.callouts.find(c=>c.id==='fenris-voice');if(card)card.until=state.time+Math.max(2.5,line.duration+.5);
}});
const town=createVillageUI({state,world,getStats:()=>stats,dialog,paragraph,button,closePanel,notify,relocate,onObservation:observe,onConversation(npc,outcome,attitude){
  const memory={id:`conversation:${outcome.key}`,type:'conversation',participants:['fenris',npc],text:`${outcome.choice} ${outcome.text}`,at:state.clock.totalMinutes};
  characters.unit('fenris').remember(memory);characters.unit(npc).remember(memory);characters.unit(npc).setAffinity('fenris',attitude);
}});
state.callouts=[];
state.interior=null;state.people=[];state.interactionPoints=world.points;state.visitedVillage=false;state.economy=town.snapshot(false);
const colliders=()=>state.interior?.colliders||world.colliders;
function refreshTown(){state.people=villagePeople(world.village,state.clock,state.time,state.player,state.interior);for(const person of state.people)characters.get(person.actorId);state.interactionPoints=[...(state.interior?state.interior.points.filter(p=>p.id==='exit'):world.points),...(state.interior?[]:perception.visible()),...state.people];state.economy=town.snapshot(false);}
function relocate(target){state.waiting=null;audio.cancel();state.callouts=[];perception.update(state.player,stats,{active:false});state.seated=false;path=[];pendingInterest=null;near=null;state.destination=null;clearInput();Object.assign(state.player,target,{moving:false,action:null,animation:0});renderer.resetCamera(state.interior?120:target.x,state.interior?110:target.y-28);if(!state.interior)world.update(target.x,target.y,renderer.loadingRadius);refreshTown();}
function notify(text){$('notice').textContent=text;$('notice').classList.add('visible');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>$('notice').classList.remove('visible'),3000);}
function updateSound(){ $('sound').textContent=audioOn?'♫':'♪';$('sound').setAttribute('aria-label',audioOn?'Mute sound':'Enable sound');$('sound').title=audioOn?'Sound on — click to mute':'Sound off — click to enable';audio.set(audioOn); }
function clearInput(){keys.clear();joystick={x:0,y:0};$('stick').style.transform='';}
function pause(){saveGame(false);state.paused=true;clearInput();audio.pause();}
function resume(){state.paused=false;audio.resume();last=performance.now();}
function closePanel(){if($('panel').open)$('panel').close();resume();}
function dialog(title,content){pause();$('panel-content').replaceChildren();const tag=document.createElement('span');tag.className='eyebrow';tag.textContent='THE BOOK OF FENRIS';const heading=document.createElement('h2');heading.id='panel-title';heading.textContent=title;$('panel-content').append(tag,heading,content);if(!$('panel').open)$('panel').showModal();$('panel').scrollTop=0;heading.tabIndex=-1;heading.focus({preventScroll:true});}
function button(text,action,cls='dialog-action'){const el=document.createElement('button');el.type='button';el.className=cls;el.textContent=text;el.addEventListener('click',action);return el;}
function paragraph(text){const el=document.createElement('p');el.textContent=text;return el;}
function floatText(point,entry,{gather=false}={}){
  const until=state.time+Math.max(10,Math.min(20,entry.text.split(/\s+/).length*.35+5));
  state.callouts=state.callouts.filter(item=>item.id!==point.id&&item.until>state.time).slice(-2);
  state.callouts.push({id:point.id,x:point.x,y:point.y,title:entry.title,text:entry.text,until,gather,location:state.interior?.id||'forest'});
}
function observe(point,entry){
  const fresh=!state.found.has(point.id);if(fresh)audio.voice(point.type==='stone'?'let-me-look':point.type==='embers'?'hmm':point.type==='perception-event'?'curious':'huh-thats-new');
  state.found.add(point.id);state.notes.set(point.id,entry);$('journal-dot').hidden=false;
  characters.unit('fenris').remember({id:'observation:'+point.id,type:'observation',text:entry.text,at:state.clock.totalMinutes});
  floatText(point,entry,{gather:point.type==='stump'});
}
function gatherAt(id){
  const item=state.callouts.find(c=>c.id===id);if(!item||state.paused||Math.hypot(item.x-state.player.x,item.y-state.player.y)>=48)return;
  const gathered=town.gatherWood(id);if(gathered)audio.voice('got-it');item.text=gathered?'You gather one bundle of fallen wood.':'You have already gathered the loose wood here.';item.gather=false;item.until=state.time+10;
}
function examine(){
  if(state.phase!=='explore'||state.paused||!near)return;
  stopWaiting(false);
  const point=near;path=[];pendingInterest=null;state.destination=null;
  if(town.interact(point))return;
  const id=point.id,entry=point.type==='perception-event'?{title:point.title,text:point.text}:OPENING.observations[point.type];if(!entry)return;pendingInterest=null;$('journal-dot').hidden=false;path=[];state.destination=null;
  observe(point,entry);updateObjective();
}
function journal(){
  if(state.phase==='title')return;
  $('journal-dot').hidden=true;const content=document.createElement('div');content.append(paragraph('An unfamiliar forest. No memory of who you are or how you came here.'));
  content.append(paragraph('The voices woke you. Find where they are coming from.'));
  for(const id of state.found){const entry=state.notes.get(id),h=document.createElement('h3');h.textContent=entry.title;content.append(h,paragraph(entry.text));}
  content.append(button('Close journal',closePanel));dialog('What you have noticed',content);
}
function stopWaiting(announce=true){
  if(!state.waiting)return;
  const activity=state.waiting;state.waiting=null;
  wakeFromRest(activity);
  if(announce)notify('Rest / wait ended. '+clockLabel(state.clock.totalMinutes)+'.');
  saveGame(false);
}
function wakeFromRest(activity){
  if(activity?.kind==='sleep'||activity?.kind==='long'){state.player.action='sleepToSit';state.player.actionTime=0;state.seated=true;}
}
function startWaiting(minutes,kind='wait'){
  if(state.phase!=='explore')return;
  if(!state.interior&&inWater(state.player.x,state.player.y)){notify('Find dry ground before resting.');return;}
  if(stats.status!=='conscious'){notify('Fenris must be conscious to choose a rest.');return;}
  try{state.waiting=rests.begin(kind,state.clock.totalMinutes,minutes);}catch(error){notify(error.message);return;}
  path=[];pendingInterest=null;state.destination=null;clearInput();
  state.seated=true;Object.assign(state.player,{moving:false,running:false,action:kind==='long'||kind==='sleep'?'sleep':'sit',actionTime:0});
  closePanel();saveGame(false);
}
function waitMenu(){
  if(state.phase!=='explore')return;
  if(state.waiting){stopWaiting();closePanel();return;}
  const content=document.createElement('div');content.className='wait-options';
  content.append(paragraph('Rest, sleep, or let time pass. Each second passes one hour. Move or choose Stop to interrupt.'));
  const rest=rests.snapshot();
  const effects=[];if(rest.waitPenalty)effects.push('Restless: −1 Perception and Initiative until a completed rest.');if(rest.exhausted)effects.push('Exhausted: −2 ability checks and skill checks; movement 20% slower. Cleared by completed sleep or a long rest.');
  content.append(paragraph(effects.join(' ')||'No rest-related penalties.'));
  content.append(paragraph('Over 1 hour of continuous waiting causes Restless. A completed rest resets the 24-hour exhaustion timer.'));
  const now=state.clock.totalMinutes;
  if(!rest.exhausted)content.append(paragraph('Rest again before '+clockLabel(rest.lastRestAt+REST_RULES.exhaustionMinutes)+' to avoid exhaustion.'));
  for(const [kind,label,duration] of [['short','Short rest',REST_RULES.shortMinutes],['long','Long rest',REST_RULES.longMinutes],['sleep','Sleep',REST_RULES.sleepMinutes]]){
    const action=button(label+' · '+duration/60+(duration===60?' hour':' hours')+' · '+clockLabel(now+duration),()=>startWaiting(duration,kind));
    action.disabled=!rests.available(kind,now);content.append(action);
  }
  content.append(paragraph('Sleep and long rest share one 24-hour limit, counted from starting either, even if interrupted.'+(rests.available('sleep',now)?' Available now.':' Next available '+clockLabel(rest.nextSleepAt)+'.')));
  const heading=document.createElement('h3');heading.textContent='Simply wait';content.append(heading);
  for(const minutes of WAIT_DURATIONS){
    const label=minutes<60?minutes+' minutes':minutes/60+(minutes===60?' hour':' hours');
    content.append(button('Wait '+label+' · '+clockLabel(now+minutes),()=>startWaiting(minutes)));
  }
  const morning=minutesUntilMorning(now);
  content.append(button('Until morning · '+clockLabel(now+morning),()=>startWaiting(morning)),button('Cancel',closePanel));
  dialog('Rest / Wait',content);
}
function menu(){
  if(state.phase==='title')return;
  const content=document.createElement('div');content.className='menu-actions';
  content.append(button('Continue',closePanel,''),button(audioOn?'Sound: on':'Sound: off',()=>{audioOn=!audioOn;updateSound();audio.pause();menu();},''));
  const label=document.createElement('label'),checkbox=document.createElement('input');checkbox.type='checkbox';checkbox.checked=state.reduced;checkbox.addEventListener('change',()=>state.reduced=checkbox.checked);label.append(checkbox,document.createTextNode('Reduce drifting leaves and camera motion'));content.append(label);
  if(state.phase==='explore')content.append(button(state.waiting?(state.waiting.kind==='wait'?'Stop waiting':'Interrupt rest'):'Rest / Wait',waitMenu,''));
  content.append(button('Save Game',()=>{if(saveGame(true))closePanel();},''),button('Load Game',()=>slotMenu('load'),''),button('New Game',()=>slotMenu('new'),''),button('Save and return to title',()=>{if(saveGame(true))showTitle();},''),button('Restart the awakening',()=>{closePanel();start();saveGame(false);},''));const note=document.createElement('p');note.className='dialog-footer';note.textContent='WASD / arrows to move · Shift to run · E to examine · J for journal · I for pack · T to rest / wait. Click the ground to walk. Progress autosaves to the selected slot on this browser.';content.append(note);dialog('A moment of quiet',content);
}
function start({newWorld=false}={}){
  if(newWorld){world.reset(crypto.getRandomValues(new Uint32Array(1))[0]);village=villageLocation(world.seed);renderer.resetWorld();}
  state.waiting=null;autosaveAge=0;stepDistance=0;state.time=0;state.callouts=[];
  town.reset();perception.reset();state.perception=perception.snapshot();state.interior=null;state.visitedVillage=false;state.seated=false;characters.reset();stats=characters.get('fenris');gameClock.reset();state.clock=gameClock.snapshot();rests.reset(state.clock.totalMinutes);restEffectsKey='';syncRestEffects();state.village=null;villageTracking=true;lastParty='';lastClock='';characterStatus='Waking';
  state.phase='waking';state.age=0;state.paused=false;state.player={...SPAWN,direction:'left',moving:false,running:false,animation:0,action:'sleep',actionTime:0};state.found.clear();state.notes.clear();pendingInterest=null;state.distance=0;state.destination=null;path=[];voiceIds.clear();subtitleUntil=0;near=null;clearInput();audio.reset();
  renderer?.resetCamera(SPAWN.x,SPAWN.y-28);
  $('journal-dot').hidden=true;$('subtitles').hidden=true;$('game-ui').hidden=false;$('start').classList.add('leaving');$('start').inert=true;$('veil').style.opacity='1';updateSound();updateObjective();syncHud();last=performance.now();
}
function captureGame(){
  return {rest:rests.serialize(),seed:world.seed,phase:state.phase,age:state.age,time:state.time,distance:state.distance,player:{...state.player,moving:false,running:false},minutes:state.clock.totalMinutes,found:[...state.found],notes:[...state.notes],voices:[...voiceIds],subtitleUntil,visitedVillage:state.visitedVillage,seated:!!state.seated,villageDiscovered:!!state.village,villageTracking,interior:state.interior?.id||null,audioOn,reduced:state.reduced,characters:characters.serialize(),town:town.serialize(),perception:perception.snapshot()};
}
function refreshSaves(){
  const slots=saves.list();$('continue-game').disabled=!renderer||!slots.some(s=>s.status==='saved');return slots;
}
function saveGame(manual=false){
  if(!activeSlot||state.phase==='title')return false;if(saveFailed&&!manual)return false;
  try{saves.write(activeSlot,captureGame());saveFailed=false;if(manual)notify('Saved to slot '+activeSlot+'.');return true;}
  catch(error){saveFailed=true;notify(error.message);return false;}
}
function showTitle(){
  if($('panel').open)$('panel').close();state.waiting=null;state.phase='title';state.paused=false;activeSlot=null;clearInput();path=[];state.destination=null;audio.pause();
  $('start').classList.remove('leaving');$('start').inert=false;$('game-ui').hidden=true;$('subtitles').hidden=true;$('chapter-intro').classList.remove('visible');$('veil').style.opacity='0';refreshSaves();
}
function loadGame(slot){
  try{
    const saved=saves.read(slot);if(!saved)throw new Error('This slot is empty.');const d=saved.data;
    // read() validates every subsystem on fresh instances before this commit.
    characters.load(d.characters);stats=characters.get('fenris');town.load(d.town);perception.load(d.perception);
    world.reset(d.seed);village=villageLocation(world.seed);renderer.resetWorld();
    Object.assign(state,{phase:d.phase,age:d.age,time:d.time,distance:d.distance,player:{...d.player,moving:false,running:false},found:new Set(d.found),notes:new Map(d.notes),visitedVillage:d.visitedVillage,seated:d.seated,reduced:d.reduced});
    state.clock=gameClock.load(d.minutes);rests.load(d.rest,d.minutes);restEffectsKey='';syncRestEffects();if(state.player.action==='sleep'&&d.phase==='explore')wakeFromRest({kind:'sleep'});state.village=d.villageDiscovered?{...village}:null;state.interior=d.interior?makeInterior(world.village.buildings.find(b=>b.id===d.interior)):null;
    voiceIds=new Set(d.voices);subtitleUntil=d.subtitleUntil;villageTracking=d.villageTracking;audioOn=d.audioOn;activeSlot=slot;saveFailed=false;autosaveAge=0;
    state.waiting=null;state.callouts=[];path=[];pendingInterest=null;near=null;state.destination=null;stepDistance=0;state.perception=perception.snapshot();clearInput();
    if($('panel').open)$('panel').close();state.paused=false;audio.reset(d.time);updateSound();lastParty='';lastClock='';
    renderer.resetCamera(state.interior?120:state.player.x,state.interior?110:state.player.y-28);world.update(state.player.x,state.player.y,renderer.loadingRadius);refreshTown();
    $('start').classList.add('leaving');$('start').inert=true;$('game-ui').hidden=false;$('journal-dot').hidden=true;$('chapter-intro').classList.remove('visible');$('veil').style.opacity=d.phase==='waking'?'1':'0';
    const voice=OPENING.voices.filter(v=>voiceIds.has(v.id)&&d.age<v.at+v.duration).at(-1);$('subtitles').hidden=!voice;if(voice)$('subtitle-text').textContent=voice.text;
    updateObjective();syncHud();last=performance.now();notify('Continued from slot '+slot+'.');
  }catch(error){notify('Could not continue: '+error.message);}
}
function beginSlot(slot){
  // Choosing New Game is the explicit replacement of this slot only.
  if(state.phase!=='title')saveGame(false);
  activeSlot=slot;saveFailed=false;audioOn=$('enable-audio').checked;if($('panel').open)$('panel').close();start({newWorld:true});saveGame(false);
}
function slotMenu(mode){
  const content=document.createElement('div');content.className='save-slots';
  content.append(paragraph(mode==='new'?'Choose a slot for your new journey.':'Choose a journey to continue.'));
  for(const item of refreshSaves()){
    const card=document.createElement('section');card.className='save-slot';const h=document.createElement('h3');h.textContent='Slot '+item.slot;card.append(h);
    if(item.save){const d=item.save.data,minutes=d.minutes%1440;card.append(paragraph('Day '+(Math.floor(d.minutes/1440)+1)+' · '+String(Math.floor(minutes/60)).padStart(2,'0')+':'+String(Math.floor(minutes%60)).padStart(2,'0')+' · '+(d.interior||'Forest')),paragraph('Saved '+new Date(item.save.savedAt).toLocaleString()));}
    else card.append(paragraph(item.status==='empty'?'Empty slot':item.error));
    const action=button((mode==='new'?'Start in slot ':'Continue slot ')+item.slot,()=>{
      if(mode==='load'){loadGame(item.slot);return;}
      if(item.status==='empty'){beginSlot(item.slot);return;}
      const confirm=document.createElement('div');confirm.append(paragraph('Starting a new game will replace the saved journey in slot '+item.slot+'.'),button('Replace slot '+item.slot,()=>beginSlot(item.slot)),button('Cancel',()=>slotMenu('new')));dialog('Replace saved game?',confirm);
    });action.disabled=mode==='load'&&item.status!=='saved';card.append(action);content.append(card);
  }
  content.append(paragraph('Three local slots. Progress saves automatically and from the pause menu. Saves stay in this browser on this site.'),button('Back',()=>state.phase==='title'?closePanel():menu()));
  dialog(mode==='new'?'New Game':'Continue',content);
}
function updateObjective(){
  $('objective-text').textContent='Seek the source of the voices.';
  $('progress').textContent='Search deeper into the forest.';
}
function moveTo(target){
  if(state.phase!=='explore'||state.paused)return;
  stopWaiting(false);
  const interest=state.interactionPoints.find(p=>Math.min(Math.hypot(target.x-p.x,target.y-p.y),Math.hypot(target.x-p.x,target.y-(p.y-26)))<15);
  pendingInterest=interest?.id||null;
  if(interest){
    if(Math.hypot(state.player.x-interest.x,state.player.y-interest.y)<48){near=interest;examine();return;}
    target={x:interest.x,y:interest.y};
  }
  if(interest&&!walkable(target.x,target.y,colliders())){
    const choices=Array.from({length:12},(_,i)=>({x:interest.x+Math.cos(i*Math.PI/6)*31,y:interest.y+Math.sin(i*Math.PI/6)*31})).filter(p=>walkable(p.x,p.y,colliders()));
    choices.sort((a,b)=>Math.hypot(a.x-state.player.x,a.y-state.player.y)-Math.hypot(b.x-state.player.x,b.y-state.player.y));if(choices.length)target=choices[0];
  }
  if(!walkable(target.x,target.y,colliders())){pendingInterest=null;notify('Find a clear spot on the ground.');return;}
  const route=findPath(state.player,target,colliders());if(!route.length){pendingInterest=null;notify('The way is blocked. Try following the path.');return;}
  path=route;state.destination=target;stalled=0;
}
function update(dt){
  if(state.paused)return;
  if(!state.interior)world.update(state.player.x,state.player.y,renderer?.loadingRadius||800);
  refreshTown();
  state.time+=dt;
  if(state.phase==='title'){state.player.actionTime+=dt;return;}
  state.age+=dt;
  if(state.phase==='waking'){
    $('veil').style.opacity=String(Math.max(0,1-(state.age-.5)/1.3));
    $('chapter-intro').classList.toggle('visible',state.age>1.6&&state.age<4.7);
    const wake=awakeningAt(state.age,animationConfig);
    state.player.action=wake.action;state.player.actionTime=wake.actionTime;
    if(wake.complete){state.phase='explore';state.player.action=null;state.player.animation=0;$('veil').style.opacity='0';$('chapter-intro').classList.remove('visible');characterStatus='Finding his footing';updateObjective();}
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
  let length=Math.hypot(dx,dy);const wasMoving=p.moving;p.moving=false;p.running=false;
  if(length>.08&&state.waiting)stopWaiting(false);
  if(length>.08&&state.seated&&p.action!=='sleepToSit'){state.seated=false;p.action='sitToStand';p.actionTime=0;}
  if(p.action==='sitToStand'||p.action==='sleepToSit')length=0;
  if(length>.08){
    const speed=(keys.has('shift')?112:68)*rests.snapshot().speedMultiplier;const travel=Math.min(speed*dt,path.length?length:Infinity);const next=move(p,dx/length*travel,dy/length*travel,colliders());const moved=Math.hypot(next.x-p.x,next.y-p.y);
    if(moved>.05)p.direction=movementDirection(next.x-p.x,next.y-p.y,p.direction);
    p.x=next.x;p.y=next.y;p.moving=moved>.05;p.running=p.moving&&keys.has('shift');state.distance+=moved;stepDistance+=moved;
    if(stepDistance>22){audio.step();stepDistance=0;}if(path.length){stalled=moved<.05?stalled+dt:0;if(stalled>.7){path=[];state.destination=null;notify('The way is blocked. Try another spot.');}}
  }
  if(state.phase==='explore'&&p.action){p.actionTime+=dt;if(p.action==='sitToStand'&&p.actionTime>=1.5)p.action=null;if(p.action==='sleepToSit'&&p.actionTime>=1.5){p.action='sit';p.actionTime=0;}}
  const previousMinute=state.clock.totalMinutes,activity=state.waiting;
  if(activity)state.clock=gameClock.elapse(advanceWait(previousMinute,activity.target,dt));
  else state.clock=gameClock.advance(dt,p.moving);
  const beforeRest=rests.snapshot();
  rests.tick(state.clock.totalMinutes,{kind:activity?.kind,elapsed:state.clock.totalMinutes-previousMinute,moving:p.moving});
  if(activity&&state.clock.totalMinutes>=activity.target){
    const completed=rests.complete(activity.kind,state.clock.totalMinutes);state.waiting=null;wakeFromRest(activity);
    if(completed)characters.unit('fenris').remember({id:'rest:'+completed.kind+':'+completed.at,type:'rest',text:'Completed '+completed.kind+' rest.',at:completed.at});
    notify((activity.kind==='wait'?'Time has passed.':activity.kind==='short'?'Short rest complete.':activity.kind==='long'?'Long rest complete.':'Sleep complete.')+' '+clockLabel(state.clock.totalMinutes)+'.');
  }
  syncRestEffects();const afterRest=rests.snapshot();
  if(!beforeRest.exhausted&&afterRest.exhausted)notify('Exhausted: 24 hours without a completed rest. Ability checks −2; movement 20% slower.');
  else if(!beforeRest.waitPenalty&&afterRest.waitPenalty)notify('Restless: over an hour of waiting. Perception and Initiative −1 until a completed rest.');
  if(activity&&!state.waiting)saveGame(false);
  if(!state.interior&&inVillage(p.x,p.y,world.seed)&&!state.visitedVillage){state.visitedVillage=true;notify('The villagers fall quiet as you approach.');}
  const outcomes=perception.update(p,stats,{active:state.phase==='explore'&&!state.interior,eligible:event=>!event.availableAfterDay||state.clock.day>=event.availableAfterDay});
  for(const outcome of outcomes){
    const event=PERCEPTION_EVENTS.find(e=>e.id===outcome.id);if(event){floatText(event,{title:outcome.title,text:outcome.text});const cue=eventAudio(event,outcome);if(cue.effect)audio.play(cue.effect,{position:event});if(cue.voice)audio.voice(cue.voice);}
    state.notes.set(outcome.id,{title:outcome.title,text:outcome.text});state.found.add(outcome.id);$('journal-dot').hidden=false;
    characters.unit('fenris').remember({id:`perception:${outcome.id}:${outcome.type}`,type:'perception',text:outcome.text,at:state.clock.totalMinutes});
  }
  state.perception=perception.snapshot();
  refreshTown();
  if(state.clock.villageAvailable&&!state.village){state.village={...village};notify('Morning breaks. A village is now marked on your compass.');}
  if(wasMoving!==p.moving)p.animation=0;
  p.animation+=dt*(p.running?112/68:1)*(p.moving?movementScale(p.x,p.y)*rests.snapshot().speedMultiplier:1);characterStatus=state.phase==='waking'?({sleep:'Sleeping',sleepToSit:'Waking',sit:'Sitting',sitToStand:'Standing up'}[p.action]||'Waking'):p.moving?(inWater(p.x,p.y)?'Wading':p.running?'Running':'Searching'):state.waiting?({wait:'Waiting',short:'Short rest',long:'Long rest',sleep:'Sleeping'}[state.waiting.kind]):state.seated?'Sitting':p.action==='sitToStand'?'Standing up':'Listening';
  const fatigue=rests.snapshot();if(fatigue.exhausted)characterStatus+=' · Exhausted';if(fatigue.waitPenalty)characterStatus+=' · Restless';
  near=state.phase==='explore'?state.interactionPoints.filter(point=>Math.hypot(point.x-p.x,point.y-p.y)<48).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0]||null:null;
  if(pendingInterest){
    const interest=state.interactionPoints.find(point=>point.id===pendingInterest);
    if(interest&&Math.hypot(interest.x-p.x,interest.y-p.y)<48){near=interest;examine();}
  }
  audio.update(state.time,waterDistance(p.x,p.y)/12,{forest:!state.interior&&!inVillage(p.x,p.y,world.seed),active:state.phase==='explore',night:!state.clock.daylight,moving:p.moving,running:p.running,inWater:inWater(p.x,p.y),player:{x:p.x,y:p.y}});
  const speech=state.callouts.find(c=>c.id==='fenris-voice');if(speech){speech.x=p.x;speech.y=p.y;}
}
function syncHud(){
  $('rest-wait').disabled=state.phase!=='explore'||state.paused;
  $('rest-wait').textContent=state.waiting?(state.waiting.kind==='wait'?'Stop waiting':'Interrupt rest'):'Rest / Wait';
  $('stop-wait').textContent=state.waiting?.kind==='wait'?'Stop waiting':'Interrupt rest';
  $('wait-status').hidden=!state.waiting||state.phase!=='explore'||state.paused;
  if(state.waiting){
    $('wait-until').textContent=({wait:'Waiting',short:'Short rest',long:'Long rest',sleep:'Sleeping'}[state.waiting.kind])+' until '+clockLabel(state.waiting.target);
    $('wait-progress').value=state.clock.totalMinutes-state.waiting.start;
    $('wait-progress').max=state.waiting.target-state.waiting.start;
  }
  const sheet=stats.snapshot(),partyKey=JSON.stringify([sheet.hp,sheet.maxHp,sheet.power,characterStatus]);
  if(partyKey!==lastParty){partyHud.update([{id:'fenris',name:'Fenris',portrait:'assets/fenris/portrait.png',portraitCrop:{scale:2.6,left:-.48,top:-.2},stats:sheet,status:characterStatus}]);lastParty=partyKey;}
  const clock=state.clock,clockKey=`${clock.day}:${clock.time}`;
  if(clockKey!==lastClock){
    $('clock-time').textContent=clock.time;$('clock-time').dateTime=clock.time;$('clock-day').textContent=`Day ${clock.day}`;$('clock-phase').textContent=clock.phase;
    $('world-clock').setAttribute('aria-label',`Day ${clock.day}, ${clock.time}, ${clock.phase}`);
    $('sky-symbol').textContent=clock.daylight?'☀':'☾';$('sky-symbol').setAttribute('x',String(8+84*clock.arc));$('sky-symbol').setAttribute('y',String(35-24*Math.sin(clock.arc*Math.PI)));lastClock=clockKey;
  }
  $('pack').textContent=`Pack · ${town.snapshot(false).copper}c`;$('location-name').textContent=state.interior?state.interior.label:inVillage(state.player.x,state.player.y,world.seed)?'A wary village':'An unfamiliar forest';
  const visible=!!state.village&&state.phase==='explore'&&!state.interior;$('village-nav').hidden=!visible;$('village-beacon').hidden=!visible||!villageTracking;
  if(visible){
    const reading=waypointReading(state.player,state.village);
    $('village-label').textContent=reading.arrived?'Village square':'Village';$('village-distance').textContent=reading.arrived?'Waypoint reached':`${reading.direction} · ${reading.paces} paces`;
    $('village-nav').querySelector('.village-bearing').style.transform=`rotate(${reading.bearing}deg)`;
    $('village-nav').setAttribute('aria-pressed',String(villageTracking));$('village-nav').setAttribute('aria-label',`${villageTracking?'Stop tracking':'Track'} village, ${reading.direction}, ${reading.paces} paces`);
    $('village-nav').disabled=state.paused;
    if(villageTracking){const at=renderer.toScreen(state.village.x,state.village.y),compact=innerWidth<700&&innerHeight>550,top=compact?320:115,bottom=compact?innerHeight-325:innerHeight-100;$('village-beacon').style.left=`${Math.max(32,Math.min(innerWidth-32,at.x))}px`;$('village-beacon').style.top=`${Math.max(top,Math.min(bottom,at.y))}px`;}
  }
}
function frame(now){
  const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;update(dt);renderer.render(state,dt);eventOverlay.update(state,innerWidth,innerHeight);syncHud();
  if(activeSlot&&state.phase!=='title'&&!state.paused){autosaveAge+=dt;if(autosaveAge>=10){autosaveAge=0;saveGame(false);}}
  $('touch-examine').disabled=!(near&&!state.paused&&state.phase==='explore');
  requestAnimationFrame(frame);
}
$('begin').addEventListener('click',()=>slotMenu('new'));
$('continue-game').addEventListener('click',()=>slotMenu('load'));
window.addEventListener('pagehide',()=>saveGame(false));
$('sound').addEventListener('click',()=>{audioOn=!audioOn;updateSound();});
$('pack').addEventListener('click',()=>{if(state.phase==='explore')town.inventory();});
$('journal').addEventListener('click',journal);$('menu').addEventListener('click',menu);$('close-panel').addEventListener('click',closePanel);
$('touch-examine').addEventListener('click',examine);
$('rest-wait').addEventListener('click',waitMenu);$('stop-wait').addEventListener('click',()=>stopWaiting());
$('village-nav').addEventListener('click',()=>{if(state.paused)return;villageTracking=!villageTracking;if(villageTracking)audio.voice('this-way');syncHud();});
$('panel').addEventListener('cancel',e=>{e.preventDefault();closePanel();});
window.addEventListener('keydown',e=>{
  if(state.phase==='title')return;
  const key=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key))e.preventDefault();
  if(key==='escape'){e.preventDefault();if($('panel').open)closePanel();else menu();return;}
  if(state.paused)return;
  if(!e.repeat&&key==='t'&&state.phase==='explore'){waitMenu();return;}
  if(!e.repeat&&key==='i'&&state.phase==='explore'){town.inventory();return;}if(!e.repeat&&key==='j'){journal();return;}if(!e.repeat&&key==='e'){examine();return;}keys.add(key);
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{clearInput();if(state.phase!=='title'&&!state.paused)menu();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveGame(false);if(document.hidden&&state.phase!=='title'&&!state.paused)menu();});
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
  const art=await loadArt();animationConfig=art.manifest.fenrisAnimations;renderer=createRenderer(canvas,art,world);eventOverlay=createEventOverlay($('world-events'),{toScreen:(x,y)=>renderer.toScreen(x,y),onNavigate:moveTo,onGather:gatherAt});$('begin').disabled=false;$('begin').querySelector('span').textContent='New Game';refreshSaves();$('load-status').textContent='WASD or arrows to move · Click ground to walk';
  window.__fenris2d=Object.freeze({snapshot:()=>({phase:state.phase,age:state.age,saveSlot:activeSlot,rest:rests.snapshot(),waiting:state.waiting?{...state.waiting}:null,seated:!!state.seated,callouts:structuredClone(state.callouts),paused:state.paused,position:{x:state.player.x,y:state.player.y},animation:{...fenrisFrame(state.player,art.manifest.fenrisAnimations),moving:state.player.moving,running:state.player.running},distance:state.distance,found:[...state.found],near:near?.id||null,pathLength:path.length,voices:[...voiceIds],audio:audio.status(),perception:perception.snapshot(),stats:stats.snapshot(),clock:{...state.clock},village:state.village?{...state.village,...waypointReading(state.player,state.village),tracking:villageTracking}:null,view:renderer.snapshot(),location:state.interior?.id||'forest',economy:town.snapshot(),characters:characters.snapshot(),units:characters.unitSnapshot(),people:state.people.map(p=>({id:p.id,characterId:p.actorId,x:p.x,y:p.y,role:p.role,stats:characters.get(p.actorId).snapshot()})),settlement:{x:world.village.x,y:world.village.y,buildings:world.village.buildings.length,populationTemplate:{...world.village.populationTemplate}},points:state.interactionPoints.map(p=>({...p})),treeCount:world.trees.length,world:{seed:world.seed,chunks:world.chunks.size,terrain:terrainAt(state.player.x,state.player.y,world.seed),inWater:inWater(state.player.x,state.player.y),movementScale:movementScale(state.player.x,state.player.y)}}),worldToScreen:(x,y)=>renderer.toScreen(x,y)});
  requestAnimationFrame(frame);
} catch(error){console.error(error);$('load-status').textContent='The local artwork could not be loaded. Start this scene with npm start, then reload.';$('begin').querySelector('span').textContent='Unable to load the forest';}
