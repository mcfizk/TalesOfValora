const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
  const out=path.join(__dirname,'qa');fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,channel:'msedge'});const report={checks:[],errors:[]};
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  const snapshot=()=>page.evaluate(()=>__fenris2d.snapshot());
  async function check(name,condition){assert.ok(condition,name);report.checks.push(name);}
  await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__fenris2d);await check('Default local URL opens private scene',page.url().includes('/private-opening/'));
  await page.locator('#enable-audio').uncheck();await page.locator('#begin').click();await page.getByRole('button',{name:'Start in slot 1',exact:true}).click();await page.waitForFunction(()=>__fenris2d.snapshot().phase==='explore');
  await check('Opening triggers first voice and supports muted audio',(await snapshot()).voices.includes('first')&&!(await snapshot()).audio.enabled);
  const before=await snapshot();await page.keyboard.down('s');await page.waitForTimeout(420);await page.keyboard.up('s');await check('Keyboard movement changes position',(await snapshot()).position.y>before.position.y+12);
  const p=await snapshot();await page.keyboard.press('Escape');await page.keyboard.down('w');await page.waitForTimeout(300);await page.keyboard.up('w');await check('Pause freezes world movement',(await snapshot()).position.y===p.position.y&&(await snapshot()).paused);await page.locator('#close-panel').click();
  for(const id of ['embers','water','trail']){
    const point=(await snapshot()).points.find(p=>p.id===id);
    const target=await page.evaluate(p=>__fenris2d.worldToScreen(p.x,p.y),point);
    await page.mouse.click(target.x,target.y);
    await page.waitForFunction(id=>__fenris2d.snapshot().near===id,id,{timeout:15000});
    await page.keyboard.press('e');await page.waitForFunction(id=>__fenris2d.snapshot().found.includes(id),id);
    await check(`Examine ${id} shows inline text without pausing`,!(await snapshot()).paused&&await page.locator('.event-text[data-event-id="'+id+'"]').isVisible());
    if(id==='water')await page.screenshot({path:path.join(out,'observation.png')});
  }
  const seen=await snapshot();await check('Observations preserve the ongoing search',['embers','water','trail'].every(id=>seen.found.includes(id))&&(await page.locator('#objective-text').textContent())==='Seek the source of the voices.');
  await page.keyboard.press('j');await check('Journal contains all three observations',(await page.locator('#panel-content').textContent()).includes('Dying embers')&&(await page.locator('#panel-content').textContent()).includes('Running water'));await page.screenshot({path:path.join(out,'journal.png')});await page.locator('#close-panel').click();
  await page.waitForFunction(()=>__fenris2d.snapshot().voices.length===2,null,{timeout:20000});
  await page.screenshot({path:path.join(out,'trail.png')});
  await page.locator('#sound').click();await check('Audio starts through user action',(await snapshot()).audio.context==='running');await page.locator('#sound').click();
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'Restart the awakening',exact:true}).click();await check('Restart resets discoveries',(await snapshot()).phase==='waking'&&(await snapshot()).found.length===0);
  await page.close();
  const mobileContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:1});const mobile=await mobileContext.newPage();mobile.on('pageerror',e=>report.errors.push(e.message));
  await mobile.goto('http://127.0.0.1:8766/');await mobile.waitForFunction(()=>window.__fenris2d);await mobile.screenshot({path:path.join(out,'mobile-title.png')});await mobile.locator('#enable-audio').uncheck();await mobile.locator('#begin').click();await mobile.getByRole('button',{name:'Start in slot 1',exact:true}).click();await mobile.waitForFunction(()=>__fenris2d.snapshot().phase==='explore');
  await check('Mobile controls visible',await mobile.locator('#joystick').isVisible());await check('Mobile fits screen',await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const b=await mobile.locator('#joystick').boundingBox(),cx=b.x+b.width/2,cy=b.y+b.height/2;
  const session=await mobileContext.newCDPSession(mobile);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy}]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx+26,y:cy+18}]});await mobile.waitForTimeout(550);await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await check('Touch joystick moves Fenris',await mobile.evaluate(()=>__fenris2d.snapshot().distance>14));await mobile.screenshot({path:path.join(out,'mobile-scene.png')});
  await mobileContext.close();await browser.close();assert.deepEqual(report.errors,[],'Browser errors');
  fs.writeFileSync(path.join(out,'functional-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exit(1);});
