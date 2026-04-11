import { performance } from 'node:perf_hooks'
import process from 'node:process'
import { LikeC4 } from '../src/LikeC4'

type Scenario = 'init' | 'computed'

type Args = {
  workspace: string
  iterations: number
  warmup: number
  project?: string
  scenarios: Scenario[]
  json: boolean
}

type Sample = {
  ms: number
  rssDelta: number
  heapUsedDelta: number
}

type Stats = {
  iterations: number
  warmup: number
  meanMs: number
  medianMs: number
  minMs: number
  maxMs: number
  meanRssDeltaMb: number
  meanHeapUsedDeltaMb: number
  samplesMs: number[]
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    workspace: '',
    iterations: 5,
    warmup: 1,
    scenarios: ['init', 'computed'],
    json: false,
  }
  for (const arg of argv) {
    if (arg.startsWith('--iterations=')) {
      args.iterations = Number(arg.slice('--iterations='.length))
      continue
    }
    if (arg.startsWith('--warmup=')) {
      args.warmup = Number(arg.slice('--warmup='.length))
      continue
    }
    if (arg.startsWith('--project=')) {
      args.project = arg.slice('--project='.length)
      continue
    }
    if (arg.startsWith('--scenarios=')) {
      args.scenarios = arg.slice('--scenarios='.length).split(',').filter(Boolean) as Scenario[]
      continue
    }
    if (arg === '--json') {
      args.json = true
      continue
    }
    if (!arg.startsWith('--') && !args.workspace) {
      args.workspace = arg
    }
  }
  if (!args.workspace) {
    throw new Error(
      'Usage: benchmark-workspace.ts <workspace> [--iterations=N] [--warmup=N] [--project=id] [--scenarios=init,computed] [--json]',
    )
  }
  if (args.iterations < 1) {
    throw new Error('--iterations must be >= 1')
  }
  if (args.warmup < 0) {
    throw new Error('--warmup must be >= 0')
  }
  return args
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function mb(bytes: number): number {
  return bytes / (1024 * 1024)
}

function summarize(samples: Sample[], args: Args): Stats {
  const times = samples.map(s => s.ms)
  const sortedTimes = [...times].sort((a, b) => a - b)
  const mid = Math.floor(sortedTimes.length / 2)
  const median = sortedTimes.length % 2 === 0
    ? (sortedTimes[mid - 1]! + sortedTimes[mid]!) / 2
    : sortedTimes[mid]!
  return {
    iterations: args.iterations,
    warmup: args.warmup,
    meanMs: round(times.reduce((acc, value) => acc + value, 0) / times.length),
    medianMs: round(median),
    minMs: round(Math.min(...times)),
    maxMs: round(Math.max(...times)),
    meanRssDeltaMb: round(samples.reduce((acc, value) => acc + mb(value.rssDelta), 0) / samples.length),
    meanHeapUsedDeltaMb: round(samples.reduce((acc, value) => acc + mb(value.heapUsedDelta), 0) / samples.length),
    samplesMs: times.map(round),
  }
}

async function runScenario(name: Scenario, args: Args): Promise<Stats> {
  const samples: Sample[] = []
  const totalRuns = args.iterations + args.warmup

  if (name === 'init') {
    for (let run = 0; run < totalRuns; run++) {
      globalThis.gc?.()
      const before = process.memoryUsage()
      const started = performance.now()
      const likec4 = await LikeC4.fromWorkspace(args.workspace, {
        logger: false,
        printErrors: false,
        throwIfInvalid: true,
      })
      const finished = performance.now()
      const after = process.memoryUsage()
      await likec4.dispose()
      if (run >= args.warmup) {
        samples.push({
          ms: finished - started,
          rssDelta: after.rss - before.rss,
          heapUsedDelta: after.heapUsed - before.heapUsed,
        })
      }
    }
    return summarize(samples, args)
  }

  const likec4 = await LikeC4.fromWorkspace(args.workspace, {
    logger: false,
    printErrors: false,
    throwIfInvalid: true,
  })
  try {
    const projectId = args.project ?? likec4.projects()[0]
    if (!projectId) {
      throw new Error(`No projects found in workspace ${args.workspace}`)
    }
    for (let run = 0; run < totalRuns; run++) {
      likec4.modelBuilder.clearCache()
      globalThis.gc?.()
      const before = process.memoryUsage()
      const started = performance.now()
      const model = await likec4.computedModel(projectId)
      const finished = performance.now()
      const after = process.memoryUsage()
      if ([...model.views()].length === 0) {
        throw new Error(`No views found in project ${projectId}`)
      }
      if (run >= args.warmup) {
        samples.push({
          ms: finished - started,
          rssDelta: after.rss - before.rss,
          heapUsedDelta: after.heapUsed - before.heapUsed,
        })
      }
    }
    return summarize(samples, args)
  } finally {
    await likec4.dispose()
  }
}

async function inspectWorkspace(args: Args) {
  const likec4 = await LikeC4.fromWorkspace(args.workspace, {
    logger: false,
    printErrors: false,
    throwIfInvalid: true,
  })
  try {
    const projectId = args.project ?? likec4.projects()[0]
    if (!projectId) {
      throw new Error(`No projects found in workspace ${args.workspace}`)
    }
    const model = await likec4.computedModel(projectId)
    return {
      workspace: args.workspace,
      projectId,
      documents: likec4.documentCount(),
      projects: likec4.projects(),
      views: [...model.views()].length,
      elements: [...model.elements()].length,
      relations: [...model.relationships()].length,
    }
  } finally {
    await likec4.dispose()
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const inspection = await inspectWorkspace(args)
  const results = {} as Record<Scenario, Stats>
  for (const scenario of args.scenarios) {
    results[scenario] = await runScenario(scenario, args)
  }
  if (args.json) {
    console.log(JSON.stringify({ inspection, results }, null, 2))
    return
  }
  console.log(`Workspace: ${inspection.workspace}`)
  console.log(`Project:   ${inspection.projectId}`)
  console.log(`Docs:      ${inspection.documents}`)
  console.log(`Views:     ${inspection.views}`)
  console.log(`Elements:  ${inspection.elements}`)
  console.log(`Relations: ${inspection.relations}`)
  for (const scenario of args.scenarios) {
    const stats = results[scenario]
    console.log('')
    console.log(
      `[${scenario}] mean=${stats.meanMs}ms median=${stats.medianMs}ms min=${stats.minMs}ms max=${stats.maxMs}ms`,
    )
    console.log(`[${scenario}] mean rss delta=${stats.meanRssDeltaMb}MB mean heap delta=${stats.meanHeapUsedDeltaMb}MB`)
    console.log(`[${scenario}] samples=${stats.samplesMs.join(', ')}`)
  }
}

await main()
