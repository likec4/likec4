import { type ComputedNode, ElementColors as Colors } from '@likec4/core'
import { isEmpty, isTruthy } from 'remeda'
import wordWrap from 'word-wrap'
import { IconSizePoints, pxToPoints } from './utils'

export function sanitize(text: string) {
  return text.trim().replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

function wrap(text: string, maxChars: number) {
  return wordWrap(text, {
    width: maxChars,
    indent: '',
    escape: sanitize
  }).split('\n')
}

function wrapToHTML({
  text,
  maxchars,
  fontsize,
  lineHeight = 1.25,
  bold,
  color,
  align
}: {
  text: string
  maxchars: number
  fontsize: number
  lineHeight?: number
  bold?: boolean
  color?: string
  align?: 'left' | 'right' | 'center'
}) {
  // Change row height if line height is not 1
  const ALIGN = align ? ` ALIGN="${align.toUpperCase()}"` : ''
  const TDheight = lineHeight !== 1 ? ` VALIGN="BOTTOM" HEIGHT="${pxToPoints(fontsize * lineHeight)}"` : ''
  const fontOpts = ` POINT-SIZE="${pxToPoints(fontsize)}"${color ? ` COLOR="${color}"` : ``}`
  const rows = wrap(text, maxchars)
    .map(text => (isEmpty(text) ? ' ' : text))
    .map(text => `<FONT${fontOpts}>${text}</FONT>`)
    .map(text => (bold ? `<B>${text}</B>` : text))
    .map(text => `<TR><TD${ALIGN}${TDheight}>${text}</TD></TR>`)
  return `<TABLE${ALIGN} BORDER="0" CELLBORDER="0" CELLPADDING="0" CELLSPACING="0">${rows}</TABLE>`
}
export function nodeIcon(src: string) {
  return `<IMG SRC="${src}" SCALE="TRUE"/>`
}

export function nodeLabel(node: ComputedNode) {
  const lines = [
    wrapToHTML({
      text: node.title,
      fontsize: 20,
      maxchars: 35,
      color: Colors[node.color].hiContrast
    })
  ]
  if (isTruthy(node.technology)) {
    lines.push(
      wrapToHTML({
        text: node.technology,
        fontsize: 12,
        lineHeight: 1,
        maxchars: 50,
        color: Colors[node.color].loContrast
      })
    )
  }
  if (isTruthy(node.description)) {
    lines.push(
      wrapToHTML({
        text: node.description,
        fontsize: 14,
        lineHeight: 1.1,
        maxchars: 45,
        color: Colors[node.color].loContrast
      })
    )
  }
  if (lines.length === 1 && !node.icon) {
    return `<${lines[0]}>`
  }
  let rows = lines.map(line => `<TR><TD>${line}</TD></TR>`)
  if (node.icon) {
    rows.unshift(
      `<TR><TD ALIGN="CENTER" HEIGHT="${IconSizePoints}">${nodeIcon(node.icon)}</TD></TR>`
    )
  }
  rows = rows.join('')
  return `<<TABLE BORDER="0" CELLBORDER="0" CELLPADDING="0" CELLSPACING="5">${rows}</TABLE>>`
}

export function edgeLabel(text: string) {
  const html = wrapToHTML({
    text,
    maxchars: 35,
    fontsize: 13,
    lineHeight: 1.1,
    bold: text === '[...]',
    align: 'left'
  })
  return `<<TABLE BORDER="0" CELLBORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD WIDTH="2"></TD><TD>${html}</TD></TR></TABLE>>`
}
