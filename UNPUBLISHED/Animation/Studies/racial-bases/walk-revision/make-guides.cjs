// Pose diagrams are animation instructions, not replacement sprite artwork.
const fs=require('fs'),path=require('path');
const {createCanvas}=require('C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const phases=['1 CONTACT A','2 DOWN A','3 PASS B','4 UP / REACH B','5 CONTACT B','6 DOWN B','7 PASS A','8 UP / REACH A'];
const forward=[72,38,0,-38,-72,-42,0,48],lift=[0,0,0,0,5,48,65,32],bob=[0,7,0,-5,0,7,0,-5];
const dirs={left:{f:[-1,0],r:[.28,.12]},'up-left':{f:[-.72,-.40],r:[.65,-.18]},up:{f:[0,-.50],r:[1,0]},'down-left':{f:[-.72,.40],r:[.65,.18]},down:{f:[0,.50],r:[1,0]}};
for(const [dir,{f,r}]of Object.entries(dirs)){
 const c=createCanvas(2048,1024),g=c.getContext('2d');g.fillStyle='#f1f2ed';g.fillRect(0,0,2048,1024);
 for(let k=0;k<8;k++){g.save();g.translate(k%4*512,Math.floor(k/4)*512);g.fillStyle='#17242a';g.font='bold 21px sans-serif';g.fillText(phases[k],24,30);g.font='16px sans-serif';g.fillText('CYAN = same near leg; ORANGE = other leg',20,55);
 const project=(side,front,z)=>[256+r[0]*side+f[0]*front,460+r[1]*side+f[1]*front-z];
 const stroke=(pts,color,width)=>{g.strokeStyle=color;g.lineWidth=width;g.lineCap='round';g.lineJoin='round';g.beginPath();pts.forEach((p,i)=>i?g.lineTo(...p):g.moveTo(...p));g.stroke()};
 g.strokeStyle='#a0a8a9';g.lineWidth=2;g.beginPath();g.moveTo(75,460);g.lineTo(435,460);g.stroke();
 for(const [side,offset,col]of [[-35,4,'#dd7b24'],[35,0,'#119cb2']]){const q=(k+offset)%8,hip=project(side,0,165-bob[k]),foot=project(side,forward[q],lift[q]),knee=project(side,forward[q]*.48+18,85+lift[q]*.35-bob[k]*.5);stroke([hip,knee,foot],col,20);stroke([foot,[foot[0]+f[0]*34,foot[1]+f[1]*34]],col,15);}
 const h=project(0,0,165-bob[k]),s=project(0,0,280-bob[k]);stroke([h,s],'#65767d',72);const head=project(0,3,335-bob[k]);g.fillStyle='#65767d';g.beginPath();g.ellipse(head[0],head[1],34,42,0,0,Math.PI*2);g.fill();stroke([head,[head[0]+f[0]*45,head[1]+f[1]*26]],'#65767d',14);
 for(const [side,offset,col]of [[-70,4,'#dd7b24'],[70,0,'#119cb2']]){const q=(k+offset)%8,armFront=-forward[q]*.64,shoulder=project(side,0,270-bob[k]),elbow=project(side,armFront*.5,218-bob[k]),hand=project(side,armFront,168-bob[k]);stroke([shoulder,elbow,hand],col,15)}
 g.fillStyle='#17242a';g.font='16px sans-serif';g.fillText(dir+' facing throughout — feet exchange roles',65,499);g.restore();
 }fs.writeFileSync(path.join(__dirname,'guide-'+dir+'.png'),c.toBuffer('image/png'));
}
