import type { ComputedEdge, ComputedNode } from '@likec4/core/types'
import { Colors } from '@likec4/core'
import wrap from 'word-wrap'


export const pointToPx = (pt: number) => Math.ceil((pt * 96) / 72)
export const inchToPx = (inch: number) => Math.ceil(inch * 96)
export const pxToInch = (px: number) => Math.round((px / 96) * 10000) / 10000
export const pxToPoints = (px: number) => px * 0.75

export const toKonvaAlign = (align: 'l' | 'r' | 'c') => {
  switch (align) {
    case 'l':
      return 'left'
    case 'r':
      return 'right'
    case 'c':
      return 'center'
  }
  // @ts-expect-error - Unexhaustive match
  throw new Error(`Invalid align: ${align}`)
}

function wrapToHTMLLabel({
  text,
  maxChars,
  fontSize,
  lineHeight,
  color,
  align
}: {
  text: string
  maxChars: number
  fontSize: number
  lineHeight: number,
  color?: string,
  align?: 'left' | 'right' | 'center'
}) {
  const br = align ? `<br align="${align.toUpperCase()}"/>` : '<br/>'

  const lines = wrap(text, {
    width: maxChars,
    indent: '',
    escape: (line) => {
      return line
        .trim()
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
    }
  })
  .split('\n')
  // emulate line height
  .map(line => `${line}<font point-size="${pxToPoints(lineHeight)}"> ${br}</font>`)
  .join('')
  return `<font ${color ? `color="${color}" `: ``}point-size="${pxToPoints(fontSize)}">${lines}</font>`
}

export function generateNodeLabel(node: ComputedNode) {
  let label = wrapToHTMLLabel({
    text: node.title,
    maxChars: 35,
    fontSize: 18,
    lineHeight: 20,
    color: Colors[node.color].hiContrast
  })
  if (node.description) {
    // padding
    label += `<font point-size="${pxToPoints(14)}"> <br/></font>`
    label += wrapToHTMLLabel({
      text: node.description,
      maxChars: 50,
      fontSize: 14,
      lineHeight: 16,
      color: Colors[node.color].loContrast
    })
  }
  return `<${label}>`
}

export function generateEdgeLabel(edge: ComputedEdge) {
  if (!edge.label || edge.label.trim() === '') {
    return null
  }
  const label = wrapToHTMLLabel({
    text: edge.label,
    maxChars: 50,
    fontSize: 14,
    lineHeight: 16,
    align: 'left',
  })
  return `<${label}>`
}
