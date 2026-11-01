$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
function Load-Pose([string]$folder,[int]$index) {
 return [System.Drawing.Bitmap]::FromFile((Join-Path $PSScriptRoot ($folder+'/pose-{0:D2}.png' -f $index)))
}
function Place-Pose($image,[double]$scale) {
 $frame=[System.Drawing.Bitmap]::new(640,640)
 $g=[System.Drawing.Graphics]::FromImage($frame)
 $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
 $g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
 $width=[int][Math]::Round($image.Width*$scale);$height=[int][Math]::Round($image.Height*$scale)
 if($width -gt 630 -or $height -gt 600){throw 'Character exceeds standard canvas'}
 $g.DrawImage($image,[System.Drawing.Rectangle]::new(320-[int]($width/2),610-$height+3,$width,$height))
 $g.Dispose()
 return $frame
}
$last=Load-Pose 'key-poses' 8
$masterScale=550.0/($last.Height-4);$last.Dispose()
$key=@()
for($i=1;$i -le 8;$i++){$im=Load-Pose 'key-poses' $i;$key+=,(Place-Pose $im $masterScale);$im.Dispose()}
$clips=@{}
foreach($name in @('sleep','sit')){
 $keyIndex=if($name -eq 'sleep'){1}else{4}
 $reference=Load-Pose 'key-poses' $keyIndex
 $targetHeight=($reference.Height-4)*$masterScale;$reference.Dispose()
 $first=Load-Pose ($name+'-poses') 1
 $scale=$targetHeight/($first.Height-4);$first.Dispose()
 $frames=@()
 for($i=1;$i -le 4;$i++){$im=Load-Pose ($name+'-poses') $i;$frames+=,(Place-Pose $im $scale);$im.Dispose()}
 $clips[$name]=$frames
}
# End on the exact existing standing idle image, at the same world-space scale.
$idle=[System.Drawing.Bitmap]::FromFile((Join-Path $PSScriptRoot '../Idle 8 frames/Fenris_idle_01.png'))
$stand=[System.Drawing.Bitmap]::new(640,640)
$g=[System.Drawing.Graphics]::FromImage($stand);$g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor;$g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
$idleScale=550.0/466.0
$g.DrawImage($idle,[System.Drawing.Rectangle]::new(320-[int][Math]::Round(200*$idleScale),610-[int][Math]::Round(500*$idleScale),[int][Math]::Round(400*$idleScale),[int][Math]::Round(528*$idleScale)))
$g.Dispose();$idle.Dispose()
$clips['sleepToSit']=@($clips.sleep[0],$key[1],$key[2],$clips.sit[0])
$clips['sitToStand']=@($clips.sit[0],$key[4],$key[5],$key[6],$key[7],$stand)
$specs=[ordered]@{}
foreach($name in @('sleep','sit','sleepToSit','sitToStand')){
 $frames=$clips[$name];$loop=$name -in @('sleep','sit');$fps=if($loop){2}else{4}
 $columns=if($frames.Count -eq 6){3}else{2}
 $specs[$name]=[ordered]@{file=$name+'-left-sheet.png';frameWidth=640;frameHeight=640;columns=$columns;frames=$frames.Count;fps=$fps;loop=$loop;directions=@('left','right');mirrorRight=$true;anchor=@(320,610);bodyHeight=550}
 foreach($direction in @('left','right')){
  $folder=Join-Path $PSScriptRoot ($name+'-'+$direction);New-Item -ItemType Directory -Path $folder -Force|Out-Null
  $sheet=[System.Drawing.Bitmap]::new($columns*640,1280);$sg=[System.Drawing.Graphics]::FromImage($sheet)
  for($i=0;$i -lt $frames.Count;$i++){
   $frame=$frames[$i].Clone([System.Drawing.Rectangle]::new(0,0,640,640),[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
   if($direction -eq 'right'){$frame.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX)}
   $frame.Save((Join-Path $folder ('frame-{0:D2}.png' -f ($i+1))),[System.Drawing.Imaging.ImageFormat]::Png)
   $sg.DrawImageUnscaled($frame,($i%$columns)*640,[int][Math]::Floor($i/$columns)*640)
   $frame.Dispose()
  }
  $sheet.Save((Join-Path $PSScriptRoot ($name+'-'+$direction+'-sheet.png')),[System.Drawing.Imaging.ImageFormat]::Png)
  $sg.Dispose();$sheet.Dispose()
 }
}
# 0-2s sleep, 2-3s rising to sit, 3-4.5s seated, 4.5-6s rising, 6-8s standing.
$previewDir=Join-Path $PSScriptRoot 'preview-frames';New-Item -ItemType Directory -Path $previewDir -Force|Out-Null
$font=[System.Drawing.Font]::new('Segoe UI',20,[System.Drawing.FontStyle]::Bold)
$format=[System.Drawing.StringFormat]::new();$format.Alignment=[System.Drawing.StringAlignment]::Center
for($i=0;$i -lt 32;$i++){
 $t=$i/4
 if($t -lt 2){$frame=$clips.sleep[[int][Math]::Floor($t*2)%4];$label='Sleeping'}
 elseif($t -lt 3){$frame=$clips.sleepToSit[$i-8];$label='Sleep to sit'}
 elseif($t -lt 4.5){$frame=$clips.sit[[int][Math]::Floor(($t-3)*2)%4];$label='Sitting'}
 elseif($t -lt 6){$frame=$clips.sitToStand[$i-18];$label='Sit to stand'}
 else{$frame=$stand;$label='Standing'}
 $preview=[System.Drawing.Bitmap]::new(640,704);$pg=[System.Drawing.Graphics]::FromImage($preview);$pg.Clear([System.Drawing.Color]::FromArgb(38,50,62))
 $pg.DrawString($label,$font,[System.Drawing.Brushes]::White,[System.Drawing.RectangleF]::new(0,16,640,40),$format)
 $pg.DrawImageUnscaled($frame,0,64)
 $preview.Save((Join-Path $previewDir ('preview-{0:D2}.png' -f ($i+1))),[System.Drawing.Imaging.ImageFormat]::Png)
 $pg.Dispose();$preview.Dispose()
}
$font.Dispose();$format.Dispose()
[ordered]@{formatVersion=1;frameSize=@(640,640);clips=$specs;wakeSequence=@(@{clip='sleep';seconds=2},@{clip='sleepToSit';seconds=1},@{clip='sit';seconds=1.5},@{clip='sitToStand';seconds=1.5});notes='Left/right rest actions. Right is an exact mirror. Transition endpoints reuse the loop pose; standing ends on the existing idle pose. No existing idle or walk assets changed.'}|ConvertTo-Json -Depth 8|Set-Content -LiteralPath (Join-Path $PSScriptRoot 'rest-animations.json') -Encoding utf8
# Some transition entries share loop/key images, so dispose unique objects only once.
$seen=[System.Collections.Generic.HashSet[System.Drawing.Bitmap]]::new()
foreach($frames in $clips.Values){foreach($frame in $frames){if($seen.Add($frame)){$frame.Dispose()}}}
foreach($frame in $key){if($seen.Add($frame)){$frame.Dispose()}}
Write-Output 'Exported four clips in left/right variants, matching endpoints, and the full awakening preview.'
