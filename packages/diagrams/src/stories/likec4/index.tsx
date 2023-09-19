import { keys } from 'rambdax'
import { LikeC4 } from '../../likec4'
import { LikeC4Views } from './likec4.generated'
import type { LikeC4ViewId } from './likec4.generated'
import type { Story } from '@ladle/react'
import { ModeState, useLadleContext } from '@ladle/react'
import { useMeasure } from '@react-hookz/web/esm'
import { DiagramStateProvider } from '../../diagram/state'

export const { isViewId, useViewId, Diagram, Responsive, Fullscreen, Embedded, Browser } =
  LikeC4.create<LikeC4ViewId>(LikeC4Views)

export const LikeC4ViewIds = keys(LikeC4Views)

export * from './likec4.generated'

type Props = {
  viewId: LikeC4ViewId
}
export const LikeC4ViewStory: Story<Props> = ({ viewId }: Props) => {
  const {
    globalState: { mode, width: ladleWidth }
  } = useLadleContext()
  const isFullScreen = mode === ModeState.Preview || ladleWidth !== 0
  const [measures, measuresRef] = useMeasure<HTMLDivElement>()
  return (
    <div
      ref={measuresRef}
      style={
        isFullScreen
          ? { position: 'fixed', inset: 0 }
          : {
              width: '100%',
              minHeight: '100%',
              position: 'relative'
            }
      }
    >
      {measures && (
        <DiagramStateProvider>
          <Diagram className='dev-app' viewId={viewId} width={measures.width} height={measures.height} />
        </DiagramStateProvider>
      )}
    </div>
  )
}
