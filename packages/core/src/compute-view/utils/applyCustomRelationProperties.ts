import { isNullish, omitBy, pick } from 'remeda'
import type { LikeC4Model } from '../../model/LikeC4Model'
import {
  type AnyAux,
  type ComputedEdge,
  type ComputedNode,
  type ElementViewRule,
  ModelRelationExpr,
  scalar,
} from '../../types'
import { flattenGroupRules } from './applyCustomElementProperties'
import { relationExpressionToPredicates } from './relationExpressionToPredicates'

type EdgeMetadata = Record<string, string[]>

/**
 * Merges metadata of the relationships behind the edge, same way as tags are merged.
 */
function edgeMetadata<A extends AnyAux>(model: LikeC4Model<A>, edge: ComputedEdge<A>): EdgeMetadata | null {
  let merged: EdgeMetadata | null = null
  for (const id of edge.relations) {
    const metadata = model.findRelationship(id, 'model')?.$relationship.metadata
    if (!metadata) {
      continue
    }
    for (const [key, value] of Object.entries<string | string[] | undefined>(metadata)) {
      if (isNullish(value)) {
        continue
      }
      merged ??= Object.create(null) as EdgeMetadata
      const values = merged[key] ??= []
      for (const v of Array.isArray(value) ? value : [value]) {
        if (!values.includes(v)) {
          values.push(v)
        }
      }
    }
  }
  return merged
}

export function applyCustomRelationProperties<A extends AnyAux>(
  _rules: ElementViewRule<A>[],
  nodes: ComputedNode<A>[],
  _edges: Iterable<ComputedEdge<A>>,
  model?: LikeC4Model<A>,
): ComputedEdge<A>[] {
  const rules = _rules.flatMap(flattenGroupRules(ModelRelationExpr.isCustom))
  const edges = Array.from(_edges)
  if (rules.length === 0 || edges.length === 0) {
    return edges
  }
  const metadata = edges.map(edge => model ? edgeMetadata(model, edge) : null)
  for (
    const {
      customRelation: {
        expr,
        title,
        description: _description,
        notes: _notes,
        multiple: _multiple,
        ...customprops
      },
    } of rules
  ) {
    const description = _description ? { description: scalar.MarkdownOrString(_description) } : {}
    const notes = _notes ? { notes: scalar.MarkdownOrString(_notes) } : {}
    const props = omitBy(customprops, isNullish)
    const satisfies = relationExpressionToPredicates(expr)
    edges.forEach((edge, i) => {
      let source, target
      for (const node of nodes) {
        if (node.id === edge.source) {
          source = node
        }
        if (node.id === edge.target) {
          target = node
        }
        if (source && target) {
          break
        }
      }
      if (!source || !target) {
        return
      }
      if (satisfies({ source, target, ...pick(edge, ['kind', 'tags']), metadata: metadata[i] })) {
        edges[i] = {
          ...edge,
          ...props,
          ...description,
          ...notes,
          label: title ?? edge.label,
          isCustomized: true,
        }
      }
    })
  }
  return edges
}
