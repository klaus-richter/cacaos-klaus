# server.ps1 — Mini servidor local con versionado automatico y auto-publicacion a GitHub
$port = 8080
$proj = $PSScriptRoot
Set-Location $proj

$git = "$proj\..\git-portable\bin\cmd\git.exe"
$gh  = "C:\Program Files\GitHub CLI\gh.exe"
if (-not (Test-Path $git)) { $git = "git" }

# Asegurar carpeta de versiones antiguas
$versionesDir = Join-Path $proj "versiones"
if (-not (Test-Path $versionesDir)) {
    New-Item -ItemType Directory -Force -Path $versionesDir | Out-Null
}

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()

Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Editor Visual Cacaos Klaus Activo en: " -ForegroundColor Cyan
Write-Host " http://localhost:$port/editor.html " -ForegroundColor Yellow
Write-Host " Las versiones antiguas se guardan en: \versiones\ " -ForegroundColor Magenta
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Presiona Ctrl+C para detener el servidor."

Start-Process "http://localhost:$port/editor.html"

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $req = $context.Request
    $res = $context.Response

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

    if ($urlPath -eq "api/save-and-publish" -and $req.HttpMethod -eq "POST") {
        try {
            $reader = New-Object System.IO.StreamReader($req.InputStream, [System.Text.Encoding]::UTF8)
            $htmlContent = $reader.ReadToEnd()
            
            $timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
            $indexPath = Join-Path $proj "index.html"
            $editorPath = Join-Path $proj "editor.html"
            
            if (Test-Path $indexPath) {
                $backupFile = Join-Path $versionesDir "index_$timestamp.html"
                Copy-Item -Path $indexPath -Destination $backupFile -Force
                Write-Host "Version Respaldada: $backupFile" -ForegroundColor Cyan
            }

            [System.IO.File]::WriteAllText($indexPath, $htmlContent, [System.Text.Encoding]::UTF8)

            $cssInject = '  <link rel="stylesheet" href="assets/css/visual-editor.css" />' + "`n</head>"
            $jsInject = '  <script src="assets/js/visual-editor.js" defer></script>' + "`n</body>"
            $editorHtml = $htmlContent.Replace('</head>', $cssInject).Replace('</body>', $jsInject)
            [System.IO.File]::WriteAllText($editorPath, $editorHtml, [System.Text.Encoding]::UTF8)

            $token = ""
            if (Test-Path $gh) {
                $token = (& $gh auth token 2>$null)
                if ($token) { $token = $token.Trim() }
            }
            & $git add -A
            & $git commit -m "update ($timestamp): edicion visual automatica con versionado"
            $env:GIT_TERMINAL_PROMPT = "0"
            if ($token -ne "") {
                & $git -c credential.helper= push "https://klaus-richter:$token@github.com/klaus-richter/cacaos-klaus.git" main:main 2>&1 | Out-Null
            } else {
                & $git push origin main 2>&1 | Out-Null
            }

            $respData = @{
                status = "ok"
                message = "Publicado exitosamente en GitHub Pages"
                version = "index_$timestamp.html"
                url = "https://klaus-richter.github.io/cacaos-klaus/"
            }
            $jsonOut = $respData | ConvertTo-Json -Compress
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($jsonOut)
            $res.ContentType = "application/json; charset=utf-8"
            $res.OutputStream.Write($buffer, 0, $buffer.Length)
            $res.Close()
            Write-Host "Auto-Publish: Guardado, versionado y subido a GitHub Pages." -ForegroundColor Green
            continue
        } catch {
            $err = $_.Exception.Message
            $errData = @{
                status = "error"
                message = $err
            }
            $jsonOut = $errData | ConvertTo-Json -Compress
            $buffer = [System.Text.Encoding]::UTF8.GetBytes($jsonOut)
            $res.StatusCode = 500
            $res.ContentType = "application/json; charset=utf-8"
            $res.OutputStream.Write($buffer, 0, $buffer.Length)
            $res.Close()
            continue
        }
    }

    $filePath = Join-Path $proj $urlPath
    if (Test-Path $filePath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
        $contentType = "application/octet-stream"
        if ($ext -eq ".html") { $contentType = "text/html; charset=utf-8" }
        if ($ext -eq ".css") { $contentType = "text/css; charset=utf-8" }
        if ($ext -eq ".js") { $contentType = "application/javascript; charset=utf-8" }
        if ($ext -eq ".svg") { $contentType = "image/svg+xml" }
        if ($ext -eq ".png") { $contentType = "image/png" }
        if ($ext -eq ".jpg") { $contentType = "image/jpeg" }

        $res.ContentType = $contentType
        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $res.OutputStream.Write($bytes, 0, $bytes.Length)
        $res.Close()
    } else {
        $res.StatusCode = 404
        $res.Close()
    }
}
