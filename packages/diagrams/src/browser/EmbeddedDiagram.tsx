/* eslint-disable @typescript-eslint/no-explicit-any */
import { invariant } from '@likec4/core'
import type Konva from 'konva'
import type { HTMLAttributes, PropsWithoutRef, RefAttributes } from 'react'
import { forwardRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { DiagramViews, DiagramApi, DiagramPaddings, KonvaPointerEvent } from '../diagram/types'
import { ResponsiveDiagram } from '../responsive'
import { DiagramsBrowser, type DiagramsBrowserProps } from './DiagramsBrowser'

export interface EmbeddedDiagramProps<Views extends DiagramViews, Id = keyof Views & string>
  extends HTMLAttributes<HTMLDivElement>,
    RefAttributes<DiagramApi> {
  /**
   * Defined views
   */
  views: Views

  /**
   * View to display
   */
  viewId: Id

  /**
   * If true, the diagram will be animated when nodes are added or removed
   * @default false
   */
  animate?: boolean

  /**
   * By default, when diagram is clicked, the browser is opened.
   * You can disable this behavior by setting this prop to true.
   * @default false
   */
  noBrowser?: boolean | undefined

  /**
   * The padding inside the diagram canvas
   */
  padding?: DiagramPaddings | undefined
}

const EmbeddedPadding = [20, 20, 20, 20] satisfies DiagramPaddings

export const EmbeddedDiagram = /* @__PURE__ */ forwardRef<
  DiagramApi,
  PropsWithoutRef<EmbeddedDiagramProps<DiagramViews>>
>(({ animate = false, views, viewId, padding, noBrowser = false, ...props }, ref) => {
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

  const onNodeEdgeClick = (_node: any, e: KonvaPointerEvent) => {
    const stage = e.target.getStage()
    if (stage) {
      e.cancelBubble = true
      openBrowser(stage)
    }
  }

  const enableBrowseClicks = !noBrowser && !isOpened

  return (
    <div {...props}>
      <ResponsiveDiagram
        ref={ref}
        animate={animate}
        zoomable={false}
        pannable={false}
        diagram={diagram}
        padding={padding ?? EmbeddedPadding}
        {...(enableBrowseClicks && {
          onStageClick: openBrowser,
          onEdgeClick: onNodeEdgeClick,
          onNodeClick: onNodeEdgeClick
        })}
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
