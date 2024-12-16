import { type ComputedNode, ElementKind, type NodeId, type ViewRuleGroup } from '../../../types'
import type { Elem } from '../_types'

export class NodesGroup {
  static readonly kind = ElementKind.Group

  static root() {
    return new NodesGroup('@root' as NodeId, { title: null, groupRules: [] })
  }

  static is(node: ComputedNode) {
    return node.kind === NodesGroup.kind
  }

  constructor(
    public readonly id: NodeId,
    public readonly viewRule: ViewRuleGroup,
    public readonly parent: NodeId | null = null,
    private readonly _explicits = new Set<Elem>(),
    private readonly _implicits = new Set<Elem>()
  ) {
  }

  get explicits(): ReadonlySet<Elem> {
    return this._explicits
  }
  get implicits(): ReadonlySet<Elem> {
    return this._implicits
  }

  /**
   * Add element explicitly
   * Included even without relationships
   */
  addElement(...el: Elem[]) {
    for (const r of el) {
      this._explicits.add(r)
      this._implicits.add(r)
    }
  }

  /**
   * Add element implicitly
   * Included if only has relationships
   */
  addImplicit(...el: Elem[]) {
    for (const r of el) {
      this._implicits.add(r)
    }
  }

  excludeElement(...excludes: Elem[]) {
    for (const el of excludes) {
      this._explicits.delete(el)
      this._implicits.delete(el)
    }
  }

  excludeImplicit(element: Elem | Elem[]) {
    const elements = Array.isArray(element) ? element : [element]
    for (const el of elements) {
      this._implicits.delete(el)
    }
  }

  isEmpty() {
    return this._explicits.size === 0 && this._implicits.size === 0
  }

  update(
    newstate: Partial<{
      explicits: Set<Elem>
      implicits: Set<Elem>
    }>
  ) {
    return new NodesGroup(
      this.id,
      this.viewRule,
      this.parent,
      newstate.explicits ?? this._explicits,
      newstate.implicits ?? this._implicits
    )
  }

  clone() {
    return new NodesGroup(this.id, this.viewRule, this.parent, new Set(this._explicits), new Set(this._implicits))
  }
}
