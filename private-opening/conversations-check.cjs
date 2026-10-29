const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),out=path.join(__dirname,'qa'),report={checks:[],errors:[]};
 const check=(name,value)=>{assert.ok(value,name);report.checks.push(name);};
 const snap=page=>page.evaluate(()=>__fenris2d.snapshot());
 async function setup(page,roll){
  page.on('pageerror',e=>report.errors.push(e.message));
  await page.route('**/conversations.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('rng=Math.random',`rng=()=>${roll}`)});});
  await page.route('**/opening.js',async route=>{const response=await route.fetch();let source=await response.text();source=source.replace('if(wake.complete){',"if(wake.complete){relocate({x:village.x-185,y:village.y+218});state.clock=gameClock.advance(600,true);");source=source.replace('window.__fenris2d=Object.freeze',"window.__conversationQA=(x,y)=>{state.interior=null;relocate({x:village.x+x,y:village.y+y});};window.__fenris2d=Object.freeze");await route.fulfill({response,body:source});});
  await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__fenris2d);await page.locator('#enable-audio').uncheck();await page.locator('#begin').click();await page.getByRole('button',{name:'Start in slot 1',exact:true}).click();await page.waitForFunction(()=>__fenris2d.snapshot().phase==='explore');
 }
 async function interact(page,id){const at=await page.evaluate(id=>{const p=__fenris2d.snapshot().points.find(p=>p.id===id);if(!p)throw Error(id);return __fenris2d.worldToScreen(p.x,p.y-26);},id);await page.mouse.click(at.x,at.y);}
 async function close(page){if(await page.locator('#panel').isVisible())await page.locator('#close-panel').click();}
 async function enterStore(page){await page.evaluate(()=>__conversationQA(142,-60));await page.waitForTimeout(150);await interact(page,'door:store');await page.waitForFunction(()=>__fenris2d.snapshot().location==='store');await interact(page,'npc:trader');await page.waitForFunction(()=>!document.getElementById('panel').hidden);}
 const option=(page,text)=>page.locator('.conversation-choice').filter({hasText:text});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});await setup(page,.999);await interact(page,'npc:woodcutter');
  check('Dialogue presents several responses and transparent skill difficulty',await page.locator('.conversation-choice').count()===4&&(await option(page,'heavier logs').textContent()).includes('Athletics +4 · DC 12'));
  const before=(await snap(page)).clock.totalMinutes;await option(page,'heavier logs').click();
  check('Success displays the real d20, modifier, total and DC',(await page.locator('.check-result').textContent()).includes('d20 20 + 4 = 24 · DC 12'));
  check('Successful Athletics changes the agreed job pay',(await snap(page)).economy.jobBonus===4);
  const units=(await snap(page)).units;
  check('Conversation belongs to both participants and affinity is directed',units.fenris.memories.some(m=>m.id==='conversation:woodcutter:workTerms')&&units.woodcutter.memories.some(m=>m.id==='conversation:woodcutter:workTerms')&&units.woodcutter.affinity.fenris===1&&!units.fenris.affinity.woodcutter);
  check('Uninvolved villagers do not acquire the conversation',units.edra.memories.length===0);
  check('The attempted check is disabled',await option(page,'heavier logs').isDisabled());
  check('Conversations and checks do not advance the movement clock',(await snap(page)).clock.totalMinutes===before);
  await page.getByRole('button',{name:'Accept the work',exact:true}).click();await close(page);await interact(page,'woodpile');await page.getByRole('button',{name:'Stack the wood',exact:true}).click();await close(page);await interact(page,'npc:woodcutter');await page.getByRole('button',{name:'Collect 16 copper',exact:true}).click();check('Negotiated pay is actually awarded',(await snap(page)).economy.copper===16);await close(page);
  await enterStore(page);await option(page,'Read his hesitation').click();check('Insight opens a contextual easier bargain',(await option(page,'careful, quiet business').textContent()).includes('DC 10'));
  await option(page,'careful, quiet business').click();check('Negotiation changes this shop’s prices',(await snap(page)).economy.terms.store===-1);
  await page.screenshot({path:path.join(out,'conversation-success-desktop.png')});await page.getByRole('button',{name:'See the goods',exact:true}).click();
  check('Trade UI uses negotiated prices',(await page.locator('.trade-row').filter({hasText:'Dark bread'}).textContent()).includes('2 copper'));
  await page.locator('.trade-row').filter({hasText:'Dark bread'}).getByRole('button',{name:'Buy',exact:true}).click();check('Purchase debits the negotiated amount',(await snap(page)).economy.copper===14);await close(page);
  await interact(page,'npc:trader');await option(page,'Can we discuss').click();check('Alternative bargains cannot reroll the resolved negotiation',await option(page,'small discount').isDisabled()&&await option(page,'Lean over').isDisabled());await close(page);
  await page.keyboard.press('j');check('Journal records conversations and check outcomes',(await page.locator('#panel-content').textContent()).includes('Athletics 24, DC 12: success'));await close(page);
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'Restart the awakening',exact:true}).click();check('Restart clears conversation history, rewards and terms',(await snap(page)).economy.conversations.history.length===0&&Object.keys((await snap(page)).economy.terms).length===0);await page.close();
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await setup(mobile,0);await enterStore(mobile);await option(mobile,'Can we discuss').tap();await option(mobile,'Lean over').tap();
  check('Failed Intimidation changes prices and alarms the villagers',(await snap(mobile)).economy.terms.store===1&&(await snap(mobile)).economy.conversations.flags.includes('villagersAlarmed'));
  check('Failure displays the rolled result',(await mobile.locator('.check-result').textContent()).includes('Failure · Intimidation: d20 1 + 4 = 5 · DC 14'));
  check('Failure still leaves trading available',await mobile.getByRole('button',{name:'See the goods',exact:true}).count()===1);
  check('Mobile conversation fits its bottom dock without horizontal scrolling',await mobile.evaluate(()=>{const p=document.getElementById('panel');return p.scrollWidth<=p.clientWidth&&document.documentElement.scrollWidth<=innerWidth;}));
  check('Outcome opens at the top and receives keyboard focus',await mobile.evaluate(()=>document.getElementById('panel-content').scrollTop===0&&document.activeElement.id==='panel-title'));
  await mobile.screenshot({path:path.join(out,'conversation-failure-mobile.png')});await close(mobile);
  await mobile.evaluate(()=>__conversationQA(-25,310));await mobile.waitForTimeout(200);await interact(mobile,'npc:harl');
  check('Spreading alarm increases subsequent Persuasion DC',(await option(mobile,'woke alone').textContent()).includes('DC 14'));
  await option(mobile,'Food, supplies').tap();check('A peaceful reply offers a no-roll follow-up',await option(mobile,'roads and shops').count()===1&&await mobile.locator('.check-result').count()===0);
  await option(mobile,'roads and shops').tap();check('Ordinary answers remain available after a failed check',await mobile.locator('#panel-content').textContent().then(t=>t.includes('woodcutter')));await mobile.close();
  check('No browser errors',report.errors.length===0);fs.writeFileSync(path.join(out,'conversations-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }catch(error){fs.writeFileSync(path.join(out,'conversations-report.json'),JSON.stringify({...report,error:error.message},null,2));throw error;}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
