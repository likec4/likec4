# Run CI-like validation inside a Linux container (Node 22).
# Requires Docker. From repo root: .\scripts\ci-validate-in-docker.ps1

$ErrorActionPreference = "Stop"
# Repo root = parent of scripts/
$root = Split-Path -Parent $PSScriptRoot
$workspace = (Resolve-Path $root).Path -replace '\\', '/'

Write-Host "==> Starting Linux container (node:22-bookworm) with workspace: $workspace"
docker run --rm `
  -v "${workspace}:/workspace" `
  -w /workspace `
  -e CI=true `
  -e HUSKY=0 `
  -e NODE_ENV=production `
  node:22-bookworm `
  bash -c "sed 's/\r$//' /workspace/scripts/ci-validate-in-docker.sh | bash"

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
