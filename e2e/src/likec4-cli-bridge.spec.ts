import { mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type { Expect } from 'vitest'
import { test } from 'vitest'
import { $ } from 'zx'

const outDir = 'test-results/bridge'
const sourceDir = 'src/likec4'
const projectRoot = resolve(process.cwd(), sourceDir)
const outDirAbs = resolve(process.cwd(), outDir)
const projectId = 'e2e'

/** Ensures the output directory exists and is empty (removes existing contents). */
function createCleanOutDir(dirAbs: string): void {
  rmSync(dirAbs, { recursive: true, force: true })
  mkdirSync(dirAbs, { recursive: true })
}

/** Asserts that bridge artifacts (manifest.json, leanix-dry-run.json, report.json) exist and have expected shape. */
function assertE2EArtifacts(dirAbs: string, expect: Expect): void {
  const entries = readdirSync(dirAbs, { withFileTypes: true }).map(e => e.name).sort()
  expect(entries).toContain('manifest.json')
  expect(entries).toContain('leanix-dry-run.json')
  expect(entries).toContain('report.json')
  const manifest = JSON.parse(readFileSync(join(dirAbs, 'manifest.json'), 'utf8'))
  expect(manifest).toHaveProperty('manifestVersion')
  expect(manifest).toHaveProperty('projectId')
  expect(manifest).toHaveProperty('entities')
  expect(manifest).toHaveProperty('relations')
  const dryRun = JSON.parse(readFileSync(join(dirAbs, 'leanix-dry-run.json'), 'utf8'))
  expect(dryRun).toHaveProperty('factSheets')
  expect(dryRun).toHaveProperty('relations')
  expect(dryRun).toHaveProperty('mappingProfile')
  expect(Array.isArray(dryRun.factSheets)).toBe(true)
  expect(Array.isArray(dryRun.relations)).toBe(true)
  const report = JSON.parse(readFileSync(join(dirAbs, 'report.json'), 'utf8'))
  expect(report).toHaveProperty('counts')
  expect(report.counts).toHaveProperty('factSheets')
  expect(report.counts).toHaveProperty('leanixRelations')
}

test(
  'LikeC4 CLI - gen leanix-dry-run produces manifest, leanix-dry-run, report',
  { timeout: 30000 },
  async ({ expect }) => {
    createCleanOutDir(outDirAbs)
    await $({ cwd: projectRoot })`likec4 gen leanix-dry-run . -o ${outDirAbs} --project ${projectId}`.quiet()
    assertE2EArtifacts(outDirAbs, expect)
  },
)

test(
  'LikeC4 CLI - sync leanix --dry-run produces same artifacts and does not require token',
  { timeout: 30000 },
  async ({ expect }) => {
    createCleanOutDir(outDirAbs)
    await $({ cwd: projectRoot })`likec4 sync leanix . --dry-run -o ${outDirAbs} --project ${projectId}`.quiet()
    assertE2EArtifacts(outDirAbs, expect)
  },
)
