import type { ComputedEdge, ComputedNode } from '@likec4/core/types'
import wrap from 'word-wrap'


export const pointToPx = (pt: number) => Math.ceil((pt * 96) / 72)
export const inchToPx = (inch: number) => Math.ceil(inch * 96)
export const pxToInch = (px: number) => px / 96
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
  align = 'center'
}: {
  text: string
  maxChars: number
  fontSize: number
  lineHeight: number,
  align?: 'left' | 'right' | 'center'
}) {
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
  .map(line => `${line}<FONT point-size="${pxToPoints(lineHeight)}"> <BR ALIGN="${align.toUpperCase()}"/></FONT>`)
  .join('')
  return `<FONT point-size="${pxToPoints(fontSize)}">${lines}</FONT>`
}

export function generateNodeLabel(node: ComputedNode) {
  let label = wrapToHTMLLabel({
    text: node.title,
    maxChars: 30,
    fontSize: 18,
    lineHeight: 20
  })
  if (node.description) {
    label += `<FONT point-size="${pxToPoints(14)}"> <BR/></FONT>`
    label += wrapToHTMLLabel({
      text: node.description,
      maxChars: 50,
      fontSize: 14,
      lineHeight: 16
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
    align: 'left'
  })
  return `<${label}>`
  // return `<<FONT point-size="${pxToPoints(14)}">${wrap(edge.label, {
  //   width: 50,
  //   indent: '',
  //   trim: false,
  //   newline: `<FONT point-size="${pxToPoints(15.8)}"> <BR ALIGN="LEFT"/></FONT>`
  // })}</FONT>>`
}
