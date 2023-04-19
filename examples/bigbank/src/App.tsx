import type { DiagramNode } from '@likec4/diagrams'
import { Diagram } from '@likec4/diagrams/src/diagram/Diagram'
import { useCallback, useState } from 'react'
import type { ViewId } from './likec4.data'
import { LikeC4ViewsData, isViewId } from './likec4.data'
import useTilg from 'tilg'

function App() {
  const [viewId, setViewId] = useState<ViewId>('ibs')

  const onNodeClick = useCallback((node: DiagramNode) => {
    const { navigateTo } = node
    if (isViewId(navigateTo)) {
      setViewId(navigateTo)
    }
  }, [])


  useTilg()`viewId = ${viewId}`


  return <div className="diagram-container">
    <Diagram
      diagram={LikeC4ViewsData[viewId]}
      width={window.innerWidth}
      height={window.innerHeight}
      onNodeClick={onNodeClick}
      padding={40}
    />
  </div>
}

export default App
