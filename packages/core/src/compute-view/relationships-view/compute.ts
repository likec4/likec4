import { pipe } from 'remeda'
import { invariant } from '../../errors'
import type { ElementModel } from '../../model/ElementModel'
import type { LikeC4Model } from '../../model/LikeC4Model'
import type { RelationshipModel } from '../../model/RelationModel'
import type { AnyAux } from '../../model/types'
import type { LikeC4ViewModel } from '../../model/view/LikeC4ViewModel'
import { isDescendantOf, sortParentsFirst } from '../../utils/fqn'
import { ifilter, imap, toArray, toSet } from '../../utils/iterable'
import type { RelationshipsViewData } from './_types'
import { treeFromElements } from './utils'

const finalize = <M extends AnyAux>(
  elements: Set<ElementModel<M>>,
  explicits: Set<ElementModel<M>>,
): Set<ElementModel<M>> => {
  if (elements.size > 2 && explicits.size !== elements.size) {
    return new Set(sortParentsFirst([
      ...treeFromElements(elements).flatten(),
      ...explicits,
    ]))
  }
  if (elements.size > 1) {
    return new Set(sortParentsFirst([...elements]))
  }
  return elements
}

function computeRelationships<const M extends AnyAux>(
  subject: ElementModel<M>,
  others: Set<ElementModel<M>>,
  relationships: {
    incoming: ReadonlyArray<RelationshipModel<M>>
    outgoing: ReadonlyArray<RelationshipModel<M>>
  },
): Omit<RelationshipsViewData<M>, 'subjectExistsInScope'> {
  const isOther = (e: ElementModel<M>) => others.has(e)
  let subjects = new Set([subject])
  const explicits = {
    incomers: new Set<ElementModel<M>>(),
    subjects: new Set([subject]),
    outgoers: new Set<ElementModel<M>>(),
  }

  // Iterate over incoming and outgoing relationships
  // and add the source and target elements to appropriate sets.
  // If element is deeper in the hierarchy - add all ancestors until that is a sibling of the subject
  let incomers = new Set(relationships.incoming.flatMap((r) => {
    explicits.subjects.add(r.target)
    explicits.incomers.add(r.source)

    subjects.add(r.target)
    if (r.target !== subject) {
      let target = r.target.parent
      while (target && target !== subject) {
        subjects.add(target)
        target = target.parent
      }
    }

    let source = r.source
    const incomerBranch = [] as ElementModel<M>[]
    while (true) {
      incomerBranch.push(source)
      if (isOther(source) || !source.parent) {
        break
      }
      source = source.parent
    }
    return incomerBranch
  }))

  let outgoers = new Set(relationships.outgoing.flatMap((r) => {
    explicits.subjects.add(r.source)
    explicits.outgoers.add(r.target)

    subjects.add(r.source)
    if (r.source !== subject) {
      let source = r.source.parent
      while (source && source !== subject) {
        subjects.add(source)
        source = source.parent
      }
    }

    let target = r.target
    const outgoerBranch = [] as ElementModel<M>[]
    while (true) {
      outgoerBranch.push(target)
      if (isOther(target) || !target.parent) {
        break
      }
      target = target.parent
    }
    return outgoerBranch
  }))

  return {
    incomers: finalize(incomers, explicits.incomers),
    incoming: new Set(relationships.incoming),
    subjects: finalize(subjects, explicits.subjects),
    outgoing: new Set(relationships.outgoing),
    outgoers: finalize(outgoers, explicits.outgoers),
  }
}

export function computeRelationshipsView<const M extends AnyAux>(
  subjectId: NoInfer<M['Element']>,
  likec4model: LikeC4Model<M>,
  scopeViewId: NoInfer<M['View']> | null,
  scope: 'global' | 'view' = 'global',
): RelationshipsViewData<M> {
  let subjectExistsInScope = true
  const view = scopeViewId ? likec4model.findView(scopeViewId) : null
  if (scope === 'view') {
    invariant(
      view,
      'Scope view id is required when scope is "view"',
    )
    return computeScopedRelationshipsView(subjectId, view, likec4model)
  }

  const subject = likec4model.element(subjectId)
  const subjectSiblings = toSet(subject.ascendingSiblings())
  return computeRelationships(
    subject,
    subjectSiblings,
    {
      incoming: [...subject.incoming()],
      outgoing: [...subject.outgoing()],
    },
  )
}

function computeScopedRelationshipsView<const M extends AnyAux>(
  subjectId: NoInfer<M['Element']>,
  view: LikeC4ViewModel<M>,
  likec4model: LikeC4Model<M>,
): RelationshipsViewData<M> {
  const subject = likec4model.element(subjectId)
  let relationships = {
    incoming: toArray(ifilter(subject.incoming(), (r) => view.includesRelation(r.id))),
    outgoing: toArray(ifilter(subject.outgoing(), (r) => view.includesRelation(r.id))),
  }

  const isDescendant = isDescendantOf(subject)

  const others = new Set([
    ...subject.ascendingSiblings(),
    ...pipe(
      view.elements(),
      imap((e) => e.element),
      ifilter((e): e is ElementModel<M> => e !== subject && isDescendant(e)),
    ),
  ])

  return computeRelationships(
    subject,
    others,
    relationships,
  )
}
