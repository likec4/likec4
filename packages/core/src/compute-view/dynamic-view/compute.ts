import { findLast, isString, isTruthy, map, pipe, reduce } from 'remeda'
import type { SetRequired } from 'type-fest'
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
  type scalar,
  type Step,
  _stage,
  _type,
  exact,
  isViewRuleAutoLayout,
  stepGuards,
  StepPath,
} from '../../types'
import { intersection, invariant, nonexhaustive, nonNullable, Stack, toArray, union } from '../../utils'
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

    type ComputingFlow = {
      actors: Set<Element<A>>
      visible: boolean
      id: StepPath
      _type: ComputedDynamicView.AnySubFlow['_type']
      flow: Array<StepPath | ComputingFlow>
      path: StepPath
      // steps: { id: StepPath; step: Step.Any }[]
      // subflows: ComputingFlow[]
    }

    const rootFlow: ComputingFlow = {
      actors: new Set(),
      visible: true,
      flow: [],
      id: null as unknown as StepPath,
      _type: null as unknown as ComputedDynamicView.AnySubFlow['_type'],
      path: null as unknown as StepPath,
    }
    const flowStack = new Stack<ComputingFlow>()
    flowStack.push(rootFlow)

    const addStepToFlow = <P extends { id: StepPath }>(p: P): P => {
      flowStack.peek()!.flow.push(p.id)
      return p
    }

    const addActorToFlow = (actor: Element<A>) => {
      flowStack.peek()!.actors.add(actor)
    }

    const newFlow = (props: SetRequired<Partial<ComputingFlow>, 'id' | '_type'>): ComputingFlow => {
      const path = props.id.startsWith('step-') ? props.id.substring('step-'.length) : props.id
      return {
        visible: flowStack.peek()!.visible,
        actors: new Set(),
        flow: [],
        path: StepPath(path, props._type),
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
        const parentFlow = flowStack.peek()!
        parentFlow.flow.push(flow)
      }
      return flow
    }

    const processSteps = ({ steps, newflow, prefix }: {
      steps: readonly Step.Any<A>[]
      newflow: ComputingFlow
      prefix?: StepPath
    } | {
      steps: readonly Step.Any<A>[]
      newflow?: ComputingFlow
      prefix: StepPath
    }) => {
      if (newflow) {
        pushFlow(newflow)
        prefix ??= newflow.path
      }
      if (prefix && prefix.startsWith('step-')) {
        prefix = prefix.substring('step-'.length) as StepPath
      }
      reduce(
        steps,
        (acc, s) => processStep(s, acc, prefix),
        1,
      )
      if (newflow) {
        popFlow()
        // const parentFlow = flowStack.peek()!
        // parentFlow.flow.push(newflow)
        // if (flow.visible && flow.actors.size > 0) {
        //   for (const actor of flow.actors) {
        //     parentFlow.actors.add(actor)
        //   }
        // }
      }
    }

    const stepId = (...segments: Array<string | number | undefined>): StepPath => {
      return `step-${StepPath(...segments)}` as StepPath
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
        case stepGuards.isParallel(step): {
          processSteps({
            steps: step.steps,
            newflow: newFlow({
              _type: step._type,
              id: stepId(prefix, stepNum),
            }),
          })
          return stepNum + 1
        }
        case stepGuards.isTry(step): {
          const { path } = pushFlow(newFlow({
            _type: 'try',
            id: stepId(prefix, stepNum),
          }))
          // addStepToFlow({
          //   id: stepId(prefix, stepNum),
          //   step: step,
          // })
          processSteps({
            steps: step.try.steps,
            newflow: newFlow({
              _type: 'try-block',
              id: stepId(path, 'block'),
              path: StepPath(path, 'block'),
            }),
          })
          if (step.catch) {
            processSteps({
              steps: step.catch.steps,
              newflow: newFlow({
                _type: 'try-catch',
                id: stepId(path, 'catch'),
                path: StepPath(path, 'catch'),
              }),
            })
          }
          if (step.finally) {
            processSteps({
              steps: step.finally.steps,
              newflow: newFlow({
                _type: 'try-finally',
                id: stepId(path, 'finally'),
                path: StepPath(path, 'finally'),
              }),
            })
          }
          popFlow()
          return stepNum + 1
        }
        case stepGuards.isAlt(step): {
          const { path } = pushFlow(newFlow({
            _type: 'alt',
            id: stepId(prefix, stepNum),
          }))
          // const alt = addStepToFlow({
          //   // _type: step._type,
          //   id: stepId(prefix, stepNum),
          //   step: step,
          //   // branches: [],
          // })
          step.branches.forEach((branch, branchIndex) => {
            const index = `${branchIndex + 1}`.padStart(2, '0')
            // const branchPath = StepPath(path, index)
            // const branchItem = {
            //   _type: branch._type,
            //   id: stepId(branchPath),
            //   steps: [] as ComputedStepsFlow,
            // }
            // alt.branches.push(branchItem)
            processSteps({
              steps: branch.steps,
              newflow: newFlow({
                _type: `alt-${branch._type}`,
                id: stepId(path, index),
                path: StepPath(path, index, branch._type),
              }),
            })
          })
          popFlow()
          return stepNum + 1
        }
        case stepGuards.isStep(step): {
          const id = addStepToFlow({
            id: stepId(prefix, stepNum),
            step: step,
          }).id

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

    function buildFlow(): ComputedDynamicView.Flow {
      function flowStep(step: StepPath | ComputingFlow): StepPath | ComputedDynamicView.AnySubFlow {
        return isString(step) ? step : subflow(step)
      }
      function subflow(sub: ComputingFlow): ComputedDynamicView.AnySubFlow {
        return {
          _type: sub._type,
          id: sub.id,
          actors: [...sub.actors].map(e => e.id as scalar.NodeId),
          flow: sub.flow.map(flowStep),
        } as ComputedDynamicView.AnySubFlow
      }
      return {
        actors: [...rootFlow.actors].map(e => e.id as scalar.NodeId),
        flow: rootFlow.flow.map(flowStep) as ComputedDynamicView.SubFlows,
      }
    }

    return calcViewLayoutHash({
      ...view,
      [_type]: 'dynamic',
      [_stage]: 'computed',
      variant: view.variant ?? 'diagram',
      flow: buildFlow(),
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
