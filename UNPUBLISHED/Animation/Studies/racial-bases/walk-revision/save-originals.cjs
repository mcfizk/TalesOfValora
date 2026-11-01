const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),ids=['dwarf-male','dwarf-female','halfling-male','halfling-female'];
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const auditFile=path.join(__dirname,'originals','snapshot.json');
if(fs.existsSync(auditFile)){console.log('Original snapshot already saved; preserved.');process.exit(0)}
const audit={walks:{},preserved:{}};
for(const id of ids){const dest=path.join(__dirname,'originals',id);fs.mkdirSync(dest,{recursive:true});for(const name of fs.readdirSync(path.join(root,id))){const file=path.join(root,id,name);if(!fs.statSync(file).isFile())continue;if(name.startsWith('walk-')&&name.endsWith('.png')||['animations.json','validation.json','preview.html'].includes(name)){fs.copyFileSync(file,path.join(dest,name));audit.walks[id+'/'+name]=hash(file);}else if(name.endsWith('.png')&&!name.startsWith('preview-'))audit.preserved[id+'/'+name]=hash(file);}}
fs.writeFileSync(auditFile,JSON.stringify(audit,null,2));console.log({backedUp:Object.keys(audit.walks).length,preservedImages:Object.keys(audit.preserved).length});
