// Temporary portraits crop the installed sprite's face, without generating new artwork.
export const NPC_FACE_CROPS=Object.freeze({
 'human-male':[164,58,160,170], 'human-female':[170,55,170,175],
 'dwarf-male':[156,112,182,215], 'dwarf-female':[155,112,190,205],
 'halfling-male':[172,190,160,175], 'halfling-female':[172,195,165,165]
});
export function createSpeakerPortrait(art,id,name){
 const figure=document.createElement('figure');figure.className='speaker-portrait';figure.dataset.speaker=id;
 const face=document.createElement('div');face.className='speaker-face';
 if(id==='fenris'){
  face.classList.add('fenris-face');const img=document.createElement('img');img.src='assets/fenris/portrait.png';img.alt='Fenris';face.append(img);
 }else{
  const base=art.people[id]?.walkBase,image=art[id+'-idle'],crop=NPC_FACE_CROPS[base];
  if(!image||!crop)throw Error('Missing speaker portrait source for '+id);
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;canvas.setAttribute('role','img');canvas.setAttribute('aria-label',name+' portrait');canvas.dataset.source=base;
  const g=canvas.getContext('2d');g.imageSmoothingEnabled=false;
  const [x,y,w,h]=crop,scale=Math.min(124/w,124/h),dw=w*scale,dh=h*scale;g.drawImage(image,x,y,w,h,(128-dw)/2,(128-dh)/2,dw,dh);face.append(canvas);
 }
 const label=document.createElement('figcaption');label.textContent=name;figure.append(face,label);return figure;
}
