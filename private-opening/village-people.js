import {VILLAGE_UNITS} from '../units/catalog.js';
import {DIRECTIONS,CHARACTER_ACTIONS,validateCharacterAnimations,characterFrame,movementDirection} from './character-animation.js';
import {isOpen} from './village-layout.js';
// Unit identity, appearance and authored scene data have one source of truth.
export const ALL_PEOPLE=VILLAGE_UNITS.map(unit=>({id:unit.id,name:unit.name,role:unit.information.role,...unit.presentation,...unit.behaviour.village}));
export const PEOPLE=ALL_PEOPLE.filter(person=>Number.isFinite(person.dx));
export const KEEPERS=Object.fromEntries(ALL_PEOPLE.filter(person=>!Number.isFinite(person.dx)).map(person=>[person.shop,person]));
export function humanConfig(id){
  const config={id,formatVersion:1,displayHeight:28,restFrame:0,wakeSequence:[{clip:'sleep',seconds:2},{clip:'sleepToSit',seconds:1},{clip:'sit',seconds:1.5},{clip:'sitToStand',seconds:1}]};
  for(const action of CHARACTER_ACTIONS){config[action]={frameWidth:32,frameHeight:40,columns:8,frames:8,fps:8,loop:!['sleepToSit','sitToStand'].includes(action),anchor:[16,37],bodyHeight:30,file:`generated/${id}-${action}.png`,mirrorRight:true};}
  config.walk.files=Object.fromEntries(DIRECTIONS.map(d=>[d,`generated/${id}-walk-${d}.png`]));
  return validateCharacterAnimations(config);
}
// Small code-drawn pixel sprites share Fenris's six-action, eight-direction contract.
// Artwork is generated once, never redrawn per frame.
export function makeHumanArt(art){
  art.people={};
  for(const person of ALL_PEOPLE){
    const config=humanConfig(person.id);art.people[person.id]=config;
    for(const action of CHARACTER_ACTIONS)for(const direction of action==='walk'?DIRECTIONS:['left']){
      const sheet=document.createElement('canvas');sheet.width=256;sheet.height=40;const g=sheet.getContext('2d');
      for(let f=0;f<8;f++){
        g.save();g.beginPath();g.rect(f*32,0,32,40);g.clip();g.translate(f*32+16,37);
        const lying=action==='sleep'?1:action==='sleepToSit'?1-f/7:0,sit=action==='sit'?1:action==='sleepToSit'?f/7:action==='sitToStand'?1-f/7:0;
        g.translate(0,Math.round(sit*7-lying*4));g.rotate(-Math.PI/2*lying);
        const back=direction.startsWith('up'),side=direction==='left'||direction==='right',right=direction.includes('right'),stride=action==='walk'?Math.round(Math.sin(f*Math.PI/4)*3):0;
        if(right)g.scale(-1,1);g.translate(0,action==='idle'&&f>3?1:0);
        const rect=(color,x,y,w,h)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
        rect('#242522',-5,-15,10,12-sit*6);rect('#4c4840',-4,-14,3,11-sit*5);rect('#5b554b',1,-14,3,11-sit*5);
        rect('#252725',-6,-4+stride-sit*5,5,3);rect('#252725',1,-4-stride-sit*5,5,3);
        rect('#222a28',-7,-24,14,12);rect(person.coat,-6,-23,12,10);rect('#ffffff20',-5,-22,3,8);rect('#00000022',3,-22,3,9);
        rect('#342f28',-6,-14,12,2);rect('#b6a272',-1,-14,2,2);
        rect('#262a28',-9,-23+stride/2,3,11);rect(person.coat,-8,-22+stride/2,3,8);rect('#c2a184',-8,-14+stride/2,3,3);
        rect('#262a28',6,-23-stride/2,3,11);rect(person.coat,6,-22-stride/2,2,8);rect('#d1b096',6,-14-stride/2,3,3);
        rect('#252624',-5,-31,10,9);rect('#c5a187',-4,-30,8,7);rect('#dfbfa1',-3,-29,5,5);rect(person.hair,-5,-31,10,3);
        if(back){rect(person.hair,-4,-30,8,7);rect('#ffffff18',-3,-29,2,5);}else{rect(person.hair,side?2:3,-29,2,5);rect('#2b2825',-3,-27,1,1);if(!side)rect('#2b2825',2,-27,1,1);rect('#9d7861',-2,-24,3,1);if(side)rect('#d5ae8f',-6,-27,3,3);}
        g.restore();
      }
      art[`${person.id}-${action}${action==='walk'?'-'+direction:''}`]=sheet;
    }
  }
}
export function villagePeople(layout,clock,time,player,interior){
  if(interior){const keeper=KEEPERS[interior.id];return keeper?[{...keeper,x:120,y:88,direction:'down',animation:time,moving:false,type:'village',id:`npc:${keeper.id}`,actorId:keeper.id}]:[];}
  return PEOPLE.filter(p=>p.shop?isOpen(p.shop,clock.hour):clock.hour>=6&&clock.hour<20).map((p,index)=>{
    let x=layout.x+p.dx,y=layout.y+p.dy;const dx=Math.sin(time*.18+index)* (p.wander||0),dy=Math.cos(time*.15+index)*(p.wander||0)*.4;
    x+=dx;y+=dy;const distance=Math.hypot(player.x-x,player.y-y),wary=distance<70;
    if(wary&&distance>0){const retreat=(1-distance/70)*15;x+=(x-player.x)/distance*retreat;y+=(y-player.y)/distance*retreat;}
    const direction=distance<90?movementDirection(player.x-x,player.y-y):movementDirection(Math.cos(time*.18+index),-Math.sin(time*.15+index));
    return {...p,id:`npc:${p.id}`,actorId:p.id,type:'village',x,y,direction,animation:time,moving:!!p.wander&&!wary};
  });
}
export function drawPerson(ctx,person,art){
  const frame=characterFrame(person,art.people[person.actorId]);ctx.fillStyle='#10211c55';ctx.beginPath();ctx.ellipse(person.x,person.y,7,3,0,0,Math.PI*2);ctx.fill();ctx.save();ctx.translate(Math.round(person.x),Math.round(person.y));if(frame.mirror)ctx.scale(-1,1);ctx.drawImage(art[frame.asset],frame.sx,frame.sy,frame.width,frame.height,-frame.anchor[0]*frame.scale,-frame.anchor[1]*frame.scale,frame.width*frame.scale,frame.height*frame.scale);ctx.restore();
}
