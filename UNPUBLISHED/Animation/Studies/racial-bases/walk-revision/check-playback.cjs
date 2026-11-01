const path=require('path'),fs=require('fs'),assert=require('assert/strict'),{pathToFileURL}=require('url');
const {chromium}=require('C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true}),page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(__dirname,'../index.html')).href);await page.waitForFunction(()=>review.ready);
 for(const direction of ['left','right','up-left','up-right','up','down-left','down-right','down']){await page.selectOption('#clip','walk-'+direction);for(const time of [0,.25,.5,.75,.9375,1]){await page.evaluate(t=>review.setTime(t),time);const statuses=await page.locator('.status').allTextContents();assert.equal(statuses.filter(x=>x.includes('/ 16')).length,4);assert.equal(statuses.filter(x=>x.startsWith('Static base')).length,2);}}
 await page.selectOption('#clip','walk-left');await page.evaluate(()=>review.setTime(0));await page.click('#step');const afterStep=await page.locator('.status').allTextContents();assert.equal(afterStep.filter(x=>x.includes('2 / 16')).length,4);
 await page.evaluate(()=>review.setTime(.25));await page.screenshot({path:path.join(__dirname,'comparison-review.png'),fullPage:true});
 await page.goto(pathToFileURL(path.join(__dirname,'preview.html')).href);await page.waitForFunction(()=>review.ready);
 for(const direction of ['left','right','up-left','up-right','up','down-left','down-right','down']){await page.selectOption('#direction',direction);await page.evaluate(()=>review.setTime(.9375));const statuses=await page.locator('.status').allTextContents();assert.equal(statuses.filter(x=>x==='Frame 16 / 16').length,4);assert.equal(statuses.filter(x=>x==='Frame 8 / 8').length,4);}
 await page.selectOption('#direction','left');await page.evaluate(()=>review.setTime(0));await page.click('#step');assert.equal((await page.locator('.status').allTextContents()).filter(x=>x==='Frame 2 / 16').length,4);
 await page.screenshot({path:path.join(__dirname,'before-after-review.png'),fullPage:true});assert.deepEqual(errors,[]);await browser.close();
 const report={directions:8,comparisonCharacters:7,revisedCharacters:4,walkFrames:16,frameStepping:true,beforeAfter:true,pageErrors:errors};fs.writeFileSync(path.join(__dirname,'playback-validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1});
