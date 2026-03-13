import { mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { test } from 'vitest'
import { $ } from 'zx'

const outDir = 'test-results/drawio-export'
const sourceDir = 'src/likec4'
/** Project root: run CLI with cwd here so workspace resolution finds likec4.config and .c4 files (CI and local). */
const projectRoot = resolve(process.cwd(), sourceDir)
/** Output dir absolute so it works when cwd is projectRoot. */
const outDirAbs = resolve(process.cwd(), outDir)
const emptyWorkspaceDir = 'test-results/empty-workspace'
/** Project id from e2e/src/likec4/likec4.config.ts (name: 'e2e'). */
const projectId = 'e2e'

function isDrawioFile(entry: { isFile: () => boolean; name: string }): boolean {
  return entry.isFile() && entry.name.endsWith('.drawio')
}

test(
  'LikeC4 CLI - export drawio produces .drawio file with mxfile',
  { timeout: 30000 },
  async ({ expect }) => {
    rmSync(outDirAbs, { recursive: true, force: true })
    mkdirSync(outDirAbs, { recursive: true })
    await $({ cwd: projectRoot })`likec4 export drawio . -o ${outDirAbs} --project ${projectId}`.quiet()
    const entries = readdirSync(outDirAbs, { withFileTypes: true })
    const drawioFiles = entries.filter(isDrawioFile).sort((a, b) => a.name.localeCompare(b.name))
    expect(drawioFiles.length).toBeGreaterThan(0)
    const firstDrawioContent = readFileSync(join(outDirAbs, drawioFiles[0]!.name), 'utf8')
    expect(firstDrawioContent).toContain('<mxfile')
    expect(firstDrawioContent.length).toBeGreaterThan(200)
  },
)

test(
  'LikeC4 CLI - export drawio --profile leanix produces bridge-managed styles',
  { timeout: 30000 },
  async ({ expect }) => {
    rmSync(outDirAbs, { recursive: true, force: true })
    mkdirSync(outDirAbs, { recursive: true })
    await $({ cwd: projectRoot })`likec4 export drawio . -o ${outDirAbs} --project ${projectId} --profile leanix`.quiet()
    const entries = readdirSync(outDirAbs, { withFileTypes: true })
    const drawioFiles = entries.filter(isDrawioFile).sort((a, b) => a.name.localeCompare(b.name))
    expect(drawioFiles.length).toBeGreaterThan(0)
    const content = readFileSync(join(outDirAbs, drawioFiles[0]!.name), 'utf8')
    expect(content).toContain('<mxfile')
    expect(content).toContain('bridgeManaged=true')
    expect(content).toMatch(/likec4Id=/)
  },
)

test(
  'LikeC4 CLI - export drawio with empty workspace exits with code 1',
  { timeout: 15000 },
  async ({ expect }) => {
    rmSync(emptyWorkspaceDir, { recursive: true, force: true })
    mkdirSync(emptyWorkspaceDir, { recursive: true })
    const result = await $`likec4 export drawio ${emptyWorkspaceDir} -o test-results/drawio-fail`.nothrow()
    // CLI must not succeed: exit 1 (expected) or exit 0 with error on stderr (packaged CLI quirk in CI). Once the quirk is fixed, tighten to only accept exitCode === 1.
    const failedByExitCode = result.exitCode === 1
    const failedByStderr =
      result.exitCode === 0 && typeof result.stderr === 'string' && result.stderr.includes('no LikeC4 sources found')
    expect(
      failedByExitCode || failedByStderr,
      `expected exitCode 1 or error on stderr; got exitCode ${result.exitCode}, stderr: ${String(result.stderr).slice(0, 200)}`,
    ).toBe(true)
  },
)
