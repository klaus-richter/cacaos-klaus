# publish.ps1 — Publica a GitHub Pages con respaldo automático de versiones antiguas
$ErrorActionPreference = "Stop"
$proj = $PSScriptRoot
Set-Location $proj

$git = "$proj\..\git-portable\bin\cmd\git.exe"
$gh  = "C:\Program Files\GitHub CLI\gh.exe"
if (-not (Test-Path $git)) { $git = "git" }

# 1. Respaldar versión actual en la carpeta versiones
$versionesDir = Join-Path $proj "versiones"
if (-not (Test-Path $versionesDir)) {
    New-Item -ItemType Directory -Force -Path $versionesDir | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$indexPath = Join-Path $proj "index.html"
if (Test-Path $indexPath) {
    $backupFile = Join-Path $versionesDir "index_$timestamp.html"
    Copy-Item -Path $indexPath -Destination $backupFile -Force
    Write-Host "📦 Copia de seguridad guardada en: versiones\index_$timestamp.html" -ForegroundColor Cyan
}

Write-Host "`n=======================================================" -ForegroundColor Green
Write-Host " 🚀 Publicando Cacao's Klaus a GitHub Pages... " -ForegroundColor Green
Write-Host "=======================================================`n" -ForegroundColor Green

# 2. Push limpio a GitHub
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

Write-Host "`n✅ ¡Publicado exitosamente! Tu web pública limpia se actualizará en 30 segundos:" -ForegroundColor Green
Write-Host "👉 https://klaus-richter.github.io/cacaos-klaus/`n" -ForegroundColor Yellow
