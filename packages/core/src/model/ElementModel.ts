import { isEmpty, isShallowEqual, isTruthy, unique } from 'remeda'
import type { SetRequired } from 'type-fest'
import type { Any, AnyAux, Color, IteratorLike } from '../types'
import {
  type Element as C4Element,
  type ElementShape as C4ElementShape,
  type ElementStyle,
  type IconUrl,
  type Link,
  type ProjectId,
  type RichTextOrEmpty,
  exact,
  preferDescription,
  preferSummary,
  RichText,
  splitGlobalFqn,
} from '../types'
import * as aux from '../types/_aux'
import { commonAncestor, hierarchyLevel, ihead, isAncestor, memoizeProp, nameFromFqn, sortNaturalByFqn } from '../utils'
import { type DeployedInstancesIterator } from './DeploymentElementModel'
import type { LikeC4Model } from './LikeC4Model'
import type { RelationshipModel, RelationshipsIterator } from './RelationModel'
import type { IncomingFilter, OutgoingFilter, WithMetadata, WithTags } from './types'
import type { LikeC4ViewModel } from './view/LikeC4ViewModel'

export type ElementsIterator<M extends AnyAux> = IteratorLike<ElementModel<M>>

export class ElementModel<A extends AnyAux = Any> implements WithTags<A>, WithMetadata<A> {
  readonly id: aux.Fqn<A>
  readonly _literalId: aux.ElementId<A>
  readonly hierarchyLevel: number

  readonly imported: null | {
    from: ProjectId
    fqn: aux.Fqn<A>
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

  get name(): string {
    return nameFromFqn(this.id)
  }

  get parent(): ElementModel<A> | null {
    return this.$model.parent(this)
  }

  get kind(): aux.ElementKind<A> {
    return this.$element.kind
  }

  get shape(): C4ElementShape {
    return this.style.shape
  }

  get color(): Color {
    return this.style.color
  }

  get icon(): IconUrl | null {
    return this.style.icon ?? null
  }

  /**
   * Returns all tags of the element.
   * It includes tags from the element and its kind.
   */
  get tags(): aux.Tags<A> {
    return memoizeProp(this, Symbol.for('tags'), () => {
      return unique([
        ...(this.$element.tags ?? []),
        ...(this.$model.specification.elements[this.$element.kind]?.tags ?? []),
      ] as aux.Tags<A>)
    })
  }

  get title(): string {
    return this.$element.title
  }

  /**
   * Returns true if the element has a summary and a description
   * (if one is missing - it falls back to another)
   */
  get hasSummary(): boolean {
    return !!this.$element.summary && !!this.$element.description &&
      !isShallowEqual(this.$element.summary, this.$element.description)
  }

  /**
   * Short description of the element.
   * Falls back to description if summary is not provided.
   */
  get summary(): RichTextOrEmpty {
    return RichText.memoize(this, 'summary', preferSummary(this.$element))
  }

  /**
   * Long description of the element.
   * Falls back to summary if description is not provided.
   */
  get description(): RichTextOrEmpty {
    return RichText.memoize(this, 'description', preferDescription(this.$element))
  }

  get technology(): string | null {
    return this.$element.technology ?? null
  }

  get links(): ReadonlyArray<Link> {
    return this.$element.links ?? []
  }

  get defaultView(): LikeC4ViewModel.ScopedElementView<A> | null {
    return memoizeProp(this, Symbol.for('defaultView'), () => ihead(this.scopedViews()) ?? null)
  }

  get isRoot(): boolean {
    return this.parent === null
  }

  get style(): SetRequired<ElementStyle, 'shape' | 'color' | 'size'> {
    return memoizeProp(this, 'style', () =>
      exact({
        shape: this.$model.$styles.defaults.shape,
        color: this.$model.$styles.defaults.color,
        border: this.$model.$styles.defaults.border,
        opacity: this.$model.$styles.defaults.opacity,
        size: this.$model.$styles.defaults.size,
        padding: this.$model.$styles.defaults.padding,
        textSize: this.$model.$styles.defaults.text,
        ...this.$element.style,
      }))
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
    const unique = new Set<aux.StrictFqn<A>>()
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
    const unique = new Set<aux.StrictFqn<A>>()
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
    return memoizeProp(this, Symbol.for('allOutgoing'), () => new Set(this.outgoing()))
  }

  public get allIncoming(): ReadonlySet<RelationshipModel<A>> {
    return memoizeProp(this, Symbol.for('allIncoming'), () => new Set(this.incoming()))
  }

  /**
   * Iterate over all views that include this element.
   */
  public views(): ReadonlySet<LikeC4ViewModel<A>> {
    return memoizeProp(this, Symbol.for('views'), () => {
      const views = new Set<LikeC4ViewModel<A>>()
      for (const view of this.$model.views()) {
        if (view.includesElement(this.id)) {
          views.add(view)
        }
      }
      return views
    })
  }

  /**
   * Iterate over all views that scope this element.
   * It is possible that element is not included in the view.
   */
  public scopedViews(): ReadonlySet<LikeC4ViewModel.ScopedElementView<A>> {
    return memoizeProp(this, Symbol.for('scopedViews'), () => {
      const views = new Set<LikeC4ViewModel.ScopedElementView<A>>()
      for (const vm of this.$model.views()) {
        if (vm.isScopedElementView() && vm.viewOf.id === this.id) {
          views.add(vm)
        }
      }
      return views
    })
  }

  /**
   * @returns true if the element is deployed
   */
  public isDeployed(): boolean {
    return isTruthy(ihead(this.deployments()))
  }

  public deployments(): DeployedInstancesIterator<A> {
    return this.$model.deployment.instancesOf(this)
  }

  public hasMetadata(): boolean {
    return !!this.$element.metadata && !isEmpty(this.$element.metadata)
  }

  public getMetadata(): aux.Metadata<A>
  public getMetadata(field: aux.MetadataKey<A>): string | string[] | undefined
  public getMetadata(field?: aux.MetadataKey<A>) {
    if (field) {
      return this.$element.metadata?.[field]
    }
    return this.$element.metadata ?? {}
  }

  /**
   * Checks if the element has the given tag.
   */
  public isTagged(tag: aux.LooseTag<A>): boolean {
    return this.tags.includes(tag as aux.Tag<A>)
  }
}
