import { Colors, type ComputedNode } from '@likec4/core'
import { isEmpty, isTruthy } from 'remeda'
import wordWrap from 'word-wrap'
import { IconSize, pxToPoints } from './graphviz-utils'

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
  bold,
  color,
  align = 'center'
}: {
  text: string
  maxchars: number
  fontsize: number
  bold?: boolean
  color?: string
  align?: 'left' | 'right' | 'center'
}) {
  const br = align ? `<BR ALIGN="${align.toUpperCase()}"/>` : '<BR/>'
  let html = wrap(text, maxchars)
    .map(text => (isEmpty(text) ? ' ' : text))
    .map((line, idx, arr) => {
      if (arr.length === 1) {
        return line
      }
      if (idx === 0) {
        return line + '<BR/>'
      }
      return line + br
    })
    .join('')
  if (bold) {
    html = `<B>${html}</B>`
  }
  return `<FONT ${color ? `COLOR="${color}" ` : ``}POINT-SIZE="${pxToPoints(
    fontsize
  )}">${html}</FONT>`
}
export function nodeIcon(src: string) {
  return `<IMG SRC="${src}" SCALE="TRUE" WIDTH="${IconSize}" HEIGHT="${IconSize}"/>`
}

export function nodeLabel(node: ComputedNode) {
  const lines = [
    wrapToHTML({
      text: node.title,
      fontsize: 18,
      maxchars: 35,
      color: Colors[node.color].hiContrast
    })
  ]
  if (node.icon) {
    lines.unshift(nodeIcon(node.icon))
  }
  if (isTruthy(node.technology)) {
    lines.push(
      wrapToHTML({
        text: node.technology,
        fontsize: 12,
        maxchars: 45,
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
  const rows = lines.map(line => `<TR><TD>${line}</TD></TR>`).join('')
  return `<<TABLE BORDER="0" CELLBORDER="0" CELLPADDING="0" CELLSPACING="6">${rows}</TABLE>>`
}

export function edgeLabel(text: string) {
  const lines = [
    wrapToHTML({
      text,
      maxchars: 40,
      fontsize: 14,
      align: 'left'
    })
  ]
  const rows = lines.map(line => `<TR><TD>${line}</TD></TR>`).join('')
  return `<<TABLE BORDER="0" CELLBORDER="0" CELLPADDING="3" CELLSPACING="0">${rows}</TABLE>>`
}
