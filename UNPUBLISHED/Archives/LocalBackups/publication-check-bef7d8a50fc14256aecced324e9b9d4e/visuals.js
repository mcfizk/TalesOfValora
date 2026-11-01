import * as T from './vendor/three.module.js';
export async function loadVisualAssets(){
 const loader=new T.TextureLoader();const [fur,ground,bark]=await Promise.all(['fur','forest-floor','bark'].map(name=>loader.loadAsync(`./assets/${name}.png`)));
 for(const texture of [fur,ground,bark]){texture.colorSpace=T.SRGBColorSpace;texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=4;}
 fur.repeat.set(3,3);ground.repeat.set(30,30);bark.repeat.set(2,3);
 const response=await fetch('./assets/fenris-sculpt.json');if(!response.ok)throw new Error('Character model failed to load');const model=await response.json();return {fur,ground,bark,model};
}
export function loft(rings,segments=40){
 const p=[],uv=[],idx=[];
 for(let j=0;j<rings.length;j++){const [y,rx,rz,zoff=0]=rings[j];for(let i=0;i<=segments;i++){const a=i/segments*Math.PI*2;p.push(Math.sin(a)*rx,y,Math.cos(a)*rz+zoff);uv.push(i/segments,j/(rings.length-1));}}
 for(let j=0;j<rings.length-1;j++)for(let i=0;i<segments;i++){const a=j*(segments+1)+i,b=a+segments+1;idx.push(a,a+1,b,a+1,b+1,b);}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;
}
export function curveTube(points,radius=.02,segments=24,taper=false){
 const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p))),g=new T.TubeGeometry(curve,segments,radius,7,false);
 if(taper){const pos=g.attributes.position;for(let i=0;i<=segments;i++){const center=curve.getPointAt(i/segments),k=1-i/segments*.95;for(let j=0;j<8;j++){const n=i*8+j;const v=new T.Vector3().fromBufferAttribute(pos,n).sub(center).multiplyScalar(k).add(center);pos.setXYZ(n,v.x,v.y,v.z);}}g.computeVertexNormals();}return g;
}
// Fine curved guard hairs follow the surface normal and gravity, in one mesh per region.
export function groom(geometry,count,length,material,seed=1){
 const g=geometry.index?geometry.toNonIndexed():geometry,p=g.attributes.position,n=g.attributes.normal;
 let rng=seed;const random=()=>{rng=(Math.imul(rng,1664525)+1013904223)>>>0;return rng/4294967296;};
 const areas=[],a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3();let total=0;
 for(let i=0;i<p.count;i+=3){a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1);c.fromBufferAttribute(p,i+2);total+=b.sub(a).cross(c.sub(a)).length()*.5;areas.push(total);}
 const pos=[],normals=[],colors=[],ids=[];const pale=new T.Color('#c6c9bf'),grey=new T.Color('#b3b8b1');
 for(let k=0;k<count;k++){let value=random()*total,lo=0,hi=areas.length-1;while(lo<hi){const mid=(lo+hi)>>1;if(areas[mid]<value)lo=mid+1;else hi=mid;}const i=lo*3;let u=random(),v=random();if(u+v>1){u=1-u;v=1-v;}const w=1-u-v;
  const origin=new T.Vector3().fromBufferAttribute(p,i).multiplyScalar(w).addScaledVector(b.fromBufferAttribute(p,i+1),u).addScaledVector(c.fromBufferAttribute(p,i+2),v);
  const normal=new T.Vector3().fromBufferAttribute(n,i).multiplyScalar(w).addScaledVector(b.fromBufferAttribute(n,i+1),u).addScaledVector(c.fromBufferAttribute(n,i+2),v).normalize();
  const down=new T.Vector3(0,-1,-.12).addScaledVector(normal,normal.y+.12*normal.z).normalize();if(down.lengthSq()<.1)down.set(1,0,0);const side=new T.Vector3().crossVectors(normal,down).normalize();const len=length*(.4+random()*.5),width=.0015+random()*.0025;const col=pale.clone().lerp(grey,random()*.3),base=pos.length/3;
  for(let j=0;j<3;j++){const t=j/2,center=origin.clone().addScaledVector(normal,.004+len*(.45*t-.15*t*t)).addScaledVector(down,len*t),wide=width*(1-t)+.0003;for(const s of [-1,1]){const v=center.clone().addScaledVector(side,s*wide);pos.push(v.x,v.y,v.z);normals.push(normal.x,normal.y,normal.z);colors.push(col.r,col.g,col.b);}}
  ids.push(base,base+2,base+1,base+1,base+2,base+3,base+2,base+4,base+3,base+3,base+4,base+5);
 }
 const result=new T.BufferGeometry();result.setAttribute('position',new T.Float32BufferAttribute(pos,3));result.setAttribute('normal',new T.Float32BufferAttribute(normals,3));result.setAttribute('color',new T.Float32BufferAttribute(colors,3));result.setIndex(ids);const mesh=new T.Mesh(result,material);mesh.castShadow=false;mesh.receiveShadow=true;return mesh;
}
export function consolidate(group){
 for(const child of group.children)if(child.isGroup)consolidate(child);
 const groups=new Map();for(const child of group.children){if(!child.isMesh)continue;const key=child.material.uuid+':'+child.castShadow;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(child);}
 for(const meshes of groups.values()){if(meshes.length<2)continue;const arrays={},attributes=Object.keys(meshes[0].geometry.attributes);for(const name of attributes)arrays[name]=[];let valid=true;
  for(const mesh of meshes){mesh.updateMatrix();const geometry=(mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone()).applyMatrix4(mesh.matrix);for(const name of attributes){if(!geometry.attributes[name]){valid=false;break;}arrays[name].push(...geometry.attributes[name].array);}if(!valid)break;}
  if(!valid)continue;const geo=new T.BufferGeometry();for(const name of attributes)geo.setAttribute(name,new T.Float32BufferAttribute(arrays[name],meshes[0].geometry.attributes[name].itemSize));const result=new T.Mesh(geo,meshes[0].material);result.castShadow=meshes[0].castShadow;result.receiveShadow=true;group.add(result);for(const mesh of meshes)group.remove(mesh);
 }
}
