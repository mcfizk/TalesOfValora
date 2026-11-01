const bark=(name,text)=>({file:`voice/fenris/barks/${name}.mp3`,kind:'voice',text,speaker:'Fenris',gain:.8});
const effect=(name,gain=.35)=>({file:`sfx/forest/${name}.mp3`,kind:'sfx',gain});
export const AUDIO_CLIPS={
  hmm:bark('hmm','Hmm…'),curious:bark('curious','Curious.'),'easy-easy':bark('easy-easy','Easy, easy.'),'got-it':bark('got-it','Got it.'),
  'huh-thats-new':bark('huh-thats-new',"Huh, that's new."),'let-me-look':bark('let-me-look','Let me look.'),listen:bark('listen','Listen.'),
  'stand-back':bark('stand-back','Stand back!'),'this-way':bark('this-way','This way.'),'what-the':bark('what-the','What the…?'),
  'fenris-curiosity':{file:'voice/fenris/dialogue/i-have-always-been-more-curious-than-cautious.mp3',kind:'voice',speaker:'Fenris',text:'I have always been more curious than cautious.',gain:.8,reserved:true},
  wind:{...effect('night-wind-through-trees',.23),kind:'ambience'},footsteps:effect('footsteps-dry-leaves',.32),
  'twig-snap':effect('twig-snap',.4),creaking:effect('old-tree-creaking',.2),crows:effect('crows-cawing',.2),wings:effect('bird-wings-takeoff',.22),
  howl:effect('wolf-howl-distant',.17),whistle:effect('eerie-wind-whistle',.12),
  growl:{...effect('beast-low-growl',.35),reserved:true},'heavy-steps':{...effect('creature-heavy-steps',.3),reserved:true}
};
const rixa=[
 ['come-here','come-here-you-great-daft-wolf-im-not-asking-twice',"Come here, you great daft wolf. I'm not asking twice."],
 ['mostly','course-i-know-what-im-doing-mostly',"Course I know what I'm doing. Mostly."],
 ['performance','oi-you-always-this-bloody-stupid-or-am-i-getting-a-special-performance',"Oi, you always this bloody stupid, or am I getting a special performance?"],
 ['stronger','see-thats-your-problem-you-think-i-need-to-be-stronger-than-you',"See, that's your problem. You think I need to be stronger than you."],
 ['terrible-idea','thats-a-terrible-idea-go-on',"That's a terrible idea. Go on."],
 ['call-me','you-can-call-me-whatever-you-bloody-like-doesnt-mean-im-gonna-answer',"You can call me whatever you bloody like. Doesn't mean I'm gonna answer."]
];
for(const [id,file,text]of rixa)AUDIO_CLIPS['rixa-'+id]={file:`voice/rixa/dialogue/${file}.mp3`,text,speaker:'Rixa',kind:'voice',gain:.8,reserved:true};
export const CREATURE_AUDIO={
  deer:{noticed:'browsing',fleeing:'bounding-away',warning:'alarm-snort',hurt:'distress-bleat'},
  wolf:{noticed:'howl-close',warning:'warning-bark',threat:'snarl',hurt:'yelp'},
  hare:{noticed:'foot-thump',fleeing:'dash-away',hurt:'distress-squeal'},
  owl:{noticed:'hoot-call-answer',fleeing:'wings-takeoff',warning:'alarm-hiss',threat:'screech'}
};
for(const [unit,cues]of Object.entries(CREATURE_AUDIO))for(const [cue,file]of Object.entries(cues))AUDIO_CLIPS[`${unit}-${cue}`]={file:`sfx/creatures/${unit}/${file}.mp3`,kind:'sfx',gain:cue==='hurt'?.25:.3,reserved:unit!=='deer'};
export const audioUrl=id=>new URL('./private-opening/assets/audio/'+AUDIO_CLIPS[id].file,import.meta.url).href;
export function eventAudio(event,outcome){
  const config=event?.audio;
  return {effect:config?.[outcome.awareness||outcome.type]||null,voice:outcome.awareness==='surprised'?'what-the':outcome.type==='discovered'?(event?.id==='placeholder-deer'?'curious':'hmm'):event?.id==='placeholder-deer'?'easy-easy':null};
}
