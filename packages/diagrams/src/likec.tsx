import type { ExoticComponent, FunctionComponent, RefAttributes } from 'react'
import { forwardRef } from 'react'
import { Diagram } from './diagram'
import { DiagramsBrowser, EmbeddedDiagram } from './browser'
import { ResponsiveDiagram } from './responsive'
import type * as B from './browser'
import type * as T from './diagram/types'
import type * as R from './responsive'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace LikeC4 {
  export type DiagramProps<Id extends string> = Omit<T.DiagramProps, 'diagram'> &
    RefAttributes<T.DiagramApi> & {
      viewId: Id
    }

  export type ResponsiveDiagramProps<Id extends string> = Omit<
    R.ResponsiveDiagramProps,
    'diagram'
  > &
    RefAttributes<T.DiagramApi> & {
      viewId: Id
    }

  export type EmbeddedDiagramProps<Id extends string> = Omit<
    B.EmbeddedDiagramProps<T.DiagramViews, Id>,
    'views'
  >
  export type DiagramBrowserProps<Id extends string> = Omit<
    B.DiagramsBrowserProps<T.DiagramViews, Id>,
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

export class LikeC4<Views extends T.DiagramViews, ViewId extends keyof Views & string> {
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

  readonly ResponsiveDiagram: LikeC4.ResponsiveDiagram<ViewId> = forwardRef(
    ({ viewId, ...props }, ref) => {
      const diagram = this.views[viewId]
      if (!diagram) {
        throw new Error(`View "${viewId}" not found in views`)
      }
      return <ResponsiveDiagram ref={ref} diagram={diagram} {...props} />
    }
  )

  readonly EmbeddedDiagram: LikeC4.EmbeddedDiagram<ViewId> = forwardRef((props, ref) => {
    return <EmbeddedDiagram ref={ref} views={this.views} {...props} />
  })

  readonly DiagramBrowser: LikeC4.DiagramBrowser<ViewId> = props => {
    return <DiagramsBrowser views={this.views} {...props} />
  }

  static create<V extends T.DiagramViews>(views: V) {
    if (Object.keys(views).length === 0) {
      throw new Error('LikeC4: views must not be empty')
    }
    return new LikeC4(views)
  }
}
