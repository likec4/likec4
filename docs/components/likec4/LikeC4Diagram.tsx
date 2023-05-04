import type { EmbeddedDiagramProps } from '@likec4/diagrams'
import { EmbeddedDiagram, Diagram } from '@likec4/diagrams'
import type Konva from 'konva'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './LikeC4Diagram.module.scss'
import type { LikeC4ViewId } from './generated'
import { LikeC4ViewsData, isLikeC4ViewId } from './generated'
import {
  disableBodyScroll,
  enableBodyScroll
} from "body-scroll-lock-upgrade"
import { useMeasure } from '@react-hookz/web/esm'
import { cn } from '$/lib'


export type LikeC4DiagramProps = Omit<EmbeddedDiagramProps<LikeC4ViewsData, LikeC4ViewId>, 'views' | 'onNodeClick' | 'onStageClick' | 'onEdgeClick'>

type DiagramsBrowserProps = {
  viewId: LikeC4ViewId
  initialPosition: {
    x: number
    y: number
    scale: number
  }
  onClose: () => void
}

function DiagramsBrowser({
  initialPosition,
  onClose,
  ...props
}: DiagramsBrowserProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const [measures, containerRef] = useMeasure<HTMLDivElement>()
  const [viewId, setViewId] = useState<LikeC4ViewId>(props.viewId)

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

  const diagram = LikeC4ViewsData[viewId]

  return <div className={styles.overlay} ref={overlayRef}>
    <div className={styles.diagram} ref={containerRef}>
      <Diagram
        diagram={diagram}
        width={measures?.width ?? window.innerWidth}
        height={measures?.height ?? window.innerHeight}
        initialStagePosition={initialPosition}
        padding={10}
        onNodeClick={({ navigateTo }) => {
          if (isLikeC4ViewId(navigateTo)) {
            setViewId(navigateTo)
          }
        }}
        onStageClick={() => onClose()}
      />
    </div>
    <div className={styles.diagramTitle}>
      <h2 className={cn(
        'p-4',
        'text-lg font-medium tracking-tight',
        'text-slate-900 dark:text-slate-100'
      )}>{diagram.title}</h2>
    </div>
  </div>
}

export default function LikeC4Diagram(props: LikeC4DiagramProps) {
  const [browserInitialPosition, setBrowserInitialPosition] = useState<DiagramsBrowserProps['initialPosition'] | null>(null)

  const isOpened = browserInitialPosition !== null

  const openBrowser = (s: Konva.Stage) => {
    const rect = s.container().getBoundingClientRect()
    setBrowserInitialPosition({
      x: Math.ceil(rect.left + (rect.width / 2)),
      y: Math.ceil(rect.top + (rect.height / 2)),
      scale: s.scaleX(),
    })
  }

  return <div className={styles.container}>
    <EmbeddedDiagram
      views={LikeC4ViewsData}
      className={styles.embedded}
      onStageClick={openBrowser}
      {...props}
    />
    {isOpened && createPortal(
      <DiagramsBrowser
        viewId={props.viewId}
        initialPosition={browserInitialPosition}
        onClose={() => setBrowserInitialPosition(null)}
      />,
      document.body,
      'LikeC4DiagramsBrowser'
    )}
  </div>
}
