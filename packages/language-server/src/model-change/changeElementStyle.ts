import { type Fqn, invariant, isAncestor, type NonEmptyArray, nonNullable } from '@likec4/core'
import { GrammarUtils } from 'langium'
import { entries, filter, findLast, isNumber, last, partition, toPairs } from 'remeda'
import { type Range, TextEdit } from 'vscode-languageserver-protocol'
import { ast, type ParsedAstElementView, type ParsedAstView, type ParsedLikeC4LangiumDocument } from '../ast'
import type { FqnIndex } from '../model'
import type { LikeC4Services } from '../module'
import type { ChangeView } from '../protocol'

const { findNodeForKeyword, findNodeForProperty } = GrammarUtils

const asViewStyleRule = (target: string, style: ChangeView.ChangeElementStyle['style'], indent = 0) => {
  const indentStr = indent > 0 ? ' '.repeat(indent) : ''
  return [
    indentStr + `style ${target} {`,
    ...entries(style).map(([key, value]) => indentStr + `  ${key} ${value}`),
    indentStr + `}`
  ].join('\n')
}

type ChangeElementStyleArg = {
  view: ParsedAstView
  doc: ParsedLikeC4LangiumDocument
  viewAst: ast.LikeC4View
  targets: NonEmptyArray<Fqn>
  style: ChangeView.ChangeElementStyle['style']
}

/**
 * - is ViewRuleStyle
 * - has exactly one target
 * - the target is an ElementRef to the given fqn
 */
const isMatchingViewRule =
  (fqn: string, index: FqnIndex) => (rule: ast.ViewRule | ast.DynamicViewRule): rule is ast.ViewRuleStyle => {
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

export function changeElementStyle(services: LikeC4Services, {
  view,
  viewAst,
  targets,
  style
}: ChangeElementStyleArg): TextEdit[] {
  const viewCstNode = viewAst.$cstNode
  invariant(viewCstNode, 'viewCstNode')
  const insertPos = last(viewAst.body.rules)?.$cstNode?.range.end
    ?? last(viewAst.body.props)?.$cstNode?.range.end
    ?? viewAst.body.$cstNode?.range.start
  invariant(insertPos, 'insertPos is not defined')
  const indent = viewCstNode.range.start.character + 2
  const fqnIndex = services.likec4.FqnIndex
  const styleRules = filter(viewAst.body.rules, ast.isViewRuleStyle)
  const viewOf = view.__ === 'element' ? view.viewOf : null
  // Find existing rules
  const existing = [] as Array<{ fqn: Fqn; rule: ast.ViewRuleStyle }>
  const insert = [] as Array<{ fqn: Fqn }>
  // const existingRules = [] as Array<{ fqn: Fqn, rule: ast.ViewRuleStyle }>
  targets.forEach(target => {
    const rule = findLast(styleRules, isMatchingViewRule(target, fqnIndex))
    // remove viewOf from the target to shorten the fqn
    const fqn = (viewOf && isAncestor(viewOf, target) ? target.substring(viewOf.length + 1) : target) as Fqn
    if (rule) {
      existing.push({ fqn, rule })
    } else {
      insert.push({ fqn })
    }
  })

  const modifiedRange = {
    start: insertPos,
    end: insertPos
  }

  const includeRange = (range: Range) => {
    if (range.start.line <= modifiedRange.start.line) {
      if (range.start.line == modifiedRange.start.line) {
        modifiedRange.start.character = Math.min(range.start.character, modifiedRange.start.character)
      } else {
        modifiedRange.start.line = range.start.line
        modifiedRange.start.character = range.start.character
      }
    }
    if (range.end.line >= modifiedRange.end.line) {
      if (range.end.line == modifiedRange.end.line) {
        modifiedRange.end.character = Math.max(range.end.character, modifiedRange.end.character)
      } else {
        modifiedRange.end.line = range.end.line
        modifiedRange.end.character = range.end.character
      }
    }
  }

  const edits = [] as TextEdit[]

  if (insert.length > 0) {
    const linesToInsert = [
      '',
      ...insert.map(({ fqn }) => asViewStyleRule(fqn, style, indent))
    ]
    edits.push(
      TextEdit.insert(
        insertPos,
        linesToInsert.join('\n')
      )
    )
    modifiedRange.start = {
      line: insertPos.line + 1,
      character: indent
    }
    modifiedRange.end = {
      line: insertPos.line + linesToInsert.length,
      character: indent + (last(linesToInsert)?.length ?? 0) + 1
    }
  }

  if (existing.length > 0) {
    for (const { rule } of existing) {
      const ruleCstNode = rule.$cstNode
      invariant(ruleCstNode, 'RuleCstNode not found')
      for (const [key, _value] of entries.strict(style)) {
        const value = isNumber(_value) ? _value.toString() + '%' : _value
        const ruleProp = rule.styleprops.find(p => p.key === key)
        // replace existing  property
        if (ruleProp && ruleProp.$cstNode) {
          const { range: { start, end } } = nonNullable(
            findNodeForProperty(ruleProp.$cstNode, 'value'),
            'cant find value cst node'
          )
          includeRange({
            start,
            end: {
              line: end.line,
              character: start.character + value.length + 1
            }
          })
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
          start: {
            line: insertPos.line + 1,
            character: indentStr.length + 1
          },
          end: {
            line: insertPos.line + 1,
            character: insertKeyValue.length + 1
          }
        })
      }
    }
  }
  return edits
}
