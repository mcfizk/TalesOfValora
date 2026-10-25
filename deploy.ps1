param()
$ErrorActionPreference='Stop'
$sceneSource='C:\Projects\fenris-awakening'
$gamesRoot='D:\UlfheimData\games'
$gameTarget=Join-Path $gamesRoot 'FenrisAwakening'
$stamp=Get-Date -Format 'yyyyMMdd-HHmmss'
$backupPath=Join-Path $sceneSource ('backups\release-'+$stamp)
New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
if(Test-Path -LiteralPath $gameTarget){Copy-Item -LiteralPath $gameTarget -Destination (Join-Path $backupPath 'FenrisAwakening') -Recurse}
Copy-Item -LiteralPath (Join-Path $gamesRoot 'index.html') -Destination (Join-Path $backupPath 'games-index.html')
$preview=Join-Path $gamesRoot 'assets\Fenris-Awakening-Preview.png'
if(Test-Path -LiteralPath $preview){Copy-Item -LiteralPath $preview -Destination (Join-Path $backupPath 'previous-preview.png')}
New-Item -ItemType Directory -Path $gameTarget -Force | Out-Null
foreach($folder in @('vendor','assets')){New-Item -ItemType Directory -Path (Join-Path $gameTarget $folder) -Force | Out-Null}
$files=@('index.html','style.css','main.js','world.js','story.js','forest.js','character.js','visuals.js','audio.js','stats.js','stats-data.js','resources.js','model-study.html','vendor\three.module.js','vendor\three.core.js','vendor\THREE-LICENSE.txt','assets\fur.png','assets\forest-floor.png','assets\bark.png','assets\fenris-sculpt.json')
# Copy assets and modules before switching the entry page to this release.
foreach($file in ($files | Where-Object {$_ -ne 'index.html'})){Copy-Item -LiteralPath (Join-Path $sceneSource $file) -Destination (Join-Path $gameTarget $file) -Force}
Copy-Item -LiteralPath (Join-Path $sceneSource 'index.html') -Destination (Join-Path $gameTarget 'index.html') -Force
Copy-Item -LiteralPath (Join-Path $sceneSource 'opening.png') -Destination $preview -Force
$shelfPath=Join-Path $gamesRoot 'index.html'
$shelf=Get-Content -LiteralPath $shelfPath -Raw
$card=Get-Content -LiteralPath (Join-Path $sceneSource 'shelf-card.html') -Raw
if($shelf -notmatch 'href="FenrisAwakening/"'){$shelf=$shelf.Replace('<main class="shelf">',"<main class=`"shelf`">`r`n"+$card);Set-Content -LiteralPath $shelfPath -Value $shelf -Encoding utf8}
foreach($file in $files){$a=(Get-FileHash -LiteralPath (Join-Path $sceneSource $file)).Hash;$b=(Get-FileHash -LiteralPath (Join-Path $gameTarget $file)).Hash;if($a -ne $b){throw "Hash mismatch: $file"}}
[pscustomobject]@{Published='https://ulfheim.dk/games/FenrisAwakening/';FilesVerified=$files.Count;Backup=$backupPath} | ConvertTo-Json
