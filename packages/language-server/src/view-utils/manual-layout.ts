import type { ViewManualLayout } from '@likec4/core/types'
import { decode, encode } from '@msgpack/msgpack'
import { fromBase64, toBase64 } from '@smithy/util-base64'

export function serializeToComment(layout: ViewManualLayout) {
  const bytes = encode(layout)
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
  return decode(decodedb64) as ViewManualLayout
}
