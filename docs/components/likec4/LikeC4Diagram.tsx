import type { EmbeddedDiagramProps } from '@likec4/diagrams'
import { EmbeddedDiagram, FlexDiagram } from '@likec4/diagrams'
import type Konva from 'konva'
import { useEffect, useRef, useState } from 'react'
import clsx from 'clsx'
import { createPortal } from 'react-dom'
import styles from './LikeC4Diagram.module.scss'
import type { LikeC4ViewId } from './generated'
import { LikeC4ViewsData, isLikeC4ViewId } from './generated'
import {
  disableBodyScroll,
  enableBodyScroll
} from "body-scroll-lock-upgrade"


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
    <FlexDiagram
      diagram={diagram}
      initialStagePosition={initialPosition}
      padding={30}
      onNodeClick={({ navigateTo }) => {
        if (isLikeC4ViewId(navigateTo)) {
          setViewId(navigateTo)
        }
      }}
      onStageClick={() => onClose()}
    />
    <div className={styles.diagramTitle}>
      <h2 className={clsx(
        'nx-p-4',
        'nx-text-lg nx-font-bold nx-tracking-tight',
        'nx-text-slate-900 dark:nx-text-slate-100'
      )}>{diagram.title}</h2>
    </div>
  </div>
}

export default function LikeC4Diagram(props: LikeC4DiagramProps) {
  const [browserInitialPosition, setBrowserInitialPosition] = useState<DiagramsBrowserProps['initialPosition'] | null>(null)

  const isOpened = browserInitialPosition !== null

  const openBrowser = (s: Konva.Stage) => {
    const rect = s.getClientRect({
      skipTransform: true,
    })
    const position = s._getContentPosition()
    setBrowserInitialPosition({
      x: Math.floor(position.left + rect.x),
      y: Math.floor(position.top + rect.y),
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
