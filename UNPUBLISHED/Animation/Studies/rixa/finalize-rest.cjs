const fs=require('fs'),path=require('path');
const root=__dirname,direction=process.argv[2]||'left',dir=path.join(root,'rest',direction);
function copy(action,n,from,m){const dest=path.join(dir,action,'source');fs.mkdirSync(dest,{recursive:true});fs.copyFileSync(path.join(dir,from,'source',String(m).padStart(2,'0')+'.png'),path.join(dest,String(n).padStart(2,'0')+'.png'));}
copy('sleepToSit',1,'sleep',1);copy('sleepToSit',5,'sit',1);copy('sitToStand',1,'sit',1);copy('sitToStand',8,'idle',1);
for(const [forward,reverse,count]of [['sleepToSit','sitToSleep',5],['sitToStand','standToSit',8]])for(let i=1;i<=count;i++)copy(reverse,i,forward,count+1-i);
const file=path.join(root,'registration.json'),r=JSON.parse(fs.readFileSync(file));
const heights={idle:Array(8).fill(540),sit:[330,332,330,330],sleep:[180,182,180,180],sleepToSit:[180,205,255,310,330],sitToStand:[330,330,350,385,420,470,520,540]};
heights.sitToSleep=[...heights.sleepToSit].reverse();heights.standToSit=[...heights.sitToStand].reverse();
for(const [clip,values]of Object.entries(heights)){r.clips['rest/'+direction+'/'+clip]={frames:Object.fromEntries(values.map((height,i)=>[String(i+1).padStart(2,'0'),{targetHeight:height}]))};}
fs.writeFileSync(file,JSON.stringify(r,null,2));console.log('Endpoints, reversed transitions and initial scale registration saved for '+direction+'.');
