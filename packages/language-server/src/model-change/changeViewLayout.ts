import { type AutoLayoutDirection, invariant } from '@likec4/core'
import { GrammarUtils } from 'langium'
import { TextEdit } from 'vscode-languageserver-types'
import { ast, type ParsedAstView, type ParsedLikeC4LangiumDocument, toAstViewLayoutDirection } from '../ast'
import type { LikeC4Services } from '../module'

const { findNodeForProperty, findNodeForKeyword } = GrammarUtils

type ChangeViewLayoutArg = {
  view: ParsedAstView
  doc: ParsedLikeC4LangiumDocument
  viewAst: ast.LikeC4View
  layout: AutoLayoutDirection
}

export function changeViewLayout(_services: LikeC4Services, {
  view,
  viewAst,
  layout
}: ChangeViewLayoutArg): TextEdit {
  // Should never happen
  invariant(viewAst.body, `View ${view.id} has no body`)
  const viewCstNode = viewAst.$cstNode
  invariant(viewCstNode, 'viewCstNode')
  const newlayout = toAstViewLayoutDirection(layout)
  const existingRule = viewAst.body.rules.findLast(ast.isViewRuleAutoLayout) as ast.ViewRuleAutoLayout | undefined

  if (existingRule && existingRule.$cstNode) {
    const directionCstNode = findNodeForProperty(existingRule.$cstNode, 'direction')
    if (directionCstNode) {
      return TextEdit.replace(directionCstNode.range, newlayout)
    }
    return TextEdit.replace(existingRule.$cstNode.range, `autoLayout ${newlayout}`)
  }

  const insertPos = findNodeForKeyword(viewAst.body.$cstNode, '}')?.range.start
  invariant(insertPos, 'Closing brace not found')
  const insert = `  autoLayout ${newlayout}\n` + ' '.repeat(insertPos.character)

  return TextEdit.insert(insertPos, insert)
}
