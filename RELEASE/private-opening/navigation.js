export {villageLocation} from './village-layout.js';
export function waypointReading(player,target){
  const dx=target.x-player.x,dy=target.y-player.y,distance=Math.hypot(dx,dy);
  const directions=['N','NE','E','SE','S','SW','W','NW'];
  const bearing=(Math.atan2(dx,-dy)*180/Math.PI+360)%360;
  return{distance,paces:Math.ceil(distance/22),bearing,direction:directions[Math.round(bearing/45)%8],arrived:distance<40};
}
