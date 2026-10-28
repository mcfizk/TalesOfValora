export const CLOCK_START=22*60;
export const GAME_MINUTES_PER_MOVING_SECOND=1;
export const MORNING=6*60;
export function createGameClock({startMinutes=CLOCK_START,rate=GAME_MINUTES_PER_MOVING_SECOND}={}){
  let total=startMinutes;
  const firstMorning=(Math.floor(startMinutes/1440)+(startMinutes%1440<MORNING?0:1))*1440+MORNING;
  function snapshot(){
    const minutes=((total%1440)+1440)%1440,hour=Math.floor(minutes/60),minute=Math.floor(minutes%60);
    const daylight=minutes>=MORNING&&minutes<18*60;
    const phase=hour<5?'Night':hour<6?'Dawn':hour<12?'Morning':hour<17?'Afternoon':hour<19?'Evening':'Night';
    const daylightStrength=Math.max(0,Math.min(1,(minutes-5*60)/120,(19*60-minutes)/120));
    const arc=daylight?(minutes-MORNING)/720:((minutes-18*60+1440)%1440)/720;
    return{totalMinutes:total,day:Math.floor(total/1440)+1,hour,minute,time:`${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}`,phase,daylight,daylightStrength,arc,villageAvailable:total>=firstMorning};
  }
  return{
    load(minutes){if(!Number.isFinite(minutes)||minutes<startMinutes)throw new Error('Invalid saved clock');total=minutes;return snapshot();},
    advance(seconds,moved){if(moved&&Number.isFinite(seconds)&&seconds>0)total+=seconds*rate;return snapshot();},
    elapse(minutes){if(Number.isFinite(minutes)&&minutes>0)total+=minutes;return snapshot();},
    reset(){total=startMinutes;},snapshot
  };
}
