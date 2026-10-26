const RECTS=[[8,20,435,401],[457,45,378,375],[853,24,392,400],[8,440,435,379],[453,452,388,360],[875,481,368,335],[8,870,444,322],[507,873,269,323],[849,828,390,385]];
export function drawBuilding(ctx,b,art,player){
  ctx.save();if(Math.abs(player.x-b.x)<b.width*.48&&player.y<b.y-5&&player.y>b.y-b.height)ctx.globalAlpha=.38;
  ctx.drawImage(art['village-buildings'],...RECTS[b.tile],Math.round(b.x-b.width/2),b.y-b.height,b.width,b.height);ctx.restore();
}
export function drawVillageGround(ctx,v,state){
  ctx.save();ctx.translate(v.x,v.y);
  // Kitchen garden, a wash line, benches and stacked split logs.
  ctx.fillStyle='#3a3022';ctx.fillRect(88,-8,74,53);
  for(let row=0;row<4;row++)for(let col=0;col<8;col++){ctx.fillStyle=row%2?'#6b7c3a':'#496136';ctx.fillRect(93+col*8,-3+row*12,5,4);ctx.fillStyle='#84905a';ctx.fillRect(94+col*8,-4+row*12,2,2);}
  const fence=(x,y,w)=>{ctx.fillStyle='#362d22';ctx.fillRect(x,y-12,w,3);ctx.fillRect(x,y-6,w,2);for(let a=x;a<=x+w;a+=14){ctx.fillStyle='#796343';ctx.fillRect(a,y-17,3,19);ctx.fillStyle='#aa8b56';ctx.fillRect(a,y-17,1,16);}};
  fence(82,53,87);fence(-235,-264,40);fence(76,-264,48);fence(-240,180,60);
  ctx.fillStyle='#5b4933';ctx.fillRect(20,149,3,24);ctx.fillRect(78,149,3,24);ctx.fillStyle='#aaa081';ctx.fillRect(22,151,58,1);ctx.fillStyle='#8b8b73';ctx.fillRect(30,153,13,13);ctx.fillStyle='#b0a487';ctx.fillRect(51,153,18,17);
  for(const [x,y] of [[-62,15],[51,78]]){ctx.fillStyle='#302a24';ctx.fillRect(x,y,24,5);ctx.fillRect(x+2,y+3,3,5);ctx.fillRect(x+19,y+3,3,5);ctx.fillStyle='#87704b';ctx.fillRect(x,y-2,24,4);}
  const stacked=['stacked','paid'].includes(state.economy?.job);
  for(let i=0;i<9;i++){const x=-235+(i%3)*9+(stacked?0:Math.sin(i*5)*9),y=167+Math.floor(i/3)*4+(stacked?0:Math.cos(i)*5);ctx.fillStyle='#392b20';ctx.fillRect(x,y,13,5);ctx.fillStyle='#9b794d';ctx.fillRect(x,y,11,2);ctx.fillStyle='#b38c58';ctx.fillRect(x+10,y,3,4);}
  ctx.restore();
}
export function drawRoom(ctx,room){
  ctx.fillStyle='#090f12';ctx.fillRect(-1000,-1000,2000,2000);
  ctx.fillStyle='#45382b';ctx.fillRect(10,10,220,188);
  for(let y=25;y<194;y+=9){ctx.fillStyle=y%2?'#65503a':'#5b4934';ctx.fillRect(20,y,200,8);for(let x=20+(y%3)*24;x<220;x+=48){ctx.fillStyle='#342c24';ctx.fillRect(x,y,1,8);}}
  ctx.fillStyle='#27251f';ctx.fillRect(10,4,220,23);ctx.fillStyle='#70634c';ctx.fillRect(20,9,200,11);ctx.fillStyle='#37372f';ctx.fillRect(10,22,10,176);ctx.fillRect(220,22,10,176);
  ctx.fillStyle='#2c251e';ctx.fillRect(59,39,122,35);ctx.fillStyle='#856b45';ctx.fillRect(61,40,118,25);ctx.fillStyle='#b29962';ctx.fillRect(61,40,118,3);ctx.fillStyle='#52402c';ctx.fillRect(61,65,118,7);
  for(const x of [25,180]){ctx.fillStyle='#34291f';ctx.fillRect(x,108,35,44);ctx.fillStyle='#836342';ctx.fillRect(x,110,35,35);ctx.fillStyle='#a18151';ctx.fillRect(x,110,35,3);}
  ctx.fillStyle='#7e6441';ctx.fillRect(100,190,40,8);ctx.fillStyle='#c3ad74';ctx.fillRect(114,191,12,2);
  if(room.id==='inn'){ctx.fillStyle='#92714c';ctx.fillRect(28,114,28,29);ctx.fillStyle='#b4a082';ctx.fillRect(30,116,24,6);ctx.fillStyle='#8b694e';ctx.fillRect(32,126,22,15);}
  else for(let i=0;i<7;i++){ctx.fillStyle=room.id==='apothecary'?['#87975d','#9a785f','#76a092'][i%3]:room.id==='smith'?'#98a4a0':['#b28a56','#9d714c'][i%2];ctx.fillRect(72+i*14,45,5,9);ctx.fillStyle='#b8a779';ctx.fillRect(73+i*14,43,3,3);}
  ctx.fillStyle='#eac97d';ctx.fillRect(26,15,17,8);ctx.fillRect(197,15,17,8);
}
