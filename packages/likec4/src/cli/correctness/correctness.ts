import { exit } from 'node:process'
import k from 'tinyrainbow'
import { LikeC4 } from '../../LikeC4'
import { createLikeC4Logger } from '../../logger'

type HandlerParams = {
  path: string
  strict: boolean
}

type CorrectnessIssue = {
  type: 'error' | 'warning'
  category: string
  message: string
  location: string
  suggestions?: string[]
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

  // Group issues by type
  const errors = issues.filter(issue => issue.type === 'error')
  const warnings = issues.filter(issue => issue.type === 'warning')

  // Report issues
  for (const issue of issues) {
    const color = issue.type === 'error' ? k.red : k.yellow
    const icon = issue.type === 'error' ? 'ERROR' : 'WARNING'

    logger.info(color(`${icon} [${issue.category}] ${issue.message}`))
    logger.info(k.gray(`   at ${issue.location}`))

    if (issue.suggestions && issue.suggestions.length > 0) {
      logger.info(k.blue('   Suggestions:'))
      for (const suggestion of issue.suggestions) {
        logger.info(k.blue(`      • ${suggestion}`))
      }
    }
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

  // Exit code logic
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

function findDisconnectedElements(model: any): any[] {
  const disconnected: any[] = []

  try {
    const elements = [...model.elements()]

    for (const element of elements) {
      // Skip user and external elements as they are often meant to be boundary elements
      if (element.kind === 'user' || element.kind === 'external') {
        continue
      }

      if (!isElementConnected(element, model)) {
        disconnected.push(element)
      }
    }

    return disconnected
  } catch (error) {
    console.error('Error in findDisconnectedElements:', error)
    return []
  }
}

function isElementConnected(element: any, model: any): boolean {
  const relationships = [...model.relationships()]
  return relationships.some(rel => rel.source?.id === element.id || rel.target?.id === element.id)
}

function formatLocation(element: any): string {
  // Try to get location information from the element
  const file = element.astPath?.document?.uri?.toString() || element.source || 'unknown'
  const line = element.astPath?.range?.start?.line || 1

  return [
    `file: ${file}`,
    `line: ${line}`,
    `id: ${element.id}`,
  ].join(', ')
}

async function runCorrectnessChecks(languageServices: LikeC4, logger: any): Promise<CorrectnessIssue[]> {
  const issues: CorrectnessIssue[] = []

  try {
    const computedModel = languageServices.computedModel()
    const elementsArray = [...computedModel.elements()]

    logger.info('Analyzing model structure:', {
      elementsCount: elementsArray.length,
    })

    // Check for disconnected components - using the same logic as language server validation
    const disconnectedElements = findDisconnectedElements(computedModel)

    for (const element of disconnectedElements) {
      issues.push({
        type: 'warning', // Same as language server validation
        category: 'Connectivity',
        message: `Element '${element.id}' is not connected to any other elements`,
        location: formatLocation(element),
        suggestions: [
          `Add connections to/from '${element.id}'`,
          'Consider if this element should be removed or connected',
          'Check if this element serves a purpose in the architecture',
        ],
      })
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
