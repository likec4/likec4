import {
  type Color as C4Color,
  type ComputedView,
  type DeploymentNodeKind,
  type DiagramView,
  type ElementShape as C4ElementShape,
  type ElementStyle,
  type IconUrl,
  type IteratorLike,
  type Link,
  type NodeId,
  type Tag as C4Tag,
  ComputedNode,
  ElementKind,
} from '../../types'
import type { DeployedInstanceModel, DeploymentElementModel } from '../DeploymentElementModel'
import type { ElementModel } from '../ElementModel'
import type { AnyAux, IncomingFilter, OutgoingFilter } from '../types'
import type { EdgesIterator } from './EdgeModel'
import type { LikeC4ViewModel } from './LikeC4ViewModel'

export type NodesIterator<M extends AnyAux, V extends ComputedView | DiagramView> = IteratorLike<NodeModel<M, V>>

export namespace NodeModel {
  export interface WithParent<M extends AnyAux, V extends ComputedView | DiagramView> extends NodeModel<M, V> {
    parent: NodeModel<M, V>
  }
  export interface WithElement<M extends AnyAux, V extends ComputedView | DiagramView> extends NodeModel<M, V> {
    kind: ElementKind
    element: ElementModel<M>
  }
  export interface WithDeploymentElement<M extends AnyAux, V extends ComputedView | DiagramView>
    extends NodeModel<M, V>
  {
    kind: DeploymentNodeKind
    deployment: DeploymentElementModel<M>
  }
  export interface WithDeployedInstance<M extends AnyAux, V extends ComputedView | DiagramView>
    extends NodeModel<M, V>
  {
    kind: 'instance'
    element: ElementModel<M>
    deployment: DeployedInstanceModel<M>
  }

  export interface IsGroup<M extends AnyAux, V extends ComputedView | DiagramView> extends NodeModel<M, V> {
    kind: typeof ElementKind.Group
    element: null
    deployment: null
  }
}

export class NodeModel<M extends AnyAux, V extends ComputedView | DiagramView = M['ViewType']> {
  constructor(
    public readonly $view: LikeC4ViewModel<M, V>,
    public readonly $node: V['nodes'][number],
  ) {
  }

  get id(): NodeId {
    return this.$node.id
  }

  get title(): string {
    return this.$node.title
  }

  get kind(): ElementKind | DeploymentNodeKind | typeof ElementKind.Group | 'instance' {
    return this.$node.kind as any
  }

  get description(): string | null {
    return this.$node.description
  }

  get technology(): string | null {
    return this.$node.technology
  }

  get parent(): NodeModel<M, V> | null {
    return this.$node.parent ? this.$view.node(this.$node.parent) : null
  }

  get element(): ElementModel<M> | null {
    const modelRef = ComputedNode.modelRef(this.$node)
    return modelRef ? this.$view.$model.element(modelRef) : null
  }

  get deployment(): DeploymentElementModel<M> | null {
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

  get tags(): ReadonlyArray<C4Tag> {
    return this.$node.tags ?? []
  }

  get links(): ReadonlyArray<Link> {
    return this.$node.links ?? []
  }

  get navigateTo(): LikeC4ViewModel<M> | null {
    return this.$node.navigateTo ? this.$view.$model.view(this.$node.navigateTo) : null
  }

  get style(): ElementStyle {
    return this.$node.style
  }

  /**
   * Get all ancestor elements (i.e. parent, parent’s parent, etc.)
   * (from closest to root)
   */
  public *ancestors(): NodesIterator<M, V> {
    let parent = this.parent
    while (parent) {
      yield parent
      parent = parent.parent
    }
    return
  }

  public *children(): NodesIterator<M, V> {
    for (const child of this.$node.children) {
      yield this.$view.node(child)
    }
    return
  }

  public *sublings(): NodesIterator<M, V> {
    const sublings = this.parent?.children() ?? this.$view.roots()
    for (const subling of sublings) {
      if (subling.id !== this.id) {
        yield subling
      }
    }
    return
  }

  public *incoming(filter: IncomingFilter = 'all'): EdgesIterator<M, V> {
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

  public *incomers(filter: IncomingFilter = 'all'): NodesIterator<M, V> {
    const unique = new Set<NodeId>()
    for (const r of this.incoming(filter)) {
      if (unique.has(r.source.id)) {
        continue
      }
      unique.add(r.source.id)
      yield r.source
    }
    return
  }

  public *outgoing(filter: OutgoingFilter = 'all'): EdgesIterator<M, V> {
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

  public *outgoers(filter: OutgoingFilter = 'all'): NodesIterator<M, V> {
    const unique = new Set<NodeId>()
    for (const r of this.outgoing(filter)) {
      if (unique.has(r.target.id)) {
        continue
      }
      unique.add(r.target.id)
      yield r.target
    }
    return
  }

  public isDiagramNode(): this is NodeModel<M, DiagramView> {
    return 'width' in this.$node && 'height' in this.$node
  }

  public hasChildren(): boolean {
    return this.$node.children.length > 0
  }

  public hasParent(): this is NodeModel.WithParent<M, V> {
    return this.$node.parent !== null
  }

  /**
   * Check if this node references to logical model element.
   */
  public hasElement(): this is NodeModel.WithElement<M, V> {
    return ComputedNode.modelRef(this.$node) !== null
  }
  /**
   * Check if this node references to deployment element (Node or Instance).
   */
  public hasDeployment(): this is NodeModel.WithDeploymentElement<M, V> {
    return ComputedNode.deploymentRef(this.$node) !== null
  }
  /**
   * Check if this node references to deployed instance
   * Deployed instance always references to element and deployment element.
   */
  public hasDeployedInstance(): this is NodeModel.WithDeployedInstance<M, V> {
    return this.hasElement() && this.hasDeployment()
  }

  public isGroup(): this is NodeModel.IsGroup<M, V> {
    return ComputedNode.isNodesGroup(this.$node)
  }
}
