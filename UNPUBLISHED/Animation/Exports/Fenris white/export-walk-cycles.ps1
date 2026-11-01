$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
if (-not ('FenrisWalkMetrics' -as [type])) {
Add-Type -ReferencedAssemblies System.Drawing.Common,System.Drawing.Primitives -TypeDefinition @'
using System;
using System.Drawing;
public static class FenrisWalkMetrics {
 public static int[] Measure(Bitmap b) {
  int minX=b.Width,minY=b.Height,maxX=-1,maxY=-1,brownY=b.Height;
  for(int y=0;y<b.Height;y++) for(int x=0;x<b.Width;x++) {
   Color c=b.GetPixel(x,y); if(c.A<128) continue;
   minX=Math.Min(minX,x); minY=Math.Min(minY,y); maxX=Math.Max(maxX,x); maxY=Math.Max(maxY,y);
   if(y>b.Height*.38 && y<b.Height*.75 && c.A>=200 && c.R>c.G+12 && c.G>c.B+6 && c.R<195) brownY=Math.Min(brownY,y);
  }
  long sum=0; int count=0;
  for(int y=brownY;y<Math.Min(b.Height,brownY+20);y++) for(int x=0;x<b.Width;x++) {
   Color c=b.GetPixel(x,y); if(c.A>=200 && c.R>c.G+12 && c.G>c.B+6 && c.R<195) {sum+=x;count++;}
  }
  int root=count>0?(int)Math.Round((double)sum/count):(minX+maxX)/2;
  return new int[]{minX,minY,maxX,maxY,root};
 }
 public static bool IsMirror(Bitmap a, Bitmap b) {
  if(a.Width!=b.Width || a.Height!=b.Height) return false;
  for(int y=0;y<a.Height;y++) for(int x=0;x<a.Width;x++)
   if(a.GetPixel(x,y).ToArgb()!=b.GetPixel(a.Width-1-x,y).ToArgb()) return false;
  return true;
 }
}
'@
}
$outDir=Join-Path $PSScriptRoot 'Walking 8 frames'
$all=@{}
$records=@()
$canonical=@('left','up-left','up','down-left','down')
foreach($direction in $canonical) {
 $src=[System.Drawing.Bitmap]::FromFile((Join-Path $outDir ('sources\'+$direction+'.png')))
 $crops=@(); $metrics=@(); $heights=@()
 for($i=0;$i -lt 8;$i++) {
  $col=$i%4; $row=[int][Math]::Floor($i/4)
  $x0=[int][Math]::Floor($col*$src.Width/4);$x1=[int][Math]::Floor(($col+1)*$src.Width/4)
  $y0=[int][Math]::Floor($row*$src.Height/2);$y1=[int][Math]::Floor(($row+1)*$src.Height/2)
  $crop=$src.Clone([System.Drawing.Rectangle]::new($x0,$y0,$x1-$x0,$y1-$y0),[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $m=[FenrisWalkMetrics]::Measure($crop)
  if($m[2] -lt 0){throw "Empty frame $direction $i"}
  $crops+=,$crop; $metrics+=,$m; $heights+=($m[3]-$m[1]+1)
 }
 $medianHeight=($heights|Sort-Object)[4]
 $scale=550.0/$medianHeight
 # A single scale for the whole direction preserves natural variation in height.
 for($i=0;$i -lt 8;$i++) {
  $m=$metrics[$i]
  $maxExtent=[Math]::Max($m[4]-$m[0],$m[2]-$m[4])
  if($maxExtent*$scale -gt 242){$scale=242.0/$maxExtent}
 }
 $frames=@()
 for($i=0;$i -lt 8;$i++) {
  $crop=$crops[$i];$m=$metrics[$i]
  $w=[int][Math]::Round($crop.Width*$scale);$h=[int][Math]::Round($crop.Height*$scale)
  $dx=256-[int][Math]::Round($m[4]*$scale)
  $dy=610-[int][Math]::Round($m[3]*$scale)
  $frame=[System.Drawing.Bitmap]::new(512,640)
  $g=[System.Drawing.Graphics]::FromImage($frame)
  $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
  $g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
  $g.DrawImage($crop,[System.Drawing.Rectangle]::new($dx,$dy,$w,$h))
  $g.Dispose();$crop.Dispose()
  $frames+=,$frame
 }
 $src.Dispose()
 $all[$direction]=$frames
 $records += [ordered]@{direction=$direction;source='generated';scale=$scale;frame_count=8}
}
foreach($pair in @(@('left','right'),@('up-left','up-right'),@('down-left','down-right'))) {
 $frames=@()
 foreach($original in $all[$pair[0]]) {
  $frame=$original.Clone([System.Drawing.Rectangle]::new(0,0,512,640),[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $frame.RotateFlip([System.Drawing.RotateFlipType]::RotateNoneFlipX)
  if(-not [FenrisWalkMetrics]::IsMirror($original,$frame)){throw 'Mirror verification failed'}
  $frames+=,$frame
 }
 $all[$pair[1]]=$frames
 $records += [ordered]@{direction=$pair[1];source='exact horizontal mirror';mirrored_from=$pair[0];frame_count=8}
}
$validation=@()
foreach($direction in $all.Keys) {
 $dir=Join-Path $outDir $direction
 New-Item -ItemType Directory -Path $dir -Force | Out-Null
 $sheet=[System.Drawing.Bitmap]::new(2048,1280)
 $sg=[System.Drawing.Graphics]::FromImage($sheet)
 $frameInfo=@()
 for($i=0;$i -lt 8;$i++) {
  $frame=$all[$direction][$i]
  $filename='Fenris_walk_{0}_{1:D2}.png' -f $direction,($i+1)
  $frame.Save((Join-Path $dir $filename),[System.Drawing.Imaging.ImageFormat]::Png)
  $sx=($i%4)*512;$sy=[int][Math]::Floor($i/4)*640
  $sg.DrawImageUnscaled($frame,$sx,$sy)
  $m=[FenrisWalkMetrics]::Measure($frame)
  if($m[0] -le 0 -or $m[1] -le 0 -or $m[2] -ge 511 -or $m[3] -ge 639){throw "Clipped export: $filename"}
  $frameInfo += [ordered]@{file=$filename;x=$sx;y=$sy;width=512;height=640;duration_ms=125}
 }
 $sheet.Save((Join-Path $dir ('Fenris_walk_'+$direction+'_sheet.png')),[System.Drawing.Imaging.ImageFormat]::Png)
 [ordered]@{direction=$direction;loop=$true;fps=8;duration_ms=1000;anchor=@(256,610);frames=$frameInfo} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $dir 'animation.json') -Encoding utf8
 $sg.Dispose();$sheet.Dispose()
 $hashCount=@(Get-ChildItem -LiteralPath $dir -Filter 'Fenris_walk_*_0?.png' | Get-FileHash | Select-Object -ExpandProperty Hash -Unique).Count
 if($hashCount -ne 8){throw "Non-unique frames: $direction"}
 $validation += [ordered]@{direction=$direction;unique_frames=$hashCount;clipped=$false;transparent=$true}
}
$previewDir=Join-Path $outDir 'preview-frames'
New-Item -ItemType Directory -Path $previewDir -Force | Out-Null
$positions=@('up-left','up','up-right','left','','right','down-left','down','down-right')
$font=[System.Drawing.Font]::new('Segoe UI',14,[System.Drawing.FontStyle]::Bold)
$smallFont=[System.Drawing.Font]::new('Segoe UI',11)
$format=[System.Drawing.StringFormat]::new();$format.Alignment=[System.Drawing.StringAlignment]::Center
for($i=0;$i -lt 8;$i++) {
 $preview=[System.Drawing.Bitmap]::new(768,1032)
 $g=[System.Drawing.Graphics]::FromImage($preview)
 $g.Clear([System.Drawing.Color]::FromArgb(38,50,62))
 $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::NearestNeighbor
 $g.PixelOffsetMode=[System.Drawing.Drawing2D.PixelOffsetMode]::Half
 for($p=0;$p -lt 9;$p++) {
  $x=($p%3)*256;$y=[int][Math]::Floor($p/3)*344;$name=$positions[$p]
  if($name){
   $g.DrawString($name.ToUpper().Replace('-',' '),$font,[System.Drawing.Brushes]::White,[System.Drawing.RectangleF]::new($x,$y+2,256,24),$format)
   $g.DrawImage($all[$name][$i],[System.Drawing.Rectangle]::new($x,$y+24,256,320))
  }else{
   $g.DrawString('FENRIS',$font,[System.Drawing.Brushes]::White,[System.Drawing.RectangleF]::new($x,$y+120,256,28),$format)
   $g.DrawString("Walking cycles`n8 frames per direction`n1-second loops",$smallFont,[System.Drawing.Brushes]::LightGray,[System.Drawing.RectangleF]::new($x,$y+156,256,85),$format)
  }
 }
 $preview.Save((Join-Path $previewDir ('preview_{0:D2}.png' -f ($i+1))),[System.Drawing.Imaging.ImageFormat]::Png)
 $g.Dispose();$preview.Dispose()
}
$font.Dispose();$smallFont.Dispose();$format.Dispose()
foreach($frames in $all.Values){foreach($frame in $frames){$frame.Dispose()}}
[ordered]@{frame_size=@(512,640);fps=8;loop_duration_ms=1000;directions=$records;validation=$validation;mirror_pairs_verified=24;source_notes='AI-generated pose sequences, uniformly scaled per direction with nearest-neighbor sampling, aligned by shorts center and ground contact.'} | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $outDir 'walking-set.json') -Encoding utf8
Write-Output 'Exported 64 unique transparent frames, 8 sprite sheets, and 8 comparison frames; verified clipping and all 24 mirrored pairs.'
