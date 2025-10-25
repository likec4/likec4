import { findLast, isTruthy, map, pipe } from 'remeda'
import type { ElementModel, LikeC4Model } from '../../model'
import type {
  AnyAux,
  aux,
  DynamicBranchCollection,
  DynamicBranchEntry,
  DynamicStep,
  DynamicStepsSeries,
  DynamicViewStep,
  scalar,
} from '../../types'
import {
  type Color,
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

class DynamicViewCompute<A extends AnyAux> {
  // Intermediate state
  private steps = [] as DynamicViewCompute.Step<A>[]

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

    // Process steps
    const processStep = (step: DynamicStep<A> | DynamicStepsSeries<A>, stepNum: number, prefix?: number): number => {
      if (isDynamicStepsSeries(step)) {
        for (const s of step.__series) {
          stepNum = processStep(s, stepNum, prefix)
        }
        return stepNum
      }
      const id = prefix ? stepEdgeId(prefix, stepNum) : stepEdgeId(stepNum)

      const {
        source: stepSource,
        target: stepTarget,
        title: stepTitle,
        isBackward: _isBackward, // omit
        navigateTo: stepNavigateTo,
        notation: _notation, // omit
        ...rest
      } = step

      const source = this.model.element(stepSource)
      const sourceColumn = actors.indexOf(source)
      invariant(sourceColumn >= 0, `Source ${stepSource} not found`)
      const target = this.model.element(stepTarget)
      const targetColumn = actors.indexOf(target)
      invariant(targetColumn >= 0, `Target ${stepTarget} not found`)

      if (compounds.includes(source) || compounds.includes(target)) {
        console.error(`Step ${source.id} -> ${target.id} because it involves a compound`)
        // return stepNum
      }

      const {
        title,
        relations,
        navigateTo: derivedNavigateTo,
        ...derived
      } = findRelations(source, target, this.view.id)

      const navigateTo = isTruthy(stepNavigateTo) && stepNavigateTo !== this.view.id
        ? stepNavigateTo
        : derivedNavigateTo

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
      }))

      return stepNum + 1
    }

    let stepNum = 1
    for (const step of viewSteps) {
      const legacyParallel = toLegacyParallel(step)
      if (legacyParallel) {
        let nestedStepNum = 1
        for (const s of legacyParallel.__parallel ?? []) {
          nestedStepNum = processStep(s, nestedStepNum, stepNum)
        }
        stepNum++
        continue
      }
      if (isDynamicStepsSeries(step)) {
        stepNum = processStep(step, stepNum)
        continue
      }
      if (isDynamicStep(step)) {
        stepNum = processStep(step, stepNum)
        continue
      }
      if (isDynamicBranchCollection(step)) {
        const walkBranchEntries = (entries: readonly DynamicBranchEntry<A>[], prefix?: number) => {
          for (const entry of entries) {
            // Check for legacy parallel format in branch entries
            if (isDynamicBranchCollection(entry)) {
              const legacyNested = toLegacyParallel(entry)
              if (legacyNested) {
                let nested = 1
                for (const nestedEntry of legacyNested.__parallel ?? []) {
                  nested = processStep(nestedEntry, nested, prefix ?? stepNum)
                }
                stepNum++
                continue
              }
              // Recurse into nested branch collection paths
              for (const nestedPath of entry.paths) {
                walkBranchEntries(nestedPath.steps, prefix)
              }
              continue
            }
            if (isDynamicStepsSeries(entry)) {
              stepNum = processStep(entry, stepNum, prefix)
              continue
            }
            if (isDynamicStep(entry)) {
              stepNum = processStep(entry, stepNum, prefix)
              continue
            }
          }
        }
        for (const path of step.paths) {
          walkBranchEntries(path.steps)
        }
        continue
      }
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
    })
  }
}
export function computeDynamicView<M extends AnyAux>(
  model: LikeC4Model<M>,
  view: DynamicView<M>,
): ComputedDynamicView<M> {
  return new DynamicViewCompute(model, view).compute()
}
