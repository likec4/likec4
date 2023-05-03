import MonacoEditor from './editor/monaco'
import { Diagram, type DiagramPaddings } from '@likec4/diagrams'
import { useMeasure, type Measures } from '@react-hookz/web/esm'
import {
  disableBodyScroll,
  enableBodyScroll
} from "body-scroll-lock-upgrade"
import { useEffect, useId, useMemo, useRef } from 'react'
import { revealInEditor, setDiagramFromViewId, updateFile, useDiagramStore, useFilesStore, useViewsStore } from './data'
import styles from './playground.module.scss'
import clsx from 'clsx'

const PlaygroundDiagram = ({ sidebarWidth, container }: { sidebarWidth: number, container: Measures }) => {
  const padding = useMemo((): DiagramPaddings => [20, 20, 20, sidebarWidth + 20], [sidebarWidth])
  const { viewId, diagram } = useDiagramStore()
  const isReady = useViewsStore(s => s.ready)

  const isFirstRenderRef = useRef(true)

  const diagramId = diagram?.id ?? null

  useEffect(() => {
    if (isFirstRenderRef.current && diagramId) {
      isFirstRenderRef.current = false
      revealInEditor({ view: diagramId })
      return
    }
  }, [diagramId])

  if (!diagram) {
    return <div className={styles.diagram}
      style={{
        padding: '2rem',
        paddingLeft: `calc(2rem + ${sidebarWidth}px)`
      }}
    >
      {!isReady && (
        <h1>Parsing...</h1>
      )}
      {isReady && (
        <h1>{viewId ? `View "${viewId}" is not parsed or not found` : 'Select view to preview'}</h1>
      )}
    </div>
  }

  return <>
    <Diagram
      className={styles.diagram}
      diagram={diagram}
      width={container.width}
      height={container.height}
      padding={padding}
      onNodeClick={({ id, navigateTo }) => {
        if (navigateTo && navigateTo !== viewId) {
          setDiagramFromViewId(navigateTo)
          revealInEditor({ view: navigateTo })
          return
        }
        revealInEditor({ element: id })
      }}
      onEdgeClick={({ relations }) => {
        const relation = relations[0]
        if (relation) {
          revealInEditor({ relation })
          return
        }
      }}
    />
    <div
      className={styles.diagramtitle}
      style={{
        paddingLeft: sidebarWidth + 20
      }}
    >
      <h3
        className={clsx(
          "nx-mt-2 nx-mb-0",
          ' nx-text-xs nx-text-gray-500 dark:nx-text-gray-400'
        )}
        onClick={e => {
          e.stopPropagation()
          revealInEditor({ view: diagram.id })
        }}
      >
        id: {diagram.id}
      </h3>
      <h2
        className={clsx(
          "nx-mt-0 nx-mb-2",
          'nx-text-md nx-font-medium nx-tracking-tight',
          'nx-text-slate-900 dark:nx-text-slate-100'
        )}
      >{diagram.title}</h2>
    </div>
  </>
}

export default function Playground() {
  const id = useId()
  const [containerMeasures, containerRef] = useMeasure<HTMLDivElement>()
  const [sideBarMeasures, sidebarRef] = useMeasure<HTMLDivElement>()

  const current = useFilesStore(s => s.current)

  useEffect(() => {
    const target = document.getElementById(id)
    if (!target) {
      return
    }
    disableBodyScroll(target)
    return () => {
      enableBodyScroll(target)
    }
  }, [id])

  return <div id={id} ref={containerRef} className={styles.playground}>
    {sideBarMeasures && containerMeasures && <PlaygroundDiagram sidebarWidth={sideBarMeasures.width} container={containerMeasures} />}
    <div ref={sidebarRef} className={styles.sidebar}>
      <MonacoEditor
        currentFile={current}
        initiateFiles={() => useFilesStore.getState().files}
        onChange={value => updateFile(current, value)}
      />
    </div>
  </div>
}
