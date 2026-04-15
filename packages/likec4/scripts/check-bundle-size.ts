/**
 * Bundle size budget check.
 * Builds the cloud-system example and asserts JS chunk sizes stay under budget.
 * Run: tsx scripts/check-bundle-size.ts
 *
 * Prevents regressions like https://github.com/likec4/likec4/issues/2689
 * where a single JS file grew from 709 KB to 6.2 MB.
 */
import { execSync } from 'node:child_process'
import { mkdtemp, readdir, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const BUDGETS: Record<string, number> = {
  // Per-chunk budgets in KB (uncompressed)
  'likec4': 1400,
  'vendors': 1300,
  'drawio': 150,
  // Total JS budget
  '_total': 3200,
}

async function main() {
  const outDir = await mkdtemp(join(tmpdir(), 'likec4-bundle-check-'))
  const exampleDir = resolve(import.meta.dirname, '../../../examples/cloud-system')

  console.log(`Building ${exampleDir} → ${outDir}`)

  try {
    execSync(
      `node ${resolve(import.meta.dirname, '../bin/likec4.mjs')} build ${exampleDir} --output ${outDir}`,
      { stdio: 'pipe', timeout: 120_000 },
    )
  } catch (e: unknown) {
    const stderr = e != null && typeof e === 'object' && 'stderr' in e
      ? (e as { stderr?: Buffer }).stderr
      : undefined
    console.error('Build failed:', stderr?.toString().slice(-500) ?? (e instanceof Error ? e.message : String(e)))
    process.exit(1)
  }

  const assetsDir = join(outDir, 'assets')
  try {
    await stat(assetsDir)
  } catch {
    console.error(`Assets directory not found: ${assetsDir}`)
    process.exit(1)
  }
  const files = await readdir(assetsDir)
  const jsFiles = files.filter(f => f.endsWith('.js'))

  let totalKB = 0
  const chunks: Array<{ name: string; file: string; sizeKB: number }> = []

  for (const file of jsFiles) {
    const { size } = await stat(join(assetsDir, file))
    const sizeKB = Math.round(size / 1024)
    totalKB += sizeKB

    // Extract chunk name from filename (e.g., "likec4-DhdE54_o.js" → "likec4")
    const name = file.replace(/-[A-Za-z0-9_-]+\.js$/, '')
    chunks.push({ name, file, sizeKB })
  }

  console.log('\nBundle size report:')
  console.log('─'.repeat(50))
  for (const { name, file, sizeKB } of chunks.sort((a, b) => b.sizeKB - a.sizeKB)) {
    const budget = BUDGETS[name]
    const status = budget ? (sizeKB <= budget ? '✅' : '❌') : '  '
    const budgetStr = budget ? ` (budget: ${budget} KB)` : ''
    console.log(`${status} ${file}: ${sizeKB} KB${budgetStr}`)
  }
  console.log('─'.repeat(50))

  const totalBudget = BUDGETS['_total']
  const totalStatus = totalKB <= totalBudget ? '✅' : '❌'
  console.log(`${totalStatus} Total JS: ${totalKB} KB (budget: ${totalBudget} KB)`)

  // Check budgets
  let failed = false
  for (const { name, file, sizeKB } of chunks) {
    const budget = BUDGETS[name]
    if (budget && sizeKB > budget) {
      console.error(`\n❌ OVER BUDGET: ${file} is ${sizeKB} KB, budget is ${budget} KB`)
      failed = true
    }
  }
  if (totalKB > totalBudget) {
    console.error(`\n❌ OVER BUDGET: Total JS is ${totalKB} KB, budget is ${totalBudget} KB`)
    failed = true
  }

  await rm(outDir, { recursive: true, force: true })

  if (failed) {
    console.error('\nBundle size check FAILED. Update budgets in scripts/check-bundle-size.ts if intentional.')
    process.exit(1)
  }
  console.log('\n✅ All chunks within budget.')
}

main()
