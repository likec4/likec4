import { ActionType, action, useLadleContext, type Story, type StoryDefault } from '@ladle/react'
import { Diagram, DiagramStateProvider } from '@likec4/diagrams'
import { useStoryViewport } from '../.ladle/components'
import type { LikeC4ViewId } from './likec4'
import { LikeC4ViewIds, LikeC4Views } from './likec4'

export default {
  args: {
    viewId: 'index',
    padding: 16,
    animate: true,
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
    },
    animate: {
      control: { type: 'boolean' }
    },
    zoomable: {
      control: { type: 'boolean' }
    },
    padding: {
      control: { type: 'number' }
    }
  }
} as StoryDefault<Props>

type Props = {
  viewId: LikeC4ViewId
  animate?: boolean
  padding?: number
  pannable?: boolean
  zoomable?: boolean
}

export const DiagramDevelopment: Story<Props> = ({ viewId, ...props }) => {
  const measures = useStoryViewport()
  const {
    dispatch,
    globalState: { control: controlState }
  } = useLadleContext()
  const diagram = LikeC4Views[viewId]
  return (
    <DiagramStateProvider>
      <Diagram
        className='dev-app'
        diagram={diagram}
        {...props}
        width={measures.width}
        height={measures.height}
        onNodeClick={(node, event) => {
          if (node.navigateTo) {
            dispatch({
              type: ActionType.UpdateControl,
              value: {
                ...controlState,
                viewId: {
                  ...controlState['viewId'],
                  value: node.navigateTo
                }
              }
            })
          }
          action('onNodeClick')({
            node,
            event
          })
        }}
        onEdgeClick={(edge, event) => action('onEdgeClick')({ edge, event })}
        onStageClick={(stage, event) => action('onStageClick')({ stage, event })}
        onStageContextMenu={(stage, event) => {
          event.evt.preventDefault()
          action('onStageContextMenu')({ stage, event })
        }}
        onNodeContextMenu={(node, event) => {
          event.evt.preventDefault()
          action('onNodeContextMenu')({ node, event })
        }}
      />
    </DiagramStateProvider>
  )
}
DiagramDevelopment.storyName = 'Diagram'

export const ThemeColors: Story<Props> = props => {
  return <DiagramDevelopment {...props} />
}
ThemeColors.args = {
  viewId: 'themecolors'
}
