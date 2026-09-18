import {
  type DeploymentFqn,
  type Fqn,
  type NonEmptyArray,
  type ViewChange,
  _type,
  invariant,
  isAncestor,
  nonNullable,
} from '@likec4/core'
import { type AstNode, GrammarUtils } from 'langium'
import { entries, filter, findLast, isTruthy, last } from 'remeda'
import { type Range, TextEdit } from 'vscode-languageserver-types'
import { type ParsedAstView, type ParsedLikeC4LangiumDocument, ast } from '../ast'
import type { FqnIndex } from '../model'
import type { LikeC4Services } from '../module'

const { findNodeForKeyword } = GrammarUtils

const asViewStyleRule = (target: string, style: ViewChange.ChangeElementStyle['style'], indent = 0) => {
  const indentStr = indent > 0 ? ' '.repeat(indent) : ''
  return [
    indentStr + `\tstyle ${target} {`,
    ...entries(style).map(([key, value]) =>
      indentStr + `\t\t${key} ${key === 'opacity' ? value.toString() + '%' : value}`
    ),
    indentStr + `\t}`,
  ]
}

type ChangeElementStyleArg = {
  view: ParsedAstView
  doc: ParsedLikeC4LangiumDocument
  viewAst: ast.LikeC4View
  targets: NonEmptyArray<Fqn | DeploymentFqn>
  style: ViewChange.ChangeElementStyle['style']
}

/**
 * - is ViewRuleStyle
 * - has exactly one target
 * - the target is an ElementRef to the given fqn
 */
const isMatchingViewRule = (fqn: string, index: FqnIndex) =>
(
  rule: ast.ViewRule | ast.DynamicViewRule | ast.DeploymentViewRule,
): rule is ast.ViewRuleStyle | ast.DeploymentViewRuleStyle => {
  if (!ast.isViewRuleStyle(rule) && !ast.isDeploymentViewRuleStyle(rule)) {
    return false
  }
  const target = rule.targets.value
  if (
    !target || isTruthy(rule.targets.prev) || target.$type !== 'FqnRefExpr' || isTruthy(target.selector)
  ) {
    return false
  }
  const ref = target.ref?.value?.ref
  const _fqn = ref ? index.resolve(ref) : null
  return _fqn === fqn
}

export function changeElementStyle(services: LikeC4Services, {
  view,
  viewAst,
  targets,
  style,
}: ChangeElementStyleArg): {
  modifiedRange: Range
  edits: TextEdit[]
} {
  // Should never happen
  invariant(viewAst.body, `View ${view.id} has no body`)

  const viewCstNode = nonNullable(viewAst.$cstNode, 'cant find view cst node')
  const viewBodyCstNode = nonNullable(viewAst.body.$cstNode, 'cant find view body cst node')

  const indent = viewCstNode.range.start.character

  const insertPos = nonNullable(findNodeForKeyword(viewBodyCstNode, '}'), 'cant find closing brace').range.start
  insertPos.character = 0

  const edits = [] as TextEdit[]

  const fqnIndex = services.likec4.FqnIndex
  const styleRules = filter(
    viewAst.body.rules,
    (r: AstNode): r is ast.ViewRuleStyle | ast.DeploymentViewRuleStyle =>
      ast.isViewRuleStyle(r) || ast.isDeploymentViewRuleStyle(r),
  )
  const viewOf = view[_type] === 'element' ? view.viewOf ?? null : null
  // Find existing rules
  const existing = [] as Array<{ fqn: Fqn; rule: ast.ViewRuleStyle | ast.DeploymentViewRuleStyle }>
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
    end: insertPos,
  }

  const includeRange = (range: Range) => {
    if (range.start.line <= modifiedRange.start.line) {
      if (range.start.line == modifiedRange.start.line) {
        modifiedRange.start.character = Math.min(range.start.character, modifiedRange.start.character)
      } else {
        modifiedRange.start = range.start
      }
    }
    if (range.end.line >= modifiedRange.end.line) {
      if (range.end.line == modifiedRange.end.line) {
        modifiedRange.end.character = Math.max(range.end.character, modifiedRange.end.character)
      } else {
        modifiedRange.end = range.end
      }
    }
  }

  if (insert.length > 0) {
    modifiedRange.start = {
      line: insertPos.line,
      character: indent + 2,
    }
    const linesToInsert = insert.flatMap(({ fqn }) => asViewStyleRule(fqn, style, indent))
    const textToInsert = linesToInsert.join('\n') + '\n'
    edits.push(
      TextEdit.insert(
        insertPos,
        textToInsert,
      ),
    )

    modifiedRange.end = {
      line: insertPos.line + linesToInsert.length - 1,
      character: last(linesToInsert)?.length ?? 0,
    }
  }

  if (existing.length > 0) {
    for (const { rule } of existing) {
      const ruleCstNode = rule.$cstNode
      invariant(ruleCstNode, 'RuleCstNode not found')
      for (const [key, _value] of entries(style)) {
        const value = key === 'opacity' ? _value.toString() + '%' : _value
        const ruleProp = rule.props.find(p => p.key === key)
        // replace existing  property
        if (ruleProp && ruleProp.$cstNode) {
          const { range: { start, end } } = ruleProp.$cstNode
          const replacement = key + ' ' + value
          includeRange({
            start,
            end: {
              ...end,
              character: start.character + replacement.length,
            },
          })
          edits.push(TextEdit.replace({ start, end }, replacement))
          continue
        }
        // insert new style property right after the opening brace

        const insertPos = nonNullable(findNodeForKeyword(ruleCstNode, '}'), 'cant find closing brace').range.start
        const indentStr = ' '.repeat(ruleCstNode.range.start.character) + '  '
        const insertKeyValue = key + ' ' + value
        edits.push(
          TextEdit.insert(
            {
              line: insertPos.line,
              character: 0,
            },
            indentStr + insertKeyValue + '\n',
          ),
        )
        includeRange({
          start: {
            line: insertPos.line,
            character: indentStr.length,
          },
          end: {
            line: insertPos.line,
            character: indentStr.length + insertKeyValue.length,
          },
        })
      }
    }
  }
  return {
    modifiedRange,
    edits,
  }
}
