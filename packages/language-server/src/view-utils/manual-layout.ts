import { isAutoLayoutDirection, type ViewManualLayout } from '@likec4/core'
import { decode, encode } from '@msgpack/msgpack'
import { fromBase64, toBase64 } from '@smithy/util-base64'
import { mapValues } from 'remeda'

function pack({
  nodes,
  edges,
  ...rest
}: ViewManualLayout) {
  return {
    ...rest,
    nodes: mapValues(nodes, ({ x, y, width, height, isCompound, ...n }) => ({
      ...n,
      b: [x, y, width, height] as const,
      c: isCompound
    })),
    edges: mapValues(edges, ({ points, controlPoints, labelBBox, dotpos, ...e }) => ({
      ...!!controlPoints && { cp: controlPoints },
      ...!!labelBBox && { l: labelBBox },
      ...!!dotpos && { dp: dotpos },
      ...e,
      p: points
    }))
  }
}

function unpack({
  nodes,
  edges,
  autoLayout,
  ...rest
}: ReturnType<typeof pack>): ViewManualLayout {
  return {
    ...rest,
    /// Try to parse the old format for backward compatibility
    autoLayout: isAutoLayoutDirection(autoLayout) ? { direction: autoLayout } : autoLayout,
    nodes: mapValues(nodes, ({ b, c, ...n }) => ({
      x: b[0],
      y: b[1],
      width: b[2],
      height: b[3],
      isCompound: c,
      ...n
    })),
    edges: mapValues(edges, ({ p, cp, l, dp, ...e }) => ({
      ...!!cp && { controlPoints: cp },
      ...!!l && { labelBBox: l },
      ...!!dp && { dotpos: dp },
      ...e,
      points: p
    }))
  }
}

export function serializeToComment(layout: ViewManualLayout) {
  const bytes = encode(pack(layout))
  const base64 = toBase64(bytes)
  const lines = [] as string[]
  let offset = 0
  const MAX_LINE_LENGTH = 200
  while (offset < base64.length) {
    lines.push(' * ' + base64.slice(offset, Math.min(offset + MAX_LINE_LENGTH, base64.length)))
    offset += MAX_LINE_LENGTH
  }
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

export function deserializeFromComment(comment: string): ViewManualLayout {
  if (!hasManualLayout(comment)) {
    throw new Error(`Not a likec4-generated comment: ${comment}`)
  }
  const b64 = comment
    .trim()
    .split('\n')
    .filter(l => !l.includes('**') && !l.includes('@likec4-') && !l.includes('*/'))
    .map(l => l.replaceAll('*', '').trim())
    .join('')
  const decodedb64 = fromBase64(b64)
  return unpack(decode(decodedb64) as any) as ViewManualLayout
}