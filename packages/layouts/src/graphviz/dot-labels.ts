import { ElementColors as Colors, type ComputedNode } from '@likec4/core'
import { isEmpty, isTruthy } from 'remeda'
import wordWrap from 'word-wrap'
import { IconSizePoints, pxToPoints } from './graphviz-utils'

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
  const fontOpts = `POINT-SIZE="${pxToPoints(fontsize)}"${color ? ` COLOR="${color}"` : ``}`
  const rows = wrap(text, maxchars)
    .map(text => (isEmpty(text) ? ' ' : text))
    .map(text => `<FONT ${fontOpts}>${text}</FONT>`)
    .map(text => (bold ? `<B>${text}</B>` : text))
    .map(
      text =>
        `<TR><TD ALIGN="${align?.toUpperCase() ?? 'TEXT'}" VALIGN="BOTTOM" HEIGHT="${pxToPoints(
          fontsize * lineHeight
        )}">${text}</TD></TR>`
    )
  return `<TABLE BORDER="0" CELLBORDER="0" CELLPADDING="0" CELLSPACING="0">${rows}</TABLE>`
}
export function nodeIcon(src: string) {
  return `<IMG SRC="${src}" SCALE="TRUE"/>`
}

export function nodeLabel(node: ComputedNode) {
  const lines = [
    wrapToHTML({
      text: node.title,
      fontsize: 18,
      maxchars: 35,
      color: Colors[node.color].hiContrast,
      align: 'center'
    })
  ]
  if (isTruthy(node.technology)) {
    lines.push(
      wrapToHTML({
        text: node.technology,
        fontsize: 12,
        maxchars: 50,
        align: 'center',
        color: Colors[node.color].loContrast
      })
    )
  }
  if (isTruthy(node.description)) {
    lines.push(
      wrapToHTML({
        text: node.description,
        fontsize: 14,
        maxchars: 45,
        color: Colors[node.color].loContrast
      })
    )
  }
  if (lines.length === 1 && !node.icon) {
    return `<${lines[0]}>`
  }
  const rows = lines.map(line => `<TR><TD ALIGN="CENTER">${line}</TD></TR>`)
  if (node.icon) {
    rows.unshift(`<TR><TD HEIGHT="${IconSizePoints}">${nodeIcon(node.icon)}</TD></TR>`)
  }
  return `<<TABLE BORDER="0" CELLBORDER="0" CELLPADDING="0" CELLSPACING="4">${rows}</TABLE>>`
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
  return `<<TABLE BORDER="0" CELLBORDER="0" CELLPADDING="1.5" CELLSPACING="0"><TR><TD>${html}</TD></TR></TABLE>>`
}
