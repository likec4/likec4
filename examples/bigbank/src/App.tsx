import type { DiagramNode } from '@likec4/diagrams'
import { EmbeddedDiagram } from '@likec4/diagrams/src/embedded/EmbeddedDiagram'
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


  return <section>
    <EmbeddedDiagram
      views={LikeC4ViewsData}
      viewId={viewId}
      onNodeClick={onNodeClick}
    // diagram={LikeC4ViewsData[viewId]}
    // width={window.innerWidth}
    // height={window.innerHeight}
    // onNodeClick={onNodeClick}
    // padding={40}
    />
  </section>
}

export default App
