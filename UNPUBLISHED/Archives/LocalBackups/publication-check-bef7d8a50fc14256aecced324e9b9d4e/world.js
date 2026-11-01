export const BOUNDS=27;
export const SPAWN={x:0,z:3};
export function heightAt(x,z){return .12*Math.sin(x*.25)*Math.cos(z*.3)+.07*Math.sin(z*.7+x*.16);}
export function riverX(z){return 17+Math.sin(z*.16)*1.4;}
export function walkable(x,z,colliders=[],radius=.45){
 if(!Number.isFinite(x)||!Number.isFinite(z)||Math.hypot(x,z)>BOUNDS-radius)return false;
 if(Math.abs(x-riverX(z))<2+radius&&Math.abs(z+9)>1.5-radius)return false;
 return !colliders.some(o=>Math.hypot(x-o.x,z-o.z)<o.r+radius);
}
export function moveWithCollision(p,dx,dz,colliders){
 // Small substeps prevent sprinting through trunks, even after a slow frame.
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.18));
 let x=p.x,z=p.z;
 for(let i=0;i<steps;i++){
  const nx=x+dx/steps,nz=z+dz/steps;
  if(walkable(nx,nz,colliders)){x=nx;z=nz;}
  else if(walkable(nx,z,colliders))x=nx;
  else if(walkable(x,nz,colliders))z=nz;
 }
 return {x,z};
}
export function findPath(start,end,colliders){
 if(!walkable(end.x,end.z,colliders))return [];
 const cell=1, key=(x,z)=>x+','+z, sx=Math.round(start.x),sz=Math.round(start.z),ex=Math.round(end.x),ez=Math.round(end.z);
 const startKey=key(sx,sz),open=[{x:sx,z:sz,g:0,f:0}],cost=new Map([[startKey,0]]),came=new Map(),closed=new Set();
 let result=null;
 for(let i=0;open.length&&i<5000;i++){
  open.sort((a,b)=>a.f-b.f);const p=open.shift(),pk=key(p.x,p.z);if(closed.has(pk))continue;closed.add(pk);
  if(p.x===ex&&p.z===ez){result=pk;break;}
  for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
   const x=p.x+dx*cell,z=p.z+dz*cell,k=key(x,z);if(closed.has(k)||!walkable(x,z,colliders,.62))continue;
   if(dx&&dz&&(!walkable(p.x+dx,p.z,colliders,.62)||!walkable(p.x,p.z+dz,colliders,.62)))continue;
   const g=p.g+Math.hypot(dx,dz);if(g>=(cost.get(k)??Infinity))continue;cost.set(k,g);came.set(k,pk);open.push({x,z,g,f:g+Math.hypot(ex-x,ez-z)});
  }
 }
 if(!result)return [];
 const path=[end];while(result!==startKey){const [x,z]=result.split(',').map(Number);path.push({x,z});result=came.get(result);if(!result)return [];}
 return path.reverse();
}
