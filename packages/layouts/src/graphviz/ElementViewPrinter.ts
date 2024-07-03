import type { ComputedEdge, ComputedElementView, Fqn } from '@likec4/core'
import {
  compareByFqnHierarchically,
  compareFqnHierarchically,
  DefaultArrowType,
  defaultTheme as Theme,
  nonNullable
} from '@likec4/core'
import {
  entries,
  filter,
  first,
  groupBy,
  isTruthy,
  last,
  map,
  mapToObj,
  omitBy,
  pipe,
  pullObject,
  reverse,
  sort,
  unique
} from 'remeda'
import type { EdgeModel, RootGraphModel } from 'ts-graphviz'
import { attribute as _ } from 'ts-graphviz'
import { edgeLabel } from './dot-labels'
import { DefaultEdgeStyle, DotPrinter } from './DotPrinter'
import type { DotSource } from './types'
import { isCompound, toArrowType } from './utils'

export class ElementViewPrinter extends DotPrinter<ComputedElementView> {
  static toDot(view: ComputedElementView): DotSource {
    return new ElementViewPrinter(view).print()
  }

  protected override buildGraphvizModel(G: RootGraphModel): void {
    super.buildGraphvizModel(G)

    const groups = pipe(
      this.view.nodes,
      filter(n => n.children.length > 0),
      map(n => n.id),
      sort(compareFqnHierarchically),
      reverse(),
      mapToObj(id => {
        // edges only inside clusters, compound endpoints are not considered
        const edges = this.findNestedEdges(id).filter(e =>
          !!this.getGraphNode(e.source) && !!this.getGraphNode(e.target)
        )
        return [id, edges]
      }),
      omitBy((v, _k) => v.length <= 1 || v.length > 8),
      entries(),
      map(([id, edges]) => ({ id: id as Fqn, edges }))
    )

    const processed = new Set<Fqn>()
    for (const group of groups) {
      const edges = group.edges.filter(e => !processed.has(e.source) && !processed.has(e.target))
      for (const edge of edges) {
        const sourceNode = nonNullable(this.getGraphNode(edge.source), `Graphviz Node not found for ${edge.source}`)
        const targetNode = nonNullable(this.getGraphNode(edge.target), `Graphviz Node not found for ${edge.target}`)
        processed.add(edge.source)
        processed.add(edge.target)
        sourceNode.attributes.set(_.group, group.id)
        targetNode.attributes.set(_.group, group.id)
      }
    }
  }

  protected override addEdge(edge: ComputedEdge, G: RootGraphModel): EdgeModel | null {
    const viewEdges = this.view.edges
    const [sourceFqn, targetFqn] = edge.dir === 'back' ? [edge.target, edge.source] : [edge.source, edge.target]
    const [sourceNode, source, ltail] = this.edgeEndpoint(sourceFqn, nodes => last(nodes))
    const [targetNode, target, lhead] = this.edgeEndpoint(targetFqn, first)

    const edgeParentId = edge.parent
    const parent = edgeParentId === null
      ? G
      : nonNullable(this.getSubgraph(edgeParentId), `Parent not found for edge ${edge.id}`)

    const e = parent.edge([source, target], {
      [_.likec4_id]: edge.id,
      [_.style]: edge.line ?? DefaultEdgeStyle
    })

    lhead && e.attributes.set(_.lhead, lhead)
    ltail && e.attributes.set(_.ltail, ltail)

    if (lhead || ltail) {
      const sourceId = source.attributes.get(_.likec4_id) as Fqn
      const targetId = target.attributes.get(_.likec4_id) as Fqn
      const existingVisibleEdge = viewEdges.find(e => e.source === sourceId && e.target === targetId)
      if (existingVisibleEdge) {
        e.attributes.set(_.weight, 0)
      }
    }

    const label = edge.label?.trim() ?? ''
    if (isTruthy(label)) {
      e.attributes.apply({
        [_.label]: edgeLabel(label)
      })
    }
    if (edge.color) {
      e.attributes.apply({
        [_.color]: Theme.relationships[edge.color].lineColor,
        [_.fontcolor]: Theme.relationships[edge.color].labelColor
      })
    }

    let [head, tail] = [edge.head ?? DefaultArrowType, edge.tail ?? 'none']

    if (edge.dir === 'back') {
      e.attributes.apply({
        [_.arrowtail]: toArrowType(head),
        [_.dir]: 'back'
      })
      if (tail !== 'none') {
        e.attributes.apply({
          [_.arrowhead]: toArrowType(tail),
          [_.dir]: 'both'
        })
      }
      return e
    }

    if (head === 'none' && tail === 'none') {
      e.attributes.apply({
        [_.arrowtail]: 'none',
        [_.arrowhead]: 'none',
        [_.dir]: 'none',
        [_.constraint]: false
      })
      return e
    }

    if (head !== 'none' && tail !== 'none') {
      e.attributes.apply({
        [_.arrowhead]: toArrowType(head),
        [_.arrowtail]: toArrowType(tail),
        [_.dir]: 'both',
        [_.minlen]: 0
      })
      return e
    }

    if (head !== DefaultArrowType) {
      e.attributes.set(_.arrowhead, toArrowType(head))
    }
    if (tail !== 'none') {
      e.attributes.set(_.arrowtail, toArrowType(tail))
    }

    // This heuristic removes the rank constraint from the edge
    // if it is the only edge within container.
    let otherEdges
    if (edgeParentId === null && sourceNode.parent == null && targetNode.parent == null) {
      otherEdges = viewEdges.filter(e => {
        // hide self
        if (e.id === edge.id) {
          return false
        }
        // hide edges with the same endpoints
        if (
          (e.source === edge.source && e.target === edge.target)
          || (e.source === edge.target && e.target === edge.source)
        ) {
          return false
        }
        // hide edges inside clusters
        if (e.parent !== null) {
          return false
        }
        const edgeSource = this.viewElement(e.source)
        const edgeTarget = this.viewElement(e.target)
        // hide edges with compound endpoints
        if (isCompound(edgeSource) || isCompound(edgeTarget)) {
          return false
        }
        // only edges between top-level nodes
        return edgeSource.parent == null && edgeTarget.parent == null
      })
    } else {
      otherEdges = this.findNestedEdges(edgeParentId).filter(e => {
        // hide self
        if (e.id === edge.id) {
          return false
        }
        // hide edges with the same endpoints
        if (
          (e.source === edge.source && e.target === edge.target)
          || (e.source === edge.target && e.target === edge.source)
        ) {
          return false
        }
        return true
      })
    }
    const isTheOnlyEdge = otherEdges.length === 0
    if (isTheOnlyEdge) {
      if (edgeParentId === null || this.leafElements(edgeParentId).length <= 3) {
        // don't rank the edge
        // e.attributes.set(_.minlen, 0)
        e.attributes.set(_.constraint, false)
      }
    }

    return e
  }
}
