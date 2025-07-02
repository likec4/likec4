import { exit } from 'node:process'
import k from 'tinyrainbow'
import { LikeC4 } from '../../LikeC4'
import { createLikeC4Logger } from '../../logger'
import { checkCycle } from './cycle'
import { checkMislayering } from './mislayering'
import { checkOrphan } from './orphan'

type HandlerParams = {
  path: string
  strict: boolean
}

type CorrectnessIssue = {
  type: 'error' | 'warning'
  category: string
  message: string
  location: string
}

// Configuration for conditional checks based on tags
type ConditionalCheck = {
  tagName: string
  checkFn: (computedModel: any, languageServices: LikeC4) => CorrectnessIssue[]
  checkName: string
}

export async function handler({ path, strict }: HandlerParams): Promise<number> {
  const languageServices = await LikeC4.fromWorkspace(path, {
    logger: 'vite',
  })

  const logger = createLikeC4Logger('c4:correctness')

  logger.info(k.cyan('Running correctness checks...'))

  // Run correctness checks
  const issues = await runCorrectnessChecks(languageServices, logger)

  if (issues.length === 0) {
    logger.info(k.green('All correctness checks passed!'))
    return 0
  }

  // Report and summarize issues
  reportIssues(issues, logger)

  // Handle exit conditions
  return handleExitConditions(issues, strict, logger)
}

function reportIssues(issues: CorrectnessIssue[], logger: any): void {
  // Group issues by type
  const errors = issues.filter(issue => issue.type === 'error')
  const warnings = issues.filter(issue => issue.type === 'warning')

  // Report individual issues
  for (const issue of issues) {
    const color = issue.type === 'error' ? k.red : k.yellow
    const icon = issue.type === 'error' ? 'ERROR' : 'WARNING'

    logger.info(color(`${icon} [${issue.category}] ${issue.message}`))
    logger.info(k.gray(`   at ${issue.location}`))
    logger.info('') // Empty line for spacing
  }

  // Summary
  logger.info(k.cyan('Summary:'))
  if (errors.length > 0) {
    logger.info(k.red(`   ${errors.length} error(s)`))
  }
  if (warnings.length > 0) {
    logger.info(k.yellow(`   ${warnings.length} warning(s)`))
  }
}

function handleExitConditions(issues: CorrectnessIssue[], strict: boolean, logger: any): number {
  const errors = issues.filter(issue => issue.type === 'error')
  const warnings = issues.filter(issue => issue.type === 'warning')

  // Exit code logic - only internal errors cause exit code 1
  if (errors.length > 0) {
    logger.error('Correctness check failed due to errors')
    exit(1)
  }

  if (strict && warnings.length > 0) {
    logger.error('Correctness check failed due to warnings (strict mode)')
    exit(1)
  }

  if (warnings.length > 0) {
    logger.warn('Correctness check completed with warnings')
  }

  return 0
}

/**
 * Check if a specific tag exists in the specification
 */
function hasTag(computedModel: any, tagName: string): boolean {
  try {
    const specification = computedModel.specification
    return specification && specification.tags && Object.prototype.hasOwnProperty.call(specification.tags, tagName)
  } catch (error) {
    return false
  }
}

/**
 * Get a list of all defined tags for debugging
 */
function getDefinedTags(computedModel: any): string[] {
  try {
    const specification = computedModel.specification
    return specification?.tags ? Object.keys(specification.tags) : []
  } catch (error) {
    return []
  }
}

async function runCorrectnessChecks(languageServices: LikeC4, logger: any): Promise<CorrectnessIssue[]> {
  const issues: CorrectnessIssue[] = []

  try {
    const computedModel = languageServices.computedModel()

    // Log available tags for debugging
    const definedTags = getDefinedTags(computedModel)
    if (definedTags.length > 0) {
      logger.info(k.gray(`Tags defined in specification: ${definedTags.join(', ')}`))
    }

    // Define conditional checks - these only run if specific tags exist
    const conditionalChecks: ConditionalCheck[] = [
      {
        tagName: 'check-orphan',
        checkFn: checkOrphan,
        checkName: 'orphan elements',
      },
      {
        tagName: 'check-cycle',
        checkFn: checkCycle,
        checkName: 'cyclic dependencies',
      },
      {
        tagName: 'check-mislayering',
        checkFn: checkMislayering,
        checkName: 'mislayering',
      },
    ]

    // Run conditional checks based on tag presence
    for (const { tagName, checkFn, checkName } of conditionalChecks) {
      if (hasTag(computedModel, tagName)) {
        logger.info(k.gray(`Tag '${tagName}' found - running ${checkName} check...`))
        issues.push(...checkFn(computedModel, languageServices))
      } else {
        logger.info(k.gray(`Tag '${tagName}' not found - skipping ${checkName} check`))
      }
    }

    // Log summary of what checks would be available
    if (definedTags.length === 0) {
      logger.info(k.gray('No validation tags found in specification. Available tags:'))
      logger.info(k.gray('  - check-orphan: Check for orphaned elements'))
      logger.info(k.gray('  - check-cycle: Check for cyclic dependencies'))
      logger.info(k.gray('  - check-mislayering: Check for layer violations'))
    }
  } catch (error) {
    logger.error(`Error during correctness check: ${error}`)
    issues.push({
      type: 'error',
      category: 'Internal',
      message: `Internal error: ${error}`,
      location: 'unknown',
    })
  }

  return issues
}
