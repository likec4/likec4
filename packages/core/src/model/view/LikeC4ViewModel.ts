import { isTruthy } from 'remeda'
import { nonNullable } from '../../errors'
import type {
  AnyAux,
  AnyView,
  aux,
  auxloose,
  ComputedView,
  DiagramView,
  ExtractOnStage,
  IteratorLike,
  Link,
  scalar,
  ViewWithType,
} from '../../types'
import { _stage, _type } from '../../types'
import { DefaultMap, ifind } from '../../utils'
import type { ElementModel } from '../ElementModel'
import type { LikeC4Model } from '../LikeC4Model'
import {
  type $View,
  type EdgeOrId,
  type NodeOrId,
  getId,
} from '../types'
import { type EdgesIterator, EdgeModel } from './EdgeModel'
import { type NodesIterator, NodeModel } from './NodeModel'

export type ViewsIterator<A extends AnyAux, V extends $View<A> = $View<A>> = IteratorLike<LikeC4ViewModel<A, V>>

export type InferViewType<V> = V extends AnyView<any> ? V[_type] : never

export class LikeC4ViewModel<A extends AnyAux, V extends $View<A> = $View<A>> {
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

  public readonly $view: V
  public readonly $model: LikeC4Model<A>

  constructor(model: LikeC4Model<A>, view: V) {
    this.$model = model
    this.$view = view
    for (const node of view.nodes) {
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

    for (const edge of view.edges) {
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
  }

  get _type(): InferViewType<V> {
    return this.$view[_type] as InferViewType<V>
  }

  get id(): aux.StrictViewId<A> {
    return this.$view.id
  }

  get title(): string | null {
    return this.$view.title
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
   * All tags from nodes and edges.
   */
  get includedTags(): aux.Tags<A> {
    return [...this.#allTags.keys()] as unknown as aux.Tags<A>
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

  public findNodeWithElement(element: auxloose.ElementId<A> | { id: aux.Fqn<A> }): NodeModel.WithElement<A, V> | null {
    const id = getId(element)
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
   * Find edge by id.
   * @param edge Edge or id
   * @returns EdgeModel
   */
  public edge(edge: EdgeOrId): EdgeModel<A, V> {
    const edgeId = getId(edge)
    return nonNullable(this.#edges.get(edgeId), `Edge ${edgeId} not found in view ${this.$view.id}`)
  }
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

  public includesElement(element: auxloose.ElementId<A> | { id: aux.Fqn<A> }): boolean {
    return this.#includeElements.has(getId(element))
  }

  public includesDeployment(deployment: auxloose.DeploymentId<A> | { id: aux.DeploymentFqn<A> }): boolean {
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
  ): this is LikeC4ViewModel<aux.toComputed<A>> {
    return this.$view[_stage] === 'computed'
  }

  public isDiagram(
    this: LikeC4ViewModel<any, any>,
  ): this is LikeC4ViewModel<aux.toLayouted<A>> {
    return this.$view[_stage] === 'layouted'
  }

  public isElementView(this: LikeC4ViewModel<any, any>): this is LikeC4ViewModel<A, ViewWithType<V, 'element'>> {
    return this.$view[_type] === 'element'
  }

  public isScopedElementView(
    this: LikeC4ViewModel<any, any>,
  ): this is LikeC4ViewModel<A, ViewWithType<V, 'element'> & { viewOf: aux.StrictFqn<A> }> {
    return this.$view[_type] === 'element' && isTruthy(this.$view.viewOf)
  }

  public isDeploymentView(this: LikeC4ViewModel<any, any>): this is LikeC4ViewModel<A, ViewWithType<V, 'deployment'>> {
    return this.$view[_type] === 'deployment'
  }

  public isDynamicView(this: LikeC4ViewModel<any, any>): this is LikeC4ViewModel<A, ViewWithType<V, 'dynamic'>> {
    return this.$view[_type] === 'dynamic'
  }
}
