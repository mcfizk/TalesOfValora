const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),out=path.join(__dirname,'qa'),report={checks:[],errors:[]};
 const check=(name,value)=>{assert.ok(value,name);report.checks.push(name);};
 async function start(page){page.on('pageerror',e=>report.errors.push(e.message));await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__fenris2d);await page.locator('#enable-audio').uncheck();await page.locator('#begin').click();}
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});await start(page);
  await page.waitForFunction(()=>__fenris2d.snapshot().phase==='explore');
  const snapshot=()=>page.evaluate(()=>__fenris2d.snapshot());const initial=await snapshot();
  check('Correct AC and HP reach the game',initial.stats.ac===12&&initial.stats.hp===13&&initial.stats.maxHp===13);
  check('Both resource bars are present with no active class power',await page.locator('#party-panel [role="meter"]').count()===2&&initial.stats.power.active===false);
  check('Health bar shows 13 of 13',await page.locator('#party-panel .health').getAttribute('aria-valuetext')==='13 of 13');
  const box=await page.locator('#party-panel').boundingBox();check('Party portrait is anchored bottom-right',box.x>1100&&box.y>650);
  check('Awakening leaves the clock at 22:00',initial.clock.totalMinutes===1320&&initial.village===null);
  await page.waitForTimeout(500);check('Idle does not advance the clock',(await snapshot()).clock.totalMinutes===initial.clock.totalMinutes);
  const before=await snapshot();await page.keyboard.down('s');await page.waitForTimeout(700);await page.keyboard.up('s');await page.waitForFunction(()=>!__fenris2d.snapshot().animation.moving);const moved=await snapshot();
  check('Actual movement advances game minutes',moved.clock.totalMinutes>before.clock.totalMinutes+.4&&moved.clock.totalMinutes<before.clock.totalMinutes+1.1);
  await page.keyboard.press('Escape');const paused=await snapshot();await page.keyboard.down('s');await page.waitForTimeout(400);await page.keyboard.up('s');check('Paused input cannot advance time',(await snapshot()).clock.totalMinutes===paused.clock.totalMinutes);await page.locator('#close-panel').click();
  const at=await page.evaluate(()=>__fenris2d.worldToScreen(654,646));await page.mouse.click(at.x,at.y);
  await page.waitForFunction(()=>{const p=__fenris2d.snapshot().position;return Math.hypot(p.x-654,p.y-646)<6;},null,{timeout:12000});
  await page.keyboard.down('w');await page.waitForTimeout(700);const blocked=await snapshot();await page.waitForTimeout(450);const stillBlocked=await snapshot();await page.keyboard.up('w');
  check('Holding a movement key against an obstacle does not tick time',Math.abs(stillBlocked.clock.totalMinutes-blocked.clock.totalMinutes)<.05);
  await page.screenshot({path:path.join(out,'party-clock-desktop.png')});
  const party=await page.evaluate(async()=>{
    const {createPartyHud}=await import('./party-hud.js'),{createCharacter}=await import('../stats.js'),{STATS}=await import('../stats-data.js');
    const root=document.createElement('div');document.body.append(root);const hud=createPartyHud(root);
    const a=createCharacter('fenris'),b=createCharacter({...STATS.actors.fenris,id:'test-companion',power:{kind:'mana',max:30,current:30}});
    a.damage(5);b.spendPower(10);hud.update([{id:'fenris',name:'Fenris',portrait:'assets/fenris/portrait.png',stats:a.snapshot()},{id:'test-companion',name:'Test',portrait:'assets/fenris/portrait.png',stats:b.snapshot()}]);
    const result={cards:root.children.length,bars:root.querySelectorAll('[role="meter"]').length,health:root.querySelector('.health').getAttribute('aria-valuenow'),mana:root.querySelector('[data-character="test-companion"] .power').getAttribute('aria-valuenow')};root.remove();return result;
  });
  check('Future party cards independently display health and power',party.cards===2&&party.bars===4&&party.health==='8'&&party.mana==='20');
  await page.close();

  // Speed up only this test's fetched clock module; production remains one game
  // minute per moving second and the unit tests cover the full eight-hour night.
  const dawn=await browser.newPage({viewport:{width:1440,height:900}});
  await dawn.route('**/game-clock.js',async route=>{const response=await route.fetch();const source=(await response.text()).replace('GAME_MINUTES_PER_MOVING_SECOND=1;','GAME_MINUTES_PER_MOVING_SECOND=600;');await route.fulfill({response,body:source});});
  await start(dawn);await dawn.waitForFunction(()=>__fenris2d.snapshot().phase==='explore');
  check('Village is hidden before morning',await dawn.locator('#village-nav').isHidden());
  await dawn.keyboard.down('s');await dawn.waitForFunction(()=>__fenris2d.snapshot().village!==null);await dawn.keyboard.up('s');
  check('Morning reveals a tracked village destination',await dawn.locator('#village-nav').isVisible()&&await dawn.locator('#village-nav').getAttribute('aria-pressed')==='true');
  check('Sun replaces moon at morning',await dawn.locator('#sky-symbol').textContent()==='☀');
  check('Village discovery does not reveal spirits or finish the search',await dawn.locator('#objective-text').textContent()==='Seek the source of the voices.');
  await dawn.screenshot({path:path.join(out,'morning-village-desktop.png')});
  await dawn.locator('#village-nav').click();check('Village tracking can be toggled',await dawn.locator('#village-beacon').isHidden());
  await dawn.locator('#village-nav').click();check('Tracking can be restored',await dawn.locator('#village-beacon').isVisible());
  await dawn.keyboard.press('Escape');await dawn.getByRole('button',{name:'Restart the awakening',exact:true}).click();
  check('Restart resets time, resources and destination discovery',await dawn.evaluate(()=>{const s=__fenris2d.snapshot();return s.clock.time==='22:00'&&s.village===null&&s.stats.hp===13;}));await dawn.close();

  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const mobile=await context.newPage();
  await mobile.route('**/game-clock.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:(await response.text()).replace('GAME_MINUTES_PER_MOVING_SECOND=1;','GAME_MINUTES_PER_MOVING_SECOND=600;')});});
  await start(mobile);await mobile.waitForFunction(()=>__fenris2d.snapshot().phase==='explore');
  const joystick=await mobile.locator('#joystick').boundingBox(),cx=joystick.x+joystick.width/2,cy=joystick.y+joystick.height/2,session=await context.newCDPSession(mobile);
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy}]});await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx,y:cy+30}]});
  await mobile.waitForFunction(()=>__fenris2d.snapshot().village!==null);await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  check('Touch movement advances time and reveals the village',await mobile.locator('#village-nav').isVisible());
  const panel=await mobile.locator('#party-panel').boundingBox(),touch=await mobile.locator('#touch-examine').boundingBox();
  check('Mobile portrait clears touch controls and fits viewport',panel.y+panel.height<touch.y&&panel.x>=0&&panel.x+panel.width<=390&&await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await mobile.screenshot({path:path.join(out,'party-clock-mobile.png')});await context.close();
  check('No browser errors',report.errors.length===0);fs.writeFileSync(path.join(out,'hud-clock-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
