const fs=require('fs'),root=__dirname;
let v=fs.readFileSync(root+'/visuals.js','utf8').replace('idx.push(a,b,a+1,a+1,b,b+1)','idx.push(a,a+1,b,a+1,b+1,b)');fs.writeFileSync(root+'/visuals.js',v);
let f=fs.readFileSync(root+'/forest.js','utf8').replace('buildForest(scene)','buildForest(scene,assets)');
f=f.replace(/ \/\/ Code-generated surface detail:[\s\S]*? function instance/,` const groundTexture=assets.ground,barkTexture=assets.bark;bark.map=barkTexture;bark.bumpMap=barkTexture;bark.bumpScale=.12;barkLight.map=barkTexture;barkLight.bumpMap=barkTexture;barkLight.bumpScale=.1;needle.side=needleLight.side=T.DoubleSide;
 function instance`);
f=f.replace("new T.CylinderGeometry(.65,1,1,8)","new T.CylinderGeometry(.65,1,1,16,8)").replace('new T.IcosahedronGeometry(1,1)','new T.IcosahedronGeometry(1,2)');
f=f.replace(" const groundGeo=",` // Open, branching pine crowns replace the solid cones.
 const crownGeo=new T.BufferGeometry(),cp=[],ci=[];
 function tri(a,b,c){const n=cp.length/3;cp.push(...a,...b,...c);ci.push(n,n+1,n+2);}
 for(let level=0;level<5;level++){const y=-.44+level*.2,reach=1-level*.16;for(let arm=0;arm<6;arm++){const a=arm*Math.PI/3+level*.83,dx=Math.sin(a),dz=Math.cos(a);for(let twig=1;twig<8;twig++){const d=twig/8*reach,bx=dx*d,bz=dz*d,by=y+Math.sin(d*2)*.10,w=(1-d/reach)*.24+.025;for(const side of [-1,1]){const tx=bx+Math.sin(a+side*.85)*w,tz=bz+Math.cos(a+side*.85)*w;tri([bx,by,bz],[tx,by-.045,tz],[bx+dx*.15,by+.025,bz+dz*.15]);tri([tx,by-.045,tz],[tx+dx*.06,by+.04,tz+dz*.06],[bx+dx*.15,by+.025,bz+dz*.15]);}}}}
 crownGeo.setAttribute('position',new T.Float32BufferAttribute(cp,3));crownGeo.setIndex(ci);crownGeo.computeVertexNormals();
 const groundGeo=`);
f=f.replace("i%2?needle:needleLight,[x,y+ch+1.8*size,z]","i%2?needle:needleLight,[x,y+ch+1.8*size,z]").replace("instance('needles'+i,coneGeo","instance('needles'+i,crownGeo");
f=f.replace("path?'#777258':camp?'#737054':'#4c6145'","path?'#b4aa92':camp?'#c9bba2':'#a3a78c'");
f=f.replace('roughness:1,map:groundTexture','roughness:1,map:groundTexture,bumpMap:groundTexture,bumpScale:.09');
f=f.replace("color:'#83b8ab'","color:'#496e80'").replace("mat('#727d72')","mat('#72756a')");
f=f.replace("new T.PointLight('#ff994a',6,8,2)","new T.PointLight('#ffac62',55,16,2)").replace("firelight.position.set(-2.8,.6,0)","firelight.position.set(-2.8,1.1,0)");
f=f.replace(" const shafts=new T.Group();",` const flameMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{time:{value:0}},vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader: \`varying vec2 vUv;uniform float time;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}void main(){vec2 uv=vUv;float y=uv.y;float n=noise(vec2(uv.x*7.,y*6.-time*2.7));float bend=sin(y*9.-time*3.)*.09*y;float width=(1.-y)*.39;float body=1.-abs(uv.x-.5+bend)/(width+.001);float a=clamp(body*.9+(n-.5)*.7,0.,1.)*smoothstep(0.,.09,y)*(1.-smoothstep(.72,1.,y));vec3 colour=mix(vec3(1.,.16,.015),vec3(1.,.85,.38),pow(max(0.,body),2.)*(1.-y));gl_FragColor=vec4(colour,a*.8);}\`});
 const flames=new T.Group();for(let i=0;i<3;i++){const flame=new T.Mesh(new T.PlaneGeometry(1.25,1.65),flameMaterial);flame.position.set(-2.8,.97,0);flame.rotation.y=i*Math.PI/3;flames.add(flame);}scene.add(flames);
 const sparkGeo=new T.BufferGeometry(),sparksData=[];for(let i=0;i<45;i++)sparksData.push(-2.8+(rand()-.5)*.8,.3+rand()*3,(rand()-.5)*.7);sparkGeo.setAttribute('position',new T.Float32BufferAttribute(sparksData,3));const sparks=new T.Points(sparkGeo,new T.PointsMaterial({color:'#ffb15c',size:.025,transparent:true,opacity:.8,blending:T.AdditiveBlending,depthWrite:false}));scene.add(sparks);
 const shafts=new T.Group();`);
f=f.replace("color:'#ffe2a1'","color:'#9cbce8'").replace('opacity:.022','opacity:.012');
f=f.replace('firelight.intensity=5+Math.sin(t*7)*.8+Math.sin(t*13)*.3;',`firelight.intensity=52+Math.sin(t*7)*4+Math.sin(t*13)*2;flameMaterial.uniforms.time.value=t;const sp=sparkGeo.attributes.position;for(let i=0;i<sp.count;i++){const phase=(t*.45+i*.137)%1;sp.setY(i,.25+phase*2.8);sp.setX(i,-2.8+Math.sin(t+i)*.2+phase*Math.sin(i)*.6);}sp.needsUpdate=true;`);
fs.writeFileSync(root+'/forest.js',f);
let m=fs.readFileSync(root+'/main.js','utf8');m=m.replace("import {createAudio}","import {loadVisualAssets} from './visuals.js';\nimport {createAudio}");m=m.replace('const forest=buildForest(scene)','const assets=await loadVisualAssets();\nconst forest=buildForest(scene,assets)').replace('character=createFenris()','character=createFenris(assets)');
m=m.replace("scene.background=new T.Color('#617b78');scene.fog=new T.FogExp2('#566f69',.025)","scene.background=new T.Color('#0b1422');scene.fog=new T.FogExp2('#142131',.029)");
m=m.replace("new T.HemisphereLight('#c6dcda','#454b37',2)","new T.HemisphereLight('#b6cde9','#494135',.95)").replace("new T.DirectionalLight('#ffdb9c',3.1)","new T.DirectionalLight('#a9c9ee',1.8)").replace("new T.DirectionalLight('#b4dce0',1)","new T.DirectionalLight('#c4d6e9',.85)");
m=m.replace('toneMappingExposure=1.15','toneMappingExposure=1.16').replaceAll('zoom=11','zoom=9.5').replaceAll('pitch=.68','pitch=.53').replaceAll('fenris.rotation.y=Math.PI','fenris.rotation.y=-.45').replace('target.set(fenris.position.x,fenris.position.y+1.35','target.set(fenris.position.x,fenris.position.y+1.55');
m=m.replace("zoom+e.deltaY*.012,7,21","zoom+e.deltaY*.012,6,21");
fs.writeFileSync(root+'/main.js',m);
for(const name of ['index.html']){let h=fs.readFileSync(root+'/'+name,'utf8').replaceAll('?v=1','?v=2');fs.writeFileSync(root+'/'+name,h);}
