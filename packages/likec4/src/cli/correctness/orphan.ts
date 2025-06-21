import type { LikeC4 } from '../../LikeC4'

type CorrectnessIssue = {
  type: 'error' | 'warning'
  category: string
  message: string
  location: string
}

type ElementInfo = {
  element: any
  document: any
  statement: any
}

function findOrphanElements(model: any): any[] {
  const orphans: any[] = []

  try {
    const elements = [...model.elements()]

    for (const element of elements) {
      // Skip user and external elements as they are often meant to be boundary elements
      if (element.kind === 'user' || element.kind === 'external') {
        continue
      }

      if (!isElementConnected(element, model)) {
        orphans.push(element)
      }
    }

    return orphans
  } catch (error) {
    console.error('Error in findOrphanElements:', error)
    return []
  }
}

function isElementConnected(element: any, model: any): boolean {
  const relationships = [...model.relationships()]
  return relationships.some(rel => rel.source?.id === element.id || rel.target?.id === element.id)
}

function findElementInDocument(elementId: string, document: any): ElementInfo | null {
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

function searchElementInStatements(elementId: string, statements: any[], document: any): ElementInfo | null {
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
): ElementInfo | null {
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
  elementInfo: ElementInfo,
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

export function checkOrphan(computedModel: any, languageServices: LikeC4): CorrectnessIssue[] {
  const issues: CorrectnessIssue[] = []
  const orphanElements = findOrphanElements(computedModel)

  for (const element of orphanElements) {
    issues.push({
      type: 'warning',
      category: 'ORPHAN',
      message: `Element '${element.id}' is not connected to any other elements`,
      location: formatLocation(element, languageServices),
    })
  }

  return issues
}
