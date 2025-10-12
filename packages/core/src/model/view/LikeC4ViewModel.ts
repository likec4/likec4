import { isTruthy } from 'remeda'
import type { LikeC4Styles } from '../../styles'
import type {
  Any,
  AnyView,
  BBox,
  ComputedView,
  DynamicViewDisplayVariant,
  IteratorLike,
  LayoutedView,
  Link,
  scalar,
  ViewManualLayoutSnapshot,
  ViewWithType,
} from '../../types'
import { type RichTextOrEmpty, _stage, _type, RichText } from '../../types'
import type * as aux from '../../types/_aux'
import type { AnyComputed, AnyLayouted } from '../../types/_aux'
import { DefaultMap, ifind, memoizeProp, nonNullable } from '../../utils'
import type { ElementModel } from '../ElementModel'
import type { LikeC4Model } from '../LikeC4Model'
import type {
  $View,
  EdgeOrId,
  NodeOrId,
  WithTags,
} from '../types'
import { extractViewTitleFromPath, getId, normalizeViewPath } from '../utils'
import { applyManualLayout } from '../utils/apply-manual-layout'
import { type EdgesIterator, EdgeModel } from './EdgeModel'
import type { LikeC4ViewsFolder } from './LikeC4ViewsFolder'
import { type NodesIterator, NodeModel } from './NodeModel'

export type ViewsIterator<A extends Any, V extends $View<A> = $View<A>> = IteratorLike<LikeC4ViewModel<A, V>>

export type InferViewType<V> = V extends AnyView<any> ? V[_type] : never

export class LikeC4ViewModel<A extends Any = Any, V extends $View<A> = $View<A>> implements WithTags<A> {
  /**
   * Don't use in runtime, only for type inference
   */
  readonly Aux!: A

  readonly #rootnodes = new Set<NodeModel<A, V>>()
  readonly #nodes = new Map<scalar.NodeId, NodeModel<A, V>>()
  readonly #edges = new Map<scalar.EdgeId, EdgeModel<A, V>>()
  readonly #includeElements = new Set<aux.Fqn<A>>()
  readonly #includeDeployments = new Set<aux.DeploymentFqn<A>>()
  readonly #includeRelations = new Set<scalar.RelationId>()
  readonly #allTags = new DefaultMap((_key: aux.Tag<A>) => new Set<NodeModel<A, V> | EdgeModel<A, V>>())
  readonly #manualLayoutSnapshot: ViewManualLayoutSnapshot | undefined

  public readonly id: aux.StrictViewId<A>

  /**
   * The original view (auto-layouted).
   * @see {@link $layouted} should be used for rendering in the UI
   */
  public readonly $view: V

  /**
   * The model this view belongs to
   */
  public readonly $model: LikeC4Model<A>

  /**
   * The title of the view
   */
  public readonly title: string | null

  /**
   * View folder this view belongs to.
   * If view is top-level, this is the root folder.
   */
  public readonly folder: LikeC4ViewsFolder<A>
  /**
   * Path to this view, processed by {@link normalizeViewPath}
   *
   * @example
   * "Group 1/Group 2/View"
   */
  public readonly viewPath: string

  constructor(
    model: LikeC4Model<A>,
    folder: LikeC4ViewsFolder<A>,
    view: V,
    manualLayoutSnapshot?: ViewManualLayoutSnapshot | undefined,
  ) {
    this.$model = model
    this.$view = view
    this.id = view.id
    this.folder = folder
    this.#manualLayoutSnapshot = manualLayoutSnapshot

    for (const node of this.$view.nodes) {
      const el = new NodeModel<A, V>(this, Object.freeze(node))
      this.#nodes.set(node.id, el)
      if (!node.parent) {
        this.#rootnodes.add(el)
      }
      if (el.hasDeployment()) {
        this.#includeDeployments.add(el.deployment.id)
      }
      if (el.hasElement()) {
        this.#includeElements.add(el.element.id)
      }
      for (const tag of el.tags) {
        this.#allTags.get(tag).add(el)
      }
    }

    for (const edge of this.$view.edges) {
      const edgeModel = new EdgeModel(
        this,
        Object.freeze(edge),
        this.node(edge.source),
        this.node(edge.target),
      )
      for (const tag of edgeModel.tags) {
        this.#allTags.get(tag).add(edgeModel)
      }
      for (const rel of edge.relations) {
        this.#includeRelations.add(rel)
      }
      this.#edges.set(edge.id, edgeModel)
    }

    this.title = view.title ? extractViewTitleFromPath(view.title) : null
    this.viewPath = view.title ? normalizeViewPath(view.title) : view.id
  }

  /**
   * Returns the styles configuration for the project.
   */
  get $styles(): LikeC4Styles {
    return this.$model.$styles
  }

  get _type(): V[_type] {
    return this.$view[_type]
  }

  get stage(): V[_stage] {
    return this.$view[_stage]
  }

  get bounds(): Readonly<BBox> {
    if ('bounds' in this.$view) {
      return this.$view.bounds
    }
    throw new Error('View is not layouted')
  }

  /**
   * Returns title if defined, otherwise returns title of the element it is based on, otherwise returns its {@link id}
   */
  get titleOrId(): string {
    return this.title ?? this.viewOf?.title ?? this.id
  }

  /**
   * Returns title if defined, otherwise returns `Untitled`.
   */
  get titleOrUntitled(): string {
    return this.title ?? 'Untitled'
  }

  /**
   * Returns path to this view as an array of groups and this view as the last element
   * If view is top-level, returns only this view.
   *
   * @example
   * viewPath = "Group 1/Group 2/View"
   *
   * breadcrumbs = [
   *   "Group 1",             // folder
   *   "Group 1/Group 2",     // folder
   *   "Group 1/Group 2/View" // view
   * ]
   */
  get breadcrumbs(): [...LikeC4ViewsFolder<A>[], this] {
    return memoizeProp(this, 'breadcrumbs', () => {
      if (!this.folder.isRoot) {
        return [...this.folder.breadcrumbs, this]
      }
      return [this]
    })
  }

  get description(): RichTextOrEmpty {
    return RichText.memoize(this, 'description', this.$view.description)
  }

  get tags(): aux.Tags<A> {
    return this.$view.tags ?? []
  }

  get links(): ReadonlyArray<Link> {
    return this.$view.links ?? []
  }

  get viewOf(): ElementModel<A> | null {
    if (this.isElementView()) {
      const viewOf = this.$view.viewOf
      return viewOf ? this.$model.element(viewOf) : null
    }
    return null
  }

  /**
   * Available for dynamic views only
   * throws error if view is not dynamic
   */
  get mode(): DynamicViewDisplayVariant | null {
    if (this.isDynamicView()) {
      return this.$view.variant ?? 'diagram'
    }
    return null
  }

  /**
   * All tags from nodes and edges.
   */
  get includedTags(): aux.Tags<A> {
    return [...this.#allTags.keys()] as unknown as aux.Tags<A>
  }

  /**
   * Returns the view with manual layout applied if it exists, otherwise returns the original view
   * This should be used for rendering in the UI
   */
  get $layouted(): V {
    if (!this.isLayouted()) {
      throw new Error('View is not layouted')
    }
    return this.manualLayouted ?? this.$view
  }

  get hasManualLayout(): boolean {
    return this.#manualLayoutSnapshot !== undefined
  }

  /**
   * If view has manual layout, returns it with manual layout applied
   */
  get manualLayouted(): V | null {
    if (!this.isLayouted()) {
      return null
    }
    return memoizeProp(this, 'snapshotWithManualLayout', () => {
      const snapshot = this.#manualLayoutSnapshot
      if (snapshot) {
        return applyManualLayout(this.$view, snapshot)
      }
      return null
    })
  }

  public roots(): NodesIterator<A, V> {
    return this.#rootnodes.values()
  }

  /**
   * Iterate over all nodes that have children.
   */
  public *compounds(): NodesIterator<A, V> {
    for (const node of this.#nodes.values()) {
      if (node.hasChildren()) {
        yield node
      }
    }
    return
  }

  /**
   * Get node by id.
   * @throws Error if node is not found.
   */
  public node(node: NodeOrId): NodeModel<A, V> {
    const nodeId = getId(node)
    return nonNullable(this.#nodes.get(nodeId), `Node ${nodeId} not found in view ${this.$view.id}`)
  }

  /**
   * Find node by id.
   */
  public findNode(node: NodeOrId): NodeModel<A, V> | null {
    return this.#nodes.get(getId(node)) ?? null
  }

  public findNodeWithElement(element: aux.LooseElementId<A> | { id: aux.Fqn<A> }): NodeModel.WithElement<A, V> | null {
    const id = getId(element)
    if (!this.#includeElements.has(id)) {
      return null
    }
    return ifind(
      this.#nodes.values(),
      (node): node is NodeModel.WithElement<A, V> => node.hasElement() && node.element.id === id,
    ) ?? null
  }

  /**
   * Iterate over all nodes.
   */
  public nodes(): NodesIterator<A, V> {
    return this.#nodes.values()
  }

  /**
   * Get edge by id, throws error if edge is not found.
   * Use {@link findEdge} if you are not sure if the edge exists.
   *
   * @param edge Edge or id
   * @returns {@link EdgeModel}
   */
  public edge(edge: EdgeOrId): EdgeModel<A, V> {
    const edgeId = getId(edge)
    return nonNullable(this.#edges.get(edgeId), `Edge ${edgeId} not found in view ${this.$view.id}`)
  }

  /**
   * Find edge by id.
   * @param edge Edge or id
   * @returns {@link EdgeModel} or null if edge is not found
   */
  public findEdge(edge: EdgeOrId): EdgeModel<A, V> | null {
    return this.#edges.get(getId(edge)) ?? null
  }

  /**
   * Iterate over all edges.
   */
  public edges(): EdgesIterator<A, V> {
    return this.#edges.values()
  }

  /**
   * Iterate over all edges.
   */
  public *edgesWithRelation(relation: aux.RelationId): EdgesIterator<A, V> {
    for (const edge of this.#edges.values()) {
      if (edge.includesRelation(relation)) {
        yield edge
      }
    }
    return
  }

  /**
   * Nodes that have references to elements from logical model.
   */
  public *elements(): IteratorLike<NodeModel.WithElement<A, V>> {
    // return this.#nodes.values().filter(node => node.hasElement())
    for (const node of this.#nodes.values()) {
      if (node.hasElement()) {
        yield node
      }
    }
    return
  }

  /**
   * Checks if the view has the given tag.
   */
  public isTagged(tag: aux.LooseTag<A>): boolean {
    return this.tags.includes(tag as aux.Tag<A>)
  }

  public includesElement(element: aux.LooseElementId<A> | { id: aux.Fqn<A> }): boolean {
    return this.#includeElements.has(getId(element))
  }

  public includesDeployment(deployment: aux.LooseDeploymentId<A> | { id: aux.DeploymentFqn<A> }): boolean {
    return this.#includeDeployments.has(getId(deployment))
  }

  public includesRelation(relation: scalar.RelationId | { id: scalar.RelationId }): boolean {
    return this.#includeRelations.has(getId(relation))
  }

  /**
   * Below are type guards.
   */
  public isComputed(
    this: LikeC4ViewModel<any, any>,
  ): this is LikeC4ViewModel.Computed<aux.toComputed<A>> {
    return this.$view[_stage] === 'computed'
  }

  public isLayouted(): this is LikeC4ViewModel.Layouted<A> {
    return this.$view[_stage] === 'layouted'
  }

  /**
   * @deprecated Use {@link isLayouted} instead
   */
  public isDiagram(): this is LikeC4ViewModel.Layouted<A> {
    return this.$view[_stage] === 'layouted'
  }

  public isElementView(this: LikeC4ViewModel<any, any>): this is LikeC4ViewModel.ElementView<A, V> {
    return this.$view[_type] === 'element'
  }

  public isScopedElementView(
    this: LikeC4ViewModel<any, any>,
  ): this is LikeC4ViewModel.ScopedElementView<A> {
    return this.$view[_type] === 'element' && isTruthy(this.$view.viewOf)
  }

  public isDeploymentView(this: LikeC4ViewModel<any, any>): this is LikeC4ViewModel.DeploymentView<A, V> {
    return this.$view[_type] === 'deployment'
  }

  public isDynamicView(this: LikeC4ViewModel<any, any>): this is LikeC4ViewModel.DynamicView<A, V> {
    return this.$view[_type] === 'dynamic'
  }
}

export namespace LikeC4ViewModel {
  export type Computed<A> = A extends AnyComputed ? LikeC4ViewModel<A, ComputedView<A>> : never

  export type Layouted<A> = A extends AnyLayouted ? LikeC4ViewModel<A, LayoutedView<A>> : never

  export interface ElementView<A extends Any, V extends $View<A> = $View<A>>
    extends LikeC4ViewModel<A, ViewWithType<V, 'element'>>
  {
    readonly mode: never
  }

  export interface ScopedElementView<A extends Any>
    extends LikeC4ViewModel<A, ViewWithType<$View<A>, 'element'> & { viewOf: aux.StrictFqn<A> }>
  {
    readonly mode: never
    readonly viewOf: ElementModel<A>
  }

  export interface DeploymentView<A extends Any, V extends $View<A> = $View<A>>
    extends LikeC4ViewModel<A, ViewWithType<V, 'deployment'>>
  {
    readonly mode: never
  }

  export interface DynamicView<A extends Any, V extends $View<A>>
    extends LikeC4ViewModel<A, ViewWithType<V, 'dynamic'>>
  {
    readonly mode: DynamicViewDisplayVariant
    readonly viewOf: never
  }
}
