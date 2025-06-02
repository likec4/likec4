import { nonNullable } from '../../errors'
import type { AnyAux, IteratorLike, Link } from '../../types'
import { DefaultMap, ifind } from '../../utils'
import type { ElementModel } from '../ElementModel'
import type { LikeC4Model } from '../LikeC4Model'
import {
  type $Computed,
  type $Diagram,
  type $RefineComputed,
  type $View,
  type EdgeOrId,
  type ElementOrFqn,
  type NodeOrId,
  getId,
} from '../types'
import { type EdgesIterator, EdgeModel } from './EdgeModel'
import { type NodesIterator, NodeModel } from './NodeModel'

export type ViewsIterator<A extends AnyAux> = IteratorLike<LikeC4ViewModel<A>>

export class LikeC4ViewModel<A extends AnyAux> {
  readonly #rootnodes = new Set<NodeModel<A>>()
  readonly #nodes = new Map<Aux.NodeId, NodeModel<A>>()
  readonly #edges = new Map<Aux.EdgeId, EdgeModel<A>>()
  readonly #includeElements = new Set<Aux.Fqn<A>>()
  readonly #includeDeployments = new Set<Aux.DeploymentFqn<A>>()
  readonly #includeRelations = new Set<Aux.RelationId<A>>()
  readonly #allTags = new DefaultMap((_key: Aux.Tag<A>) => new Set<NodeModel<A> | EdgeModel<A>>())

  constructor(
    public readonly $model: LikeC4Model<A>,
    public readonly $view: $View<A>,
  ) {
    for (const node of $view.nodes) {
      const el = new NodeModel(this, Object.freeze(node))
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

    for (const edge of $view.edges) {
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

  get __(): NonNullable<$View<A>['__']> {
    return this.$view.__ ?? 'element'
  }

  get id(): Aux.StrictViewId<A> {
    return this.$view.id
  }

  get title(): string | null {
    return this.$view.title
  }

  get tags(): Aux.Tags<A> {
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
  get includedTags(): Aux.Tags<A> {
    return [...this.#allTags.keys()] as unknown as Aux.Tags<A>
  }

  public roots(): NodesIterator<A> {
    return this.#rootnodes.values()
  }

  /**
   * Iterate over all nodes that have children.
   */
  public *compounds(): NodesIterator<A> {
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
  public node(node: NodeOrId): NodeModel<A> {
    const nodeId = getId(node)
    return nonNullable(this.#nodes.get(nodeId), `Node ${nodeId} not found in view ${this.$view.id}`)
  }

  /**
   * Find node by id.
   */
  public findNode(node: NodeOrId): NodeModel<A> | null {
    return this.#nodes.get(getId(node)) ?? null
  }

  public findNodeWithElement(fqn: ElementOrFqn<Aux.Fqn<A>>): NodeModel.WithElement<A> | null {
    const nd = ifind(this.#nodes.values(), node => node.element?.id === fqn) ?? null
    return nd && nd.hasElement() ? nd : null
  }

  /**
   * Iterate over all nodes.
   */
  public nodes(): NodesIterator<A> {
    return this.#nodes.values()
  }

  /**
   * Find edge by id.
   * @param edge Edge or id
   * @returns EdgeModel
   */
  public edge(edge: EdgeOrId): EdgeModel<A> {
    const edgeId = getId(edge)
    return nonNullable(this.#edges.get(edgeId), `Edge ${edgeId} not found in view ${this.$view.id}`)
  }
  public findEdge(edge: EdgeOrId): EdgeModel<A> | null {
    return this.#edges.get(getId(edge)) ?? null
  }
  /**
   * Iterate over all edges.
   */
  public edges(): EdgesIterator<A> {
    return this.#edges.values()
  }

  /**
   * Iterate over all edges.
   */
  public *edgesWithRelation(relation: Aux.RelationId<A>): EdgesIterator<A> {
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
  public *elements(): IteratorLike<NodeModel.WithElement<A>> {
    // return this.#nodes.values().filter(node => node.hasElement())
    for (const node of this.#nodes.values()) {
      if (node.hasElement()) {
        yield node
      }
    }
    return
  }

  public includesElement(elementId: Aux.Fqn<A>): boolean {
    return this.#includeElements.has(elementId)
  }

  public includesDeployment(deploymentId: Aux.DeploymentFqn<A>): boolean {
    return this.#includeDeployments.has(deploymentId)
  }

  public includesRelation(relationId: Aux.RelationId<A>): boolean {
    return this.#includeRelations.has(relationId)
  }

  /**
   * Below are type guards.
   */
  public isComputed(): this is LikeC4ViewModel<$Computed<A>> {
    return !('bounds' in this.$view)
  }

  public isDiagram(): this is LikeC4ViewModel<$Diagram<A>> {
    return 'bounds' in this.$view
  }

  public isElementView(): this is LikeC4ViewModel<$RefineComputed<A, 'element'>> {
    return this.__ === 'element'
  }

  public isDeploymentView(): this is LikeC4ViewModel<$RefineComputed<A, 'deployment'>> {
    return this.__ === 'deployment'
  }

  public isDynamicView(): this is LikeC4ViewModel<$RefineComputed<A, 'dynamic'>> {
    return this.__ === 'dynamic'
  }
}
