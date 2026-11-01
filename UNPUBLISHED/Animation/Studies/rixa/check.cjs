const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),{pathToFileURL}=require('url');
const deps='C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const {PNG}=require(deps+'pngjs'),sharp=require(deps+'sharp');
const ROOT=__dirname,hash=data=>crypto.createHash('sha256').update(data).digest('hex');
(async()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'review.json'),'utf8')),results=[];
 for(const clip of manifest.clips){
  const file=path.join(ROOT,clip.file),sheet=PNG.sync.read(fs.readFileSync(file),{checkCRC:true});
  assert.equal(sheet.width,clip.frameWidth*clip.columns);assert.equal(sheet.height,clip.frameHeight*Math.ceil(clip.frames/clip.columns));
  const hashes=[];
  for(let i=0;i<clip.frames;i++){
   const dir=path.dirname(file),frame=PNG.sync.read(fs.readFileSync(path.join(dir,String(i+1).padStart(2,'0')+'.png')),{checkCRC:true});
   assert.equal(frame.width,640);assert.equal(frame.height,640);
   let transparent=0,opaque=0;
   for(let y=0;y<640;y++)for(let x=0;x<640;x++){
    const a=(y*640+x)*4,b=((Math.floor(i/clip.columns)*640+y)*sheet.width+i%clip.columns*640+x)*4;
    for(let ch=0;ch<4;ch++)assert.equal(frame.data[a+ch],sheet.data[b+ch],clip.key+' atlas frame mismatch');
    const alpha=frame.data[a+3];assert(alpha===0||alpha===255,'Nonbinary export alpha');
    if(alpha===0)transparent++;else{opaque++;assert(x>0&&y>0&&x<639&&y<639,'Artwork touches cell edge');}
   }
   assert(transparent&&opaque);const actualHash=hash(frame.data);hashes.push(actualHash);assert.equal(actualHash,clip.details[i].pixelHash);
   const source=fs.readFileSync(path.join(ROOT,clip.details[i].source));PNG.sync.read(source,{checkCRC:true});assert.equal(hash(source),clip.details[i].sourceHash,'Source changed after build');
  }
  if(clip.kind==='walk'){assert.equal(clip.frames,8);assert.equal(new Set(hashes).size,8);}
  if(clip.frames>1){const gif=await sharp(path.join(path.dirname(file),'preview.gif'),{animated:true}).metadata();assert.equal(gif.pages,clip.frames);}
  results.push({key:clip.key,frames:clip.frames,uniqueFrames:new Set(hashes).size,pngIntegrity:true,sourceUnchanged:true,binaryAlpha:true,atlasMatchesFrames:true});
 }
 const result={checkedAt:new Date().toISOString(),clips:results,complete:manifest.complete,missing:manifest.status.filter(s=>s.state!=='exported-awaiting-review')};
 if(process.argv.includes('--browser')){
  const {chromium}=require(deps+'playwright'),browser=await chromium.launch({channel:'msedge',headless:true});
  try{
   const page=await browser.newPage({viewport:{width:1280,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(pathToFileURL(path.join(ROOT,'preview.html')).href);await page.waitForFunction(()=>window.review?.ready);
   for(const clip of manifest.clips){await page.evaluate(c=>window.review.select(c.action,c.direction),clip);for(let i=0;i<clip.frames;i++){await page.evaluate(i=>window.review.seek(i),i);assert.equal(await page.evaluate(()=>window.review.frame),i);}}
   if(manifest.clips.length){const clip=manifest.clips.find(c=>c.frames>1)||manifest.clips[0];await page.evaluate(c=>{window.review.select(c.action,c.direction);window.review.seek(0)},clip);if(clip.frames>1){await page.click('#play');await page.waitForFunction(()=>window.review.frame>0);await page.evaluate(()=>window.review.seek(0));}}
   await page.screenshot({path:path.join(ROOT,'preview-check.png'),fullPage:true});assert.deepEqual(errors,[]);result.browser={ready:true,frameStepping:true,playback:manifest.clips.some(c=>c.frames>1),pageErrors:errors};
  }finally{await browser.close()}
 }
 fs.writeFileSync(path.join(ROOT,'validation.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({clipsChecked:results.length,complete:result.complete,remaining:result.missing.length,browser:result.browser},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
