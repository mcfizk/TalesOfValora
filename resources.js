// Generic character resource. A zero-capacity pool grants no power or abilities.
export function createPowerPool({kind=null,max=0,current=max}={}){
  if(!Number.isFinite(max)||max<0||!Number.isFinite(current))throw new Error('Invalid power pool');
  max=Math.floor(max);let value=Math.max(0,Math.min(max,Math.floor(current)));
  const amount=n=>{if(!Number.isFinite(n)||n<0)throw new Error('Invalid power amount');return Math.floor(n);};
  return{
    spend(n){n=amount(n);if(n>value)return 0;value-=n;return n;},
    restore(n){n=amount(n);const gained=Math.min(max-value,n);value+=gained;return gained;},
    snapshot:()=>({kind:kind||null,current:value,max,active:!!kind&&max>0})
  };
}
