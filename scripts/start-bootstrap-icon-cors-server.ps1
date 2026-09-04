# SPDX-License-Identifier: MIT
#
# Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

param(
  [Parameter(Mandatory)]
  [string]$EvidencePath
)

$ErrorActionPreference = 'Stop'

$hostName = 'icons.like-c4.dev'
$port = 443
$hostsPath = "$env:WINDIR\System32\drivers\etc\hosts"
$backupPath = Join-Path $EvidencePath 'hosts.before'
$certificatePath = Join-Path $EvidencePath 'icons-like-c4-dev.cer'
$serverScriptPath = Join-Path $EvidencePath 'bootstrap-icon-cdn-server.ps1'
$serverLogPath = Join-Path $EvidencePath 'icon-cdn.log'
$urlPrefix = "https://${hostName}:${port}/"
$cert = $null
$server = $null
$hostsBackupCreated = $false
$sslBindingCreated = $false

New-Item -ItemType Directory -Force $EvidencePath | Out-Null

try {
  $cert = New-SelfSignedCertificate -DnsName $hostName -CertStoreLocation 'Cert:\LocalMachine\My'
  Export-Certificate -Cert $cert -FilePath $certificatePath | Out-Null
  Import-Certificate -FilePath $certificatePath -CertStoreLocation 'Cert:\LocalMachine\Root' | Out-Null

  Copy-Item -Force $hostsPath $backupPath
  $hostsBackupCreated = $true
  Add-Content -Path $hostsPath -Value "127.0.0.1 $hostName"
  Clear-DnsClientCache

  $appId = '{8c68e414-5245-4dcc-a55a-d4d28c2c4ec0}'
  & netsh http add sslcert ipport="0.0.0.0:$port" certhash=$($cert.Thumbprint) appid=$appId | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw 'Could not bind the controlled Bootstrap CDN certificate to port 443.'
  }
  $sslBindingCreated = $true

  $serverScript = @'
param(
  [Parameter(Mandatory)]
  [string]$EvidencePath,
  [Parameter(Mandatory)]
  [string]$Prefix
)

$ErrorActionPreference = 'Stop'
$logPath = Join-Path $EvidencePath 'icon-cdn.log'
$svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor"><path d="M1 1h14v14H1z"/></svg>'
$allowedPaths = @('/bootstrap/boxes.svg', '/bootstrap/buildings-fill.svg')
$listener = [System.Net.HttpListener]::new()
$listener.Prefixes.Add($Prefix)

try {
  $listener.Start()
  while ($true) {
    $context = $listener.GetContext()
    $origin = $context.Request.Headers['Origin']
    if ([string]::IsNullOrEmpty($origin)) {
      $origin = '-'
    }
    [System.IO.File]::AppendAllText($logPath, "{0} {1} {2}`n" -f $context.Request.HttpMethod, $context.Request.Url.AbsolutePath, $origin)

    if ($allowedPaths -contains $context.Request.Url.AbsolutePath) {
      $payload = [System.Text.Encoding]::UTF8.GetBytes($svg)
      $context.Response.StatusCode = 200
      $context.Response.ContentType = 'image/svg+xml'
      $context.Response.ContentLength64 = $payload.Length
      $context.Response.OutputStream.Write($payload, 0, $payload.Length)
    } else {
      $context.Response.StatusCode = 404
    }
    $context.Response.Close()
  }
} catch {
  [System.IO.File]::AppendAllText($logPath, "SERVER ERROR: $($_.Exception.Message)`n")
  throw
} finally {
  $listener.Close()
}
'@
  Set-Content -Path $serverScriptPath -Value $serverScript -Encoding utf8

  $server = Start-Process -FilePath 'pwsh' -ArgumentList @(
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    $serverScriptPath,
    '-EvidencePath',
    $EvidencePath,
    '-Prefix',
    $urlPrefix
  ) -PassThru

  $readinessUrl = "${urlPrefix}bootstrap/boxes.svg"
  $readinessDeadline = [DateTime]::UtcNow.AddSeconds(15)
  $readinessError = $null
  $serverReady = $false
  while ([DateTime]::UtcNow -lt $readinessDeadline) {
    if ($server.HasExited) {
      throw "Controlled Bootstrap CDN server exited. See $serverLogPath"
    }
    try {
      $response = Invoke-WebRequest -UseBasicParsing -Uri $readinessUrl -TimeoutSec 2
      if ($response.StatusCode -eq 200 -and $response.Content -match '<svg') {
        $serverReady = $true
        break
      }
    } catch {
      $readinessError = $_.Exception.Message
    }
    Start-Sleep -Milliseconds 250
  }
  if (-not $serverReady) {
    throw "Controlled Bootstrap CDN did not become ready at $readinessUrl. Last error: $readinessError"
  }

  @(
    "ICON_CDN_PORT=$port",
    "ICON_CDN_PID=$($server.Id)",
    "ICON_CDN_CERT_THUMBPRINT=$($cert.Thumbprint)",
    "ICON_CDN_HOSTS_BACKUP=$backupPath"
  ) | Out-File -FilePath $env:GITHUB_ENV -Encoding utf8 -Append
} catch {
  if ($null -ne $server) {
    Stop-Process -Id $server.Id -Force -ErrorAction SilentlyContinue
  }
  if ($sslBindingCreated) {
    & netsh http delete sslcert ipport="0.0.0.0:$port" | Out-Null
  }
  if ($hostsBackupCreated -and (Test-Path $backupPath)) {
    Copy-Item -Force $backupPath $hostsPath
    Clear-DnsClientCache -ErrorAction SilentlyContinue
  }
  if ($null -ne $cert) {
    Remove-Item -Force "Cert:\LocalMachine\My\$($cert.Thumbprint)" -ErrorAction SilentlyContinue
    Remove-Item -Force "Cert:\LocalMachine\Root\$($cert.Thumbprint)" -ErrorAction SilentlyContinue
  }
  throw
}
