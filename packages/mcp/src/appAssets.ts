import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// This module's compiled location depends on rolldown's chunking: when run
// unbundled (monorepo "sources" condition) or inlined directly into
// dist/index.mjs / dist/cli.mjs, it sits one directory below the package
// root, same as src/appAssets.ts. But since this code is imported by both
// entries, tsdown's shared chunkFileNames config (devops/tsdown.ts) routes it
// into dist/chunks/*.mjs instead, two directories below the package root.
// Try both depths, same approach as packages/leanix-bridge/src/contracts.ts.
function readDistAsset(relativePath: string): string {
  const candidateUrls = [
    new URL(`../dist/${relativePath}`, import.meta.url),
    new URL(`../../dist/${relativePath}`, import.meta.url),
  ]
  for (const url of candidateUrls) {
    const path = fileURLToPath(url)
    if (existsSync(path)) {
      return readFileSync(path, 'utf-8')
    }
  }
  throw new Error(
    `Could not locate dist asset '${relativePath}'; tried: ${candidateUrls.map(String).join(', ')}`,
  )
}

export function readRenderViewClientBundle(): string {
  return readDistAsset('app/render-view-client.js')
}

export function readRenderViewClientStyles(): string {
  return readDistAsset('app/render-view-client.css')
}
