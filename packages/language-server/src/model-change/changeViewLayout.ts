import { invariant, type ViewChange } from '@likec4/core'
import { GrammarUtils } from 'langium'
import { findLast, isNumber } from 'remeda'
import { TextEdit } from 'vscode-languageserver-types'
import { ast, type ParsedAstView, type ParsedLikeC4LangiumDocument, toAstViewLayoutDirection } from '../ast'
import type { LikeC4Services } from '../module'

const { findNodeForProperty, findNodeForKeyword } = GrammarUtils

type ChangeViewLayoutArg = {
  view: ParsedAstView
  doc: ParsedLikeC4LangiumDocument
  viewAst: ast.LikeC4View
  layout: ViewChange.ChangeAutoLayout['layout']
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
  const newdirection = toAstViewLayoutDirection(layout.direction)
  const existingRule = findLast(viewAst.body.rules, ast.isViewRuleAutoLayout) as ast.ViewRuleAutoLayout | undefined

  let newRule = `autoLayout ${newdirection}`

  if (isNumber(layout.rankSep)) {
    newRule += ` ${layout.rankSep}`
    if (isNumber(layout.nodeSep)) {
      newRule += ` ${layout.nodeSep}`
    }
  }

  if (existingRule && existingRule.$cstNode) {
    return TextEdit.replace(existingRule.$cstNode.range, newRule)
  }

  const insertPos = findNodeForKeyword(viewAst.body.$cstNode, '}')?.range.start
  invariant(insertPos, 'Closing brace not found')
  const insert = `\t${newRule}\n\t`

  return TextEdit.insert(insertPos, insert)
}
