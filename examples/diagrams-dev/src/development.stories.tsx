import '@mantine/core/styles.css'
import '@xyflow/react/dist/style.css'

import { action, ActionType, type Story, type StoryDefault, useLadleContext } from '@ladle/react'
import { LikeC4Diagram as LikeC4ViewEditor } from '@likec4/diagram'
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
    zoomable: true,
    onNodeClick: true,
    onEdgeClick: true
  },
  argTypes: {
    viewId: {
      defaultValue: 'index',
      options: LikeC4ViewIds,
      control: {
        type: 'select'
      }
    },
    onNodeClick: {
      control: { type: 'boolean' }
    },
    onEdgeClick: {
      control: { type: 'boolean' }
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
  onNodeClick?: boolean
  onEdgeClick?: boolean
}

export const DiagramDevelopment: Story<Props> = ({
  viewId,
  onNodeClick = true,
  onEdgeClick = true,
  ...props
}) => {
  const measures = useStoryViewport()
  const {
    dispatch,
    globalState: { control: controlState }
  } = useLadleContext()
  const diagram = LikeC4Views[viewId]
  return (
    <DiagramStateProvider>
      <Diagram
        className="dev-app"
        diagram={diagram}
        {...props}
        width={measures.width}
        height={measures.height}
        onNodeClick={onNodeClick
          ? (node, event) => {
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
          }
          : undefined}
        onEdgeClick={onEdgeClick ? (edge, event) => action('onEdgeClick')({ edge, event }) : undefined}
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

export const LikeC4ViewEditorStory: Story<Props> = ({
  viewId,
  onNodeClick = true,
  // onEdgeClick = true,
  ...props
}) => {
  const {
    dispatch,
    globalState: { control: controlState }
  } = useLadleContext()
  const diagram = LikeC4Views[viewId]

  return (
    <LikeC4ViewEditor
      view={diagram}
      zoomable={props.zoomable}
      pannable={props.pannable}
      onNavigateTo={onNodeClick
        ? ({ element, event, xynode }) => {
          dispatch({
            type: ActionType.UpdateControl,
            value: {
              ...controlState,
              viewId: {
                ...controlState['viewId'],
                value: element.navigateTo
              }
            }
          })
          action('onNavigateTo')({
            element,
            xynode,
            event
          })
        }
        : undefined}
    />
  )
}
LikeC4ViewEditorStory.storyName = 'Diagram Editor'

export const ThemeColors: Story<Props> = props => {
  return <DiagramDevelopment {...props} />
}
ThemeColors.args = {
  viewId: 'themecolors'
}

export const RelationshipColors: Story<Props> = props => {
  return <DiagramDevelopment {...props} />
}
RelationshipColors.args = {
  viewId: 'relationshipcolors'
}
