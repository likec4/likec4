import { Diagram, type DiagramPaddings } from '@likec4/diagrams/src/diagram'
import { useMeasure, type Measures } from '@react-hookz/web/esm'
import {
  disableBodyScroll,
  enableBodyScroll
} from "body-scroll-lock-upgrade"
import { useEffect, useId, useMemo } from 'react'
import { setDiagramFromViewId, updateFile, useDiagramStore, useFilesStore, useViewsStore } from './data'
import { MonacoEditor } from './editor'
import styles from './playground.module.scss'

const PlaygroundDiagram = ({ sidebarWidth, container }: { sidebarWidth: number, container: Measures }) => {
  const padding = useMemo((): DiagramPaddings => [20, 20, 20, sidebarWidth + 20], [sidebarWidth])
  const { viewId, diagram  } = useDiagramStore()
  const isReady = useViewsStore(s => s.ready)

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
        <h1>{viewId ? viewId +' not ready' : 'No view selected'}</h1>
      )}
    </div>
  }

  return <Diagram
    className={styles.diagram}
    diagram={diagram}
    width={container.width}
    height={container.height}
    padding={padding}
    onNodeClick={({ navigateTo }) => {
      if (navigateTo) {
        setDiagramFromViewId(navigateTo)
      }
    }}
  />
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
    {sideBarMeasures && containerMeasures && <PlaygroundDiagram sidebarWidth={sideBarMeasures.width} container={containerMeasures}/>}
    <div ref={sidebarRef} className={styles.sidebar}>
      <MonacoEditor
        currentFile={current}
        initiateFiles={() => useFilesStore.getState().files}
        onChange={value => updateFile(current, value)}
      />
    </div>
  </div>
}
