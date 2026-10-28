const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),report={checks:[],errors:[]},out=path.join(__dirname,'qa');
 const check=(name,value)=>{assert.ok(value,name);report.checks.push(name);};
 async function setup(page){
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.addInitScript(()=>{const original=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=a=>a instanceof Uint32Array&&a.length===1?(a[0]=1468,a):original(a);});
  await page.route('**/opening.js',async route=>{const r=await route.fetch();await route.fulfill({response:r,body:(await r.text()).replace('window.__fenris2d=Object.freeze',"window.__eventQA={place:(x,y)=>relocate({x,y}),expire:()=>state.time+=30,surprise:()=>{perception.reset();stats.addModifier({id:'test-penalty',target:'skill:perception',add:-30});relocate({x:530,y:435});}};window.__fenris2d=Object.freeze")});});
  await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__fenris2d);await page.locator('#enable-audio').uncheck();await page.locator('#begin').click();await page.getByRole('button',{name:'Start in slot 1',exact:true}).click();await page.waitForFunction(()=>__fenris2d.snapshot().phase==='explore');
 }
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});await setup(page);
  check('Noticed off-screen deer has a directional arrow',await page.locator('.event-arrow[data-event-id="placeholder-deer"]').isVisible());
  check('Failed distant branch check leaks no marker or text',await page.locator('[data-event-id="placeholder-branch"]').count()===0);
  const ember=await page.evaluate(()=>__fenris2d.worldToScreen(654,588));await page.mouse.click(ember.x,ember.y);await page.waitForFunction(()=>__fenris2d.snapshot().found.includes('embers'));
  check('Campfire description appears at the object without a dialog or pause',await page.locator('.event-text[data-event-id="embers"]').isVisible()&&await page.locator('#panel').isHidden()&&!(await page.evaluate(()=>__fenris2d.snapshot().paused)));
  check('Campfire requires no dismissal button',await page.locator('.event-text[data-event-id="embers"] button').count()===0);
  await page.screenshot({path:path.join(out,'event-campfire-desktop.png')});
  const before=await page.evaluate(()=>__fenris2d.snapshot().position.x);await page.keyboard.down('a');await page.waitForTimeout(250);await page.keyboard.up('a');check('Movement continues while observation text is visible',await page.evaluate(x=>__fenris2d.snapshot().position.x<x,before));
  await page.evaluate(()=>__eventQA.place(530,490));await page.waitForFunction(()=>__fenris2d.snapshot().perception.events.some(e=>e.id==='placeholder-branch'&&e.status==='noticed'));
  check('A closer ring reveals its text automatically',await page.locator('.event-text[data-event-id="placeholder-branch"]').isVisible());
  await page.evaluate(()=>__eventQA.place(530,435));await page.waitForFunction(()=>__fenris2d.snapshot().perception.events.some(e=>e.id==='placeholder-branch'&&e.awareness==='aware'));
  check('The aware outcome appears on the event',(await page.locator('.event-text[data-event-id="placeholder-branch"]').textContent()).includes('room to spare'));
  await page.evaluate(()=>__eventQA.surprise());await page.waitForFunction(()=>__fenris2d.snapshot().perception.events.some(e=>e.id==='placeholder-branch'&&e.awareness==='surprised'));
  check('A missed perception check shows the surprise outcome inline',(await page.locator('.event-text[data-event-id="placeholder-branch"]').textContent()).includes('snaps loose'));
  const stump=await page.evaluate(()=>__fenris2d.snapshot().points.find(p=>p.type==='stump'));assert.ok(stump);await page.evaluate(p=>__eventQA.place(p.x,p.y),stump);await page.waitForFunction(id=>__fenris2d.snapshot().near===id,stump.id);await page.keyboard.press('e');
  await page.locator('.event-text').getByRole('button',{name:'Gather wood',exact:true}).click();check('Optional gathering remains available inline',await page.evaluate(()=>__fenris2d.snapshot().economy.bag.firewood===1)&&await page.locator('#panel').isHidden());
  await page.evaluate(()=>__eventQA.expire());await page.waitForFunction(()=>document.querySelectorAll('.event-text').length===0);check('Text fades without dismissal and remains in the journal',await page.evaluate(()=>__fenris2d.snapshot().found.includes('embers')));
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),mobile=await context.newPage();await setup(mobile);
  const at=await mobile.evaluate(()=>__fenris2d.worldToScreen(654,588));await mobile.mouse.click(at.x,at.y);await mobile.waitForFunction(()=>__fenris2d.snapshot().found.includes('embers'));
  check('Mobile text and arrows fit the screen',await mobile.evaluate(()=>[...document.querySelectorAll('.event-text,.event-arrow')].every(el=>{const r=el.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.top>=0&&r.bottom<=innerHeight;})));
  await mobile.screenshot({path:path.join(out,'event-campfire-mobile.png')});check('No browser errors',report.errors.length===0);fs.writeFileSync(path.join(out,'event-overlay-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
