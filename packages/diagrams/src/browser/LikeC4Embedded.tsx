/* eslint-disable @typescript-eslint/no-explicit-any */
import { invariant } from '@likec4/core'
import type Konva from 'konva'
import type { PropsWithoutRef, RefAttributes } from 'react'
import { forwardRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DiagramViews, DiagramApi, DiagramPaddings } from '../diagram/types'
import { ResponsiveDiagram } from '../responsive'
import { LikeC4Browser, type LikeC4BrowserProps } from './LikeC4Browser'

export interface LikeC4EmbeddedProps<Views extends DiagramViews, Id = keyof Views & string>
  extends React.HTMLAttributes<HTMLDivElement>,
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

const LikeC4EmbeddedPadding = [0, 0, 0, 0] satisfies DiagramPaddings

export const LikeC4Embedded = /* @__PURE__ */ forwardRef<
  DiagramApi,
  PropsWithoutRef<LikeC4EmbeddedProps<DiagramViews>>
>(({ views, viewId, padding, enableBrowser = true, ...props }, ref) => {
  const diagram = views[viewId]
  invariant(diagram, `View "${viewId}" not found in views`)

  const [browserInitialPosition, setBrowserInitialPosition] = useState<NonNullable<
    LikeC4BrowserProps<any>['initialPosition']
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
        padding={padding ?? LikeC4EmbeddedPadding}
        onStageClick={enableBrowser ? openBrowser : undefined}
      />
      {isOpened &&
        createPortal(
          <LikeC4Browser
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
}) as <Views extends DiagramViews>(props: LikeC4EmbeddedProps<Views>) => JSX.Element
