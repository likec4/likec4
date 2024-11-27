import { first } from 'remeda'
import {
  type ALikeC4Model,
  type ComputedElementView,
  DefaultElementShape,
  DefaultThemeColor,
  type Element as C4Element,
  type ElementKind as C4ElementKind,
  type ElementShape as C4ElementShape,
  type Fqn,
  type Link,
  type Tag as C4Tag,
  type ThemeColor
} from '../../types'
import type { IncomingFilter, OutgoingFilter } from '../types'
import type { LikeC4Model } from './LikeC4Model'
import type { RelationModel } from './RelationModel'
import type { LikeC4ViewModel } from './view/LikeC4ViewModel'

export class ElementModel<M extends ALikeC4Model> {
  constructor(
    public readonly model: LikeC4Model<M>,
    public readonly $element: C4Element
  ) {
  }

  get id(): Fqn {
    return this.$element.id
  }

  get kind(): C4ElementKind {
    return this.$element.kind
  }

  get shape(): C4ElementShape {
    return this.$element.shape ?? DefaultElementShape
  }

  get color(): ThemeColor {
    return this.$element.color as ThemeColor ?? DefaultThemeColor
  }

  get tags(): ReadonlyArray<C4Tag> {
    return this.$element.tags ?? []
  }

  get title(): string {
    return this.$element.title
  }

  get description(): string | null {
    return this.$element.description
  }

  get technology(): string | null {
    return this.$element.technology
  }

  get links(): ReadonlyArray<Link> {
    return this.$element.links ?? []
  }

  get parent(): ElementModel<M> | null {
    return this.model.parent(this)
  }

  public ancestors(): IteratorObject<ElementModel<M>> {
    return this.model.ancestors(this)
  }

  public children(): IteratorObject<ElementModel<M>> {
    return this.model.children(this)
  }

  public descendants(): IteratorObject<ElementModel<M>> {
    return this.model.descendants(this)
  }

  public siblings(): IteratorObject<ElementModel<M>> {
    return this.model.siblings(this)
  }

  public *ascendingSiblings(): IteratorObject<ElementModel<M>> {
    for (const ancestor of this.ancestors()) {
      yield* ancestor.siblings()
    }
    return null
  }

  public incoming(filter: IncomingFilter = 'all'): IteratorObject<RelationModel<M>> {
    return this.model.incoming(this, filter)
  }
  public *incomers(filter: IncomingFilter = 'all'): IteratorObject<ElementModel<M>> {
    const unique = new Set<Fqn>()
    for (const r of this.incoming(filter)) {
      if (unique.has(r.source.id)) {
        continue
      }
      unique.add(r.source.id)
      yield r.source
    }
    return
  }
  public outgoing(filter: OutgoingFilter = 'all'): IteratorObject<RelationModel<M>> {
    return this.model.outgoing(this, filter)
  }
  public *outgoers(filter: OutgoingFilter = 'all'): IteratorObject<ElementModel<M>> {
    const unique = new Set<Fqn>()
    for (const r of this.outgoing(filter)) {
      if (unique.has(r.target.id)) {
        continue
      }
      unique.add(r.target.id)
      yield r.target
    }
    return
  }

  public views(): IteratorObject<LikeC4ViewModel<M>> {
    return this.model.views().filter(vm => vm.includesElement(this.id))
  }

  public viewsOf(): IteratorObject<LikeC4ViewModel<M, ComputedElementView>> {
    return this.views()
      .filter((vm) => vm.isElementView())
      .filter(vm => vm.$view.viewOf === this.id)
  }

  /**
   * Default viewOf
   */
  public viewOf(): LikeC4ViewModel<M, ComputedElementView> | null {
    return first(this.viewsOf().take(1).toArray()) ?? null
  }
}
