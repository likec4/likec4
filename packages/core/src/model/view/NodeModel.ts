import { isTruthy } from 'remeda'
import {
  type Any,
  type Color,
  type ComputedNode,
  type DiagramNode,
  type ElementShape as C4ElementShape,
  type ElementStyle,
  type ExtractOnStage,
  type IconUrl,
  type IteratorLike,
  type Link,
  type RichTextOrEmpty,
  type scalar,
  GroupElementKind,
  isGroupElementKind,
  RichText,
} from '../../types'
import type * as aux from '../../types/_aux'
import { memoizeProp } from '../../utils'
import type { DeployedInstanceModel, DeploymentElementModel } from '../DeploymentElementModel'
import type { ElementModel } from '../ElementModel'
import type { $View, IncomingFilter, OutgoingFilter, WithTags } from '../types'
import type { EdgesIterator } from './EdgeModel'
import type { LikeC4ViewModel } from './LikeC4ViewModel'

export type NodesIterator<M extends Any, V extends $View<M>> = IteratorLike<NodeModel<M, V>>

export class NodeModel<A extends Any = Any, V extends $View<A> = $View<A>> implements WithTags<A> {
  #node: ComputedNode<A> | DiagramNode<A>

  constructor(
    public readonly $view: LikeC4ViewModel<A, V>,
    public readonly $node: V['nodes'][number],
  ) {
    this.#node = $node
  }

  get id(): scalar.NodeId {
    return this.#node.id
  }

  get title(): string {
    return this.#node.title
  }

  get kind(): aux.ElementKind<A> | aux.DeploymentKind<A> | typeof GroupElementKind | 'instance' {
    return this.#node.kind as any
  }

  get description(): RichTextOrEmpty {
    return RichText.memoize(this, this.#node.description)
  }

  get technology(): string | null {
    return this.#node.technology ?? null
  }

  get parent(): NodeModel<A, V> | null {
    return this.#node.parent ? this.$view.node(this.#node.parent) : null
  }

  get element(): ElementModel<A> | null {
    const modelRef = this.#node.modelRef
    return modelRef ? this.$view.$model.element(modelRef) : null
  }

  get deployment(): DeploymentElementModel<A> | null {
    const modelRef = this.#node.deploymentRef
    return modelRef ? this.$view.$model.deployment.element(modelRef) : null
  }

  get shape(): C4ElementShape {
    return this.#node.shape
  }

  get color(): Color {
    return this.#node.color
  }

  get icon(): IconUrl | null {
    return this.#node.icon ?? null
  }

  get tags(): aux.Tags<A> {
    return this.#node.tags
  }

  get links(): ReadonlyArray<Link> {
    return this.#node.links ?? []
  }

  get navigateTo(): LikeC4ViewModel<A> | null {
    return this.#node.navigateTo ? this.$view.$model.view(this.#node.navigateTo) : null
  }

  get style(): ElementStyle {
    return this.#node.style
  }

  public children(): ReadonlySet<NodeModel<A, V>> {
    return memoizeProp(this, 'children', () => new Set(this.#node.children.map((child) => this.$view.node(child))))
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
    for (const edgeId of this.#node.inEdges) {
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
    const unique = new Set<aux.NodeId>()
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
    for (const edgeId of this.#node.outEdges) {
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
    const unique = new Set<aux.NodeId>()
    for (const r of this.outgoing(filter)) {
      if (unique.has(r.target.id)) {
        continue
      }
      unique.add(r.target.id)
      yield r.target
    }
    return
  }

  public isDiagramNode(this: NodeModel<any, any>): this is NodeModel<A, ExtractOnStage<V, 'layouted'>> {
    return 'width' in this.#node && 'height' in this.#node
  }

  public hasChildren(): boolean {
    return this.#node.children.length > 0
  }

  public hasParent(): this is NodeModel.WithParent<A, V> {
    return this.#node.parent !== null
  }

  /**
   * Check if this node references to logical model element.
   */
  public hasElement(): this is NodeModel.WithElement<A, V> {
    return isTruthy(this.#node.modelRef)
  }
  /**
   * Check if this node references to deployment element (Node or Instance).
   */
  public hasDeployment(): this is NodeModel.WithDeploymentElement<A, V> {
    return isTruthy(this.#node.deploymentRef)
  }
  /**
   * Check if this node references to deployed instance
   * Deployed instance always references to element and deployment element.
   */
  public hasDeployedInstance(): this is NodeModel.WithDeployedInstance<A, V> {
    return this.hasElement() && this.hasDeployment()
  }

  public isGroup(): this is NodeModel.IsGroup<A, V> {
    return isGroupElementKind(this.#node)
  }

  /**
   * Checks if the node has the given tag.
   */
  public isTagged(tag: aux.LooseTag<A>): boolean {
    return this.tags.includes(tag as aux.Tag<A>)
  }
}

export namespace NodeModel {
  export interface WithParent<A extends Any = Any, V extends $View<A> = $View<A>> extends NodeModel<A, V> {
    parent: NodeModel<A, V>
  }
  export interface WithElement<A extends Any = Any, V extends $View<A> = $View<A>> extends NodeModel<A, V> {
    kind: aux.ElementKind<A>
    element: ElementModel<A>
  }
  export interface WithDeploymentElement<A extends Any = Any, V extends $View<A> = $View<A>> extends NodeModel<A, V> {
    kind: aux.DeploymentKind<A>
    deployment: DeploymentElementModel<A>
  }
  export interface WithDeployedInstance<A extends Any = Any, V extends $View<A> = $View<A>> extends NodeModel<A, V> {
    kind: 'instance'
    element: ElementModel<A>
    deployment: DeployedInstanceModel<A>
  }

  export interface IsGroup<A extends Any = Any, V extends $View<A> = $View<A>> extends NodeModel<A, V> {
    kind: typeof GroupElementKind
    element: null
    deployment: null
  }
}
