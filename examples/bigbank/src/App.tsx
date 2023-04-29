import type { DiagramNode } from '@likec4/diagrams'
import { Diagram } from '@likec4/diagrams/src/diagram/Diagram'
import { useCallback, useState } from 'react'
import type { LikeC4ViewId } from './likec4.data'
import { LikeC4ViewsData, isLikeC4ViewId } from './likec4.data'
import useTilg from 'tilg'

function App() {
  const [viewId, setViewId] = useState<LikeC4ViewId>('ibs')

  const onNodeClick = useCallback((node: DiagramNode) => {
    const { navigateTo } = node
    if (isLikeC4ViewId(navigateTo)) {
      setViewId(navigateTo)
    }
  }, [])


  useTilg()`viewId = ${viewId}`


  return <Diagram
      diagram={LikeC4ViewsData[viewId]}
      onNodeClick={onNodeClick}
      width={window.innerWidth}
      height={window.innerHeight}
      padding={40}

    // onNodeClick={onNodeClick}
    // padding={40}
    />
}

export default App
