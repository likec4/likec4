import { first } from 'remeda'
import {
  type AnyLikeC4Model,
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
} from '../types'
import type { LikeC4Model } from './LikeC4Model'
import type { RelationshipModel, RelationshipsIterator } from './RelationModel'
import type { AnyAux, IncomingFilter, IteratorLike, OutgoingFilter } from './types'
import type { LikeC4ViewModel, ViewsIterator } from './view/LikeC4ViewModel'

export type ElementsIterator<M extends AnyAux> = IteratorLike<ElementModel<M>>

export class ElementModel<M extends AnyAux> {
  constructor(
    public readonly model: LikeC4Model<M>,
    public readonly $element: C4Element
  ) {
  }

  get id(): M['Fqn'] {
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

  public ancestors(): ElementsIterator<M> {
    return this.model.ancestors(this)
  }

  public children(): ElementsIterator<M> {
    return this.model.children(this)
  }

  public descendants(): ElementsIterator<M> {
    return this.model.descendants(this)
  }

  public siblings(): ElementsIterator<M> {
    return this.model.siblings(this)
  }

  public *ascendingSiblings(): ElementsIterator<M> {
    for (const ancestor of this.ancestors()) {
      yield* ancestor.siblings()
    }
    return
  }

  public incoming(filter: IncomingFilter = 'all'): RelationshipsIterator<M> {
    return this.model.incoming(this, filter)
  }
  public *incomers(filter: IncomingFilter = 'all'): ElementsIterator<M> {
    const unique = new Set<M['Fqn']>()
    for (const r of this.incoming(filter)) {
      if (unique.has(r.source.id)) {
        continue
      }
      unique.add(r.source.id)
      yield r.source
    }
    return
  }
  public outgoing(filter: OutgoingFilter = 'all'): RelationshipsIterator<M> {
    return this.model.outgoing(this, filter)
  }
  public *outgoers(filter: OutgoingFilter = 'all'): ElementsIterator<M> {
    const unique = new Set<M['Fqn']>()
    for (const r of this.outgoing(filter)) {
      if (unique.has(r.target.id)) {
        continue
      }
      unique.add(r.target.id)
      yield r.target
    }
    return
  }

  public *views(): ViewsIterator<M> {
    for (const view of this.model.views()) {
      if (view.includesElement(this.id)) {
        yield view
      }
    }
    return
  }

  public *viewsOf(): ViewsIterator<M> {
    for (const vm of this.views()) {
      if (vm.isElementView() && vm.$view.viewOf === this.id) {
        yield vm
      }
    }
    return
  }

  /**
   * Default viewOf
   */
  public viewOf(): LikeC4ViewModel<M> | null {
    return this.viewsOf().next().value ?? null
  }
}
