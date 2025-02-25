import { nonNullable } from '../../errors'
import type { IteratorLike } from '../../types'
import type { Link, Tag } from '../../types/element'
import {
  type ComputedDeploymentView,
  type ComputedDynamicView,
  type ComputedElementView,
  type ComputedView,
  type DiagramView,
  type EdgeId as C4EdgeId,
  type LikeC4View,
  type NodeId as C4NodeId,
  isDeploymentView,
  isDynamicView,
  isElementView,
  isScopedElementView,
} from '../../types/view'
import { DefaultMap, ifind } from '../../utils'
import type { ElementModel } from '../ElementModel'
import type { LikeC4Model } from '../LikeC4Model'
import { type AnyAux, getId } from '../types'
import { type EdgesIterator, EdgeModel } from './EdgeModel'
import { type NodesIterator, NodeModel } from './NodeModel'

export type ViewsIterator<M extends AnyAux> = IteratorLike<LikeC4ViewModel<M>>

export class LikeC4ViewModel<M extends AnyAux, V extends ComputedView | DiagramView = M['ViewType']> {
  readonly #rootnodes = new Set<NodeModel<M, V>>()
  readonly #nodes = new Map<C4NodeId, NodeModel<M, V>>()
  readonly #edges = new Map<C4EdgeId, EdgeModel<M, V>>()
  readonly #includeElements = new Set<M['Element']>()
  readonly #includeDeployments = new Set<M['Deployment']>()
  readonly #includeRelations = new Set<M['RelationId']>()
  readonly #allTags = new DefaultMap((_key: Tag) => new Set<NodeModel<M, V> | EdgeModel<M, V>>())

  constructor(
    public readonly $model: LikeC4Model<M>,
    public readonly $view: V,
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

  get __(): NonNullable<M['ViewType']['__']> {
    return this.$view.__ ?? 'element'
  }

  get id(): M['ViewId'] {
    return this.$view.id
  }

  get title(): string | null {
    return this.$view.title
  }

  get tags(): ReadonlyArray<Tag> {
    return this.$view.tags ?? []
  }

  get links(): ReadonlyArray<Link> {
    return this.$view.links ?? []
  }

  get viewOf(): ElementModel<M> | null {
    const v = this.$view as LikeC4View
    if (isScopedElementView(v)) {
      return this.$model.element(v.viewOf)
    }
    return null
  }

  /**
   * All tags from nodes and edges.
   */
  get includedTags(): ReadonlyArray<Tag> {
    return [...this.#allTags.keys()]
  }

  public roots(): NodesIterator<M, V> {
    return this.#rootnodes.values()
  }

  /**
   * Iterate over all nodes that have children.
   */
  public *compounds(): NodesIterator<M, V> {
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
  public node(node: M['NodeOrId']): NodeModel<M, V> {
    const nodeId = getId(node)
    return nonNullable(this.#nodes.get(nodeId), `Node ${nodeId} not found in view ${this.$view.id}`)
  }

  /**
   * Find node by id.
   */
  public findNode(node: M['NodeOrId']): NodeModel<M, V> | null {
    return this.#nodes.get(getId(node) as C4NodeId) ?? null
  }

  public findNodeWithElement(fqn: M['Element']): NodeModel.WithElement<M, V> | null {
    const nd = ifind(this.#nodes.values(), node => node.element?.id === fqn) ?? null
    return nd && nd.hasElement() ? nd : null
  }

  /**
   * Iterate over all nodes.
   */
  public nodes(): NodesIterator<M, V> {
    return this.#nodes.values()
  }

  /**
   * Find edge by id.
   * @param edge Edge or id
   * @returns EdgeModel
   */
  public edge(edge: M['EdgeOrId']): EdgeModel<M, V> {
    const edgeId = getId(edge) as C4EdgeId
    return nonNullable(this.#edges.get(edgeId), `Edge ${edgeId} not found in view ${this.$view.id}`)
  }
  public findEdge(edge: M['EdgeOrId']): EdgeModel<M, V> | null {
    return this.#edges.get(getId(edge) as C4EdgeId) ?? null
  }
  /**
   * Iterate over all edges.
   */
  public edges(): EdgesIterator<M, V> {
    return this.#edges.values()
  }

  /**
   * Iterate over all edges.
   */
  public *edgesWithRelation(relation: M['RelationId']): EdgesIterator<M, V> {
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
  public *elements(): IteratorLike<NodeModel.WithElement<M, V>> {
    // return this.#nodes.values().filter(node => node.hasElement())
    for (const node of this.#nodes.values()) {
      if (node.hasElement()) {
        yield node
      }
    }
    return
  }

  public includesElement(elementId: M['Element']): boolean {
    return this.#includeElements.has(elementId)
  }

  public includesDeployment(deploymentId: M['Deployment']): boolean {
    return this.#includeDeployments.has(deploymentId)
  }

  public includesRelation(relationId: M['RelationId']): boolean {
    return this.#includeRelations.has(relationId)
  }

  /**
   * Below are type guards.
   */
  public isComputed(): this is LikeC4ViewModel<M, ComputedView> {
    return true // Diagram view is a computed view
  }

  public isDiagram(): this is LikeC4ViewModel<M, DiagramView> {
    return 'bounds' in this.$view
  }

  public isElementView(): this is LikeC4ViewModel<M, ComputedElementView> {
    return isElementView(this.$view as LikeC4View)
  }

  public isDeploymentView(): this is LikeC4ViewModel<M, ComputedDeploymentView> {
    return isDeploymentView(this.$view as LikeC4View)
  }

  public isDynamicView(): this is LikeC4ViewModel<M, ComputedDynamicView> {
    return isDynamicView(this.$view as LikeC4View)
  }
}
