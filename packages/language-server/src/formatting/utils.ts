import type { CstNode } from 'langium'
import type { Position, Range } from 'vscode-languageserver-types'

export function areOverlap(a: CstNode, b: CstNode): boolean {
  ;[a, b] = compareRanges(a, b) > 0 ? [b, a] : [a, b]

  return isInRagne(a.range, b.range.start)
}

export function compareRanges(a: CstNode, b: CstNode): number {
  const lineDiff = a.range.start.line - b.range.start.line

  return lineDiff !== 0 ? lineDiff : a.range.start.character - b.range.start.character
}

export function isInRagne(range: Range, pos: Position): boolean {
  return !(pos.line < range.start.line
    || pos.line > range.end.line
    || pos.line == range.start.line && pos.character < range.start.character
    || pos.line == range.end.line && pos.character > range.end.character)
}

export function isMultiline(node: CstNode | undefined): boolean {
  return !!node && node.range.start.line != node.range.end.line
}

/**
 * Check if two nodes are on the same line (one after another)
 * @param a - First node
 * @param b - Second node
 * @returns true if both nodes are defined and on the same line, false otherwise
 */
export function isSameLine(a: CstNode | undefined, b: CstNode | undefined): boolean {
  if (!a || !b) {
    return false
  }
  const [prev, next] = a.offset < b.offset ? [a, b] : [b, a]
  return prev.range.end.line === next.range.start.line
}

export function linesBetween(a: CstNode | undefined | null, b: CstNode | undefined | null): number {
  if (!a || !b) {
    return 0
  }
  const [prev, next] = a.offset < b.offset ? [a, b] : [b, a]
  return next.range.start.line - prev.range.end.line
}
