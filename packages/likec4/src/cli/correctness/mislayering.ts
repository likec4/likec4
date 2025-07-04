import type { LikeC4 } from '../../LikeC4'

type CorrectnessIssue = {
  type: 'error' | 'warning'
  category: string
  message: string
  location: string
}

type RelationshipInfo = {
  relationship: any
  document: any
  statement: any
}

function findMislayeredRelationships(model: any): any[] {
  const mislayered: any[] = []

  try {
    const relationships = [...model.relationships()]

    for (const relationship of relationships) {
      if (isMislayered(relationship, model)) {
        mislayered.push(relationship)
      }
    }

    return mislayered
  } catch (error) {
    console.error('Error in findMislayeredRelationships:', error)
    return []
  }
}

function isMislayered(relationship: any, model: any): boolean {
  const sourceElement = model.element(relationship.source?.id)
  const targetElement = model.element(relationship.target?.id)

  if (!sourceElement || !targetElement) {
    return false
  }

  const sourceLayer = getElementLayer(sourceElement)
  const targetLayer = getElementLayer(targetElement)

  // Skip if either element doesn't have layer metadata
  if (sourceLayer === null || targetLayer === null) {
    return false
  }

  // Check if layers are non-adjacent (difference > 1)
  const layerDifference = Math.abs(sourceLayer - targetLayer)
  return layerDifference > 1
}

function getElementLayer(element: any): number | null {
  // Try the getMetadata() method first (ElementModel API)
  if (typeof element.getMetadata === 'function') {
    try {
      const metadata = element.getMetadata()

      if (metadata && metadata.layer) {
        const parsed = parseInt(metadata.layer, 10)
        return isNaN(parsed) ? null : parsed
      }

      // Also try getting layer directly
      const layerValue = element.getMetadata('layer')
      if (layerValue) {
        const parsed = parseInt(layerValue, 10)
        return isNaN(parsed) ? null : parsed
      }
    } catch (error) {
      // Silently fail and try fallback
    }
  }

  // Fallback to raw metadata property access
  if (!element.metadata?.layer) {
    return null
  }

  const layerValue = element.metadata.layer
  const parsed = parseInt(layerValue, 10)

  return isNaN(parsed) ? null : parsed
}

function findElementsWithoutLayerInfo(model: any): any[] {
  const elementsWithoutLayer: any[] = []

  try {
    const elements = [...model.elements()]

    for (const element of elements) {
      const layer = getElementLayer(element)
      if (layer === null) {
        elementsWithoutLayer.push(element)
      }
    }

    return elementsWithoutLayer
  } catch (error) {
    console.error('Error in findElementsWithoutLayerInfo:', error)
    return []
  }
}

function findRelationshipInDocument(relationshipId: string, document: any): RelationshipInfo | null {
  if (document.parseResult?.value?.$type !== 'LikeC4Grammar') {
    return null
  }

  const grammar = document.parseResult.value
  const models = grammar.models || []

  for (const model of models) {
    if (!model.elements) continue

    const relationshipInfo = searchRelationshipInStatements(relationshipId, model.elements, document)
    if (relationshipInfo) {
      return relationshipInfo
    }
  }

  return null
}

function searchRelationshipInStatements(
  relationshipId: string,
  statements: any[],
  document: any,
): RelationshipInfo | null {
  for (const statement of statements) {
    if (statement.$type === 'Relation') {
      // Create a simple ID for matching based on source and target
      const sourceName = statement.source?.value?.ref?.name || statement.source?.value
      const targetName = statement.target?.value?.ref?.name || statement.target?.value
      const statementId = `${sourceName}:${targetName}`

      if (statementId === relationshipId) {
        return { relationship: relationshipId, document, statement }
      }
    } else if (statement.$type === 'Element' && statement.body?.elements) {
      // Recursively search in nested elements
      const nestedInfo = searchRelationshipInStatements(relationshipId, statement.body.elements, document)
      if (nestedInfo) {
        return nestedInfo
      }
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

function extractLocationFromRelationshipInfo(
  relationshipInfo: RelationshipInfo,
  languageServices: any,
): { file: string; line: number } {
  const fullPath = relationshipInfo.document.uri.fsPath || relationshipInfo.document.uri.path ||
    relationshipInfo.document.uri.toString()
  const file = calculateRelativePath(fullPath, languageServices?.workspace)
  const line = (relationshipInfo.statement.$cstNode?.range?.start?.line || 0) + 1 // Convert 0-based to 1-based

  return { file, line }
}

function formatLocation(relationship: any, model: any, languageServices?: any): string {
  let file = 'unknown'
  let line = 1

  if (!languageServices) {
    return `file: ${file}, line: ${line}, relationship: ${relationship.source?.id} -> ${relationship.target?.id}`
  }

  try {
    const documents = languageServices.langium.shared.workspace.LangiumDocuments.all.toArray()
    const relationshipId = `${relationship.source?.id}:${relationship.target?.id}`

    for (const document of documents) {
      const relationshipInfo = findRelationshipInDocument(relationshipId, document)
      if (relationshipInfo) {
        const location = extractLocationFromRelationshipInfo(relationshipInfo, languageServices)
        file = location.file
        line = location.line
        break
      }
    }
  } catch (error) {
    // Fallback to unknown if any error occurs
  }

  return `file: ${file}, line: ${line}, relationship: ${relationship.source?.id} -> ${relationship.target?.id}`
}

function formatElementLocation(element: any, languageServices?: any): string {
  let file = 'unknown'
  let line = 1

  if (!languageServices) {
    return `file: ${file}, line: ${line}, element: ${element.id}`
  }

  try {
    const documents = languageServices.langium.shared.workspace.LangiumDocuments.all.toArray()

    for (const document of documents) {
      if (document.parseResult?.value?.$type !== 'LikeC4Grammar') {
        continue
      }

      const grammar = document.parseResult.value
      const models = grammar.models || []

      for (const model of models) {
        if (!model.elements) continue

        const elementInfo = searchElementInStatements(element.id, model.elements, document)
        if (elementInfo) {
          const fullPath = document.uri.fsPath || document.uri.path || document.uri.toString()
          file = calculateRelativePath(fullPath, languageServices?.workspace)
          line = (elementInfo.statement.$cstNode?.range?.start?.line || 0) + 1
          break
        }
      }
    }
  } catch (error) {
    // Fallback to unknown if any error occurs
  }

  return `file: ${file}, line: ${line}, element: ${element.id}`
}

function searchElementInStatements(
  elementId: string,
  statements: any[],
  document: any,
): { element: string; document: any; statement: any } | null {
  for (const statement of statements) {
    if (statement.$type === 'Element') {
      if (statement.name === elementId) {
        return { element: elementId, document, statement }
      }

      // Recursively search in nested elements
      if (statement.body?.elements) {
        const nestedInfo = searchElementInStatements(elementId, statement.body.elements, document)
        if (nestedInfo) {
          return nestedInfo
        }
      }
    }
  }

  return null
}

function hasCheckMislayeringTag(model: any): boolean {
  try {
    const specification = model.specification
    return specification && specification.tags &&
      Object.prototype.hasOwnProperty.call(specification.tags, 'check-mislayering')
  } catch (error) {
    return false
  }
}

export function checkMislayering(computedModel: any, languageServices: LikeC4): CorrectnessIssue[] {
  const issues: CorrectnessIssue[] = []
  const mislayeredRelationships = findMislayeredRelationships(computedModel)

  for (const relationship of mislayeredRelationships) {
    const sourceElement = computedModel.element(relationship.source?.id)
    const targetElement = computedModel.element(relationship.target?.id)
    const sourceLayer = getElementLayer(sourceElement)
    const targetLayer = getElementLayer(targetElement)

    issues.push({
      type: 'warning',
      category: 'MISLAYERING',
      message:
        `Relationship '${relationship.source?.id} -> ${relationship.target?.id}' connects non-adjacent layers (${sourceLayer} -> ${targetLayer})`,
      location: formatLocation(relationship, computedModel, languageServices),
    })
  }

  // Check for elements without layer information only when check-mislayering tag is present
  if (hasCheckMislayeringTag(computedModel)) {
    const elementsWithoutLayer = findElementsWithoutLayerInfo(computedModel)
    for (const element of elementsWithoutLayer) {
      issues.push({
        type: 'warning',
        category: 'MISLAYERING',
        message: `Element '${element.id}' does not have layer information defined`,
        location: formatElementLocation(element, languageServices),
      })
    }
  }

  return issues
}
