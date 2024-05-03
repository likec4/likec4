import { type AutoLayoutDirection, invariant } from '@likec4/core'
import { GrammarUtils } from 'langium'
import { last } from 'remeda'
import { TextEdit } from 'vscode-languageserver-protocol'
import { ast, type ParsedAstElementView, type ParsedLikeC4LangiumDocument, toAstViewLayoutDirection } from '../ast'
import type { LikeC4Services } from '../module'

const { findNodeForProperty } = GrammarUtils

type ChangeViewLayoutArg = {
  view: ParsedAstElementView
  doc: ParsedLikeC4LangiumDocument
  viewAst: ast.ElementView
  layout: AutoLayoutDirection
}

export function changeViewLayout(services: LikeC4Services, {
  view,
  viewAst,
  layout
}: ChangeViewLayoutArg): TextEdit[] {
  const viewCstNode = viewAst.$cstNode
  invariant(viewCstNode, 'viewCstNode')
  const newlayout = toAstViewLayoutDirection(layout)
  const existingRule = viewAst.body.rules.findLast(ast.isViewRuleAutoLayout)

  if (existingRule && existingRule.$cstNode) {
    const directionCstNode = findNodeForProperty(existingRule.$cstNode, 'direction')
    if (directionCstNode) {
      return [TextEdit.replace(directionCstNode.range, newlayout)]
    }
    return [TextEdit.replace(existingRule.$cstNode.range, `autoLayout ${newlayout}`)]
  }

  const insertPos = last(viewAst.body.rules)?.$cstNode?.range.end
    ?? last(viewAst.body.props)?.$cstNode?.range.end
    ?? viewAst.body.$cstNode?.range.start
  invariant(insertPos, 'insertPos is not defined')
  const indent = ' '.repeat(2 + viewCstNode.range.start.character)
  const insert = `\n\n${indent}autoLayout ${newlayout}`

  return [TextEdit.insert(insertPos, insert)]
}
