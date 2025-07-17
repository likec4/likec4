import type { LikeC4 } from '../../LikeC4'

type CorrectnessIssue = {
  type: 'error' | 'warning'
  category: string
  message: string
  location: string
}

const REQUIRED_PERF_PROPERTIES = [
  'perf-serviceTime',
  'perf-replication',
  'perf-maxUtilizationRate',
] as const

type RequiredPerfProperty = typeof REQUIRED_PERF_PROPERTIES[number]

function findElementsWithoutPerfMetadata(model: any): any[] {
  const elementsWithoutMetadata: any[] = []

  try {
    const elements = [...model.elements()]

    for (const element of elements) {
      // Skip person and external elements as they typically don't need performance metadata
      if (element.kind === 'person' || element.kind === 'external') {
        continue
      }

      // Try the getMetadata() method first (ElementModel API)
      let metadata: any = null
      if (typeof element.getMetadata === 'function') {
        try {
          metadata = element.getMetadata()
        } catch (error) {
          // Silently fail and try fallback
        }
      }

      // Fallback to raw metadata property access
      if (!metadata) {
        metadata = element.metadata
      }

      // Check if element has any metadata at all
      const hasAnyMetadata = metadata && Object.keys(metadata).length > 0

      if (!hasAnyMetadata) {
        elementsWithoutMetadata.push({ element, missing: REQUIRED_PERF_PROPERTIES, hasMetadata: false })
        continue
      }

      // Check for missing required properties
      const missingProperties = REQUIRED_PERF_PROPERTIES.filter(prop => !(prop in metadata))
      if (missingProperties.length > 0) {
        elementsWithoutMetadata.push({ element, missing: missingProperties, hasMetadata: true })
      }
    }

    return elementsWithoutMetadata
  } catch (error) {
    console.error('Error in findElementsWithoutPerfMetadata:', error)
    return []
  }
}

function findElementInDocument(elementId: string, document: any): any {
  if (document.parseResult?.value?.$type !== 'LikeC4Grammar') {
    return null
  }

  const grammar = document.parseResult.value
  const models = grammar.models || []

  for (const model of models) {
    if (!model.elements) continue

    const elementInfo = searchElementInStatements(elementId, model.elements, document)
    if (elementInfo) {
      return elementInfo
    }
  }

  return null
}

function searchElementInStatements(elementId: string, statements: any[], document: any): any {
  const elementParts = elementId.split('.')
  const isNestedElement = elementParts.length > 1

  for (const statement of statements) {
    if (statement.$type !== 'Element') continue

    if (isNestedElement && elementParts[1]) {
      const topLevelElementName = elementParts[0]!
      const nestedElementName = elementParts[1]!
      const nestedInfo = findNestedElement(statement, topLevelElementName, nestedElementName, document)
      if (nestedInfo) return nestedInfo
    } else {
      if (statement.name === elementId) {
        return { element: elementId, document, statement }
      }
    }
  }

  return null
}

function findNestedElement(
  statement: any,
  topLevelName: string,
  nestedName: string,
  document: any,
): any {
  if (statement.name !== topLevelName || !statement.body?.elements) {
    return null
  }

  for (const nestedStatement of statement.body.elements) {
    if (nestedStatement.$type === 'Element' && nestedStatement.name === nestedName) {
      return { element: `${topLevelName}.${nestedName}`, document, statement: nestedStatement }
    }
  }

  return null
}

function calculateRelativePath(fullPath: string, workspacePath: string | undefined): string {
  if (!workspacePath || !fullPath.startsWith(workspacePath)) {
    return fullPath
  }
  return fullPath.substring(workspacePath.length + 1) // +1 to remove leading slash
}

function extractLocationFromElementInfo(
  elementInfo: any,
  languageServices: any,
): { file: string; line: number } {
  const fullPath = elementInfo.document.uri.fsPath || elementInfo.document.uri.path ||
    elementInfo.document.uri.toString()
  const file = calculateRelativePath(fullPath, languageServices?.workspace)
  const line = (elementInfo.statement.$cstNode?.range?.start?.line || 0) + 1 // Convert 0-based to 1-based

  return { file, line }
}

function formatLocation(element: any, languageServices?: any): string {
  let file = 'unknown'
  let line = 1

  if (!languageServices) {
    return `file: ${file}, line: ${line}, id: ${element.id}`
  }

  try {
    const documents = languageServices.langium.shared.workspace.LangiumDocuments.all.toArray()

    for (const document of documents) {
      const elementInfo = findElementInDocument(element.id, document)
      if (elementInfo) {
        const location = extractLocationFromElementInfo(elementInfo, languageServices)
        file = location.file
        line = location.line
        break
      }
    }
  } catch (error) {
    // Fallback to unknown if any error occurs
  }

  return `file: ${file}, line: ${line}, id: ${element.id}`
}

export function checkMaxThroughput(computedModel: any, languageServices: LikeC4): CorrectnessIssue[] {
  const issues: CorrectnessIssue[] = []
  const elementsWithoutMetadata = findElementsWithoutPerfMetadata(computedModel)

  for (const { element, missing, hasMetadata } of elementsWithoutMetadata) {
    const missingProps = missing.join(', ')

    if (hasMetadata) {
      issues.push({
        type: 'warning',
        category: 'PERF-METADATA',
        message: `Element '${element.id}' is missing required performance properties: ${missingProps}`,
        location: formatLocation(element, languageServices),
      })
    } else {
      issues.push({
        type: 'warning',
        category: 'PERF-METADATA',
        message: `Element '${element.id}' has no metadata block. Required performance properties: ${missingProps}`,
        location: formatLocation(element, languageServices),
      })
    }
  }

  return issues
}
