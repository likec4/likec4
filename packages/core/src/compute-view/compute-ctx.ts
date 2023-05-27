import { difference } from 'rambdax'
import type { ModelIndex } from '../model-index'
import type { Fqn, Element, Relation } from '../types'
import { notDescendantOf } from '../utils'

export type ComputeCtxPatch = {
  elements?: Element[]
  relations?: Relation[]
  implicits?: Element[]
}


export class ComputeCtx {

  constructor(
    public index: ModelIndex,
    public root: Fqn | null,
    public elements: Set<Element> = new Set(),
    public relations: Set<Relation> = new Set(),
    public implicits: Set<Element> = new Set()
  ) { }

  include({
    elements, relations, implicits
  }: ComputeCtxPatch) {
    let newImplicits = implicits ? new Set([...this.implicits, ...implicits]) : this.implicits
    if (elements) {
      newImplicits = new Set(
        [...newImplicits].filter(notDescendantOf(elements))
      )
    }
    return new ComputeCtx(
      this.index,
      this.root,
      elements ? new Set([...this.elements, ...elements]) : this.elements,
      relations ? new Set([...this.relations, ...relations]) : this.relations,
      newImplicits
    )
  }

  exclude({
    elements, relations, implicits
  }: ComputeCtxPatch) {
    let newImplicits = implicits ? new Set(difference([...this.implicits], implicits)) : this.implicits
    if (elements) {
      newImplicits = new Set(
        difference([...newImplicits], elements)
      )
    }
    return new ComputeCtx(
      this.index,
      this.root,
      elements ? new Set(difference([...this.elements], elements)) : this.elements,
      relations ? new Set(difference([...this.relations], relations)) : this.relations,
      newImplicits
    )
  }
}
