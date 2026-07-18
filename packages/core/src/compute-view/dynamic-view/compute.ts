import { findLast, identity, isNullish, isString, isTruthy, map, pipe, piped, reduce } from 'remeda'
import type { SetRequired, Writable } from 'type-fest'
import type { ElementModel, LikeC4Model } from '../../model'
import {
  type AnyAux,
  type aux,
  type Color,
  type ComputedDynamicView,
  type ComputedEdge,
  type ParsedDynamicView as DynamicView,
  type RelationshipArrowType,
  type RelationshipLineType,
  type Step,
  _stage,
  _type,
  exact,
  isViewRuleAutoLayout,
  scalar,
  stepGuards,
  StepPath,
} from '../../types'
import type { DynamicViewFlow, DynamicViewFlowSteps } from '../../types/view-dynamic-flow'
import { intersection, invariant, nonexhaustive, nonNullable, Stack, toArray, union } from '../../utils'
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
    id: StepPath
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

class DynamicViewCompute<A extends AnyAux = AnyAux> {
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

    const rootFlow: ComputingFlow = {
      actors: new Set(),
      flow: [],
      id: null as unknown as StepPath,
      _type: null as unknown as DynamicViewFlow.SubFlowType,
    }
    const flowStack = new Stack<ComputingFlow>()
    flowStack.push(rootFlow)

    const flowStackHead = () => flowStack.peek() ?? rootFlow

    const addToFlow = <P extends StepPath | ComputingFlow>(p: P): P => {
      flowStackHead().flow.push(p)
      return p
    }

    const addActorToFlow = (actor: Element<A>) => {
      flowStackHead().actors.add(actor)
    }

    const newFlow = (props: SetRequired<Partial<ComputingFlow>, 'id' | '_type'>): ComputingFlow => {
      return {
        actors: new Set(),
        flow: [],
        ...props,
      }
    }

    const pushFlow = (flow: ComputingFlow): ComputingFlow => {
      flowStack.push(flow)
      return flow
    }

    const popFlow = () => {
      const flow = flowStack.pop()
      if (flow && flow !== rootFlow && flow.flow.length > 0) {
        addToFlow(flow)
      }
      return flow
    }

    const processSteps = ({ steps, newflow, prefix }: {
      steps: readonly Step.Any<A>[]
      newflow: ComputingFlow
      prefix?: StepPath
    }) => {
      pushFlow(newflow)
      prefix ??= newflow.id
      reduce(
        steps,
        (acc, s) => processStep(s, acc, prefix),
        1,
      )
      popFlow()
    }

    const flowId = (path: StepPath | undefined, index: number, type: string): StepPath => {
      return StepPath(path, [index, type])
    }

    const processTryStep = (step: Step.Try<A>, path: StepPath) => {
      let localstep = 1
      processSteps({
        steps: step.try.steps,
        newflow: newFlow({
          _type: 'try-block',
          id: flowId(path, localstep++, 'block'),
          title: step.try.title,
        }),
      })
      if (step.catch) {
        processSteps({
          steps: step.catch.steps,
          newflow: newFlow({
            _type: 'try-catch',
            id: flowId(path, localstep++, 'catch'),
            title: step.catch.title,
          }),
        })
      }
      if (step.finally) {
        processSteps({
          steps: step.finally.steps,
          newflow: newFlow({
            _type: 'try-finally',
            id: flowId(path, localstep, 'finally'),
            title: step.finally.title,
          }),
        })
      }
    }

    // Process steps
    const processStep = (step: Step.Any<A>, stepNum: number, prefix?: StepPath): number => {
      switch (true) {
        case stepGuards.isSeries(step): {
          for (const s of step.steps) {
            stepNum = processStep(s, stepNum, prefix)
          }
          return stepNum
        }
        case stepGuards.isLoop(step):
        case stepGuards.isOpt(step):
        case stepGuards.isBreak(step):
        case stepGuards.isParallel(step): {
          processSteps({
            steps: step.steps,
            newflow: newFlow({
              _type: step._type,
              id: flowId(prefix, stepNum, step._type),
              title: step.title,
            }),
          })
          return stepNum + 1
        }
        case stepGuards.isTry(step): {
          const { id } = pushFlow(
            newFlow({
              _type: 'try',
              id: flowId(prefix, stepNum, 'try'),
            }),
          )
          processTryStep(step, id)
          popFlow()
          return stepNum + 1
        }
        case stepGuards.isAlt(step): {
          const { id: path } = pushFlow(
            newFlow({
              _type: 'alt',
              id: flowId(prefix, stepNum, 'alt'),
              title: step.title,
            }),
          )
          step.branches.forEach((branch, branchIndex) => {
            // const branchId = `${branchIndex + 1}`.padStart(2, '0')
            processSteps({
              steps: branch.steps,
              newflow: newFlow({
                _type: `alt-${branch._type}`,
                id: flowId(path, branchIndex + 1, branch._type),
                title: branch.title,
              }),
            })
          })
          popFlow()
          return stepNum + 1
        }
        case stepGuards.isStep(step): {
          const id = addToFlow(StepPath(prefix, stepNum))

          const {
            source: stepSource,
            target: stepTarget,
            title: stepTitle,
            isBackward: _isBackward, // omit
            navigateTo: stepNavigateTo,
            notation: _notation, // omit
            ...rest
          } = step as Step<A>

          const source = this.model.element(stepSource)
          const sourceColumn = actors.indexOf(source)
          invariant(sourceColumn >= 0, `Source ${stepSource} not found`)
          const target = this.model.element(stepTarget)
          const targetColumn = actors.indexOf(target)
          invariant(targetColumn >= 0, `Target ${stepTarget} not found`)

          addActorToFlow(source)
          addActorToFlow(target)

          const {
            title,
            relations,
            navigateTo: derivedNavigateTo,
            ...derived
          } = findRelations(source, target, this.view.id)

          const navigateTo = isTruthy(stepNavigateTo) && stepNavigateTo !== this.view.id
            ? stepNavigateTo
            : derivedNavigateTo

          // If step has kind, use defaults from specification for missing properties
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
            id,
            source,
            target,
            navigateTo,
            title: stepTitle ?? title,
            relations: relations ?? [],
            isBackward: targetColumn < sourceColumn,
          }))

          return stepNum + 1
        }
        default:
          nonexhaustive(step)
      }
    }

    reduce(
      viewSteps,
      (acc, s) => processStep(s, acc),
      1,
    )

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
      flow: toFlowSteps(rootFlow),
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

/**
 * Internal representation of a flow during computation
 * Used to track actors while building the final flow
 *
 * @internal
 */
type ComputingFlow = {
  actors: Set<ElementModel<any>>
  id: StepPath
  _type: DynamicViewFlow.SubFlowType
  flow: Array<StepPath | ComputingFlow>
  title?: string | undefined
}

const mapSubflow = piped(
  identity()<ComputingFlow['flow']>,
  map(step => isString(step) ? step : subflow(step)),
)

function subflow(sub: ComputingFlow): DynamicViewFlow.SubFlow.Any {
  let base = {
    id: sub.id,
    ...sub.title && { title: sub.title },
  } satisfies Partial<DynamicViewFlow.SubFlow.Any>

  if (sub._type === 'try') {
    const [tryBlock, catchBlock, finallyBlock] = mapSubflow(sub.flow)
    if (isNullish(tryBlock) || isString(tryBlock) || isString(catchBlock) || isString(finallyBlock)) {
      throw new Error('Try block, catch block, and finally block must be subflows')
    }
    invariant(tryBlock._type === 'try-block', 'Try block is required')

    const block: Writable<DynamicViewFlow.SubFlow.Try> = {
      _type: sub._type,
      flow: [tryBlock],
      ...base,
    }

    if (finallyBlock) {
      invariant(finallyBlock._type === 'try-finally', '3rd party must be a finally block')
      invariant(catchBlock && catchBlock._type === 'try-catch', '2nd must be a catch block')
      block.flow = [tryBlock, catchBlock, finallyBlock]
      return block
    }

    if (catchBlock) {
      invariant(
        catchBlock._type === 'try-catch' || catchBlock._type === 'try-finally',
        `2nd element must be a catch or finally block, it is ${catchBlock._type}`,
      )
      block.flow = [tryBlock, catchBlock]
      return block
    }
    return block
  }

  return {
    flow: mapSubflow(sub.flow),
    _type: sub._type,
    ...base,
  } as DynamicViewFlow.SubFlow.Any
}

function toFlowSteps(root: ComputingFlow): DynamicViewFlowSteps {
  return root.flow.map(v => {
    if (isString(v)) {
      return v
    }
    const s = subflow(v)
    if (
      s._type === 'alt-else' ||
      s._type === 'alt-if' ||
      s._type === 'alt-when' ||
      s._type === 'try-block' ||
      s._type === 'try-catch' ||
      s._type === 'try-finally'
    ) {
      throw new Error(`Unsupported root-level subflow type: ${s._type}`)
    }
    return s
  })
}
