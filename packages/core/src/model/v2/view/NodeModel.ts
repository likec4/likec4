import {
  type ALikeC4Model,
  type Color as C4Color,
  ComputedNode,
  type ComputedView,
  type DiagramView,
  type ElementShape as C4ElementShape,
  type LayoutedLikeC4Model,
  type NodeId,
  type Tag as C4Tag,
  type ViewID
} from '../../../types'
import type { IncomingFilter, OutgoingFilter } from '../../types'
import type { ElementModel } from '../ElementModel'
import type { ViewType } from '../LikeC4Model'
import type { EdgeModel } from './EdgeModel'
import type { LikeC4ViewModel } from './LikeC4ViewModel'

export class NodeModel<M extends ALikeC4Model, V extends ComputedView | DiagramView> {
  constructor(
    public readonly view: LikeC4ViewModel<M, V>,
    public readonly $node: V['nodes'][number]
  ) {
  }

  get id(): NodeId {
    return this.$node.id
  }

  get title(): string {
    return this.$node.title
  }

  get description(): string | null {
    return this.$node.description
  }

  get technology(): string | null {
    return this.$node.technology
  }

  get parent(): NodeModel<M, V> | null {
    return this.$node.parent ? this.view.node(this.$node.parent) : null
  }

  get element(): ElementModel<M> | null {
    const modelRef = ComputedNode.modelRef(this.$node)
    return modelRef ? this.view.model.element(modelRef) : null
  }

  get shape(): C4ElementShape {
    return this.$node.shape
  }

  get color(): C4Color {
    return this.$node.color
  }

  get tags(): ReadonlyArray<C4Tag> {
    return this.$node.tags ?? []
  }

  public *ancestors(): IteratorObject<NodeModel<M, V>> {
    let parent = this.parent
    while (parent) {
      yield parent
      parent = parent.parent
    }
    return
  }

  public *children(): IteratorObject<NodeModel<M, V>> {
    for (const child of this.$node.children) {
      yield this.view.node(child)
    }
    return
  }

  public *sublings(): IteratorObject<NodeModel<M, V>> {
    const parent = this.parent
    if (parent) {
      for (const child of parent.$node.children) {
        if (child !== this.id) {
          yield this.view.node(child)
        }
      }
    }
    return
  }

  public *incoming(filter: IncomingFilter = 'all'): IteratorObject<EdgeModel<M, V>> {
    for (const edgeId of this.$node.inEdges) {
      const edge = this.view.edge(edgeId)
      switch (true) {
        case filter === 'all':
          yield edge
          break
        case filter === 'direct' && edge.$edge.target === this.id:
          yield this.view.edge(edgeId)
          break
        case filter === 'to-descendants' && edge.$edge.target !== this.id:
          yield this.view.edge(edgeId)
          break
      }
    }
    return
  }

  public *incomers(filter: IncomingFilter = 'all'): IteratorObject<NodeModel<M, V>> {
    for (const edgeId of this.$node.inEdges) {
      const edge = this.view.edge(edgeId)
      switch (true) {
        case filter === 'all':
          yield edge.source
          break
        case filter === 'direct' && edge.$edge.target === this.id:
          yield edge.source
          break
        case filter === 'to-descendants' && edge.$edge.target !== this.id:
          yield edge.source
          break
      }
    }
    return
  }

  public *outgoing(filter: OutgoingFilter = 'all'): IteratorObject<EdgeModel<M, V>> {
    for (const edgeId of this.$node.outEdges) {
      const edge = this.view.edge(edgeId)
      switch (true) {
        case filter === 'all':
          yield edge
          break
        case filter === 'direct' && edge.$edge.source === this.id:
          yield edge
          break
        case filter === 'from-descendants' && edge.$edge.source !== this.id:
          yield edge
          break
      }
    }
    return
  }

  public *outgoers(filter: OutgoingFilter = 'all'): IteratorObject<NodeModel<M, V>> {
    for (const edgeId of this.$node.outEdges) {
      const edge = this.view.edge(edgeId)
      switch (true) {
        case filter === 'all':
          yield edge.target
          break
        case filter === 'direct' && edge.$edge.source === this.id:
          yield edge.target
          break
        case filter === 'from-descendants' && edge.$edge.source !== this.id:
          yield edge.target
          break
      }
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

  public hasElement(): this is NodeModel.WithElement<M, V> {
    return ComputedNode.modelRef(this.$node) !== null
  }

  public isGroup(): this is NodeModel.WithoutElement<M, V> {
    return ComputedNode.isNodesGroup(this.$node)
  }
}

export namespace NodeModel {
  export interface WithParent<M extends ALikeC4Model, V extends ComputedView | DiagramView> extends NodeModel<M, V> {
    parent: NodeModel<M, V>
  }
  export interface WithElement<M extends ALikeC4Model, V extends ComputedView | DiagramView> extends NodeModel<M, V> {
    element: ElementModel<M>
  }
  export interface WithoutElement<M extends ALikeC4Model, V extends ComputedView | DiagramView>
    extends NodeModel<M, V>
  {
    element: null
  }
}
