import type { ElementModel } from '../../model/ElementModel'
import type { LikeC4Model } from '../../model/LikeC4Model'
import type { Fqn } from '../../types'
import { ifind, toSet } from '../../utils/iterable'

export function computeRelationshipsView(
  subjectId: Fqn,
  likec4model: LikeC4Model,
) {
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

  return {
    incomers,
    incoming: new Set(relationships.incoming),
    subjects,
    outgoing: new Set(relationships.outgoing),
    outgoers,
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
