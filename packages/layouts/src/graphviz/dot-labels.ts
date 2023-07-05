import { Colors, type ComputedEdge, type ComputedNode } from '@likec4/core'
import indentString from 'indent-string'
import { isEmpty, isTruthy } from 'remeda'
import stripIndent from 'strip-indent'
import wordWrap from 'word-wrap'
import { pxToPoints } from './graphviz-utils'

function wrap(text: string, maxChars: number) {
  return wordWrap(text, {
    width: maxChars,
    indent: '',
    escape: line => {
      return line.trim().replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    }
  }).split('\n')
}

function wrapToHTML({
  text,
  maxchars,
  fontsize,
  lineHeight = fontsize * 1.25,
  color
}: {
  text: string
  maxchars: number
  fontsize: number
  lineHeight?: number
  color?: string
}) {
  const pointSize = pxToPoints(fontsize)
  const font = (text: string) => `<FONT POINT-SIZE="${pointSize}"${color ? ` COLOR="${color}"` : ''}>${isEmpty(text) ? ' ' : text}</FONT>`
  const lines = wrap(text, maxchars)

  const head = lines.at(0)
  if (head && lines.length === 1) {
    return font(head)
  }
  const height = `HEIGHT="${pxToPoints(lineHeight)}"`
  const rows = indentString(
    lines.map(line => `<TR><TD ${height} VALIGN="BOTTOM">${font(line)}</TD></TR>`).join('\n'),
    2
  )
  return `<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="0">\n${rows}\n</TABLE>`
}

export function nodeLabel(node: ComputedNode) {
  // const lines = wrap(node.title, 35)
  //   .map(line => `<tr><td height="${pxToPoints(20)}"><font point-size="${pxToPoints(18)}">${line}</font></td></tr>`)\
  const title = wrapToHTML({
    text: node.title,
    fontsize: 18,
    maxchars: 35,
    color: Colors[node.color].hiContrast
  })

  if (isTruthy(node.description)) {
    const desc = wrapToHTML({
      text: node.description,
      fontsize: 14,
      maxchars: 50,
      color: Colors[node.color].loContrast
    })
    return stripIndent(`
    <<TABLE BORDER="0" CELLPADDING="0" CELLSPACING="4">
      <TR><TD>
        ${indentString(title, 9).trimStart()}
      </TD></TR>
      <TR><TD>
        ${indentString(desc, 9).trimStart()}
      </TD></TR>
    </TABLE>>`)
  }

  return `<${title}>`
}

export function edgeLabel(text: string) {
  const label = wrapToHTML({
    text,
    maxchars: 50,
    fontsize: 14,
    lineHeight: 16
  })
  return `<${label}>`
}
