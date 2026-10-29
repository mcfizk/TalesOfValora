import {createConversations} from './conversations.js';
import {createVillageEconomy,GOODS} from './village-economy.js';
import {isOpen,SHOP_HOURS,makeInterior} from './village-layout.js';
export function createVillageUI({state,world,getStats,dialog,presentConversation,paragraph,button,closePanel,notify,relocate,onObservation,onConversation=()=>{}}){
  let economy=createVillageEconomy(),conversations=createConversations(),activePoint=null;
  const show=(title,text,actions=[])=>{if(onObservation&&activePoint&&!actions.length){closePanel();onObservation(activePoint,{title,text});return;}const content=document.createElement('div');content.append(paragraph(text),...actions,button('Leave',closePanel));dialog(title,content);};
  function trade(shop){
    const s=economy.snapshot(),content=document.createElement('div');content.className='trade-panel';
    content.append(paragraph(`You have ${s.copper} copper. No credit.`));
    for(const [id,count] of Object.entries(s.stock[shop]||{})){
      const good=GOODS[id],price=economy.price(shop,id),row=document.createElement('div');row.className='trade-row';const label=document.createElement('span');label.textContent=`${good.name} · ${price} copper · ${count} left${good.heal?` · restores ${good.heal} health`:''}`;
      const buy=button('Buy',()=>{economy.buy(shop,id);trade(shop);});buy.disabled=count<1||s.copper<price;row.append(label,buy);content.append(row);
    }
    if(Object.entries(s.bag).some(([id,n])=>n>0&&GOODS[id].sell)){const h=document.createElement('h3');h.textContent='Sell supplies';content.append(h);}
    for(const [id,n] of Object.entries(s.bag))if(n>0&&GOODS[id].sell){content.append(button(`Sell ${GOODS[id].name} · ${GOODS[id].sell} copper (${n} carried)`,()=>{economy.sell(shop,id);trade(shop);}));}
    content.append(button('Done trading',closePanel));dialog(world.village.buildings.find(b=>b.id===shop).label,content);
  }
  function inventory(){
    const s=economy.snapshot(),sheet=getStats(),content=document.createElement('div');content.append(paragraph(`${s.copper} copper · Health ${sheet.hp}/${sheet.maxHp}`));
    if(!Object.values(s.bag).some(n=>n>0))content.append(paragraph('Your pack is empty.'));
    for(const [id,n] of Object.entries(s.bag))if(n>0){const good=GOODS[id],row=document.createElement('div');row.className='trade-row';row.append(paragraph(`${good.name} × ${n}${good.heal?` · restores ${good.heal} health`:''}`));if(good.heal){const use=button('Use',()=>{economy.consume(id,sheet);inventory();});use.disabled=sheet.hp>=sheet.maxHp||sheet.hp<=0;row.append(use);}content.append(row);}
    const jobText={available:'The woodcutter near the smithy may have work.',accepted:'Stack the firewood south of the smithy, then return to Torren.',stacked:`The wood is stacked. Torren owes you ${12+s.jobBonus} copper.`,paid:`Torren paid ${12+s.jobBonus} copper for stacking the firewood.`};
    if(state.visitedVillage)content.append(paragraph(jobText[s.job]));content.append(paragraph('Supplies and purchases last for this visit. Restarting the awakening clears them.'),button('Close pack',closePanel));dialog('Your pack',content);
  }
  function services(point){
    const actions=[],s=economy.snapshot();
    if(point.shop&&point.shop!=='inn'){
      if(isOpen(point.shop,state.clock.hour))actions.push(button('See the goods',()=>trade(point.shop)));
      else actions.push(paragraph('Trading has closed for the day.'));
    }
    if(point.shop==='inn'){
      actions.push(button('Sit by the door',()=>{closePanel();state.seated=true;state.player.action='sit';state.player.actionTime=0;notify('Move when you are ready to stand.');}));
      const care=button(`Have a scrape dressed · ${s.treatmentPrice} copper`,()=>{if(economy.treatment(getStats()))notify('The innkeeper dresses your scrapes.');person(point);});care.disabled=s.copper<s.treatmentPrice||getStats().hp>=getStats().maxHp;actions.push(care);
    }
    if(point.actorId==='woodcutter'){
      if(s.job==='available')actions.push(button('Accept the work',()=>{economy.acceptJob();person(point,'root',{text:`“Stack the logs south of the smithy, then come back. ${12+s.jobBonus} copper when it is done.”`});}));
      if(s.job==='accepted')actions.push(paragraph(`Job: stack the wood south of the smithy. Agreed pay: ${12+s.jobBonus} copper.`));
      if(s.job==='stacked')actions.push(button(s.jobBonus?`Collect ${12+s.jobBonus} copper`:'Collect twelve copper',()=>{economy.claimPay();person(point,'root',{text:`“${12+s.jobBonus} copper, as agreed. Do not take that as an invitation to linger.”`});}));
      if(s.job==='paid')actions.push(paragraph(`Torren has paid ${12+s.jobBonus} copper. There is no more work this visit.`));
    }
    return actions;
  }
  const skillName=id=>id.charAt(0).toUpperCase()+id.slice(1);
  function person(point,node='root',result=null){
    const view=conversations.view(point.actorId,node,getStats(),economy.snapshot());if(!view)return show(point.name,point.line);
    const content=document.createElement('div');content.className='conversation';
    const npcTurn=document.createElement('div'),playerTurn=document.createElement('div'),npcLines=document.createElement('div'),playerLines=document.createElement('div');
    npcTurn.className='dialogue-turn npc-turn';playerTurn.className='dialogue-turn player-turn';npcLines.className=playerLines.className='speaker-lines';npcTurn.append(npcLines);playerTurn.append(playerLines);content.append(npcTurn,playerTurn);
    const mood=document.createElement('p');mood.className='conversation-mood';mood.textContent=`${view.attitude>=2?'Cautiously receptive':view.attitude>0?'Less guarded':view.attitude<=-2?'Hostile':view.attitude<0?'Suspicious':'Wary'}${view.alert?' · Word of your threats has spread (Persuasion DC +2)':''}`;npcLines.append(mood);
    npcLines.append(paragraph(result?.text||view.text));
    if(result?.roll){const r=result.roll,summary=document.createElement('p');summary.className=`check-result ${result.success?'success':'failure'}`;summary.setAttribute('role','status');summary.textContent=`${result.success?'Success':'Failure'} · ${skillName(r.skill)}: d20 ${r.roll} ${r.bonus>=0?'+':'−'} ${Math.abs(r.bonus)} = ${r.total} · DC ${r.dc}`;npcLines.append(summary);}
    if(result?.effects){const e=result.effects,changes=[];
      for(const [id,n] of Object.entries(e.items||{}))changes.push(`Received ${n} × ${GOODS[id].name}.`);
      if(e.discount)changes.push(`This shop’s prices are ${e.discount} copper lower (minimum 1).`);
      if(e.surcharge)changes.push(`This shop’s prices are ${e.surcharge} copper higher.`);
      if(e.jobBonus)changes.push(`Agreed job pay: ${12+e.jobBonus} copper.`);
      if(e.treatmentPrice)changes.push(`Wound dressing now costs ${e.treatmentPrice} copper.`);
      if(changes.length){const outcome=paragraph(changes.join(' '));outcome.className='conversation-outcome';npcLines.append(outcome);}
    }
    if(node!=='root'&&result)npcLines.append(paragraph(view.text));
    if(result?.choice){const selected=paragraph('Your choice: '+result.choice);selected.className='player-choice';playerLines.append(selected);}
    const choices=document.createElement('div');choices.className='conversation-choices';
    for(const option of view.choices){
      const choose=button(option.label,()=>{
        const outcome=conversations.choose(point.actorId,node,option.id,getStats(),economy.snapshot());if(!outcome)return;
        if(outcome.fresh){economy.applyConversation(outcome.key,outcome.effects,point.shop);const id=`conversation:${outcome.key}`,r=outcome.roll;state.found.add(id);state.notes.set(id,{title:`${point.name} · ${point.role}`,text:`${outcome.choice} ${outcome.text}${r?` (${skillName(r.skill)} ${r.total}, DC ${r.dc}: ${outcome.success?'success':'failure'}.)`:''}`});document.getElementById('journal-dot').hidden=false;}
        if(outcome.fresh)onConversation(point.actorId,outcome,conversations.snapshot().attitudes[point.actorId]||0);
        person(point,outcome.next,outcome);
      },'conversation-choice');
      if(option.check){const detail=document.createElement('small'),c=option.check;detail.textContent=`${skillName(c.skill)} ${c.bonus>=0?'+':''}${c.bonus} · DC ${c.dc}${option.resolved?' · Already attempted':' · One attempt this visit'}`;choose.append(detail);choose.disabled=option.resolved;}
      else if(option.resolved){const detail=document.createElement('small');detail.textContent='Discussed · Read again';choose.append(detail);}
      if(option.risk){const risk=document.createElement('small');risk.className='choice-risk';risk.textContent=option.risk;choose.append(risk);}
      choices.append(choose);
    }
    playerLines.append(choices);
    const actions=document.createElement('div');actions.className='conversation-services';
    if(node==='root')actions.append(...services(point));else actions.append(button('Something else',()=>person(point)));
    actions.append(button('Leave',closePanel));playerLines.append(actions);
    presentConversation(point,content);
  }
  function interact(point){
    if(point.type!=='village')return false;
    activePoint=point;
    if(point.actorId){person(point);return true;}
    if(point.id==='exit'){const target=state.interior.returnTo;state.interior=null;relocate(target);return true;}
    if(point.id==='woodpile'){
      const status=economy.snapshot().job;
      if(status==='accepted')show('Unstacked firewood','Rough split logs lie beside the smithy. Torren asked you to stack them.',[button('Stack the wood',()=>{economy.stackWood();show('Stacked firewood','The logs are neatly stacked. Return to Torren for your pay.');})]);
      else show('Firewood',status==='available'?'The wood belongs to someone. The woodcutter nearby may have work.':'The logs are neatly stacked against the fence.');
      return true;
    }
    const b=world.village.buildings.find(b=>b.id===point.buildingId);if(!b)return true;
    if(b.id==='well'){const drink=button('Drink from the cup',()=>{const healed=economy.drink(state.clock.day,getStats());show('Village well',healed?'Cool water eases your weariness. Restored one health.':'The water is cold and clear.');});show(b.label,'A bucket hangs beneath the roof. A battered cup rests on the stone rim.',[drink]);return true;}
    if(b.id==='shed'){show(b.label,'Rakes, spare handles and coils of rope fill a shared tool shed. Its door is latched; these tools belong to the villagers.');return true;}
    if(b.id.startsWith('home')){show(b.label,'A shutter closes as you approach. The door is barred from within.');return true;}
    if(!isOpen(b.id,state.clock.hour)){const [open,close]=SHOP_HOURS[b.id];show(b.label,`Closed. A board by the entrance lists the hours: ${String(open).padStart(2,'0')}:00–${close}:00.`);return true;}
    if(b.id==='market'){const vendor=state.people.find(p=>p.shop==='market');if(vendor)person(vendor);return true;}
    state.interior=makeInterior(b);relocate({x:120,y:155});notify(b.label);return true;
  }
  return {interact,inventory,serialize:()=>({economy:economy.serialize(),conversations:conversations.snapshot()}),load(saved){const e=createVillageEconomy(),c=createConversations();e.load(saved.economy);c.load(saved.conversations);economy=e;conversations=c;},snapshot:(includeConversations=true)=>({...economy.snapshot(),...(includeConversations?{conversations:conversations.snapshot()}:{})}),reset(){economy=createVillageEconomy();conversations=createConversations();},gatherWood:id=>economy.gatherWood(id)};
}
