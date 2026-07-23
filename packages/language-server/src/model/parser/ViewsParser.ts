// SPDX-License-Identifier: MIT
//
// Copyright (c) 2023-2026 Denis Davydkov
// Copyright (c) 2026 NVIDIA CORPORATION & AFFILIATES. All rights reserved.
//
// Portions of this file have been modified by NVIDIA CORPORATION & AFFILIATES.

import * as c4 from '@likec4/core'
import { type ModelFqnExpr, invariant, isNonEmptyArray, nonexhaustive } from '@likec4/core'
import { filter, find, isDefined, isEmpty, isNumber, isTruthy, last, mapToObj, pipe } from 'remeda'
import type { Except, Writable } from 'type-fest'
import {
  type ParsedAstDynamicView,
  type ParsedAstElementView,
  ast,
  parseMarkdownAsString,
  toAutoLayout,
  toColor,
  ViewOps,
} from '../../ast'
import { safeCall, stringHash } from '../../utils'
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
        const localStyles = viewBlock.styles.flatMap(nd => {
          try {
            return isValid(nd) ? this.parseViewRuleStyleOrGlobalRef(nd) : []
          } catch (e) {
            this.logError(e, nd, 'views')
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
            this.logError(e, view, 'views')
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
      const viewOfNode = astNode.viewOf
      if (viewOfNode) {
        const _viewOf = safeCall(() => this.parseModelElementRef(viewOfNode, 'Invalid reference to viewOf'))
        if (!_viewOf) {
          const viewId = astNode.name ?? 'unnamed'
          const msg = viewOfNode.$cstNode?.text ?? '<unknown>'
          this.logError(`viewOf ${viewId} not resolved ${msg}`, viewOfNode)
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

      const { title = null, description = null } = this.parseBaseProps(
        pipe(
          body.props,
          filter(p => this.isValid(p)),
          filter(ast.isViewStringProperty),
          mapToObj(p => [p.key, p.value as ast.MarkdownOrString | undefined]),
        ),
      )

      const tags = this.convertTags(body)
      const links = this.convertLinks(body)

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
          ...this.tryMap('views', body.rules, r => this.parseElementViewRule(r)),
        ],
        ...(viewOf && { viewOf }),
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
      if (ast.isViewRuleRank(astRule)) {
        return this.parseViewRuleRank(astRule)
      }
      nonexhaustive(astRule)
    }

    parseViewRulePredicate(astNode: ast.ViewRulePredicate): c4.ElementViewPredicate {
      const exprs = [] as c4.ModelExpression[]
      let predicate = astNode.exprs
      while (predicate) {
        const { value, prev } = predicate
        this.tryParse('views', value, () => {
          const expr = this.parsePredicate(value)
          exprs.unshift(expr)
        })
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
          this.logError(e, rule, 'views')
        }
      }
      return {
        title: toSingleLine(astNode.title) ?? null,
        groupRules,
        ...this.parseStyleProps(astNode.props),
      }
    }

    parseViewRuleRank(astRule: ast.ViewRuleRank): c4.ElementViewRuleRank {
      const targets = this.parseFqnExpressions(astRule.targets).filter((e): e is c4.ModelFqnExpr.Any =>
        c4.ModelExpression.isFqnExpr(e as any)
      )
      const rank = astRule.value ?? 'same'
      return {
        rank,
        targets,
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

      const { title = null, description = null } = this.parseBaseProps(
        pipe(
          props,
          filter(ast.isViewStringProperty),
          mapToObj(p => [p.key, p.value as ast.MarkdownOrString | undefined]),
        ),
      )

      const tags = this.convertTags(body)
      const links = this.convertLinks(body)

      ViewOps.writeId(astNode, id as c4.ViewId)

      const variant = find(props, ast.isDynamicViewDisplayVariantProperty)?.value

      return {
        [c4._type]: 'dynamic',
        id: id as c4.ViewId,
        astPath,
        title: toSingleLine(title) ?? null,
        description,
        tags,
        links: isNonEmptyArray(links) ? links : null,
        variant,
        rules: [
          ...additionalStyles,
          ...this.tryMap('views', body.rules, n => this.parseDynamicViewRule(n)),
        ],
        steps: this.parseSteps(body.steps),
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
        this.tryParse('views', iter.value, (value) => {
          if (ast.isFqnExprOrWith(value)) {
            const c4expr = this.parseElementPredicate(value)
            include.unshift(c4expr)
          }
        })
        iter = iter.prev
      }
      return { include }
    }

    parseSteps(nodes: ast.StepStatement[]): c4.AnyStep[] {
      return this.tryMap('views', nodes, n => this.parseStepStatement(n))
    }

    parseStepStatement(node: ast.StepStatement): c4.AnyStep {
      switch (true) {
        case ast.isSubflowStep(node):
          return this.parseSubflowStep(node)
        case ast.isTryStep(node):
          return this.parseTryStep(node)
        case ast.isAltSteps(node):
          return this.parseAltSteps(node)
        case ast.isStepSeries(node):
          return this.parseStepSeries(node)
        case ast.isStep(node):
          return this.parseStep(node)
        default:
          nonexhaustive(node)
      }
    }

    /**
     * @returns non-empty array in case of step chain A -> B -> C
     */
    parseStepSeries(node: ast.StepSeries): c4.Step.Series {
      const steps = this.recursiveParseStepSeries(node)
      invariant(isNonEmptyArray(steps), 'Dynamic step chain must have at least one step')
      return {
        [c4._type]: 'series',
        steps,
      }
    }

    recursiveParseStepSeries(
      node: ast.StepSeries,
      callstack?: Array<[source: c4.Fqn, target: c4.Fqn]>,
    ): c4.Step[] {
      if (ast.isStep(node.source)) {
        if (!this.isValid(node.source)) {
          return []
        }
        const previous = this.parseStep(node.source)

        // Head of the chain cannot be backward
        if (previous.isBackward) {
          return []
        }

        const thisStep = {
          ...this.parseAbstractDynamicStep(node),
          source: previous.target,
        }
        // if target is the same as source of previous step, then it is a backward step
        // A -> B -> A
        if (thisStep.target === previous.source) {
          thisStep.isBackward = true
        } else if (callstack) {
          callstack.push([previous.source, previous.target])
          callstack.push([thisStep.source, thisStep.target])
        }
        return [previous, thisStep]
      }

      callstack ??= []
      const allprevious = this.recursiveParseStepSeries(node.source, callstack)
      if (!isNonEmptyArray(allprevious) || !this.isValid(node)) {
        return []
      }

      const previous = last(allprevious)
      const thisStep = {
        ...this.parseAbstractDynamicStep(node),
        source: previous.target,
      }
      const index = callstack.findIndex(([source, target]) => source === thisStep.target && target === thisStep.source)
      if (index !== -1) {
        thisStep.isBackward = true
        callstack.splice(index, callstack.length - index)
      } else {
        callstack.push([thisStep.source, thisStep.target])
      }
      return [...allprevious, thisStep]
    }

    parseStep(node: ast.Step): c4.Step {
      let baseStep = {
        ...this.parseAbstractDynamicStep(node),
        source: this.parseDynamicStepEndpoint(node.source, 'source'),
      }

      if (node.isBackward) {
        baseStep = {
          ...baseStep,
          source: baseStep.target,
          target: baseStep.source,
          isBackward: true,
        }
      }
      return baseStep
    }

    parseAbstractDynamicStep(
      astnode: ast.AbstractStep,
    ): Writable<Except<c4.Step, 'source', { requireExactProps: true }>> {
      const astPath = pathInsideDynamicView(astnode)
      const step: Writable<Omit<c4.Step, 'source'>> = {
        target: this.parseDynamicStepEndpoint(astnode.target, 'target'),
        astPath: astPath,
      }

      const title = removeIndent(astnode.title)
      if (title) {
        step.title = title
      }

      const kind = astnode.kind?.ref?.name ?? astnode.dotKind?.kind.ref?.name
      if (kind) {
        step.kind = kind as c4.RelationshipKind
      }

      for (const prop of astnode.custom?.props ?? []) {
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
                if (prop.key === 'description') {
                  const value = removeIndent(prop.value)
                  if (value) {
                    step.description = value
                  }
                } else {
                  step[prop.key] = removeIndent(parseMarkdownAsString(prop.value)) ?? ''
                }
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
            case ast.isMultipleProperty(prop): {
              break
            }
            default:
              nonexhaustive(prop)
          }
        }
        catch (e) {
          this.logError(e, prop, 'views')
        }
      }
      return step
    }

    parseModelElementRef(node: ast.ElementRef, errorMessage: string): c4.Fqn {
      const ref = this.parseFqnRef(node.modelElement)
      if (!c4.FqnRef.isModelRef(ref)) {
        throw new Error(errorMessage)
      }
      return c4.FqnRef.flatten(ref)
    }

    parseDynamicStepEndpoint(node: ast.ElementRef, endpoint: 'source' | 'target'): c4.Fqn {
      return this.parseModelElementRef(node, `Invalid reference to ${endpoint}`)
    }

    parseSubflowStep(node: ast.SubflowStep): c4.Step.Opt | c4.Step.Break | c4.Step.Loop | c4.Step.Parallel {
      const kind = node.kind === 'parallel' ? 'par' : node.kind
      switch (kind) {
        case 'break':
        case 'loop':
        case 'opt':
        case 'par': {
          const steps = this.parseSteps(node.steps)
          invariant(isNonEmptyArray(steps), 'Parallel steps must have at least one step')
          return c4.exact({
            [c4._type]: kind,
            title: node.title,
            steps,
          })
        }
        case 'else':
        case 'if':
        case 'when': {
          throw new Error(`Unsupported kind: ${kind}`)
        }
        default:
          nonexhaustive(kind)
      }
    }

    parseTryStep(node: ast.TryStep): c4.Step.Try {
      invariant(this.isValid(node))
      if (ast.isFinallyBlock(node)) {
        const step = this.parseTryStep(node.tryCatch)
        const finallySteps = this.parseSteps(node.finally.steps)
        if (isNonEmptyArray(finallySteps)) {
          return {
            ...step,
            finally: c4.exact({
              title: node.title,
              steps: finallySteps,
            }),
          }
        }
        return step
      }
      if (ast.isCatchBlock(node)) {
        const step = this.parseTryStep(node.try)
        const catchSteps = this.parseSteps(node.catch.steps)
        if (isNonEmptyArray(catchSteps)) {
          return {
            ...step,
            catch: c4.exact({
              title: node.title,
              steps: catchSteps,
            }),
          }
        }
        return step
      }

      const steps = this.parseSteps(node.steps)
      invariant(isNonEmptyArray(steps), 'Try steps must have at least one step')
      return {
        [c4._type]: 'try',
        try: c4.exact({
          title: node.title,
          steps,
        }),
      }
    }

    parseAltSteps(node: ast.AltSteps): c4.Step.Alt {
      const branches = this.tryMap('views', node.branches, (step): c4.Step.AltBranch => {
        const kind = step.kind
        invariant(
          kind === 'if'
            || kind === 'else'
            || kind === 'when',
          `Expected "if", "else", or "when", got "${kind}"`,
        )
        const steps = this.parseSteps(step.steps)
        invariant(isNonEmptyArray(steps), 'Branch steps must have at least one step')
        return c4.exact({
          [c4._type]: kind,
          title: step.title,
          steps,
        })
      })
      invariant(isNonEmptyArray(branches), 'Alt must have at least one branch')
      return c4.exact({
        [c4._type]: 'alt',
        title: node.title,
        branches,
      })
    }
  }
}

function pathInsideDynamicView<T extends ast.StepStatement | ast.AbstractStep>(_node: T): c4.StepPath {
  let node: T | T['$container'] = _node
  let path = []
  while (!ast.isDynamicViewBody(node)) {
    if (isNumber(node.$containerIndex)) {
      path.unshift(
        `@${node.$containerIndex}`,
      )
    }
    path.unshift(
      `/${node.$containerProperty ?? '__invalid__'}`,
    )
    node = node.$container
  }

  return path.join('') as c4.StepPath
}
