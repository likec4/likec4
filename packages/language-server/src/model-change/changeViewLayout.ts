import { type ViewChange, invariant } from '@likec4/core'
import { ops, print } from '@likec4/generators/likec4'
import { GrammarUtils } from 'langium'
import { findLast, isNumber } from 'remeda'
import { TextEdit } from 'vscode-languageserver-types'
import { type ParsedAstView, type ParsedLikeC4LangiumDocument, ast } from '../ast'
import type { LikeC4Services } from '../module'

const { findNodeForKeyword } = GrammarUtils

type ChangeViewLayoutArg = {
  view: ParsedAstView
  doc: ParsedLikeC4LangiumDocument
  viewAst: ast.LikeC4View
  layout: ViewChange.ChangeAutoLayout['layout']
}

export function changeViewLayout(_services: LikeC4Services, {
  view,
  viewAst,
  layout,
}: ChangeViewLayoutArg): TextEdit {
  // Should never happen
  const viewCstNode = viewAst.$cstNode
  invariant(viewAst.body, `View ${view.id} has no body`)
  invariant(viewCstNode, 'viewCstNode')
  const existingRule = findLast(viewAst.body.rules, ast.isViewRuleAutoLayout)

  let newRule = print(ops.views.viewRuleAutoLayout(), layout)

  if (existingRule && existingRule.$cstNode) {
    return TextEdit.replace(existingRule.$cstNode.range, newRule)
  }

  const insertPos = findNodeForKeyword(viewAst.body.$cstNode, '}')?.range
  invariant(insertPos, 'Closing brace not found')
  const indent = ' '.repeat(insertPos.start.character)

  return TextEdit.replace(insertPos, `  ${newRule}\n${indent}}`)
}
