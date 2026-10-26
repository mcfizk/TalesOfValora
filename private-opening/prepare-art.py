"""Optional authoring tool: rebuild scene art from the separate local source archive."""
import csv, json, os, re, sys, shutil, subprocess
from collections import deque
from pathlib import Path
sys.path.insert(0, os.path.join(os.environ['TEMP'], 'UnityPy-Fenris'))
from PIL import Image
import UnityPy

root = Path(__file__).resolve().parent
review = root.parent.parent / 'asset-review'
out = root / 'assets'; out.mkdir(exist_ok=True)
woods = Image.open(review / 'environment/westwoods-reconstructed.png')
rects = {'tree-oak':(512,224,704,416),'tree-elder':(704,224,864,448),
         'tree-young':(864,160,960,320),'stump':(352,144,384,176),
         'fern':(480,528,512,560),'shrub':(448,464,480,496),'flowers':(416,528,448,560)}
def isolate_tree(image):
    # Tile rectangles may also contain disconnected pieces of a neighboring tile.
    # Retain the connected tree silhouette when assembling the source artwork.
    image=image.convert('RGBA'); alpha=image.getchannel('A'); w,h=image.size
    pixels=alpha.load();remaining={(x,y) for y in range(h) for x in range(w) if pixels[x,y]>0};largest=set()
    while remaining:
        first=remaining.pop();component={first};queue=deque([first])
        while queue:
            x,y=queue.popleft()
            for neighbor in ((x-1,y),(x+1,y),(x,y-1),(x,y+1)):
                if neighbor in remaining:remaining.remove(neighbor);component.add(neighbor);queue.append(neighbor)
        if len(component)>len(largest):largest=component
    mask=Image.new('L',(w,h));dest=mask.load()
    for x,y in largest:dest[x,y]=pixels[x,y]
    image.putalpha(mask);return image
for name, box in rects.items():
    image=woods.crop(box)
    # The original 32px tile grid joins a few neighboring fragments at edges.
    # Exclude those neighboring cells without clipping the tree's crown/roots.
    if name=='tree-oak':image.paste((0,0,0,0),(0,0,32,32))
    if name=='tree-elder':
        image.paste((0,0,0,0),(112,192,160,224))
        image.paste((0,0,0,0),(156,0,160,224))
    if name.startswith('tree-'):image=isolate_tree(image)
    image.save(out / (name+'.png'))
ground = Image.open(review / 'environment/bg_forest.png')
ground.crop((384,384,640,640)).save(out/'ground.png')
ground.crop((160,36,192,60)).save(out/'path.png')
entries = list(csv.DictReader((review/'sprites.csv').open(encoding='utf-8-sig')))
lookup = {e['name']:e for e in entries}
for n in range(1,5): shutil.copy2(review/f'werewolves/Werewolf1_i{n:02d}.png',out/f'fenris-{n}.png')
for n in range(4):
    entry=lookup[f'rock{n:04d}'];shutil.copy2(review/entry['file'],out/f'rock-{n}.png')
flames=sorted((e for e in entries if re.fullmatch(r'flame\d+',e['name'])),key=lambda e:e['name'])
for i,e in enumerate(flames):shutil.copy2(review/e['file'],out/f'fire-{i}.png')
bundle=Path(r'C:\Program Files (x86)\Steam\steamapps\common\Vampire Survivors\VampireSurvivors_Data\StreamingAssets\aa\StandaloneWindows64\vs_local_assets_background_westwoods.bundle')
env=UnityPy.load(str(bundle))
for o in env.objects:
    if o.type.name=='Sprite':
        d=o.parse_as_object();m=re.fullmatch(r'waterF(\d+)',d.m_Name)
        if m:d.image.save(out/f'water-{m[1]}.png')
(out/'manifest.json').write_text(json.dumps({'fireFrames':len(flames),'waterFrames':8,'fenrisFrames':4,
    'fenrisSource':'Werewolf1_i01 through Werewolf1_i04',
    'scenerySources':['vs_local_assets_westwoods.bundle','vs_local_assets_bg_forest.bundle','vs_local_assets_background_westwoods.bundle'],
    'usage':"Complete 2D build included in the repository at the author's explicit request on 2026-10-26. Source provenance retained; website deployment is separate."},indent=2),encoding='utf-8')
print('Prepared',len(list(out.glob('*.png'))),'PNGs;',len(flames),'fire frames.')
# Restore the approved custom character after rebuilding the legacy scenery art.
subprocess.run(['node', str(root/'import-fenris.cjs')], check=True)
