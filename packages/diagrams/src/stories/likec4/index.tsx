import { useStoryViewport } from '@/ladle/components'
import type { Story } from '@ladle/react'
import { keys } from 'rambdax'
import { DiagramStateProvider } from '../../diagram/state'
import { LikeC4 } from '../../likec4'
import type { LikeC4ViewId } from './likec4.generated'
import { LikeC4Views } from './likec4.generated'

export const { isViewId, useViewId, Diagram, Responsive, Fullscreen, Embedded, Browser } =
  LikeC4.create<LikeC4ViewId>(LikeC4Views)

export const LikeC4ViewIds = keys(LikeC4Views)

export * from './likec4.generated'

type Props = {
  viewId: LikeC4ViewId
}
export const LikeC4ViewStory: Story<Props> = ({ viewId }: Props) => {
  const measures = useStoryViewport()
  return (
    <DiagramStateProvider>
      <Diagram
        className='dev-app'
        viewId={viewId}
        width={measures.width}
        height={measures.height}
        pannable={false}
        zoomable={false}
      />
    </DiagramStateProvider>
  )
}
