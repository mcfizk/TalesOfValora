const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const assert = require('assert/strict');
const deps = 'C:/Users/Mcfiz/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/';
const { PNG } = require(deps + 'pngjs');
const sharp = require(deps + 'sharp');
const ROOT = __dirname, W = 640, H = 640, BASELINE = 610;
const DIRECTIONS = ['left', 'up-left', 'up', 'up-right', 'right', 'down-right', 'down', 'down-left'];
const REST = { idle: [8, 4, true], sit: [4, 2, true], sleep: [4, 2, true], sleepToSit: [5, 4, false], sitToStand: [8, 4, false], sitToSleep: [5, 4, false], standToSit: [8, 4, false] };
const readJSON = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));
const registrationFile = path.join(ROOT, 'registration.json');
const registration = fs.existsSync(registrationFile) ? readJSON(registrationFile) : {};
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const relative = p => path.relative(ROOT, p).split(path.sep).join('/');
const median = list => [...list].sort((a, b) => a - b)[Math.floor(list.length / 2)];
function bounds(p) {
  let x0 = p.width, y0 = p.height, x1 = -1, y1 = -1;
  for (let y = 0; y < p.height; y++) for (let x = 0; x < p.width; x++) {
    if (p.data[(y * p.width + x) * 4 + 3] >= 128) {
      x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
    }
  }
  assert(x1 >= x0 && y1 >= y0, 'Empty sprite');
  return { x: x0, y: y0, width: x1 - x0 + 1, height: y1 - y0 + 1, right: x1, bottom: y1 };
}
function torsoCenter(p, b) {
  const centers = [];
  for (let y = Math.floor(b.y + b.height * .40); y < b.y + b.height * .55; y++) {
    let left = p.width, right = -1;
    for (let x = b.x; x <= b.right; x++) if (p.data[(y * p.width + x) * 4 + 3] >= 128) {
      left = Math.min(left, x); right = x;
    }
    if (right >= left) centers.push((left + right + 1) / 2);
  }
  return centers.length ? median(centers) : b.x + b.width / 2;
}
function registrationFor(key, frame) {
  const entries = registration.clips || registration;
  // Earlier left-only plans used rest/<action>; keep those registrations valid.
  const legacyKey = key.startsWith('rest/left/') ? 'rest/' + key.slice('rest/left/'.length) : null;
  const legacy = legacyKey ? entries[legacyKey] || {} : {};
  const selected = entries[key] || {};
  const clip = { ...legacy, ...selected, frames: { ...(legacy.frames || {}), ...(selected.frames || {}) } };
  return { ...(registration.defaults || {}), ...clip, ...(clip.frames?.[frame] || {}) };
}
function renderFrame(source, key, id, index, kind) {
  const bytes = fs.readFileSync(source), p = PNG.sync.read(bytes, { checkCRC: true });
  assert(p.data.some((value, index) => index % 4 === 3 && value === 0), 'Source has no transparent background: ' + source);
  const b = bounds(p), r = registrationFor(key, id);
  if (kind === 'rest' && !(r.scale > 0) && !(r.targetHeight > 0)) {
    throw Error('Rest clip needs explicit scale or targetHeight in registration.json: ' + key + '/' + id);
  }
  const targetHeight = r.targetHeight || 540 + (kind === 'walk' ? [0, -4, 0, 4, 0, -4, 0, 4][index % 8] : 0);
  const scale = r.scale || targetHeight / b.height;
  assert(Number.isFinite(scale) && scale > 0, 'Invalid uniform scale');
  const centerX = r.centerX ?? torsoCenter(p, b);
  const dx = W / 2 - centerX * scale + (r.offsetX || 0);
  const dy = BASELINE - (b.bottom + 1) * scale + (r.offsetY || 0);
  assert(b.x * scale + dx >= 2 && (b.right + 1) * scale + dx <= W - 2 &&
    b.y * scale + dy >= 2 && (b.bottom + 1) * scale + dy <= H - 2,
    'Registration clips artwork: ' + key + '/' + id + '; lower uniform scale or correct centerX.');
  const out = new PNG({ width: W, height: H });
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) {
    const sx = Math.floor((x + 1 - dx) / scale), sy = Math.floor((y + 1 - dy) / scale);
    if (sx < 0 || sy < 0 || sx >= p.width || sy >= p.height) continue;
    const si = (sy * p.width + sx) * 4;
    if (p.data[si + 3] < 128) continue;
    for (let yy = 0; yy < 2; yy++) for (let xx = 0; xx < 2; xx++) {
      const di = ((y + yy) * W + x + xx) * 4;
      p.data.copy(out.data, di, si, si + 3); out.data[di + 3] = 255;
    }
  }
  return { out, info: { id, source: relative(source), sourceHash: hash(bytes), sourceDimensions: [p.width, p.height],
    sourceBounds: b, scale, centerX, translation: [dx, dy], bounds: bounds(out), pixelHash: hash(out.data) } };
}
function frameFiles(dir) {
  return fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /^\d{2}\.png$/i.test(f)).sort().map(f => path.join(dir, f)) : [];
}
async function exportClip(plan, sources) {
  if (plan.kind !== 'stand') sources.forEach((source, i) => assert.equal(path.basename(source).toLowerCase(), String(i + 1).padStart(2, '0') + '.png', 'Source frame numbers must be contiguous from 01: ' + plan.key));
  const dir = path.join(ROOT, 'export', plan.key);
  fs.mkdirSync(dir, { recursive: true });
  const rendered = sources.map((source, i) => renderFrame(source, plan.key, String(i + 1).padStart(2, '0'), i, plan.kind));
  const frames = rendered.map(f => f.out), unique = new Set(rendered.map(f => f.info.pixelHash)).size;
  if (plan.kind === 'walk') assert.equal(unique, 8, 'Walk has identical poses: ' + plan.key);
  const columns = frames.length === 1 ? 1 : Math.min(4, frames.length);
  const sheet = new PNG({ width: W * columns, height: H * Math.ceil(frames.length / columns) });
  frames.forEach((frame, i) => {
    fs.writeFileSync(path.join(dir, String(i + 1).padStart(2, '0') + '.png'), PNG.sync.write(frame));
    for (let y = 0; y < H; y++) frame.data.copy(sheet.data,
      ((Math.floor(i / columns) * H + y) * sheet.width + i % columns * W) * 4, y * W * 4, (y + 1) * W * 4);
  });
  fs.writeFileSync(path.join(dir, 'sheet.png'), PNG.sync.write(sheet));
  if (frames.length > 1) await sharp(Buffer.concat(frames.map(f => f.data)), {
    raw: { width: W, height: H * frames.length, channels: 4, pageHeight: H }
  }).gif({ loop: plan.loop ? 0 : 1, delay: Math.round(1000 / plan.fps), dither: 0, colours: 256 }).toFile(path.join(dir, 'preview.gif'));
  await sharp(PNG.sync.write(sheet)).resize(Math.min(sheet.width, 1024), null, { kernel: 'nearest' })
    .flatten({ background: '#20353f' }).png().toFile(path.join(dir, 'contact-sheet.png'));
  return { key: plan.key, action: plan.action, direction: plan.direction, kind: plan.kind,
    file: relative(path.join(dir, 'sheet.png')), frames: frames.length, columns, frameWidth: W, frameHeight: H,
    fps: plan.fps, loop: plan.loop, anchor: [W / 2, BASELINE], bodyHeight: 540, displayHeight: registration.displayHeight || 28,
    uniqueFrames: unique, details: rendered.map(f => f.info) };
}
(async () => {
  const plans = [];
  for (const d of DIRECTIONS) plans.push({ key: 'stand/' + d, action: 'stand', direction: d, kind: 'stand', expected: 1, fps: 1, loop: true,
    sources: [path.join(ROOT, 'bases', 'source', d + '.png')].filter(fs.existsSync) });
  for (const d of DIRECTIONS) plans.push({ key: 'walk/' + d, action: 'walk', direction: d, kind: 'walk', expected: 8, fps: 8, loop: true,
    sources: frameFiles(path.join(ROOT, 'walk', d, 'source')) });
  for (const direction of ['left', 'right']) for (const [action, [expected, fps, loop]] of Object.entries(REST)) {
    const directionalSource = path.join(ROOT, 'rest', direction, action, 'source');
    const sourceDirectory = fs.existsSync(directionalSource) || direction === 'right'
      ? directionalSource : path.join(ROOT, 'rest', action, 'source');
    plans.push({ key: 'rest/' + direction + '/' + action, action, direction, kind: 'rest', expected, fps, loop,
      sources: frameFiles(sourceDirectory) });
  }
  const clips = [], status = [];
  for (const plan of plans) {
    const config = registrationFor(plan.key, '01'), required = config.expectedFrames || plan.expected;
    if (plan.sources.length !== required) {
      status.push({ key: plan.key, action: plan.action, direction: plan.direction, state: plan.sources.length ? 'incomplete' : 'missing', sourceFrames: plan.sources.length, expectedFrames: required });
      continue;
    }
    try {
      const clip = await exportClip(plan, plan.sources); clips.push(clip);
      status.push({ key: plan.key, action: plan.action, direction: plan.direction, state: 'exported-awaiting-review', sourceFrames: plan.sources.length, expectedFrames: required });
    } catch (error) {
      status.push({ key: plan.key, action: plan.action, direction: plan.direction, state: 'needs-correction', sourceFrames: plan.sources.length, expectedFrames: required, error: error.message });
    }
  }
  const manifest = { id: 'rixa', generatedAt: new Date().toISOString(), reviewOnly: true,
    method: 'Individually generated source poses; uniform scaling and 2px nearest-neighbor export. No synthesized poses or mirrors.',
    frameSize: [W, H], anchor: [W / 2, BASELINE], directions: DIRECTIONS, clips, status,
    complete: status.every(s => s.state === 'exported-awaiting-review') };
  fs.writeFileSync(path.join(ROOT, 'review.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(ROOT, 'review-data.js'), 'window.RIXA_REVIEW=' + JSON.stringify(manifest) + ';');
  console.log(JSON.stringify({ exported: clips.map(c => c.key), remaining: status.filter(s => s.state !== 'exported-awaiting-review') }, null, 2));
})().catch(e => { console.error(e); process.exitCode = 1; });
