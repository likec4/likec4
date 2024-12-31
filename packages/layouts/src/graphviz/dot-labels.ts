import {
  type ComputedEdge,
  type ComputedNode,
  type ElementThemeColorValues,
  DefaultRelationshipColor,
  defaultTheme as Theme,
} from '@likec4/core'
import { isDefined, isTruthy, only } from 'remeda'
import wordWrap from 'word-wrap'
import { IconSizePoints, pxToPoints } from './utils'

export function sanitize(text: string) {
  return text.trim().replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}

export function wrap(text: string, maxChars: number, maxLines?: number) {
  let lines = wordWrap(text, {
    width: maxChars,
    indent: '',
    escape: sanitize,
  }).split('\n')
  if (isDefined(maxLines) && maxLines > 0 && lines.length > maxLines) {
    lines = lines.slice(0, maxLines - 1)
  }
  return lines
}

function wrapWithFont({
  text,
  maxchars,
  fontsize,
  maxLines,
  bold,
  color,
}: {
  text: string
  maxchars: number
  fontsize: number
  maxLines?: number
  bold?: boolean
  color?: string | undefined
}): string {
  let html = wrap(text, maxchars, maxLines).join('<BR/>')
  if (bold) {
    html = `<B>${html}</B>`
  }
  const Color = color ? ` COLOR="${color}"` : ``
  return `<FONT POINT-SIZE="${pxToPoints(fontsize)}"${Color}>${html}</FONT>`
}

/**
 * "Faking" a node icon with a blue square
 * to preserve space for real icons.
 * #112233
 */
export function nodeIcon() {
  return `<TABLE FIXEDSIZE="TRUE" BGCOLOR="#112233" WIDTH="${IconSizePoints}" HEIGHT="${IconSizePoints}" BORDER="0" CELLPADDING="0" CELLSPACING="0"><TR><TD> </TD></TR></TABLE>`
}

export function nodeLabel(node: ComputedNode, colorValues: ElementThemeColorValues) {
  const hasIcon = isTruthy(node.icon)
  const lines = [
    wrapWithFont({
      text: node.title,
      fontsize: 19,
      maxchars: 35,
      maxLines: 3,
    }),
  ]
  if (isTruthy(node.technology)) {
    lines.push(
      wrapWithFont({
        text: node.technology,
        fontsize: 12,
        maxchars: hasIcon ? 35 : 45,
        maxLines: 1,
        color: colorValues.loContrast,
      }),
    )
  }
  if (isTruthy(node.description)) {
    lines.push(
      wrapWithFont({
        text: node.description,
        fontsize: 14,
        maxchars: hasIcon ? 35 : 45,
        maxLines: 5,
        color: colorValues.loContrast,
      }),
    )
  }
  if (lines.length === 1 && !hasIcon) {
    return `<${lines[0]}>`
  }

  const rowMapper = hasIcon
    ? (line: string, idx: number, all: string[]) => {
      let cell = `<TD ALIGN="TEXT" BALIGN="LEFT">${line}</TD>`
      // if first row, prepend columns with ROWSPAN
      if (idx === 0) {
        const rowspan = all.length > 1 ? ` ROWSPAN="${all.length}"` : ''
        let leftwidth = 76 // icon is 60px, plus 10px here and plus 10px padding from node margin
        if (node.shape === 'queue' || node.shape === 'mobile') {
          // add 20px padding more
          leftwidth += 20
        }
        // prepend empty cell (left padding)
        cell = `<TD${rowspan} WIDTH="${leftwidth}"> </TD>${cell}`
        // append empty cell (right padding)
        cell = `${cell}<TD${rowspan} WIDTH="16"> </TD>`
      }
      return `<TR>${cell}</TR>`
    }
    : (line: string) => {
      return `<TR><TD>${line}</TD></TR>`
    }
  const rows = lines.map(rowMapper).join('')
  return `<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="6">${rows}</TABLE>>`
}

export function compoundLabel(node: ComputedNode, color?: string) {
  const html = wrapWithFont({
    text: node.title.toUpperCase(),
    maxchars: 50,
    fontsize: 11,
    maxLines: 1,
    bold: true,
    color,
  })
  if (html.includes('<BR/>')) {
    return `<<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="0"><TR><TD ALIGN="TEXT" BALIGN="LEFT">${html}</TD></TR></TABLE>>`
  }
  return `<${html}>`
}

export const EDGE_LABEL_MAX_CHARS = 40
const BGCOLOR = `BGCOLOR="${Theme.relationships[DefaultRelationshipColor].labelBgColor}A0"`

export function edgelabel({ label, technology }: ComputedEdge) {
  const lines = [] as string[]
  if (isTruthy(label)) {
    lines.push(
      wrapWithFont({
        text: label,
        maxchars: EDGE_LABEL_MAX_CHARS,
        fontsize: 14,
        maxLines: 5,
        bold: label === '[...]',
      }),
    )
  }
  // if (isTruthy(description)) {
  //   lines.push(
  //     wrapWithFont({
  //       text: description,
  //       maxchars: EDGE_LABEL_MAX_CHARS,
  //       maxLines: 4,
  //       fontsize: 14
  //     })
  //   )
  // }
  if (isTruthy(technology)) {
    lines.push(
      wrapWithFont({
        text: `[ ${technology} ]`,
        fontsize: 12,
        maxLines: 1,
        maxchars: EDGE_LABEL_MAX_CHARS,
      }),
    )
  }
  if (lines.length === 0) {
    return null
  }
  const oneline = only(lines)
  if (oneline && !oneline.includes('<BR/>')) {
    return `<${oneline}>`
  }
  const rows = lines.map(line => `<TR><TD ALIGN="TEXT" BALIGN="LEFT">${line}</TD></TR>`).join('')
  return `<<TABLE BORDER="0" CELLPADDING="3" CELLSPACING="0" ${BGCOLOR}>${rows}</TABLE>>`
}

export function stepEdgeLabel(step: number, text?: string | null) {
  const num = `<TABLE BORDER="0" CELLPADDING="6" ${BGCOLOR}><TR><TD WIDTH="20" HEIGHT="20"><FONT POINT-SIZE="${
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
    wrapWithFont({
      text,
      maxchars: EDGE_LABEL_MAX_CHARS,
      fontsize: 14,
    }),
    `</TD>`,
    `</TR>`,
    `</TABLE>`,
  ]
  return `<${html.join('')}>`
}
