$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$outDir = Join-Path $PSScriptRoot 'Walking direction review'
$source = [System.Drawing.Bitmap]::FromFile((Join-Path $outDir 'generated-source.png'))
$names = @('left','up-left','up','down-left','down')
$frames = @{}
$records = @()
for ($i=0; $i -lt 5; $i++) {
  $column = $i % 3
  $row = [int][Math]::Floor($i/3)
  $x0 = [int][Math]::Floor($column*$source.Width/3)
  $y0 = [int][Math]::Floor($row*$source.Height/2)
  $x1 = [int][Math]::Floor(($column+1)*$source.Width/3)
  $y1 = [int][Math]::Floor(($row+1)*$source.Height/2)
  $crop = $source.Clone([System.Drawing.Rectangle]::new($x0,$y0,$x1-$x0,$y1-$y0),[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $minX=$crop.Width; $minY=$crop.Height; $maxX=-1; $maxY=-1
  for ($y=0; $y -lt $crop.Height; $y++) { for ($x=0; $x -lt $crop.Width; $x++) {
    if ($crop.GetPixel($x,$y).A -ge 128) {
      $minX=[Math]::Min($minX,$x); $maxX=[Math]::Max($maxX,$x)
      $minY=[Math]::Min($minY,$y); $maxY=[Math]::Max($maxY,$y)
    }
  } }
  $frame=[System.Drawing.Bitmap]::new(512,640)
  $g=[System.Drawing.Graphics]::FromImage($frame)
  $dx=256-[int][Math]::Round(($minX+$maxX)/2)
  $dy=610-$maxY
  if (($minX+$dx -lt 0) -or ($maxX+$dx -ge 512) -or ($minY+$dy -lt 0)) { throw 'Sprite does not fit export canvas.' }
  $g.DrawImageUnscaled($crop,$dx,$dy)
  $frames[$names[$i]]=$frame
  $records += [ordered]@{direction=$names[$i];source='generated';width=512;height=640}
  $g.Dispose(); $crop.Dispose()
}
foreach ($pair in @(@('left','right'),@('up-left','up-right'),@('down-left','down-right'))) {
  $copy=$frames[$pair[0]].Clone([System.Drawing.Rectangle]::new(0,0,512,640),[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $copy.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX)
  $frames[$pair[1]]=$copy
  $records += [ordered]@{direction=$pair[1];source='horizontal mirror';mirrored_from=$pair[0];width=512;height=640}
}
foreach ($name in $frames.Keys) { $frames[$name].Save((Join-Path $outDir ('Fenris_walk_'+$name+'.png')),[System.Drawing.Imaging.ImageFormat]::Png) }
$preview=[System.Drawing.Bitmap]::new(1536,2016)
$pg=[System.Drawing.Graphics]::FromImage($preview)
$pg.Clear([System.Drawing.Color]::FromArgb(38,50,62))
$font=[System.Drawing.Font]::new('Segoe UI',22,[System.Drawing.FontStyle]::Bold)
$smallFont=[System.Drawing.Font]::new('Segoe UI',16)
$format=[System.Drawing.StringFormat]::new()
$format.Alignment=[System.Drawing.StringAlignment]::Center
$positions=@('up-left','up','up-right','left','','right','down-left','down','down-right')
for ($i=0;$i -lt 9;$i++) {
  $px=($i%3)*512; $py=[int][Math]::Floor($i/3)*672
  $name=$positions[$i]
  if ($name) {
    $pg.DrawImageUnscaled($frames[$name],$px,$py+32)
    $pg.DrawString($name.ToUpper().Replace('-',' '),$font,[System.Drawing.Brushes]::White,[System.Drawing.RectangleF]::new($px,$py+8,512,34),$format)
  } else {
    $pg.DrawString('FENRIS',$font,[System.Drawing.Brushes]::White,[System.Drawing.RectangleF]::new($px,$py+260,512,42),$format)
    $pg.DrawString("Walking direction review`nOne pose per direction`nRight views are exact mirrors",$smallFont,[System.Drawing.Brushes]::LightGray,[System.Drawing.RectangleF]::new($px,$py+310,512,120),$format)
  }
}
$preview.Save((Join-Path $outDir 'Fenris_walking_directions_review.png'),[System.Drawing.Imaging.ImageFormat]::Png)
[ordered]@{frames=$records;purpose='Single walking key pose per direction for review; not an animation';reference='../Fenris_idle_frames.png'} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $outDir 'directions.json') -Encoding utf8
$source.Dispose(); $pg.Dispose(); $preview.Dispose(); $font.Dispose(); $smallFont.Dispose(); $format.Dispose()
foreach ($frame in $frames.Values) { $frame.Dispose() }
Write-Output 'Exported eight 512x640 transparent frames and compass review sheet.'
