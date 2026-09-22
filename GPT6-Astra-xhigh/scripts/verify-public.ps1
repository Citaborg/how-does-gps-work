$ErrorActionPreference = 'Stop'
$projectRoot = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$buildRoot = Join-Path $projectRoot 'dist'
$baseUri = 'https://www.bredland.no/gps/astra/'
$checked = @()
foreach ($file in Get-ChildItem -LiteralPath $buildRoot -Recurse -File) {
  $relative = [IO.Path]::GetRelativePath($buildRoot,$file.FullName).Replace('\','/')
  $response = Invoke-WebRequest -Uri ($baseUri + $relative)
  $actual = [Convert]::ToHexString([Security.Cryptography.SHA256]::HashData($response.RawContentStream.ToArray()))
  $expected = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
  if ($actual -ne $expected) { throw "Public hash mismatch: $relative" }
  $checked += [ordered]@{path=$relative;http=[int]$response.StatusCode;sha256=$actual}
}
if ($checked.Count -eq 0) { throw 'No built files to verify' }
$response = Invoke-WebRequest -Uri $baseUri
if ([int]$response.StatusCode -ne 200) { throw 'Public directory URL is not serving the page' }
New-Item -ItemType Directory -Force -Path (Join-Path $projectRoot '.local') | Out-Null
[ordered]@{verified=(Get-Date -Format o);url=$baseUri;files=$checked} | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $projectRoot '.local\public-verification.json')
Write-Output ('Public HTTP 200 and SHA-256 matches build for ' + $checked.Count + ' files: ' + $baseUri)
