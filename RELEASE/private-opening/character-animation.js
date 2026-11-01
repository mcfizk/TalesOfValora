export const DIRECTIONS=Object.freeze(['right','down-right','down','down-left','left','up-left','up','up-right']);
export const CHARACTER_ACTIONS=Object.freeze(['idle','walk','sleep','sit','sleepToSit','sitToStand']);
const REST_ACTIONS=new Set(['sleep','sit','sleepToSit','sitToStand']);

export function movementDirection(dx,dy,previous='left') {
  if(Math.hypot(dx,dy)<0.01)return previous;
  return DIRECTIONS[(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8];
}

// Shared contract: dimensions can differ, but anchors/bodyHeight keep physical scale constant.
export function validateCharacterAnimations(config) {
  if(config.formatVersion!==1||typeof config.id!=='string'||!config.id)throw new Error('Character animation identity/version is missing.');
  if(!(config.displayHeight>0))throw new Error('Character display height must be positive.');
  for(const action of [...CHARACTER_ACTIONS,...(config.directionalRest?['directionalRest']:[])]){
    const spec=config[action];if(!spec)throw new Error(`Missing character animation: ${action}`);
    for(const key of ['frameWidth','frameHeight','columns','frames'])if(!Number.isInteger(spec[key])||spec[key]<1)throw new Error(`Invalid ${action}.${key}`);
    if(!(spec.fps>0)||!(spec.bodyHeight>0)||typeof spec.loop!=='boolean')throw new Error(`Invalid ${action} playback/scale`);
    if(!Array.isArray(spec.anchor)||spec.anchor.length!==2||spec.anchor.some(v=>!Number.isFinite(v))||spec.anchor[0]<0||spec.anchor[0]>=spec.frameWidth||spec.anchor[1]<0||spec.anchor[1]>=spec.frameHeight)throw new Error(`Invalid ${action} ground anchor`);
    if(action==='walk'||action==='directionalRest'){
      if(!DIRECTIONS.every(direction=>typeof spec.files?.[direction]==='string'))throw new Error('Walking needs all eight directions.');
    }else if(typeof spec.file!=='string')throw new Error(`Missing ${action} sheet`);
    if(spec.loop!==!['sleepToSit','sitToStand'].includes(action))throw new Error(`Incorrect loop behavior for ${action}`);
  }
  if(!Number.isInteger(config.restFrame)||config.restFrame<0||config.restFrame>=(config.directionalRest||config.walk).frames)throw new Error('Invalid directional rest frame.');
  const sequence=config.wakeSequence;
  if(!Array.isArray(sequence)||sequence.map(s=>s.clip).join(',')!=='sleep,sleepToSit,sit,sitToStand')throw new Error('Awakening must follow sleep > sit > stand.');
  for(const stage of sequence)if(!(stage.seconds>0)||(!config[stage.clip].loop&&stage.seconds<config[stage.clip].frames/config[stage.clip].fps))throw new Error(`Awakening truncates ${stage.clip}`);
  return config;
}

export function characterAssets(config) {
  const files={};
  for(const action of CHARACTER_ACTIONS){
    if(action==='walk')for(const [direction,file] of Object.entries(config.walk.files))files[`${config.id}-walk-${direction}`]=file;
    else files[`${config.id}-${action}`]=config[action].file;
  }
  if(config.directionalRest)for(const [direction,file] of Object.entries(config.directionalRest.files))files[`${config.id}-rest-${direction}`]=file;
  return files;
}

export function awakeningAt(seconds,config) {
  let time=Math.max(0,seconds);
  for(const stage of config.wakeSequence){
    if(time<stage.seconds)return {action:stage.clip,actionTime:time,complete:false};
    time-=stage.seconds;
  }
  return {action:null,actionTime:0,complete:true};
}

export function characterFrame(player,config) {
  let direction=player.direction||'left',clip,spec,index,mirror=false;
  if(REST_ACTIONS.has(player.action)){
    clip=player.action;spec=config[clip];
    direction=direction.includes('right')?'right':'left';
    mirror=direction==='right'&&spec.mirrorRight===true;
    const raw=Math.floor(Math.max(0,player.actionTime||0)*spec.fps);
    index=spec.loop?raw%spec.frames:Math.min(raw,spec.frames-1);
  }else{
    if(player.moving&&config.walk.directionMode==='horizontal')direction=direction.includes('right')?'right':direction.includes('left')?'left':player.walkFacing||'left';
    const sideIdle=!player.moving&&(direction==='left'||direction==='right');
    spec=sideIdle?config.idle:!player.moving&&config.directionalRest?config.directionalRest:config.walk;
    clip=player.moving?'walk':sideIdle?'idle':'rest';
    index=clip==='rest'?config.restFrame:Math.floor(Math.max(0,player.animation||0)*spec.fps)%spec.frames;
    mirror=sideIdle&&direction==='right';
  }
  return {clip,direction,index,fps:clip==='rest'?0:spec.fps,
    asset:clip==='rest'&&config.directionalRest?`${config.id}-rest-${direction}`:clip==='walk'||clip==='rest'?`${config.id}-walk-${direction}`:`${config.id}-${clip}`,
    mirror,sx:(index%spec.columns)*spec.frameWidth,sy:Math.floor(index/spec.columns)*spec.frameHeight,
    width:spec.frameWidth,height:spec.frameHeight,anchor:spec.anchor,scale:config.displayHeight/spec.bodyHeight};
}
