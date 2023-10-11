import { Diagram, DiagramStateProvider } from '@likec4/diagrams'
import { useStoryViewport } from '../../.ladle/components'
import type { LikeC4ViewId } from './index'
import { useLikeC4View } from './index'

type Props = {
  viewId: LikeC4ViewId
  animate?: boolean
  pannable?: boolean
  zoomable?: boolean
}
export default function LikeC4ViewStory({
  viewId,
  animate = true,
  pannable = true,
  zoomable = true
}: Props) {
  const measures = useStoryViewport()
  const diagram = useLikeC4View(viewId)
  return (
    <DiagramStateProvider>
      <Diagram
        className='dev-app'
        diagram={diagram}
        width={measures.width}
        height={measures.height}
        padding={0}
        animate={animate}
        pannable={pannable}
        zoomable={zoomable}
      />
    </DiagramStateProvider>
  )
}
