import {AUDIO_CLIPS,audioUrl} from './audio-catalog.js';
const WIND_VOLUME=.5;
export function createAudio(notify,{onVoice=()=>{}}={}){
 let context,master,water,on=true,paused=false,generation=0,voiceBusy=false,nextVoice=0,nextAmbient=18,ambientIndex=0,lastError=false;
 const failed=new Set(),buffers=new Map(),loading=new Map(),loops=new Map(),active=new Set(),cooldowns=new Map();
 let desired={forest:false,moving:false,night:true,running:false,player:{x:0,y:0}},lastPlayed=null;
 const available=()=>on&&!paused&&context?.state==='running';
 function init(){
  if(context)return;
  try{
   context=new(window.AudioContext||window.webkitAudioContext)();master=context.createGain();master.gain.value=on?.55:0;master.connect(context.destination);
   // Water remains the existing procedural stream; the recorded wind replaces synthetic wind.
   const buffer=context.createBuffer(1,context.sampleRate*4,context.sampleRate),data=buffer.getChannelData(0);let last=0;
   for(let i=0;i<data.length;i++){last=(last+Math.random()*.04-.02)/1.02;data[i]=last*3;}
   const stream=context.createBufferSource();stream.buffer=buffer;stream.loop=true;const high=context.createBiquadFilter();high.type='highpass';high.frequency.value=1000;
   water=context.createGain();water.gain.value=.02;stream.connect(high).connect(water).connect(master);stream.start();
  }catch{notify('Audio unavailable. Text remains enabled.');}
 }
 async function buffer(id){
  if(buffers.has(id))return buffers.get(id);if(loading.has(id))return loading.get(id);
  if(failed.has(id))throw Error('Audio previously unavailable');
  const task=(async()=>{const response=await fetch(audioUrl(id));if(!response.ok)throw Error('Audio file unavailable');const decoded=await context.decodeAudioData(await response.arrayBuffer());buffers.set(id,decoded);return decoded;})();
  loading.set(id,task);try{return await task;}catch(error){failed.add(id);throw error;}finally{loading.delete(id);}
 }
 function stopLoops(){for(const loop of loops.values())loop.stop?.();loops.clear();}
 function cancel(){generation++;for(const source of active)try{source.stop();}catch{}active.clear();voiceBusy=false;stopLoops();}
 function syntheticStep(){if(!available())return;const osc=context.createOscillator(),g=context.createGain(),now=context.currentTime;osc.type='triangle';osc.frequency.setValueAtTime(75+Math.random()*25,now);osc.frequency.exponentialRampToValueAtTime(30,now+.1);g.gain.setValueAtTime(.06,now);g.gain.exponentialRampToValueAtTime(.001,now+.12);osc.connect(g).connect(master);osc.onended=()=>{osc.disconnect();g.disconnect();};osc.start();osc.stop(now+.13);}
 async function loop(id,wanted,gain,rate=1){
  if(failed.has(id)&&wanted)return;
  const old=loops.get(id);
  if(!wanted){if(old){old.stop?.();loops.delete(id);}return;}
  if(old){if(old.gain){old.gain.gain.value=gain;old.source.playbackRate.value=rate;}return;}
  const marker={};loops.set(id,marker);const epoch=generation;
  try{
   const decoded=await buffer(id);if(!available()||epoch!==generation||loops.get(id)!==marker)return;
   const source=context.createBufferSource(),volume=context.createGain();source.buffer=decoded;source.loop=true;source.playbackRate.value=rate;volume.gain.value=gain;
   source.connect(volume).connect(master);marker.source=source;marker.gain=volume;marker.stop=()=>{try{source.stop();}catch{}source.disconnect();volume.disconnect();};source.start();
  }catch{if(loops.get(id)===marker)loops.delete(id);if(!lastError){lastError=true;notify('Some audio could not be loaded. Text remains enabled.');}}
 }
 async function play(id,{position,cooldown=2}={}){
  const clip=AUDIO_CLIPS[id];if(!clip||!available()||failed.has(id))return false;
  const now=context.currentTime;if((cooldowns.get(id)||0)>now||clip.kind==='voice'&&(voiceBusy||now<nextVoice))return false;
  const epoch=generation;cooldowns.set(id,now+cooldown);if(clip.kind==='voice')voiceBusy=true;
  try{
   const decoded=await buffer(id);if(!available()||epoch!==generation)return false;
   const source=context.createBufferSource(),volume=context.createGain();source.buffer=decoded;let gain=clip.gain;
   if(position){const dx=position.x-desired.player.x,dy=position.y-desired.player.y;gain*=Math.max(.1,1-Math.hypot(dx,dy)/900);}
   volume.gain.value=gain;source.connect(volume);let pan;
   if(position&&context.createStereoPanner){pan=context.createStereoPanner();pan.pan.value=Math.max(-1,Math.min(1,(position.x-desired.player.x)/300));volume.connect(pan).connect(master);}else volume.connect(master);
   active.add(source);source.onended=()=>{active.delete(source);source.disconnect();volume.disconnect();pan?.disconnect();if(clip.kind==='voice'&&epoch===generation)voiceBusy=false;};
   if(clip.kind==='voice'){nextVoice=context.currentTime+decoded.duration+5;onVoice({id,speaker:clip.speaker,text:clip.text,duration:decoded.duration});}
   source.start();lastPlayed=id;return true;
  }catch{if(clip.kind==='voice'&&epoch===generation)voiceBusy=false;return false;}
 }
 return {
  set(enabled){if(enabled&&!on)failed.clear();on=enabled;if(on){paused=false;init();context?.resume().catch(()=>{});}else cancel();if(master)master.gain.setTargetAtTime(on?.55:0,context.currentTime,.1);},
  speak(){/* Never synthesize story voices; only explicitly mapped recordings play. */},
  play,voice:(id,opts)=>play(id,{cooldown:15,...opts}),
  step(){if(!desired.forest||!desired.moving||desired.inWater)syntheticStep();},
  update(t,distance,scene={}){
   desired={...desired,...scene};if(!available())return;
   loop('wind',desired.forest,AUDIO_CLIPS.wind.gain*WIND_VOLUME);
   loop('footsteps',desired.forest&&desired.moving&&!desired.inWater,AUDIO_CLIPS.footsteps.gain,desired.running?1.4:1);
   if(water)water.gain.setTargetAtTime(desired.forest?Math.max(.02,.22-distance*.014):0,context.currentTime,.5);
   if(desired.active&&desired.forest&&t>=nextAmbient){
    const choices=desired.night?['creaking','whistle','wings','howl']:['crows','wings','creaking'];const id=choices[ambientIndex++%choices.length];
    nextAmbient=t+28+(ambientIndex%3)*11;play(id,{position:{x:desired.player.x+(ambientIndex%2?220:-220),y:desired.player.y-160},cooldown:20});
   }
  },
  pause(){paused=true;cancel();context?.suspend().catch(()=>{});},resume(){paused=false;if(on)context?.resume().catch(()=>{});},cancel,
  reset(t=0){cancel();cooldowns.clear();nextVoice=0;nextAmbient=t+18;ambientIndex=0;},
  status(){return {enabled:on,context:context?.state||'not-started',speechEnabled:false,recordedVoices:true,windVolume:WIND_VOLUME,windGain:loops.get('wind')?.gain?.gain.value||0,loops:[...loops.keys()],loaded:[...buffers.keys()],lastPlayed};}
 };
}
