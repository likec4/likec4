import { exit } from 'node:process'
import k from 'tinyrainbow'
import { LikeC4 } from '../../LikeC4'
import { createLikeC4Logger } from '../../logger'
import { type CorrectnessIssue, runCorrectnessChecks } from '../correctness/correctness'
import { analyzeCapacity } from './capacity'

type HandlerParams = {
  path: string
  format: string
  detailed: boolean
}

type CapacityResult = {
  elementId: string
  elementName: string
  elementKind: string
  serviceTimeMs: number
  serviceTimeSeconds: number
  replication: number
  maxUtilizationRate: number
  maxArrivalRate: number
  location: string
}

export async function handler({ path, format, detailed }: HandlerParams): Promise<number> {
  const languageServices = await LikeC4.fromWorkspace(path, {
    logger: 'vite',
  })

  const logger = createLikeC4Logger('c4:analyze')

  logger.info(k.cyan('Running capacity planning analysis...'))

  try {
    // First run correctness checks to ensure model is valid
    logger.info(k.gray('Running correctness checks first...'))
    const correctnessIssues = await runCorrectnessChecks(languageServices, logger)

    // Check for errors (not just warnings)
    const errors = correctnessIssues.filter(issue => issue.type === 'error')
    if (errors.length > 0) {
      logger.error('Correctness check failed. Please fix the following errors before running capacity analysis:')
      for (const error of errors) {
        logger.error(`  ${error.message} at ${error.location}`)
      }
      return 1
    }

    // Check for warnings and inform user
    const warnings = correctnessIssues.filter(issue => issue.type === 'warning')
    if (warnings.length > 0) {
      logger.warn('Correctness check completed with warnings:')
      for (const warning of warnings) {
        logger.warn(`  ${warning.message} at ${warning.location}`)
      }
      logger.warn('Capacity analysis may be incomplete due to missing metadata.')
      logger.info('') // Empty line for spacing
    }

    // Proceed with capacity analysis
    const results = await runCapacityAnalysis(languageServices, logger)

    if (results.length === 0) {
      logger.info(k.yellow('No components with complete performance metadata found for analysis'))
      logger.info(k.gray('Add perf-serviceTime, perf-replication, and perf-maxUtilizationRate metadata to components'))
      return 0
    }

    // Output results in requested format
    outputResults(results, format, detailed, logger)

    logger.info(k.green('Capacity analysis completed successfully!'))
    return 0
  } catch (error) {
    logger.error(`Error during capacity analysis: ${error}`)
    return 1
  }
}

async function runCapacityAnalysis(languageServices: LikeC4, logger: any): Promise<CapacityResult[]> {
  const results: CapacityResult[] = []

  try {
    const computedModel = languageServices.computedModel()
    const elements = [...computedModel.elements()]

    logger.info(k.gray(`Analyzing ${elements.length} elements for capacity planning...`))

    for (const element of elements) {
      // Skip person and external elements as they typically don't need performance metadata
      if (element.kind === 'person' || element.kind === 'external') {
        continue
      }

      const capacityResult = analyzeCapacity(element, languageServices)
      if (capacityResult) {
        results.push(capacityResult)
      }
    }

    return results
  } catch (error) {
    logger.error(`Error analyzing capacity: ${error}`)
    return []
  }
}

function outputResults(results: CapacityResult[], format: string, detailed: boolean, logger: any): void {
  switch (format) {
    case 'csv':
      outputCsv(results, logger)
      break
    case 'table':
    default:
      outputTable(results, detailed, logger)
      break
  }
}

function outputTable(results: CapacityResult[], detailed: boolean, logger: any): void {
  logger.info('')

  if (detailed) {
    // Detailed table with calculation breakdown
    logger.info(k.bold('Component Capacity Analysis (Detailed)'))
    logger.info('')

    for (const result of results) {
      logger.info(k.cyan(`Component: ${result.elementName} (${result.elementId})`))
      logger.info(k.gray(`  Kind: ${result.elementKind}`))
      logger.info(k.gray(`  Location: ${result.location}`))
      logger.info('')
      logger.info(k.yellow('  Performance Parameters:'))
      logger.info(`    Service Time: ${result.serviceTimeMs}ms (${result.serviceTimeSeconds.toFixed(3)}s)`)
      logger.info(`    Replication: ${result.replication}`)
      logger.info(`    Max Utilization Rate: ${result.maxUtilizationRate}`)
      logger.info('')
      logger.info(k.green('  Capacity Calculation:'))
      logger.info(`    λ_max = (m × ρ*) / S`)
      logger.info(
        `    λ_max = (${result.replication} × ${result.maxUtilizationRate}) / ${result.serviceTimeSeconds.toFixed(3)}`,
      )
      logger.info(
        `    λ_max = ${((result.replication * result.maxUtilizationRate) / result.serviceTimeSeconds).toFixed(3)} / ${
          result.serviceTimeSeconds.toFixed(3)
        }`,
      )
      logger.info(`    λ_max = ${result.maxArrivalRate.toFixed(3)} requests/second`)
      logger.info('')
      logger.info(k.bold(`  Maximum Sustainable Arrival Rate: ${result.maxArrivalRate.toFixed(3)} req/s`))
      logger.info('')
      logger.info('─'.repeat(80))
      logger.info('')
    }
    return
  }

  // Table output with column alignment
  logger.info(k.bold('Component Capacity Summary'))
  logger.info('')

  // Table data
  const header = [
    'Component',
    'Kind',
    'Service Time (ms)',
    'Replication',
    'Max Util Rate',
    'Max Arrival Rate (req/s)',
  ]
  const rows = results.map(result => [
    result.elementName,
    result.elementKind,
    result.serviceTimeMs.toString(),
    result.replication.toString(),
    result.maxUtilizationRate.toString(),
    result.maxArrivalRate.toFixed(3),
  ])
  const table = [header, ...rows]

  // Calculate max width for each column
  const colWidths = header.map((_, colIdx) => Math.max(...table.map(row => row[colIdx].length)))

  // Helper to pad a cell
  const pad = (str: string, len: number) => str + ' '.repeat(len - str.length)

  // Print header
  logger.info(k.bold(
    header.map((cell, i) => pad(cell, colWidths[i])).join(' | '),
  ))
  // Print separator
  logger.info(
    colWidths.map(w => '─'.repeat(w)).join('-+-'),
  )
  // Print rows
  for (const row of rows) {
    logger.info(
      row.map((cell, i) => pad(cell, colWidths[i])).join(' | '),
    )
  }

  logger.info('')
  logger.info(k.gray('Formula: λ_max = (m × ρ*) / S'))
  logger.info(k.gray('Where: m=replication, ρ*=maxUtilizationRate, S=serviceTime(seconds)'))
}

function outputCsv(results: CapacityResult[], logger: any): void {
  // CSV header
  console.log(
    'Element ID,Element Name,Element Kind,Service Time (ms),Service Time (s),Replication,Max Utilization Rate,Max Arrival Rate (req/s),Location',
  )

  // CSV rows
  for (const result of results) {
    const row = [
      result.elementId,
      result.elementName,
      result.elementKind,
      result.serviceTimeMs,
      result.serviceTimeSeconds.toFixed(3),
      result.replication,
      result.maxUtilizationRate,
      result.maxArrivalRate.toFixed(3),
      result.location,
    ].map(field => `"${field}"`).join(',')

    console.log(row)
  }
}
