const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const out=path.join(__dirname,'qa');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const report={checks:[],errors:[],directions:[]},requests=[];
 const check=(name,ok)=>{assert.ok(ok,name);report.checks.push(name);};
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>report.errors.push(e.message));
  page.on('response',r=>{requests.push(r.url());if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__fenris2d);
  const snapshot=()=>page.evaluate(()=>__fenris2d.snapshot());
  check('White portrait loaded',await page.locator('.portrait img').evaluate(im=>im.complete&&im.naturalWidth===400&&im.src.endsWith('/fenris/portrait.png')));
  check('All nine animation sheets loaded',requests.filter(url=>/\/fenris\/(idle|walk-[\w-]+)\.png$/.test(url)).length===9);
  check('Legacy brown frames are not requested',!requests.some(url=>/\/fenris-\d\.png$/.test(url)));
  await page.locator('#enable-audio').uncheck();await page.locator('#begin').click();await page.waitForFunction(()=>__fenris2d.snapshot().phase==='explore');
  check('Opening uses the breathing idle',(await snapshot()).animation.clip==='idle');
  await page.screenshot({path:path.join(out,'fenris-white-idle.png')});
  const cases=[['left',['a']],['right',['d']],['up',['w']],['down',['s']],['up-left',['w','a']],['down-right',['s','d']],['up-right',['w','d']],['down-left',['s','a']]];
  for(const [direction,keys] of cases){
   for(const key of keys)await page.keyboard.down(key);
   await page.waitForFunction(direction=>{const a=__fenris2d.snapshot().animation;return a.moving&&a.direction===direction&&a.clip==='walk';},direction);
   await page.waitForTimeout(140);
   const moving=(await snapshot()).animation;
   check(`${direction} selects its walk sheet`,moving.asset===`fenris-walk-${direction}`&&!moving.mirror);
   if(direction==='up'||direction==='down-left')await page.screenshot({path:path.join(out,`fenris-white-${direction}.png`)});
   for(const key of keys)await page.keyboard.up(key);
   await page.waitForFunction(()=>!__fenris2d.snapshot().animation.moving);
   const rest=(await snapshot()).animation;
   check(`${direction} remains facing the same direction when stopped`,rest.direction===direction);
   check(`${direction} stops the walk cycle`,rest.clip===(['left','right'].includes(direction)?'idle':'rest'));
   report.directions.push({direction,movingFrame:moving.index,rest:rest.clip});
  }
  await page.keyboard.down('d');
  const indices=await page.evaluate(()=>new Promise(resolve=>{const seen=new Set();let samples=0;const timer=setInterval(()=>{seen.add(__fenris2d.snapshot().animation.index);if(++samples>=30){clearInterval(timer);resolve([...seen]);}},40);}));
  await page.keyboard.up('d');check('All eight walking frames play',indices.length===8);
  await page.keyboard.down('Shift');await page.keyboard.down('a');await page.waitForFunction(()=>__fenris2d.snapshot().animation.running);check('Shift uses the accelerated walking cycle',(await snapshot()).animation.clip==='walk');await page.keyboard.up('a');await page.keyboard.up('Shift');
  await page.keyboard.press('Escape');const paused=await snapshot();await page.waitForTimeout(300);check('Pause freezes the rendered animation',(await snapshot()).animation.index===paused.animation.index);
  await page.getByRole('button',{name:'Restart the awakening',exact:true}).click();const reset=await snapshot();check('Restart restores left-facing sleep',reset.phase==='waking'&&reset.animation.direction==='left'&&reset.animation.clip==='sleep');
  check('No browser or asset errors',report.errors.length===0);
  fs.writeFileSync(path.join(out,'animation-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
