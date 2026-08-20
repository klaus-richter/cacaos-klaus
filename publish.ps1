$ErrorActionPreference = "Stop"
$proj = $PSScriptRoot
Set-Location $proj

$git = "$proj\..\git-portable\bin\cmd\git.exe"
$gh  = "C:\Program Files\GitHub CLI\gh.exe"
if (-not (Test-Path $git)) { $git = "git" }

$versionesDir = Join-Path $proj "versiones"
if (-not (Test-Path $versionesDir)) {
    New-Item -ItemType Directory -Force -Path $versionesDir | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$indexPath = Join-Path $proj "index.html"
if (Test-Path $indexPath) {
    $backupFile = Join-Path $versionesDir "index_$timestamp.html"
    Copy-Item -Path $indexPath -Destination $backupFile -Force
    Write-Host "[Respaldo] Copia guardada en: versiones\index_$timestamp.html" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Green
Write-Host " Publicando Cacaos Klaus a GitHub Pages... " -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
Write-Host ""

$token = ""
if (Test-Path $gh) {
    $token = (& $gh auth token 2>$null)
    if ($token) { $token = $token.Trim() }
}

& $git add -A
& $git commit -m "update ($timestamp): nueva version publicada"
$env:GIT_TERMINAL_PROMPT = "0"
if ($token -ne "") {
    & $git -c credential.helper= push "https://klaus-richter:$token@github.com/klaus-richter/cacaos-klaus.git" main:main
} else {
    & $git push origin main
}

Write-Host ""
Write-Host "Publicado exitosamente. Tu web publica limpia se actualizara en 30 segundos:" -ForegroundColor Green
Write-Host "https://klaus-richter.github.io/cacaos-klaus/" -ForegroundColor Yellow
Write-Host ""
