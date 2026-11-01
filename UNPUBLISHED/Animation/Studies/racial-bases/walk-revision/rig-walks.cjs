const fs=require('fs'),path=require('path'),crypto=require('crypto');
const {PNG}=require('C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/pngjs');
const ROOT=path.resolve(__dirname,'..'),S=320,G=2,GROUND=300,FRAMES=16;
const read=f=>JSON.parse(fs.readFileSync(f,'utf8').replace(/^\uFEFF/,''));
const plans=read(path.join(ROOT,'progress.json')).characters;
const dirs={left:{axis:[-1,0]},'up-left':{axis:[-.72,-.35]},up:{axis:[0,-.6]},'down-left':{axis:[-.72,.35]},down:{axis:[0,.6]}};
// Joint coordinates refer to the original 640px first frame; artwork stays in place.
const configs={
 'dwarf-male':{
 left:{legs:[[[315,432],[267,510],[227,574]],[[364,432],[403,508],[432,568]]],arms:[[[414,325],[431,375],[451,420]],[[247,329],[219,373],[195,402]]],cut:432,body:[[330,270],[330,427]]},
 'up-left':{legs:[[[365,438],[383,505],[390,578]],[[291,436],[274,493],[246,524]]],arms:[[[246,334],[225,385],[218,432]],[[416,305],[420,343],[413,369]]],cut:436,body:[[331,267],[335,432]]},
 up:{legs:[[[362,426],[367,497],[369,574]],[[291,426],[294,480],[294,532]]],arms:[[[221,307],[211,360],[199,401]],[[424,305],[434,337],[427,360]]],cut:422,body:[[325,265],[325,423]]},
 'down-left':{legs:[[[303,425],[284,500],[260,574]],[[354,425],[371,477],[381,527]]],arms:[[[429,332],[445,384],[454,432]],[[228,322],[210,385],[196,432]]],cut:423,body:[[325,270],[325,423]]},
 down:{legs:[[[286,427],[286,500],[286,575]],[[341,425],[351,471],[350,510]]],arms:[[[417,327],[422,374],[410,424]],[[225,318],[220,366],[220,403]]],cut:423,body:[[320,272],[320,423]]}
 },
 'dwarf-female':{
 left:{legs:[[[302,446],[269,514],[245,574]],[[341,445],[373,505],[403,557]]],arms:[[[378,357],[393,401],[405,438]],[[242,350],[221,391],[211,416]]],cut:442,body:[[310,308],[309,445]]},
 'up-left':{legs:[[[354,450],[367,507],[369,573]],[[302,449],[282,500],[255,530]]],arms:[[[254,353],[233,389],[220,411]],[[414,355],[427,394],[429,422]]],cut:444,body:[[329,306],[329,443]]},
 up:{legs:[[[359,449],[362,509],[361,575]],[[302,448],[310,493],[314,529]]],arms:[[[244,344],[235,387],[229,421]],[[404,338],[416,350],[419,362]]],cut:444,body:[[329,302],[329,446]]},
 'down-left':{legs:[[[302,446],[278,512],[248,578]],[[352,444],[375,490],[378,535]]],arms:[[[417,358],[432,394],[434,425]],[[247,349],[224,386],[210,412]]],cut:441,body:[[326,302],[325,444]]},
 down:{legs:[[[294,452],[292,515],[290,578]],[[342,451],[353,491],[355,528]]],arms:[[[406,365],[408,404],[400,440]],[[248,355],[235,389],[229,416]]],cut:447,body:[[326,306],[325,446]]}
 },
 'halfling-male':{
 left:{legs:[[[301,478],[276,533],[244,580]],[[344,477],[371,529],[393,573]]],arms:[[[389,403],[407,438],[418,468]],[[267,405],[240,438],[231,451]]],cut:474,body:[[328,363],[328,475]]},
 'up-left':{legs:[[[350,479],[367,531],[377,580]],[[300,477],[283,523],[269,546]]],arms:[[[258,407],[241,432],[235,443]],[[405,403],[415,434],[415,458]]],cut:475,body:[[332,362],[331,476]]},
 up:{legs:[[[303,469],[300,524],[298,579]],[[347,469],[352,513],[352,545]]],arms:[[[252,400],[245,430],[241,455]],[[392,401],[399,430],[398,453]]],cut:468,body:[[323,363],[325,469]]},
 'down-left':{legs:[[[309,475],[290,531],[270,581]],[[352,474],[365,515],[365,544]]],arms:[[[399,409],[418,438],[427,462]],[[257,405],[238,433],[229,453]]],cut:470,body:[[331,365],[331,471]]},
 down:{legs:[[[350,474],[349,528],[347,581]],[[307,474],[304,515],[305,544]]],arms:[[[397,413],[399,442],[396,464]],[[256,411],[258,440],[269,459]]],cut:470,body:[[330,368],[330,473]]}
 },
 'halfling-female':{
 left:{legs:[[[300,487],[282,535],[252,579]],[[345,486],[368,534],[391,578]]],arms:[[[283,405],[258,432],[249,453]],[[367,402],[384,433],[396,447]]],cut:539,body:[[321,360],[320,535]],skirt:true},
 'up-left':{legs:[[[350,486],[365,532],[376,580]],[[305,486],[280,524],[265,547]]],arms:[[[265,403],[248,429],[237,448]],[[397,408],[414,436],[421,456]]],cut:538,body:[[328,361],[328,537]],skirt:true},
 up:{legs:[[[305,490],[303,534],[302,580]],[[348,490],[354,531],[355,548]]],arms:[[[255,403],[250,430],[245,451]],[[394,410],[404,443],[407,469]]],cut:541,body:[[329,360],[328,539]],skirt:true},
 'down-left':{legs:[[[311,488],[291,538],[271,581]],[[353,488],[365,527],[366,550]]],arms:[[[264,405],[252,437],[248,463]],[[391,408],[405,438],[410,458]]],cut:540,body:[[330,360],[331,536]],skirt:true},
 down:{legs:[[[328,491],[326,536],[326,580]],[[290,491],[288,520],[291,535]]],arms:[[[399,414],[400,444],[399,468]],[[260,411],[261,441],[272,469]]],cut:542,body:[[331,360],[330,537]],skirt:true}
 }
};
const add=(a,b)=>[a[0]+b[0],a[1]+b[1]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1]],mul=(a,s)=>[a[0]*s,a[1]*s],dot=(a,b)=>a[0]*b[0]+a[1]*b[1],len=a=>Math.hypot(...a),mix=(a,b,t)=>add(mul(a,1-t),mul(b,t)),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
function dist(p,a,b){const v=sub(b,a),t=clamp(dot(sub(p,a),v)/dot(v,v));return len(sub(p,add(a,mul(v,t))))}
function bone(p,a,b,A,B){const v=sub(b,a),V=sub(B,A),d=dot(v,v),u=dot(sub(p,a),v)/d,w=(v[0]*(p[1]-a[1])-v[1]*(p[0]-a[0]))/Math.sqrt(d);return add(A,add(mul(V,u),mul([-V[1],V[0]],w/len(V))))}
function knee(hip,foot,l1,l2,bend){const v=sub(foot,hip),d=Math.min(len(v),l1+l2-.1),unit=mul(v,1/len(v)),a=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-a*a));return add(hip,add(mul(unit,a),mul([-unit[1],unit[0]],h*bend)))}
function sourceFrame(file){const im=PNG.sync.read(fs.readFileSync(file),{checkCRC:true}),out=new PNG({width:S,height:S});for(let y=0;y<S;y++)for(let x=0;x<S;x++)im.data.copy(out.data,(y*S+x)*4,((y*2)*im.width+x*2)*4,((y*2)*im.width+x*2)*4+4);return out}
function partition(im,c){const parts=Array.from({length:5},()=>new PNG({width:S,height:S}));
 const skirtLabels=new Int8Array(S*S);
 if(c.skirt){
  for(let y=Math.floor(c.body[0][1]);y<S;y++)for(let x=0;x<S;x++){const i=(y*S+x)*4,[r,g,b,a]=im.data.subarray(i,i+4);if(!a)continue;if(r>65&&r>g*1.16&&r>b*1.4)skirtLabels[y*S+x]=1;else if(g>40&&g>r*.88&&b>r*.78)skirtLabels[y*S+x]=2;}
  const seed=skirtLabels.slice();
  for(let y=Math.floor(c.body[0][1]);y<S;y++)for(let x=0;x<S;x++){if(!im.data[(y*S+x)*4+3]||seed[y*S+x])continue;let nearest=100,label=2;for(let dy=-5;dy<=5;dy++)for(let dx=-5;dx<=5;dx++){const xx=x+dx,yy=y+dy,d=dx*dx+dy*dy;if(xx<0||xx>=S||yy<0||yy>=S||d>=nearest)continue;const v=seed[yy*S+xx];if(v){nearest=d;label=v;}}skirtLabels[y*S+x]=label;}
 }
 const skinLeg=new Int8Array(S*S);
 if(c.skirt){const seen=new Uint8Array(S*S),groups=[];for(let y=Math.floor(c.legs[0][0][1]);y<S;y++)for(let x=0;x<S;x++){const start=y*S+x;if(seen[start]||skirtLabels[start]!==1)continue;const q=[start];seen[start]=1;let bottom=y;for(let j=0;j<q.length;j++){const p=q[j],px=p%S,py=Math.floor(p/S);bottom=Math.max(bottom,py);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=px+dx,yy=py+dy,n=yy*S+xx;if(xx<0||xx>=S||yy<c.legs[0][0][1]||yy>=S||seen[n]||skirtLabels[n]!==1)continue;seen[n]=1;q.push(n);}}groups.push({q,bottom});}groups.forEach(g=>{const ds=c.legs.map(a=>Math.min(...g.q.map(p=>len(sub([p%S,Math.floor(p/S)],a[2])))));g.q.forEach(p=>{const pt=[p%S,Math.floor(p/S)],local=c.legs.map(a=>Math.min(dist(pt,a[0],a[1]),dist(pt,a[1],a[2])));skinLeg[p]=(ds[0]<12&&ds[1]<12?local[0]<local[1]:ds[0]<ds[1])?1:2;});});}
 for(let y=0;y<S;y++)for(let x=0;x<S;x++){const i=(y*S+x)*4;if(!im.data[i+3])continue;const p=[x,y];let part=0;
 const armDistances=c.arms.map(a=>Math.min(dist(p,a[0],a[1]),dist(p,a[1],a[2])));
 const a=armDistances[0]<armDistances[1]?0:1,arm=c.arms[a],bodyDistance=dist(p,...c.body);
 if((!c.skirt||skirtLabels[y*S+x]!==2)&&y>arm[0][1]-6&&y<arm[2][1]+10&&armDistances[a]<bodyDistance-7&&armDistances[a]<(c.id==='dwarf-male'?25:15))part=3+a;
 else if(c.skirt?skinLeg[y*S+x]>0:y>c.cut){
  const legDistances=c.legs.map(a=>Math.min(dist(p,a[0],a[1]),dist(p,a[1],a[2])));part=1+(legDistances[0]<legDistances[1]?0:1);
  if(c.skirt)part=skinLeg[y*S+x];
 }
 im.data.copy(parts[part].data,i,i,i+4);
 // The tunic/skirt overlaps the top of the independently moving legs.
 if(!c.skirt&&part>0&&part<3&&y<c.cut+6)im.data.copy(parts[0].data,i,i,i+4);
 }return parts;
}
function rasterTriangle(dst,src,s,t,shade){let minX=Math.max(0,Math.floor(Math.min(...t.map(p=>p[0])))),maxX=Math.min(S-1,Math.ceil(Math.max(...t.map(p=>p[0])))),minY=Math.max(0,Math.floor(Math.min(...t.map(p=>p[1])))),maxY=Math.min(S-1,Math.ceil(Math.max(...t.map(p=>p[1]))));const [a,b,c]=t,den=(b[1]-c[1])*(a[0]-c[0])+(c[0]-b[0])*(a[1]-c[1]);if(Math.abs(den)<.001)return;
 for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const X=x+.5,Y=y+.5,u=((b[1]-c[1])*(X-c[0])+(c[0]-b[0])*(Y-c[1]))/den,v=((c[1]-a[1])*(X-c[0])+(a[0]-c[0])*(Y-c[1]))/den,w=1-u-v;if(u<-.001||v<-.001||w<-.001)continue;const sx=Math.floor(s[0][0]*u+s[1][0]*v+s[2][0]*w),sy=Math.floor(s[0][1]*u+s[1][1]*v+s[2][1]*w);if(sx<0||sy<0||sx>=S||sy>=S)continue;const si=(sy*S+sx)*4;if(!src.data[si+3])continue;const di=(y*S+x)*4;for(let k=0;k<3;k++)dst.data[di+k]=Math.round(src.data[si+k]*shade);dst.data[di+3]=255;}
}
function warp(dst,src,fn,shade=1){const step=4;for(let y=0;y<S;y+=step)for(let x=0;x<S;x+=step){let visible=false;for(let yy=y;yy<Math.min(S,y+step)&&!visible;yy++)for(let xx=x;xx<Math.min(S,x+step);xx++)if(src.data[(yy*S+xx)*4+3]){visible=true;break}if(!visible)continue;const s=[[x,y],[Math.min(S,x+step),y],[Math.min(S,x+step),Math.min(S,y+step)],[x,Math.min(S,y+step)]],t=s.map(fn);for(const q of [[0,1,2],[0,2,3]])rasterTriangle(dst,src,q.map(i=>s[i]),q.map(i=>t[i]),shade)}}
function gait(phase,stride,lift){phase=(phase+1)%1;if(phase<=.5)return{forward:stride*(1-4*phase),lift:0,stance:true};const a=(phase-.5)*2*Math.PI;return{forward:-stride*Math.cos(a),lift:lift*Math.sin(a),stance:false}}
function rowCenter(im,y,fallback,fraction=.5){let lo=S,hi=-1;for(let yy=Math.max(0,Math.round(y)-2);yy<=Math.min(S-1,Math.round(y)+2);yy++)for(let x=0;x<S;x++)if(im.data[(yy*S+x)*4+3]){lo=Math.min(lo,x);hi=Math.max(hi,x);}return hi<0?fallback:lo+(hi-lo)*fraction;}
function render(parts,c,d,phase){phase=((phase%1)+1)%1;const out=new PNG({width:S,height:S}),axis=dirs[d].axis,src=c.legs[0].map((p,i)=>i===2?[rowCenter(parts[1],p[1]-18,p[0],d.includes('left')?.82:.5),p[1]-18]:p),l1=len(sub(src[1],src[0])),l2=len(sub(src[2],src[1])),L=l1+l2,stride=L*.40,lift=L*.16,bob=1.5*Math.sin(phase*4*Math.PI),near=gait(phase,stride,lift),far=gait(phase+.5,stride,lift),feet=[];
 let footBottom=0;for(let y=0;y<S;y++)for(let x=0;x<S;x++)if(parts[1].data[(y*S+x)*4+3])footBottom=Math.max(footBottom,y+1);
 const baseY=GROUND-(footBottom-src[2][1])-Math.abs(axis[1])*stride;
 function leg(index,g){const hip=add(c.legs[index][0],[0,bob]);hip[0]=c.body[1][0]+(hip[0]-mix(c.legs[0][0],c.legs[1][0],.5)[0])*(d==='left'?.3:d.includes('left')?.65:1);const foot=[hip[0]+axis[0]*g.forward,baseY+axis[1]*g.forward-g.lift],K=add(mix(hip,foot,(src[1][1]-src[0][1])/(src[2][1]-src[0][1])),[axis[0]*g.lift*.5,-g.lift*.12]);feet.push({index,phase:(phase+index*.5)%1,...g,hip,knee:K,ankle:foot,sole:[foot[0],foot[1]+footBottom-src[2][1]]});
 return p=>{if(index===1&&(d==='up'||d==='down')){const j=p[1]<src[1][1]?0:1,t=clamp((p[1]-src[j][1])/(src[j+1][1]-src[j][1])),cx=mix(src[j],src[j+1],t)[0];p=[2*cx-p[0],p[1]];}if(p[1]>=src[2][1])return add(p,sub(foot,src[2]));const j=p[1]<src[1][1]?0:1,t=(p[1]-src[j][1])/(src[j+1][1]-src[j][1]),sourceCenter=mix(src[j],src[j+1],t),targetCenter=mix([hip,K,foot][j],[hip,K,foot][j+1],t);return [targetCenter[0]+p[0]-sourceCenter[0],targetCenter[1]]};}
 const nearFn=leg(0,near),farFn=leg(1,far);
 const upper=new PNG({width:S,height:S});for(const part of [parts[0],parts[3],parts[4]])for(let i=0;i<part.data.length;i+=4)if(part.data[i+3])part.data.copy(upper.data,i,i,i+4);
 warp(out,parts[1],farFn,.88);warp(out,parts[1],nearFn);
 warp(out,upper,p=>{let q=add(p,[0,bob]);c.arms.forEach((arm,i)=>{const g=i===0?near:far,ad=Math.min(dist(p,arm[0],arm[1]),dist(p,arm[1],arm[2])),bd=dist(p,...c.body),w=smooth((p[1]-arm[0][1])/Math.max(1,arm[2][1]-arm[0][1]))*(1-smooth((ad-8)/25))*smooth((bd-10)/20);q=add(q,[axis[0]*-g.forward*.45*w,axis[1]*-g.forward*.7*w]);});if(c.skirt)q[0]+=smooth((p[1]-c.body[0][1])/Math.max(1,c.cut-c.body[0][1]))*Math.sin(phase*2*Math.PI)*1.5;return q;});return{im:out,feet};
}
function big(im){const p=new PNG({width:640,height:640});for(let y=0;y<640;y++)for(let x=0;x<640;x++){const si=((y>>1)*S+(x>>1))*4;im.data.copy(p.data,(y*640+x)*4,si,si+4)}return p}
function atlas(frames){const p=new PNG({width:2560,height:640*Math.ceil(frames.length/4)});frames.forEach((f,k)=>{for(let y=0;y<640;y++)f.data.copy(p.data,((Math.floor(k/4)*640+y)*p.width+k%4*640)*4,y*640*4,(y+1)*640*4)});return p}
function main(){const id=process.argv[2]||'dwarf-male',directions=process.argv[3]?[process.argv[3]]:Object.keys(dirs),dest=path.join(__dirname,'rigged',id);fs.mkdirSync(dest,{recursive:true});const report={id,method:'joint-based painted cutout rig',frames:FRAMES,fps:16,directions:{}};
 for(const d of directions){const original=configs[id][d],c={...original,id,cut:original.cut/2,body:original.body.map(p=>mul(p,.5)),legs:original.legs.map(a=>a.map(p=>mul(p,.5))),arms:original.arms.map(a=>a.map(p=>mul(p,.5)))};const backup=path.join(__dirname,'originals',id,'walk-'+d+'.png'),im=sourceFrame(fs.existsSync(backup)?backup:path.join(ROOT,id,'walk-'+d+'.png')),parts=partition(im,c),frames=[],poses=[];for(let k=0;k<FRAMES;k++){const r=render(parts,c,d,k/FRAMES);frames.push(big(r.im));poses.push(r.feet)}fs.writeFileSync(path.join(dest,'walk-'+d+'.png'),PNG.sync.write(atlas(frames)));report.directions[d]={source:'original walk-'+d+'.png frame0',poses,loopCloses:big(render(parts,c,d,1).im).data.equals(frames[0].data),uniqueFrames:new Set(frames.map(p=>crypto.createHash('sha256').update(p.data).digest('hex'))).size};parts.forEach((im,k)=>fs.writeFileSync(path.join(dest,'part-'+d+'-'+k+'.png'),PNG.sync.write(big(im))));}
 fs.writeFileSync(path.join(dest,'rig-validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({id,directions,output:dest}));
}main();












