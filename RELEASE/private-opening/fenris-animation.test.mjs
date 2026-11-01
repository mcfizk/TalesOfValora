import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {movementDirection,fenrisFrame} from './fenris-animation.js';
import {CHARACTER_ACTIONS,characterFrame,characterAssets,awakeningAt,validateCharacterAnimations} from './character-animation.js';
const config=JSON.parse(readFileSync(new URL('./assets/manifest.json',import.meta.url),'utf8')).fenrisAnimations;

test('screen-space movement selects all eight facings and retains direction at rest',()=>{
  for(const [dx,dy,direction] of [[-1,0,'left'],[1,0,'right'],[0,-1,'up'],[0,1,'down'],[-1,-1,'up-left'],[1,-1,'up-right'],[-1,1,'down-left'],[1,1,'down-right']])assert.equal(movementDirection(dx,dy),direction);
  assert.equal(movementDirection(0,0,'up'),'up');
  assert.equal(movementDirection(1,-0.1),'right');
});
test('walking uses the requested direction without applying a second mirror',()=>{
  for(const direction of Object.keys(config.walk.files)){
    const frame=fenrisFrame({direction,moving:true,animation:0.875},config);
    assert.equal(frame.asset,`fenris-walk-${direction}`);
    assert.equal(frame.index,7);assert.equal(frame.mirror,false);
    assert.equal(fenrisFrame({direction,moving:true,animation:1},config).index,0);
  }
});
test('idle takes two seconds and non-side rest preserves facing',()=>{
  const left=fenrisFrame({direction:'left',moving:false,animation:1.75},config);
  const right=fenrisFrame({direction:'right',moving:false,animation:2},config);
  assert.equal(left.clip,'idle');assert.equal(left.index,7);assert.equal(left.mirror,false);
  assert.equal(right.index,0);assert.equal(right.mirror,true);
  for(const direction of ['up','down','up-left','up-right','down-left','down-right']){
    const rest=fenrisFrame({direction,moving:false,animation:50},config);
    assert.equal(rest.clip,'rest');assert.equal(rest.direction,direction);assert.equal(rest.index,config.restFrame);
  }
});
test('every frame rectangle fits its imported PNG and shares a valid ground anchor',()=>{
  const entries=[...CHARACTER_ACTIONS.filter(action=>action!=='walk').map(action=>[config[action].file,config[action]]),...Object.values(config.walk.files).map(file=>[file,config.walk])];
  for(const [file,spec] of entries){
    const png=readFileSync(new URL(`./assets/${file}`,import.meta.url));
    assert.equal(png.toString('ascii',1,4),'PNG');
    assert.equal(png.readUInt32BE(16),spec.frameWidth*spec.columns,file);
    assert.equal(png.readUInt32BE(20),spec.frameHeight*Math.ceil(spec.frames/spec.columns),file);
    assert.ok(spec.anchor[0]>=0&&spec.anchor[0]<spec.frameWidth);
    assert.ok(spec.anchor[1]>=0&&spec.anchor[1]<spec.frameHeight);
  }
});

test('the shared character standard accepts other identities and rejects incomplete sets',()=>{
  assert.equal(validateCharacterAnimations(config),config);
  const other=structuredClone(config);other.id='next-character';
  assert.equal(characterFrame({direction:'left',action:'sleep',actionTime:0},other).asset,'next-character-sleep');
  assert.equal(Object.keys(characterAssets(other)).length,13+(other.directionalRest?8:0));
  const missing=structuredClone(config);delete missing.sit;
  assert.throws(()=>validateCharacterAnimations(missing),/Missing character animation: sit/);
  const looping=structuredClone(config);looping.sitToStand.loop=true;
  assert.throws(()=>validateCharacterAnimations(looping),/loop behavior/);
  const truncated=structuredClone(config);truncated.wakeSequence[3].seconds=0.1;
  assert.throws(()=>validateCharacterAnimations(truncated),/truncates/);
});

test('sleep and sit loop; transitions clamp at their last frame and mirror consistently',()=>{
  for(const action of ['sleep','sit','sleepToSit','sitToStand']){
    const spec=config[action],duration=spec.frames/spec.fps;
    const frame=characterFrame({direction:'right',action,actionTime:duration},config);
    assert.equal(frame.clip,action);assert.equal(frame.mirror,true);
    assert.equal(frame.index,spec.loop?0:spec.frames-1);
    assert.equal(characterFrame({action,actionTime:-2},config).index,0);
    assert.equal(characterFrame({action,actionTime:duration*10},config).index,spec.loop?0:spec.frames-1);
  }
});

test('directional standing keeps its preserved sheet while movement uses refreshed walks',()=>{
  assert.ok(config.directionalRest);
  const assets=characterAssets(config);
  for(const direction of ['up','down','up-left','up-right','down-left','down-right']){
    const rest=characterFrame({direction,moving:false},config);
    assert.equal(rest.asset,`fenris-rest-${direction}`);
    assert.equal(rest.index,config.restFrame);
    assert.equal(assets[rest.asset],config.directionalRest.files[direction]);
    assert.deepEqual(rest.anchor,config.directionalRest.anchor);
    assert.equal(rest.scale,config.displayHeight/config.directionalRest.bodyHeight);
    assert.equal(characterFrame({direction,moving:true},config).asset,`fenris-walk-${direction}`);
  }
  const legacy=structuredClone(config);delete legacy.directionalRest;
  assert.equal(characterFrame({direction:'up',moving:false},legacy).asset,'fenris-walk-up');
  const incomplete=structuredClone(config);delete incomplete.directionalRest.files.up;
  assert.throws(()=>validateCharacterAnimations(incomplete),/all eight directions/);
});

test('awakening visits each state in order and hands over to standing at six seconds',()=>{
  for(const [time,action] of [[0,'sleep'],[1.99,'sleep'],[2,'sleepToSit'],[2.99,'sleepToSit'],[3,'sit'],[4.49,'sit'],[4.5,'sitToStand'],[5.99,'sitToStand']]){
    const stage=awakeningAt(time,config);assert.equal(stage.action,action);assert.equal(stage.complete,false);
  }
  assert.deepEqual(awakeningAt(6,config),{action:null,actionTime:0,complete:true});
  assert.equal(awakeningAt(-1,config).action,'sleep');
});
