// Screen positions are derived from world coordinates every frame, including zoom.
export function eventIndicator(point,toScreen,width,height){
  const at=toScreen(point.x,point.y-26);
  if(at.x>=0&&at.x<=width&&at.y>=0&&at.y<=height)return null;
  const cx=width/2,cy=height/2,dx=at.x-cx,dy=at.y-cy;
  const top=Math.min(height*.35,height<550?90:width<700?270:120),bottom=Math.max(height*.65,height-(width<700?210:110)),left=30,right=width-30;
  const t=Math.min(dx>0?(right-cx)/dx:dx<0?(left-cx)/dx:Infinity,dy>0?(bottom-cy)/dy:dy<0?(top-cy)/dy:Infinity);
  return {x:cx+dx*t,y:cy+dy*t,angle:Math.atan2(dy,dx)*180/Math.PI+90};
}
export function createEventOverlay(root,{toScreen,onNavigate,onGather}){
  const cards=new Map(),arrows=new Map();
  function update(state,width,height){
    root.hidden=state.phase!=='explore'||state.paused;
    const visibleCards=new Set(),visibleArrows=new Set();
    const placed=[];
    for(const item of state.callouts||[]){
      if(item.until<state.time||item.location!==(state.interior?.id||'forest'))continue;
      const at=toScreen(item.x,item.y);if(at.x<0||at.x>width||at.y<0||at.y>height)continue;
      visibleCards.add(item.id);let card=cards.get(item.id);
      if(!card){card=document.createElement('section');card.className='event-text';card.dataset.eventId=item.id;card.setAttribute('role','status');const title=document.createElement('strong'),text=document.createElement('p');card.append(title,text);root.append(card);cards.set(item.id,card);}
      if(card.children[0].textContent!==item.title)card.children[0].textContent=item.title;if(card.children[1].textContent!==item.text)card.children[1].textContent=item.text;
      let gather=card.querySelector('button');
      if(item.gather&&!gather){gather=document.createElement('button');gather.type='button';gather.textContent='Gather wood';gather.addEventListener('click',()=>onGather(item.id));card.append(gather);}
      if(gather)gather.hidden=!item.gather;
      if(gather)gather.disabled=state.paused||Math.hypot(item.x-state.player.x,item.y-state.player.y)>=48;
      const w=card.offsetWidth,h=card.offsetHeight,x=Math.max(w/2+10,Math.min(width-w/2-10,at.x));let y=Math.max(85,Math.min(height-h-18,at.y+12));
      for(const previous of placed)if(Math.abs(previous.x-x)<(previous.w+w)/2+8&&y<previous.y+previous.h+8&&y+h>previous.y)y=Math.min(height-h-18,previous.y+previous.h+8);
      card.style.left=x+'px';card.style.top=y+'px';placed.push({x,y,w,h});
      card.style.opacity=String(Math.min(1,Math.max(0,item.until-state.time)));
    }
    if(!state.interior)for(const point of state.interactionPoints||[]){
      if(point.type!=='perception-event'||point.status!=='noticed')continue;
      const edge=eventIndicator(point,toScreen,width,height);if(!edge)continue;
      // Keep a directional button clear of text attached to a nearby object.
      for(const card of placed)if(Math.abs(edge.x-card.x)<card.w/2+24&&edge.y>card.y-24&&edge.y<card.y+card.h+24)edge.y=Math.max(28,card.y-28);
      visibleArrows.add(point.id);let arrow=arrows.get(point.id);
      if(!arrow){arrow=document.createElement('button');arrow.type='button';arrow.className='event-arrow';arrow.dataset.eventId=point.id;const icon=document.createElement('span');icon.textContent='↑';icon.setAttribute('aria-hidden','true');arrow.append(icon);arrow.addEventListener('click',()=>onNavigate({x:point.x,y:point.y}));root.append(arrow);arrows.set(point.id,arrow);}
      arrow.setAttribute('aria-label',`Approach ${point.title}`);arrow.title=point.title;arrow.style.left=edge.x+'px';arrow.style.top=edge.y+'px';arrow.firstChild.style.transform=`rotate(${edge.angle}deg)`;
    }
    for(const [id,card]of cards)if(!visibleCards.has(id)){card.remove();cards.delete(id);}
    for(const [id,arrow]of arrows)if(!visibleArrows.has(id)){arrow.remove();arrows.delete(id);}
  }
  return {update,clear(){root.replaceChildren();cards.clear();arrows.clear();}};
}
