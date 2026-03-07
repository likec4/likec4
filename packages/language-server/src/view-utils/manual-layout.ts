import type * as c4 from '@likec4/core'
import { exact } from '@likec4/core'
import { shallowEqual } from 'fast-equals'
import { find } from 'remeda'

/**
 * Applies styles from the latest layout to the manual layout
 * @param manualLayouted
 * @param latest
 */
export function applyStylesToManualLayout<A extends c4.AnyAux>(
  manualLayouted: NoInfer<c4.LayoutedView<A>>,
  latest: c4.ComputedView<A> | c4.LayoutedView<A>,
): c4.LayoutedView<A> {
  const nodes = manualLayouted.nodes.map(n => {
    const latestNode = find(latest.nodes, l => l.id === n.id)
    if (!latestNode) {
      return n
    }
    const color = latestNode.color
    if (color !== n.color) {
      n = {
        ...n,
        color,
      }
    }
    const { opacity, border } = latestNode.style
    if (opacity !== n.style.opacity || border !== n.style.border) {
      n = {
        ...n,
        style: exact({
          ...n.style,
          opacity,
          border,
        }),
      }
    }
    return n
  })
  const edges = manualLayouted.edges.map(e => {
    const latestEdge = find(latest.edges, l => l.id === e.id)
    if (!latestEdge) {
      return e
    }
    if (latestEdge.color !== e.color) {
      e = {
        ...e,
        color: latestEdge.color,
      }
    }
    if (latestEdge.line !== e.line) {
      e = {
        ...e,
        line: latestEdge.line,
      }
    }
    return e
  })

  if (!shallowEqual(manualLayouted.nodes, nodes) || !shallowEqual(manualLayouted.edges, edges)) {
    return {
      ...manualLayouted,
      nodes,
      edges,
    }
  }
  return manualLayouted
}
