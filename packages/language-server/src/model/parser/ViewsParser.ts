import * as c4 from '@likec4/core'
import { type ModelFqnExpr, invariant, isNonEmptyArray, nonexhaustive } from '@likec4/core'
import { filter, find, isArray, isDefined, isEmpty, isNonNullish, isTruthy, mapToObj, pipe } from 'remeda'
import type { Writable } from 'type-fest'
import {
  type ParsedAstDynamicView,
  type ParsedAstElementView,
  ast,
  parseMarkdownAsString,
  toAutoLayout,
  toColor,
  ViewOps,
} from '../../ast'
import { logger, logWarnError } from '../../logger'
import { stringHash } from '../../utils'
import { elementRef } from '../../utils/elementRef'
import { parseViewManualLayout } from '../../view-utils/manual-layout'
import { removeIndent, toSingleLine } from './Base'
import type { WithDeploymentView } from './DeploymentViewParser'
import type { WithPredicates } from './PredicatesParser'

export type WithViewsParser = ReturnType<typeof ViewsParser>

type ViewRuleStyleOrGlobalRef = c4.ElementViewRuleStyle | c4.ViewRuleGlobalStyle

export function ViewsParser<TBase extends WithPredicates & WithDeploymentView>(B: TBase) {
  return class ViewsParser extends B {
    parseViews() {
      const isValid = this.isValid
      for (const viewBlock of this.doc.parseResult.value.views) {
        const localStyles = viewBlock.styles.flatMap(s => {
          try {
            return isValid(s) ? this.parseViewRuleStyleOrGlobalRef(s) : []
          } catch (e) {
            logWarnError(e)
            return []
          }
        })

        // Common folder for all views in the block
        const folder = viewBlock.folder && !isEmpty(viewBlock.folder.trim()) ? toSingleLine(viewBlock.folder) : null

        for (const view of viewBlock.views) {
          try {
            if (!isValid(view)) {
              continue
            }
            switch (true) {
              case ast.isElementView(view):
                this.doc.c4Views.push(this.parseElementView(view, localStyles))
                break
              case ast.isDynamicView(view):
                this.doc.c4Views.push(this.parseDynamicElementView(view, localStyles))
                break
              case ast.isDeploymentView(view):
                this.doc.c4Views.push(this.parseDeploymentView(view))
                break
              default:
                nonexhaustive(view)
            }
            if (folder) {
              const view = this.doc.c4Views.at(-1)!
              view.title = folder + ' / ' + (view.title || view.id)
            }
          } catch (e) {
            logWarnError(e)
          }
        }
      }
    }

    parseElementView(
      astNode: ast.ElementView,
      additionalStyles: ViewRuleStyleOrGlobalRef[],
    ): ParsedAstElementView {
      const body = astNode.body
      invariant(body, 'ElementView body is not defined')
      const astPath = this.getAstNodePath(astNode)

      let viewOf = null as c4.Fqn | null
      if ('viewOf' in astNode) {
        const viewOfEl = elementRef(astNode.viewOf)
        const _viewOf = viewOfEl && this.resolveFqn(viewOfEl)
        if (!_viewOf) {
          logger.warn('viewOf is not resolved: ' + astNode.$cstNode?.text)
        } else {
          viewOf = _viewOf
        }
      }

      let id = astNode.name
      if (!id) {
        id = 'view_' + stringHash(
          this.doc.uri.toString(),
          astPath,
          viewOf ?? '',
        ) as c4.ViewId
      }

      const { title = null, description = null } = this.parseTitleDescriptionTechnology(
        {},
        pipe(
          body.props,
          filter(p => this.isValid(p)),
          filter(ast.isViewStringProperty),
          mapToObj(p => [p.key, p.value as ast.MarkdownOrString | undefined]),
        ),
      )

      const tags = this.convertTags(body)
      const links = this.convertLinks(body)

      const manualLayout = parseViewManualLayout(astNode)

      const view: ParsedAstElementView = {
        [c4._type]: 'element',
        id: id as c4.ViewId,
        astPath,
        title: toSingleLine(title) ?? null,
        description,
        tags,
        links: isNonEmptyArray(links) ? links : null,
        rules: [
          ...additionalStyles,
          ...body.rules.flatMap(n => {
            try {
              return this.isValid(n) ? this.parseElementViewRule(n) : []
            } catch (e) {
              logWarnError(e)
              return []
            }
          }),
        ],
        ...(viewOf && { viewOf }),
        ...(manualLayout && { manualLayout }),
      }
      ViewOps.writeId(astNode, view.id)

      if ('extends' in astNode) {
        const extendsView = astNode.extends.view.ref
        invariant(extendsView?.name, 'view extends is not resolved: ' + astNode.$cstNode?.text)
        return Object.assign(view, {
          extends: extendsView.name as c4.ViewId,
        })
      }

      return view
    }

    parseElementViewRule(astRule: ast.ViewRule): c4.ElementViewRule {
      if (ast.isViewRulePredicate(astRule)) {
        return this.parseViewRulePredicate(astRule)
      }
      if (ast.isViewRuleGlobalPredicateRef(astRule)) {
        return this.parseViewRuleGlobalPredicateRef(astRule)
      }
      if (ast.isViewRuleStyleOrGlobalRef(astRule)) {
        return this.parseViewRuleStyleOrGlobalRef(astRule)
      }
      if (ast.isViewRuleAutoLayout(astRule)) {
        return toAutoLayout(astRule)
      }
      if (ast.isViewRuleGroup(astRule)) {
        return this.parseViewRuleGroup(astRule)
      }
      nonexhaustive(astRule)
    }

    parseViewRulePredicate(astNode: ast.ViewRulePredicate): c4.ElementViewPredicate {
      const exprs = [] as c4.ModelExpression[]
      let predicate = astNode.exprs
      while (predicate) {
        const { value, prev } = predicate
        try {
          if (isTruthy(value) && this.isValid(value as any)) {
            const expr = this.parsePredicate(value)
            exprs.unshift(expr)
          }
        } catch (e) {
          logWarnError(e)
        }
        if (!prev) {
          break
        }
        predicate = prev
      }
      return astNode.isInclude ? { include: exprs } : { exclude: exprs }
    }

    parseViewRuleGlobalPredicateRef(
      astRule: ast.ViewRuleGlobalPredicateRef | ast.DynamicViewGlobalPredicateRef,
    ): c4.ViewRuleGlobalPredicateRef {
      return {
        predicateId: astRule.predicate.$refText as c4.GlobalPredicateId,
      }
    }

    parseViewRuleStyleOrGlobalRef(astRule: ast.ViewRuleStyleOrGlobalRef): ViewRuleStyleOrGlobalRef {
      if (ast.isViewRuleStyle(astRule)) {
        return this.parseViewRuleStyle(astRule)
      }
      if (ast.isViewRuleGlobalStyle(astRule)) {
        return this.parseViewRuleGlobalStyle(astRule)
      }
      nonexhaustive(astRule)
    }

    parseViewRuleGroup(astNode: ast.ViewRuleGroup): c4.ElementViewRuleGroup {
      const groupRules = [] as c4.ElementViewRuleGroup['groupRules']
      for (const rule of astNode.groupRules) {
        try {
          if (!this.isValid(rule)) {
            continue
          }
          if (ast.isViewRulePredicate(rule)) {
            groupRules.push(this.parseViewRulePredicate(rule))
            continue
          }
          if (ast.isViewRuleGroup(rule)) {
            groupRules.push(this.parseViewRuleGroup(rule))
            continue
          }
          nonexhaustive(rule)
        } catch (e) {
          logWarnError(e)
        }
      }
      return {
        title: toSingleLine(astNode.title) ?? null,
        groupRules,
        ...this.parseStyleProps(astNode.props),
      }
    }

    parseViewRuleStyle(astRule: ast.ViewRuleStyle | ast.GlobalStyle): c4.ElementViewRuleStyle {
      const targets = this.parseFqnExpressions(astRule.targets).filter((e): e is ModelFqnExpr.Any =>
        c4.ModelExpression.isFqnExpr(e as any)
      )
      const style = this.parseStyleProps(astRule.props.filter(ast.isStyleProperty))
      const notation = removeIndent(parseMarkdownAsString(astRule.props.find(ast.isNotationProperty)?.value))
      return {
        targets,
        style,
        ...(notation && { notation }),
      }
    }

    parseViewRuleGlobalStyle(astRule: ast.ViewRuleGlobalStyle): c4.ViewRuleGlobalStyle {
      return {
        styleId: astRule.style.$refText as c4.GlobalStyleID,
      }
    }

    parseDynamicElementView(
      astNode: ast.DynamicView,
      additionalStyles: ViewRuleStyleOrGlobalRef[],
    ): ParsedAstDynamicView {
      const body = astNode.body
      invariant(body, 'DynamicElementView body is not defined')
      // only valid props
      const isValid = this.isValid
      const props = body.props.filter(isValid)
      const astPath = this.getAstNodePath(astNode)

      let id = astNode.name
      if (!id) {
        id = 'dynamic_' + stringHash(
          this.doc.uri.toString(),
          astPath,
        ) as c4.ViewId
      }

      const { title = null, description = null } = this.parseTitleDescriptionTechnology(
        {},
        pipe(
          props,
          filter(ast.isViewStringProperty),
          mapToObj(p => [p.key, p.value as ast.MarkdownOrString | undefined]),
        ),
      )

      const tags = this.convertTags(body)
      const links = this.convertLinks(body)

      ViewOps.writeId(astNode, id as c4.ViewId)

      const manualLayout = parseViewManualLayout(astNode)

      const mode = find(props, ast.isDynamicViewDisplayVariantProperty)?.value

      return {
        [c4._type]: 'dynamic',
        id: id as c4.ViewId,
        astPath,
        title: toSingleLine(title) ?? null,
        description,
        tags,
        links: isNonEmptyArray(links) ? links : null,
        ...(mode && { mode }),
        rules: [
          ...additionalStyles,
          ...body.rules.flatMap(n => {
            try {
              return isValid(n) ? this.parseDynamicViewRule(n) : []
            } catch (e) {
              logWarnError(e)
              return []
            }
          }, [] as Array<c4.DynamicViewRule>),
        ],
        steps: body.steps.reduce((acc, n) => {
          try {
            if (isValid(n)) {
              if (ast.isDynamicViewParallelSteps(n)) {
                acc.push(this.parseDynamicParallelSteps(n))
              } else {
                acc.push(this.parseDynamicStep(n))
              }
            }
          } catch (e) {
            logWarnError(e)
          }
          return acc
        }, [] as c4.DynamicViewStepOrParallel[]),
        ...(manualLayout && { manualLayout }),
      }
    }

    parseDynamicViewRule(astRule: ast.DynamicViewRule): c4.DynamicViewRule {
      if (ast.isDynamicViewIncludePredicate(astRule)) {
        return this.parseDynamicViewIncludePredicate(astRule)
      }
      if (ast.isDynamicViewGlobalPredicateRef(astRule)) {
        return this.parseViewRuleGlobalPredicateRef(astRule)
      }
      if (ast.isViewRuleStyleOrGlobalRef(astRule)) {
        return this.parseViewRuleStyleOrGlobalRef(astRule)
      }
      if (ast.isViewRuleAutoLayout(astRule)) {
        return toAutoLayout(astRule)
      }
      nonexhaustive(astRule)
    }

    parseDynamicViewIncludePredicate(astRule: ast.DynamicViewIncludePredicate): c4.DynamicViewIncludeRule {
      const include = [] as c4.ModelFqnExpr.Any[]
      let iter: ast.Expressions | undefined = astRule.exprs
      while (iter) {
        try {
          if (isNonNullish(iter.value) && this.isValid(iter.value as any)) {
            if (ast.isFqnExprOrWith(iter.value)) {
              const c4expr = this.parseElementPredicate(iter.value)
              include.unshift(c4expr)
            }
          }
        } catch (e) {
          logWarnError(e)
        }
        iter = iter.prev
      }
      return { include }
    }

    parseDynamicParallelSteps(node: ast.DynamicViewParallelSteps): c4.DynamicViewParallelSteps {
      return {
        __parallel: node.steps.map(step => this.parseDynamicStep(step)),
      }
    }

    parseDynamicStep(node: ast.DynamicViewStep): c4.DynamicViewStep {
      const sourceEl = elementRef(node.source)
      if (!sourceEl) {
        throw new Error('Invalid reference to source')
      }
      const targetEl = elementRef(node.target)
      if (!targetEl) {
        throw new Error('Invalid reference to target')
      }
      let source = this.resolveFqn(sourceEl)
      let target = this.resolveFqn(targetEl)
      const title = removeIndent(node.title) ?? null

      let step: Writable<c4.DynamicViewStep> = {
        source,
        target,
        title,
      }
      if (node.isBackward) {
        step = {
          source: target,
          target: source,
          title,
          isBackward: true,
        }
      }
      if (!isArray(node.custom?.props)) {
        return step
      }
      for (const prop of node.custom.props) {
        try {
          switch (true) {
            case ast.isRelationNavigateToProperty(prop): {
              const viewId = prop.value.view.ref?.name
              if (isTruthy(viewId)) {
                step.navigateTo = viewId as c4.ViewId
              }
              break
            }
            case ast.isRelationStringProperty(prop):
            case ast.isNotationProperty(prop): {
              if (isDefined(prop.value)) {
                step[prop.key] = removeIndent(parseMarkdownAsString(prop.value)) ?? ''
              }
              break
            }
            case ast.isNotesProperty(prop): {
              if (isDefined(prop.value)) {
                step[prop.key] = removeIndent(prop.value)
              }
              break
            }
            case ast.isArrowProperty(prop): {
              if (isDefined(prop.value)) {
                step[prop.key] = prop.value
              }
              break
            }
            case ast.isColorProperty(prop): {
              const value = toColor(prop)
              if (isDefined(value)) {
                step[prop.key] = value
              }
              break
            }
            case ast.isLineProperty(prop): {
              if (isDefined(prop.value)) {
                step[prop.key] = prop.value
              }
              break
            }
            default:
              nonexhaustive(prop)
          }
        }
        catch (e) {
          logWarnError(e)
        }
      }
      return step
    }
  }
}
