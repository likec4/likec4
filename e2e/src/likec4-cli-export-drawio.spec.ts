import { mkdirSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'vitest'
import { $ } from 'zx'

$.nothrow = false

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const outDir = join(__dirname, '../test-results/drawio-export')
const sourceDir = join(__dirname, 'likec4')
const emptyWorkspaceDir = join(__dirname, '../test-results/empty-workspace')
/** Project id from e2e/src/likec4/likec4.config.ts (name: 'e2e') so export targets the correct project when workspace has multiple. */
const projectId = 'e2e'

function isDrawioFile(entry: { isFile: () => boolean; name: string }): boolean {
  return entry.isFile() && entry.name.endsWith('.drawio')
}

test.concurrent(
  'LikeC4 CLI - export drawio produces .drawio file with mxfile',
  { timeout: 30000 },
  async ({ expect }) => {
    mkdirSync(outDir, { recursive: true })
    await $`likec4 export drawio ${sourceDir} -o ${outDir} --project ${projectId}`.quiet()
    const entries = readdirSync(outDir, { withFileTypes: true })
    const drawioFiles = entries.filter(isDrawioFile).sort((a, b) => a.name.localeCompare(b.name))
    expect(drawioFiles.length).toBeGreaterThan(0)
    const firstDrawioContent = readFileSync(join(outDir, drawioFiles[0]!.name), 'utf8')
    expect(firstDrawioContent).toContain('<mxfile')
    expect(firstDrawioContent.length).toBeGreaterThan(200)
  },
)

test.concurrent(
  'LikeC4 CLI - export drawio with empty workspace exits with code 1',
  { timeout: 15000 },
  async ({ expect }) => {
    mkdirSync(emptyWorkspaceDir, { recursive: true })
    const failOutDir = join(__dirname, '../test-results/drawio-fail')
    await expect(
      $`likec4 export drawio ${emptyWorkspaceDir} -o ${failOutDir}`,
    ).rejects.toThrow()
  },
)
