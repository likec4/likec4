import type { DiagramNode } from '@likec4/core'
import type { DiagramApi } from '@likec4/diagrams/src/index';
import { Diagram } from '@likec4/diagrams/src/index'
import { useCallback, useRef, useState } from 'react'
import type { LikeC4ViewId } from './likec4.generated'
import { LikeC4ViewsData, isLikeC4ViewId } from './likec4.generated'
import useTilg from 'tilg'

// function from https://stackoverflow.com/a/15832662/512042
function downloadURI(uri: string, name: string) {
  const link = document.createElement('a')
  link.download = name;
  link.href = uri;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function App() {

  const apiRef = useRef(null as unknown as DiagramApi)
  const [viewId, setViewId] = useState<LikeC4ViewId>('index')

  const onNodeClick = useCallback((node: DiagramNode) => {
    const { navigateTo } = node
    if (isLikeC4ViewId(navigateTo)) {
      setViewId(navigateTo)
    }
  }, [])

  apiRef.current


  useTilg()`viewId = ${viewId}`


  return <Diagram
    ref={apiRef}
    diagram={LikeC4ViewsData[viewId]}
    onNodeClick={onNodeClick}
    width={window.innerWidth}
    height={window.innerHeight}
    padding={40}
    // onStageClick={() => {
    //   const uri = apiRef.current.toDataURL({
    //     pixelRatio: 2,
    //     mimeType: 'image/png',
    //   })
    //   downloadURI(uri, 'diagram.png')
    // }}
  // onNodeClick={onNodeClick}
  // padding={40}
  />
}

export default App
