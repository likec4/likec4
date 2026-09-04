# SPDX-License-Identifier: MIT
#
# Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

param(
  [Parameter(Mandatory)]
  [string]$ExtensionPath,
  [Parameter(Mandatory)]
  [string]$FixturePath,
  [Parameter(Mandatory)]
  [string]$OutputPath,
  [Parameter(Mandatory)]
  [string]$Label
)

$ErrorActionPreference = 'Stop'

$userDataPath = Join-Path $env:RUNNER_TEMP "likec4-$Label-user-data"
$extensionsPath = Join-Path $env:RUNNER_TEMP "likec4-$Label-extensions"
$evidenceDirectory = Split-Path -Parent $OutputPath
$stdoutPath = Join-Path $evidenceDirectory "$Label-vscode.stdout.log"
$stderrPath = Join-Path $evidenceDirectory "$Label-vscode.stderr.log"
$debugPort = switch ($Label) {
  'baseline' { 9222 }
  'pr' { 9223 }
  default { throw "Unsupported capture label: $Label" }
}

Remove-Item -Recurse -Force -ErrorAction SilentlyContinue $userDataPath, $extensionsPath
@($userDataPath, $extensionsPath, $evidenceDirectory) | ForEach-Object {
  New-Item -ItemType Directory -Force $_ | Out-Null
}

$codeCommand = Get-Command code.cmd -ErrorAction SilentlyContinue
if ($null -eq $codeCommand) {
  $codeCommand = Get-Command code -ErrorAction Stop
}

$arguments = @(
  '--new-window',
  "--user-data-dir=$userDataPath",
  "--extensions-dir=$extensionsPath",
  "--extensionDevelopmentPath=$ExtensionPath",
  '--disable-gpu',
  '--disable-workspace-trust',
  '--skip-welcome',
  '--skip-release-notes',
  "--remote-debugging-port=$debugPort",
  $FixturePath
)

try {
  Start-Process -FilePath $codeCommand.Source -ArgumentList $arguments -RedirectStandardOutput $stdoutPath -RedirectStandardError $stderrPath
  Start-Sleep -Seconds 12

  $window = Get-Process Code | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -Last 1
  if ($null -eq $window) {
    throw "No VS Code window found. See $stdoutPath and $stderrPath"
  }

  $shell = New-Object -ComObject WScript.Shell
  if (-not $shell.AppActivate($window.Id)) {
    throw "Could not activate VS Code window $($window.Id)."
  }

  Add-Type -AssemblyName System.Windows.Forms
  [System.Windows.Forms.SendKeys]::SendWait('^+p')
  Start-Sleep -Seconds 1
  [System.Windows.Forms.SendKeys]::SendWait('LikeC4: Open Preview')
  Start-Sleep -Seconds 1
  [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
  Start-Sleep -Seconds 3
  [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
  Start-Sleep -Seconds 20

  node ./scripts/capture-vscode-webview.mjs --port $debugPort --output $OutputPath --console "$OutputPath.console.json"
  if ($LASTEXITCODE -ne 0) {
    throw "CDP capture failed for $Label. See $stdoutPath and $stderrPath"
  }
} finally {
  Get-Process Code -ErrorAction SilentlyContinue | Stop-Process -Force
}
