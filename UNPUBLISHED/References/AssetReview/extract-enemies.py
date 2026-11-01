"""Export the installed game's enemy bundles into the private local art catalog."""
import csv
import html
import json
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, os.path.join(os.environ['TEMP'], 'UnityPy-Fenris'))
import UnityPy
from PIL import Image, ImageDraw

OUT = Path(__file__).resolve().parent
SOURCE = Path(r'C:\Program Files (x86)\Steam\steamapps\common\Vampire Survivors\VampireSurvivors_Data\StreamingAssets\aa\StandaloneWindows64')
with (OUT / 'sprites.csv').open(encoding='utf-8-sig', newline='') as handle:
    entries = list(csv.DictReader(handle))
for entry in entries:
    for key in ('id', 'width', 'height'):
        entry[key] = int(entry[key])
existing = {(e['source'], e['name']) for e in entries}
next_id = max(e['id'] for e in entries) + 1
metadata_path = OUT / 'enemy-frame-metadata.json'
metadata = json.loads(metadata_path.read_text(encoding='utf-8')) if metadata_path.exists() else {}
errors = []
counts = []
groups = {}
(OUT / 'enemies').mkdir(exist_ok=True)
(OUT / 'werewolves').mkdir(exist_ok=True)
for bundle in sorted(SOURCE.glob('*enemies*.bundle')):
    env = UnityPy.load(str(bundle))
    exported = skipped = 0
    for obj in env.objects:
        if obj.type.name != 'Sprite':
            continue
        try:
            data = obj.parse_as_object()
            name = data.m_Name
            key = (bundle.name, name)
            if key in existing:
                skipped += 1
                continue
            img = data.image
            safe = re.sub(r'[^A-Za-z0-9._-]+', '_', name).strip('._-')[:90] or 'unnamed'
            relative = f'enemies/{next_id:05d}_{safe}.png'
            img.save(OUT / relative)
            entry = dict(id=next_id, name=name, source=bundle.name, width=img.width, height=img.height, file=relative)
            entries.append(entry)
            existing.add(key)
            rect = data.m_Rect
            pivot = data.m_Pivot
            offset = data.m_RD.textureRectOffset
            metadata[relative] = dict(path_id=obj.path_id, source=bundle.name,
                original_size=[rect.width, rect.height], pivot=[pivot.x, pivot.y],
                texture_offset=[offset.x, offset.y], pixels_per_unit=data.m_PixelsToUnits)
            family = next((prefix for prefix in ('Werewolf1', 'TP_Werewolf', 'LEM_werewolfjoker') if name.startswith(prefix + '_')), None)
            if family:
                canvas = Image.new('RGBA', (int(rect.width), int(rect.height)))
                canvas.paste(img, (round(offset.x), round(rect.height - offset.y - img.height)))
                frame_file = f'werewolves/{name}.png'
                canvas.save(OUT / frame_file)
                groups.setdefault(family, []).append(dict(name=name, file=frame_file, id=next_id))
            next_id += 1
            exported += 1
        except Exception as exc:
            errors.append(dict(bundle=bundle.name, path_id=obj.path_id, error=str(exc)))
    counts.append(dict(bundle=bundle.name, exported=exported, already_present=skipped))
    print(bundle.name, 'exported', exported, 'already present', skipped, flush=True)

with (OUT / 'sprites.csv').open('w', encoding='utf-8-sig', newline='') as handle:
    writer = csv.DictWriter(handle, fieldnames=['id','name','source','width','height','file'])
    writer.writeheader()
    writer.writerows(entries)
(OUT / 'sprites-data.js').write_text('window.SPRITES = ' + json.dumps(entries, ensure_ascii=True, separators=(',', ':')) + ';', encoding='utf-8')
metadata_path.write_text(json.dumps(metadata, separators=(',', ':')), encoding='utf-8')
(OUT / 'enemy-extraction-report.json').write_text(json.dumps(dict(bundles=counts, errors=errors, catalog_total=len(entries)), indent=2), encoding='utf-8')

cards = []
for family, frames in groups.items():
    frames.sort(key=lambda x: [int(c) if c.isdigit() else c for c in re.split(r'(\d+)', x['name'])])
    idle = [f for f in frames if re.search(r'_i\d+$', f['name'])]
    images = [Image.open(OUT / f['file']).convert('RGBA') for f in idle]
    if images:
        width, height = max(im.width for im in images), max(im.height for im in images)
        animation = []
        for im in images:
            background = Image.new('RGB', (width, height), (37, 43, 54))
            background.paste(im, ((width-im.width)//2, height-im.height), im)
            animation.append(background.resize((width*5,height*5), Image.Resampling.NEAREST))
        animation[0].save(OUT / 'werewolves' / (family + '-idle.gif'), save_all=True, append_images=animation[1:], duration=150, loop=0)
        strip = Image.new('RGB', (len(animation)*max(width*5,190),height*5+34), (37,43,54))
        draw = ImageDraw.Draw(strip)
        for i,(im,frame) in enumerate(zip(animation,idle)):
            x=i*max(width*5,190);strip.paste(im,(x,0));draw.text((x+6,height*5+8),frame['name'],fill='white')
        strip.save(OUT/'werewolves'/(family+'-idle-frames.png'))
    links = ''.join(f'<li><a href="{html.escape(f["file"],quote=True)}">#{f["id"]} {html.escape(f["name"])}</a></li>' for f in frames)
    cards.append(f'<section><h2>{family}</h2><p>{len(frames)} frames · {len(idle)} idle frames</p><img class="animated" src="werewolves/{family}-idle.gif" alt="{family} idle animation"><p>Preview timing: 150 ms per frame.</p><p><a href="werewolves/{family}-idle-frames.png">View idle frames side by side</a> · <a href="index.html?q={family}">Find in gallery</a></p><details><summary>All named frames</summary><ul>{links}</ul></details></section>')
if cards:
    (OUT/'werewolves.html').write_text('<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Werewolf sprites for Fenris</title><style>body{background:#151922;color:#e5ebf5;font:16px system-ui;margin:24px auto;padding:0 24px;max-width:1200px}a{color:#a5d4ff}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}section{background:#252b36;padding:20px;border-radius:12px}.animated{image-rendering:pixelated;max-width:100%}li{margin:8px 0}summary{cursor:pointer}p{color:#b7c5d9}</style><h1>Werewolf sprites for Fenris</h1><p>Three extracted werewolf sets. Each preview cycles the four idle frames. Additional numbered frames are available below each preview.</p><p><a href="index.html?q=werewolf">Search all werewolves in the sprite gallery</a></p><div class="grid">'+''.join(cards)+'</div></html>',encoding='utf-8')
print(json.dumps(dict(added=sum(c['exported'] for c in counts),catalog_total=len(entries),errors=len(errors),werewolf_sets={k:len(v) for k,v in groups.items()})),flush=True)
