# Run CI-like validation inside a Linux container (Node 22).
# Requires Docker. From repo root: .\scripts\ci-validate-in-docker.ps1

$ErrorActionPreference = "Stop"
# Repo root = parent of scripts/
$root = Split-Path -Parent $PSScriptRoot
$workspace = (Resolve-Path $root).Path -replace '\\', '/'

Write-Output "==> Starting Linux container (node:22-bookworm) with workspace: $workspace"
docker run --rm `
  -v "${workspace}:/workspace" `
  -w /workspace `
  -e CI=true `
  -e HUSKY=0 `
  node:22-bookworm `
  bash -c 'tmp=$(mktemp) && sed "s/\r$//" /workspace/scripts/ci-validate-in-docker.sh > $tmp && bash $tmp'

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
