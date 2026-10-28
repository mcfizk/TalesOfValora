// Build the existing flat IIS game layout without publishing tests or source archives.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=__dirname;
function buildSite(){
 const sources=new Map(),add=(relative,file)=>sources.set(relative,fs.readFileSync(path.join(root,file)));
 for(const name of fs.readdirSync(path.join(root,'private-opening')))if(name.endsWith('.js')){
  const source=fs.readFileSync(path.join(root,'private-opening',name),'utf8').replace(/(\bfrom\s*['"])\.\.\//g,'$1./');sources.set(name,Buffer.from(source));
 }
 for(const name of ['audio.js','audio-catalog.js','story.js','stats.js','stats-data.js','resources.js','world-characters.js']){
  const source=fs.readFileSync(path.join(root,name),'utf8').replaceAll('./private-opening/assets/audio/','./assets/audio/');sources.set(name,Buffer.from(source));
 }
 for(const entry of fs.readdirSync(path.join(root,'units'),{recursive:true}))if(entry.endsWith('.js'))add('units/'+entry.replaceAll('\\','/'),'units/'+entry);
 for(const entry of fs.readdirSync(path.join(root,'private-opening/assets'),{recursive:true}))if(/\.(png|mp3)$/.test(entry)||entry==='manifest.json')add('assets/'+entry.replaceAll('\\','/'),'private-opening/assets/'+entry);
 add('opening.css','private-opening/opening.css');
 const digest=crypto.createHash('sha256');for(const [file,data]of [...sources].sort(([a],[b])=>a.localeCompare(b)))digest.update(file).update(data);
 const version=digest.digest('hex').slice(0,12),stamp=new Date().toISOString().replace(/[:.]/g,'-');
 const directory=path.join(root,'backups','site-release-'+stamp);
 fs.mkdirSync(directory,{recursive:true});
 const html=fs.readFileSync(path.join(root,'private-opening/index.html'),'utf8').replace('href="opening.css"',`href="opening.css?v=${version}"`).replace('src="opening.js"',`src="opening.js?v=${version}"`);
 sources.set('index.html',Buffer.from(html));
 sources.set('web.config',Buffer.from('<?xml version="1.0" encoding="UTF-8"?>\n<configuration><system.webServer><staticContent><clientCache cacheControlMode="DisableCache"/><remove fileExtension=".mp3"/><mimeMap fileExtension=".mp3" mimeType="audio/mpeg"/></staticContent></system.webServer></configuration>\n'));
 const files=[];
 for(const [relative,data]of sources){const destination=path.join(directory,relative);fs.mkdirSync(path.dirname(destination),{recursive:true});fs.writeFileSync(destination,data);files.push({path:relative,sha256:crypto.createHash('sha256').update(data).digest('hex')});}
 const release={version,builtAt:new Date().toISOString(),files};fs.writeFileSync(path.join(directory,'release.json'),JSON.stringify(release,null,2)+'\n');
 return {directory,...release};
}
module.exports={buildSite};if(require.main===module){const {directory,version,files}=buildSite();console.log(JSON.stringify({directory,version,files:files.length}));}
