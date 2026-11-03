import { css } from '@likec4/styles/css'
import { Tooltip } from '@mantine/core'
import {
  EdgeActionButton,
  EdgeContainer,
  EdgeLabel,
  EdgeLabelContainer,
  EdgePath,
  memoEdge,
} from '../../../base-primitives'
import { useEnabledFeatures } from '../../../context'
import { useDiagram } from '../../../hooks/useDiagram'
import { edgePathThroughLabel } from '../../../utils/edge-path-through-label'
import type { RelationshipsBrowserTypes } from '../_types'
import { useRelationshipsBrowser } from '../hooks'

export const RelationshipEdge = memoEdge<RelationshipsBrowserTypes.EdgeProps>((props) => {
  const browser = useRelationshipsBrowser()
  const { enableNavigateTo } = useEnabledFeatures()
  const {
    data: {
      navigateTo,
      relations,
      existsInCurrentView,
      labelBBox,
    },
  } = props
  // the label is placed by the layout, the edge goes through it
  const [svgPath, labelPosition] = edgePathThroughLabel(props, labelBBox)
  const diagram = useDiagram()

  const markOrange = relations.length > 1 || !existsInCurrentView

  const edgeProps = markOrange
    ? {
      ...props,
      data: {
        ...props.data,
        color: 'amber',
      } satisfies RelationshipsBrowserTypes.EdgeData,
    }
    : props

  let label = (
    <EdgeLabel
      edgeProps={edgeProps}
      className={css({
        transition: 'fast',
      })}
    >
      {enableNavigateTo && navigateTo && (
        <EdgeActionButton
          {...props}
          onClick={e => {
            e.stopPropagation()
            diagram.navigateTo(navigateTo)
          }} />
      )}
    </EdgeLabel>
  )

  if (!existsInCurrentView) {
    label = (
      <Tooltip
        color="orange"
        c={'black'}
        label="This relationship is not included in the current view"
        // withinPortal={false}
        portalProps={{
          target: `#${browser.rootElementId}`,
        }}
        openDelay={800}
      >
        {label}
      </Tooltip>
    )
  }

  return (
    <EdgeContainer {...edgeProps}>
      <EdgePath
        edgeProps={edgeProps}
        svgPath={svgPath}
        {...markOrange && {
          strokeWidth: 5,
        }}
      />
      <EdgeLabelContainer
        edgeProps={edgeProps}
        labelPosition={labelPosition}
        {...!labelBBox && {
          style: {
            maxWidth: Math.min(Math.abs(props.targetX - props.sourceX - 70), 250),
          },
        }}
      >
        {label}
      </EdgeLabelContainer>
    </EdgeContainer>
  )
})
