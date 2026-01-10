import type { EdgeId, NonEmptyReadonlyArray } from '@likec4/core'
import { treeFromElements } from '@likec4/core/compute-view'
import type {
  ElementModel,
  LikeC4ViewModel,
  RelationshipModel,
} from '@likec4/core/model'
import { modelConnection } from '@likec4/core/model'
import type { AnyAux } from '@likec4/core/types'
import { invariant, isAncestor, sortParentsFirst } from '@likec4/core/utils'
import { hasAtLeast } from 'remeda'

export interface RelationshipDetailsViewData {
  sources: ReadonlySet<ElementModel>
  relationships: ReadonlySet<RelationshipModel>
  targets: ReadonlySet<ElementModel>
}

const finalize = <M extends AnyAux>(
  elements: Set<ElementModel<M>>,
  explicits: Set<ElementModel<M>>,
): Set<ElementModel<M>> => {
  if (elements.size > 2 && explicits.size !== elements.size) {
    return new Set(sortParentsFirst([
      ...treeFromElements(elements).flatten(),
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
  const sources = new Set<ElementModel>()
  const relationships = new Set<RelationshipModel>()
  const targets = new Set<ElementModel>()

  const explicit = {
    sources: new Set<ElementModel>(),
    targets: new Set<ElementModel>(),
  }

  const addExplicit = (el: ElementModel, type: 'source' | 'target') => {
    if (type === 'source') {
      sources.add(el)
      explicit.sources.add(el)
    } else {
      targets.add(el)
      explicit.targets.add(el)
    }
  }

  for (const edgeId of edges) {
    const edge = view.findEdge(edgeId)
    const _relationships = edge ? [...edge.relationships('model')] : []
    if (!edge || !hasAtLeast(_relationships, 1) || !edge.source.hasElement() || !edge.target.hasElement()) {
      continue
    }
    const source = edge.source.element
    const target = edge.target.element
    addExplicit(source, 'source')
    addExplicit(target, 'target')

    for (const relationship of _relationships) {
      relationships.add(relationship)

      if (relationship.source !== source) {
        addExplicit(relationship.source, 'source')
        for (const parent of relationship.source.ancestors()) {
          if (parent === source) {
            break
          }
          sources.add(parent)
        }
      }

      if (relationship.target !== target) {
        addExplicit(relationship.target, 'target')
        for (const parent of relationship.target.ancestors()) {
          if (parent === target) {
            break
          }
          targets.add(parent)
        }
      }
    }
  }

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
  source: ElementModel
  target: ElementModel
  // relationships: NonEmptyReadonlyArray<RelationId>
}): RelationshipDetailsViewData {
  const sources = new Set<ElementModel>()
  const relationships = new Set<RelationshipModel>()
  const targets = new Set<ElementModel>()

  const explicit = {
    sources: new Set<ElementModel>(),
    targets: new Set<ElementModel>(),
  }

  const addExplicit = (el: ElementModel, type: 'source' | 'target') => {
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
  const [connection] = modelConnection.findConnection(source, target, 'directed')
  if (!connection) {
    return {
      sources,
      targets,
      relationships,
    }
  }

  for (const relationship of connection.relations) {
    const relationSource = relationship.source
    const relationTarget = relationship.target
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

  return {
    sources: finalize(sources, explicit.sources),
    targets: finalize(targets, explicit.targets),
    relationships,
  }
}
