import { invariant, type ViewChanges } from '@likec4/core'
import indentString from 'indent-string'
import { CstUtils, GrammarUtils } from 'langium'
import { TextEdit } from 'vscode-languageserver-protocol'
import { ast, type ParsedAstView, type ParsedLikeC4LangiumDocument } from '../ast'
import type { LikeC4Services } from '../module'
import { serializeToComment } from '../view-utils/manual-layout'

const { findNodeForProperty } = GrammarUtils

export type ManualLayoutArg = {
  view: ParsedAstView
  doc: ParsedLikeC4LangiumDocument
  viewAst: ast.LikeC4View
  nodes: ViewChanges.SaveManualLayout['nodes']
  edges: ViewChanges.SaveManualLayout['edges']
}

export function saveManualLayout(_services: LikeC4Services, {
  viewAst,
  nodes,
  edges
}: ManualLayoutArg): TextEdit {
  invariant(viewAst.$cstNode, 'invalid view.$cstNode')
  const commentCst = CstUtils.findCommentNode(viewAst.$cstNode, ['BLOCK_COMMENT'])
  let txt = serializeToComment({ nodes, edges })
  if (viewAst.$cstNode.range.start.character > 0) {
    txt = indentString(txt, viewAst.$cstNode.range.start.character)
    // const indent = ' '.repeat(viewAst.$cstNode.range.start.character)
    // txt = txt.split('\n').map(l => indent + l).join('\n')
  }
  if (commentCst) {
    // Do not indent the first line
    return TextEdit.replace(commentCst.range, txt.trimStart())
  }
  return TextEdit.insert(
    {
      line: viewAst.$cstNode.range.start.line,
      character: 0
    },
    txt + '\n'
  )
}
