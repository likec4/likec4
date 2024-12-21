import { isTruthy } from 'remeda'
import {
  DefaultElementShape,
  DefaultThemeColor,
  type Element as C4Element,
  type ElementKind as C4ElementKind,
  type ElementShape as C4ElementShape,
  type Link,
  type Tag as C4Tag,
  type ThemeColor,
} from '../types'
import { commonAncestor, hierarchyLevel, isAncestor, sortNaturalByFqn } from '../utils'
import { type DeployedInstancesIterator } from './DeploymentElementModel'
import type { LikeC4Model } from './LikeC4Model'
import type { RelationshipModel, RelationshipsIterator } from './RelationModel'
import type { AnyAux, IncomingFilter, IteratorLike, OutgoingFilter } from './types'
import type { LikeC4ViewModel, ViewsIterator } from './view/LikeC4ViewModel'

export type ElementsIterator<M extends AnyAux> = IteratorLike<ElementModel<M>>

export class ElementModel<M extends AnyAux = AnyAux> {
  readonly id: M['Fqn']
  readonly hierarchyLevel: number

  constructor(
    public readonly $model: LikeC4Model<M>,
    public readonly $element: C4Element,
  ) {
    this.id = this.$element.id
    this.hierarchyLevel = hierarchyLevel(this.id)
  }

  get parent(): ElementModel<M> | null {
    return this.$model.parent(this)
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

  get defaultView(): LikeC4ViewModel<M> | null {
    return this.scopedViews().next().value ?? null
  }

  public isAncestorOf(another: ElementModel<M>): boolean {
    return isAncestor(this, another)
  }

  public isDescendantOf(another: ElementModel<M>): boolean {
    return isAncestor(another, this)
  }

  /**
   * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
   * (from closest to root)
   */
  public ancestors(): ElementsIterator<M> {
    return this.$model.ancestors(this)
  }

  /**
   * Returns the common ancestor of this element and another element.
   */
  public commonAncestor(another: ElementModel<M>): ElementModel<M> | null {
    const common = commonAncestor(this.id, another.id)
    return common ? this.$model.element(common) : null
  }

  public children(): ReadonlySet<ElementModel<M>> {
    return this.$model.children(this)
  }

  /**
   * Get all descendant elements (i.e. children, children’s children, etc.)
   */
  public descendants(sort?: 'asc' | 'desc'): ElementsIterator<M> {
    if (sort) {
      const sorted = sortNaturalByFqn([...this.$model.descendants(this)], sort)
      return sorted[Symbol.iterator]()
    }
    return this.$model.descendants(this)
  }

  /**
   * Get all sibling (i.e. same parent)
   */
  public siblings(): ElementsIterator<M> {
    return this.$model.siblings(this)
  }

  /**
   * Resolve siblings of the element and its ancestors
   *  (from closest to root)
   */
  public *ascendingSiblings(): ElementsIterator<M> {
    yield* this.siblings()
    for (const ancestor of this.ancestors()) {
      yield* ancestor.siblings()
    }
    return
  }

  public incoming(filter: IncomingFilter = 'all'): RelationshipsIterator<M> {
    return this.$model.incoming(this, filter)
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
    return this.$model.outgoing(this, filter)
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

  protected cachedOutgoing: Set<RelationshipModel<M>> | null = null
  protected cachedIncoming: Set<RelationshipModel<M>> | null = null

  public get allOutgoing(): ReadonlySet<RelationshipModel<M>> {
    this.cachedOutgoing ??= new Set(this.outgoing())
    return this.cachedOutgoing
  }

  public get allIncoming(): ReadonlySet<RelationshipModel<M>> {
    this.cachedIncoming ??= new Set(this.incoming())
    return this.cachedIncoming
  }

  /**
   * Iterate over all views that include this element.
   */
  public *views(): ViewsIterator<M> {
    for (const view of this.$model.views()) {
      if (view.includesElement(this.id)) {
        yield view
      }
    }
    return
  }

  /**
   * Iterate over all views that scope this element.
   * It is possible that element is not included in the view.
   */
  public *scopedViews(): ViewsIterator<M> {
    for (const vm of this.$model.views()) {
      if (vm.isElementView() && vm.$view.viewOf === this.id) {
        yield vm
      }
    }
    return
  }

  /**
   * @returns true if the element is deployed
   */
  public isDeployed(): boolean {
    return isTruthy(this.deployments().next().value)
  }

  public deployments(): DeployedInstancesIterator<M> {
    return this.$model.deployment.instancesOf(this)
  }
}
