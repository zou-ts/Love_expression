$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add("http://127.0.0.1:8080/")
$listener.Start()
Write-Host "Server running on http://localhost:8080"

$mimeTypes = @{
  ".html" = "text/html; charset=utf-8"
  ".css"  = "text/css; charset=utf-8"
  ".js"   = "application/javascript; charset=utf-8"
  ".mp3"  = "audio/mpeg"
  ".png"  = "image/png"
  ".jpg"  = "image/jpeg"
}

while ($listener.IsListening) {
  $ctx = $listener.GetContext()
  $req = $ctx.Request
  $res = $ctx.Response
  
  $url = [Uri]::UnescapeDataString($req.Url.LocalPath)
  if ($url -eq "/") { $url = "/index.html" }
  
  $filePath = Join-Path "D:\codex_project\xls" ($url.TrimStart("/"))
  $filePath = $filePath -replace "/", "\"
  $resolved = [System.IO.Path]::GetFullPath($filePath)
  if (-not $resolved.StartsWith("D:\codex_project\xls")) {
    $res.StatusCode = 403
    $msg = [System.Text.Encoding]::UTF8.GetBytes("Forbidden")
    $res.OutputStream.Write($msg, 0, $msg.Length)
    $res.OutputStream.Close()
    continue
  }
  $filePath = $resolved
  
  if (Test-Path $filePath) {
    $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
    $res.ContentType = $mimeTypes[$ext]
    $res.Headers.Add("X-Content-Type-Options", "nosniff")
    $res.Headers.Add("X-Frame-Options", "DENY")
    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    $res.ContentLength64 = $bytes.Length
    $res.OutputStream.Write($bytes, 0, $bytes.Length)
  } else {
    $res.StatusCode = 404
    $msg = [System.Text.Encoding]::UTF8.GetBytes("Not Found")
    $res.OutputStream.Write($msg, 0, $msg.Length)
  }
  $res.OutputStream.Close()
}