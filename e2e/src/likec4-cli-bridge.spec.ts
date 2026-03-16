import { mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'vitest'
import { $ } from 'zx'

const outDir = 'test-results/bridge'
const sourceDir = 'src/likec4'
const projectRoot = resolve(process.cwd(), sourceDir)
const outDirAbs = resolve(process.cwd(), outDir)
const projectId = 'e2e'

test(
  'LikeC4 CLI - gen leanix-dry-run produces manifest, leanix-dry-run, report',
  { timeout: 30000 },
  async ({ expect }) => {
    rmSync(outDirAbs, { recursive: true, force: true })
    mkdirSync(outDirAbs, { recursive: true })
    await $({ cwd: projectRoot })`likec4 gen leanix-dry-run . -o ${outDirAbs} --project ${projectId}`.quiet()

    const entries = readdirSync(outDirAbs, { withFileTypes: true }).map(e => e.name).sort()
    expect(entries).toContain('manifest.json')
    expect(entries).toContain('leanix-dry-run.json')
    expect(entries).toContain('report.json')

    const manifest = JSON.parse(readFileSync(join(outDirAbs, 'manifest.json'), 'utf8'))
    expect(manifest).toHaveProperty('manifestVersion')
    expect(manifest).toHaveProperty('projectId')
    expect(manifest).toHaveProperty('entities')
    expect(manifest).toHaveProperty('relations')

    const dryRun = JSON.parse(readFileSync(join(outDirAbs, 'leanix-dry-run.json'), 'utf8'))
    expect(dryRun).toHaveProperty('factSheets')
    expect(dryRun).toHaveProperty('relations')
    expect(dryRun).toHaveProperty('mappingProfile')
    expect(Array.isArray(dryRun.factSheets)).toBe(true)
    expect(Array.isArray(dryRun.relations)).toBe(true)

    const report = JSON.parse(readFileSync(join(outDirAbs, 'report.json'), 'utf8'))
    expect(report).toHaveProperty('counts')
    expect(report.counts).toHaveProperty('factSheets')
    expect(report.counts).toHaveProperty('leanixRelations')
  },
)

test(
  'LikeC4 CLI - sync leanix --dry-run produces same artifacts and does not require token',
  { timeout: 30000 },
  async ({ expect }) => {
    rmSync(outDirAbs, { recursive: true, force: true })
    mkdirSync(outDirAbs, { recursive: true })
    await $({ cwd: projectRoot })`likec4 sync leanix . --dry-run -o ${outDirAbs} --project ${projectId}`.quiet()

    const entries = readdirSync(outDirAbs, { withFileTypes: true }).map(e => e.name).sort()
    expect(entries).toContain('manifest.json')
    expect(entries).toContain('leanix-dry-run.json')
    expect(entries).toContain('report.json')

    const manifest = JSON.parse(readFileSync(join(outDirAbs, 'manifest.json'), 'utf8'))
    expect(manifest.projectId).toBeDefined()
    const dryRun = JSON.parse(readFileSync(join(outDirAbs, 'leanix-dry-run.json'), 'utf8'))
    expect(dryRun.factSheets).toBeDefined()
  },
)
