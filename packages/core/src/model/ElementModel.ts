import { isTruthy } from 'remeda'
import type { SetRequired } from 'type-fest'
import type { AnyAux, Color, IteratorLike } from '../types'
import {
  type Element as C4Element,
  type ElementShape as C4ElementShape,
  type ElementStyle,
  type IconUrl,
  type Link,
  type ProjectId,
  DefaultElementShape,
  DefaultShapeSize,
  DefaultThemeColor,
  splitGlobalFqn,
} from '../types'
import { commonAncestor, hierarchyLevel, isAncestor, memoizeProp, sortNaturalByFqn } from '../utils'
import { type DeployedInstancesIterator } from './DeploymentElementModel'
import type { LikeC4Model } from './LikeC4Model'
import type { RelationshipModel, RelationshipsIterator } from './RelationModel'
import type { IncomingFilter, OutgoingFilter } from './types'
import type { LikeC4ViewModel, ViewsIterator } from './view/LikeC4ViewModel'

export type ElementsIterator<M extends AnyAux> = IteratorLike<ElementModel<M>>

export class ElementModel<A extends AnyAux = AnyAux> {
  readonly id: Aux.StrictFqn<A>
  readonly _literalId: Aux.ElementId<A>
  readonly hierarchyLevel: number

  readonly imported: null | {
    from: ProjectId
    fqn: Aux.StrictFqn<A>
  }

  constructor(
    public readonly $model: LikeC4Model<A>,
    public readonly $element: C4Element<A>,
  ) {
    this.id = this.$element.id
    this._literalId = this.$element.id
    const [projectId, fqn] = splitGlobalFqn(this.id)
    if (projectId) {
      this.imported = {
        from: projectId,
        fqn,
      }
      this.hierarchyLevel = hierarchyLevel(fqn)
    } else {
      this.imported = null
      this.hierarchyLevel = hierarchyLevel(this.id)
    }
  }

  get parent(): ElementModel<A> | null {
    return memoizeProp(this, Symbol('parent'), () => this.$model.parent(this))
  }

  get kind(): Aux.ElementKind<A> {
    return this.$element.kind
  }

  get shape(): C4ElementShape {
    return this.$element.shape ?? DefaultElementShape
  }

  get color(): Color {
    return this.$element.color as Color ?? DefaultThemeColor
  }

  get icon(): IconUrl | null {
    return this.$element.icon ?? null
  }

  get tags(): Aux.Tags<A> {
    return this.$element.tags ?? []
  }

  get title(): string {
    return this.$element.title
  }

  get description(): string | null {
    return this.$element.description ?? null
  }

  get technology(): string | null {
    return this.$element.technology ?? null
  }

  get links(): ReadonlyArray<Link> {
    return this.$element.links ?? []
  }

  get defaultView(): LikeC4ViewModel<A> | null {
    return memoizeProp(this, Symbol('defaultView'), () => this.scopedViews().next().value ?? null)
  }

  get isRoot(): boolean {
    return this.parent === null
  }

  get style(): SetRequired<ElementStyle, 'size'> {
    return {
      size: DefaultShapeSize,
      ...this.$element.style,
    }
  }

  public isAncestorOf(another: ElementModel<A>): boolean {
    return isAncestor(this, another)
  }

  public isDescendantOf(another: ElementModel<A>): boolean {
    return isAncestor(another, this)
  }

  /**
   * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
   * (from closest to root)
   */
  public ancestors(): ElementsIterator<A> {
    return this.$model.ancestors(this)
  }

  /**
   * Returns the common ancestor of this element and another element.
   */
  public commonAncestor(another: ElementModel<A>): ElementModel<A> | null {
    const common = commonAncestor(this.id, another.id)
    return common ? this.$model.element(common) : null
  }

  public children(): ReadonlySet<ElementModel<A>> {
    return this.$model.children(this)
  }

  /**
   * Get all descendant elements (i.e. children, children’s children, etc.)
   */
  public descendants(sort?: 'asc' | 'desc'): ElementsIterator<A> {
    if (sort) {
      const sorted = sortNaturalByFqn([...this.$model.descendants(this)], sort)
      return sorted[Symbol.iterator]()
    }
    return this.$model.descendants(this)
  }

  /**
   * Get all sibling (i.e. same parent)
   */
  public siblings(): ElementsIterator<A> {
    return this.$model.siblings(this)
  }

  /**
   * Resolve siblings of the element and its ancestors
   * (from closest parent to root)
   */
  public *ascendingSiblings(): ElementsIterator<A> {
    yield* this.siblings()
    for (const ancestor of this.ancestors()) {
      yield* ancestor.siblings()
    }
    return
  }

  /**
   * Resolve siblings of the element and its ancestors
   *  (from root to closest)
   */
  public *descendingSiblings(): ElementsIterator<A> {
    for (const ancestor of [...this.ancestors()].reverse()) {
      yield* ancestor.siblings()
    }
    yield* this.siblings()
    return
  }

  public incoming(filter: IncomingFilter = 'all'): RelationshipsIterator<A> {
    return this.$model.incoming(this, filter)
  }
  public *incomers(filter: IncomingFilter = 'all'): ElementsIterator<A> {
    const unique = new Set<Aux.StrictFqn<A>>()
    for (const r of this.incoming(filter)) {
      if (unique.has(r.source.id)) {
        continue
      }
      unique.add(r.source.id)
      yield r.source
    }
    return
  }
  public outgoing(filter: OutgoingFilter = 'all'): RelationshipsIterator<A> {
    return this.$model.outgoing(this, filter)
  }
  public *outgoers(filter: OutgoingFilter = 'all'): ElementsIterator<A> {
    const unique = new Set<Aux.StrictFqn<A>>()
    for (const r of this.outgoing(filter)) {
      if (unique.has(r.target.id)) {
        continue
      }
      unique.add(r.target.id)
      yield r.target
    }
    return
  }

  public get allOutgoing(): ReadonlySet<RelationshipModel<A>> {
    return memoizeProp(this, Symbol('allOutgoing'), () => new Set(this.outgoing()))
  }

  public get allIncoming(): ReadonlySet<RelationshipModel<A>> {
    return memoizeProp(this, Symbol('allIncoming'), () => new Set(this.incoming()))
  }

  /**
   * Iterate over all views that include this element.
   */
  public *views(): ViewsIterator<A> {
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
  public *scopedViews(): ViewsIterator<A> {
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

  public deployments(): DeployedInstancesIterator<A> {
    return this.$model.deployment.instancesOf(this)
  }

  public getMetadata(): Aux.Metadata<A>
  public getMetadata(field: Aux.MetadataKey<A>): string | undefined
  public getMetadata(field?: Aux.MetadataKey<A>) {
    if (field) {
      return this.$element.metadata?.[field]
    }
    return this.$element.metadata ?? {}
  }
}
