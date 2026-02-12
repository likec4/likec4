import type {
  DynamicViewIncludeRule,
  ElementViewPredicate,
  ElementViewRuleStyle,
  ModelGlobals,
} from '@likec4/core/types'
import { CompositeGeneratorNode, NL } from 'langium/generate'
import { printModelExpression, printModelFqnExpr } from './print-expression'
import { printStyleProperties } from './print-style'
import { quoteString } from './utils'

export function printGlobals(out: CompositeGeneratorNode, globals: ModelGlobals): void {
  const hasPredicates = Object.keys(globals.predicates).length > 0
  const hasDynamicPredicates = Object.keys(globals.dynamicPredicates).length > 0
  const hasStyles = Object.keys(globals.styles).length > 0

  if (!hasPredicates && !hasDynamicPredicates && !hasStyles) return

  out.append('global {', NL)
  out.indent({
    indentedChildren: indent => {
      // Predicate groups
      for (const [id, predicates] of Object.entries(globals.predicates) as [string, ElementViewPredicate[]][]) {
        indent.append('predicateGroup ', id, ' {', NL)
        indent.indent({
          indentedChildren: inner => {
            for (const pred of predicates) {
              if ('include' in pred && pred.include) {
                const exprs = pred.include.map((e: any) => printModelExpression(e))
                inner.append('include', NL)
                inner.indent({
                  indentedChildren: predInner => {
                    for (let i = 0; i < exprs.length; i++) {
                      predInner.append(exprs[i])
                      if (i < exprs.length - 1) predInner.append(',')
                      predInner.append(NL)
                    }
                  },
                  indentation: 2,
                })
              }
              if ('exclude' in pred && pred.exclude) {
                const exprs = pred.exclude.map((e: any) => printModelExpression(e))
                inner.append('exclude', NL)
                inner.indent({
                  indentedChildren: predInner => {
                    for (let i = 0; i < exprs.length; i++) {
                      predInner.append(exprs[i])
                      if (i < exprs.length - 1) predInner.append(',')
                      predInner.append(NL)
                    }
                  },
                  indentation: 2,
                })
              }
            }
          },
          indentation: 2,
        })
        indent.append('}', NL)
      }

      // Dynamic predicate groups
      for (
        const [id, predicates] of Object.entries(globals.dynamicPredicates) as [string, DynamicViewIncludeRule[]][]
      ) {
        indent.append('dynamicPredicateGroup ', id, ' {', NL)
        indent.indent({
          indentedChildren: inner => {
            for (const pred of predicates) {
              if (pred.include) {
                const exprs = pred.include.map((e: any) => printModelFqnExpr(e))
                inner.append('include ', exprs.join(', '), NL)
              }
            }
          },
          indentation: 2,
        })
        indent.append('}', NL)
      }

      // Style groups
      for (const [id, styles] of Object.entries(globals.styles) as [string, ElementViewRuleStyle[]][]) {
        indent.append('styleGroup ', id, ' {', NL)
        indent.indent({
          indentedChildren: inner => {
            for (const rule of styles) {
              const targetStrs = rule.targets.map((t: any) => printModelFqnExpr(t))
              inner.append('style ', targetStrs.join(', '), ' {', NL)
              inner.indent({
                indentedChildren: styleInner => {
                  printStyleProperties(rule.style, styleInner)
                  if (rule.notation) styleInner.append('notation ', quoteString(rule.notation), NL)
                },
                indentation: 2,
              })
              inner.append('}', NL)
            }
          },
          indentation: 2,
        })
        indent.append('}', NL)
      }
    },
    indentation: 2,
  })
  out.append('}', NL)
}
