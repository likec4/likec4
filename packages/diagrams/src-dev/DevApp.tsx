import { useWindowSize } from '@react-hookz/web/esm'
import { Diagram, useViewId, isViewId } from './likec4'

export default function DevApp() {
  const viewport = useWindowSize()
  const [viewId, setViewId] = useViewId({
    initialViewId: 'index'
  })

  // const diagram = LikeC4Views[viewId]

  return (
    <Diagram
      className='dev-app'
      viewId={viewId}
      width={viewport.width}
      height={viewport.height}
      padding={32}
      onNodeClick={({ navigateTo }) => {
        if (isViewId(navigateTo)) {
          setViewId(navigateTo)
        }
      }}
      onStageContextMenu={(_stage, e) => {
        e.evt.preventDefault()
      }}
      // onNodeContextMenu={(node, e) => {
      //   e.evt.preventDefault()
      // }}
    />
  )
}
