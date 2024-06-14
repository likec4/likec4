import { type ComputedNode, ElementColors as Colors } from '@likec4/core'
import { DefaultRelationshipColor, defaultTheme as Theme } from '@likec4/core'
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
  const Color = color ? ` COLOR="${color}"` : ``
  let rows = wrap(text, maxchars)
    .map(text => (isEmpty(text) ? ' ' : text))
    .map(text => (bold ? `<B>${text}</B>` : text))
    .map(text => `<FONT POINT-SIZE="${pxToPoints(fontsize)}"${Color}>${text}</FONT>`)

  if (rows.length === 1) {
    return rows[0]
  }
  // Change row height if line height is not 1
  const ALIGN = align ? ` ALIGN="${align.toUpperCase()}"` : ''
  const TDheight = lineHeight !== 1 ? ` VALIGN="BOTTOM" HEIGHT="${pxToPoints(fontsize * lineHeight)}"` : ''
  rows = rows.map(text => `<TR><TD${ALIGN}${TDheight}>${text}</TD></TR>`)
  return `<TABLE${ALIGN} BORDER="0" CELLBORDER="0" CELLPADDING="0" CELLSPACING="0">${rows.join('')}</TABLE>`
}

/**
 * "Faking" a node icon with a blue square
 * to preserve space for real icons.
 * #11223300
 */
export function nodeIcon(_src: string) {
  return `<TABLE FIXEDSIZE="TRUE" BGCOLOR="#11223300" WIDTH="${IconSizePoints}" HEIGHT="${IconSizePoints}" BORDER="0" CELLBORDER="0" CELLPADDING="0" CELLSPACING="0"><TR><TD> </TD></TR></TABLE>`
}

export function nodeLabel(node: ComputedNode) {
  const lines = [
    wrapToHTML({
      text: node.title,
      fontsize: 20,
      maxchars: 30,
      color: Colors[node.color].hiContrast
    })
  ]
  if (isTruthy(node.technology)) {
    lines.push(
      wrapToHTML({
        text: node.technology,
        fontsize: 12,
        lineHeight: 1.125,
        maxchars: 40,
        color: Colors[node.color].loContrast
      })
    )
  }
  if (isTruthy(node.description)) {
    lines.push(
      wrapToHTML({
        text: node.description,
        fontsize: 14,
        lineHeight: 1.25,
        maxchars: 40,
        color: Colors[node.color].loContrast
      })
    )
  }
  if (lines.length === 1 && !node.icon) {
    return `<${lines[0]}>`
  }
  const rows = lines.map(line => `<TR><TD>${line}</TD></TR>`)
  if (node.icon) {
    rows.unshift(
      `<TR><TD ALIGN="CENTER" HEIGHT="${IconSizePoints}">${nodeIcon(node.icon)}</TD></TR>`
    )
  }
  const joinedRows = rows.join('')
  return `<<TABLE BORDER="0" CELLBORDER="0" CELLPADDING="0" CELLSPACING="4">${joinedRows}</TABLE>>`
}

export function edgeLabel(text: string) {
  const html = wrapToHTML({
    text,
    maxchars: 35,
    fontsize: 13,
    lineHeight: 1.25,
    bold: text === '[...]',
    align: 'left'
  })
  return `<<TABLE BORDER="0" CELLBORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD WIDTH="2"></TD><TD>${html}</TD></TR></TABLE>>`
}

const BGCOLOR = `BGCOLOR="${Theme.relationships[DefaultRelationshipColor].labelBgColor}"`

export function stepEdgeLabel(step: number, text?: string | null) {
  const num =
    `<TABLE BORDER="0" CELLBORDER="0" CELLPADDING="0" CELLSPACING="0" ${BGCOLOR} STYLE="ROUNDED" FIXEDSIZE="TRUE"><TR><TD ALIGN="CENTER" WIDTH="20" HEIGHT="18" VALIGN="MIDDLE"><FONT POINT-SIZE="${
      pxToPoints(14)
    }"><B>${step}</B></FONT></TD></TR></TABLE>`
  if (!isTruthy(text)) {
    return `<${num}>`
  }
  const html = wrapToHTML({
    text,
    maxchars: 30,
    fontsize: 13,
    lineHeight: 1.25,
    align: 'left'
  })
  return `<<TABLE BORDER="0" CELLBORDER="0" CELLPADDING="0" CELLSPACING="4"><TR><TD VALIGN="MIDDLE">${num}</TD><TD VALIGN="TOP">${html}</TD></TR></TABLE>>`
}
