import type { DiagramNode } from '@likec4/diagrams'
import { Diagram } from '@likec4/diagrams'
import { useCallback, useState } from 'react'
import type { ViewId } from './likec4'
import { LikeC4ViewsData, isViewId } from './likec4'

function App() {

  const [viewId, setViewId] = useState<ViewId>('apiApp')

  const onNodeClick = useCallback((node: DiagramNode) => {
    const { navigateTo } = node
    if (isViewId(navigateTo)) {
      setViewId(navigateTo)
    }
  }, [])

  return <div className="diagram-container">
    <Diagram
      diagram={LikeC4ViewsData[viewId]}
      width={window.innerWidth}
      height={window.innerHeight}
      onNodeClick={onNodeClick}
    />
  </div>
}

export default App
