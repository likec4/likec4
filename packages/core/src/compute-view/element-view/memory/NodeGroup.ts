import type { ElementModel } from '../../../model'
import { type AnyAux, type ElementViewRuleGroup, type NodeId, GroupElementKind } from '../../../types'

export class NodesGroup<A extends AnyAux = AnyAux> {
  static readonly kind = GroupElementKind

  constructor(
    public readonly id: NodeId,
    public readonly viewRule: ElementViewRuleGroup<A>,
    public readonly parent: NodeId | null = null,
    public readonly elements: ReadonlySet<ElementModel<A>> = new Set<ElementModel<A>>(),
  ) {
  }

  isEmpty() {
    return this.elements.size === 0
  }

  update(elements: ReadonlySet<ElementModel<AnyAux>>): NodesGroup<A> {
    return new NodesGroup(
      this.id,
      this.viewRule,
      this.parent,
      elements as unknown as ReadonlySet<ElementModel<A>>,
    )
  }

  clone() {
    return new NodesGroup(this.id, this.viewRule, this.parent, new Set(this.elements))
  }
}
