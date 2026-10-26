const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'msedge'}),report={checks:[],errors:[]},out=path.join(__dirname,'qa');
 const check=(name,value)=>{assert.ok(value,name);report.checks.push(name);};
 async function prepare(page){
  page.on('pageerror',e=>report.errors.push(e.message));
  // Scenario placement exists only in the test response, never in the shipped game.
  await page.route('**/opening.js',async route=>{const response=await route.fetch();let source=await response.text();
   source=source.replace('if(wake.complete){',"if(wake.complete){relocate({x:village.x-185,y:village.y+218});state.clock=gameClock.advance(600,true);");
   source=source.replace('window.__fenris2d=Object.freeze',"window.__villageQA={place(dx,dy){state.interior=null;state.seated=false;relocate({x:village.x+dx,y:village.y+dy});},injure(){stats.damage(6);},hurtNpc(){characters.get('blacksmith').damage(3);},night(){state.clock=gameClock.advance(14*60,true);refreshTown();},zoom(){renderer.setZoom(-.2);}};window.__fenris2d=Object.freeze");
   await route.fulfill({response,body:source});
  });
  await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__fenris2d);await page.locator('#enable-audio').uncheck();await page.locator('#begin').click();await page.waitForFunction(()=>__fenris2d.snapshot().phase==='explore');
 }
 const snapshot=page=>page.evaluate(()=>__fenris2d.snapshot());
 async function place(page,x,y){await page.evaluate(([x,y])=>__villageQA.place(x,y),[x,y]);await page.waitForTimeout(250);}
 async function interact(page,id){const at=await page.evaluate(id=>{const p=__fenris2d.snapshot().points.find(p=>p.id===id);if(!p)throw Error('Missing '+id);return __fenris2d.worldToScreen(p.x,p.y-26);},id);await page.mouse.click(at.x,at.y);}
 async function close(page){if(await page.locator('#panel').isVisible())await page.locator('#close-panel').click();}
 try{
  const page=await browser.newPage({viewport:{width:1440,height:900}});await prepare(page);
  check('All eleven NPCs and Fenris own persistent sheets',(await snapshot(page)).characters&&Object.keys((await snapshot(page)).characters).length===12);
  check('Visible villagers expose their level-one human stats',(await snapshot(page)).people.every(p=>p.stats.species==='human'&&p.stats.level===1&&p.characterId===p.stats.id));
  check('No guard roles remain',(await snapshot(page)).people.every(p=>!/guard|watch/i.test(p.role)));
  check('Nine buildings and seven outdoor townspeople appear in the morning',(await snapshot(page)).settlement.buildings===9&&(await snapshot(page)).people.length===7);
  await interact(page,'npc:woodcutter');await page.getByRole('button',{name:'Accept the work',exact:true}).click();await close(page);
  check('Woodcutter offers paid work without granting money first',(await snapshot(page)).economy.job==='accepted'&&(await snapshot(page)).economy.copper===0);
  await interact(page,'woodpile');await page.getByRole('button',{name:'Stack the wood',exact:true}).click();await close(page);
  await interact(page,'npc:woodcutter');await page.getByRole('button',{name:'Collect twelve copper',exact:true}).click();await close(page);
  check('Completing the job pays twelve copper',(await snapshot(page)).economy.copper===12);
  await place(page,0,-25);await page.evaluate(()=>__villageQA.zoom());await page.waitForTimeout(300);await page.screenshot({path:path.join(out,'village-square-desktop.png')});
  // Exercise an actual click-to-walk route across the square and through a door.
  await interact(page,'door:store');await page.waitForFunction(()=>__fenris2d.snapshot().location==='store',null,{timeout:12000});
  check('Clicking a shop bauble walks to the door and enters its interior',(await snapshot(page)).location==='store');
  check('World navigation is hidden indoors',await page.locator('#village-nav').isHidden());await page.screenshot({path:path.join(out,'village-interior-desktop.png')});
  await interact(page,'npc:trader');await page.getByRole('button',{name:'See the goods',exact:true}).click();
  await page.locator('.trade-row').filter({hasText:'Clean bandage'}).getByRole('button',{name:'Buy',exact:true}).click();
  check('Buying updates stock, wallet and inventory',(await snapshot(page)).economy.copper===4&&(await snapshot(page)).economy.bag.bandage===1&&(await snapshot(page)).economy.stock.store.bandage===2);
  check('Unaffordable purchases are disabled',await page.locator('.trade-row').filter({hasText:'Clean bandage'}).getByRole('button',{name:'Buy',exact:true}).isDisabled());
  await page.screenshot({path:path.join(out,'village-shop-desktop.png')});await close(page);
  await page.evaluate(()=>__villageQA.injure());await page.keyboard.press('i');await page.getByRole('button',{name:'Use',exact:true}).click();
  check('Pack consumes a bandage and restores five health',(await snapshot(page)).stats.hp===12&&(await snapshot(page)).economy.bag.bandage===0);await close(page);
  await interact(page,'exit');await page.waitForFunction(()=>__fenris2d.snapshot().location==='forest');
  const returned=await snapshot(page);check('Exit restores the exterior door position',Math.abs(returned.position.x-returned.settlement.x-142)<1&&Math.abs(returned.position.y-returned.settlement.y+70)<1);
  for(const [id,dx,dy,keeper] of [['inn',-146,-60,'innkeeper'],['smith',-150,150,'blacksmith'],['apothecary',146,150,'herbalist']]){
   await place(page,dx,dy);await interact(page,'door:'+id);await page.waitForFunction(id=>__fenris2d.snapshot().location===id,id);
   await interact(page,'npc:'+keeper);await page.waitForFunction(()=>document.getElementById('panel').open);
   check(`${id} can be entered and its keeper speaks`,(await page.locator('#panel-content').textContent()).length>80);
   if(id==='smith'){await page.evaluate(()=>__villageQA.hurtNpc());check('Blacksmith uses the shared damage model with his own HP',(await snapshot(page)).characters.blacksmith.hp===7&&(await snapshot(page)).stats.hp===12);}
   if(id==='inn'){await page.getByRole('button',{name:'Sit by the door',exact:true}).click();check('Inn offers the sitting animation',(await snapshot(page)).animation.clip==='sit');await page.keyboard.down('s');await page.waitForTimeout(200);check('Standing transition precedes movement',(await snapshot(page)).animation.clip==='sitToStand'&&!(await snapshot(page)).animation.moving);await page.waitForTimeout(1500);await page.keyboard.up('s');}
   await close(page);await interact(page,'exit');await page.waitForFunction(()=>__fenris2d.snapshot().location==='forest');
  }
  check('NPC health survives leaving the shop',(await snapshot(page)).characters.blacksmith.hp===7);
  await place(page,-38,-135);await interact(page,'door:market');await page.getByRole('button',{name:'See the goods',exact:true}).click();check('Market sells food',await page.locator('.trade-row').filter({hasText:'Apple'}).count()===1);await close(page);
  await place(page,-132,-240);await interact(page,'door:home-a');await page.waitForFunction(()=>document.getElementById('panel').open);check('Residents bar their homes to Fenris',(await page.locator('#panel-content').textContent()).includes('barred'));await close(page);
  await page.evaluate(()=>__villageQA.night());await place(page,142,-60);await interact(page,'door:store');await page.waitForFunction(()=>document.getElementById('panel').open);check('Shops close at night with readable hours',(await page.locator('#panel-content').textContent()).includes('Closed.')&&(await snapshot(page)).people.length===0);await close(page);
  check('Village does not resolve the voices objective',await page.locator('#objective-text').textContent()==='Seek the source of the voices.');
  await page.keyboard.press('Escape');await page.getByRole('button',{name:'Restart the awakening',exact:true}).click();check('Restart restores all NPC health',(await snapshot(page)).characters.blacksmith.hp===10);check('Restart clears job, purchases and wallet',(await snapshot(page)).economy.copper===0&&(await snapshot(page)).economy.job==='available'&&Object.keys((await snapshot(page)).economy.bag).length===0);await page.close();
  const mobile=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await prepare(mobile);await place(mobile,0,-25);await mobile.waitForTimeout(400);await mobile.screenshot({path:path.join(out,'village-mobile.png')});
  check('Mobile HUD fits without horizontal overflow',await mobile.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const bounds=await mobile.locator('#pack').boundingBox();check('Pack button remains on screen',bounds.x>=0&&bounds.x+bounds.width<=390);
  await mobile.locator('#pack').tap();await mobile.waitForFunction(()=>document.getElementById('panel').open);check('Mobile pack opens with empty inventory',(await mobile.locator('#panel-content').textContent()).includes('Your pack is empty.'));await close(mobile);
  await place(mobile,142,-60);await interact(mobile,'door:store');await mobile.waitForFunction(()=>__fenris2d.snapshot().location==='store');await interact(mobile,'npc:trader');await mobile.getByRole('button',{name:'See the goods',exact:true}).click();
  check('Mobile trade labels and buttons fit inside the dialog',await mobile.evaluate(()=>{const panel=document.getElementById('panel');return panel.scrollWidth<=panel.clientWidth&&[...document.querySelectorAll('.trade-row span')].every(el=>el.getBoundingClientRect().width>120);}));
  await mobile.screenshot({path:path.join(out,'village-shop-mobile.png')});await mobile.close();
  check('No browser errors',report.errors.length===0);fs.writeFileSync(path.join(out,'village-report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }catch(error){fs.writeFileSync(path.join(out,'village-report.json'),JSON.stringify({...report,error:error.message},null,2));throw error;}finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
