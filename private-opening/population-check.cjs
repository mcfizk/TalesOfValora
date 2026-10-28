const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),report={checks:[],errors:[]};
 try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),snap=()=>page.evaluate(()=>__fenris2d.snapshot());
 page.on('pageerror',e=>report.errors.push(e.message));page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
 const check=(name,ok)=>{assert.ok(ok,name);report.checks.push(name);};
 // Scene setup exists only in the intercepted QA response.
 await page.route('**/opening.js*',async route=>{const response=await route.fetch();let source=await response.text();source=source.replace('window.__fenris2d=Object.freeze',`window.__populationFixture=()=>{state.age=10;state.phase='explore';state.clock=gameClock.load(1920);state.interior=null;relocate({x:world.village.x,y:world.village.y+35});};window.__fenris2d=Object.freeze`);await route.fulfill({response,body:source});});
 await page.goto(process.env.GAME_URL||'http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__fenris2d);await page.locator('#enable-audio').uncheck();await page.locator('#begin').click();await page.getByRole('button',{name:'Start in slot 1',exact:true}).click();await page.waitForFunction(()=>__fenris2d.snapshot().phase==='explore');await page.evaluate(()=>__populationFixture());await page.waitForTimeout(300);
 let s=await snap();check('Village carries the full authored world demographic baseline',JSON.stringify(s.settlement.populationTemplate)===JSON.stringify({human:86,halfling:5,'half-elf':4,dwarf:3,elf:1,other:1}));
 check('Both minority villagers appear in the live village with matching stats',s.people.some(p=>p.characterId==='farmer'&&p.stats.species==='halfling')&&s.people.some(p=>p.characterId==='resident'&&p.stats.species==='dwarf'));
 const prefix=new URL('.',page.url()).href;
 const art=await page.evaluate(async prefix=>{
 const {loadArt}=await import(prefix+'renderer.js'),{ALL_PEOPLE,drawPerson}=await import(prefix+'village-people.js'),{characterFrame}=await import(prefix+'character-animation.js');const art=await loadArt(),results=[];
 const canvas=document.createElement('canvas');canvas.width=900;canvas.height=360;canvas.style='position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:9999;width:min(900px,90vw);background:#20353f;image-rendering:pixelated';document.body.append(canvas);const ctx=canvas.getContext('2d');ctx.imageSmoothingEnabled=false;
 for(const [i,id]of ['harl','resident','farmer'].entries()){
  const p=ALL_PEOPLE.find(p=>p.id===id),c=art.people[id];
  for(const moving of [false,true]){const f=characterFrame({direction:'left',moving,animation:0},c),im=art[f.asset];if(!im?.naturalWidth||f.width!==512)throw Error('Standing/walking did not use installed artwork: '+id);}
  ctx.save();ctx.translate(150+i*300,260);ctx.scale(6,6);drawPerson(ctx,{actorId:id,x:0,y:0,direction:'left',moving:false,animation:0},art);ctx.restore();ctx.fillStyle='#fff';ctx.font='18px system-ui';ctx.fillText(p.name+' · '+p.species,40+i*300,310);results.push({id,species:p.species,height:c.displayHeight});
 }
 return results;
 },prefix);
 check('Standing and walking use the installed art at ancestry-specific heights',art.map(a=>a.height).join(',')==='28,21,16.8');await page.screenshot({path:path.join(__dirname,'qa','village-population.png')});await page.evaluate(()=>document.querySelector('canvas[style*="z-index: 9999"]')?.remove());
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'Save Game',exact:true}).click();await page.reload();await page.waitForFunction(()=>window.__fenris2d);await page.locator('#continue-game').click();await page.getByRole('button',{name:'Continue slot 1',exact:true}).click();s=await snap();
 check('Save and Continue retain stable villagers with the updated identities',s.characters.farmer.species==='halfling'&&s.characters.resident.species==='dwarf'&&s.saveSlot===1);
 check('No browser errors',report.errors.length===0);fs.writeFileSync(path.join(__dirname,'qa','population-report.json'),JSON.stringify({...report,art},null,2));console.log(JSON.stringify({...report,art}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
