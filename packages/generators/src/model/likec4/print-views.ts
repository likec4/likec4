import type {
  aux,
  DeploymentViewRule,
  DynamicViewRule,
  DynamicViewStep,
  ElementViewRule,
  ElementViewRuleGroup,
  ParsedDeploymentView,
  ParsedDynamicView,
  ParsedElementView,
  ParsedView,
} from '@likec4/core/types'
import {
  isDeploymentView,
  isDynamicStep,
  isDynamicStepsParallel,
  isDynamicStepsSeries,
  isDynamicView,
  isViewRuleAutoLayout,
  isViewRuleGlobalPredicateRef,
  isViewRuleGlobalStyle,
  isViewRuleGroup,
  isViewRuleRank,
} from '@likec4/core/types'
import { CompositeGeneratorNode, NL } from 'langium/generate'
import { printExpression, printFqnExprAny, printModelExpression, printModelFqnExpr } from './print-expression'
import { printStyleProperties } from './print-style'
import { printAutoLayoutDirection, quoteMarkdownOrString, quoteString } from './utils'

function appendCommaSeparated(node: CompositeGeneratorNode, exprs: string[]): void {
  for (let i = 0; i < exprs.length; i++) {
    node.append(exprs[i])
    if (i < exprs.length - 1) node.append(',')
    node.append(NL)
  }
}

export function printViews(
  out: CompositeGeneratorNode,
  views: Record<string, ParsedView>,
): void {
  const viewEntries = Object.values(views)
  if (viewEntries.length === 0) return

  out.append('views {', NL)
  out.indent({
    indentedChildren: indent => {
      for (const view of viewEntries) {
        indent.append(NL)
        printView(indent, view)
      }
    },
    indentation: 2,
  })
  out.append('}', NL)
}

function printView(indent: CompositeGeneratorNode, view: ParsedView): void {
  if (isDynamicView(view)) {
    printDynamicView(indent, view)
  } else if (isDeploymentView(view)) {
    printDeploymentView(indent, view)
  } else {
    printElementView(indent, view as ParsedElementView)
  }
}

// ---- Element View ----

function printElementView(indent: CompositeGeneratorNode, view: ParsedElementView): void {
  indent.append('view ', view.id as string)

  if (view.extends) {
    indent.append(' extends ', view.extends as string)
  } else if (view.viewOf) {
    indent.append(' of ', view.viewOf as string)
  }

  indent.append(' {', NL)
  indent.indent({
    indentedChildren: inner => {
      printViewCommonProps(inner, view)
      printElementViewRules(inner, view.rules)
    },
    indentation: 2,
  })
  indent.append('}', NL)
}

function printElementViewRules(indent: CompositeGeneratorNode, rules: ElementViewRule[]): void {
  for (const rule of rules) {
    if (isViewRuleAutoLayout(rule)) {
      indent.append('autoLayout ', printAutoLayoutDirection(rule.direction))
      if (rule.rankSep != null) {
        indent.append(' ', String(rule.rankSep))
        if (rule.nodeSep != null) {
          indent.append(' ', String(rule.nodeSep))
        }
      }
      indent.append(NL)
      continue
    }

    if (isViewRuleGlobalPredicateRef(rule)) {
      indent.append('global predicate ', rule.predicateId as string, NL)
      continue
    }

    if (isViewRuleGlobalStyle(rule)) {
      indent.append('global style ', rule.styleId as string, NL)
      continue
    }

    if (isViewRuleGroup(rule)) {
      printGroup(indent, rule)
      continue
    }

    if (isViewRuleRank(rule)) {
      indent.append('rank ', rule.rank, ' {', NL)
      indent.indent({
        indentedChildren: inner => {
          const targetStrs = rule.targets.map((t: any) => printModelFqnExpr(t))
          inner.append(targetStrs.join(', '), NL)
        },
        indentation: 2,
      })
      indent.append('}', NL)
      continue
    }

    if ('include' in rule && rule.include) {
      const exprs = rule.include.map((e: any) => printModelExpression(e))
      indent.append('include', NL)
      indent.indent({
        indentedChildren: inner => {
          appendCommaSeparated(inner, exprs)
        },
        indentation: 2,
      })
      continue
    }

    if ('exclude' in rule && rule.exclude) {
      const exprs = rule.exclude.map((e: any) => printModelExpression(e))
      indent.append('exclude', NL)
      indent.indent({
        indentedChildren: inner => {
          appendCommaSeparated(inner, exprs)
        },
        indentation: 2,
      })
      continue
    }

    if ('targets' in rule && 'style' in rule) {
      const targetStrs = rule.targets.map((t: any) => printModelFqnExpr(t))
      indent.append('style ', targetStrs.join(', '), ' {', NL)
      indent.indent({
        indentedChildren: inner => {
          printStyleProperties(rule.style, inner)
          if (rule.notation) inner.append('notation ', quoteString(rule.notation), NL)
        },
        indentation: 2,
      })
      indent.append('}', NL)
      continue
    }
  }
}

function printGroup(indent: CompositeGeneratorNode, group: ElementViewRuleGroup): void {
  indent.append('group')
  if (group.title) {
    indent.append(' ', quoteString(group.title))
  }
  indent.append(' {', NL)
  indent.indent({
    indentedChildren: inner => {
      if (group.color) inner.append('color ', group.color, NL)
      if (group.border) inner.append('border ', group.border, NL)
      if (group.opacity != null) inner.append('opacity ', `${group.opacity}%`, NL)
      if (group.multiple) inner.append('multiple', NL)
      if (group.size) inner.append('size ', group.size, NL)
      if (group.padding) inner.append('padding ', group.padding, NL)
      if (group.textSize) inner.append('textSize ', group.textSize, NL)

      // Group rules (nested predicates and groups)
      for (const rule of group.groupRules) {
        if (isViewRuleGroup(rule as ElementViewRule)) {
          printGroup(inner, rule as ElementViewRuleGroup)
        } else if ('include' in rule && rule.include) {
          const exprs = rule.include.map((e: any) => printModelExpression(e))
          inner.append('include', NL)
          inner.indent({
            indentedChildren: pred => {
              appendCommaSeparated(pred, exprs)
            },
            indentation: 2,
          })
        } else if ('exclude' in rule && rule.exclude) {
          const exprs = rule.exclude.map((e: any) => printModelExpression(e))
          inner.append('exclude', NL)
          inner.indent({
            indentedChildren: pred => {
              appendCommaSeparated(pred, exprs)
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

// ---- Dynamic View ----

function printDynamicView(indent: CompositeGeneratorNode, view: ParsedDynamicView): void {
  indent.append('dynamic view ', view.id as string, ' {', NL)
  indent.indent({
    indentedChildren: inner => {
      printViewCommonProps(inner, view)

      // Steps
      for (const step of view.steps) {
        printDynamicViewStep(inner, step)
      }

      // Rules
      printDynamicViewRules(inner, view.rules)
    },
    indentation: 2,
  })
  indent.append('}', NL)
}

function printDynamicViewStep(indent: CompositeGeneratorNode, step: DynamicViewStep): void {
  if (isDynamicStep(step)) {
    const source = step.source as string
    const target = step.target as string

    if (step.isBackward) {
      indent.append(source, ' <- ', target)
    } else {
      indent.append(source, ' -> ', target)
    }

    if (step.title) {
      indent.append(' ', quoteString(step.title))
    }

    const hasBody = !!(step.notes || step.navigateTo || step.technology || step.description
      || step.color || step.line || step.head || step.tail)

    if (!hasBody) {
      indent.append(NL)
      return
    }

    indent.append(' {', NL)
    indent.indent({
      indentedChildren: inner => {
        if (step.technology) inner.append('technology ', quoteString(step.technology), NL)
        if (step.description) inner.append('description ', quoteMarkdownOrString(step.description), NL)
        if (step.notes) inner.append('notes ', quoteMarkdownOrString(step.notes), NL)
        if (step.navigateTo) inner.append('navigateTo ', step.navigateTo as string, NL)
        if (step.color) inner.append('color ', step.color, NL)
        if (step.line) inner.append('line ', step.line, NL)
        if (step.head) inner.append('head ', step.head, NL)
        if (step.tail) inner.append('tail ', step.tail, NL)
      },
      indentation: 2,
    })
    indent.append('}', NL)
    return
  }

  if (isDynamicStepsParallel(step)) {
    indent.append('parallel {', NL)
    indent.indent({
      indentedChildren: inner => {
        for (const s of step.__parallel) {
          if (isDynamicStepsSeries(s)) {
            for (const seriesStep of s.__series) {
              printDynamicViewStep(inner, seriesStep)
            }
          } else {
            printDynamicViewStep(inner, s)
          }
        }
      },
      indentation: 2,
    })
    indent.append('}', NL)
    return
  }

  if (isDynamicStepsSeries(step)) {
    for (const s of step.__series) {
      printDynamicViewStep(indent, s)
    }
  }
}

function printDynamicViewRules(indent: CompositeGeneratorNode, rules: DynamicViewRule[]): void {
  for (const rule of rules) {
    if (isViewRuleAutoLayout(rule)) {
      indent.append('autoLayout ', printAutoLayoutDirection(rule.direction))
      if (rule.rankSep != null) {
        indent.append(' ', String(rule.rankSep))
        if (rule.nodeSep != null) indent.append(' ', String(rule.nodeSep))
      }
      indent.append(NL)
      continue
    }

    if (isViewRuleGlobalPredicateRef(rule)) {
      indent.append('global predicate ', rule.predicateId as string, NL)
      continue
    }

    if (isViewRuleGlobalStyle(rule)) {
      indent.append('global style ', rule.styleId as string, NL)
      continue
    }

    if ('include' in rule && rule.include) {
      const exprs = (rule.include as any[]).map((e: any) => printModelFqnExpr(e))
      indent.append('include ', exprs.join(', '), NL)
      continue
    }

    if ('targets' in rule && 'style' in rule) {
      const targetStrs = (rule as any).targets.map((t: any) => printModelFqnExpr(t))
      indent.append('style ', targetStrs.join(', '), ' {', NL)
      indent.indent({
        indentedChildren: inner => {
          printStyleProperties((rule as any).style, inner)
          if ((rule as any).notation) inner.append('notation ', quoteString((rule as any).notation), NL)
        },
        indentation: 2,
      })
      indent.append('}', NL)
      continue
    }
  }
}

// ---- Deployment View ----

function printDeploymentView(indent: CompositeGeneratorNode, view: ParsedDeploymentView): void {
  indent.append('deployment view ', view.id as string, ' {', NL)
  indent.indent({
    indentedChildren: inner => {
      printViewCommonProps(inner, view)
      printDeploymentViewRules(inner, view.rules)
    },
    indentation: 2,
  })
  indent.append('}', NL)
}

function printDeploymentViewRules(indent: CompositeGeneratorNode, rules: DeploymentViewRule[]): void {
  for (const rule of rules) {
    if (isViewRuleAutoLayout(rule)) {
      indent.append('autoLayout ', printAutoLayoutDirection(rule.direction))
      if (rule.rankSep != null) {
        indent.append(' ', String(rule.rankSep))
        if (rule.nodeSep != null) indent.append(' ', String(rule.nodeSep))
      }
      indent.append(NL)
      continue
    }

    if ('include' in rule && rule.include) {
      const exprs = rule.include.map((e: any) => printExpression(e))
      indent.append('include', NL)
      indent.indent({
        indentedChildren: inner => {
          appendCommaSeparated(inner, exprs)
        },
        indentation: 2,
      })
      continue
    }

    if ('exclude' in rule && rule.exclude) {
      const exprs = rule.exclude.map((e: any) => printExpression(e))
      indent.append('exclude', NL)
      indent.indent({
        indentedChildren: inner => {
          appendCommaSeparated(inner, exprs)
        },
        indentation: 2,
      })
      continue
    }

    if ('targets' in rule && 'style' in rule) {
      const targetStrs = (rule as any).targets.map((t: any) => printFqnExprAny(t))
      indent.append('style ', targetStrs.join(', '), ' {', NL)
      indent.indent({
        indentedChildren: inner => {
          printStyleProperties((rule as any).style, inner)
          if ((rule as any).notation) inner.append('notation ', quoteString((rule as any).notation), NL)
        },
        indentation: 2,
      })
      indent.append('}', NL)
      continue
    }
  }
}

// ---- Common View Props ----

function printViewCommonProps(indent: CompositeGeneratorNode, view: ParsedView): void {
  if (view.title) {
    indent.append('title ', quoteString(view.title), NL)
  }
  if (view.description) {
    indent.append('description ', quoteMarkdownOrString(view.description), NL)
  }
  if (view.tags && view.tags.length > 0) {
    indent.append('#', (view.tags as string[]).join(' #'), NL)
  }
  if (view.links && view.links.length > 0) {
    for (const link of view.links) {
      indent.append('link ', link.url)
      if (link.title) indent.append(' ', quoteString(link.title))
      indent.append(NL)
    }
  }
}
