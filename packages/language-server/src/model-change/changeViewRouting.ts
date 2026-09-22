import { type ViewChange, invariant, nonNullable } from '@likec4/core'
import { GrammarUtils } from 'langium'
import { findLast } from 'remeda'
import { TextEdit } from 'vscode-languageserver-types'
import { type ParsedAstView, type ParsedLikeC4LangiumDocument, ast } from '../ast'
import type { LikeC4Services } from '../module'

const { findNodeForKeyword, findNodeForProperty } = GrammarUtils

type ChangeViewRoutingArg = {
  view: ParsedAstView
  doc: ParsedLikeC4LangiumDocument
  viewAst: ast.LikeC4View
  routing: ViewChange.ChangeRouting['routing']
}

/**
 * Writes the view routing to the source, mirroring the parser precedence:
 * an existing `routing` property, else the last `autoLayout` rule, else a new property.
 */
export function changeViewRouting(_services: LikeC4Services, {
  view,
  viewAst,
  routing,
}: ChangeViewRoutingArg): TextEdit {
  invariant(routing === 'spline' || routing === 'ortho', `Invalid routing: ${routing}`)
  invariant(viewAst.body, `View ${view.id} has no body`)
  const body = viewAst.body
  const viewCstNode = nonNullable(viewAst.$cstNode, 'viewCstNode')

  const props: ReadonlyArray<ast.ViewProperty | ast.DynamicViewProperty> = body.props
  const property = props.find(ast.isViewRoutingProperty)
  const propertyValue = property && findNodeForProperty(property.$cstNode, 'value')
  if (propertyValue) {
    return TextEdit.replace(propertyValue.range, routing)
  }

  const rule = findLast(body.rules, ast.isViewRuleAutoLayout)
  if (rule?.$cstNode) {
    const parameter = rule.routing && findNodeForProperty(rule.$cstNode, 'routing')
    return parameter
      ? TextEdit.replace(parameter.range, routing)
      : TextEdit.insert(rule.$cstNode.range.end, ` ${routing}`)
  }

  const anchor = (props.at(-1)?.$cstNode ?? body.tags?.$cstNode)?.range.end
    ?? nonNullable(findNodeForKeyword(body.$cstNode, '{'), 'Opening brace not found').range.end
  const closingBrace = nonNullable(findNodeForKeyword(body.$cstNode, '}'), 'Closing brace not found')
  const indent = ' '.repeat(viewCstNode.range.start.character + 2)
  const suffix = closingBrace.range.start.line === anchor.line
    ? '\n' + ' '.repeat(viewCstNode.range.start.character)
    : ''
  return TextEdit.insert(anchor, `\n${indent}routing ${routing}${suffix}`)
}
