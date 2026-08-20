# publish.ps1 — Publica los cambios locales a GitHub Pages
$ErrorActionPreference = "Stop"
$proj = $PSScriptRoot
Set-Location $proj

$git = "$proj\..\git-portable\bin\cmd\git.exe"
$gh  = "C:\Program Files\GitHub CLI\gh.exe"

if (-not (Test-Path $git)) {
    $git = "git"
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " 🚀 Publicando Cacao's Klaus a GitHub... " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Obtener token de gh para push transparente
$token = (& $gh auth token).Trim()

& $git add -A
& $git commit -m "update: cambios visuales en landing"
$env:GIT_TERMINAL_PROMPT = "0"
& $git -c credential.helper= push "https://klaus-richter:$token@github.com/klaus-richter/cacaos-klaus.git" main:main

Write-Host "`n✅ ¡Listo! En ~30 segundos tus cambios estarán en vivo en:" -ForegroundColor Green
Write-Host "👉 https://klaus-richter.github.io/cacaos-klaus/`n" -ForegroundColor Yellow
