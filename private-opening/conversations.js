// Authorable dialogue data. Checks use the shared character sheet, not a separate dice system.
const reply=(text,effects={},next='root')=>({text,effects,next});
const choice=(id,label,result,extra={})=>({id,label,result,...extra});
const check=(id,label,skill,dc,success,failure,extra={})=>({id,label,check:{skill,dc},success,failure,...extra});
const trust={attitude:1},cold={attitude:-1};
const roads=reply('The south road leads back into the trees. The stall sells food, and the woodcutter beside the smithy sometimes hires help. Nobody here is offering to guide you through the forest.');
export const CONVERSATIONS={
 harl:{root:{text:'Harl pauses beside a stack of timber and watches your hands. “Say what you want, Lupera.”',choices:[
  choice('peace','“Food, supplies, and no trouble. I will keep my distance.”',reply('“Then we understand each other. Keep to the streets.” He rests a hand on the timber again.',trust,'help')),
  check('explain','Explain that you woke alone and need somewhere to get your bearings.','persuasion',12,reply('He studies your face. “Lost, then. I will tell my neighbours you spoke to me. That is all I am promising.”',{attitude:1,flag:'neighboursInformed'},'help'),reply('“A story is not a reason to trust you. Buy what you need and keep moving.”',cold,'help'),{risk:'Failure makes Harl less receptive; the village remains open.'}),
  check('threat','“I could move you out of my way. Give me room.”','intimidation',14,reply('Harl takes a step back. “Fine. But the others will hear about this.”',{attitude:-1,flag:'villagersAlarmed'},'help'),reply('“Try it and every door here will close.” He calls a warning to the nearby villagers.',{attitude:-2,flag:'villagersAlarmed'},'help'),{risk:'Either outcome alarms the villagers: later Persuasion checks become harder.'})
 ]},help:{text:'“Ask, then. Briefly.”',choices:[choice('roads','Ask where the roads and shops lead.',roads),choice('voices','“Have you heard someone calling from the forest?”',reply('“I hear wind, animals and people who ought to be home. If you heard a person, I cannot tell you who.” He offers no explanation for what woke you.'))]}},
 edra:{root:{text:'Edra watches you, then glances toward the houses.',choices:[
  check('read','Watch what draws her attention.','insight',12,reply('She checks the homes whenever you move. Her concern seems to be for the people inside. You could address that directly.',{flag:'edraConcern'},'concern'),reply('Her expression gives you little to work with. She waits for you to speak.')),
  choice('distance','“I will stay away from the houses.”',reply('“See that you do.” Her shoulders relax a little.',trust,'help')),
  choice('hours','Ask when the shops open.',reply('“Most open at six. The smith starts at seven. The stall closes at six in the evening; the store at seven. Most of us go home before dark.”'))
 ]},concern:{text:'Edra follows your glance toward the houses. “What?”',choices:[choice('reassure','“They have nothing to fear from me. I will give them space.”',reply('“Then show them that.” She steps away from the nearest doorway.',trust,'help')),choice('dismiss','“Their fear is their problem.”',reply('“They are my neighbours. Of course it matters to me.”',{attitude:-2,flag:'villagersAlarmed'}))]},help:{text:'She listens, although she keeps her distance.',choices:[choice('roads','Ask where to find supplies.',roads),choice('forest','Ask whether anyone travels far into the forest.',reply('“Woodcutters, hunters, sometimes a traveller. Most return before dark. I have my weaving to finish. I cannot go with you.”'))]}},
 woodcutter:{root:{text:'Torren looks from your hands to the pile of logs. “Work is work. Do it properly and you get paid.”',choices:[
  check('lift','Offer to carry the heavier logs for better pay.','athletics',12,reply('You shift a heavy log without losing your grip. “All right. Four copper extra when the stack is finished.”',{attitude:1,jobBonus:4}),reply('The awkward weight slips. You set it down before it falls. “Twelve copper for the ordinary job. Do not overreach.”'),{group:'workTerms',requires:'jobUnpaid',risk:'Success adds four copper to the job. Failure keeps the original pay.'}),
  check('timber','Suggest a way to keep the stacked timber dry.','survival',11,reply('“Bark up, gaps underneath. You know that much.” He lets you keep a bundle of loose kindling.',{attitude:1,items:{firewood:1}}),reply('“That will trap the damp. Stack it the way I showed you.”')),
  choice('forest','Ask how far the woodland extends.',reply('“Farther than I care to walk. Tracks split, streams turn you around. Watch the ground and do not mistake a deer path for a road.”')),
  choice('fair','“Fair pay for honest work. Agreed.”',reply('“Then we have no quarrel.” He returns his attention to the logs.',trust))
 ]}},
 trader:{root:{text:'Dain rests a hand on the counter. “You can look. Do not touch unless you are buying.”',choices:[
  check('read','Read his hesitation before discussing prices.','insight',12,reply('His eyes follow your hands more than his stock. He seems more afraid of a broken shelf than a lost sale.',{flag:'dainConcern'},'bargain'),reply('You cannot tell whether he is frightened or simply impatient.',{},'bargain')),
  choice('prices','“Can we discuss the price?”',reply('“You can ask. I have not promised to change it.”',{},'bargain')),
  choice('respect','Place your hands in view and give the counter more room.',reply('“That is better.” He stops edging backward.',trust))
 ]},bargain:{text:'Dain waits for your offer.',choices:[
  check('fair','Promise careful, quiet business in exchange for fairer prices.','persuasion',10,reply('“One copper off each item, then. Keep your word.”',{attitude:1,discount:1}),reply('“Quiet customers still pay the marked price.”'),{requires:'dainConcern',group:'price',risk:'One negotiation per visit. Failure leaves normal prices.'}),
  check('discount','Ask for a small discount on supplies.','persuasion',13,reply('“One copper off. That is as far as I go.”',{attitude:1,discount:1}),reply('“The marked price is the price.”'),{group:'price',risk:'One negotiation per visit. Failure leaves normal prices.'}),
  check('pressure','Lean over the counter and insist on a lower price.','intimidation',14,reply('He pushes the price board aside. “One copper less. Buy, and leave.” He will tell his neighbours.',{attitude:-1,discount:1,flag:'villagersAlarmed'}),reply('He pulls the stock back. “An extra copper for the trouble, then.” He calls to the neighbours.',{attitude:-2,surcharge:1,flag:'villagersAlarmed'}),{group:'price',risk:'Failure raises prices by one copper. Either outcome alarms the villagers.'})
 ]}},
 vendor:{root:{text:'Bessa draws a basket closer. “These are for sale.”',choices:[
  check('sort','Offer to separate the bruised fruit from the good apples.','nature',11,reply('You sort the basket without spoiling the fruit. “Two apples for the help. No more.”',{attitude:1,items:{apple:2}}),reply('“That one is sound. Leave it. I will do it myself.”',cold)),
  check('price','Ask for a fair price on provisions for the road.','persuasion',12,reply('“One copper off what can bear it. Apples are already cheap.”',{discount:1,attitude:1}),reply('“Everyone has a road to walk. Same price as before.”'),{group:'price',risk:'Success lowers prices by one copper, to a minimum of one.'}),
  choice('courtesy','Step back and wait for her to finish counting.',reply('“At least you have some manners.” She turns the basket so you can see the contents.',trust))
 ]}},
 innkeeper:{root:{text:'Vera keeps the way to the common room blocked. “You can speak from there.”',choices:[
  check('meal','Ask whether she can spare food in return for keeping out of the guests’ way.','persuasion',13,reply('“One loaf. Stay by the door and do not make me regret it.”',{attitude:1,items:{bread:1}}),reply('“I cannot feed every traveller. The stall sells bread.”')),
  check('care','Describe how to clean and bind a scrape, and offer to help with your own dressing.','medicine',12,reply('“You can do the washing yourself, then. Three copper for my time and cloth.”',{attitude:1,treatmentPrice:3}),reply('“Let me do the binding. Six copper, as before.”'),{risk:'Success halves the wound-dressing fee; failure leaves it unchanged.'}),
  choice('room','“Is there truly nowhere I could sleep?”',reply('“My rooms are full, and my guests are already staring. You may sit by the door. That is the offer.”')),
  choice('accept','“I understand. I will give your guests their space.”',reply('She gives a short nod. “Then we can manage.”',trust))
 ]}},
 blacksmith:{root:{text:'Rusk sets down a hammer but stays on his side of the workbench.',choices:[
  check('bellows','Offer to shift a heavy crate of fuel out of his way.','athletics',12,reply('You lift it clear of the workbench. “Useful hands, at least. Take a bundle of wood.”',{attitude:1,items:{firewood:1}}),reply('The crate catches against the bench. “Leave it before something breaks.”',cold)),
  check('trade','Ask for better prices after offering to keep clear of the forge.','persuasion',13,reply('“One copper off. And stay away from the hot iron.”',{attitude:1,discount:1}),reply('“It costs what it costs.”'),{group:'price',risk:'Success lowers this shop’s prices by one copper.'}),
  choice('tools','Ask what he makes.',reply('“Nails, hinges, pots. Things people actually need. Do not go looking for a weapon on my shelves.”'))
 ]}},
 herbalist:{root:{text:'Ilen moves a tray of clean cloth away from the edge of the table.',choices:[
  check('binding','Show how you would bind a cut without cutting off circulation.','medicine',12,reply('“That will hold.” She hands you a clean bandage. “Use it properly.”',{attitude:1,items:{bandage:1}}),reply('“Too tight. You would do more harm than good. Buy clean cloth and ask before using it.”')),
  check('herbs','Identify which drying herbs should be kept away from damp.','nature',13,reply('She checks your answer, then nods. “One small bundle. Keep it dry.”',{attitude:1,items:{herbs:1}}),reply('“Those need different storage. Do not gather something merely because it looks familiar.”')),
  choice('calling','“Could exhaustion make someone hear a voice?”',reply('“People describe many things when they have not slept. I cannot tell you what you heard from a few words. Eat, drink, and pay attention to how you feel.”')),
  choice('hands','Ask where to wash before touching anything.',reply('“The well. Use the cup, not the bucket.” She seems relieved that you asked.',trust))
 ]}},
 farmer:{root:{text:'Mara stands between you and the vegetable beds.',choices:[
  check('weeds','Offer to identify the weeds without disturbing the crops.','nature',12,reply('You point out the plants crowding the roots. “You do know something useful. Two apples for the advice.”',{attitude:1,items:{apple:2}}),reply('“That is a young crop, not a weed. Stay on the path.”',cold)),
  choice('path','“I will keep to the path.”',reply('“Please do.” She stops shielding the nearest bed.',trust,'talk')),
  choice('food','Ask where to buy food.',reply('“Bessa’s stall, north of the square. Take coin. She does not like strangers handling her produce.”'))
 ]},talk:{text:'Mara keeps working, but she has not asked you to leave.',choices:[choice('weather','Ask about the woodland paths.',reply('“Mud holds a footprint longer than a dry path. Streams are easier to cross where you can see the bottom. That is all the travel advice I have.”')),choice('alone','“Does anyone else come through here alone?”',reply('“Sometimes. Most do not stay. I cannot tell you where they go afterward.”'))]}},
 resident:{root:{text:'Oren leans away. “I said I have nothing for you.”',choices:[
  choice('space','Take a step back. “I only wanted to ask something.”',reply('He loosens his grip on his coat. “One question.”',trust,'question')),
  check('read','Look for what is making him anxious.','insight',12,reply('His gaze follows your teeth when you speak. A little distance may help more than another argument.',{flag:'orenFear'},'question'),reply('He avoids your eyes. Pressing him would only make this worse.')),
  check('press','Insist that he answer you.','intimidation',13,reply('“Ask somebody else!” He backs away and calls for his neighbours.',{attitude:-2,flag:'villagersAlarmed'}),reply('He turns away and calls for his neighbours instead.',{attitude:-2,flag:'villagersAlarmed'}),{risk:'Either outcome alarms the villagers; he has no secret explanation to give.'})
 ]},question:{text:'He waits for your question.',choices:[choice('calling','Ask whether he heard someone calling in the woods.',reply('“No. I stay inside after dark.” He seems eager to end the conversation.')),choice('help','Ask who might sell supplies.',roads)]}},
 washer:{root:{text:'Sella lifts wet linen clear of your reach.',choices:[
  check('cup','Ask to borrow a spare cup for your journey.','persuasion',11,reply('“This dented one. Keep it, and leave the washing alone.”',{attitude:1,items:{cup:1}}),reply('“Use the cup at the well. These belong to people.”')),
  check('cloth','Offer to spot tears before she hangs the linen.','perception',12,reply('You notice a torn seam before it catches on the line. “Good eyes. Here, a little bread for the help.”',{attitude:1,items:{bread:1}}),reply('You find nothing she has not already noticed. “I can manage.”')),
  choice('water','“I will use the cup and keep my hands out of the bucket.”',reply('“Then we understand each other.”',trust))
 ]}}
};

export function createConversations({rng=Math.random}={}){
  const resolved=new Map(),flags=new Set(),attitudes=new Map(),history=[];
  const key=(npc,option)=>`${npc}:${option.group||option.id}`;
  const available=(option,context)=>!option.requires||(option.requires==='jobUnpaid'?['available','accepted'].includes(context.job):flags.has(option.requires));
  const difficulty=option=>option.check.dc+(flags.has('villagersAlarmed')&&option.check.skill==='persuasion'?2:0);
  return {
    view(npc,node='root',character,context={}){
      const data=CONVERSATIONS[npc]?.[node];if(!data)return null;
      return {text:data.text,attitude:attitudes.get(npc)||0,alert:flags.has('villagersAlarmed'),choices:data.choices.filter(o=>available(o,context)).map(o=>({id:o.id,label:o.label,risk:o.risk,check:o.check?{skill:o.check.skill,dc:difficulty(o),bonus:character.skillBonus(o.check.skill)}:null,resolved:resolved.has(key(npc,o))}))};
    },
    choose(npc,node,id,character,context={}){
      const option=CONVERSATIONS[npc]?.[node]?.choices.find(o=>o.id===id);if(!option||!available(option,context))return null;
      const idKey=key(npc,option);if(resolved.has(idKey))return {...structuredClone(resolved.get(idKey)),fresh:false};
      const roll=option.check?{...character.roll('skill',option.check.skill,{rng}),skill:option.check.skill,dc:difficulty(option)}:null;
      const success=roll?roll.total>=roll.dc:null,outcome=roll?(success?option.success:option.failure):option.result;
      const effects=structuredClone(outcome.effects);if(effects.flag)flags.add(effects.flag);
      attitudes.set(npc,Math.max(-3,Math.min(3,(attitudes.get(npc)||0)+(effects.attitude||0))));
      const result={key:idKey,npc,choice:option.label,text:outcome.text,next:outcome.next,roll,success,effects,fresh:true};
      resolved.set(idKey,result);history.push(result);return structuredClone(result);
    },
    snapshot:()=>({flags:[...flags],attitudes:Object.fromEntries(attitudes),history:structuredClone(history)})
  };
}
