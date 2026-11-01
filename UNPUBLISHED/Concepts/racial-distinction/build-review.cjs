// Review-only raster export and layout. No game assets are modified.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const packages = 'C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const { PNG } = require(packages + 'pngjs');
const { createCanvas, loadImage } = require(packages + '@napi-rs/canvas');
const dir = __dirname;
const spriteRoot = path.resolve(dir, '../../Animation/Bases');
const parse = f => JSON.parse(fs.readFileSync(f, 'utf8').replace(/^\uFEFF/, ''));
const specs = parse(path.join(dir, 'study-spec.json'));
const GRID = 4, W = 1120, H = 1448, BASE = 1376, HUMAN = 1280;
const sha = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex').toUpperCase();

function read(file) {
  return PNG.sync.read(fs.readFileSync(file), { checkCRC: true });
}
function bounds(im) {
  let x0 = im.width, y0 = im.height, x1 = -1, y1 = -1;
  for (let y = 0; y < im.height; y++) for (let x = 0; x < im.width; x++) {
    if (im.data[(y * im.width + x) * 4 + 3] >= 128) {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y);
      x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
  }
  if (x1 < 0) throw Error('Empty image');
  return { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1, bottom: y1 + 1 };
}

// Uniform whole-character scaling only. Independent X/Y stretching is never used.
// A common 4px logical grid and binary alpha keep the exports crisp.
function exportSprite(file, ratio, output) {
  const source = read(file), b = bounds(source);
  const lh = Math.round(HUMAN / GRID * ratio);
  const lw = Math.round(b.width / b.height * lh);
  const image = new PNG({ width: W, height: H });
  image.data.fill(0);
  const left = Math.floor((W / GRID - lw) / 2) * GRID;
  const top = BASE - lh * GRID;
  if (left < GRID || top < GRID) throw Error('Insufficient canvas padding');
  for (let y = 0; y < lh; y++) for (let x = 0; x < lw; x++) {
    const sx = b.x + Math.min(b.width - 1, Math.floor((x + .5) * b.width / lw));
    const sy = b.y + Math.min(b.height - 1, Math.floor((y + .5) * b.height / lh));
    const si = (sy * source.width + sx) * 4;
    if (source.data[si + 3] < 128) continue;
    for (let oy = 0; oy < GRID; oy++) for (let ox = 0; ox < GRID; ox++) {
      const di = ((top + y * GRID + oy) * W + left + x * GRID + ox) * 4;
      source.data.copy(image.data, di, si, si + 3);
      image.data[di + 3] = 255;
    }
  }
  let actual = bounds(image);
  // If nearest sampling misses the lowest isolated source pixel, translate to the common baseline.
  const dy = BASE - actual.bottom;
  if (dy) {
    const shifted = Buffer.alloc(image.data.length);
    for (let y = 0; y < H - dy; y++) image.data.copy(shifted, (y + dy) * W * 4, y * W * 4, (y + 1) * W * 4);
    image.data = shifted;
    actual = bounds(image);
  }
  if (output) fs.writeFileSync(output, PNG.sync.write(image));
  return { image, data: PNG.sync.write(image), sourceBounds: b, bounds: actual,
    targetRatio: ratio, actualRatio: actual.height / HUMAN, targetHeight: lh * GRID,
    sourceDimensions: [source.width, source.height], sourceScale: lh * GRID / b.height };
}

function metrics(image) {
  const b = bounds(image);
  let opaque = 0, partial = 0, gridErrors = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, a = image.data[i + 3];
    if (a === 255) opaque++; else if (a !== 0) partial++;
    const g = ((y - y % GRID) * W + x - x % GRID) * 4;
    if (!image.data.subarray(i, i + 4).equals(image.data.subarray(g, g + 4))) gridErrors++;
  }
  if (partial || gridErrors || b.bottom !== BASE || b.x <= 0 || b.y <= 0 || b.x + b.width >= W)
    throw Error('Alpha, baseline, grid or clipping check failed');
  return { dimensions: [W,H], visibleBounds: b, heightPercent: +(100*b.height/HUMAN).toFixed(2),
    widthToHeight: +(b.width/b.height).toFixed(3), opaquePixels: opaque,
    partialAlphaPixels: partial, gridErrors, footBaseline: BASE };
}

function silhouette(image) {
  const p = new PNG({width: W, height: H});
  for (let i = 0; i < image.data.length; i += 4) {
    p.data[i] = 224; p.data[i+1] = 231; p.data[i+2] = 231; p.data[i+3] = image.data[i+3];
  }
  return PNG.sync.write(p);
}

async function sheet(items, solid, zoom, name) {
  const sw = 1868, sh = 1000, canvas = createCanvas(sw*zoom, sh*zoom), ctx = canvas.getContext('2d');
  ctx.scale(zoom, zoom); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#17222a'; ctx.fillRect(0,0,sw,sh);
  const text = (s,x,y,size=14,color='#dbe4e7') => {ctx.fillStyle=color;ctx.font=`${size}px Arial`;ctx.fillText(s,x,y);};
  text(solid ? 'RACIAL DISTINCTION / SILHOUETTES' : 'RACIAL DISTINCTION / ANATOMY STUDIES',24,34,24);
  text('One shared scale: human 100%  |  dwarf A 75%, B 78%, C 70%  |  halfling A 60%, B 64%, C 54%',24,59,15,'#a7b8bf');
  text('All characters use the same ground baseline. A / B / C explore anatomy, not color variants.',24,80,13,'#a7b8bf');
  const placements=[];
  for (let row=0;row<2;row++) {
    const sex=row===0?'Male':'Female', y=100+row*432, base=y+350;
    const rowItems=[items.find(i=>i.id==='human-'+sex.toLowerCase()),
      ...['dwarf','halfling'].flatMap(r=>['a','b','c'].map(v=>items.find(i=>i.id===`${r}-${sex.toLowerCase()}-${v}`)))];
    ctx.fillStyle=row===0?'#1d2c35':'#21303a';ctx.fillRect(16,y,sw-32,418);
    text(sex.toUpperCase(),26,y+19,12,'#8ea4ae');
    for (let col=0;col<7;col++) {
      const item=rowItems[col], x=24+col*260;
      ctx.strokeStyle='#364c59';ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,base+.5);ctx.lineTo(x+252,base+.5);ctx.stroke();
      // Shared HUMAN-normalized canvas; no per-cell fit-to-box operation.
      const bitmap=await loadImage(solid?silhouette(item.image):item.data);
      const left=x+(252-W/GRID)/2, top=base-BASE/GRID;
      ctx.drawImage(bitmap,left,top,W/GRID,H/GRID);
      text(item.label,x+8,base+25,15);
      text(item.subtitle,x+8,base+46,12,'#b5c5cc');
      placements.push({id:item.id,worldRatio:item.bounds.height/HUMAN,scale:zoom/GRID,canvasLeft:left*zoom,
        canvasTop:top*zoom,baseline:base*zoom,displayHeight:item.bounds.height*zoom/GRID});
    }
  }
  text(solid?'Solid alpha silhouettes retain only the outer contour; clothing seams, colors and facial details are removed.':
    'Exploratory concepts only. New anatomy; existing human sprites provide the rendering reference. No game integration.',24,982,13,'#a7b8bf');
  fs.writeFileSync(path.join(dir,name),canvas.toBuffer('image/png'));
  return {file:name,dimensions:[sw*zoom,sh*zoom],uniformImageScale:zoom/GRID,placements};
}

async function main() {
  const missing=specs.filter(s=>!fs.existsSync(path.join(dir,'generation',s.id+'.png')));
  if(missing.length) throw Error('Missing generated samples: '+missing.map(s=>s.id).join(', '));
  const items=[], report={canvas:[W,H],logicalPixelSize:GRID,humanVisibleHeight:HUMAN,footBaseline:BASE,samples:[],sheets:[]};
  for(const sex of ['Male','Female']) {
    const human=exportSprite(path.join(spriteRoot,'Humans',sex,'base.png'),1);
    items.push({...human,id:'human-'+sex.toLowerCase(),label:'Human reference',subtitle:sex+' / 100%'});
  }
  for(const s of specs) {
    const file=path.join(dir,s.id+'.png'), result=exportSprite(path.join(dir,'generation',s.id+'.png'),s.ratio,file);
    const check=read(file), m=metrics(check);
    if(Math.abs(m.heightPercent-s.ratio*100)>.4) throw Error('Unexpected visible scale: '+s.id);
    report.samples.push({id:s.id,name:s.name,...m,sourceDimensions:result.sourceDimensions,sourceBounds:result.sourceBounds,
      uniformSourceScale:result.sourceScale,sha256:sha(file)});
    items.push({...result,id:s.id,label:(s.race==='Dwarves'?'Dwarf ':'Halfling ')+s.variant,subtitle:s.name+' / '+m.heightPercent+'%'});
  }
  for(const solid of [false,true]) for(const zoom of [1,4]) {
    const name=(solid?'silhouettes':'comparison')+(zoom===4?'-native':'-preview')+'.png';
    report.sheets.push(await sheet(items,solid,zoom,name));
  }
  const before=parse(path.join(dir,'existing-assets.sha256.json'));
  const changed=before.filter(i=>sha(i.Path)!==i.Hash);
  if(changed.length) throw Error('Existing sprite files changed: '+changed.map(i=>i.Path).join(', '));
  report.existingAssetsChecked=before.length;report.existingAssetsUnchanged=true;
  for(const s of report.sheets) { const im=read(path.join(dir,s.file));if(im.width!==s.dimensions[0]||im.height!==s.dimensions[1])throw Error('Sheet decode failure'); }
  fs.writeFileSync(path.join(dir,'validation.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({samples:report.samples.map(s=>({id:s.id,height:s.heightPercent,widthToHeight:s.widthToHeight})),
    sheets:report.sheets.map(s=>({file:s.file,dimensions:s.dimensions})),existingAssetsUnchanged:true},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
