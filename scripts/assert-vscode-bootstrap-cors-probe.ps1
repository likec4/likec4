# SPDX-License-Identifier: MIT
#
# Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.

param(
  [Parameter(Mandatory)]
  [string]$BaselineConsole,
  [Parameter(Mandatory)]
  [string]$RepairConsole,
  [Parameter(Mandatory)]
  [string]$BaselinePng,
  [Parameter(Mandatory)]
  [string]$RepairPng,
  [Parameter(Mandatory)]
  [string]$OutputPath
)

$ErrorActionPreference = 'Stop'

function Read-ConsoleEntries {
  param([string]$Path)

  if (-not (Test-Path -LiteralPath $Path)) {
    throw "Console log does not exist: $Path"
  }

  try {
    return @(Get-Content -LiteralPath $Path -Raw | ConvertFrom-Json)
  } catch {
    throw "Cannot parse console log $Path: $($_.Exception.Message)"
  }
}

function Test-CorsEntry {
  param([object]$Entry)

  $text = @($Entry.text, $Entry.description, $Entry.message) -join "`n"
  return $text.Contains('blocked by CORS policy') -and $text.Contains('icons.like-c4.dev/bootstrap/')
}

function Write-ProbeResult {
  param(
    [bool]$BaselineCors,
    [bool]$RepairCors,
    [int]$ChangedPixels,
    [int]$Threshold,
    [object]$BaselineDimensions,
    [object]$RepairDimensions
  )

  $directory = Split-Path -Parent $OutputPath
  if ($directory) {
    New-Item -ItemType Directory -Force $directory | Out-Null
  }

  @{
    baselineCors      = $BaselineCors
    repairCors        = $RepairCors
    changedPixels     = $ChangedPixels
    threshold         = $Threshold
    baselineDimensions = $BaselineDimensions
    repairDimensions   = $RepairDimensions
  } | ConvertTo-Json | Set-Content -LiteralPath $OutputPath -Encoding utf8
}

$threshold = 100
$changedPixels = 0
$baselineDimensions = $null
$repairDimensions = $null
$baselineCors = $false
$repairCors = $false
$failure = $null

try {
  $baselineCors = @(Read-ConsoleEntries $BaselineConsole | Where-Object { Test-CorsEntry $_ }).Count -gt 0
  $repairCors = @(Read-ConsoleEntries $RepairConsole | Where-Object { Test-CorsEntry $_ }).Count -gt 0

  if (-not (Test-Path -LiteralPath $BaselinePng)) {
    throw "Baseline screenshot does not exist: $BaselinePng"
  }
  if (-not (Test-Path -LiteralPath $RepairPng)) {
    throw "Repair screenshot does not exist: $RepairPng"
  }

  Add-Type -AssemblyName System.Drawing
  $baselineBitmap = [System.Drawing.Bitmap]::new($BaselinePng)
  $repairBitmap = [System.Drawing.Bitmap]::new($RepairPng)
  try {
    $baselineDimensions = @{ width = $baselineBitmap.Width; height = $baselineBitmap.Height }
    $repairDimensions = @{ width = $repairBitmap.Width; height = $repairBitmap.Height }

    if ($baselineBitmap.Width -eq $repairBitmap.Width -and $baselineBitmap.Height -eq $repairBitmap.Height) {
      $sampleIndex = 0
      for ($y = 0; $y -lt $baselineBitmap.Height; $y++) {
        for ($x = 0; $x -lt $baselineBitmap.Width; $x++) {
          if ($sampleIndex % 4 -eq 0) {
            $baselinePixel = $baselineBitmap.GetPixel($x, $y)
            $repairPixel = $repairBitmap.GetPixel($x, $y)
            $delta = [Math]::Abs($baselinePixel.A - $repairPixel.A) +
              [Math]::Abs($baselinePixel.R - $repairPixel.R) +
              [Math]::Abs($baselinePixel.G - $repairPixel.G) +
              [Math]::Abs($baselinePixel.B - $repairPixel.B)
            if ($delta -gt 80) {
              $changedPixels++
            }
          }
          $sampleIndex++
        }
      }
    }
  } finally {
    if ($null -ne $baselineBitmap) { $baselineBitmap.Dispose() }
    if ($null -ne $repairBitmap) { $repairBitmap.Dispose() }
  }
} catch {
  $failure = $_.Exception.Message
}

Write-ProbeResult `
  -BaselineCors $baselineCors `
  -RepairCors $repairCors `
  -ChangedPixels $changedPixels `
  -Threshold $threshold `
  -BaselineDimensions $baselineDimensions `
  -RepairDimensions $repairDimensions

if ($failure) {
  throw $failure
}
if (-not $baselineCors) {
  throw "Baseline console did not report a Bootstrap CORS denial. See $BaselineConsole"
}
if ($repairCors) {
  throw "Repair console still reports a Bootstrap CORS denial. See $RepairConsole"
}
if ($baselineDimensions.width -ne $repairDimensions.width -or $baselineDimensions.height -ne $repairDimensions.height) {
  throw "Screenshot dimensions differ: baseline $($baselineDimensions.width)x$($baselineDimensions.height), repair $($repairDimensions.width)x$($repairDimensions.height)."
}
if ($changedPixels -lt $threshold) {
  throw "Screenshot visual delta is insufficient: $changedPixels changed samples; expected at least $threshold."
}
