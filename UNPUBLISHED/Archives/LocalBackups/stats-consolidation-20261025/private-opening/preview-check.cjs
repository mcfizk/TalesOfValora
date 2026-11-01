const {chromium}=require('C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs=require('node:fs');const path=require('node:path');
(async()=>{
  const out=path.join(__dirname,'qa');fs.mkdirSync(out,{recursive:true});
  const browser=await chromium.launch({headless:true,channel:'msedge'});
  const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
  await page.goto('http://127.0.0.1:8766/');await page.waitForFunction(()=>window.__fenris2d);
  await page.screenshot({path:path.join(out,'title.png')});
  await page.locator('#enable-audio').uncheck();await page.locator('#begin').click();
  await page.waitForFunction(()=>__fenris2d.snapshot().phase==='explore');
  await page.screenshot({path:path.join(out,'scene.png')});
  console.log(JSON.stringify({url:page.url(),snapshot:await page.evaluate(()=>__fenris2d.snapshot()),errors}));
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
