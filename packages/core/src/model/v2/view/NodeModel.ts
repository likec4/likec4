import {
  type Color as C4Color,
  ComputedNode,
  type DiagramView,
  type ElementShape as C4ElementShape,
  type NodeId,
  type Tag as C4Tag
} from '../../../types'
import type { IncomingFilter, OutgoingFilter } from '../../types'
import type { ElementModel } from '../ElementModel'
import type { EdgeModel } from './EdgeModel'
import type { ComputedOrDiagram, LikeC4ViewModel } from './LikeC4ViewModel'

export class NodeModel<V extends ComputedOrDiagram> {
  constructor(
    public readonly view: LikeC4ViewModel<V>,
    public readonly $node: V['nodes'][number]
  ) {
  }

  get id(): NodeId {
    return this.$node.id
  }

  get title(): string {
    return this.$node.title
  }

  get parent(): NodeModel<V> | null {
    return this.$node.parent ? this.view.node(this.$node.parent) : null
  }

  get element(): ElementModel | null {
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

  public *ancestors(): IteratorObject<NodeModel<V>> {
    let parent = this.parent
    while (parent) {
      yield parent
      parent = parent.parent
    }
    return
  }

  public *children(): IteratorObject<NodeModel<V>> {
    for (const child of this.$node.children) {
      yield this.view.node(child)
    }
    return
  }

  public *sublings(): IteratorObject<NodeModel<V>> {
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

  public *incoming(filter: IncomingFilter = 'all'): IteratorObject<EdgeModel<V>> {
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

  public *incomers(filter: IncomingFilter = 'all'): IteratorObject<NodeModel<V>> {
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

  public *outgoing(filter: OutgoingFilter = 'all'): IteratorObject<EdgeModel<V>> {
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

  public *outgoers(filter: OutgoingFilter = 'all'): IteratorObject<NodeModel<V>> {
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

  public isDiagramNode(): this is NodeModel<DiagramView> {
    return 'width' in this.$node && 'height' in this.$node
  }

  public hasChildren(): boolean {
    return this.$node.children.length > 0
  }

  public hasParent(): this is NodeModel.WithParent<V> {
    return this.$node.parent !== null
  }

  public hasElement(): this is NodeModel.WithElement<V> {
    return ComputedNode.modelRef(this.$node) !== null
  }

  public isGroup(): this is NodeModel.WithoutElement<V> {
    return ComputedNode.isNodesGroup(this.$node)
  }
}

export namespace NodeModel {
  export interface WithParent<V extends ComputedOrDiagram> extends NodeModel<V> {
    parent: NodeModel<V>
  }
  export interface WithElement<V extends ComputedOrDiagram> extends NodeModel<V> {
    element: ElementModel
  }
  export interface WithoutElement<V extends ComputedOrDiagram> extends NodeModel<V> {
    element: null
  }
}
