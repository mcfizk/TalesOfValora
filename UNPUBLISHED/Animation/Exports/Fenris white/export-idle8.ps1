$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$exportDir = Join-Path $PSScriptRoot 'Idle 8 frames'
New-Item -ItemType Directory -Path $exportDir -Force | Out-Null
$source = [System.Drawing.Bitmap]::FromFile((Join-Path $exportDir 'generated-source.png'))
$frameWidth = 400
$frameHeight = 528
$anchorX = 200
$anchorY = 500
$sheet = [System.Drawing.Bitmap]::new($frameWidth * 4, $frameHeight * 2)
$sheetGraphics = [System.Drawing.Graphics]::FromImage($sheet)
$records = @()
for ($i = 0; $i -lt 8; $i++) {
  $column = $i % 4
  $row = [int][Math]::Floor($i / 4)
  $left = [int][Math]::Floor($column * $source.Width / 4)
  $top = [int][Math]::Floor($row * $source.Height / 2)
  $right = [int][Math]::Floor(($column + 1) * $source.Width / 4)
  $bottom = [int][Math]::Floor(($row + 1) * $source.Height / 2)
  $crop = $source.Clone([System.Drawing.Rectangle]::new($left, $top, $right-$left, $bottom-$top), [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $footMinX = $crop.Width
  $footMaxX = -1
  $footMaxY = -1
  for ($y = [int]($crop.Height * 0.86); $y -lt $crop.Height; $y++) {
    for ($x = 0; $x -lt $crop.Width; $x++) {
      if ($crop.GetPixel($x,$y).A -ge 200) {
        $footMinX = [Math]::Min($footMinX,$x)
        $footMaxX = [Math]::Max($footMaxX,$x)
        $footMaxY = [Math]::Max($footMaxY,$y)
      }
    }
  }
  if ($footMaxY -lt 0) { throw "No foot anchor found in frame $i" }
  $offsetX = $anchorX - [int][Math]::Round(($footMinX+$footMaxX)/2)
  $offsetY = $anchorY - $footMaxY
  $frame = [System.Drawing.Bitmap]::new($frameWidth,$frameHeight)
  $graphics = [System.Drawing.Graphics]::FromImage($frame)
  $graphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $graphics.DrawImageUnscaled($crop,$offsetX,$offsetY)
  $filename = 'Fenris_idle_{0:D2}.png' -f ($i+1)
  $frame.Save((Join-Path $exportDir $filename),[System.Drawing.Imaging.ImageFormat]::Png)
  $sheetGraphics.DrawImageUnscaled($frame,$column*$frameWidth,$row*$frameHeight)
  $records += [ordered]@{file=$filename;duration_ms=250;sheet_x=$column*$frameWidth;sheet_y=$row*$frameHeight;width=$frameWidth;height=$frameHeight;source_offset_x=$offsetX;source_offset_y=$offsetY}
  $graphics.Dispose()
  $frame.Dispose()
  $crop.Dispose()
}
$sheet.Save((Join-Path $exportDir 'Fenris_idle_8_frames.png'),[System.Drawing.Imaging.ImageFormat]::Png)
$metadata = [ordered]@{name='Fenris white idle';frames=$records;loop=$true;duration_ms=2000;anchor=@($anchorX,$anchorY);sheet_columns=4;sheet_rows=2;notes='Generated eight-pose idle, sliced without resampling and aligned using the foot bounding box. PNG assets retain alpha; GIF is a preview.'}
$metadata | ConvertTo-Json -Depth 6 | Set-Content -LiteralPath (Join-Path $exportDir 'animation.json') -Encoding utf8
$sheetGraphics.Dispose()
$sheet.Dispose()
$source.Dispose()
$metadata | ConvertTo-Json -Depth 6 -Compress
