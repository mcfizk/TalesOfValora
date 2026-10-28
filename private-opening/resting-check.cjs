const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),report={checks:[],errors:[]};
 try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),snap=()=>page.evaluate(()=>__fenris2d.snapshot());
 page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
 const check=(name,ok)=>{assert.ok(ok,name);report.checks.push(name);};
 const choose=async pattern=>{await page.keyboard.press('t');await page.getByRole('button',{name:pattern}).click();};
 const done=async()=>page.waitForFunction(()=>!__fenris2d.snapshot().waiting,null,{timeout:15000});
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__fenris2d);await page.locator('#enable-audio').uncheck();await page.locator('#begin').click();await page.getByRole('button',{name:'Start in slot 1',exact:true}).click();await page.waitForFunction(()=>__fenris2d.snapshot().phase==='explore');
 const base=await snap();await choose(/^Wait 4 hours /);await done();let s=await snap();
 check('Waiting over an hour applies Restless to live stats',s.rest.waitPenalty&&s.stats.passivePerception===base.stats.passivePerception-1&&s.stats.initiative===base.stats.initiative-1);
 await choose(/^Short rest /);await done();s=await snap();check('Completed short rest clears Restless and records a new rest deadline',!s.rest.waitPenalty&&s.rest.completed.short===1&&s.rest.lastRestAt===s.clock.totalMinutes&&s.stats.passivePerception===base.stats.passivePerception);
 await choose(/^Sleep · /);await page.waitForTimeout(300);s=await snap();check('Sleep plays the sleeping animation',s.waiting.kind==='sleep'&&s.animation.clip==='sleep');
 await done();s=await snap();check('Sleep completes and uses the waking transition',s.rest.completed.sleep===1&&s.animation.clip==='sleepToSit');
 await page.keyboard.press('t');check('Sleep and long rest share one cooldown',await page.getByRole('button',{name:/^Sleep · /}).isDisabled()&&await page.getByRole('button',{name:/^Long rest /}).isDisabled()&&await page.getByRole('button',{name:/^Short rest /}).isEnabled());await page.getByRole('button',{name:'Cancel',exact:true}).click();
 for(let i=0;i<3;i++){await choose(/^Wait 8 hours /);await done();}
 s=await snap();check('24 hours without a completed rest applies stacking exhaustion',s.rest.exhausted&&s.rest.waitPenalty&&s.stats.passivePerception===base.stats.passivePerception-3&&Math.abs(s.stats.speed-base.stats.speed*.8)<1e-6);
 await page.keyboard.press('t');await page.screenshot({path:path.join(__dirname,'qa','rest-fatigue-desktop.png')});
 check('The rest menu explains active deficits and unlocks at 24 hours',await page.getByRole('button',{name:/^Long rest /}).isEnabled()&&(await page.locator('#panel-content').textContent()).includes('Exhausted:'));
 await page.getByRole('button',{name:/^Short rest /}).click();await done();s=await snap();check('Short rest resets the timer but existing exhaustion needs sleep or long rest',s.rest.exhausted&&!s.rest.waitPenalty&&s.stats.passivePerception===base.stats.passivePerception-2);
 await page.keyboard.press('Escape');const saved=await snap();await page.reload();await page.waitForFunction(()=>window.__fenris2d);await page.locator('#continue-game').click();await page.getByRole('button',{name:'Continue slot 1',exact:true}).click();s=await snap();
 check('Saving and loading retains exhaustion and rest history',s.rest.exhausted&&s.rest.completed.short===2&&s.stats.passivePerception===saved.stats.passivePerception&&s.rest.lastSleepStart===saved.rest.lastSleepStart);
 await choose(/^Long rest /);await done();s=await snap();check('Long rest clears both deficits without healing yet',!s.rest.exhausted&&!s.rest.waitPenalty&&s.rest.completed.long===1&&s.stats.passivePerception===base.stats.passivePerception&&s.stats.speed===base.stats.speed&&s.stats.hp===base.stats.hp);
 await page.setViewportSize({width:390,height:844});await page.keyboard.press('t');check('Phone rest options fit horizontally and remain scrollable',await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.getElementById('panel').scrollWidth<=document.getElementById('panel').clientWidth));await page.getByRole('button',{name:'Cancel',exact:true}).scrollIntoViewIfNeeded();await page.screenshot({path:path.join(__dirname,'qa','rest-mobile.png')});
 check('No browser errors',report.errors.length===0);fs.writeFileSync(path.join(__dirname,'qa','resting-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
