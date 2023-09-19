import { ActionType, ModeState, useLadleContext, type Story, type StoryDefault, action } from '@ladle/react'
import { useMeasure } from '@react-hookz/web/esm'
import { DiagramStateProvider } from '../diagram/state'
import type { LikeC4ViewId } from './likec4'
import { Diagram, LikeC4ViewIds, isViewId } from './likec4'

export default {
  args: {
    viewId: 'index',
    pannable: true,
    zoomable: true
  },
  argTypes: {
    viewId: {
      defaultValue: 'index',
      options: LikeC4ViewIds,
      control: {
        type: 'select'
      }
    },
    pannable: {
      control: { type: 'boolean' }
    }
  }
} as StoryDefault<Props>

type Props = {
  viewId: LikeC4ViewId
  pannable?: boolean
  zoomable?: boolean
}

export const DiagramDevelopment: Story<Props> = ({ viewId, ...props }) => {
  const {
    globalState: { mode, width: ladleWidth, control: controlState },
    dispatch
  } = useLadleContext()
  // const [viewId, setViewId] = useViewId(
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
          <Diagram
            className='dev-app'
            viewId={viewId}
            {...props}
            width={measures.width}
            height={measures.height}
            onNodeClick={({ navigateTo }) => {
              if (isViewId(navigateTo)) {
                dispatch({
                  type: ActionType.UpdateControl,
                  value: {
                    ...controlState,
                    viewId: {
                      ...controlState['viewId'],
                      value: navigateTo
                    }
                  }
                })
              }
            }}
            onEdgeClick={action('onEdgeClick')}
            onStageContextMenu={(_stage, e) => {
              console.log('onStageContextMenu', _stage)
              e.evt.preventDefault()
            }}
            onNodeContextMenu={(node, e) => {
              console.log('onNodeContextMenu', node)
              e.evt.preventDefault()
            }}
          />
        </DiagramStateProvider>
      )}
    </div>
  )
}
DiagramDevelopment.storyName = 'Diagram'

export const ColorsDevelopment = DiagramDevelopment.bind({})
ColorsDevelopment.storyName = 'Colors'
ColorsDevelopment.args = {
  viewId: 'themecolors'
}
