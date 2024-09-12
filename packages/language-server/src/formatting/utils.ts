import type { CstNode } from "langium"
import type { Position, Range } from "vscode-languageserver-types"


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

export function isMultiline(node: CstNode): boolean {
  return node.range.start.line != node.range.end.line
}