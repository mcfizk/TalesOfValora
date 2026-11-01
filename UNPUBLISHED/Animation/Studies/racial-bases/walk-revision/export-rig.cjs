const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),{pathToFileURL}=require('url');
const {PNG}=require('C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pngjs');
const root=path.resolve(__dirname,'..'),repo=path.resolve(root,'../../../../Legacy3D/assets'),read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function mirror(im){const out=new PNG({width:im.width,height:im.height});for(let y=0;y<im.height;y++)for(let x=0;x<im.width;x++){const sx=Math.floor(x/640)*640+639-x%640;im.data.copy(out.data,(y*im.width+x)*4,(y*im.width+sx)*4,(y*im.width+sx)*4+4)}return out;}
function validate(im){assert.equal(im.width,2560);assert.equal(im.height,2560);const bounds=[],hashes=[];for(let k=0;k<16;k++){const frame=Buffer.alloc(640*640*4);let x0=640,y0=640,x1=-1,y1=-1;for(let y=0;y<640;y++)for(let x=0;x<640;x++){const i=((Math.floor(k/4)*640+y)*im.width+k%4*640+x)*4,a=im.data[i+3];assert.ok(a===0||a===255);im.data.copy(frame,(y*640+x)*4,i,i+4);if(a){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}}assert.ok(x0>0&&y0>0&&x1<639&&y1<639,'clipped/empty frame');bounds.push({x:x0,y:y0,w:x1-x0+1,h:y1-y0+1});hashes.push(hash(frame));}assert.equal(new Set(hashes).size,16,'Repeated frame');return{frames:16,uniqueFrames:16,partialAlphaPixels:0,bounds};}
(async()=>{const snapshot=read(path.join(__dirname,'originals/snapshot.json')),ids=process.argv.slice(2);assert.ok(ids.length,'Pass character IDs');
 for(const [file,digest]of Object.entries(snapshot.preserved))assert.equal(hash(fs.readFileSync(path.join(root,file))),digest,'Rest artwork changed: '+file);
 for(const id of ids){const config=read(path.join(root,id,'animations.json')),validation=read(path.join(root,id,'validation.json')),rig=read(path.join(__dirname,'rigged',id,'rig-validation.json')),pending={};assert.equal(rig.frames,16);
  for(const [dir,motion]of Object.entries(rig.directions)){assert.ok(motion.loopCloses);assert.equal(motion.uniqueFrames,16);for(let k=0;k<16;k++){const [a,b]=motion.poses[k];assert.ok(Math.abs(((b.phase-a.phase+1)%1)-.5)<1e-8);assert.ok(a.stance||b.stance);for(const f of [a,b]){assert.ok(f.lift>=-1e-8);if(f.stance)assert.equal(f.lift,0);assert.ok(f.sole[1]<=300.00001);}}assert.ok(motion.poses[4][1].lift>0&&motion.poses[12][0].lift>0,'Both feet must lift on alternate steps');
   pending[dir]=PNG.sync.read(fs.readFileSync(path.join(__dirname,'rigged',id,'walk-'+dir+'.png')),{checkCRC:true});}
  for(const [a,b]of [['left','right'],['up-left','up-right'],['down-left','down-right']])pending[b]=mirror(pending[a]);assert.equal(Object.keys(pending).length,8);
  for(const [dir,im]of Object.entries(pending))validation.clips['walk-'+dir]=validate(im);
  config.walk.frames=16;config.walk.fps=16;config.walk.columns=4;config.walk.revision='painted-rig-v1';
  const contract=await import(pathToFileURL(path.join(repo,'RELEASE/private-opening/character-animation.js')).href);contract.validateCharacterAnimations(config);
  for(const [dir,im]of Object.entries(pending))fs.writeFileSync(path.join(root,id,config.walk.files[dir]),PNG.sync.write(im));
  validation.walkRevision={method:'joint-controlled painted leg meshes, rigid feet, and continuous arm deformation',frames:16,fps:16,cycleSeconds:1,alternatingSteps:true,loopCloses:true,sourceSnapshot:'originals'+id,report:'rigged'+id+'/rig-validation.json'};
  fs.writeFileSync(path.join(root,id,'animations.json'),JSON.stringify(config,null,2)+'\n');fs.writeFileSync(path.join(root,id,'validation.json'),JSON.stringify(validation,null,2)+'\n');
  const file=path.join(root,id,'preview.html'),html=fs.readFileSync(file,'utf8'),match=html.match(/const meta=(.*?),cards=\[\]/);assert.ok(match);const meta=JSON.parse(match[1]);for(const [key,s]of Object.entries(meta))if(key.startsWith('walk-')){s.frames=16;s.fps=16;}fs.writeFileSync(file,html.replace(match[0],'const meta='+JSON.stringify(meta)+',cards=[]').replace('t+=.125','t+=.0625'));
  console.log(JSON.stringify({id,walkSheets:8,frames:128,loopCloses:true,restArtworkPreserved:true}));
 }
 for(const [file,digest]of Object.entries(snapshot.preserved))assert.equal(hash(fs.readFileSync(path.join(root,file))),digest,'Rest artwork changed: '+file);
})().catch(e=>{console.error(e);process.exitCode=1});
