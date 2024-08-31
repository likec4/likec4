import { isNullish } from 'remeda'
import type { ElementShape, Tag } from '../../types/element'
import type { ThemeColor } from '../../types/theme'
import type { ComputedNode } from '../../types/view'
import type { LikeC4Model } from '../LikeC4Model'
import type { Fqn } from '../types'
import type { ViewConnection } from './ViewConnection'
import type { ViewModel } from './ViewModel'

/**
 * Represents an element in the view. (Diagram node)
 * All methods are view-scoped, i.e. `children` returns only children of the element in the view.
 */
export class ViewElement {
  constructor(
    public readonly node: ComputedNode,
    private viewmodel: ViewModel
  ) {
  }

  get id() {
    return this.node.id
  }

  get title() {
    return this.node.title
  }

  get kind() {
    return this.node.kind
  }

  get isRoot(): boolean {
    return isNullish(this.node.parent)
  }

  get hasNested(): boolean {
    return this.node.children.length > 0
  }

  get shape(): ElementShape {
    return this.node.shape
  }

  get color(): ThemeColor {
    return this.node.color
  }

  get tags(): Tag[] {
    return this.node.tags ?? []
  }

  public model(): LikeC4Model.Element {
    return this.viewmodel.model.element(this.id)
  }

  public parent(): ViewElement | null {
    return this.node.parent ? this.viewmodel.element(this.node.parent) : null
  }

  public metadata(key: string): string | undefined
  public metadata(key: string, defaultValue: string): string
  public metadata(key: string, defaultValue?: string): string | undefined {
    return this.model().metadata(key) ?? defaultValue
  }

  public hasMetadata(key: string): boolean {
    return this.model().hasMetadata(key)
  }

  public ancestors(): ReadonlyArray<ViewElement> {
    return this.viewmodel.ancestors(this)
  }

  public siblings(): ReadonlyArray<ViewElement> {
    return this.viewmodel.siblings(this)
  }

  public descendants(): ReadonlyArray<ViewElement> {
    return this.viewmodel.descendants(this)
  }

  public children(): ReadonlyArray<ViewElement> {
    return this.viewmodel.children(this)
  }

  public incoming(filter: 'all' | 'direct' | 'to-descendants' = 'all'): ReadonlyArray<ViewConnection> {
    return this.viewmodel.incoming(this, filter)
  }

  public incomers(filter: 'all' | 'direct' | 'to-descendants' = 'all'): ReadonlyArray<ViewElement> {
    return this.viewmodel.incomers(this, filter)
  }

  public outgoing(filter: 'all' | 'direct' | 'from-descendants' = 'all'): ReadonlyArray<ViewConnection> {
    return this.viewmodel.outgoing(this, filter)
  }

  public outgoers(filter: 'all' | 'direct' | 'from-descendants' = 'all'): ReadonlyArray<ViewElement> {
    return this.viewmodel.outgoers(this, filter)
  }

  public connectionsTo(target: Fqn | ViewElement): ReadonlyArray<ViewConnection> {
    return this.viewmodel.findConnections(this, target)
  }
}
