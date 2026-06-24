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
import { elementRef } from '../../utils/elementRef'
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
      if ('viewOf' in astNode) {
        const viewOfEl = elementRef(astNode.viewOf)
        const _viewOf = viewOfEl && safeCall(() => this.resolveFqn(viewOfEl))
        if (!_viewOf) {
          const viewId = astNode.name ?? 'unnamed'
          const msg = astNode.viewOf.$cstNode?.text ?? '<unknown>'
          this.logError(`viewOf ${viewId} not resolved ${msg}`, astNode.viewOf)
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

      // Parse autonumber property if present
      const autonumberProp = find(props, ast.isDynamicAutonumberProperty)
      const autonumber = autonumberProp ? this.parseAutonumberProperty(autonumberProp) : undefined

      return {
        [c4._type]: 'dynamic',
        id: id as c4.ViewId,
        astPath,
        title: toSingleLine(title) ?? null,
        description,
        tags,
        links: isNonEmptyArray(links) ? links : null,
        variant,
        ...(autonumber !== undefined ? { autonumber } : {}),
        rules: [
          ...additionalStyles,
          ...this.tryMap('views', body.rules, n => this.parseDynamicViewRule(n)),
        ],
        steps: this.tryMap('views', body.steps, n => this.parseDynamicElement(n)),
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

    parseDynamicParallelSteps(node: ast.DynamicViewParallelSteps): c4.DynamicStepsParallel {
      const parallelId = pathInsideDynamicView(node)

      // Nested parallel blocks are accepted by the grammar so the validator (#988)
      // can flag them with a clear message; drop them from flat steps here.
      const flatStepNodes = node.steps.filter((s): s is ast.DynamicViewStep => !ast.isDynamicViewParallelSteps(s))
      const hasBranches = node.branches.length > 0
      const hasLegacySteps = flatStepNodes.length > 0

      if (hasBranches && hasLegacySteps) {
        // Validator (WI-4) catches this — here we prefer branches at runtime
        this.logError(
          'parallel block mixes flat steps and labeled branches — branches take precedence',
          node,
          'views',
        )
      }

      if (hasBranches) {
        const branches = node.branches.map(b => ({
          ...(b.label !== undefined ? { label: b.label } : {}),
          elements: this.tryMap('views', b.body.elements, e => this.parseDynamicElement(e)),
        }))
        invariant(isNonEmptyArray(branches), 'Dynamic parallel steps must have at least one branch')
        // Flatten all branch elements into __parallel for back-compat consumers.
        // Branch-only parallels may yield an empty projection — that is allowed.
        const __parallel = branches.flatMap(b => b.elements).filter(
          (e): e is c4.DynamicStep | c4.DynamicStepsSeries => c4.isDynamicStep(e) || c4.isDynamicStepsSeries(e),
        )
        return {
          parallelId,
          __parallel,
          branches: branches as unknown as c4.NonEmptyReadonlyArray<
            { label?: string; elements: c4.DynamicViewElement[] }
          >,
        }
      }

      // Legacy flat form: parallel { stepA stepB }
      const __parallel = this.tryMap('views', flatStepNodes, s => this.parseDynamicStep(s))
      invariant(isNonEmptyArray(__parallel), 'Dynamic parallel steps must have at least one step')
      return {
        parallelId,
        __parallel,
      }
    }

    /**
     * Top-level dispatcher: converts any DynamicViewElement AST node to its parsed-model counterpart.
     * Returns undefined when the node cannot be resolved (mirrors tryMap/tryParse idiom).
     */
    parseDynamicElement(n: ast.DynamicViewElement): c4.DynamicViewElement | undefined {
      switch (true) {
        case ast.isDynamicViewStep(n):
          return this.parseDynamicStep(n)
        case ast.isDynamicViewParallelSteps(n):
          return this.parseDynamicParallelSteps(n)
        case ast.isDynamicIfBlock(n):
          return this.parseDynamicIfBlock(n)
        case ast.isDynamicOptionalBlock(n):
          return this.parseDynamicOptionalBlock(n)
        case ast.isDynamicRepeatBlock(n):
          return this.parseDynamicRepeatBlock(n)
        case ast.isDynamicGroupBlock(n):
          return this.parseDynamicGroupBlock(n)
        case ast.isDynamicCriticalBlock(n):
          return this.parseDynamicCriticalBlock(n)
        case ast.isDynamicBreakBlock(n):
          return this.parseDynamicBreakBlock(n)
        case ast.isDynamicNote(n):
          return this.parseDynamicNote(n)
        case ast.isDynamicActivate(n):
          return this.parseDynamicActivate(n)
        case ast.isDynamicDeactivate(n):
          return this.parseDynamicDeactivate(n)
        case ast.isDynamicCreate(n):
          return this.parseDynamicCreate(n)
        case ast.isDynamicDestroy(n):
          return this.parseDynamicDestroy(n)
        default:
          nonexhaustive(n)
      }
    }

    parseDynamicBlockBody(n: ast.DynamicBlockBody): c4.DynamicBlockBody {
      return {
        id: pathInsideDynamicView(n),
        elements: this.tryMap('views', n.elements, e => this.parseDynamicElement(e)),
      }
    }

    parseDynamicIfBlock(n: ast.DynamicIfBlock): c4.DynamicIfBlock {
      return {
        kind: 'if',
        id: pathInsideDynamicView(n),
        condition: n.condition,
        thenBranch: this.parseDynamicBlockBody(n.thenBranch),
        elseIfs: n.elseIfBranches.map(b => ({
          condition: b.condition,
          body: this.parseDynamicBlockBody(b.body),
        })),
        ...(n.elseBranch ? { else: this.parseDynamicBlockBody(n.elseBranch) } : {}),
      }
    }

    parseDynamicOptionalBlock(n: ast.DynamicOptionalBlock): c4.DynamicOptionalBlock {
      return {
        kind: 'optional',
        id: pathInsideDynamicView(n),
        condition: n.condition,
        body: this.parseDynamicBlockBody(n.body),
      }
    }

    parseDynamicRepeatBlock(n: ast.DynamicRepeatBlock): c4.DynamicRepeatBlock {
      return {
        kind: 'repeat',
        id: pathInsideDynamicView(n),
        ...(n.label !== undefined ? { label: n.label } : {}),
        body: this.parseDynamicBlockBody(n.body),
      }
    }

    parseDynamicGroupBlock(n: ast.DynamicGroupBlock): c4.DynamicGroupBlock {
      return {
        kind: 'group',
        id: pathInsideDynamicView(n),
        label: n.label,
        body: this.parseDynamicBlockBody(n.body),
      }
    }

    parseDynamicCriticalBlock(n: ast.DynamicCriticalBlock): c4.DynamicCriticalBlock {
      return {
        kind: 'critical',
        id: pathInsideDynamicView(n),
        label: n.label,
        body: this.parseDynamicBlockBody(n.body),
        fallbacks: n.fallbacks.map(f => ({
          label: f.label,
          body: this.parseDynamicBlockBody(f.body),
        })),
      }
    }

    parseDynamicBreakBlock(n: ast.DynamicBreakBlock): c4.DynamicBreakBlock {
      return {
        kind: 'break',
        id: pathInsideDynamicView(n),
        condition: n.condition,
        body: this.parseDynamicBlockBody(n.body),
      }
    }

    parseDynamicNote(n: ast.DynamicNote): c4.DynamicNote | undefined {
      const resolvedActors: c4.Fqn[] = []
      for (const actorRef of n.actors) {
        const el = elementRef(actorRef)
        if (!el) {
          return undefined
        }
        resolvedActors.push(this.resolveFqn(el))
      }
      if (!isNonEmptyArray(resolvedActors)) {
        return undefined
      }
      return {
        kind: 'note',
        id: pathInsideDynamicView(n),
        placement: n.placement,
        actors: resolvedActors as c4.NonEmptyReadonlyArray<c4.Fqn>,
        text: n.text,
      }
    }

    parseDynamicActivate(n: ast.DynamicActivate): c4.DynamicActivate | undefined {
      const el = elementRef(n.actor)
      if (!el) {
        return undefined
      }
      return {
        kind: 'activate',
        id: pathInsideDynamicView(n),
        actor: this.resolveFqn(el),
      }
    }

    parseDynamicDeactivate(n: ast.DynamicDeactivate): c4.DynamicDeactivate | undefined {
      const el = elementRef(n.actor)
      if (!el) {
        return undefined
      }
      return {
        kind: 'deactivate',
        id: pathInsideDynamicView(n),
        actor: this.resolveFqn(el),
      }
    }

    parseDynamicCreate(n: ast.DynamicCreate): c4.DynamicCreate | undefined {
      const el = elementRef(n.actor)
      if (!el) {
        return undefined
      }
      return {
        kind: 'create',
        id: pathInsideDynamicView(n),
        actor: this.resolveFqn(el),
      }
    }

    parseDynamicDestroy(n: ast.DynamicDestroy): c4.DynamicDestroy | undefined {
      const el = elementRef(n.actor)
      if (!el) {
        return undefined
      }
      return {
        kind: 'destroy',
        id: pathInsideDynamicView(n),
        actor: this.resolveFqn(el),
      }
    }

    parseAutonumberProperty(prop: ast.DynamicAutonumberProperty): { enabled: boolean; start?: number; step?: number } {
      // 'from N step M' form — always enabled
      if (prop.start !== undefined) {
        return {
          enabled: true,
          start: prop.start,
          ...(prop.increment !== undefined ? { step: prop.increment } : {}),
        }
      }
      // Distinguish `autonumber` (bare, no token) from `autonumber false`
      // by checking whether an explicit BOOLEAN keyword appears in the source.
      const sourceText = prop.$cstNode?.text ?? ''
      const hasExplicitBool = /\btrue\b|\bfalse\b/.test(sourceText)
      if (!hasExplicitBool) {
        // bare `autonumber` → enable with defaults
        return { enabled: true }
      }
      // explicit `autonumber true` or `autonumber false`
      return { enabled: prop.enabled }
    }

    /**
     * @returns non-empty array in case of step chain A -> B -> C
     */
    parseDynamicStep(node: ast.DynamicViewStep): c4.DynamicStep | c4.DynamicStepsSeries {
      if (ast.isDynamicStepSingle(node)) {
        return this.parseDynamicStepSingle(node)
      }
      const __series = this.recursiveParseDynamicStepChain(node)
      invariant(isNonEmptyArray(__series), 'Dynamic step chain must have at least one step')
      return {
        seriesId: pathInsideDynamicView(node),
        __series,
      }
    }

    recursiveParseDynamicStepChain(
      node: ast.DynamicStepChain,
      callstack?: Array<[source: c4.Fqn, target: c4.Fqn]>,
    ): c4.DynamicStep[] {
      if (ast.isDynamicStepSingle(node.source)) {
        if (!this.isValid(node.source)) {
          return []
        }
        const previous = this.parseDynamicStepSingle(node.source)

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
      const allprevious = this.recursiveParseDynamicStepChain(node.source, callstack)
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

    parseDynamicStepSingle(node: ast.DynamicStepSingle): c4.DynamicStep {
      const sourceEl = elementRef(node.source)
      if (!sourceEl) {
        throw new Error('Invalid reference to source')
      }
      let baseStep = {
        ...this.parseAbstractDynamicStep(node),
        source: this.resolveFqn(sourceEl),
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
      astnode: ast.AbstractDynamicStep,
    ): Writable<Except<c4.DynamicStep, 'source', { requireExactProps: true }>> {
      const targetEl = elementRef(astnode.target)
      if (!targetEl) {
        throw new Error('Invalid reference to target')
      }
      const step: Writable<Omit<c4.DynamicStep, 'source'>> = {
        target: this.resolveFqn(targetEl),
        astPath: pathInsideDynamicView(astnode),
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
  }
}

function pathInsideDynamicView(
  _node:
    | ast.AbstractDynamicStep
    | ast.DynamicViewParallelSteps
    | ast.DynamicBlockBody
    | ast.DynamicIfBlock
    | ast.DynamicOptionalBlock
    | ast.DynamicRepeatBlock
    | ast.DynamicGroupBlock
    | ast.DynamicCriticalBlock
    | ast.DynamicBreakBlock
    | ast.DynamicNote
    | ast.DynamicActivate
    | ast.DynamicDeactivate
    | ast.DynamicCreate
    | ast.DynamicDestroy,
): string {
  let node:
    | ast.AbstractDynamicStep
    | ast.DynamicViewParallelSteps
    | ast.DynamicBlockBody
    | ast.DynamicIfBlock
    | ast.DynamicOptionalBlock
    | ast.DynamicRepeatBlock
    | ast.DynamicGroupBlock
    | ast.DynamicCriticalBlock
    | ast.DynamicBreakBlock
    | ast.DynamicNote
    | ast.DynamicActivate
    | ast.DynamicDeactivate
    | ast.DynamicCreate
    | ast.DynamicDestroy
    | ast.DynamicViewBody = _node
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
    node = node.$container as typeof node | ast.DynamicViewBody
  }

  return path.join('')
}
