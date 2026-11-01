const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const deps='C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/',{PNG}=require(deps+'pngjs'),sharp=require(deps+'sharp');
const dir=path.resolve(process.argv[2]),m=JSON.parse(fs.readFileSync(path.join(dir,'poses.json'),'utf8').replace(/^\uFEFF/,'')),W=512,H=640,ground=610,scale=m.scale||.44,frames=[],report=[],hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function mirror(p){const q=new PNG({width:p.width,height:p.height});for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++){const s=(y*p.width+x)*4,t=(y*p.width+p.width-1-x)*4;p.data.copy(q.data,t,s,s+4)}return q;}
(async()=>{
for(const f of m.frames){const scale=f.scale||m.scale||.44;let p,out,waist,dx,dy,bytes;
if(f.mirrorOf){out=mirror(frames[Number(f.mirrorOf)-1]);}
else {
 bytes=fs.readFileSync(path.join(dir,f.file));p=PNG.sync.read(bytes,{checkCRC:true});if(f.flipSource)p=mirror(p);let bottom=-1;const rows=[];
 for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++)if(p.data[(y*p.width+x)*4+3]>=128)bottom=Math.max(bottom,y);
 for(let y=Math.floor(p.height*.4);y<Math.floor(p.height*.65);y++){const xs=[];for(let x=Math.floor(p.width*.25);x<p.width*.75;x++){const i=(y*p.width+x)*4,[r,g,b,a]=p.data.subarray(i,i+4);if(a>=128&&r>g*1.22&&g>b*1.12&&r>60)xs.push(x)}if(xs.length>p.width*.1)rows.push({y,x:(xs[0]+xs.at(-1))/2});}
 assert.ok(rows.length,'waist detection '+f.id);const band=rows.filter(r=>r.y>=rows[0].y+20&&r.y<rows[0].y+50);waist=f.waist||band.reduce((s,r)=>s+r.x,0)/band.length;assert.ok(Number.isFinite(waist));dx=256-waist*scale;dy=ground-(bottom+1)*scale;out=new PNG({width:W,height:H});
 for(let y=0;y<H;y+=2)for(let x=0;x<W;x+=2){const sx=Math.floor((x+1-dx)/scale),sy=Math.floor((y+1-dy)/scale);if(sx<0||sy<0||sx>=p.width||sy>=p.height)continue;const si=(sy*p.width+sx)*4;if(p.data[si+3]<128)continue;for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++){const di=((y+yy)*W+x+xx)*4;for(let c=0;c<3;c++)out.data[di+c]=p.data[si+c];out.data[di+3]=255;}}
}
let bounds=[W,H,-1,-1];for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(out.data[(y*W+x)*4+3]){bounds[0]=Math.min(bounds[0],x);bounds[1]=Math.min(bounds[1],y);bounds[2]=Math.max(bounds[2],x);bounds[3]=Math.max(bounds[3],y);}assert.ok(bounds[0]>0&&bounds[1]>0&&bounds[2]<W-1&&bounds[3]<H-1);assert.equal(bounds[3],609);
fs.writeFileSync(path.join(dir,f.id+'.png'),PNG.sync.write(out));frames.push(out);report.push({id:f.id,role:f.role,source:f.file,mirrorOf:f.mirrorOf,sourceFlipped:!!f.flipSource,sourceHash:bytes&&hash(bytes),waist,scale,translation:[dx,dy],bounds,pixelHash:hash(out.data)});
}
assert.equal(frames.length,8);assert.equal(new Set(report.map(f=>f.pixelHash)).size,8);
const sheet=new PNG({width:W*4,height:H*2});frames.forEach((f,k)=>{for(let y=0;y<H;y++)f.data.copy(sheet.data,((Math.floor(k/4)*H+y)*sheet.width+k%4*W)*4,y*W*4,(y+1)*W*4)});
fs.writeFileSync(path.join(dir,'sheet.png'),PNG.sync.write(sheet));
await sharp(Buffer.concat(frames.map(f=>f.data)),{raw:{width:W,height:H*8,channels:4,pageHeight:H}}).gif({loop:0,delay:[120,130,120,130,120,130,120,130],dither:0,colours:256}).toFile(path.join(dir,'walk.gif'));
const gif=await sharp(path.join(dir,'walk.gif'),{animated:true}).metadata();assert.equal(gif.pages,8);
await sharp(PNG.sync.write(sheet)).resize(1024,640,{kernel:'nearest'}).flatten({background:'#20353f'}).png().toFile(path.join(dir,'contact-sheet.png'));
fs.writeFileSync(path.join(dir,'validation.json'),JSON.stringify({direction:m.direction,frames:report,ground,uniformScale:new Set(report.map(f=>f.scale)).size===1?scale:null,perFrameUniformScales:report.map(f=>f.scale),binaryAlpha:true,pixelGrid:2,gifFrames:gif.pages},null,2));console.log(JSON.stringify({direction:m.direction,frames:frames.length,unique:true,groundAligned:true}));
})().catch(e=>{console.error(e);process.exitCode=1});

