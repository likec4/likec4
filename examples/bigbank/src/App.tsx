import { Diagram } from '@likec4/diagrams'
import { useCallback, useState } from 'react'
import { LikeC4ViewData, isViewId, type ViewId } from './likec4'

function App() {
  const [viewId, setViewId] = useState<ViewId>('index')

  const onNavigate = useCallback((viewid: string) => {
    if (isViewId(viewid)) {
      setViewId(viewid)
    }
  }, [setViewId])

  return <Diagram
    diagram={LikeC4ViewData[viewId]}
    width={window.innerWidth}
    height={window.innerHeight}
    onNavigate={onNavigate}
    padding={40}
  />
}

export default App
