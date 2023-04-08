import { Diagram, DiagramNode } from '@likec4/diagrams'
import { useCallback, useRef, useState } from 'react'
import { LikeC4ViewData, isViewId, type ViewId } from './likec4'
import { useMeasure } from '@react-hookz/web/esm'
import { equals } from 'rambdax'

function App() {
  const [viewId, setViewId] = useState<ViewId>('index')

  const onNavigate = useCallback((viewid: string) => {
    if (isViewId(viewid)) {
      setViewId(viewid)
    }
  }, [setViewId])

  // const onNodeClick = useCallback((node: DiagramNode) => {
  //   if (isViewId(node.navigateTo)) {
  //     setViewId(node.navigateTo)
  //   }
  // }, [])

  const view = LikeC4ViewData[viewId]
  const [measures, diagramContainerRef] = useMeasure<HTMLDivElement>()

  return <div ref={diagramContainerRef} className="diagram-container">
    <Diagram
      diagram={view}
      width={measures?.width}
      height={measures?.height}
      padding={40}
      onNavigate={onNavigate}
    />
  </div>
}

export default App
