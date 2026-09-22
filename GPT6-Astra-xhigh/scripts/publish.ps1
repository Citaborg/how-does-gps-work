param([switch]$SkipBuild)
$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$buildRoot = Join-Path $projectRoot 'dist'
$targetRoot = 'Y:\bredland.no\gps\astra'
if ([IO.Path]::GetFullPath($targetRoot).TrimEnd('\') -ne 'Y:\bredland.no\gps\astra') { throw 'Unexpected publication target' }
if (-not (Test-Path -LiteralPath 'Y:\bredland.no')) { throw 'The requested hosting mount is unavailable' }
if (-not $SkipBuild) {
  Push-Location $projectRoot
  try { & npm.cmd run build; if ($LASTEXITCODE -ne 0) { throw 'Build failed' } } finally { Pop-Location }
}
if (-not (Test-Path -LiteralPath (Join-Path $buildRoot 'index.html'))) { throw 'Built index.html is missing' }
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$evidenceRoot = Join-Path $projectRoot '.local'
New-Item -ItemType Directory -Force -Path $evidenceRoot | Out-Null
$backupRoot = $null
if (Test-Path -LiteralPath $targetRoot) {
  $backupRoot = Join-Path $evidenceRoot ('backups\astra-' + $stamp)
  New-Item -ItemType Directory -Force -Path $backupRoot | Out-Null
  foreach ($file in Get-ChildItem -LiteralPath $targetRoot -Recurse -File -Force) {
    $relative = [IO.Path]::GetRelativePath($targetRoot, $file.FullName)
    $savedFile = Join-Path $backupRoot $relative
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $savedFile) | Out-Null
    Copy-Item -LiteralPath $file.FullName -Destination $savedFile
    if ((Get-FileHash -LiteralPath $file.FullName).Hash -ne (Get-FileHash -LiteralPath $savedFile).Hash) { throw "Backup verification failed: $relative" }
  }
}
New-Item -ItemType Directory -Force -Path $targetRoot | Out-Null
$manifest = @()
# Assets first, HTML last, so readers never receive a page that references missing assets.
$files = Get-ChildItem -LiteralPath $buildRoot -Recurse -File | Sort-Object @{Expression={if($_.FullName -eq (Join-Path $buildRoot 'index.html')){1}else{0}}}, FullName
foreach ($file in $files) {
  $relative = [IO.Path]::GetRelativePath($buildRoot, $file.FullName)
  $destination = Join-Path $targetRoot $relative
  if (-not ([IO.Path]::GetFullPath($destination).StartsWith($targetRoot + '\', [StringComparison]::OrdinalIgnoreCase))) { throw 'Destination escaped the authorized directory' }
  New-Item -ItemType Directory -Force -Path (Split-Path -Parent $destination) | Out-Null
  if ($relative -eq 'index.html') {
    $temporaryIndex = Join-Path $targetRoot ('index-' + $stamp + '.tmp')
    Copy-Item -LiteralPath $file.FullName -Destination $temporaryIndex
    Move-Item -LiteralPath $temporaryIndex -Destination $destination -Force
  } else {
    Copy-Item -LiteralPath $file.FullName -Destination $destination -Force
  }
  $expected = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
  $actual = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash
  if ($expected -ne $actual) { throw "Published file hash mismatch: $relative" }
  $manifest += [ordered]@{ path=$relative; sha256=$expected; bytes=$file.Length }
}
$record = [ordered]@{ published=(Get-Date -Format o); target=$targetRoot; url='https://bredland.no/gps/astra/'; backup=$backupRoot; files=$manifest }
$record | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $evidenceRoot ('publish-' + $stamp + '.json'))
Write-Output ('Published and hash-verified ' + $manifest.Count + ' files to ' + $targetRoot)
if ($backupRoot) { Write-Output ('Recoverable previous version: ' + $backupRoot) }
