import type { ExoticComponent, FunctionComponent, RefAttributes } from 'react'
import { forwardRef } from 'react'
import { Diagram } from './diagram'
import { DiagramsBrowser, EmbeddedDiagram } from './browser'
import { ResponsiveDiagram } from './responsive'
import type { DiagramsBrowserProps, EmbeddedDiagramProps } from './browser'
import type { DiagramProps, DiagramViews, DiagramApi } from './diagram/types'
import type { ResponsiveDiagramProps } from './responsive'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace LikeC4 {
  export type Props<Id extends string> = Omit<DiagramProps, 'diagram'> &
    RefAttributes<DiagramApi> & {
      viewId: Id
    }

  export type ResponsiveProps<Id extends string> = Omit<ResponsiveDiagramProps, 'diagram'> &
    RefAttributes<DiagramApi> & {
      viewId: Id
    }

  export type EmbeddedProps<Id extends string> = Omit<
    EmbeddedDiagramProps<DiagramViews, Id>,
    'views'
  >
  export type BrowserProps<Id extends string> = Omit<
    DiagramsBrowserProps<DiagramViews, Id>,
    'views'
  >

  export interface Diagram<Id extends string> extends ExoticComponent<Props<Id>> {}

  export interface Responsive<Id extends string> extends ExoticComponent<ResponsiveProps<Id>> {}

  export interface Embedded<Id extends string> extends ExoticComponent<EmbeddedProps<Id>> {}

  export interface Browser<Id extends string> extends FunctionComponent<BrowserProps<Id>> {}
}

export class LikeC4<Views extends DiagramViews, ViewId extends keyof Views & string> {
  /**
   * For type inference.
   *
   * const { inferViewId /// } = LikeC4.create(views)
   * type ViewId = typeof inferViewId
   */
  inferViewId!: ViewId

  protected constructor(private views: Views) {}

  readonly isViewId = (value: unknown): value is ViewId => {
    return (
      value != null &&
      typeof value === 'string' &&
      Object.prototype.hasOwnProperty.call(this.views, value)
    )
  }

  readonly Diagram: LikeC4.Diagram<ViewId> = forwardRef(({ viewId, ...props }, ref) => {
    const diagram = this.views[viewId]
    if (!diagram) {
      throw new Error(`View "${viewId}" not found in views`)
    }
    return <Diagram ref={ref} diagram={diagram} {...props} />
  })

  readonly Responsive: LikeC4.Responsive<ViewId> = forwardRef(({ viewId, ...props }, ref) => {
    const diagram = this.views[viewId]
    if (!diagram) {
      throw new Error(`View "${viewId}" not found in views`)
    }
    return <ResponsiveDiagram ref={ref} diagram={diagram} {...props} />
  })

  readonly Embedded: LikeC4.Embedded<ViewId> = forwardRef((props, ref) => {
    return <EmbeddedDiagram ref={ref} views={this.views} {...props} />
  })

  readonly Browser: LikeC4.Browser<ViewId> = props => {
    return <DiagramsBrowser views={this.views} {...props} />
  }

  static create<V extends DiagramViews>(views: V) {
    if (Object.keys(views).length === 0) {
      throw new Error('LikeC4: views must not be empty')
    }
    return new LikeC4(views)
  }
}
