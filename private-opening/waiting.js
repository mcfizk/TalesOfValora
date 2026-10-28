// Time acceleration applies to the world clock, never movement or animation.
export const WAIT_MINUTES_PER_SECOND=60;
export const WAIT_DURATIONS=[15,60,240,480];
export function minutesUntilMorning(totalMinutes){
  return (6*60-totalMinutes%1440+1440)%1440||1440;
}
export function advanceWait(currentMinutes,targetMinutes,seconds){
  if(!Number.isFinite(seconds)||seconds<=0)return 0;
  return Math.max(0,Math.min(targetMinutes-currentMinutes,seconds*WAIT_MINUTES_PER_SECOND));
}
export function clockLabel(totalMinutes){
  const minutes=Math.floor(totalMinutes%1440);
  return `Day ${Math.floor(totalMinutes/1440)+1}, ${String(Math.floor(minutes/60)).padStart(2,'0')}:${String(minutes%60).padStart(2,'0')}`;
}
