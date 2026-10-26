export const GOODS=Object.freeze({bread:{name:'Dark bread',price:3,sell:1,heal:2},apple:{name:'Apple',price:1,sell:0,heal:1},bandage:{name:'Clean bandage',price:8,sell:3,heal:5},herbs:{name:'Healing herbs',price:6,sell:2,heal:3},firewood:{name:'Firewood bundle',price:2,sell:1,heal:0},cup:{name:'Iron cup',price:5,sell:2,heal:0}});
const STOCK={store:{bread:6,bandage:3},market:{apple:12,bread:4},smith:{cup:3,firewood:6},apothecary:{herbs:5,bandage:5}};
export function createVillageEconomy(){
  let copper=0,job='available',jobBonus=0,treatmentPrice=6;const terms={},conversationRewards=new Set();const bag={},stock=structuredClone(STOCK),harvested=new Set(),drank=new Set();
  const price=(shop,item)=>Math.max(1,(GOODS[item]?.price||0)+(terms[shop]||0));
  return {
    price,
    applyConversation(id,effects,shop){if(conversationRewards.has(id))return false;conversationRewards.add(id);for(const [item,count] of Object.entries(effects.items||{}))if(GOODS[item]&&Number.isInteger(count)&&count>0)bag[item]=(bag[item]||0)+count;if(effects.discount&&stock[shop])terms[shop]=-effects.discount;if(effects.surcharge&&stock[shop])terms[shop]=effects.surcharge;if(effects.jobBonus&&['available','accepted'].includes(job))jobBonus=effects.jobBonus;if(effects.treatmentPrice)treatmentPrice=effects.treatmentPrice;return true;},
    snapshot:()=>({copper,bag:{...bag},stock:structuredClone(stock),job,jobBonus,treatmentPrice,terms:{...terms}}),
    buy(shop,item){const good=GOODS[item];if(!good||!(stock[shop]?.[item]>0)||copper<price(shop,item))return false;copper-=price(shop,item);stock[shop][item]--;bag[item]=(bag[item]||0)+1;return true;},
    sell(shop,item){const good=GOODS[item];if(!good||!stock[shop]||!(bag[item]>0)||good.sell<1)return false;bag[item]--;copper+=good.sell;stock[shop][item]=(stock[shop][item]||0)+1;return true;},
    consume(item,character){const good=GOODS[item];if(!(bag[item]>0)||!good?.heal||character.hp>=character.maxHp||character.hp<=0)return 0;const healed=character.heal(good.heal);if(healed)bag[item]--;return healed;},
    acceptJob(){if(job!=='available')return false;job='accepted';return true;},
    stackWood(){if(job!=='accepted')return false;job='stacked';return true;},
    claimPay(){if(job!=='stacked')return false;job='paid';copper+=12+jobBonus;return true;},
    gatherWood(id){if(harvested.has(id))return false;harvested.add(id);bag.firewood=(bag.firewood||0)+1;return true;},
    drink(day,character){if(drank.has(day)||character.hp>=character.maxHp||character.hp<=0)return false;drank.add(day);character.heal(1);return true;},
    treatment(character){if(copper<treatmentPrice||character.hp>=character.maxHp||character.hp<=0)return false;copper-=treatmentPrice;character.heal(4);return true;}
  };
}
