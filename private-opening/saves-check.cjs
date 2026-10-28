const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),report={checks:[],errors:[]};
 const check=(label,ok)=>{assert.ok(ok,label);report.checks.push(label);};
 const snap=page=>page.evaluate(()=>__fenris2d.snapshot());
 try{
  const context=await browser.newContext(),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
  // Rich state is injected only in this test response, never in the shipped game.
  await page.route('**/opening.js',async route=>{const response=await route.fetch();let source=await response.text();source=source.replace('window.__fenris2d=Object.freeze',`window.__saveFixture=()=>{
   stats.damage(4);characters.unit('fenris').remember({id:'test-memory',text:'Remembered a deer.'});characters.unit('woodcutter').setAffinity('fenris',2);
   state.clock=gameClock.advance(600,true);state.village={...village};state.visitedVillage=true;
   state.found.add('test-note');state.notes.set('test-note',{title:'Test note',text:'A familiar crossing.'});
   const data=town.serialize();data.economy.copper=9;data.economy.bag.bread=2;data.economy.stock.store.bread=2;data.economy.harvested=['test-stump'];data.economy.drank=[2];data.economy.job='paid';town.load(data);
   state.interior=makeInterior(world.village.buildings.find(b=>b.id==='store'));relocate({x:120,y:150});
  };window.__fenris2d=Object.freeze`);await route.fulfill({response,body:source});});
  await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__fenris2d);
  check('Continue is disabled with no saves',await page.locator('#continue-game').isDisabled());
  await page.locator('#begin').click();check('New Game offers exactly three slots',await page.locator('.save-slot').count()===3);await page.locator('#close-panel').click();
  check('Cancelling slot selection leaves the title intact',(await snap(page)).phase==='title');
  await page.locator('#enable-audio').uncheck();await page.locator('#begin').click();await page.getByRole('button',{name:'Start in slot 1',exact:true}).click();await page.waitForFunction(()=>__fenris2d.snapshot().phase==='explore');
  await page.evaluate(()=>__saveFixture());await page.keyboard.press('Escape');await page.getByRole('button',{name:'Save Game',exact:true}).click();
  const original=await snap(page),raw=await page.evaluate(()=>JSON.parse(localStorage.getItem('tales-of-valora:save:1')));
  check('A selected slot is saved with the full journey',raw.data.town.economy.harvested.includes('test-stump')&&raw.data.visitedVillage&&raw.data.interior==='store');
  await page.reload();await page.waitForFunction(()=>window.__fenris2d);check('Continue is enabled after a reload',await page.locator('#continue-game').isEnabled());
  await page.locator('#continue-game').click();check('Empty slots cannot be continued',await page.getByRole('button',{name:'Continue slot 2',exact:true}).isDisabled());await page.getByRole('button',{name:'Continue slot 1',exact:true}).click();
  const restored=await snap(page);
  check('Continue restores forest seed, interior, position and game clock',restored.world.seed===original.world.seed&&restored.location==='store'&&restored.position.x===original.position.x&&restored.position.y===original.position.y&&restored.clock.totalMinutes===original.clock.totalMinutes);
  check('Continue restores health, inventory, shop stock, journal and memories',restored.stats.hp===9&&restored.economy.copper===9&&restored.economy.bag.bread===2&&restored.economy.stock.store.bread===2&&restored.found.includes('test-note')&&restored.units.fenris.memories.some(m=>m.id==='test-memory')&&restored.units.woodcutter.affinity.fenris===2);
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'Save and return to title',exact:true}).click();
  await page.locator('#begin').click();await page.getByRole('button',{name:'Start in slot 2',exact:true}).click();
  check('A second slot starts a fresh independent game',(await snap(page)).stats.hp===13&&(await snap(page)).saveSlot===2&&(await snap(page)).units.fenris.memories.length===0);
  check('Starting slot two preserves slot one',await page.evaluate(()=>JSON.parse(localStorage.getItem('tales-of-valora:save:1')).data.town.economy.copper===9));
  await page.keyboard.press('Escape');await page.locator('#panel-content').getByRole('button',{name:'New Game',exact:true}).click();await page.getByRole('button',{name:'Start in slot 1',exact:true}).click();
  check('An occupied slot requires explicit replacement',await page.getByRole('button',{name:'Replace slot 1',exact:true}).isVisible());await page.getByRole('button',{name:'Cancel',exact:true}).click();await page.locator('#close-panel').click();
  check('Cancelling replacement preserves both the running game and saved slot',(await snap(page)).saveSlot===2&&await page.evaluate(()=>JSON.parse(localStorage.getItem('tales-of-valora:save:1')).data.town.economy.copper===9));
  await page.keyboard.press('Escape');await page.locator('#panel-content').getByRole('button',{name:'New Game',exact:true}).click();await page.getByRole('button',{name:'Start in slot 1',exact:true}).click();await page.getByRole('button',{name:'Replace slot 1',exact:true}).click();
  check('Confirmed replacement resets only the chosen slot',(await snap(page)).saveSlot===1&&await page.evaluate(()=>JSON.parse(localStorage.getItem('tales-of-valora:save:1')).data.town.economy.copper===0&&!!localStorage.getItem('tales-of-valora:save:2')));
  await page.evaluate(()=>localStorage.setItem('tales-of-valora:save:3','broken'));await page.reload();await page.waitForFunction(()=>window.__fenris2d);await page.locator('#continue-game').click();check('A damaged slot does not block valid saves',await page.getByRole('button',{name:'Continue slot 3',exact:true}).isDisabled()&&await page.getByRole('button',{name:'Continue slot 2',exact:true}).isEnabled());
  await page.screenshot({path:path.join(__dirname,'qa','save-slots-desktop.png')});
  const mobileContext=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,storageState:await context.storageState()}),mobile=await mobileContext.newPage();await mobile.goto('http://127.0.0.1:8766/');await mobile.waitForFunction(()=>window.__fenris2d);await mobile.locator('#continue-game').click();
  check('Mobile slot selection fits the viewport',await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.getElementById('panel').scrollWidth<=document.getElementById('panel').clientWidth));await mobile.screenshot({path:path.join(__dirname,'qa','save-slots-mobile.png')});
  check('No browser errors',report.errors.length===0);fs.writeFileSync(path.join(__dirname,'qa','saves-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
