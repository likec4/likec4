import type { ExoticComponent, ForwardedRef, FunctionComponent, RefAttributes } from 'react'
import { forwardRef } from 'react'
import { Diagram as LikeC4Diagram } from './diagram'
import { LikeC4Browser, LikeC4Embedded } from './browser'
import { ResponsiveDiagram as LikeC4ResponsiveDiagram } from './responsive'
import type { LikeC4BrowserProps, LikeC4EmbeddedProps } from './browser'
import type { DiagramApi, DiagramProps as LikeC4DiagramProps, DiagramViews } from './diagram/types'
import type { ResponsiveDiagramProps as LikeC4ResponsiveDiagramProps } from './responsive'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace LikeC4 {
  export type DiagramProps<Id extends string> = Omit<LikeC4DiagramProps, 'diagram'> &
    RefAttributes<DiagramApi> & {
      viewId: Id
    }

  export type ResponsiveDiagramProps<Id extends string> = Omit<
    LikeC4ResponsiveDiagramProps,
    'diagram'
  > &
    RefAttributes<DiagramApi> & {
      viewId: Id
    }

  export type EmbeddedDiagramProps<Id extends string> = Omit<
    LikeC4EmbeddedProps<DiagramViews, Id>,
    'views'
  >
  export type DiagramBrowserProps<Id extends string> = Omit<
    LikeC4BrowserProps<DiagramViews, Id>,
    'views'
  >

  export interface Diagram<Id extends string> extends ExoticComponent<DiagramProps<Id>> {}

  export interface ResponsiveDiagram<Id extends string>
    extends ExoticComponent<ResponsiveDiagramProps<Id>> {}

  export interface EmbeddedDiagram<Id extends string>
    extends ExoticComponent<EmbeddedDiagramProps<Id>> {}

  export interface DiagramBrowser<Id extends string>
    extends FunctionComponent<DiagramBrowserProps<Id>> {}
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
    return <LikeC4Diagram ref={ref} diagram={diagram} {...props} />
  })

  readonly ResponsiveDiagram: LikeC4.ResponsiveDiagram<ViewId> = forwardRef(
    ({ viewId, ...props }, ref) => {
      const diagram = this.views[viewId]
      if (!diagram) {
        throw new Error(`View "${viewId}" not found in views`)
      }
      return <LikeC4ResponsiveDiagram ref={ref} diagram={diagram} {...props} />
    }
  )

  readonly EmbeddedDiagram: LikeC4.EmbeddedDiagram<ViewId> = forwardRef(
    (props: LikeC4.EmbeddedDiagramProps<ViewId>, ref: ForwardedRef<DiagramApi>) => {
      return <LikeC4Embedded ref={ref} views={this.views} {...props} />
    }
  )

  readonly DiagramBrowser: LikeC4.DiagramBrowser<ViewId> = props => {
    return <LikeC4Browser views={this.views} {...props} />
  }

  static create<V extends DiagramViews>(views: V) {
    if (Object.keys(views).length === 0) {
      throw new Error('LikeC4: views must not be empty')
    }
    return new LikeC4(views)
  }
}
