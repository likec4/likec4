import {
  type EdgeId,
  type Fqn,
  type NonEmptyReadonlyArray,
  type RelationId,
  DeploymentFqn,
  hasAtLeast,
  invariant,
  isAncestor,
  sortParentsFirst,
} from '@likec4/core'
import { treeFromElements } from '@likec4/core/compute-view/relationships'
import {
  type AnyAux,
  type DeploymentElementModel,
  type DeploymentRelationEndpoint,
  type DeploymentRelationModel,
  type LikeC4Model,
  type LikeC4ViewModel,
  type RelationshipModel,
  deploymentConnection,
  ElementModel,
  isNestedElementOfDeployedInstanceModel,
  modelConnection,
} from '@likec4/core/model'

type Relation = DeploymentRelationModel | RelationshipModel
type Element = DeploymentElementModel | ElementModel

export interface RelationshipDetailsViewData {
  sources: ReadonlySet<Element>
  relationships: ReadonlySet<Relation>
  targets: ReadonlySet<Element>
}

const finalize = <M extends AnyAux>(
  elements: Set<Element>,
  explicits: Set<Element>,
): Set<Element> => {
  if (elements.size > 2 && explicits.size !== elements.size) {
    const elts = treeFromElements(elements).flatten()
    return new Set(sortParentsFirst([
      ...elts,
      ...explicits,
    ]))
  }
  if (elements.size > 1) {
    return new Set(sortParentsFirst([...elements]))
  }
  return elements
}

export function computeEdgeDetailsViewData(
  edges: NonEmptyReadonlyArray<EdgeId>,
  view: LikeC4ViewModel<AnyAux>,
): RelationshipDetailsViewData {
  const sources = new Set<Element>()
  const relationships = new Set<Relation>()
  const targets = new Set<Element>()

  const explicit = {
    sources: new Set<Element>(),
    targets: new Set<Element>(),
  }

  const addExplicit = (el: DeploymentRelationEndpoint | ElementModel, type: 'source' | 'target') => {
    const element = isNestedElementOfDeployedInstanceModel(el)
      ? el.instance
      : el
    if (type === 'source') {
      sources.add(element)
      explicit.sources.add(element)
    } else {
      targets.add(element)
      explicit.targets.add(element)
    }
  }

  for (const edgeId of edges) {
    const edge = view.findEdge(edgeId)
    // console.log('[ISSUE-2094] computeEdgeDetailsViewData foreach edgeId, edge', edgeId, edge)
    const _relationships = edge ? [...edge.relationships()] : []
    if (!edge || !hasAtLeast(_relationships, 1) || !edge.source.hasElement() || !edge.target.hasElement()) {
      continue
    }

    const source = edge.source.deployment! // TODO: Handle nulls
    const target = edge.target.deployment! // TODO: Handle nulls
    addExplicit(source, 'source')
    addExplicit(target, 'target')

    // console.log('[ISSUE-2094] computeEdgeDetailsViewData source and target', source, target)

    for (const relationship of _relationships) {
      // console.log('[ISSUE-2094] computeEdgeDetailsViewData foreach relationship', relationship)

      relationships.add(relationship)

      const relationSource = isNestedElementOfDeployedInstanceModel(relationship.source)
        ? relationship.source.instance
        : relationship.source
      const relationTarget = isNestedElementOfDeployedInstanceModel(relationship.target)
        ? relationship.target.instance
        : relationship.target

      if (relationSource !== source) {
        addExplicit(relationSource, 'source')
        for (const parent of relationSource.ancestors()) {
          if (parent === source) {
            break
          }
          sources.add(parent)
        }
      }

      if (relationTarget !== target) {
        addExplicit(relationTarget, 'target')
        for (const parent of relationTarget.ancestors()) {
          if (parent === target) {
            break
          }
          targets.add(parent)
        }
      }
    }
  }

  // console.log('[ISSUE-2094] computeEdgeDetailsViewData expicits', explicit)
  // console.log('[ISSUE-2094] computeEdgeDetailsViewData all', { sources, targets })

  // console.log('[ISSUE-2094] computeEdgeDetailsViewData results', {
  //   sources: finalize(sources, explicit.sources),
  //   targets: finalize(targets, explicit.targets),
  //   relationships,
  // })

  return {
    sources: finalize(sources, explicit.sources),
    targets: finalize(targets, explicit.targets),
    relationships,
  }
}

export function computeRelationshipDetailsViewData({
  // relationships: _relationships,
  source,
  target,
}: {
  source: DeploymentElementModel
  target: DeploymentElementModel
  // relationships: NonEmptyReadonlyArray<RelationId>
}): RelationshipDetailsViewData {
  const sources = new Set<DeploymentElementModel>()
  const relationships = new Set<DeploymentRelationModel>()
  const targets = new Set<DeploymentElementModel>()

  const explicit = {
    sources: new Set<DeploymentElementModel>(),
    targets: new Set<DeploymentElementModel>(),
  }

  const addExplicit = (el: DeploymentElementModel, type: 'source' | 'target') => {
    if (type === 'source') {
      sources.add(el)
      explicit.sources.add(el)
    } else {
      targets.add(el)
      explicit.targets.add(el)
    }
  }

  if (source) {
    addExplicit(source, 'source')
  }
  if (target) {
    addExplicit(target, 'target')
  }
  const [connection] = deploymentConnection.findConnection(source, target, 'directed')
  if (!connection) {
    return {
      sources,
      targets,
      relationships,
    }
  }

  for (const relationship of connection.relations.deployment) {
    const relationSource = isNestedElementOfDeployedInstanceModel(relationship.source)
      ? relationship.source.instance
      : relationship.source
    const relationTarget = isNestedElementOfDeployedInstanceModel(relationship.target)
      ? relationship.target.instance
      : relationship.target
    addExplicit(relationSource, 'source')
    addExplicit(relationTarget, 'target')
    relationships.add(relationship)

    if (source !== relationSource) {
      invariant(isAncestor(source, relationSource), `${source.id} is not an ancestor of ${relationSource.id}`)
      for (const parent of relationSource.ancestors()) {
        if (parent === source) {
          break
        }
        sources.add(parent)
      }
    }

    if (target !== relationTarget) {
      invariant(isAncestor(target, relationTarget), `${target.id} is not an ancestor of ${relationTarget.id}`)
      for (const parent of relationTarget.ancestors()) {
        if (parent === target) {
          break
        }
        targets.add(parent)
      }
    }
  }

  // console.log('[ISSUE-2094] computeRelationshipDetailsViewData expicits', explicit)
  // console.log('[ISSUE-2094] computeRelationshipDetailsViewData all', { sources, targets })

  return {
    sources: finalize(sources, explicit.sources),
    targets: finalize(targets, explicit.targets),
    relationships,
  }
}

export function findElement<M extends AnyAux>(
  likec4model: LikeC4Model<M>,
  fqn: DeploymentFqn,
): DeploymentElementModel<M> {
  const element = likec4model.deployment.findElement(fqn)
  invariant(element, `element ${fqn} not found`)

  return element
}

export const compute = {
  computeRelationshipDetailsViewData,
  computeEdgeDetailsViewData,
  findElement,
}
