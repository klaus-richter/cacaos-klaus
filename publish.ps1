$ErrorActionPreference = "Stop"
$proj = $PSScriptRoot
Set-Location $proj

$git = "$proj\..\git-portable\bin\cmd\git.exe"
$gh  = "C:\Program Files\GitHub CLI\gh.exe"
if (-not (Test-Path $git)) { $git = "git" }

# 1. Asegurar carpeta versiones
$versionesDir = Join-Path $proj "versiones"
if (-not (Test-Path $versionesDir)) {
    New-Item -ItemType Directory -Force -Path $versionesDir | Out-Null
}

# 2. Calcular siguiente correlativo numerico
$existingFiles = Get-ChildItem -Path $versionesDir -Filter "*.html" -ErrorAction SilentlyContinue
$maxNum = 0
foreach ($file in $existingFiles) {
    if ($file.Name -match '^(\d+)\.') {
        $num = [int]$matches[1]
        if ($num -gt $maxNum) {
            $maxNum = $num
        }
    }
}
$nextNum = $maxNum + 1
$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"

# 3. Solo renombrar si el usuario copio manualmente index.html o editor.html en la carpeta versiones
$rawIndex = Join-Path $versionesDir "index.html"
$rawEditor = Join-Path $versionesDir "editor.html"

if (Test-Path $rawIndex) {
    $newNameIndex = "$nextNum.index_$timestamp.html"
    Rename-Item -Path $rawIndex -NewName $newNameIndex -Force
    Write-Host "[Renombrado] versiones\$newNameIndex" -ForegroundColor Cyan
}

if (Test-Path $rawEditor) {
    $newNameEditor = "$nextNum.editor_$timestamp.html"
    Rename-Item -Path $rawEditor -NewName $newNameEditor -Force
    Write-Host "[Renombrado] versiones\$newNameEditor" -ForegroundColor Cyan
}

# 4. Sincronizar editor.html en la raiz con el nuevo index.html
$indexPath = Join-Path $proj "index.html"
$editorPath = Join-Path $proj "editor.html"

if (Test-Path $indexPath) {
    $indexContent = [System.IO.File]::ReadAllText($indexPath, [System.Text.Encoding]::UTF8)
    $cssTag = "  <link rel=`"stylesheet`" href=`"assets/css/visual-editor.css`" />`n</head>"
    $jsTag  = "  <script src=`"assets/js/visual-editor.js`" defer></script>`n</body>"
    $newEditorHtml = $indexContent.Replace('</head>', $cssTag).Replace('</body>', $jsTag)
    [System.IO.File]::WriteAllText($editorPath, $newEditorHtml, [System.Text.Encoding]::UTF8)
    Write-Host "[Sincronizado] editor.html actualizado con la ultima version de index.html" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "=======================================================" -ForegroundColor Green
Write-Host " Publicando Cacaos Klaus a GitHub Pages... " -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Green
Write-Host ""

# 5. Push a GitHub Pages
$token = ""
if (Test-Path $gh) {
    $token = (& $gh auth token 2>$null)
    if ($token) { $token = $token.Trim() }
}

& $git add -A
& $git commit -m "update ($nextNum): nueva version publicada ($timestamp)"
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
