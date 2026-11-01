const fs=require('fs'),path=require('path');
const {createCanvas,loadImage}=require('C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const dirs=['left','up-left','up','down-left','down'];
(async()=>{for(const id of process.argv.slice(2)){
 const canvas=createCanvas(1280,1700),ctx=canvas.getContext('2d');ctx.fillStyle='#28343e';ctx.fillRect(0,0,1280,1700);ctx.imageSmoothingEnabled=false;
 for(let r=0;r<dirs.length;r++){
  const im=await loadImage(path.join(__dirname,'rigged',id,'walk-'+dirs[r]+'.png'));
  ctx.fillStyle='#ffffff';ctx.font='16px Arial';ctx.fillText(id+' / '+dirs[r],12,r*340+19);
  for(let c=0;c<4;c++){const k=c*(im.height/640);ctx.drawImage(im,k%4*640,Math.floor(k/4)*640,640,640,c*320,r*340+20,320,320);}
 }
 fs.writeFileSync(path.join(__dirname,'rigged',id,'contact-review.png'),canvas.toBuffer('image/png'));
}})();
