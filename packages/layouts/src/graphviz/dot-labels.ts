import {
  type ComputedNode,
  DefaultRelationshipColor,
  defaultTheme as Theme,
  ElementColors as Colors
} from '@likec4/core'
import { isEmpty, isTruthy } from 'remeda'
import wordWrap from 'word-wrap'
import { IconSizePoints, pxToPoints } from './utils'

export function sanitize(text: string) {
  return text.trim().replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

export function wrap(text: string, maxChars: number) {
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
}): string {
  const Color = color ? ` COLOR="${color}"` : ``
  let rows = wrap(text, maxchars)
    .map(text => (isEmpty(text) ? ' ' : text))
    .map(text => (bold ? `<B>${text}</B>` : text))
    .map(text => `<FONT POINT-SIZE="${pxToPoints(fontsize)}"${Color}>${text}</FONT>`)

  if (rows.length === 1) {
    return rows[0]!
  }
  // Change row height if line height is not 1
  const Gap = Math.max(pxToPoints(Math.floor(fontsize * (lineHeight - 1))), 1)
  const ALIGN = align ? ` ALIGN="${align.toUpperCase()}"` : ''
  return [
    `<TABLE${ALIGN} BORDER="0" CELLPADDING="0" CELLSPACING="${Gap}">`,
    ...rows.map(rowText => `<TR><TD${ALIGN}>${rowText}</TD></TR>`),
    `</TABLE>`
  ].join('')
}

/**
 * "Faking" a node icon with a blue square
 * to preserve space for real icons.
 * #112233
 */
export function nodeIcon(_src: string) {
  return `<TABLE FIXEDSIZE="TRUE" BGCOLOR="#112233" WIDTH="${IconSizePoints}" HEIGHT="${IconSizePoints}" BORDER="0" CELLPADDING="0" CELLSPACING="0"><TR><TD> </TD></TR></TABLE>`
}

export function nodeLabel(node: ComputedNode) {
  const lines = [
    wrapToHTML({
      text: node.title,
      fontsize: 20,
      maxchars: 30,
      lineHeight: 1.2,
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
  return `<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4">${joinedRows}</TABLE>>`
}

export function compoundLabel(node: ComputedNode, color?: string) {
  const html = wrapToHTML({
    text: node.title.toUpperCase(),
    maxchars: 40,
    fontsize: 14.5,
    lineHeight: 1.2,
    bold: true,
    color: color ?? Colors[node.color].loContrast
  })
  return `<${html}>`
}

export const EDGE_LABEL_MAX_CHARS = 40

export function edgeLabel(text: string) {
  const html = wrapToHTML({
    text,
    maxchars: EDGE_LABEL_MAX_CHARS,
    fontsize: 14,
    lineHeight: 1.1,
    bold: text === '[...]',
    align: 'left'
  })
  return `<<TABLE BORDER="0" CELLPADDING="4" CELLSPACING="0" ${BGCOLOR}><TR><TD>${html}</TD></TR></TABLE>>`
}

const BGCOLOR = `BGCOLOR="${Theme.relationships[DefaultRelationshipColor].labelBgColor}A0"`

export function stepEdgeLabel(step: number, text?: string | null) {
  const num =
    `<TABLE FIXEDSIZE="TRUE" BORDER="0" CELLPADDING="6" ${BGCOLOR}><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="${
      pxToPoints(14)
    }"><B>${step}</B></FONT></TD></TR></TABLE>`

  if (!isTruthy(text)) {
    return `<${num}>`
  }

  let html = [
    `<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="3">`,
    `<TR>`,
    `<TD>${num}</TD>`,
    `<TD ${BGCOLOR} CELLPADDING="2">`,
    wrapToHTML({
      text,
      maxchars: EDGE_LABEL_MAX_CHARS,
      fontsize: 14,
      lineHeight: 1.1,
      align: 'left'
    }),
    `</TD>`,
    `</TR>`,
    `</TABLE>`
  ]
  return `<${html.join('')}>`
}
