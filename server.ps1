# server.ps1 — Mini servidor local con versionado automático y auto-publicación a GitHub
$port = 8080
$proj = $PSScriptRoot
Set-Location $proj

$git = "$proj\..\git-portable\bin\cmd\git.exe"
$gh  = "C:\Program Files\GitHub CLI\gh.exe"
if (-not (Test-Path $git)) { $git = "git" }

# Asegurar carpeta de versiones antiguas
$versionesDir = "$proj\versiones"
if (-not (Test-Path $versionesDir)) {
    New-Item -ItemType Directory -Force -Path $versionesDir | Out-Null
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " 🎨 Editor Visual Cacao's Klaus Activo en: " -ForegroundColor Cyan
Write-Host " 👉 http://localhost:$port/editor.html " -ForegroundColor Yellow
Write-Host " 📁 Las versiones antiguas se guardan en: \versiones\ " -ForegroundColor Magenta
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Presiona Ctrl+C para detener el servidor.`n"

# Abrir navegador automáticamente
Start-Process "http://localhost:$port/editor.html"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $req = $context.Request
    $res = $context.Response

    # CORS Headers
    $res.AddHeader("Access-Control-Allow-Origin", "*")
    $res.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    $res.AddHeader("Access-Control-Allow-Headers", "Content-Type")

    if ($req.HttpMethod -eq "OPTIONS") {
        $res.StatusCode = 200
        $res.Close()
        continue
    }

    $urlPath = $req.Url.LocalPath.TrimStart('/')
    if ($urlPath -eq "") { $urlPath = "editor.html" }

    # Endpoint para guardar, versionar y publicar directo por detrás
    if ($urlPath -eq "api/save-and-publish" -and $req.HttpMethod -eq "POST") {
        try {
            $reader = New-Object System.IO.StreamReader($req.InputStream, [System.Text.Encoding]::UTF8)
            $htmlContent = $reader.ReadToEnd()
            
            # 1. Versionar la versión actual previa antes de sobrescribir
            $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
            if (Test-Path "$proj\index.html") {
                $backupFile = "$versionesDir\index_$timestamp.html"
                Copy-Item -Path "$proj\index.html" -Destination $backupFile -Force
                Write-Host "📦 [Versión Respaldada] $backupFile" -ForegroundColor Cyan
            }

            # 2. Guardar nuevo index.html y editor.html
            Set-Content -Path "$proj\index.html" -Value $htmlContent -Encoding UTF8
            
            # Actualizar editor.html también
            $editorHtml = $htmlContent -replace '</head>', "  <link rel=`"stylesheet`" href=`"assets/css/visual-editor.css`" />`n</head>"
            $editorHtml = $editorHtml -replace '</body>', "  <script src=`"assets/js/visual-editor.js`" defer></script>`n</body>"
            Set-Content -Path "$proj\editor.html" -Value $editorHtml -Encoding UTF8

            # 3. Push automático a GitHub por detrás
            $token = (& $gh auth token 2>$null).Trim()
            & $git add -A
            & $git commit -m "update ($timestamp): edicion visual automatica con versionado"
            $env:GIT_TERMINAL_PROMPT = "0"
            if ($token) {
                & $git -c credential.helper= push "https://klaus-richter:$token@github.com/klaus-richter/cacaos-klaus.git" main:main 2>&1 | Out-Null
            } else {
                & $git push origin main 2>&1 | Out-Null
            }

            $responseString = "{`"status`":`"ok`",`"message`":`"¡Publicado exitosamente! Versión respaldada como index_$timestamp.html`",`"version`":`"index_$timestamp.html`",`"url`":`"https://klaus-richter.github.io/cacaos-klaus/`"}"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($responseString)
            $res.ContentType = "application/json; charset=utf-8"
            $res.OutputStream.Write($buffer, 0, $buffer.Length)
            $res.Close()
            Write-Host "✅ [Auto-Publish] Guardado, versionado y subido a GitHub Pages." -ForegroundColor Green
            continue
        } catch {
            $err = $_.Exception.Message
            $responseString = "{`"status`":`"error`",`"message`":`"$err`"}"
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($responseString)
            $res.StatusCode = 500
            $res.ContentType = "application/json; charset=utf-8"
            $res.OutputStream.Write($buffer, 0, $buffer.Length)
            $res.Close()
            continue
        }
    }

    # Servir archivos estáticos
    $filePath = Join-Path $proj $urlPath
    if (Test-Path $filePath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        $contentType = switch ($ext) {
            ".html" { "text/html; charset=utf-8" }
            ".css"  { "text/css; charset=utf-8" }
            ".js"   { "application/javascript; charset=utf-8" }
            ".svg"  { "image/svg+xml" }
            ".png"  { "image/png" }
            ".jpg"  { "image/jpeg" }
            default { "application/octet-stream" }
        }
        $res.ContentType = $contentType
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
        $res.Close()
    } else {
        $res.StatusCode = 404
        $res.Close()
    }
}
