// Review-only raster export and layout. No game assets are modified.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const packages = 'C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const { PNG } = require(packages + 'pngjs');
const { createCanvas, loadImage } = require(packages + '@napi-rs/canvas');
const dir = __dirname;
const spriteRoot = path.resolve(dir, '../../../Animation/Bases');
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

async function renderSheet(rows, solid, zoom, filename) {
  const sw = rows[0].length * 260 + 48, sh = 100 + rows.length * 432 + 36;
  const canvas = createCanvas(sw * zoom, sh * zoom), ctx = canvas.getContext('2d');
  ctx.scale(zoom, zoom); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#17222a'; ctx.fillRect(0,0,sw,sh);
  function text(s,x,y,size=14,color='#dbe4e7') {ctx.fillStyle=color;ctx.font=`${size}px Arial`;ctx.fillText(s,x,y);}
  text(solid?'REFINED BASES / SILHOUETTES':'REFINED BASES / COMMONER CLOTHING & GROOMING',24,34,22);
  text('Shared scale: humans 100% | dwarf male 75% | dwarf female 70% | halflings 60%',24,60,14,'#a7b8bf');
  text(solid?'Solid contours of the refined sprites; humans provide a scale reference.':'Selected anatomy retained: dwarf male A, dwarf female C, halfling male A and female A.',24,81,13,'#a7b8bf');
  const placements=[];
  for(let r=0;r<rows.length;r++) {
    const y=100+r*432, base=y+350;
    ctx.fillStyle=r%2?'#21303a':'#1d2c35';ctx.fillRect(16,y,sw-32,418);
    for(let c=0;c<rows[r].length;c++) {
      const item=rows[r][c], x=24+c*260;
      ctx.strokeStyle='#364c59';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,base+.5);ctx.lineTo(x+252,base+.5);ctx.stroke();
      const image=await loadImage(solid?silhouette(item.image):item.data);
      const left=x+(252-W/GRID)/2,top=base-BASE/GRID;
      ctx.drawImage(image,left,top,W/GRID,H/GRID);
      text(item.label,x+8,base+25,15);
      text(item.subtitle,x+8,base+47,12,'#b5c5cc');
      placements.push({id:item.id,scale:zoom/GRID,baseline:base*zoom,displayHeight:item.bounds.height*zoom/GRID,
        worldHeightRatio:item.bounds.height/HUMAN,left:left*zoom,top:top*zoom});
    }
  }
  text('Review only / no armor / no animation or game integration / all original assets preserved',24,sh-18,12,'#a7b8bf');
  fs.writeFileSync(path.join(dir,filename),canvas.toBuffer('image/png'));
  return {file:filename,dimensions:[sw*zoom,sh*zoom],uniformImageScale:zoom/GRID,placements};
}

async function main() {
  const parent=path.dirname(dir), refined=[], selected=[], humans=[];
  const report={canvas:[W,H],logicalPixelSize:GRID,humanVisibleHeight:HUMAN,footBaseline:BASE,samples:[],sheets:[]};
  for(const sex of ['Male','Female']) {
    const h=exportSprite(path.join(spriteRoot,'Humans',sex,'base.png'),1);
    humans.push({...h,id:'human-'+sex.toLowerCase(),sex,label:'Human '+sex.toLowerCase(),subtitle:'Existing reference / 100%'});
  }
  for(const s of specs) {
    const selectedPath=path.join(parent,s.source+'.png'), old=read(selectedPath), oldBounds=bounds(old);
    if(old.width!==W||old.height!==H||oldBounds.bottom!==BASE)throw Error('Unexpected selected-concept geometry');
    selected.push({id:s.source,sex:s.sex,race:s.race,image:old,data:fs.readFileSync(selectedPath),bounds:oldBounds,
      label:s.race+' '+s.sex.toLowerCase(),subtitle:'Selected '+s.source.slice(-1).toUpperCase()+' / '+s.ratio*100+'%'});
    const finalPath=path.join(dir,s.id+'.png');
    const item=exportSprite(path.join(dir,'generation',s.id+'.png'),s.ratio,finalPath);
    const m=metrics(read(finalPath));
    if(m.visibleBounds.height!==oldBounds.height)throw Error('Selected world height changed: '+s.id);
    refined.push({...item,id:s.id,sex:s.sex,race:s.race,label:s.race+' '+s.sex.toLowerCase(),subtitle:'Refined / '+m.heightPercent+'%'});
    report.samples.push({id:s.id,selectedConcept:s.source,...m,selectedHeight:oldBounds.height,
      selectedWidth:oldBounds.width,visibleWidthChange: m.visibleBounds.width-oldBounds.width,
      sourceDimensions:item.sourceDimensions,uniformSourceScale:item.sourceScale,sha256:sha(finalPath)});
  }
  const comparisonRows=['Male','Female'].map(sex=>[humans.find(i=>i.sex===sex),
    ...['Dwarf','Halfling'].flatMap(race=>[selected.find(i=>i.sex===sex&&i.race===race),refined.find(i=>i.sex===sex&&i.race===race)])]);
  const silhouetteRows=[['Male','Female'].flatMap(sex=>[humans.find(i=>i.sex===sex),
    ...['Dwarf','Halfling'].map(race=>refined.find(i=>i.sex===sex&&i.race===race))])];
  for(const zoom of [1,4]) {
    const suffix=zoom===4?'native':'preview';
    report.sheets.push(await renderSheet(comparisonRows,false,zoom,'comparison-'+suffix+'.png'));
    report.sheets.push(await renderSheet(silhouetteRows,true,zoom,'silhouettes-'+suffix+'.png'));
  }
  const previous=parse(path.join(dir,'existing-assets.sha256.json'));
  const changed=previous.filter(i=>sha(i.Path)!==i.Hash);
  if(changed.length)throw Error('Existing files changed: '+changed.map(i=>i.Path).join(', '));
  report.existingFilesChecked=previous.length;report.existingFilesUnchanged=true;
  for(const sheet of report.sheets) {
    const decoded=read(path.join(dir,sheet.file));
    if(decoded.width!==sheet.dimensions[0]||decoded.height!==sheet.dimensions[1])throw Error('Sheet decode/dimension failure');
  }
  fs.writeFileSync(path.join(dir,'validation.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({samples:report.samples.map(s=>({id:s.id,height:s.heightPercent,widthChange:s.visibleWidthChange,partialAlpha:s.partialAlphaPixels,gridErrors:s.gridErrors})),sheets:report.sheets.map(s=>({file:s.file,dimensions:s.dimensions})),existingFilesChecked:previous.length,existingFilesUnchanged:true},null,2));
}
main().catch(e=>{console.error(e);process.exitCode=1;});


