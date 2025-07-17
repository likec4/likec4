import { type ValidationCheck, AstUtils } from 'langium'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'
import { projectIdFrom } from '../../utils'
import { tryOrLog } from '../_shared'

const { getDocument } = AstUtils

const REQUIRED_PERF_PROPERTIES = [
  'perf-serviceTime',
  'perf-replication',
  'perf-maxUtilizationRate',
] as const

type RequiredPerfProperty = typeof REQUIRED_PERF_PROPERTIES[number]

function hasAnalyzeMaxThroughputTag(services: LikeC4Services, element: ast.Element): boolean {
  const index = services.shared.workspace.IndexManager
  const projectId = projectIdFrom(element)

  // Check if analyze-max-throughput tag exists in the project
  const analyzeMaxThroughputTag = index
    .projectElements(projectId, ast.Tag)
    .filter(n => n.name === 'analyze-max-throughput')
    .head()

  return !!analyzeMaxThroughputTag
}

function getElementMetadata(element: ast.Element): { [key: string]: string } | undefined {
  // Find metadata property in element body props
  const metadataProperty = element.body?.props?.find(ast.isMetadataProperty)
  if (!metadataProperty || !metadataProperty.props) {
    return undefined
  }

  // Convert metadata properties to object
  const metadata: { [key: string]: string } = {}
  for (const prop of metadataProperty.props) {
    if (prop.key && prop.value) {
      metadata[prop.key] = prop.value
    }
  }

  return Object.keys(metadata).length > 0 ? metadata : undefined
}

export const checkElementPerformanceMetadata = (services: LikeC4Services): ValidationCheck<ast.Element> => {
  return tryOrLog((el, accept) => {
    // Only check if analyze-max-throughput tag exists
    if (!hasAnalyzeMaxThroughputTag(services, el)) {
      return
    }

    // Skip person and external elements as they typically don't need performance metadata
    const kindName = el.kind?.ref?.name
    if (kindName === 'person' || kindName === 'external') {
      return
    }

    const metadata = getElementMetadata(el)

    if (!metadata) {
      // Element has no metadata block at all
      accept(
        'warning',
        `Element '${el.name}' has no metadata block. Required performance properties: ${
          REQUIRED_PERF_PROPERTIES.join(', ')
        }`,
        {
          node: el,
          property: 'name',
          code: 'missing-perf-metadata',
        },
      )
      return
    }

    // Check for missing required properties
    const missingProperties = REQUIRED_PERF_PROPERTIES.filter(prop => !(prop in metadata))
    if (missingProperties.length > 0) {
      const missingProps = missingProperties.join(', ')
      accept('warning', `Element '${el.name}' is missing required performance properties: ${missingProps}`, {
        node: el,
        property: 'name',
        code: 'missing-perf-properties',
      })
    }
  })
}
