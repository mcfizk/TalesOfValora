import test from 'node:test';
import assert from 'node:assert/strict';
import {eventIndicator} from './event-overlay.js';
import {PERCEPTION_EVENTS} from './perception-events.js';
import {createPerception,validatePerceptionEvents} from './perception.js';
import {createCharacter} from '../stats.js';

test('off-screen indicators remain within desktop, portrait and landscape bounds',()=>{
 for(const [w,h]of [[1440,900],[390,844],[844,390],[640,360]])for(const p of [{x:-2000,y:0},{x:3000,y:100},{x:200,y:-2000},{x:200,y:3000}]){
  const edge=eventIndicator(p,(x,y)=>({x,y}),w,h);assert.ok(edge);assert.ok(edge.x>=20&&edge.x<=w-20);assert.ok(edge.y>=0&&edge.y<=h);assert.ok(Number.isFinite(edge.angle));
 }
 assert.equal(eventIndicator({x:200,y:200},(x,y)=>({x,y}),390,844),null);
});
test('placeholder events are explicitly temporary and demonstrate discovery and hidden failure',()=>{
 validatePerceptionEvents(PERCEPTION_EVENTS);assert.equal(PERCEPTION_EVENTS.length,3);assert.ok(PERCEPTION_EVENTS.every(e=>e.placeholder));
 const p=createPerception({events:PERCEPTION_EVENTS});p.update({x:600,y:660},createCharacter('fenris'));
 assert.ok(p.visible().some(e=>e.id==='placeholder-deer'));assert.ok(!p.visible().some(e=>e.id==='placeholder-branch'));
});
