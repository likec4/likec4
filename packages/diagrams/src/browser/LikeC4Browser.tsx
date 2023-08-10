import { invariant } from '@likec4/core'
import { useKeyboardEvent, useMeasure, useSyncedRef } from '@react-hookz/web/esm'
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock-upgrade'
import type { ReactElement, ReactNode } from 'react'
import { is } from 'rambdax'
import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Diagram } from '../diagram/Diagram'
import type { DiagramViews, DiagramNode, DiagramPaddings, DiagramView } from '../diagram/types'
import { CloseButton } from './CloseButton'
import { LikeC4BrowserTitle } from './LikeC4BrowserTitle'

// prettier-ignore
export interface LikeC4BrowserProps<
  Views extends DiagramViews,
  Id = keyof Views & string
> extends React.HTMLAttributes<HTMLDivElement> {

  // views: Views | (() => PromiseLike<Views>)
  views: Views

  initialViewId: Id

  /**
   * The padding inside the diagram canvas
   */
  padding?: DiagramPaddings | undefined

  /**
   * The style for the diagram canvas
   */
  styleDiagram?: CSSProperties | undefined

  renderViewTitle?: ((view: DiagramView) => ReactNode) | string | ReactElement | null

  /**
   * Internal use
   * When render to React portal
   */
  initialPosition?: {
    x: number
    y: number
    scale: number
  } | undefined,

  onClose?: (() => void) | undefined
}

const LikeC4BrowserPadding = [20, 20, 20, 20] satisfies DiagramPaddings

const StyleOverlay = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'var(--likec4-browser-overlay-bg, rgba(18,18,18,0.8))',
  backdropFilter: 'var(--likec4-browser-backdrop, blur(4px))',
  zIndex: 'var(--likec4-overlay-z-index, 100)',
  display: 'flex',
  placeContent: 'strech',
  placeItems: 'strech',
  touchAction: 'pan-x pan-y pinch-zoom',
  boxSizing: 'border-box',
  margin: 0,
  padding: 0,
  border: '0 solid transparent'
} satisfies CSSProperties

const StyleContainer = {
  margin: 0,
  padding: 0,
  flex: '1 1 100%',
  overflow: 'hidden'
} satisfies CSSProperties

function processRenderViewTitle(
  renderViewTitle: LikeC4BrowserProps<DiagramViews>['renderViewTitle'],
  view: DiagramView
) {
  if (renderViewTitle === undefined) {
    return <LikeC4BrowserTitle>{view.title}</LikeC4BrowserTitle>
  }
  if (renderViewTitle === null) {
    return null
  }
  let title: ReactNode = null
  if (is(Function, renderViewTitle)) {
    title = renderViewTitle(view)
  }
  if (title !== null && typeof title === 'string') {
    title = <LikeC4BrowserTitle>{title}</LikeC4BrowserTitle>
  }
  return title
}

export function LikeC4Browser<Views extends DiagramViews>({
  views: _views,
  initialViewId,
  initialPosition,
  padding,
  style,
  styleDiagram,
  renderViewTitle,
  onClose,
  ...props
}: LikeC4BrowserProps<Views>) {
  type ViewId = keyof Views & string

  const views = useSyncedRef(_views)

  const overlayRef = useRef<HTMLDivElement>(null)
  const [measures, containerRef] = useMeasure<HTMLDivElement>()
  const [viewId, setViewId] = useState<ViewId>(initialViewId)

  const diagram = _views[viewId]
  invariant(diagram, `View "${viewId}" not found in views`)

  useEffect(() => {
    const target = overlayRef.current
    if (!target) {
      return
    }
    disableBodyScroll(target)
    return () => {
      enableBodyScroll(target)
    }
  }, [])

  // Close on ESC
  useKeyboardEvent(
    'Escape',
    () => {
      onClose?.()
    },
    [],
    { eventOptions: { passive: true } }
  )

  const onNodeClick = useCallback(
    (node: DiagramNode) => {
      if (node.navigateTo && node.navigateTo in views.current) {
        setViewId(node.navigateTo)
      }
    },
    [views]
  )

  return (
    <div
      ref={overlayRef}
      style={{
        ...StyleOverlay,
        ...style
      }}
      {...props}
    >
      <div
        ref={containerRef}
        style={{
          ...StyleContainer
        }}
      >
        {measures && (
          <Diagram
            animate
            pannable
            zoomable
            diagram={diagram}
            width={measures.width}
            height={measures.height}
            initialPosition={initialPosition}
            padding={padding ?? LikeC4BrowserPadding}
            style={styleDiagram}
            onNodeClick={onNodeClick}
          />
        )}
      </div>
      {processRenderViewTitle(renderViewTitle, diagram)}
      {onClose && <CloseButton onClick={() => onClose()} />}
    </div>
  )
}
