import { sort } from 'remeda'
import { nonNullable } from '../../errors'
import type { RelationID as C4RelationID } from '../../types'
import type { Fqn as C4Fqn, Link, Tag } from '../../types/element'
import type { ALikeC4Model } from '../../types/model'
import {
  type ComputedDeploymentView,
  type ComputedDynamicView,
  type ComputedElementView,
  type ComputedView,
  type DiagramView,
  type EdgeId as C4EdgeId,
  isDeploymentView,
  isDynamicView,
  isElementView,
  type NodeId as C4NodeId,
  type ViewID as C4ViewID
} from '../../types/view'
import { compareByFqnHierarchically, getOrCreate } from '../../utils'
import type { ElementModel } from '../ElementModel'
import type { LikeC4Model, ViewType } from '../LikeC4Model'
import { type EdgeId, type Fqn, getId, type NodeId, type RelationID } from '../types'
import { EdgeModel } from './EdgeModel'
import { NodeModel } from './NodeModel'

type NodeOrId = NodeId | { id: NodeId }
type EdgeOrId = EdgeId | { id: EdgeId }

export class LikeC4ViewModel<M extends ALikeC4Model, V extends ComputedView | DiagramView = ViewType<M>> {
  readonly #rootnodes = new Set<NodeModel<M, V>>()
  readonly #nodes = new Map<C4NodeId, NodeModel<M, V>>()
  readonly #edges = new Map<C4EdgeId, EdgeModel<M, V>>()
  readonly #includeElements = new Set<C4Fqn>()
  readonly #includeDeployments = new Set<C4Fqn>()
  readonly #includeRelations = new Set<C4RelationID>()
  readonly #allTags = new Map<Tag, Set<NodeModel<M, V> | EdgeModel<M, V>>>()

  static Node = NodeModel
  static Edge = EdgeModel

  constructor(
    public readonly model: LikeC4Model<M>,
    public readonly $view: V
  ) {
    for (const node of sort($view.nodes, compareByFqnHierarchically)) {
      const el = new NodeModel(this, node)
      this.#nodes.set(node.id, el)
      if (!node.parent) {
        this.#rootnodes.add(el)
      }
      if (el.isDeployment()) {
        this.#includeDeployments.add(el.deployment.id)
      }
      if (el.isElement()) {
        this.#includeElements.add(el.element.id)
      }
      for (const tag of el.tags) {
        getOrCreate(this.#allTags, tag, () => new Set()).add(el)
      }
    }

    for (const edge of $view.edges) {
      const edgeModel = new EdgeModel(this, edge, this.node(edge.source), this.node(edge.target))
      for (const tag of edgeModel.tags) {
        getOrCreate(this.#allTags, tag, () => new Set()).add(edgeModel)
      }
      for (const rel of edge.relations) {
        this.#includeRelations.add(rel)
      }
      this.#edges.set(edge.id, edgeModel)
    }
  }

  get __(): NonNullable<ViewType<M>['__']> {
    return this.$view.__ ?? 'element'
  }

  get id(): C4ViewID {
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
    if (isElementView(this.$view)) {
      return this.$view.viewOf ? this.model.element(this.$view.viewOf) : null
    }
    return null
  }

  /**
   * All tags from nodes and edges.
   */
  get includedTags(): ReadonlyArray<Tag> {
    return [...this.#allTags.keys()]
  }

  public roots(): IteratorObject<NodeModel<M, V>> {
    return this.#rootnodes.values()
  }

  /**
   * Iterate over all nodes that have children.
   */
  public compounds(): IteratorObject<NodeModel<M, V>> {
    return this.#nodes.values().filter(node => node.hasChildren())
  }

  /**
   * Find node by id.
   */
  public node(node: NodeOrId): NodeModel<M, V> {
    const nodeId = getId(node) as C4NodeId
    return nonNullable(this.#nodes.get(nodeId), `Node ${nodeId} not found in view ${this.$view.id}`)
  }
  public findNode(node: NodeOrId): NodeModel<M, V> | null {
    return this.#nodes.get(getId(node) as C4NodeId) ?? null
  }
  /**
   * Iterate over all nodes.
   */
  public nodes(): IteratorObject<NodeModel<M, V>> {
    return this.#nodes.values()
  }

  /**
   * Find edge by id.
   * @param edge Edge or id
   * @returns EdgeModel
   */
  public edge(edge: EdgeOrId): EdgeModel<M, V> {
    const edgeId = getId(edge) as C4EdgeId
    return nonNullable(this.#edges.get(edgeId), `Edge ${edgeId} not found in view ${this.$view.id}`)
  }
  public findEdge(edge: EdgeOrId): EdgeModel<M, V> | null {
    return this.#edges.get(getId(edge) as C4EdgeId) ?? null
  }
  /**
   * Iterate over all edges.
   */
  public edges(): IteratorObject<EdgeModel<M, V>> {
    return this.#edges.values()
  }

  /**
   * Iterate over all edges.
   */
  public edgesWithRelation(relation: RelationID): IteratorObject<EdgeModel<M, V>> {
    return this.#edges.values().filter(edge => edge.includesRelation(relation))
  }

  /**
   * Nodes that have references to elements from logical model.
   */
  public elements(): IteratorObject<NodeModel.WithElement<M, V>> {
    return this.#nodes.values().filter(node => node.isElement())
  }

  public includesElement(elementId: Fqn): boolean {
    return this.#includeElements.has(elementId as C4Fqn)
  }

  public includesDeployment(deploymentId: Fqn): boolean {
    return this.#includeDeployments.has(deploymentId as C4Fqn)
  }

  public includesRelation(relationId: RelationID): boolean {
    return this.#includeRelations.has(relationId as C4RelationID)
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
    return isElementView(this.$view)
  }

  public isDeploymentView(): this is LikeC4ViewModel<M, ComputedDeploymentView> {
    return isDeploymentView(this.$view)
  }

  public isDynamicView(): this is LikeC4ViewModel<M, ComputedDynamicView> {
    return isDynamicView(this.$view)
  }
}
