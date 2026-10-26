// Cards are keyed by character id so future companions share the same two bars.
export function createPartyHud(root){
  const cards=new Map();
  const element=(tag,cls,text)=>{const e=document.createElement(tag);e.className=cls;if(text)e.textContent=text;return e;};
  function meter(kind){
    const bar=element('div',`resource-meter ${kind}`),fill=element('span','meter-fill'),text=element('span','meter-text');
    bar.setAttribute('role','meter');bar.setAttribute('aria-valuemin','0');bar.append(fill,text);return{bar,fill,text};
  }
  function create(member){
    const card=element('article','party-card'),name=element('div','party-name',member.name),portrait=element('div','portrait'),img=document.createElement('img');
    card.dataset.character=member.id;card.setAttribute('aria-label',member.name);img.src=member.portrait;img.alt=`${member.name} portrait`;
    if(member.portraitCrop){const c=member.portraitCrop;portrait.style.setProperty('--portrait-scale',`${c.scale*100}%`);portrait.style.setProperty('--portrait-x',`${c.left*100}%`);portrait.style.setProperty('--portrait-y',`${c.top*100}%`);}
    portrait.append(img);const health=meter('health'),power=meter('power'),status=element('small','party-status');
    if(member.id==='fenris')status.id='character-state';
    card.append(name,portrait,health.bar,power.bar,status);root.append(card);
    return{card,name,img,health,power,status};
  }
  function setMeter(m,label,current,max,active=true){
    const ratio=max>0?Math.max(0,Math.min(1,current/max)):0;
    m.fill.style.width=`${ratio*100}%`;m.text.textContent=active?`${label} ${current}/${max}`:`${label} —`;
    m.bar.setAttribute('aria-label',label);m.bar.setAttribute('aria-valuenow',String(current));m.bar.setAttribute('aria-valuemax',String(max||1));
    m.bar.setAttribute('aria-valuetext',active?`${current} of ${max}`:'Inactive');m.bar.classList.toggle('inactive',!active);
  }
  return{
    update(members){
      const ids=new Set(members.map(m=>m.id));for(const [id,c]of cards)if(!ids.has(id)){c.card.remove();cards.delete(id);}
      for(const member of members){
        let c=cards.get(member.id);if(!c){c=create(member);cards.set(member.id,c);}
        const s=member.stats,p=s.power||{kind:null,current:0,max:0,active:false};
        c.name.textContent=member.name;c.status.textContent=member.status||'';
        setMeter(c.health, 'Health',s.hp,s.maxHp);
        setMeter(c.power,p.kind?p.kind[0].toUpperCase()+p.kind.slice(1):'Power',p.current,p.max,p.active);
        c.power.bar.dataset.kind=p.kind||'none';
      }
    }
  };
}
