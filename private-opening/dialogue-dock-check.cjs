const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),report={checks:[],errors:[]};
 try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),snap=()=>page.evaluate(()=>__fenris2d.snapshot());
 page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
 const check=(name,ok)=>{assert.ok(ok,name);report.checks.push(name);};
 await page.route('**/opening.js*',async route=>{const response=await route.fetch();const source=(await response.text()).replace('window.__fenris2d=Object.freeze',`window.__dialogueFixture=id=>{hidePanel();resume();state.phase='explore';state.age=10;state.clock=gameClock.load(1920);relocate({x:world.village.x,y:world.village.y+35});const p=ALL_PEOPLE.find(p=>p.id===id);town.interact({...p,actorId:id,id:'npc:'+id,type:'village'});};window.__fenris2d=Object.freeze`);await route.fulfill({response,body:source});});
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__fenris2d);await page.locator('#enable-audio').uncheck();await page.locator('#begin').click();await page.getByRole('button',{name:'Start in slot 1',exact:true}).click();await page.waitForFunction(()=>__fenris2d.snapshot().phase==='explore');
 for(const id of ['harl','edra','woodcutter','farmer','resident','washer','vendor','innkeeper','trader','blacksmith','herbalist']){
  await page.evaluate(id=>__dialogueFixture(id),id);await page.waitForFunction(()=>document.querySelector('.fenris-face img')?.complete);
  const valid=await page.evaluate(id=>{const p=document.getElementById('panel'),c=document.querySelector('.speaker-portrait[data-speaker="'+id+'"] canvas'),pixels=c.getContext('2d').getImageData(0,0,128,128).data;let visible=0;for(let i=3;i<pixels.length;i+=4)if(pixels[i])visible++;return p.tagName==='SECTION'&&p.classList.contains('conversation-dock')&&visible>500&&document.querySelectorAll('.speaker-portrait').length===2&&!document.querySelector(':modal')&&p.getBoundingClientRect().bottom<=innerHeight+1;},id);
  check(id+' has a cropped portrait beside Fenris in a bottom non-modal conversation',valid);
 }
 await page.evaluate(()=>__dialogueFixture('woodcutter'));const before=await snap();await page.getByRole('button').filter({hasText:'heavier logs'}).click();
 check('Fenris choice is retained next to his portrait',await page.locator('.player-choice').textContent().then(t=>t.includes('heavier logs')));
 check('Checks still use live stats and pause the world clock',await page.locator('.check-result').isVisible()&&(await snap()).paused&&(await snap()).clock.totalMinutes===before.clock.totalMinutes);
 await page.screenshot({path:path.join(__dirname,'qa','dialogue-dock-desktop.png')});
 await page.keyboard.press('Escape');check('Escape closes conversation and restores play',await page.locator('#panel').isHidden()&&!(await snap()).paused);
 await page.keyboard.press('j');check('Journal now uses a non-modal side dock',await page.evaluate(()=>{const p=document.getElementById('panel');return !p.hidden&&!p.classList.contains('conversation-dock')&&!document.querySelector('dialog')&&p.getBoundingClientRect().right<=innerWidth;}));await page.keyboard.press('Escape');
 await page.setViewportSize({width:844,height:390});await page.evaluate(()=>__dialogueFixture('resident'));
 check('Landscape conversation stays docked and scrolls within the screen',await page.evaluate(()=>{const r=document.getElementById('panel').getBoundingClientRect();return r.top>0&&r.bottom<=innerHeight+1&&r.right<=innerWidth;}));await page.keyboard.press('Escape');
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>__dialogueFixture('farmer'));
 check('Phone conversation leaves the upper world visible without horizontal overflow',await page.evaluate(()=>{const p=document.getElementById('panel'),r=p.getBoundingClientRect();return r.top>=innerHeight*.35&&r.bottom<=innerHeight+1&&p.scrollWidth<=p.clientWidth&&document.documentElement.scrollWidth<=innerWidth;}));
 await page.screenshot({path:path.join(__dirname,'qa','dialogue-dock-mobile.png')});
 await page.getByRole('button').filter({hasText:'I will keep to the path.'}).focus();await page.keyboard.press('Space');
 check('Keyboard Space activates a focused dialogue choice',await page.locator('.player-choice').textContent().then(t=>t.includes('keep to the path')));
 await page.getByRole('button',{name:'Leave',exact:true}).scrollIntoViewIfNeeded();await page.getByRole('button',{name:'Leave',exact:true}).click();check('Phone Leave action closes the conversation',await page.locator('#panel').isHidden());
 check('No browser errors',report.errors.length===0);fs.writeFileSync(path.join(__dirname,'qa','dialogue-dock-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
