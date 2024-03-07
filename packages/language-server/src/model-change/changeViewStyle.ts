import { type Fqn, invariant, isAncestor, type NonEmptyArray, nonNullable } from '@likec4/core'
import { GrammarUtils } from 'langium'
import { findLast, last, partition } from 'remeda'
import { type Range, TextEdit } from 'vscode-languageserver-protocol'
import { ast, type ParsedAstElementView, type ParsedLikeC4LangiumDocument } from '../ast'
import type { FqnIndex } from '../model'
import type { LikeC4Services } from '../module'

const { findNodeForKeyword, findNodeForProperty } = GrammarUtils

const asViewStyleRule = (target: string, key: string, value: string, indent = 0) => {
  const indentStr = indent > 0 ? ' '.repeat(indent) : ''
  return [
    indentStr + `style ${target} {`,
    indentStr + `  ${key} ${value}`,
    indentStr + `}`
  ].join('\n')
}

type ChangeViewStyleArg = {
  view: ParsedAstElementView
  doc: ParsedLikeC4LangiumDocument
  viewAst: ast.ElementView
  key: string
  value: string
  targets: NonEmptyArray<Fqn>
}

/**
 * - is ViewRuleStyle
 * - has exactly one target
 * - the target is an ElementRef to the given fqn
 */
const isMatchingViewRule = (fqn: string, index: FqnIndex) => (rule: ast.ViewRule): rule is ast.ViewRuleStyle => {
  if (!ast.isViewRuleStyle(rule)) {
    return false
  }
  const [target, ...rest] = rule.targets
  if (!target || rest.length > 0 || !ast.isElementRef(target)) {
    return false
  }
  const ref = target.el.ref
  const _fqn = ref ? index.getFqn(ref) : null
  return _fqn === fqn
}

export function changeViewStyle(services: LikeC4Services, {
  view,
  viewAst,
  targets,
  key,
  value
}: ChangeViewStyleArg): TextEdit[] {
  const viewCstNode = viewAst.$cstNode
  invariant(viewCstNode, 'viewCstNode')
  const insertPos = last(viewAst.body.rules)?.$cstNode?.range.end
    ?? last(viewAst.body.props)?.$cstNode?.range.end
    ?? viewAst.body.$cstNode?.range.start
  invariant(insertPos, 'insertPos is not defined')
  const indent = viewCstNode.range.start.character + 2
  const fqnIndex = services.likec4.FqnIndex
  const styleRules = viewAst.body.rules.filter(ast.isViewRuleStyle)
  const viewOf = view.viewOf
  // Find existing rules
  const targetsWithRules = targets.map(target => {
    const rule = findLast(styleRules, isMatchingViewRule(target, fqnIndex))
    // remove viewOf from the target to shorten the fqn
    const fqn = viewOf && isAncestor(viewOf, target) ? target.substring(viewOf.length + 1) : target
    if (rule) {
      return {
        fqn,
        rule
      }
    } else {
      return {
        fqn
      }
    }
  })

  // separate targets with existing rules and targets to insert
  const [existing, insert] = partition(
    targetsWithRules,
    (a): a is { fqn: Fqn; rule: ast.ViewRuleStyle } => !!a.rule
  )

  const modifiedRange = {
    start: insertPos,
    end: insertPos
  }

  const includeRange = (range: Range) => {
    if (range.start.line < modifiedRange.start.line) {
      modifiedRange.start = range.start
    }
    if (range.end.line > modifiedRange.end.line) {
      modifiedRange.end = range.end
    }
  }

  const edits = [] as TextEdit[]

  if (insert.length > 0) {
    const linesToInsert = [
      '',
      ...insert.map(({ fqn }) => asViewStyleRule(fqn, key, value, indent))
    ]
    edits.push(
      TextEdit.insert(
        insertPos,
        linesToInsert.join('\n')
      )
    )
    modifiedRange.end = {
      line: modifiedRange.end.line + linesToInsert.length,
      character: last(linesToInsert)?.length ?? insertPos.character
    }
  }

  if (existing.length > 0) {
    for (const { rule } of existing) {
      const ruleCstNode = rule.$cstNode
      invariant(ruleCstNode, 'RuleCstNode not found')
      const ruleProp = rule.styleprops.find(p => p.key === key)
      // replace existing  property
      if (ruleProp && ruleProp.$cstNode) {
        const { range: { start, end } } = nonNullable(
          findNodeForProperty(ruleProp.$cstNode, 'value'),
          'cant find value cst node'
        )
        includeRange(ruleProp.$cstNode.range)
        edits.push(TextEdit.replace({ start, end }, value))
        continue
      }
      // insert new style property right after the opening brace
      const insertPos = findNodeForKeyword(ruleCstNode, '{')?.range.end
      invariant(insertPos, 'Opening brace not found')
      const indentStr = ' '.repeat(2 + ruleCstNode.range.start.character)
      const insertKeyValue = indentStr + key + ' ' + value
      edits.push(
        TextEdit.insert(
          insertPos,
          '\n' + insertKeyValue
        )
      )
      includeRange({
        start: insertPos,
        end: {
          line: insertPos.line + 1,
          character: insertKeyValue.length
        }
      })
    }
  }
  return edits
}
