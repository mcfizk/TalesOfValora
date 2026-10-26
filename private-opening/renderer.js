import {inVillage,villageRoad} from './village-layout.js';
import {makeHumanArt,drawPerson} from './village-people.js';
import {drawBuilding,drawVillageGround,drawRoom} from './village-renderer.js';
import {CHUNK_SIZE,riverCenter,inWater,trailDistance,terrainAt,hash,random} from './world.js';
import {fenrisFrame} from './fenris-animation.js';
import {characterAssets,validateCharacterAnimations} from './character-animation.js';

export async function loadArt() {
  const response=await fetch('assets/manifest.json');if(!response.ok)throw new Error('The local art manifest could not be loaded.');
  const manifest=await response.json();
  const names=['ground','path','tree-oak','tree-elder','tree-young','stump','fern','shrub','flowers',...Array.from({length:4},(_,i)=>`rock-${i}`),...Array.from({length:8},(_,i)=>`water-${i+1}`),...Array.from({length:manifest.fireFrames},(_,i)=>`fire-${i}`)];
  const files=Object.fromEntries(names.map(name=>[name,`${name}.png`]));
  Object.assign(files,characterAssets(validateCharacterAnimations(manifest.fenrisAnimations)));
  files['village-buildings']='village/buildings.png';
  const art={manifest};
  await Promise.all(Object.entries(files).map(async ([name,file])=>{const img=new Image();img.src=`assets/${file}`;await img.decode();art[name]=img;}));
  makeHumanArt(art);return art;
}
export function createRenderer(canvas,art,world) {
  const ctx=canvas.getContext('2d',{alpha:false});let width=640,height=360,zoom=1;
  const camera={x:520,y:620};
  const groundCache=new Map();
  const waterPatterns=Array.from({length:8},(_,i)=>ctx.createPattern(art[`water-${i+1}`],'repeat'));
  const rng=random(317);
  const leaves=Array.from({length:45},()=>({x:rng(),y:rng(),s:rng()*10+4,phase:rng()*6}));
  const glow=Array.from({length:30},()=>({x:rng(),y:rng(),phase:rng()*9}));
  function groundTile(chunk){
    if(groundCache.has(chunk.key))return groundCache.get(chunk.key);
    const tile=document.createElement('canvas');tile.width=tile.height=CHUNK_SIZE;
    const g=tile.getContext('2d');g.imageSmoothingEnabled=false;g.translate(-chunk.x,-chunk.y);
    g.fillStyle=g.createPattern(art.ground,'repeat');g.fillRect(chunk.x,chunk.y,CHUNK_SIZE,CHUNK_SIZE);
    for(let y=chunk.y;y<chunk.y+CHUNK_SIZE;y+=8)for(let x=chunk.x;x<chunk.x+CHUNK_SIZE;x+=8){
      const biome=terrainAt(x,y,world.seed),d=trailDistance(x,y),clearing=Math.hypot((x-600)/106,(y-655)/77),n=hash(x,y,world.seed);
      g.fillStyle={grove:'#17311b38',fern:'#24433848',rocky:'#5e625341',clearing:'#76764c38'}[biome];g.fillRect(x,y,8,8);
      const edge=19+(Math.sin(x*.15)+Math.cos(y*.13))*3;
      if(d<edge||clearing<1){g.globalAlpha=d<edge-5||clearing<.8?.8:.35;g.fillStyle=['#675b3d','#625739','#5c5237','#6b5d3e'][Math.floor(n*4)];g.fillRect(x,y,8,8);g.globalAlpha=1;}
      if(inVillage(x,y,world.seed)){g.fillStyle=villageRoad(x,y,world.seed)?['#776548','#6b5c43','#726247'][Math.floor(n*3)]:'#444c31';g.fillRect(x,y,8,8);}
      if(n>.7){g.fillStyle=['#77794b66','#ada26444','#10291a55','#9a783d66'][Math.floor(n*9)%4];g.fillRect(x+Math.floor(n*7),y+3,2,1);}
    }
    for(let y=chunk.y;y<chunk.y+CHUNK_SIZE;y+=2){const x=riverCenter(chunk.x+CHUNK_SIZE/2,y);g.fillStyle='#26342c';g.fillRect(x-31,y,62,2);g.fillStyle='#5f6450';g.fillRect(x-25,y,50,2);}
    g.fillStyle='#32352a';g.beginPath();g.ellipse(654,614,24,15,0,0,Math.PI*2);g.fill();
    groundCache.set(chunk.key,tile);return tile;
  }
  function landscape(state){
    const left=Math.floor(camera.x-width/2),top=Math.floor(camera.y-height/2),right=left+width,bottom=top+height;
    for(const key of groundCache.keys())if(!world.chunks.has(key))groundCache.delete(key);
    for(const c of world.chunks.values())if(c.x<right&&c.x+CHUNK_SIZE>left&&c.y<bottom&&c.y+CHUNK_SIZE>top)ctx.drawImage(groundTile(c),c.x,c.y);
    // Continuous world-coordinate water masks match the movement slowdown.
    const water=new Path2D();
    for(let y=Math.floor(top/2)*2;y<bottom;y+=2){
      const first=riverCenter(left,y);
      for(let x=first-1800;x<right+1800;x+=1800)if(x+22>left&&x-22<right)water.rect(x-22,y,44,2);
    }
    ctx.save();ctx.clip(water);ctx.fillStyle=waterPatterns[state.reduced?0:Math.floor(state.time*5)%8];ctx.fillRect(left,top,width,height);ctx.fillStyle='#183d4b88';ctx.fillRect(left,top,width,height);ctx.restore();
  }
  function resize(){height=Math.round((matchMedia('(pointer:coarse)').matches?440:360)/zoom);width=Math.round(height*innerWidth/innerHeight);canvas.width=width;canvas.height=height;ctx.imageSmoothingEnabled=false;}
  resize();
  function toScreen(x,y){return {x:(x-Math.round(camera.x)+width/2)/width*innerWidth,y:(y-Math.round(camera.y)+height/2)/height*innerHeight};}
  function toWorld(clientX,clientY){const rect=canvas.getBoundingClientRect();return {x:(clientX-rect.left)/rect.width*width+Math.round(camera.x)-width/2,y:(clientY-rect.top)/rect.height*height+Math.round(camera.y)-height/2};}
  function sprite(item,player){
    const im=art[item.kind],w=Math.round(im.width*item.scale),h=Math.round(im.height*item.scale);
    if(item.x+w/2<camera.x-width/2||item.x-w/2>camera.x+width/2||item.y<camera.y-height/2||item.y-h>camera.y+height/2)return;
    ctx.save();
    if(item.kind.startsWith('tree')&&Math.abs(player.x-item.x)<w*.42&&player.y<item.y-5&&player.y>item.y-h+20)ctx.globalAlpha=.32;
    ctx.translate(item.x,item.y);if(item.flip)ctx.scale(-1,1);
    ctx.drawImage(im,-Math.round(w/2),-h,w,h);ctx.restore();
  }
  function playerSprite(state){
    const p=state.player,frame=fenrisFrame(p,art.manifest.fenrisAnimations),im=art[frame.asset];
    ctx.fillStyle='#04141166';ctx.beginPath();ctx.ellipse(p.x,p.y+1,14,5,0,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.translate(Math.round(p.x),Math.round(p.y));
    if(frame.mirror)ctx.scale(-1,1);
    // The source animation already contains the gait and body bob. Anchor the
    // planted feet to the collision position instead of shifting the whole image.
    ctx.drawImage(im,frame.sx,frame.sy,frame.width,frame.height,
      -frame.anchor[0]*frame.scale,-frame.anchor[1]*frame.scale,
      frame.width*frame.scale,frame.height*frame.scale);
    ctx.restore();
    if(inWater(p.x,p.y)){
      ctx.strokeStyle='#a1c6c355';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(p.x,p.y,16,4,0,0,Math.PI*2);ctx.stroke();
    }
  }
  function fire(time,reduced){
    ctx.fillStyle='#1b2420';ctx.fillRect(643,611,24,5);ctx.fillRect(649,605,7,13);ctx.fillStyle='#68523a';ctx.fillRect(644,611,20,2);ctx.fillStyle='#c17436';ctx.fillRect(651,612,4,2);
    const n=reduced?4:Math.floor(time*13)%art.manifest.fireFrames;const im=art[`fire-${n}`];ctx.globalAlpha=.8;ctx.drawImage(im,645,592,18,24);ctx.globalAlpha=1;
    if(!reduced)for(let i=0;i<7;i++){const a=(time*.35+i*.14)%1;ctx.globalAlpha=(1-a)*.6;ctx.fillStyle=i%2?'#dc9b45':'#f8cf77';ctx.fillRect(Math.round(652+Math.sin(i*8+time)*a*13),Math.round(597-a*35),1,1);}ctx.globalAlpha=1;
  }
  function render(state,dt){
    const target=state.interior?{x:120,y:110}:state.phase==='title'?{x:520,y:620}:{x:state.player.x,y:state.player.y-28};
    camera.x+=(target.x-camera.x)*Math.min(1,dt*(state.reduced?100:4));camera.y+=(target.y-camera.y)*Math.min(1,dt*(state.reduced?100:4));
    if(!state.interior)world.update(state.player.x,state.player.y,Math.max(width,height)/2+300);
    ctx.fillStyle='#0c1b19';ctx.fillRect(0,0,width,height);ctx.save();ctx.translate(Math.round(width/2-camera.x),Math.round(height/2-camera.y));
    if(state.interior)drawRoom(ctx,state.interior);
    else {landscape(state);drawVillageGround(ctx,world.village,state);for(const d of world.details)sprite(d,state.player);}
    if(state.destination){const pulse=state.reduced?0:Math.sin(state.time*5)*2;ctx.strokeStyle='#d7c38a88';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(state.destination.x,state.destination.y,8+pulse,4+pulse*.5,0,0,Math.PI*2);ctx.stroke();}
    const sorted=[...(state.interior?[]:[...world.trees,...world.village.buildings,{x:654,y:614,fire:true}]),...(state.people||[]),{x:state.player.x,y:state.player.y,player:true}].sort((a,b)=>a.y-b.y);
    for(const item of sorted){if(item.player)playerSprite(state);else if(item.fire)fire(state.time,state.reduced);else if(item.building)drawBuilding(ctx,item,art,state.player);else if(item.actorId)drawPerson(ctx,item,art);else sprite(item,state.player);}
    if(state.phase==='explore')for(const point of state.interactionPoints||world.points){
      const d=Math.hypot(state.player.x-point.x,state.player.y-point.y);if(d>180)continue;
      const visited=state.found.has(point.id),pulse=state.reduced?1:.9+Math.sin(state.time*2)*.1;
      const y=point.y-26+(state.reduced?0:Math.sin(state.time*1.7)*1.5);
      ctx.save();ctx.globalAlpha=(visited?.3:.65)*pulse*Math.min(1,(180-d)/45);
      const halo=ctx.createRadialGradient(point.x,y,0,point.x,y,12);halo.addColorStop(0,'#dedaa660');halo.addColorStop(1,'#dedaa600');ctx.fillStyle=halo;ctx.fillRect(point.x-12,y-12,24,24);
      ctx.strokeStyle='#dedaa6aa';ctx.lineWidth=.7;ctx.beginPath();ctx.arc(point.x,y,2.7,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#f4eac966';ctx.fillRect(point.x-1,y-1,1,1);
      if(d<48){const light=ctx.createRadialGradient(point.x,point.y-6,1,point.x,point.y-6,24);light.addColorStop(0,'#e8d69c25');light.addColorStop(1,'#e8d69c00');ctx.fillStyle=light;ctx.fillRect(point.x-24,point.y-30,48,48);}
      ctx.restore();
    }
    if(!state.reduced&&!state.interior)for(const leaf of leaves){const y=camera.y-height/2+(leaf.y*height+state.time*leaf.s*.5)%height,x=camera.x-width/2+leaf.x*width+Math.sin(state.time*.4+leaf.phase)*20;ctx.fillStyle='#a7a36444';ctx.fillRect(Math.round(x),Math.round(y),2,1);}
    ctx.restore();
    // Deep dusk under the canopy; the local ember glow remains readable.
    const daylight=state.interior?1.8:state.clock?.daylightStrength||0;
    ctx.fillStyle=`rgba(3,14,26,${.44-daylight*.18})`;ctx.fillRect(0,0,width,height);
    const f=toScreen(654,604);const fx=f.x/innerWidth*width,fy=f.y/innerHeight*height;
    const radius=86+(state.reduced?0:Math.sin(state.time*7)*2);
    const light=ctx.createRadialGradient(fx,fy,3,fx,fy,radius);light.addColorStop(0,'#eeac453e');light.addColorStop(.4,'#c795311b');light.addColorStop(1,'#ab8b2a00');ctx.fillStyle=light;ctx.fillRect(fx-radius,fy-radius,radius*2,radius*2);
    ctx.save();ctx.globalCompositeOperation='screen';
    const shaft=ctx.createLinearGradient(0,0,width*.8,height);shaft.addColorStop(0,'#9fbd9c06');shaft.addColorStop(.7,'#9fbd9c01');shaft.addColorStop(1,'#9fbd9c00');ctx.fillStyle=shaft;
    ctx.beginPath();ctx.moveTo(width*.3,-30);ctx.lineTo(width*.5,-30);ctx.lineTo(width*.83,height);ctx.lineTo(width*.7,height);ctx.fill();ctx.restore();
    if(!state.reduced&&!state.interior){
      ctx.save();ctx.translate(Math.round(width/2-camera.x),Math.round(height/2-camera.y));
      for(const fly of glow){const a=Math.max(0,Math.sin(state.time*.9+fly.phase))*.65;ctx.fillStyle=`rgba(211,224,146,${a})`;ctx.fillRect(Math.round(camera.x-width/2+fly.x*width+Math.sin(state.time*.6+fly.phase)*7),Math.round(camera.y-height/2+fly.y*height+Math.cos(state.time*.4+fly.phase)*5),1,1);}ctx.restore();
    }
  }
  return {render,resize,toScreen,toWorld,resetCamera(x,y){camera.x=x;camera.y=y;},get loadingRadius(){return Math.max(width,height)/2+300;},setZoom(delta){zoom=Math.max(.8,Math.min(1.6,zoom+delta));resize();},snapshot:()=>({width,height,zoom,camera:{...camera},groundTiles:groundCache.size})};
}
