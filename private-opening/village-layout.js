// Pure seeded layout: shared by terrain generation, navigation and village life.
export function villageLocation(seed=1468){
  let n=Math.imul(81,374761393)^Math.imul(39,668265263)^seed;n=Math.imul(n^(n>>>13),1274126177);
  const y=660-1800-Math.floor(((n^(n>>>16))>>>0)/4294967296*500);
  return {id:'village',label:'Village',x:500,y};
}
const SPECS=[
  ['inn','The inn',-146,-95,0,142,138],['store','General store',142,-95,1,128,119],
  ['smith','Smithy',-150,112,2,148,133],['apothecary','Apothecary',146,115,3,128,121],
  ['home-a','A shuttered home',-132,-278,4,111,105],['home-b','A quiet home',132,-278,5,116,104],
  ['market','Produce stall',-38,-181,6,78,73],['well','Village well',0,70,7,45,49],
  ['shed','Tool shed',95,288,8,90,87]
];
export function createVillageLayout(seed){
  const center=villageLocation(seed);
  const buildings=SPECS.map(([id,label,dx,dy,tile,width,height])=>({id,label,tile,width,height,x:center.x+dx,y:center.y+dy,building:true}));
  const points=buildings.map(b=>({id:`door:${b.id}`,type:'village',buildingId:b.id,label:b.label,x:b.x,y:b.y+12}));
  points.push({id:'woodpile',type:'village',label:'Unstacked firewood',x:center.x-220,y:center.y+170});
  const colliders=buildings.map(b=>({x:b.x-b.width*.4,y:b.y-31,w:b.width*.8,h:30}));
  return {...center,buildings,points,colliders};
}
export function inVillage(x,y,seed){const v=villageLocation(seed);return Math.hypot((x-v.x)/285,(y-v.y+30)/435)<1;}
export function villageRoad(x,y,seed){const v=villageLocation(seed),dx=x-v.x,dy=y-v.y;
  return inVillage(x,y,seed)&&(Math.abs(dx)<27||Math.abs(dy+76)<20||Math.abs(dy-132)<19||Math.abs(dy+260)<16||Math.hypot(dx,dy)<78||Math.abs(dx+38)<13&&dy<-75);
}
export const SHOP_HOURS={inn:[6,22],store:[6,19],smith:[7,18],apothecary:[6,20],market:[6,18]};
export function isOpen(id,hour){const hours=SHOP_HOURS[id];return !!hours&&hour>=hours[0]&&hour<hours[1];}
export function makeInterior(building){
  return {id:building.id,label:building.label,returnTo:{x:building.x,y:building.y+25},
    points:[{id:`service:${building.id}`,type:'village',label:building.label,x:120,y:92},{id:'exit',type:'village',label:'Back to the village',x:120,y:180}],
    colliders:[{x:-20,y:-20,w:280,h:40},{x:-20,y:0,w:40,h:220},{x:220,y:0,w:40,h:220},{x:0,y:194,w:240,h:30},{x:62,y:43,w:116,h:28},{x:25,y:110,w:35,h:42},{x:180,y:110,w:35,h:42}]};
}
