const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),errors=[];
 const event={id:'test-deer',x:600,y:600,dc:10,triggerRadius:10,zones:[{id:'far',radius:100,dcModifier:10},{id:'near',radius:50,dcModifier:0}],title:'Test deer',discovered:'Test deer noticed.',aware:'Test deer approached knowingly.',surprised:'Test deer startles Fenris.'};
 try{
  const page=await browser.newPage();page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/perception-events.js',route=>route.fulfill({contentType:'text/javascript',body:`export const PERCEPTION_MODE='passive';export const PERCEPTION_EVENTS=${JSON.stringify([event,{...event,id:'test-hidden',title:'Test concealed animal',dc:100}])};`}));
  await page.route('**/opening.js',async route=>{const response=await route.fetch();let body=await response.text();
   body=body.replace('const p=state.player;let dx=0,dy=0;',"const p=state.player;if(window.__testPosition)Object.assign(p,window.__testPosition);let dx=0,dy=0;");
   await route.fulfill({response,body});
  });
  await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__fenris2d);
  const snap=()=>page.evaluate(()=>__fenris2d.snapshot());
  assert.equal((await snap()).perception.events.length,0);
  await page.locator('#enable-audio').uncheck();await page.locator('#begin').click();await page.getByRole('button',{name:'Start in slot 1',exact:true}).click();await page.waitForFunction(()=>__fenris2d.snapshot().phase==='explore');
  let s=await snap();assert.ok(s.perception.events.every(e=>e.status==='hidden'));assert.ok(!s.points.some(p=>p.type==='perception-event'));assert.ok(!s.found.includes(event.id));
  await page.keyboard.press('Escape');await page.evaluate(()=>window.__testPosition={x:600,y:640});await page.waitForTimeout(150);assert.ok((await snap()).perception.events.every(e=>e.status==='hidden'));
  await page.locator('#close-panel').click();await page.waitForFunction(()=>__fenris2d.snapshot().perception.events.some(e=>e.status==='noticed'));
  s=await snap();assert.equal(s.perception.events.find(e=>e.id==='test-deer').status,'noticed');assert.equal(s.perception.events.find(e=>e.id==='test-hidden').status,'hidden');assert.equal(s.points.filter(p=>p.type==='perception-event').length,1);
  await page.keyboard.press('j');assert.ok((await page.locator('#panel-content').textContent()).includes(event.discovered));await page.locator('#close-panel').click();
  await page.evaluate(()=>window.__testPosition={x:600,y:605});await page.waitForFunction(()=>__fenris2d.snapshot().perception.events.every(e=>e.status==='encountered'));
  s=await snap();assert.equal(s.perception.events.find(e=>e.id==='test-deer').awareness,'aware');assert.equal(s.perception.events.find(e=>e.id==='test-hidden').awareness,'surprised');assert.equal(s.points.filter(p=>p.type==='perception-event').length,2);
  await page.keyboard.press('j');const journal=await page.locator('#panel-content').textContent();assert.ok(journal.includes(event.aware));assert.ok(journal.includes(event.surprised));await page.locator('#close-panel').click();
  await page.keyboard.press('Escape');await page.evaluate(()=>delete window.__testPosition);await page.getByRole('button',{name:'Restart the awakening',exact:true}).click();assert.equal((await snap()).perception.events.length,0);
  assert.deepEqual(errors,[]);fs.writeFileSync(path.join(__dirname,'qa','perception-report.json'),JSON.stringify({passed:true,checks:['hidden before exploration','failed checks reveal nothing','pause blocks discovery','closer ring reveals only noticed event','journal discovery','aware and surprised branches','restart clears events'],errors},null,2));
  console.log('Perception browser checks passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
