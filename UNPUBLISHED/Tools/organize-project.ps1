param([switch]$Apply)
$ErrorActionPreference='Stop'
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\..'))
$prefix=$root+[IO.Path]::DirectorySeparatorChar
$plan=[System.Collections.Generic.List[object]]::new()
function Add-Move([string]$from,[string]$to){$plan.Add([pscustomobject]@{from=$from;to=$to})}
# Specific asset branches precede their parent folders.
Add-Move 'assets\sprites\animations' 'UNPUBLISHED\Animation\Studies'
Add-Move 'assets\sprites\Animals' 'UNPUBLISHED\Animation\Animals'
Add-Move 'assets\sprites\concepts' 'UNPUBLISHED\Concepts'
Add-Move 'assets\sprites' 'UNPUBLISHED\Animation\Bases'
Add-Move 'Sprites' 'UNPUBLISHED\Animation\Exports'
Add-Move 'asset-review' 'UNPUBLISHED\References\AssetReview'
Add-Move 'Resourses' 'UNPUBLISHED\References\OriginalResources'
Add-Move 'private-opening\qa' 'UNPUBLISHED\QA'
Add-Move 'backups' 'UNPUBLISHED\Archives\LocalBackups'
Add-Move '0001-Add-D-D-5e-stats-scaffolding.patch' 'UNPUBLISHED\Archives\Patches\0001-Add-D-D-5e-stats-scaffolding.patch'
Add-Move 'tests\world.test.mjs' 'UNPUBLISHED\Legacy3D\tests\world.test.mjs'
foreach($name in @('assets','vendor','main.js','world.js','character.js','forest.js','visuals.js','index.html','style.css','art-manifest.json','model-study.html','shelf-card.html','browser-test.cjs','deploy.ps1','document-model.cjs','inspect-camera.cjs','inspect-model.cjs','inspect.cjs','integrate-model.cjs','prepare-release.cjs','refine-graphics.cjs','refine-sculpt.cjs','refine.cjs','sculpt-model.cjs','upgrade-graphics.cjs','validate-model.cjs','verify-live.cjs','verify-model-viewer.cjs')){Add-Move $name ('UNPUBLISHED\Legacy3D\'+$name)}
foreach($name in @('private-opening','units','data','docs','tests','audio.js','audio-catalog.js','story.js','stats.js','stats-data.js','resources.js','world-characters.js','build-site.cjs','build-stats.cjs','site-build-check.cjs','deploy-site.ps1','serve.cjs')){Add-Move $name ('RELEASE\'+$name)}
Add-Move 'README.md' 'UNPUBLISHED\Archives\previous-project-README.md'
# Resolve and validate every endpoint before moving any directory recursively.
foreach($item in $plan){
 $from=[IO.Path]::GetFullPath((Join-Path $root $item.from));$to=[IO.Path]::GetFullPath((Join-Path $root $item.to))
 if(-not $from.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)-or -not $to.StartsWith($prefix,[StringComparison]::OrdinalIgnoreCase)){throw 'Move escapes project root.'}
 if(-not (Test-Path -LiteralPath $from)){throw ('Missing source: '+$item.from)}
 if(Test-Path -LiteralPath $to){throw ('Destination already exists: '+$item.to)}
}
if(-not $Apply){$plan|ConvertTo-Json -Depth 4;return}
Copy-Item -LiteralPath (Join-Path $root 'package.json') -Destination (Join-Path $root 'RELEASE\package.json')
foreach($item in $plan){
 $from=[IO.Path]::GetFullPath((Join-Path $root $item.from));$to=[IO.Path]::GetFullPath((Join-Path $root $item.to))
 New-Item -ItemType Directory -Path (Split-Path -Parent $to) -Force | Out-Null
 Move-Item -LiteralPath $from -Destination $to
}
$plan|ConvertTo-Json -Depth 4|Set-Content -LiteralPath (Join-Path $root 'UNPUBLISHED\Organization\moves.json') -Encoding utf8
Write-Output ('Moved '+$plan.Count+' entries; no files deleted.')
