$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$sourceRoot = Join-Path $repoRoot "public"
$outputRoot = Join-Path $repoRoot "checkin-public"
$templateRoot = Join-Path $repoRoot "checkin-hosting"

$resolvedRepo = [System.IO.Path]::GetFullPath($repoRoot).TrimEnd('\')
$resolvedOutput = [System.IO.Path]::GetFullPath($outputRoot).TrimEnd('\')
$expectedOutput = Join-Path $resolvedRepo "checkin-public"

if ($resolvedOutput -ne $expectedOutput -or -not $resolvedOutput.StartsWith($resolvedRepo + '\')) {
  throw "受付専用出力先が作業フォルダ外です: $resolvedOutput"
}

if (Test-Path -LiteralPath $resolvedOutput) {
  Remove-Item -LiteralPath $resolvedOutput -Recurse -Force
}

$files = @(
  "guest-checkin.html",
  "self-checkin.html",
  "member-register.html",
  "personal-member-qr.html",
  "location-checkin.html",
  "attendance-answer.html",
  "css/common.css",
  "js/common.js",
  "sql/index.html",
  "sql/css/app.css",
  "sql/js/checkin.js",
  "sql/js/qr-checkin.js",
  "sql/js/checkin-methods.js",
  "sql/js/config.js",
  "sql/js/generated.js",
  "sql/js/participant-attendance.js"
  "sql/js/public-training-display.js"
)

New-Item -ItemType Directory -Path $resolvedOutput | Out-Null
Copy-Item -LiteralPath (Join-Path $templateRoot "index.html") -Destination (Join-Path $resolvedOutput "index.html")
Copy-Item -LiteralPath (Join-Path $templateRoot "404.html") -Destination (Join-Path $resolvedOutput "404.html")

foreach ($relativePath in $files) {
  $source = Join-Path $sourceRoot $relativePath
  if (-not (Test-Path -LiteralPath $source)) {
    throw "必要な受付ファイルが見つかりません: $relativePath"
  }

  $destination = Join-Path $resolvedOutput $relativePath
  $destinationDirectory = Split-Path -Parent $destination
  New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
  Copy-Item -LiteralPath $source -Destination $destination -Force
}

Write-Output "受付専用Hostingを作成しました: $resolvedOutput"
Write-Output ("配置ファイル: " + ($files.Count + 2) + "件")
