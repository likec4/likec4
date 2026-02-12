import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'vitest'
import { $ } from 'zx'

$.nothrow = false

const outDir = 'test-results/drawio-export'

test.concurrent(
  'LikeC4 CLI - export drawio produces .drawio file with mxfile',
  { timeout: 30000 },
  async ({ expect }) => {
    await $`likec4 export drawio src/likec4 -o ${outDir}`.quiet()
    const files = readdirSync(outDir, { withFileTypes: true })
    const drawioFiles = files.filter(f => f.isFile() && f.name.endsWith('.drawio'))
    expect(drawioFiles.length).toBeGreaterThan(0)
    const first = readFileSync(join(outDir, drawioFiles[0]!.name), 'utf8')
    expect(first).toContain('<mxfile')
    expect(first.length).toBeGreaterThan(200)
  },
)
