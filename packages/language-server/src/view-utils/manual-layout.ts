import { invariant } from '@likec4/core'
import type { EdgeId, Fqn, ViewManualLayout } from '@likec4/core/types'
import JSON5 from 'json5'
import { chunk, entries, hasAtLeast, mapToObj } from 'remeda'

export namespace CompactViewManualLayout {
  export type Node = [
    id: Fqn,
    x: number,
    y: number,
    width: number,
    height: number
  ]

  export type Edge = [
    id: EdgeId,
    // flatten array of points, [x1, y1, x2, y2, ...]
    controlPoints: number[]
  ]

  // TODO replace with Zod/Valibot
  export function isCompactLayout(layout: any): layout is CompactViewManualLayout {
    return Array.isArray(layout) && hasAtLeast(layout, 3)
      && layout[0] === 1
      && Array.isArray(layout[1])
      && Array.isArray(layout[2])
  }

  export function pack(layout: ViewManualLayout): CompactViewManualLayout {
    return [
      1,
      entries.strict(layout.nodes).map(([id, { x, y, width, height }]) => [id, x, y, width, height]),
      entries.strict(layout.edges).map(([id, { controlPoints }]) => [id, controlPoints.flatMap(({ x, y }) => [x, y])])
    ]
  }

  export function unpack([_v, nodes, edges]: CompactViewManualLayout): ViewManualLayout {
    return {
      nodes: mapToObj(nodes, ([id, x, y, width, height]) => [id, { x, y, width, height }]),
      // edges: Object.fromEntries(edges.map(([id, controlPoints]) => [id, { controlPoints: mapWithFeedback(controlPoints, (x, y) => ({ x, y }), { x: 0, y: 0 }) }])
      edges: mapToObj(edges, ([id, controlPoints]) => {
        return [id, {
          controlPoints: chunk(controlPoints, 2).map(([x, y = 0]) => ({ x, y }))
        }]
      })
    }
  }
}

export type CompactViewManualLayout = [
  1, // version
  nodes: Array<CompactViewManualLayout.Node>,
  edges: Array<CompactViewManualLayout.Edge>
]

export function serializeToComment(layout: ViewManualLayout) {
  const compacted = CompactViewManualLayout.pack(layout)
  const encoded = btoa(JSON5.stringify(compacted))
  const lines = chunk(Array.from(encoded), 100).map(l => ' * ' + l.join(''))
  lines.unshift(
    '/**',
    ' * @likec4-generated(v1)'
  )
  lines.push(' */')

  return lines.join('\n')
}

export function hasManualLayout(comment: string) {
  return comment.includes('@likec4-generated')
}

export function deserializeFromComment(comment: string): ViewManualLayout | undefined {
  if (!hasManualLayout(comment)) {
    console.error(`Not a likec4-generated comment: ${comment}`)
    return undefined
  }
  try {
    const b64 = comment
      .trim()
      .split('\n')
      .filter(l => !l.includes('**') && !l.includes('@likec4-') && !l.includes('*/'))
      .map(l => l.replaceAll('*', '').trim())
      .join('')
    const decodedb64 = atob(b64)
    const compacted = JSON5.parse(decodedb64)
    invariant(CompactViewManualLayout.isCompactLayout(compacted), 'Invalid compacted layout')
    return CompactViewManualLayout.unpack(compacted)
  } catch (e) {
    console.error(e)
    return undefined
  }
}
