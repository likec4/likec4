import type { NodeId } from '@likec4/core'
import { useTransition } from 'react'
import { CompoundActionButton } from '../../base/primitives'
import type { NodeProps } from '../../base/types'
import { useEnabledFeature } from '../../context'
import { useDiagramActor } from '../hooks'
import type { Types } from '../types'

type CompoundActionsProps = NodeProps<Types.CompoundElementNodeData>

export const CompoundActions = (props: CompoundActionsProps) => {
  const { enableNavigateTo } = useEnabledFeature('NavigateTo')
  const { send } = useDiagramActor()
  const [, startTransition] = useTransition()

  const { navigateTo } = props.data
  if (navigateTo && enableNavigateTo) {
    return (
      <CompoundActionButton
        onClick={(e) => {
          e.stopPropagation()
          startTransition(() => {
            send({ type: 'navigateTo', viewId: navigateTo, fromNode: props.id as NodeId })
          })
        }}
        {...props}
      />
    )
  }
  return null
}
