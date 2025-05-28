import type { Aux, GroupElementKind, ProcessedView } from '../../types'
import {
  type AnyAux,
  type DiagramView,
  type ElementShape as C4ElementShape,
  type ElementStyle,
  type IconUrl,
  type IteratorLike,
  type Link,
  type ThemeColor as C4Color,
  ComputedNode,
} from '../../types'
import type { DeployedInstanceModel, DeploymentElementModel } from '../DeploymentElementModel'
import type { ElementModel } from '../ElementModel'
import type { IncomingFilter, OutgoingFilter } from '../types'
import type { EdgesIterator } from './EdgeModel'
import type { LikeC4ViewModel } from './LikeC4ViewModel'

export type NodesIterator<M extends AnyAux, V extends ProcessedView<M>> = IteratorLike<NodeModel<M, V>>

export namespace NodeModel {
  export interface WithParent<M extends AnyAux, V extends ProcessedView<M>> extends NodeModel<M, V> {
    parent: NodeModel<M, V>
  }
  export interface WithElement<M extends AnyAux, V extends ProcessedView<M>> extends NodeModel<M, V> {
    kind: Aux.ElementKind<M>
    element: ElementModel<M>
  }
  export interface WithDeploymentElement<M extends AnyAux, V extends ProcessedView<M>> extends NodeModel<M, V> {
    kind: Aux.DeploymentKind<M>
    deployment: DeploymentElementModel<M>
  }
  export interface WithDeployedInstance<M extends AnyAux, V extends ProcessedView<M>> extends NodeModel<M, V> {
    kind: 'instance'
    element: ElementModel<M>
    deployment: DeployedInstanceModel<M>
  }

  export interface IsGroup<M extends AnyAux, V extends ProcessedView<M>> extends NodeModel<M, V> {
    kind: typeof GroupElementKind
    element: null
    deployment: null
  }
}

export class NodeModel<A extends AnyAux, V extends ProcessedView<A> = ProcessedView<A>> {
  constructor(
    public readonly $view: LikeC4ViewModel<A, V>,
    public readonly $node: V['nodes'][number],
  ) {
  }

  get id(): Aux.Strict.NodeId<A> {
    return this.$node.id
  }

  get title(): string {
    return this.$node.title
  }

  get kind(): Aux.ElementKind<A> | Aux.DeploymentKind<A> | typeof GroupElementKind | 'instance' {
    return this.$node.kind as any
  }

  get description(): string | null {
    return this.$node.description ?? null
  }

  get technology(): string | null {
    return this.$node.technology ?? null
  }

  get parent(): NodeModel<A, V> | null {
    return this.$node.parent ? this.$view.node(this.$node.parent) : null
  }

  get element(): ElementModel<A> | null {
    const modelRef = ComputedNode.modelRef(this.$node)
    return modelRef ? this.$view.$model.element(modelRef) : null
  }

  get deployment(): DeploymentElementModel<A> | null {
    const modelRef = ComputedNode.deploymentRef(this.$node)
    return modelRef ? this.$view.$model.deployment.element(modelRef) : null
  }

  get shape(): C4ElementShape {
    return this.$node.shape
  }

  get color(): C4Color {
    return this.$node.color
  }

  get icon(): IconUrl | null {
    return this.$node.icon ?? null
  }

  get tags(): Aux.Tags<A> {
    return this.$node.tags ?? []
  }

  get links(): ReadonlyArray<Link> {
    return this.$node.links ?? []
  }

  get navigateTo(): LikeC4ViewModel<A> | null {
    return this.$node.navigateTo ? this.$view.$model.view(this.$node.navigateTo) : null
  }

  get style(): ElementStyle {
    return this.$node.style
  }

  /**
   * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
   * (from closest to root)
   */
  public *ancestors(): NodesIterator<A, V> {
    let parent = this.parent
    while (parent) {
      yield parent
      parent = parent.parent
    }
    return
  }

  public *children(): NodesIterator<A, V> {
    for (const child of this.$node.children) {
      yield this.$view.node(child)
    }
    return
  }

  public *siblings(): NodesIterator<A, V> {
    const siblings = this.parent?.children() ?? this.$view.roots()
    for (const sibling of siblings) {
      if (sibling.id !== this.id) {
        yield sibling
      }
    }
    return
  }

  public *incoming(filter: IncomingFilter = 'all'): EdgesIterator<A, V> {
    for (const edgeId of this.$node.inEdges) {
      const edge = this.$view.edge(edgeId)
      switch (true) {
        case filter === 'all':
        case filter === 'direct' && edge.target.id === this.id:
        case filter === 'to-descendants' && edge.target.id !== this.id:
          yield edge
          break
      }
    }
    return
  }

  public *incomers(filter: IncomingFilter = 'all'): NodesIterator<A, V> {
    const unique = new Set<Aux.Strict.NodeId<A>>()
    for (const r of this.incoming(filter)) {
      if (unique.has(r.source.id)) {
        continue
      }
      unique.add(r.source.id)
      yield r.source
    }
    return
  }

  public *outgoing(filter: OutgoingFilter = 'all'): EdgesIterator<A, V> {
    for (const edgeId of this.$node.outEdges) {
      const edge = this.$view.edge(edgeId)
      switch (true) {
        case filter === 'all':
        case filter === 'direct' && edge.source.id === this.id:
        case filter === 'from-descendants' && edge.source.id !== this.id:
          yield edge
          break
      }
    }
    return
  }

  public *outgoers(filter: OutgoingFilter = 'all'): NodesIterator<A, V> {
    const unique = new Set<Aux.Strict.NodeId<A>>()
    for (const r of this.outgoing(filter)) {
      if (unique.has(r.target.id)) {
        continue
      }
      unique.add(r.target.id)
      yield r.target
    }
    return
  }

  public isDiagramNode(): this is NodeModel<A, DiagramView<A>> {
    return 'width' in this.$node && 'height' in this.$node
  }

  public hasChildren(): boolean {
    return this.$node.children.length > 0
  }

  public hasParent(): this is NodeModel.WithParent<A, V> {
    return this.$node.parent !== null
  }

  /**
   * Check if this node references to logical model element.
   */
  public hasElement(): this is NodeModel.WithElement<A, V> {
    return ComputedNode.modelRef(this.$node) !== null
  }
  /**
   * Check if this node references to deployment element (Node or Instance).
   */
  public hasDeployment(): this is NodeModel.WithDeploymentElement<A, V> {
    return ComputedNode.deploymentRef(this.$node) !== null
  }
  /**
   * Check if this node references to deployed instance
   * Deployed instance always references to element and deployment element.
   */
  public hasDeployedInstance(): this is NodeModel.WithDeployedInstance<A, V> {
    return this.hasElement() && this.hasDeployment()
  }

  public isGroup(): this is NodeModel.IsGroup<A, V> {
    return ComputedNode.isNodesGroup(this.$node)
  }
}
