import { findLast, isTruthy, map, pipe } from 'remeda'
import { isDynamicBranchCollectionsEnabled } from '../../config/featureFlags'
import type { ElementModel, LikeC4Model } from '../../model'
import type {
  AnyAux,
  aux,
  DynamicBranchCollection,
  DynamicBranchEntry,
  DynamicBranchPath,
  DynamicStep,
  DynamicStepsSeries,
  DynamicViewStep,
  scalar,
} from '../../types'
import {
  type Color,
  type ComputedBranchCollection,
  type ComputedBranchCollectionPath,
  type ComputedBranchTrailEntry,
  type ComputedDynamicView,
  type ComputedEdge,
  type ParsedDynamicView as DynamicView,
  type RelationshipArrowType,
  type RelationshipLineType,
  type StepEdgeId,
  _stage,
  _type,
  exact,
  isDynamicBranchCollection,
  isDynamicStep,
  isDynamicStepsSeries,
  isViewRuleAutoLayout,
  stepEdgeId,
  stepEdgePath,
  toLegacyParallel,
} from '../../types'
import { intersection, invariant, nonNullable, toArray, union } from '../../utils'
import { ancestorsFqn, commonAncestor, isAncestor, parentFqn, sortParentsFirst } from '../../utils/fqn'
import { applyCustomElementProperties } from '../utils/applyCustomElementProperties'
import { applyViewRuleStyles } from '../utils/applyViewRuleStyles'
import { buildComputedNodes, elementModelToNodeSource } from '../utils/buildComputedNodes'
import { buildElementNotations } from '../utils/buildElementNotations'
import { resolveGlobalRulesInDynamicView } from '../utils/resolve-global-rules'
import { calcViewLayoutHash } from '../utils/view-hash'
import { elementsFromIncludeProperties, elementsFromSteps, findRelations } from './utils'

type Element<A extends AnyAux> = ElementModel<A>

type BranchStackEntry<A extends AnyAux> = {
  branch: DynamicBranchCollection<A>
  path: DynamicBranchPath<A>
  pathIndex: number
  stepCounter: number
}

type BranchCollectionAccumulator<A extends AnyAux> = {
  branch: DynamicBranchCollection<A>
  paths: Map<string, {
    path: DynamicBranchPath<A>
    pathIndex: number
    edgeIds: scalar.EdgeId[]
  }>
}

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
    branchTrail?: ComputedBranchTrailEntry<A>[]
  }
}

class DynamicViewCompute<A extends AnyAux> {
  // Intermediate state
  private steps = [] as DynamicViewCompute.Step<A>[]
  private branchCollections = new Map<string, BranchCollectionAccumulator<A>>()
  private actors: Element<A>[] = []
  private compounds: Element<A>[] = []

  constructor(
    protected model: LikeC4Model<A>,
    protected view: DynamicView<A>,
  ) {}

  private ensureBranchCollection(branch: DynamicBranchCollection<A>): BranchCollectionAccumulator<A> {
    let acc = this.branchCollections.get(branch.branchId)
    if (!acc) {
      acc = {
        branch,
        paths: new Map(),
      }
      this.branchCollections.set(branch.branchId, acc)
    }
    return acc
  }

  private ensureBranchPath(entry: BranchStackEntry<A>): void {
    const acc = this.ensureBranchCollection(entry.branch)
    if (!acc.paths.has(entry.path.pathId)) {
      acc.paths.set(entry.path.pathId, {
        path: entry.path,
        pathIndex: entry.pathIndex,
        edgeIds: [],
      })
    }
  }

  private registerBranchStep(branchStack: readonly BranchStackEntry<A>[], id: StepEdgeId): void {
    for (const entry of branchStack) {
      const acc = this.ensureBranchCollection(entry.branch)
      const pathAcc = acc.paths.get(entry.path.pathId)
      if (pathAcc) {
        pathAcc.edgeIds.push(id as unknown as scalar.EdgeId)
      }
    }
  }

  private buildBranchTrail(branchStack: readonly BranchStackEntry<A>[]): ComputedBranchTrailEntry<A>[] {
    return branchStack.map(entry =>
      exact({
        branchId: entry.branch.branchId,
        pathId: entry.path.pathId,
        kind: entry.branch.kind,
        pathIndex: entry.pathIndex,
        indexWithinPath: entry.stepCounter + 1,
        pathName: entry.path.pathName,
        pathTitle: entry.path.pathTitle ?? null,
        isDefaultPath: entry.branch.defaultPathId === entry.path.pathId,
      })
    )
  }

  private finalizeBranchCollections(): ComputedBranchCollection<A>[] {
    return [...this.branchCollections.values()].map(acc => {
      const paths: ComputedBranchCollectionPath<A>[] = [...acc.paths.values()]
        .sort((a, b) => a.pathIndex - b.pathIndex)
        .map(pathAcc => {
          const path: ComputedBranchCollectionPath<A> = {
            pathId: pathAcc.path.pathId,
            pathIndex: pathAcc.pathIndex,
            pathTitle: pathAcc.path.pathTitle ?? null,
            edgeIds: [...pathAcc.edgeIds],
            isDefaultPath: acc.branch.defaultPathId === pathAcc.path.pathId,
          }
          if (pathAcc.path.pathName !== undefined) {
            path.pathName = pathAcc.path.pathName
          }
          if (pathAcc.path.description !== undefined) {
            path.description = pathAcc.path.description
          }
          if (pathAcc.path.tags) {
            path.tags = pathAcc.path.tags
          }
          return path
        })

      const collection: ComputedBranchCollection<A> = {
        branchId: acc.branch.branchId,
        astPath: acc.branch.astPath,
        kind: acc.branch.kind,
        paths,
      }
      if (acc.branch.label !== undefined) {
        collection.label = acc.branch.label
      }
      if (acc.branch.defaultPathId !== undefined) {
        collection.defaultPathId = acc.branch.defaultPathId
      }
      return collection
    })
  }

  private emitStep(
    step: DynamicStep<A>,
    id: StepEdgeId,
    branchStack?: BranchStackEntry<A>[],
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
    const sourceColumn = this.actors.indexOf(source)
    invariant(sourceColumn >= 0, `Source ${stepSource} not found`)
    const target = this.model.element(stepTarget)
    const targetColumn = this.actors.indexOf(target)
    invariant(targetColumn >= 0, `Target ${stepTarget} not found`)

    if (this.compounds.includes(source) || this.compounds.includes(target)) {
      console.error(`Step ${source.id} -> ${target.id} skipped because it involves a compound`)
      return;
    }
      title,
      relations,
      navigateTo: derivedNavigateTo,
      ...derived
    } = findRelations(source, target, this.view.id)

    const navigateTo = isTruthy(stepNavigateTo) && stepNavigateTo !== this.view.id
      ? stepNavigateTo
      : derivedNavigateTo

    const branchTrail = branchStack && branchStack.length > 0 ? this.buildBranchTrail(branchStack) : undefined
    if (branchStack && branchStack.length > 0) {
      this.registerBranchStep(branchStack, id)
      for (const entry of branchStack) {
        entry.stepCounter++
      }
    }

    this.steps.push(exact({
      ...derived,
      ...rest,
      id,
      source,
      target,
      navigateTo,
      title: stepTitle ?? title,
      relations: relations ?? [],
      isBackward: sourceColumn > targetColumn,
      ...(branchTrail && { branchTrail }),
    }))
  }

  private buildStepId(rootIndex: number, branchStack?: BranchStackEntry<A>[]): StepEdgeId {
    if (!branchStack || branchStack.length === 0) {
      return stepEdgePath([rootIndex])
    }
    const segments: number[] = [rootIndex]
    for (const entry of branchStack) {
      segments.push(entry.pathIndex)
    }
    const innermost = branchStack[branchStack.length - 1]!
    segments.push(innermost.stepCounter + 1)
    return stepEdgePath(segments as [number, ...number[]])
  }

  private processLegacySteps(viewSteps: DynamicViewStep<A>[]): void {
    const process = (step: DynamicStep<A> | DynamicStepsSeries<A>, stepNum: number, prefix?: number): number => {
      if (isDynamicStepsSeries(step)) {
        for (const item of step.__series) {
          stepNum = process(item, stepNum, prefix)
        }
        return stepNum
      }
      const id = prefix
        ? stepEdgeId(prefix, stepNum)
        : stepEdgeId(stepNum)
      this.emitStep(step, id)
      return stepNum + 1
    }

    let stepNum = 1
    for (const step of viewSteps) {
      const legacyParallel = toLegacyParallel(step)
      if (legacyParallel) {
        let nestedStepNum = 1
        for (const item of legacyParallel.__parallel ?? []) {
          nestedStepNum = process(item, nestedStepNum, stepNum)
        }
        stepNum++
        continue
      }
      if (isDynamicStepsSeries(step)) {
        stepNum = process(step, stepNum)
        continue
      }
      if (isDynamicStep(step)) {
        stepNum = process(step, stepNum)
        continue
      }
      if (isDynamicBranchCollection(step)) {
        const walkBranchEntries = (entries: readonly DynamicBranchEntry<A>[], prefix?: number) => {
          for (const entry of entries) {
            const legacyNested = toLegacyParallel(entry as unknown as DynamicViewStep<A>)
            if (legacyNested) {
              let nested = 1
              for (const nestedEntry of legacyNested.__parallel ?? []) {
                nested = process(nestedEntry, nested, prefix ?? stepNum)
              }
              stepNum++
              continue
            }
            if (isDynamicStepsSeries(entry)) {
              stepNum = process(entry, stepNum, prefix)
              continue
            }
            if (isDynamicStep(entry)) {
              stepNum = process(entry, stepNum, prefix)
              continue
            }
            if (isDynamicBranchCollection(entry)) {
              for (const nestedPath of entry.paths) {
                walkBranchEntries(nestedPath.steps, prefix)
              }
            }
          }
        }
        for (const path of step.paths) {
          walkBranchEntries(path.steps)
        }
        continue
      }
    }
  }

  private processBranchAwareSteps(viewSteps: DynamicViewStep<A>[]): void {
    const branchStack: BranchStackEntry<A>[] = []

    const emitInBranch = (step: DynamicStep<A>, rootIndex: number) => {
      const id = this.buildStepId(rootIndex, branchStack)
      this.emitStep(step, id, branchStack)
    }

    const emitAtRoot = (step: DynamicStep<A>, rootIndex: number) => {
      const id = this.buildStepId(rootIndex)
      this.emitStep(step, id)
    }

    const processLegacyParallelAtRoot = (parallel: ReturnType<typeof toLegacyParallel>, rootIndex: number): void => {
      let nestedIndex = 1
      for (const entry of parallel?.__parallel ?? []) {
        if (isDynamicStepsSeries(entry)) {
          for (const item of entry.__series) {
            const id = stepEdgeId(rootIndex, nestedIndex)
            this.emitStep(item, id)
            nestedIndex++
          }
          continue
        }
        const id = stepEdgeId(rootIndex, nestedIndex)
        this.emitStep(entry as DynamicStep<A>, id)
        nestedIndex++
      }
    }

    const processBranchEntries = (entries: readonly DynamicBranchEntry<A>[], rootIndex: number): void => {
      for (const entry of entries) {
        const legacyNested = toLegacyParallel(entry as unknown as DynamicViewStep<A>)
        if (legacyNested) {
          for (const nestedEntry of legacyNested.__parallel ?? []) {
            if (isDynamicStepsSeries(nestedEntry)) {
              for (const item of nestedEntry.__series) {
                emitInBranch(item, rootIndex)
              }
            } else {
              emitInBranch(nestedEntry as DynamicStep<A>, rootIndex)
            }
          }
          continue
        }
        if (isDynamicStepsSeries(entry)) {
          for (const item of entry.__series) {
            emitInBranch(item, rootIndex)
          }
          continue
        }
        if (isDynamicStep(entry)) {
          emitInBranch(entry, rootIndex)
          continue
        }
        if (isDynamicBranchCollection(entry)) {
          const legacy = toLegacyParallel(entry as unknown as DynamicViewStep<A>)
          if (legacy) {
            processBranchEntries(legacy.__parallel ?? [], rootIndex)
            continue
          }
          processBranchCollection(entry, rootIndex)
        }
      }
    }

    const processBranchCollection = (branch: DynamicBranchCollection<A>, rootIndex: number): void => {
      for (let pathIndex = 0; pathIndex < branch.paths.length; pathIndex++) {
        const path = branch.paths[pathIndex]!
        const entry: BranchStackEntry<A> = {
          branch,
          path,
          pathIndex: pathIndex + 1,
          stepCounter: 0,
        }
        this.ensureBranchPath(entry)
        branchStack.push(entry)
        processBranchEntries(path.steps, rootIndex)
        branchStack.pop()
      }
    }

    let rootIndex = 1
    for (const step of viewSteps) {
      const legacyParallel = toLegacyParallel(step)
      if (legacyParallel) {
        processLegacyParallelAtRoot(legacyParallel, rootIndex)
        rootIndex++
        continue
      }
      if (isDynamicBranchCollection(step)) {
        processBranchCollection(step, rootIndex)
        rootIndex++
        continue
      }
      if (isDynamicStepsSeries(step)) {
        for (const item of step.__series) {
          emitAtRoot(item, rootIndex)
          rootIndex++
        }
        continue
      }
      if (isDynamicStep(step)) {
        emitAtRoot(step, rootIndex)
        rootIndex++
        continue
      }
    }
  }

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

    // Identify compounds
    const compounds = actors.reduce((acc, actor, index, all) => {
      for (let i = index + 1; i < all.length; i++) {
        const other = all[i]!
        if (isAncestor(actor, other)) {
          acc.push(actor)
          break
        }
      }
      return acc
    }, [] as Element<A>[])

    this.actors = actors
    this.compounds = compounds

    // Check feature flag in order of precedence:
    // 1. Programmatic feature flag (for tests)
    // 2. Project config
    // 3. Environment variable (backward compatibility)
    const programmaticEnabled = isDynamicBranchCollectionsEnabled()
    const configEnabled = this.model.$data.project.experimental?.dynamicBranchCollections
    const envEnabled = typeof process !== 'undefined' && process?.env
      ? isTruthy(process.env['LIKEC4_UNIFIED_BRANCHES'] ?? process.env['LIKEC4_EXPERIMENTAL_UNIFIED_BRANCHES'])
      : false
    const branchFeatureEnabled = programmaticEnabled || (configEnabled ?? envEnabled)

    if (branchFeatureEnabled) {
      this.processBranchAwareSteps(viewSteps)
    } else {
      this.processLegacySteps(viewSteps)
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
        id: id as unknown as aux.EdgeId,
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
      ...(nodeNotations.length > 0 && {
        notation: {
          nodes: nodeNotations,
        },
      }),
      ...(branchFeatureEnabled && this.branchCollections.size > 0 && {
        branchCollections: this.finalizeBranchCollections(),
      }),
    })
  }
}
export function computeDynamicView<M extends AnyAux>(
  model: LikeC4Model<M>,
  view: DynamicView<M>,
): ComputedDynamicView<M> {
  return new DynamicViewCompute(model, view).compute()
}
