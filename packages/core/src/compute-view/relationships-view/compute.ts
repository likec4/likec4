import { nonexhaustive } from '../../errors'
import type { ElementModel } from '../../model/ElementModel'
import type { LikeC4Model } from '../../model/LikeC4Model'
import type { RelationshipModel } from '../../model/RelationModel'
import {
  type Fqn,
  ComputedNode,
  ComputedView,
} from '../../types'
import { ifind, toSet } from '../../utils/iterable'
import { applyDeploymentViewRuleStyles } from '../deployment-view/utils'
import { applyCustomElementProperties } from '../utils/applyCustomElementProperties'
import { applyViewRuleStyles } from '../utils/applyViewRuleStyles'
import { buildComputedNodes } from '../utils/buildComputedNodes'

export function computeRelationshipsView(
  subjectId: Fqn,
  likec4model: LikeC4Model,
  parentView: ComputedView | null,
): {
  incomers: Set<ComputedNode>
  incoming: Set<RelationshipModel<LikeC4Model.Any>>
  subjects: Set<ComputedNode>
  outgoing: Set<RelationshipModel<LikeC4Model.Any>>
  outgoers: Set<ComputedNode>
} {
  const subject = likec4model.element(subjectId)
  let relationships = {
    incoming: [...subject.incoming()],
    outgoing: [...subject.outgoing()],
  }

  const subjectSiblings = toSet(subject.ascendingSiblings())
  const isSubjectSibling = (e: ElementModel) => subjectSiblings.has(e)
  const subjects = new Set([subject])

  // Iterate over incoming and outgoing relationships
  // and add the source and target elements to appropriate sets.
  // If element is deeper in the hierarchy - find the closest ancestor that is a sibling of the subject.
  const incomers = new Set(relationships.incoming.flatMap((r) => {
    subjects.add(r.target)
    if (subjectSiblings.has(r.source)) {
      return [r.source]
    }
    const parent = ifind(r.source.ancestors(), isSubjectSibling)
    return parent ? [r.source, parent] : [r.source]
  }))
  const outgoers = new Set(relationships.outgoing.flatMap((r) => {
    subjects.add(r.source)
    if (subjectSiblings.has(r.target)) {
      return [r.target]
    }
    const parent = ifind(r.target.ancestors(), isSubjectSibling)
    return parent ? [r.target, parent] : [r.target]
  }))

  const [incomerNodes, subjectNodes, outgoerNodes] = [incomers, subjects, outgoers]
    .map(elements => buildNodes(elements))
    .map(nodes => applyParentViewStyles(parentView, nodes))
    .map(nodes => new Set(nodes))

  return {
    incomers: incomerNodes!,
    incoming: new Set(relationships.incoming),
    subjects: subjectNodes!,
    outgoing: new Set(relationships.outgoing),
    outgoers: outgoerNodes!,
  }

  // return {
  //   id: `relationships-${subjectId}` as ViewId,
  //   title: `Relationships of ${subject.title}`,
  //   description: null,
  //   autoLayout: {
  //     direction: 'LR',
  //   },
  //   tags: null,
  //   links: null,
  //   hash: 'empty',
  //   customColorDefinitions: {},
  //   ...layoutRelationshipsView({
  //     incomers,
  //     incoming: new Set(relationships.incoming),
  //     subjects,
  //     outgoing: new Set(relationships.outgoing),
  //     outgoers,
  //   }),
  // }
}

function buildNodes(elements: Iterable<ElementModel>): ComputedNode[] {
  const computedNodeSourcess = [...elements]
    .map(e => ({ ...e.$element }))

  const computedNodes = buildComputedNodes(computedNodeSourcess)

  return [...computedNodes.values()]
}

function applyParentViewStyles(parentView: ComputedView | null, nodes: ComputedNode[]) {
  if (!parentView) {
    return nodes
  }

  switch (true) {
    case ComputedView.isDeployment(parentView):
      return applyDeploymentViewRuleStyles(parentView.rules, nodes)

    case ComputedView.isElement(parentView):
    case ComputedView.isDynamic(parentView):
      return applyCustomElementProperties(
        parentView.rules,
        applyViewRuleStyles(
          parentView.rules,
          nodes,
        ),
      )

    default:
      nonexhaustive(parentView)
  }
}
