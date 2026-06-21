import { findLast, isTruthy, map, pipe } from 'remeda'
import type { ElementModel, LikeC4Model } from '../../model'
import type { AnyAux, aux, DynamicStep, scalar } from '../../types'
import {
  type Color,
  type ComputedDynamicView,
  type ComputedEdge,
  type ComputedFrame,
  type ComputedMarker,
  type DynamicViewElement,
  type ParsedDynamicView as DynamicView,
  type RelationshipArrowType,
  type RelationshipLineType,
  type StepEdgeId,
  _stage,
  _type,
  exact,
  isDynamicActivate,
  isDynamicBreakBlock,
  isDynamicCreate,
  isDynamicCriticalBlock,
  isDynamicDeactivate,
  isDynamicDestroy,
  isDynamicGroupBlock,
  isDynamicIfBlock,
  isDynamicNote,
  isDynamicOptionalBlock,
  isDynamicRepeatBlock,
  isDynamicStep,
  isDynamicStepsParallel,
  isDynamicStepsSeries,
  isViewRuleAutoLayout,
  stepEdgeId,
} from '../../types'
import { intersection, invariant, nonNullable, toArray, union } from '../../utils'
import { ancestorsFqn, commonAncestor, parentFqn, sortParentsFirst } from '../../utils/fqn'
import { applyCustomElementProperties } from '../utils/applyCustomElementProperties'
import { applyViewRuleStyles } from '../utils/applyViewRuleStyles'
import { buildComputedNodes, elementModelToNodeSource } from '../utils/buildComputedNodes'
import { buildElementNotations } from '../utils/buildElementNotations'
import { resolveGlobalRulesInDynamicView } from '../utils/resolve-global-rules'
import { calcViewLayoutHash } from '../utils/view-hash'
import { elementsFromIncludeProperties, elementsFromSteps, findRelations } from './utils'

type Element<A extends AnyAux> = ElementModel<A>

namespace DynamicViewCompute {
  export interface Step<A extends AnyAux> {
    id: StepEdgeId
    source: Element<A>
    target: Element<A>
    title?: string
    kind?: aux.RelationKind<A>
    description?: scalar.MarkdownOrString
    technology?: string
    // Notes for walkthrough
    notes?: scalar.MarkdownOrString
    color?: Color
    line?: RelationshipLineType
    head?: RelationshipArrowType
    tail?: RelationshipArrowType
    relations: scalar.RelationId[]
    isBackward: boolean
    navigateTo?: aux.StrictViewId<A>
    tags?: aux.Tags<A>
    astPath: string
  }
}

/**
 * Build a step edge ID from the top-level counter and path-stack segments.
 *
 * Edge-ID convention (back-compat critical):
 *   - Top-level step at position NN: `step-NN` (zero-padded to 2 digits)
 *   - Legacy parallel flat-children (no branches): `step-NN.M` via stepEdgeId(NN, M)  ← back-compat
 *   - Step inside an `if` branch index bi (0-based), position k: `step-NN.alt.bi.k`
 *   - Step inside an `optional` body, position k: `step-NN.opt.k`
 *   - Step inside a `repeat` body, position k: `step-NN.loop.k`
 *   - Step inside a labeled `parallel` branch i (1-based), position k: `step-NN.par.i.k`
 *   - Step inside a `group` body, position k: `step-NN.grp.k`
 *   - Step inside a `critical` body, position k: `step-NN.crit.body.k`
 *     fallback i (1-based), position k: `step-NN.crit.on.i.k`
 *   - Step inside a `break` body, position k: `step-NN.brk.k`
 *
 * Nesting cascades: a step at `step-03.alt.0.2.par.1.1` is at top-level position 3,
 * inside the then-branch of an if at position 2, inside the 1st labeled parallel branch.
 *
 * Top-level counter semantics: increments once per top-level DynamicViewElement
 * (both leaf steps and block containers count as one slot each).
 */
function buildStepId(topNN: number, pathStack: string[]): string {
  const base = `step-${String(topNN).padStart(2, '0')}`
  return pathStack.length > 0 ? `${base}.${pathStack.join('.')}` : base
}

type WalkContext<A extends AnyAux> = {
  pathStack: string[] // accumulated frame-path segments for nested IDs
  frameStack: ComputedFrame[] // ancestor frames
  currentBranch: { stepIds: aux.EdgeId[]; markerIds: string[] } | null
  lastStepId: aux.EdgeId | null // last emitted step in current scope (for markers)
  // Refs needed inside the walker
  actors: Element<A>[]
}

class DynamicViewCompute<A extends AnyAux> {
  // Intermediate state
  private steps = [] as DynamicViewCompute.Step<A>[]

  // New output arrays for WI-6
  private frames = [] as ComputedFrame[]
  private markers = [] as ComputedMarker<A>[]

  constructor(
    protected model: LikeC4Model<A>,
    protected view: DynamicView<A>,
  ) {}

  compute(): ComputedDynamicView<A> {
    const {
      docUri: _docUri, // exclude docUri
      rules: _rules, // exclude rules
      steps: viewSteps,
      ...view
    } = this.view
    const rules = resolveGlobalRulesInDynamicView(_rules, this.model.globals)

    // Identify actors
    const explicits = elementsFromIncludeProperties(this.model, rules)
    const fromSteps = elementsFromSteps(this.model, viewSteps)
    const actors = pipe(
      union(
        // First all actors, that are explicitly included
        intersection(explicits, fromSteps),
        // Then all actors from steps
        fromSteps,
        // Then all explicits (not from steps)
        explicits,
      ),
      toArray(),
      sortParentsFirst,
    )

    const ctx: WalkContext<A> = {
      pathStack: [],
      frameStack: [],
      currentBranch: null,
      lastStepId: null,
      actors,
    }

    let topLevelCounter = 1
    for (const element of viewSteps) {
      const topNN = topLevelCounter
      ctx.pathStack = []

      if (isDynamicStepsParallel(element) && (!element.branches || element.branches.length === 0)) {
        // Legacy flat-children parallel: keep `step-NN.M` for back-compat
        let parallelStep = 1
        for (const s of element.__parallel) {
          const id = stepEdgeId(topNN, parallelStep) as aux.EdgeId
          if (isDynamicStepsSeries(s)) {
            for (const sub of s.__series) {
              if (isDynamicStep(sub)) {
                this.emitStep(sub, id, actors)
                ctx.lastStepId = id
              }
            }
          } else if (isDynamicStep(s)) {
            this.emitStep(s, id, actors)
            ctx.lastStepId = id
          }
          parallelStep++
        }
        topLevelCounter++
        continue
      }

      this.walkElement(element, ctx, topNN)
      topLevelCounter++
    }

    const nodesMap = buildComputedNodes(
      this.model.$styles,
      actors.map(elementModelToNodeSource),
    )

    const defaults = this.model.$styles.defaults.relationship

    const edges = this.steps.map(({ id, source, target, relations, title, isBackward, tags, ...step }) => {
      const sourceNode = nonNullable(nodesMap.get(source.id as scalar.NodeId), `Source node ${source.id} not found`)
      const targetNode = nonNullable(nodesMap.get(target.id as scalar.NodeId), `Target node ${target.id} not found`)
      const edge: ComputedEdge<A> = {
        id: id as aux.EdgeId,
        parent: commonAncestor(source.id, target.id) as scalar.NodeId | null,
        source: sourceNode.id,
        target: targetNode.id,
        label: title ?? null,
        relations,
        color: defaults.color,
        line: defaults.line,
        head: defaults.arrow,
        tags: tags ?? [],
        ...step,
      }
      if (isBackward) {
        edge.dir = 'back'
      }

      while (edge.parent && !nodesMap.has(edge.parent)) {
        edge.parent = parentFqn(edge.parent)
      }
      sourceNode.outEdges.push(edge.id)
      targetNode.inEdges.push(edge.id)
      // Process edge source ancestors
      for (const sourceAncestor of ancestorsFqn(edge.source)) {
        if (sourceAncestor === edge.parent) {
          break
        }
        nodesMap.get(sourceAncestor)?.outEdges.push(edge.id)
      }
      // Process target hierarchy
      for (const targetAncestor of ancestorsFqn(edge.target)) {
        if (targetAncestor === edge.parent) {
          break
        }
        nodesMap.get(targetAncestor)?.inEdges.push(edge.id)
      }
      return edge
    })

    const nodes = applyCustomElementProperties(
      rules,
      applyViewRuleStyles(
        rules,
        // Keep order of elements
        actors.map(e => nonNullable(nodesMap.get(e.id as scalar.NodeId))),
      ),
    )

    const autoLayoutRule = findLast(rules, isViewRuleAutoLayout)

    const nodeNotations = buildElementNotations(nodes)

    return calcViewLayoutHash({
      ...view,
      [_type]: 'dynamic',
      [_stage]: 'computed',
      variant: view.variant ?? 'diagram',
      autoLayout: {
        direction: autoLayoutRule?.direction ?? 'LR',
        ...(autoLayoutRule?.nodeSep && { nodeSep: autoLayoutRule.nodeSep }),
        ...(autoLayoutRule?.rankSep && { rankSep: autoLayoutRule.rankSep }),
      },
      nodes: map(nodes, n => {
        if (n.icon === 'none') {
          delete n.icon
        }
        return n
      }),
      edges,
      ...(this.frames.length > 0 && { frames: this.frames }),
      ...(this.markers.length > 0 && { markers: this.markers }),
      ...(view.autonumber !== undefined && { autonumber: view.autonumber }),
      ...(nodeNotations.length > 0 && {
        notation: {
          nodes: nodeNotations,
        },
      }),
    })
  }

  /**
   * Emit a single DynamicStep into this.steps.
   */
  private emitStep(
    step: DynamicStep<A>,
    id: aux.EdgeId,
    actors: Element<A>[],
  ): void {
    const {
      source: stepSource,
      target: stepTarget,
      title: stepTitle,
      isBackward: _isBackward,
      navigateTo: stepNavigateTo,
      notation: _notation,
      ...rest
    } = step

    const source = this.model.element(stepSource)
    const sourceColumn = actors.indexOf(source)
    invariant(sourceColumn >= 0, `Source ${stepSource} not found`)
    const target = this.model.element(stepTarget)
    const targetColumn = actors.indexOf(target)
    invariant(targetColumn >= 0, `Target ${stepTarget} not found`)

    const {
      title,
      relations,
      navigateTo: derivedNavigateTo,
      ...derived
    } = findRelations(source, target, this.view.id)

    const navigateTo = isTruthy(stepNavigateTo) && stepNavigateTo !== this.view.id
      ? stepNavigateTo
      : derivedNavigateTo

    const kindSpec = step.kind
      ? this.model.specification.relationships[step.kind]
      : undefined

    this.steps.push(exact({
      ...derived,
      ...(!step.technology && !derived.technology && kindSpec?.technology && { technology: kindSpec.technology }),
      ...(!step.color && !derived.color && kindSpec?.color && { color: kindSpec.color }),
      ...(!step.line && !derived.line && kindSpec?.line && { line: kindSpec.line }),
      ...(!step.head && kindSpec?.head && { head: kindSpec.head }),
      ...(!step.tail && kindSpec?.tail && { tail: kindSpec.tail }),
      ...rest,
      id: id as StepEdgeId,
      source,
      target,
      navigateTo,
      title: stepTitle ?? title,
      relations: relations ?? [],
      isBackward: sourceColumn > targetColumn,
    }))
  }

  /**
   * Recursive walker for a single DynamicViewElement.
   *
   * `topNN` is the top-level position counter (used as the `NN` in `step-NN`).
   * `ctx.pathStack` contains the current accumulated path segments below `step-NN`.
   *
   * For steps: the ID is built from `topNN` + `ctx.pathStack`.
   * For blocks: a ComputedFrame is created and pushed to `this.frames`, then we
   *   recurse into each branch with an updated pathStack.
   * For markers: a ComputedMarker is created referencing `ctx.lastStepId`.
   */
  private walkElement(
    element: DynamicViewElement<A>,
    ctx: WalkContext<A>,
    topNN: number,
  ): void {
    switch (true) {
      // ── plain step ──────────────────────────────────────────────────────
      case isDynamicStep(element): {
        const id = buildStepId(topNN, ctx.pathStack) as aux.EdgeId
        this.emitStep(element, id, ctx.actors)
        ctx.lastStepId = id
        ctx.currentBranch?.stepIds.push(id)
        return
      }

      // ── series (sequential steps grouped under one node) ─────────────────
      case isDynamicStepsSeries(element): {
        for (const s of element.__series) {
          this.walkElement(s, ctx, topNN)
        }
        return
      }

      // ── parallel (labeled branches) ─────────────────────────────────────
      case isDynamicStepsParallel(element): {
        if (!element.branches || element.branches.length === 0) {
          // Legacy path — only reached for nested parallels without branches
          let parallelStep = 1
          for (const s of element.__parallel) {
            const id = stepEdgeId(topNN, parallelStep) as aux.EdgeId
            if (isDynamicStepsSeries(s)) {
              for (const sub of s.__series) {
                if (isDynamicStep(sub)) {
                  this.emitStep(sub, id, ctx.actors)
                  ctx.lastStepId = id
                  ctx.currentBranch?.stepIds.push(id)
                }
              }
            } else if (isDynamicStep(s)) {
              this.emitStep(s, id, ctx.actors)
              ctx.lastStepId = id
              ctx.currentBranch?.stepIds.push(id)
            }
            parallelStep++
          }
          return
        }

        const frameId = element.parallelId
        const depth = ctx.frameStack.length
        const parentId = ctx.frameStack.length > 0 ? ctx.frameStack[ctx.frameStack.length - 1]!.id : undefined

        const frameBranches: Array<{
          label?: string
          stepIds: aux.EdgeId[]
          markerIds: string[]
        }> = []

        const savedBranch = ctx.currentBranch
        const savedLastStep = ctx.lastStepId
        const savedPathStack = ctx.pathStack

        const frame: ComputedFrame = {
          id: frameId,
          kind: 'parallel',
          depth,
          ...(parentId !== undefined && { parent: parentId }),
          branches: frameBranches,
        }
        ctx.frameStack.push(frame)

        for (let bi = 0; bi < element.branches.length; bi++) {
          const branch = element.branches[bi]!
          const branchBase = [...savedPathStack, 'par', String(bi + 1)]
          const branchAccum: { stepIds: aux.EdgeId[]; markerIds: string[] } = { stepIds: [], markerIds: [] }
          ctx.currentBranch = branchAccum
          ctx.lastStepId = savedLastStep

          let innerCounter = 1
          for (const el of branch.elements) {
            ctx.pathStack = [...branchBase, String(innerCounter)]
            this.walkElement(el, ctx, topNN)
            if (this.countsAsStep(el)) innerCounter++
          }

          frameBranches.push({
            ...(branch.label !== undefined && { label: branch.label }),
            stepIds: branchAccum.stepIds,
            markerIds: branchAccum.markerIds,
          })
        }

        ctx.frameStack.pop()
        ctx.pathStack = savedPathStack
        ctx.currentBranch = savedBranch

        if (savedBranch) {
          for (const fb of frameBranches) {
            savedBranch.stepIds.push(...fb.stepIds)
            savedBranch.markerIds.push(...fb.markerIds)
          }
        }

        this.frames.push(frame)
        return
      }

      // ── if ─────────────────────────────────────────────────────────────
      case isDynamicIfBlock(element): {
        const frameId = element.id
        const depth = ctx.frameStack.length
        const parentId = ctx.frameStack.length > 0 ? ctx.frameStack[ctx.frameStack.length - 1]!.id : undefined

        type BranchDef = { condition?: string; elements: DynamicViewElement<A>[] }
        const allBranches: BranchDef[] = [
          { condition: element.condition, elements: [...element.thenBranch.elements] },
          ...element.elseIfs.map(ei => ({ condition: ei.condition, elements: [...ei.body.elements] })),
          ...(element.else ? [{ elements: [...element.else.elements] }] : []),
        ]

        const frameBranches: Array<{
          condition?: string
          stepIds: aux.EdgeId[]
          markerIds: string[]
        }> = []

        const savedBranch = ctx.currentBranch
        const savedLastStep = ctx.lastStepId
        const savedPathStack = ctx.pathStack

        const frame: ComputedFrame = {
          id: frameId,
          kind: 'if',
          condition: element.condition,
          depth,
          ...(parentId !== undefined && { parent: parentId }),
          branches: frameBranches,
        }
        ctx.frameStack.push(frame)

        for (let bi = 0; bi < allBranches.length; bi++) {
          const branch = allBranches[bi]!
          const branchBase = [...savedPathStack, 'alt', String(bi)]
          const branchAccum: { stepIds: aux.EdgeId[]; markerIds: string[] } = { stepIds: [], markerIds: [] }
          ctx.currentBranch = branchAccum
          ctx.lastStepId = savedLastStep

          let innerCounter = 1
          for (const el of branch.elements) {
            ctx.pathStack = [...branchBase, String(innerCounter)]
            this.walkElement(el, ctx, topNN)
            if (this.countsAsStep(el)) innerCounter++
          }

          frameBranches.push({
            ...(branch.condition !== undefined && { condition: branch.condition }),
            stepIds: branchAccum.stepIds,
            markerIds: branchAccum.markerIds,
          })
        }

        ctx.frameStack.pop()
        ctx.pathStack = savedPathStack
        ctx.currentBranch = savedBranch

        if (savedBranch) {
          for (const fb of frameBranches) {
            savedBranch.stepIds.push(...fb.stepIds)
            savedBranch.markerIds.push(...fb.markerIds)
          }
        }

        this.frames.push(frame)
        return
      }

      // ── optional ───────────────────────────────────────────────────────
      case isDynamicOptionalBlock(element): {
        this.walkSingleBodyFrame(
          element.id,
          'optional',
          { condition: element.condition },
          element.body.elements,
          'opt',
          ctx,
          topNN,
        )
        return
      }

      // ── repeat ─────────────────────────────────────────────────────────
      case isDynamicRepeatBlock(element): {
        this.walkSingleBodyFrame(
          element.id,
          'repeat',
          { ...(element.label !== undefined && { label: element.label }) },
          element.body.elements,
          'loop',
          ctx,
          topNN,
        )
        return
      }

      // ── group ──────────────────────────────────────────────────────────
      case isDynamicGroupBlock(element): {
        this.walkSingleBodyFrame(
          element.id,
          'group',
          { label: element.label },
          element.body.elements,
          'grp',
          ctx,
          topNN,
        )
        return
      }

      // ── break ──────────────────────────────────────────────────────────
      case isDynamicBreakBlock(element): {
        this.walkSingleBodyFrame(
          element.id,
          'break',
          { condition: element.condition },
          element.body.elements,
          'brk',
          ctx,
          topNN,
        )
        return
      }

      // ── critical ───────────────────────────────────────────────────────
      case isDynamicCriticalBlock(element): {
        const frameId = element.id
        const depth = ctx.frameStack.length
        const parentId = ctx.frameStack.length > 0 ? ctx.frameStack[ctx.frameStack.length - 1]!.id : undefined

        const frameBranches: Array<{
          label?: string
          stepIds: aux.EdgeId[]
          markerIds: string[]
        }> = []

        const savedBranch = ctx.currentBranch
        const savedLastStep = ctx.lastStepId
        const savedPathStack = ctx.pathStack

        const frame: ComputedFrame = {
          id: frameId,
          kind: 'critical',
          label: element.label,
          depth,
          ...(parentId !== undefined && { parent: parentId }),
          branches: frameBranches,
        }
        ctx.frameStack.push(frame)

        // body branch: crit.body.<k>
        const bodyAccum: { stepIds: aux.EdgeId[]; markerIds: string[] } = { stepIds: [], markerIds: [] }
        ctx.currentBranch = bodyAccum
        ctx.lastStepId = savedLastStep
        let bodyCounter = 1
        for (const el of element.body.elements) {
          ctx.pathStack = [...savedPathStack, 'crit', 'body', String(bodyCounter)]
          this.walkElement(el, ctx, topNN)
          if (this.countsAsStep(el)) bodyCounter++
        }
        frameBranches.push({ label: element.label, stepIds: bodyAccum.stepIds, markerIds: bodyAccum.markerIds })

        // fallback branches: crit.on.<i>.<k>
        for (let fi = 0; fi < element.fallbacks.length; fi++) {
          const fallback = element.fallbacks[fi]!
          const fallbackAccum: { stepIds: aux.EdgeId[]; markerIds: string[] } = { stepIds: [], markerIds: [] }
          ctx.currentBranch = fallbackAccum
          ctx.lastStepId = savedLastStep
          let fbCounter = 1
          for (const el of fallback.body.elements) {
            ctx.pathStack = [...savedPathStack, 'crit', 'on', String(fi + 1), String(fbCounter)]
            this.walkElement(el, ctx, topNN)
            if (this.countsAsStep(el)) fbCounter++
          }
          frameBranches.push({
            label: fallback.label,
            stepIds: fallbackAccum.stepIds,
            markerIds: fallbackAccum.markerIds,
          })
        }

        ctx.frameStack.pop()
        ctx.pathStack = savedPathStack
        ctx.currentBranch = savedBranch

        if (savedBranch) {
          for (const fb of frameBranches) {
            savedBranch.stepIds.push(...fb.stepIds)
            savedBranch.markerIds.push(...fb.markerIds)
          }
        }

        this.frames.push(frame)
        return
      }

      // ── note ───────────────────────────────────────────────────────────
      case isDynamicNote(element): {
        const marker: ComputedMarker<A> = {
          kind: 'note',
          id: element.id,
          placement: element.placement,
          actors: element.actors.map(fqn => fqn as scalar.NodeId),
          text: element.text,
          ...(ctx.lastStepId !== null && { afterStep: ctx.lastStepId }),
        }
        this.markers.push(marker)
        ctx.currentBranch?.markerIds.push(element.id)
        return
      }

      // ── activate ───────────────────────────────────────────────────────
      case isDynamicActivate(element): {
        const marker: ComputedMarker<A> = {
          kind: 'activate',
          id: element.id,
          actor: element.actor as scalar.NodeId,
          ...(ctx.lastStepId !== null && { afterStep: ctx.lastStepId }),
        }
        this.markers.push(marker)
        ctx.currentBranch?.markerIds.push(element.id)
        return
      }

      // ── deactivate ─────────────────────────────────────────────────────
      case isDynamicDeactivate(element): {
        const marker: ComputedMarker<A> = {
          kind: 'deactivate',
          id: element.id,
          actor: element.actor as scalar.NodeId,
          ...(ctx.lastStepId !== null && { afterStep: ctx.lastStepId }),
        }
        this.markers.push(marker)
        ctx.currentBranch?.markerIds.push(element.id)
        return
      }

      // ── create ─────────────────────────────────────────────────────────
      case isDynamicCreate(element): {
        const marker: ComputedMarker<A> = {
          kind: 'create',
          id: element.id,
          actor: element.actor as scalar.NodeId,
          ...(ctx.lastStepId !== null && { afterStep: ctx.lastStepId }),
        }
        this.markers.push(marker)
        ctx.currentBranch?.markerIds.push(element.id)
        return
      }

      // ── destroy ────────────────────────────────────────────────────────
      case isDynamicDestroy(element): {
        const marker: ComputedMarker<A> = {
          kind: 'destroy',
          id: element.id,
          actor: element.actor as scalar.NodeId,
          ...(ctx.lastStepId !== null && { afterStep: ctx.lastStepId }),
        }
        this.markers.push(marker)
        ctx.currentBranch?.markerIds.push(element.id)
        return
      }
    }
  }

  /**
   * Walk a single-body block (optional, repeat, group, break).
   * Creates a ComputedFrame with one branch and recurses into body elements.
   */
  private walkSingleBodyFrame(
    frameId: string,
    kind: ComputedFrame['kind'],
    labelOrCondition: { label?: string; condition?: string },
    bodyElements: DynamicViewElement<A>[],
    pathSeg: string,
    ctx: WalkContext<A>,
    topNN: number,
  ): void {
    const depth = ctx.frameStack.length
    const parentId = ctx.frameStack.length > 0 ? ctx.frameStack[ctx.frameStack.length - 1]!.id : undefined
    const savedBranch = ctx.currentBranch
    const savedLastStep = ctx.lastStepId
    const savedPathStack = ctx.pathStack

    const branchAccum: { stepIds: aux.EdgeId[]; markerIds: string[] } = { stepIds: [], markerIds: [] }
    ctx.currentBranch = branchAccum
    ctx.lastStepId = savedLastStep

    // Build frame props without spreading undefined optionals (exactOptionalPropertyTypes)
    const frame: ComputedFrame = {
      id: frameId,
      kind,
      ...(labelOrCondition.label !== undefined && { label: labelOrCondition.label }),
      ...(labelOrCondition.condition !== undefined && { condition: labelOrCondition.condition }),
      depth,
      ...(parentId !== undefined && { parent: parentId }),
      branches: [{ stepIds: branchAccum.stepIds, markerIds: branchAccum.markerIds }],
    }
    ctx.frameStack.push(frame)

    let innerCounter = 1
    for (const el of bodyElements) {
      ctx.pathStack = [...savedPathStack, pathSeg, String(innerCounter)]
      this.walkElement(el, ctx, topNN)
      if (this.countsAsStep(el)) innerCounter++
    }

    ctx.frameStack.pop()
    ctx.pathStack = savedPathStack
    ctx.currentBranch = savedBranch

    if (savedBranch) {
      savedBranch.stepIds.push(...branchAccum.stepIds)
      savedBranch.markerIds.push(...branchAccum.markerIds)
    }

    this.frames.push(frame)
  }

  /**
   * Returns true if the element should increment the per-branch inner counter.
   * Markers (note/activate/deactivate/create/destroy) do NOT increment; they share
   * the same counter slot as the step they annotate. Everything else increments.
   */
  private countsAsStep(element: DynamicViewElement<A>): boolean {
    return !isDynamicNote(element)
      && !isDynamicActivate(element)
      && !isDynamicDeactivate(element)
      && !isDynamicCreate(element)
      && !isDynamicDestroy(element)
  }
}

export function computeDynamicView<M extends AnyAux>(
  model: LikeC4Model<M>,
  view: DynamicView<M>,
): ComputedDynamicView<M> {
  return new DynamicViewCompute(model, view).compute()
}
