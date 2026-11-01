const fs=require('fs');
function edit(file,fn){fs.writeFileSync(file,fn(fs.readFileSync(file,'utf8')));}
edit('visuals.js',s=>s.replace("fur.repeat.set(2,2)","fur.repeat.set(3,3)").replace("'#d2d4ca'","'#c6c9bf'").replace("'#838b89'","'#b3b8b1'").replace('length*(.5+random()*.8),width=.006+random()*.008','length*(.4+random()*.5),width=.0015+random()*.0025').replace('random()*.55','random()*.3'));
edit('character.js',s=>s.replace("'#d2d1c4'","'#dfded4'").replace('bumpScale:.024','bumpScale:.008').replace("'#a0a7a5'","'#aeb3b1'").replace("'#77563a'","'#c7b29b'"));
edit('main.js',s=>s.replace('camera.position.set(-2,7,11);camera.lookAt(-4,1,1)','camera.position.set(0,6,12);camera.lookAt(-1.5,1,2.5)'));
edit('forest.js',s=>{
s=s.replace("stone=mat('#72756a')","stone=mat('#62655c')").replace("moss=mat('#68764e')","moss=mat('#46523b')");
s=s.replace(" // Open, branching",` const rp=rockGeo.attributes.position;for(let i=0;i<rp.count;i++){const x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i),k=1+Math.sin(x*13+y*7+z*11)*.10+Math.cos(x*6-y*9+z*7)*.08;rp.setXYZ(i,x*k,y*k,z*k);}rockGeo.computeVertexNormals();
 const rockCanvas=document.createElement('canvas');rockCanvas.width=rockCanvas.height=128;const rc=rockCanvas.getContext('2d'),rd=rc.createImageData(128,128);for(let i=0;i<rd.data.length;i+=4){const x=(i/4)%128,y=Math.floor(i/512),v=145+Math.sin(x*.38+y*.2)*12+Math.sin(x*2.13+y*3.7)*25;rd.data[i]=v;rd.data[i+1]=v;rd.data[i+2]=v*.92;rd.data[i+3]=255;}rc.putImageData(rd,0,0);const rockTex=new T.CanvasTexture(rockCanvas);rockTex.wrapS=rockTex.wrapT=T.RepeatWrapping;rockTex.colorSpace=T.SRGBColorSpace;stone.map=rockTex;stone.bumpMap=rockTex;stone.bumpScale=.10;
 // Open, branching`);
s=s.replace('twig<8;twig++','twig<15;twig++').replace('twig/8*reach','twig/15*reach').replace('(1-d/reach)*.24+.025','(1-d/reach)*.13+.012').replace('dx*.15','dx*.07').replace('dz*.15','dz*.07');
const start=s.indexOf(' const bladeGeo='),end=s.indexOf('\n for(let i=0;i<5400',start);
s=s.slice(0,start)+` const bladeGeo=new T.BufferGeometry(),bp=[],bi=[];
 for(let n=0;n<7;n++){const a=n*2.399,dx=Math.cos(a),dz=Math.sin(a),h=.24+(n%4)*.065,w=.014+(n%3)*.005,base=bp.length/3;for(let j=0;j<=4;j++){const t=j/4,bend=t*t*.17;for(const sign of [-1,1])bp.push(dx*bend-dz*sign*w*(1-t),h*t,dz*bend+dx*sign*w*(1-t));if(j<4){const k=base+j*2;bi.push(k,k+1,k+2,k+1,k+3,k+2);}}}bladeGeo.setAttribute('position',new T.Float32BufferAttribute(bp,3));bladeGeo.setIndex(bi);bladeGeo.computeVertexNormals();const grassMat=new T.MeshStandardMaterial({color:'#58654b',side:T.DoubleSide,roughness:1});`+s.slice(end);
return s.replace("color:'#59854d'","color:'#4f6949'");});
