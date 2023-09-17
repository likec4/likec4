import { useWindowSize } from '@react-hookz/web/esm'
import { Diagram, DiagramStateProvider, useViewId, isViewId } from './likec4'
import { useHoveredNode } from '../src/diagram/state'

export const DevAppToolbar = () => {
  const [hoveredNode] = useHoveredNode()
  return <div className='dev-app-toolbar'>{hoveredNode && <h1>Hovered: {hoveredNode.title}</h1>}</div>
}

export default function DevApp() {
  const viewport = useWindowSize()
  const [viewId, setViewId] = useViewId({
    initialViewId: 'index'
  })

  // const diagram = LikeC4Views[viewId]

  return (
    <DiagramStateProvider>
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
        onEdgeClick={() => {
          console.log('onEdgeClick')
        }}
        onStageContextMenu={(_stage, e) => {
          console.log('onStageContextMenu', _stage)
          e.evt.preventDefault()
        }}
        onNodeContextMenu={(node, e) => {
          console.log('onNodeContextMenu', node)
          e.evt.preventDefault()
        }}
      />
      <DevAppToolbar />
    </DiagramStateProvider>
  )
}
