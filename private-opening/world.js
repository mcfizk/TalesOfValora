import {createVillageLayout,inVillage} from './village-layout.js';
export const CHUNK_SIZE=384;
export const SPAWN={x:600,y:660};
export const POINTS=[
  {id:'embers',type:'embers',x:654,y:614,label:'Dying embers'},
  {id:'water',type:'water',x:815,y:530,label:'Running water'},
  {id:'trail',type:'trail',x:710,y:390,label:'An opening in the trees'}
];
export const riverX=y=>875+Math.sin(y/90)*15+Math.sin(y/47)*6;
export const riverCenter=(x,y)=>riverX(y)+Math.round((x-riverX(y))/1800)*1800;
export const waterDistance=(x,y)=>Math.abs(x-riverCenter(x,y));
export const inWater=(x,y)=>waterDistance(x,y)<22;
export const movementScale=(x,y)=>inWater(x,y)?.3:1;
export const trailDistance=(x,y)=>Math.abs(x-(600+Math.sin((660-y)/460)*160+Math.sin((660-y)/1300)*90));
export function random(seed=1468){return()=>{seed|=0;seed=seed+0x6d2b79f5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
export function hash(x,y,seed=1468){let n=Math.imul(x,374761393)^Math.imul(y,668265263)^seed;n=Math.imul(n^(n>>>13),1274126177);return((n^(n>>>16))>>>0)/4294967296;}
function noise(x,y,seed){const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy);const a=hash(ix,iy,seed)*(1-u)+hash(ix+1,iy,seed)*u,b=hash(ix,iy+1,seed)*(1-u)+hash(ix+1,iy+1,seed)*u;return a*(1-v)+b*v;}
export function terrainAt(x,y,seed=1468){
  const n=noise(x/650,y/650,seed),clearing=noise(x/280,y/280,seed+771);
  if(clearing>.7)return 'clearing';
  return n<.32?'rocky':n>.64?'fern':'grove';
}
const openingClear=(x,y)=>Math.hypot((x-SPAWN.x)/157,(y-SPAWN.y)/115)<1;
const nearOpeningPoint=(x,y,r)=>POINTS.some(p=>Math.hypot(x-p.x,y-p.y)<r);

// Coordinates and seed determine each chunk independently of visit order.
export function generateChunk(cx,cy,seed=1468){
  const x=cx*CHUNK_SIZE,y=cy*CHUNK_SIZE,rng=random(Math.floor(hash(cx,cy,seed)*4294967296));
  const trees=[],details=[],points=[];
  for(let gy=0;gy<8;gy++)for(let gx=0;gx<8;gx++){
    const tx=x+gx*48+12+rng()*24,ty=y+gy*48+12+rng()*24,biome=terrainAt(tx,ty,seed);
    const density={grove:.72,fern:.5,rocky:.32,clearing:.08}[biome];
    if(inVillage(tx,ty,seed)||rng()>density||openingClear(tx,ty)||trailDistance(tx,ty)<42||waterDistance(tx,ty)<54||nearOpeningPoint(tx,ty,48))continue;
    trees.push({x:Math.round(tx),y:Math.round(ty),kind:['tree-oak','tree-elder','tree-young'][Math.floor(rng()*3)],scale:.6+rng()*.3,flip:rng()>.5,r:10});
  }
  for(let i=0;i<46;i++){
    const dx=Math.round(x+16+rng()*(CHUNK_SIZE-32)),dy=Math.round(y+16+rng()*(CHUNK_SIZE-32)),biome=terrainAt(dx,dy,seed);
    if(inVillage(dx,dy,seed)||waterDistance(dx,dy)<34||trailDistance(dx,dy)<21||openingClear(dx,dy)||nearOpeningPoint(dx,dy,35))continue;
    const kinds=biome==='rocky'?['rock-0','rock-1','rock-2','rock-3','stump']:biome==='fern'?['fern','fern','shrub','flowers']:['fern','shrub','flowers','stump'];
    details.push({x:dx,y:dy,kind:kinds[Math.floor(rng()*kinds.length)],scale:rng()>.6?1:.75,flip:rng()>.5});
  }
  // Environmental discoveries are attached to visible objects.
  for(const d of details){
    if(points.length>=2)break;
    if(trees.some(t=>Math.hypot(t.x-d.x,t.y-d.y)<65)||points.some(p=>Math.hypot(p.x-d.x,p.y-d.y)<110))continue;
    const type=d.kind.startsWith('rock')?'stone':d.kind==='stump'?'stump':d.kind==='flowers'?'flowers':'fern';
    points.push({id:`${cx}:${cy}:${points.length}`,type,x:d.x,y:d.y,label:type});
  }
  return{key:`${cx}:${cy}`,cx,cy,x,y,trees,details,points};
}
export function makeWorld(seed=1468){
  const village=createVillageLayout(seed);const chunks=new Map();let region='',trees=[],details=[],points=[],colliders=[];
  const world={seed,chunks,village,get trees(){return trees;},get details(){return details;},get points(){return points;},get colliders(){return colliders;},
    update(x,y,radius=800){
      const minX=Math.floor((x-radius)/CHUNK_SIZE),maxX=Math.floor((x+radius)/CHUNK_SIZE),minY=Math.floor((y-radius)/CHUNK_SIZE),maxY=Math.floor((y+radius)/CHUNK_SIZE),next=`${minX}:${maxX}:${minY}:${maxY}`;
      if(next===region)return;region=next;
      for(const [key,c]of chunks)if(c.cx<minX||c.cx>maxX||c.cy<minY||c.cy>maxY)chunks.delete(key);
      for(let cy=minY;cy<=maxY;cy++)for(let cx=minX;cx<=maxX;cx++){const key=`${cx}:${cy}`;if(!chunks.has(key))chunks.set(key,generateChunk(cx,cy,seed));}
      const active=[...chunks.values()];trees=active.flatMap(c=>c.trees);details=active.flatMap(c=>c.details);
      points=[...POINTS.filter(p=>p.x>=minX*CHUNK_SIZE&&p.x<(maxX+1)*CHUNK_SIZE&&p.y>=minY*CHUNK_SIZE&&p.y<(maxY+1)*CHUNK_SIZE),...active.flatMap(c=>c.points)];
      points.push(...village.points.filter(p=>Math.abs(p.x-x)<radius+200&&Math.abs(p.y-y)<radius+200));
      colliders=[...trees.map(t=>({x:t.x,y:t.y-7,r:t.r})),...village.colliders];
      if(Math.abs(x-654)<radius+100&&Math.abs(y-614)<radius+100)colliders.push({x:654,y:614,r:10});
    }
  };world.update(SPAWN.x,SPAWN.y);return world;
}
export function walkable(x,y,colliders=[],r=8){
  return Number.isFinite(x)&&Number.isFinite(y)&&!colliders.some(c=>c.w!==undefined ? x>c.x-r&&x<c.x+c.w+r&&y>c.y-r&&y<c.y+c.h+r : Math.hypot(x-c.x,y-c.y)<c.r+r);
}
export function move(p,dx,dy,colliders=[]){
  const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/3));let{x,y}=p;
  for(let i=0;i<steps;i++){
    const scale=movementScale(x,y),nx=x+dx/steps*scale,ny=y+dy/steps*scale;
    if(walkable(nx,ny,colliders)){x=nx;y=ny;}
    else if(walkable(nx,y,colliders))x=nx;
    else if(walkable(x,ny,colliders))y=ny;
  }return{x,y};
}

export function findPath(start,end,colliders) {
  if(!walkable(end.x,end.y,colliders))return [];
  const cell=16,key=(x,y)=>`${x},${y}`;
  const nearest=p=>{
    const candidates=[];const bx=Math.round(p.x/cell),by=Math.round(p.y/cell);
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++)if(walkable((bx+dx)*cell,(by+dy)*cell,colliders,9))candidates.push({x:bx+dx,y:by+dy});
    candidates.sort((a,b)=>Math.hypot(a.x*cell-p.x,a.y*cell-p.y)-Math.hypot(b.x*cell-p.x,b.y*cell-p.y));return candidates[0];
  };
  const s=nearest(start),e=nearest(end);if(!s||!e)return [];
  const sk=key(s.x,s.y),ek=key(e.x,e.y),open=[{...s,g:0,f:0}],cost=new Map([[sk,0]]),came=new Map(),closed=new Set();
  while(open.length&&closed.size<6500){
    open.sort((a,b)=>a.f-b.f);const p=open.shift(),pk=key(p.x,p.y);if(closed.has(pk))continue;
    if(pk===ek){const result=[end];let k=pk;while(k!==sk){const [x,y]=k.split(',').map(Number);result.push({x:x*cell,y:y*cell});k=came.get(k);}return result.reverse();}
    closed.add(pk);
    for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
      const x=p.x+dx,y=p.y+dy,k=key(x,y);
      if(closed.has(k)||!walkable(x*cell,y*cell,colliders,9))continue;
      if(dx&&dy&&(!walkable((p.x+dx)*cell,p.y*cell,colliders,9)||!walkable(p.x*cell,(p.y+dy)*cell,colliders,9)))continue;
      const g=p.g+Math.hypot(dx,dy)/movementScale(x*cell,y*cell);if(g>=(cost.get(k)??Infinity))continue;
      cost.set(k,g);came.set(k,pk);open.push({x,y,g,f:g+Math.hypot(x-e.x,y-e.y)});
    }
  }
  return [];
}
