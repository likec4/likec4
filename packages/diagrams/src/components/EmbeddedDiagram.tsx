/* eslint-disable @typescript-eslint/no-explicit-any */
import { invariant } from '@likec4/core'
import type Konva from 'konva'
import type { HTMLAttributes, PropsWithoutRef, ReactNode, RefAttributes } from 'react'
import { forwardRef, useCallback, useState } from 'react'
import type {
  DiagramApi,
  DiagramInitialPosition,
  DiagramPaddings,
  KonvaPointerEvent
} from '../diagram/types'
import { ResponsiveDiagram } from './primitives'
import { FullscreenDiagramBrowser } from './FullscreenDiagramBrowser'
import type { DiagramDiscloseProps, DiagramViewsProps } from './types'

interface DiagramDiscloseRenderProps<ViewId extends string> extends DiagramDiscloseProps<ViewId> {
  onClose: () => void
}

interface DiagramDiscloseRender<ViewId extends string> {
  (props: DiagramDiscloseRenderProps<ViewId>): ReactNode
}

export interface EmbeddedDiagramProps<ViewId extends string>
  extends DiagramViewsProps<ViewId>,
    Omit<HTMLAttributes<HTMLDivElement>, 'children'>,
    RefAttributes<DiagramApi> {
  /**
   * If true, the diagram will be animated when nodes are added or removed
   * @default false
   */
  animate?: boolean | undefined

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

  renderDisclose?: DiagramDiscloseRender<ViewId> | undefined
}

const EmbeddedPadding = [20, 20, 20, 20] satisfies DiagramPaddings

const defaultRenderDisclose: DiagramDiscloseRender<string> = ({
  views,
  viewId,
  initialPosition,
  onClose
}) => (
  <FullscreenDiagramBrowser
    views={views}
    initialViewId={viewId}
    initialPosition={initialPosition}
    onClose={onClose}
  />
)

export const EmbeddedDiagram = /* @__PURE__ */ forwardRef<
  DiagramApi,
  PropsWithoutRef<EmbeddedDiagramProps<string>>
>(
  (
    {
      animate = false,
      views,
      viewId,
      padding,
      noBrowser = false,
      renderDisclose = defaultRenderDisclose,
      ...props
    },
    ref
  ) => {
    const diagram = views[viewId]
    invariant(diagram, `View "${viewId}" not found in views`)

    const [initialPosition, setBrowserInitialPosition] = useState<DiagramInitialPosition | null>(
      null
    )

    const isOpened = initialPosition !== null

    const openBrowser = (s: Konva.Stage) => {
      const rect = s.container().getBoundingClientRect(),
        scale = s.scaleX(),
        // (x,y) of EmbeddedDiagram (without offset)
        embeddedX = s.x() - s.offsetX(),
        embeddedY = s.y() - s.offsetY(),
        offset = {
          x: window.innerWidth / 2,
          y: window.innerHeight / 2
        }
      setBrowserInitialPosition({
        x: Math.ceil(embeddedX + rect.x * scale + offset.x),
        y: Math.ceil(embeddedY + rect.y * scale + offset.y),
        scale
      })
    }

    const onNodeEdgeClick = (_node: any, e: KonvaPointerEvent) => {
      const stage = e.target.getStage()
      if (stage) {
        e.cancelBubble = true
        openBrowser(stage)
      }
    }

    const onClose = useCallback(() => setBrowserInitialPosition(null), [])

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
        {isOpened && renderDisclose({ views, viewId, initialPosition, onClose })}
      </div>
    )
  }
) as <ViewId extends string>(props: EmbeddedDiagramProps<ViewId>) => JSX.Element
