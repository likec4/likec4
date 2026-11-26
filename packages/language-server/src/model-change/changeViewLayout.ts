import type { LikeC4Services } from '../module'
import { type ViewChange, invariant } from '@likec4/core'
import { ops, print } from '@likec4/generators/likec4'
import { GrammarUtils } from 'langium'
import { findLast } from 'remeda'
import { TextEdit } from 'vscode-languageserver-types'
import { type ParsedAstView, type ParsedLikeC4LangiumDocument, ast } from '../ast'

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

  // A change without compoundSep (the diagram only edits direction and spacing)
  // keeps the one written in the source; `null` removes it
  const compoundSep = layout.compoundSep === undefined ? existingRule?.compoundSep : layout.compoundSep

  let { rankSep, nodeSep } = layout
  if (compoundSep != null) {
    // compoundSep is written after rankSep and nodeSep, so a change that leaves them out
    // (the parsed view drops a 0 nodeSep) keeps the ones written in the source
    rankSep = rankSep === undefined ? existingRule?.rankSep : rankSep
    nodeSep = nodeSep === undefined ? existingRule?.nodeSep : nodeSep
    invariant(
      rankSep != null && nodeSep != null,
      `Invalid autoLayout of view ${view.id}: compoundSep ${compoundSep} needs rankSep and nodeSep, set them or set compoundSep to null`,
    )
  }

  let newRule = print(ops.views.viewRuleAutoLayout(), { ...layout, rankSep, nodeSep, compoundSep })
  if (existingRule?.routing) {
    newRule += ` ${existingRule.routing}`
  }

  if (existingRule && existingRule.$cstNode) {
    return TextEdit.replace(existingRule.$cstNode.range, newRule)
  }

  const insertPos = findNodeForKeyword(viewAst.body.$cstNode, '}')?.range
  invariant(insertPos, 'Closing brace not found')
  const indent = ' '.repeat(insertPos.start.character)

  return TextEdit.replace(insertPos, `  ${newRule}\n${indent}}`)
}
