import { type ValidationCheck, AstUtils } from 'langium'
import { ast } from '../../ast'
import type { LikeC4Services } from '../../module'
import { projectIdFrom } from '../../utils'
import { tryOrLog } from '../_shared'

const { getDocument } = AstUtils

function getElementLayer(element: ast.Element): number | null {
  // Find metadata property in element body props
  const metadataProperty = element.body?.props?.find(ast.isMetadataProperty)
  if (!metadataProperty || !metadataProperty.props) {
    return null
  }

  // Look for layer property in metadata
  for (const prop of metadataProperty.props) {
    if (prop.key === 'layer' && prop.value) {
      const layerValue = prop.value
      const parsed = parseInt(layerValue, 10)
      return isNaN(parsed) ? null : parsed
    }
  }

  return null
}

function hasCheckMislayeringTag(services: LikeC4Services, node: ast.Element | ast.Relation): boolean {
  const index = services.shared.workspace.IndexManager
  const projectId = projectIdFrom(node)

  // Check if check-mislayering tag exists in the project
  const checkMislayeringTag = index
    .projectElements(projectId, ast.Tag)
    .filter(n => n.name === 'check-mislayering')
    .head()

  return !!checkMislayeringTag
}

export const checkMislayering = (services: LikeC4Services): ValidationCheck<ast.Relation> => {
  return tryOrLog((relation, accept) => {
    // Only check if check-mislayering tag exists
    if (!hasCheckMislayeringTag(services, relation)) {
      return
    }

    const fqnIndex = services.likec4.FqnIndex

    // Get source and target elements
    let sourceElement: ast.Element | null = null
    let targetElement: ast.Element | null = null

    if (relation.source && relation.source.value.ref && ast.isElement(relation.source.value.ref)) {
      sourceElement = relation.source.value.ref
    }

    if (relation.target && relation.target.value.ref && ast.isElement(relation.target.value.ref)) {
      targetElement = relation.target.value.ref
    }

    if (!sourceElement || !targetElement) {
      return
    }

    // Get layer metadata for both elements
    const sourceLayer = getElementLayer(sourceElement)
    const targetLayer = getElementLayer(targetElement)

    // Skip if either element doesn't have layer metadata
    if (sourceLayer === null || targetLayer === null) {
      return
    }

    // Check if layers are non-adjacent (difference > 1)
    const layerDifference = Math.abs(sourceLayer - targetLayer)

    if (layerDifference > 1) {
      const sourceName = sourceElement.name || 'unknown'
      const targetName = targetElement.name || 'unknown'

      accept(
        'warning',
        `Relationship '${sourceName} -> ${targetName}' connects non-adjacent layers (${sourceLayer} -> ${targetLayer})`,
        {
          node: relation,
          property: 'target',
          code: 'mislayered-relationship',
        },
      )
    }
  })
}

export const checkElementLayerInfo = (services: LikeC4Services): ValidationCheck<ast.Element> => {
  return tryOrLog((element, accept) => {
    // Only check if check-mislayering tag exists
    if (!hasCheckMislayeringTag(services, element)) {
      return
    }

    const layer = getElementLayer(element)
    if (layer === null) {
      accept(
        'warning',
        `Element '${element.name}' does not have layer information defined`,
        {
          node: element,
          property: 'name',
          code: 'missing-layer-info',
        },
      )
    }
  })
}
