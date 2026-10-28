const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),report={checks:[],errors:[]};
 const check=(name,ok)=>{assert.ok(ok,name);report.checks.push(name);};
 try{
  const page=await browser.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__fenris2d);
  await page.locator('#begin').click();await page.getByRole('button',{name:'Start in slot 1',exact:true}).click();await page.waitForFunction(()=>__fenris2d.snapshot().phase==='explore');
  await page.waitForFunction(()=>__fenris2d.snapshot().audio.loaded.includes('wind')&&__fenris2d.snapshot().audio.loaded.some(id=>['hmm','curious'].includes(id)));
  check('Real game loads recorded wind and Fenris discovery voice',await page.evaluate(()=>__fenris2d.snapshot().audio.recordedVoices&&__fenris2d.snapshot().audio.windVolume===.5));
  await page.keyboard.down('s');await page.waitForFunction(()=>__fenris2d.snapshot().audio.loaded.includes('footsteps'));await page.keyboard.up('s');await page.waitForFunction(()=>!__fenris2d.snapshot().audio.loops.includes('footsteps'));
  check('Recorded footsteps follow actual movement and stop at rest',true);await page.keyboard.press('Escape');
  await page.evaluate(async()=>{
   const {createAudio}=await import('../audio.js');window.__audioCaptions=[];window.__audioQA=createAudio(()=>{},{onVoice:c=>__audioCaptions.push(c)});
   const button=document.createElement('button');button.id='audio-test-start';button.textContent='Start audio test';button.onclick=()=>__audioQA.set(true);document.getElementById('panel-content').append(button);
  });await page.locator('#audio-test-start').click();await page.waitForFunction(()=>__audioQA.status().context==='running');
  const clips=await page.evaluate(async()=>{
   const {AUDIO_CLIPS,audioUrl}=await import('../audio-catalog.js');const ctx=new AudioContext(),result=[];
   for(const id of Object.keys(AUDIO_CLIPS)){const r=await fetch(audioUrl(id));if(r.status!==200||!r.headers.get('content-type').includes('audio/mpeg'))throw Error(id+' not served as audio');const b=await ctx.decodeAudioData(await r.arrayBuffer());result.push({id,seconds:b.duration});}
   await ctx.close();return result;
  });check('All 42 MP3 files serve correctly and decode as playable audio',clips.length===42&&clips.every(c=>c.seconds>0));
  const voices=await page.evaluate(async()=>{const first=await __audioQA.voice('hmm'),repeat=await __audioQA.voice('hmm'),overlap=await __audioQA.voice('curious');return {first,repeat,overlap,captions:__audioCaptions};});
  check('Voice captions match the clip; cooldown prevents overlap and repetition',voices.first&&!voices.repeat&&!voices.overlap&&voices.captions[0].speaker==='Fenris'&&voices.captions[0].text==='Hmm…');
  await page.evaluate(()=>{__audioQA.update(0,100,{forest:true,moving:true,player:{x:0,y:0}});});await page.waitForFunction(()=>__audioQA.status().loaded.includes('footsteps'));
  await page.evaluate(()=>__audioQA.pause());await page.waitForFunction(()=>__audioQA.status().context==='suspended');check('Pause clears active loops',await page.evaluate(()=>__audioQA.status().loops.length===0));
  await page.evaluate(()=>__audioQA.resume());await page.waitForFunction(()=>__audioQA.status().context==='running');
  await page.route('**/twig-snap.mp3',async route=>{await new Promise(r=>setTimeout(r,100));await route.continue();});
  check('A pending sound cannot start after pause',await page.evaluate(async()=>{const pending=__audioQA.play('twig-snap');__audioQA.pause();return await pending===false;}));
  await page.evaluate(()=>{__audioQA.resume();__audioQA.set(false);});check('Mute blocks recorded sounds',await page.evaluate(async()=>!await __audioQA.voice('hmm')&&__audioQA.status().loops.length===0));
  check('No browser errors',report.errors.length===0);fs.writeFileSync(path.join(__dirname,'qa','audio-report.json'),JSON.stringify({...report,clips},null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
