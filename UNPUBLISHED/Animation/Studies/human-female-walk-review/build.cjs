const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const deps='C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const {PNG}=require(deps+'pngjs'),sharp=require(deps+'sharp');
const root=__dirname,poses=JSON.parse(fs.readFileSync(path.join(root,'poses.json'),'utf8').replace(/^\uFEFF/,'')),W=512,H=640,ground=610,scale=.44,frames=[],report=[];
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const waist=[555,555,563,560,557,557,558,558];
(async()=>{
for(const [k,f] of poses.frames.entries()){
 const bytes=fs.readFileSync(path.join(root,f.file)),p=PNG.sync.read(bytes,{checkCRC:true});let bottom=-1;
 for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++)if(p.data[(y*p.width+x)*4+3]>=128)bottom=Math.max(bottom,y);
 const dx=256-waist[k]*scale,dy=ground-(bottom+1)*scale,out=new PNG({width:W,height:H});
 for(let y=0;y<H;y+=2)for(let x=0;x<W;x+=2){const sx=Math.floor((x+1-dx)/scale),sy=Math.floor((y+1-dy)/scale);if(sx<0||sy<0||sx>=p.width||sy>=p.height)continue;const si=(sy*p.width+sx)*4;if(p.data[si+3]<128)continue;for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++){const di=((y+yy)*W+x+xx)*4;for(let c=0;c<3;c++)out.data[di+c]=p.data[si+c];out.data[di+3]=255;}}
 let x0=W,y0=H,x1=-1,y1=-1,transparent=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(out.data[(y*W+x)*4+3]){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}else transparent++;
 assert.ok(x0>0&&y0>0&&x1<W-1&&y1<H-1);assert.equal(y1,ground-1);assert.ok(transparent);
 const file='human-female_walk_left_'+f.id+'.png';fs.writeFileSync(path.join(root,file),PNG.sync.write(out));frames.push(out);report.push({id:f.id,file,role:f.role,source:f.file,sourceDimensions:[p.width,p.height],sourceHash:hash(bytes),waistX:waist[k],translation:[dx,dy],scale,bounds:[x0,y0,x1,y1],pixelHash:hash(out.data)});
}
assert.equal(new Set(report.map(f=>f.pixelHash)).size,8);
const sheet=new PNG({width:W*4,height:H*2});frames.forEach((f,k)=>{for(let y=0;y<H;y++)f.data.copy(sheet.data,((Math.floor(k/4)*H+y)*sheet.width+k%4*W)*4,y*W*4,(y+1)*W*4);});fs.writeFileSync(path.join(root,'human-female_walk_left_sheet.png'),PNG.sync.write(sheet));
await sharp(Buffer.concat(frames.map(f=>f.data)),{raw:{width:W,height:H*8,channels:4,pageHeight:H}}).gif({loop:0,delay:[120,130,120,130,120,130,120,130],dither:0,colours:256,effort:7}).toFile(path.join(root,'human-female_walk_left.gif'));
const gif=await sharp(path.join(root,'human-female_walk_left.gif'),{animated:true}).metadata();assert.equal(gif.pages,8);assert.equal(gif.pageHeight,H);assert.equal(gif.delay.reduce((a,b)=>a+b,0),1000);
fs.writeFileSync(path.join(root,'animation.json'),JSON.stringify({direction:'left',file:'human-female_walk_left_sheet.png',frameWidth:W,frameHeight:H,columns:4,frames:8,fps:8,loop:true,anchor:[256,ground],duration_ms:1000,sequence:report.map(f=>({file:f.file,role:f.role,duration_ms:125}))},null,2));
fs.writeFileSync(path.join(root,'validation.json'),JSON.stringify({uniformScale:scale,limbDeformation:false,binaryAlpha:true,pixelGrid:2,ground,frames:report,gif:{frames:gif.pages,delay:gif.delay}},null,2));
await sharp(PNG.sync.write(sheet)).resize(1024,640,{kernel:'nearest'}).flatten({background:'#20353f'}).png().toFile(path.join(root,'contact-sheet.png'));
console.log(JSON.stringify({frames:8,frameSize:[W,H],fps:8,gifFrames:gif.pages,groundAligned:true}));
})().catch(e=>{console.error(e);process.exitCode=1});
