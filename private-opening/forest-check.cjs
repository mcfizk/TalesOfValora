const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const out=path.join(__dirname,'qa'),report={checks:[],errors:[]};fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,channel:'msedge'});
 const check=(name,value)=>{assert.ok(value,name);report.checks.push(name);};
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>report.errors.push(e.message));
  // Fix only the world seed to make this browser test repeatable.
  await page.addInitScript(()=>{const original=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=a=>a instanceof Uint32Array&&a.length===1?(a[0]=1468,a):original(a);});
  await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__fenris2d);
  await page.locator('#enable-audio').uncheck();await page.locator('#begin').click();
  await page.waitForFunction(()=>__fenris2d.snapshot().voices.includes('first'));
  check('Voices begin while Fenris is still asleep',await page.evaluate(()=>__fenris2d.snapshot().animation.clip==='sleep'));
  check('Opening subtitle is above the waking veil',await page.locator('#subtitles').isVisible());
  await page.waitForFunction(()=>__fenris2d.snapshot().phase==='explore');
  check('First objective seeks the voices',await page.locator('#objective-text').textContent()==='Seek the source of the voices.');
  check('Floating E prompt and object label are removed',await page.locator('#interaction, #interaction-label, #examine').count()===0);
  const ember=await page.evaluate(()=>__fenris2d.worldToScreen(654,614-26));await page.mouse.click(ember.x,ember.y);
  await page.waitForFunction(()=>__fenris2d.snapshot().found.includes('embers'),null,{timeout:15000});
  check('Clicking a bauble approaches and examines the object',await page.locator('#panel-title').textContent()==='Dying embers');
  await page.locator('#close-panel').click();
  const candidate=await page.evaluate(()=>{
    const s=__fenris2d.snapshot();return s.points.filter(p=>p.id.includes(':')).map(p=>({...p,screen:__fenris2d.worldToScreen(p.x,p.y-26)})).filter(p=>p.screen.x>400&&p.screen.x<innerWidth-100&&p.screen.y>270&&p.screen.y<innerHeight-150).sort((a,b)=>Math.hypot(a.x-s.position.x,a.y-s.position.y)-Math.hypot(b.x-s.position.x,b.y-s.position.y))[0];
  });
  assert.ok(candidate,'Generated object is visible near the opening');
  // Approach before clicking: the party portrait can cover a distant bauble.
  const approach=await page.evaluate(p=>{const s=__fenris2d.snapshot(),x=(s.position.x+p.x)/2,y=(s.position.y+p.y)/2;return{x,y,screen:__fenris2d.worldToScreen(x,y)};},candidate);
  await page.mouse.click(approach.screen.x,approach.screen.y);
  await page.waitForFunction(p=>{const s=__fenris2d.snapshot();return Math.hypot(s.position.x-p.x,s.position.y-p.y)<6;},approach,{timeout:15000});
  await page.waitForTimeout(350);
  const target=await page.evaluate(p=>__fenris2d.worldToScreen(p.x,p.y-26),candidate);await page.mouse.click(target.x,target.y);
  await page.waitForFunction(id=>__fenris2d.snapshot().found.includes(id),candidate.id,{timeout:15000}).catch(async error=>{console.error(JSON.stringify({candidate,errors:report.errors}));await page.screenshot({path:path.join(out,'forest-failure.png')});throw error;});
  check('A generated forest object can be examined',await page.locator('#panel').isVisible());await page.locator('#close-panel').click();
  await page.keyboard.press('j');check('Journal retains the generated discovery',await page.locator('#panel-content h3').count()===2);await page.locator('#close-panel').click();
  check('Discoveries do not complete the search',!(await page.locator('#objective').textContent()).includes('complete'));
  check('Spirit identity is not revealed in visible text',!(/spirits?/i.test(await page.locator('body').innerText())));
  await page.screenshot({path:path.join(out,'endless-forest-interactions.png')});
  const bank=await page.evaluate(async()=>{const w=await import('./world.js'),p=__fenris2d.snapshot().position,y=p.y+50,x=w.riverX(y)-38;return{x,y,screen:__fenris2d.worldToScreen(x,y)};});
  await page.mouse.click(bank.screen.x,bank.screen.y);
  await page.waitForFunction(p=>{const s=__fenris2d.snapshot();return Math.hypot(s.position.x-p.x,s.position.y-p.y)<6;},bank,{timeout:15000});
  await page.keyboard.down('d');await page.waitForFunction(()=>__fenris2d.snapshot().world.inWater);
  const wetStart=await page.evaluate(()=>__fenris2d.snapshot());await page.waitForTimeout(500);const wetEnd=await page.evaluate(()=>__fenris2d.snapshot());
  await page.keyboard.up('d');
  const measured=(wetEnd.position.x-wetStart.position.x)/(wetEnd.age-wetStart.age);
  check('Actual keyboard movement wades at 20.4 pixels per second',Math.abs(measured-68*.3)<.5);
  check('Wading is shown in the character state',await page.locator('#character-state').textContent()==='Wading');
  report.wadingSpeed=measured;
  await page.keyboard.down('d');await page.waitForFunction(()=>!__fenris2d.snapshot().world.inWater);await page.keyboard.up('d');
  check('Fenris exits the stream on the opposite bank',await page.evaluate(async()=>{const w=await import('./world.js'),s=__fenris2d.snapshot();return s.position.x>w.riverX(s.position.y)+22&&s.world.movementScale===1;}));
  await page.close();

  // Exercise the production renderer/world far beyond the old map, without a
  // teleport control in the game or a mutation API exposed to players.
  const terrain=await browser.newPage({viewport:{width:1440,height:900}});
  terrain.on('pageerror',e=>report.errors.push(e.message));
  await terrain.route('**/opening.js',r=>r.fulfill({contentType:'text/javascript',body:''}));
  await terrain.goto('http://127.0.0.1:8766/private-opening/');
  await terrain.evaluate(async()=>{
    const w=await import('./world.js'),r=await import('./renderer.js');const art=await r.loadArt(),canvas=document.querySelector('#forest');document.body.replaceChildren(canvas);
    const world=w.makeWorld(1468),renderer=r.createRenderer(canvas,art,world);
    const state={phase:'explore',time:0,reduced:true,found:new Set(),destination:null,player:{...w.SPAWN,direction:'left',moving:false,running:false,animation:0,action:null}};
    window.testForest={w,world,renderer,state,draw(x,y){state.player.x=x;state.player.y=y;renderer.render(state,1);return{view:renderer.snapshot(),chunks:world.chunks.size,trees:world.trees.length};}};
  });
  const results=await terrain.evaluate(()=>{
    const t=testForest,first=t.draw(-5000,-4000),canvas=document.querySelector('#forest'),original=canvas.toDataURL();let maxChunks=0,maxTiles=0;
    for(let i=1;i<=70;i++){const s=t.draw(i*1500,-i*900);maxChunks=Math.max(maxChunks,s.chunks);maxTiles=Math.max(maxTiles,s.view.groundTiles);}
    const last=t.draw(-5000,-4000);return{first,last,maxChunks,maxTiles,identical:original===canvas.toDataURL()};
  });
  check('Camera follows beyond old bounds and into negative coordinates',results.first.view.camera.x===-5000&&results.first.view.camera.y===-4028);
  check('Terrain and texture caches remain bounded over long travel',results.maxChunks<=36&&results.maxTiles<=36);
  check('Returning to a distant area renders identically',results.identical);
  report.streaming=results;
  for(const type of ['grove','fern','rocky','clearing']){
    const point=await terrain.evaluate(type=>{for(let y=-6000;y<6000;y+=180)for(let x=-6000;x<6000;x+=180)if(testForest.w.terrainAt(x,y,1468)===type&&!testForest.w.inWater(x,y))return{x,y};},type);
    await terrain.evaluate(p=>testForest.draw(p.x,p.y),point);await terrain.screenshot({path:path.join(out,`forest-${type}.png`)});
  }
  await terrain.evaluate(()=>testForest.draw(testForest.w.riverX(352),352));await terrain.screenshot({path:path.join(out,'forest-wading.png')});
  check('Wading renderer uses the same water mask',await terrain.evaluate(()=>testForest.w.movementScale(testForest.state.player.x,testForest.state.player.y)===.3));
  await terrain.close();
  check('No browser errors',report.errors.length===0);
  fs.writeFileSync(path.join(out,'forest-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
