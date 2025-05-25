import type { NodeId } from '@likec4/core'
import { CompoundActionButton } from '../../../base/primitives'
import type { NodeProps } from '../../../base/types'
import { useEnabledFeatures } from '../../../context/DiagramFeatures'
import { useDiagram } from '../../../hooks/useDiagram'
import type { Types } from '../../types'

type CompoundActionsProps = NodeProps<Types.CompoundElementNodeData | Types.CompoundDeploymentNodeData>

export const CompoundActions = (props: CompoundActionsProps) => {
  const { enableNavigateTo } = useEnabledFeatures()
  const diagram = useDiagram()

  const { navigateTo } = props.data
  if (navigateTo && enableNavigateTo) {
    return (
      <CompoundActionButton
        onClick={(e) => {
          e.stopPropagation()
          diagram.navigateTo(navigateTo, props.id as NodeId)
        }}
        {...props}
      />
    )
  }
  return null
}
