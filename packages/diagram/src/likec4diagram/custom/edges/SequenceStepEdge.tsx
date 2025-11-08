import { getSmoothStepPath } from '@xyflow/system'
import { EdgeActionButton, EdgeContainer, EdgeLabel, EdgeLabelContainer, EdgePath } from '../../../base-primitives'
import { useEnabledFeatures } from '../../../context/DiagramFeatures'
import { useDiagram } from '../../../hooks/useDiagram'
import type { Types } from '../../types'

const LABEL_OFFSET = 16
export function SequenceStepEdge(props: Types.EdgeProps<'seq-step'>) {
  const { enableNavigateTo } = useEnabledFeatures()
  const diagram = useDiagram()
  const { navigateTo } = props.data
  const isSelfLoop = props.source === props.target
  const isBack = props.sourceX > props.targetX
  const [path] = getSmoothStepPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
    ...(isSelfLoop && {
      offset: 30,
      borderRadius: 16,
    }),
  })

  let labelX = props.sourceX
  switch (true) {
    case isSelfLoop:
      labelX = props.sourceX + 24 + LABEL_OFFSET
      break
    case isBack:
      labelX = props.sourceX - LABEL_OFFSET
      break
    default:
      labelX = props.sourceX + LABEL_OFFSET
      break
  }

  return (
    <EdgeContainer {...props}>
      <EdgePath
        edgeProps={props}
        svgPath={path}
      />
      <EdgeLabelContainer
        edgeProps={props}
        labelPosition={{
          x: labelX,
          y: props.sourceY + (!isSelfLoop ? LABEL_OFFSET : 0),
          translate: isBack ? 'translate(-100%, 0)' : undefined,
        }}
      >
        <EdgeLabel edgeProps={props}>
          {enableNavigateTo && navigateTo && (
            <EdgeActionButton
              onClick={e => {
                e.stopPropagation()
                diagram.navigateTo(navigateTo)
              }} />
          )}
        </EdgeLabel>
      </EdgeLabelContainer>
    </EdgeContainer>
  )
}
