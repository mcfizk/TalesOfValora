param([string]$Source='sources/awakening.png',[int]$Count=8,[string]$Output='key-poses')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
Add-Type -ReferencedAssemblies System.Drawing.Common,System.Drawing.Primitives,System.Collections -TypeDefinition @'
using System; using System.Drawing; using System.Collections.Generic;
public static class RestComponents {
 public static List<int[]> Find(Bitmap im) {
  int w=im.Width,h=im.Height; var seen=new bool[w*h]; var alpha=new byte[w*h];
  for(int y=0;y<h;y++)for(int x=0;x<w;x++)alpha[y*w+x]=im.GetPixel(x,y).A;
  var result=new List<int[]>(); var queue=new Queue<int>();
  for(int p=0;p<w*h;p++) {
   if(seen[p]||alpha[p]<128)continue;
   int x0=w,y0=h,x1=-1,y1=-1,count=0;seen[p]=true;queue.Enqueue(p);
   while(queue.Count>0){int n=queue.Dequeue(),x=n%w,y=n/w;count++;x0=Math.Min(x0,x);y0=Math.Min(y0,y);x1=Math.Max(x1,x);y1=Math.Max(y1,y);
    foreach(int next in new int[]{x>0?n-1:-1,x<w-1?n+1:-1,y>0?n-w:-1,y<h-1?n+w:-1}) {
     if(next>=0&&!seen[next]&&alpha[next]>=128){seen[next]=true;queue.Enqueue(next);}
    }
   }
   if(count>500)result.Add(new int[]{x0,y0,x1,y1,count});
  }
  return result;
 }
}
'@
$image=[System.Drawing.Bitmap]::FromFile((Join-Path $PSScriptRoot $Source))
$components=@([RestComponents]::Find($image)|Sort-Object {$_[4]} -Descending|Select-Object -First $Count|Sort-Object {($_[1]+$_[3])/2})
if($components.Count -ne $Count){throw 'Unexpected number of character components'}
$half=[int]($Count/2)
$ordered=@($components[0..($half-1)]|Sort-Object {$_[0]})+@($components[$half..($Count-1)]|Sort-Object {$_[0]})
$folder=Join-Path $PSScriptRoot $Output
New-Item -ItemType Directory -Path $folder -Force|Out-Null
$records=@()
for($i=0;$i -lt $ordered.Count;$i++){
 $b=$ordered[$i];$left=[Math]::Max(0,$b[0]-2);$top=[Math]::Max(0,$b[1]-2)
 $right=[Math]::Min($image.Width-1,$b[2]+2);$bottom=[Math]::Min($image.Height-1,$b[3]+2)
 $crop=$image.Clone([System.Drawing.Rectangle]::new($left,$top,$right-$left+1,$bottom-$top+1),[System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
 $name='pose-{0:D2}.png' -f ($i+1)
 $crop.Save((Join-Path $folder $name),[System.Drawing.Imaging.ImageFormat]::Png)
 $records+=[ordered]@{file=$name;x=$left;y=$top;width=$crop.Width;height=$crop.Height;opaque_pixels=$b[4]}
 $crop.Dispose()
}
$image.Dispose()
$records|ConvertTo-Json|Set-Content -LiteralPath (Join-Path $folder 'bounds.json') -Encoding utf8
$records|ConvertTo-Json -Compress
