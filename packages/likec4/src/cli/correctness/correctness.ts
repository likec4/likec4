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

// Modify findDisconnectedElements to get location from model
function findDisconnectedElements(model: any, logger: any): any[] {
  const disconnected: any[] = []
  
  try {
    const elements = [...model.elements()]
    
    for (const element of elements) {
      if (!isElementConnected(element, model) && 
          element.kind !== 'user' && 
          element.kind !== 'external') {
        
        // Get element definition from model
        const elementDef = model.getElementDefinition?.(element.id)
        
        // Get the AST node that defines this element
        const node = elementDef?.node
        
        // Try to get location from the AST node first
        const nodeLocation = node?.location?.position?.start
        
        logger.info('Element location debug:', {
          id: element.id,
          nodeLocation,
          defLocation: elementDef?.location,
          elementLocation: element.location
        })

        // Preserve original element and add enhanced location info
        disconnected.push({
          ...element,
          definition: elementDef,
          node,
          location: {
            source: nodeLocation?.source || elementDef?.source || element.source,
            start: { 
              line: nodeLocation?.line || elementDef?.line || element.line || 1
            },
            file: nodeLocation?.file || elementDef?.file || element.file,
            section: node?.parent?.name || elementDef?.parent?.name || element.section
          }
        })
      }
    }

    return disconnected
  } catch (error) {
    logger.error('Error in findDisconnectedElements:', error)
    return []
  }
}

function isElementConnected(element: any, model: any): boolean {
  const relationships = [...model.relationships()]
  return relationships.some(rel => 
    rel.source?.id === element.id || rel.target?.id === element.id
  )
}

// Update formatLocation to use the enhanced location info
function formatLocation(element: any, logger: any): string {
  // Try to get location from various sources in order of preference
  const nodeLocation = element.node?.location?.position?.start
  const defLocation = element.definition?.location
  const elementLocation = element.location

  const file = nodeLocation?.file || defLocation?.file || elementLocation?.file || element.source
  const line = nodeLocation?.line || defLocation?.line || elementLocation?.start?.line || 1
  const section = element.node?.parent?.name || element.definition?.parent?.name || element.section

  logger.info('Location resolution:', {
    id: element.id,
    nodeLocation,
    defLocation,
    elementLocation,
    resolved: { file, line, section }
  })

  return [
    `file: ${file || 'unknown'}`,
    `line: ${line}`,  // Always show a line number, default to 1
    `section: ${section || 'unknown'}`,
    `id: ${element.id}`
  ].join(', ')
}

async function runCorrectnessChecks(languageServices: LikeC4, logger: any): Promise<CorrectnessIssue[]> {
  const issues: CorrectnessIssue[] = []

  try {
    const computedModel = languageServices.computedModel()
    
    // Changed debug to info since debug isn't available
    logger.info('Analyzing model structure:', {
      elementsCount: computedModel.elements().length,
    })

    // Check for disconnected components
    const disconnectedElements = findDisconnectedElements(computedModel, logger) // Pass logger to this function
    
    for (const element of disconnectedElements) {
      issues.push({
        type: 'error',
        category: 'Connectivity',
        message: `Element '${element.title || element.id}' is not connected to any other elements`,
        location: formatLocation(element, logger), // Pass logger here
        suggestions: [
          `Add connections to/from '${element.id}'`,
          'Consider if this element should be removed or connected',
          'Check if this element serves a purpose in the architecture'
        ]
      })
    }

  } catch (error) {
    logger.error(`Error during correctness check: ${error}`)
    issues.push({
      type: 'error',
      category: 'Internal',








}  return issues  }    })      suggestions: []      location: '',      message: `Unexpected error: ${error.message}`,      message: `Failed to run correctness checks: ${error}`,
      location: 'unknown'
    })
  }

  return issues
}