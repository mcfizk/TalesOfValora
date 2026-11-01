const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {PNG}=require('C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pngjs');
const root=__dirname,read=f=>JSON.parse(fs.readFileSync(path.join(root,f),'utf8').replace(/^\uFEFF/,''));
const progress=read('progress.json'),records=[],audit={characters:[],totalSheets:0,totalFrames:0};
const hash=d=>crypto.createHash('sha256').update(d).digest('hex');
function frame(im,k,cols){const d=Buffer.alloc(640*640*4),ox=k%cols*640,oy=Math.floor(k/cols)*640;for(let y=0;y<640;y++)im.data.copy(d,y*640*4,((oy+y)*im.width+ox)*4,((oy+y)*im.width+ox+640)*4);return d;}
for(const p of progress.characters){
 const config=read(p.id+'/animations.json'),validation=read(p.id+'/validation.json'),meta={};
 for(const key of ['idle','sleep','sit','sleepToSit','sitToStand'])meta[key]=config[key];
 Object.assign(meta,config.additionalClips);
 for(const [dir,file]of Object.entries(config.walk.files))meta['walk-'+dir]={...config.walk,file};
 const clips={},fileHashes={};
 for(const [name,s]of Object.entries(meta)){
  const bytes=fs.readFileSync(path.join(root,p.id,s.file)),im=PNG.sync.read(bytes,{checkCRC:true});
  if(im.width!==640*s.columns||im.height!==640*Math.ceil(s.frames/s.columns))throw Error(p.id+' dimensions '+name);
  let clear=0,opaque=0;for(let i=3;i<im.data.length;i+=4){if(im.data[i]===0)clear++;else if(im.data[i]===255)opaque++;else throw Error('Partial alpha '+name)}
  if(!clear||!opaque)throw Error('Missing transparency or image content');
  clips[name]=Array.from({length:s.frames},(_,k)=>frame(im,k,s.columns));
  fileHashes[s.file]=hash(bytes);audit.totalSheets++;audit.totalFrames+=s.frames;
 }
 for(const [a,b]of [['left','right'],['up-left','up-right'],['down-left','down-right']])for(let k=0;k<config.walk.frames;k++){
  const x=clips['walk-'+a][k],y=clips['walk-'+b][k];for(let row=0;row<640;row++)for(let col=0;col<640;col++){const i=(row*640+col)*4,j=(row*640+639-col)*4;if(x.readUInt32LE(i)!==y.readUInt32LE(j))throw Error('Mirror mismatch '+p.id);}
 }
 const equal=(a,b)=>{if(!a.equals(b))throw Error('Endpoint mismatch '+p.id)};
 equal(clips.sleep[0],clips.sleepToSit[0]);equal(clips.sit[0],clips.sleepToSit.at(-1));equal(clips.sit[0],clips.sitToStand[0]);equal(clips.idle[0],clips.sitToStand.at(-1));
 for(const [a,b]of [['sleepToSit','sitToSleep'],['sitToStand','standToSit']])clips[a].forEach((f,k)=>equal(f,clips[b].at(-1-k)));
 audit.characters.push({id:p.id,sheets:Object.keys(meta).length,frameCount:Object.values(meta).reduce((n,s)=>n+s.frames,0),frameSize:[640,640],binaryAlpha:true,exactMirrors:true,sharedEndpoints:true,exactReverseTransitions:true,contractValid:validation.sharedContractValid,fileHashes});
 records.push({id:p.id,label:p.label,ratio:p.ratio,meta});p.status='complete-review-ready';
}
fs.writeFileSync(path.join(root,'validation-summary.json'),JSON.stringify(audit,null,2)+'\n');
progress.status='complete-review-ready';progress.resumeNotes=['All four walks rebuilt with the user-approved sprite rig: 16 distinct frames per direction at 16 fps. Original walks retained under walk-revision/originals. Rest artwork preserved. Review walking at game movement speed before integration.'];
fs.writeFileSync(path.join(root,'progress.json'),JSON.stringify(progress,null,2)+'\n');
require('./preview-page.cjs')(root,records);
console.log(JSON.stringify({characters:audit.characters.length,sheets:audit.totalSheets,frames:audit.totalFrames,validated:true}));
