const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),report={checks:[],errors:[]};
 const check=(name,value)=>{assert.ok(value,name);report.checks.push(name);};
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(`${r.status()} ${r.url()}`);});
  await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__fenris2d?.snapshot().stats);
  const initial=await page.evaluate(()=>__fenris2d.snapshot().stats);
  check('Current 2D opening loads the CSV-defined Fenris sheet',initial.id==='fenris'&&initial.level===1&&initial.hp===initial.maxHp&&Object.keys(initial.abilities).length===6);
  check('Stats snapshots cannot modify the live sheet',await page.evaluate(()=>{const s=__fenris2d.snapshot().stats;s.hp=0;s.abilities.str.score=30;return __fenris2d.snapshot().stats.hp>0&&__fenris2d.snapshot().stats.abilities.str.score!==30;}));
  await page.locator('#enable-audio').uncheck();await page.locator('#begin').click();await page.waitForFunction(()=>__fenris2d.snapshot().phase==='explore');
  const before=await page.evaluate(()=>__fenris2d.snapshot());await page.keyboard.down('s');await page.waitForTimeout(400);await page.keyboard.up('s');
  const after=await page.evaluate(()=>__fenris2d.snapshot());
  check('Exploration still moves and does not spend HP or award XP',after.position.y>before.position.y+10&&JSON.stringify(after.stats)===JSON.stringify(initial));
  check('Opening audio preferences survive consolidation',!after.audio.speechEnabled&&after.audio.windVolume===.5);
  check('The extended search remains the objective',await page.locator('#objective-text').textContent()==='Seek the source of the voices.');
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'Restart the awakening',exact:true}).click();
  check('Restart returns a fresh full-health sheet and sleeping Fenris',await page.evaluate(()=>{const s=__fenris2d.snapshot();return s.stats.hp===s.stats.maxHp&&s.stats.xp===0&&s.animation.clip==='sleep'&&s.distance===0;}));
  const legacy=await browser.newPage();legacy.on('pageerror',e=>report.errors.push(e.message));
  await legacy.goto('http://127.0.0.1:8766/index.html');await legacy.waitForFunction(()=>window.__fenris?.snapshot().stats);
  check('Both renderers use the same approved starting data',JSON.stringify(await legacy.evaluate(()=>__fenris.snapshot().stats))===JSON.stringify(initial));
  check('No browser or asset errors',report.errors.length===0);
  fs.writeFileSync(path.join(__dirname,'qa','stats-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
