import type { NodeId } from '@likec4/core'
import { CompoundActionButton } from '../../../base/primitives'
import type { NodeProps } from '../../../base/types'
import { useEnabledFeature } from '../../../context'
import { useDiagram } from '../../hooks/useDiagram'
import type { Types } from '../../types'

type CompoundActionsProps = NodeProps<Types.CompoundElementNodeData | Types.CompoundDeploymentNodeData>

export const CompoundActions = (props: CompoundActionsProps) => {
  const { enableNavigateTo } = useEnabledFeature('NavigateTo')
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
