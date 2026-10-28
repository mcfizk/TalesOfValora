import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {AUDIO_CLIPS,eventAudio} from '../audio-catalog.js';
import {PERCEPTION_EVENTS} from '../private-opening/perception-events.js';
test('every supplied clip has a catalog entry, existing file and voice caption where needed',()=>{
 const files=fs.readdirSync(new URL('../private-opening/assets/audio/',import.meta.url),{recursive:true}).filter(f=>f.endsWith('.mp3')).map(f=>f.replaceAll('\\','/')).sort();
 assert.deepEqual(Object.values(AUDIO_CLIPS).map(c=>c.file).sort(),files);assert.equal(files.length,42);
 for(const c of Object.values(AUDIO_CLIPS)){assert.ok(c.gain>0&&c.gain<=1);if(c.kind==='voice')assert.ok(c.speaker&&c.text);}
 assert.equal(Object.values(AUDIO_CLIPS).filter(c=>c.speaker==='Rixa').length,6);
});
test('event sounds match noticed/aware/surprised states and never invent a hostile creature encounter',()=>{
 const branch=PERCEPTION_EVENTS.find(e=>e.id==='placeholder-branch'),deer=PERCEPTION_EVENTS.find(e=>e.id==='placeholder-deer');
 assert.deepEqual(eventAudio(branch,{type:'discovered'}),{effect:'creaking',voice:'hmm'});
 assert.deepEqual(eventAudio(branch,{type:'encountered',awareness:'surprised'}),{effect:'twig-snap',voice:'what-the'});
 assert.equal(eventAudio(deer,{type:'encountered',awareness:'aware'}).voice,'easy-easy');
 for(const e of PERCEPTION_EVENTS)for(const effect of Object.values(e.audio||{}))assert.ok(AUDIO_CLIPS[effect]&&!AUDIO_CLIPS[effect].reserved);
 assert.ok(AUDIO_CLIPS.growl.reserved&&AUDIO_CLIPS['heavy-steps'].reserved);
});
