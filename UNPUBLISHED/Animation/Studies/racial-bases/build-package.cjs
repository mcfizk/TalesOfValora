const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {pathToFileURL}=require('url');
const packages='C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const {PNG}=require(packages+'pngjs');
const root=__dirname,repo=path.resolve(root,'../../../..');
const readJson=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const progress=readJson(path.join(root,'progress.json'));
const id=process.argv[2],plan=progress.characters.find(c=>c.id===id);
if(!plan)throw Error('Pass a character id from progress.json');
const dir=path.join(root,id),jobs=readJson(path.join(root,'source-clips.json'));
const W=640,H=640,G=2,GROUND=600,CX=320;
const png=f=>PNG.sync.read(fs.readFileSync(f),{checkCRC:true});
const hash=data=>crypto.createHash('sha256').update(data).digest('hex');
const median=a=>[...a].sort((a,b)=>a-b)[Math.floor(a.length/2)];
function runs(values,minCount,gap=8){
  const raw=[];let start=-1;
  for(let i=0;i<=values.length;i++){
    if(i<values.length&&values[i]>=minCount){if(start<0)start=i;}
    else if(start>=0){raw.push([start,i]);start=-1;}
  }
  const merged=[];
  for(const r of raw){const last=merged.at(-1);if(last&&r[0]-last[1]<=gap)last[1]=r[1];else merged.push([...r]);}
  return merged.filter(r=>r[1]-r[0]>=12);
}
function bbox(im,rect={x:0,y:0,w:im.width,h:im.height}){
 let x0=im.width,y0=im.height,x1=-1,y1=-1;
 for(let y=rect.y;y<rect.y+rect.h;y++)for(let x=rect.x;x<rect.x+rect.w;x++)if(im.data[(y*im.width+x)*4+3]>=128){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
 if(x1<0)throw Error('Empty frame');return {x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};
}
function splitSource(job){
 const im=png(path.join(dir,'generation',job.id+'.png'));
 const ys=new Uint32Array(im.height);
 for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++)if(im.data[(y*im.width+x)*4+3]>=128)ys[y]++;
 const rowBands=runs(ys,4,0);
 if(rowBands.length!==job.rows)throw Error(job.id+': expected '+job.rows+' separated rows, found '+JSON.stringify(rowBands));
 const rects=[];
 for(const [rowIndex,[y0,y1]] of rowBands.entries()){
  const xs=new Uint32Array(im.width);
  for(let y=y0;y<y1;y++)for(let x=0;x<im.width;x++)if(im.data[(y*im.width+x)*4+3]>=128)xs[x]++;
  const cols=runs(xs,3,8);
  const restColumns={'dwarf-female':[3,2,3],'halfling-male':[3,2,4],'halfling-female':[3,2,3]};
  const expected=job.id==='rest'&&restColumns[id]?restColumns[id][rowIndex]:job.cols;
  if(cols.length!==expected)throw Error(job.id+': expected '+expected+' columns, found '+JSON.stringify(cols));
  for(const [x0,x1] of cols)rects.push(bbox(im,{x:x0,y:y0,w:x1-x0,h:y1-y0}));
 }
 if(rects.length!==(['dwarf-female','halfling-female'].includes(id)&&job.id==='rest'?8:job.frames))throw Error('Frame count mismatch');
 return {im,rects,dimensions:[im.width,im.height]};
}
function fitFrame(im,b,scale){
 const lw=Math.round(b.w*scale/G),lh=Math.round(b.h*scale/G);
 const left=Math.round((CX-lw*G/2)/G)*G,top=GROUND-lh*G;
 if(left<4||top<4||left+lw*G>W-4)throw Error('Frame exceeds safe canvas: '+JSON.stringify({lw,lh,scale,b}));
 const out=new PNG({width:W,height:H});out.data.fill(0);
 for(let y=0;y<lh;y++)for(let x=0;x<lw;x++){
  const sx=b.x+Math.min(b.w-1,Math.floor((x+.5)*b.w/lw)),sy=b.y+Math.min(b.h-1,Math.floor((y+.5)*b.h/lh));
  const si=(sy*im.width+sx)*4;if(im.data[si+3]<128)continue;
  for(let a=0;a<G;a++)for(let c=0;c<G;c++){const di=((top+y*G+a)*W+left+x*G+c)*4;im.data.copy(out.data,di,si,si+3);out.data[di+3]=255;}
 }
 return out;
}
function mirror(im){const out=new PNG({width:W,height:H});for(let y=0;y<H;y++)for(let x=0;x<W;x++){const s=(y*W+x)*4,d=(y*W+W-1-x)*4;im.data.copy(out.data,d,s,s+4);}return out;}
function atlas(frames,columns,file){
 const out=new PNG({width:W*columns,height:H*Math.ceil(frames.length/columns)});out.data.fill(0);
 frames.forEach((im,k)=>{const ox=k%columns*W,oy=Math.floor(k/columns)*H;for(let y=0;y<H;y++)im.data.copy(out.data,((oy+y)*out.width+ox)*4,y*W*4,(y+1)*W*4);});
 fs.writeFileSync(path.join(dir,file),PNG.sync.write(out));
 const decoded=png(path.join(dir,file));if(decoded.width!==out.width||decoded.height!==out.height)throw Error('Atlas integrity failure');
}
function verifyFrames(name,frames){
 const unique=new Set(),bounds=[];let partial=0;
 for(const im of frames){for(let i=3;i<im.data.length;i+=4)if(im.data[i]!==0&&im.data[i]!==255)partial++;unique.add(hash(im.data));const b=bbox(im);bounds.push(b);if(b.x<2||b.y<2||b.x+b.w>=W||b.y+b.h>GROUND)throw Error('Clipped frame '+name);}
 if(partial||unique.size<Math.min(3,frames.length))throw Error('Transparency or duplicate-frame failure '+name);
 return {frames:frames.length,uniqueFrames:unique.size,partialAlphaPixels:partial,bounds};
}
async function main(){
 const sources={},report={id,sourceSheets:{},clips:{},frameSize:[W,H],anchor:[CX,GROUND],bodyHeight:plan.height,mirrors:[]};
 for(const j of jobs){const s=splitSource(j);sources[j.id]=s;report.sourceSheets[j.id]={dimensions:s.dimensions,rects:s.rects};}
 const clips={};
 for(const key of ['idle','walk-left','walk-up-left','walk-up','walk-down-left','walk-down']){
  const s=sources[key],scale=plan.height/median(s.rects.map(b=>b.h));
  clips[key]=s.rects.map(b=>fitFrame(s.im,b,scale));report.sourceSheets[key].scale=scale;
 }
 const rest=sources.rest,restScale=plan.height/rest.rects[0].h;
 const sleepScales=rest.rects.slice(1,5).map((b,i)=>restScale*(id==='halfling-female'&&i>=2?rest.rects[1].w/b.w:1));
 clips.sleep=rest.rects.slice(1,5).map((b,i)=>fitFrame(rest.im,b,sleepScales[i]));
 report.sourceSheets.rest.sleepScales=sleepScales;
 clips.sit=rest.rects.slice(5,9).map(b=>fitFrame(rest.im,b,restScale));report.sourceSheets.rest.scale=restScale;
 if(clips.sit.length===3)clips.sit.push(clips.sit[1]);
 for(const key of ['sleepToSit','sitToStand']){const s=sources[key],calibration=key==='sitToStand'?s.rects.length-1:0,scale=plan.height/s.rects[calibration].h;clips[key]=(key==='sitToStand'?s.rects:s.rects.slice(1)).map(b=>fitFrame(s.im,b,scale));report.sourceSheets[key].scale=scale;}
 // Share exact pose endpoints across clips, avoiding discontinuities at state boundaries.
 clips.sleepToSit[0]=clips.sleep[0];clips.sleepToSit[clips.sleepToSit.length-1]=clips.sit[0];
 clips.sitToStand[0]=clips.sit[0];clips.sitToStand[clips.sitToStand.length-1]=clips.idle[0];
 clips.sitToSleep=[...clips.sleepToSit].reverse();clips.standToSit=[...clips.sitToStand].reverse();
 for(const [left,right] of [['left','right'],['up-left','up-right'],['down-left','down-right']]){clips['walk-'+right]=clips['walk-'+left].map(mirror);report.mirrors.push({source:left,target:right,method:'exact per-frame horizontal mirror'});}
 const config={id,formatVersion:1,displayHeight:plan.displayHeight,restFrame:0};
 const clipMetadata={};
 for(const [name,frames] of Object.entries(clips)){
  const isWalk=name.startsWith('walk-'),loop=isWalk||['idle','sleep','sit'].includes(name);
  const fps=isWalk?8:name==='idle'?4:['sleep','sit'].includes(name)?2:4;
  const columns=frames.length===4?2:frames.length===5?3:4;
  atlas(frames,columns,name+'.png');report.clips[name]=verifyFrames(name,frames);
  const spec={file:name+'.png',frameWidth:W,frameHeight:H,columns,frames:frames.length,fps,loop,anchor:[CX,GROUND],bodyHeight:plan.height};
  if(!isWalk&&name!=='idle'){spec.directions=['left','right'];spec.mirrorRight=true;}
  clipMetadata[name]=spec;
  if(['idle','sleep','sit','sleepToSit','sitToStand'].includes(name))config[name]=spec;
 }
 config.walk={...clipMetadata['walk-left'],files:Object.fromEntries(['left','right','up-left','up-right','up','down-left','down-right','down'].map(d=>[d,'walk-'+d+'.png']))};delete config.walk.file;
 config.wakeSequence=[{clip:'sleep',seconds:2},{clip:'sleepToSit',seconds:config.sleepToSit.frames/4},{clip:'sit',seconds:2},{clip:'sitToStand',seconds:config.sitToStand.frames/4}];
 config.additionalClips={standToSit:clipMetadata.standToSit,sitToSleep:clipMetadata.sitToSleep};
 const contract=await import(pathToFileURL(path.join(repo,'RELEASE/private-opening/character-animation.js')).href);
 contract.validateCharacterAnimations(config);
 report.sharedContractValid=true;report.endpointContinuity=true;
 fs.writeFileSync(path.join(dir,'animations.json'),JSON.stringify(config,null,2)+'\n');
 fs.writeFileSync(path.join(dir,'validation.json'),JSON.stringify(report,null,2)+'\n');
 fs.writeFileSync(path.join(dir,'preview.html'),preview(clipMetadata));
 plan.status='exported-awaiting-visual-check';plan.completedSourceClips=jobs.map(j=>j.id);plan.sheetCount=Object.keys(clips).length;
 fs.writeFileSync(path.join(root,'progress.json'),JSON.stringify(progress,null,2)+'\n');
 console.log(JSON.stringify({id,sheets:Object.keys(clips).length,frames:Object.values(clips).reduce((n,f)=>n+f.length,0),contractValid:true,clips:Object.fromEntries(Object.entries(report.clips).map(([k,v])=>[k,{frames:v.frames,unique:v.uniqueFrames}]))},null,2));
}
function preview(meta){return `<!doctype html><meta charset="utf-8"><title>${plan.label} animation review</title><style>body{background:#17222a;color:#e5edef;font:15px system-ui;margin:24px}h1{font-size:24px}button,input{margin:6px}main{display:grid;grid-template-columns:repeat(5,minmax(170px,1fr));gap:12px}.card{background:#23333e;padding:10px;border-radius:8px}canvas{width:100%;image-rendering:pixelated;background:#1b2933}small{color:#a9bec9}footer{margin-top:20px}</style><h1>${plan.label} — animation review</h1><p>Approved base · ${plan.height/640*100}% human scale · 640px cells · review only</p><button id="pause">Pause</button><label>Speed <input id="speed" type="range" min="0.25" max="2" step="0.25" value="1"></label><button id="step">Step one frame</button><main></main><footer>Mirrored opposite walks. Rest clips mirror for right-facing use. Reverse transitions are additional clips awaiting future renderer support. No game integration.</footer><script>const meta=${JSON.stringify(meta)},cards=[];let playing=true,t=0,last=performance.now();for(const[name,s]of Object.entries(meta)){const el=document.createElement('section');el.className='card';el.innerHTML='<b>'+name+'</b><canvas width="220" height="220"></canvas><small>'+s.frames+' frames / '+s.fps+' fps</small>';document.querySelector('main').append(el);const im=new Image();im.src=s.file;cards.push({name,s,im,c:el.querySelector('canvas'),label:el.querySelector('small')})}function draw(){for(const a of cards){const {s,c,im}=a,ctx=c.getContext('2d'),k=Math.floor(t*s.fps)%s.frames;ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,220,220);ctx.strokeStyle='#47606e';ctx.beginPath();ctx.moveTo(0,207);ctx.lineTo(220,207);ctx.stroke();if(im.complete&&im.naturalWidth)ctx.drawImage(im,k%s.columns*s.frameWidth,Math.floor(k/s.columns)*s.frameHeight,s.frameWidth,s.frameHeight,0,0,220,220);a.label.textContent=(k+1)+' / '+s.frames+' · '+s.fps+' fps'+(s.loop?' loop':' transition (review repeats)')}}function tick(now){if(playing)t+=(now-last)/1000*Number(document.querySelector('#speed').value);last=now;draw();requestAnimationFrame(tick)}document.querySelector('#pause').onclick=()=>{playing=!playing;document.querySelector('#pause').textContent=playing?'Pause':'Play'};document.querySelector('#step').onclick=()=>{playing=false;t+=.125;draw()};window.review={cards,setTime(v){t=v;playing=false;draw()},get ready(){return cards.every(a=>a.im.complete&&a.im.naturalWidth>0)}};requestAnimationFrame(tick);</script>`;}
main().catch(e=>{console.error(e);process.exitCode=1;});
