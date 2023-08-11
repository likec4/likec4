/* eslint-disable @typescript-eslint/no-explicit-any */
import { invariant } from '@likec4/core'
import type Konva from 'konva'
import type { HTMLAttributes, PropsWithoutRef, RefAttributes } from 'react'
import { forwardRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DiagramViews, DiagramApi, DiagramPaddings } from '../diagram/types'
import { ResponsiveDiagram } from '../responsive'
import { DiagramsBrowser, type DiagramsBrowserProps } from './DiagramsBrowser'

export interface EmbeddedDiagramProps<Views extends DiagramViews, Id = keyof Views & string>
  extends HTMLAttributes<HTMLDivElement>,
    RefAttributes<DiagramApi> {
  views: Views

  viewId: Id

  /**
   * Open browser on click
   * @default true
   */
  enableBrowser?: boolean | undefined

  /**
   * The padding inside the diagram canvas
   */
  padding?: DiagramPaddings | undefined
}

const EmbeddedPadding = [0, 0, 0, 0] satisfies DiagramPaddings

export const EmbeddedDiagram = /* @__PURE__ */ forwardRef<
  DiagramApi,
  PropsWithoutRef<EmbeddedDiagramProps<DiagramViews>>
>(({ views, viewId, padding, enableBrowser = true, ...props }, ref) => {
  const diagram = views[viewId]
  invariant(diagram, `View "${viewId}" not found in views`)

  const [browserInitialPosition, setBrowserInitialPosition] = useState<NonNullable<
    DiagramsBrowserProps<any>['initialPosition']
  > | null>(null)

  const isOpened = browserInitialPosition !== null

  const openBrowser = (s: Konva.Stage) => {
    const rect = s.container().getBoundingClientRect(),
      // (x,y) of EmbeddedDiagram (without offset)
      embeddedX = s.x() - s.offsetX(),
      embeddedY = s.y() - s.offsetY(),
      offset = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2
      }
    setBrowserInitialPosition({
      x: Math.ceil(embeddedX + rect.x + offset.x),
      y: Math.ceil(embeddedY + rect.y + offset.y),
      scale: s.scaleX()
    })
  }

  return (
    <div {...props}>
      <ResponsiveDiagram
        ref={ref}
        zoomable={false}
        pannable={false}
        diagram={diagram}
        padding={padding ?? EmbeddedPadding}
        onStageClick={enableBrowser ? openBrowser : undefined}
      />
      {isOpened &&
        createPortal(
          <DiagramsBrowser
            views={views}
            initialViewId={viewId}
            initialPosition={browserInitialPosition}
            onClose={() => setBrowserInitialPosition(null)}
          />,
          document.body,
          'LikeC4Browser'
        )}
    </div>
  )
}) as <Views extends DiagramViews>(props: EmbeddedDiagramProps<Views>) => JSX.Element
