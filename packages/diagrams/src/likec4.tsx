import type { ExoticComponent, FunctionComponent, RefAttributes } from 'react'
import { forwardRef } from 'react'
import { Diagram } from './diagram'
import { FullscreenDiagramBrowser, EmbeddedDiagram } from './components'
import type { FullscreenDiagramBrowserProps, EmbeddedDiagramProps } from './components'

import { ResponsiveDiagram, FullscreenDiagram } from './components/primitives'
import type { ResponsiveDiagramProps, FullscreenDiagramProps } from './components/primitives'
import type * as Types from './diagram/types'
import { useViewId as useGenericViewId } from './hooks/useViewId'

// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace LikeC4 {
  export type DiagramProps<Id extends string> = Omit<Types.DiagramProps, 'diagram'> &
    RefAttributes<Types.DiagramApi> & {
      viewId: Id
    }
  /**
   * @deprecated use DiagramProps instead
   */
  export type Props<Id extends string> = DiagramProps<Id>

  export type ResponsiveProps<Id extends string> = Omit<ResponsiveDiagramProps, 'diagram'> &
    RefAttributes<Types.DiagramApi> & {
      viewId: Id
    }

  export type FullscreenProps<Id extends string> = Omit<FullscreenDiagramProps, 'diagram'> & {
    viewId: Id
  }

  export type EmbeddedProps<Id extends string> = Omit<EmbeddedDiagramProps<Id>, 'views'>

  export type BrowserProps<Id extends string> = Omit<FullscreenDiagramBrowserProps<Id>, 'views'>

  export interface Diagram<Id extends string> extends ExoticComponent<DiagramProps<Id>> {}

  export interface Responsive<Id extends string> extends ExoticComponent<ResponsiveProps<Id>> {}

  export interface Fullscreen<Id extends string> extends FunctionComponent<FullscreenProps<Id>> {}

  export interface Embedded<Id extends string> extends ExoticComponent<EmbeddedProps<Id>> {}

  export interface Browser<Id extends string> extends FunctionComponent<BrowserProps<Id>> {}
}

export class LikeC4<ViewId extends string, Views extends Types.DiagramViews<ViewId>> {
  protected constructor(private views: Views) {}

  readonly isViewId = (value: unknown): value is ViewId => {
    return (
      value != null &&
      typeof value === 'string' &&
      Object.prototype.hasOwnProperty.call(this.views, value)
    )
  }

  readonly useViewId = (initialViewId: ViewId) =>
    useGenericViewId({ initialViewId, isViewId: this.isViewId })

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

  readonly Fullscreen: LikeC4.Fullscreen<ViewId> = ({ viewId, ...props }) => {
    const diagram = this.views[viewId]
    if (!diagram) {
      throw new Error(`View "${viewId}" not found in views`)
    }
    return <FullscreenDiagram diagram={diagram} {...props} />
  }

  readonly Embedded: LikeC4.Embedded<ViewId> = forwardRef((props, ref) => {
    return <EmbeddedDiagram ref={ref} views={this.views} {...props} />
  })

  readonly Browser: LikeC4.Browser<ViewId> = props => {
    return <FullscreenDiagramBrowser views={this.views} {...props} />
  }

  static create<
    ViewId extends string,
    V extends Types.DiagramViews<ViewId> = Types.DiagramViews<ViewId>
  >(views: V) {
    if (Object.keys(views).length === 0) {
      throw new Error('LikeC4: views must not be empty')
    }
    return new LikeC4<ViewId, V>(views)
  }
}
