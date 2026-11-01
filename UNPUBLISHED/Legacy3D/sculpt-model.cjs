// Offline implicit-surface sculpt. Smoothly blended volumes create a single continuous skin.
// The checked-in JSON is the runtime mesh; no remeshing runs in the player's browser.
const fs=require('node:fs');
const volumes=[];
function ell(x,y,z,rx,ry,rz,k=.065){volumes.push({x,y,z,rx,ry,rz,k,min:Math.min(rx,ry,rz)});}
ell(0,1.88,-.025,.39,.32,.255);ell(0,2.20,-.005,.355,.39,.235);ell(0,2.53,-.035,.44,.39,.27);ell(0,2.83,-.035,.55,.34,.28);ell(0,3.04,-.045,.51,.17,.24);ell(0,3.24,-.01,.28,.30,.235);ell(0,3.42,.025,.205,.23,.195);
for(const s of [-1,1]){
 ell(s*.265,2.86,.205,.29,.19,.135,.085);ell(s*.28,2.93,-.22,.28,.23,.12,.08);ell(s*.34,3.13,-.025,.27,.16,.22,.10);
 ell(s*.62,2.97,0,.23,.25,.225,.10);ell(s*.715,2.69,.015,.185,.32,.18,.10);ell(s*.72,2.70,.105,.145,.25,.10,.065);ell(s*.77,2.40,.005,.14,.15,.135);ell(s*.81,2.15,.045,.15,.28,.14);ell(s*.85,1.90,.07,.105,.18,.105);ell(s*.86,1.73,.085,.12,.18,.072);
 // Four fingers are separated; their roots blend into a broad, flat palm.
 for(let f=0;f<4;f++){const x=s*.86+(f-1.5)*.053,tip=1.475+Math.abs(f-1.5)*.027;ell(x,(1.69+tip)/2,.086,.025,(1.69-tip)/2+.018,.033,.013);}
 ell(s*.765,1.69,.112,.04,.115,.045,.025);
 ell(s*.225,1.72,-.035,.245,.32,.255,.08);ell(s*.24,1.42,.015,.22,.40,.215,.075);ell(s*.25,1.05,.065,.155,.16,.16);ell(s*.25,.78,-.025,.15,.28,.16);ell(s*.25,.49,-.07,.105,.25,.11);ell(s*.25,.27,-.005,.105,.17,.14);ell(s*.25,.145,.16,.18,.125,.275,.045);
 for(let toe=0;toe<4;toe++)ell(s*.25+(toe-1.5)*.082,.105,.365,.053,.077,.12,.017);
}
// Skull, cheek planes, nose bridge, and muzzle are one continuous mesh.
ell(0,3.65,-.005,.275,.285,.25,.065);ell(0,3.47,.095,.22,.155,.235,.065);ell(0,3.535,.31,.155,.115,.275,.045);ell(0,3.63,.235,.14,.12,.23,.05);ell(0,3.455,.325,.15,.075,.25,.035);
for(const s of [-1,1]){ell(s*.218,3.56,.025,.12,.17,.19,.06);ell(s*.165,3.745,.145,.115,.055,.10,.045);}
function field(x,y,z){let d=10;for(const a of volumes){const px=(x-a.x)/a.rx,py=(y-a.y)/a.ry,pz=(z-a.z)/a.rz;const v=(Math.sqrt(px*px+py*py+pz*pz)-1)*a.min;const h=Math.max(a.k-Math.abs(d-v),0)/a.k;d=Math.min(d,v)-h*h*a.k*.25;}return d;}
const step=.024,min=[-1.15,-.045,-.5],max=[1.15,4.01,.69],dims=max.map((v,i)=>Math.ceil((v-min[i])/step)+1),[nx,ny,nz]=dims;
const values=new Float32Array(nx*ny*nz),idx=(x,y,z)=>x+nx*(y+ny*z);let cursor=0;
for(let z=0;z<nz;z++)for(let y=0;y<ny;y++)for(let x=0;x<nx;x++)values[cursor++]=field(min[0]+x*step,min[1]+y*step,min[2]+z*step);
const pos=[],normal=[],uv=[],indices=[],edges=new Map();
function gradient(id){const x=id%nx,y=Math.floor(id/nx)%ny,z=Math.floor(id/(nx*ny));return [(values[idx(Math.min(nx-1,x+1),y,z)]-values[idx(Math.max(0,x-1),y,z)])/(2*step),(values[idx(x,Math.min(ny-1,y+1),z)]-values[idx(x,Math.max(0,y-1),z)])/(2*step),(values[idx(x,y,Math.min(nz-1,z+1))]-values[idx(x,y,Math.max(0,z-1))])/(2*step)];}
function vertex(a,b){const key=Math.min(a,b)+':'+Math.max(a,b);if(edges.has(key))return edges.get(key);const t=values[a]/(values[a]-values[b]),xyz=i=>[i%nx,Math.floor(i/nx)%ny,Math.floor(i/(nx*ny))],p=xyz(a),q=xyz(b),v=p.map((n,i)=>min[i]+(n+(q[i]-n)*t)*step),ga=gradient(a),gb=gradient(b),g=ga.map((n,i)=>n+(gb[i]-n)*t),len=Math.hypot(...g),id=pos.length/3;pos.push(...v);normal.push(...g.map(n=>n/len));uv.push(Math.atan2(v[0],v[2])/(Math.PI*2)+.5,v[1]*.6);edges.set(key,id);return id;}
function triangle(a,b,c){const ax=pos[b*3]-pos[a*3],ay=pos[b*3+1]-pos[a*3+1],az=pos[b*3+2]-pos[a*3+2],bx=pos[c*3]-pos[a*3],by=pos[c*3+1]-pos[a*3+1],bz=pos[c*3+2]-pos[a*3+2];if((ay*bz-az*by)*normal[a*3]+(az*bx-ax*bz)*normal[a*3+1]+(ax*by-ay*bx)*normal[a*3+2]<0)[b,c]=[c,b];indices.push(a,b,c);}
const tets=[[0,5,1,6],[0,1,2,6],[0,2,3,6],[0,3,7,6],[0,7,4,6],[0,4,5,6]];
for(let z=0;z<nz-1;z++)for(let y=0;y<ny-1;y++)for(let x=0;x<nx-1;x++){
 const corners=[idx(x,y,z),idx(x+1,y,z),idx(x+1,y+1,z),idx(x,y+1,z),idx(x,y,z+1),idx(x+1,y,z+1),idx(x+1,y+1,z+1),idx(x,y+1,z+1)];let inside=0;for(const i of corners)if(values[i]<0)inside++;if(!inside||inside===8)continue;
 for(const tet of tets){const ins=[],out=[];for(const c of tet)(values[corners[c]]<0?ins:out).push(corners[c]);if(ins.length===1)triangle(...out.map(i=>vertex(ins[0],i)));else if(ins.length===3)triangle(...ins.map(i=>vertex(out[0],i)));else if(ins.length===2){const a=vertex(ins[0],out[0]),b=vertex(ins[0],out[1]),c=vertex(ins[1],out[0]),d=vertex(ins[1],out[1]);triangle(a,b,c);triangle(b,d,c);}}
}
const bones=[{name:'hips',parent:-1,p:[0,1.85,0]},{name:'spine',parent:0,p:[0,2.2,0]},{name:'chest',parent:1,p:[0,2.9,0]},{name:'neck',parent:2,p:[0,3.26,0]},{name:'head',parent:3,p:[0,3.56,.02]}];
for(const s of [-1,1]){const o=bones.length;for(const b of [{name:'upperArm',parent:2,p:[s*.62,3.02,0]},{name:'forearm',parent:o,p:[s*.78,2.4,.015]},{name:'hand',parent:o+1,p:[s*.86,1.79,.07]},{name:'thigh',parent:0,p:[s*.235,1.85,0]},{name:'shin',parent:o+3,p:[s*.25,1.04,.065]},{name:'foot',parent:o+4,p:[s*.25,.31,-.04]}])bones.push({...b,name:b.name+(s<0?'L':'R')});}
function smooth(a,b,x){const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);}
const weights=[],skin=[];
function weightFor(x,y,z){const entries=[];const put=(i,w)=>{if(w>0)entries.push([i,w]);},blend=(a,b,t,m=1)=>{put(a,(1-t)*m);put(b,t*m);};
 const o=x<0?5:11,ax=Math.abs(x);
 if(y<1.95&&ax<.57){const hip=smooth(1.65,1.96,y);put(0,hip);const leg=1-hip;if(y>.95)blend(o+4,o+3,smooth(.91,1.16,y),leg);else blend(o+5,o+4,smooth(.22,.48,y),leg);}
 else if(ax>.48&&y<3.25){const arm=smooth(.43,.64,ax);put(2,1-arm);if(y>2.28)blend(o+1,o,smooth(2.28,2.58,y),arm);else blend(o+2,o+1,smooth(1.71,1.92,y),arm);}
 else if(y>3.15)blend(3,4,smooth(3.26,3.49,y));else if(y>2.8)blend(2,3,smooth(3.03,3.25,y));else if(y>2.25)blend(1,2,smooth(2.3,2.75,y));else blend(0,1,smooth(1.95,2.3,y));
 entries.sort((a,b)=>b[1]-a[1]);while(entries.length<4)entries.push([0,0]);const sum=entries.slice(0,4).reduce((n,e)=>n+e[1],0);return entries.slice(0,4).map(e=>[e[0],e[1]/sum]);}
for(let i=0;i<pos.length;i+=3){for(const [bone,w]of weightFor(...pos.slice(i,i+3))){skin.push(bone);weights.push(w);}}
const round=a=>a.map(n=>Math.round(n*1e5)/1e5);
const model={version:3,bones,position:round(pos),normal:round(normal),uv:round(uv),index:indices,skinIndex:skin,skinWeight:round(weights)};
fs.writeFileSync('assets/fenris-sculpt.json',JSON.stringify(model));
console.log(JSON.stringify({vertices:pos.length/3,triangles:indices.length/3,bones:bones.length,bytes:fs.statSync('assets/fenris-sculpt.json').size}));
