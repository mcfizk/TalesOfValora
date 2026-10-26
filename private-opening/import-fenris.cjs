// Optional authoring tool: copy approved exports from the separate local sprite archive.
const fs = require('node:fs');
const path = require('node:path');
const source = path.resolve(__dirname, '../../Sprites/Fenris white');
const assets = path.join(__dirname, 'assets');
const target = path.join(assets, 'fenris');
const directions = ['left', 'right', 'up-left', 'up-right', 'up', 'down-left', 'down-right', 'down'];
const restRoot = path.join(source, 'Rest and awakening');
const rest = JSON.parse(fs.readFileSync(path.join(restRoot, 'rest-animations.json'), 'utf8').replace(/^\uFEFF/, ''));
const copies = [
  [path.join(source, 'Idle 8 frames/Fenris_idle_8_frames.png'), 'idle.png'],
  [path.join(source, 'Idle 8 frames/Fenris_idle_01.png'), 'portrait.png'],
  ...directions.map(direction => [path.join(source, `Walking 8 frames/${direction}/Fenris_walk_${direction}_sheet.png`), `walk-${direction}.png`]),
  ...Object.entries(rest.clips).map(([action,spec]) => [path.join(restRoot,spec.file), `${action}.png`]),
];
for (const [file] of copies) if (!fs.existsSync(file)) throw new Error(`Missing approved sprite export: ${file}`);
fs.mkdirSync(target, {recursive: true});
for (const [file, name] of copies) fs.copyFileSync(file, path.join(target, name));
const manifestPath = path.join(assets, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^\uFEFF/, ''));
manifest.fenrisFrames = 8;
manifest.fenrisSource = 'Fenris white: idle, eight-direction walking, sleep, sit, and awakening transitions, October 2026';
manifest.fenrisAnimations = {
  id: 'fenris', formatVersion: 1,
  displayHeight: 36,
  restFrame: 6,
  idle: {file: 'fenris/idle.png', frameWidth: 400, frameHeight: 528, columns: 4, frames: 8, fps: 4, loop: true, anchor: [200, 500], bodyHeight: 466},
  walk: {files: Object.fromEntries(directions.map(direction => [direction, `fenris/walk-${direction}.png`])), frameWidth: 512, frameHeight: 640, columns: 4, frames: 8, fps: 8, loop: true, anchor: [256, 610], bodyHeight: 550},
  ...Object.fromEntries(Object.entries(rest.clips).map(([action,spec]) => [action,{...spec,file:`fenris/${action}.png`}])),
  wakeSequence: rest.wakeSequence,
};
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log('Imported the complete Fenris animation set and shared-standard metadata.');
