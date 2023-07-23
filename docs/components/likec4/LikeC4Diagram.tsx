import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './LikeC4Diagram.module.css'
import {
  EmbeddedDiagram,
  Diagram,
  type EmbeddedDiagramProps,
  type DiagramView
} from '@likec4/diagrams'
import type Konva from 'konva'
import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock-upgrade'
import { useMeasure } from '@react-hookz/web/esm'
import { cn } from '$/lib'

type ViewsRecord = Record<string, DiagramView>

export type LikeC4DiagramProps<Views extends ViewsRecord = ViewsRecord> = Omit<
  EmbeddedDiagramProps<Views>,
  'onNodeClick' | 'onStageClick' | 'onEdgeClick'
>

type DiagramsBrowserProps<Views extends ViewsRecord = ViewsRecord> = LikeC4DiagramProps<Views> & {
  initialPosition: {
    x: number
    y: number
    scale: number
  }
  onClose: () => void
}

const DiagramPadding = 20

function DiagramsBrowser<Props extends DiagramsBrowserProps>({
  initialPosition,
  views,
  onClose,
  ...props
}: Props) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [measures, containerRef] = useMeasure<HTMLDivElement>()
  const [viewId, setViewId] = useState(props.viewId)

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

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const diagram = views[viewId]!

  return (
    <div className={styles.overlay} ref={overlayRef}>
      <div className={styles.diagram} ref={containerRef}>
        <Diagram
          diagram={diagram}
          width={measures?.width ?? window.innerWidth}
          height={measures?.height ?? window.innerHeight}
          initialStagePosition={initialPosition}
          padding={DiagramPadding}
          onNodeClick={({ navigateTo }) => {
            if (navigateTo && navigateTo in views) {
              setViewId(navigateTo)
            }
          }}
          onStageClick={() => onClose()}
        />
      </div>
      <div className={styles.diagramTitle}>
        <h2
          className={cn(
            'p-4',
            'text-lg font-medium tracking-tight',
            'text-slate-900 dark:text-slate-100'
          )}
        >
          {diagram.title}
        </h2>
      </div>
    </div>
  )
}

export function LikeC4Diagram<Props extends LikeC4DiagramProps>({
  viewId,
  views,
  ...props
}: Props) {
  const [browserInitialPosition, setBrowserInitialPosition] = useState<
    DiagramsBrowserProps['initialPosition'] | null
  >(null)

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
    <div className={styles.container}>
      <EmbeddedDiagram
        className={styles.embedded}
        onStageClick={openBrowser}
        views={views}
        viewId={viewId}
        {...props}
      />
      {isOpened &&
        createPortal(
          <DiagramsBrowser
            views={views}
            viewId={viewId}
            initialPosition={browserInitialPosition}
            onClose={() => setBrowserInitialPosition(null)}
          />,
          document.body,
          'LikeC4DiagramsBrowser'
        )}
    </div>
  )
}
