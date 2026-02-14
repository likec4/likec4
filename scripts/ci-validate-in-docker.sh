#!/usr/bin/env bash
# Run CI-like validation (typecheck + e2e typecheck) in a Linux container.
# Usage: from repo root on Windows: .\scripts\ci-validate-in-docker.ps1
#        or with Docker: docker run --rm -v "$(pwd):/workspace" -w /workspace node:22-bookworm bash /workspace/scripts/ci-validate-in-docker.sh

set -e
export CI=true
export HUSKY=0

echo "==> Installing pnpm..."
corepack enable
# Version must match .tool-versions and package.json packageManager
corepack prepare pnpm@10.29.3 --activate
pnpm --version

echo "==> Installing dependencies..."
pnpm install --frozen-lockfile --prefer-offline

export NODE_ENV=production

echo "==> pnpm typecheck (monorepo, excl. apps)..."
pnpm typecheck

echo "==> test:e2e:typecheck (pack, e2e install, vitest typecheck)..."
pnpm test:e2e:typecheck

echo "==> Validation finished successfully."
