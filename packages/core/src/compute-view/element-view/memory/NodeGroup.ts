import { ElementKind, type NodeId, type ViewRuleGroup } from '../../../types'
import type { Elem } from '../_types'

export class NodesGroup {
  static readonly kind = ElementKind.Group

  constructor(
    public readonly id: NodeId,
    public readonly viewRule: ViewRuleGroup,
    public readonly parent: NodeId | null = null,
    public readonly elements: ReadonlySet<Elem> = new Set<Elem>()
  ) {
  }

  isEmpty() {
    return this.elements.size === 0
  }

  update(elements: ReadonlySet<Elem>): NodesGroup {
    return new NodesGroup(
      this.id,
      this.viewRule,
      this.parent,
      elements
    )
  }

  clone() {
    return new NodesGroup(this.id, this.viewRule, this.parent, new Set(this.elements))
  }
}
